import Alert from '../models/alert.model.js';
import { emitAlertsCreated } from '../config/socket.js';
import Violation from '../models/violation.model.js';

const SURGE_WINDOW_MS = 60 * 60 * 1000;
const SURGE_DEDUP_MS = 30 * 60 * 1000;

async function shouldTriggerPlatformSurgeAlert({ orgId, platform }) {
	const now = Date.now();
	const windowStart = new Date(now - SURGE_WINDOW_MS);
	const dedupStart = new Date(now - SURGE_DEDUP_MS);

	const [recentViolationCount, recentSurgeAlert] = await Promise.all([
		Violation.countDocuments({
			orgId,
			platform,
			detectedAt: { $gte: windowStart },
		}),
		Alert.findOne({
			orgId,
			type: 'platform_surge',
			title: `Platform surge on ${platform}`,
			createdAt: { $gte: dedupStart },
		})
			.select('_id')
			.lean(),
	]);

	return recentViolationCount >= 5 && !recentSurgeAlert;
}

export async function createAlertFromViolation({ orgId, violationId, platform, matchConfidence }) {
	const alerts = [
		{
			orgId,
			violationId,
			type: 'new_violation',
			severity: 'medium',
			title: 'New violation detected',
			message: `A new violation was detected on ${platform}.`,
			channels: ['in-app'],
		},
	];

	if (Number(matchConfidence || 0) > 70) {
		alerts.push({
			orgId,
			violationId,
			type: 'high_confidence',
			severity: 'high',
			title: 'High-confidence violation',
			message: `A high-confidence match was found on ${platform}.`,
			channels: ['in-app'],
		});
	}

	if (await shouldTriggerPlatformSurgeAlert({ orgId, platform })) {
		alerts.push({
			orgId,
			violationId: null,
			type: 'platform_surge',
			severity: 'critical',
			title: `Platform surge on ${platform}`,
			message: `Multiple violations were detected on ${platform} within the last hour.`,
			channels: ['in-app'],
		});
	}

	const insertedAlerts = await Alert.insertMany(alerts);
	const unreadCount = await getUnreadAlertCount(orgId);
	emitAlertsCreated({ orgId, alerts: insertedAlerts, unreadCount });

	return insertedAlerts;
}

export async function listAlertsByOrg({ orgId, page = 1, limit = 10, severity = '', type = '', read = null }) {

	const skip = (page - 1) * limit;
	const query = { orgId };

	if (severity) {
		query.severity = severity;
	}

	if (type) {
		query.type = type;
	}

	if (read !== null) {
		query.read = read;
	}

	const [items, total, unreadCount] = await Promise.all([
		Alert.find(query)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		Alert.countDocuments(query),
		Alert.countDocuments({ orgId, read: false }),
	]);

	return {
		items,
		total,
		page,
		limit,
		totalPages: Math.max(1, Math.ceil(total / limit)),
		unreadCount,
	};
}

export async function markAlertsRead({ orgId, alertIds }) {
	const result = await Alert.updateMany(
		{ orgId, _id: { $in: alertIds } },
		{ $set: { read: true } },
	);

	return result.modifiedCount || 0;
}

export async function markAllAlertsRead({ orgId }) {
	const result = await Alert.updateMany(
		{ orgId, read: false },
		{ $set: { read: true } },
	);

	return result.modifiedCount || 0;
}

export async function getUnreadAlertCount(orgId) {
	return Alert.countDocuments({ orgId, read: false });
}
