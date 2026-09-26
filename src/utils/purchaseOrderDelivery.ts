export const AUTOMATIC_DELIVERY_ITEM_ID = -9007199254740991;

export interface AutomaticDeliverySourceItem {
  supplierQuoteTierId?: number | null;
  supplierCurrency?: string | null;
}

export interface AutomaticDeliveryTierPricing {
  shippingCost: number;
  shippingCurrency: string | null;
}

export interface AutomaticDeliveryItem {
  id: number;
  imageUrl: null;
  name: 'Delivery';
  spec: string;
  quantity: number;
  supplierCurrency: string | null;
  supplierUnitPrice: number;
  supplierShippingCost: number;
  isAutomaticShipping: true;
}

export function buildAutomaticDeliveryItem(
  items: AutomaticDeliverySourceItem[],
  tierPricingById: ReadonlyMap<string, AutomaticDeliveryTierPricing>
): AutomaticDeliveryItem | null {
  const addedTierIds = new Set<string>();
  let totalShippingCost = 0;
  let deliveryCurrency: string | null = null;

  items.forEach((item) => {
    if (item.supplierQuoteTierId === null || item.supplierQuoteTierId === undefined) {
      return;
    }

    const tierId = String(item.supplierQuoteTierId);
    if (addedTierIds.has(tierId)) {
      return;
    }

    const tierPricing = tierPricingById.get(tierId);
    const shippingCost = Number(tierPricing?.shippingCost);
    if (!tierPricing || !Number.isFinite(shippingCost) || shippingCost <= 0) {
      return;
    }

    addedTierIds.add(tierId);
    totalShippingCost += shippingCost;
    deliveryCurrency ||= tierPricing.shippingCurrency || item.supplierCurrency || null;
  });

  if (!addedTierIds.size) {
    return null;
  }

  return {
    id: AUTOMATIC_DELIVERY_ITEM_ID,
    imageUrl: null,
    name: 'Delivery',
    spec: '',
    quantity: 1,
    supplierCurrency: deliveryCurrency,
    supplierUnitPrice: totalShippingCost,
    supplierShippingCost: 0,
    isAutomaticShipping: true
  };
}
