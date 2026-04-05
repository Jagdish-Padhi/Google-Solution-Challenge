import { Router } from 'express';

import {
	getUnreadAlertCountController,
	listAlertsController,
	markAllAlertsReadController,
	markAlertsReadController,
} from '../controllers/alerts.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = Router();

router.use(verifyToken);

router.get('/unread-count', getUnreadAlertCountController);
router.get('/', listAlertsController);
router.patch('/read', markAlertsReadController);
router.patch('/read-all', markAllAlertsReadController);

export default router;
