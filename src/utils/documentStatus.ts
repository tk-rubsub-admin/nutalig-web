import { alpha } from '@mui/material/styles';
import { BRAND_COLORS, BRAND_UI, SEMANTIC_COLORS } from 'theme/brandTokens';
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
    case 'PRODUCTION_RUNNING':
      return 'กำลังรันงานผลิต';
    case 'PRODUCTION_PARTIALLY_COMPLETED':
      return 'ผลิตเสร็จบางส่วน';
    case 'PRODUCTION_COMPLETED':
      return 'ผลิตเสร็จ';
    case 'PARTIALLY_IN_TRANSIT':
      return 'อยู่ระหว่างขนส่งบางส่วน';
    case 'IN_TRANSIT':
      return 'อยู่ระหว่างขนส่ง';
    case 'PARTIALLY_RECEIVED':
      return 'รับเข้าคลังบางส่วน';
    case 'RECEIVED':
      return 'รับเข้าคลังแล้ว';
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
    case 'WAITING_PAYMENT':
      return 'รอชำระเงิน';
    case 'AWAITING_PAYMENT':
      return 'รอชำระเงิน';
    case 'AWAITING_START_RUN':
      return 'รอเริ่มรันงาน';
    case 'JOB_STARTED':
      return 'เริ่มรันงานแล้ว';
    case 'READY_FOR_PO':
      return 'พร้อมสร้าง PO';
    case 'IN_PROGRESS':
      return 'กำลังดำเนินการ';
    case 'COMPLETED':
      return 'เสร็จสิ้น';
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
      return rawStatus || '';
  }
}

export function getDocumentStatusChipSx(
  rawStatus?: string | null,
  statusProfile?: DocumentStatusProfile
): StatusColor {
  const key = resolveDocumentStatusKey(rawStatus, statusProfile);

  switch (key) {
    case 'DRAFT':
      return { backgroundColor: BRAND_UI.sandTint, color: BRAND_COLORS.charcoal, fontWeight: 'bold' };
    case 'CREATED':
      return { backgroundColor: BRAND_UI.greenTint, color: BRAND_COLORS.green, fontWeight: 'bold' };
    case 'WAITING_PAYMENT':
    case 'AWAITING_START_RUN':
    case 'READY_FOR_PO':
      return { backgroundColor: alpha(SEMANTIC_COLORS.warning, 0.1), color: SEMANTIC_COLORS.warning, fontWeight: 'bold' };
    case 'IN_PROGRESS':
      return { backgroundColor: BRAND_UI.greenSelected, color: BRAND_COLORS.green, fontWeight: 'bold' };
    case 'JOB_STARTED':
      return { backgroundColor: BRAND_UI.greenSelected, color: BRAND_COLORS.green, fontWeight: 'bold' };
    case 'COMPLETED':
      return { backgroundColor: BRAND_UI.greenTint, color: BRAND_COLORS.green, fontWeight: 'bold' };
    case 'ISSUED':
      return { backgroundColor: BRAND_UI.greenSelected, color: BRAND_COLORS.green, fontWeight: 'bold' };
    case 'SENT':
      return { backgroundColor: alpha(SEMANTIC_COLORS.warning, 0.1), color: SEMANTIC_COLORS.warning, fontWeight: 'bold' };
    case 'AWAITING_VALIDATION':
      return { backgroundColor: alpha(SEMANTIC_COLORS.warning, 0.1), color: SEMANTIC_COLORS.warning, fontWeight: 'bold' };
    case 'PARTIALLY_PAID':
      return { backgroundColor: alpha(SEMANTIC_COLORS.warning, 0.18), color: SEMANTIC_COLORS.warning, fontWeight: 'bold' };
    case 'PAID':
    case 'ACCEPTED':
    case 'FINALIZED':
      return { backgroundColor: BRAND_UI.greenTint, color: BRAND_COLORS.green, fontWeight: 'bold' };
    case 'PRODUCTION_RUNNING':
      return { backgroundColor: BRAND_UI.greenSelected, color: BRAND_COLORS.green, fontWeight: 'bold' };
    case 'PRODUCTION_PARTIALLY_COMPLETED':
    case 'PARTIALLY_IN_TRANSIT':
    case 'PARTIALLY_RECEIVED':
      return { backgroundColor: alpha(SEMANTIC_COLORS.warning, 0.18), color: SEMANTIC_COLORS.warning, fontWeight: 'bold' };
    case 'IN_TRANSIT':
      return { backgroundColor: BRAND_UI.greenSelected, color: BRAND_COLORS.green, fontWeight: 'bold' };
    case 'PRODUCTION_COMPLETED':
    case 'RECEIVED':
      return { backgroundColor: BRAND_UI.greenTint, color: BRAND_COLORS.green, fontWeight: 'bold' };
    case 'REJECTED':
    case 'CANCELLED':
    case 'VOID':
      return { backgroundColor: alpha(SEMANTIC_COLORS.error, 0.1), color: SEMANTIC_COLORS.error, fontWeight: 'bold' };
    case 'CLOSED':
      return { backgroundColor: BRAND_COLORS.sand, color: BRAND_COLORS.charcoal, fontWeight: 'bold' };
    default:
      return { backgroundColor: BRAND_UI.sandTint, color: BRAND_COLORS.charcoal, fontWeight: 'bold' };
  }
}

function resolveDocumentStatusKey(
  rawStatus?: string | null,
  statusProfile?: DocumentStatusProfile
): string | null {
  if (statusProfile?.approvalLifecycle === 'AWAITING_VALIDATION') {
    return 'AWAITING_VALIDATION';
  }

  if (['AWAITING_START_RUN', 'JOB_STARTED', 'PRODUCTION_RUNNING', 'PRODUCTION_PARTIALLY_COMPLETED',
    'PRODUCTION_COMPLETED', 'PARTIALLY_IN_TRANSIT', 'IN_TRANSIT', 'PARTIALLY_RECEIVED', 'RECEIVED'].includes(rawStatus || '')) {
    return rawStatus;
  }

  if (statusProfile?.paymentLifecycle === 'PARTIALLY_PAID') {
    return 'PARTIALLY_PAID';
  }

  if (statusProfile?.paymentLifecycle === 'PAID') {
    return 'PAID';
  }

  if (
    rawStatus &&
    [
      'DRAFT',
      'CREATED',
      'WAITING_PAYMENT',
      'AWAITING_START_RUN',
      'JOB_STARTED',
      'READY_FOR_PO',
      'IN_PROGRESS',
      'COMPLETED',
      'ISSUED',
      'CLOSED',
      'VOID',
      'CANCELLED',
      'PRODUCTION_RUNNING',
      'PRODUCTION_PARTIALLY_COMPLETED',
      'PRODUCTION_COMPLETED',
      'PARTIALLY_IN_TRANSIT',
      'IN_TRANSIT',
      'PARTIALLY_RECEIVED',
      'RECEIVED'
    ].includes(
      rawStatus
    )
  ) {
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
