import { api } from 'api/api';
import {
  SearchCustomerRequest,
  SearchCustomerResponse,
  CreateCustomerRequest,
  CreateCustomerAddressRequest,
  CreateCustomerContactRequest,
  CreateCustomerResponse,
  UpdateCustomerRequest,
  Customer,
  CreateCustomerRequestV2,
  CreateCustomerResponseV2,
  UploadCustomerResponse,
  CustomerDashboard
} from './customer-type';
import { AxiosProgressEvent } from 'axios';

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
export const getAllCustomer = async (data: SearchCustomerRequest = {} as SearchCustomerRequest) => {
  const response = await api
    .post(`/v1/customers/all`, data)
    .then((response) => response.data);
  return response.data;
};

export const getCustomerDashboard = async (salesId?: string): Promise<CustomerDashboard> => {
  const response = await api
    .get(`/v1/customers/dashboard`, {
      params: {
        ...(salesId ? { salesId } : {})
      }
    })
    .then((response) => response.data);
  return response.data;
};

export const searchCustomerByKeyword = async (keyword: string, page: number, size: number): Promise<Customer[]> => {
  const response = await api
    .get(`/v1/customers?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`)
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

export const deleteCustomer = async (id: string) => {
  const response: Customer = await api
    .delete(`/v1/customers/${id}`)
    .then((response) => response.data);
  return response;
};

export const addCustomerAddress = async (id: string, data: CreateCustomerAddressRequest) => {
  const response: Customer = await api
    .post(`/v1/customers/${id}/addresses`, data)
    .then((response) => response.data);
  return response;
};

export const removeCustomerAddress = async (id: string, addressId: string) => {
  const response: Customer = await api
    .delete(`/v1/customers/${id}/addresses/${addressId}`)
    .then((response) => response.data);
  return response;
};

export const addCustomerContact = async (id: string, data: CreateCustomerContactRequest) => {
  const response: Customer = await api
    .post(`/v1/customers/${id}/contacts`, data)
    .then((response) => response.data);
  return response;
};

export const removeCustomerContact = async (id: string, contactId: string) => {
  const response: Customer = await api
    .delete(`/v1/customers/${id}/contacts/${contactId}`)
    .then((response) => response.data);
  return response;
};

export const uploadCustomers = async (
  file: File,
  onUploadProgress?: (progress: number) => void
): Promise<UploadCustomerResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/v1/customers/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (event: AxiosProgressEvent) => {
      if (!event.total) {
        return;
      }

      const progress = Math.round((event.loaded * 100) / event.total);
      onUploadProgress?.(Math.min(progress, 99));
    }
  });

  onUploadProgress?.(100);
  return response.data.data;
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
