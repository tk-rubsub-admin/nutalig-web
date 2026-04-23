import { api } from 'api/api';
import {
  GoogleCredentialRequest,
  LineLoginRequest,
  LoginRequest,
  LoginResponse,
  UserProfileResponse
} from './User/user-type';
import { UploadFileResponse } from './general-type';

export const login = async (req: LoginRequest) => {
  const response = await api.post('/v1/login', req).then((response) => response.data);

  return response;
};

export const logout = async (req: LoginRequest) => {
  const response = await api.post('/v1/logout', req).then((response) => response.data);

  return response;
};

export const googleLogin = async (req: GoogleCredentialRequest): Promise<LoginResponse> => {
  const response: LoginResponse = await api
    .post('/v1/auth/google/login', req)
    .then((response) => response.data);

  return response;
};

export const lineLogin = async (req: LineLoginRequest): Promise<LoginResponse> => {
  const response: LoginResponse = await api
    .post('/v1/auth/line/login', req)
    .then((response) => response.data);

  return response;
};

export const oneTimeLogin = async (token: string) => {
  const response = await api
    .post('/v1/auth/one-time-login', { token })
    .then((response) => response.data);

  return response;
};

export const getUserProfile = async (): Promise<UserProfileResponse> => {
  const response: UserProfileResponse = await api
    .get('/v1/user/profile')
    .then((response) => response.data.data);

  return response;
};

export const getGoogleUserProfile = async (
  req: GoogleCredentialRequest
): Promise<UserProfileResponse> => {
  const response: UserProfileResponse = await api
    .post('/v1/user/google-profile', req)
    .then((response) => response.data);

  return response;
};

export const getJobStatus = async (id: string) => {
  const response = await api.get(`/v1/jobs/${id}`).then((response) => response.data);
  console.log(JSON.stringify(response));
  return response;
};

export const uploadFile = async (file: File): Promise<UploadFileResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/v1/files/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data.data;
};
