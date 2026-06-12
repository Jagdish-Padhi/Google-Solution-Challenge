export function validationError(message) {
	const error = new Error(message);
	error.statusCode = 400;
	return error;
}

// Strictly validates HTTP/HTTPS URLs only
export function isValidUrl(value) {
	if (typeof value !== 'string') return false;
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
}

// Local part must start with alphanumeric; domain needs 2+ char TLD
export function isValidEmail(value) {
	if (typeof value !== 'string') return false;
	const trimmed = value.trim();
	if (trimmed.length > 254) return false;
	return /^[a-zA-Z0-9][a-zA-Z0-9._+\-]*@[a-zA-Z0-9][a-zA-Z0-9.\-]*\.[a-zA-Z]{2,}$/.test(trimmed);
}

// 24-hex-char MongoDB ObjectId
export function isValidMongoId(value) {
	if (typeof value !== 'string') return false;
	return /^[0-9a-fA-F]{24}$/.test(value.trim());
}

// Returns trimmed value or throws if outside [min, max] bounds
export function validateStringField(value, fieldName, { min = 1, max = 500 } = {}) {
	const trimmed = typeof value === 'string' ? value.trim() : '';
	if (trimmed.length < min) {
		throw validationError(`${fieldName} must be at least ${min} character(s).`);
	}
	if (trimmed.length > max) {
		throw validationError(`${fieldName} must be ${max} characters or fewer.`);
	}
	return trimmed;
}
