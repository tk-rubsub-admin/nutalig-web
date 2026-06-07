/* eslint-disable no-restricted-imports */
import config from 'config';
import axios from 'axios';
import ls from 'localstorage-slim';
import { browserName } from 'react-device-detect';
import { STORAGE_KEYS } from 'auth/AuthContext';
import packageInfo from '../../package.json';

const AUTH_BYPASS_PATHS = [
  '/v1/login',
  '/v1/logout',
  '/v1/auth/line/login',
  '/v1/auth/line/register',
  '/v1/auth/one-time-login'
];
const FORCED_LOGOUT_MARKER = 'nutalig:forced-logout';

const shouldBypassForcedLogout = (url?: string) =>
  typeof url === 'string' && AUTH_BYPASS_PATHS.some((path) => url.includes(path));

const forceLogoutToLogin = () => {
  if (typeof window === 'undefined') {
    return;
  }

  if (sessionStorage.getItem(FORCED_LOGOUT_MARKER) === '1') {
    return;
  }

  sessionStorage.setItem(FORCED_LOGOUT_MARKER, '1');
  ls.clear();
  window.location.replace('/login?reason=session-replaced');
};

const notifyAuthorizationStale = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent('nutalig:authorization-stale'));
};

export const api = axios.create({
  baseURL: config.dkpApi,
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
});

api.interceptors.request.use(
  async (config) => {
    config.headers = config.headers || {};
    config.headers['ngrok-skip-browser-warning'] = 'true';

    const token = ls.get<string | null>(STORAGE_KEYS.TOKEN);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const userId = ls.get<string | null>(STORAGE_KEYS.ID);
    config.headers.timestamp = Math.floor(Date.now() / 1000);
    config.headers.user_agent = browserName;
    config.headers.application_version = packageInfo.version;
    if (userId) config.headers.userId = userId;

    return config;
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry && !shouldBypassForcedLogout(original.url)) {
      original._retry = true;
      return api(original);
    }

    if (status === 401 && !shouldBypassForcedLogout(original?.url)) {
      forceLogoutToLogin();
    }

    if (status === 403 && original && !original._authorizationRefreshRequested) {
      original._authorizationRefreshRequested = true;
      notifyAuthorizationStale();
    }

    return Promise.reject(error);
  }
);
