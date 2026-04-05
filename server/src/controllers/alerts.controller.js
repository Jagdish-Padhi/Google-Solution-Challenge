import {
	getUnreadAlertCount,
	listAlertsByOrg,
	markAllAlertsRead,
	markAlertsRead,
} from '../services/alerts.service.js';
import { emitAlertsUpdated } from '../config/socket.js';
import {
	validateListAlertsQuery,
	validateMarkReadPayload,
} from '../validators/alerts.validator.js';

export async function listAlertsController(req, res, next) {
	try {
		const { page, limit, severity, type, read } = validateListAlertsQuery(req.query);
		const result = await listAlertsByOrg({
			orgId: req.auth.orgId,
			page,
			limit,
			severity,
			type,
			read,
		});

		return res.status(200).json(result);
	} catch (error) {
		return next(error);
	}
}

export async function getUnreadAlertCountController(req, res, next) {
	try {
		const unreadCount = await getUnreadAlertCount(req.auth.orgId);
		return res.status(200).json({ unreadCount });
	} catch (error) {
		return next(error);
	}
}

export async function markAlertsReadController(req, res, next) {
	try {
		const { alertIds } = validateMarkReadPayload(req.body);
		const modifiedCount = await markAlertsRead({
			orgId: req.auth.orgId,
			alertIds,
		});
		const unreadCount = await getUnreadAlertCount(req.auth.orgId);
		emitAlertsUpdated({ orgId: req.auth.orgId, unreadCount });

		return res.status(200).json({
			message: 'Alerts marked as read.',
			modifiedCount,
		});
	} catch (error) {
		return next(error);
	}
}

export async function markAllAlertsReadController(req, res, next) {
	try {
		const modifiedCount = await markAllAlertsRead({ orgId: req.auth.orgId });
		const unreadCount = await getUnreadAlertCount(req.auth.orgId);
		emitAlertsUpdated({ orgId: req.auth.orgId, unreadCount });
		return res.status(200).json({
			message: 'All alerts marked as read.',
			modifiedCount,
		});
	} catch (error) {
		return next(error);
	}
}
