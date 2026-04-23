import { Amphure, Province, Tumbon } from 'services/Address/address-type';
import { SystemConfig } from 'services/Config/config-type';
import { Pagination } from 'services/general-type';
import { ProductDto } from 'services/Product/product-type';

export interface SearchSupplierRequest {
  idEqual: string;
  nameContain: string;
  typeIn: string[];
  typeEqual: string;
  rankEqual: string;
  mainProductContain: string;
  productTypeEqual: string;
  statusEqual: string;
  contactNameContain: string;
  contactNumberContain: string;
  creditTermEqual: string;
  bankEqual: string;
}

export interface SearchSupplierResponse extends Response {
  data: {
    suppliers: Supplier[];
    pagination: Pagination;
  };
}

export interface GetSupplier {
  data: Supplier;
}

export interface Supplier {
  profileImage: string;
  supplierId: string;
  supplierName: string;
  supplierShortName: string;
  supplierProductType: SystemConfig;
  mainProduct: string;
  supplierRank: SystemConfig;
  status: string;
  contactName: string;
  contactNumber: string;
  phoneContactName: string;
  lineContactName: string;
  lineId: string;
  behavior: string;
  displayWorkingHour: string;
  startWorkingHour: string;
  endWorkingHour: string;
  senderName: string;
  period: SystemConfig;
  orderMethod: SystemConfig;
  sendingMethod: SystemConfig;
  creditTerm: SystemConfig;
  paymentMethod: SystemConfig;
  comment: string;
  createdDate: string;
  createdBy: string;
  updatedDate: string;
  updatedBy: string;
  addressDetail: string;
  addressTumbon: Tumbon;
  addressAmphure: Amphure;
  addressProvince: Province;
  location: string;
  types: SupplierType[];
  accounts: SupplierAccount[];
  isOpen: boolean;
  workingDays: string[];
  sellProducts: ProductDto[];
}

export interface SupplierType {
  typeId: string;
  typeName: string;
  typeIcon: string;
}

export interface SupplierAccount {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  createdDate: string;
  createdBy: string;
  updatedDate: string;
  updatedBy: string;
}

export interface CreateSupplierRequest {
  supplierName: string;
  supplierShortName: string;
  supplierProductType: string;
  mainProduct: string;
  supplierRank: string;
  status: string;
  contactName: string;
  contactNumber: string;
  behavior: string;
  startWorkingHour: string;
  endWorkingHour: string;
  period: string;
  orderMethod: string;
  sendingMethod: string;
  senderName: string;
  addressDetail: string;
  tumbonId: string;
  amphureId: string;
  provinceId: string;
  location: string;
  creditTerm: string;
  paymentMethod: string;
  comment: string;
  typeId: string[];
  accountRequests: SupplierAccount[];
  openDays: string[];
  lineId: string;
  sellProducts: ProductDto[];
}

export interface CreateSupplierResponse {
  data: {
    id: string;
  };
}

export interface GetAllSupplierType {
  data: SupplierType[];
}
