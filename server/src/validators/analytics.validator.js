function validationError(message) {
	const error = new Error(message);
	error.statusCode = 400;
	return error;
}

const allowedRanges = new Set(['7d', '30d', '90d', 'custom']);

function parseDateInput(value, fieldName) {
	if (!value) {
		return null;
	}

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		throw validationError(`${fieldName} must be a valid date.`);
	}

	return parsed;
}

export function validateAnalyticsRangeQuery(query) {
	const rangeInput = typeof query.range === 'string' ? query.range.trim().toLowerCase() : '30d';
	const range = allowedRanges.has(rangeInput) ? rangeInput : '30d';
	const startDate = parseDateInput(query.startDate, 'startDate');
	const endDate = parseDateInput(query.endDate, 'endDate');

	if (range === 'custom' && (!startDate || !endDate)) {
		throw validationError('startDate and endDate are required when range=custom.');
	}

	if (startDate && endDate && startDate > endDate) {
		throw validationError('startDate must be before endDate.');
	}

	return {
		range,
		startDate,
		endDate,
	};
}
