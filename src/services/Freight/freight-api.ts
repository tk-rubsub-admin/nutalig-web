/* eslint-disable prettier/prettier */
import { api } from 'api/api';
import { GetFreightPriceRequest, SearchFreightRequest, SearchFreightResponse } from './freight-type';

export const getFreightPriceByProvinceId = async (id: string) => {
    const response = await api
        .get(`/v1/freight/provinces/${id}`)
        .then((response) => response.data);
    return response;
};

export const searchFreight = async (data: SearchFreightRequest, page: number, size: number) => {
    const response: SearchFreightResponse = await api
        .post(`/v1/freights/search`, data, {
            params: {
                page,
                size
            }
        })
        .then((response) => response.data);
    return response.data;
};

export const uploadFreight = async (data: FormData) => {
    const config = {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    };

    const response = await api
        .post(`/v1/freights/upload`, data, config)
        .then((response) => response.data);
    return response.data;
};

export const exportFreight = async () => {
    const response = await api
        .post(`/v1/freights/export`, {}, {
            responseType: 'blob'
        });
    return response;
};

export const getFreightPrice = async (data: GetFreightPriceRequest) => {
    const response = await api
        .post(`/v1/freight-price`, data)
        .then((response) => response.data);
    return response;
}