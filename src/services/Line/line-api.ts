/* eslint-disable prettier/prettier */
import { api } from 'api/api';

export const sendTestNoti = async (userId: string) => {
  const response = api.get(`/v1/line/test?userId=${userId}`).then((response) => response.data);
  return response;
};

export const getLineLoginUrl = async (): Promise<string> => {
  const response = await api.get('/v1/auth/line/login/url').then((response) => response.data);

  if (typeof response === 'string') {
    return response;
  }

  if (typeof response?.data?.authorizeUrl === 'string') {
    return response.data.authorizeUrl;
  }

  if (typeof response?.data === 'string') {
    return response.data;
  }

  if (typeof response?.url === 'string') {
    return response.url;
  }

  if (typeof response?.data?.url === 'string') {
    return response.data.url;
  }

  throw new Error('LINE login url is invalid');
};
