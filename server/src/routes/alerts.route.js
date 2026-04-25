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

/**
 * GET /api/alerts
 * Paginated alert list with filters
 * Query: page, limit, severity, type, read
 */
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

/**
 * GET /api/alerts/unread-count
 * Returns unread count for navbar badge
 */
router.get('/unread-count', async (req, res, next) => {
  try {
    const unreadCount = await getUnreadAlertCount(req.auth.orgId);
    res.json({ unreadCount });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/alerts/read-all
 * Mark all alerts as read
 */
router.patch('/read-all', async (req, res, next) => {
  try {
    const modifiedCount = await markAllAlertsRead({ orgId: req.auth.orgId });
    res.json({ success: true, modifiedCount });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/alerts/read
 * Mark specific alerts as read (array of IDs)
 * Body: { alertIds: [...] }
 */
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

/**
 * PATCH /api/alerts/:id/read
 * Mark single alert as read
 */
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
