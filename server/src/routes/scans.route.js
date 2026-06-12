import { Router } from 'express';

import {
	getScanStatusController,
	listScanResultsController,
	listScansController,
	retryScanController,
	runScheduledScansNowController,
	startScanController,
	stopScanController,
} from '../controllers/scans.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = Router();

router.use(verifyToken);

router.post('/start', startScanController);
router.post('/run-scheduled', runScheduledScansNowController);
router.post('/:jobId/retry', retryScanController);
router.post('/:jobId/stop', stopScanController);
router.get('/:jobId/status', getScanStatusController);
router.get('/:jobId/results', listScanResultsController);
router.get('/', listScansController);

export default router;