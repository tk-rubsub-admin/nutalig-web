import { api } from 'api/api';
import {
  CreateStaffResponse,
  SearchStaffRequest,
  SearchStaffResponse,
  Staff,
  UpdateStaffRequest
} from './staff-type';
import { SearchRoleResponse } from 'services/User/user-type';

export const searchStaff = async (data: SearchStaffRequest, page: number, size: number) => {
  const response: SearchStaffResponse = await api
    .post(`/v1/staffs/search`, data, {
      params: {
        page,
        size
      }
    })
    .then((response) => response.data);
  return response;
};

export const createStaff = async (data: FormData): Promise<CreateStaffResponse> => {
  const config = {
    headers: { 'Content-Type': 'multipart/form-data' }
  };

  const response: CreateStaffResponse = await api
    .post('/v1/staffs', data, config)
    .then((response) => response.data);
  return response;
};

export const getStaff = async (id: string): Promise<Staff> => {
  const response = await api.get(`/v1/staffs/${id}`).then((response) => response.data);
  return response.data;
};

export const getRoleList = async () => {
  const response: SearchRoleResponse = await api
    .get(`/v1/staff/roles`)
    .then((response) => response.data);
  return response.data;
};
export const updateStaff = async (req: UpdateStaffRequest, staffId: string) => {
  const response = await api
    .patch(`/v1/staffs/${staffId}`, req)
    .then((response) => response.data);
  return response;
};

export const deleteStaff = async (staffId: string) => {
  const response = await api
    .delete(`/v1/staffs/${staffId}`)
    .then((response) => response.data);
  return response;
};

export const inactiveStaff = async (staffId: string) => {
  const response = await api
    .patch(`/v1/staffs/${staffId}/inactive`)
    .then((response) => response.data);
  return response;
};

export const activeStaff = async (staffId: string) => {
  const response = await api
    .patch(`/v1/staffs/${staffId}/active`)
    .then((response) => response.data);
  return response;
};

export const uploadStaff = async (data: FormData) => {
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  };

  const response = await api
    .post(`/v1/staffs/upload`, data, config)
    .then((response) => response.data);
  return response.data;
};

export const exportStaff = async (data: SearchStaffRequest) => {
  const response = await api
    .post(`/v1/staffs/export`, data)
    .then((response) => response);
  return response;
};
