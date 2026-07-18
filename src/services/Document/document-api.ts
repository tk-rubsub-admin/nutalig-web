/* eslint-disable prettier/prettier */
import { api } from 'api/api';
import { CreateQuotationRequest, GetQuotationResponse, SearchQuotationRequest, SearchQuotationResponse, UpdateQuotationRequest } from './document-type';
import { UploadFileResponse } from 'services/general-type';

export interface CreateQuotationResponse {
    status: string;
    data?: {
        id?: string;
    };
}

export const createQuotation = async (data: CreateQuotationRequest) => {
    const response: CreateQuotationResponse = await api
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

export const getQuotation = async (id: string) => {
    const response: GetQuotationResponse = await api
        .get('/v1/quotation', {
            params: {
                id
            }
        })
        .then((response) => response.data);
    return response;
};

export const updateQuotation = async (id: string, data: UpdateQuotationRequest) => {
    const response: GetQuotationResponse = await api
        .patch('/v1/quotation', data, {
            params: {
                id
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

export const generateQuotationPdfUrl = async (
    id: string,
    original: boolean = true,
    copy: boolean = false
): Promise<UploadFileResponse> => {
    const response = await api
        .post(`/v1/quotations/${id}/pdf-url`, null, {
            params: {
                isOriginal: original,
                isCopy: copy
            }
        })
        .then((response) => response.data);

    return response.data;
};
