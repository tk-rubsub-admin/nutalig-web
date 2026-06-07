/* eslint-disable prettier/prettier */

import { Address, Contact, Customer } from "services/Customer/customer-type";
import { EmployeeDetailResponse, EmployeeRecord } from "services/Employee/employee-type";
import { Pagination } from "services/general-type";

export interface CreateQuotationRequest {
    docDate: string;
    effectiveDate: string;
    customerId: string;
    customerAddressId: string;
    customerContactId: string;
    salesId: string;
    coSalesId: string;
    remark: string;
    discount: number;
    freight: number;
    isVat: boolean;
    rfqId: string;
    items: CreateQuotationItem[];
};

export interface CreateQuotationItem {
    id: number;
    name: string;
    type: string;
    capacity: string;
    size: string;
    spec: string;
    unitPrice: number;
    quantity: number;
    unitPriceInput: string;
    amount: number;
    imageFile: null;
    imagePreview: string;
};

export interface Quotation {
    quotationNo: string;
    docDate: string;
    effectiveDate: string;
    customer: Customer;
    customerAddress: Address;
    customerContact: Contact;
    saleAccount?: EmployeeRecord;
    salesAccount: EmployeeRecord;
    coSalesId: string;
    coSaleId?: string;
    remark: string;
    status: string;
    revNo?: number;
    discount: number;
    freight: number;
    subTotal: number;
    vat: number;
    vatRate: number;
    grandTotal: number;
    items: QuotationItem[];
}

export interface QuotationItem {
    id: number | string;
    name: string;
    type: string;
    capacity: string;
    size: string;
    spec: string;
    unitPrice: number;
    quantity: number;
    amount: number;
    imagePreview?: string;
    imageUrl: string;
}

export interface UpdateQuotationRequest {
    remark: string;
    items: QuotationItem[];
}

export interface SearchQuotationRequest {
    docNoEqual: string;
    docDateStart: string;
    docDateEnd: string;
    customerIdEqual: string;
    statusEqual: string | null;
}

export interface SearchQuotationResponse {
    data: {
        quotationList: Quotation[];
        pagination: Pagination;
    }
}

export interface GetQuotationResponse {
    data: Quotation;
}
