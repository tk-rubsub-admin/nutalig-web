// @vitest-environment jsdom
import { createTheme, ThemeProvider } from '@mui/material';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MemoryRouter, Route } from 'react-router-dom';
import toast from 'react-hot-toast';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getActivityHistory } from 'services/ActivityHistory/activity-history-api';
import {
  completePurchaseOrderMilestone,
  getPurchaseOrder,
  getPurchaseOrderPayments,
  getPurchaseOrderPaymentSchedules,
  getPurchaseOrderProductionTimeline,
  updatePurchaseOrder
} from 'services/PurchaseOrder/purchase-order-api';
import {
  PurchaseOrderRecord,
  PurchaseOrderTimeline
} from 'services/PurchaseOrder/purchase-order-type';
import PurchaseOrderDetail from './index';

vi.mock('services/PurchaseOrder/purchase-order-api', () => ({
  completePurchaseOrderMilestone: vi.fn(),
  getPurchaseOrder: vi.fn(),
  getPurchaseOrderPayments: vi.fn(),
  getPurchaseOrderPaymentSchedules: vi.fn(),
  getPurchaseOrderProductionTimeline: vi.fn(),
  updatePurchaseOrder: vi.fn()
}));
vi.mock('services/ActivityHistory/activity-history-api', () => ({ getActivityHistory: vi.fn() }));
vi.mock('auth/PermissionContext', () => ({
  usePermissions: () => ({ has: () => allowed })
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), promise: vi.fn(async (promise) => await promise) }
}));
vi.mock('App', () => ({ default: () => null }));
vi.mock('heic2any', () => ({ default: vi.fn() }));
vi.mock('routes', () => ({ ROUTE_PATHS: { PURCHASE_ORDER_MANAGEMENT: '/purchase-order' } }));
vi.mock('layout/LayoutRoute', () => ({ Page: ({ children }: any) => <div>{children}</div> }));
vi.mock('components/PageTitle', () => ({ default: ({ title }: any) => <h1>{title}</h1> }));
vi.mock('components/LoadingDialog', () => ({ default: () => null }));
vi.mock('components/ActivityHistoryTimeline', () => ({ default: () => null }));
vi.mock('pages/Manual/ManualHelpButton', () => ({ default: () => null }));
vi.mock('./PurchaseOrderPaymentSection', () => ({ default: () => null }));
vi.mock('./PurchaseOrderProofSection', () => ({ default: () => null }));

const clients: QueryClient[] = [];
let allowed = true;
let purchaseOrder: PurchaseOrderRecord;
let timeline: PurchaseOrderTimeline;

beforeEach(() => {
  vi.clearAllMocks();
  allowed = true;
  purchaseOrder = {
    purchaseOrderNo: 'NTL-PO2026090009',
    status: 'PRODUCTION_RUNNING',
    productionLeadTimeDay: 35,
    productionStartedDate: null,
    productionExpectedEndDate: null,
    productionCompletedDate: null,
    items: [],
    attachments: []
  } as unknown as PurchaseOrderRecord;
  timeline = {
    purchaseOrderNo: purchaseOrder.purchaseOrderNo,
    purchaseOrderStatus: 'PRODUCTION_RUNNING',
    productionLeadTimeDay: 35,
    productionExpectedEndDate: null,
    events: [
      {
        type: 'PRODUCTION_STARTED',
        label: 'เริ่มผลิต',
        status: 'PENDING',
        canComplete: true,
        completed: false,
        date: null,
        actualAt: null
      }
    ]
  } as PurchaseOrderTimeline;
  vi.mocked(getPurchaseOrder).mockImplementation(async () => purchaseOrder);
  vi.mocked(getPurchaseOrderProductionTimeline).mockImplementation(async () => timeline);
  vi.mocked(getPurchaseOrderPayments).mockResolvedValue([]);
  vi.mocked(getPurchaseOrderPaymentSchedules).mockResolvedValue([]);
  vi.mocked(getActivityHistory).mockResolvedValue([]);
  vi.mocked(completePurchaseOrderMilestone).mockResolvedValue(purchaseOrder);
});

afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
});

async function openPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, cacheTime: 0 } },
    logger: { log: () => {}, warn: () => {}, error: () => {} }
  });
  clients.push(client);
  render(
    <ThemeProvider theme={createTheme()}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/purchase-order/NTL-PO2026090009']}>
          <Route path="/purchase-order/:id">
            <PurchaseOrderDetail />
          </Route>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
  await waitFor(() => expect(getPurchaseOrderProductionTimeline).toHaveBeenCalledTimes(1));
  const operationButton = screen.getByRole('button', { name: 'ดำเนินการ' });
  await waitFor(() => expect(operationButton.hasAttribute('disabled')).toBe(false));
}

async function openOperationMenu() {
  await openPage();
  const operationButton = screen.getByRole('button', { name: 'ดำเนินการ' });
  fireEvent.click(operationButton);
  return screen.findByRole('menuitem', { name: /^เริ่มผลิต/ });
}

describe('Edit PO document date', () => {
  it.each(['29/09/2026', '2026-09-29'])(
    'preserves the API docDate %s in the date field and the save request',
    async (docDate) => {
      purchaseOrder.docDate = docDate;
      vi.mocked(updatePurchaseOrder).mockResolvedValue(purchaseOrder);
      await openPage();
      fireEvent.click(screen.getByRole('button', { name: 'ตัวเลือก' }));
      fireEvent.click(await screen.findByRole('menuitem', { name: 'แก้ไขใบสั่งซื้อ' }));
      const dateField = await screen.findByLabelText('วันที่เอกสาร');
      expect((dateField as HTMLInputElement).value).toBe('2026-09-29');
      fireEvent.click(screen.getByRole('button', { name: 'ตัวเลือก' }));
      fireEvent.click(await screen.findByRole('menuitem', { name: 'button.save' }));
      await waitFor(() =>
        expect(updatePurchaseOrder).toHaveBeenCalledWith(
          purchaseOrder.purchaseOrderNo,
          expect.objectContaining({ docDate: '2026-09-29' })
        )
      );
    }
  );
});

describe('Start PO production', () => {
  it('confirms production, saves a selected due date and note, and refreshes the timeline', async () => {
    vi.mocked(completePurchaseOrderMilestone).mockImplementation(async () => {
      purchaseOrder = { ...purchaseOrder, productionStartedDate: '2026-10-09' };
      timeline = {
        ...timeline,
        events: [
          {
            ...timeline.events[0],
            status: 'COMPLETED',
            completed: true,
            canComplete: false,
            date: '2026-10-09',
            actualAt: '2026-10-09T10:00:00+07:00'
          }
        ]
      };
      return purchaseOrder;
    });
    fireEvent.click(await openOperationMenu());
    const dialog = await screen.findByRole('dialog', { name: 'เริ่มผลิต' });
    expect(completePurchaseOrderMilestone).not.toHaveBeenCalled();
    fireEvent.change(within(dialog).getByLabelText('กำหนดผลิตเสร็จ'), {
      target: { value: '2026-11-03' }
    });
    fireEvent.change(within(dialog).getByLabelText('หมายเหตุ'), {
      target: { value: '  โรงงานเริ่มผลิตแล้ว  ' }
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'confirm' }));
    await waitFor(() =>
      expect(completePurchaseOrderMilestone).toHaveBeenCalledWith(
        'NTL-PO2026090009',
        'PRODUCTION_STARTED',
        { plannedDate: '2026-11-03', note: 'โรงงานเริ่มผลิตแล้ว' }
      )
    );
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'เริ่มผลิต' })).toBeNull());
    await waitFor(() => expect(getPurchaseOrderProductionTimeline).toHaveBeenCalledTimes(2));
    expect(getPurchaseOrder).toHaveBeenCalledTimes(2);
    expect(getActivityHistory).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('รอเริ่มผลิต')).toBeNull();
  });

  it('leaves the date empty for a legacy PO so the API calculates it from the lead time', async () => {
    fireEvent.click(await openOperationMenu());
    const dialog = await screen.findByRole('dialog', { name: 'เริ่มผลิต' });
    expect((within(dialog).getByLabelText('กำหนดผลิตเสร็จ') as HTMLInputElement).value).toBe('');
    fireEvent.click(within(dialog).getByRole('button', { name: 'confirm' }));
    await waitFor(() =>
      expect(completePurchaseOrderMilestone).toHaveBeenCalledWith(
        'NTL-PO2026090009',
        'PRODUCTION_STARTED',
        { plannedDate: null, note: null }
      )
    );
  });

  it.each(['proofs unresolved', 'no permission', 'closed PO', 'already started'])(
    'disables production start for %s',
    async (condition) => {
      if (condition === 'proofs unresolved') timeline.events[0].canComplete = false;
      if (condition === 'no permission') allowed = false;
      if (condition === 'closed PO') purchaseOrder.status = 'CLOSED';
      if (condition === 'already started') purchaseOrder.productionStartedDate = '2026-10-09';
      const item = await openOperationMenu();
      expect(item.getAttribute('aria-disabled')).toBe('true');
      fireEvent.click(item);
      expect(screen.queryByRole('dialog', { name: 'เริ่มผลิต' })).toBeNull();
      expect(completePurchaseOrderMilestone).not.toHaveBeenCalled();
    }
  );

  it('keeps the confirmation open on API failure so the user can retry', async () => {
    vi.mocked(completePurchaseOrderMilestone).mockRejectedValue({
      response: { data: { message: 'On-press color check must be approved or skipped first.' } }
    });
    fireEvent.click(await openOperationMenu());
    const dialog = await screen.findByRole('dialog', { name: 'เริ่มผลิต' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'confirm' }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'On-press color check must be approved or skipped first.'
      )
    );
    expect(screen.getByRole('dialog', { name: 'เริ่มผลิต' })).toBeTruthy();
    expect(getPurchaseOrderProductionTimeline).toHaveBeenCalledTimes(1);
  });
});
