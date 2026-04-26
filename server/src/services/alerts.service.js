import Alert from '../models/alert.model.js';
import Organization from '../models/organization.model.js';
import Violation from '../models/violation.model.js';
import { emitAlertsCreated } from '../config/socket.js';
import {
  sendViolationAlertEmail,
  sendSurgeAlertEmail,
} from './email.service.js';

// ─── Core: create alerts from a violation ────────────────────────────────────

export async function createAlertFromViolation({
  orgId,
  violationId,
  platform,
  matchConfidence,
}) {
  const violation = await Violation.findById(violationId).populate('assetId', 'title').lean();
  const assetTitle = violation?.assetId?.title || 'Unknown Asset';

  const alerts = [
    {
      orgId,
      violationId,
      type: 'new_violation',
      severity: 'medium',
      title: 'New violation detected',
      message: `Unauthorized use of "${assetTitle}" was detected on ${platform}.`,
      channels: ['in-app'],
    },
  ];

  if (Number(matchConfidence || 0) > 70) {
    alerts.push({
      orgId,
      violationId,
      type: 'high_confidence',
      severity: 'high',
      title: 'High-confidence violation',
      message: `A high-confidence match (${matchConfidence}%) for "${assetTitle}" was found on ${platform}.`,
      channels: ['in-app', 'email'],
    });
  }

  const insertedAlerts = await Alert.insertMany(alerts);
  const unreadCount = await getUnreadAlertCount(orgId);
  emitAlertsCreated({ orgId, alerts: insertedAlerts, unreadCount });

  // ── Email for high-confidence violations ──
  try {
    if (Number(matchConfidence || 0) > 70) {
      const org = await Organization.findById(orgId).select(
        'email notificationPrefs'
      );
      const emailEnabled =
        org?.notificationPrefs?.emailOnHighConfidence ?? true;

      if (emailEnabled && org?.email) {
        if (violation) {
          await sendViolationAlertEmail(org.email, violation);
        }
      }
    }
  } catch (emailError) {
    // Email failure must never crash the alert pipeline
    console.error('[alertService] Violation email failed:', emailError.message);
  }

  // ── Check for platform surge ──
  await checkPlatformSurge({ orgId, platform });

  return insertedAlerts;
}

// ─── Platform surge detection ─────────────────────────────────────────────────
// Per plan: if 5+ violations from same platform in 1hr → platform_surge CRITICAL alert

export async function checkPlatformSurge({ orgId, platform }) {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentCount = await Violation.countDocuments({
      orgId,
      platform,
      detectedAt: { $gte: oneHourAgo },
    });

    if (recentCount < 5) return;

    // Dedup: only one surge alert per platform per hour
    const existingSurge = await Alert.findOne({
      orgId,
      type: 'platform_surge',
      'metadata.platform': platform,
      createdAt: { $gte: oneHourAgo },
    });
    if (existingSurge) return;

    const surgeAlert = await Alert.create({
      orgId,
      type: 'platform_surge',
      severity: 'critical',
      title: `Piracy surge on ${platform}`,
      message: `Your content appeared ${recentCount} times on ${platform} in the last hour.`,
      channels: ['in-app', 'email'],
      metadata: { platform, count: recentCount },
    });

    const unreadCount = await getUnreadAlertCount(orgId);
    emitAlertsCreated({ orgId, alerts: [surgeAlert], unreadCount });

    // Email surge alert
    const org = await Organization.findById(orgId).select(
      'email orgName notificationPrefs'
    );
    const emailEnabled = org?.notificationPrefs?.emailOnHighConfidence ?? true;
    if (emailEnabled && org?.email) {
      await sendSurgeAlertEmail(org.email, {
        platform,
        count: recentCount,
        orgName: org.orgName,
      });
    }
  } catch (error) {
    console.error('[alertService] Surge check failed:', error.message);
  }
}

// ─── Weekly digest trigger (called by POST /api/digest/trigger from cron-job.org) ──

export async function triggerWeeklyDigest() {
  const { sendWeeklyDigestEmail } = await import('./email.service.js');
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const orgs = await Organization.find({
    'notificationPrefs.emailDigest': true,
  }).select('email orgName notificationPrefs');

  let sent = 0;

  for (const org of orgs) {
    try {
      const violations = await Violation.find({
        orgId: org._id,
        detectedAt: { $gte: sevenDaysAgo },
      }).lean();

      if (violations.length === 0) continue;

      await sendWeeklyDigestEmail(org, violations);
      sent++;
    } catch (error) {
      console.error(
        `[alertService] Digest failed for org ${org._id}:`,
        error.message
      );
    }
  }

  return { sent, total: orgs.length };
}

// ─── Read/list helpers ────────────────────────────────────────────────────────

export async function listAlertsByOrg({
  orgId,
  page = 1,
  limit = 10,
  severity = '',
  type = '',
  read = null,
}) {
  const skip = (page - 1) * limit;
  const query = { orgId };

  if (severity) query.severity = severity;
  if (type) query.type = type;
  if (read !== null) query.read = read;

  const [items, total, unreadCount] = await Promise.all([
    Alert.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Alert.countDocuments(query),
    Alert.countDocuments({ orgId, read: false }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    unreadCount,
  };
}

export async function markAlertsRead({ orgId, alertIds }) {
  const result = await Alert.updateMany(
    { orgId, _id: { $in: alertIds } },
    { $set: { read: true } }
  );
  return result.modifiedCount || 0;
}

export async function markAllAlertsRead({ orgId }) {
  const result = await Alert.updateMany(
    { orgId, read: false },
    { $set: { read: true } }
  );
  return result.modifiedCount || 0;
}

export async function getUnreadAlertCount(orgId) {
  return Alert.countDocuments({ orgId, read: false });
}
