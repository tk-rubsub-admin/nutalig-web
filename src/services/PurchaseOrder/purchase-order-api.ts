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
  if (data.paymentTerm) {
    formData.append('paymentTerm', data.paymentTerm);
  }
  if (data.shippingMethodSnapshot) {
    formData.append('shippingMethodSnapshot', data.shippingMethodSnapshot);
  }
  if (data.containerSizeSnapshot) {
    formData.append('containerSizeSnapshot', data.containerSizeSnapshot);
  }
  if (data.supplierContactSnapshot !== undefined && data.supplierContactSnapshot !== null) {
    formData.append('supplierContactSnapshot', data.supplierContactSnapshot);
  }
  if (data.supplierContactNoSnapshot !== undefined && data.supplierContactNoSnapshot !== null) {
    formData.append('supplierContactNoSnapshot', data.supplierContactNoSnapshot);
  }
  if (data.supplierAddressSnapshot !== undefined && data.supplierAddressSnapshot !== null) {
    formData.append('supplierAddressSnapshot', data.supplierAddressSnapshot);
  }
  if (data.remark) {
    formData.append('remark', data.remark);
  }
  (data.items || []).forEach((item, index) => {
    if (item.salesOrderDetailId !== undefined && item.salesOrderDetailId !== null) {
      formData.append(`items[${index}].salesOrderDetailId`, String(item.salesOrderDetailId));
    }
    if (item.name !== undefined && item.name !== null) {
      formData.append(`items[${index}].name`, item.name);
    }
    if (item.spec !== undefined && item.spec !== null) {
      formData.append(`items[${index}].spec`, item.spec);
    }
    if (item.quantity !== undefined && item.quantity !== null) {
      formData.append(`items[${index}].quantity`, String(item.quantity));
    }
    if (item.supplierCurrency) {
      formData.append(`items[${index}].supplierCurrency`, item.supplierCurrency);
    }
    if (item.supplierUnitPrice !== undefined && item.supplierUnitPrice !== null) {
      formData.append(`items[${index}].supplierUnitPrice`, String(item.supplierUnitPrice));
    }
    if (item.supplierShippingCost !== undefined && item.supplierShippingCost !== null) {
      formData.append(`items[${index}].supplierShippingCost`, String(item.supplierShippingCost));
    }
  });
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
