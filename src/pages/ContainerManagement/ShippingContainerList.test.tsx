// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import ShippingContainerList from './ShippingContainerList';
vi.mock('auth/PermissionContext', () => ({ usePermissions: () => ({ has: () => true }) }));
vi.mock('routes', () => ({ ROUTE_PATHS: { CONTAINER_CREATE: '/container-management/new' } }));
vi.mock('components/Paginate', () => ({ default: () => null }));
vi.mock('./ShippingContainerDialog', () => ({
  default: ({ open, id }: any) => (open ? <div>Container detail {id}</div> : null)
}));
vi.mock('services/ShippingContainer/shipping-container-api', async () => ({
  ...(await vi.importActual<any>('services/ShippingContainer/shipping-container-api')),
  searchContainers: vi
    .fn()
    .mockResolvedValue({ records: [], pagination: { totalPage: 0, totalRecords: 0 } })
}));
vi.mock('api/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
afterEach(cleanup);
it('opens a linked container from the delivery query parameter', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/container-management?containerId=8']}>
        <ShippingContainerList />
      </MemoryRouter>
    </QueryClientProvider>
  );
  expect(await screen.findByText('Container detail 8')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'สร้างตู้คอนเทนเนอร์' }).getAttribute('href')).toBe(
    '/container-management/new'
  );
  client.clear();
});
