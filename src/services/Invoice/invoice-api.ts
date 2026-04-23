/* eslint-disable prettier/prettier */
import { api } from 'api/api';
import { SearchInvoiceRequest, SearchInvoiceResponse } from './invoice-type';
import { UpdateSaleOrderBilling } from 'services/SaleOrder/sale-order-type';

export const searchInvoice = async (data: SearchInvoiceRequest, page: number, size: number, sortBy: string) => {
    const response: SearchInvoiceResponse = await api
        .post(`/v1/invoices/search`, data, {
            params: {
                page,
                size,
                sortBy
            }
        })
        .then((response) => response.data);
    return response;
};

export const getInvoice = async (id: string) => {
    const response = await api
        .get(`/v1/invoices/${id}`)
        .then(response => response.data)
    return response.data;
}


export const viewInvoiceBySaleOrder = async (id: string, original: boolean, copy: boolean) => {
    const response = await api
        .get(`/v1/invoices/sale-orders/${id}/document/view?format=PDF&isOriginal=${original}&isCopy=${copy}`)
        .then(response => response)
    return response
}

export const viewInvoice = async (id: string, original: boolean, copy: boolean) => {
    const response = await api
        .get(`/v1/invoices/${id}/document/view?format=PDF&isOriginal=${original}&isCopy=${copy}`)
        .then(response => response)
    return response
}


export const downloadInvoice = async (id: string, format: string, original: boolean, copy: boolean) => {
    const response = await api
        .get(`/v1/invoices/${id}/document?format=${format}&isOriginal=${original}&isCopy=${copy}`)
        .then(response => response)
    return response
}

export const downloadInvoiceList = async (ids: string[], original: boolean, copy: boolean) => {
    const response = await api
        .get(`/v1/invoices/documents?format=PDF&ids=${ids}&isOriginal=${original}&isCopy=${copy}`)
        .then(response => response)
    return response
}

export const completeInvoice = async (id: string) => {
    const response = await api
        .patch(`/v1/invoices/${id}/completed`)
        .then(response => response)
    return response
}

export const updateInvoiceBilling = async (invoiceId: string, data: UpdateSaleOrderBilling) => {
    const response = await api
        .patch(`/v1/invoices/${invoiceId}/billing`, data)
        .then((response) => response.data)
    return response.data;
}

export const confirmPaidInvoice = async (id: string, data: FormData) => {
    const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
    };

    const response = await api
        .post(`/v1/invoices/${id}/confirm-payment`, data, config)
        .then((response) => response.data);
    return response;
};

export const viewReceipt = async (id: string, ids: string[], original: boolean, copy: boolean) => {
    const response = await api
        .get(`/v1/invoices/${id}/receipt/view?format=PDF&ids=${ids}&isOriginal=${original}&isCopy=${copy}`)
        .then(response => response)
    return response
}

export const downloadReceiptList = async (id: string, ids: string[], original: boolean, copy: boolean) => {
    const response = await api
        .get(`/v1/invoices/${id}/receipt/documents?ids=${ids}&format=PDF&isOriginal=${original}&isCopy=${copy}`)
        .then(response => response)
    return response
}

export const viewAllReceipt = async (ids: string[], original: boolean, copy: boolean) => {
    const response = await api
        .get(`/v1/invoices/receipt/documents?ids=${ids}&format=PDF&isOriginal=${original}&isCopy=${copy}`)
        .then(response => response)
    return response
}

export const downloadAllReceipt = async (ids: string[], format: string, original: boolean, copy: boolean) => {
    const response = await api
        .get(`/v1/invoices/receipt/documents?ids=${ids}&format=${format}&isOriginal=${original}&isCopy=${copy}`)
        .then(response => response)
    return response
}

export const updateInvoice = async (invoiceId: string, data: { invoiceHeader: string }) => {
    const response = await api
        .patch(`/v1/invoices/${invoiceId}`, data)
        .then((response) => response.data)
    return response.data;
}