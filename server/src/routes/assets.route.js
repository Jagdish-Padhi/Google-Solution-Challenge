import { Router } from 'express';
import multer from 'multer';

import {
	deleteAssetController,
	getAssetByIdController,
	listAssetsController,
	uploadAssetController,
} from '../controllers/assets.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = Router();

const acceptedMimeTypes = new Set([
	'video/mp4',
	'video/quicktime',
	'image/jpeg',
	'image/png',
]);

const upload = multer({
	dest: 'uploads/',
	limits: {
		fileSize: 200 * 1024 * 1024,
	},
	fileFilter: (_req, file, callback) => {
		if (!acceptedMimeTypes.has(file.mimetype)) {
			callback(new Error('Unsupported file format. Please upload MP4, MOV, JPEG, or PNG.'));
			return;
		}

		callback(null, true);
	},
});

router.use(verifyToken);

router.post('/upload', upload.single('file'), uploadAssetController);
router.get('/', listAssetsController);
router.get('/:id', getAssetByIdController);
router.delete('/:id', deleteAssetController);

export default router;