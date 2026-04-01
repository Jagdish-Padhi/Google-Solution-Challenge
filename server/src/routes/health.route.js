import { Router } from 'express';

import { healthController } from '../controllers/health.controller.js';

const healthRouter = Router();

healthRouter.get('/health', healthController);

export default healthRouter;
