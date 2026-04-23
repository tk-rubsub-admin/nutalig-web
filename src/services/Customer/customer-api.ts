import { api } from 'api/api';
import {
  SearchCustomerRequest,
  SearchCustomerResponse,
  CreateCustomerRequest,
  CreateCustomerResponse,
  UpdateCustomerRequest,
  Customer,
  CreateCustomerRequestV2,
  CreateCustomerResponseV2
} from './customer-type';

export const searchCustomer = async (data: SearchCustomerRequest, page: number, size: number) => {
  const response: SearchCustomerResponse = await api
    .post(`/v1/customers/search`, data, {
      params: {
        page,
        size
      }
    })
    .then((response) => response.data);
  return response;
};
export const createNewCustomer = async (data: CreateCustomerRequest) => {
  const response: CreateCustomerResponse = await api
    .post(`/v1/customers`, data)
    .then((response) => response.data);
  return response;
};
export const getAllCustomer = async (data: SearchCustomerRequest) => {
  const response: Customer[] = await api
    .post(`/v1/customers/all`, data)
    .then((response) => response.data);
  return response;
};

export const searchCustomerByKeyword = async (keyword: string, page: number, size: number): Promise<Customer[]> => {
  const response = await api
    .get(`/v1/customers?weyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`)
    .then((response) => response.data);

  if (Array.isArray(response?.data?.customers)) {
    return response.data.customers;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response)) {
    return response;
  }

  return [];
};
export const createNewCustomerV2 = async (data: CreateCustomerRequestV2) => {
  const response: CreateCustomerResponseV2 = await api
    .post(`/v2/customers`, data)
    .then((response) => response.data);
  return response;
};

export const getCustomer = async (id: string) => {
  const response = await api.get(`/v1/customers/${id}`).then((response) => response.data);
  return response.data;
};

export const updateCustomer = async (id: string, data: UpdateCustomerRequest) => {
  const response: Customer = await api
    .patch(`/v1/customers/${id}`, data)
    .then((response) => response.data);
  return response;
};

export const addDropOff = async (id: string, data: any) => {
  const response: Customer = await api
    .post(`/v1/customers/${id}/drop-offs`, data)
    .then((response) => response.data);
  return response;
};

export const addDropOffV2 = async (id: string, data: any) => {
  const response = await api
    .post(`/v1/customers/${id}/drop-offs/add`, data)
    .then((response) => response.data);
  return response;
};

export const removeDropOff = async (id: string, dropOffId: string) => {
  const response: Customer = await api
    .delete(`/v1/customers/${id}/drop-offs/${dropOffId}`)
    .then((response) => response.data);
  return response;
};
