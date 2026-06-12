import { isValidEmail, validateStringField } from './common.js';

function buildResult(valid, errors = []) {
  return {
    valid,
    errors,
  };
}

export function validateRegisterPayload(payload = {}) {
  const errors = [];
  const orgName = typeof payload.orgName === 'string' ? payload.orgName.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';
  const confirmPassword = typeof payload.confirmPassword === 'string' ? payload.confirmPassword : '';

  if (!orgName) {
    errors.push('Organization name is required.');
  } else if (orgName.length < 2) {
    errors.push('Organization name must be at least 2 characters.');
  } else if (orgName.length > 100) {
    errors.push('Organization name must be 100 characters or fewer.');
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
