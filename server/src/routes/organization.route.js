import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import {
	getOrganizationById,
	updateOrganizationNotificationPrefs,
} from '../services/auth.service.js';
import { runDigestForOrg } from '../jobs/weeklyDigest.job.js';
import Organization from '../models/organization.model.js';
import { isValidEmail } from '../validators/common.js';

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
				email: req.auth.email || organization.email,
				plan: organization.plan,
				userType: organization.userType || 'broadcaster',
				role: (req.auth.email || organization.email).includes('legal') ? 'legal' : 'admin',
				members: organization.members || [],
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

organizationRouter.post('/invite', async (req, res, next) => {
	try {
		// Only admin can invite (or default main user)
		// For this demo, we'll assume the logged-in user can invite if they are the primary org owner
		const { email, role } = req.body;
		if (!email || !role) {
			return res.status(400).json({ message: 'Email and role are required.' });
		}

		if (!isValidEmail(email)) {
			return res.status(400).json({ message: 'Please enter a valid email address.' });
		}

		const allowedRoles = new Set(['admin', 'analyst', 'legal']);
		if (!allowedRoles.has(role)) {
			return res.status(400).json({ message: `Invalid role. Allowed: ${[...allowedRoles].join(', ')}.` });
		}

		const org = await Organization.findById(req.auth.orgId);
		if (!org) {
			return res.status(404).json({ message: 'Organization not found.' });
		}

		if (org.members.length >= 20) {
			return res.status(400).json({ message: 'Maximum team size of 20 members reached.' });
		}

		// check if already a member
		if (org.members.some((m) => m.email === email)) {
			return res.status(400).json({ message: 'User is already a member.' });
		}

		org.members.push({ email, role, inviteStatus: 'pending', joinedAt: null });
		await org.save();

		return res.status(200).json({
			message: 'Invitation sent.',
			members: org.members,
		});
	} catch (error) {
		return next(error);
	}
});

organizationRouter.delete('/member/:email', async (req, res, next) => {
	try {
		const { email } = req.params;
		const org = await Organization.findById(req.auth.orgId);
		if (!org) return res.status(404).json({ message: 'Organization not found.' });

		org.members = org.members.filter(m => m.email !== email);
		await org.save();

		return res.status(200).json({ message: 'Member removed.', members: org.members });
	} catch (error) {
		return next(error);
	}
});

organizationRouter.patch('/member/:email/role', async (req, res, next) => {
	try {
		const { email } = req.params;
		const { role } = req.body;
		if (!role) return res.status(400).json({ message: 'Role is required.' });

		const allowedRoles = new Set(['admin', 'analyst', 'legal']);
		if (!allowedRoles.has(role)) {
			return res.status(400).json({ message: `Invalid role. Allowed: ${[...allowedRoles].join(', ')}.` });
		}

		const org = await Organization.findById(req.auth.orgId);
		if (!org) return res.status(404).json({ message: 'Organization not found.' });

		const member = org.members.find(m => m.email === email);
		if (!member) return res.status(404).json({ message: 'Member not found.' });

		member.role = role;
		await org.save();

		return res.status(200).json({ message: 'Member role updated.', members: org.members });
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

