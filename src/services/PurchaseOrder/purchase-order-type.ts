import { Supplier, SupplierShipping } from 'services/Supplier/supplier-type';
import { Customer } from 'services/Customer/customer-type';
import { SystemConfig } from 'services/Config/config-type';
import { DocumentStatusProfile } from 'services/document-status-type';
import { Pagination } from 'services/general-type';

export interface CreatePurchaseOrderRequest {
  salesOrderNo: string;
  supplierId: string;
  supplierShippingId: number;
  docDate?: string;
  productionLeadTimeDay?: number | null;
  shippingLeadTimeDay?: number | null;
  paymentTerm?: string | null;
  shippingMethodSnapshot?: string | null;
  containerSizeSnapshot?: string | null;
  supplierContactSnapshot?: string | null;
  supplierContactNoSnapshot?: string | null;
  supplierAddressSnapshot?: string | null;
  remark?: string;
  items?: CreatePurchaseOrderItemRequest[];
}

export interface CreatePurchaseOrderItemRequest {
  salesOrderDetailId?: number | null;
  name?: string | null;
  spec?: string | null;
  quantity?: number | null;
  supplierCurrency?: string | null;
  supplierUnitPrice?: number | null;
  supplierShippingCost?: number | null;
  components?: PurchaseOrderDetailComponentRequest[];
}

export interface PurchaseOrderDetailComponentRequest {
  sourceQuoteDetailPackageId?: number | null;
  componentCode?: string | null;
  componentName?: string | null;
  specification?: string | null;
  quantityPerItem?: number | null;
  unit?: string | null;
  remark?: string | null;
  sortOrder?: number | null;
}

export interface CreatePurchaseOrderResponse {
  purchaseOrderNo: string;
}

export interface PurchaseOrderCbmPreviewRequest {
  salesOrderNo: string;
  items: Array<{ salesOrderDetailId: number; quantity: number }>;
}

export interface PurchaseOrderPackageSnapshot {
  id?: number | null;
  sourcePackageId?: number | null;
  packageName?: string | null;
  packageDimension?: string | null;
  packageWeight?: string | null;
  packageCapacity?: string | null;
  widthCm?: number | null;
  lengthCm?: number | null;
  heightCm?: number | null;
  capacityQty?: number | null;
  cartonCount?: number | null;
  cbmPerCarton?: number | null;
  totalCbm?: number | null;
  selectedForCalculation?: boolean | null;
  sortOrder?: number | null;
}

export interface PurchaseOrderCbmPreview {
  totalCbm: number;
  unavailableItemCount: number;
  items: Array<{
    salesOrderDetailId: number;
    supplierQuoteTierId?: number | null;
    quantity: number;
    totalCbm?: number | null;
    available: boolean;
    reason?: string | null;
    packages: PurchaseOrderPackageSnapshot[];
  }>;
}

export interface UpdatePurchaseOrderItemRequest {
  id?: number | null;
  salesOrderDetailId?: number | null;
  name?: string | null;
  type?: string | null;
  capacity?: string | null;
  size?: string | null;
  spec?: string | null;
  quantity?: number | null;
  supplierCurrency?: string | null;
  supplierUnitPrice?: number | null;
  exchangeRate?: number | null;
  supplierShippingCost?: number | null;
  supplierTotalUnitCost?: number | null;
  imageUrl?: string | null;
  rfqDetailId?: number | null;
  rfqTierId?: number | null;
  quotationDetailId?: number | null;
  shippingMethod?: string | null;
  supplierQuoteTierId?: number | null;
  components?: PurchaseOrderDetailComponentRequest[];
}

export interface UpdatePurchaseOrderRequest {
  docDate?: string | null;
  productionLeadTimeDay?: number | null;
  shippingLeadTimeDay?: number | null;
  remark?: string | null;
  items?: UpdatePurchaseOrderItemRequest[];
}

export interface SearchPurchaseOrderRequest {
  purchaseOrderNo?: string;
  salesOrderNo?: string;
  salesId?: string;
  supplierId?: string;
  docDateStart?: string;
  docDateEnd?: string;
  status?: string | null;
  statuses?: string[];
  shippingMethod?: string;
  keyword?: string;
}

export interface PurchaseOrderItem {
  id: number;
  salesOrderDetailId: number | null;
  lineNo: number | null;
  name: string;
  type: string | null;
  capacity: string | null;
  size: string | null;
  spec: string | null;
  quantity: number;
  supplierCurrency: string | null;
  supplierUnitPrice: number | null;
  exchangeRate: number | null;
  supplierShippingCost: number | null;
  supplierTotalUnitCost: number | null;
  amountSupplierCurrency: number | null;
  amountThb: number | null;
  imageUrl: string | null;
  rfqDetailId?: number | null;
  rfqTierId?: number | null;
  quotationDetailId?: number | null;
  shippingMethod?: string | null;
  supplierQuoteTierId?: number | null;
  packages?: PurchaseOrderPackageSnapshot[];
  components?: PurchaseOrderDetailComponent[];
}

export interface PurchaseOrderDetailComponent extends PurchaseOrderDetailComponentRequest {
  id?: number | null;
  totalQuantity?: number | null;
}

export type PurchaseOrderAttachmentDocumentType =
  | 'FACTORY_CONTRACT'
  | 'FINAL_ARTWORK'
  | 'PAYMENT_SLIP'
  | 'OTHER';

export interface PurchaseOrderAttachment {
  id: number;
  purchaseOrderNo: string;
  documentType?: PurchaseOrderAttachmentDocumentType | null;
  fileName: string | null;
  originalFileName: string | null;
  fileUrl: string | null;
  contentType: string | null;
  fileSize: number | null;
  remark: string | null;
  lateStartReason: string | null;
  sortOrder: number | null;
}

export type PurchaseOrderPaymentType = 'DEPOSIT' | 'BALANCE' | 'INSTALLMENT' | 'OTHER';
export type PurchaseOrderPaymentMethod = 'TRANSFER' | 'CHEQUE' | 'CASH';
export type PurchaseOrderPaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'VOIDED';
export type PurchaseOrderPaymentLifecycleStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
export type PurchaseOrderPaymentScheduleStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';

export interface PurchaseOrderPaymentSchedule {
  id: number;
  installmentNo: number;
  paymentType: PurchaseOrderPaymentType;
  percentage: number;
  expectedAmount: number;
  expectedAmountThb: number;
  paidAmount: number;
  paidAmountThb: number;
  pendingAmount: number;
  pendingAmountThb: number;
  outstandingAmount: number;
  outstandingAmountThb: number;
  status: PurchaseOrderPaymentScheduleStatus;
  dueDate: string | null;
}

export interface PurchaseOrderPaymentRequest {
  scheduleId?: number | null;
  paymentType: PurchaseOrderPaymentType;
  installmentNo?: number | null;
  paymentDate: string;
  amount: number;
  exchangeRate?: number | null;
  paymentMethod: PurchaseOrderPaymentMethod;
  transferReference?: string | null;
  chequeBank?: string | null;
  chequeNo?: string | null;
  chequeDate?: string | null;
  chequeBranch?: string | null;
  remark?: string | null;
  requestKey?: string | null;
}

export interface PurchaseOrderPaymentAttachment {
  id: number;
  fileName: string | null;
  originalFileName: string | null;
  fileUrl: string | null;
  contentType: string | null;
  fileSize: number | null;
  sortOrder: number | null;
}

export interface PurchaseOrderPayment {
  id: number;
  scheduleId: number | null;
  paymentType: PurchaseOrderPaymentType;
  installmentNo: number | null;
  paymentDate: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  amountThb: number;
  paymentMethod: PurchaseOrderPaymentMethod;
  transferReference: string | null;
  chequeBank: string | null;
  chequeNo: string | null;
  chequeDate: string | null;
  chequeBranch: string | null;
  remark: string | null;
  status: PurchaseOrderPaymentStatus;
  rejectionReason: string | null;
  approvedDate: string | null;
  rejectedDate: string | null;
  voidedDate: string | null;
  voidReason: string | null;
  createdDate: string | null;
  updatedDate: string | null;
  attachments: PurchaseOrderPaymentAttachment[];
}

export interface PurchaseOrderRecord {
  purchaseOrderNo: string;
  salesOrderNo: string | null;
  docDate: string | null;
  productionLeadTimeDay: number | null;
  shippingLeadTimeDay: number | null;
  status: string;
  statusProfile?: DocumentStatusProfile;
  currency: string | null;
  exchangeRate: number | null;
  supplier: Supplier | null;
  supplierShipping: SupplierShipping | null;
  paymentTerm: SystemConfig | null;
  subTotal: number;
  subTotalThb: number;
  grandTotal: number;
  grandTotalThb: number;
  paymentStatus: PurchaseOrderPaymentLifecycleStatus;
  paidTotal: number;
  paidTotalThb: number;
  outstandingTotal: number;
  outstandingTotalThb: number;
  totalCbm?: number | null;
  remark: string | null;
  lateStartReason: string | null;
  productionStartedDate: string | null;
  productionExpectedEndDate: string | null;
  productionCompletedDate: string | null;
  revNo: number | null;
  supplierNameSnapshot: string | null;
  supplierAddressSnapshot: string | null;
  supplierContactSnapshot: string | null;
  supplierPhoneSnapshot: string | null;
  supplierContactNoSnapshot: string | null;
  shippingMethodSnapshot: string | null;
  containerSizeSnapshot: string | null;
  attachments: PurchaseOrderAttachment[];
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderProductionCalendarRecord {
  purchaseOrderNo: string;
  salesOrderNo: string | null;
  salesName: string | null;
  supplierName: string | null;
  customer: Customer | null;
  startDate: string | null;
  expectedFinishDate: string;
  actualFinishDate: string | null;
  status: string | null;
  overdue: boolean;
}

export interface PurchaseOrderTimelineEvent {
  type: string;
  label: string;
  date: string;
  completed: boolean;
}

export interface PurchaseOrderTimeline {
  purchaseOrderNo: string;
  customer: Customer | null;
  productionLeadTimeDay: number | null;
  productionStartedDate: string | null;
  productionExpectedEndDate: string | null;
  productionCompletedDate: string | null;
  overdue: boolean;
  events: PurchaseOrderTimelineEvent[];
}

export interface SearchPurchaseOrderResponse {
  status: string;
  data: {
    records: PurchaseOrderRecord[];
    pagination: Pagination;
  };
}
