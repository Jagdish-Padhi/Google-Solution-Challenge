import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import {
	getOrganizationById,
	updateOrganizationNotificationPrefs,
} from '../services/auth.service.js';

const organizationRouter = Router();

organizationRouter.use(verifyToken);


organizationRouter.get('/me', async (req, res, next) => {
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

organizationRouter.patch('/notification-prefs', async (req, res, next) => {
	try {
		const updated = await updateOrganizationNotificationPrefs({
			organizationId: req.auth.orgId,
			payload: req.body,
		});

		return res.status(200).json({
			message: 'Notification preferences updated successfully.',
			notificationPrefs: updated?.notificationPrefs,
		});
	} catch (error) {
		return next(error);
	}
});

export default organizationRouter;
