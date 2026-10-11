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

  if (rawStatus === 'PRODUCTION_RUNNING') {
    return 'PRODUCTION_RUNNING';
  }

  if (statusProfile?.paymentLifecycle === 'PARTIALLY_PAID') {
    return 'PARTIALLY_PAID';
  }

  if (statusProfile?.paymentLifecycle === 'PAID') {
    return 'PAID';
  }

  if (
    rawStatus &&
    ['DRAFT', 'CREATED', 'ISSUED', 'CLOSED', 'VOID', 'CANCELLED', 'PRODUCTION_RUNNING'].includes(
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
