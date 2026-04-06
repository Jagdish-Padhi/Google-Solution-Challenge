import { getOrganizationById } from '../services/auth.service.js';
import { getUnreadAlertCount } from '../services/alerts.service.js';
import { getDashboardAssetStats } from '../services/assets.service.js';
import { countRunningScans } from '../services/scans.service.js';
import Violation from '../models/violation.model.js';

export async function getDashboardStatsController(req, res, next) {
	try {
		const organization = await getOrganizationById(req.auth.orgId);
		const [assetStats, runningScans, violations] = await Promise.all([
			getDashboardAssetStats(req.auth.orgId),
			countRunningScans(req.auth.orgId),
			Violation.countDocuments({ orgId: req.auth.orgId }),
		]);
		const unreadAlerts = await getUnreadAlertCount(req.auth.orgId);

		if (!organization) {
			return res.status(404).json({ message: 'Organization not found.' });
		}

		return res.status(200).json({
			organization: {
				id: organization._id.toString(),
				orgName: organization.orgName,
				email: organization.email,
				plan: organization.plan,
			},
			stats: {
				totalAssets: assetStats.totalAssets,
				activeScans: runningScans,
				violations,
				alertsSent: unreadAlerts,
			},
		});
	} catch (error) {
		return next(error);
	}
}