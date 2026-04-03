import Asset from '../models/asset.model.js';
import ScanJob from '../models/scanJob.model.js';
import ScanResult from '../models/scanResult.model.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

async function requestScan(payload) {
	const response = await fetch(`${ML_SERVICE_URL}/ml/scan`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`ML scan request failed (${response.status}): ${errorText}`);
	}

	return response.json();
}

export async function createScanJob({ orgId, assetId, keywords, platforms }) {
	const asset = await Asset.findOne({ _id: assetId, orgId, status: { $ne: 'deleted' } }).lean();

	if (!asset) {
		const error = new Error('Asset not found for this organization.');
		error.statusCode = 404;
		throw error;
	}

	return ScanJob.create({
		orgId,
		assetId,
		status: 'queued',
		platforms,
		keywords,
		resultsCount: 0,
		violationsCount: 0,
	});
}

export async function dispatchScanJob(scanJobId) {
	try {
		const scanJob = await ScanJob.findById(scanJobId);
		if (!scanJob) {
			return;
		}

		scanJob.status = 'running';
		scanJob.startedAt = new Date();
		scanJob.lastError = null;
		await scanJob.save();

		const scanResponse = await requestScan({
			scanJobId: scanJob._id.toString(),
			assetId: scanJob.assetId.toString(),
			keywords: scanJob.keywords,
			platforms: scanJob.platforms,
		});

		const results = Array.isArray(scanResponse.results) ? scanResponse.results : [];

		if (results.length > 0) {
			await ScanResult.deleteMany({ scanJobId: scanJob._id });

			await ScanResult.insertMany(
				results.map((result) => ({
					scanJobId: scanJob._id,
					orgId: scanJob.orgId,
					assetId: scanJob.assetId,
					sourceUrl: result.sourceUrl,
					platform: result.platform,
					thumbnailUrl: result.thumbnailUrl || null,
					videoUrl: result.videoUrl || null,
					pageTitle: result.pageTitle || null,
					scrapedAt: result.scrapedAt ? new Date(result.scrapedAt) : new Date(),
					status: result.status || 'pending_match',
				})),
			);
		}

		scanJob.status = 'completed';
		scanJob.resultsCount = results.length;
		scanJob.violationsCount = Number(scanResponse.violationsCount || 0);
		scanJob.completedAt = new Date();
		await scanJob.save();
	} catch (error) {
		await ScanJob.findByIdAndUpdate(scanJobId, {
			status: 'failed',
			completedAt: new Date(),
			lastError: error.message,
		});
	}
}

export async function listScanJobsByOrg({ orgId, page = 1, limit = 10 }) {
	const skip = (page - 1) * limit;

	const [items, total] = await Promise.all([
		ScanJob.find({ orgId })
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		ScanJob.countDocuments({ orgId }),
	]);

	return {
		items,
		total,
		page,
		limit,
		totalPages: Math.max(1, Math.ceil(total / limit)),
	};
}

export async function getScanJobById({ orgId, scanJobId }) {
	return ScanJob.findOne({ _id: scanJobId, orgId }).lean();
}

export async function listScanResultsByJob({ orgId, scanJobId, page = 1, limit = 20 }) {
	const scanJob = await ScanJob.findOne({ _id: scanJobId, orgId }).lean();

	if (!scanJob) {
		const error = new Error('Scan job not found.');
		error.statusCode = 404;
		throw error;
	}

	const skip = (page - 1) * limit;

	const [items, total] = await Promise.all([
		ScanResult.find({ scanJobId, orgId })
			.sort({ scrapedAt: -1, createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		ScanResult.countDocuments({ scanJobId, orgId }),
	]);

	return {
		items,
		total,
		page,
		limit,
		totalPages: Math.max(1, Math.ceil(total / limit)),
		scanJob,
	};
}

export async function countRunningScans(orgId) {
	return ScanJob.countDocuments({
		orgId,
		status: { $in: ['queued', 'running'] },
	});
}

export async function getAssetsForScheduledScans() {
	return Asset.find({ status: 'active' }).select('_id orgId title').lean();
}