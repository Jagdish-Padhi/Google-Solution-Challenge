import Asset from '../models/asset.model.js';
import { enrichAssetFingerprint } from './assets.service.js';
import { createAlertFromViolation } from './alerts.service.js';
import ScanJob from '../models/scanJob.model.js';
import ScanResult from '../models/scanResult.model.js';
import Violation from '../models/violation.model.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const GOOGLE_TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';
const MULTI_LANGUAGE_TARGETS = ['es', 'ar', 'hi', 'pt', 'fr'];

function getSourceDomain(sourceUrl) {
	if (!sourceUrl) {
		return null;
	}

	try {
		return new URL(sourceUrl).hostname.toLowerCase();
	} catch {
		return null;
	}
}

function scoreDiscoveryQuality(result) {
	let score = 0;

	if (result.pageTitle) {
		score += 25;
	}

	if (result.thumbnailUrl) {
		score += 25;
	}

	if (result.videoUrl) {
		score += 20;
	}

	if (result.sourceUrl) {
		score += 20;
	}

	if (result.platform) {
		score += 10;
	}

	return Math.max(0, Math.min(100, score));
}

function scorePersistence({ domainPriorViolations, urlSeenCount }) {
	const domainScore = Math.min(40, Number(domainPriorViolations || 0) * 8);
	const urlScore = Math.min(60, Math.max(0, Number(urlSeenCount || 0) - 1) * 15);
	return Math.max(0, Math.min(100, domainScore + urlScore));
}

async function requestScan(payload) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 28000); // 28s timeout

	try {
		const response = await fetch(`${ML_SERVICE_URL}/ml/scan`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
			signal: controller.signal,
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			const contentType = response.headers.get('content-type');
			if (contentType && contentType.includes('text/html')) {
				throw new Error(`ML scan service is currently unavailable (${response.status}).`);
			}
			const errorText = await response.text();
			throw new Error(`ML scan request failed (${response.status}): ${errorText.slice(0, 100)}`);
		}

		return response.json();
	} catch (error) {
		clearTimeout(timeoutId);
		if (error.name === 'AbortError') {
			throw new Error('ML scan request timed out after 28s');
		}
		throw error;
	}
}

async function requestTranslations({ keyword, targetLanguage, apiKey }) {
	const response = await fetch(`${GOOGLE_TRANSLATE_API_URL}?key=${apiKey}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			q: keyword,
			target: targetLanguage,
			format: 'text',
			source: 'en',
		}),
	});

	if (!response.ok) {
		return null;
	}

	const payload = await response.json();
	const translated = payload?.data?.translations?.[0]?.translatedText;
	return typeof translated === 'string' ? translated.trim() : null;
}

async function expandKeywordsForMultiLanguage(keywords = [], enabled = false) {
	const normalized = keywords.map((item) => String(item || '').trim()).filter(Boolean);
	if (!enabled || normalized.length === 0) {
		return normalized;
	}

	const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY?.trim();
	if (!apiKey) {
		return normalized;
	}

	const expanded = [...normalized];
	const seen = new Set(expanded.map((item) => item.toLowerCase()));

	for (const keyword of normalized) {
		for (const language of MULTI_LANGUAGE_TARGETS) {
			try {
				const translated = await requestTranslations({ keyword, targetLanguage: language, apiKey });
				if (!translated) {
					continue;
				}

				const lowered = translated.toLowerCase();
				if (seen.has(lowered)) {
					continue;
				}

				seen.add(lowered);
				expanded.push(translated);
			} catch {
				// Ignore translation failures and continue with available keywords.
			}
		}
	}

	return expanded;
}

async function requestMatch(payload) {
	const response = await fetch(`${ML_SERVICE_URL}/ml/match`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		const contentType = response.headers.get('content-type');
		if (contentType && contentType.includes('text/html')) {
			throw new Error(`ML matching engine is currently unavailable (${response.status}).`);
		}
		const errorText = await response.text();
		throw new Error(`ML match request failed (${response.status}): ${errorText.slice(0, 100)}`);
	}

	return response.json();
}

async function requestVisionVerify({ referenceUrl, candidateUrl, baseConfidence }) {
	const response = await fetch(`${ML_SERVICE_URL}/ml/vision-verify`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			referenceUrl,
			candidateUrl,
			baseConfidence,
		}),
	});

	if (!response.ok) {
		const contentType = response.headers.get('content-type');
		if (contentType && contentType.includes('text/html')) {
			throw new Error(`ML vision engine is currently unavailable (${response.status}).`);
		}
		const errorText = await response.text();
		throw new Error(`ML vision verify request failed (${response.status}): ${errorText.slice(0, 100)}`);
	}

	return response.json();
}

async function runMatchingForScan({ scanJob, results }) {
	let asset = await Asset.findById(scanJob.assetId).lean();

	if (asset && !asset?.fingerprint?.pHash && asset.gcsUrl) {
		await enrichAssetFingerprint({
			assetId: asset._id.toString(),
			sourceUrl: asset.gcsUrl,
		});
		asset = await Asset.findById(scanJob.assetId).lean();
	}

	if (!asset?.fingerprint?.pHash || results.length === 0) {
		if (results.length > 0) {
			await ScanResult.updateMany(
				{ scanJobId: scanJob._id },
				{
					$set: {
						status: 'no_match',
						matchConfidence: 0,
						matchType: null,
					},
				},
			);
		}
		return 0;
	}

	let violationsCount = 0;
	const totalResults = results.length;
	for (let i = 0; i < totalResults; i++) {
		const scanResult = results[i];
		// Update progress from 40% to 95% during matching
		const currentProgress = Math.floor(40 + ((i + 1) / totalResults) * 55);
		await ScanJob.findByIdAndUpdate(scanJob._id, { progress: currentProgress });

		const compareUrl = scanResult.thumbnailUrl || scanResult.videoUrl || scanResult.sourceUrl;
		const sourceDomain = getSourceDomain(scanResult.sourceUrl);

		if (!compareUrl) {
			await ScanResult.findByIdAndUpdate(scanResult._id, {
				status: 'no_match',
				matchConfidence: 0,
				matchType: null,
				sourceDomain,
				discoveryQualityScore: scoreDiscoveryQuality(scanResult),
			});
			continue;
		}

		try {
			const match = await requestMatch({
				scrapedUrl: compareUrl,
				referenceFingerprint: asset.fingerprint,
			});

			let confidence = Number(match.matchConfidence || 0);
			let visionEvidence = null;

			if (confidence >= 40 && confidence < 70 && asset?.gcsUrl && compareUrl) {
				try {
					const vision = await requestVisionVerify({
						referenceUrl: asset.gcsUrl,
						candidateUrl: compareUrl,
						baseConfidence: confidence,
					});

					visionEvidence = {
						available: Boolean(vision.available),
						labelOverlap: Array.isArray(vision.labelOverlap) ? vision.labelOverlap : [],
						labelOverlapScore: Number(vision.labelOverlapScore || 0),
						confidenceBoost: Number(vision.confidenceBoost || 0),
					};

					if (typeof vision.boostedConfidence === 'number') {
						confidence = Number(vision.boostedConfidence);
					}
				} catch {
					visionEvidence = {
						available: false,
						labelOverlap: [],
						labelOverlapScore: 0,
						confidenceBoost: 0,
					};
				}
			}

			const matchedStatus = confidence >= 30 ? 'matched' : 'no_match';

			const [domainPriorViolations, priorUrlViolation] = await Promise.all([
				sourceDomain
					? Violation.countDocuments({
						orgId: scanJob.orgId,
						sourceDomain,
						detectedAt: {
							$gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
						},
					})
					: 0,
				Violation.findOne({
					orgId: scanJob.orgId,
					assetId: scanJob.assetId,
					sourceUrl: scanResult.sourceUrl,
				})
					.sort({ detectedAt: 1 })
					.lean(),
			]);

			const urlSeenCount = Math.max(1, Number(priorUrlViolation?.sourceSeenCount || 0) + 1);
			const sourceFirstSeenAt =
				priorUrlViolation?.sourceFirstSeenAt || priorUrlViolation?.detectedAt || new Date();
			const sourceLastSeenAt = new Date();
			const persistentScore = scorePersistence({ domainPriorViolations, urlSeenCount });

			await ScanResult.findByIdAndUpdate(scanResult._id, {
				status: matchedStatus,
				matchConfidence: confidence,
				matchType: match.matchType || null,
				sourceDomain,
				discoveryQualityScore: scoreDiscoveryQuality(scanResult),
				evidenceBundle: {
					hammingDistance: match.evidenceBundle?.hammingDistance ?? null,
					colorSimilarity: match.evidenceBundle?.colorSimilarity ?? null,
					frameMatchCount: match.evidenceBundle?.frameMatchCount ?? null,
					visionLabelOverlapScore: visionEvidence?.labelOverlapScore ?? null,
					visionConfidenceBoost: visionEvidence?.confidenceBoost ?? null,
					visionLabels: visionEvidence?.labelOverlap ?? [],
				},
				persistenceSignals: {
					domainPriorViolations,
					urlSeenCount,
					persistentScore,
					firstSeenAt: sourceFirstSeenAt,
					lastSeenAt: sourceLastSeenAt,
				},
			});

			if (confidence > 70) {
				violationsCount += 1;
				const violation = await Violation.create({
					orgId: scanJob.orgId,
					assetId: scanJob.assetId,
					scanJobId: scanJob._id,
					sourceUrl: scanResult.sourceUrl,
					sourceDomain,
					sourceFirstSeenAt,
					sourceLastSeenAt,
					sourceSeenCount: urlSeenCount,
					repeatOffenderScore: persistentScore,
					platform: scanResult.platform,
					discoveryKeyword: scanResult.discoveryKeyword,
					screenshotUrl: scanResult.thumbnailUrl || null,
					matchConfidence: confidence,
					matchType: match.matchType || 'partial',
					status: 'open',
					evidenceBundle: {
						hammingDistance: match.evidenceBundle?.hammingDistance ?? null,
						colorSimilarity: match.evidenceBundle?.colorSimilarity ?? null,
						frameMatchCount: match.evidenceBundle?.frameMatchCount ?? null,
						visionLabelOverlapScore: visionEvidence?.labelOverlapScore ?? null,
						visionConfidenceBoost: visionEvidence?.confidenceBoost ?? null,
						visionLabels: visionEvidence?.labelOverlap ?? [],
					},
					detectedAt: new Date(),
				});

				await createAlertFromViolation({
					orgId: scanJob.orgId,
					violationId: violation._id,
					platform: scanResult.platform,
					matchConfidence: confidence,
					sourceUrl: scanResult.sourceUrl,
				});
			}
		} catch (error) {
			console.error(`Matching failed for result ${scanResult._id}:`, error);
			await ScanResult.findByIdAndUpdate(scanResult._id, {
				status: 'no_match',
				matchConfidence: 0,
				matchType: null,
				sourceDomain,
				discoveryQualityScore: scoreDiscoveryQuality(scanResult),
			});
		}
	}

	if (violationsCount > 0) {
		await Asset.findByIdAndUpdate(scanJob.assetId, {
			$inc: { violationsFound: violationsCount },
		});
	}

	return violationsCount;
}

export async function createScanJob({ orgId, assetId, keywords, platforms, multiLanguage = false }) {
	const asset = await Asset.findOne({ _id: assetId, orgId, status: { $ne: 'deleted' } }).lean();

	if (!asset) {
		const error = new Error('Asset not found for this organization.');
		error.statusCode = 404;
		throw error;
	}

	const expandedKeywords = await expandKeywordsForMultiLanguage(keywords, multiLanguage);

	return ScanJob.create({
		orgId,
		assetId,
		status: 'queued',
		platforms,
		keywords: expandedKeywords,
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
		scanJob.progress = 10; // Started
		scanJob.startedAt = new Date();
		scanJob.lastError = null;
		await scanJob.save();

		let scanResponse;
		try {
			scanResponse = await requestScan({
				scanJobId: scanJob._id.toString(),
				assetId: scanJob.assetId.toString(),
				keywords: scanJob.keywords,
				platforms: scanJob.platforms,
			});
		} catch (error) {
			// Specific handling for 502/timeout jargon
			let cleanMessage = error.message;
			if (error.message.includes('502')) {
				cleanMessage = 'ML service is temporarily overloaded. Retrying might help.';
			} else if (error.message.includes('timed out')) {
				cleanMessage = 'Discovery phase took too long. Please try again.';
			}
			throw new Error(cleanMessage);
		}

		scanJob.progress = 40; // Scraping complete
		await scanJob.save();

		const results = Array.isArray(scanResponse.results) ? scanResponse.results : [];

		if (results.length > 0) {
			await ScanResult.deleteMany({ scanJobId: scanJob._id });

			await ScanResult.insertMany(
				results.map((result) => ({
					scanJobId: scanJob._id,
					orgId: scanJob.orgId,
					assetId: scanJob.assetId,
					sourceUrl: result.sourceUrl,
					sourceDomain: getSourceDomain(result.sourceUrl),
					platform: result.platform,
					thumbnailUrl: result.thumbnailUrl || null,
					videoUrl: result.videoUrl || null,
					pageTitle: result.pageTitle || null,
					discoveryKeyword: result.keyword || null,
					discoveryQualityScore: scoreDiscoveryQuality(result),
					scrapedAt: result.scrapedAt ? new Date(result.scrapedAt) : new Date(),
					status: result.status || 'pending_match',
				})),
			);
		}

		const persistedResults = await ScanResult.find({ scanJobId: scanJob._id }).lean();
		const violationsCount = await runMatchingForScan({ scanJob, results: persistedResults });

		scanJob.status = 'completed';
		scanJob.progress = 100;
		scanJob.resultsCount = results.length;
		scanJob.violationsCount = violationsCount;
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

export async function listScanJobsByOrg({ orgId, page = 1, limit = 10, status = '', platform = '' }) {
	const skip = (page - 1) * limit;
	const query = { orgId };

	if (status) {
		query.status = status;
	}

	if (platform) {
		query.platforms = platform;
	}

	const [items, total] = await Promise.all([
		ScanJob.find(query)
			.populate('assetId', 'title')
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		ScanJob.countDocuments(query),
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
	return ScanJob.findOne({ _id: scanJobId, orgId }).populate('assetId', 'title').lean();
}

export async function retryScanJob({ orgId, scanJobId }) {
	const scanJob = await ScanJob.findOne({ _id: scanJobId, orgId });

	if (!scanJob) {
		const error = new Error('Scan job not found.');
		error.statusCode = 404;
		throw error;
	}

	if (scanJob.status === 'running' || scanJob.status === 'queued') {
		const error = new Error('Scan job is already queued or running.');
		error.statusCode = 409;
		throw error;
	}

	await ScanResult.deleteMany({ scanJobId: scanJob._id });

	scanJob.status = 'queued';
	scanJob.resultsCount = 0;
	scanJob.violationsCount = 0;
	scanJob.startedAt = null;
	scanJob.completedAt = null;
	scanJob.lastError = null;
	await scanJob.save();

	return scanJob;
}

export async function listScanResultsByJob({ orgId, scanJobId, page = 1, limit = 20, status = '', platform = '' }) {
	const scanJob = await ScanJob.findOne({ _id: scanJobId, orgId }).lean();

	if (!scanJob) {
		const error = new Error('Scan job not found.');
		error.statusCode = 404;
		throw error;
	}

	const skip = (page - 1) * limit;
	const query = { scanJobId, orgId };

	if (status) {
		query.status = status;
	}

	if (platform) {
		query.platform = platform;
	}

	const [items, total] = await Promise.all([
		ScanResult.find(query)
			.sort({ scrapedAt: -1, createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		ScanResult.countDocuments(query),
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

export async function createScheduledScanJobsForOrg(orgId) {
	const assets = await Asset.find({ orgId, status: 'active' }).select('_id orgId title').lean();

	const jobs = [];
	for (const asset of assets) {
		const scanJob = await createScanJob({
			orgId: asset.orgId,
			assetId: asset._id,
			keywords: [asset.title],
			platforms: ['youtube', 'web'],
		});

		jobs.push(scanJob);
		void dispatchScanJob(scanJob._id.toString());
	}

	return jobs;
}

export async function getAssetsForScheduledScans() {
	return Asset.find({ status: 'active' }).select('_id orgId title').lean();
}