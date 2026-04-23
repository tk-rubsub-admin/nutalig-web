/* eslint-disable prettier/prettier */

import { Address, Contact, Customer } from "services/Customer/customer-type";
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
    salesAccount: null;
    coSalesId: string;
    remark: string;
    status: string;
    discount: number;
    freight: number;
    subTotal: number;
    vat: number;
    vatRate: number;
    grandTotal: number;
    items: QuotationItem[];
}

export interface QuotationItem {
    id: number;
    name: string;
    type: string;
    capacity: string;
    size: string;
    spec: string;
    unitPrice: number;
    quantity: number;
    amount: number;
    imageUrl: string;
}

export interface SearchQuotationRequest {
    docNoEqual: string;
    docDateStart: string;
    docDateEnd: string;
    customerIdEqual: string;
    statusEqual: string;
}

export interface SearchQuotationResponse {
    data: {
        quotationList: Quotation[];
        pagination: Pagination;
    }
}
