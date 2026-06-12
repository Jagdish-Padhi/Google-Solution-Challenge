import { Router } from 'express';
import { triggerWeeklyDigest } from '../services/alerts.service.js';

const router = Router();

// Triggered by cron-job.org webhook (Every Monday at 09:00)
router.post('/trigger', async (req, res, next) => {
  try {
    // Verify the cron secret so random people can't trigger digests
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (token !== process.env.DIGEST_CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await triggerWeeklyDigest();
    console.log(
      `[digest] Weekly digest triggered — sent: ${result.sent}/${result.total}`
    );

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

export default router;
