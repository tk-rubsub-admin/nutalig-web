import { DisabledByDefault, Search } from '@mui/icons-material';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  MenuItem,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { useAuth } from 'auth/AuthContext';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import { GridSearchSection, GridTextField, Wrapper } from 'components/Styled';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTE_PATHS } from 'routes';
import { getRFQList } from 'services/RFQ/rfq-api';
import { searchSalesOrdersV1 } from 'services/SaleOrder/sale-order-api';
import { SalesOrderV1, SearchSalesOrderRequestV1 } from 'services/SaleOrder/sale-order-type';
import { getSales } from 'services/Sales/sales-api';
import { SalesRecord } from 'services/Sales/sales-type';
import { formatNumber } from 'utils/utils';
import { getDocumentStatusChipSx, getDocumentStatusLabel } from 'utils/documentStatus';

const MAX_MONTHS = 3;
const PAGE_SIZE = 10;

function defaultMonths() {
  const end = dayjs().startOf('month').subtract(1, 'month');
  return {
    from: end.subtract(MAX_MONTHS - 1, 'month').format('YYYY-MM'),
    to: end.format('YYYY-MM')
  };
}

function buildMonthOptions() {
  const formatter = new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
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
}

function monthRange(from: string, to: string, salesId: string) {
  return {
    dateFrom: dayjs(`${from}-01`).startOf('month').format('YYYY-MM-DD'),
    dateTo: dayjs(`${to}-01`).endOf('month').format('YYYY-MM-DD'),
    salesId
  };
}

function getSalesOrderSalesLabel(order: SalesOrderV1): string {
  const sales = order.saleAccount as any;
  if (!sales) return '-';
  const fullName = [sales.firstNameTh || sales.firstName, sales.lastNameTh || sales.lastName]
    .filter(Boolean)
    .join(' ');
  return sales.nickName || sales.nickname || sales.displayName || fullName || sales.employeeId || '-';
}

function MetricCard({ title, value, description }: { title: string; value: number | string; description: string }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography color="text.secondary" variant="body2">{title}</Typography>
        <Typography variant="h3" sx={{ my: 1, fontWeight: 700 }}>{value}</Typography>
        <Typography color="text.secondary" variant="body2">{description}</Typography>
      </CardContent>
    </Card>
  );
}

export default function SalesDashboard(): JSX.Element {
  const history = useHistory();
  const { t } = useTranslation();
  const { getRole, getSalesId, getEmployeeId } = useAuth();
  const role = getRole();
  const isSalesRole = role === 'SALES';
  const currentSalesId = getSalesId() || getEmployeeId() || '';
  const initialMonths = useMemo(defaultMonths, []);
  const [monthFrom, setMonthFrom] = useState(initialMonths.from);
  const [monthTo, setMonthTo] = useState(initialMonths.to);
  const [salesId, setSalesId] = useState(isSalesRole ? currentSalesId : '');
  const [applied, setApplied] = useState(() =>
    monthRange(initialMonths.from, initialMonths.to, isSalesRole ? currentSalesId : '')
  );
  const [page, setPage] = useState(1);
  const monthOptions = useMemo(buildMonthOptions, []);
  const fromDate = dayjs(`${monthFrom}-01`);
  const toDate = dayjs(`${monthTo}-01`);
  const monthCount = fromDate.isValid() && toDate.isValid()
    ? toDate.diff(fromDate, 'month') + 1
    : 0;
  const rangeError = !fromDate.isValid() || !toDate.isValid() || monthCount < 1 || monthCount > MAX_MONTHS;
  const earliestStartMonth = dayjs(`${monthTo}-01`).subtract(MAX_MONTHS - 1, 'month').format('YYYY-MM');
  const latestEndMonth = dayjs(`${monthFrom}-01`).add(MAX_MONTHS - 1, 'month').format('YYYY-MM');

  const { data: salesOptions = [], isFetching: isSalesFetching } = useQuery<SalesRecord[]>(
    ['sales-dashboard-sales-options'],
    () => getSales(1, 100),
    { refetchOnWindowFocus: false }
  );
  const salesDropdownOptions = useMemo(() => {
    if (!isSalesRole || !currentSalesId || salesOptions.some((sales) => sales.salesId === currentSalesId)) {
      return salesOptions;
    }
    const currentSalesOption: SalesRecord = {
      salesId: currentSalesId,
      type: null,
      name: currentSalesId,
      nickname: '',
      mobileNo: null,
      bankAccountNo: null,
      bankName: null,
      bankAccountName: null,
      team: null
    };
    return [currentSalesOption, ...salesOptions];
  }, [currentSalesId, isSalesRole, salesOptions]);

  const criteria = useMemo(() => monthRange(
    dayjs(applied.dateFrom).format('YYYY-MM'),
    dayjs(applied.dateTo).format('YYYY-MM'),
    applied.salesId || ''
  ), [applied]);

  const { data: rfqCounts, isFetching: isLoadingRfqs, isError: rfqError } = useQuery(
    ['sales-dashboard-rfqs', role, criteria.dateFrom, criteria.dateTo, criteria.salesId],
    async () => {
      const filters = {
        requestedDateStart: criteria.dateFrom,
        requestedDateEnd: criteria.dateTo,
        ...(criteria.salesId ? { salesId: criteria.salesId } : {})
      };
      const [allRfqs, quotedRfqs] = await Promise.all([
        getRFQList(1, 1, filters),
        getRFQList(1, 1, { ...filters, statuses: ['QUOTED'] })
      ]);
      return {
        requested: allRfqs.pagination.totalRecords,
        quoted: quotedRfqs.pagination.totalRecords
      };
    },
    { refetchOnWindowFocus: false, retry: false }
  );

  const salesOrderCriteria = useMemo<SearchSalesOrderRequestV1>(() => ({
    docDateStart: criteria.dateFrom,
    docDateEnd: criteria.dateTo,
    salesId: criteria.salesId
  }), [criteria]);
  const {
    data: salesOrdersResponse,
    isFetching: isLoadingSalesOrders,
    isError: salesOrdersError
  } = useQuery(
    ['sales-dashboard-orders', salesOrderCriteria, page],
    () => searchSalesOrdersV1(salesOrderCriteria, page, PAGE_SIZE, { sortBy: 'docDate', sortDirection: 'DESC' }),
    { refetchOnWindowFocus: false, retry: false }
  );

  const requestedCount = rfqCounts?.requested ?? 0;
  const quotedCount = rfqCounts?.quoted ?? 0;
  const salesOrders = salesOrdersResponse?.data.records || [];
  const pagination = salesOrdersResponse?.data.pagination;
  const selectedSalesLabel = salesId
    ? salesDropdownOptions.find((sales) => sales.salesId === salesId)?.nickname ||
      salesDropdownOptions.find((sales) => sales.salesId === salesId)?.name || salesId
    : 'เซลล์ทุกคน';

  const handleSearch = () => {
    if (rangeError) return;
    setPage(1);
    setApplied(monthRange(monthFrom, monthTo, isSalesRole ? currentSalesId : salesId));
  };

  const handleClear = () => {
    const defaultSalesId = isSalesRole ? currentSalesId : '';
    setMonthFrom(initialMonths.from);
    setMonthTo(initialMonths.to);
    setSalesId(defaultSalesId);
    setPage(1);
    setApplied(monthRange(initialMonths.from, initialMonths.to, defaultSalesId));
  };

  return (
    <>
      <PageTitle title="แดชบอร์ดฝ่ายขาย" />
      <Wrapper sx={{ background: 'background.paper' }}>
        <Stack spacing={2}>
          <GridSearchSection container spacing={1}>
            <Grid item xs={12}>
              <Typography variant="h6" component="h2">ค้นหาข้อมูลฝ่ายขาย</Typography>
            </Grid>
            <GridTextField item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="เดือนเริ่มต้น"
                value={monthFrom}
                helperText={t('dashboard.filters.monthRangeLimit', { maxMonths: MAX_MONTHS })}
                InputLabelProps={{ shrink: true }}
                onChange={(event) => setMonthFrom(event.target.value)}>
                {monthOptions.map((option) => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                    disabled={option.value > monthTo || option.value < earliestStartMonth}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </GridTextField>
            <GridTextField item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="เดือนสิ้นสุด"
                value={monthTo}
                helperText={t('dashboard.filters.monthRangeLimit', { maxMonths: MAX_MONTHS })}
                InputLabelProps={{ shrink: true }}
                onChange={(event) => setMonthTo(event.target.value)}>
                {monthOptions.map((option) => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                    disabled={option.value < monthFrom || option.value > latestEndMonth}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </GridTextField>
            <Grid item xs={12} sm={8} md={4}>
              <Autocomplete
                options={salesDropdownOptions}
                loading={isSalesFetching}
                value={salesDropdownOptions.find((sales) => sales.salesId === salesId) || null}
                getOptionLabel={(sales) => `${sales.salesId} - ${sales.nickname || sales.name}`}
                isOptionEqualToValue={(option, value) => option.salesId === value.salesId}
                disabled={isSalesRole}
                onChange={(_event, value) => setSalesId(value?.salesId || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="เซลล์ที่ดูแล"
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
            {rangeError ? (
              <Grid item xs={12}>
                <Alert severity="warning">เลือกช่วงเดือนตั้งแต่ 1 ถึง 3 เดือน โดยเดือนเริ่มต้นต้องไม่อยู่หลังเดือนสิ้นสุด</Alert>
              </Grid>
            ) : null}
            <Grid item xs={12}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<Search />}
                  disabled={rangeError || isLoadingRfqs || isLoadingSalesOrders}
                  onClick={handleSearch}>
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
          </GridSearchSection>
        </Stack>
      </Wrapper>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>ภาพรวม RFQ</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <MetricCard title="RFQ ที่ขอราคา" value={requestedCount} description="นับจากวันที่ขอราคาในช่วงที่เลือก" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <MetricCard title="RFQ ที่เสนอราคาแล้ว" value={quotedCount} description="สถานะ QUOTED ในช่วงวันที่ขอราคา" />
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography variant="h6">รายการ Sales Order</Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedSalesLabel} · {pagination?.totalRecords ?? 0} รายการ · วันที่เอกสารตามช่วงเดือนที่เลือก
          </Typography>
        </Stack>
        {rfqError || salesOrdersError ? (
          <Alert severity="error" sx={{ mb: 2 }}>โหลดข้อมูล Dashboard ไม่สำเร็จ กรุณาลองค้นหาอีกครั้ง</Alert>
        ) : null}
        <Card variant="outlined">
          <TableContainer>
            <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>เลขที่ Sales Order</TableCell>
                <TableCell>วันที่เอกสาร</TableCell>
                <TableCell>เซลล์</TableCell>
                <TableCell>ลูกค้า</TableCell>
                <TableCell>สถานะ</TableCell>
                <TableCell align="right">ยอดรวมสุทธิ</TableCell>
                <TableCell align="right">ชำระแล้ว</TableCell>
                <TableCell align="right">ค้างชำระ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {salesOrders.map((order) => (
                <TableRow
                  key={order.salesOrderNo}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => history.push(ROUTE_PATHS.SALE_ORDER_DETAIL.replace(':id', order.salesOrderNo))}>
                  <TableCell>{order.salesOrderNo}</TableCell>
                  <TableCell>{order.docDate ? dayjs(order.docDate).format('DD/MM/YYYY') : '-'}</TableCell>
                  <TableCell>{getSalesOrderSalesLabel(order)}</TableCell>
                  <TableCell>{order.customer?.customerName || order.customerSnapshot?.customerName || '-'}</TableCell>
                  <TableCell>
                    <Box component="span" sx={{ display: 'inline-flex', px: 1, py: 0.25, borderRadius: 1, ...getDocumentStatusChipSx(order.status, order.statusProfile) }}>
                      {getDocumentStatusLabel(order.status, order.statusProfile)}
                    </Box>
                  </TableCell>
                  <TableCell align="right">{formatNumber(order.grandTotal)}</TableCell>
                  <TableCell align="right">{formatNumber(order.paidTotal || 0)}</TableCell>
                  <TableCell align="right">{formatNumber(order.outstandingTotal || 0)}</TableCell>
                </TableRow>
              ))}
              {!salesOrders.length && !isLoadingSalesOrders ? (
                <TableRow><TableCell colSpan={8} align="center">ไม่พบ Sales Order ตามเงื่อนไข</TableCell></TableRow>
              ) : null}
              {isLoadingSalesOrders ? (
                <TableRow><TableCell colSpan={8} align="center"><CircularProgress size={24} /></TableCell></TableRow>
              ) : null}
            </TableBody>
            </Table>
          </TableContainer>
        </Card>
        {pagination && pagination.totalPage > 1 ? (
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
            <Pagination count={pagination.totalPage} page={page} onChange={(_event, selectedPage) => setPage(selectedPage)} color="primary" />
          </Stack>
        ) : null}
      </Box>
      <LoadingDialog open={isLoadingRfqs && !rfqCounts} />
    </>
  );
}
