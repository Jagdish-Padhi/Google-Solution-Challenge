import Asset from '../models/asset.model.js';
import Violation from '../models/violation.model.js';

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
	const [{ totalAssets }, summaryStats, timelineMap, platformBreakdown, topAssets, topDomains, previousWindowCount] =
		await Promise.all([
			Asset.aggregate([
				{ $match: { orgId, status: { $ne: 'deleted' } } },
				{ $group: { _id: null, totalAssets: { $sum: 1 } } },
			]).then((rows) => ({ totalAssets: rows[0]?.totalAssets || 0 })),
			getSummaryStats(orgId, resolvedRange.startDate, resolvedRange.endDate),
			getTimelineMap(orgId, resolvedRange.startDate, resolvedRange.endDate),
			getPlatformBreakdown(orgId, resolvedRange.startDate, resolvedRange.endDate),
			getTopAssets(orgId, resolvedRange.startDate, resolvedRange.endDate),
			getTopDomains(orgId, resolvedRange.startDate, resolvedRange.endDate),
			getPreviousWindowViolationCount(orgId, resolvedRange.startDate, resolvedRange.endDate),
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
	const timelineMap = await getTimelineMap(orgId, resolvedRange.startDate, resolvedRange.endDate);

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
	const items = await getPlatformBreakdown(orgId, resolvedRange.startDate, resolvedRange.endDate);

	return {
		range: resolvedRange.range,
		rangeLabel: resolvedRange.label,
		startDate: resolvedRange.startDate,
		endDate: resolvedRange.endDate,
		items,
	};
}
