import { SystemConfig } from 'services/Config/config-type';
import { Pagination } from 'services/general-type';

export interface SalesRecord {
  salesId: string;
  type: SystemConfig | null;
  name: string;
  nickname: string;
  isDefault?: boolean;
  mobileNo: string | null;
  bankAccountNo: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  team: SystemConfig | null;
}

export interface GetSalesResponse {
  status: string;
  data: {
    pagination: Pagination;
    records: SalesRecord[];
  };
}

export const superAdminPump = {
  employeeId: 'NUTALIG-พี่ปั้ม',
  firstNameTh: null,
  lastNameTh: null,
  nickName: 'พี่ปั้ม',
  position: {
    groupCode: 'POSITION',
    code: 'SUPER_ADMIN',
    nameTh: 'ผู้บริหารสูงสุด',
    nameEn: 'Super Administrator',
    sort: 99
  },
  phoneNumber: null,
  status: 'ACTIVE',
  additional: null,
  team: {
    groupCode: 'TEAM',
    code: 'SALES_OFFLINE',
    nameTh: 'ฝ่ายขายออฟไลน์',
    nameEn: 'Sales Offline',
    sort: 1
  },
  isDefault: true
} as const;
