function createValidationError(message) {
	const error = new Error(message);
	error.statusCode = 400;
	return error;
}

export function validateAssetUploadPayload(payload) {
	const title = payload?.title?.trim();
	const description = payload?.description?.trim() || '';

	if (!title || title.length < 3) {
		throw createValidationError('Title must be at least 3 characters long.');
	}

	if (title.length > 120) {
		throw createValidationError('Title must be 120 characters or fewer.');
	}

	if (description.length > 500) {
		throw createValidationError('Description must be 500 characters or fewer.');
	}

	return { title, description };
}

export function validateAssetUpdatePayload(payload) {
	const updates = {};

	if (payload?.title !== undefined) {
		const title = payload.title.trim();
		if (title.length < 3) throw createValidationError('Title must be at least 3 characters long.');
		if (title.length > 120) throw createValidationError('Title must be 120 characters or fewer.');
		updates.title = title;
	}

	if (payload?.description !== undefined) {
		const description = payload.description.trim();
		if (description.length > 500) throw createValidationError('Description must be 500 characters or fewer.');
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