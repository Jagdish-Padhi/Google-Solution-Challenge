import { isValidMongoId, validationError } from './common.js';

const MAX_KEYWORDS = 20;
const MAX_KEYWORD_LENGTH = 100;

export function validateStartScanPayload(payload) {
	const assetId = typeof payload?.assetId === 'string' ? payload.assetId.trim() : '';

	if (!assetId) {
		throw validationError('assetId is required.');
	}

	if (!isValidMongoId(assetId)) {
		throw validationError('assetId must be a valid 24-character hex identifier.');
	}

	const keywords = Array.isArray(payload?.searchKeywords)
		? payload.searchKeywords.map((keyword) => String(keyword).trim()).filter(Boolean)
		: [];

	const platforms = Array.isArray(payload?.platforms)
		? payload.platforms.map((platform) => String(platform).trim().toLowerCase()).filter(Boolean)
		: [];
	const multiLanguage = payload?.multiLanguage !== undefined ? Boolean(payload.multiLanguage) : true;

	if (keywords.length === 0) {
		throw validationError('At least one search keyword is required.');
	}

	if (keywords.length > MAX_KEYWORDS) {
		throw validationError(`You can specify a maximum of ${MAX_KEYWORDS} keywords per scan.`);
	}

	for (const keyword of keywords) {
		if (keyword.length > MAX_KEYWORD_LENGTH) {
			throw validationError(`Each keyword must be ${MAX_KEYWORD_LENGTH} characters or fewer.`);
		}
	}

	const allowedPlatforms = new Set(['youtube', 'twitter', 'telegram', 'web', 'livestream']);
	for (const platform of platforms) {
		if (!allowedPlatforms.has(platform)) {
			throw validationError(`Unsupported platform: "${platform}". Allowed: ${[...allowedPlatforms].join(', ')}.`);
		}
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
	const allowedPlatforms = new Set(['youtube', 'twitter', 'telegram', 'web', 'livestream']);

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
	const allowedPlatforms = new Set(['youtube', 'twitter', 'telegram', 'web', 'livestream']);

	return {
		page,
		limit,
		status: allowedStatuses.has(status) ? status : '',
		platform: allowedPlatforms.has(platform) ? platform : '',
	};
}