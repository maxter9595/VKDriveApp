export function getApiBaseUrl() {
  return import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
}
