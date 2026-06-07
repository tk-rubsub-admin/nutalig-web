/* eslint-disable prettier/prettier */
import { useTranslation } from 'react-i18next';
import { ROUTE_PATHS } from 'routes';
import {
  AccountCircle,
  ContactPage,
  FilePresent,
  Group,
  Home,
  Inventory2,
  ManageAccounts,
  Person,
  Security,
  SettingsSuggest,
} from '@mui/icons-material';
import { ROLES } from 'auth/roles';
import { PERMISSIONS } from 'auth/permissions';
import { SidebarItemsType } from './Sidebar/types';
import { Description } from '@material-ui/icons';

export function useMenuItems() {
  const { t } = useTranslation();

  const pagesSection = [
    {
      id: 'left_menu__home',
      title: t('sidebar.dashboard'),
      href: ROUTE_PATHS.DASHBOARD,
      icon: Home,
      allowedPermission: [PERMISSIONS.DASHBOARD_VIEW]
    },
    // {
    //   id: 'left_menu__user_management',
    //   title: t('sidebar.userManagement.title'),
    //   href: ROUTE_PATHS.EMPLOYEE_MANAGEMENT,
    //   icon: Group,
    //   allowedRoles: [ROLES.SUPER_ADMIN]
    // },
    {
      id: 'left_menu__customer_management',
      title: t('sidebar.customerManagement.title'),
      href: ROUTE_PATHS.CUSTOMER_MANAGEMENT,
      icon: Person,
      allowedPermission: [PERMISSIONS.CUSTOMER_VIEW]
    },
    {
      id: 'left_menu__supplier_management',
      title: t('sidebar.supplierManagement.title'),
      href: ROUTE_PATHS.SUPPLIER_MANAGEMENT,
      icon: AccountCircle,
      allowedPermission: [PERMISSIONS.SUPPLIER_VIEW]
    },
    {
      id: 'left_menu__product_family_management',
      title: t('sidebar.productFamilyManagement.title'),
      href: ROUTE_PATHS.PRODUCT_FAMILY_MANAGEMENT,
      icon: Inventory2,
      allowedPermission: [PERMISSIONS.PRODUCT_FAMILY_VIEW]
    },
    {
      id: 'left_menu__rfq_management',
      title: t('sidebar.rfqManagement.title'),
      href: ROUTE_PATHS.RFQ_MANAGEMENT,
      icon: FilePresent,
      allowedPermission: [PERMISSIONS.RFQ_VIEW]
    },
    {
      id: 'left_menu__price_inquiry_management',
      title: t('sidebar.priceInquiryManagement.title'),
      href: ROUTE_PATHS.PRICE_INQUIRY_MANAGEMENT,
      icon: FilePresent,
      allowedPermission: [PERMISSIONS.PRICE_INQUIRY_VIEW]
    },
    {
      id: 'left_menu__employee_management',
      title: t('sidebar.employeeManagement.title'),
      href: ROUTE_PATHS.EMPLOYEE_MANAGEMENT,
      icon: ContactPage,
      allowedPermission: [PERMISSIONS.EMPLOYEE_VIEW]
    },
    {
      id: 'left_menu__document_management',
      title: t('sidebar.documentManagement.title'),
      icon: Description,
      allowedPermission: [PERMISSIONS.QUOTATION_VIEW, PERMISSIONS.INVOICE_VIEW, PERMISSIONS.BILLING_VIEW],
      children: [
        {
          id: 'left_menu__quotation',
          title: t('sidebar.documentManagement.quotation'),
          href: ROUTE_PATHS.QUOTATION_MANAGEMENT,
          allowedPermission: [PERMISSIONS.QUOTATION_VIEW]
        },
        {
          id: 'left_menu__invoice',
          title: t('sidebar.documentManagement.invoice'),
          href: ROUTE_PATHS.PRODUCT_LIST,
          allowedPermission: [PERMISSIONS.INVOICE_VIEW]
        },
        {
          id: 'left_menu__billing',
          title: t('sidebar.documentManagement.billing'),
          href: ROUTE_PATHS.PRODUCT_LIST,
          allowedPermission: [PERMISSIONS.BILLING_VIEW]
        },
      ]
    },
    {
      id: 'left_menu__system_config_management',
      title: t('sidebar.systemConfigManagement.title'),
      href: ROUTE_PATHS.SYSTEM_CONFIG_MANAGEMENT,
      icon: SettingsSuggest,
      allowedPermission: [PERMISSIONS.SYSTEM_CONFIG_VIEW]
    },
    {
      id: 'left_menu__permission_management',
      title: t('sidebar.permissionManagement.title'),
      href: ROUTE_PATHS.USER_PERMISSION_MANAGEMENT,
      icon: Security,
      allowedRoles: [ROLES.SUPER_ADMIN]
    },
    {
      id: 'left_menu__account_setting',
      title: t('sidebar.accountSetting.title'),
      icon: ManageAccounts,
      allowedPermission: [PERMISSIONS.ACCOUNT_SETTING_VIEW, PERMISSIONS.MANUAL_VIEW],
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
          allowedPermission: [PERMISSIONS.MANUAL_VIEW]
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
