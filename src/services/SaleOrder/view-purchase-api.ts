/* eslint-disable prettier/prettier */
import { api } from "api/api";
import { GetPurchaseOrderResponse } from "./purchase-order-type";

export const viewPurchaseOrder = async (id: string, token: string) => {
    const response: GetPurchaseOrderResponse = await api
        .get(`/view?poId=${id}&token=${token}`)
        .then((response) => response.data);
    return response.data;
};