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

		return res.status(200).json(result);
	} catch (error) {
		return next(error);
	}
}
