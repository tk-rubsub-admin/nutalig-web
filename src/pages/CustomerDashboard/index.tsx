import {
  ArrowForward,
  PeopleAlt,
  Person,
  Phone,
  Home,
  TrendingUp,
  Groups
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Stack,
  Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PageTitle from 'components/PageTitle';
import { Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Chart } from 'react-google-charts';
import { useHistory, useLocation } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { useAuth } from 'auth/AuthContext';
import { getCustomerDashboard } from 'services/Customer/customer-api';
import { getSales } from 'services/Sales/sales-api';
import {
  CustomerDashboard as CustomerDashboardData,
  CustomerDashboardBreakdown
} from 'services/Customer/customer-type';
import { useQuery } from 'react-query';

function countBy<T>(
  items: T[],
  keyFn: (item: T) => string | null | undefined
): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = keyFn(item) || 'UNKNOWN';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function formatDate(value?: string | null): string {
  return value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '-';
}

function buildChartRows(
  counts: Record<string, number>,
  labelMap: Record<string, string>
): [string, number][] {
  return Object.entries(counts)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => [labelMap[key] || key, value]);
}

function toChartRows(items?: CustomerDashboardBreakdown[]): [string, number][] {
  return (items || [])
    .filter((item) => item.count > 0)
    .map((item) => [item.nameTh || item.nameEn || item.code, item.count]);
}

function metricCard(
  title: string,
  value: number | string,
  subtitle: string,
  icon: JSX.Element,
  accentColor: string
): JSX.Element {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: `1px solid ${accentColor}33`,
        background: `linear-gradient(135deg, ${accentColor}12 0%, #ffffff 60%)`
      }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="flex-start">
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={800} lineHeight={1.1}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              {subtitle}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentColor,
              backgroundColor: `${accentColor}18`
            }}>
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function tierCard(
  title: string,
  value: number,
  subtitle: string,
  accentColor: string
): JSX.Element {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: `1px solid ${accentColor}33`,
        background: `linear-gradient(135deg, ${accentColor}12 0%, #ffffff 60%)`
      }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
          {title}
        </Typography>
        <Typography variant="h4" fontWeight={800} lineHeight={1.1}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function CustomerDashboard(): JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const { getRole, getEmployeeId } = useAuth();
  const history = useHistory();
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const currentRole = getRole();
  const isSalesRole = currentRole === 'SALES';
  const currentSalesId = getEmployeeId();
  const salesId = isSalesRole ? currentSalesId : searchParams.get('salesId') || '';

  const { data: dashboard, isFetching } = useQuery<CustomerDashboardData>(
    ['customer-dashboard-list', salesId || 'all'],
    () => getCustomerDashboard(salesId || undefined),
    {
      refetchOnWindowFocus: false
    }
  );

  const { data: salesOptions = [] } = useQuery(
    ['customer-dashboard-sales-options'],
    () => getSales(1, 100),
    {
      refetchOnWindowFocus: false
    }
  );

  const onSalesChange = (value: string) => {
    if (isSalesRole) {
      return;
    }

    const nextParams = new URLSearchParams(location.search);
    if (value) {
      nextParams.set('salesId', value);
    } else {
      nextParams.delete('salesId');
    }
    history.replace({
      pathname: location.pathname,
      search: nextParams.toString() ? `?${nextParams.toString()}` : ''
    });
  };

  const salesSelectLabel = useMemo(() => {
    if (!salesId) {
      return 'All Sales';
    }

    const currentSales = salesOptions.find((sales) => sales.salesId === salesId);
    return currentSales ? `${currentSales.salesId} - ${currentSales.nickname || currentSales.name}` : salesId;
  }, [salesId, salesOptions]);

  const sortedCustomers = useMemo(
    () =>
      [...(dashboard?.recentCustomers || [])].sort((a, b) => {
        const aTime = a.createdDate ? new Date(a.createdDate).getTime() : 0;
        const bTime = b.createdDate ? new Date(b.createdDate).getTime() : 0;
        return bTime - aTime;
      }),
    [dashboard?.recentCustomers]
  );

  const summary = useMemo(
    () => ({
      totalCustomers: dashboard?.totalCustomers || 0,
      companyCount: dashboard?.companyCustomers || 0,
      individualCount: dashboard?.individualCustomers || 0,
      totalContacts: dashboard?.totalContacts || 0,
      totalAddresses: dashboard?.totalAddresses || 0,
      defaultAddressCount: dashboard?.defaultAddressCustomers || 0
    }),
    [dashboard]
  );

  const typeChartRows = useMemo(
    () =>
      toChartRows(dashboard?.typeBreakdown).map(
        ([label, value]) => [label, value] as [string, number]
      ),
    [dashboard?.typeBreakdown]
  );

  const tierBoxes = useMemo(
    () => [
      {
        code: 'VIP',
        label: dashboard?.tierBreakdown?.find((item) => item.code === 'VIP')?.nameEn || 'VIP',
        color: theme.palette.secondary.main,
        count: dashboard?.tierBreakdown?.find((item) => item.code === 'VIP')?.count || 0
      },
      {
        code: 'TIER_2',
        label: dashboard?.tierBreakdown?.find((item) => item.code === 'TIER_2')?.nameEn || 'Tier 2',
        color: theme.palette.info.main,
        count: dashboard?.tierBreakdown?.find((item) => item.code === 'TIER_2')?.count || 0
      },
      {
        code: 'TIER_3',
        label: dashboard?.tierBreakdown?.find((item) => item.code === 'TIER_3')?.nameEn || 'Tier 3',
        color: theme.palette.success.main,
        count: dashboard?.tierBreakdown?.find((item) => item.code === 'TIER_3')?.count || 0
      },
      {
        code: 'TIER_4',
        label: dashboard?.tierBreakdown?.find((item) => item.code === 'TIER_4')?.nameEn || 'Tier 4',
        color: theme.palette.warning.main,
        count: dashboard?.tierBreakdown?.find((item) => item.code === 'TIER_4')?.count || 0
      }
    ],
    [
      dashboard?.tierBreakdown,
      theme.palette.info.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main
    ]
  );

  const segmentChartRows = useMemo(
    () =>
      toChartRows(dashboard?.segmentBreakdown).map(
        ([label, value]) => [label, value] as [string, number]
      ),
    [dashboard?.segmentBreakdown]
  );

  const chartOptions = {
    pieHole: 0.35,
    legend: { position: 'right' as const, textStyle: { fontSize: 12 } },
    chartArea: { width: '88%', height: '80%' },
    backgroundColor: 'transparent'
  };

  return (
    <Page>
      <PageTitle title={t('customerDashboard.title')} />
      <Wrapper sx={{ mt: 2 }}>
        <Box
          sx={{
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap'
          }}>
          <Typography variant="body2" color="text.secondary">
            {t('customerDashboard.subtitle')}
          </Typography>
          <Box sx={{ width: '100%', maxWidth: 360, ml: 'auto' }}>
            <TextField
              select
              fullWidth
              InputLabelProps={{ shrink: true }}
              size="small"
              label="Sales"
              value={salesId}
              onChange={(event) => onSalesChange(event.target.value)}
              disabled={isSalesRole}
              SelectProps={{
                displayEmpty: true,
                renderValue: () => salesSelectLabel
              }}>
              <MenuItem value="">All Sales</MenuItem>
              {salesOptions.map((sales) => (
                <MenuItem key={sales.salesId} value={sales.salesId}>
                  {`${sales.salesId} - ${sales.nickname || sales.name}`}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>

        {/* <Alert severity="info" sx={{ mb: 2 }}>
          {t('customerDashboard.activeOnlyNote')}
        </Alert> */}

        {isFetching ? (
          <Box
            sx={{
              minHeight: 240,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} lg={4}>
                {metricCard(
                  t('customerDashboard.metrics.totalCustomers'),
                  summary.totalCustomers,
                  '',
                  <PeopleAlt fontSize="small" />,
                  theme.palette.primary.main
                )}
              </Grid>
              <Grid item xs={12} sm={6} lg={4}>
                {metricCard(
                  t('customerDashboard.metrics.companyCustomers'),
                  summary.companyCount,
                  '',
                  <Groups fontSize="small" />,
                  theme.palette.info.main
                )}
              </Grid>
              <Grid item xs={12} sm={6} lg={4}>
                {metricCard(
                  t('customerDashboard.metrics.individualCustomers'),
                  summary.individualCount,
                  '',
                  <Person fontSize="small" />,
                  theme.palette.secondary.main
                )}
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} lg={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                      {t('customerDashboard.charts.tierTitle')}
                    </Typography>
                    <Grid container spacing={1.5}>
                      {tierBoxes.map((tier) => (
                        <Grid item xs={6} key={tier.code}>
                          {tierCard(tier.label, tier.count, '', tier.color)}
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} lg={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                      {t('customerDashboard.charts.typeTitle')}
                    </Typography>
                    {typeChartRows.length > 0 ? (
                      <Chart
                        chartType="PieChart"
                        data={[['Type', 'Count'], ...typeChartRows]}
                        options={chartOptions}
                        width="100%"
                        height="320px"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {t('warning.noResultList')}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} lg={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                      {t('customerDashboard.charts.segmentTitle')}
                    </Typography>
                    {segmentChartRows.length > 0 ? (
                      <Chart
                        chartType="PieChart"
                        data={[['Segment', 'Count'], ...segmentChartRows]}
                        options={{
                          ...chartOptions,
                          pieHole: 0.55
                        }}
                        width="100%"
                        height="320px"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {t('warning.noResultList')}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700}>
                  {t('customerDashboard.recent.title')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('customerDashboard.recent.subtitle')}
                </Typography>
                <Divider sx={{ mb: 1 }} />
                {sortedCustomers.length > 0 ? (
                  <List disablePadding>
                    {sortedCustomers.slice(0, 8).map((customer, index) => (
                      <ListItemButton
                        key={customer.id}
                        divider={index < Math.min(sortedCustomers.length, 8) - 1}
                        onClick={() => history.push(ROUTE_PATHS.CUSTOMER_DETAIL.replace(':id', customer.id))}>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              <Typography variant="subtitle2" fontWeight={700}>
                                {customer.customerName}
                              </Typography>
                              {customer.customerType?.nameTh ? (
                                <Chip label={customer.customerType.nameTh} size="small" variant="outlined" />
                              ) : null}
                              {customer.customerTier?.nameTh ? (
                                <Chip label={customer.customerTier.nameTh} size="small" variant="outlined" />
                              ) : null}
                              {customer.customerSegment?.nameTh ? (
                                <Chip label={customer.customerSegment.nameTh} size="small" variant="outlined" />
                              ) : null}
                            </Stack>
                          }
                          secondary={
                            <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                {customer.companyName || '-'}
                                {customer.branchName ? ` • ${customer.branchName}` : ''}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {t('general.createdDate')}: {formatDate(customer.createdDate)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {t('customerDashboard.recent.contactCount')}: {customer.contacts?.length || 0}
                                {' • '}
                                {t('customerDashboard.recent.addressCount')}: {customer.addresses?.length || 0}
                              </Typography>
                            </Stack>
                          }
                        />
                      </ListItemButton>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {t('warning.noResultList')}
                  </Typography>
                )}
              </CardContent>
            </Card> */}
          </>
        )}
      </Wrapper>
    </Page>
  );
}
