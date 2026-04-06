import { Router } from 'express';

import {
	createViolationScreenshotController,
	getViolationByIdController,
	listViolationsController,
	updateViolationStatusController,
} from '../controllers/violations.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = Router();

router.use(verifyToken);

router.get('/', listViolationsController);
router.get('/:id', getViolationByIdController);
router.patch('/:id/status', updateViolationStatusController);
router.post('/:id/screenshot', createViolationScreenshotController);

export default router;
