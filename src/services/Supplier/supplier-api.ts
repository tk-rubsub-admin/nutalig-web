import { api } from 'api/api';
import {
  CreateSupplierRequest,
  CreateSupplierResponse,
  GetAllSupplierType,
  GetSupplier,
  SearchSupplierRequest,
  SearchSupplierResponse
} from './supplier-type';

export const searchSupplier = async (data: SearchSupplierRequest, page: number, size: number) => {
  const response: SearchSupplierResponse = await api
    .post(`/v1/suppliers/search`, data, {
      params: {
        page,
        size
      }
    })
    .then((response) => response.data);
  return response;
};

export const getSupplierById = async (id: string) => {
  const response: GetSupplier = await api
    .get(`/v1/suppliers/${id}`)
    .then((response) => response.data);
  return response.data;
};

export const getSupplierType = async () => {
  const response: GetAllSupplierType = await api
    .get(`/v1/suppliers/type`)
    .then((response) => response.data);
  return response.data;
};

export const createSupplier = async (
  req: CreateSupplierRequest
): Promise<CreateSupplierResponse> => {
  const response = await api.post(`/v1/suppliers`, req).then((response) => response.data);
  return response;
};

export const uploadSupplierProfileImage = async (id: string, data: FormData) => {
  const config = {
    headers: { 'Content-Type': 'multipart/form-data' }
  };

  const response = await api
    .post(`/v1/suppliers/${id}/profile-image`, data, config)
    .then((response) => response.data);
  return response;
};

export const uploadSupplier = async (data: FormData) => {
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  };

  const response = await api
    .post(`/v1/suppliers/upload`, data, config)
    .then((response) => response.data);
  return response.data;
};

export const exportSupplier = async (data: SearchSupplierRequest) => {
  const response = await api.post(`/v1/suppliers/export`, data, {
    responseType: 'blob'
  });
  return response;
};
