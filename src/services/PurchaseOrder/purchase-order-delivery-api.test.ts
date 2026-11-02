import { expect, it, vi } from 'vitest';
import { api } from 'api/api';
import { searchPurchaseOrderDeliveries } from './purchase-order-delivery-api';
vi.mock('api/api', () => ({ api: { post: vi.fn() } }));
it('trims filters, omits empty dates/status and sends pagination to the delivery search endpoint', async () => {
  const response = {
    status: 'SUCCESS',
    data: { records: [], pagination: { page: 2, size: 20, totalPage: 0, totalRecords: 0 } }
  };
  vi.mocked(api.post).mockResolvedValue({ data: response });
  expect(
    await searchPurchaseOrderDeliveries(
      { purchaseOrderNo: ' PO-1 ', containerStatus: 'ASSIGNED', shippingLocationId: 22, status: null, shippedDateStart: '', supplierName: ' ' },
      2,
      20
    )
  ).toEqual(response);
  expect(api.post).toHaveBeenCalledWith(
    '/v1/purchase-orders/deliveries/search',
    { purchaseOrderNo: 'PO-1', containerStatus: 'ASSIGNED', shippingLocationId: 22 },
    { params: { page: 2, size: 20 } }
  );
});
