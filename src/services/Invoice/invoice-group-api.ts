/* eslint-disable prettier/prettier */
import { api } from 'api/api';
import { CreateInvoiceGroupRequest, SearchInvoiceGroupResponse, SearchInvoiceRequest } from './invoice-type';

export const createInvoiceGroup = async (data: CreateInvoiceGroupRequest) => {
    const response = await api
        .post(`/v1/invoice-groups`, data)
        .then((response) => response.data);
    return response.data;
}

export const cancelInvoiceGroup = async (id: string) => {
    const response = await api
        .patch(`/v1/invoice-groups/${id}/cancel`)
        .then(response => response)
    return response
}

export const searchInvoiceGroup = async (data: SearchInvoiceRequest, page: number, size: number, sortBy: string) => {
    const response: SearchInvoiceGroupResponse = await api
        .post(`/v1/invoice-groups/search`, data, {
            params: {
                page,
                size,
                sortBy
            }
        })
        .then((response) => response.data);
    return response;
}

export const getInvoiceGroup = async (id: string) => {
    const response = await api
        .get(`/v1/invoice-groups/${id}`)
        .then((response) => response.data);
    return response.data;
}

export const viewInvoiceGroup = async (id: string, original: boolean, copy: boolean) => {
    const response = await api
        .get(`/v1/invoice-groups/${id}/document/view?format=PDF&isOriginal=${original}&isCopy=${copy}`)
        .then(response => response)
    return response
}

export const downloadInvoiceGroup = async (id: string, format: string, original: boolean, copy: boolean) => {
    const response = await api
        .get(`/v1/invoice-groups/${id}/document?format=${format}&isOriginal=${original}&isCopy=${copy}`)
        .then(response => response)
    return response
}