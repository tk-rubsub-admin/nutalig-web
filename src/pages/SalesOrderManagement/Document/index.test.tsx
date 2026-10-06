// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Switch } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from 'auth/AuthContext';
import { downloadSaleOrder } from 'services/SaleOrder/sale-order-api';
import { viewQuotation } from 'services/Document/document-api';
import { viewInvoice } from 'services/Invoice/invoice-api';
import { viewReceipt } from 'services/Receipt/receipt-api';
import { viewPurchaseOrder } from 'services/PurchaseOrder/purchase-order-api';
import DocumentPreview from 'components/DocumentPreview';
import {
  DOCUMENT_PREVIEW_CONFIG,
  DocumentPreviewType,
  getDocumentPreviewUrl
} from 'utils/documentPreview';
import SalesOrderDocument from './index';

vi.mock('auth/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('services/SaleOrder/sale-order-api', () => ({ downloadSaleOrder: vi.fn() }));
vi.mock('services/Document/document-api', () => ({ viewQuotation: vi.fn() }));
vi.mock('services/Invoice/invoice-api', () => ({ viewInvoice: vi.fn() }));
vi.mock('services/Receipt/receipt-api', () => ({ viewReceipt: vi.fn() }));
vi.mock('services/PurchaseOrder/purchase-order-api', () => ({ viewPurchaseOrder: vi.fn() }));
vi.mock('utils', () => ({ base64ToBlob: () => new Blob(['%PDF'], { type: 'application/pdf' }) }));

const createObjectURL = vi.fn(() => 'blob:http://localhost/pdf-test');
const revokeObjectURL = vi.fn();
const response = { data: { files: [{ fileName: 'unrelated.PDF', base64: 'JVBERg==' }] } };

const setAuth = (ready = true, token = 'token', permissions = ['PERM_SALES_ORDER_VIEW']) => {
  vi.mocked(useAuth).mockReturnValue({
    authReady: ready,
    getToken: () => token,
    getPermission: () => permissions
  } as ReturnType<typeof useAuth>);
};

const openDocument = (query = 'EN') =>
  render(
    <MemoryRouter initialEntries={[`/sales-order/SO20260001/document?lang=${query}`]}>
      <Switch>
        <Route exact path="/sales-order/:id/document" component={SalesOrderDocument} />
        <Route path="/login">Login required</Route>
        <Route path="/403">Permission required</Route>
      </Switch>
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  document.title = 'Nutalig';
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
  setAuth();
  vi.mocked(downloadSaleOrder).mockResolvedValue(response as any);
  for (const loader of [viewQuotation, viewInvoice, viewReceipt, viewPurchaseOrder]) {
    vi.mocked(loader).mockResolvedValue(response as any);
  }
});

const documentCases: Array<{
  type: DocumentPreviewType;
  number: string;
  loader: typeof viewReceipt;
}> = [
  { type: 'quotation', number: 'NTL-QT2026090048', loader: viewQuotation },
  { type: 'invoice', number: 'NTL-INV2026090048', loader: viewInvoice },
  { type: 'receipt', number: 'NTL-RC2026090048', loader: viewReceipt },
  { type: 'purchase-order', number: 'NTL-PO2026090048', loader: viewPurchaseOrder }
];

function openPreview(type: DocumentPreviewType, number: string) {
  return render(
    <MemoryRouter initialEntries={[getDocumentPreviewUrl(type, number, 'EN')]}>
      <Switch>
        <Route exact path={DOCUMENT_PREVIEW_CONFIG[type].path}>
          <DocumentPreview documentType={type} />
        </Route>
        <Route path="/403">Permission required</Route>
      </Switch>
    </MemoryRouter>
  );
}

describe('Other document previews', () => {
  it.each(documentCases)(
    '$type uses its own API and document number',
    async ({ type, number, loader }) => {
      setAuth(true, 'token', [DOCUMENT_PREVIEW_CONFIG[type].permission]);
      openPreview(type, number);
      const download = await screen.findByRole('link', { name: 'ดาวน์โหลด PDF' });
      expect(document.title).toBe(`${number}.pdf`);
      expect(download.getAttribute('download')).toBe(`${number}.pdf`);
      expect(screen.getByTitle(`${number}.pdf`).getAttribute('src')).toContain('blob:');
      if (DOCUMENT_PREVIEW_CONFIG[type].supportsLanguage) {
        expect(loader).toHaveBeenCalledWith(number, true, false, 'EN');
      } else {
        expect(loader).toHaveBeenCalledWith(number, true, false);
      }
      expect(downloadSaleOrder).not.toHaveBeenCalled();
    }
  );

  it.each(documentCases)(
    '$type requires its own view permission',
    async ({ type, number, loader }) => {
      // The default setup has only the SO view permission.
      openPreview(type, number);
      expect(await screen.findByText('Permission required')).toBeTruthy();
      expect(loader).not.toHaveBeenCalled();
    }
  );
});

afterEach(cleanup);

describe('Sales order document preview', () => {
  it('uses the SO number for the tab and download filename and retains the PDF until unmount', async () => {
    const view = openDocument();
    const download = await screen.findByRole('link', { name: 'ดาวน์โหลด PDF' });
    expect(document.title).toBe('SO20260001.pdf');
    expect(download.getAttribute('download')).toBe('SO20260001.pdf');
    expect(download.getAttribute('href')).toBe('blob:http://localhost/pdf-test');
    expect(screen.getByTitle('SO20260001.pdf').getAttribute('src')).toBe(
      'blob:http://localhost/pdf-test#toolbar=0'
    );
    expect(downloadSaleOrder).toHaveBeenCalledWith('SO20260001', 'PDF', true, false, 'EN');
    expect(revokeObjectURL).not.toHaveBeenCalled();
    view.unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/pdf-test');
    expect(document.title).toBe('Nutalig');
  });

  it('requests Thai when Thai is selected', async () => {
    openDocument('TH');
    await screen.findByRole('link', { name: 'ดาวน์โหลด PDF' });
    expect(downloadSaleOrder).toHaveBeenCalledWith('SO20260001', 'PDF', true, false, 'TH');
  });

  it('waits for authentication before requesting a document', () => {
    setAuth(false);
    openDocument();
    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect(downloadSaleOrder).not.toHaveBeenCalled();
  });

  it('redirects a signed out user without requesting a document', async () => {
    setAuth(true, '');
    openDocument();
    expect(await screen.findByText('Login required')).toBeTruthy();
    expect(downloadSaleOrder).not.toHaveBeenCalled();
  });

  it('rejects users without permission to view sales orders', async () => {
    setAuth(true, 'token', []);
    openDocument();
    expect(await screen.findByText('Permission required')).toBeTruthy();
    expect(downloadSaleOrder).not.toHaveBeenCalled();
  });

  it('shows a readable error when no PDF is returned', async () => {
    vi.mocked(downloadSaleOrder).mockResolvedValue({ data: { files: [] } } as any);
    openDocument();
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('does not create a PDF URL if the page closes before the response arrives', async () => {
    let resolve!: (value: any) => void;
    vi.mocked(downloadSaleOrder).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      })
    );
    const view = openDocument();
    view.unmount();
    await act(async () => {
      resolve(response);
    });
    expect(createObjectURL).not.toHaveBeenCalled();
  });
});
