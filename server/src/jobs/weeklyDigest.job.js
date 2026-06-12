import cron from 'node-cron';
import Organization from '../models/organization.model.js';
import Violation from '../models/violation.model.js';
// TODO: Use sendWeeklyDigestEmail from '../services/email.service.js' when ready

// Runs weekly digest generation for a single organization
export async function runDigestForOrg(org) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const violations = await Violation.find({
    orgId: org._id,
    detectedAt: { $gte: sevenDaysAgo },
  }).lean();

  if (violations.length === 0) {
    return { violationCount: 0, sent: false, skipped: true };
  }

  // TODO: Send email once integration is fully verified
  // const { sendWeeklyDigestEmail } = await import('../services/email.service.js');
  // await sendWeeklyDigestEmail(org, violations);

  await Organization.findByIdAndUpdate(org._id, {
    lastDigestSentAt: new Date(),
  });

  return { violationCount: violations.length, sent: true, skipped: false };
}

// Starts weekly cron job at 9:00 AM every Monday
export function startWeeklyDigestJob() {
  cron.schedule('0 9 * * 1', async () => {
    console.log('[weeklyDigest] Starting weekly digest job...');

    try {
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

