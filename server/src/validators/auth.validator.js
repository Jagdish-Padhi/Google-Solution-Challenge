import { isValidEmail } from './common.js';

function buildResult(valid, errors = []) {
  return {
    valid,
    errors,
  };
}

// Must start with a letter; allows letters, digits, spaces, hyphens, apostrophes, dots
function isValidName(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 100) return false;
  return /^[A-Za-z][A-Za-z0-9 '\-.]{1,99}$/.test(trimmed);
}

export function validateRegisterPayload(payload = {}) {
  const errors = [];
  const orgName = typeof payload.orgName === 'string' ? payload.orgName.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';
  const confirmPassword = typeof payload.confirmPassword === 'string' ? payload.confirmPassword : '';

  if (!orgName) {
    errors.push('Organization name is required.');
  } else if (!isValidName(orgName)) {
    errors.push('Name must be 2-100 characters, start with a letter, and contain only letters, numbers, spaces, hyphens, or dots.');
  }

  if (!email) {
    errors.push('Email address is required.');
  } else if (!isValidEmail(email)) {
    errors.push('Please enter a valid email address (e.g. user@example.com).');
  }

  if (!password) {
    errors.push('Password is required.');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  } else if (password.length > 128) {
    errors.push('Password must be 128 characters or fewer.');
  }

  if (confirmPassword && confirmPassword !== password) {
    errors.push('Password and confirm password do not match.');
  }

  return buildResult(errors.length === 0, errors);
}

export function validateLoginPayload(payload = {}) {
  const errors = [];
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';

  if (!email) {
    errors.push('Email address is required.');
  } else if (!isValidEmail(email)) {
    errors.push('Please enter a valid email address.');
  }

  if (!password) {
    errors.push('Password is required.');
  }

  return buildResult(errors.length === 0, errors);
}
