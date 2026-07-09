import { Supplier, SupplierShipping } from 'services/Supplier/supplier-type';
import { Pagination } from 'services/general-type';

export interface CreatePurchaseOrderRequest {
  salesOrderNo: string;
  supplierId: string;
  supplierShippingId: number;
  docDate?: string;
  productionLeadTimeDay?: number | null;
  shippingLeadTimeDay?: number | null;
  remark?: string;
}

export interface CreatePurchaseOrderResponse {
  purchaseOrderNo: string;
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
  supplierId?: string;
  docDateStart?: string;
  docDateEnd?: string;
  status?: string | null;
  statuses?: string[];
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
}

export interface PurchaseOrderAttachment {
  id: number;
  purchaseOrderNo: string;
  fileName: string | null;
  originalFileName: string | null;
  fileUrl: string | null;
  contentType: string | null;
  fileSize: number | null;
  remark: string | null;
  sortOrder: number | null;
}

export interface PurchaseOrderRecord {
  purchaseOrderNo: string;
  salesOrderNo: string | null;
  docDate: string | null;
  productionLeadTimeDay: number | null;
  shippingLeadTimeDay: number | null;
  status: string;
  currency: string | null;
  exchangeRate: number | null;
  supplier: Supplier | null;
  supplierShipping: SupplierShipping | null;
  subTotal: number;
  subTotalThb: number;
  grandTotal: number;
  grandTotalThb: number;
  remark: string | null;
  revNo: number | null;
  supplierNameSnapshot: string | null;
  supplierAddressSnapshot: string | null;
  supplierContactSnapshot: string | null;
  supplierPhoneSnapshot: string | null;
  attachments: PurchaseOrderAttachment[];
  items: PurchaseOrderItem[];
}

export interface SearchPurchaseOrderResponse {
  status: string;
  data: {
    records: PurchaseOrderRecord[];
    pagination: Pagination;
  };
}
