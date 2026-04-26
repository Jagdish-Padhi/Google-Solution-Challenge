import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';

import {
	deleteAssetController,
	getAssetByIdController,
	listAssetsController,
	retryAssetController,
	suggestAssetKeywordsController,
	updateAssetController,
	uploadAssetController,
} from '../controllers/assets.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

import { storage } from '../config/cloudinary.js';

const router = Router();

const acceptedMimeTypes = new Set([
	'video/mp4',
	'video/quicktime',
	'image/jpeg',
	'image/png',
]);

const upload = multer({
	storage,
	limits: {
		fileSize: 200 * 1024 * 1024,
	},
	fileFilter: (_req, file, callback) => {
		if (!acceptedMimeTypes.has(file.mimetype)) {
			const validationError = new Error('Unsupported file format. Please upload MP4, MOV, JPEG, or PNG.');
			validationError.statusCode = 400;
			callback(validationError);
			return;
		}

		callback(null, true);
	},
});

router.use(verifyToken);

router.post('/upload', upload.single('file'), uploadAssetController);
router.get('/', listAssetsController);
router.post('/:id/suggest-keywords', suggestAssetKeywordsController);
router.post('/:id/retry', retryAssetController);
router.get('/:id', getAssetByIdController);
router.patch('/:id/update', updateAssetController);
router.delete('/:id', deleteAssetController);

export default router;