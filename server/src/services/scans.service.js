import Asset from '../models/asset.model.js';
import { enrichAssetFingerprint } from './assets.service.js';
import { createAlertFromViolation } from './alerts.service.js';
import ScanJob from '../models/scanJob.model.js';
import ScanResult from '../models/scanResult.model.js';
import Violation from '../models/violation.model.js';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { getFirestore } from "../config/firebaseAdmin.js";

let firestore = null;
function getFirestoreInstance() {
	if (firestore) return firestore;
	try {
		firestore = getFirestore();
		return firestore;
	} catch (error) {
		console.warn("[FIRESTORE] Live feed integration disabled - Firebase Admin is not configured:", error.message);
		return null;
	}
}
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
		const errorText = await response.text();

		throw new Error(
			`Google Translate API failed (${response.status}): ${errorText}`)
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
			} catch(error){
				console.error(
					"Google Translation failed. Falling back to original text:",
					error.message
				);
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

	if (asset && !asset?.fingerprint?.pHash && asset.storageUrl) {
		await enrichAssetFingerprint({
			assetId: asset._id.toString(),
			sourceUrl: asset.storageUrl,
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
				referenceUrl: asset.thumbnailUrl || asset.storageUrl,
			});

			let confidence = Number(match.matchConfidence || 0);
			let visionEvidence = null;

			if (confidence >= 40 && confidence < 70 && asset?.storageUrl && compareUrl) {
				try {
					const vision = await requestVisionVerify({
						referenceUrl: asset.storageUrl,
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
					isMirrored: Boolean(match.evidenceBundle?.isMirrored),
					orbVerified: Boolean(match.evidenceBundle?.orbVerified),
					visionAvailable: visionEvidence ? Boolean(visionEvidence.available) : null,
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
				
				const isLicensed = asset.licensedDomains?.includes(sourceDomain) || 
								   asset.licensedPartners?.some(p => p.domain === sourceDomain);
				const violationStatus = isLicensed ? 'licensed' : 'open';

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
					status: violationStatus,
					evidenceBundle: {
						hammingDistance: match.evidenceBundle?.hammingDistance ?? null,
						colorSimilarity: match.evidenceBundle?.colorSimilarity ?? null,
						frameMatchCount: match.evidenceBundle?.frameMatchCount ?? null,
						visionLabelOverlapScore: visionEvidence?.labelOverlapScore ?? null,
						visionConfidenceBoost: visionEvidence?.confidenceBoost ?? null,
						visionLabels: visionEvidence?.labelOverlap ?? [],
						isMirrored: Boolean(match.evidenceBundle?.isMirrored),
						orbVerified: Boolean(match.evidenceBundle?.orbVerified),
						visionAvailable: visionEvidence ? Boolean(visionEvidence.available) : null,
					},
					detectedAt: new Date(),
				});

				try {
					const db = getFirestoreInstance();
					if (db) {
						await db
							.collection("live_violations")
							.doc(violation._id.toString())
							.set({
								id: violation._id.toString(),
								orgId: violation.orgId.toString(),
								sourceUrl: violation.sourceUrl,
								platform: violation.platform,
								confidence: violation.matchConfidence,
								status: violation.status,
								detectedAt: violation.detectedAt,
								createdAt: new Date(),
							});
					}
				} catch (error) {
					console.error(
						"[FIRESTORE] Failed to publish violation:",
						error.message
					);
				}

				if (violationStatus !== 'licensed') {
					await createAlertFromViolation({
						orgId: scanJob.orgId,
						violationId: violation._id,
						platform: scanResult.platform,
						matchConfidence: confidence,
						sourceUrl: scanResult.sourceUrl,
					});
				}
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

export async function createScanJob({ orgId, assetId, keywords, platforms, multiLanguage = true }) {
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
		multiLanguage,
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

		const asset = await Asset.findById(scanJob.assetId);
		if (asset?.type === 'livestream') {
			void monitorLiveStream(scanJob, asset);
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

const activeMonitors = new Map();
const livestreamReconnects = new Map();
const livestreamTelemetryStats = new Map();

export async function stopLiveStreamJob({ orgId, scanJobId }) {
	const scanJob = await ScanJob.findOne({ _id: scanJobId, orgId });
	if (!scanJob) {
		const error = new Error('Scan job not found.');
		error.statusCode = 404;
		throw error;
	}

	const jobIdStr = scanJobId.toString();
	const ffmpeg = activeMonitors.get(jobIdStr);
	if (ffmpeg) {
		ffmpeg.kill('SIGKILL');
		activeMonitors.delete(jobIdStr);
	}
	livestreamTelemetryStats.delete(jobIdStr);

	scanJob.status = 'completed';
	scanJob.progress = 100;
	scanJob.completedAt = new Date();
	await scanJob.save();

	return scanJob;
}

function calculateHammingDistance(hex1, hex2) {
	if (!hex1 || !hex2 || hex1.length !== hex2.length) {
		return 999;
	}

	let distance = 0;
	for (let i = 0; i < hex1.length; i++) {
		const val1 = Number.parseInt(hex1[i], 16);
		const val2 = Number.parseInt(hex2[i], 16);
		let xor = val1 ^ val2;
		while (xor > 0) {
			if (xor & 1) distance++;
			xor = xor >> 1;
		}
	}
	return distance;
}

export async function monitorLiveStream(scanJob, asset) {
	const jobIdStr = scanJob._id.toString();
	
	// Initialize reconnect count if not present
	if (!livestreamReconnects.has(jobIdStr)) {
		livestreamReconnects.set(jobIdStr, 0);
	}
	
	const attempt = livestreamReconnects.get(jobIdStr);

	try {
		// Only update status and clear errors on initial launch
		if (attempt === 0) {
			scanJob.status = 'monitoring';
			scanJob.progress = 10;
			scanJob.startedAt = new Date();
			scanJob.lastError = null;
			await scanJob.save();
		}

		console.log(`[LIVESTREAM MONITOR] Starting ffmpeg capture for scanJob ${jobIdStr} (attempt ${attempt + 1}/5)`);

		// Spawn ffmpeg child process to capture a frame from the live stream every 1.5 seconds:
		const ffmpeg = spawn('ffmpeg', [
			'-i', asset.livestreamUrl,
			'-vf', 'fps=1/1.5',
			'-f', 'image2pipe',
			'-vcodec', 'mjpeg',
			'-'
		]);

		activeMonitors.set(jobIdStr, ffmpeg);

		let dataBuffer = Buffer.alloc(0);
		
		ffmpeg.stdout.on('data', async (chunk) => {
			// On successful data intake, reset reconnect attempt counter because the connection is alive!
			if (livestreamReconnects.get(jobIdStr) > 0) {
				livestreamReconnects.set(jobIdStr, 0);
			}
			
			dataBuffer = Buffer.concat([dataBuffer, chunk]);
			while (true) {
				const startIndex = dataBuffer.indexOf(Buffer.from([0xFF, 0xD8]));
				if (startIndex === -1) {
					dataBuffer = dataBuffer.slice(Math.max(0, dataBuffer.length - 1));
					break;
				}
				const endIndex = dataBuffer.indexOf(Buffer.from([0xFF, 0xD9]), startIndex + 2);
				if (endIndex === -1) {
					break;
				}
				const jpegFrame = dataBuffer.slice(startIndex, endIndex + 2);
				dataBuffer = dataBuffer.slice(endIndex + 2);

				// Process JPEG frame in background
				void processLiveStreamFrame(jpegFrame, scanJob, asset);
			}
		});

		const handleDisconnect = async (reason, detail) => {
			activeMonitors.delete(jobIdStr);
			
			// Verify if the job is still active in the database
			const freshJob = await ScanJob.findById(scanJob._id);
			if (freshJob && freshJob.status === 'monitoring') {
				const currentAttempt = livestreamReconnects.get(jobIdStr) || 0;
				if (currentAttempt < 4) {
					livestreamReconnects.set(jobIdStr, currentAttempt + 1);
					const backoffMs = 3000 + currentAttempt * 2000; // exponential backoff: 3s, 5s, 7s, 9s
					console.warn(`[LIVESTREAM DISCONNECT] ${reason} (${detail}). Reconnecting in ${backoffMs / 1000}s (Attempt ${currentAttempt + 1}/5)...`);
					setTimeout(() => {
						void monitorLiveStream(scanJob, asset);
					}, backoffMs);
				} else {
					console.error(`[LIVESTREAM FAILED] Max connection attempts (5/5) reached for scanJob ${jobIdStr}`);
					livestreamReconnects.delete(jobIdStr);
					await markScanJobFailed(scanJob._id, `Stream disconnected: Max reconnect attempts reached. (${detail})`);
				}
			} else {
				livestreamReconnects.delete(jobIdStr);
			}
		};

		ffmpeg.on('error', async (err) => {
			console.error(`[FFMPEG ERROR] Failed to start ffmpeg process for scanJob ${jobIdStr}:`, err);
			void handleDisconnect('ffmpeg process error', err.message);
		});

		ffmpeg.stderr.on('data', (data) => {
			const logStr = data.toString();
			if (logStr.toLowerCase().includes('error') || logStr.toLowerCase().includes('fail')) {
				console.warn(`[FFMPEG STDERR] ${logStr.trim()}`);
			}
		});

		ffmpeg.on('close', async (code) => {
			if (code !== 0 && code !== null) {
				console.error(`[FFMPEG CLOSE] ffmpeg process for scanJob ${jobIdStr} exited with code ${code}`);
				void handleDisconnect('ffmpeg process closed unexpectedly', `exit code ${code}`);
			} else {
				// Clean exit (e.g. killed by SIGKILL)
				activeMonitors.delete(jobIdStr);
				livestreamReconnects.delete(jobIdStr);
			}
		});

	} catch (error) {
		activeMonitors.delete(jobIdStr);
		console.error(`[MONITOR_LIVE_STREAM_ERROR] Exception in monitorLiveStream for scanJob ${jobIdStr}:`, error);
		await markScanJobFailed(scanJob._id, error.message);
	}
}

async function markScanJobFailed(scanJobId, errorMsg) {
	try {
		await ScanJob.findByIdAndUpdate(scanJobId, {
			status: 'failed',
			completedAt: new Date(),
			lastError: errorMsg,
		});
	} catch (dbErr) {
		console.error('[markScanJobFailed DB ERROR]', dbErr);
	}
}

async function processLiveStreamFrame(jpegFrame, scanJob, asset) {
	let tempFilePath = '';
	try {
		const tmp = os.tmpdir();
		tempFilePath = path.join(tmp, `livestream-frame-${scanJob._id}-${Date.now()}.jpg`);
		await fs.writeFile(tempFilePath, jpegFrame);

		// Post to ML service to fingerprint the local JPEG file
		const response = await fetch(`${ML_SERVICE_URL}/ml/fingerprint`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ localFilePath: tempFilePath }),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`ML fingerprint endpoint failed: ${errorText}`);
		}

		const fingerprintResult = await response.json();
		const framePHash = fingerprintResult.pHash;

		if (!framePHash) {
			return; // No pHash calculated for this frame, skip
		}

		// Query active reference assets (non-livestream) for this organization
		const referenceAssets = await Asset.find({
			orgId: scanJob.orgId,
			type: { $ne: 'livestream' },
			status: 'active'
		}).lean();

		const jobIdStr = scanJob._id.toString();
		if (!livestreamTelemetryStats.has(jobIdStr)) {
			livestreamTelemetryStats.set(jobIdStr, {
				framesAnalyzed: 0,
				lastFrameTime: new Date(),
				matchesChecked: 0
			});
		}
		const stats = livestreamTelemetryStats.get(jobIdStr);
		stats.framesAnalyzed += 1;
		stats.lastFrameTime = new Date();
		stats.matchesChecked = stats.framesAnalyzed * referenceAssets.length;

		// Emit socket telemetry in the background
		import('../config/socket.js').then(({ emitLivestreamTelemetry }) => {
			emitLivestreamTelemetry({
				orgId: scanJob.orgId,
				jobId: jobIdStr,
				telemetry: {
					framesAnalyzed: stats.framesAnalyzed,
					lastFrameTime: stats.lastFrameTime,
					matchesChecked: stats.matchesChecked,
				}
			});
		}).catch(err => console.error('[LIVESTREAM TELEMETRY SOCKET ERROR]', err));

		for (const refAsset of referenceAssets) {
			const refPHashes = [];
			if (refAsset.fingerprint?.pHash) {
				refPHashes.push(refAsset.fingerprint.pHash);
			}
			if (Array.isArray(refAsset.fingerprint?.frameHashes)) {
				refPHashes.push(...refAsset.fingerprint.frameHashes);
			}

			let minDistance = 999;
			for (const refPHash of refPHashes) {
				const distance = calculateHammingDistance(framePHash, refPHash);
				if (distance < minDistance) {
					minDistance = distance;
				}
			}

			if (minDistance <= 10) {
				console.log(`[LIVESTREAM ALERT] Match found for reference asset "${refAsset.title}" (ID: ${refAsset._id}) on livestream! Hamming distance: ${minDistance}`);

				// Create scan result record for this match
				await ScanResult.create({
					scanJobId: scanJob._id,
					orgId: scanJob.orgId,
					assetId: refAsset._id,
					sourceUrl: asset.livestreamUrl,
					sourceDomain: 'livestream',
					platform: 'livestream',
					pageTitle: `Livestream Match: ${refAsset.title}`,
					status: 'matched',
					matchConfidence: 100 - minDistance * 5,
					matchType: 'near-duplicate',
					evidenceBundle: {
						hammingDistance: minDistance
					},
					scrapedAt: new Date()
				});

				// Create violation record
				const violation = await Violation.create({
					orgId: scanJob.orgId,
					assetId: refAsset._id,
					scanJobId: scanJob._id,
					sourceUrl: asset.livestreamUrl,
					sourceDomain: 'livestream',
					platform: 'livestream',
					matchConfidence: 100 - minDistance * 5,
					matchType: 'near-duplicate',
					status: 'open',
					evidenceBundle: {
						hammingDistance: minDistance
					},
					detectedAt: new Date()
				});

				//Added for firestore live feed
				try {
					const db = getFirestoreInstance();
					if (db) {
						await db
							.collection("live_violations")
							.doc(violation._id.toString())
							.set({
								id: violation._id.toString(),
								orgId: violation.orgId.toString(),
								sourceUrl: violation.sourceUrl,
								platform: violation.platform,
								confidence: violation.matchConfidence,
								status: violation.status,
								detectedAt: violation.detectedAt,
								createdAt: new Date(),
							});
					}
				} catch (error) {
					console.error(
						"[FIRESTORE] Failed to publish violation:",
						error.message
					);
				}

				// Create alert
				await createAlertFromViolation({
					orgId: scanJob.orgId,
					violationId: violation._id,
					platform: 'livestream',
					matchConfidence: 100 - minDistance * 5
				});

				// Update results counts on scan job
				await ScanJob.findByIdAndUpdate(scanJob._id, {
					$inc: { resultsCount: 1, violationsCount: 1 }
				});

				// Also increment asset violations
				await Asset.findByIdAndUpdate(refAsset._id, {
					$inc: { violationsFound: 1 }
				});
			}
		}

	} catch (error) {
		console.error(`[processLiveStreamFrame ERROR] Failed to process frame:`, error.message);
	} finally {
		if (tempFilePath) {
			await fs.unlink(tempFilePath).catch(() => {});
		}
	}
}