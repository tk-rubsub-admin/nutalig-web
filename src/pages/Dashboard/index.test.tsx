// @vitest-environment jsdom
import { createTheme, ThemeProvider } from '@mui/material';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MemoryRouter } from 'react-router-dom';
import { Chart } from 'react-google-charts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDashboard } from 'services/Dashboard/dashboard-api';
import { DashboardData } from 'services/Dashboard/dashboard-type';
import { getEmployeesByPosition, getSales } from 'services/Sales/sales-api';
import Dashboard from './index';

vi.mock('services/Dashboard/dashboard-api', () => ({ getDashboard: vi.fn() }));
vi.mock('services/Sales/sales-api', () => ({
  getSales: vi.fn(),
  getEmployeesByPosition: vi.fn()
}));
vi.mock('auth/AuthContext', () => ({ useAuth: () => ({ getRole: () => 'ADMIN' }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('react-google-charts', () => ({ Chart: vi.fn(() => null) }));
vi.mock('routes', () => ({ ROUTE_PATHS: {} }));
vi.mock('utils', () => ({ DEFAULT_DATE_FORMAT_BFF: 'YYYY-MM-DD' }));
vi.mock('layout/LayoutRoute', () => ({ Page: ({ children }: any) => <div>{children}</div> }));
vi.mock('components/PageTitle', () => ({ default: ({ title }: any) => <h1>{title}</h1> }));

const clients: QueryClient[] = [];
const defaultCriteria = () => ({
  dateFrom: dayjs().subtract(3, 'month').startOf('month').format('YYYY-MM-DD'),
  dateTo: dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD'),
  salesId: '',
  procurementId: ''
});
const dashboardData = (value = 'initial data'): DashboardData => ({
  range: 'CUSTOM',
  generatedAt: new Date().toISOString(),
  source: 'api',
  metrics: [{ id: 'test', title: 'Metric', subtitle: '', tone: 'neutral', value }],
  trendCharts: [],
  distributionCharts: [],
  workQueues: [],
  quickLinks: []
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getDashboard).mockResolvedValue(dashboardData());
  vi.mocked(getSales).mockResolvedValue([
    { salesId: 'SALES-1', nickname: 'Sales One', name: 'Sales One' } as any
  ]);
  vi.mocked(getEmployeesByPosition).mockResolvedValue([
    { salesId: 'PROC-1', nickname: 'Procurement One', name: 'Procurement One' } as any
  ]);
});

afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
});

async function openPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: 3, retryDelay: 0, cacheTime: 0 } },
    logger: { log: () => {}, warn: () => {}, error: () => {} }
  });
  clients.push(client);
  render(
    <ThemeProvider theme={createTheme()}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
  await waitFor(() => expect(getDashboard).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(viewButton().hasAttribute('disabled')).toBe(false));
}

function viewButton() {
  return screen.getByRole('button', { name: 'dashboard.filters.viewData' });
}

async function selectEndMonthAsStartMonth() {
  const month = dayjs().subtract(1, 'month');
  const label = new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' })
    .format(month.toDate());
  fireEvent.mouseDown(screen.getByLabelText('dashboard.filters.monthFrom'));
  fireEvent.click(await screen.findByRole('option', { name: label }));
}

async function selectEmployee(field: string, option: string) {
  fireEvent.change(screen.getByLabelText(field), { target: { value: option } });
  fireEvent.click(await screen.findByRole('option', { name: option }));
}

describe('Dashboard explicit data loading', () => {
  it('renders procurement KPI month series with separate annotation columns and pending/missing categories', async () => {
    const payload = dashboardData();
    payload.procurementKpiChart = {
      id: 'rfq-procurement-kpi',
      title: 'dashboard.rfq.charts.procurementKpi.title',
      subtitle: 'dashboard.rfq.charts.procurementKpi.subtitle',
      labels: ['dashboard.rfq.charts.procurementKpi.buckets.lt1d', 'dashboard.rfq.charts.procurementKpi.buckets.pending', 'dashboard.rfq.charts.procurementKpi.buckets.missingData'],
      series: [
        { name: '2026-08', color: '#854d0e', data: [1, 2, 0] },
        { name: '2026-09', color: '#4f46e5', data: [3, 0, 1] }
      ],
      visibleTo: ['ADMIN']
    };
    vi.mocked(getDashboard).mockResolvedValue(payload);
    await openPage();
    expect(screen.getByText('dashboard.rfq.charts.procurementKpi.title')).toBeTruthy();
    expect(screen.getByText('dashboard.rfq.charts.procurementKpi.subtitle')).toBeTruthy();
    const props = vi.mocked(Chart).mock.calls.find(([props]) => props.chartType === 'ColumnChart')?.[0];
    expect(props?.data.slice(1)).toEqual([
      ['dashboard.rfq.charts.procurementKpi.buckets.lt1d', 1, '1', 3, '3'],
      ['dashboard.rfq.charts.procurementKpi.buckets.pending', 2, '2', 0, '0'],
      ['dashboard.rfq.charts.procurementKpi.buckets.missingData', 0, '0', 1, '1']
    ]);
    expect(props?.options).toEqual(expect.objectContaining({ isStacked: false, colors: ['#925944', '#D4C5BA'] }));
    expect(getDashboard).toHaveBeenCalledTimes(1);
  });

  it('renders the RFQ type distribution as a donut using the counts and colors returned by the API', async () => {
    const payload = dashboardData();
    payload.distributionCharts = [{
      id: 'rfq-by-type',
      title: 'dashboard.rfq.charts.rfqType.title',
      subtitle: 'dashboard.rfq.charts.rfqType.subtitle',
      items: [
        { label: 'งานใหม่', value: 2, color: '#2f80ed' },
        { label: 'Repeat price', value: 1, color: '#27ae60' }
      ],
      visibleTo: ['ADMIN']
    }];
    vi.mocked(getDashboard).mockResolvedValue(payload);
    await openPage();
    expect(screen.getByText('dashboard.rfq.charts.rfqType.title')).toBeTruthy();
    expect(Chart).toHaveBeenCalledWith(expect.objectContaining({
      chartType: 'PieChart',
      data: [['Category', 'Count'], ['งานใหม่', 2], ['Repeat price', 1]],
      options: expect.objectContaining({ pieHole: 0.58, colors: ['#1F3F37', '#925944'] })
    }), expect.anything());
    expect(getDashboard).toHaveBeenCalledTimes(1);
  });

  it('loads on entry, waits for View data after filter changes, and refreshes unchanged criteria on click', async () => {
    await openPage();
    expect(getDashboard).toHaveBeenLastCalledWith(defaultCriteria());
    await selectEndMonthAsStartMonth();
    await selectEmployee('dashboard.filters.sales', 'SALES-1 - Sales One');
    await selectEmployee('dashboard.filters.procurement', 'PROC-1 - Procurement One');
    expect(getDashboard).toHaveBeenCalledTimes(1);
    expect(screen.getByText('initial data')).toBeTruthy();

    fireEvent.click(viewButton());
    await waitFor(() => expect(getDashboard).toHaveBeenCalledTimes(2));
    expect(getDashboard).toHaveBeenLastCalledWith({
      ...defaultCriteria(),
      dateFrom: dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
      salesId: 'SALES-1',
      procurementId: 'PROC-1'
    });
    await waitFor(() => expect(viewButton().hasAttribute('disabled')).toBe(false));
    fireEvent.click(viewButton());
    await waitFor(() => expect(getDashboard).toHaveBeenCalledTimes(3));
  });

  it('clears the form without fetching or replacing the displayed data until View data is clicked', async () => {
    await openPage();
    await selectEndMonthAsStartMonth();
    vi.mocked(getDashboard).mockResolvedValue(dashboardData('filtered data'));
    fireEvent.click(viewButton());
    await screen.findByText('filtered data');
    fireEvent.click(await screen.findByRole('button', { name: 'button.clear' }));
    expect(getDashboard).toHaveBeenCalledTimes(2);
    expect(screen.getByText('filtered data')).toBeTruthy();
    fireEvent.click(viewButton());
    await waitFor(() => expect(getDashboard).toHaveBeenCalledTimes(3));
    expect(getDashboard).toHaveBeenLastCalledWith(defaultCriteria());
  });

  it('does not retry a failed request or fetch automatically on focus or reconnect', async () => {
    vi.mocked(getDashboard).mockRejectedValue(new Error('API unavailable'));
    await openPage();
    await screen.findByRole('alert');
    await act(async () => {
      fireEvent.focus(window);
      fireEvent(window, new Event('online'));
    });
    expect(getDashboard).toHaveBeenCalledTimes(1);
    vi.mocked(getDashboard).mockResolvedValue(dashboardData());
    fireEvent.click(viewButton());
    await screen.findByText('initial data');
    expect(getDashboard).toHaveBeenCalledTimes(2);
  });
});
