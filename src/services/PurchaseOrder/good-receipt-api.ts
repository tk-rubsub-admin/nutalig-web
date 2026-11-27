import { api } from 'api/api';
import { Pagination } from 'services/general-type';
import { PurchaseOrderReceipt } from './purchase-order-type';

export interface GoodReceiptListResponse {
  data: {
    records: PurchaseOrderReceipt[];
    pagination: Pagination;
  };
}

export async function searchGoodReceipts(page = 1, size = 10): Promise<GoodReceiptListResponse> {
  const response = await api.get('/v1/purchase-order-receipts', {
    params: { page, size }
  });
  return response.data;
}
