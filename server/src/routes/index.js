import { Router } from 'express';

import authRouter from './auth.route.js';
import assetsRouter from './assets.route.js';
import dashboardRouter from './dashboard.route.js';
import healthRouter from './health.route.js';
import userRouter from './user.route.js';

const router = Router();

router.use(healthRouter);
router.use('/auth', authRouter);
router.use('/assets', assetsRouter);
router.use('/dashboard', dashboardRouter);
router.use('/users', userRouter);

export default router;
