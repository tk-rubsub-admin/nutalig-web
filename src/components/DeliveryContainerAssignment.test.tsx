// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import DeliveryContainerAssignment from './DeliveryContainerAssignment';

afterEach(cleanup);
it('shows allocation completeness and links to every assigned container', () => {
  render(<DeliveryContainerAssignment delivery={{ id: 1, status: 'HANDED_OVER_TO_CARRIER', details: [], containerStatus: 'PARTIALLY_ASSIGNED', containers: [
    { id: 8, containerJobNo: 'CT8', containerNo: 'ABC123' },
    { id: 9, containerJobNo: 'CT9' }
  ] }} />);
  expect(screen.getByText('จัดตู้บางส่วน')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'CT8 (ABC123)' }).getAttribute('href')).toBe('/container-management?containerId=8');
  expect(screen.getByRole('link', { name: 'CT9' }).getAttribute('href')).toBe('/container-management?containerId=9');
});
it('does not show allocation status for non-container shipping', () => {
  const { container } = render(<DeliveryContainerAssignment delivery={{ id: 1, status: 'HANDED_OVER_TO_CARRIER', shippingMethod: 'LAND', details: [], containerStatus: null }} />);
  expect(container.textContent).toBe('');
});
