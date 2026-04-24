import { Router } from 'express';

import {
	getAnalyticsKPIsController,
	getAnalyticsOverviewController,
	getAnalyticsPlatformsController,
	getAnalyticsTimelineController,
} from '../controllers/analytics.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const analyticsRouter = Router();

analyticsRouter.use(verifyToken);

analyticsRouter.get('/overview', getAnalyticsOverviewController);
analyticsRouter.get('/timeline', getAnalyticsTimelineController);
analyticsRouter.get('/platforms', getAnalyticsPlatformsController);
analyticsRouter.get('/kpis', getAnalyticsKPIsController);

export default analyticsRouter;
