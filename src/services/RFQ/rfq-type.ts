import { Pagination } from 'services/general-type';
import { SystemConfig } from 'services/Config/config-type';
import { Supplier } from 'services/Supplier/supplier-type';

export interface RFQProductFamily {
  code: string;
  nameTh?: string | null;
  nameEn?: string | null;
  materialList?: RFQProductMaterial[] | null;
  subtype1List?: RFQProductSubtype1[] | null;
}

export interface RFQProductSubtype1 {
  code: string;
  productFamilyCode?: string | null;
  nameTh?: string | null;
  nameEn?: string | null;
  subtype2Required?: boolean | null;
  subtype2List?: RFQProductSubtype2[] | null;
}

export interface RFQProductSubtype2 {
  code: string;
  productSubtype1Code?: string | null;
  nameTh?: string | null;
  nameEn?: string | null;
}

export interface RFQProductMaterial {
  code: string;
  productFamilyCode?: string | null;
  nameTh?: string | null;
  nameEn?: string | null;
}

export interface RFQAddress {
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

export interface RFQContact {
  id: string;
  contactName: string;
  contactNumber: string;
  remark: string | null;
  isDefault: boolean;
}

export interface RFQCustomer {
  id: string;
  customerName: string;
  status: string;
  customerType: SystemConfig | null;
  customerCreditTerm: SystemConfig | null;
  taxId: string;
  companyName: string;
  branchNumber: string;
  branchName: string;
  email: string;
  salesAccount: string;
  coSalesAccount: string;
  createdBy: string;
  updatedBy: string;
  addresses: RFQAddress[];
  contacts: RFQContact[];
}

export interface RFQEmployee {
  salesId?: string;
  employeeId?: string;
  type?: SystemConfig | null;
  position?: SystemConfig | null;
  name?: string;
  nickname?: string;
  nickName?: string | null;
  firstNameTh?: string | null;
  lastNameTh?: string | null;
  mobileNo?: string | null;
  phoneNumber?: string | null;
  bankAccountNo?: string | null;
  bankName?: string | null;
  bankAccountName?: string | null;
  status?: string | null;
  isDefault?: boolean | null;
  additional?: string | null;
  team?: SystemConfig | null;
}

export interface RFQPicture {
  id: number;
  pictureUrl: string;
  fileUrl?: string | null;
  fileName?: string | null;
  originalFileName?: string | null;
  fileType?: string | null;
  mimeType?: string | null;
  sort: number;
  updatedDate: string;
  updatedBy: string;
}

export interface RFQFileResource {
  id: number;
  pictureUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  originalFileName?: string | null;
  fileType?: string | null;
  mimeType?: string | null;
  sort?: number | null;
  updatedDate?: string | null;
  updatedBy?: string | null;
}

export interface RFQServiceLevelAgreement {
  slaCode: string;
  slaName: string;
  targetDays: number;
  dayType: string;
  dayLeft?: number | null;
  status: string;
  effectiveFrom: string;
  effectiveTo: string;
  createdDate: string;
  createdBy: string;
  updatedDate: string;
  updatedBy: string;
}

export interface RFQStatusTimeline {
  rfqId: string;
  status: string;
  statusDatetime: string;
}

export interface RFQReference {
  id: string;
  requestedDate?: string | null;
  status?: string | null;
  rfqType?: SystemConfig | null;
  productFamily?: RFQProductFamily | string | null;
  productSubtype1?: RFQProductSubtype1 | null;
  productSubType2?: RFQProductSubtype2 | null;
  material?: RFQProductMaterial | string | null;
}

export interface RFQDetailTier {
  id: number;
  quantity: number;
  productPrice: number;
  commission?: number | null;
  currency?: string | null;
  exchangeRate?: number | null;
  landFreightCost: number;
  seaFreightCost: number;
  isFcl?: boolean | null;
  landTotalPrice: number;
  seaTotalPrice: number;
  supplierQuoteTierId?: number | null;
  sortOrder: number;
  createdDate: string;
  updatedDate: string;
}

export interface RFQDetailOption {
  id: number;
  optionName: string;
  spec: string;
  sortOrder: number;
  remark: string | null;
  commission?: number | null;
  packageBoxWidth?: string;
  packageBoxLength?: string;
  packageBoxHeight?: string;
  packagePiecesPerBox?: string;
  packageWeightPerBoxKg?: string;
  supplier?: Supplier | null;
  tiers: RFQDetailTier[];
  createdDate: string;
  updatedDate: string;
  createdBy: string;
  updatedBy: string;
}

export interface RFQAdditionalCost {
  id: number;
  costType: SystemConfig | null;
  description: string;
  unit: string | null;
  value: string | null;
  sortOrder: number;
  createdDate: string;
  updatedDate: string;
}

export interface RFQRecord {
  id: string;
  referenceRfqId?: string | null;
  referenceRfq?: RFQReference | null;
  quotationNo?: string | null;
  saleOrderId?: string | null;
  shippingMethod?: 'ALL' | 'LAND' | 'SEA' | null;
  requestInformation?: string | null;
  confirmedDetailId?: number | null;
  confirmedTierId?: number | null;
  confirmedShippingMethod?: string | null;
  confirmedPrice?: number | null;
  confirmedDate?: string | null;
  requestedDate: string;
  status: string;
  serviceLevelAgreement?: RFQServiceLevelAgreement | null;
  slaDate?: string | null;
  contactName: string;
  contactPhone: string;
  sales: RFQEmployee | null;
  procurement?: RFQEmployee | null;
  customer: RFQCustomer | null;
  rfqType: SystemConfig | null;
  orderType: SystemConfig | null;
  pictures: RFQPicture[];
  files?: RFQFileResource[];
  attachments?: RFQFileResource[];
  rfqStatusTimeline?: RFQStatusTimeline[];
  details: RFQDetailOption[];
  additionalCosts: RFQAdditionalCost[];
  productFamily: RFQProductFamily | string | null;
  productUsage?: string;
  productSubtype1?: RFQProductSubtype1 | null;
  systemMechanic?: string;
  productSubType2?: RFQProductSubtype2 | null;
  material: RFQProductMaterial | string | null;
  capacity: string;
  targetPrice?: number | null;
  requestedMoqs?: number[] | null;
  urgentRequest?: boolean | null;
  urgentRequestReason?: string | null;
  urgentRequestStatus?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | null;
  urgentRequestedBy?: string | null;
  urgentRequestedDate?: string | null;
  urgentApprovedBy?: string | null;
  urgentApprovedDate?: string | null;
  urgentRejectedBy?: string | null;
  urgentRejectedDate?: string | null;
  urgentRejectReason?: string | null;
  description: string;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
  finalSupplier?: Supplier | null;
  finalSupplierQuoteId?: string | null;
  finalLandFreightCost?: number | null;
  finalSeaFreightCost?: number | null;
  finalRemark?: string | null;
  finalPriceDate?: string | null;
}

export interface SearchRFQResponse {
  data: {
    pagination: Pagination;
    records: RFQRecord[];
  };
}

export interface GetRFQResponse {
  data: RFQRecord;
}

export interface CreateRFQRequest {
  customerId?: string;
  referenceRfqId?: string;
  contactName: string;
  contactPhone: string;
  salesId: string;
  procurementId?: string;
  rfqTypeCode: string;
  orderTypeCode: string;
  shippingMethod: 'ALL' | 'LAND' | 'SEA';
  productFamily: string;
  productUsage: string;
  systemMechanic: string;
  material: string;
  capacity: string;
  targetPrice?: number | null;
  requestedMoqs?: number[];
  urgentRequest?: boolean;
  urgentRequestReason?: string;
  description: string;
  pictures: File[];
}

export interface CreateRFQResponse {
  status: string;
  data?: {
    id?: string;
  };
}

export interface UpdateRFQRequest {
  referenceRfqId?: string | null;
  rfqTypeCode?: string;
  orderTypeCode: string;
  productFamily: string;
  productUsage: string;
  systemMechanic: string;
  material: string;
  capacity: string;
  targetPrice?: number | null;
  requestedMoqs?: number[];
  description: string;
  requestInformation?: string;
}

export interface RequestRFQInformationRequest {
  rfqId: string;
  requestInformation: string;
}

export interface RejectUrgentRFQRequest {
  reason: string;
}

export interface LinkRFQSalesOrderRequest {
  saleOrderId: string;
  detailId?: number;
  tierId?: number;
  shippingMethod?: 'LAND' | 'SEA';
  price?: number | null;
  selections?: LinkRFQSalesOrderSelectionRequest[];
}

export interface LinkRFQSalesOrderSelectionRequest {
  detailId: number;
  tierId: number;
  shippingMethod: 'LAND' | 'SEA';
  price?: number | null;
}

export interface CreateRFQDetailTierRequest {
  quantity: number;
  productPrice: number;
  commission?: number | null;
  currency?: string | null;
  exchangeRate?: number | null;
  landFreightCost: number;
  seaFreightCost: number;
  isFcl?: boolean | null;
  landTotalPrice: number;
  seaTotalPrice: number;
  supplierQuoteTierId?: number | null;
  sortOrder: number;
}

export interface CreateRFQDetailRequest {
  optionName: string;
  spec: string;
  sortOrder: number;
  remark: string | null;
  commission?: number | null;
  recommend?: string | null;
  supplierId?: string;
  tiers: CreateRFQDetailTierRequest[];
}

export interface CreateRFQAdditionalCostRequest {
  costTypeCode: string;
  description: string;
  unit: string;
  value: string;
  sortOrder: number;
  supplierId?: string;
}

export interface UpdateRFQResponse {
  status: string;
  data?: RFQRecord;
}

export interface UpdateRFQPicturesResponse {
  status: string;
}

export interface RFQInquiryMessage {
  id: string;
  rfqId: string;
  supplierId?: string | null;
  versionNo: number;
  status: string;
  thaiMessage: string;
  chineseMessage: string;
  sourceSnapshot?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface GenerateRFQInquiryResponse {
  status: string;
  data?: RFQInquiryMessage;
}

export interface GenerateRFQInquiryTextResponse {
  status: string;
  data?: string;
}

export interface GenerateRFQInquiryRequest {
  supplierId: string;
}

export interface UpdateRFQInquiryRequest {
  thaiMessage: string;
  chineseMessage: string;
}

export interface RFQSupplierQuoteTier {
  id?: number;
  quantity: number;
  productPrice: number;
  shippingCost: number | null;
  productPriceCurrency?: string | null;
  shippingCostCurrency?: string | null;
  currency: string | null;
  sortOrder: number;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface RFQSupplierQuoteDetail {
  id?: number;
  rfqDetailId?: number | null;
  optionName: string;
  spec: string;
  sortOrder: number;
  remark: string | null;
  packageName?: string | null;
  packageDimension?: string | null;
  packageWeight?: string | null;
  packageCapacity?: string | null;
  packages?: RFQSupplierQuotePackage[];
  tiers: RFQSupplierQuoteTier[];
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface RFQSupplierQuotePackage {
  id?: number;
  packageName?: string | null;
  packageDimension?: string | null;
  packageWeight?: string | null;
  packageCapacity?: string | null;
  sortOrder: number;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface RFQSupplierQuoteAdditionalCost {
  id?: number;
  description: string;
  unit: string | null;
  value: string | null;
  sortOrder: number;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface UpsertRFQSupplierQuoteTierRequest {
  quantity: number;
  productPrice: number;
  shippingCost?: number | null;
  commission?: number | null;
  landTotalPrice?: number | null;
  seaTotalPrice?: number | null;
  sortOrder: number;
  productPriceCurrency?: string | null;
  shippingCostCurrency?: string | null;
  currency: string;
}

export interface UpsertRFQSupplierQuoteDetailRequest {
  rfqDetailId?: number | null;
  optionName: string;
  spec: string;
  sortOrder: number;
  remark: string | null;
  packageName?: string | null;
  packageDimension?: string | null;
  packageWeight?: string | null;
  packageCapacity?: string | null;
  packages?: UpsertRFQSupplierQuotePackageRequest[];
  tiers: UpsertRFQSupplierQuoteTierRequest[];
}

export interface UpsertRFQSupplierQuotePackageRequest {
  packageName?: string | null;
  packageDimension?: string | null;
  packageWeight?: string | null;
  packageCapacity?: string | null;
  sortOrder: number;
}

export interface UpsertRFQSupplierQuoteAdditionalCostRequest {
  description: string;
  unit: string | null;
  value: string | null;
  sortOrder: number;
}

export interface RFQSupplierQuote {
  id: string;
  rfqId: string;
  supplier: Supplier;
  inquiryId?: string | null;
  revisionNo?: number | null;
  status: string;
  remark?: string | null;
  details: RFQSupplierQuoteDetail[];
  additionalCosts: RFQSupplierQuoteAdditionalCost[];
  createdBy?: string | null;
  updatedBy?: string | null;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface UpsertRFQSupplierQuoteRequest {
  supplierId: string;
  inquiryId?: string | null;
  status?: string;
  remark?: string | null;
  recommend?: string | null;
  details: UpsertRFQSupplierQuoteDetailRequest[];
  additionalCosts: UpsertRFQSupplierQuoteAdditionalCostRequest[];
}

export interface ExtractRFQSupplierQuoteRequest {
  supplierId: string;
  inquiryId?: string | null;
  defaultCurrency?: string | null;
  supplierMessage: string;
}

export interface RFQSupplierQuoteListResponse {
  status: string;
  data?: RFQSupplierQuote[];
}

export interface RFQSupplierQuoteResponse {
  status: string;
  data?: RFQSupplierQuote;
}
