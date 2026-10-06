import { viewQuotation } from './document-api';
import { TemplateLanguage } from './document-type';
import { downloadSaleOrder } from 'services/SaleOrder/sale-order-api';
import { viewInvoice } from 'services/Invoice/invoice-api';
import { viewReceipt } from 'services/Receipt/receipt-api';
import { viewPurchaseOrder } from 'services/PurchaseOrder/purchase-order-api';
import { DocumentPreviewType } from 'utils/documentPreview';

export function loadDocumentPreview(
  type: DocumentPreviewType,
  id: string,
  language: TemplateLanguage
) {
  switch (type) {
    case 'quotation':
      return viewQuotation(id, true, false, language);
    case 'sales-order':
      return downloadSaleOrder(id, 'PDF', true, false, language);
    case 'invoice':
      return viewInvoice(id, true, false, language);
    case 'receipt':
      return viewReceipt(id, true, false);
    case 'purchase-order':
      return viewPurchaseOrder(id, true, false);
  }
}
