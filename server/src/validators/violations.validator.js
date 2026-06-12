import { validationError } from './common.js';

export function validateListViolationsQuery(query) {
	const parsedPage = Number.parseInt(query.page || '1', 10);
	const parsedLimit = Number.parseInt(query.limit || '10', 10);
	const status = typeof query.status === 'string' ? query.status.trim().toLowerCase() : '';
	const platform = typeof query.platform === 'string' ? query.platform.trim().toLowerCase() : '';
	const minConfidence = Number.parseFloat(query.minConfidence || '0');

	const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
	const limit = Number.isNaN(parsedLimit) ? 10 : Math.min(100, Math.max(1, parsedLimit));
	const allowedStatuses = new Set(['open', 'reported', 'resolved', 'false_positive']);
	const allowedPlatforms = new Set(['youtube', 'twitter', 'telegram', 'web', 'livestream']);

	// Validate date format if provided (expect ISO date string)
	const date = typeof query.date === 'string' ? query.date.trim() : '';
	if (date && Number.isNaN(new Date(date).getTime())) {
		throw validationError('Invalid date format. Please use a valid ISO date string (e.g. 2024-01-15).');
	}

	return {
		page,
		limit,
		status: allowedStatuses.has(status) ? status : '',
		platform: allowedPlatforms.has(platform) ? platform : '',
		minConfidence: Number.isNaN(minConfidence) ? 0 : Math.min(100, Math.max(0, minConfidence)),
		date,
	};
}

export function validateViolationStatusPayload(payload) {
	const status = typeof payload?.status === 'string' ? payload.status.trim().toLowerCase() : '';
	const allowed = new Set(['open', 'reported', 'resolved', 'false_positive']);

	if (!allowed.has(status)) {
		throw validationError(`Invalid violation status. Allowed values: ${[...allowed].join(', ')}.`);
	}

	return { status };
}
