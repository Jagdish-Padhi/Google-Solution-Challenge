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

import { cloudinary } from '../config/cloudinary.js';

async function captureViolationScreenshot(sourceUrl) {
	const puppeteer = await import('puppeteer');
	const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

	try {
		const page = await browser.newPage();
		await page.setViewport({ width: 1366, height: 768 });
		await page.goto(sourceUrl, {
			waitUntil: 'domcontentloaded',
			timeout: 30000,
		});
		const screenshotBuffer = await page.screenshot({ type: 'png', fullPage: false });
		
		return new Promise((resolve, reject) => {
			const uploadStream = cloudinary.uploader.upload_stream(
				{ folder: 'sportshield_screenshots', resource_type: 'image' },
				(error, result) => {
					if (error) return reject(error);
					resolve(result.secure_url);
				}
			);
			uploadStream.end(screenshotBuffer);
		});
	} finally {
		await browser.close();
	}
}

export async function createViolationScreenshot({ orgId, violationId }) {
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

	const screenshotUrl = await captureViolationScreenshot(violation.sourceUrl);

	violation.screenshotUrl = screenshotUrl;
	await violation.save();

	return violation.toObject();
}

function buildDmcaTemplate({ organizationName, violation }) {
	return `Subject: DMCA Takedown Notice - Unauthorized Use of Copyrighted Sports Content

To Whom It May Concern,

I represent ${organizationName}, the lawful copyright owner (or authorized agent) of the sports media content identified below.

We have identified unauthorized use/distribution of our copyrighted work at:
- Infringing URL: ${violation.sourceUrl}
- Platform: ${violation.platform}
- Detection Time: ${new Date(violation.detectedAt).toISOString()}
- Internal Reference: ${violation._id}

We request immediate removal or disabling access to this infringing content under applicable copyright law and your platform policy.

Good-faith statement:
I have a good faith belief that use of the copyrighted material described above is not authorized by the copyright owner, its agent, or the law.

Accuracy and authority statement:
I swear, under penalty of perjury, that the information in this notice is accurate and that I am authorized to act on behalf of the copyright owner.

Please confirm receipt and action taken.

Sincerely,
${organizationName}
`;
}

async function generateDmcaWithGemini({ organizationName, violation }) {
	const apiKey = process.env.GEMINI_API_KEY?.trim();
	if (!apiKey) {
		return null;
	}

	const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
	const prompt = `Generate a concise formal DMCA takedown notice in plain text.

Organization: ${organizationName}
Infringing URL: ${violation.sourceUrl}
Platform: ${violation.platform}
Detected at: ${new Date(violation.detectedAt).toISOString()}
Evidence: confidence ${violation.matchConfidence}%, match type ${violation.matchType}

Include:
1) ownership claim
2) unauthorized use claim
3) good-faith statement
4) perjury/authority statement
5) request for prompt removal

Return only the notice text.`;

	const response = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contents: [{ parts: [{ text: prompt }] }],
				generationConfig: {
					temperature: 0.3,
					maxOutputTokens: 700,
				},
			}),
		},
	);

	if (!response.ok) {
		return null;
	}

	const payload = await response.json();
	const text = payload?.candidates?.[0]?.content?.parts
		?.map((part) => part?.text || '')
		.join('\n')
		.trim();

	return text || null;
}

export async function draftDmcaNotice({ orgId, violationId }) {
	const violation = await Violation.findOne({ _id: violationId, orgId }).lean();
	if (!violation) {
		const error = new Error('Violation not found.');
		error.statusCode = 404;
		throw error;
	}

	const organizationName = 'SportShield Rights Team';
	const geminiDraft = await generateDmcaWithGemini({ organizationName, violation });

	return {
		violationId: violation._id.toString(),
		platform: violation.platform,
		sourceUrl: violation.sourceUrl,
		draft: geminiDraft || buildDmcaTemplate({ organizationName, violation }),
		generatedBy: geminiDraft ? 'gemini' : 'template',
	};
}
