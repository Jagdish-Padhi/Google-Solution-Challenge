// Utility formatter for date/time values.
export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString();
}
