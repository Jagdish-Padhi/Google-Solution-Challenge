function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function buildResult(valid, errors = []) {
  return {
    valid,
    errors,
  };
}

export function validateRegisterPayload(payload = {}) {
  const errors = [];
  const orgName = typeof payload.orgName === 'string' ? payload.orgName.trim() : '';
  const email = normalizeEmail(payload.email);
  const password = typeof payload.password === 'string' ? payload.password : '';
  const confirmPassword = typeof payload.confirmPassword === 'string' ? payload.confirmPassword : '';

  if (!orgName) {
    errors.push('Organization name is required.');
  }

  if (!email || !email.includes('@')) {
    errors.push('A valid email address is required.');
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  if (confirmPassword && confirmPassword !== password) {
    errors.push('Password and confirm password do not match.');
  }

  return buildResult(errors.length === 0, errors);
}

export function validateLoginPayload(payload = {}) {
  const errors = [];
  const email = normalizeEmail(payload.email);
  const password = typeof payload.password === 'string' ? payload.password : '';

  if (!email || !email.includes('@')) {
    errors.push('A valid email address is required.');
  }

  if (!password) {
    errors.push('Password is required.');
  }

  return buildResult(errors.length === 0, errors);
}
