import { api } from 'api/api';
import {
  GetSystemConfigListResponse,
  GetSystemConfigResponse,
  GetSystemConstantListResponse,
  SearchSystemConfigRequest,
  CreateSystemConfigRequest,
  UpdateSystemConfigRequest
} from './config-type';

export const getSystemConfig = async (groupCode: string) => {
  const response: GetSystemConfigResponse = await api
    .get(`/v1/system-configs/${groupCode}`)
    .then((response) => response.data);
  return response.data;
};

export const getSystemConfigList = async (
  page = 1,
  size = 20,
  filters: SearchSystemConfigRequest = {}
) => {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size)
  });

  if (filters.groupCode) {
    params.set('groupCode', filters.groupCode);
  }

  if (filters.code) {
    params.set('code', filters.code);
  }

  if (filters.keyword) {
    params.set('keyword', filters.keyword);
  }

  const response: GetSystemConfigListResponse = await api
    .get(`/v1/system-configs?${params.toString()}`)
    .then((response) => response.data);

  return response.data;
};

export const getSystemConstantList = async () => {
  const response: GetSystemConstantListResponse = await api
    .get('/v1/system-constants')
    .then((response) => response.data);

  return response.data;
};

export const updateSystemConfig = async (
  groupCode: string,
  code: string,
  payload: UpdateSystemConfigRequest
) => {
  const response = await api
    .put(`/v1/system-configs/${groupCode}/${code}`, payload)
    .then((response) => response.data);

  return response;
};

export const createSystemConfig = async (payload: CreateSystemConfigRequest) => {
  const response = await api.post('/v1/system-configs', payload).then((response) => response.data);

  return response;
};
