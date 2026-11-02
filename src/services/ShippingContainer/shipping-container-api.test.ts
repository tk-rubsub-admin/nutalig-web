import { beforeEach, expect, it, vi } from 'vitest';
import { api } from 'api/api';
import {
  actOnContainer,
  createContainer,
  previewContainerSources,
  addContainerLoad,
  removeContainerLoad,
  searchContainers
} from './shipping-container-api';
vi.mock('api/api', () => ({ api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.get).mockResolvedValue({ data: { data: { records: [], pagination: {} } } });
  vi.mocked(api.post).mockResolvedValue({ data: { data: {} } });
  vi.mocked(api.delete).mockResolvedValue({ data: { data: {} } });
});
it('uses versioned load/action endpoints and keeps the cancellation reason', async () => {
  const load = {
    version: 3,
    deliveryId: 10,
    scrapBoxId: 20,
    cartonCount: 1,
    confirmUniformPackaging: false
  };
  await addContainerLoad(1, load);
  expect(api.post).toHaveBeenCalledWith('/v1/shipping-containers/1/loads', load);
  await removeContainerLoad(1, 5, 4);
  expect(api.delete).toHaveBeenCalledWith('/v1/shipping-containers/1/loads/5', {
    params: { version: 4 }
  });
  await actOnContainer(1, 'CANCEL', 5, 'ยกเลิกการจัดตู้');
  expect(api.post).toHaveBeenCalledWith('/v1/shipping-containers/1/actions/CANCEL', {
    version: 5,
    reason: 'ยกเลิกการจัดตู้'
  });
  await searchContainers({ keyword: 'CT', status: '', containerSize: '' }, 2, 20);
  expect(api.get).toHaveBeenCalledWith('/v1/shipping-containers', {
    params: { keyword: 'CT', page: 2, size: 20 }
  });
});

it('previews available sources without a persisted container and submits metadata with loads once', async () => {
  await previewContainerSources(
    {
      containerSize: '20GP',
      shippingMethod: 'SEA_FCL_20GP',
      supplierShippingId: 1,
      destinationId: 2
    },
    10
  );
  expect(api.get).toHaveBeenCalledWith('/v1/shipping-containers/sources', {
    params: { containerSize: '20GP', supplierShippingId: 1, destinationId: 2, deliveryId: 10 }
  });
  expect(api.post).not.toHaveBeenCalled();
  const request = {
    containerSize: '20GP' as const,
    supplierShippingId: 1,
    destinationId: 2,
    loads: [{ deliveryId: 10, scrapBoxId: 20, cartonCount: 1, confirmUniformPackaging: false }]
  };
  await createContainer(request);
  expect(api.post).toHaveBeenCalledTimes(1);
  expect(api.post).toHaveBeenCalledWith('/v1/shipping-containers', request);
});
