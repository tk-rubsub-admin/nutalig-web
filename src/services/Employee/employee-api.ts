import { api } from 'api/api';
import { EmployeeDetailResponse, EmployeeRecord, GetEmployeesResponse } from './employee-type';

export const getEmployees = async (
  page: number,
  size: number,
  keyword: string
): Promise<GetEmployeesResponse> => {
  const response: GetEmployeesResponse = await api
    .get('/v1/employees', {
      params: {
        page,
        size,
        keyword: keyword.trim()
      }
    })
    .then((response) => response.data);

  return response;
};

export const getEmployee = async (id: string): Promise<EmployeeRecord> => {
  const response: EmployeeDetailResponse = await api
    .get(`/v1/employees/${id}`)
    .then((response) => response.data);

  return response.data;
};
