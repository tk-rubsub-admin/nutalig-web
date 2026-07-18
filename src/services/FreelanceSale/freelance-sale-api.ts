import { api } from 'api/api';
import { CreateFreelanceSaleRequest, FreelanceSaleRecord, GetFreelanceSalesResponse } from './freelance-sale-type';

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
