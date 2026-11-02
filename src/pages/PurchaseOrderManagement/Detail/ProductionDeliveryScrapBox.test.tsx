// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { useState } from 'react';
import ProductionDeliveryScrapBox, {
  createScrapBoxDraft,
  ScrapBoxComponentChoice,
  serializeScrapBoxes
} from './ProductionDeliveryScrapBox';
const choices: ScrapBoxComponentChoice[] = [
  {
    key: '1:11',
    purchaseOrderDetailId: 1,
    purchaseOrderDetailComponentId: 11,
    label: 'ขวด — ฝา',
    remainingQuantity: 10
  },
  {
    key: '1:12',
    purchaseOrderDetailId: 1,
    purchaseOrderDetailComponentId: 12,
    label: 'ขวด — หลอด',
    remainingQuantity: 20
  }
];
afterEach(cleanup);
function EditableBox() {
  const [value, setValue] = useState(createScrapBoxDraft(1));
  return (
    <ProductionDeliveryScrapBox
      value={value}
      choices={choices}
      disabled={false}
      onChange={setValue}
      onRemove={() => {}}
    />
  );
}
it('edits multiple components with one set of box measurements and no add option button', () => {
  render(<EditableBox />);
  const group = screen.getByRole('group', { name: 'กล่องเศษ' });
  fireEvent.click(within(group).getByRole('button', { name: 'เพิ่มอะไหล่' }));
  expect(within(group).getAllByLabelText(/^จำนวนชิ้น/)).toHaveLength(2);
  expect(within(group).getAllByLabelText('Net Weight (KGS)')).toHaveLength(1);
  expect(within(group).queryByRole('button', { name: 'เพิ่ม option' })).toBeNull();
  for (const [label, value] of [
    ['ยาว (CM)', '40'],
    ['กว้าง (CM)', '30'],
    ['สูง (CM)', '20']
  ]) {
    fireEvent.change(within(group).getByLabelText(label), { target: { value } });
  }
  fireEvent.click(within(group).getByRole('button', { name: 'คำนวณ CBM' }));
  expect((within(group).getByLabelText('CBM (M³)') as HTMLInputElement).value).toBe('0.024000');
});
it('serializes one box and two contents without duplicating shared measurements', () => {
  const box = {
    ...createScrapBoxDraft(1),
    lengthCm: '40',
    widthCm: '30',
    heightCm: '20',
    netWeightKg: '5',
    items: [
      { componentKey: '1:11', quantity: '10' },
      { componentKey: '1:12', quantity: '20' }
    ]
  };
  const request = serializeScrapBoxes([box], choices);
  expect(request.scrapBoxes).toHaveLength(1);
  expect(request.scrapBoxes[0]).toMatchObject({ cbmM3: 0.024, netWeightKg: 5 });
  expect(request.details).toEqual([
    {
      scrapBoxIndex: 0,
      purchaseOrderDetailId: 1,
      purchaseOrderDetailComponentId: 11,
      quantity: 10
    },
    { scrapBoxIndex: 0, purchaseOrderDetailId: 1, purchaseOrderDetailComponentId: 12, quantity: 20 }
  ]);
});
it('rejects empty boxes, unknown or duplicate components, zero quantities and negative measurements', () => {
  const box = createScrapBoxDraft(1);
  expect(() => serializeScrapBoxes([box], choices)).toThrow();
  expect(() => serializeScrapBoxes([{ ...box, items: [] }], choices)).toThrow();
  expect(() =>
    serializeScrapBoxes([{ ...box, items: [{ componentKey: '1:11', quantity: '0' }] }], choices)
  ).toThrow();
  expect(() => serializeScrapBoxes([{ ...box, netWeightKg: '-1' }], choices)).toThrow();
  expect(() =>
    serializeScrapBoxes(
      [
        {
          ...box,
          items: [
            { componentKey: '1:11', quantity: '1' },
            { componentKey: '1:11', quantity: '2' }
          ]
        }
      ],
      choices
    )
  ).toThrow();
});
