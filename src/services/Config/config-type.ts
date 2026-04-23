import { Pagination } from 'services/general-type';

export const GROUP_CODE = Object.freeze({
  ADVANCE_SALE_ORDER_DAYS: 'ADVANCE_SALE_ORDER_DAYS',
  BANK_NAME: 'BANK_NAME',
  BANK_ACCOUNT: 'BANK_ACCOUNT',
  CHANNEL: 'CHANNEL',
  CREDIT_TERM: 'CREDIT_TERM',
  CUSTOMER_AREA: 'CUSTOMER_AREA',
  CUSTOMER_CREDIT_TERM: 'CUSTOMER_CREDIT_TERM',
  CUSTOMER_RANKING: 'CUSTOMER_RANKING',
  CUSTOMER_TYPE: 'CUSTOMER_TYPE',
  GENDER: 'GENDER',
  NATIONALITY: 'NATIONALITY',
  PAYMENT_METHOD: 'PAYMENT_METHOD',
  PAYMENT_CHANNEL: 'PAYMENT_CHANNEL',
  SENDING_BILL_METHOD: 'SENDING_BILL_METHOD',
  SHIPPING_FEE_METHOD: 'SHIPPING_FEE_METHOD',
  SHIPPING_METHOD: 'SHIPPING_METHOD',
  STAFF_DEPARTMENT: 'STAFF_DEPARTMENT',
  STAFF_TYPE: 'STAFF_TYPE',
  STAFF_TYPE_2: 'STAFF_TYPE_2',
  SUPPLIER_ORDER_METHOD: 'SUPPLIER_ORDER_METHOD',
  SUPPLIER_ORDER_PERIOD: 'SUPPLIER_ORDER_PERIOD',
  SUPPLIER_PRODUCT_TYPE: 'SUPPLIER_PRODUCT_TYPE',
  SUPPLIER_RANKING: 'SUPPLIER_RANKING',
  SUPPLIER_SENDING_METHOD: 'SUPPLIER_SENDING_METHOD',
  TRANSPORTATION_METHOD: 'TRANSPORTATION_METHOD',
  WORKSPACE: 'WORKSPACE'
});

export interface SystemConfig {
  groupCode: string;
  code: string;
  nameTh: string;
  nameEn: string;
  iconUrl?: string;
  sort?: number;
}

export interface GetSystemConfigResponse {
  data: SystemConfig[];
}

export interface GetSystemConfigListResponse {
  data: {
    systemConfigList: SystemConfig[];
    pagination: Pagination;
  };
}

export interface GetSystemConstantListResponse {
  data: string[];
}

export interface SearchSystemConfigRequest {
  groupCode?: string;
  code?: string;
  keyword?: string;
}

export interface UpdateSystemConfigRequest {
  nameTh: string;
  nameEn: string;
  sort: number;
}

export interface CreateSystemConfigRequest {
  groupCode: string;
  code: string;
  nameTh: string;
  nameEn: string;
  sort: number;
}
