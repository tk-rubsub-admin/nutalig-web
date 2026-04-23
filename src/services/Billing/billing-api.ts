/* eslint-disable prettier/prettier */
import { api } from 'api/api';
import { BillingNoteDto, CreateBillingNoteRequest, SearchBillingNoteRequest, SearchBillingNoteResponse } from './billing-type';

export const searchBilling = async (data: SearchBillingNoteRequest, page: number, size: number) => {
    const response: SearchBillingNoteResponse = await api
        .post(`/v1/billing-notes/search`, data, {
            params: {
                page,
                size
            }
        })
        .then((response) => response.data);
    return response;
};

export const getBillingNote = async (id: string) => {
    const response: BillingNoteDto = await api
        .get(`/v1/billing-notes/${id}`)
        .then((response) => response.data);
    return response.data;
};

export const createBillingNote = async (data: CreateBillingNoteRequest) => {
    const response = await api
        .post(`/v1/billing-notes`, data)
        .then((response) => response.data);
    return response.data;
}

export const viewBilling = async (id: string, original: boolean, copy: boolean) => {
    const response = await api
        .get(`/v1/billing-notes/${id}/document/view?format=PDF&isOriginal=${original}&isCopy=${copy}`)
        .then(response => response)
    return response
}

export const downloadBilling = async (id: string, format: string, original: boolean, copy: boolean) => {
    const response = await api
        .get(`/v1/billing-notes/${id}/document?format=${format}&isOriginal=${original}&isCopy=${copy}`)
        .then(response => response)
    return response
}

export const cancelBilling = async (id: string) => {
    const response = await api
        .patch(`/v1/billing-notes/${id}/cancel`)
        .then(response => response)
    return response
}

export const confirmBillingNotePayment = async (id: string, data: FormData) => {
    const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
    };

    const response = await api
        .post(`/v1/billing-notes/${id}/confirm-payment`, data, config)
        .then((response) => response.data);
    return response;
};

export const viewBillingReceipt = async (id: string, invoiceNos: string[], original: boolean, copy: boolean) => {
    const response = await api
        .get(`/v1/billing-notes/${id}/receipt/view?format=PDF&isOriginal=${original}&isCopy=${copy}&invoiceNos=${invoiceNos}`)
        .then(response => response)
    return response
}

export const downloadBillingReceipt = async (id: string, format: string, invoiceNos: string[], original: boolean, copy: boolean) => {
    const response = await api
        .get(`/v1/billing-notes/${id}/receipt?format=${format}&isOriginal=${original}&isCopy=${copy}&invoiceNos=${invoiceNos}`)
        .then(response => response)
    return response
}