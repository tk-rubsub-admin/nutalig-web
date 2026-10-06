import { describe, expect, it } from 'vitest';
import { matchesSupplierShipping } from './shipping';

describe('Supplier Shipping selection', () => {
  const master = [
    { id: 1, shippingMethod: 'SEA', shippingMode: 'STANDARD' as const, carCode: 'TB001' },
    { id: 2, shippingMethod: 'SEA', shippingMode: 'FCL' as const, carCode: 'TZ001' },
    { id: 3, shippingMethod: 'LAND', shippingMode: 'STANDARD' as const, carCode: 'TR001' }
  ];

  it.each(['SEA_FCL_20GP', 'SEA_FCL_40HQ', 'SEA_SHARE_FCL_20GP', 'SEA_SHARE_FCL_40HQ'])(
    '%s offers only FCL/TZ records',
    (method) => {
      expect(master.filter((shipping) => matchesSupplierShipping(method, shipping))).toEqual([
        master[1]
      ]);
    }
  );

  it('switching from FCL to ordinary sea or land removes the former selection', () => {
    expect(master.filter((shipping) => matchesSupplierShipping('SEA', shipping))).toEqual([
      master[0]
    ]);
    expect(master.filter((shipping) => matchesSupplierShipping('LAND', shipping))).toEqual([
      master[2]
    ]);
  });

  it('does not offer TB when FCL records are missing', () => {
    expect(
      [master[0], master[2]].filter((shipping) => matchesSupplierShipping('SEA_FCL_20GP', shipping))
    ).toEqual([]);
  });

  it('supports cached legacy masters that omit mode', () => {
    expect(matchesSupplierShipping('SEA', { shippingMethod: 'SEA' })).toBe(true);
    expect(matchesSupplierShipping('SEA_FCL_20GP', { shippingMethod: 'SEA' })).toBe(false);
    expect(matchesSupplierShipping(' sea_share_fcl_40hq ', master[1])).toBe(true);
  });

  it('does not offer sea or land records for AIR or an empty method', () => {
    expect(master.filter((shipping) => matchesSupplierShipping('AIR', shipping))).toEqual([]);
    expect(master.filter((shipping) => matchesSupplierShipping('', shipping))).toEqual([]);
  });
});
