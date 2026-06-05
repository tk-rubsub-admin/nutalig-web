import { api } from 'api/api';
import { ROLES } from 'auth/roles';
import { ROUTE_PATHS } from 'routes';
import {
  DashboardDateRange,
  DashboardData,
  DashboardDistributionChart,
  DashboardMetric,
  DashboardQuickLink,
  DashboardTrendChart,
  DashboardWorkQueue
} from './dashboard-type';

const ADMIN_OPS_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.ADMIN_BKK,
  ROLES.ADMIN_PROVINCE,
  ROLES.ACCOUNT,
  ROLES.ACCOUNT_ADMIN,
  ROLES.ORDER_BKK,
  ROLES.ORDER_PROVINCE
];

const SALES_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SALES, ROLES.SALES_ADMIN];

const PROCUREMENT_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PROCUREMENT];

interface DashboardApiResponse {
  data?: DashboardData;
}

const buildMetrics = (): DashboardMetric[] => [
  {
    id: 'rfq-new',
    title: 'dashboard.metrics.rfqNew',
    value: 18,
    subtitle: 'dashboard.metrics.rfqNewSubtitle',
    trend: '+12%',
    tone: 'info',
    visibleTo: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.SALES,
      ROLES.SALES_ADMIN,
      ROLES.PROCUREMENT,
      ROLES.PROCUREMENT_ADMIN
    ]
  },
  {
    id: 'quotation-new',
    title: 'dashboard.metrics.quotationNew',
    value: 11,
    subtitle: 'dashboard.metrics.quotationNewSubtitle',
    trend: '+8%',
    tone: 'success',
    visibleTo: SALES_ROLES
  },
  {
    id: 'sale-order-new',
    title: 'dashboard.metrics.saleOrderNew',
    value: 9,
    subtitle: 'dashboard.metrics.saleOrderNewSubtitle',
    trend: '+5%',
    tone: 'neutral',
    visibleTo: [...ADMIN_OPS_ROLES, ...SALES_ROLES]
  },
  {
    id: 'invoice-overdue',
    title: 'dashboard.metrics.invoiceOverdue',
    value: 6,
    subtitle: 'dashboard.metrics.invoiceOverdueSubtitle',
    trend: '2 urgent',
    tone: 'warning',
    visibleTo: [...ADMIN_OPS_ROLES, ...SALES_ROLES]
  },
  {
    id: 'purchase-pending',
    title: 'dashboard.metrics.purchasePending',
    value: 14,
    subtitle: 'dashboard.metrics.purchasePendingSubtitle',
    trend: '4 due today',
    tone: 'danger',
    visibleTo: [...ADMIN_OPS_ROLES, ...PROCUREMENT_ROLES]
  }
];

const buildTrendCharts = (): DashboardTrendChart[] => [
  {
    id: 'document-volume',
    title: 'dashboard.charts.documentVolumeTitle',
    subtitle: 'dashboard.charts.documentVolumeSubtitle',
    labels: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    series: [
      { name: 'RFQ', data: [2, 1, 4, 3, 2, 4, 2], color: '#2f80ed' },
      { name: 'Quotation', data: [1, 1, 2, 2, 3, 1, 1], color: '#27ae60' },
      { name: 'Sale Order', data: [0, 1, 2, 1, 2, 2, 1], color: '#f2994a' }
    ]
  },
  {
    id: 'team-load',
    title: 'dashboard.charts.teamLoadTitle',
    subtitle: 'dashboard.charts.teamLoadSubtitle',
    labels: ['Sales', 'Procurement', 'Billing', 'Invoice'],
    series: [{ name: 'Open items', data: [12, 14, 6, 5], color: '#7b61ff' }],
    visibleTo: [...ADMIN_OPS_ROLES, ROLES.SUPER_ADMIN]
  }
];

const buildDistributionCharts = (): DashboardDistributionChart[] => [
  {
    id: 'sales-pipeline',
    title: 'dashboard.charts.salesPipelineTitle',
    subtitle: 'dashboard.charts.salesPipelineSubtitle',
    items: [
      { label: 'New', value: 12, color: '#2f80ed' },
      { label: 'Pending', value: 9, color: '#f2c94c' },
      { label: 'Approved', value: 7, color: '#27ae60' },
      { label: 'Cancelled', value: 2, color: '#eb5757' }
    ],
    visibleTo: SALES_ROLES
  },
  {
    id: 'procurement-status',
    title: 'dashboard.charts.procurementStatusTitle',
    subtitle: 'dashboard.charts.procurementStatusSubtitle',
    items: [
      { label: 'Waiting', value: 8, color: '#2d9cdb' },
      { label: 'Buying', value: 11, color: '#f2994a' },
      { label: 'Receiving', value: 5, color: '#27ae60' },
      { label: 'Blocked', value: 2, color: '#eb5757' }
    ],
    visibleTo: PROCUREMENT_ROLES
  },
  {
    id: 'finance-status',
    title: 'dashboard.charts.financeStatusTitle',
    subtitle: 'dashboard.charts.financeStatusSubtitle',
    items: [
      { label: 'Ready to bill', value: 4, color: '#56ccf2' },
      { label: 'Issued', value: 10, color: '#6fcf97' },
      { label: 'Overdue', value: 6, color: '#f2994a' },
      { label: 'Paid', value: 15, color: '#219653' }
    ],
    visibleTo: ADMIN_OPS_ROLES
  }
];

const buildWorkQueues = (): DashboardWorkQueue[] => [
  {
    id: 'rfq-follow-up',
    title: 'dashboard.queues.rfqFollowUpTitle',
    subtitle: 'dashboard.queues.rfqFollowUpSubtitle',
    count: 8,
    href: ROUTE_PATHS.RFQ_MANAGEMENT,
    visibleTo: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SALES, ROLES.SALES_ADMIN],
    items: [
      {
        id: 'RFQ-240501-001',
        title: 'RFQ-240501-001',
        meta: 'Acme Food / 2 hrs ago',
        status: 'New',
        href: ROUTE_PATHS.RFQ_MANAGEMENT
      },
      {
        id: 'RFQ-240501-002',
        title: 'RFQ-240501-002',
        meta: 'Blue Farm / 4 hrs ago',
        status: 'Contact today',
        href: ROUTE_PATHS.RFQ_MANAGEMENT
      },
      {
        id: 'RFQ-240430-004',
        title: 'RFQ-240430-004',
        meta: 'Green Pack / Yesterday',
        status: 'Pending quote',
        href: ROUTE_PATHS.RFQ_MANAGEMENT
      }
    ]
  },
  {
    id: 'quotation-expiring',
    title: 'dashboard.queues.quotationExpiringTitle',
    subtitle: 'dashboard.queues.quotationExpiringSubtitle',
    count: 5,
    href: ROUTE_PATHS.QUOTATION_MANAGEMENT,
    visibleTo: SALES_ROLES,
    items: [
      {
        id: 'QT-240501-011',
        title: 'QT-240501-011',
        meta: 'Nutrimax / expires tomorrow',
        status: 'Urgent',
        href: ROUTE_PATHS.QUOTATION_MANAGEMENT
      },
      {
        id: 'QT-240430-009',
        title: 'QT-240430-009',
        meta: 'Prime Foods / 2 days left',
        status: 'Follow-up',
        href: ROUTE_PATHS.QUOTATION_MANAGEMENT
      },
      {
        id: 'QT-240429-007',
        title: 'QT-240429-007',
        meta: 'Siam Agri / 2 days left',
        status: 'Waiting customer',
        href: ROUTE_PATHS.QUOTATION_MANAGEMENT
      }
    ]
  },
  {
    id: 'po-action',
    title: 'dashboard.queues.purchaseOrderTitle',
    subtitle: 'dashboard.queues.purchaseOrderSubtitle',
    count: 14,
    href: ROUTE_PATHS.PURCHASE_ORDER_MANAGEMENT,
    visibleTo: [...ADMIN_OPS_ROLES, ...PROCUREMENT_ROLES],
    items: [
      {
        id: 'PO-240501-010',
        title: 'PO-240501-010',
        meta: 'Supplier confirm pending',
        status: 'Buying',
        href: ROUTE_PATHS.PURCHASE_ORDER_MANAGEMENT
      },
      {
        id: 'PO-240501-012',
        title: 'PO-240501-012',
        meta: 'Need receive today',
        status: 'Receiving',
        href: ROUTE_PATHS.PURCHASE_ORDER_MANAGEMENT
      },
      {
        id: 'PO-240430-008',
        title: 'PO-240430-008',
        meta: 'Re-create required',
        status: 'Blocked',
        href: ROUTE_PATHS.PURCHASE_ORDER_MANAGEMENT
      }
    ]
  },
  {
    id: 'invoice-overdue',
    title: 'dashboard.queues.invoiceOverdueTitle',
    subtitle: 'dashboard.queues.invoiceOverdueSubtitle',
    count: 6,
    href: ROUTE_PATHS.INVOICE_MANAGEMENT,
    visibleTo: [...ADMIN_OPS_ROLES, ...SALES_ROLES],
    items: [
      {
        id: 'INV-240426-003',
        title: 'INV-240426-003',
        meta: 'Overdue 5 days',
        status: 'Overdue',
        href: ROUTE_PATHS.INVOICE_MANAGEMENT
      },
      {
        id: 'INV-240427-005',
        title: 'INV-240427-005',
        meta: 'Overdue 3 days',
        status: 'Overdue',
        href: ROUTE_PATHS.INVOICE_MANAGEMENT
      },
      {
        id: 'INV-240428-008',
        title: 'INV-240428-008',
        meta: 'Due today',
        status: 'Today',
        href: ROUTE_PATHS.INVOICE_MANAGEMENT
      }
    ]
  }
];

const buildQuickLinks = (): DashboardQuickLink[] => [
  {
    id: 'create-rfq',
    title: 'dashboard.quickLinks.createRfq',
    description: 'dashboard.quickLinks.createRfqDesc',
    href: ROUTE_PATHS.RFQ_CREATE,
    icon: 'rfq',
    visibleTo: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SALES, ROLES.SALES_ADMIN]
  },
  {
    id: 'quotation-list',
    title: 'dashboard.quickLinks.quotationList',
    description: 'dashboard.quickLinks.quotationListDesc',
    href: ROUTE_PATHS.QUOTATION_MANAGEMENT,
    icon: 'quotation',
    visibleTo: SALES_ROLES
  },
  {
    id: 'purchase-orders',
    title: 'dashboard.quickLinks.purchaseOrders',
    description: 'dashboard.quickLinks.purchaseOrdersDesc',
    href: ROUTE_PATHS.PURCHASE_ORDER_MANAGEMENT,
    icon: 'purchase',
    visibleTo: [...ADMIN_OPS_ROLES, ...PROCUREMENT_ROLES]
  },
  {
    id: 'invoice-center',
    title: 'dashboard.quickLinks.invoiceCenter',
    description: 'dashboard.quickLinks.invoiceCenterDesc',
    href: ROUTE_PATHS.INVOICE_MANAGEMENT,
    icon: 'invoice',
    visibleTo: [...ADMIN_OPS_ROLES, ...SALES_ROLES]
  },
  {
    id: 'customer-list',
    title: 'dashboard.quickLinks.customerList',
    description: 'dashboard.quickLinks.customerListDesc',
    href: ROUTE_PATHS.CUSTOMER_MANAGEMENT,
    icon: 'customer',
    visibleTo: [...ADMIN_OPS_ROLES, ...SALES_ROLES]
  },
  {
    id: 'receive-product',
    title: 'dashboard.quickLinks.receiveProduct',
    description: 'dashboard.quickLinks.receiveProductDesc',
    href: ROUTE_PATHS.RECEIVE_PRODUCT,
    icon: 'receive',
    visibleTo: PROCUREMENT_ROLES
  }
];

const buildFallbackDashboard = ({ dateFrom, dateTo }: DashboardDateRange): DashboardData => ({
  range: 'CUSTOM',
  dateFrom,
  dateTo,
  generatedAt: new Date().toISOString(),
  source: 'fallback',
  metrics: buildMetrics(),
  trendCharts: buildTrendCharts(),
  distributionCharts: buildDistributionCharts(),
  workQueues: buildWorkQueues(),
  quickLinks: buildQuickLinks()
});

export const getDashboard = async ({
  dateFrom,
  dateTo
}: DashboardDateRange): Promise<DashboardData> => {
  try {
    const response = await api.get<DashboardApiResponse | DashboardData>('/v1/dashboard', {
      params: {
        range: 'CUSTOM',
        dateFrom,
        dateTo
      }
    });
    const payload =
      (response.data as DashboardApiResponse)?.data || (response.data as DashboardData);

    if (!payload) {
      throw new Error('Dashboard payload is empty');
    }

    return {
      ...payload,
      dateFrom: payload.dateFrom || dateFrom,
      dateTo: payload.dateTo || dateTo,
      source: 'api'
    };
  } catch (error: any) {
    if (error?.response?.status && error.response.status < 500 && error.response.status !== 404) {
      throw error;
    }

    return buildFallbackDashboard({ dateFrom, dateTo });
  }
};
