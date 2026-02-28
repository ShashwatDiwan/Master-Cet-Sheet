import axios from 'axios';

// default to backend context-path used in development
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const api = axios.create({
  baseURL,
  withCredentials: true, // in case we switch to cookies
});

const TOKEN_KEY = 'auth_token';

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// attach token to every request
api.interceptors.request.use(config => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// global error handling: clear token on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response && err.response.status === 401) {
      setToken(null);
      // optionally redirect to login
    }
    return Promise.reject(err);
  }
);

export default api;
