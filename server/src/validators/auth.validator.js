// Auth request validator placeholder.
export function validateAuthPayload(payload = {}) {
  return Boolean(payload.email && payload.password);
}
