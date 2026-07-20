/* eslint-disable prettier/prettier */
import { useTranslation } from 'react-i18next';
import { ROUTE_PATHS } from 'routes';
import {
  AccountCircle,
  Leaderboard,
  Home,
  Inventory2,
  ManageAccounts,
  Person,
  SettingsSuggest,
  Assignment,
  CurrencyExchange,
  Task,
} from '@mui/icons-material';
import { ROLES } from 'auth/roles';
import { PERMISSIONS } from 'auth/permissions';
import { SidebarItemsType } from './Sidebar/types';

export function useMenuItems() {
  const { t } = useTranslation();

  const pagesSection = [
    {
      id: 'left_menu__home',
      title: t('sidebar.home'),
      href: ROUTE_PATHS.ROOT,
      icon: Home
    },
    {
      id: 'left_menu__dashboard',
      title: t('sidebar.dashboard'),
      href: ROUTE_PATHS.DASHBOARD,
      icon: Leaderboard,
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
      id: 'left_menu__sales_management',
      title: 'ฝ่ายขาย',
      icon: CurrencyExchange,
      allowedPermission: [
        PERMISSIONS.RFQ_VIEW,
        PERMISSIONS.QUOTATION_VIEW,
        PERMISSIONS.SALE_ORDER_VIEW,
        PERMISSIONS.INVOICE_VIEW
      ],
      children: [
        {
          id: 'left_menu__rfq_management',
          title: t('sidebar.rfqManagement.title'),
          href: ROUTE_PATHS.RFQ_MANAGEMENT,
          allowedPermission: [PERMISSIONS.RFQ_VIEW]
        },
        {
          id: 'left_menu__quotation',
          title: t('sidebar.documentManagement.quotation'),
          href: ROUTE_PATHS.QUOTATION_MANAGEMENT,
          allowedPermission: [PERMISSIONS.QUOTATION_VIEW]
        },
        {
          id: 'left_menu__sales_order',
          title: t('sidebar.documentManagement.salesOrder'),
          href: ROUTE_PATHS.SALE_ORDER_MANAGEMENT,
          allowedPermission: [PERMISSIONS.SALES_ORDER_VIEW]
        }
      ]
    },
    {
      id: 'left_menu__procurement_management',
      title: 'ฝ่ายจัดซื้อ',
      icon: Assignment,
      allowedPermission: [PERMISSIONS.PRICE_INQUIRY_VIEW, PERMISSIONS.PURCHASE_ORDER_VIEW],
      children: [
        {
          id: 'left_menu__price_inquiry_management',
          title: t('sidebar.priceInquiryManagement.title'),
          href: ROUTE_PATHS.PRICE_INQUIRY_MANAGEMENT,
          allowedPermission: [PERMISSIONS.PRICE_INQUIRY_VIEW]
        },
        {
          id: 'left_menu__purchase_order',
          title: t('sidebar.procurement.purchaseOrder'),
          href: ROUTE_PATHS.PURCHASE_ORDER_MANAGEMENT,
          allowedPermission: [PERMISSIONS.PURCHASE_ORDER_VIEW]
        }
      ]
    },
    {
      id: 'left_menu__customer_management',
      title: 'ลูกค้า',
      icon: Person,
      allowedPermission: [PERMISSIONS.CUSTOMER_VIEW],
      children: [
        {
          id: 'left_menu__dashboard_customer',
          title: t('sidebar.customerManagement.dashboard'),
          href: ROUTE_PATHS.CUSTOMER_DASHBOARD,
          allowedPermission: [PERMISSIONS.CUSTOMER_VIEW]
        },
        {
          id: 'left_menu__customer',
          title: t('sidebar.customerManagement.title'),
          href: ROUTE_PATHS.CUSTOMER_MANAGEMENT,
          allowedPermission: [PERMISSIONS.CUSTOMER_VIEW]
        }
      ]
    },
    {
      id: 'left_menu__supplier_management',
      title: 'Supplier',
      icon: AccountCircle,
      allowedPermission: [PERMISSIONS.SUPPLIER_VIEW],
      children: [
        {
          id: 'left_menu__supplier',
          title: t('sidebar.supplierManagement.title'),
          href: ROUTE_PATHS.SUPPLIER_MANAGEMENT,
          allowedPermission: [PERMISSIONS.SUPPLIER_VIEW]
        }
      ]
    },
    {
      id: 'left_menu__product_management',
      title: 'สินค้า',
      icon: Inventory2,
      allowedPermission: [PERMISSIONS.PRODUCT_FAMILY_VIEW],
      children: [
        {
          id: 'left_menu__product_family_management',
          title: t('sidebar.productFamilyManagement.title'),
          href: ROUTE_PATHS.PRODUCT_FAMILY_MANAGEMENT,
          allowedPermission: [PERMISSIONS.PRODUCT_FAMILY_VIEW]
        }
      ]
    },
    {
      id: 'left_menu__document_management',
      title: 'เอกสาร',
      icon: Task,
      allowedPermission: [PERMISSIONS.QUOTATION_VIEW, PERMISSIONS.SALES_ORDER_VIEW, PERMISSIONS.INVOICE_VIEW],
      children: [
        {
          id: 'left_menu__quotation',
          title: t('sidebar.documentManagement.quotation'),
          href: ROUTE_PATHS.QUOTATION_MANAGEMENT,
          allowedPermission: [PERMISSIONS.QUOTATION_VIEW]
        },
        {
          id: 'left_menu__sales_order',
          title: t('sidebar.documentManagement.salesOrder'),
          href: ROUTE_PATHS.SALE_ORDER_MANAGEMENT,
          allowedPermission: [PERMISSIONS.SALES_ORDER_VIEW]
        },
        {
          id: 'left_menu__invoice',
          title: t('sidebar.documentManagement.invoice'),
          href: ROUTE_PATHS.INVOICE_MANAGEMENT,
          allowedPermission: [PERMISSIONS.INVOICE_VIEW]
        },
        {
          id: 'left_menu__receipt',
          title: t('sidebar.documentManagement.receipt'),
          href: ROUTE_PATHS.RECEIPT_MANAGEMENT,
          allowedPermission: [PERMISSIONS.INVOICE_VIEW]
        }
      ]
    },
    {
      id: 'left_menu__administration',
      title: 'ระบบ',
      icon: SettingsSuggest,
      allowedPermission: [PERMISSIONS.EMPLOYEE_VIEW, PERMISSIONS.SYSTEM_CONFIG_VIEW],
      children: [
        {
          id: 'left_menu__employee_management',
          title: t('sidebar.employeeManagement.title'),
          href: ROUTE_PATHS.EMPLOYEE_MANAGEMENT,
          allowedPermission: [PERMISSIONS.EMPLOYEE_VIEW]
        },
        {
          id: 'left_menu__permission_management',
          title: t('sidebar.permissionManagement.title'),
          href: ROUTE_PATHS.USER_PERMISSION_MANAGEMENT,
          allowedRoles: [ROLES.SUPER_ADMIN]
        },
        {
          id: 'left_menu__system_config_management',
          title: t('sidebar.systemConfigManagement.title'),
          href: ROUTE_PATHS.SYSTEM_CONFIG_MANAGEMENT,
          allowedPermission: [PERMISSIONS.SYSTEM_CONFIG_VIEW]
        }
      ]
    },
    {
      id: 'left_menu__account_setting',
      title: 'บัญชีของฉัน',
      icon: ManageAccounts,
      allowedPermission: [PERMISSIONS.ACCOUNT_SETTING_VIEW, PERMISSIONS.MANUAL_VIEW],
      children: [
        // {
        //   id: 'left_menu__change_password',
        //   title: t('sidebar.accountSetting.changePassword'),
        //   href: ROUTE_PATHS.CHANGE_PASSWORD,
        //   allowedRoles: [
        //     ROLES.ADMIN,
        //     ROLES.ADMIN_BKK,
        //     ROLES.ADMIN_PROVINCE,
        //     ROLES.ORDER_BKK,
        //     ROLES.ORDER_PROVINCE,
        //     ROLES.ACCOUNT,
        //     ROLES.ACCOUNT_ADMIN,
        //     ROLES.PROCUREMENT,
        //     ROLES.PROCUREMENT_ADMIN,
        //     ROLES.RECEIVER,
        //     ROLES.RECEIVER_PAK_KLONG,
        //     ROLES.SALES,
        //     ROLES.SALES_ADMIN,
        //     ROLES.SUPER_ADMIN
        //   ]
        // },
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
