import { getOrganizationById } from '../services/auth.service.js';
import { getDashboardAssetStats } from '../services/assets.service.js';

export async function getDashboardStatsController(req, res, next) {
	try {
		const organization = await getOrganizationById(req.auth.orgId);
		const assetStats = await getDashboardAssetStats(req.auth.orgId);

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
				activeScans: assetStats.activeScans,
				violations: assetStats.violations,
				alertsSent: 0,
			},
		});
	} catch (error) {
		return next(error);
	}
}