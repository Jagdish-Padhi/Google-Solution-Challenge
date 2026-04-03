import { Router } from 'express';

import {
	getScanStatusController,
	listScanResultsController,
	listScansController,
	startScanController,
} from '../controllers/scans.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = Router();

router.use(verifyToken);

router.post('/start', startScanController);
router.get('/:jobId/status', getScanStatusController);
router.get('/:jobId/results', listScanResultsController);
router.get('/', listScansController);

export default router;