import {
	createAsset,
	enrichAssetFingerprint,
	getAssetById,
	listAssetsByOrg,
	softDeleteAsset,
} from '../services/assets.service.js';
import { validateAssetUploadPayload, validatePaginationQuery } from '../validators/assets.validator.js';

function getBaseAssetUrl(req) {
	const origin = `${req.protocol}://${req.get('host')}`;
	return `${origin}/uploads`;
}

export async function uploadAssetController(req, res, next) {
	try {
		if (!req.file) {
			return res.status(400).json({ message: 'Asset file is required.' });
		}

		const { title } = validateAssetUploadPayload(req.body);
		const publicUrl = `${getBaseAssetUrl(req)}/${req.file.filename}`;

		const asset = await createAsset({
			orgId: req.auth.orgId,
			title,
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