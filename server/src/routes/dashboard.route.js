import { Router } from 'express';

import { getDashboardStatsController } from '../controllers/dashboard.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const dashboardRouter = Router();

dashboardRouter.get('/stats', verifyToken, getDashboardStatsController);

export default dashboardRouter;