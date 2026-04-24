import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateAnalyticsReport, listReportsByOrg } from '../services/reports.service.js';
import { validateGenerateReportPayload, validateListReportsQuery } from '../validators/reports.validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reportsRoot = path.resolve(__dirname, '../../uploads/reports');

function getPublicReportsUrl(req) {
	return `${req.protocol}://${req.get('host')}/uploads/reports`;
}

function normalizeReportFileUrl(fileUrl, req) {
	if (!fileUrl) {
		return fileUrl;
	}

	const backendOrigin = `${req.protocol}://${req.get('host')}`;

	if (/^https?:\/\//i.test(fileUrl)) {
		try {
			const parsedUrl = new URL(fileUrl);

			if (parsedUrl.origin === backendOrigin && parsedUrl.pathname.startsWith('/reports/')) {
				parsedUrl.pathname = parsedUrl.pathname.replace('/reports/', '/uploads/reports/');
			}

			return parsedUrl.toString();
		} catch {
			return fileUrl;
		}
	}

	const normalizedPath = fileUrl.startsWith('/reports/')
		? fileUrl.replace('/reports/', '/uploads/reports/')
		: fileUrl;

	return `${backendOrigin}${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`;
}

export async function generateReportController(req, res, next) {
	try {
		const { range, startDate, endDate, title } = validateGenerateReportPayload(req.body);
		const report = await generateAnalyticsReport({
			orgId: req.auth.orgId,
			title,
			range,
			startDate,
			endDate,
			reportsRoot,
			publicBaseUrl: getPublicReportsUrl(req),
		});

		return res.status(201).json({
			message: 'Report generated successfully.',
			report,
		});
	} catch (error) {
		if (String(error.message || '').includes('Cannot find package')) {
			error.statusCode = 500;
			error.message = 'PDF generation dependency is missing. Install puppeteer in server service.';
		}

		return next(error);
	}
}

export async function listReportsController(req, res, next) {
	try {
		const { page, limit } = validateListReportsQuery(req.query);
		const result = await listReportsByOrg({
			orgId: req.auth.orgId,
			page,
			limit,
		});

		const items = result.items.map((report) => ({
			...report,
			fileUrl: normalizeReportFileUrl(report.fileUrl, req),
		}));

		return res.status(200).json({
			...result,
			items,
		});
	} catch (error) {
		return next(error);
	}
}
