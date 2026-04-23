/* eslint-disable prettier/prettier */
import { api } from 'api/api';
import { CreatePurchaseOrderLineListRequest, CreatePurchaseOrderRequest, GetPurchaseOrderResponse, ReceiveProductResponse, ReCreatePurchaseOrderRequest, SearchPurchaseOrderRequest, SearchPurchaseOrderResponse, UpdateReceiveProductRequest } from './purchase-order-type';
import { UpdateSaleOrderLineSupplierRequest } from 'services/SaleOrder/sale-order-type';

export const getReceiveProductByDate = async (date: string) => {
    const response: ReceiveProductResponse = await api
        .get(`/v1/purchase-order/receive-product?date=${date}`)
        .then((response) => response.data);

    return response.data;
};

export const updateReceiveProduct = async (polId: string, data: UpdateReceiveProductRequest) => {
    const response = await api
        .patch(`/v1/purchase-orders/${polId}/receive-product/update`, data)
        .then((response) => response);

    return response;
}

export const searchPurchaseOrder = async (data: SearchPurchaseOrderRequest, page: number, size: number) => {
    const response: SearchPurchaseOrderResponse = await api
        .post(`/v1/purchase-orders/search`, data, {
            params: {
                page,
                size
            }
        })
        .then((response) => response.data);
    return response;
}

export const getPurchaseOrder = async (id: string) => {
    const response: GetPurchaseOrderResponse = await api
        .get(`/v1/purchase-orders/${id}`)
        .then((response) => response.data);
    return response.data;
};

export const createPurchaseOrder = async (data: CreatePurchaseOrderRequest) => {
    const response = await api
        .post(`/v1/purchase-orders`, data)
        .then((response) => response.data);
    return response.data;
}

export const generateReceiveMessage = async (poId: string) => {
    const response = await api
        .get(`/v1/purchase-orders/${poId}/receive-message`)
        .then((response) => response.data)
    return response.data;
}

export const generatePurchaseOrderMessage = async (poId: string) => {
    const response = await api
        .get(`/v1/purchase-orders/${poId}/purchase-order-message`)
        .then((response) => response.data)
    return response.data;
}

export const updatePurchaseOrderLineStatus = async (poId: string | undefined, polId: string, status: string) => {
    const response = await api
        .patch(`/v1/purchase-orders/${poId}/lines/${polId}/status/${status}`)
        .then((response) => response.data)
    return response.data;
}

export const createPurchaseOrderLine = async (poId: string, data: CreatePurchaseOrderLineListRequest) => {
    const response = await api
        .post(`/v1/purchase-orders/${poId}/lines`, data)
        .then((response) => response.data)
    return response;
}

export const updateBulkPurchaseOrderLineStatus = async (poId: string | undefined, polIds: string[], status: string) => {
    const response = await api
        .patch(`/v1/purchase-orders/${poId}/lines/status/${status}`, polIds)
        .then((response) => response.data)
    return response.data;
}

export const generateReCreatePurchaseOrderMessage = async (poId: string, data: UpdateSaleOrderLineSupplierRequest) => {
    const response = await api
        .post(`/v1/purchase-orders/${poId}/re-create/purchase-order-message`, data)
        .then((response) => response.data)
    return response.data;
}

export const reCreatePurchaseOrder = async (poId: string, data: ReCreatePurchaseOrderRequest) => {
    const response = await api
        .post(`/v1/purchase-orders/${poId}/re-created`, data)
        .then((response) => response.data);
    return response.data;
}

export const cancelPurchaseOrder = async (poId: string) => {
    const response = await api
        .patch(`/v1/purchase-orders/${poId}/cancel`)
        .then((response) => response.data)
    return response.data;
}

