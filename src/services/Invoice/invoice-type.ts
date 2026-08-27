import { Address, Contact, Customer } from 'services/Customer/customer-type';
import { EmployeeRecord } from 'services/Employee/employee-type';
import { Pagination } from 'services/general-type';
import { DocumentStatusProfile } from 'services/document-status-type';
import { CustomerSnapshot } from 'services/SaleOrder/sale-order-type';
import { SystemConfig } from 'services/Config/config-type';

export interface CreateInvoiceRequest {
  salesOrderNo: string;
  docDate?: string;
  dueDate?: string;
  deliveryDate?: string;
  remark?: string;
  subTotal?: number;
  discount?: number;
  amount?: number;
  vat?: number;
  grandTotal?: number;
  customerPaymentTerm?: string;
  customerSnapshot?: CustomerSnapshot;
}

export interface UpdateInvoiceRequest {
  deliveryDate?: string | null;
  customerPaymentTerm?: string | null;
  customerSnapshot?: CustomerSnapshot;
}

export interface CreateInvoiceResponse {
  invoiceNo: string;
}

export interface InvoicePayment {
  id: number;
  paymentDate: string;
  amount: number;
  paymentMethod: 'TRANSFER' | 'CHEQUE' | 'CASH';
  status?: 'PENDING' | 'APPROVE' | 'REJECT';
  chequeBank: string | null;
  chequeNo: string | null;
  chequeDate: string | null;
  chequeBranch: string | null;
  slipFileName: string | null;
  slipFileUrl: string | null;
  slipFiles?: InvoicePaymentSlipFile[];
  receiptNo: string | null;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface InvoicePaymentSlipFile {
  id: number;
  fileName: string | null;
  originalFileName: string | null;
  fileUrl: string | null;
  contentType: string | null;
  fileSize: number | null;
  sortOrder: number | null;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface SearchInvoiceRequest {
  invoiceNo?: string;
  docDateStart?: string;
  docDateEnd?: string;
  customerId?: string;
  salesId?: string;
  status?: string | null;
  statuses?: string[];
  keyword?: string;
}

export interface InvoiceItem {
  id: number;
  lineNo: number;
  name: string;
  type: string | null;
  capacity: string | null;
  size: string | null;
  spec: string | null;
  unitPrice: number;
  quantity: number;
  amount: number;
  imageUrl: string | null;
}

export interface InvoiceRecord {
  invoiceNo: string;
  salesOrderNo: string | null;
  quotationNo: string | null;
  docDate: string | null;
  dueDate: string | null;
  deliveryDate: string | null;
  status: string;
  statusProfile?: DocumentStatusProfile;
  currency: string | null;
  customer: Customer | null;
  customerAddress: Address | null;
  customerContact: Contact | null;
  customerSnapshot?: CustomerSnapshot;
  saleAccount: EmployeeRecord | null;
  coSaleId: string | null;
  subTotal: number;
  discount: number;
  freight: number;
  amount: number;
  commission: number;
  vatRate: number;
  vat: number;
  grandTotal: number;
  paidTotal: number;
  outstandingTotal: number;
  remark: string | null;
  revNo: number | null;
  customerNameSnapshot?: string | null;
  customerTaxIdSnapshot?: string | null;
  customerAddressSnapshot?: string | null;
  customerContactSnapshot?: string | null;
  customerPhoneSnapshot?: string | null;
  customerPaymentTerm?: SystemConfig | null;
  salesNameSnapshot?: string | null;
  requiredApprove?: boolean | null;
  requiredApproveReason?: string | null;
  requiredApproveStatus?: string | null;
  requestRequiredApprovedBy?: string | null;
  requestRequiredApprovedDate?: string | null;
  approvedBy?: string | null;
  approvedDate?: string | null;
  rejectedBy?: string | null;
  rejectedDate?: string | null;
  rejectReason?: string | null;
  items: InvoiceItem[];
  payments?: InvoicePayment[];
}

export interface SearchInvoiceResponse {
  status: string;
  data: {
    records: InvoiceRecord[];
    pagination: Pagination;
  };
}

export interface InvoiceAwaitingValidationResponse {
  invoice: InvoiceRecord;
  paymentId: number;
}
