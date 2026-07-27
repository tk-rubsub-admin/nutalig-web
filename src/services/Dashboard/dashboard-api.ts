import { api } from 'api/api';
import {
  DashboardDateRange,
  DashboardData
} from './dashboard-type';

interface DashboardApiResponse {
  data?: DashboardData;
}

const buildFallbackDashboard = ({ dateFrom, dateTo }: DashboardDateRange): DashboardData => ({
  range: 'CUSTOM',
  dateFrom,
  dateTo,
  generatedAt: new Date().toISOString(),
  source: 'fallback',
  metrics: [],
  trendCharts: [],
  distributionCharts: [],
  workQueues: [],
  quickLinks: []
});

export const getDashboard = async ({
  dateFrom,
  dateTo,
  salesId,
  procurementId
}: DashboardDateRange): Promise<DashboardData> => {
  try {
    const response = await api.get<DashboardApiResponse | DashboardData>('/v1/dashboard', {
      params: {
        range: 'CUSTOM',
        dateFrom,
        dateTo,
        ...(salesId ? { salesId } : {}),
        ...(procurementId ? { procurementId } : {})
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
