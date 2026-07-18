import { Address, Contact, Customer } from 'services/Customer/customer-type';
import { EmployeeRecord } from 'services/Employee/employee-type';
import { Pagination } from 'services/general-type';
import { DocumentStatusProfile } from 'services/document-status-type';

export type ReceiptType =
  | 'RECEIPT'
  | 'DEPOSIT_RECEIPT'
  | 'RECEIPT_TAX_INVOICE'
  | 'DEPOSIT_TAX_INVOICE';

export interface CreateReceiptRequest {
  invoiceNo: string;
  invoicePaymentId: number;
  receiptType: ReceiptType;
  docDate?: string;
  remark?: string;
}

export interface CreateReceiptResponse {
  receiptNo: string;
}

export interface ReceiptItem {
  id: number;
  invoiceDetailId: number | null;
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

export interface ReceiptRecord {
  receiptNo: string;
  receiptType: ReceiptType;
  status: string;
  statusProfile?: DocumentStatusProfile;
  invoiceNo: string;
  invoicePaymentId: number;
  salesOrderNo: string | null;
  quotationNo: string | null;
  docDate: string | null;
  paidDate: string | null;
  currency: string | null;
  customer: Customer | null;
  customerAddress: Address | null;
  customerContact: Contact | null;
  saleAccount: EmployeeRecord | null;
  coSaleId: string | null;
  subTotal: number;
  discount: number;
  amount: number;
  vatRate: number;
  vat: number;
  grandTotal: number;
  paymentMethod: 'TRANSFER' | 'CHEQUE' | 'CASH';
  chequeBank: string | null;
  chequeNo: string | null;
  chequeDate: string | null;
  chequeBranch: string | null;
  slipFileName: string | null;
  slipFileUrl: string | null;
  remark: string | null;
  revNo: number | null;
  items: ReceiptItem[];
}

export interface SearchReceiptRequest {
  receiptNo?: string;
  invoiceNo?: string;
  customerId?: string;
  salesId?: string;
  receiptType?: ReceiptType | null;
  status?: string | null;
  statuses?: string[];
  docDateStart?: string;
  docDateEnd?: string;
  keyword?: string;
}

export interface SearchReceiptResponse {
  status: string;
  data: {
    records: ReceiptRecord[];
    pagination: Pagination;
  };
}
