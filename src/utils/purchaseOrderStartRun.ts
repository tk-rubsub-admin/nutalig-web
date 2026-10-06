import {
  PurchaseOrderPayment,
  PurchaseOrderPaymentSchedule
} from 'services/PurchaseOrder/purchase-order-type';

export function getPurchaseOrderStartRunWarnings(
  status: string | undefined,
  payments: Pick<PurchaseOrderPayment, 'installmentNo' | 'status'>[],
  schedules: Pick<PurchaseOrderPaymentSchedule, 'installmentNo' | 'status'>[]
): string[] {
  const warnings: string[] = [];
  if (!['AWAITING_PAYMENT', 'PAID'].includes(status || '')) {
    warnings.push('PO ยังไม่ได้อยู่ในสถานะรอชำระเงินหรือชำระเงินแล้ว');
  }
  if (!payments.some((payment) => payment.installmentNo === 1 && payment.status === 'APPROVED')) {
    warnings.push('ยังไม่มีรายการชำระเงินงวดที่ 1 ที่อนุมัติแล้ว');
  }
  if (schedules.find((schedule) => schedule.installmentNo === 1)?.status === 'PARTIALLY_PAID') {
    warnings.push('งวดที่ 1 ชำระเงินไม่ครบตามยอดที่กำหนด (ชำระบางส่วน)');
  }
  return warnings;
}
