/**
 * Email service using Brevo (formerly Sendinblue) REST API.
 *
 * Required .env keys:
 *   BREVO_API_KEY        – Brevo dashboard → SMTP & API → API Keys → Create API Key
 *   BREVO_SENDER_EMAIL   – must be a verified sender in Brevo
 *   BREVO_SENDER_NAME    – display name, e.g. "SportShield"
 *   APP_URL              – e.g. http://localhost:5173
 *
 * No extra npm package needed — uses native fetch (Node 18+).
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

async function sendBrevoEmail({ to, subject, htmlContent }) {
  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: process.env.BREVO_SENDER_NAME || 'SportShield',
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Brevo API error: ${error.message || response.status}`);
  }

  return response.json();
}

/**
 * Violation alert email — sent when matchConfidence > 70
 * and org has emailOnHighConfidence: true
 */
export async function sendViolationAlertEmail(orgEmail, violation) {
  const confidenceColor =
    violation.matchConfidence >= 85
      ? '#E24B4A'
      : violation.matchConfidence >= 70
        ? '#BA7517'
        : '#3B8BD4';

  const detailUrl = `${process.env.CLIENT_URL}/dashboard/violations/${violation._id}`;

  await sendBrevoEmail({
    to: orgEmail,
    subject: `⚠️ Your content was found on ${violation.platform}`,
    htmlContent: `
			<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
				<h2 style="margin-bottom:4px">Unauthorized content detected</h2>
				<p style="color:#555;margin-top:0">
					SportShield detected your content being used without authorization.
				</p>
				<table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px">
					<tr style="background:#f5f5f5">
						<td style="padding:10px 12px;color:#888;width:140px">Platform</td>
						<td style="padding:10px 12px;font-weight:500;text-transform:capitalize">${violation.platform}</td>
					</tr>
					<tr>
						<td style="padding:10px 12px;color:#888">Match confidence</td>
						<td style="padding:10px 12px;font-weight:600;color:${confidenceColor}">${violation.matchConfidence}%</td>
					</tr>
					<tr style="background:#f5f5f5">
						<td style="padding:10px 12px;color:#888">Detected at</td>
						<td style="padding:10px 12px">${new Date(violation.detectedAt || Date.now()).toLocaleString()}</td>
					</tr>
					<tr>
						<td style="padding:10px 12px;color:#888">Violating URL</td>
						<td style="padding:10px 12px;word-break:break-all">
							<a href="${violation.sourceUrl}" style="color:#185FA5">${violation.sourceUrl}</a>
						</td>
					</tr>
				</table>
				<a href="${detailUrl}"
				   style="display:inline-block;background:#1a1a1a;color:#fff;padding:11px 22px;
				          border-radius:6px;text-decoration:none;font-size:14px;font-weight:500">
					View Evidence →
				</a>
				<p style="font-size:12px;color:#aaa;margin-top:24px">
					You're receiving this because email alerts are enabled on your SportShield account.
				<a href="${process.env.CLIENT_URL}/dashboard/settings" style="color:#aaa">Manage preferences</a>
				</p>
			</div>
		`,
  });
}

/**
 * Platform surge alert email — sent when 5+ violations from same platform in 1hr
 */
export async function sendSurgeAlertEmail(
  orgEmail,
  { platform, count, orgName }
) {
  await sendBrevoEmail({
    to: orgEmail,
    subject: `🚨 Piracy surge on ${platform} — ${count} violations in 1 hour`,
    htmlContent: `
			<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
				<h2 style="color:#E24B4A;margin-bottom:4px">Piracy surge detected</h2>
				<p style="color:#555;margin-top:0">
					Hi ${orgName}, your content appeared <strong>${count} times</strong> on
					<strong style="text-transform:capitalize">${platform}</strong> in the last hour.
					This may indicate coordinated sharing.
				</p>
				<a href="${process.env.CLIENT_URL}/dashboard/violations"
				   style="display:inline-block;background:#E24B4A;color:#fff;padding:11px 22px;
				          border-radius:6px;text-decoration:none;font-size:14px;font-weight:500">
					View All Violations →
				</a>
			</div>
		`,
  });
}

/**
 * Weekly digest email — triggered by cron-job.org webhook every Monday 9 AM
 */
export async function sendWeeklyDigestEmail(org, violations) {
  const byPlatform = violations.reduce((acc, v) => {
    acc[v.platform] = (acc[v.platform] || 0) + 1;
    return acc;
  }, {});

  const platformRows = Object.entries(byPlatform)
    .map(
      ([platform, count]) => `
			<tr>
				<td style="padding:8px 12px;text-transform:capitalize;border-bottom:1px solid #f0f0f0">${platform}</td>
				<td style="padding:8px 12px;font-weight:600;border-bottom:1px solid #f0f0f0">${count}</td>
			</tr>`
    )
    .join('');

  await sendBrevoEmail({
    to: org.email,
    subject: `SportShield Weekly Report — ${violations.length} violations detected`,
    htmlContent: `
			<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
				<h2>Weekly piracy report</h2>
				<p style="color:#555">
					Here's a summary of piracy activity for <strong>${org.orgName}</strong> over the last 7 days.
				</p>
				<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
					<tr style="background:#f5f5f5">
						<td style="padding:10px 12px;color:#888">Total violations</td>
						<td style="padding:10px 12px;font-weight:600">${violations.length}</td>
					</tr>
				</table>
				<h3 style="font-size:13px;color:#888;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.08em">Breakdown by platform</h3>
				<table style="width:100%;border-collapse:collapse;font-size:14px">
					<tr style="background:#f5f5f5">
						<th style="padding:8px 12px;text-align:left;font-weight:500;color:#888">Platform</th>
						<th style="padding:8px 12px;text-align:left;font-weight:500;color:#888">Violations</th>
					</tr>
					${platformRows}
				</table>
				<br/>
				<a href="${process.env.CLIENT_URL}/dashboard/analytics"
				   style="display:inline-block;background:#1a1a1a;color:#fff;padding:11px 22px;
				          border-radius:6px;text-decoration:none;font-size:14px;font-weight:500">
					View Full Dashboard →
				</a>
				<p style="font-size:12px;color:#aaa;margin-top:24px">
					Weekly digest is sent every Monday.
				<a href="${process.env.CLIENT_URL}/dashboard/settings" style="color:#aaa">Unsubscribe</a>
				</p>
			</div>
		`,
  });
}
