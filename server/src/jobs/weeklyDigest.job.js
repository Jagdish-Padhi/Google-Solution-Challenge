import cron from 'node-cron';
import Organization from '../models/organization.model.js';
import Violation from '../models/violation.model.js';
// TODO: Create emailService.js with sendWeeklyDigestEmail function
// import { sendWeeklyDigestEmail } from '../services/emailService.js';

/**
 * Core digest logic for a single org.
 * Exported so it can be called manually (e.g. from the /send-digest API route).
 * Returns a summary object: { violationCount, sent, skipped }
 */
export async function runDigestForOrg(org) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const violations = await Violation.find({
    orgId: org._id,
    detectedAt: { $gte: sevenDaysAgo },
  }).lean();

  if (violations.length === 0) {
    return { violationCount: 0, sent: false, skipped: true };
  }

  // TODO: Send actual email once emailService.js is implemented
  // await sendWeeklyDigestEmail(org, violations);

  // Stamp the last digest timestamp on the org record
  await Organization.findByIdAndUpdate(org._id, {
    lastDigestSentAt: new Date(),
  });

  return { violationCount: violations.length, sent: true, skipped: false };
}

/**
 * Weekly digest job — runs every Monday at 9:00 AM.
 * Per plan: aggregate last 7 days violations per org, send digest email
 * to orgs that have emailDigest: true.
 */
export function startWeeklyDigestJob() {
  // Cron: minute hour day-of-month month day-of-week
  // '0 9 * * 1' = every Monday at 09:00
  cron.schedule('0 9 * * 1', async () => {
    console.log('[weeklyDigest] Starting weekly digest job...');

    try {
      // Only orgs with digest emails enabled
      const orgs = await Organization.find({
        'notificationPrefs.emailDigest': true,
      }).select('email orgName notificationPrefs lastDigestSentAt');

      let sent = 0;
      let skipped = 0;

      for (const org of orgs) {
        try {
          const result = await runDigestForOrg(org);
          if (result.sent) sent++;
          else skipped++;
        } catch (orgError) {
          console.error(
            `[weeklyDigest] Failed for org ${org._id}:`,
            orgError.message
          );
        }
      }

      console.log(
        `[weeklyDigest] Done — sent: ${sent}, skipped (no violations): ${skipped}`
      );
    } catch (error) {
      console.error('[weeklyDigest] Job failed:', error.message);
    }
  });

  console.log('[weeklyDigest] Scheduled — runs every Monday at 09:00');
}
