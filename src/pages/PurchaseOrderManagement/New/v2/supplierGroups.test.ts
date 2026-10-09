import { describe, expect, it } from 'vitest';
import { SalesOrderV1 } from 'services/SaleOrder/sale-order-type';
import { groupSalesOrderBySupplier } from './supplierGroups';

const so = (items: any[]) =>
  ({ salesOrderNo: 'SO', shippingType: 'LAND', rfqId: 'RFQ', items } as SalesOrderV1);
const item = (id: number, supplierId: string, shippingMethod: string, extra = {}) => ({
  id,
  supplier: { id: supplierId, supplierName: supplierId },
  shippingMethod,
  ...extra
});

describe('supplier shipping groups', () => {
  it('retains supplier and item order while separating complete shipping methods within each supplier', () => {
    const input = so([
      item(182, 'A', 'LAND', { rfqTierSplitId: 9, resolvedShippingMethod: 'LAND' }),
      item(200, 'B', 'LAND'),
      item(183, 'A', 'SEA', { rfqTierSplitId: 10, resolvedShippingMethod: 'SEA_SHARE_FCL_40HQ' }),
      item(184, 'A', 'LAND'),
      item(185, 'A', 'SEA'),
      item(186, 'A', 'SEA_FCL_20GP')
    ]);
    const before = JSON.stringify(input);
    const groups = groupSalesOrderBySupplier(input);
    expect(groups.map((group) => group.supplierId)).toEqual(['A', 'B']);
    expect(
      groups[0].shippingGroups.map((group) => [
        group.shippingMethod,
        group.salesOrder.items.map((row) => row.id)
      ])
    ).toEqual([
      ['LAND', [182, 184]],
      ['SEA_SHARE_FCL_40HQ', [183]],
      ['SEA', [185]],
      ['SEA_FCL_20GP', [186]]
    ]);
    expect(groups[0].shippingGroups[1].salesOrder.shippingType).toBe('SEA_SHARE_FCL_40HQ');
    expect(groups[0].shippingGroups.every((group) => group.shippingLocked)).toBe(true);
    expect(groups[1].shippingGroups[0].shippingLocked).toBe(false);
    expect(JSON.stringify(input)).toBe(before);
  });

  it('does not substitute generic SEA or header LAND when a split cannot be resolved', () => {
    const groups = groupSalesOrderBySupplier(so([item(183, 'A', 'SEA', { rfqTierSplitId: 10 })]));
    expect(groups[0].shippingGroups[0].shippingMethod).toBeNull();
    expect(groups[0].shippingGroups[0].shippingLocked).toBe(true);
    expect(groups[0].shippingGroups[0].salesOrder.items[0].id).toBe(183);
  });

  it('keeps normal single-method supplier groups compatible and skips unassigned suppliers', () => {
    const input = so([item(1, 'A', 'LAND'), item(2, 'A', 'LAND'), { id: 3, supplier: null }]);
    const groups = groupSalesOrderBySupplier(input);
    expect(groups).toHaveLength(1);
    expect(groups[0].shippingGroups).toHaveLength(1);
    expect(groups[0].shippingGroups[0].salesOrder.items.map((row) => row.id)).toEqual([1, 2]);
    expect(groups[0].shippingGroups[0].shippingLocked).toBe(false);
  });

  it('combines different shipping methods for a supplier without splits while another supplier remains split', () => {
    const groups = groupSalesOrderBySupplier(
      so([
        item(1, 'A', 'SEA'),
        item(3, 'B', 'LAND', { rfqTierSplitId: 9, resolvedShippingMethod: 'LAND' }),
        item(2, 'A', 'LAND'),
        item(4, 'B', 'SEA', { rfqTierSplitId: 10, resolvedShippingMethod: 'SEA_FCL_20GP' })
      ])
    );
    expect(groups[0].shippingGroups).toHaveLength(1);
    expect(groups[0].shippingGroups[0].shippingLocked).toBe(false);
    expect(groups[0].shippingGroups[0].shippingMethod).toBe('SEA');
    expect(groups[0].shippingGroups[0].salesOrder.items.map((row) => row.id)).toEqual([1, 2]);
    expect(groups[1].shippingGroups).toHaveLength(2);
    expect(groups[1].shippingGroups.every((group) => group.shippingLocked)).toBe(true);
  });

  it('keeps normal items without a shipping method editable rather than treating them as unresolved splits', () => {
    const groups = groupSalesOrderBySupplier({ ...so([item(1, 'A', '')]), shippingType: null });
    expect(groups[0].shippingGroups[0].shippingMethod).toBeNull();
    expect(groups[0].shippingGroups[0].shippingLocked).toBe(false);
    expect(groups[0].shippingGroups[0].salesOrder.items).toHaveLength(1);
  });
});
