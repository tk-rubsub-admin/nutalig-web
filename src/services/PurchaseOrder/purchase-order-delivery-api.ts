import { api } from 'api/api';
import {
  SearchPurchaseOrderDeliveryRequest,
  PurchaseOrderDeliverySearchResponse
} from './purchase-order-type';

export async function searchPurchaseOrderDeliveries(
  filters: SearchPurchaseOrderDeliveryRequest = {},
  page = 1,
  size = 10
): Promise<PurchaseOrderDeliverySearchResponse> {
  const payload = Object.fromEntries(
    Object.entries(filters)
      .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
      .filter(([, value]) => value !== '' && value !== null && value !== undefined)
  );
  const response = await api.post('/v1/purchase-orders/deliveries/search', payload, {
    params: { page, size }
  });
  return response.data;
}
