// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getSupplierShippings } from 'services/Supplier/supplier-api';
import { searchPurchaseOrderDeliveries } from 'services/PurchaseOrder/purchase-order-delivery-api';
import { PurchaseOrderDeliverySearchResponse } from 'services/PurchaseOrder/purchase-order-type';
import ContainerManagement from './PurchaseOrderDeliverySearch';
vi.mock('services/PurchaseOrder/purchase-order-delivery-api', () => ({
  searchPurchaseOrderDeliveries: vi.fn()
}));
vi.mock('services/Supplier/supplier-api', () => ({ getSupplierShippings: vi.fn() }));
vi.mock('routes', () => ({ ROUTE_PATHS: { PURCHASE_ORDER_DETAIL: '/purchase-order/:id' } }));
vi.mock('layout/LayoutRoute', () => ({ Page: ({ children }: any) => <div>{children}</div> }));
vi.mock('components/Styled', () => ({ Wrapper: ({ children }: any) => <div>{children}</div> }));
vi.mock('components/PageTitle', () => ({ default: ({ title }: any) => <h1>{title}</h1> }));
vi.mock('components/Paginate', () => ({
  default: ({ page, setPage }: any) => (
    <>
      <span data-testid="page">{page}</span>
      <button onClick={() => setPage(2)}>หน้าถัดไป</button>
    </>
  )
}));
const clients: QueryClient[] = [];
const response: PurchaseOrderDeliverySearchResponse = {
  status: 'SUCCESS',
  data: {
    pagination: { page: 1, size: 10, totalPage: 2, totalRecords: 11 },
    records: [
      {
        id: 1,
        deliveryNo: 'PO-1-D001',
        purchaseOrderNo: 'PO-1',
        salesOrderNo: 'SO-1',
        supplierName: 'Factory One',
        status: 'HANDED_OVER_TO_CARRIER',
        shippingMethod: 'SEA_FCL_20GP',
        shippedAt: '2026-10-24T12:00:00+07:00',
        expectedWarehouseDate: '2026-10-28',
        totalCartons: 1,
        totalCbm: 0.024,
        totalQuantity: 30,
        scrapBoxes: [{ id: 10, cbmM3: 0.024, netWeightKg: 5 }],
        details: [
          {
            id: 1,
            purchaseOrderDetailId: 1,
            purchaseOrderDetailComponentId: 11,
            componentName: 'ฝา',
            quantity: 10,
            scrapBoxId: 10
          },
          {
            id: 2,
            purchaseOrderDetailId: 1,
            purchaseOrderDetailComponentId: 12,
            componentName: 'หลอด',
            quantity: 20,
            scrapBoxId: 10
          }
        ]
      }
    ]
  }
};
// Keep enough eligible deliveries to exercise the two-column container board
// and its multi-row background layout.
response.data.records.push(
  ...Array.from({ length: 5 }, (_, index) => ({
    ...response.data.records[0],
    id: index + 2,
    deliveryNo: `PO-${index + 2}-D001`,
    purchaseOrderNo: `PO-${index + 2}`,
    containerStatus: index % 2 === 0 ? 'NOT_ASSIGNED' : 'PARTIALLY_ASSIGNED'
  }))
);
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSupplierShippings).mockResolvedValue([
    { id: 1, shippingName: 'Carrier A', destinations: [{ id: 11, destinationName: 'Warehouse' }] },
    { id: 2, shippingName: 'Carrier B', destinations: [{ id: 22, destinationName: 'Warehouse' }] }
  ] as any);
  vi.mocked(searchPurchaseOrderDeliveries).mockResolvedValue(response);
});
afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
});
function openPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ContainerManagement />
      </MemoryRouter>
    </QueryClientProvider>
  );
}
it('loads deliveries and expands mixed box contents with a PO link', async () => {
  openPage();
  await screen.findByText('PO-1-D001');
  expect(searchPurchaseOrderDeliveries).toHaveBeenCalledWith({}, 1, 10);
  expect(screen.getByRole('link', { name: 'เปิด PO PO-1' }).getAttribute('href')).toBe(
    '/purchase-order/PO-1?tab=delivery'
  );
  fireEvent.click(screen.getByRole('button', { name: 'ดูรายละเอียด PO-1-D001' }));
  const table = screen.getByRole('table', { name: 'สินค้าและอะไหล่ในเที่ยวส่ง' });
  expect(within(table).getByText(/กล่องเศษ.*ฝา/)).toBeTruthy();
  expect(within(table).getByText(/กล่องเศษ.*หลอด/)).toBeTruthy();
});
it('applies filters and resets pagination when clearing', async () => {
  openPage();
  await screen.findByText('PO-1-D001');
  fireEvent.change(screen.getByLabelText('เลขที่ใบสั่งซื้อ (PO)'), { target: { value: 'PO-1' } });
  fireEvent.change(screen.getByLabelText('คำค้นหา'), { target: { value: 'Factory' } });
  fireEvent.click(screen.getByRole('button', { name: 'ค้นหา' }));
  await waitFor(() =>
    expect(searchPurchaseOrderDeliveries).toHaveBeenLastCalledWith(
      { purchaseOrderNo: 'PO-1', keyword: 'Factory' },
      1,
      10
    )
  );
  fireEvent.click(screen.getByRole('button', { name: 'หน้าถัดไป' }));
  await waitFor(() =>
    expect(searchPurchaseOrderDeliveries).toHaveBeenLastCalledWith(expect.anything(), 2, 10)
  );
  fireEvent.click(screen.getByRole('button', { name: 'เคลียร์' }));
  await waitFor(() => expect(screen.getByTestId('page').textContent).toBe('1'));
  expect((screen.getByLabelText('เลขที่ใบสั่งซื้อ (PO)') as HTMLInputElement).value).toBe('');
});
it('offers each container allocation status', async () => {
  openPage();
  await screen.findByText('PO-1-D001');
  fireEvent.mouseDown(screen.getByLabelText('สถานะตู้'));
  for (const name of ['ทั้งหมด', 'ยังไม่จัดตู้', 'จัดตู้บางส่วน', 'จัดตู้ครบแล้ว']) {
    expect(screen.getByRole('option', { name })).toBeTruthy();
  }
});
it('shows an empty state when no deliveries match', async () => {
  vi.mocked(searchPurchaseOrderDeliveries).mockResolvedValue({
    ...response,
    data: { ...response.data, records: [] }
  });
  openPage();
  await screen.findByText('ไม่พบรายการเที่ยวส่งตามเงื่อนไข');
});
it('shows loading failures and lets the user retry', async () => {
  vi.mocked(searchPurchaseOrderDeliveries).mockRejectedValueOnce(new Error('Unavailable'));
  openPage();
  await screen.findByText('ไม่สามารถโหลดรายการเที่ยวส่งได้');
  fireEvent.click(screen.getByRole('button', { name: 'ลองอีกครั้ง' }));
  await screen.findByText('PO-1-D001');
});

it('shows missing package metrics instead of treating them as zero', async () => {
  vi.mocked(searchPurchaseOrderDeliveries).mockResolvedValue({
    ...response,
    data: {
      ...response.data,
      records: [{ ...response.data.records[0], totalCartons: null, totalCbm: null }]
    }
  });
  openPage();
  await screen.findByText('PO-1-D001');
  expect(screen.getAllByText('ข้อมูลไม่ครบ')).toHaveLength(2);
});

it('searches by container allocation status and clears it back to all', async () => {
  openPage();
  await screen.findByText('PO-1-D001');
  expect(screen.queryByLabelText('สถานะเที่ยวส่ง')).toBeNull();
  fireEvent.mouseDown(screen.getByLabelText('สถานะตู้'));
  fireEvent.click(screen.getByRole('option', { name: 'จัดตู้บางส่วน' }));
  fireEvent.click(screen.getByRole('button', { name: 'ค้นหา' }));
  await waitFor(() =>
    expect(searchPurchaseOrderDeliveries).toHaveBeenLastCalledWith(
      { containerStatus: 'PARTIALLY_ASSIGNED' },
      1,
      10
    )
  );
  fireEvent.click(screen.getByRole('button', { name: 'เคลียร์' }));
  await waitFor(() => expect(searchPurchaseOrderDeliveries).toHaveBeenLastCalledWith({}, 1, 10));
});

it('loads destinations from supplier shippings and searches by the selected location ID', async () => {
  openPage();
  await screen.findByText('PO-1-D001');
  await waitFor(() => expect(getSupplierShippings).toHaveBeenCalledTimes(1));
  fireEvent.mouseDown(screen.getByLabelText('สถานที่ขนส่ง'));
  expect(screen.getByRole('option', { name: 'Carrier A — Warehouse' })).toBeTruthy();
  fireEvent.click(screen.getByRole('option', { name: 'Carrier B — Warehouse' }));
  fireEvent.click(screen.getByRole('button', { name: 'ค้นหา' }));
  await waitFor(() =>
    expect(searchPurchaseOrderDeliveries).toHaveBeenLastCalledWith(
      { shippingLocationId: 22 },
      1,
      10
    )
  );
  fireEvent.click(screen.getByRole('button', { name: 'เคลียร์' }));
  await waitFor(() => expect(searchPurchaseOrderDeliveries).toHaveBeenLastCalledWith({}, 1, 10));
});
it('lets users retry when loading shipping locations fails', async () => {
  vi.mocked(getSupplierShippings).mockRejectedValueOnce(new Error('Location unavailable'));
  openPage();
  await screen.findByText('ไม่สามารถโหลดสถานที่ขนส่งได้');
  fireEvent.click(screen.getByRole('button', { name: 'โหลดสถานที่อีกครั้ง' }));
  await waitFor(() => expect(getSupplierShippings).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.queryByText('ไม่สามารถโหลดสถานที่ขนส่งได้')).toBeNull());
});
