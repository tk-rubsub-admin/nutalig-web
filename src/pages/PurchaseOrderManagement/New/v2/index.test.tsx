// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSalesOrderV1 } from 'services/SaleOrder/sale-order-api';
import {
  createPurchaseOrder,
  updatePurchaseOrder,
  getPurchaseOrderCbmPreview
} from 'services/PurchaseOrder/purchase-order-api';
import { getSupplierById, getSupplierShippings } from 'services/Supplier/supplier-api';
import { getRFQ, getRFQSupplierQuotes } from 'services/RFQ/rfq-api';
import { getSystemConfig } from 'services/Config/config-api';
import { SalesOrderV1 } from 'services/SaleOrder/sale-order-type';
import NewPurchaseOrder from './index';

vi.setConfig({ testTimeout: 60000 });

vi.mock('services/SaleOrder/sale-order-api', () => ({ getSalesOrderV1: vi.fn() }));
vi.mock('services/PurchaseOrder/purchase-order-api', () => ({
  createPurchaseOrder: vi.fn(),
  updatePurchaseOrder: vi.fn(),
  getPurchaseOrderCbmPreview: vi.fn()
}));
vi.mock('services/Supplier/supplier-api', () => ({
  getSupplierById: vi.fn(),
  getSupplierShippings: vi.fn(),
  uploadSupplierAttachments: vi.fn()
}));
vi.mock('services/RFQ/rfq-api', () => ({ getRFQ: vi.fn(), getRFQSupplierQuotes: vi.fn() }));
vi.mock('services/Config/config-api', () => ({ getSystemConfig: vi.fn() }));
vi.mock('react-hot-toast', () => ({
  default: { promise: vi.fn(async (promise) => await promise), error: vi.fn(), success: vi.fn() }
}));
vi.mock('layout/LayoutRoute', () => ({ Page: ({ children }: any) => <div>{children}</div> }));
vi.mock('components/PageTitle', () => ({ default: ({ title }: any) => <h1>{title}</h1> }));
vi.mock('components/LoadingDialog', () => ({ default: () => null }));
vi.mock('components/ConfirmDialog', () => ({
  default: (props: any) =>
    props.open ? (
      <div role="dialog">
        <p>{props.message}</p>
        <button disabled={props.confirmDisabled} onClick={props.onConfirm}>
          Confirm
        </button>
        <button onClick={props.onCancel}>Cancel</button>
      </div>
    ) : null
}));
vi.mock('routes', () => ({
  ROUTE_PATHS: {
    SALE_ORDER_DETAIL: '/sales-order/:id',
    SALE_ORDER_MANAGEMENT: '/sales-order',
    PURCHASE_ORDER_DETAIL: '/purchase-order/:id'
  }
}));

const supplierNames: Record<string, string> = { A: 'Supplier A', B: 'Supplier B', C: 'Supplier C' };
function item(id: number, supplierId: string, rfqId: string, shippingMethod = 'LAND') {
  return {
    id,
    lineNo: id,
    name: `Product ${id}`,
    spec: `Spec ${id}`,
    quantity: 10,
    unitPrice: 20,
    amount: 200,
    supplier: { id: supplierId, supplierName: supplierNames[supplierId] },
    rfqId,
    rfqDetailId: id,
    rfqTierId: id,
    supplierQuoteTierId: id,
    shippingMethod,
    supplierCurrency: 'THB',
    supplierUnitPrice: 5,
    supplierShippingCost: 1,
    supplierTotalUnitCost: 6,
    imageUrl: null
  };
}
const salesOrder = {
  salesOrderNo: 'SO-1',
  rfqId: 'RFQ-A',
  shippingType: 'LAND',
  procurementStatus: 'READY_FOR_PO',
  items: [
    item(166, 'A', 'RFQ-A'),
    item(167, 'B', 'RFQ-B', 'SEA'),
    item(168, 'A', 'RFQ-A2'),
    item(169, 'C', 'RFQ-C')
  ]
} as unknown as SalesOrderV1;
const clients: QueryClient[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(getSalesOrderV1).mockResolvedValue({
    ...salesOrder,
    items: salesOrder.items.filter((row) => row.supplier?.id !== 'C')
  });
  vi.mocked(getSupplierById).mockImplementation(
    async (id) =>
      ({
        id,
        supplierName: supplierNames[id],
        contactName: `Contact ${id}`,
        contactNumber: id,
        fullAddress: `Address ${id}`,
        attachments: []
      } as any)
  );
  vi.mocked(getSupplierShippings).mockResolvedValue([
    {
      id: 1,
      shippingMethod: 'LAND',
      shippingMode: 'STANDARD',
      shippingName: 'Land shipping',
      carCode: 'TB00001',
      currency: 'THB',
      destinations: []
    },
    {
      id: 2,
      shippingMethod: 'SEA',
      shippingMode: 'STANDARD',
      shippingName: 'Sea shipping',
      carCode: 'TB00002',
      currency: 'THB',
      destinations: []
    }
  ] as any);
  vi.mocked(getRFQ).mockImplementation(
    async (id) => ({ id, details: [], procurementRemarks: [] } as any)
  );
  vi.mocked(getRFQSupplierQuotes).mockImplementation(
    async (rfqId) =>
      salesOrder.items
        .filter((row) => row.rfqId === rfqId)
        .map((row) => ({
          id: `QUOTE-${row.id}`,
          supplier: row.supplier,
          details: [
            {
              id: row.id,
              tiers: [
                {
                  id: row.id,
                  productPrice: row.id,
                  shippingCost: row.id === 167 ? 80 : 20,
                  currency: 'THB'
                }
              ]
            }
          ],
          revisionNo: 1
        })) as any
  );
  vi.mocked(getSystemConfig).mockResolvedValue([
    { code: 'DEP50', nameTh: 'Deposit 50%' },
    { code: 'DEP30', nameTh: 'Deposit 30%' }
  ] as any);
  vi.mocked(getPurchaseOrderCbmPreview).mockResolvedValue({
    totalCbm: 1,
    unavailableItemCount: 0,
    items: []
  });
  vi.mocked(createPurchaseOrder).mockImplementation(async (request) => ({
    purchaseOrderNo: `PO-${request.supplierId}`
  }));
  vi.mocked(updatePurchaseOrder).mockResolvedValue({} as any);
});
afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
  vi.restoreAllMocks();
});

async function openPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/purchase-order-create-v2/SO-1']}>
        <Route path="/purchase-order-create-v2/:salesOrderId">
          <NewPurchaseOrder />
        </Route>
      </MemoryRouter>
    </QueryClientProvider>
  );
  await screen.findByRole('button', { name: /1\/\d.*Supplier A/ });
  await waitFor(() => expect(getPurchaseOrderCbmPreview).toHaveBeenCalled());
  await waitFor(() =>
    expect(within(group('A')).getAllByLabelText('ผู้ติดต่อ')[0].getAttribute('value')).toBe(
      'Contact A'
    )
  );
}
const group = (id: string) => screen.getByRole('region', { name: `Supplier ${id}` });
const expand = (id: string) =>
  fireEvent.click(
    within(group(id)).getAllByRole('button', { name: new RegExp(`Supplier ${id}`) })[0]
  );
async function selectPayment(id: string, name: string) {
  fireEvent.mouseDown(within(group(id)).getByLabelText(/เงื่อนไขการชำระเงิน/));
  fireEvent.click(await screen.findByRole('option', { name }));
}
async function confirmSection(section: string | HTMLElement) {
  const root = typeof section === 'string' ? group(section) : section;
  await waitFor(() =>
    expect(
      (within(root).getByRole('button', { name: 'ยืนยันข้อมูล' }) as HTMLButtonElement).disabled
    ).toBe(false)
  );
  fireEvent.click(within(root).getByRole('button', { name: 'ยืนยันข้อมูล' }));
  expect(within(root).getByText('ยืนยันข้อมูลแล้ว')).toBeTruthy();
}
async function createAll() {
  fireEvent.click(screen.getByRole('button', { name: 'สร้างใบสั่งซื้อ' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Confirm' }));
}
const createButton = () =>
  screen.getByRole('button', { name: 'สร้างใบสั่งซื้อ' }) as HTMLButtonElement;

describe('Purchase order create v2 by supplier', () => {
  it('groups interleaved RFQ items into three supplier sections with independent shipping defaults', async () => {
    vi.mocked(getSalesOrderV1).mockResolvedValue(salesOrder);
    await openPage();
    expand('B');
    expand('C');
    expect(screen.getByRole('button', { name: /2\/3.*Supplier B/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /3\/3.*Supplier C/ })).toBeTruthy();
    expect(within(group('A')).getByDisplayValue('Product 166')).toBeTruthy();
    expect(within(group('A')).getByDisplayValue('Product 168')).toBeTruthy();
    expect(within(group('A')).queryByDisplayValue('Product 167')).toBeNull();
    expect(within(group('B')).getByDisplayValue('Product 167')).toBeTruthy();
    await waitFor(() => expect(within(group('B')).getByDisplayValue('TB00002')).toBeTruthy());
    expect(within(group('A')).getByDisplayValue('TB00001')).toBeTruthy();
  });

  it('preserves edits and payment selections when sections collapse without leaking state', async () => {
    await openPage();
    await selectPayment('A', 'Deposit 50%');
    fireEvent.change(within(group('A')).getByDisplayValue('Product 166'), {
      target: { value: 'Edited A' }
    });
    expand('A');
    expand('B');
    expect(within(group('B')).getByDisplayValue('Product 167')).toBeTruthy();
    expect(within(group('B')).queryByDisplayValue('Edited A')).toBeNull();
    await selectPayment('B', 'Deposit 30%');
    expand('A');
    expect(within(group('A')).getByDisplayValue('Edited A')).toBeTruthy();
    expect(within(group('A')).getByLabelText(/เงื่อนไขการชำระเงิน/).textContent).toContain(
      'Deposit 50%'
    );
    expect(within(group('B')).getByLabelText(/เงื่อนไขการชำระเงิน/).textContent).toContain(
      'Deposit 30%'
    );
  });

  it('enables the single create button only when every section is confirmed and invalidates a section when editing resumes', async () => {
    await openPage();
    expand('B');
    expect(screen.getAllByRole('button', { name: 'สร้างใบสั่งซื้อ' })).toHaveLength(1);
    expect(createButton().disabled).toBe(true);
    fireEvent.click(within(group('A')).getByRole('button', { name: 'ยืนยันข้อมูล' }));
    expect(within(group('A')).queryByText('ยืนยันข้อมูลแล้ว')).toBeNull();
    await selectPayment('A', 'Deposit 50%');
    await confirmSection('A');
    expect(createButton().disabled).toBe(true);
    expect(createPurchaseOrder).not.toHaveBeenCalled();
    expand('A');
    expect(screen.getByRole('button', { name: /1\/2.*Supplier A/ }).textContent).toContain(
      'ยืนยันแล้ว'
    );
    expand('A');
    expect((group('A').querySelector('fieldset') as HTMLFieldSetElement).disabled).toBe(true);
    await selectPayment('B', 'Deposit 30%');
    await confirmSection('B');
    expect(createButton().disabled).toBe(false);
    fireEvent.click(within(group('A')).getByRole('button', { name: 'แก้ไขข้อมูล' }));
    expect(createButton().disabled).toBe(true);
    expect(within(group('A')).queryByText('ยืนยันข้อมูลแล้ว')).toBeNull();
    fireEvent.change(within(group('A')).getByDisplayValue('Product 166'), {
      target: { value: 'Edited after confirmation' }
    });
    await confirmSection('A');
    expect(createButton().disabled).toBe(false);
    expect(createPurchaseOrder).not.toHaveBeenCalled();
  });

  it('keeps normal supplier items in one section and submits all of them using the selected transport', async () => {
    vi.mocked(getSalesOrderV1).mockResolvedValue({
      ...salesOrder,
      items: [item(166, 'A', 'RFQ-A'), item(168, 'A', 'RFQ-A2', 'SEA')]
    });
    await openPage();
    const root = group('A');
    expect(within(root).getAllByRole('region', { name: /^Supplier A Shipping / })).toHaveLength(1);
    expect(within(root).getByLabelText('การขนส่ง').getAttribute('aria-disabled')).not.toBe('true');
    expect(within(root).getByDisplayValue('Product 166')).toBeTruthy();
    expect(within(root).getByDisplayValue('Product 168')).toBeTruthy();
    await selectPayment('A', 'Deposit 50%');
    await confirmSection('A');
    expect(within(root).getByLabelText('การขนส่ง').getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(within(root).getByRole('button', { name: 'แก้ไขข้อมูล' }));
    expect(createButton().disabled).toBe(true);
    expect(within(root).getByLabelText('การขนส่ง').getAttribute('aria-disabled')).not.toBe('true');
    fireEvent.mouseDown(within(root).getByLabelText('การขนส่ง'));
    fireEvent.click(await screen.findByRole('option', { name: 'ขนส่งทางเรือ' }));
    await waitFor(() => expect(within(root).getByDisplayValue('TB00002')).toBeTruthy());
    expect(within(root).getByDisplayValue('Product 166')).toBeTruthy();
    expect(within(root).getByDisplayValue('Product 168')).toBeTruthy();
    await confirmSection('A');
    expect(createButton().disabled).toBe(false);
    await createAll();
    await screen.findByText('สร้างแล้ว PO-A');
    expect(createPurchaseOrder).toHaveBeenCalledTimes(1);
    const [request] = vi.mocked(createPurchaseOrder).mock.calls[0];
    expect(request.salesOrderDetailIds).toEqual([166, 168]);
    expect(request.shippingMethodSnapshot).toBe('SEA');
    expect(request.supplierShippingId).toBe(2);
  });

  it('deletes products, manual items and delivery from only their section and excludes them from the PO request', async () => {
    await openPage();
    expand('B');
    const root = group('A');
    await selectPayment('A', 'Deposit 50%');
    await selectPayment('B', 'Deposit 30%');
    await confirmSection('A');
    expect(
      (within(root).getByRole('button', { name: 'ลบรายการ Product 166' }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
    fireEvent.click(within(root).getByRole('button', { name: 'แก้ไขข้อมูล' }));
    fireEvent.click(within(root).getByRole('button', { name: 'ลบรายการ Product 166' }));
    expect(within(root).queryByDisplayValue('Product 166')).toBeNull();
    expect(within(root).getByDisplayValue('Product 168')).toBeTruthy();
    expect(within(group('B')).getByDisplayValue('Product 167')).toBeTruthy();
    await waitFor(() =>
      expect(within(root).getByLabelText('จำนวนเงินทั้งสิ้น').getAttribute('value')).toBe(
        '1,700.00 THB'
      )
    );
    await waitFor(() =>
      expect(
        vi
          .mocked(getPurchaseOrderCbmPreview)
          .mock.calls.some(
            ([request]) => request.items.length === 1 && request.items[0].salesOrderDetailId === 168
          )
      ).toBe(true)
    );
    fireEvent.click(within(root).getByRole('button', { name: 'เพิ่มรายการใหม่' }));
    fireEvent.change(
      within(root)
        .getAllByLabelText('สินค้า')
        .find((input) => (input as HTMLInputElement).value === '')!,
      {
        target: { value: 'Manual item' }
      }
    );
    fireEvent.click(within(root).getByRole('button', { name: 'ลบรายการ Manual item' }));
    expect(within(root).queryByDisplayValue('Manual item')).toBeNull();
    fireEvent.click(within(root).getByRole('button', { name: 'ลบรายการ Delivery' }));
    expect(within(root).queryByDisplayValue('Delivery')).toBeNull();
    await confirmSection('A');
    await confirmSection('B');
    await createAll();
    await screen.findByText('สร้างแล้ว PO-B');
    const [request] = vi.mocked(createPurchaseOrder).mock.calls[0];
    expect(request.salesOrderDetailIds).toEqual([168]);
    expect(request.items?.map((row) => row.name)).toEqual(['Product 168']);
    expect(salesOrder.items.map((row) => row.id)).toEqual([166, 167, 168, 169]);
  });

  it('restores deleted rows, blocks an empty section and can submit only a newly added item', async () => {
    vi.mocked(getSalesOrderV1).mockResolvedValue({
      ...salesOrder,
      items: [item(166, 'A', 'RFQ-A')]
    });
    await openPage();
    const root = group('A');
    await selectPayment('A', 'Deposit 50%');
    fireEvent.click(within(root).getByRole('button', { name: 'ลบรายการ Product 166' }));
    await waitFor(() =>
      expect(
        (within(root).getByRole('button', { name: 'ยืนยันข้อมูล' }) as HTMLButtonElement).disabled
      ).toBe(false)
    );
    fireEvent.click(within(root).getByRole('button', { name: 'ยืนยันข้อมูล' }));
    expect(within(root).queryByText('ยืนยันข้อมูลแล้ว')).toBeNull();
    expect(createButton().disabled).toBe(true);
    expect(within(root).getByLabelText('CBM รวม').getAttribute('value')).toBe('0.00 CBM');
    fireEvent.click(within(root).getByRole('button', { name: 'คืนรายการที่ลบ' }));
    expect(within(root).getByDisplayValue('Product 166')).toBeTruthy();
    expect(within(root).getByDisplayValue('Delivery')).toBeTruthy();
    fireEvent.click(within(root).getByRole('button', { name: 'ลบรายการ Product 166' }));
    fireEvent.click(within(root).getByRole('button', { name: 'เพิ่มรายการใหม่' }));
    fireEvent.change(within(root).getByLabelText('สินค้า'), { target: { value: 'Manual only' } });
    await confirmSection('A');
    await createAll();
    await screen.findByText('สร้างแล้ว PO-A');
    const [request] = vi.mocked(createPurchaseOrder).mock.calls[0];
    expect(request.salesOrderDetailIds).toEqual([]);
    expect(request.items?.map((row) => row.name)).toEqual(['Manual only']);
    expect(
      (within(root).getByRole('button', { name: 'ลบรายการ Manual only' }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
  });

  it('creates confirmed POs sequentially with isolated item IDs, delivery costs and attachments', async () => {
    await openPage();
    expand('B');
    await selectPayment('A', 'Deposit 50%');
    await selectPayment('B', 'Deposit 30%');
    const fileA = new File(['a'], 'a.pdf', { type: 'application/pdf' });
    const fileB = new File(['b'], 'b.pdf', { type: 'application/pdf' });
    fireEvent.change(group('A').querySelector('input[type="file"]')!, {
      target: { files: [fileA] }
    });
    fireEvent.change(group('B').querySelector('input[type="file"]')!, {
      target: { files: [fileB] }
    });
    await confirmSection('A');
    await confirmSection('B');
    let resolveFirst!: (value: { purchaseOrderNo: string }) => void;
    vi.mocked(createPurchaseOrder).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        })
    );
    await createAll();
    expect(createPurchaseOrder).toHaveBeenCalledTimes(1);
    expect(createButton().disabled).toBe(true);
    expect(
      (within(group('A')).getByRole('button', { name: 'แก้ไขข้อมูล' }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
    resolveFirst({ purchaseOrderNo: 'PO-A' });
    await screen.findByText('สร้างแล้ว PO-A');
    await screen.findByText('สร้างแล้ว PO-B');
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
    expect(createPurchaseOrder).toHaveBeenCalledTimes(2);
    const [requestA, attachmentsA] = vi.mocked(createPurchaseOrder).mock.calls[0];
    const [requestB, attachmentsB] = vi.mocked(createPurchaseOrder).mock.calls[1];
    expect(requestA.salesOrderDetailIds).toEqual([166, 168]);
    expect(
      requestA.items?.filter((row) => row.salesOrderDetailId).map((row) => row.salesOrderDetailId)
    ).toEqual([166, 168]);
    expect(requestA.items?.find((row) => row.name === 'Delivery')?.supplierUnitPrice).toBe(40);
    expect(attachmentsA).toEqual([fileA]);
    expect(requestB.salesOrderDetailIds).toEqual([167]);
    expect(requestB.supplierShippingId).toBe(2);
    expect(requestB.items?.find((row) => row.name === 'Delivery')?.supplierUnitPrice).toBe(80);
    expect(attachmentsB).toEqual([fileB]);
    expect(updatePurchaseOrder).toHaveBeenCalledWith('PO-A', expect.anything());
    expect(createButton().disabled).toBe(true);
    expect(screen.getByRole('heading', { name: 'สร้างใบสั่งซื้อ' })).toBeTruthy();
  });

  it('continues after a failed section and retries only sections without a returned PO number', async () => {
    await openPage();
    expand('B');
    await selectPayment('A', 'Deposit 50%');
    await selectPayment('B', 'Deposit 50%');
    await confirmSection('A');
    await confirmSection('B');
    vi.mocked(createPurchaseOrder).mockRejectedValueOnce(new Error('supplier A failed'));
    vi.mocked(updatePurchaseOrder).mockRejectedValueOnce(new Error('remark update failed'));
    await createAll();
    await screen.findByText('สร้างแล้ว PO-B');
    await waitFor(() => expect(createButton().disabled).toBe(false));
    expect(within(group('A')).getByRole('alert').textContent).toContain('สร้างใบสั่งซื้อไม่สำเร็จ');
    expect(screen.queryByText('สร้างแล้ว PO-A')).toBeNull();
    await createAll();
    await screen.findByText('สร้างแล้ว PO-A');
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
    expect(
      vi.mocked(createPurchaseOrder).mock.calls.filter(([request]) => request.supplierId === 'A')
    ).toHaveLength(2);
    expect(
      vi.mocked(createPurchaseOrder).mock.calls.filter(([request]) => request.supplierId === 'B')
    ).toHaveLength(1);
    expect(createButton().disabled).toBe(true);
  });

  it('reports items missing a supplier rather than assigning them to another supplier', async () => {
    vi.mocked(getSalesOrderV1).mockResolvedValue({
      ...salesOrder,
      items: [...salesOrder.items, { ...item(170, 'A', 'RFQ-A'), supplier: null }]
    });
    await openPage();
    expect(screen.getByRole('alert').textContent).toContain('Product 170');
    expect(within(group('A')).queryByDisplayValue('Product 170')).toBeNull();
  });

  it('creates LAND and shared FCL POs independently for split items of the same supplier using SO cost snapshots', async () => {
    vi.mocked(getSalesOrderV1).mockResolvedValue({
      ...salesOrder,
      items: [
        {
          ...item(182, 'A', 'RFQ-SPLIT'),
          rfqTierId: null,
          rfqTierSplitId: 9,
          resolvedShippingMethod: 'LAND',
          supplierQuoteTierId: null,
          quantity: 25000,
          supplierUnitPrice: 5.65,
          supplierShippingCost: 1.35
        },
        {
          ...item(183, 'A', 'RFQ-SPLIT', 'SEA'),
          rfqTierId: null,
          rfqTierSplitId: 10,
          resolvedShippingMethod: 'SEA_SHARE_FCL_40HQ',
          supplierQuoteTierId: null,
          quantity: 25000,
          supplierUnitPrice: 6.25,
          supplierShippingCost: 0.75
        }
      ]
    } as SalesOrderV1);
    vi.mocked(getSupplierShippings).mockResolvedValue([
      {
        id: 1,
        shippingMethod: 'LAND',
        shippingMode: 'STANDARD',
        shippingName: 'Land shipping',
        carCode: 'TR001',
        currency: 'THB',
        destinations: []
      },
      {
        id: 3,
        shippingMethod: 'SEA',
        shippingMode: 'FCL',
        shippingName: 'Shared container',
        carCode: 'TZ001',
        currency: 'THB',
        destinations: []
      }
    ] as any);
    vi.mocked(getPurchaseOrderCbmPreview).mockResolvedValue({
      totalCbm: 0,
      unavailableItemCount: 1,
      items: []
    });
    vi.mocked(createPurchaseOrder).mockImplementation(async (request) => ({
      purchaseOrderNo: `PO-${request.shippingMethodSnapshot}`
    }));
    await openPage();
    const land = screen.getByRole('region', { name: 'Supplier A Shipping LAND' });
    const sea = screen.getByRole('region', { name: 'Supplier A Shipping SEA_SHARE_FCL_40HQ' });
    expect(within(land).getByLabelText('การขนส่ง').getAttribute('aria-disabled')).toBe('true');
    expect(within(sea).getByLabelText('การขนส่ง').getAttribute('aria-disabled')).toBe('true');
    expect(within(land).getByDisplayValue('Product 182')).toBeTruthy();
    expect(within(land).queryByDisplayValue('Product 183')).toBeNull();
    expect(within(sea).getByDisplayValue('Product 183')).toBeTruthy();
    expect(within(sea).getByDisplayValue('TZ001')).toBeTruthy();
    expect(within(land).queryByDisplayValue('Delivery')).toBeNull();
    expect(within(land).getAllByDisplayValue('175,000.00').length).toBeGreaterThan(0);
    expect(within(sea).getAllByDisplayValue('175,000.00').length).toBeGreaterThan(0);
    fireEvent.mouseDown(within(land).getByLabelText(/เงื่อนไขการชำระเงิน/));
    fireEvent.click(await screen.findByRole('option', { name: 'Deposit 50%' }));
    await confirmSection(land);
    expect(createButton().disabled).toBe(true);
    expect(createPurchaseOrder).not.toHaveBeenCalled();
    fireEvent.mouseDown(within(sea).getByLabelText(/เงื่อนไขการชำระเงิน/));
    fireEvent.click(await screen.findByRole('option', { name: 'Deposit 30%' }));
    await confirmSection(sea);
    expect(createButton().disabled).toBe(false);
    await createAll();
    await screen.findByText('สร้างแล้ว PO-LAND');
    await screen.findByText('สร้างแล้ว PO-SEA_SHARE_FCL_40HQ');
    const [landRequest] = vi.mocked(createPurchaseOrder).mock.calls[0];
    const [seaRequest] = vi.mocked(createPurchaseOrder).mock.calls[1];
    expect(landRequest.salesOrderDetailIds).toEqual([182]);
    expect(landRequest.items).toHaveLength(1);
    expect(seaRequest.salesOrderDetailIds).toEqual([183]);
    expect(seaRequest.items).toHaveLength(1);
    expect(seaRequest.supplierShippingId).toBe(3);
    expect(seaRequest.shippingMethodSnapshot).toBe('SEA_SHARE_FCL_40HQ');
    expect(seaRequest.containerSizeSnapshot).toBe('40HQ');
    expect(seaRequest.items?.[0].supplierUnitPrice).toBe(6.25);
    expect(seaRequest.items?.[0].supplierShippingCost).toBe(0.75);
  });

  it('blocks an unresolved split and reports it instead of guessing a shipping group', async () => {
    vi.mocked(getSalesOrderV1).mockResolvedValue({
      ...salesOrder,
      items: [
        { ...item(182, 'A', 'RFQ-SPLIT'), rfqTierSplitId: 9, resolvedShippingMethod: 'LAND' },
        { ...item(183, 'A', 'RFQ-SPLIT', 'SEA'), rfqTierSplitId: 10 }
      ]
    } as SalesOrderV1);
    await openPage();
    const unresolved = screen.getByRole('region', { name: 'Supplier A Shipping UNRESOLVED' });
    expect(within(unresolved).getByRole('alert').textContent).toContain('Product 183');
    expect(within(unresolved).queryByRole('button', { name: 'ยืนยันข้อมูล' })).toBeNull();
    expect(createButton().disabled).toBe(true);
  });
});
