const API_BASE_URL = process.env.REACT_APP_API_URL?.replace(/\/+$/, '') || 'http://localhost:5000';

export const getApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

export default getApiUrl;
