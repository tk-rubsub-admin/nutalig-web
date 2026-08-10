import { DocumentStatusProfile } from 'services/document-status-type';
import { InvoiceRecord } from 'services/Invoice/invoice-type';
import { ReceiptRecord } from 'services/Receipt/receipt-type';
import { RFQQuotationSummary } from 'services/RFQ/rfq-type';
import { SalesOrderV1 } from 'services/SaleOrder/sale-order-type';
import { ROUTE_PATHS } from 'routes';

export type DocumentFlowRelatedItem = {
  title: string;
  docNo?: string | null;
  status?: string | null;
  statusProfile?: DocumentStatusProfile;
  isCurrent?: boolean;
  isLoading?: boolean;
  onOpen?: () => void;
};

export type DocumentFlowItem = {
  title: string;
  docNo?: string | null;
  status?: string | null;
  statusProfile?: DocumentStatusProfile;
  count?: number;
  isCurrent?: boolean;
  isLoading?: boolean;
  onOpen?: () => void;
  relatedItems?: DocumentFlowRelatedItem[];
  relatedItemsLabel?: string;
};

type DocumentFlowItemInput = Omit<DocumentFlowItem, 'title'> | undefined | null;

export interface BuildDocumentFlowItemsOptions {
  rfq?: DocumentFlowItemInput;
  quotation?: DocumentFlowItemInput;
  salesOrder?: DocumentFlowItemInput;
  invoice?: DocumentFlowItemInput;
  receipt?: DocumentFlowItemInput;
}

export interface BuildQuotationDocumentFlowItemsOptions {
  quotation?: {
    rfqId?: string | null;
    referenceRfqId?: string | null;
    quotationNo?: string | null;
    status?: string | null;
    statusProfile?: DocumentStatusProfile | null;
  } | null;
  rfqQuotations?: RFQQuotationSummary[];
  salesOrder?: SalesOrderV1 | null;
  salesOrderNo?: string | null;
  latestInvoice?: InvoiceRecord | null;
  latestReceipt?: ReceiptRecord | null;
  isSalesOrderLoading?: boolean;
  isInvoiceLoading?: boolean;
  isReceiptLoading?: boolean;
  invoiceCount?: number;
  receiptCount?: number;
}

export interface BuildSalesOrderDocumentFlowItemsOptions {
  rfqId?: string | null;
  quotationNo?: string | null;
  salesOrder?: SalesOrderV1 | null;
  latestInvoice?: InvoiceRecord | null;
  latestReceipt?: ReceiptRecord | null;
  isRfqLoading?: boolean;
  isInvoiceLoading?: boolean;
  isReceiptLoading?: boolean;
  invoiceCount?: number;
  receiptCount?: number;
}

export interface BuildInvoiceDocumentFlowItemsOptions {
  rfqId?: string | null;
  quotationNo?: string | null;
  salesOrderNo?: string | null;
  salesOrderStatus?: string | null;
  salesOrderStatusProfile?: DocumentStatusProfile | null;
  invoice?: InvoiceRecord | null;
  latestReceipt?: ReceiptRecord | null;
  isSalesOrderLoading?: boolean;
  isReceiptLoading?: boolean;
  receiptCount?: number;
}

export interface BuildReceiptDocumentFlowItemsOptions {
  rfqId?: string | null;
  quotationNo?: string | null;
  salesOrderNo?: string | null;
  salesOrderStatus?: string | null;
  salesOrderStatusProfile?: DocumentStatusProfile | null;
  invoice?: InvoiceRecord | null;
  receipt?: ReceiptRecord | null;
  isSalesOrderLoading?: boolean;
  isInvoiceLoading?: boolean;
}

const hasMeaningfulFlowItem = (item?: DocumentFlowItemInput): boolean => {
  if (!item) {
    return false;
  }

  return Boolean(
    item.docNo ||
      item.status ||
      item.statusProfile ||
      item.count ||
      item.isCurrent ||
      item.isLoading ||
      item.onOpen ||
      item.relatedItems?.length
  );
};

export function buildDocumentFlowItems(options: BuildDocumentFlowItemsOptions): DocumentFlowItem[] {
  const inputs = [
    options.rfq,
    options.quotation,
    options.salesOrder,
    options.invoice,
    options.receipt
  ];
  const items: DocumentFlowItem[] = [
    { title: 'คำขอราคา', ...(options.rfq || {}) },
    { title: 'ใบเสนอราคา', ...(options.quotation || {}) },
    { title: 'ใบยืนยันสั่งซื้อ', ...(options.salesOrder || {}) },
    { title: 'ใบแจ้งหนี้', ...(options.invoice || {}) },
    { title: 'ใบเสร็จรับเงิน', ...(options.receipt || {}) }
  ];

  return items.filter((_, index) => hasMeaningfulFlowItem(inputs[index]));
}

export function buildQuotationDocumentFlowItems(
  options: BuildQuotationDocumentFlowItemsOptions
): DocumentFlowItem[] {
  const rfqId = options.quotation?.rfqId || options.quotation?.referenceRfqId || null;
  const quotationNo = options.quotation?.quotationNo || null;
  const latestInvoice = options.latestInvoice || null;
  const latestReceipt = options.latestReceipt || null;

  return buildDocumentFlowItems({
    rfq: rfqId
      ? {
          docNo: rfqId,
          status: 'ได้ราคาแล้ว',
          onOpen: () => window.open(ROUTE_PATHS.RFQ_DETAIL.replace(':id', rfqId), '_blank', 'noopener,noreferrer')
        }
      : undefined,
    quotation: quotationNo
      ? {
          docNo: quotationNo,
          status: options.quotation?.status || null,
          statusProfile: options.quotation?.statusProfile || undefined,
          isCurrent: true,
          count: (options.rfqQuotations || []).length > 1 ? (options.rfqQuotations || []).length : undefined,
          relatedItems: (options.rfqQuotations || [])
            .filter((quotationItem) => quotationItem.quotationNo !== quotationNo)
            .map((quotationItem) => ({
              title: 'ใบเสนอราคา',
              docNo: quotationItem.quotationNo,
              status: quotationItem.status,
              statusProfile: quotationItem.statusProfile,
              onOpen: () =>
                window.open(
                  ROUTE_PATHS.QUOTATION_DETAIL.replace(':id', quotationItem.quotationNo),
                  '_blank',
                  'noopener,noreferrer'
                )
            })),
          onOpen: () =>
            window.open(ROUTE_PATHS.QUOTATION_DETAIL.replace(':id', quotationNo), '_blank', 'noopener,noreferrer')
        }
      : undefined,
    salesOrder: options.salesOrder?.salesOrderNo || options.salesOrderNo
      ? {
          docNo: options.salesOrder?.salesOrderNo || options.salesOrderNo || null,
          status: options.salesOrder?.status || null,
          statusProfile: options.salesOrder?.statusProfile,
          isLoading: options.isSalesOrderLoading,
          onOpen: () =>
            window.open(
              ROUTE_PATHS.SALE_ORDER_DETAIL.replace(
                ':id',
                String(options.salesOrder?.salesOrderNo || options.salesOrderNo)
              ),
              '_blank',
              'noopener,noreferrer'
            )
        }
      : undefined,
    invoice: latestInvoice?.invoiceNo
      ? {
          docNo: latestInvoice.invoiceNo,
          status: latestInvoice.status || null,
          statusProfile: latestInvoice.statusProfile,
          count: options.invoiceCount && options.invoiceCount > 1 ? options.invoiceCount : undefined,
          isLoading: options.isInvoiceLoading,
          onOpen: () =>
            window.open(
              ROUTE_PATHS.INVOICE_DETAIL.replace(':id', latestInvoice.invoiceNo),
              '_blank',
              'noopener,noreferrer'
            )
        }
      : undefined,
    receipt: latestReceipt?.receiptNo
      ? {
          docNo: latestReceipt.receiptNo,
          status: latestReceipt.status || null,
          statusProfile: latestReceipt.statusProfile,
          count: options.receiptCount && options.receiptCount > 1 ? options.receiptCount : undefined,
          isLoading: options.isReceiptLoading,
          onOpen: () =>
            window.open(
              ROUTE_PATHS.RECEIPT_DETAIL.replace(':id', latestReceipt.receiptNo),
              '_blank',
              'noopener,noreferrer'
            )
        }
      : undefined
  });
}

export function buildSalesOrderDocumentFlowItems(
  options: BuildSalesOrderDocumentFlowItemsOptions
): DocumentFlowItem[] {
  const quotationNo = options.quotationNo || null;
  const latestInvoice = options.latestInvoice || null;
  const latestReceipt = options.latestReceipt || null;

  return buildDocumentFlowItems({
    rfq: options.rfqId
      ? {
          docNo: options.rfqId,
          onOpen: () => window.open(ROUTE_PATHS.RFQ_DETAIL.replace(':id', options.rfqId as string), '_blank', 'noopener,noreferrer')
        }
      : undefined,
    quotation: quotationNo
      ? {
          docNo: quotationNo,
          status: latestInvoice?.status || latestReceipt?.status || null,
          statusProfile: latestInvoice?.statusProfile || latestReceipt?.statusProfile,
          isLoading: options.isRfqLoading,
          onOpen: () =>
            window.open(ROUTE_PATHS.QUOTATION_DETAIL.replace(':id', quotationNo), '_blank', 'noopener,noreferrer')
        }
      : undefined,
    salesOrder: options.salesOrder?.salesOrderNo
      ? {
          docNo: options.salesOrder.salesOrderNo,
          status: options.salesOrder.status || null,
          statusProfile: options.salesOrder.statusProfile,
          isCurrent: true,
          onOpen: () =>
            window.open(
              ROUTE_PATHS.SALE_ORDER_DETAIL.replace(':id', options.salesOrder!.salesOrderNo),
              '_blank',
              'noopener,noreferrer'
            )
        }
      : undefined,
    invoice: latestInvoice?.invoiceNo
      ? {
          docNo: latestInvoice.invoiceNo,
          status: latestInvoice.status || null,
          statusProfile: latestInvoice.statusProfile,
          count: options.invoiceCount && options.invoiceCount > 1 ? options.invoiceCount : undefined,
          isLoading: options.isInvoiceLoading,
          onOpen: () =>
            window.open(ROUTE_PATHS.INVOICE_DETAIL.replace(':id', latestInvoice.invoiceNo), '_blank', 'noopener,noreferrer')
        }
      : undefined,
    receipt: latestReceipt?.receiptNo
      ? {
          docNo: latestReceipt.receiptNo,
          status: latestReceipt.status || null,
          statusProfile: latestReceipt.statusProfile,
          count: options.receiptCount && options.receiptCount > 1 ? options.receiptCount : undefined,
          isLoading: options.isReceiptLoading,
          onOpen: () =>
            window.open(ROUTE_PATHS.RECEIPT_DETAIL.replace(':id', latestReceipt.receiptNo), '_blank', 'noopener,noreferrer')
        }
      : undefined
  });
}

export function buildInvoiceDocumentFlowItems(
  options: BuildInvoiceDocumentFlowItemsOptions
): DocumentFlowItem[] {
  const latestReceipt = options.latestReceipt || null;

  return buildDocumentFlowItems({
    rfq: options.rfqId
      ? {
          docNo: options.rfqId,
          onOpen: () => window.open(ROUTE_PATHS.RFQ_DETAIL.replace(':id', options.rfqId as string), '_blank', 'noopener,noreferrer')
        }
      : undefined,
    quotation: options.quotationNo
      ? {
          docNo: options.quotationNo,
          onOpen: () =>
            window.open(ROUTE_PATHS.QUOTATION_DETAIL.replace(':id', options.quotationNo as string), '_blank', 'noopener,noreferrer')
        }
      : undefined,
    salesOrder: options.salesOrderNo
      ? {
          docNo: options.salesOrderNo,
          status: options.salesOrderStatus || null,
          statusProfile: options.salesOrderStatusProfile || undefined,
          isLoading: options.isSalesOrderLoading,
          onOpen: () =>
            window.open(
              ROUTE_PATHS.SALE_ORDER_DETAIL.replace(':id', options.salesOrderNo as string),
              '_blank',
              'noopener,noreferrer'
            )
        }
      : undefined,
    invoice: options.invoice?.invoiceNo
      ? {
          docNo: options.invoice.invoiceNo,
          status: options.invoice.status || null,
          statusProfile: options.invoice.statusProfile,
          isCurrent: true,
          onOpen: () =>
            window.open(ROUTE_PATHS.INVOICE_DETAIL.replace(':id', options.invoice!.invoiceNo), '_blank', 'noopener,noreferrer')
        }
      : undefined,
    receipt: latestReceipt?.receiptNo
      ? {
          docNo: latestReceipt.receiptNo,
          status: latestReceipt.status || null,
          statusProfile: latestReceipt.statusProfile,
          count: options.receiptCount && options.receiptCount > 1 ? options.receiptCount : undefined,
          isLoading: options.isReceiptLoading,
          onOpen: () =>
            window.open(ROUTE_PATHS.RECEIPT_DETAIL.replace(':id', latestReceipt.receiptNo), '_blank', 'noopener,noreferrer')
        }
      : undefined
  });
}

export function buildReceiptDocumentFlowItems(
  options: BuildReceiptDocumentFlowItemsOptions
): DocumentFlowItem[] {
  return buildDocumentFlowItems({
    rfq: options.rfqId
      ? {
          docNo: options.rfqId,
          onOpen: () => window.open(ROUTE_PATHS.RFQ_DETAIL.replace(':id', options.rfqId as string), '_blank', 'noopener,noreferrer')
        }
      : undefined,
    quotation: options.quotationNo
      ? {
          docNo: options.quotationNo,
          onOpen: () =>
            window.open(ROUTE_PATHS.QUOTATION_DETAIL.replace(':id', options.quotationNo as string), '_blank', 'noopener,noreferrer')
        }
      : undefined,
    salesOrder: options.salesOrderNo
      ? {
          docNo: options.salesOrderNo || null,
          status: options.salesOrderStatus || null,
          statusProfile: options.salesOrderStatusProfile || undefined,
          isLoading: options.isSalesOrderLoading,
          onOpen: () =>
            window.open(
              ROUTE_PATHS.SALE_ORDER_DETAIL.replace(
                ':id',
                String(options.salesOrderNo || '')
              ),
              '_blank',
              'noopener,noreferrer'
            )
        }
      : undefined,
    invoice: options.invoice?.invoiceNo
      ? {
          docNo: options.invoice.invoiceNo,
          status: options.invoice.status || null,
          statusProfile: options.invoice.statusProfile,
          isLoading: options.isInvoiceLoading,
          onOpen: () =>
            window.open(ROUTE_PATHS.INVOICE_DETAIL.replace(':id', options.invoice!.invoiceNo), '_blank', 'noopener,noreferrer')
        }
      : undefined,
    receipt: options.receipt?.receiptNo
      ? {
          docNo: options.receipt.receiptNo,
          status: options.receipt.status || null,
          statusProfile: options.receipt.statusProfile,
          isCurrent: true,
          onOpen: () =>
            window.open(ROUTE_PATHS.RECEIPT_DETAIL.replace(':id', options.receipt!.receiptNo), '_blank', 'noopener,noreferrer')
        }
      : undefined
  });
}
