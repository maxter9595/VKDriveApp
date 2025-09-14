export const getApiBaseUrl = () => {
  return process.env.SERVER_URL || 'http://localhost:3001';
};

export default { getApiBaseUrl };