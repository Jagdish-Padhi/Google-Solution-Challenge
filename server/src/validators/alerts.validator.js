function validationError(message) {
	const error = new Error(message);
	error.statusCode = 400;
	return error;
}

export function validateListAlertsQuery(query) {
	const parsedPage = Number.parseInt(query.page || '1', 10);
	const parsedLimit = Number.parseInt(query.limit || '10', 10);
	const severity = typeof query.severity === 'string' ? query.severity.trim().toLowerCase() : '';
	const type = typeof query.type === 'string' ? query.type.trim().toLowerCase() : '';
	const read = typeof query.read === 'string' ? query.read.trim().toLowerCase() : '';

	const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
	const limit = Number.isNaN(parsedLimit) ? 10 : Math.min(100, Math.max(1, parsedLimit));
	const allowedSeverities = new Set(['low', 'medium', 'high', 'critical']);
	const allowedTypes = new Set(['new_violation', 'high_confidence', 'platform_surge']);

	return {
		page,
		limit,
		severity: allowedSeverities.has(severity) ? severity : '',
		type: allowedTypes.has(type) ? type : '',
		read: read === 'true' ? true : read === 'false' ? false : null,
	};
}

export function validateMarkReadPayload(payload) {
	const alertIds = Array.isArray(payload?.alertIds)
		? payload.alertIds.map((alertId) => String(alertId).trim()).filter(Boolean)
		: [];

	if (alertIds.length === 0) {
		throw validationError('alertIds must contain at least one alert id.');
	}

	return { alertIds };
}
