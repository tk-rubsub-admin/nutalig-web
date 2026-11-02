// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { searchPurchaseOrderDeliveries } from 'services/PurchaseOrder/purchase-order-delivery-api';
import {
  addContainerLoad,
  previewContainerSources,
  DraftContainerLoad,
  ContainerSource,
  getContainerSources,
  ShippingContainer
} from 'services/ShippingContainer/shipping-container-api';
import ContainerLoadPicker from './ContainerLoadPicker';
vi.mock('api/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
vi.mock('services/PurchaseOrder/purchase-order-delivery-api', () => ({
  searchPurchaseOrderDeliveries: vi.fn()
}));
vi.mock('services/ShippingContainer/shipping-container-api', async () => {
  const original = await vi.importActual<any>('services/ShippingContainer/shipping-container-api');
  return {
    ...original,
    getContainerSources: vi.fn(),
    previewContainerSources: vi.fn(),
    addContainerLoad: vi.fn()
  };
});
const container = {
  id: 1,
  version: 3,
  supplierShippingId: 1,
  destinationId: 2,
  shippingMethod: 'SEA_FCL_20GP'
} as ShippingContainer;
const changed = vi.fn();
const clients: QueryClient[] = [];
const sourceRows: ContainerSource[] = [
  {
    deliveryId: 10,
    deliveryDetailId: 11,
    name: 'ฝา',
    totalCartons: 9,
    availableCartons: 9,
    quantity: 90,
    cbmM3: 0.009,
    netWeightKg: 9,
    grossWeightKg: 18,
    canSplit: true
  },
  {
    deliveryId: 10,
    scrapBoxId: 20,
    name: 'กล่องเศษ #20',
    totalCartons: 1,
    availableCartons: 1,
    cbmM3: 0.024,
    netWeightKg: 5,
    grossWeightKg: 6,
    canSplit: false
  }
];
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(searchPurchaseOrderDeliveries).mockResolvedValue({
    status: 'SUCCESS',
    data: {
      records: [{ id: 10, deliveryNo: 'D1', purchaseOrderNo: 'PO1', details: [] }] as any,
      pagination: { page: 1, size: 10, totalPage: 1, totalRecords: 1 }
    }
  });
  vi.mocked(getContainerSources).mockResolvedValue(sourceRows);
  vi.mocked(previewContainerSources).mockResolvedValue(sourceRows);
  vi.mocked(addContainerLoad).mockResolvedValue(container);
});
afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
});
async function open() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <ContainerLoadPicker container={container} open onClose={() => {}} onChanged={changed} />
    </QueryClientProvider>
  );
  fireEvent.click(await screen.findByRole('button', { name: 'ดูกล่อง' }));
  await screen.findByText('กล่องที่ยังจัดลงตู้ได้');
  await waitFor(() =>
    expect(screen.getAllByRole('button', { name: 'เลือกกล่องนี้' })).toHaveLength(2)
  );
}
it('requires confirmation when splitting a normal source and sends the current version', async () => {
  await open();
  fireEvent.click(screen.getAllByRole('button', { name: 'เลือกกล่องนี้' })[0]);
  fireEvent.change(screen.getByLabelText('จำนวนกล่องที่จัดลงตู้'), { target: { value: '4' } });
  fireEvent.click(screen.getByRole('button', { name: 'จัดลงตู้' }));
  expect(addContainerLoad).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'จัดลงตู้' }));
  await waitFor(() =>
    expect(addContainerLoad).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        version: 3,
        deliveryId: 10,
        deliveryDetailId: 11,
        cartonCount: 4,
        confirmUniformPackaging: true
      })
    )
  );
  expect(searchPurchaseOrderDeliveries).toHaveBeenCalledWith(
    expect.objectContaining({
      containerStatuses: ['NOT_ASSIGNED', 'PARTIALLY_ASSIGNED']
    }),
    1,
    10
  );
});
it('loads a scrap box as one indivisible box', async () => {
  await open();
  fireEvent.click(screen.getAllByRole('button', { name: 'เลือกกล่องนี้' })[1]);
  expect((screen.getByLabelText('จำนวนกล่องที่จัดลงตู้') as HTMLInputElement).disabled).toBe(true);
  expect(screen.queryByRole('checkbox')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'จัดลงตู้' }));
  await waitFor(() =>
    expect(addContainerLoad).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ scrapBoxId: 20, cartonCount: 1 })
    )
  );
});
it('reports an allocation conflict and reloads availability', async () => {
  vi.mocked(addContainerLoad).mockRejectedValueOnce({
    response: { data: { message: 'กล่องเศษนี้ถูกจัดลงตู้แล้ว' } }
  });
  await open();
  fireEvent.click(screen.getAllByRole('button', { name: 'เลือกกล่องนี้' })[1]);
  fireEvent.click(screen.getByRole('button', { name: 'จัดลงตู้' }));
  await screen.findByText('กล่องเศษนี้ถูกจัดลงตู้แล้ว');
  await waitFor(() => expect(getContainerSources).toHaveBeenCalledTimes(2));
  expect(changed).not.toHaveBeenCalled();
});

it('selects locally, subtracts pending quantities and prevents selecting the same scrap box twice', async () => {
  function LocalPicker() {
    const [pending, setPending] = useState<DraftContainerLoad[]>([]);
    return (
      <ContainerLoadPicker
        container={{
          supplierShippingId: 1,
          destinationId: 2,
          containerSize: '20GP',
          shippingMethod: 'SEA_FCL_20GP'
        }}
        open
        onClose={() => {}}
        pendingLoads={pending}
        onSelected={(load) => setPending([...pending, load])}
      />
    );
  }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <LocalPicker />
    </QueryClientProvider>
  );
  fireEvent.click(await screen.findByRole('button', { name: 'ดูกล่อง' }));
  await waitFor(() =>
    expect(screen.getAllByRole('button', { name: 'เลือกกล่องนี้' })).toHaveLength(2)
  );
  fireEvent.click(screen.getAllByRole('button', { name: 'เลือกกล่องนี้' })[0]);
  fireEvent.change(screen.getByLabelText('จำนวนกล่องที่จัดลงตู้'), { target: { value: '4' } });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'จัดลงตู้' }));
  await screen.findByText(/ฝา · เหลือ 5 กล่อง/);
  fireEvent.click(screen.getAllByRole('button', { name: 'เลือกกล่องนี้' })[1]);
  fireEvent.click(screen.getByRole('button', { name: 'จัดลงตู้' }));
  await waitFor(() =>
    expect(
      (screen.getAllByRole('button', { name: 'เลือกกล่องนี้' })[1] as HTMLButtonElement).disabled
    ).toBe(true)
  );
  expect(addContainerLoad).not.toHaveBeenCalled();
  expect(getContainerSources).not.toHaveBeenCalled();
  expect(previewContainerSources).toHaveBeenCalledWith(
    expect.objectContaining({ containerSize: '20GP', supplierShippingId: 1, destinationId: 2 }),
    10
  );
});
