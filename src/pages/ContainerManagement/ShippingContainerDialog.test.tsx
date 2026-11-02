// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getSupplierShippings } from 'services/Supplier/supplier-api';
import {
  actOnContainer,
  createContainer,
  getContainer,
  ShippingContainer,
  updateContainer
} from 'services/ShippingContainer/shipping-container-api';
import ShippingContainerDialog from './ShippingContainerDialog';
vi.mock('api/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
vi.mock('services/ShippingContainer/shipping-container-api', async () => {
  const original = await vi.importActual<any>('services/ShippingContainer/shipping-container-api');
  return {
    ...original,
    getContainer: vi.fn(),
    createContainer: vi.fn(),
    updateContainer: vi.fn(),
    actOnContainer: vi.fn()
  };
});
vi.mock('services/Supplier/supplier-api', () => ({ getSupplierShippings: vi.fn() }));
vi.mock('components/ActivityHistoryTimeline', () => ({ default: () => null }));
vi.mock('auth/PermissionContext', () => ({ usePermissions: () => ({ has: () => allowed }) }));
vi.mock('./ContainerLoadPicker', () => ({ default: () => null }));
const clients: QueryClient[] = [];
let allowed = true;
const draft: ShippingContainer = {
  id: 1,
  version: 1,
  containerJobNo: 'CT-1',
  containerNo: 'ABCD',
  sealNo: 'SEAL',
  containerSize: '20GP',
  shippingMethod: 'SEA_FCL_20GP',
  supplierShippingId: 1,
  destinationId: 2,
  status: 'DRAFT',
  totalCartons: 0,
  totalCbm: 0,
  totalNetWeightKg: 0,
  totalGrossWeightKg: 0,
  loads: [],
  capacityCbm: 33,
  maxCargoWeightKg: 1000
};
beforeEach(() => {
  vi.clearAllMocks();
  allowed = true;
  vi.mocked(getSupplierShippings).mockResolvedValue([]);
  vi.mocked(getContainer).mockResolvedValue(draft);
  vi.mocked(createContainer).mockResolvedValue(draft);
  vi.mocked(updateContainer).mockResolvedValue({ ...draft, version: 2 });
});
afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
});
function open(id: number | null) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <ShippingContainerDialog open id={id} onClose={() => {}} onUpdated={() => {}} />
    </QueryClientProvider>
  );
}
it('prepares a new container locally without creating or updating it', async () => {
  open(null);
  fireEvent.change(screen.getByLabelText('หมายเลขตู้จริง'), { target: { value: 'TEST' } });
  await screen.findByText(/ข้อมูลตู้และกล่องยังไม่ได้บันทึก/);
  expect(createContainer).not.toHaveBeenCalled();
  expect(updateContainer).not.toHaveBeenCalled();
  expect(
    (screen.getByRole('button', { name: 'ยืนยันสร้างตู้' }) as HTMLButtonElement).disabled
  ).toBe(true);
});
it('requires a reason to reopen a sealed container and does not offer editing before reopening', async () => {
  vi.mocked(getContainer).mockResolvedValue({ ...draft, status: 'SEALED' });
  vi.mocked(actOnContainer).mockResolvedValue({ ...draft, status: 'LOADING', version: 2 });
  open(1);
  await screen.findByText('CT-1');
  expect(screen.queryByRole('button', { name: 'บันทึกข้อมูลตู้' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'เพิ่มกล่องลงตู้' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'เปิดตู้เพื่อแก้ไข' }));
  const confirm = screen.getByRole('button', { name: 'ยืนยัน' }) as HTMLButtonElement;
  expect(confirm.disabled).toBe(true);
  fireEvent.change(screen.getByLabelText(/เหตุผล/), { target: { value: 'แก้จำนวนกล่อง' } });
  fireEvent.click(confirm);
  await waitFor(() => expect(actOnContainer).toHaveBeenCalledWith(1, 'REOPEN', 1, 'แก้จำนวนกล่อง'));
  await screen.findByRole('button', { name: 'บันทึกข้อมูลตู้' });
});
it('sends the current version for updates and exposes reload after a stale-data error', async () => {
  vi.mocked(updateContainer).mockRejectedValueOnce({
    response: { data: { message: 'ข้อมูลตู้มีการเปลี่ยนแปลง' } }
  });
  open(1);
  await screen.findByText('CT-1');
  fireEvent.change(screen.getByLabelText('หมายเลขซีล'), { target: { value: 'NEW' } });
  fireEvent.click(screen.getByRole('button', { name: 'บันทึกข้อมูลตู้' }));
  await screen.findByText('ข้อมูลตู้มีการเปลี่ยนแปลง');
  expect(updateContainer).toHaveBeenCalledWith(
    1,
    expect.objectContaining({ version: 1, sealNo: 'NEW' })
  );
  fireEvent.click(screen.getByRole('button', { name: 'โหลดข้อมูลใหม่' }));
  await waitFor(() => expect(getContainer).toHaveBeenCalledTimes(2));
});
it('does not create a replacement job when loading an existing job fails', async () => {
  vi.mocked(getContainer).mockRejectedValueOnce(new Error('Not available'));
  open(1);
  await screen.findByText('ไม่สามารถโหลดข้อมูลตู้ได้');
  expect(screen.queryByRole('button', { name: 'บันทึกข้อมูลตู้' })).toBeNull();
  expect(createContainer).not.toHaveBeenCalled();
});
it('hides mutation actions for view-only users', async () => {
  allowed = false;
  open(1);
  await screen.findByText('CT-1');
  expect(screen.queryByRole('button', { name: 'บันทึกข้อมูลตู้' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'เริ่มจัดตู้' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'ยกเลิกตู้' })).toBeNull();
});

it('clears the old job actions while a different job is loading', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } });
  clients.push(client);
  const view = render(
    <QueryClientProvider client={client}>
      <ShippingContainerDialog open id={1} onClose={() => {}} onUpdated={() => {}} />
    </QueryClientProvider>
  );
  await screen.findByText('CT-1');
  vi.mocked(getContainer).mockImplementationOnce(() => new Promise(() => {}));
  view.rerender(
    <QueryClientProvider client={client}>
      <ShippingContainerDialog open id={2} onClose={() => {}} onUpdated={() => {}} />
    </QueryClientProvider>
  );
  await waitFor(() => expect(screen.queryByText('CT-1')).toBeNull());
  expect(screen.queryByRole('button', { name: 'เริ่มจัดตู้' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'บันทึกข้อมูลตู้' })).toBeNull();
});
