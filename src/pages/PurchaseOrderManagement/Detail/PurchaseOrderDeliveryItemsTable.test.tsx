// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { PurchaseOrderDeliveryRecord } from 'services/PurchaseOrder/purchase-order-type';
import PurchaseOrderDeliveryItemsTable from './PurchaseOrderDeliveryItemsTable';

afterEach(cleanup);
const delivery: PurchaseOrderDeliveryRecord = {
  id: 1,
  status: 'HANDED_OVER_TO_CARRIER',
  scrapBoxes: [
    {
      id: 10,
      netWeightKg: 5,
      grossWeightKg: 6,
      lengthCm: 40,
      widthCm: 30,
      heightCm: 20,
      cbmM3: 0.024
    },
    {
      id: 11,
      netWeightKg: 7,
      grossWeightKg: 8,
      lengthCm: 60,
      widthCm: 40,
      heightCm: 20,
      cbmM3: 0.048
    }
  ],
  details: [
    {
      id: 1,
      purchaseOrderDetailId: 1,
      purchaseOrderDetailComponentId: 101,
      productName: 'ขวด',
      componentName: 'ชิ้นส่วนปกติ',
      quantity: 100,
      cartonCount: 2,
      piecesPerCarton: 50,
      netWeightKg: 8,
      grossWeightKg: 9,
      lengthCm: 50,
      widthCm: 40,
      heightCm: 30,
      cbmM3: 0.12
    },
    {
      id: 2,
      purchaseOrderDetailId: 1,
      purchaseOrderDetailComponentId: 102,
      componentName: 'ฝา',
      quantity: 10,
      scrapBoxId: 10
    },
    {
      id: 3,
      purchaseOrderDetailId: 1,
      purchaseOrderDetailComponentId: 103,
      componentName: 'หลอด',
      quantity: 20,
      scrapBoxId: 10
    },
    {
      id: 4,
      purchaseOrderDetailId: 1,
      purchaseOrderDetailComponentId: 104,
      componentName: 'หัวปั๊ม',
      quantity: 30,
      scrapBoxId: 11
    }
  ]
};
const cellsFor = (name: string) =>
  within(screen.getByText((text) => text === name || text === `[กล่องเศษ] - ${name}`).closest('tr') as HTMLTableRowElement).getAllByRole(
    'cell'
  ) as HTMLTableCellElement[];

it('merges shared box cells per scrap box while showing all component quantities in one table', () => {
  render(<PurchaseOrderDeliveryItemsTable delivery={delivery} />);
  expect(screen.getAllByRole('table')).toHaveLength(1);
  expect(screen.queryByText('ขวด')).toBeNull();
  expect(cellsFor('ชิ้นส่วนปกติ').map((cell) => cell.textContent)).toEqual([
    'ชิ้นส่วนปกติ',
    '100',
    '2',
    '50',
    '8',
    '9',
    '50 × 40 × 30 cm',
    '0.12'
  ]);
  const first = cellsFor('ฝา');
  expect(first.map((cell) => cell.textContent)).toEqual([
    ' [กล่องเศษ] - ฝา',
    '10',
    '1',
    '-',
    '5',
    '6',
    '40 × 30 × 20 cm',
    '0.024'
  ]);
  for (const index of [2, 3, 4, 5, 6, 7]) expect(first[index].rowSpan).toBe(2);
  expect(cellsFor('หลอด').map((cell) => cell.textContent)).toEqual([
    ' [กล่องเศษ] - หลอด',
    '20'
  ]);
  const next = cellsFor('หัวปั๊ม');
  expect(next[2].textContent).toBe('1');
  expect(next[2].rowSpan).toBe(1);
  expect(next[7].textContent).toBe('0.048');
});
it('renders scrap-only deliveries and retains six decimal CBM precision', () => {
  render(
    <PurchaseOrderDeliveryItemsTable
      delivery={{
        ...delivery,
        details: delivery.details.filter((detail) => detail.scrapBoxId === 10),
        scrapBoxes: [{ ...delivery.scrapBoxes![0], cbmM3: 0.024123 }]
      }}
    />
  );
  expect(screen.getAllByRole('table')).toHaveLength(1);
  expect(screen.getByText('0.024123')).toBeTruthy();
  expect(screen.queryByText('ไม่มีรายการสินค้าในเที่ยวส่งนี้')).toBeNull();
  expect(cellsFor('ฝา')[2].rowSpan).toBe(2);
});
it('supports legacy records and the empty state', () => {
  const { rerender } = render(
    <PurchaseOrderDeliveryItemsTable
      delivery={{ ...delivery, scrapBoxes: undefined, details: [delivery.details[0]] }}
    />
  );
  expect(cellsFor('ชิ้นส่วนปกติ')).toHaveLength(8);
  rerender(
    <PurchaseOrderDeliveryItemsTable delivery={{ ...delivery, scrapBoxes: [], details: [] }} />
  );
  expect(screen.getByText('ไม่มีรายการสินค้าในเที่ยวส่งนี้').getAttribute('colspan')).toBe('8');
});
