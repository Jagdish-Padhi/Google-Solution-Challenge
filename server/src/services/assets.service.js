import Asset from '../models/asset.model.js';

export function inferAssetType(mimeType = '') {
	if (mimeType.startsWith('image/')) {
		return 'image';
	}

	if (mimeType.startsWith('video/')) {
		return 'video';
	}

	return 'highlight';
}

export async function createAsset({ orgId, title, file, publicUrl }) {
	const asset = await Asset.create({
		orgId,
		title,
		type: inferAssetType(file.mimetype),
		storageKey: file.filename,
		gcsUrl: publicUrl,
		thumbnailUrl: null,
		fileSize: file.size,
		status: 'active',
		uploadedAt: new Date(),
	});

	return asset;
}

export async function listAssetsByOrg({ orgId, page = 1, limit = 12 }) {
	const skip = (page - 1) * limit;

	const [items, total] = await Promise.all([
		Asset.find({ orgId, status: { $ne: 'deleted' } })
			.sort({ uploadedAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		Asset.countDocuments({ orgId, status: { $ne: 'deleted' } }),
	]);

	return {
		items,
		total,
		page,
		limit,
		totalPages: Math.max(1, Math.ceil(total / limit)),
	};
}

export async function getAssetById({ orgId, assetId }) {
	return Asset.findOne({ _id: assetId, orgId, status: { $ne: 'deleted' } }).lean();
}

export async function softDeleteAsset({ orgId, assetId }) {
	const deletedAsset = await Asset.findOneAndUpdate(
		{ _id: assetId, orgId, status: { $ne: 'deleted' } },
		{ status: 'deleted' },
		{ new: true },
	).lean();

	return deletedAsset;
}

export async function getDashboardAssetStats(orgId) {
	const [totalAssets, activeScans, violationsAgg] = await Promise.all([
		Asset.countDocuments({ orgId, status: { $ne: 'deleted' } }),
		Asset.countDocuments({ orgId, status: 'processing' }),
		Asset.aggregate([
			{ $match: { orgId, status: { $ne: 'deleted' } } },
			{ $group: { _id: null, totalViolations: { $sum: '$violationsFound' } } },
		]),
	]);

	return {
		totalAssets,
		activeScans,
		violations: violationsAgg[0]?.totalViolations || 0,
	};
}