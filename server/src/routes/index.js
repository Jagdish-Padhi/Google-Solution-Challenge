import { Router } from 'express';

import authRouter from './auth.route.js';
import analyticsRouter from './analytics.route.js';
import assetsRouter from './assets.route.js';
import dashboardRouter from './dashboard.route.js';
import alertsRouter from './alerts.route.js';
import healthRouter from './health.route.js';
import reportsRouter from './reports.route.js';
import scansRouter from './scans.route.js';
import organizationRouter from './organization.route.js';
import violationsRouter from './violations.route.js';
import digestRouter from './digest.route.js';

const router = Router();

router.use(healthRouter);
router.use('/auth', authRouter);
router.use('/analytics', analyticsRouter);
router.use('/assets', assetsRouter);
router.use('/dashboard', dashboardRouter);
router.use('/alerts', alertsRouter);
router.use('/reports', reportsRouter);
router.use('/scans', scansRouter);
router.use('/violations', violationsRouter);
router.use('/organization', organizationRouter);
router.use('/digest', digestRouter);

export default router;
