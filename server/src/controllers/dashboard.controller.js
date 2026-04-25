import { getOrganizationById } from '../services/auth.service.js';
import { getUnreadAlertCount } from '../services/alerts.service.js';
import { getDashboardAssetStats } from '../services/assets.service.js';
import { countRunningScans } from '../services/scans.service.js';
import Violation from '../models/violation.model.js';
import ScanResult from '../models/scanResult.model.js';

export async function getDashboardStatsController(req, res, next) {
	try {
		const organization = await getOrganizationById(req.auth.orgId);
		const [assetStats, runningScans, violationsCount, recentViolations, discoveryPulse, unreadAlerts] = await Promise.all([
			getDashboardAssetStats(req.auth.orgId),
			countRunningScans(req.auth.orgId),
			Violation.countDocuments({ orgId: req.auth.orgId }),
			Violation.find({ orgId: req.auth.orgId })
				.sort({ createdAt: -1 })
				.limit(5)
				.populate('assetId', 'title')
				.lean(),
			ScanResult.find({ orgId: req.auth.orgId })
				.sort({ createdAt: -1 })
				.limit(5)
				.lean(),
			getUnreadAlertCount(req.auth.orgId),
		]);

		const resolvedViolations = await Violation.countDocuments({ orgId: req.auth.orgId, status: 'resolved' });
		const protectionScore = violationsCount > 0 ? Math.round((resolvedViolations / violationsCount) * 100) : 100;

		const platformStats = await ScanResult.aggregate([
			{ $match: { orgId: organization._id } },
			{ $group: { _id: '$platform', count: { $sum: 1 } } },
		]);

		const coverage = {
			youtube: platformStats.find((s) => s._id === 'youtube')?.count || 0,
			twitter: platformStats.find((s) => s._id === 'twitter')?.count || 0,
			telegram: platformStats.find((s) => s._id === 'telegram')?.count || 0,
			web: platformStats.find((s) => s._id === 'web')?.count || 0,
		};

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
				violations: violationsCount,
				alertsSent: unreadAlerts,
				protectionScore,
			},
			recentViolations,
			discoveryPulse,
			coverage,
		});
	} catch (error) {
		return next(error);
	}
}