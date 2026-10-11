import { DashboardSeries } from 'services/Dashboard/dashboard-type';
import { BRAND_COLORS } from 'theme/brandTokens';

// NUTALIG CI Active Source Rev.03, page 7: locked brand tokens.
export const DASHBOARD_BRAND = BRAND_COLORS;

// Extra data categories use tints of the locked colors, rather than new brand hues.
export const DASHBOARD_CHART_PALETTE: readonly string[] = [
  DASHBOARD_BRAND.green,
  DASHBOARD_BRAND.terracotta,
  DASHBOARD_BRAND.sand,
  DASHBOARD_BRAND.charcoal,
  '#6B7E77', // Green + 35% Ivory
  '#B58F80', // Terracotta + 35% Ivory
  '#ABA097', // Sand + 25% Charcoal
  '#ABB4AE', // Green + 65% Ivory
  '#D4BDB2', // Terracotta + 65% Ivory
  '#94928E' // Charcoal + 50% Ivory
];

const MONTH_COLORS = [DASHBOARD_BRAND.green, DASHBOARD_BRAND.terracotta, DASHBOARD_BRAND.sand];

export function getDashboardCategoryColor(color: string | undefined, index: number): string {
  const normalized = color?.toUpperCase();
  return normalized && DASHBOARD_CHART_PALETTE.includes(normalized)
    ? normalized
    : DASHBOARD_CHART_PALETTE[index % DASHBOARD_CHART_PALETTE.length];
}

export function getDashboardSeriesColor(series: DashboardSeries, index: number): string {
  const month = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(series.name);
  if (month) return MONTH_COLORS[(Number(month[2]) - 1) % MONTH_COLORS.length];
  if (/เร่งด่วน|urgent/i.test(series.name)) return DASHBOARD_BRAND.terracotta;
  if (/งานปกติ|normal/i.test(series.name)) return DASHBOARD_BRAND.green;
  return getDashboardCategoryColor(series.color, index);
}

function luminance(color: string): number {
  const rgb = [1, 3, 5].map((offset) => parseInt(color.slice(offset, offset + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

export function getDashboardSliceTextColor(fill: string): string {
  const background = luminance(fill);
  const ivoryContrast = (luminance(DASHBOARD_BRAND.ivory) + 0.05) / (background + 0.05);
  const charcoalContrast = (background + 0.05) / (luminance(DASHBOARD_BRAND.charcoal) + 0.05);
  return ivoryContrast >= charcoalContrast ? DASHBOARD_BRAND.ivory : DASHBOARD_BRAND.charcoal;
}
