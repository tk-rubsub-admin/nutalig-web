import { PERMISSIONS } from 'auth/permissions';
import { ROUTE_PATHS } from 'routes';
import { TemplateLanguage } from 'services/Document/document-type';

export const DOCUMENT_PREVIEW_CONFIG = {
  'sales-order': {
    path: ROUTE_PATHS.SALE_ORDER_DOCUMENT,
    permission: PERMISSIONS.SALES_ORDER_VIEW,
    title: 'ใบยืนยันสั่งซื้อ',
    supportsLanguage: true
  },
  quotation: {
    path: ROUTE_PATHS.QUOTATION_DOCUMENT,
    permission: PERMISSIONS.QUOTATION_VIEW,
    title: 'ใบเสนอราคา',
    supportsLanguage: true
  },
  invoice: {
    path: ROUTE_PATHS.INVOICE_DOCUMENT,
    permission: PERMISSIONS.INVOICE_VIEW,
    title: 'ใบแจ้งหนี้',
    supportsLanguage: true
  },
  receipt: {
    path: ROUTE_PATHS.RECEIPT_DOCUMENT,
    permission: PERMISSIONS.INVOICE_VIEW,
    title: 'ใบเสร็จรับเงิน',
    supportsLanguage: false
  },
  'purchase-order': {
    path: ROUTE_PATHS.PURCHASE_ORDER_DOCUMENT,
    permission: PERMISSIONS.PURCHASE_ORDER_VIEW,
    title: 'ใบสั่งซื้อ',
    supportsLanguage: false
  }
} as const;

export type DocumentPreviewType = keyof typeof DOCUMENT_PREVIEW_CONFIG;

export function getDocumentPreviewUrl(
  type: DocumentPreviewType,
  documentNo: string,
  language: TemplateLanguage = 'TH'
): string {
  const config = DOCUMENT_PREVIEW_CONFIG[type];
  const path = config.path.replace(':id', encodeURIComponent(documentNo));
  return config.supportsLanguage ? `${path}?lang=${language}` : path;
}

export function openDocumentPreview(
  type: DocumentPreviewType,
  documentNo: string,
  language: TemplateLanguage = 'TH'
): void {
  window.open(getDocumentPreviewUrl(type, documentNo, language), '_blank', 'noopener,noreferrer');
}
