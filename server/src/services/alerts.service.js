import Alert from '../models/alert.model.js';
import { emitAlertsCreated } from '../config/socket.js';

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
