function validationError(message) {
	const error = new Error(message);
	error.statusCode = 400;
	return error;
}

export function validateListViolationsQuery(query) {
	const parsedPage = Number.parseInt(query.page || '1', 10);
	const parsedLimit = Number.parseInt(query.limit || '10', 10);
	const status = typeof query.status === 'string' ? query.status.trim().toLowerCase() : '';
	const platform = typeof query.platform === 'string' ? query.platform.trim().toLowerCase() : '';
	const minConfidence = Number.parseFloat(query.minConfidence || '0');

	const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
	const limit = Number.isNaN(parsedLimit) ? 10 : Math.min(100, Math.max(1, parsedLimit));
	const allowedStatuses = new Set(['open', 'reported', 'resolved', 'false_positive']);
	const allowedPlatforms = new Set(['youtube', 'twitter', 'telegram', 'web']);

	return {
		page,
		limit,
		status: allowedStatuses.has(status) ? status : '',
		platform: allowedPlatforms.has(platform) ? platform : '',
		minConfidence: Number.isNaN(minConfidence) ? 0 : Math.min(100, Math.max(0, minConfidence)),
	};
}

export function validateViolationStatusPayload(payload) {
	const status = typeof payload?.status === 'string' ? payload.status.trim().toLowerCase() : '';
	const allowed = new Set(['open', 'reported', 'resolved', 'false_positive']);

	if (!allowed.has(status)) {
		throw validationError('Invalid violation status value.');
	}

	return { status };
}
