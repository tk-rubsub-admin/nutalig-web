import { describe, expect, it } from 'vitest';
import {
  AUTOMATIC_DELIVERY_ITEM_ID,
  AutomaticDeliveryTierPricing,
  buildAutomaticDeliveryItem
} from './purchaseOrderDelivery';

describe('buildAutomaticDeliveryItem', () => {
  it('combines shipping costs from unique supplier quote tiers into one item', () => {
    const tierPricingById = new Map<string, AutomaticDeliveryTierPricing>([
      ['101', { shippingCost: 125, shippingCurrency: 'THB' }],
      ['102', { shippingCost: 75, shippingCurrency: 'THB' }]
    ]);

    const deliveryItem = buildAutomaticDeliveryItem(
      [
        { supplierQuoteTierId: 101, supplierCurrency: 'THB' },
        { supplierQuoteTierId: 101, supplierCurrency: 'THB' },
        { supplierQuoteTierId: 102, supplierCurrency: 'THB' }
      ],
      tierPricingById
    );

    expect(deliveryItem).toEqual({
      id: AUTOMATIC_DELIVERY_ITEM_ID,
      imageUrl: null,
      name: 'Delivery',
      spec: '',
      quantity: 1,
      supplierCurrency: 'THB',
      supplierUnitPrice: 200,
      supplierShippingCost: 0,
      isAutomaticShipping: true
    });
  });

  it('ignores missing, zero, negative, and invalid shipping costs', () => {
    const tierPricingById = new Map<string, AutomaticDeliveryTierPricing>([
      ['201', { shippingCost: 0, shippingCurrency: 'THB' }],
      ['202', { shippingCost: -10, shippingCurrency: 'THB' }],
      ['203', { shippingCost: Number.NaN, shippingCurrency: 'THB' }],
      ['204', { shippingCost: 50, shippingCurrency: null }]
    ]);

    const deliveryItem = buildAutomaticDeliveryItem(
      [
        { supplierQuoteTierId: null, supplierCurrency: 'THB' },
        { supplierQuoteTierId: 201, supplierCurrency: 'THB' },
        { supplierQuoteTierId: 202, supplierCurrency: 'THB' },
        { supplierQuoteTierId: 203, supplierCurrency: 'THB' },
        { supplierQuoteTierId: 204, supplierCurrency: 'THB' },
        { supplierQuoteTierId: 999, supplierCurrency: 'THB' }
      ],
      tierPricingById
    );

    expect(deliveryItem?.supplierUnitPrice).toBe(50);
    expect(deliveryItem?.supplierCurrency).toBe('THB');
  });

  it('returns null when no tier has a positive shipping cost', () => {
    const deliveryItem = buildAutomaticDeliveryItem(
      [{ supplierQuoteTierId: 301, supplierCurrency: 'THB' }],
      new Map([['301', { shippingCost: 0, shippingCurrency: 'THB' }]])
    );

    expect(deliveryItem).toBeNull();
  });
});
