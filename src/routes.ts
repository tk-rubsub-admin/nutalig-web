import { lazy } from 'react';
import { ROLES } from 'auth/roles';
import { PERMISSIONS } from 'auth/permissions';
import { LayoutRouteProps } from './layout/LayoutRoute';

export const ROUTE_PATHS = Object.freeze({
  CATCH_ALL: '**',
  ROOT: '/',
  VIEW_ORDER: '/view-order',
  DASHBOARD: '/dashboard',
  LOGIN: '/login',
  LINE_REGISTER: '/line-register',
  LOGIN_SUCCESS: '/login-success',
  LINE_REGISTER_SUCCESS: '/line-register-success',
  LOGIN_FAILURE: '/login-failure',
  LOGOUT: '/logout',
  FORBIDDEN: '/403',
  NOT_FOUND: '/404',
  RESET_PASSWORD: '/reset-password',
  CHANGE_PASSWORD: '/change-password',
  MAGIC_LINK: '/magic-link',
  SUPPLIER_MANAGEMENT: '/supplier-management',
  SUPPLIER_DETAIL: '/supplier/:id',
  SUPPLIER_NEW: '/supplier-create',
  STAFF_MANAGEMENT: '/staff-management',
  EMPLOYEE_MANAGEMENT: '/employee-management',
  EMPLOYEE_NEW: '/employee-create',
  EMPLOYEE_DETAIL: '/employee/:id',
  STAFF_NEW: '/staff-create',
  STAFF_DETAIL: '/staff/:id',
  CUSTOMER_MANAGEMENT: '/customer-management',
  CUSTOMER_DASHBOARD: '/customer-dashboard',
  PRODUCT_FAMILY_MANAGEMENT: '/product-family-management',
  SYSTEM_CONFIG_MANAGEMENT: '/system-config-management',
  RFQ_MANAGEMENT: '/rfq-management',
  PRICE_INQUIRY: '/price-inquiry/:id',
  PRICE_INQUIRY_MANAGEMENT: '/price-inquiry-management',
  RFQ_CREATE: '/rfq-create',
  RFQ_DETAIL: '/rfq/:id',
  CUSTOMER_NEW: '/customer-create',
  CUSTOMER_DETAIL: '/customer/:id',
  SALE_ORDER_MANAGEMENT: '/sales-order-management',
  SALE_ORDER_CREATE: '/sales-order-create',
  SALE_ORDER_CREATE_FROM_RFQ: '/create-sales-order-rfq/:rfqId',
  SALE_ORDER_DETAIL: '/sales-order/:id',
  INVOICE_MANAGEMENT: '/invoice-management',
  INVOICE_CREATE_FROM_SALES_ORDER: '/invoice-create/:salesOrderId',
  INVOICE_DETAIL: '/invoice/:id',
  PURCHASE_ORDER_MANAGEMENT: '/purchase-order-management',
  PURCHASE_ORDER_CREATE_FROM_SALES_ORDER: '/purchase-order-create/:salesOrderId',
  PURCHASE_ORDER_DETAIL: '/purchase-order/:id',
  RECEIPT_MANAGEMENT: '/receipt-management',
  RECEIPT_CREATE_FROM_INVOICE_PAYMENT: '/receipt-create/:invoiceId/:paymentId',
  RECEIPT_DETAIL: '/receipt/:id',
  USER_MANAGEMENT: '/user-management',
  USER_PERMISSION_MANAGEMENT: '/user-permission-management',
  MANUAL: '/manual',
  QUOTATION_CREATE: '/quotation-create',
  QUOTATION_CREATE_FROM_RFQ: '/create-quotation-rfq/:rfqId',
  QUOTATION_MANAGEMENT: '/quotation-management',
  QUOTATION_DETAIL: '/quotation-detail/:id'
});

export const routes: Readonly<LayoutRouteProps[]> = Object.freeze([
  {
    path: ROUTE_PATHS.LOGIN,
    isPublic: true,
    component: lazy(() => import('./pages/Login' /* webpackChunkName: "app" */))
  },
  {
    path: ROUTE_PATHS.LINE_REGISTER,
    isPublic: true,
    component: lazy(() => import('./pages/LineRegister' /* webpackChunkName: "app" */))
  },
  {
    path: ROUTE_PATHS.LOGIN_SUCCESS,
    isPublic: true,
    component: lazy(() => import('./pages/LoginSuccess' /* webpackChunkName: "app" */))
  },
  {
    path: ROUTE_PATHS.LINE_REGISTER_SUCCESS,
    isPublic: true,
    component: lazy(() => import('./pages/LineRegisterSuccess' /* webpackChunkName: "app" */))
  },
  {
    path: ROUTE_PATHS.LOGIN_FAILURE,
    isPublic: true,
    component: lazy(() => import('./pages/LoginFailure' /* webpackChunkName: "app" */))
  },
  {
    path: ROUTE_PATHS.LOGOUT,
    isPublic: true,
    component: lazy(() => import('./pages/Logout' /* webpackChunkName: "app" */))
  },
  {
    path: ROUTE_PATHS.RESET_PASSWORD,
    isPublic: true,
    component: lazy(() => import('./pages/ResetPassword' /* webpackChunkName: "app" */))
  },
  {
    path: ROUTE_PATHS.CHANGE_PASSWORD,
    isPublic: true,
    component: lazy(() => import('./pages/ChangePassword' /* webpackChunkName: "app" */))
  },
  {
    path: ROUTE_PATHS.DASHBOARD,
    component: lazy(() => import('./pages/Dashboard' /* webpackChunkName: "app" */))
  },
  {
    path: ROUTE_PATHS.FORBIDDEN,
    isPublic: true,
    component: lazy(() => import('./pages/Error/Forbidden' /* webpackChunkName: "app" */))
  },
  {
    path: ROUTE_PATHS.VIEW_ORDER,
    isPublic: true,
    component: lazy(() => import('./pages/ViewOrder' /* webpackChunkName: "app" */))
  },
  {
    path: ROUTE_PATHS.NOT_FOUND,
    isPublic: true,
    component: lazy(() => import('./pages/Error/NotFound' /* webpackChunkName: "app" */))
  },
  {
    path: ROUTE_PATHS.MAGIC_LINK,
    isPublic: true,
    component: lazy(() => import('./pages/MagicLink' /* webpackChunkName: "app" */))
  },
  {
    path: ROUTE_PATHS.SUPPLIER_MANAGEMENT,
    component: lazy(() => import('./pages/SupplierManagement' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.SUPPLIER_VIEW]
  },
  {
    path: ROUTE_PATHS.SUPPLIER_NEW,
    component: lazy(() => import('./pages/SupplierManagement/New' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.SUPPLIER_VIEW]
  },
  {
    path: ROUTE_PATHS.SUPPLIER_DETAIL,
    component: lazy(
      () => import('./pages/SupplierManagement/Detail' /* webpackChunkName: "app" */)
    ),
    requiredPermissions: [PERMISSIONS.SUPPLIER_VIEW]
  },
  {
    path: ROUTE_PATHS.STAFF_MANAGEMENT,
    component: lazy(() => import('./pages/StaffManagement' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.SUPER_ADMIN]
  },
  {
    path: ROUTE_PATHS.EMPLOYEE_MANAGEMENT,
    component: lazy(() => import('./pages/EmployeeManagement' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.EMPLOYEE_VIEW]
  },
  {
    path: ROUTE_PATHS.EMPLOYEE_NEW,
    component: lazy(() => import('./pages/EmployeeManagement/New' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.EMPLOYEE_VIEW]
  },
  {
    path: ROUTE_PATHS.EMPLOYEE_DETAIL,
    component: lazy(
      () => import('./pages/EmployeeManagement/Detail' /* webpackChunkName: "app" */)
    ),
    requiredPermissions: [PERMISSIONS.EMPLOYEE_VIEW]
  },
  {
    path: ROUTE_PATHS.STAFF_NEW,
    component: lazy(() => import('./pages/StaffManagement/New' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.SUPER_ADMIN]
  },
  {
    path: ROUTE_PATHS.STAFF_DETAIL,
    component: lazy(() => import('./pages/StaffManagement/Detail' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.SUPER_ADMIN]
  },
  {
    path: ROUTE_PATHS.CUSTOMER_MANAGEMENT,
    component: lazy(() => import('./pages/CustomerManagement' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.CUSTOMER_VIEW]
  },
  {
    path: ROUTE_PATHS.CUSTOMER_DASHBOARD,
    component: lazy(() => import('./pages/CustomerDashboard' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.CUSTOMER_VIEW]
  },
  {
    path: ROUTE_PATHS.PRODUCT_FAMILY_MANAGEMENT,
    component: lazy(() => import('./pages/ProductFamilyManagement' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.PRODUCT_FAMILY_VIEW]
  },
  {
    path: ROUTE_PATHS.SYSTEM_CONFIG_MANAGEMENT,
    component: lazy(() => import('./pages/SystemConfigManagement' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.SYSTEM_CONFIG_VIEW]
  },
  {
    path: ROUTE_PATHS.RFQ_MANAGEMENT,
    component: lazy(() => import('./pages/RFQManagement' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.RFQ_VIEW]
  },
  {
    path: ROUTE_PATHS.PRICE_INQUIRY_MANAGEMENT,
    component: lazy(() => import('./pages/PriceInquiryManagement' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.PRICE_INQUIRY_VIEW]
  },
  {
    path: ROUTE_PATHS.PRICE_INQUIRY,
    component: lazy(
      () => import('./pages/PriceInquiryManagement/Detail' /* webpackChunkName: "app" */)
    ),
    requiredPermissions: [PERMISSIONS.PRICE_INQUIRY_VIEW]
  },
  {
    path: ROUTE_PATHS.RFQ_CREATE,
    component: lazy(() => import('./pages/RFQManagement/New' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.RFQ_CREATE]
  },
  {
    path: ROUTE_PATHS.RFQ_DETAIL,
    component: lazy(() => import('./pages/RFQManagement/Detail' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.RFQ_VIEW]
  },

  {
    path: ROUTE_PATHS.CUSTOMER_NEW,
    component: lazy(() => import('./pages/CustomerManagement/New' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.CUSTOMER_CREATE]
  },
  {
    path: ROUTE_PATHS.CUSTOMER_DETAIL,
    component: lazy(
      () => import('./pages/CustomerManagement/Detail' /* webpackChunkName: "app" */)
    ),
    requiredPermissions: [PERMISSIONS.CUSTOMER_VIEW]
  },
  {
    path: ROUTE_PATHS.QUOTATION_CREATE,
    component: lazy(() => import('./pages/QuotationManagement/New' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.QUOTATION_CREATE]
  },
  {
    path: ROUTE_PATHS.QUOTATION_CREATE_FROM_RFQ,
    component: lazy(() => import('./pages/QuotationManagement/New' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.QUOTATION_CREATE]
  },
  {
    path: ROUTE_PATHS.SALE_ORDER_CREATE_FROM_RFQ,
    component: lazy(() => import('./pages/SalesOrderRFQ' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.SALES_ORDER_DRAFT]
  },
  {
    path: ROUTE_PATHS.SALE_ORDER_MANAGEMENT,
    component: lazy(() => import('./pages/SalesOrderManagement' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.SALES_ORDER_VIEW]
  },
  {
    path: ROUTE_PATHS.SALE_ORDER_DETAIL,
    component: lazy(
      () => import('./pages/SalesOrderManagement/Detail' /* webpackChunkName: "app" */)
    ),
    requiredPermissions: [PERMISSIONS.SALES_ORDER_VIEW]
  },
  {
    path: ROUTE_PATHS.INVOICE_MANAGEMENT,
    component: lazy(() => import('./pages/InvoiceManagement' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.INVOICE_VIEW]
  },
  {
    path: ROUTE_PATHS.INVOICE_CREATE_FROM_SALES_ORDER,
    component: lazy(() => import('./pages/InvoiceManagement/New' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.INVOICE_CREATE]
  },
  {
    path: ROUTE_PATHS.INVOICE_DETAIL,
    component: lazy(() => import('./pages/InvoiceManagement/Detail' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.INVOICE_VIEW]
  },
  {
    path: ROUTE_PATHS.PURCHASE_ORDER_MANAGEMENT,
    component: lazy(() => import('./pages/PurchaseOrderManagement' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.PURCHASE_ORDER_VIEW]
  },
  {
    path: ROUTE_PATHS.PURCHASE_ORDER_CREATE_FROM_SALES_ORDER,
    component: lazy(() => import('./pages/PurchaseOrderManagement/New' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.PURCHASE_ORDER_CREATE]
  },
  {
    path: ROUTE_PATHS.PURCHASE_ORDER_DETAIL,
    component: lazy(() => import('./pages/PurchaseOrderManagement/Detail' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.PURCHASE_ORDER_VIEW]
  },
  {
    path: ROUTE_PATHS.RECEIPT_MANAGEMENT,
    component: lazy(() => import('./pages/ReceiptManagement' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.INVOICE_VIEW]
  },
  {
    path: ROUTE_PATHS.RECEIPT_CREATE_FROM_INVOICE_PAYMENT,
    component: lazy(() => import('./pages/ReceiptManagement/New' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.INVOICE_CREATE]
  },
  {
    path: ROUTE_PATHS.RECEIPT_DETAIL,
    component: lazy(() => import('./pages/ReceiptManagement/Detail' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.INVOICE_VIEW]
  },
  {
    path: ROUTE_PATHS.QUOTATION_MANAGEMENT,
    component: lazy(() => import('./pages/QuotationManagement' /* webpackChunkName: "app" */)),
    requiredPermissions: [PERMISSIONS.QUOTATION_VIEW]
  },
  {
    path: ROUTE_PATHS.QUOTATION_DETAIL,
    component: lazy(
      () => import('./pages/QuotationManagement/Detail' /* webpackChunkName: "app" */)
    ),
    requiredPermissions: [PERMISSIONS.QUOTATION_VIEW]
  },
  {
    path: ROUTE_PATHS.MANUAL,
    component: lazy(() => import('./pages/Manual' /* webpackChunkName: "app" */)),
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
    path: ROUTE_PATHS.USER_MANAGEMENT,
    component: lazy(() => import('./pages/AdminManagement' /* webpackChunkName: "app" */)),
    requiredPermissions: ['PERM_VIEW_USER_LIST']
  },
  {
    path: ROUTE_PATHS.USER_PERMISSION_MANAGEMENT,
    component: lazy(() => import('./pages/UserPermissionManagement' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.SUPER_ADMIN]
  },
  {
    path: ROUTE_PATHS.ROOT,
    component: lazy(() => import('./pages/Home' /* webpackChunkName: "app" */))
  }
]);
