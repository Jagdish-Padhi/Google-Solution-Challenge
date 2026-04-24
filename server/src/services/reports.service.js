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

function buildReportHtml({ organization, overview, timeline }) {
	const platformRows = overview.platformBreakdown
		.map(
			(item) => `
				<tr>
					<td>${item.platform}</td>
					<td>${item.count}</td>
					<td>${item.percentage}%</td>
				</tr>
			`,
		)
		.join('');

	const assetRows = overview.topViolatedAssets
		.map(
			(item) => `
				<tr>
					<td>${item.title}</td>
					<td>${item.type}</td>
					<td>${item.violationCount}</td>
					<td>${item.avgConfidenceScore}%</td>
				</tr>
			`,
		)
		.join('');

	const timelineRows = timeline.items
		.map(
			(item) => `
				<div class="timeline-row">
					<span>${item.label}</span>
					<div class="timeline-bar-track">
						<div class="timeline-bar-fill" style="width: ${Math.max(6, item.count * 12)}px;"></div>
					</div>
					<strong>${item.count}</strong>
				</div>
			`,
		)
		.join('');

	return `
		<!doctype html>
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<title>${overview.rangeLabel} - SportShield Report</title>
				<style>
					body {
						font-family: Arial, sans-serif;
						color: #0f172a;
						margin: 32px;
					}
					h1, h2, h3, p {
						margin: 0;
					}
					.header {
						display: flex;
						justify-content: space-between;
						align-items: flex-start;
						margin-bottom: 28px;
					}
					.brand {
						font-size: 28px;
						font-weight: 700;
						color: #0f766e;
					}
					.muted {
						color: #475569;
						font-size: 13px;
					}
					.grid {
						display: grid;
						grid-template-columns: repeat(4, minmax(0, 1fr));
						gap: 12px;
						margin: 18px 0 28px;
					}
					.card {
						border: 1px solid #cbd5e1;
						border-radius: 12px;
						padding: 14px;
						background: #f8fafc;
					}
					.card h3 {
						font-size: 12px;
						color: #475569;
						text-transform: uppercase;
						letter-spacing: 0.08em;
						margin-bottom: 8px;
					}
					.card p {
						font-size: 24px;
						font-weight: 700;
					}
					section {
						margin-bottom: 24px;
					}
					table {
						width: 100%;
						border-collapse: collapse;
						font-size: 13px;
					}
					th, td {
						border-bottom: 1px solid #e2e8f0;
						padding: 10px 8px;
						text-align: left;
					}
					th {
						font-size: 11px;
						text-transform: uppercase;
						letter-spacing: 0.08em;
						color: #475569;
					}
					.timeline-row {
						display: grid;
						grid-template-columns: 80px 1fr 40px;
						align-items: center;
						gap: 10px;
						margin-bottom: 8px;
						font-size: 13px;
					}
					.timeline-bar-track {
						height: 10px;
						background: #e2e8f0;
						border-radius: 999px;
						overflow: hidden;
					}
					.timeline-bar-fill {
						height: 100%;
						background: linear-gradient(90deg, #14b8a6, #0f766e);
					}
				</style>
			</head>
			<body>
				<div class="header">
					<div>
						<div class="brand">SportShield</div>
						<p class="muted">${organization.orgName}</p>
						<p class="muted">Violation intelligence report for ${overview.rangeLabel}</p>
					</div>
					<div class="muted">
						<p>Generated: ${formatDateForTitle(new Date())}</p>
						<p>Period: ${formatDateForTitle(overview.startDate)} - ${formatDateForTitle(overview.endDate)}</p>
					</div>
				</div>

				<div class="grid">
					<div class="card">
						<h3>Total violations</h3>
						<p>${overview.totalViolations}</p>
					</div>
					<div class="card">
						<h3>Resolved</h3>
						<p>${overview.resolvedViolations}</p>
					</div>
					<div class="card">
						<h3>Avg confidence</h3>
						<p>${overview.avgConfidenceScore}%</p>
					</div>
					<div class="card">
						<h3>Resolution rate</h3>
						<p>${Math.round(overview.resolutionRate * 100)}%</p>
					</div>
				</div>

				<section>
					<h2>Violation timeline</h2>
					<div style="margin-top: 12px;">
						${timelineRows || '<p class="muted">No violations detected in this period.</p>'}
					</div>
				</section>

				<section>
					<h2>Platform distribution</h2>
					<table>
						<thead>
							<tr>
								<th>Platform</th>
								<th>Violations</th>
								<th>Share</th>
							</tr>
						</thead>
						<tbody>
							${platformRows || '<tr><td colspan="3">No platform data available.</td></tr>'}
						</tbody>
					</table>
				</section>

				<section>
					<h2>Top violated assets</h2>
					<table>
						<thead>
							<tr>
								<th>Asset</th>
								<th>Type</th>
								<th>Violations</th>
								<th>Avg confidence</th>
							</tr>
						</thead>
						<tbody>
							${assetRows || '<tr><td colspan="4">No asset data available.</td></tr>'}
						</tbody>
					</table>
				</section>
			</body>
		</html>
	`;
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
				top: '16px',
				right: '16px',
				bottom: '16px',
				left: '16px',
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
