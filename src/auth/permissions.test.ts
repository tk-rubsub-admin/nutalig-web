import { describe, expect, it } from 'vitest';
import { getRoleFallbackPermissions, mergePermissions, PERMISSIONS } from './permissions';
import { ROLES } from './roles';

describe('sales manager permissions', () => {
  it('supports the same sales functions without granting administrative functions', () => {
    const permissions = getRoleFallbackPermissions(ROLES.SALES_MANAGER);
    expect(permissions).toEqual(getRoleFallbackPermissions(ROLES.SALES));
    expect(permissions).toContain(PERMISSIONS.RFQ_CREATE);
    expect(permissions).not.toContain(PERMISSIONS.USER_MANAGE);
    expect(permissions).not.toContain(PERMISSIONS.SYSTEM_CONFIG_VIEW);
  });

  it('preserves configured manager permissions when merging the sales defaults', () => {
    const permissions = mergePermissions(ROLES.SALES_MANAGER, [
      PERMISSIONS.RFQ_CREATE,
      PERMISSIONS.RFQ_CUSTOMER_TRANSFER_APPROVE
    ]);
    expect(permissions).toContain(PERMISSIONS.RFQ_CUSTOMER_TRANSFER_APPROVE);
    expect(permissions).toContain(PERMISSIONS.QUOTATION_CREATE);
    expect(permissions.filter((permission) => permission === PERMISSIONS.RFQ_CREATE)).toHaveLength(
      1
    );
  });
});
