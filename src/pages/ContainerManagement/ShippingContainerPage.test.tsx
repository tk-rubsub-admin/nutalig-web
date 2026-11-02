// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MemoryRouter, Route, Switch, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  createContainer,
  previewContainerSources,
  addContainerLoad,
  getContainer,
  updateContainer,
  ShippingContainer
} from 'services/ShippingContainer/shipping-container-api';
import ShippingContainerPage from './ShippingContainerPage';
import { searchPurchaseOrderDeliveries } from 'services/PurchaseOrder/purchase-order-delivery-api';
vi.mock('api/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
vi.mock('services/ShippingContainer/shipping-container-api', async () => ({
  ...(await vi.importActual<any>('services/ShippingContainer/shipping-container-api')),
  createContainer: vi.fn(),
  previewContainerSources: vi.fn(),
  addContainerLoad: vi.fn(),
  getContainer: vi.fn(),
  updateContainer: vi.fn()
}));
vi.mock('services/Supplier/supplier-api', () => ({
  getSupplierShippings: vi.fn().mockResolvedValue([
    {
      id: 1,
      shippingName: 'Carrier',
      shippingMethod: 'SEA',
      shippingMode: 'FCL',
      destinations: [{ id: 2, destinationName: 'Warehouse' }]
    }
  ])
}));
vi.mock('auth/PermissionContext', () => ({ usePermissions: () => ({ has: () => true }) }));
vi.mock('components/ActivityHistoryTimeline', () => ({ default: () => null }));
vi.mock('services/PurchaseOrder/purchase-order-delivery-api', () => ({
  searchPurchaseOrderDeliveries: vi.fn().mockResolvedValue({
    data: {
      records: Array.from({ length: 6 }, (_, index) => ({
        id: index + 10,
        deliveryNo: `D${index + 1}`,
        purchaseOrderNo: `PO${index + 1}`,
        containerStatus: index % 2 === 0 ? 'NOT_ASSIGNED' : 'PARTIALLY_ASSIGNED',
        totalCbm: index + 1,
        totalCartons: (index + 1) * 2
      })),
      pagination: { totalPage: 1 }
    }
  })
}));
vi.mock('routes', () => ({
  ROUTE_PATHS: {
    CONTAINER_MANAGEMENT: '/container-management',
    CONTAINER_DETAIL: '/container-management/:id'
  }
}));
vi.mock('layout/LayoutRoute', () => ({ Page: ({ children }: any) => <main>{children}</main> }));
vi.mock('components/Styled', () => ({ Wrapper: ({ children }: any) => <div>{children}</div> }));
vi.mock('components/PageTitle', () => ({ default: ({ title }: any) => <h1>{title}</h1> }));
const draft = {
  id: 8,
  version: 1,
  containerJobNo: 'CT8',
  containerSize: '20GP',
  containerNo: 'ABC',
  shippingMethod: 'SEA_FCL_20GP',
  supplierShippingId: 1,
  destinationId: 2,
  status: 'DRAFT',
  loads: [],
  totalCartons: 0,
  totalCbm: 0,
  totalGrossWeightKg: 0,
  totalNetWeightKg: 0
} as ShippingContainer;
const clients: QueryClient[] = [];
function Location() {
  return <div data-testid="location">{useLocation().pathname}</div>;
}
function open(url = '/container-management/new') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>
        <Location />
        <Switch>
          <Route exact path="/container-management/new" component={ShippingContainerPage} />
          <Route exact path="/container-management/:id" component={ShippingContainerPage} />
          <Route path="/container-management">
            <div>Container list</div>
          </Route>
        </Switch>
      </MemoryRouter>
    </QueryClientProvider>
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createContainer).mockResolvedValue(draft);
  vi.mocked(previewContainerSources).mockResolvedValue([
    {
      deliveryId: 10,
      deliveryDetailId: 11,
      name: 'Cap',
      totalCartons: 9,
      availableCartons: 9,
      cbmM3: 0.009,
      netWeightKg: 9,
      grossWeightKg: 18,
      canSplit: true
    }
  ]);
  vi.mocked(getContainer).mockResolvedValue(draft);
  vi.mocked(updateContainer).mockResolvedValue({ ...draft, version: 2 });
});
afterEach(() => {
  cleanup();
  clients.forEach((c) => c.clear());
  clients.length = 0;
});
it('searches eligible delivery statuses immediately when the create page loads', async () => {
  open();
  await waitFor(() =>
    expect(searchPurchaseOrderDeliveries).toHaveBeenCalledWith(
      expect.objectContaining({
        containerStatuses: ['NOT_ASSIGNED', 'PARTIALLY_ASSIGNED']
      }),
      1,
      10
    )
  );
});
async function prepareAndChoose() {
  fireEvent.change(screen.getByLabelText('หมายเลขตู้จริง'), { target: { value: 'ABC' } });
  await waitFor(() =>
    expect(screen.getByLabelText('ผู้ให้บริการขนส่งปิดตู้').getAttribute('aria-disabled')).not.toBe(
      'true'
    )
  );
  fireEvent.mouseDown(screen.getByLabelText('ผู้ให้บริการขนส่งปิดตู้'));
  fireEvent.click(await screen.findByRole('option', { name: 'Carrier' }));
  fireEvent.mouseDown(screen.getByLabelText('ปลายทาง'));
  fireEvent.click(screen.getByRole('option', { name: 'Warehouse' }));
  await waitFor(() =>
    expect(searchPurchaseOrderDeliveries).toHaveBeenCalledWith(
      expect.objectContaining({
        containerStatuses: ['NOT_ASSIGNED', 'PARTIALLY_ASSIGNED']
      }),
      1,
      10
    )
  );
  expect(createContainer).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'เพิ่มกล่องลงตู้' }));
  fireEvent.click(await screen.findByRole('button', { name: 'ดูกล่อง' }));
  fireEvent.click(await screen.findByRole('button', { name: 'เลือกกล่องนี้' }));
  fireEvent.click(screen.getByRole('button', { name: 'จัดลงตู้' }));
  expect(createContainer).not.toHaveBeenCalled();
  expect(addContainerLoad).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'ปิด' }));
}
it('keeps metadata and selected loads locally until one final create request, then continues editing', async () => {
  open();
  expect(screen.queryByRole('dialog')).toBeNull();
  await prepareAndChoose();
  expect(screen.getByTestId('location').textContent).toBe('/container-management/new');
  fireEvent.click(screen.getByRole('button', { name: 'ยืนยันสร้างตู้' }));
  await waitFor(() =>
    expect(screen.getByTestId('location').textContent).toBe('/container-management/8')
  );
  expect(createContainer).toHaveBeenCalledTimes(1);
  expect(createContainer).toHaveBeenCalledWith(
    expect.objectContaining({
      containerNo: 'ABC',
      supplierShippingId: 1,
      destinationId: 2,
      loads: [expect.objectContaining({ deliveryId: 10, deliveryDetailId: 11, cartonCount: 9 })]
    })
  );
  await screen.findByText('CT8');
  fireEvent.change(screen.getByLabelText('หมายเลขซีล'), { target: { value: 'NEW' } });
  fireEvent.click(screen.getByRole('button', { name: 'บันทึกข้อมูลตู้' }));
  await waitFor(() =>
    expect(updateContainer).toHaveBeenCalledWith(
      8,
      expect.objectContaining({ version: 1, sealNo: 'NEW' })
    )
  );
  expect(createContainer).toHaveBeenCalledTimes(1);
});
it('keeps form and pending loads when the final create conflicts, and supports removing locally', async () => {
  vi.mocked(createContainer).mockRejectedValueOnce({
    response: { data: { message: 'กล่องถูกจัดตู้แล้ว' } }
  });
  open();
  await prepareAndChoose();
  fireEvent.click(screen.getByRole('button', { name: 'ยืนยันสร้างตู้' }));
  await screen.findByText('กล่องถูกจัดตู้แล้ว');
  expect(screen.getByTestId('location').textContent).toBe('/container-management/new');
  expect((screen.getByLabelText('หมายเลขตู้จริง') as HTMLInputElement).value).toBe('ABC');
  expect(screen.getByText('Cap')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'นำออก' }));
  expect(
    (screen.getByRole('button', { name: 'ยืนยันสร้างตู้' }) as HTMLButtonElement).disabled
  ).toBe(true);
  expect(addContainerLoad).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'กลับรายการตู้' }));
  await screen.findByText('Container list');
});
it('loads saved details directly without creating a replacement', async () => {
  open('/container-management/8');
  await screen.findByText('CT8');
  expect(getContainer).toHaveBeenCalledWith(8);
  expect(createContainer).not.toHaveBeenCalled();
});
