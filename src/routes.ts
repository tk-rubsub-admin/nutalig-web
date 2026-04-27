import { lazy } from 'react';
import { ROLES } from 'auth/roles';
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
  LIFF_APP: '/dpk-line-connect',
  RESET_PASSWORD: '/reset-password',
  CHANGE_PASSWORD: '/change-password',
  MAGIC_LINK: '/magic-link',
  SUPPLIER_MANAGEMENT: '/supplier-management',
  SUPPLIER_DETAIL: '/supplier/:id',
  SUPPLIER_NEW: '/supplier-create',
  STAFF_MANAGEMENT: '/staff-management',
  EMPLOYEE_MANAGEMENT: '/employee-management',
  EMPLOYEE_DETAIL: '/employee/:id',
  STAFF_NEW: '/staff-create',
  STAFF_DETAIL: '/staff/:id',
  CUSTOMER_MANAGEMENT: '/customer-management',
  SYSTEM_CONFIG_MANAGEMENT: '/system-config-management',
  RFQ_MANAGEMENT: '/rfq-management',
  RFQ_CREATE: '/rfq-create',
  RFQ_DETAIL: '/rfq/:id',
  CUSTOMER_NEW: '/customer-create',
  CUSTOMER_DETAIL: '/customer/:id',
  SALE_ORDER_MANAGEMENT: '/sale-order-management',
  SALE_ORDER_CREATE: '/sale-order-create',
  SALE_ORDER_DETAIL: '/sale-order/:id',
  BILLING_MANAGEMENT: '/billing-note-management',
  BILLING_DETAIL: '/billing-note/:id',
  BILLING_CREATE: '/billing-note-create',
  INVOICE_MANAGEMENT: '/invoice-management',
  INVOICE_DETAIL: '/invoice/:id',
  NEW_INVOICE: '/invoice-create',
  INVOICE_GROUP_MANAGEMENT: '/invoice-group-management',
  INVOICE_GROUP_DETAIL: '/invoice-group/:id',
  NEW_INVOICE_GROUP: '/invoice-group-create',
  PRODUCT_LIST: '/product-list',
  NEW_PRODUCT: '/new-product',
  PRODUCT_SUPPLIER: '/product-supplier',
  PRODUCT_PRICE: '/product-price',
  USER_MANAGEMENT: '/user-management',
  RECEIVE_PRODUCT: '/receive-product',
  BUYING_PRODUCT: '/buying-product',
  PURCHASE_ORDER_MANAGEMENT: '/purchase-order-management',
  PURCHASE_ORDER_DETAIL: '/purchase-order/:id',
  NEW_PURCHASE_ORDER: '/purchase-order-create',
  ADVANCE_PURCHASE_ORDER_MANAGEMENT: '/advance-purchase-order-management',
  ADVANCE_PURCHASE_ORDER: '/advance-purchase-order/:id',
  FREIGHT: '/freight-management',
  PRICE_LIST: '/price-lists',
  PRICE_LIST_CREATE: '/new-price-list',
  PRICE_LIST_VIEW: '/price-list/:id',
  MANUAL: '/manual',
  QUOTATION_CREATE: '/quotation-create',
  QUOTATION_MANAGEMENT: '/quotation-management',
  QUOTATION_DETAIL: '/quotation/:id'
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
    path: ROUTE_PATHS.LIFF_APP,
    isPublic: true,
    component: lazy(() => import('./pages/Liff' /* webpackChunkName: "app" */))
  },
  {
    path: ROUTE_PATHS.CHANGE_PASSWORD,
    isPublic: true,
    component: lazy(() => import('./pages/ChangePassword' /* webpackChunkName: "app" */))
  },
  {
    path: ROUTE_PATHS.DASHBOARD,
    isPublic: true,
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
    path: ROUTE_PATHS.STAFF_MANAGEMENT,
    component: lazy(() => import('./pages/StaffManagement' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.SUPER_ADMIN]
  },
  {
    path: ROUTE_PATHS.EMPLOYEE_MANAGEMENT,
    component: lazy(() => import('./pages/EmployeeManagement' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN]
  },
  {
    path: ROUTE_PATHS.EMPLOYEE_DETAIL,
    component: lazy(() => import('./pages/EmployeeManagement/Detail' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN]
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
    allowedRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN_BKK,
      ROLES.ADMIN_PROVINCE,
      ROLES.ACCOUNT,
      ROLES.ACCOUNT_ADMIN
    ]
  },
  {
    path: ROUTE_PATHS.SYSTEM_CONFIG_MANAGEMENT,
    component: lazy(() => import('./pages/SystemConfigManagement' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.SUPER_ADMIN]
  },
  {
    path: ROUTE_PATHS.RFQ_MANAGEMENT,
    component: lazy(() => import('./pages/RFQManagement' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.SALES, ROLES.PROCUREMENT, ROLES.ADMIN]
  },
  {
    path: ROUTE_PATHS.RFQ_CREATE,
    component: lazy(() => import('./pages/RFQManagement/New' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.SALES, ROLES.ADMIN]
  },
  {
    path: ROUTE_PATHS.RFQ_DETAIL,
    component: lazy(() => import('./pages/RFQManagement/Detail' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.SALES, ROLES.PROCUREMENT, ROLES.ADMIN]
  },

  {
    path: ROUTE_PATHS.CUSTOMER_NEW,
    component: lazy(() => import('./pages/CustomerManagement/New' /* webpackChunkName: "app" */)),
    allowedRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN_BKK,
      ROLES.ADMIN_PROVINCE,
      ROLES.ACCOUNT,
      ROLES.ACCOUNT_ADMIN
    ]
  },
  {
    path: ROUTE_PATHS.CUSTOMER_DETAIL,
    component: lazy(
      () => import('./pages/CustomerManagement/Detail' /* webpackChunkName: "app" */)
    ),
    allowedRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN_BKK,
      ROLES.ADMIN_PROVINCE,
      ROLES.ACCOUNT,
      ROLES.ACCOUNT_ADMIN
    ]
  },
  {
    path: ROUTE_PATHS.QUOTATION_CREATE,
    component: lazy(() => import('./pages/QuotationManagement/New' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.SALES]
  },
  {
    path: ROUTE_PATHS.QUOTATION_MANAGEMENT,
    component: lazy(() => import('./pages/QuotationManagement' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.SALES]
  },
  {
    path: ROUTE_PATHS.RECEIVE_PRODUCT,
    component: lazy(() => import('./pages/ReceiveProduct' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.RECEIVER, ROLES.RECEIVER_PAK_KLONG,]
  },
  {
    path: ROUTE_PATHS.BUYING_PRODUCT,
    component: lazy(() => import('./pages/BuyingProduct' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.PROCUREMENT, ROLES.PROCUREMENT_ADMIN]
  },
  {
    path: ROUTE_PATHS.PURCHASE_ORDER_MANAGEMENT,
    component: lazy(() => import('./pages/PurchaseOrderManagement' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.PROCUREMENT, ROLES.PROCUREMENT_ADMIN]
  },
  {
    path: ROUTE_PATHS.ADVANCE_PURCHASE_ORDER_MANAGEMENT,
    component: lazy(() => import('./pages/AdvancePurchaseOrder' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.PROCUREMENT, ROLES.PROCUREMENT_ADMIN]
  },
  {
    path: ROUTE_PATHS.ADVANCE_PURCHASE_ORDER,
    component: lazy(
      () => import('./pages/AdvancePurchaseOrder/Detail' /* webpackChunkName: "app" */)
    ),
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.PROCUREMENT, ROLES.PROCUREMENT_ADMIN]
  },
  {
    path: ROUTE_PATHS.NEW_PURCHASE_ORDER,
    component: lazy(
      () => import('./pages/PurchaseOrderManagement/New' /* webpackChunkName: "app" */)
    ),
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.PROCUREMENT, ROLES.PROCUREMENT_ADMIN]
  },
  {
    path: ROUTE_PATHS.PURCHASE_ORDER_DETAIL,
    component: lazy(
      () => import('./pages/PurchaseOrderManagement/Detail' /* webpackChunkName: "app" */)
    ),
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.PROCUREMENT, ROLES.PROCUREMENT_ADMIN]
  },
  {
    path: ROUTE_PATHS.SALE_ORDER_MANAGEMENT,
    component: lazy(() => import('./pages/SaleOrderManagement' /* webpackChunkName: "app" */)),
    allowedRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN_BKK,
      ROLES.ADMIN_PROVINCE,
      ROLES.ORDER_BKK,
      ROLES.ORDER_PROVINCE,
      ROLES.ACCOUNT,
      ROLES.ACCOUNT_ADMIN,
      ROLES.PROCUREMENT,
      ROLES.PROCUREMENT_ADMIN
    ]
  },
  {
    path: ROUTE_PATHS.SALE_ORDER_CREATE,
    component: lazy(() => import('./pages/SaleOrderManagement/New' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_BKK, ROLES.ADMIN_PROVINCE]
  },
  {
    path: ROUTE_PATHS.SALE_ORDER_DETAIL,
    component: lazy(
      () => import('./pages/SaleOrderManagement/Detail' /* webpackChunkName: "app" */)
    ),
    allowedRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN_BKK,
      ROLES.ADMIN_PROVINCE,
      ROLES.ORDER_BKK,
      ROLES.ORDER_PROVINCE,
      ROLES.ACCOUNT,
      ROLES.ACCOUNT_ADMIN,
      ROLES.PROCUREMENT,
      ROLES.PROCUREMENT_ADMIN
    ]
  },
  {
    path: ROUTE_PATHS.BILLING_MANAGEMENT,
    component: lazy(() => import('./pages/BillingManagement' /* webpackChunkName: "app" */)),
    allowedRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN_BKK,
      ROLES.ADMIN_PROVINCE,
      ROLES.ACCOUNT,
      ROLES.ACCOUNT_ADMIN
    ]
  },
  {
    path: ROUTE_PATHS.BILLING_CREATE,
    component: lazy(() => import('./pages/BillingManagement/New' /* webpackChunkName: "app" */)),
    allowedRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN_BKK,
      ROLES.ADMIN_PROVINCE,
      ROLES.ACCOUNT,
      ROLES.ACCOUNT_ADMIN
    ]
  },
  {
    path: ROUTE_PATHS.BILLING_DETAIL,
    component: lazy(() => import('./pages/BillingManagement/Detail' /* webpackChunkName: "app" */)),
    allowedRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN_BKK,
      ROLES.ADMIN_PROVINCE,
      ROLES.ACCOUNT,
      ROLES.ACCOUNT_ADMIN
    ]
  },
  {
    path: ROUTE_PATHS.INVOICE_MANAGEMENT,
    component: lazy(() => import('./pages/InvoiceManagement' /* webpackChunkName: "app" */)),
    allowedRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN_BKK,
      ROLES.ADMIN_PROVINCE,
      ROLES.ACCOUNT,
      ROLES.ACCOUNT_ADMIN
    ]
  },
  {
    path: ROUTE_PATHS.NEW_INVOICE,
    component: lazy(() => import('./pages/InvoiceManagement/New' /* webpackChunkName: "app" */)),
    allowedRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN_BKK,
      ROLES.ADMIN_PROVINCE,
      ROLES.ACCOUNT,
      ROLES.ACCOUNT_ADMIN
    ]
  },
  {
    path: ROUTE_PATHS.INVOICE_GROUP_MANAGEMENT,
    component: lazy(() => import('./pages/InvoiceGroupManagement' /* webpackChunkName: "app" */)),
    allowedRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN_BKK,
      ROLES.ADMIN_PROVINCE,
      ROLES.ACCOUNT,
      ROLES.ACCOUNT_ADMIN
    ]
  },
  {
    path: ROUTE_PATHS.INVOICE_GROUP_DETAIL,
    component: lazy(
      () => import('./pages/InvoiceGroupManagement/Detail' /* webpackChunkName: "app" */)
    ),
    allowedRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN_BKK,
      ROLES.ADMIN_PROVINCE,
      ROLES.ACCOUNT,
      ROLES.ACCOUNT_ADMIN
    ]
  },
  {
    path: ROUTE_PATHS.NEW_INVOICE_GROUP,
    component: lazy(
      () => import('./pages/InvoiceGroupManagement/New' /* webpackChunkName: "app" */)
    ),
    allowedRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN_BKK,
      ROLES.ADMIN_PROVINCE,
      ROLES.ACCOUNT,
      ROLES.ACCOUNT_ADMIN
    ]
  },
  {
    path: ROUTE_PATHS.INVOICE_DETAIL,
    component: lazy(() => import('./pages/InvoiceManagement/Detail' /* webpackChunkName: "app" */)),
    allowedRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN_BKK,
      ROLES.ADMIN_PROVINCE,
      ROLES.ACCOUNT,
      ROLES.ACCOUNT_ADMIN
    ]
  },
  {
    path: ROUTE_PATHS.PRODUCT_LIST,
    component: lazy(() => import('./pages/ProductList' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_BKK, ROLES.ADMIN_PROVINCE]
  },
  {
    path: ROUTE_PATHS.NEW_PRODUCT,
    component: lazy(() => import('./pages/ProductList/New' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_BKK, ROLES.ADMIN_PROVINCE]
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
    path: ROUTE_PATHS.PRODUCT_PRICE,
    component: lazy(() => import('./pages/ProductPrice' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ACCOUNT, ROLES.ACCOUNT_ADMIN]
  },
  {
    path: ROUTE_PATHS.PRICE_LIST,
    component: lazy(() => import('./pages/PriceList' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.SUPER_ADMIN]
  },
  {
    path: ROUTE_PATHS.PRICE_LIST_CREATE,
    component: lazy(() => import('./pages/PriceList/New' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.SUPER_ADMIN]
  },
  {
    path: ROUTE_PATHS.PRICE_LIST_VIEW,
    component: lazy(() => import('./pages/PriceList/Detail' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.SUPER_ADMIN]
  },
  {
    path: ROUTE_PATHS.USER_MANAGEMENT,
    component: lazy(() => import('./pages/AdminManagement' /* webpackChunkName: "app" */)),
    requiredPermissions: ['PERM_VIEW_USER_LIST']
  },
  {
    path: ROUTE_PATHS.FREIGHT,
    component: lazy(() => import('./pages/FreightManagement' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ACCOUNT, ROLES.ACCOUNT_ADMIN]
  },
  {
    path: ROUTE_PATHS.ROOT,
    component: lazy(() => import('./pages/Home' /* webpackChunkName: "app" */))
  }
]);
