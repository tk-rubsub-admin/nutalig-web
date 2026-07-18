import { DocumentStatusProfile } from 'services/document-status-type';

type StatusColor = {
  backgroundColor: string;
  color: string;
  fontWeight: 'bold';
};

export function getDocumentStatusLabel(
  rawStatus?: string | null,
  statusProfile?: DocumentStatusProfile
): string {
  const key = resolveDocumentStatusKey(rawStatus, statusProfile);

  switch (key) {
    case 'AWAITING_VALIDATION':
      return 'รอตรวจสอบ';
    case 'PARTIALLY_PAID':
      return 'ชำระบางส่วน';
    case 'PAID':
      return 'ชำระแล้ว';
    case 'DRAFT':
      return 'ฉบับร่าง';
    case 'CREATED':
      return 'สร้างแล้ว';
    case 'ISSUED':
      return 'ออกเอกสารแล้ว';
    case 'SENT':
      return 'ส่งแล้ว';
    case 'ACCEPTED':
      return 'ตอบรับแล้ว';
    case 'REJECTED':
      return 'ปฏิเสธ';
    case 'CANCELLED':
      return 'ยกเลิก';
    case 'VOID':
      return 'Void';
    case 'CLOSED':
      return 'ปิดงาน';
    case 'FINALIZED':
      return 'เสร็จสิ้น';
    case 'OPEN':
      return 'เปิดอยู่';
    default:
      return rawStatus || '-';
  }
}

export function getDocumentStatusChipSx(
  rawStatus?: string | null,
  statusProfile?: DocumentStatusProfile
): StatusColor {
  const key = resolveDocumentStatusKey(rawStatus, statusProfile);

  switch (key) {
    case 'DRAFT':
      return { backgroundColor: '#f3f4f6', color: '#4b5563', fontWeight: 'bold' };
    case 'CREATED':
      return { backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 'bold' };
    case 'ISSUED':
      return { backgroundColor: '#dbeafe', color: '#1d4ed8', fontWeight: 'bold' };
    case 'SENT':
      return { backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 'bold' };
    case 'AWAITING_VALIDATION':
      return { backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 'bold' };
    case 'PARTIALLY_PAID':
      return { backgroundColor: '#fde68a', color: '#92400e', fontWeight: 'bold' };
    case 'PAID':
    case 'ACCEPTED':
    case 'FINALIZED':
      return { backgroundColor: '#dcfce7', color: '#166534', fontWeight: 'bold' };
    case 'REJECTED':
    case 'CANCELLED':
    case 'VOID':
      return { backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: 'bold' };
    case 'CLOSED':
      return { backgroundColor: '#e0e7ff', color: '#4338ca', fontWeight: 'bold' };
    default:
      return { backgroundColor: '#e5e7eb', color: '#374151', fontWeight: 'bold' };
  }
}

function resolveDocumentStatusKey(
  rawStatus?: string | null,
  statusProfile?: DocumentStatusProfile
): string | null {
  if (statusProfile?.approvalLifecycle === 'AWAITING_VALIDATION') {
    return 'AWAITING_VALIDATION';
  }

  if (statusProfile?.paymentLifecycle === 'PARTIALLY_PAID') {
    return 'PARTIALLY_PAID';
  }

  if (statusProfile?.paymentLifecycle === 'PAID') {
    return 'PAID';
  }

  if (rawStatus && ['DRAFT', 'CREATED', 'ISSUED', 'CLOSED', 'VOID', 'CANCELLED'].includes(rawStatus)) {
    return rawStatus;
  }

  if (statusProfile?.commercialOutcome === 'SENT') {
    return 'SENT';
  }

  if (statusProfile?.commercialOutcome === 'ACCEPTED') {
    return 'ACCEPTED';
  }

  if (statusProfile?.commercialOutcome === 'REJECTED') {
    return 'REJECTED';
  }

  if (statusProfile?.documentLifecycle === 'FINALIZED') {
    return 'FINALIZED';
  }

  if (statusProfile?.documentLifecycle === 'OPEN') {
    return 'OPEN';
  }

  return rawStatus || null;
}
