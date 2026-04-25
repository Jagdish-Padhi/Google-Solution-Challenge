import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
	createViolationScreenshot,
	draftDmcaNotice,
	getViolationById,
	listViolationsByOrg,
	updateViolationStatus,
} from '../services/violations.service.js';
import {
	validateListViolationsQuery,
	validateViolationStatusPayload,
} from '../validators/violations.validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, '../../uploads');

function getPublicUploadsUrl(req) {
	return `${req.protocol}://${req.get('host')}/uploads`;
}

export async function listViolationsController(req, res, next) {
	try {
		const { page, limit, status, platform, minConfidence } = validateListViolationsQuery(req.query);
		const result = await listViolationsByOrg({
			orgId: req.auth.orgId,
			page,
			limit,
			status,
			platform,
			minConfidence,
		});

		return res.status(200).json(result);
	} catch (error) {
		return next(error);
	}
}

export async function getViolationByIdController(req, res, next) {
	try {
		const violation = await getViolationById({
			orgId: req.auth.orgId,
			violationId: req.params.id,
		});

		if (!violation) {
			return res.status(404).json({ message: 'Violation not found.' });
		}

		return res.status(200).json({ violation });
	} catch (error) {
		return next(error);
	}
}

export async function updateViolationStatusController(req, res, next) {
	try {
		const { status } = validateViolationStatusPayload(req.body);
		const violation = await updateViolationStatus({
			orgId: req.auth.orgId,
			violationId: req.params.id,
			status,
		});

		if (!violation) {
			return res.status(404).json({ message: 'Violation not found.' });
		}

		return res.status(200).json({
			message: 'Violation status updated successfully.',
			violation,
		});
	} catch (error) {
		return next(error);
	}
}

export async function createViolationScreenshotController(req, res, next) {
	try {
		const violation = await createViolationScreenshot({
			orgId: req.auth.orgId,
			violationId: req.params.id,
		});

		return res.status(200).json({
			message: 'Violation screenshot captured successfully.',
			violation,
		});
	} catch (error) {
		if (String(error.message || '').includes('Cannot find package')) {
			error.statusCode = 500;
			error.message = 'Screenshot capture dependency is missing. Install puppeteer in server service.';
		}

		return next(error);
	}
}

export async function draftDmcaController(req, res, next) {
	try {
		const result = await draftDmcaNotice({
			orgId: req.auth.orgId,
			violationId: req.params.id,
		});

		return res.status(200).json(result);
	} catch (error) {
		return next(error);
	}
}
