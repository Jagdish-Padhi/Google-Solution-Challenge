import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import Organization from '../models/organization.model.js';

const router = Router();

router.use(verifyToken);

/**
 * GET /api/orgs/notification-prefs
 * Get current notification preferences for logged-in org
 */
router.get('/notification-prefs', async (req, res, next) => {
  try {
    const org = await Organization.findById(req.user.orgId).select(
      'notificationPrefs'
    );
    res.json({ notificationPrefs: org?.notificationPrefs ?? {} });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/orgs/notification-prefs
 * Update notification preferences
 * Body: { emailOnHighConfidence, emailDigest, inAppAlerts }
 */
router.patch('/notification-prefs', async (req, res, next) => {
  try {
    const { emailOnHighConfidence, emailDigest, inAppAlerts } = req.body;

    const updated = await Organization.findByIdAndUpdate(
      req.user.orgId,
      {
        $set: {
          'notificationPrefs.emailOnHighConfidence': emailOnHighConfidence,
          'notificationPrefs.emailDigest': emailDigest,
          'notificationPrefs.inAppAlerts': inAppAlerts,
        },
      },
      { new: true, select: 'notificationPrefs' }
    );

    res.json({ success: true, notificationPrefs: updated.notificationPrefs });
  } catch (error) {
    next(error);
  }
});

export default router;
