export type DashboardRange = 'LAST_7_DAYS' | 'CUSTOM';

export interface DashboardDateRange {
  dateFrom: string;
  dateTo: string;
}

export interface DashboardMetric {
  id: string;
  title: string;
  value: number | string;
  subtitle: string;
  trend?: string;
  tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  visibleTo?: string[];
}

export interface DashboardSeries {
  name: string;
  data: number[];
  color?: string;
}

export interface DashboardTrendChart {
  id: string;
  title: string;
  subtitle: string;
  labels: string[];
  series: DashboardSeries[];
  visibleTo?: string[];
}

export interface DashboardDistributionItem {
  label: string;
  value: number;
  color?: string;
}

export interface DashboardDistributionChart {
  id: string;
  title: string;
  subtitle: string;
  items: DashboardDistributionItem[];
  visibleTo?: string[];
}

export interface DashboardQueueItem {
  id: string;
  title: string;
  meta: string;
  status: string;
  href: string;
}

export interface DashboardWorkQueue {
  id: string;
  title: string;
  subtitle: string;
  count: number;
  href: string;
  items: DashboardQueueItem[];
  visibleTo?: string[];
}

export interface DashboardQuickLink {
  id: string;
  title: string;
  description: string;
  href: string;
  icon:
    | 'rfq'
    | 'quotation'
    | 'purchase'
    | 'invoice'
    | 'billing'
    | 'customer'
    | 'receive'
    | 'saleOrder';
  visibleTo?: string[];
}

export interface DashboardData {
  range: DashboardRange;
  dateFrom?: string;
  dateTo?: string;
  generatedAt: string;
  source: 'api' | 'fallback';
  metrics: DashboardMetric[];
  trendCharts: DashboardTrendChart[];
  distributionCharts: DashboardDistributionChart[];
  workQueues: DashboardWorkQueue[];
  quickLinks: DashboardQuickLink[];
}
