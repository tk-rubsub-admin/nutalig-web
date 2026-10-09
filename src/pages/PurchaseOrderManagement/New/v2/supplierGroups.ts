import { SalesOrderDetailV1, SalesOrderV1 } from 'services/SaleOrder/sale-order-type';

export interface SupplierPurchaseOrderGroup {
  supplierId: string;
  supplierName: string;
  shippingGroups: SupplierShippingPurchaseOrderGroup[];
}

export interface SupplierShippingPurchaseOrderGroup {
  shippingMethod: string | null;
  shippingLocked: boolean;
  salesOrder: SalesOrderV1;
}

export function groupSalesOrderBySupplier(salesOrder: SalesOrderV1): SupplierPurchaseOrderGroup[] {
  const groups = new Map<string, { supplierName: string; items: SalesOrderDetailV1[] }>();
  salesOrder.items.forEach((item) => {
    const supplierId = item.supplier?.id;
    if (!supplierId) return;

    const group = groups.get(supplierId) || {
      supplierName: item.supplier?.supplierName || supplierId,
      items: []
    };
    group.items.push(item);
    groups.set(supplierId, group);
  });

  return Array.from(groups.entries()).map(([supplierId, group]) => {
    const shippingLocked = group.items.some((item) => item.rfqTierSplitId != null);
    const shippingGroups = new Map<string | null, SalesOrderDetailV1[]>();
    if (!shippingLocked) {
      const firstItem = group.items[0];
      const method =
        firstItem?.resolvedShippingMethod || firstItem?.shippingMethod || salesOrder.shippingType;
      shippingGroups.set(method?.trim().toUpperCase() || null, group.items);
    } else {
      group.items.forEach((item) => {
        // Split items require the full method resolved by the API; generic SEA loses FCL mode.
        const method =
          item.rfqTierSplitId != null
            ? item.resolvedShippingMethod
            : item.resolvedShippingMethod || item.shippingMethod || salesOrder.shippingType;
        const shippingMethod = method?.trim().toUpperCase() || null;
        shippingGroups.set(shippingMethod, [...(shippingGroups.get(shippingMethod) || []), item]);
      });
    }
    return {
      supplierId,
      supplierName: group.supplierName,
      shippingGroups: Array.from(shippingGroups.entries()).map(([shippingMethod, items]) => ({
        shippingMethod,
        shippingLocked,
        salesOrder: {
          ...salesOrder,
          items,
          rfqId: items.find((item) => item.rfqId)?.rfqId || salesOrder.rfqId,
          shippingType: shippingMethod
        }
      }))
    };
  });
}
