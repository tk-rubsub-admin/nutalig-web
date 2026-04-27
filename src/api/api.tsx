/* eslint-disable no-restricted-imports */
import config from 'config';
import axios from 'axios';
import ls from 'localstorage-slim';
import { browserName } from 'react-device-detect';
import { STORAGE_KEYS } from 'auth/AuthContext';
import packageInfo from '../../package.json';

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

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      return api(original);
    }

    return Promise.reject(error);
  }
);
