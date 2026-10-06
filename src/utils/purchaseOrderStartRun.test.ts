import { describe, expect, it } from 'vitest';
import { getPurchaseOrderStartRunWarnings } from './purchaseOrderStartRun';

describe('Purchase order start run warnings', () => {
  const approvedFirst = [{ installmentNo: 1, status: 'APPROVED' as const }];
  const partialFirst = [{ installmentNo: 1, status: 'PARTIALLY_PAID' as const }];

  it.each(['AWAITING_PAYMENT', 'PAID'])(
    '%s requires override when the approved first installment is only partially paid',
    (status) => {
      expect(getPurchaseOrderStartRunWarnings(status, approvedFirst, partialFirst)).toEqual([
        'งวดที่ 1 ชำระเงินไม่ครบตามยอดที่กำหนด (ชำระบางส่วน)'
      ]);
    }
  );

  it.each(['AWAITING_PAYMENT', 'PAID'])(
    '%s needs no override when the first installment is fully paid',
    (status) => {
      expect(
        getPurchaseOrderStartRunWarnings(status, approvedFirst, [
          { installmentNo: 1, status: 'PAID' }
        ])
      ).toEqual([]);
    }
  );

  it('keeps the existing reason requirement for no approved first installment', () => {
    expect(
      getPurchaseOrderStartRunWarnings(
        'AWAITING_PAYMENT',
        [
          { installmentNo: 1, status: 'PENDING' },
          { installmentNo: 2, status: 'APPROVED' }
        ],
        [{ installmentNo: 1, status: 'UNPAID' }]
      )
    ).toEqual(['ยังไม่มีรายการชำระเงินงวดที่ 1 ที่อนุมัติแล้ว']);
  });

  it('shows both status and partial payment warnings for CREATED', () => {
    expect(getPurchaseOrderStartRunWarnings('CREATED', approvedFirst, partialFirst)).toHaveLength(
      2
    );
  });

  it('does not require override for a partially paid later installment', () => {
    expect(
      getPurchaseOrderStartRunWarnings('AWAITING_PAYMENT', approvedFirst, [
        { installmentNo: 2, status: 'PARTIALLY_PAID' },
        { installmentNo: 1, status: 'PAID' }
      ])
    ).toEqual([]);
  });

  it('preserves legacy behavior when there is no payment schedule', () => {
    expect(getPurchaseOrderStartRunWarnings('AWAITING_PAYMENT', approvedFirst, [])).toEqual([]);
  });
});
