import { validateAnalyticsRangeQuery } from './analytics.validator.js';
import { validationError } from './common.js';

export function validateGenerateReportPayload(payload) {
	const normalized = validateAnalyticsRangeQuery(payload || {});
	const title = typeof payload?.title === 'string' ? payload.title.trim() : '';

	return {
		...normalized,
		title: title || null,
	};
}

export function validateListReportsQuery(query) {
	const parsedPage = Number.parseInt(query.page || '1', 10);
	const parsedLimit = Number.parseInt(query.limit || '10', 10);

	const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
	const limit = Number.isNaN(parsedLimit) ? 10 : Math.min(50, Math.max(1, parsedLimit));

	if (limit < 1) {
		throw validationError('limit must be greater than zero.');
	}

	return { page, limit };
}
