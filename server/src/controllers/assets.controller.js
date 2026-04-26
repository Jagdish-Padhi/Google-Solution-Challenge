import {
	createAsset,
	enrichAssetFingerprint,
	getAssetById,
	listAssetsByOrg,
	retryFingerprint,
	softDeleteAsset,
	suggestKeywordsForAsset,
	updateAsset,
} from '../services/assets.service.js';
import {
	validateAssetUpdatePayload,
	validateAssetUploadPayload,
	validatePaginationQuery,
} from '../validators/assets.validator.js';

export async function uploadAssetController(req, res, next) {
	try {
		if (!req.file) {
			return res.status(400).json({ message: 'Asset file is required.' });
		}

		const { title, description } = validateAssetUploadPayload(req.body);
		const publicUrl = req.file.path; // Cloudinary URL

		const asset = await createAsset({
			orgId: req.auth.orgId,
			title,
			description,
			file: req.file,
			publicUrl,
		});

		// Run fingerprint generation in the background so upload stays responsive.
		void enrichAssetFingerprint({
			assetId: asset._id.toString(),
			sourceUrl: publicUrl,
		});

		return res.status(201).json({
			message: 'Asset uploaded successfully. Fingerprint processing started.',
			asset,
		});
	} catch (error) {
		return next(error);
	}
}

export async function listAssetsController(req, res, next) {
	try {
		const { page, limit } = validatePaginationQuery(req.query);
		const result = await listAssetsByOrg({ orgId: req.auth.orgId, page, limit });

		return res.status(200).json(result);
	} catch (error) {
		return next(error);
	}
}

export async function getAssetByIdController(req, res, next) {
	try {
		const asset = await getAssetById({
			orgId: req.auth.orgId,
			assetId: req.params.id,
		});

		if (!asset) {
			return res.status(404).json({ message: 'Asset not found.' });
		}

		return res.status(200).json({ asset });
	} catch (error) {
		return next(error);
	}
}

export async function deleteAssetController(req, res, next) {
	try {
		const asset = await softDeleteAsset({
			orgId: req.auth.orgId,
			assetId: req.params.id,
		});

		if (!asset) {
			return res.status(404).json({ message: 'Asset not found.' });
		}

		return res.status(200).json({
			message: 'Asset deleted successfully.',
		});
	} catch (error) {
		return next(error);
	}
}

export async function suggestAssetKeywordsController(req, res, next) {
	try {
		const requestedCount = Number.parseInt(req.body?.count || '10', 10);
		const count = Number.isNaN(requestedCount) ? 10 : Math.min(20, Math.max(5, requestedCount));

		const result = await suggestKeywordsForAsset({
			orgId: req.auth.orgId,
			assetId: req.params.id,
			count,
		});

		return res.status(200).json(result);
	} catch (error) {
		return next(error);
	}
}

export async function updateAssetController(req, res, next) {
	try {
		const updates = validateAssetUpdatePayload(req.body);
		const asset = await updateAsset({
			orgId: req.auth.orgId,
			assetId: req.params.id,
			updates,
		});

		if (!asset) {
			return res.status(404).json({ message: 'Asset not found.' });
		}

		return res.status(200).json({
			message: 'Asset updated successfully.',
			asset,
		});
	} catch (error) {
		return next(error);
	}
}

export async function retryAssetController(req, res, next) {
	try {
		const asset = await retryFingerprint({
			orgId: req.auth.orgId,
			assetId: req.params.id,
		});

		return res.status(200).json({
			message: 'Fingerprint retry started.',
			asset,
		});
	} catch (error) {
		return next(error);
	}
}