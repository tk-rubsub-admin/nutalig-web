import { api } from 'api/api';
import {
  CreateFreelanceSaleRequest,
  FreelanceSaleRecord,
  GetFreelanceSalesResponse,
  SearchFreelanceSaleRequest,
  SearchFreelanceSalesResponse
} from './freelance-sale-type';

export const getFreelanceSales = async (): Promise<FreelanceSaleRecord[]> => {
  const response: GetFreelanceSalesResponse = await api
    .get('/v1/freelance-sales')
    .then((response) => response.data);

  return Array.isArray(response?.data) ? response.data : [];
};

export const createFreelanceSale = async (
  payload: CreateFreelanceSaleRequest
): Promise<FreelanceSaleRecord> => {
  const response = await api
    .post('/v1/freelance-sales', payload)
    .then((apiResponse) => apiResponse.data);

  return response?.data;
};

export const searchFreelanceSales = async (
  payload: SearchFreelanceSaleRequest
): Promise<SearchFreelanceSalesResponse['data']> => {
  const response: SearchFreelanceSalesResponse = await api
    .post('/v1/freelance-sales/search', payload)
    .then((apiResponse) => apiResponse.data);

  return response?.data || { records: [], pagination: { page: 1, size: 10, totalPage: 0, totalRecords: 0 } };
};
