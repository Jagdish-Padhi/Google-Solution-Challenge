/**
 * Common Validation Utilities
 * Centralised, reusable helpers used across all validators.
 */

/**
 * Creates a standardised 400 validation error.
 */
export function validationError(message) {
	const error = new Error(message);
	error.statusCode = 400;
	return error;
}

/**
 * Strictly validates an HTTP or HTTPS URL.
 * Rejects bare domains, random strings, and protocol-less inputs.
 */
export function isValidUrl(value) {
	if (typeof value !== 'string') return false;
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
}

/**
 * Email validation.
 * Local part must start with a letter or digit.
 * Allows dots, hyphens, underscores, and plus signs in the middle.
 * Domain must have at least one dot and a 2+ char TLD.
 */
export function isValidEmail(value) {
	if (typeof value !== 'string') return false;
	const trimmed = value.trim();
	if (trimmed.length > 254) return false; // RFC max email length
	// Local part: starts with alphanumeric, can contain . _ + -
	// Domain: alphanumeric with hyphens, at least one dot, 2+ char TLD
	return /^[a-zA-Z0-9][a-zA-Z0-9._+\-]*@[a-zA-Z0-9][a-zA-Z0-9.\-]*\.[a-zA-Z]{2,}$/.test(trimmed);
}

/**
 * Validates a 24-hex-char MongoDB ObjectId string.
 */
export function isValidMongoId(value) {
	if (typeof value !== 'string') return false;
	return /^[0-9a-fA-F]{24}$/.test(value.trim());
}

/**
 * Validates a non-empty trimmed string within length bounds.
 * Returns the trimmed value or throws.
 */
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
