/* eslint-disable prettier/prettier */
import { api } from 'api/api';
import { LineRegisterValidationResponse } from 'services/User/user-type';

function extractAuthorizeUrl(response: any): string {
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

  if (typeof response?.data?.registrationUrl === 'string') {
    return response.data.registrationUrl;
  }

  if (typeof response?.data?.inviteUrl === 'string') {
    return response.data.inviteUrl;
  }

  throw new Error('LINE authorize url is invalid');
}

export const sendTestNoti = async (userId: string) => {
  const response = api.get(`/v1/line/test?userId=${userId}`).then((response) => response.data);
  return response;
};

export const getLineLoginUrl = async (): Promise<string> => {
  const response = await api.get('/v1/auth/line/login/url').then((response) => response.data);
  return extractAuthorizeUrl(response);
};

export const validateLineRegisterToken = async (
  token: string
): Promise<LineRegisterValidationResponse> => {
  const response = await api
    .get('/v1/auth/line/register/validate', {
      params: { token }
    })
    .then((response) => response.data);

  return response;
};

export const getLineRegisterUrl = async (token: string): Promise<string> => {
  const response = await api
    .get('/v1/auth/line/register/url', {
      params: { token }
    })
    .then((response) => response.data);

  return extractAuthorizeUrl(response);
};
