import { TFunction, Namespace } from 'react-i18next';

export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  ADMIN_BKK: 'ADMIN_BKK',
  ADMIN_PROVINCE: 'ADMIN_PROVINCE',
  ORDER_BKK: 'ORDER_BKK',
  ORDER_PROVINCE: 'ORDER_PROVINCE',
  ACCOUNT: 'ACCOUNT',
  ACCOUNT_ADMIN: 'ACCOUNT_ADMIN',
  PROCUREMENT: 'PROCUREMENT',
  PROCUREMENT_ADMIN: 'PROCUREMENT_ADMIN',
  RECEIVER: 'RECEIVER',
  RECEIVER_PAK_KLONG: 'RECEIVER_PAK_KLONG',
  SALES: 'SALES',
  SALES_ADMIN: 'SALES_ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN'
});

export const hasAllowedRole = (role?: string | null, allowedRoles?: Role[]): boolean => {
  if (!allowedRoles || !allowedRoles.length) {
    return true;
  }
  return !!role && allowedRoles.includes(role);
};

export const getAdminUserRoleLabel = (
  role: string | null | undefined,
  t: TFunction<Namespace>
): string => {
  return t(role ? `role.${role}` : '');
}
