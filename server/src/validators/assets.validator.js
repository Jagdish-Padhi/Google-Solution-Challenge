import { isValidUrl, validationError } from './common.js';

export function validateAssetUploadPayload(payload) {
	const title = payload?.title?.trim();
	const description = payload?.description?.trim() || '';
	const type = typeof payload?.type === 'string' ? payload.type.trim().toLowerCase() : '';
	const livestreamUrl = typeof payload?.livestreamUrl === 'string' ? payload.livestreamUrl.trim() : '';

	if (!title || title.length < 3) {
		throw validationError('Title must be at least 3 characters long.');
	}

	if (title.length > 120) {
		throw validationError('Title must be 120 characters or fewer.');
	}

	if (description.length > 500) {
		throw validationError('Description must be 500 characters or fewer.');
	}

	// Livestream-specific validation
	if (type === 'livestream') {
		if (!livestreamUrl) {
			throw validationError('Livestream URL is required for livestream assets.');
		}
		if (!isValidUrl(livestreamUrl)) {
			throw validationError('Please enter a valid livestream URL (must start with http:// or https://).');
		}
	}

	return { title, description, type, livestreamUrl };
}

export function validateAssetUpdatePayload(payload) {
	const updates = {};

	if (payload?.title !== undefined) {
		const title = payload.title.trim();
		if (title.length < 3) throw validationError('Title must be at least 3 characters long.');
		if (title.length > 120) throw validationError('Title must be 120 characters or fewer.');
		updates.title = title;
	}

	if (payload?.description !== undefined) {
		const description = payload.description.trim();
		if (description.length > 500) throw validationError('Description must be 500 characters or fewer.');
		updates.description = description;
	}

	return updates;
}

export function validatePaginationQuery(query) {
	const parsedPage = Number.parseInt(query.page || '1', 10);
	const parsedLimit = Number.parseInt(query.limit || '12', 10);

	const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
	const limit = Number.isNaN(parsedLimit) ? 12 : Math.min(50, Math.max(1, parsedLimit));

	return { page, limit };
}