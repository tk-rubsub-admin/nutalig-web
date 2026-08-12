import {
  DisabledByDefault,
  ArrowOutward,
  Description,
  FilePresent,
  Inventory2,
  LocalShipping,
  MonetizationOn,
  ReceiptLong,
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
import { useTheme } from '@mui/material/styles';
import PageTitle from 'components/PageTitle';
import { Wrapper } from 'components/Styled';
import { useAuth } from 'auth/AuthContext';
import { Page } from 'layout/LayoutRoute';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
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

export default function Dashboard(): JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const { getRole } = useAuth();
  const role = getRole();
  const defaultSelectedMonth = useMemo(() => dayjs().format('YYYY-MM'), []);
  const [selectedMonth, setSelectedMonth] = useState(defaultSelectedMonth);
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
  const selectedMonthRange = useMemo<DashboardDateRange>(
    () => ({
      dateFrom: dayjs(`${selectedMonth}-01`).startOf('month').format(DEFAULT_DATE_FORMAT_BFF),
      dateTo: dayjs(`${selectedMonth}-01`).endOf('month').format(DEFAULT_DATE_FORMAT_BFF),
      salesId: dateRange.salesId,
      procurementId: dateRange.procurementId
    }),
    [dateRange.procurementId, dateRange.salesId, selectedMonth]
  );
  const currentMonthRange = useMemo<DashboardDateRange>(
    () => ({
      dateFrom: dayjs().startOf('month').format(DEFAULT_DATE_FORMAT_BFF),
      dateTo: dayjs().endOf('month').format(DEFAULT_DATE_FORMAT_BFF),
      salesId: dateRange.salesId,
      procurementId: dateRange.procurementId
    }),
    [dateRange.procurementId, dateRange.salesId]
  );

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
      selectedMonthRange.dateFrom,
      selectedMonthRange.dateTo,
      dateRange.salesId,
      dateRange.procurementId
    ],
    () => getDashboard(selectedMonthRange),
    {
      refetchOnWindowFocus: false
    }
  );

  const { data: currentMonthData } = useQuery<DashboardData>(
    [
      'dashboard-current-month-volume',
      role,
      currentMonthRange.dateFrom,
      currentMonthRange.dateTo,
      currentMonthRange.salesId,
      currentMonthRange.procurementId
    ],
    () => getDashboard(currentMonthRange),
    {
      refetchOnWindowFocus: false
    }
  );

  const canSee = (visibleTo?: string[]) => !visibleTo?.length || visibleTo.includes(role);
  const translateLabel = (value?: string) =>
    value && value.startsWith('dashboard.') ? t(value) : value || '';

  const metrics = useMemo(
    () => (data?.metrics || []).filter((item) => canSee(item.visibleTo)),
    [data?.metrics, role]
  );
  const trendCharts = useMemo(
    () => (data?.trendCharts || []).filter((item) => canSee(item.visibleTo)),
    [data?.trendCharts, role]
  );
  const currentMonthVolumeChart = useMemo(
    () =>
      (currentMonthData?.trendCharts || [])
        .find((item) => item.id === 'rfq-volume' && canSee(item.visibleTo)) ||
      null,
    [currentMonthData?.trendCharts, role]
  );
  const currentMonthVolumeChartData = useMemo(() => {
    if (!currentMonthVolumeChart) {
      return null;
    }

    return [
      ['Day', ...currentMonthVolumeChart.series.map((series) => series.name), { role: 'annotation' }],
      ...currentMonthVolumeChart.labels.map((label, index) => {
        const values = currentMonthVolumeChart.series.map((series) => series.data[index] || 0);
        const total = values.reduce((sum, value) => sum + value, 0);

        return [label, ...values, total ? String(total) : null];
      })
    ];
  }, [currentMonthVolumeChart]);
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
    neutral: '#5b6472',
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

  const rfqVolumeFallbackColors = [
    theme.palette.primary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main
  ];

  const getRfqVolumeSeriesColor = (series: DashboardTrendChart['series'][number], index: number) => {
    if (series.color) {
      return series.color;
    }

    const normalizedName = series.name.toLowerCase();

    if (normalizedName.includes('urgent') || normalizedName.includes('เร่งด่วน')) {
      return theme.palette.error.main;
    }

    if (
      normalizedName.includes('special') ||
      normalizedName.includes('พิเศษ') ||
      normalizedName.includes('review')
    ) {
      return theme.palette.warning.main;
    }

    return rfqVolumeFallbackColors[index % rfqVolumeFallbackColors.length];
  };

  const acceptWorkDurationBucketColors = [
    '#16a34a',
    '#22c55e',
    '#84cc16',
    '#facc15',
    '#fb923c',
    '#f97316',
    '#dc2626',
    '#94a3b8'
  ];

  const getAcceptWorkDurationBucketColor = (index: number) =>
    acceptWorkDurationBucketColors[index] || theme.palette.primary.main;

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
    setSelectedMonth(defaultSelectedMonth);
    setDateRange({ salesId: '', procurementId: '' });
    refetch();
  };

  return (
    <Page>
      <PageTitle title={t('dashboard.rfq.title')} />
      <Wrapper
        sx={{
          background: '#f8f4e8',
          border: '1px solid #e7deca'
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
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label={t('dashboard.filters.month')}
                value={selectedMonth}
                InputLabelProps={{ shrink: true }}
                onChange={(event) => {
                  setSelectedMonth(event.target.value);
                }}>
                {monthOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
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
            <Grid item xs={12} md={4}>
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
                    background: '#fff',
                    border: '1px solid rgba(31,42,28,0.08)',
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
                    <Typography variant="h2" sx={{ color: '#21301e', fontWeight: 700 }}>
                      {metric.value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#5f695e' }}>
                      {translateLabel(metric.subtitle)}
                    </Typography>
                    {metric.trend ? (
                      <Chip
                        label={metric.trend}
                        size="small"
                        sx={{
                          alignSelf: 'flex-start',
                          backgroundColor: `${toneColorMap[metric.tone]}18`,
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
              <Wrapper>
                <Typography variant="h6">{translateLabel(chart.title)}</Typography>
                <Chart
                  chartType="LineChart"
                  width="100%"
                  height="280px"
                  loader={chartLoader}
                  data={[
                    ['Day', ...chart.series.map((series) => series.name)],
                    ...chart.labels.map((label, index) => [
                      label,
                      ...chart.series.map((series) => series.data[index] || 0)
                    ])
                  ]}
                  options={{
                    backgroundColor: 'transparent',
                    colors: chart.series.map((series) => series.color || theme.palette.primary.main),
                    legend: { position: 'top' },
                    chartArea: {
                      left: 40,
                      top: 32,
                      right: 16,
                      bottom: 36,
                      width: '100%',
                      height: '70%'
                    },
                    hAxis: { textStyle: { color: '#5f695e' } },
                    vAxis: { minValue: 0, textStyle: { color: '#5f695e' } }
                  }}
                />
              </Wrapper>
            </Grid>
          ))}
        {currentMonthVolumeChart ? (
          <Grid item xs={12} lg={12} key={currentMonthVolumeChart.id}>
            <Wrapper>
              <Typography variant="h6">{translateLabel(currentMonthVolumeChart.title)}</Typography>
              <Chart
                chartType="ColumnChart"
                width="100%"
                height="280px"
                loader={chartLoader}
                data={currentMonthVolumeChartData || []}
                options={{
                  backgroundColor: 'transparent',
                  colors: currentMonthVolumeChart.series.map(
                    (series, index) => getRfqVolumeSeriesColor(series, index)
                  ),
                  legend: { position: 'top' },
                  focusTarget: 'category',
                  tooltip: { isHtml: true, trigger: 'focus' },
                  isStacked: true,
                  annotations: {
                    alwaysOutside: true,
                    stem: {
                      color: 'transparent'
                    },
                    textStyle: {
                      color: '#21301e',
                      fontSize: 12,
                      bold: true
                    }
                  },
                  chartArea: {
                    left: 48,
                    top: 32,
                    right: 20,
                    bottom: 48,
                    width: '100%',
                    height: '68%'
                  },
                  hAxis: {
                    textStyle: { color: '#5f695e' },
                    slantedText: true,
                    slantedTextAngle: 45
                  },
                  vAxis: { minValue: 0, textStyle: { color: '#5f695e' } },
                  bar: { groupWidth: '70%' }
                }}
              />
            </Wrapper>
          </Grid>
        ) : null}
        {acceptWorkDurationChart ? (
          <Grid item xs={12} lg={6} key={acceptWorkDurationChart.id}>
            <Wrapper>
              <Typography variant="h6">{translateLabel(acceptWorkDurationChart.title)}</Typography>
              <Chart
                chartType="ColumnChart"
                width="100%"
                height="280px"
                loader={chartLoader}
                data={[
                  [
                    'Bucket',
                    ...acceptWorkDurationChart.series.map((series) => series.name),
                    { role: 'annotation' },
                    { role: 'style' }
                  ],
                  ...acceptWorkDurationChart.labels.map((label, index) => [
                    translateLabel(label),
                    ...acceptWorkDurationChart.series.map((series) => series.data[index] || 0),
                    String(acceptWorkDurationChart.series[0]?.data[index] || 0),
                    getAcceptWorkDurationBucketColor(index)
                  ])
                ]}
                options={{
                  backgroundColor: 'transparent',
                  legend: { position: 'none' },
                  chartArea: {
                    left: 48,
                    top: 32,
                    right: 16,
                    bottom: 72,
                    width: '100%',
                    height: '66%'
                  },
                  hAxis: {
                    textStyle: { color: '#5f695e' },
                    slantedText: true,
                    slantedTextAngle: 30
                  },
                  annotations: {
                    alwaysOutside: true,
                    stem: {
                      color: 'transparent'
                    },
                    textStyle: {
                      color: '#21301e',
                      fontSize: 12,
                      bold: true
                    }
                  },
                  vAxis: { minValue: 0, textStyle: { color: '#5f695e' } }
                }}
              />
            </Wrapper>
          </Grid>
        ) : null}
        {supplierQuoteDurationChart ? (
          <Grid item xs={12} lg={6} key={supplierQuoteDurationChart.id}>
            <Wrapper>
              <Typography variant="h6">{translateLabel(supplierQuoteDurationChart.title)}</Typography>
              <Chart
                chartType="ColumnChart"
                width="100%"
                height="280px"
                loader={chartLoader}
                data={[
                  [
                    'Bucket',
                    ...supplierQuoteDurationChart.series.map((series) => series.name),
                    { role: 'annotation' },
                    { role: 'style' }
                  ],
                  ...supplierQuoteDurationChart.labels.map((label, index) => [
                    translateLabel(label),
                    ...supplierQuoteDurationChart.series.map((series) => series.data[index] || 0),
                    String(supplierQuoteDurationChart.series[0]?.data[index] || 0),
                    getAcceptWorkDurationBucketColor(index)
                  ])
                ]}
                options={{
                  backgroundColor: 'transparent',
                  legend: { position: 'none' },
                  chartArea: {
                    left: 48,
                    top: 32,
                    right: 16,
                    bottom: 72,
                    width: '100%',
                    height: '66%'
                  },
                  hAxis: {
                    textStyle: { color: '#5f695e' },
                    slantedText: true,
                    slantedTextAngle: 30
                  },
                  annotations: {
                    alwaysOutside: true,
                    stem: {
                      color: 'transparent'
                    },
                    textStyle: {
                      color: '#21301e',
                      fontSize: 12,
                      bold: true
                    }
                  },
                  vAxis: { minValue: 0, textStyle: { color: '#5f695e' } }
                }}
              />
            </Wrapper>
          </Grid>
        ) : null}
        {salesCountChart ? (
          <Grid item xs={12} lg={6} key={salesCountChart.id}>
            <Wrapper>
              <Typography variant="h6">{translateLabel(salesCountChart.title)}</Typography>
              <Chart
                chartType="ColumnChart"
                width="100%"
                height="320px"
                loader={chartLoader}
                data={[
                  ['Sales', 'Count', { role: 'annotation' }, { role: 'style' }],
                  ...salesCountChart.items.map((item, index) => [
                    item.label,
                    item.value,
                    String(item.value),
                    item.color || rfqVolumeFallbackColors[index % rfqVolumeFallbackColors.length]
                  ])
                ]}
                options={{
                  backgroundColor: 'transparent',
                  legend: { position: 'none' },
                  chartArea: {
                    left: 48,
                    top: 32,
                    right: 16,
                    bottom: 72,
                    width: '100%',
                    height: '66%'
                  },
                  hAxis: {
                    textStyle: { color: '#5f695e' },
                    slantedText: true,
                    slantedTextAngle: 30
                  },
                  annotations: {
                    alwaysOutside: true,
                    stem: {
                      color: 'transparent'
                    },
                    textStyle: {
                      color: '#21301e',
                      fontSize: 12,
                      bold: true
                    }
                  },
                  vAxis: { minValue: 0, textStyle: { color: '#5f695e' } },
                  bar: { groupWidth: '72%' }
                }}
              />
            </Wrapper>
          </Grid>
        ) : null}
        {customerTypeCountChart ? (
          <Grid item xs={12} lg={6} key={customerTypeCountChart.id}>
            <Wrapper>
              <Typography variant="h6">{translateLabel(customerTypeCountChart.title)}</Typography>
              <Chart
                chartType="ColumnChart"
                width="100%"
                height="320px"
                loader={chartLoader}
                data={[
                  ['Customer Type', 'Count', { role: 'annotation' }, { role: 'style' }],
                  ...customerTypeCountChart.items.map((item, index) => [
                    item.label,
                    item.value,
                    String(item.value),
                    item.color || rfqVolumeFallbackColors[index % rfqVolumeFallbackColors.length]
                  ])
                ]}
                options={{
                  backgroundColor: 'transparent',
                  legend: { position: 'none' },
                  chartArea: {
                    left: 48,
                    top: 32,
                    right: 16,
                    bottom: 72,
                    width: '100%',
                    height: '66%'
                  },
                  hAxis: {
                    textStyle: { color: '#5f695e' },
                    slantedText: true,
                    slantedTextAngle: 30
                  },
                  annotations: {
                    alwaysOutside: true,
                    stem: {
                      color: 'transparent'
                    },
                    textStyle: {
                      color: '#21301e',
                      fontSize: 12,
                      bold: true
                    }
                  },
                  vAxis: { minValue: 0, textStyle: { color: '#5f695e' } },
                  bar: { groupWidth: '72%' }
                }}
              />
            </Wrapper>
          </Grid>
        ) : null}
        {distributionCharts.map((chart) => (
          <Grid item xs={12} lg={6} key={chart.id}>
            <Wrapper>
              <Typography variant="h6">{translateLabel(chart.title)}</Typography>
              <Chart
                chartType="PieChart"
                width="100%"
                height="280px"
                loader={chartLoader}
                data={[['Status', 'Count'], ...chart.items.map((item) => [item.label, item.value])]}
                options={{
                  backgroundColor: 'transparent',
                  pieHole: 0.58,
                  legend: { position: 'right', textStyle: { color: '#5f695e' } },
                  colors: chart.items.map((item) => item.color || theme.palette.primary.main),
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
                    color: '#21301e',
                    borderColor: 'rgba(31,42,28,0.12)'
                  }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" width="100%">
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        display: 'grid',
                        placeItems: 'center',
                        backgroundColor: '#efe6d2',
                        color: '#8b6f47'
                      }}>
                      {quickLinkIconMap[item.icon]}
                    </Box>
                    <Box sx={{ textAlign: 'left', flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {translateLabel(item.title)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#677268' }}>
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
