import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import {
  listAlertsByOrg,
  markAlertsRead,
  markAllAlertsRead,
  getUnreadAlertCount,
} from '../services/alerts.service.js';

const router = Router();

router.use(verifyToken);

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, severity = '', type = '', read } = req.query;
    const readFilter = read === 'true' ? true : read === 'false' ? false : null;

    const result = await listAlertsByOrg({
      orgId: req.auth.orgId,
      page: Number(page),
      limit: Number(limit),
      severity,
      type,
      read: readFilter,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/unread-count', async (req, res, next) => {
  try {
    const unreadCount = await getUnreadAlertCount(req.auth.orgId);
    res.json({ unreadCount });
  } catch (error) {
    next(error);
  }
});

router.patch('/read-all', async (req, res, next) => {
  try {
    const modifiedCount = await markAllAlertsRead({ orgId: req.auth.orgId });
    res.json({ success: true, modifiedCount });
  } catch (error) {
    next(error);
  }
});

router.patch('/read', async (req, res, next) => {
  try {
    const { alertIds = [] } = req.body;
    const modifiedCount = await markAlertsRead({
      orgId: req.auth.orgId,
      alertIds,
    });
    res.json({ success: true, modifiedCount });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const modifiedCount = await markAlertsRead({
      orgId: req.auth.orgId,
      alertIds: [req.params.id],
    });
    res.json({ success: true, modifiedCount });
  } catch (error) {
    next(error);
  }
});

export default router;
