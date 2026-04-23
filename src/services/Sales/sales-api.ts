import { api } from 'api/api';
import { SystemConfig } from 'services/Config/config-type';
import { SalesRecord, superAdminPump } from './sales-type';

interface EmployeeRecordResponse {
  salesId?: string;
  employeeId?: string;
  id?: string;
  isDefault?: boolean;
  type?: SystemConfig | null;
  position?: SystemConfig | null;
  name?: string;
  firstName?: string;
  lastName?: string;
  firstNameTh?: string | null;
  lastNameTh?: string | null;
  displayName?: string;
  nickname?: string;
  nickName?: string | null;
  mobileNo?: string | null;
  telNo?: string | null;
  phoneNumber?: string | null;
  bankAccountNo?: string | null;
  bankName?: string | null;
  bankAccountName?: string | null;
  team?: SystemConfig | null;
  department?: string | SystemConfig | null;
  workSpace?: string | SystemConfig | null;
}

interface GetEmployeesResponse {
  status?: string;
  data?:
  | EmployeeRecordResponse[]
  | {
    employees?: EmployeeRecordResponse[];
    records?: EmployeeRecordResponse[];
  };
}

const getEmployeeRecords = (response?: GetEmployeesResponse): EmployeeRecordResponse[] => {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return response?.data?.employees || response?.data?.records || [];
};

const toSystemConfig = (
  value?: string | SystemConfig | null,
  groupCode = 'EMPLOYEE_GROUP'
): SystemConfig | null => {
  if (!value) return null;

  if (typeof value === 'string') {
    return {
      groupCode,
      code: value,
      nameTh: value,
      nameEn: value
    };
  }

  return value;
};

const toSalesRecord = (employee: EmployeeRecordResponse): SalesRecord => {
  const fullName = [employee.firstName, employee.lastName].filter(Boolean).join(' ').trim();
  const fullNameTh = [employee.firstNameTh, employee.lastNameTh].filter(Boolean).join(' ').trim();

  return {
    salesId: employee.salesId || employee.employeeId || employee.id || '',
    type: employee.type || employee.position || null,
    name: employee.name || employee.displayName || fullNameTh || fullName,
    nickname: employee.nickname || employee.nickName || '',
    isDefault: employee.isDefault ?? false,
    mobileNo: employee.mobileNo ?? employee.telNo ?? employee.phoneNumber ?? null,
    bankAccountNo: employee.bankAccountNo ?? null,
    bankName: employee.bankName ?? null,
    bankAccountName: employee.bankAccountName ?? null,
    team: employee.team || toSystemConfig(employee.department, 'STAFF_DEPARTMENT') || toSystemConfig(employee.workSpace, 'WORKSPACE')
  };
};

export const getSales = async (page = 1, size = 20): Promise<SalesRecord[]> => {
  const response: GetEmployeesResponse = await api
    .get('/v1/employees', {
      params: {
        page,
        size,
        positionEqual: 'INTERNAL_SALES',
        statusEqual: 'ACTIVE'
      }
    })
    .then((response) => response.data);

  const salesRecords = getEmployeeRecords(response).map(toSalesRecord);
  const superAdminPumpRecord = toSalesRecord(superAdminPump);

  return [superAdminPumpRecord, ...salesRecords].filter(
    (record, index, records) =>
      records.findIndex((candidate) => candidate.salesId === record.salesId) === index
  );
};

export const getProcurementEmployees = async (employeeId: string): Promise<SalesRecord[]> => {
  const response: GetEmployeesResponse = await api
    .get(`/v1/employees/${employeeId}/procurement-employees`)
    .then((response) => response.data);

  return getEmployeeRecords(response).map(toSalesRecord);
};
