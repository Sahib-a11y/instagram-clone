const API_BASE_URL = process.env.REACT_APP_API_URL?.replace(/\/+$/, '');

export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

export default getApiUrl;
