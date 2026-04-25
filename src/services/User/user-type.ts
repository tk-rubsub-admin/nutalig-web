import { Pagination } from 'services/general-type';

export interface LoginRequest {
  userId: string;
}

export interface LoginResponse {
  status: string;
  data: { token: string };
}

export interface UserProfileResponse {
  id: string;
  username: string;
  email: string;
  role: Role;
  status: string;
  permissions: string[];
  displayName: string;
  pictureUrl: string;
  salesId: string;
  employeeId: string;
}

export interface SearchUserResponse extends Response {
  data: {
    users: UserProfileResponse[];
    pagination: Pagination;
  };
}

export interface SearchUserRequest {
  usernameContain: string;
  roleNameEqual: string;
  roleIn: string[];
  activeEqual: string;
  companyIdEqual: string;
}

export interface GetAllRole {
  data: Role[];
}

export interface Role {
  roleCode: string;
  roleNameTh: string;
  roleNameEn: string;
}

export interface CreateNewUserRequest {
  password: string;
  email: string;
  role: string;
  staffId: string;
  companyIdList: string[];
}

export interface UpdateUserRequest {
  email: string;
  role: string;
  companyId: string;
}

export interface GoogleCredentialRequest {
  credential: string | undefined;
}

export interface LineLoginRequest {
  accessToken: string;
  idToken: string;
}

export interface SearchRoleResponse {
  data: Role[];
}

export interface Company {
  id: string;
  nameTh: string;
  nameEn: string;
  status: string;
  email: string;
  taxId: string;
  address: string;
  branchCode: string;
  branchName: string;
  phoneNumber: string;
  createdDate: string;
  updatedDate: string;
}

export interface UpdateLineConnectRequest {
  userId: string;
  lineUserId: string;
}
