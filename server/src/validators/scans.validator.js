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
	};
}

export function validateListScansQuery(query) {
	const parsedPage = Number.parseInt(query.page || '1', 10);
	const parsedLimit = Number.parseInt(query.limit || '10', 10);

	const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
	const limit = Number.isNaN(parsedLimit) ? 10 : Math.min(50, Math.max(1, parsedLimit));

	return { page, limit };
}