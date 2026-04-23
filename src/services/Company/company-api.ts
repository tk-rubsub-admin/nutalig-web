import { api } from 'api/api';
import { CompanyListResponse } from './company-type';

export const getAllCompany = async () => {
  const response: CompanyListResponse = await api
    .get(`/v1/companies`)
    .then((response) => response.data);
  return response.data;
};
