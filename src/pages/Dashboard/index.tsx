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
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DatePicker from 'components/DatePicker';
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
import { DEFAULT_DATE_FORMAT, DEFAULT_DATE_FORMAT_BFF } from 'utils';
import 'rsuite/dist/rsuite.min.css';

export default function Dashboard(): JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const { getRole, getRoleDisplayName } = useAuth();
  const role = getRole();
  const roleLabel = getRoleDisplayName();
  const defaultDateRange = useMemo<DashboardDateRange>(
    () => ({
      dateFrom: dayjs().subtract(7, 'day').startOf('day').format(DEFAULT_DATE_FORMAT_BFF),
      dateTo: dayjs().startOf('day').format(DEFAULT_DATE_FORMAT_BFF)
    }),
    []
  );
  const [dateRange, setDateRange] = useState<DashboardDateRange>(defaultDateRange);
  const [appliedDateRange, setAppliedDateRange] = useState<DashboardDateRange>(defaultDateRange);

  const { data, isFetching, isError, refetch } = useQuery<DashboardData>(
    ['dashboard', role, appliedDateRange.dateFrom, appliedDateRange.dateTo],
    () => getDashboard(appliedDateRange),
    {
      refetchOnWindowFocus: false
    }
  );

  const canSee = (visibleTo?: string[]) => !visibleTo?.length || visibleTo.includes(role);

  const metrics = useMemo(
    () => (data?.metrics || []).filter((item) => canSee(item.visibleTo)),
    [data?.metrics, role]
  );
  const trendCharts = useMemo(
    () => (data?.trendCharts || []).filter((item) => canSee(item.visibleTo)),
    [data?.trendCharts, role]
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

  const handleSearch = () => {
    if (
      appliedDateRange.dateFrom === dateRange.dateFrom &&
      appliedDateRange.dateTo === dateRange.dateTo
    ) {
      refetch();
      return;
    }

    setAppliedDateRange(dateRange);
  };

  const handleClear = () => {
    setDateRange(defaultDateRange);
    if (
      appliedDateRange.dateFrom === defaultDateRange.dateFrom &&
      appliedDateRange.dateTo === defaultDateRange.dateTo
    ) {
      refetch();
      return;
    }

    setAppliedDateRange(defaultDateRange);
  };

  return (
    <Page>
      <PageTitle title={t('dashboard.title')} />
      {/* {/* <Wrapper
        sx={{
          background: 'rgba(80, 157, 62, 0.18)',
          border: '1px solid rgba(77, 138, 63, 0.12)'
        }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ sm: 'center' }}
            justifyContent="flex-end"
            sx={{ width: '100%' }}>
            <Chip
              label={`${t('dashboard.lastUpdated')}: ${formatTimestamp(data?.generatedAt)}`}
              size="small"
              variant="outlined"
              sx={{ ml: { sm: 'auto' } }}
            />
          </Stack>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} md={3}>
              <DatePicker
                fullWidth
                inputVariant="outlined"
                InputLabelProps={{ shrink: true }}
                label={t('dashboard.filters.dateFrom')}
                format={DEFAULT_DATE_FORMAT}
                value={dateRange.dateFrom ? dayjs(dateRange.dateFrom).toDate() : null}
                maxDate={dateRange.dateTo ? dayjs(dateRange.dateTo).toDate() : undefined}
                onChange={(date) => {
                  if (!date) {
                    return;
                  }

                  const nextDateFrom = dayjs(date.toDate())
                    .startOf('day')
                    .format(DEFAULT_DATE_FORMAT_BFF);
                  setDateRange((prev) => ({
                    dateFrom: nextDateFrom,
                    dateTo: dayjs(prev.dateTo).isBefore(nextDateFrom) ? nextDateFrom : prev.dateTo
                  }));
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker
                fullWidth
                inputVariant="outlined"
                InputLabelProps={{ shrink: true }}
                label={t('dashboard.filters.dateTo')}
                format={DEFAULT_DATE_FORMAT}
                value={dateRange.dateTo ? dayjs(dateRange.dateTo).toDate() : null}
                minDate={dateRange.dateFrom ? dayjs(dateRange.dateFrom).toDate() : undefined}
                onChange={(date) => {
                  if (!date) {
                    return;
                  }

                  const nextDateTo = dayjs(date.toDate())
                    .startOf('day')
                    .format(DEFAULT_DATE_FORMAT_BFF);
                  setDateRange((prev) => ({
                    ...prev,
                    dateTo: nextDateTo
                  }));
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button variant="contained" startIcon={<Search />} onClick={handleSearch}>
                  {t('button.search')}
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

      <Wrapper>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('dashboard.sections.metrics')}
        </Typography>
        {isFetching ? (
          chartLoader
        ) : (
          <Grid container spacing={2}>
            {metrics.map((metric) => (
              <Grid
                item
                xs={12}
                sm={6}
                xl={Math.max(3, Math.floor(12 / Math.max(metrics.length, 1)))}
                key={metric.id}>
                <Box
                  sx={{
                    p: 2.5,
                    minHeight: 160,
                    borderRadius: 3,
                    background: '#fff',
                    border: '1px solid rgba(31,42,28,0.08)',
                    boxShadow: '0 10px 30px rgba(31, 42, 28, 0.06)'
                  }}>
                  <Stack spacing={1.25}>
                    <Typography
                      variant="overline"
                      sx={{ color: toneColorMap[metric.tone], fontWeight: 700 }}>
                      {t(metric.title)}
                    </Typography>
                    <Typography variant="h2" sx={{ color: '#21301e', fontWeight: 700 }}>
                      {metric.value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#5f695e' }}>
                      {t(metric.subtitle)}
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
        {trendCharts.map((chart) => (
          <Grid item xs={12} lg={6} key={chart.id}>
            <Wrapper>
              <Typography variant="h6">{t(chart.title)}</Typography>
              <Typography variant="body2" sx={{ color: '#677268', mb: 2 }}>
                {t(chart.subtitle)}
              </Typography>
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
        {distributionCharts.map((chart) => (
          <Grid item xs={12} lg={6} key={chart.id}>
            <Wrapper>
              <Typography variant="h6">{t(chart.title)}</Typography>
              <Typography variant="body2" sx={{ color: '#677268', mb: 2 }}>
                {t(chart.subtitle)}
              </Typography>
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
        <Grid item xs={12} xl={8}>
          <Wrapper>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('dashboard.sections.workQueues')}
            </Typography>
            <Grid container spacing={2}>
              {workQueues.map((queue: DashboardWorkQueue) => (
                <Grid item xs={12} md={6} key={queue.id}>
                  <Box
                    sx={{
                      borderRadius: 3,
                      border: '1px solid rgba(31,42,28,0.08)',
                      background: '#fff',
                      overflow: 'hidden'
                    }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(31,42,28,0.08)' }}>
                      <Box>
                        <Typography variant="h6">{t(queue.title)}</Typography>
                        <Typography variant="body2" sx={{ color: '#677268' }}>
                          {t(queue.subtitle)}
                        </Typography>
                      </Box>
                      <Chip label={`${queue.count}`} color="primary" />
                    </Stack>
                    {queue.items.length ? (
                      <List disablePadding>
                        {queue.items.map((item) => (
                          <ListItemButton
                            key={item.id}
                            component={RouterLink}
                            to={item.href}
                            sx={{ borderBottom: '1px solid rgba(31,42,28,0.06)' }}>
                            <ListItemText
                              primary={item.title}
                              secondary={`${item.meta} • ${item.status}`}
                              primaryTypographyProps={{ fontWeight: 600 }}
                            />
                            <ArrowOutward sx={{ fontSize: 18, color: '#7a867b' }} />
                          </ListItemButton>
                        ))}
                      </List>
                    ) : (
                      <Box sx={{ p: 2 }}>
                        <Typography variant="body2" sx={{ color: '#677268' }}>
                          {t('dashboard.noPendingItems')}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ p: 1.5 }}>
                      <Button
                        component={RouterLink}
                        to={queue.href}
                        endIcon={<ArrowOutward />}
                        size="small">
                        {t('dashboard.viewAll')}
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Wrapper>
        </Grid>
        <Grid item xs={12} xl={4}>
          <Wrapper>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('dashboard.sections.quickLinks')}
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
                        backgroundColor: 'rgba(77,138,63,0.12)',
                        color: theme.palette.primary.main
                      }}>
                      {quickLinkIconMap[item.icon]}
                    </Box>
                    <Box sx={{ textAlign: 'left', flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {t(item.title)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#677268' }}>
                        {t(item.description)}
                      </Typography>
                    </Box>
                    <ArrowOutward sx={{ fontSize: 18 }} />
                  </Stack>
                </Button>
              ))}
            </Stack>
          </Wrapper>
        </Grid>
      </Grid> */}
    </Page>
  );
}
