import { Company } from 'services/Company/company-type';
import { SystemConfig } from 'services/Config/config-type';
import { Pagination } from 'services/general-type';
import { Role } from 'services/User/user-type';

export interface Staff {
  id: string;
  userId: string;
  employeeId: string;
  picture: string;
  firstName: string;
  lastName: string;
  nickname: string;
  displayName: string;
  type: SystemConfig;
  department: string;
  staffType: string;
  role: Role;
  duty: string;
  company: Company;
  nationality: SystemConfig;
  status: string;
  telNo: string;
  lineId: string;
  isUser: boolean;
  isLineConnect: boolean;
  lineUserId: string;
  workSpace: SystemConfig;
  workingStartDate: string;
  startWorkingTime: string;
  endWorkingTime: string;
  createdBy: string;
  createdDate: string;
  updatedBy: string;
  updatedDate: string;
}

export interface StaffKPI {
  staff: Staff;
  score: number;
}

export interface SearchStaffResponse {
  data: {
    staffs: Staff[];
    pagination: Pagination;
  };
}

export interface SearchStaffRequest {
  idEqual: string;
  roleEqual: string;
  companyIdEqual: string;
  statusEqual: string;
  typeEqual: string;
  nationalityEqual: string;
  workspaceEqual: string;
  startWorkingTime: string;
  endWorkingTime: string;
}

export interface CreateStaffRequest {
  picture: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  nickname: string;
  telNo: string;
  nationality: string;
  roleCode: string;
  duty: string;
  workingStartDate: string;
  workSpace: string;
  staffType: string;
  companyId: string;
  startWorkingTime: string;
  endWorkingTime: string;
  lineId: string;
  department: string;
}

export interface CreateStaffResponse {
  data: {
    id: string;
  };
}

export interface UpdateStaffRequest {
  picture: string;
  firstName: string;
  lastName: string;
  nickname: string;
  telNo: string;
  lineId: string;
  roleCode: string;
  duty: string;
  workSpace: string;
  type: string;
  staffType: string;
  companyId: string;
  startWorkingTime: string;
  endWorkingTime: string;
  status: string;
  nationality: string;
  department: string;
  workingStartDate: string;
}
