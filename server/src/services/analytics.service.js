import Asset from '../models/asset.model.js';
import Violation from '../models/violation.model.js';
import { Types } from 'mongoose';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const RANGE_DAYS = {
	'7d': 7,
	'30d': 30,
	'90d': 90,
};

function startOfDay(date) {
	const normalized = new Date(date);
	normalized.setHours(0, 0, 0, 0);
	return normalized;
}

function endOfDay(date) {
	const normalized = new Date(date);
	normalized.setHours(23, 59, 59, 999);
	return normalized;
}

function formatDateKey(date) {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: 'UTC',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(date);
}

function formatDisplayDate(date) {
	return new Intl.DateTimeFormat('en-US', {
		timeZone: 'UTC',
		month: 'short',
		day: 'numeric',
	}).format(date);
}

function normalizeOrgId(orgId) {
	if (!orgId) {
		return orgId;
	}

	if (orgId instanceof Types.ObjectId) {
		return orgId;
	}

	return Types.ObjectId.isValid(orgId) ? new Types.ObjectId(orgId) : orgId;
}

export function resolveAnalyticsRange({ range = '30d', startDate = null, endDate = null } = {}) {
	if (range === 'custom' && startDate && endDate) {
		return {
			range,
			startDate: startOfDay(startDate),
			endDate: endOfDay(endDate),
			label: `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`,
		};
	}

	const days = RANGE_DAYS[range] || 30;
	const resolvedEndDate = endOfDay(new Date());
	const resolvedStartDate = startOfDay(new Date(resolvedEndDate.getTime() - (days - 1) * DAY_IN_MS));

	return {
		range,
		startDate: resolvedStartDate,
		endDate: resolvedEndDate,
		label: `Last ${days} days`,
	};
}

function buildTimelineRows({ timelineMap, startDate, endDate }) {
	const rows = [];

	for (let cursor = startOfDay(startDate); cursor <= endDate; cursor = new Date(cursor.getTime() + DAY_IN_MS)) {
		const key = formatDateKey(cursor);
		rows.push({
			date: key,
			label: formatDisplayDate(cursor),
			count: timelineMap.get(key) || 0,
		});
	}

	return rows;
}

async function getTimelineMap(orgId, startDate, endDate) {
	const rows = await Violation.aggregate([
		{
			$match: {
				orgId,
				detectedAt: {
					$gte: startDate,
					$lte: endDate,
				},
			},
		},
		{
			$group: {
				_id: {
					$dateToString: {
						format: '%Y-%m-%d',
						date: '$detectedAt',
					},
				},
				count: { $sum: 1 },
			},
		},
		{ $sort: { _id: 1 } },
	]);

	return new Map(rows.map((row) => [row._id, row.count]));
}

async function getPlatformBreakdown(orgId, startDate, endDate) {
	const rows = await Violation.aggregate([
		{
			$match: {
				orgId,
				detectedAt: {
					$gte: startDate,
					$lte: endDate,
				},
			},
		},
		{
			$group: {
				_id: '$platform',
				count: { $sum: 1 },
			},
		},
		{ $sort: { count: -1, _id: 1 } },
	]);

	const total = rows.reduce((sum, row) => sum + row.count, 0);

	return rows.map((row) => ({
		platform: row._id || 'unknown',
		count: row.count,
		percentage: total > 0 ? Number(((row.count / total) * 100).toFixed(1)) : 0,
	}));
}

async function getTopAssets(orgId, startDate, endDate) {
	const rows = await Violation.aggregate([
		{
			$match: {
				orgId,
				detectedAt: {
					$gte: startDate,
					$lte: endDate,
				},
			},
		},
		{
			$group: {
				_id: '$assetId',
				violationCount: { $sum: 1 },
				avgConfidenceScore: { $avg: '$matchConfidence' },
			},
		},
		{ $sort: { violationCount: -1, avgConfidenceScore: -1 } },
		{ $limit: 5 },
		{
			$lookup: {
				from: 'assets',
				localField: '_id',
				foreignField: '_id',
				as: 'asset',
			},
		},
		{
			$project: {
				assetId: '$_id',
				violationCount: 1,
				avgConfidenceScore: { $round: ['$avgConfidenceScore', 1] },
				title: {
					$ifNull: [{ $arrayElemAt: ['$asset.title', 0] }, 'Untitled asset'],
				},
				type: {
					$ifNull: [{ $arrayElemAt: ['$asset.type', 0] }, 'asset'],
				},
			},
		},
	]);

	return rows.map((row) => ({
		assetId: row.assetId?.toString?.() || String(row.assetId),
		title: row.title,
		type: row.type,
		violationCount: row.violationCount,
		avgConfidenceScore: row.avgConfidenceScore || 0,
	}));
}

async function getTopDomains(orgId, startDate, endDate) {
	const rows = await Violation.aggregate([
		{
			$match: {
				orgId,
				detectedAt: {
					$gte: startDate,
					$lte: endDate,
				},
				sourceDomain: { $ne: null },
			},
		},
		{
			$group: {
				_id: '$sourceDomain',
				count: { $sum: 1 },
				repeatOffenderScore: { $avg: '$repeatOffenderScore' },
			},
		},
		{ $sort: { count: -1, repeatOffenderScore: -1 } },
		{ $limit: 5 },
	]);

	return rows.map((row) => ({
		domain: row._id,
		count: row.count,
		repeatOffenderScore: Number((row.repeatOffenderScore || 0).toFixed(1)),
	}));
}

async function getSummaryStats(orgId, startDate, endDate) {
	const [summary] = await Violation.aggregate([
		{
			$match: {
				orgId,
				detectedAt: {
					$gte: startDate,
					$lte: endDate,
				},
			},
		},
		{
			$group: {
				_id: null,
				totalViolations: { $sum: 1 },
				resolvedViolations: {
					$sum: {
						$cond: [{ $eq: ['$status', 'resolved'] }, 1, 0],
					},
				},
				reportedViolations: {
					$sum: {
						$cond: [{ $eq: ['$status', 'reported'] }, 1, 0],
					},
				},
				openViolations: {
					$sum: {
						$cond: [{ $eq: ['$status', 'open'] }, 1, 0],
					},
				},
				falsePositives: {
					$sum: {
						$cond: [{ $eq: ['$status', 'false_positive'] }, 1, 0],
					},
				},
				avgConfidenceScore: { $avg: '$matchConfidence' },
			},
		},
	]);

	const totalViolations = summary?.totalViolations || 0;
	const resolvedViolations = summary?.resolvedViolations || 0;

	return {
		totalViolations,
		resolvedViolations,
		reportedViolations: summary?.reportedViolations || 0,
		openViolations: summary?.openViolations || 0,
		falsePositives: summary?.falsePositives || 0,
		avgConfidenceScore: Number((summary?.avgConfidenceScore || 0).toFixed(1)),
		resolutionRate: totalViolations > 0 ? Number((resolvedViolations / totalViolations).toFixed(2)) : 0,
		estimatedRevenueLoss: totalViolations * 150, // Assuming avg 150 currency units loss per detection
	};
}

async function getPreviousWindowViolationCount(orgId, startDate, endDate) {
	const windowMs = endOfDay(endDate).getTime() - startOfDay(startDate).getTime() + 1;
	const previousEndDate = new Date(startDate.getTime() - 1);
	const previousStartDate = new Date(previousEndDate.getTime() - windowMs + 1);

	return Violation.countDocuments({
		orgId,
		detectedAt: {
			$gte: previousStartDate,
			$lte: previousEndDate,
		},
	});
}

export async function getAnalyticsOverview({ orgId, range = '30d', startDate = null, endDate = null }) {
	const resolvedRange = resolveAnalyticsRange({ range, startDate, endDate });
	const normalizedOrgId = normalizeOrgId(orgId);
	const [{ totalAssets }, summaryStats, timelineMap, platformBreakdown, topAssets, topDomains, previousWindowCount] =
		await Promise.all([
			Asset.aggregate([
				{ $match: { orgId: normalizedOrgId, status: { $ne: 'deleted' } } },
				{ $group: { _id: null, totalAssets: { $sum: 1 } } },
			]).then((rows) => ({ totalAssets: rows[0]?.totalAssets || 0 })),
			getSummaryStats(normalizedOrgId, resolvedRange.startDate, resolvedRange.endDate),
			getTimelineMap(normalizedOrgId, resolvedRange.startDate, resolvedRange.endDate),
			getPlatformBreakdown(normalizedOrgId, resolvedRange.startDate, resolvedRange.endDate),
			getTopAssets(normalizedOrgId, resolvedRange.startDate, resolvedRange.endDate),
			getTopDomains(normalizedOrgId, resolvedRange.startDate, resolvedRange.endDate),
			getPreviousWindowViolationCount(normalizedOrgId, resolvedRange.startDate, resolvedRange.endDate),
		]);

	const timeline = buildTimelineRows({
		timelineMap,
		startDate: resolvedRange.startDate,
		endDate: resolvedRange.endDate,
	});

	const currentCount = summaryStats.totalViolations;
	let trendDirection = 'flat';
	let trendChangePercentage = 0;

	if (previousWindowCount === 0 && currentCount > 0) {
		trendDirection = 'up';
		trendChangePercentage = 100;
	} else if (previousWindowCount > 0) {
		const delta = currentCount - previousWindowCount;
		trendChangePercentage = Number(((delta / previousWindowCount) * 100).toFixed(1));
		if (delta > 0) {
			trendDirection = 'up';
		} else if (delta < 0) {
			trendDirection = 'down';
		}
	}

	return {
		range: resolvedRange.range,
		rangeLabel: resolvedRange.label,
		startDate: resolvedRange.startDate,
		endDate: resolvedRange.endDate,
		totalAssets,
		...summaryStats,
		violationsLastPeriod: timeline,
		platformBreakdown,
		topViolatedAssets: topAssets,
		topSourceDomains: topDomains,
		trend: {
			previousWindowViolations: previousWindowCount,
			currentWindowViolations: currentCount,
			direction: trendDirection,
			changePercentage: trendChangePercentage,
		},
	};
}

export async function getAnalyticsTimeline({ orgId, range = '30d', startDate = null, endDate = null }) {
	const resolvedRange = resolveAnalyticsRange({ range, startDate, endDate });
	const normalizedOrgId = normalizeOrgId(orgId);
	const timelineMap = await getTimelineMap(normalizedOrgId, resolvedRange.startDate, resolvedRange.endDate);

	return {
		range: resolvedRange.range,
		rangeLabel: resolvedRange.label,
		startDate: resolvedRange.startDate,
		endDate: resolvedRange.endDate,
		items: buildTimelineRows({
			timelineMap,
			startDate: resolvedRange.startDate,
			endDate: resolvedRange.endDate,
		}),
	};
}

export async function getAnalyticsPlatforms({ orgId, range = '30d', startDate = null, endDate = null }) {
	const resolvedRange = resolveAnalyticsRange({ range, startDate, endDate });
	const normalizedOrgId = normalizeOrgId(orgId);
	const items = await getPlatformBreakdown(normalizedOrgId, resolvedRange.startDate, resolvedRange.endDate);

	return {
		range: resolvedRange.range,
		rangeLabel: resolvedRange.label,
		startDate: resolvedRange.startDate,
		endDate: resolvedRange.endDate,
		items,
	};
}

// KPI Metrics for Phase 6 Hardening

async function getMeanDetectionTime(orgId, startDate, endDate) {
	// Average time from asset creation to first violation detection
	const [result] = await Violation.aggregate([
		{
			$match: {
				orgId,
				detectedAt: {
					$gte: startDate,
					$lte: endDate,
				},
			},
		},
		{
			$lookup: {
				from: 'assets',
				localField: 'assetId',
				foreignField: '_id',
				as: 'asset',
			},
		},
		{
			$project: {
				timeToDetect: {
					$subtract: ['$detectedAt', { $arrayElemAt: ['$asset.createdAt', 0] }],
				},
			},
		},
		{
			$group: {
				_id: null,
				meanTimeMs: { $avg: '$timeToDetect' },
				count: { $sum: 1 },
			},
		},
	]);

	if (!result || result.count === 0) {
		return { meanTimeHours: 0, meanTimeMinutes: 0, count: 0 };
	}

	const meanTimeMs = result.meanTimeMs || 0;
	const meanTimeHours = Math.round(meanTimeMs / (1000 * 60 * 60) * 10) / 10;
	const meanTimeMinutes = Math.round((meanTimeMs / (1000 * 60)) * 10) / 10;

	return {
		meanTimeHours,
		meanTimeMinutes,
		count: result.count,
	};
}

async function getRepeatOffenderRatio(orgId, startDate, endDate) {
	// Percentage of repeat offender domains (seen multiple times)
	const [result] = await Violation.aggregate([
		{
			$match: {
				orgId,
				detectedAt: {
					$gte: startDate,
					$lte: endDate,
				},
				sourceDomain: { $ne: null },
			},
		},
		{
			$group: {
				_id: '$sourceDomain',
				seenCount: { $sum: 1 },
			},
		},
		{
			$group: {
				_id: null,
				totalDomains: { $sum: 1 },
				repeatOffenders: {
					$sum: {
						$cond: [{ $gt: ['$seenCount', 1] }, 1, 0],
					},
				},
			},
		},
	]);

	if (!result || result.totalDomains === 0) {
		return { ratio: 0, repeatOffenderCount: 0, totalDomains: 0 };
	}

	const ratio = Number(((result.repeatOffenders / result.totalDomains) * 100).toFixed(1));

	return {
		ratio,
		repeatOffenderCount: result.repeatOffenders,
		totalDomains: result.totalDomains,
	};
}

async function getFalsePositiveRate(orgId, startDate, endDate) {
	// Percentage of violations marked as false positive
	const [result] = await Violation.aggregate([
		{
			$match: {
				orgId,
				detectedAt: {
					$gte: startDate,
					$lte: endDate,
				},
			},
		},
		{
			$group: {
				_id: null,
				totalViolations: { $sum: 1 },
				falsePositives: {
					$sum: {
						$cond: [{ $eq: ['$status', 'false_positive'] }, 1, 0],
					},
				},
			},
		},
	]);

	if (!result || result.totalViolations === 0) {
		return { rate: 0, falsePositiveCount: 0, totalViolations: 0 };
	}

	const rate = Number(((result.falsePositives / result.totalViolations) * 100).toFixed(1));

	return {
		rate,
		falsePositiveCount: result.falsePositives,
		totalViolations: result.totalViolations,
	};
}

async function getResolutionSLA(orgId, startDate, endDate) {
	// Average time to resolve violations (SLA target: 24 hours)
	const SLA_TARGET_MS = 24 * 60 * 60 * 1000; // 24 hours

	const [result] = await Violation.aggregate([
		{
			$match: {
				orgId,
				status: { $in: ['resolved', 'reported'] },
				resolvedAt: { $ne: null },
				detectedAt: {
					$gte: startDate,
					$lte: endDate,
				},
			},
		},
		{
			$project: {
				resolutionTimeMs: {
					$subtract: ['$resolvedAt', '$detectedAt'],
				},
				metSLA: {
					$cond: [
						{
							$lte: [
								{ $subtract: ['$resolvedAt', '$detectedAt'] },
								SLA_TARGET_MS,
							],
						},
						1,
						0,
					],
				},
			},
		},
		{
			$group: {
				_id: null,
				avgResolutionTimeMs: { $avg: '$resolutionTimeMs' },
				slaMetCount: { $sum: '$metSLA' },
				totalResolved: { $sum: 1 },
			},
		},
	]);

	if (!result || result.totalResolved === 0) {
		return {
			avgTimeHours: 0,
			slaCompliancePercentage: 0,
			totalResolved: 0,
		};
	}

	const avgTimeHours = Math.round((result.avgResolutionTimeMs / (1000 * 60 * 60)) * 10) / 10;
	const slaCompliancePercentage = Number(((result.slaMetCount / result.totalResolved) * 100).toFixed(1));

	return {
		avgTimeHours,
		slaCompliancePercentage,
		totalResolved: result.totalResolved,
	};
}

async function getConfidenceCalibration(orgId, startDate, endDate) {
	// Analyze confidence score distribution and accuracy
	const [result] = await Violation.aggregate([
		{
			$match: {
				orgId,
				detectedAt: {
					$gte: startDate,
					$lte: endDate,
				},
			},
		},
		{
			$group: {
				_id: null,
				avgConfidence: { $avg: '$matchConfidence' },
				minConfidence: { $min: '$matchConfidence' },
				maxConfidence: { $max: '$matchConfidence' },
				highConfidenceCount: {
					$sum: {
						$cond: [{ $gte: ['$matchConfidence', 70] }, 1, 0],
					},
				},
				mediumConfidenceCount: {
					$sum: {
						$cond: [
							{
								$and: [
									{ $gte: ['$matchConfidence', 40] },
									{ $lt: ['$matchConfidence', 70] },
								],
							},
							1,
							0,
						],
					},
				},
				lowConfidenceCount: {
					$sum: {
						$cond: [{ $lt: ['$matchConfidence', 40] }, 1, 0],
					},
				},
				totalViolations: { $sum: 1 },
				falsePositiveRate: {
					$avg: {
						$cond: [{ $eq: ['$status', 'false_positive'] }, 1, 0],
					},
				},
			},
		},
	]);

	if (!result || result.totalViolations === 0) {
		return {
			avgConfidence: 0,
			distribution: { high: 0, medium: 0, low: 0 },
			falsePositiveRate: 0,
		};
	}

	return {
		avgConfidence: Number(result.avgConfidence.toFixed(1)),
		minConfidence: result.minConfidence,
		maxConfidence: result.maxConfidence,
		distribution: {
			high: {
				count: result.highConfidenceCount,
				percentage: Number(((result.highConfidenceCount / result.totalViolations) * 100).toFixed(1)),
			},
			medium: {
				count: result.mediumConfidenceCount,
				percentage: Number(((result.mediumConfidenceCount / result.totalViolations) * 100).toFixed(1)),
			},
			low: {
				count: result.lowConfidenceCount,
				percentage: Number(((result.lowConfidenceCount / result.totalViolations) * 100).toFixed(1)),
			},
		},
		falsePositiveRate: Number((result.falsePositiveRate * 100).toFixed(1)),
	};
}

export async function getAnalyticsKPIs({ orgId, range = '30d', startDate = null, endDate = null }) {
	const resolvedRange = resolveAnalyticsRange({ range, startDate, endDate });
	const normalizedOrgId = normalizeOrgId(orgId);

	const [detectionTime, repeatOffenderRatio, falsePositiveRate, resolutionSLA, confidenceCalibration] =
		await Promise.all([
			getMeanDetectionTime(normalizedOrgId, resolvedRange.startDate, resolvedRange.endDate),
			getRepeatOffenderRatio(normalizedOrgId, resolvedRange.startDate, resolvedRange.endDate),
			getFalsePositiveRate(normalizedOrgId, resolvedRange.startDate, resolvedRange.endDate),
			getResolutionSLA(normalizedOrgId, resolvedRange.startDate, resolvedRange.endDate),
			getConfidenceCalibration(normalizedOrgId, resolvedRange.startDate, resolvedRange.endDate),
		]);

	return {
		range: resolvedRange.range,
		rangeLabel: resolvedRange.label,
		startDate: resolvedRange.startDate,
		endDate: resolvedRange.endDate,
		kpis: {
			detectionTime,
			repeatOffenderRatio,
			falsePositiveRate,
			resolutionSLA,
			confidenceCalibration,
		},
	};
}

// Confidence Calibration - Analyze false-positive patterns by confidence band

async function getConfidenceBandAnalysis(orgId, startDate, endDate) {
	// Analyze false-positive rate across different confidence score bands
	// This helps determine if thresholds need adjustment
	const bands = [
		{ min: 0, max: 30, label: 'Very Low (0-30%)' },
		{ min: 30, max: 40, label: 'Low (30-40%)' },
		{ min: 40, max: 50, label: 'Low-Medium (40-50%)' },
		{ min: 50, max: 60, label: 'Medium (50-60%)' },
		{ min: 60, max: 70, label: 'Medium-High (60-70%)' },
		{ min: 70, max: 80, label: 'High (70-80%)' },
		{ min: 80, max: 100, label: 'Very High (80-100%)' },
	];

	const bandAnalysis = await Promise.all(
		bands.map(async (band) => {
			const [result] = await Violation.aggregate([
				{
					$match: {
						orgId,
						detectedAt: {
							$gte: startDate,
							$lte: endDate,
						},
						matchConfidence: {
							$gte: band.min,
							$lt: band.max,
						},
					},
				},
				{
					$group: {
						_id: null,
						totalCount: { $sum: 1 },
						falsePositiveCount: {
							$sum: {
								$cond: [{ $eq: ['$status', 'false_positive'] }, 1, 0],
							},
						},
						resolvedCount: {
							$sum: {
								$cond: [{ $eq: ['$status', 'resolved'] }, 1, 0],
							},
						},
						reportedCount: {
							$sum: {
								$cond: [{ $eq: ['$status', 'reported'] }, 1, 0],
							},
						},
					},
				},
			]);

			if (!result) {
				return {
					band: band.label,
					totalCount: 0,
					falsePositiveRate: 0,
					actionableRate: 0,
					recommendation: 'No data',
				};
			}

			const fpRate = result.totalCount > 0 ? Number(((result.falsePositiveCount / result.totalCount) * 100).toFixed(1)) : 0;
			const actionableRate = result.totalCount > 0 ? Number((((result.resolvedCount + result.reportedCount) / result.totalCount) * 100).toFixed(1)) : 0;

			let recommendation = 'Monitor';
			if (fpRate > 15) {
				recommendation = 'Raise threshold';
			} else if (fpRate < 3 && actionableRate > 80) {
				recommendation = 'Lower threshold';
			}

			return {
				band: band.label,
				totalCount: result.totalCount,
				falsePositiveCount: result.falsePositiveCount,
				falsePositiveRate: fpRate,
				actionableRate,
				resolvedCount: result.resolvedCount,
				reportedCount: result.reportedCount,
				recommendation,
			};
		}),
	);

	return bandAnalysis.filter((b) => b.totalCount > 0);
}

export async function getConfidenceCalibrationAnalysis({ orgId, range = '30d', startDate = null, endDate = null }) {
	const resolvedRange = resolveAnalyticsRange({ range, startDate, endDate });
	const normalizedOrgId = normalizeOrgId(orgId);

	const bandAnalysis = await getConfidenceBandAnalysis(normalizedOrgId, resolvedRange.startDate, resolvedRange.endDate);

	// Generate overall recommendations
	const highRiskBands = bandAnalysis.filter((b) => b.falsePositiveRate > 15);
	const recommendations = [];

	if (highRiskBands.length > 0) {
		const lowestHighRiskBand = highRiskBands.reduce((min, b) => {
			const minMin = parseFloat(min.band.match(/(\d+)/)[0]);
			const bMin = parseFloat(b.band.match(/(\d+)/)[0]);
			return bMin < minMin ? b : min;
		});
		recommendations.push({
			priority: 'high',
			message: `High false-positive rate (${lowestHighRiskBand.falsePositiveRate}%) detected in ${lowestHighRiskBand.band} confidence band. Consider raising violation detection threshold to >${lowestHighRiskBand.band.match(/(\d+)/)[0]}%.`,
		});
	}

	const lowFpBands = bandAnalysis.filter((b) => b.falsePositiveRate < 3 && b.actionableRate > 80);
	if (lowFpBands.length > 0) {
		recommendations.push({
			priority: 'medium',
			message: `Excellent precision in ${lowFpBands.map((b) => b.band).join(', ')} bands. Consider exploring lower thresholds for early detection.`,
		});
	}

	return {
		range: resolvedRange.range,
		rangeLabel: resolvedRange.label,
		startDate: resolvedRange.startDate,
		endDate: resolvedRange.endDate,
		bandAnalysis,
		recommendations,
	};
}

// Propagation Graph Analytics - Track how violations spread across platforms

async function getAssetPropagationGraph(assetId, orgId) {
	// Get all violations for this asset, ordered by detection time
	// Show first platform, then subsequent platforms and timeline
	const violations = await Violation.find({
		assetId,
		orgId,
	})
		.select('platform detectedAt sourceDomain matchConfidence status')
		.sort({ detectedAt: 1 });

	if (violations.length === 0) {
		return null;
	}

	const firstDetection = violations[0];
	const platformTimeline = [];
	const platformSet = new Set();

	violations.forEach((v) => {
		const key = v.platform;

		if (!platformSet.has(key)) {
			const timeFromFirstMs = v.detectedAt.getTime() - firstDetection.detectedAt.getTime();
			const timeFromFirstHours = Math.round(timeFromFirstMs / (1000 * 60 * 60) * 10) / 10;

			platformTimeline.push({
				platform: v.platform,
				firstSeenAt: v.detectedAt,
				timeFromFirstDetectionHours: timeFromFirstHours,
				count: violations.filter((x) => x.platform === key).length,
			});

			platformSet.add(key);
		}
	});

	return {
		assetId: assetId.toString(),
		firstDetectionAt: firstDetection.detectedAt,
		firstDetectionPlatform: firstDetection.platform,
		totalPlatformsAffected: platformSet.size,
		timeSpanHours: Math.round((violations[violations.length - 1].detectedAt.getTime() - firstDetection.detectedAt.getTime()) / (1000 * 60 * 60) * 10) / 10,
		platformTimeline: platformTimeline.sort((a, b) => a.timeFromFirstDetectionHours - b.timeFromFirstDetectionHours),
		totalViolationsDetected: violations.length,
	};
}

export async function getPropagationAnalytics({ orgId, range = '30d', startDate = null, endDate = null, limit = 10 }) {
	const resolvedRange = resolveAnalyticsRange({ range, startDate, endDate });
	const normalizedOrgId = normalizeOrgId(orgId);

	// Get top assets by violation count in the range
	const topAssets = await Violation.aggregate([
		{
			$match: {
				orgId: normalizedOrgId,
				detectedAt: {
					$gte: resolvedRange.startDate,
					$lte: resolvedRange.endDate,
				},
			},
		},
		{
			$group: {
				_id: '$assetId',
				violationCount: { $sum: 1 },
				platformCount: { $addToSet: '$platform' },
			},
		},
		{ $sort: { violationCount: -1, platformCount: -1 } },
		{ $limit: limit },
	]);

	// For each top asset, get its propagation graph
	const propagationGraphs = await Promise.all(
		topAssets.map((asset) =>
			getAssetPropagationGraph(asset._id, normalizedOrgId).then((graph) =>
				graph
					? {
							...graph,
							violationCountInRange: asset.violationCount,
						}
					: null,
			),
		),
	);

	// Calculate global spread metrics
	const [globalMetrics] = await Violation.aggregate([
		{
			$match: {
				orgId: normalizedOrgId,
				detectedAt: {
					$gte: resolvedRange.startDate,
					$lte: resolvedRange.endDate,
				},
			},
		},
		{
			$group: {
				_id: '$assetId',
				platformCount: { $addToSet: '$platform' },
				violationCount: { $sum: 1 },
				timeSpan: {
					$subtract: [
						{ $max: '$detectedAt' },
						{ $min: '$detectedAt' },
					],
				},
			},
		},
		{
			$group: {
				_id: null,
				avgPlatformsPerAsset: { $avg: { $size: '$platformCount' } },
				maxPlatformsForSingleAsset: { $max: { $size: '$platformCount' } },
				avgViolationsPerAsset: { $avg: '$violationCount' },
				avgSpreadTimeHours: {
					$avg: { $divide: ['$timeSpan', 3600000] },
				},
			},
		},
	]);

	return {
		range: resolvedRange.range,
		rangeLabel: resolvedRange.label,
		startDate: resolvedRange.startDate,
		endDate: resolvedRange.endDate,
		metrics: {
			avgPlatformsPerAsset: Number((globalMetrics?.avgPlatformsPerAsset || 0).toFixed(1)),
			maxPlatformsForSingleAsset: globalMetrics?.maxPlatformsForSingleAsset || 0,
			avgViolationsPerAsset: Number((globalMetrics?.avgViolationsPerAsset || 0).toFixed(1)),
			avgSpreadTimeHours: Math.round((globalMetrics?.avgSpreadTimeHours || 0) * 10) / 10,
		},
		topAssetPropagations: propagationGraphs.filter(Boolean),
	};
}
