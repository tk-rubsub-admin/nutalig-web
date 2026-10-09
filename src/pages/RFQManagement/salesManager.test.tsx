// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PERMISSIONS } from 'auth/permissions';
import { ROLES } from 'auth/roles';
import { getRFQList } from 'services/RFQ/rfq-api';
import RFQManagement from './index';

let role: string = ROLES.SALES_MANAGER;
let canCreate = true;
const clients: QueryClient[] = [];

vi.mock('auth/AuthContext', () => ({
  useAuth: () => ({
    getRole: () => role,
    getEmployeeId: () => 'EMP-LOGIN',
    getSalesId: () => 'EMP-LOGIN',
    hasPermission: (permission: string) => permission === PERMISSIONS.RFQ_CREATE && canCreate
  })
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('services/RFQ/rfq-api', () => ({ getRFQList: vi.fn(), exportRFQList: vi.fn() }));
vi.mock('services/Sales/sales-api', () => ({
  getSales: vi.fn(async () => [
    { salesId: 'SALES-A', name: 'Sales A' },
    { salesId: 'SALES-B', name: 'Sales B' }
  ]),
  getEmployeesByPosition: vi.fn(async () => [])
}));
vi.mock('services/SearchField/search-field-api', () => ({
  getMySearchFields: vi.fn(async () => [{ fieldCode: 'salesId', visible: true }])
}));
vi.mock('services/Config/config-api', () => ({ getSystemConfig: vi.fn(async () => []) }));
vi.mock('services/Product/product-api', () => ({ getProductFamilies: vi.fn(async () => []) }));
vi.mock('services/Customer/customer-api', () => ({
  searchCustomerByKeyword: vi.fn(async () => [])
}));
vi.mock('layout/LayoutRoute', () => ({ Page: ({ children }: any) => <div>{children}</div> }));
vi.mock('components/PageTitle', () => ({ default: () => null }));
vi.mock('components/LoadingDialog', () => ({ default: () => null }));
vi.mock('components/Paginate', () => ({ default: () => null }));
vi.mock('components/CollapsibleWrapper', () => ({
  default: ({ children }: any) => <div>{children}</div>
}));
vi.mock('routes', () => ({ ROUTE_PATHS: { RFQ_CREATE: '/rfq-create' } }));

beforeEach(() => {
  role = ROLES.SALES_MANAGER;
  canCreate = true;
  vi.clearAllMocks();
  vi.mocked(getRFQList).mockResolvedValue({
    records: [],
    pagination: { page: 1, size: 10, totalRecords: 0, totalPages: 0 }
  } as any);
});

afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
});

function openPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/rfq-management']}>
        <RFQManagement />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('sales manager RFQ access', () => {
  it('allows creating RFQs and requests all sales data without defaulting to the manager ID', async () => {
    openPage();
    expect(screen.getByRole('button', { name: 'rfqManagement.action.create' })).toBeTruthy();
    await waitFor(() => expect(getRFQList).toHaveBeenCalled());
    expect(vi.mocked(getRFQList).mock.calls.every((call) => call[2]?.salesId === '')).toBe(true);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'button.search' }));
    });
    expect(vi.mocked(getRFQList).mock.calls.every((call) => call[2]?.salesId === '')).toBe(true);
  });

  it('allows the manager to search for another sales employee', async () => {
    openPage();
    await waitFor(() => expect(getRFQList).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByLabelText('รหัสเซลล์').getAttribute('aria-disabled')).not.toBe('true')
    );
    fireEvent.mouseDown(screen.getByLabelText('รหัสเซลล์'));
    fireEvent.click(await screen.findByRole('option', { name: 'SALES-B - Sales B' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'button.search' }));
    });
    await waitFor(() =>
      expect(getRFQList).toHaveBeenLastCalledWith(
        1,
        10,
        expect.objectContaining({ salesId: 'SALES-B' })
      )
    );
  });

  it('keeps the individual sales user default filter', async () => {
    role = ROLES.SALES;
    openPage();
    await waitFor(() => expect(getRFQList).toHaveBeenCalled());
    expect(vi.mocked(getRFQList).mock.calls.every((call) => call[2]?.salesId === 'EMP-LOGIN')).toBe(
      true
    );
  });

  it('hides the create action when the user has no RFQ create permission', async () => {
    canCreate = false;
    openPage();
    await waitFor(() => expect(getRFQList).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'rfqManagement.action.create' })).toBeNull();
  });
});
