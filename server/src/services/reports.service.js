import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import Organization from '../models/organization.model.js';
import Report from '../models/report.model.js';
import { getAnalyticsOverview, getAnalyticsTimeline } from './analytics.service.js';

function formatDateForTitle(date) {
	return new Intl.DateTimeFormat('en-US', {
		timeZone: 'UTC',
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	}).format(date);
}

function buildDonutChart(breakdown) {
	let currentAngle = -90; // Start at top
	const colors = ['#0f766e', '#14b8a6', '#0ea5e9', '#6366f1'];
	
	const segments = breakdown.map((item, i) => {
		const angle = (item.percentage / 100) * 360;
		if (angle === 0) return '';
		
		const largeArcFlag = angle > 180 ? 1 : 0;
		
		const startRad = (Math.PI * currentAngle) / 180;
		const x1 = 50 + 45 * Math.cos(startRad);
		const y1 = 50 + 45 * Math.sin(startRad);
		
		currentAngle += angle;
		
		const endRad = (Math.PI * currentAngle) / 180;
		const x2 = 50 + 45 * Math.cos(endRad);
		const y2 = 50 + 45 * Math.sin(endRad);
		
		return `<path d="M ${x1} ${y1} A 45 45 0 ${largeArcFlag} 1 ${x2} ${y2}" fill="none" stroke="${colors[i % colors.length]}" stroke-width="10" />`;
	}).join('');

	return `<svg viewBox="0 0 100 100" style="width:140px;height:140px;display:block;margin:0 auto;">
		<circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" stroke-width="10" />
		${segments}
		<text x="50" y="55" text-anchor="middle" style="font-family:Inter,sans-serif;font-size:10px;font-weight:800;fill:#64748b;text-transform:uppercase;">Volume</text>
	</svg>`;
}

function buildReportHtml({ organization, overview, timeline }) {
	const platformRows = overview.platformBreakdown
		.map(
			(item) =>
				`<tr>
					<td style="padding:9px 12px;border-bottom:1px solid #e8ecf0;font-weight:600;color:#0f172a;text-transform:capitalize;">${item.platform}</td>
					<td style="padding:9px 12px;border-bottom:1px solid #e8ecf0;color:#334155;">${item.count}</td>
					<td style="padding:9px 12px;border-bottom:1px solid #e8ecf0;"><span style="display:inline-block;background:#0f766e;color:#fff;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700;">${item.percentage}%</span></td>
				</tr>`,
		)
		.join('');

	const assetRows = overview.topViolatedAssets
		.map(
			(item, i) =>
				`<tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'};">
					<td style="padding:9px 12px;border-bottom:1px solid #e8ecf0;font-weight:600;color:#0f172a;">${item.title}</td>
					<td style="padding:9px 12px;border-bottom:1px solid #e8ecf0;color:#64748b;text-transform:capitalize;">${item.type}</td>
					<td style="padding:9px 12px;border-bottom:1px solid #e8ecf0;font-weight:700;color:#dc2626;">${item.violationCount}</td>
					<td style="padding:9px 12px;border-bottom:1px solid #e8ecf0;"><span style="display:inline-block;background:${item.avgConfidenceScore >= 80 ? '#fef2f2' : '#f0fdf4'};color:${item.avgConfidenceScore >= 80 ? '#dc2626' : '#15803d'};border:1px solid ${item.avgConfidenceScore >= 80 ? '#fecaca' : '#bbf7d0'};border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700;">${item.avgConfidenceScore}%</span></td>
				</tr>`,
		)
		.join('');

	const timelineRows = timeline.items
		.slice(0, 14)
		.map(
			(item) =>
				`<tr>
					<td style="padding:7px 12px;border-bottom:1px solid #e8ecf0;color:#64748b;font-size:12px;">${item.label}</td>
					<td style="padding:7px 12px;border-bottom:1px solid #e8ecf0;font-weight:700;color:#0f172a;">${item.count}</td>
				</tr>`,
		)
		.join('');

	const resolutionPct = Math.round(overview.resolutionRate * 100);

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${overview.rangeLabel} — SportShield Intelligence Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{width:210mm;font-family:'Inter',Arial,sans-serif;font-size:13px;color:#0f172a;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  @page{size:A4;margin:0;}
  .page{width:210mm;min-height:297mm;padding:28px 32px 24px;display:flex;flex-direction:column;gap:0;}
  .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:2.5px solid #0f766e;margin-bottom:20px;}
  .brand{font-size:20px;font-weight:800;color:#0f766e;letter-spacing:-0.5px;}
  .brand span{color:#0f172a;}
  .brand-sub{font-size:10px;color:#64748b;margin-top:2px;letter-spacing:0.06em;text-transform:uppercase;}
  .header-center{text-align:center;flex:1;padding:0 16px;}
  .report-title{font-size:15px;font-weight:700;color:#0f172a;}
  .report-sub{font-size:11px;color:#64748b;margin-top:2px;}
  .header-meta{text-align:right;font-size:11px;color:#64748b;line-height:1.9;}
  .header-meta strong{color:#0f172a;font-weight:600;}
  .confidential{display:inline-block;border:1px solid #fca5a5;background:#fef2f2;color:#dc2626;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;padding:2px 7px;border-radius:3px;}
  .kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px;}
  .kpi{border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;background:#f8fafc;}
  .kpi-label{font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;font-weight:600;margin-bottom:5px;}
  .kpi-value{font-size:24px;font-weight:800;color:#0f172a;line-height:1;}
  .kpi-value.red{color:#dc2626;}
  .kpi-value.green{color:#15803d;}
  .kpi-value.teal{color:#0f766e;}
  .kpi-sub{font-size:9px;color:#94a3b8;margin-top:3px;}
  .section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.09em;color:#0f766e;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #e2e8f0;}
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:16px;}
  .one-col{margin-bottom:16px;}
  table{width:100%;border-collapse:collapse;font-size:12px;}
  thead tr{background:#0f172a;}
  thead th{padding:8px 12px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;}
  .footer{margin-top:auto;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;}
  .footer-text{font-size:9px;color:#94a3b8;line-height:1.7;}
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div>
      <div class="brand">Sport<span>Shield</span></div>
      <div class="brand-sub">AI-Powered Rights Intelligence</div>
    </div>
    <div class="header-center">
      <div class="report-title">Violation Intelligence Report</div>
      <div class="report-sub">${overview.rangeLabel}</div>
    </div>
    <div class="header-meta">
      <div><strong>Organization:</strong> ${organization.orgName}</div>
      <div><strong>Generated:</strong> ${formatDateForTitle(new Date())}</div>
      <div><strong>Period:</strong> ${formatDateForTitle(overview.startDate)} – ${formatDateForTitle(overview.endDate)}</div>
      <div style="margin-top:4px;"><span class="confidential">Confidential</span></div>
    </div>
  </div>

  <div class="kpi-row">
    <div class="kpi">
      <div class="kpi-label">Total Violations</div>
      <div class="kpi-value red">${overview.totalViolations}</div>
      <div class="kpi-sub">Detected in period</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Resolved</div>
      <div class="kpi-value green">${overview.resolvedViolations}</div>
      <div class="kpi-sub">Enforcement actions</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Resolution Rate</div>
      <div class="kpi-value teal">${resolutionPct}%</div>
      <div class="kpi-sub">Of total violations</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Avg. AI Confidence</div>
      <div class="kpi-value">${overview.avgConfidenceScore}%</div>
      <div class="kpi-sub">Match accuracy score</div>
    </div>
  </div>

  <div class="two-col">
    <div style="display:flex;flex-direction:column;gap:15px;">
      <div>
        <div class="section-title">Platform Distribution</div>
        <table style="margin-bottom:15px;">
          <thead><tr><th>Platform</th><th>Violations</th><th>Share</th></tr></thead>
          <tbody>${platformRows || '<tr><td colspan="3" style="padding:12px;color:#94a3b8;">No platform data available.</td></tr>'}</tbody>
        </table>
      </div>
      
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;">
         ${buildDonutChart(overview.platformBreakdown)}
         <div style="margin-top:15px;text-align:center;">
           <div style="font-size:10px;font-weight:700;color:#0f766e;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Risk Assessment</div>
           <div style="font-size:11px;color:#64748b;line-height:1.5;max-width:200px;">
             ${overview.totalViolations > 50 
               ? 'Critical concentration detected on high-velocity platforms. Aggressive enforcement recommended.' 
               : 'Distribution remains within manageable thresholds. Continued monitoring advised.'}
           </div>
         </div>
      </div>
    </div>
    <div>
      <div class="section-title">Daily Violation Log</div>
      <table>
        <thead><tr><th>Date</th><th>Violations</th></tr></thead>
        <tbody>${timelineRows || '<tr><td colspan="2" style="padding:12px;color:#94a3b8;">No activity in this period.</td></tr>'}</tbody>
      </table>
    </div>
  </div>

  <div class="one-col">
    <div class="section-title">Top Violated Assets</div>
    <table>
      <thead><tr><th>Asset Title</th><th>Type</th><th>Violations</th><th>Avg. Confidence</th></tr></thead>
      <tbody>${assetRows || '<tr><td colspan="4" style="padding:12px;color:#94a3b8;">No asset data available.</td></tr>'}</tbody>
    </table>
  </div>

  <div class="footer">
    <div class="footer-text">
      SportShield · AI-Powered Rights Protection · sportshield.com<br/>
      Auto-generated report. Data is accurate as of the generation date.
    </div>
    <div class="footer-text" style="text-align:right;">
      Report ID: ${String(organization._id).slice(-8).toUpperCase()}<br/>
      <span class="confidential">Internal Use Only</span>
    </div>
  </div>

</div>
</body>
</html>`;
}

export async function generateAnalyticsReport({
	orgId,
	title = null,
	range = '30d',
	startDate = null,
	endDate = null,
	reportsRoot,
	publicBaseUrl,
}) {
	const organization = await Organization.findById(orgId).select('orgName email').lean();

	if (!organization) {
		const error = new Error('Organization not found.');
		error.statusCode = 404;
		throw error;
	}

	const [overview, timeline] = await Promise.all([
		getAnalyticsOverview({ orgId, range, startDate, endDate }),
		getAnalyticsTimeline({ orgId, range, startDate, endDate }),
	]);

	await fs.mkdir(reportsRoot, { recursive: true });

	const fileName = `analytics-report-${Date.now()}-${crypto.randomUUID()}.pdf`;
	const outputPath = path.join(reportsRoot, fileName);
	const html = buildReportHtml({ organization, overview, timeline });

	const puppeteer = await import('puppeteer');
	const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

	try {
		const page = await browser.newPage();
		await page.setContent(html, { waitUntil: 'networkidle0' });
		await page.pdf({
			path: outputPath,
			format: 'A4',
			printBackground: true,
			margin: {
				top: '0',
				right: '0',
				bottom: '0',
				left: '0',
			},
		});
	} finally {
		await browser.close();
	}

	const reportTitle = title || `${organization.orgName} Analytics Report - ${overview.rangeLabel}`;
	const fileUrl = `${publicBaseUrl}/${fileName}`;
	const report = await Report.create({
		orgId,
		title: reportTitle,
		rangeLabel: overview.rangeLabel,
		startDate: overview.startDate,
		endDate: overview.endDate,
		fileUrl,
		fileName,
		stats: {
			totalViolations: overview.totalViolations,
			resolvedViolations: overview.resolvedViolations,
			avgConfidenceScore: overview.avgConfidenceScore,
			resolutionRate: overview.resolutionRate,
		},
		generatedAt: new Date(),
	});

	return report.toObject();
}

export async function listReportsByOrg({ orgId, page = 1, limit = 10 }) {
	const skip = (page - 1) * limit;

	const [items, total] = await Promise.all([
		Report.find({ orgId })
			.sort({ generatedAt: -1, createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		Report.countDocuments({ orgId }),
	]);

	return {
		items,
		total,
		page,
		limit,
		totalPages: Math.max(1, Math.ceil(total / limit)),
	};
}
