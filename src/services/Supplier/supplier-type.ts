import { Pagination } from 'services/general-type';

export interface SearchSupplierRequest {
  idEqual?: string;
  nameContain?: string;
  supplierCodeEqual?: string;
  supplierEmailContain?: string;
  statusEqual?: string;
  countryCodeEqual?: string;
  contactNameContain?: string;
  contactNumberContain?: string;
  typeIn?: string[];
  typeEqual?: string;
  rankEqual?: string;
  mainProductContain?: string;
  productTypeEqual?: string;
  creditTermEqual?: string;
  bankEqual?: string;
}

export interface SupplierContact {
  id: string;
  contactName: string;
  contactNumber: string;
  wechat: string | null;
  isDefault: boolean;
}

export interface SupplierCapabilityMaterial {
  productMaterialCode: string;
  productMaterial?: {
    code: string;
    productFamilyCode: string;
    nameTh: string | null;
    nameEn: string | null;
  } | null;
}

export interface SupplierCapability {
  productFamilyCode: string;
  productFamily?: {
    code: string;
    nameTh: string | null;
    nameEn: string | null;
  } | null;
  coversAllMaterials: boolean;
  materials: SupplierCapabilityMaterial[];
}

export interface SupplierShippingDestination {
  id: number;
  supplierShippingId: number;
  destinationCode: string | null;
  destinationName: string;
  countryCode: string | null;
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  postalCode: string | null;
  fullAddress: string | null;
  additionalCost: number | null;
  sortOrder: number | null;
}

export interface SupplierShipping {
  id: number;
  shippingMethod: 'LAND' | 'SEA';
  shippingName: string | null;
  originCountryCode: string | null;
  originProvince: string | null;
  currency: string | null;
  baseCost: number | null;
  leadTimeDayMin: number | null;
  leadTimeDayMax: number | null;
  remark: string | null;
  carCode: string | null;
  destinations: SupplierShippingDestination[];
}

export interface Supplier {
  id: string;
  supplierId?: string;
  supplierName: string;
  supplierCode: string;
  supplierShortName?: string;
  supplierEmail: string;
  status: string;
  fullAddress: string;
  fullAddressEn: string | null;
  countryCode: string;
  province: string;
  city: string;
  district: string;
  town: string;
  street: string;
  detailAddress: string;
  postalCode: string | null;
  additional: string | null;
  contacts: SupplierContact[];
  capabilities?: SupplierCapability[];
  contactName?: string;
  contactNumber?: string;
  phoneContactName?: string;
  lineContactName?: string | null;
  lineId?: string | null;
}

export interface SearchSupplierResponse {
  status?: string;
  data: {
    suppliers: Supplier[];
    pagination: Pagination;
  };
}

export interface GetSupplierResponse {
  status?: string;
  data: Supplier;
}
