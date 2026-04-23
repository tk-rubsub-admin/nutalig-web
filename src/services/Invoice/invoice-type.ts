/* eslint-disable prettier/prettier */
import { Customer } from 'services/Customer/customer-type';
import { Pagination } from 'services/general-type';
import { SaleOrder, SaleOrderPicture } from 'services/SaleOrder/sale-order-type';

export interface SearchInvoiceRequest {
    invoiceDate: string;
    invoiceDateStart: string;
    invoiceDateEnd: string;
    poStatusIn: string[];
    poStatusEqual: string | null;
    billingStatusIn: string[];
    billingStatusEqual: string | null;
    customerIdEqual: string;
    paymentStatusEqual: string | null;
    paymentStatusIn: string[];
}

export interface SearchInvoiceResponse extends Response {
    data: {
        invoices: Invoice[];
        pagination: Pagination;
    };
}
export interface Invoice {
    invoiceNo: string;
    invoiceDate: string;
    dueDate: string;
    poId: string;
    orderStatus: string;
    saleOrder: SaleOrder;
    poAmount: number;
    receiptNo: string;
    receiptDate: string;
    invoiceAmount: number;
    invoiceStatus: string;
    billingStatus: string;
    paymentStatus: string;
    paymentChannel: string;
    bankAccount: string;
    receipts: Receipt[];
    slips: SaleOrderPicture[];
    customer: Customer;
    createdDate: string;
    createdBy: string;
    updatedDate: string;
    updatedBy: string;
}

export interface Receipt {
    receiptNo: string;
    receiptDate: string;
    amount: number;
    paymentChannel: string;
    bankAccount: string;
    referenceNo: string;
}

export interface CreateInvoiceGroupRequest {
    invoiceDate: string;
    dueDate: string;
    customerId: string;
    remark: string;
    creditDay: number;
    items: string[];
    discount: number;
    withholdingTaxPercent: number;
}

export interface InvoiceGroup {
    invoiceNo: string;
    invoiceDate: string;
    dueDate: string;
    creditDays: number;
    customer: Customer;
    totalAmount: number;
    discount: number;
    whtAmount: number;
    subtotal: number;
    remark: string;
    invoiceStatus: string;
    paymentStatus: string;
    receipts: Receipt[];
    items: InvoiceGroupItem;
}

export interface InvoiceGroupItem {
    invoice: Invoice;
    invoiceDate: string;
    invoiceDueDate: string;
    subtotal: number;
    payableAmount: number;
    createdAt: string;
    paidAmount: number;
}

export interface SearchInvoiceGroupResponse extends Response {
    data: {
        invoiceGroups: InvoiceGroup[];
        pagination: Pagination;
    };
}
