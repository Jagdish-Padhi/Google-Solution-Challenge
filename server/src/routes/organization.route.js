import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import {
	getOrganizationById,
	updateOrganizationNotificationPrefs,
} from '../services/auth.service.js';
import { runDigestForOrg } from '../jobs/weeklyDigest.job.js';
import Organization from '../models/organization.model.js';

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
				userType: organization.userType || 'broadcaster',
				notificationPrefs: organization.notificationPrefs,
				createdAt: organization.createdAt,
				lastLoginAt: organization.lastLoginAt,
				lastDigestSentAt: organization.lastDigestSentAt || null,
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

/**
 * POST /organization/send-digest
 * Manually trigger the weekly digest for the current org.
 * Used in the settings page for demo purposes.
 */
organizationRouter.post('/send-digest', async (req, res, next) => {
	try {
		const org = await Organization.findById(req.auth.orgId)
			.select('email orgName notificationPrefs lastDigestSentAt _id');

		if (!org) {
			return res.status(404).json({ message: 'Organization not found.' });
		}

		const result = await runDigestForOrg(org);

		// Re-fetch the updated org to return the fresh lastDigestSentAt
		const updated = await Organization.findById(req.auth.orgId)
			.select('lastDigestSentAt');

		return res.status(200).json({
			message: result.skipped
				? 'No violations in the last 7 days — digest skipped.'
				: `Weekly digest prepared. ${result.violationCount} violation(s) included.`,
			violationCount: result.violationCount,
			sent: result.sent,
			skipped: result.skipped,
			lastDigestSentAt: updated?.lastDigestSentAt || null,
		});
	} catch (error) {
		return next(error);
	}
});

export default organizationRouter;

