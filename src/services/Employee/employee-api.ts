import { api } from 'api/api';
import {
  CheckExistingEmployeeResponse,
  CreateEmployeeRequest,
  CreateEmployeeResponse,
  EmployeeDetailResponse,
  EmployeeRecord,
  GetEmployeesResponse,
  UpdateEmployeeRequest,
  UpdateEmployeeResponse
} from './employee-type';

interface SearchEmployeesResponse {
  status: string;
  data: {
    pagination: GetEmployeesResponse['data']['pagination'];
    employees: GetEmployeesResponse['data']['records'];
  };
}

export const getEmployees = async (
  page: number,
  size: number,
  keyword: string
): Promise<GetEmployeesResponse> => {
  const response: SearchEmployeesResponse = await api
    .post(
      '/v1/employees/search',
      {
        keyword: keyword.trim()
      },
      {
        params: {
          page,
          size
        }
      }
    )
    .then((response) => response.data);

  return {
    status: response.status,
    data: {
      pagination: response.data.pagination,
      records: response.data.employees
    }
  };
};

export const getEmployee = async (id: string): Promise<EmployeeRecord> => {
  const response: EmployeeDetailResponse = await api
    .get(`/v1/employees/${id}`)
    .then((response) => response.data);

  return response.data;
};

export const createEmployee = async (
  payload: CreateEmployeeRequest
): Promise<CreateEmployeeResponse> => {
  const response: CreateEmployeeResponse = await api
    .post('/v1/employees', payload)
    .then((response) => response.data);

  return response;
};

export const checkExistingEmployeeId = async (employeeId: string): Promise<boolean> => {
  const response: CheckExistingEmployeeResponse = await api
    .get('/v1/employees/check-existing', {
      params: {
        employeeId
      }
    })
    .then((response) => response.data);

  return response.data.exists;
};

export const updateEmployee = async (
  employeeId: string,
  payload: UpdateEmployeeRequest
): Promise<UpdateEmployeeResponse> => {
  const response: UpdateEmployeeResponse = await api
    .patch(`/v1/employees/${employeeId}`, payload)
    .then((response) => response.data);

  return response;
};
