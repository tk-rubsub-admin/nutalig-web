import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from 'api/api';
import { createPurchaseOrder } from './purchase-order-api';

vi.mock('api/api', () => ({ api: { post: vi.fn() } }));
beforeEach(() => {
  vi.mocked(api.post).mockReset();
  vi.mocked(api.post).mockResolvedValue({ data: { data: { purchaseOrderNo: 'PO-1' } } });
});

describe('create PO selected item multipart request', () => {
  it('sends group item IDs as indexed fields alongside edited items', async () => {
    await createPurchaseOrder(
      {
        salesOrderNo: 'SO-1',
        supplierId: 'A',
        supplierShippingId: 3,
        salesOrderDetailIds: [183],
        shippingMethodSnapshot: 'SEA_SHARE_FCL_40HQ',
        items: [
          {
            salesOrderDetailId: 183,
            quantity: 25000,
            supplierUnitPrice: 6.25,
            supplierShippingCost: 0.75
          }
        ]
      },
      []
    );
    const form = vi.mocked(api.post).mock.calls[0][1] as FormData;
    expect(form.get('salesOrderDetailIds[0]')).toBe('183');
    expect(form.get('items[0].salesOrderDetailId')).toBe('183');
    expect(form.get('shippingMethodSnapshot')).toBe('SEA_SHARE_FCL_40HQ');
    expect(form.get('items[0].supplierShippingCost')).toBe('0.75');
  });

  it('does not introduce selected IDs into legacy requests', async () => {
    await createPurchaseOrder({ salesOrderNo: 'SO-1', supplierId: 'A', supplierShippingId: 1 }, []);
    const form = vi.mocked(api.post).mock.calls[0][1] as FormData;
    expect(form.has('salesOrderDetailIds[0]')).toBe(false);
  });
});
