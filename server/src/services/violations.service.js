import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

import Violation from '../models/violation.model.js';

export async function listViolationsByOrg({ orgId, page = 1, limit = 10, status = '', platform = '', minConfidence = 0 }) {
	const skip = (page - 1) * limit;
	const query = {
		orgId,
		matchConfidence: { $gte: minConfidence },
	};

	if (status) {
		query.status = status;
	}

	if (platform) {
		query.platform = platform;
	}

	const [items, total] = await Promise.all([
		Violation.find(query)
			.sort({ detectedAt: -1, createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		Violation.countDocuments(query),
	]);

	return {
		items,
		total,
		page,
		limit,
		totalPages: Math.max(1, Math.ceil(total / limit)),
	};
}

export async function getViolationById({ orgId, violationId }) {
	return Violation.findOne({ _id: violationId, orgId }).lean();
}

export async function updateViolationStatus({ orgId, violationId, status }) {
	const update = {
		status,
		resolvedAt: status === 'resolved' ? new Date() : null,
	};

	return Violation.findOneAndUpdate({ _id: violationId, orgId }, update, { new: true }).lean();
}

async function captureViolationScreenshot(sourceUrl, outputPath) {
	const puppeteer = await import('puppeteer');
	const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

	try {
		const page = await browser.newPage();
		await page.setViewport({ width: 1366, height: 768 });
		await page.goto(sourceUrl, {
			waitUntil: 'domcontentloaded',
			timeout: 30000,
		});
		await page.screenshot({ path: outputPath, fullPage: false });
	} finally {
		await browser.close();
	}
}

export async function createViolationScreenshot({ orgId, violationId, uploadsRoot, publicBaseUrl }) {
	const violation = await Violation.findOne({ _id: violationId, orgId });

	if (!violation) {
		const error = new Error('Violation not found.');
		error.statusCode = 404;
		throw error;
	}

	if (!violation.sourceUrl) {
		const error = new Error('Violation source URL is missing.');
		error.statusCode = 400;
		throw error;
	}

	const fileName = `violation-${Date.now()}-${crypto.randomUUID()}.png`;
	const outputPath = path.join(uploadsRoot, fileName);

	await fs.mkdir(uploadsRoot, { recursive: true });
	await captureViolationScreenshot(violation.sourceUrl, outputPath);

	violation.screenshotUrl = `${publicBaseUrl}/${fileName}`;
	await violation.save();

	return violation.toObject();
}
