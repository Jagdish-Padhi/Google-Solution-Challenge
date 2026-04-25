import { Router } from 'express';

import authRouter from './auth.route.js';
import assetsRouter from './assets.route.js';
import dashboardRouter from './dashboard.route.js';
import alertsRouter from './alerts.route.js';
import healthRouter from './health.route.js';
import scansRouter from './scans.route.js';
import userRouter from './user.route.js';
import violationsRouter from './violations.route.js';
import orgsRouter from './orgs.route.js';
import digestRouter from './digest.route.js';

const router = Router();

router.use(healthRouter);
router.use('/auth', authRouter);
router.use('/assets', assetsRouter);
router.use('/dashboard', dashboardRouter);
router.use('/alerts', alertsRouter);
router.use('/scans', scansRouter);
router.use('/violations', violationsRouter);
router.use('/users', userRouter);
router.use('/orgs', orgsRouter);
router.use('/digest', digestRouter);

export default router;
