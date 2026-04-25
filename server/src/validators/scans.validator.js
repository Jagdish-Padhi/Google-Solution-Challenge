function validationError(message) {
	const error = new Error(message);
	error.statusCode = 400;
	return error;
}

export function validateStartScanPayload(payload) {
	const assetId = payload?.assetId?.trim();

	if (!assetId) {
		throw validationError('assetId is required.');
	}

	const keywords = Array.isArray(payload?.searchKeywords)
		? payload.searchKeywords.map((keyword) => String(keyword).trim()).filter(Boolean)
		: [];

	const platforms = Array.isArray(payload?.platforms)
		? payload.platforms.map((platform) => String(platform).trim().toLowerCase()).filter(Boolean)
		: [];
	const multiLanguage = Boolean(payload?.multiLanguage);

	if (keywords.length === 0) {
		throw validationError('At least one search keyword is required.');
	}

	if (platforms.length === 0) {
		throw validationError('At least one platform is required.');
	}

	return {
		assetId,
		keywords,
		platforms,
		multiLanguage,
	};
}

export function validateListScansQuery(query) {
	const parsedPage = Number.parseInt(query.page || '1', 10);
	const parsedLimit = Number.parseInt(query.limit || '10', 10);
	const status = typeof query.status === 'string' ? query.status.trim().toLowerCase() : '';
	const platform = typeof query.platform === 'string' ? query.platform.trim().toLowerCase() : '';

	const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
	const limit = Number.isNaN(parsedLimit) ? 10 : Math.min(50, Math.max(1, parsedLimit));
	const allowedStatuses = new Set(['queued', 'running', 'completed', 'failed']);
	const allowedPlatforms = new Set(['youtube', 'twitter', 'telegram', 'web']);

	return {
		page,
		limit,
		status: allowedStatuses.has(status) ? status : '',
		platform: allowedPlatforms.has(platform) ? platform : '',
	};
}

export function validateListScanResultsQuery(query) {
	const parsedPage = Number.parseInt(query.page || '1', 10);
	const parsedLimit = Number.parseInt(query.limit || '20', 10);
	const status = typeof query.status === 'string' ? query.status.trim().toLowerCase() : '';
	const platform = typeof query.platform === 'string' ? query.platform.trim().toLowerCase() : '';

	const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
	const limit = Number.isNaN(parsedLimit) ? 20 : Math.min(100, Math.max(1, parsedLimit));
	const allowedStatuses = new Set(['pending_match', 'matched', 'no_match']);
	const allowedPlatforms = new Set(['youtube', 'twitter', 'telegram', 'web']);

	return {
		page,
		limit,
		status: allowedStatuses.has(status) ? status : '',
		platform: allowedPlatforms.has(platform) ? platform : '',
	};
}