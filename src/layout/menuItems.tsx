/* eslint-disable prettier/prettier */
import { useTranslation } from 'react-i18next';
import { ROUTE_PATHS } from 'routes';
import {
  AccountBalanceWallet,
  AddShoppingCart,
  Diversity3,
  FilePresent,
  Group,
  Home,
  ManageAccounts,
  SettingsSuggest,
  ShoppingBag,
  ShoppingCartCheckout
} from '@mui/icons-material';
import { ROLES } from 'auth/roles';
import { SidebarItemsType } from './Sidebar/types';
import { Description } from '@material-ui/icons';

export function useMenuItems() {
  const { t } = useTranslation();

  const pagesSection = [
    {
      id: 'left_menu__home',
      title: t('sidebar.home'),
      href: ROUTE_PATHS.ROOT,
      icon: Home,
      allowedRoles: Object.values(ROLES)
    },
    // {
    //   id: 'left_menu__user_management',
    //   title: t('sidebar.userManagement.title'),
    //   href: ROUTE_PATHS.USER_MANAGEMENT,
    //   icon: ManageAccounts,
    //   allowedPermission: ['PERM_VIEW_USER_LIST']
    // },
    // {
    //   id: 'left_menu__staff_management',
    //   title: t('sidebar.staffManagement.title'),
    //   href: ROUTE_PATHS.STAFF_MANAGEMENT,
    //   icon: Group,
    //   allowedRoles: [ROLES.SUPER_ADMIN]
    // },
    // {
    //   id: 'left_menu__supplier_management',
    //   title: t('sidebar.supplierManagement.title'),
    //   href: ROUTE_PATHS.SUPPLIER_MANAGEMENT,
    //   icon: Diversity3,
    //   allowedRoles: [ROLES.SUPER_ADMIN, ROLES.PROCUREMENT, ROLES.PROCUREMENT_ADMIN]
    // },
    {
      id: 'left_menu__customer_management',
      title: t('sidebar.customerManagement.title'),
      href: ROUTE_PATHS.CUSTOMER_MANAGEMENT,
      icon: Group,
      allowedRoles: [ROLES.SUPER_ADMIN]
    },
    {
      id: 'left_menu__rfq_management',
      title: t('sidebar.rfqManagement.title'),
      href: ROUTE_PATHS.RFQ_MANAGEMENT,
      icon: FilePresent,
      allowedRoles: [ROLES.SUPER_ADMIN, ROLES.SALES, ROLES.PROCUREMENT, ROLES.ADMIN]
    },
    {
      id: 'left_menu__document_management',
      title: t('sidebar.documentManagement.title'),
      icon: Description,
      allowedRoles: [ROLES.SUPER_ADMIN, ROLES.SALES, ROLES.ADMIN],
      children: [
        {
          id: 'left_menu__quotation',
          title: t('sidebar.documentManagement.quotation'),
          href: ROUTE_PATHS.QUOTATION_MANAGEMENT,
          allowedRoles: [ROLES.SUPER_ADMIN, ROLES.SALES]
        },
        {
          id: 'left_menu__invoice',
          title: t('sidebar.documentManagement.invoice'),
          href: ROUTE_PATHS.PRODUCT_LIST,
          allowedRoles: [ROLES.SUPER_ADMIN]
        },
        {
          id: 'left_menu__billing',
          title: t('sidebar.documentManagement.billing'),
          href: ROUTE_PATHS.PRODUCT_LIST,
          allowedRoles: [ROLES.SUPER_ADMIN]
        },
      ]
    },
    {
      id: 'left_menu__system_config_management',
      title: t('sidebar.systemConfigManagement.title'),
      href: ROUTE_PATHS.SYSTEM_CONFIG_MANAGEMENT,
      icon: SettingsSuggest,
      allowedRoles: [ROLES.SUPER_ADMIN]
    },
    {
      id: 'left_menu__account_setting',
      title: t('sidebar.accountSetting.title'),
      icon: ManageAccounts,
      allowedRoles: [
        ROLES.SUPER_ADMIN,
        ROLES.ADMIN_BKK, ROLES.ADMIN_PROVINCE,
        ROLES.ORDER_BKK,
        ROLES.ORDER_PROVINCE,
        ROLES.ACCOUNT,
        ROLES.ACCOUNT_ADMIN,
        ROLES.PROCUREMENT,
        ROLES.PROCUREMENT_ADMIN,
        ROLES.SALES,
        ROLES.SALES_ADMIN
      ],
      children: [
        {
          id: 'left_menu__change_password',
          title: t('sidebar.accountSetting.changePassword'),
          href: '/change-password',
          allowedRoles: [
            ROLES.ADMIN,
            ROLES.ADMIN_BKK,
            ROLES.ADMIN_PROVINCE,
            ROLES.ORDER_BKK,
            ROLES.ORDER_PROVINCE,
            ROLES.ACCOUNT,
            ROLES.ACCOUNT_ADMIN,
            ROLES.PROCUREMENT,
            ROLES.PROCUREMENT_ADMIN,
            ROLES.RECEIVER,
            ROLES.RECEIVER_PAK_KLONG,
            ROLES.SALES,
            ROLES.SALES_ADMIN,
            ROLES.SUPER_ADMIN
          ]
        },
        {
          id: 'left_menu__manual',
          title: t('sidebar.accountSetting.manual'),
          href: ROUTE_PATHS.MANUAL,
          allowedRoles: [
            ROLES.ADMIN,
            ROLES.ADMIN_BKK,
            ROLES.ADMIN_PROVINCE,
            ROLES.ORDER_BKK,
            ROLES.ORDER_PROVINCE,
            ROLES.ACCOUNT,
            ROLES.ACCOUNT_ADMIN,
            ROLES.PROCUREMENT,
            ROLES.PROCUREMENT_ADMIN,
            ROLES.RECEIVER,
            ROLES.RECEIVER_PAK_KLONG,
            ROLES.SALES,
            ROLES.SALES_ADMIN,
            ROLES.SUPER_ADMIN
          ]
        }
      ]
    }
  ] as unknown as SidebarItemsType[];

  const menuItems = [
    {
      title: t('sidebar.pages'),
      pages: pagesSection
    }
  ];

  return menuItems;
}

export default useMenuItems;
