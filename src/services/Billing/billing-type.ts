/* eslint-disable prettier/prettier */
import { Customer } from 'services/Customer/customer-type';
import { Pagination } from 'services/general-type';
import { Invoice } from 'services/Invoice/invoice-type';

export interface GetBillingNote {
    data: BillingNoteDto
}
export interface BillingNoteDto {
    id: string;
    billingNo: string;
    billingDate: string;
    dueDate: string;
    creditDays: number;
    customer: Customer;
    totalAmount: number;
    picUrls: string[];
    remark: string;
    status: string;
    paidAmount: number;
    paidDate: string;
    receiptNo: string;
    createdDate: string;
    createdBy: string;
    updatedDate: string;
    updatedBy: string;
    billingNoteItems: BillingNoteItemDto[];
}

export interface BillingNoteItemDto {
    id: string;
    invoice: Invoice;
    invoiceNo: string;
    invoiceDate: string;
    invoiceDueDate: string;
    receiptDate: string;
    receiptNo: string;
    paymentStatus: string;
    subtotal: number;
    payableAmount: number;
    paidAmount: number;
    createdAt: string;
}

export interface CreateBillingNoteRequest {
    billingDate: string;
    dueDate: string;
    customerId: string;
    remark: string;
    creditDay: number;
    items: string[];
    discount: number;
    withholdingTaxPercent: number;
}

export interface SearchBillingNoteRequest {
    billingDate: string;
    billingStatusIn: string[];
    billingStatusEqual: string | null;
    customerIdEqual: string;
}

export interface SearchBillingNoteResponse extends Response {
    data: {
        billingNotes: BillingNoteDto[];
        pagination: Pagination;
    };
}