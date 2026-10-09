// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPurchaseOrderProof } from 'services/PurchaseOrder/purchase-order-api';
import ProofDetail from './index';

vi.mock('services/PurchaseOrder/purchase-order-api', () => ({
  getPurchaseOrderProof: vi.fn(),
  approvePurchaseOrderProof: vi.fn(),
  requestPurchaseOrderProofChanges: vi.fn(),
  cancelPurchaseOrderProof: vi.fn()
}));
vi.mock('layout/LayoutRoute', () => ({ Page: ({ children }: any) => <div>{children}</div> }));
vi.mock('components/PageTitle', () => ({ default: ({ title }: any) => <h1>{title}</h1> }));
const clients: QueryClient[] = [];

afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
  vi.clearAllMocks();
});

function openPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retryDelay: 1 } },
    logger: { log: () => {}, warn: () => {}, error: () => {} }
  });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/purchase-order-proof/9']}>
        <Route path="/purchase-order-proof/:id">
          <ProofDetail />
        </Route>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('proof detail failures', () => {
  it('explains a missing proof and does not retry the obsolete link', async () => {
    vi.mocked(getPurchaseOrderProof).mockRejectedValue({
      response: {
        status: 404,
        data: { status: 'data_not_found', message: 'Purchase order proof 9 not found.' }
      }
    });
    openPage();
    expect((await screen.findByRole('alert')).textContent).toContain('ไม่พบข้อมูลพรูฟงาน');
    expect(getPurchaseOrderProof).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'อนุมัติ' })).toBeNull();
  });

  it('still retries a temporary server failure and displays the proof after recovery', async () => {
    vi.mocked(getPurchaseOrderProof)
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValue({
        id: 9,
        purchaseOrderNo: 'PO-1',
        proofType: { code: 'DIGITAL_PROOF', nameTh: 'Digital Proof' },
        status: 'PENDING_APPROVAL',
        currentRevision: 1,
        canApprove: true,
        revisions: []
      } as any);
    openPage();
    await waitFor(() => expect(screen.getByText('PO-1')).toBeTruthy());
    expect(getPurchaseOrderProof).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: 'อนุมัติ' })).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
