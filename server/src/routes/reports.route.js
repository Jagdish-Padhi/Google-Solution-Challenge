import { Router } from 'express';

import { generateReportController, listReportsController } from '../controllers/reports.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const reportsRouter = Router();

reportsRouter.use(verifyToken);

reportsRouter.post('/generate', generateReportController);
reportsRouter.get('/', listReportsController);

export default reportsRouter;
