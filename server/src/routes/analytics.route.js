import { Router } from 'express';

import {
	getAnalyticsKPIsController,
	getAnalyticsOverviewController,
	getAnalyticsPlatformsController,
	getAnalyticsTimelineController,
	getConfidenceCalibrationController,
	getPropagationAnalyticsController,
} from '../controllers/analytics.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const analyticsRouter = Router();

analyticsRouter.use(verifyToken);

analyticsRouter.get('/overview', getAnalyticsOverviewController);
analyticsRouter.get('/timeline', getAnalyticsTimelineController);
analyticsRouter.get('/platforms', getAnalyticsPlatformsController);
analyticsRouter.get('/kpis', getAnalyticsKPIsController);
analyticsRouter.get('/calibration', getConfidenceCalibrationController);
analyticsRouter.get('/propagation', getPropagationAnalyticsController);

export default analyticsRouter;
