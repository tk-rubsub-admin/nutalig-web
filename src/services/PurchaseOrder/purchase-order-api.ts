import { api } from 'api/api';
import {
  CreatePurchaseOrderRequest,
  CreatePurchaseOrderResponse,
  PurchaseOrderRecord,
  SearchPurchaseOrderRequest,
  SearchPurchaseOrderResponse,
  UpdatePurchaseOrderRequest
} from './purchase-order-type';

export const createPurchaseOrder = async (
  data: CreatePurchaseOrderRequest,
  attachments: File[]
): Promise<CreatePurchaseOrderResponse> => {
  const formData = new FormData();
  formData.append('salesOrderNo', data.salesOrderNo);
  formData.append('supplierId', data.supplierId);
  formData.append('supplierShippingId', String(data.supplierShippingId));
  if (data.docDate) {
    formData.append('docDate', data.docDate);
  }
  if (data.productionLeadTimeDay !== undefined && data.productionLeadTimeDay !== null) {
    formData.append('productionLeadTimeDay', String(data.productionLeadTimeDay));
  }
  if (data.shippingLeadTimeDay !== undefined && data.shippingLeadTimeDay !== null) {
    formData.append('shippingLeadTimeDay', String(data.shippingLeadTimeDay));
  }
  if (data.remark) {
    formData.append('remark', data.remark);
  }
  attachments.forEach((file) => {
    formData.append('attachments', file);
  });

  const response = await api
    .post('/v1/purchase-orders', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then((result) => result.data);
  return response.data;
};

export const getPurchaseOrder = async (id: string): Promise<PurchaseOrderRecord> => {
  const response = await api
    .get('/v1/purchase-orders', {
      params: { id }
    })
    .then((result) => result.data);

  return response.data;
};

export const viewPurchaseOrder = async (id: string, original: boolean, copy: boolean) => {
  const response = await api
    .get('/v1/purchase-orders/document', {
      params: {
        id,
        format: 'PDF',
        isOriginal: original,
        isCopy: copy
      }
    })
    .then((result) => result);

  return response;
};

export const updatePurchaseOrder = async (
  id: string,
  data: UpdatePurchaseOrderRequest
): Promise<PurchaseOrderRecord> => {
  const response = await api.patch(`/v1/purchase-orders/${id}`, data).then((result) => result.data);
  return response.data;
};

export const cancelPurchaseOrder = async (id: string): Promise<PurchaseOrderRecord> => {
  const response = await api.patch(`/v1/purchase-orders/${id}/cancel`).then((result) => result.data);
  return response.data;
};

export const closePurchaseOrder = async (id: string): Promise<PurchaseOrderRecord> => {
  const response = await api.patch(`/v1/purchase-orders/${id}/close`).then((result) => result.data);
  return response.data;
};

export const uploadPurchaseOrderAttachments = async (
  id: string,
  files: File[]
): Promise<PurchaseOrderRecord> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('attachments', file);
  });

  const response = await api
    .post(`/v1/purchase-orders/${id}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then((result) => result.data);

  return response.data;
};

export const deletePurchaseOrderAttachment = async (
  id: string,
  attachmentId: number
): Promise<PurchaseOrderRecord> => {
  const response = await api
    .delete(`/v1/purchase-orders/${id}/attachments/${attachmentId}`)
    .then((result) => result.data);

  return response.data;
};

export const searchPurchaseOrders = async (
  data: SearchPurchaseOrderRequest,
  page: number,
  size: number
): Promise<SearchPurchaseOrderResponse> => {
  const response = await api
    .post('/v1/purchase-orders/search', data, {
      params: {
        page,
        size
      }
    })
    .then((result) => result.data);

  return response;
};
