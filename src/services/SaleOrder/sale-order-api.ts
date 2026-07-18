/* eslint-disable prettier/prettier */
import { api } from 'api/api';
import {
    AssignPORequest,
    CreateSaleOrderLineRequestV2,
    CreateSaleOrderRequest,
    CreateSalesOrderRequestV1,
    GetSaleOrderResponse,
    GetSalesOrderResponseV1,
    OrderPackage,
    SearchOrderResponse,
    SearchSaleOrderRequest,
    SearchSalesOrderRequestV1,
    SearchSalesOrderResponseV1,
    UpdateSalesOrderRequestV1,
    UpdatePOLineRequest,
    UpdateSaleOrderBilling,
    UpdateSaleOrderLineSupplierRequest,
    UpdateSaleOrderLineSupplierRequestV2,
    UpdateSaleOrderRequest
} from './sale-order-type';

export const createOrder = async (formValues: any) => {
    const { orderMakerId, sendingTime, freight, additionalItem, notes } = formValues.orderInfo;
    const request = {
        customerId: formValues.customerInfo.customerId,
        orderMakerId,
        sendingTime,
        freight,
        additionalItem,
        remark: notes,
        itemList: formValues.itemList ?? []
    };
    const response = await api
        .post(`/v1/sale-orders`, request)
        .then((response) => response.data);
    return response;
};

export const createSaleOrder = async (data: CreateSaleOrderRequest) => {
    const response = await api
        .post(`/v2/sale-orders`, data)
        .then((response) => response.data);
    return response;
};

export const createSalesOrderV1 = async (data: CreateSalesOrderRequestV1) => {
    const response = await api
        .post(`/v1/sales-orders`, data)
        .then((response) => response.data);
    return response;
};

export const searchOrder = async (data: SearchSaleOrderRequest, page: number, size: number) => {
    const response: SearchOrderResponse = await api
        .post(`/v1/sale-orders/search`, data, {
            params: {
                page,
                size
            }
        })
        .then((response) => response.data);
    return response;
};

export const searchSalesOrdersV1 = async (data: SearchSalesOrderRequestV1, page: number, size: number) => {
    const response: SearchSalesOrderResponseV1 = await api
        .post(`/v1/sales-orders/search`, data, {
            params: {
                page,
                size
            }
        })
        .then((response) => response.data);
    return response;
};

export const getSaleOrder = async (id: string) => {
    const response: GetSaleOrderResponse = await api
        .get(`/v1/sale-orders/${id}`)
        .then((response) => response.data);
    return response.data;
};

export const getSalesOrderV1 = async (id: string) => {
    const response: GetSalesOrderResponseV1 = await api
        .get(`/v1/sales-orders`, {
            params: {
                id
            }
        })
        .then((response) => response.data);
    return response.data;
};

export const updateSalesOrderV1 = async (id: string, data: UpdateSalesOrderRequestV1) => {
    const response = await api
        .patch(`/v1/sales-orders/${id}`, data)
        .then((response) => response.data);
    return response.data;
};

export const uploadSalesOrderAttachments = async (id: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => {
        formData.append('attachments', file);
    });

    const response = await api
        .post(`/v1/sales-orders/${id}/attachments`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        .then((result) => result.data);

    return response.data;
};

export const deleteSalesOrderAttachment = async (id: string, attachmentId: number) => {
    const response = await api
        .delete(`/v1/sales-orders/${id}/attachments/${attachmentId}`)
        .then((result) => result.data);

    return response.data;
};

export const downloadSaleOrder = async (id: string, format: string, original: boolean, copy: boolean) => {
    const response = await api
        .get(`/v1/sales-orders/document`, {
            params: {
                id,
                format,
                isOriginal: original,
                isCopy: copy
            }
        })
        .then(response => response)
    return response
}

export const viewReceipt = async (id: string, original: boolean, copy: boolean) => {
    const response = await api
        .get(`/v1/sale-orders/${id}/receipt?format=PDF&isOriginal=${original}&isCopy=${copy}`)
        .then(response => response)
    return response
}

export const downloadReceipt = async (id: string, format: string, original: boolean, copy: boolean) => {
    const response = await api
        .get(`/v1/sale-orders/${id}/receipt?format=${format}&isOriginal=${original}&isCopy=${copy}`)
        .then(response => response)
    return response
}

export const downloadReceiptListV1 = async (ids: string[], original: boolean, copy: boolean) => {
    const response = await api
        .get(`/v1/sale-orders/receipt/documents?ids=${ids}&format=PDF&isOriginal=${original}&isCopy=${copy}`)
        .then(response => response)
    return response
}

export const updateSaleOrderPackage = async (id: string, data: OrderPackage) => {
    const response = await api
        .patch(`/v1/sale-orders/${id}/package`, data)
        .then((response) => response.data)
    return response.data;
}

export const updateSaleOrderPackageKpi = async (id: string, data: any) => {
    const response = await api
        .patch(`/v1/sale-orders/${id}/package-kpi`, data)
        .then((response) => response.data)
    return response.data;
}

export const updateSaleOrderLineStatus = async (poId: string, poLineId: string, data: UpdatePOLineRequest) => {
    const response = await api
        .patch(`/v1/sale-orders/${poId}/lines/${poLineId}/status`, data)
        .then((response) => response.data)
    return response.data;
}

export const updateSaleOrderLineSupplier = async (poId: string, poLineId: string, data: UpdateSaleOrderLineSupplierRequest) => {
    const response = await api
        .patch(`/v1/sale-orders/${poId}/lines/${poLineId}/supplier`, data)
        .then((response) => response.data)
    return response.data;
}

export const updateSaleOrderLineSupplierV2 = async (poId: string, data: UpdateSaleOrderLineSupplierRequestV2) => {
    const response = await api
        .patch(`/v1/sale-orders/${poId}/lines/supplier`, data)
        .then((response) => response.data)
    return response.data;
}

export const uploadSaleOrderPackImage = async (id: string, data: FormData) => {
    const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
    };

    const response = await api
        .post(`/v1/sale-orders/${id}/packed-image`, data, config)
        .then((response) => response.data);
    return response;
};

export const deleteSaleOrderPackImage = async (id: string, picId: string) => {
    const response = await api
        .delete(`/v1/sale-orders/${id}/packed-image/${picId}`).then((response) => response.data);
    return response;
};

export const confirmPaidSaleOrder = async (id: string, data: FormData) => {
    const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
    };

    const response = await api
        .post(`/v1/sale-orders/${id}/confirm-payment`, data, config)
        .then((response) => response.data);
    return response;
};

export const confirmPaidSaleOrderList = async (data: FormData) => {
    const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
    };

    const response = await api
        .post(`/v1/sale-orders/bulk-confirm-payment`, data, config)
        .then((response) => response.data);
    return response;
};

export const assignSaleOrder = async (req: AssignPORequest) => {
    const response = await api
        .patch(`/v1/sale-orders/assign`, req)
        .then((response) => response.data)
    return response.data;
}

export const generateSaleOrderMessage = async (poId: string, poLineId: string, data: UpdateSaleOrderLineSupplierRequest) => {
    const response = await api
        .post(`/v1/sale-orders/${poId}/lines/${poLineId}/purchase-order-message`, data)
        .then((response) => response.data)
    return response.data;
}

export const updateSaleOrderBilling = async (poId: string, data: UpdateSaleOrderBilling) => {
    const response = await api
        .patch(`/v1/sale-orders/${poId}/billing`, data)
        .then((response) => response.data)
    return response.data;
}

export const updateSaleOrder = async (poId: string, data: UpdateSaleOrderRequest) => {
    const response = await api
        .patch(`/v1/sale-orders/${poId}`, data)
        .then((response) => response.data)
    return response.data;
}

export const generateSaleOrderLink = async (id: string) => {
    const response = await api
        .get(`/v1/sale-orders/${id}/generate-link`)
        .then((response) => response.data);
    return response.data;
};

export const updateSaleOrderStatus = async (id: string, poStatus: string) => {
    const response = await api
        .patch(`/v1/sale-orders/${id}/status/${poStatus}`)
        .then((response) => response.data);
    return response.data;
};

export const createSaleOrderLine = async (poId: string, data: CreateSaleOrderLineRequestV2) => {
    const response = await api
        .post(`/v1/sale-orders/${poId}/lines`, data)
        .then((response) => response.data)
    return response;
}

export const assignUnassignSaleOrder = async (date: string) => {
    const response = await api
        .post(`/v1/sale-orders/unassign-order?date=${date}`)
        .then((response) => response.data)
    return response;
}

export const requestToMakeOrder = async (id: string) => {
    const response = await api
        .post(`/v1/sale-orders/${id}/request-to-make-order`)
        .then((response) => response.data)
    return response;
}

export const approveToMakeOrder = async (id: string) => {
    const response = await api
        .post(`/v1/sale-orders/${id}/approve-to-make-order`)
        .then((response) => response.data)
    return response;
}

export const viewSaleOrder = async (id: string, token: string) => {
    const response: GetSaleOrderResponse = await api
        .get(`/view?poId=${id}&token=${token}`)
        .then((response) => response.data);
    return response.data;
};

export const getReAssignOrderInfo = async (id: string) => {
    const response = await api
        .get(`/v1/sale-orders/${id}/re-assign`)
        .then((response) => response.data);
    return response.data;
}
