import dayjs from 'dayjs';
import { DashboardSeries } from 'services/Dashboard/dashboard-type';

export function formatMonthLabel(value: string): string {
  if (!/^\d{4}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat('th-TH', { month: 'short', year: 'numeric' })
    .format(dayjs(`${value}-01`).toDate());
}

export function buildMonthlyBarData(
  labels: string[],
  series: DashboardSeries[],
  translateLabel: (value: string) => string = (value) => value
) {
  return [
    ['Category', ...series.flatMap((item) => [formatMonthLabel(item.name), { role: 'annotation' }])],
    ...labels.map((label, index) => [
      translateLabel(label),
      ...series.flatMap((item) => {
        const value = item.data[index] || 0;
        return [value, String(value)];
      })
    ])
  ];
}
