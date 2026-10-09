// @vitest-environment jsdom
import { ComponentProps } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getRFQ } from 'services/RFQ/rfq-api';
import { RFQDetailOption, RFQRecord } from 'services/RFQ/rfq-type';
import { FinalPriceQuoteDialog } from './FinalPriceQuoteDialog';

vi.mock('services/RFQ/rfq-api', () => ({ getRFQ: vi.fn() }));

const clients: QueryClient[] = [];
type DialogProps = ComponentProps<typeof FinalPriceQuoteDialog>;
const detail = (optionName: string, price: number): RFQDetailOption => ({
  id: 1,
  optionName,
  spec: 'Spec',
  sortOrder: 1,
  remark: null,
  createdDate: '',
  updatedDate: '',
  createdBy: '',
  updatedBy: '',
  tiers: [
    {
      id: 2,
      quantity: 100,
      productPrice: price,
      currency: 'THB',
      shippingMethod: 'LAND',
      shippingCost: 2,
      totalPrice: price + 2,
      landFreightCost: 2,
      seaFreightCost: 0,
      landTotalPrice: price + 2,
      seaTotalPrice: 0,
      sortOrder: 1,
      createdDate: '',
      updatedDate: ''
    }
  ]
});

const defaultProps: DialogProps = {
  open: true,
  finalPriceQuote: null,
  rfqDetails: [detail('Current RFQ option', 999)],
  rfqTypeCode: 'REPEAT_PRICE',
  referenceRfqId: 'RFQ-REFERENCE',
  procurementRemarks: [],
  procurementRemark: '',
  finalPriceDraft: {
    details: [],
    packages: [],
    additionalCosts: [],
    internalRemark: '',
    recommend: ''
  },
  finalPriceErrors: {},
  isSubmitting: false,
  onClose: vi.fn(),
  onProcurementRemarkChange: vi.fn(),
  onRemarkChange: vi.fn(),
  onRecommendChange: vi.fn(),
  onCommissionChange: vi.fn(),
  onDuplicateSpecialDetail: vi.fn(),
  onAddSpecialTier: vi.fn(),
  onTierChange: vi.fn(),
  onTierCurrencyChange: vi.fn(),
  onTierFclChange: vi.fn(),
  onTierShareFclChange: vi.fn(),
  onDetailChange: vi.fn(),
  onDuplicateDetail: vi.fn(),
  onDeleteDetail: vi.fn(),
  onDeleteTier: vi.fn(),
  onAddAdditionalCost: vi.fn(),
  onAdditionalCostChange: vi.fn(),
  onDeleteAdditionalCost: vi.fn(),
  onRequestSave: vi.fn(),
  onGenerateMessage: vi.fn(),
  onTranslateMessage: vi.fn(),
  formatPrice: (value, currency) => (value == null ? '-' : `${value} ${currency}`),
  currencyOptions: [],
  formatSupplierQuoteAdditionalCost: () => '',
  getSupplierDisplayName: () => 'Supplier',
  t: (key) => key
};

function renderDialog(props: Partial<DialogProps> = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, cacheTime: 0 } },
    logger: { log: () => {}, warn: () => {}, error: () => {} }
  });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <FinalPriceQuoteDialog {...defaultProps} {...props} />
    </QueryClientProvider>
  );
}

afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
  vi.clearAllMocks();
});

describe('Final price previous prices', () => {
  it('loads tiers from the reference RFQ for REPEAT_PRICE instead of the current RFQ', async () => {
    let resolveReference!: (value: RFQRecord) => void;
    vi.mocked(getRFQ).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveReference = resolve;
        })
    );
    renderDialog();
    expect(screen.getByRole('status').textContent).toContain('กำลังโหลดราคา');
    expect(screen.queryByText('Current RFQ option')).toBeNull();
    resolveReference({
      id: 'RFQ-REFERENCE',
      details: [detail('Reference option', 25)]
    } as RFQRecord);
    expect(await screen.findByText('Reference option')).toBeTruthy();
    expect(getRFQ).toHaveBeenCalledTimes(1);
    expect(getRFQ).toHaveBeenCalledWith('RFQ-REFERENCE');
    expect(screen.getByText('25 THB')).toBeTruthy();
    expect(screen.getByText('27 THB')).toBeTruthy();
    expect(screen.getByText('อ้างอิง RFQ RFQ-REFERENCE')).toBeTruthy();
    expect(screen.queryByText('999 THB')).toBeNull();
  });

  it('keeps current RFQ tiers for other types without requesting the reference RFQ', () => {
    renderDialog({ rfqTypeCode: 'NEW_PRICE' });
    expect(screen.getByText('Current RFQ option')).toBeTruthy();
    expect(screen.getByText('999 THB')).toBeTruthy();
    expect(getRFQ).not.toHaveBeenCalled();
  });

  it('does not load a reference RFQ while the dialog is closed', () => {
    renderDialog({ open: false });
    expect(getRFQ).not.toHaveBeenCalled();
  });

  it('reports a missing reference ID without displaying current RFQ tiers', () => {
    renderDialog({ referenceRfqId: null });
    expect(screen.getByRole('alert').textContent).toContain('ไม่พบเลขที่ RFQ อ้างอิง');
    expect(screen.queryByText('Current RFQ option')).toBeNull();
    expect(getRFQ).not.toHaveBeenCalled();
  });

  it('reports a failed reference request without substituting current RFQ prices', async () => {
    vi.mocked(getRFQ).mockRejectedValue(new Error('Reference unavailable'));
    renderDialog();
    expect((await screen.findByRole('alert')).textContent).toContain(
      'ไม่สามารถโหลดราคาจาก RFQ อ้างอิงได้'
    );
    expect(screen.queryByText('Current RFQ option')).toBeNull();
    expect(screen.queryByText('999 THB')).toBeNull();
  });
});
