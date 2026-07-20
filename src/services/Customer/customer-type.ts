import { Tumbon, Amphure, Province } from 'services/Address/address-type';
import { SystemConfig } from 'services/Config/config-type';
import { Pagination } from 'services/general-type';
import { Supplier } from 'services/Supplier/supplier-type';

export const GENDER = {
  MALE: 'MALE',
  FEMALE: 'FEMALE'
} as const;

export interface CreateCustomerRequest {
  customerName: string;
  customerType: string;
  email: string;
  taxId: string;
  companyName: string;
  branchNumber: string;
  branchName: string;
  creditTerm: string;
  paymentTerm: string;
  customerSegment: string;
  customerTier: string;
  salesAccount: string;
  salesAccounts: string[];
  coSalesAccount: string;
  address: CreateCustomerAddressRequest;
  contacts: CreateCustomerContactRequest[];
}

export interface CreateCustomerAddressRequest {
  addressType: string;
  label: string;
  isDefault: boolean;
  addressLine1: string;
  addressLine2: string;
  subdistrict: string | undefined;
  district: string | undefined;
  province: string | undefined;
  postcode: string;
  country: string;
}

export interface CreateCustomerContactRequest {
  contactName: string;
  contactNumber: string;
}
export interface CreateCustomerDropOffRequest {
  shippingMethod: string;
  shippingFeeMethod: string;
  supplierId: string;
  dropOffName: string;
  isDefaultDropOff: boolean;
  remark: string;
  shopName: string;
}

export interface CreateCustomerRequestV2 {
  customerName: string;
  contactNumber: string;
  area: string;
  creditTerm: string;
  supplierId: string;
  dropOffName: string;
  amphureId: string;
  provinceId: string;
  isDefaultDropOff: boolean;
  shopName: string;
  shippingMethod: string;
}

export interface AddCustomerDropOff {
  area: string;
  supplierId: string;
  dropOffName: string;
  amphureId: string;
  provinceId: string;
  shippingMethod: string;
  shopName: string;
}

export interface CreateCustomerResponse {
  data: {
    id: string;
  };
}

export interface CreateCustomerResponseV2 {
  data: {
    customerId: string;
    dropOffId: string;
  };
}

export interface SearchCustomerRequest {
  idEqual: string;
  nameContain: string;
  typeEqual: string;
  tierEqual: string;
  segmentEqual: string;
  rankEqual: string;
  areaEqual: string;
}

export interface SearchCustomerResponse {
  data: {
    customers: Customer[];
    pagination: Pagination;
  };
}

export interface UploadCustomerError {
  rowNumber: number;
  customerName: string;
  message: string;
}

export interface UploadCustomerResponse {
  totalRows: number;
  createdCount: number;
  skippedCount: number;
  failedCount: number;
  errors: UploadCustomerError[];
}

export interface CustomerDashboardBreakdown {
  code: string;
  nameTh: string | null;
  nameEn: string | null;
  count: number;
}

export interface CustomerDashboard {
  generatedAt: string;
  totalCustomers: number;
  totalContacts: number;
  totalAddresses: number;
  companyCustomers: number;
  individualCustomers: number;
  defaultAddressCustomers: number;
  typeBreakdown: CustomerDashboardBreakdown[];
  tierBreakdown: CustomerDashboardBreakdown[];
  segmentBreakdown: CustomerDashboardBreakdown[];
  recentCustomers: Customer[];
}

export interface UpdateCustomerRequest {
  customerName: string | null;
  customerType: string | null;
  customerTier: string | null;
  customerSegment: string | null;
  email: string | null;
  taxId: string | null;
  companyName: string | null;
  branchNumber: string | null;
  branchName: string | null;
  creditTerm: string | null;
  paymentTerm: string | null;
  salesAccount: string | null;
  salesAccounts: string[] | null;
  coSalesAccount: string | null;
}

export interface Customer {
  id: string;
  customerName: string;
  status: string;
  customerType: SystemConfig;
  customerCreditTerm: SystemConfig;
  customerPaymentTerm: SystemConfig | null;
  customerTier: SystemConfig | null;
  customerSegment: SystemConfig | null;
  companyName: string;
  branchNumber: string;
  branchName: string;
  taxId: string;
  addresses: Address[];
  contacts: Contact[];
  email: string;
  salesAccount: string;
  salesAccounts: string[];
  coSalesAccount: string;
  totalSalesOrderAmount: number;
  createdBy: string;
  createdDate: string;
  updatedBy: string;
  updatedDate: string;
}

export interface Address {
  id: string;
  addressType: string;
  isDefault: boolean;
  label: string;
  fullAddress: string;
  addressLine1: string;
  addressLine2: string;
  subdistrict: string;
  district: string;
  province: string;
  postcode: string;
  country: string;
}

export interface Contact {
  id: string;
  contactName: string;
  contactNumber: string;
  isDefault: boolean;
}

export interface CustomerDropOff {
  index: number;
  id: string;
  supplier: Supplier | null;
  shippingMethod: SystemConfig | string | null;
  shippingFeeMethod: SystemConfig | string | null;
  area: SystemConfig | string | null;
  isDefault: boolean;
  dropOffName: string;
  envelopName: string;
  remark: string;
  province: Province;
  amphure: Amphure;
  shopName: string;
  createdBy: string;
  createdDate: string;
  updatedBy: string;
  updatedDate: string;
}
