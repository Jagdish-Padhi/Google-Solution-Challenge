import { Router } from 'express';

import { verifyToken } from '../middlewares/verifyToken.js';
import {
	getOrganizationById,
	updateOrganizationNotificationPrefs,
} from '../services/auth.service.js';

const userRouter = Router();

userRouter.get('/me', verifyToken, async (req, res, next) => {
	try {
		const organization = await getOrganizationById(req.auth.orgId);

		if (!organization) {
			return res.status(404).json({ message: 'Organization not found.' });
		}

		return res.status(200).json({
			organization: {
				id: organization._id.toString(),
				orgName: organization.orgName,
				email: organization.email,
				plan: organization.plan,
				notificationPrefs: organization.notificationPrefs,
				createdAt: organization.createdAt,
				lastLoginAt: organization.lastLoginAt,
			},
		});
	} catch (error) {
		return next(error);
	}
});

userRouter.patch('/notification-prefs', verifyToken, async (req, res, next) => {
	try {
		const allowedKeys = ['emailOnHighConfidence', 'emailDigest', 'inAppAlerts'];
		const payload = Object.fromEntries(
			Object.entries(req.body || {}).filter(([key]) => allowedKeys.includes(key)),
		);

		if (Object.keys(payload).length === 0) {
			return res.status(400).json({
				message: 'At least one notification preference field is required.',
			});
		}

		const organization = await getOrganizationById(req.auth.orgId);
		if (!organization) {
			return res.status(404).json({ message: 'Organization not found.' });
		}

		const mergedPrefs = {
			emailOnHighConfidence:
				payload.emailOnHighConfidence ?? organization.notificationPrefs?.emailOnHighConfidence ?? true,
			emailDigest: payload.emailDigest ?? organization.notificationPrefs?.emailDigest ?? false,
			inAppAlerts: payload.inAppAlerts ?? organization.notificationPrefs?.inAppAlerts ?? true,
		};

		const updated = await updateOrganizationNotificationPrefs({
			organizationId: req.auth.orgId,
			payload: mergedPrefs,
		});

		return res.status(200).json({
			message: 'Notification preferences updated successfully.',
			notificationPrefs: updated?.notificationPrefs,
		});
	} catch (error) {
		return next(error);
	}
});

export default userRouter;
