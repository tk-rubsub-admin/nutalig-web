/* eslint-disable prettier/prettier */
import { api } from 'api/api';
import { CreateQuotationRequest, SearchQuotationRequest, SearchQuotationResponse } from './document-type';

export const createQuotation = async (data: CreateQuotationRequest) => {
    const response: string = await api
        .post(`/v1/quotations`, data)
        .then((response) => response.data);
    return response;
};

export const searchQuotation = async (data: SearchQuotationRequest, page: number, size: number) => {
    const response: SearchQuotationResponse = await api
        .post(`/v1/quotations/search`, data, {
            params: {
                page,
                size
            }
        })
        .then((response) => response.data);
    return response;
};

export const viewQuotation = async (id: string, original: boolean, copy: boolean) => {
    const response = await api
        .get(`/v1/quotations/document?id=${id}&format=PDF&isOriginal=${original}&isCopy=${copy}`)
        .then(response => response)
    return response
}
