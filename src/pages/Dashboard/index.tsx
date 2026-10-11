import {
  DisabledByDefault,
  ArrowOutward,
  Description,
  FilePresent,
  Inventory2,
  LocalShipping,
  MonetizationOn,
  ReceiptLong,
  Search,
  TrendingUp
} from '@mui/icons-material';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import { Wrapper } from 'components/Styled';
import { useAuth } from 'auth/AuthContext';
import { Page } from 'layout/LayoutRoute';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Chart } from 'react-google-charts';
import { useQuery } from 'react-query';
import { Link as RouterLink } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { getDashboard } from 'services/Dashboard/dashboard-api';
import {
  DashboardDateRange,
  DashboardData,
  DashboardDistributionChart,
  DashboardMetric,
  DashboardQuickLink,
  DashboardTrendChart,
  DashboardWorkQueue
} from 'services/Dashboard/dashboard-type';
import { getEmployeesByPosition, getSales } from 'services/Sales/sales-api';
import { SalesRecord } from 'services/Sales/sales-type';
import { DEFAULT_DATE_FORMAT_BFF } from 'utils';
import 'rsuite/dist/rsuite.min.css';
import { buildMonthlyBarData } from './chartData';
import {
  DASHBOARD_BRAND,
  getDashboardCategoryColor,
  getDashboardSeriesColor,
  getDashboardSliceTextColor
} from './chartColors';

const MAX_MONTH_RANGE = 3;
const BAR_CHART_HEIGHT = '320px';
const BAR_CHART_HEADER_HEIGHT = 88;
const BAR_CHART_AREA = {
  left: 48,
  top: 64,
  right: 16,
  bottom: 88,
  width: '100%',
  height: '53%'
};
const CHART_CARD_SX = { backgroundColor: DASHBOARD_BRAND.ivory, border: `1px solid ${DASHBOARD_BRAND.sand}` };
const CHART_LEGEND = { position: 'top', maxLines: 3, textStyle: { color: DASHBOARD_BRAND.charcoal } };
const CHART_V_AXIS = {
  minValue: 0,
  textStyle: { color: DASHBOARD_BRAND.charcoal },
  gridlines: { color: DASHBOARD_BRAND.sand },
  baselineColor: DASHBOARD_BRAND.sand
};

export default function Dashboard(): JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const { getRole } = useAuth();
  const role = getRole();
  const defaultSelectedMonths = useMemo(() => {
    const endMonth = dayjs().startOf('month').subtract(1, 'month');
    return {
      from: endMonth.subtract(MAX_MONTH_RANGE - 1, 'month').format('YYYY-MM'),
      to: endMonth.format('YYYY-MM')
    };
  }, []);
  const [selectedMonths, setSelectedMonths] = useState(defaultSelectedMonths);
  const [dateRange, setDateRange] = useState<Pick<DashboardDateRange, 'salesId' | 'procurementId'>>({
    salesId: '',
    procurementId: ''
  });
  const monthOptions = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('th-TH', {
      month: 'long',
      year: 'numeric'
    });

    return Array.from({ length: 12 }, (_value, index) => {
      const monthDate = dayjs().subtract(11 - index, 'month');

      return {
        value: monthDate.format('YYYY-MM'),
        label: formatter.format(monthDate.toDate())
      };
    });
  }, []);
  const earliestStartMonth = dayjs(`${selectedMonths.to}-01`)
    .subtract(MAX_MONTH_RANGE - 1, 'month')
    .format('YYYY-MM');
  const latestEndMonth = dayjs(`${selectedMonths.from}-01`)
    .add(MAX_MONTH_RANGE - 1, 'month')
    .format('YYYY-MM');
  const selectedMonthRange = useMemo<DashboardDateRange>(
    () => ({
      dateFrom: dayjs(`${selectedMonths.from}-01`).startOf('month').format(DEFAULT_DATE_FORMAT_BFF),
      dateTo: dayjs(`${selectedMonths.to}-01`).endOf('month').format(DEFAULT_DATE_FORMAT_BFF),
      salesId: dateRange.salesId,
      procurementId: dateRange.procurementId
    }),
    [dateRange.procurementId, dateRange.salesId, selectedMonths.from, selectedMonths.to]
  );
  const [appliedRange, setAppliedRange] = useState<DashboardDateRange>(selectedMonthRange);

  const { data: salesOptions = [], isFetching: isSalesFetching } = useQuery(
    ['dashboard-sales-options'],
    () => getSales(1, 100),
    {
      refetchOnWindowFocus: false
    }
  );

  const { data: procurementOptions = [], isFetching: isProcurementFetching } = useQuery(
    ['dashboard-procurement-options'],
    () => getEmployeesByPosition('PROCUREMENT', 1, 100),
    {
      refetchOnWindowFocus: false
    }
  );

  const { data, isFetching, isError, refetch } = useQuery<DashboardData>(
    [
      'dashboard',
      role,
      appliedRange.dateFrom,
      appliedRange.dateTo,
      appliedRange.salesId,
      appliedRange.procurementId
    ],
    () => getDashboard(appliedRange),
    {
      enabled: false,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchInterval: false
    }
  );

  useEffect(() => {
    refetch();
  }, [appliedRange, refetch]);

  const canSee = (visibleTo?: string[]) => !visibleTo?.length || visibleTo.includes(role);
  const translateLabel = (value?: string) =>
    value && value.startsWith('dashboard.') ? t(value) : value || '';

  const metrics = useMemo(
    () => (data?.metrics || []).filter((item) => canSee(item.visibleTo)),
    [data?.metrics, role]
  );
  const trendCharts = useMemo(
    () => (data?.trendCharts || []).filter((item) =>
      canSee(item.visibleTo) &&
      !(item.id === 'rfq-stage-progress' && item.title === 'dashboard.rfq.charts.salesFlow.title')
    ),
    [data?.trendCharts, role]
  );
  const selectedMonthVolumeChart = useMemo(
    () =>
      trendCharts
        .find((item) => item.id === 'rfq-volume' && canSee(item.visibleTo)) ||
      null,
    [trendCharts, role]
  );
  const selectedMonthVolumeChartData = useMemo(() => {
    if (!selectedMonthVolumeChart) {
      return null;
    }

    return [
      ['Month', ...selectedMonthVolumeChart.series.map((series) => series.name), { role: 'annotation' }],
      ...selectedMonthVolumeChart.labels.map((label, index) => {
        const values = selectedMonthVolumeChart.series.map((series) => series.data[index] || 0);
        const total = values.reduce((sum, value) => sum + value, 0);
        const month = /^(0[1-9]|1[0-2])\/(\d{4})$/.exec(label);
        const displayLabel = month ? `${month[1]}/${Number(month[2]) + 543}` : label;

        return [displayLabel, ...values, total ? String(total) : null];
      })
    ];
  }, [selectedMonthVolumeChart]);
  const acceptWorkDurationChart = useMemo(
    () => (data?.acceptWorkDurationChart && canSee(data.acceptWorkDurationChart.visibleTo) ? data.acceptWorkDurationChart : null),
    [data?.acceptWorkDurationChart, role]
  );
  const supplierQuoteDurationChart = useMemo(
    () =>
    (data?.supplierQuoteDurationChart && canSee(data.supplierQuoteDurationChart.visibleTo)
      ? data.supplierQuoteDurationChart
      : null),
    [data?.supplierQuoteDurationChart, role]
  );
  const salesCountChart = useMemo(
    () => (data?.salesCountChart && canSee(data.salesCountChart.visibleTo) ? data.salesCountChart : null),
    [data?.salesCountChart, role]
  );
  const procurementKpiChart = useMemo(
    () => (data?.procurementKpiChart && canSee(data.procurementKpiChart.visibleTo) ? data.procurementKpiChart : null),
    [data?.procurementKpiChart, role]
  );
  const customerTypeCountChart = useMemo(
    () =>
      (data?.customerTypeCountChart && canSee(data.customerTypeCountChart.visibleTo)
        ? data.customerTypeCountChart
        : null),
    [data?.customerTypeCountChart, role]
  );
  const distributionCharts = useMemo(
    () => (data?.distributionCharts || []).filter((item) => canSee(item.visibleTo)),
    [data?.distributionCharts, role]
  );
  const workQueues = useMemo(
    () => (data?.workQueues || []).filter((item) => canSee(item.visibleTo)),
    [data?.workQueues, role]
  );
  const quickLinks = useMemo(
    () => (data?.quickLinks || []).filter((item) => canSee(item.visibleTo)),
    [data?.quickLinks, role]
  );

  const toneColorMap: Record<DashboardMetric['tone'], string> = {
    neutral: DASHBOARD_BRAND.charcoal,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    danger: theme.palette.error.main,
    info: theme.palette.info.main
  };

  const quickLinkIconMap: Record<DashboardQuickLink['icon'], JSX.Element> = {
    rfq: <FilePresent fontSize="small" />,
    quotation: <Description fontSize="small" />,
    purchase: <Inventory2 fontSize="small" />,
    invoice: <ReceiptLong fontSize="small" />,
    billing: <ReceiptLong fontSize="small" />,
    customer: <MonetizationOn fontSize="small" />,
    receive: <LocalShipping fontSize="small" />,
    saleOrder: <TrendingUp fontSize="small" />
  };

  const formatTimestamp = (value?: string) => {
    if (!value) {
      return '-';
    }

    return new Intl.DateTimeFormat('th-TH', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  };

  const chartLoader = (
    <Box sx={{ minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress size={24} />
    </Box>
  );

  const handleClear = () => {
    setSelectedMonths(defaultSelectedMonths);
    setDateRange({ salesId: '', procurementId: '' });
  };

  return (
    <Page>
      <LoadingDialog open={isFetching} />
      <PageTitle title={t('dashboard.rfq.title')} />
      <Wrapper
        sx={{
          background: DASHBOARD_BRAND.ivory,
          border: `1px solid ${DASHBOARD_BRAND.sand}`
        }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ sm: 'center' }}
            justifyContent="flex-end"
            sx={{ width: '100%' }}>
            <Chip
              label={`${t('dashboard.rfq.lastUpdated')}: ${formatTimestamp(data?.generatedAt)}`}
              size="small"
              variant="outlined"
              sx={{ ml: { sm: 'auto' } }}
            />
          </Stack>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label={t('dashboard.filters.monthFrom')}
                value={selectedMonths.from}
                helperText={t('dashboard.filters.monthRangeLimit', { maxMonths: MAX_MONTH_RANGE })}
                InputLabelProps={{ shrink: true }}
                onChange={(event) => {
                  setSelectedMonths((prev) => ({ ...prev, from: event.target.value }));
                }}>
                {monthOptions.map((option) => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                    disabled={option.value > selectedMonths.to || option.value < earliestStartMonth}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label={t('dashboard.filters.monthTo')}
                value={selectedMonths.to}
                helperText={t('dashboard.filters.monthRangeLimit', { maxMonths: MAX_MONTH_RANGE })}
                InputLabelProps={{ shrink: true }}
                onChange={(event) => {
                  setSelectedMonths((prev) => ({ ...prev, to: event.target.value }));
                }}>
                {monthOptions.map((option) => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                    disabled={option.value < selectedMonths.from || option.value > latestEndMonth}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                options={salesOptions}
                loading={isSalesFetching}
                value={salesOptions.find((option) => option.salesId === dateRange.salesId) || null}
                getOptionLabel={(option: SalesRecord) =>
                  `${option.salesId} - ${option.nickname || option.name}`
                }
                isOptionEqualToValue={(option, value) => option.salesId === value.salesId}
                onChange={(_event, value) => {
                  setDateRange((prev) => ({
                    ...prev,
                    salesId: value?.salesId || ''
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label={t('dashboard.filters.sales')}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isSalesFetching ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                options={procurementOptions}
                loading={isProcurementFetching}
                value={
                  procurementOptions.find((option) => option.salesId === dateRange.procurementId) ||
                  null
                }
                getOptionLabel={(option: SalesRecord) =>
                  `${option.salesId} - ${option.nickname || option.name}`
                }
                isOptionEqualToValue={(option, value) => option.salesId === value.salesId}
                onChange={(_event, value) => {
                  setDateRange((prev) => ({
                    ...prev,
                    procurementId: value?.salesId || ''
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label={t('dashboard.filters.procurement')}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isProcurementFetching ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={12}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  variant="contained"
                  startIcon={isFetching ? <CircularProgress size={18} color="inherit" /> : <Search />}
                  disabled={isFetching}
                  onClick={() => setAppliedRange({ ...selectedMonthRange })}>
                  {t('dashboard.filters.viewData')}
                </Button>
                <Button
                  variant="contained"
                  className="btn-amber-orange"
                  startIcon={<DisabledByDefault />}
                  onClick={handleClear}>
                  {t('button.clear')}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </Wrapper>
      {data?.source === 'fallback' || isError ? (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {t('dashboard.fallbackNotice')}
        </Alert>
      ) : null}

      <Wrapper>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('dashboard.rfq.sections.metrics')}
        </Typography>
        {isFetching ? (
          chartLoader
        ) : (
          <Grid container spacing={2}>
            {metrics.map((metric) => (
              <Grid item xs={6} sm={3} key={metric.id}>
                <Box
                  component={metric.href ? RouterLink : 'div'}
                  to={metric.href || undefined}
                  sx={{
                    p: 2.5,
                    minHeight: 160,
                    borderRadius: 3,
                    background: DASHBOARD_BRAND.ivory,
                    border: `1px solid ${DASHBOARD_BRAND.sand}`,
                    boxShadow: '0 10px 30px rgba(31, 42, 28, 0.06)',
                    textDecoration: 'none',
                    display: 'block',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': metric.href
                      ? {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 16px 36px rgba(31, 42, 28, 0.1)'
                      }
                      : undefined
                  }}>
                  <Stack spacing={1.25}>
                    <Typography
                      variant="overline"
                      sx={{ color: toneColorMap[metric.tone], fontWeight: 700 }}>
                      {translateLabel(metric.title)}
                    </Typography>
                    <Typography variant="h2" sx={{ color: DASHBOARD_BRAND.green, fontWeight: 700 }}>
                      {metric.value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: DASHBOARD_BRAND.charcoal }}>
                      {translateLabel(metric.subtitle)}
                    </Typography>
                    {metric.trend ? (
                      <Chip
                        label={metric.trend}
                        size="small"
                        sx={{
                          alignSelf: 'flex-start',
                          backgroundColor: alpha(toneColorMap[metric.tone], 0.1),
                          color: toneColorMap[metric.tone]
                        }}
                      />
                    ) : null}
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Wrapper>

      <Grid container spacing={2}>
        {trendCharts
          .filter((chart) => chart.id !== 'rfq-volume')
          .map((chart) => (
            <Grid item xs={12} lg={6} key={chart.id}>
              <Wrapper sx={CHART_CARD_SX}>
                <Typography variant="h6" sx={{ color: DASHBOARD_BRAND.green }}>{translateLabel(chart.title)}</Typography>
                <Chart
                  chartType="LineChart"
                  width="100%"
                  height="280px"
                  loader={chartLoader}
                  data={[
                    ['Month', ...chart.series.map((series) => series.name)],
                    ...chart.labels.map((label, index) => [
                      label,
                      ...chart.series.map((series) => series.data[index] || 0)
                    ])
                  ]}
                  options={{
                    backgroundColor: 'transparent',
                    colors: chart.series.map(getDashboardSeriesColor),
                    legend: CHART_LEGEND,
                    chartArea: {
                      left: 40,
                      top: 32,
                      right: 16,
                      bottom: 36,
                      width: '100%',
                      height: '70%'
                    },
                    hAxis: { textStyle: { color: DASHBOARD_BRAND.charcoal } },
                    vAxis: CHART_V_AXIS
                  }}
                />
              </Wrapper>
            </Grid>
          ))}
        {selectedMonthVolumeChart ? (
          <Grid item xs={12} lg={6} key={selectedMonthVolumeChart.id}>
            <Wrapper sx={CHART_CARD_SX}>
              <Box sx={{ height: BAR_CHART_HEADER_HEIGHT }}>
                <Typography variant="h6" sx={{ color: DASHBOARD_BRAND.green }}>{translateLabel(selectedMonthVolumeChart.title)}</Typography>
              </Box>
              <Chart
                chartType="ColumnChart"
                width="100%"
                height={BAR_CHART_HEIGHT}
                loader={chartLoader}
                data={selectedMonthVolumeChartData || []}
                options={{
                  backgroundColor: 'transparent',
                  colors: selectedMonthVolumeChart.series.map(getDashboardSeriesColor),
                  legend: CHART_LEGEND,
                  focusTarget: 'category',
                  tooltip: { isHtml: true, trigger: 'focus' },
                  isStacked: true,
                  annotations: {
                    alwaysOutside: true,
                    stem: {
                      color: 'transparent'
                    },
                    textStyle: {
                      color: DASHBOARD_BRAND.charcoal,
                      fontSize: 12,
                      bold: true
                    }
                  },
                  chartArea: BAR_CHART_AREA,
                  hAxis: {
                    textStyle: { color: DASHBOARD_BRAND.charcoal },
                    slantedText: true,
                    slantedTextAngle: 45
                  },
                  vAxis: {
                    ...CHART_V_AXIS,
                    maxValue: 400,
                    format: '0'
                  },
                  bar: { groupWidth: 48 }
                }}
              />
            </Wrapper>
          </Grid>
        ) : null}
        {acceptWorkDurationChart ? (
          <Grid item xs={12} lg={6} key={acceptWorkDurationChart.id}>
            <Wrapper sx={CHART_CARD_SX}>
              <Box sx={{ height: BAR_CHART_HEADER_HEIGHT }}>
                <Typography variant="h6" sx={{ color: DASHBOARD_BRAND.green }}>{translateLabel(acceptWorkDurationChart.title)}</Typography>
              </Box>
              <Chart
                chartType="ColumnChart"
                width="100%"
                height={BAR_CHART_HEIGHT}
                loader={chartLoader}
                data={buildMonthlyBarData(
                  acceptWorkDurationChart.labels,
                  acceptWorkDurationChart.series,
                  translateLabel
                )}
                options={{
                  backgroundColor: 'transparent',
                  legend: CHART_LEGEND,
                  colors: acceptWorkDurationChart.series.map(getDashboardSeriesColor),
                  isStacked: false,
                  chartArea: BAR_CHART_AREA,
                  hAxis: {
                    textStyle: { color: DASHBOARD_BRAND.charcoal },
                    slantedText: true,
                    slantedTextAngle: 30
                  },
                  annotations: {
                    alwaysOutside: true,
                    stem: {
                      color: 'transparent'
                    },
                    textStyle: {
                      color: DASHBOARD_BRAND.charcoal,
                      fontSize: 12,
                      bold: true
                    }
                  },
                  vAxis: CHART_V_AXIS
                }}
              />
            </Wrapper>
          </Grid>
        ) : null}
        {supplierQuoteDurationChart ? (
          <Grid item xs={12} lg={6} key={supplierQuoteDurationChart.id}>
            <Wrapper sx={CHART_CARD_SX}>
              <Box sx={{ height: BAR_CHART_HEADER_HEIGHT }}>
                <Typography variant="h6" sx={{ color: DASHBOARD_BRAND.green }}>{translateLabel(supplierQuoteDurationChart.title)}</Typography>
              </Box>
              <Chart
                chartType="ColumnChart"
                width="100%"
                height={BAR_CHART_HEIGHT}
                loader={chartLoader}
                data={buildMonthlyBarData(
                  supplierQuoteDurationChart.labels,
                  supplierQuoteDurationChart.series,
                  translateLabel
                )}
                options={{
                  backgroundColor: 'transparent',
                  legend: CHART_LEGEND,
                  colors: supplierQuoteDurationChart.series.map(getDashboardSeriesColor),
                  isStacked: false,
                  chartArea: BAR_CHART_AREA,
                  hAxis: {
                    textStyle: { color: DASHBOARD_BRAND.charcoal },
                    slantedText: true,
                    slantedTextAngle: 30
                  },
                  annotations: {
                    alwaysOutside: true,
                    stem: {
                      color: 'transparent'
                    },
                    textStyle: {
                      color: DASHBOARD_BRAND.charcoal,
                      fontSize: 12,
                      bold: true
                    }
                  },
                  vAxis: CHART_V_AXIS
                }}
              />
            </Wrapper>
          </Grid>
        ) : null}
        {procurementKpiChart ? (
          <Grid item xs={12} lg={6} key={procurementKpiChart.id}>
            <Wrapper sx={CHART_CARD_SX}>
              <Box sx={{ height: BAR_CHART_HEADER_HEIGHT }}>
                <Typography variant="h6" sx={{ color: DASHBOARD_BRAND.green }}>{translateLabel(procurementKpiChart.title)}</Typography>
                <Typography
                  variant="body2"
                  title={translateLabel(procurementKpiChart.subtitle)}
                  sx={{
                    color: DASHBOARD_BRAND.charcoal,
                    mt: 0.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                  {translateLabel(procurementKpiChart.subtitle)}
                </Typography>
              </Box>
              <Chart
                chartType="ColumnChart"
                width="100%"
                height={BAR_CHART_HEIGHT}
                loader={chartLoader}
                data={buildMonthlyBarData(
                  procurementKpiChart.labels,
                  procurementKpiChart.series,
                  translateLabel
                )}
                options={{
                  backgroundColor: 'transparent',
                  legend: CHART_LEGEND,
                  colors: procurementKpiChart.series.map(getDashboardSeriesColor),
                  isStacked: false,
                  chartArea: BAR_CHART_AREA,
                  hAxis: {
                    textStyle: { color: DASHBOARD_BRAND.charcoal, fontSize: 11 },
                    slantedText: true,
                    slantedTextAngle: 45
                  },
                  vAxis: { ...CHART_V_AXIS, format: '0' },
                  annotations: { alwaysOutside: true, textStyle: { color: DASHBOARD_BRAND.charcoal } }
                }}
              />
            </Wrapper>
          </Grid>
        ) : null}
        {salesCountChart ? (
          <Grid item xs={12} lg={6} key={salesCountChart.id}>
            <Wrapper sx={CHART_CARD_SX}>
              <Typography variant="h6" sx={{ color: DASHBOARD_BRAND.green }}>{translateLabel(salesCountChart.title)}</Typography>
              <Chart
                chartType="ColumnChart"
                width="100%"
                height="320px"
                loader={chartLoader}
                data={buildMonthlyBarData(
                  salesCountChart.items.map((item) => item.label),
                  salesCountChart.series || [{ name: 'Count', data: salesCountChart.items.map((item) => item.value) }]
                )}
                options={{
                  backgroundColor: 'transparent',
                  legend: CHART_LEGEND,
                  colors: (salesCountChart.series || [{ name: 'Count', data: [] }]).map(getDashboardSeriesColor),
                  isStacked: false,
                  chartArea: {
                    left: 48,
                    top: 64,
                    right: 16,
                    bottom: 72,
                    width: '100%',
                    height: '58%'
                  },
                  hAxis: {
                    textStyle: { color: DASHBOARD_BRAND.charcoal },
                    slantedText: true,
                    slantedTextAngle: 30
                  },
                  annotations: {
                    alwaysOutside: true,
                    stem: {
                      color: 'transparent'
                    },
                    textStyle: {
                      color: DASHBOARD_BRAND.charcoal,
                      fontSize: 12,
                      bold: true
                    }
                  },
                  vAxis: CHART_V_AXIS,
                  bar: { groupWidth: '72%' }
                }}
              />
            </Wrapper>
          </Grid>
        ) : null}
        {customerTypeCountChart ? (
          <Grid item xs={12} lg={6} key={customerTypeCountChart.id}>
            <Wrapper sx={CHART_CARD_SX}>
              <Typography variant="h6" sx={{ color: DASHBOARD_BRAND.green }}>{translateLabel(customerTypeCountChart.title)}</Typography>
              <Chart
                chartType="ColumnChart"
                width="100%"
                height="320px"
                loader={chartLoader}
                data={buildMonthlyBarData(
                  customerTypeCountChart.items.map((item) => item.label),
                  customerTypeCountChart.series || [{ name: 'Count', data: customerTypeCountChart.items.map((item) => item.value) }]
                )}
                options={{
                  backgroundColor: 'transparent',
                  legend: CHART_LEGEND,
                  colors: (customerTypeCountChart.series || [{ name: 'Count', data: [] }]).map(getDashboardSeriesColor),
                  isStacked: false,
                  chartArea: {
                    left: 48,
                    top: 64,
                    right: 16,
                    bottom: 72,
                    width: '100%',
                    height: '58%'
                  },
                  hAxis: {
                    textStyle: { color: DASHBOARD_BRAND.charcoal },
                    slantedText: true,
                    slantedTextAngle: 30
                  },
                  annotations: {
                    alwaysOutside: true,
                    stem: {
                      color: 'transparent'
                    },
                    textStyle: {
                      color: DASHBOARD_BRAND.charcoal,
                      fontSize: 12,
                      bold: true
                    }
                  },
                  vAxis: CHART_V_AXIS,
                  bar: { groupWidth: '72%' }
                }}
              />
            </Wrapper>
          </Grid>
        ) : null}
        {distributionCharts.map((chart) => (
          <Grid item xs={12} lg={6} key={chart.id}>
            <Wrapper sx={CHART_CARD_SX}>
              <Typography variant="h6" sx={{ color: DASHBOARD_BRAND.green }}>{translateLabel(chart.title)}</Typography>
              <Chart
                chartType="PieChart"
                width="100%"
                height="280px"
                loader={chartLoader}
                data={[['Category', 'Count'], ...chart.items.map((item) => [translateLabel(item.label), item.value])]}
                options={{
                  backgroundColor: 'transparent',
                  pieHole: 0.58,
                  legend: { position: 'right', textStyle: { color: DASHBOARD_BRAND.charcoal } },
                  colors: chart.items.map((item, index) => getDashboardCategoryColor(item.color, index)),
                  pieSliceBorderColor: DASHBOARD_BRAND.ivory,
                  pieResidueSliceColor: DASHBOARD_BRAND.sand,
                  slices: chart.items.map((item, index) => ({
                    textStyle: { color: getDashboardSliceTextColor(getDashboardCategoryColor(item.color, index)) }
                  })),
                  chartArea: {
                    left: 16,
                    top: 24,
                    right: 16,
                    bottom: 16,
                    width: '95%',
                    height: '85%'
                  }
                }}
              />
            </Wrapper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} xl={4}>
          <Wrapper>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('dashboard.rfq.sections.quickLinks')}
            </Typography>
            <Stack spacing={1.5}>
              {quickLinks.map((item) => (
                <Button
                  key={item.id}
                  component={RouterLink}
                  to={item.href}
                  variant="outlined"
                  sx={{
                    justifyContent: 'flex-start',
                    px: 2,
                    py: 1.5,
                    borderRadius: 3,
                    color: DASHBOARD_BRAND.green,
                    borderColor: DASHBOARD_BRAND.sand
                  }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" width="100%">
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        display: 'grid',
                        placeItems: 'center',
                        backgroundColor: DASHBOARD_BRAND.sand,
                        color: DASHBOARD_BRAND.green
                      }}>
                      {quickLinkIconMap[item.icon]}
                    </Box>
                    <Box sx={{ textAlign: 'left', flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {translateLabel(item.title)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {translateLabel(item.description)}
                      </Typography>
                    </Box>
                    <ArrowOutward sx={{ fontSize: 18 }} />
                  </Stack>
                </Button>
              ))}
            </Stack>
          </Wrapper>
        </Grid>
      </Grid>
    </Page>
  );
}
