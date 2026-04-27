import { SystemConfig } from 'services/Config/config-type';
import { Pagination } from 'services/general-type';
import { Role } from 'services/User/user-type';

export interface EmployeeUserDetail {
  id: string;
  username: string;
  role: Role | null;
  status: string;
  createdDate: string;
  permissions: string[] | null;
  lineUserId: string | null;
  displayName: string | null;
  pictureUrl: string | null;
  employeeId: string | null;
}

export interface EmployeeRecord {
  employeeId: string;
  firstNameTh: string | null;
  lastNameTh: string | null;
  nickName: string | null;
  phoneNumber: string | null;
  status: string;
  additional: string | null;
  isDefault: boolean | null;
  position: SystemConfig | null;
  team: SystemConfig | null;
  hasUser?: boolean;
  userId?: string | null;
  userDto?: EmployeeUserDetail | null;
}

export interface GetEmployeesResponse {
  status: string;
  data: {
    pagination: Pagination;
    records: EmployeeRecord[];
  };
}

export interface EmployeeDetailResponse {
  status: string;
  data: EmployeeRecord;
}
