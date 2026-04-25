import Asset from '../models/asset.model.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

async function requestFingerprint(sourceUrl) {
	const response = await fetch(`${ML_SERVICE_URL}/ml/fingerprint`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ sourceUrl }),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Fingerprint service failed (${response.status}): ${errorText}`);
	}

	return response.json();
}

async function requestSuggestedKeywords({ title, assetType, sourceUrl, count = 10 }) {
	const response = await fetch(`${ML_SERVICE_URL}/ml/suggest-keywords`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			title,
			assetType,
			sourceUrl,
			count,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Keyword suggestion service failed (${response.status}): ${errorText}`);
	}

	return response.json();
}

export function inferAssetType(mimeType = '') {
	if (mimeType.startsWith('image/')) {
		return 'image';
	}

	if (mimeType.startsWith('video/')) {
		return 'video';
	}

	return 'highlight';
}

export async function createAsset({ orgId, title, file, publicUrl }) {
	const asset = await Asset.create({
		orgId,
		title,
		type: inferAssetType(file.mimetype),
		storageKey: file.filename,
		gcsUrl: publicUrl,
		thumbnailUrl: null,
		fileSize: file.size,
		status: 'processing',
		uploadedAt: new Date(),
	});

	return asset;
}

export async function enrichAssetFingerprint({ assetId, sourceUrl }) {
	try {
		const fingerprint = await requestFingerprint(sourceUrl);

		await Asset.findByIdAndUpdate(assetId, {
			fingerprint: {
				pHash: fingerprint.pHash || null,
				videoHash: fingerprint.videoHash || null,
				colorHistogram: fingerprint.colorHistogram || [],
				frameHashes: fingerprint.frameHashes || [],
			},
			status: 'active',
		});
	} catch (error) {
		console.error('[ASSET_FINGERPRINT_ERROR]', error.message);
	}
}

export async function listAssetsByOrg({ orgId, page = 1, limit = 12 }) {
	const skip = (page - 1) * limit;

	const [items, total] = await Promise.all([
		Asset.find({ orgId, status: { $ne: 'deleted' } })
			.sort({ uploadedAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		Asset.countDocuments({ orgId, status: { $ne: 'deleted' } }),
	]);

	return {
		items,
		total,
		page,
		limit,
		totalPages: Math.max(1, Math.ceil(total / limit)),
	};
}

export async function getAssetById({ orgId, assetId }) {
	return Asset.findOne({ _id: assetId, orgId, status: { $ne: 'deleted' } }).lean();
}

export async function softDeleteAsset({ orgId, assetId }) {
	const deletedAsset = await Asset.findOneAndUpdate(
		{ _id: assetId, orgId, status: { $ne: 'deleted' } },
		{ status: 'deleted' },
		{ new: true },
	).lean();

	return deletedAsset;
}

export async function suggestKeywordsForAsset({ orgId, assetId, count = 10 }) {
	const asset = await Asset.findOne({ _id: assetId, orgId, status: { $ne: 'deleted' } }).lean();

	if (!asset) {
		const error = new Error('Asset not found for this organization.');
		error.statusCode = 404;
		throw error;
	}

	const suggestion = await requestSuggestedKeywords({
		title: asset.title,
		assetType: asset.type,
		sourceUrl: asset.gcsUrl,
		count,
	});

	return {
		assetId: asset._id.toString(),
		assetTitle: asset.title,
		keywords: suggestion.keywords || [],
		count: suggestion.count || 0,
	};
}

export async function getDashboardAssetStats(orgId) {
	const [totalAssets, activeScans, violationsAgg] = await Promise.all([
		Asset.countDocuments({ orgId, status: { $ne: 'deleted' } }),
		Asset.countDocuments({ orgId, status: 'processing' }),
		Asset.aggregate([
			{ $match: { orgId, status: { $ne: 'deleted' } } },
			{ $group: { _id: null, totalViolations: { $sum: '$violationsFound' } } },
		]),
	]);

	return {
		totalAssets,
		activeScans,
		violations: violationsAgg[0]?.totalViolations || 0,
	};
}