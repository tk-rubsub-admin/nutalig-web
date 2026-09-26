import { Refresh } from '@mui/icons-material';
import { viewMonthGrid } from '@schedule-x/calendar';
import { ScheduleXCalendar, useCalendarApp } from '@schedule-x/react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import { useAuth } from 'auth/AuthContext';
import { ROLES } from 'auth/roles';
import PageTitle from 'components/PageTitle';
import { Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { Dispatch, ReactElement, SetStateAction, useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { getPurchaseOrderProductionCalendar } from 'services/PurchaseOrder/purchase-order-api';
import { PurchaseOrderProductionCalendarRecord } from 'services/PurchaseOrder/purchase-order-type';
import { getDocumentStatusLabel } from 'utils/documentStatus';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import 'temporal-polyfill/global';
import '@schedule-x/theme-default';

const Temporal = (
  globalThis as typeof globalThis & {
    Temporal: typeof import('temporal-polyfill').Temporal;
  }
).Temporal;

const PURCHASE_ORDER_CALENDARS = {
  purchaseOrder: {
    colorName: 'purchase-order',
    lightColors: { main: '#2563eb', container: '#dbeafe', onContainer: '#1e3a8a' },
    darkColors: { main: '#60a5fa', container: '#1e3a8a', onContainer: '#dbeafe' }
  },
  overdue: {
    colorName: 'overdue',
    lightColors: { main: '#dc2626', container: '#fee2e2', onContainer: '#7f1d1d' },
    darkColors: { main: '#f87171', container: '#7f1d1d', onContainer: '#fee2e2' }
  }
};

const getMonthKey = (value: Date) =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;

const getMonthValue = (value: string) => dayjs(`${value}-01`).locale('th');

const getMonthRange = (value: string) => {
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return { start: '', end: '' };

  const monthText = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  return {
    start: `${year}-${monthText}-01`,
    end: `${year}-${monthText}-${String(lastDay).padStart(2, '0')}`
  };
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const [year, month, day] = value.slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
};

interface ProductionCalendarViewProps {
  records: PurchaseOrderProductionCalendarRecord[];
  selectedMonth: string;
  showCustomer: boolean;
  showProcurementDetails: boolean;
  onMonthChange: Dispatch<SetStateAction<string>>;
  onPurchaseOrderClick: Dispatch<string>;
}

function ProductionCalendarView({
  records,
  selectedMonth,
  showCustomer,
  showProcurementDetails,
  onMonthChange,
  onPurchaseOrderClick
}: ProductionCalendarViewProps): ReactElement {
  const calendarEvents = useMemo(
    () =>
      records.map((item) => {
        const customerName = item.customer?.customerName || item.customer?.companyName;
        const date = Temporal.PlainDate.from(item.expectedFinishDate.slice(0, 10));
        const details = [
          showCustomer && customerName ? customerName : null,
          showProcurementDetails && item.salesName ? `เซลล์: ${item.salesName}` : null,
          showProcurementDetails && item.supplierName ? item.supplierName : null,
          getDocumentStatusLabel(item.status || '')
        ].filter(Boolean);

        return {
          id: item.purchaseOrderNo,
          title: [item.purchaseOrderNo, ...details].join(' - '),
          start: date,
          end: date,
          calendarId: item.overdue ? 'overdue' : 'purchaseOrder'
        };
      }),
    [records, showCustomer, showProcurementDetails]
  );
  const calendarApp = useCalendarApp({
    calendars: PURCHASE_ORDER_CALENDARS,
    callbacks: {
      onEventClick: (event) => onPurchaseOrderClick(String(event.id)),
      onSelectedDateUpdate: (date) => {
        const month = `${date.year}-${String(date.month).padStart(2, '0')}`;
        if (month !== selectedMonth) onMonthChange(month);
      }
    },
    datePicker: { disabled: true },
    locale: 'th-TH',
    monthGridOptions: { nEventsPerDay: 3 },
    selectedDate: Temporal.PlainDate.from(`${selectedMonth}-01`),
    views: [viewMonthGrid]
  });

  useEffect(() => {
    calendarApp?.events.set(calendarEvents);
  }, [calendarApp, calendarEvents]);

  return (
    <Box
      sx={{
        height: { xs: 560, md: 760 },
        overflow: 'hidden',
        '& .sx-react-calendar-wrapper, & .sx__calendar, & .sx__calendar-wrapper': {
          height: '100%'
        },
        '& .sx__calendar': {
          border: '1px solid rgba(15, 23, 42, 0.12)',
          borderRadius: 1,
          overflow: 'hidden'
        },
        '& .sx__date-input-wrapper, & .sx__date-picker-popup': {
          display: 'none'
        },
        '& .sx__month-grid-day:has(.sx__month-grid-day__header-date.sx__is-today)': {
          backgroundColor: 'rgba(25, 118, 210, 0.08)'
        }
      }}>
      {calendarApp ? <ScheduleXCalendar calendarApp={calendarApp} /> : null}
    </Box>
  );
}

export default function PurchaseOrderProductionCalendar(): ReactElement {
  const history = useHistory();
  const { getRole } = useAuth();
  const role = getRole();
  const isSuperAdmin = role === ROLES.SUPER_ADMIN;
  const isSalesRole = [ROLES.SALES, ROLES.SALES_MANAGER].includes(role);
  const showCustomer = isSuperAdmin || isSalesRole;
  const showProcurementDetails =
    isSuperAdmin || [ROLES.PROCUREMENT, ROLES.PROCUREMENT_MANAGER].includes(role);
  const visibleColumnCount = 4 + (showCustomer ? 1 : 0) + (showProcurementDetails ? 2 : 0);
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey(new Date()));
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const bounds = useMemo(() => getMonthRange(selectedMonth), [selectedMonth]);
  const query = useQuery(
    ['purchase-order-production-calendar', bounds],
    () => getPurchaseOrderProductionCalendar(bounds.start, bounds.end),
    { enabled: Boolean(bounds.start && bounds.end), refetchOnWindowFocus: false }
  );
  const records = useMemo(
    () =>
      [...(query.data || [])].sort((a, b) =>
        a.expectedFinishDate.localeCompare(b.expectedFinishDate)
      ),
    [query.data]
  );
  const openOrderDetail = (item: PurchaseOrderProductionCalendarRecord) => {
    if (isSalesRole && item.salesOrderNo) {
      history.push(ROUTE_PATHS.SALE_ORDER_DETAIL.replace(':id', item.salesOrderNo));
      return;
    }

    history.push(ROUTE_PATHS.PURCHASE_ORDER_DETAIL.replace(':id', item.purchaseOrderNo));
  };

  return (
    <Page>
      <PageTitle title="ติดตามสถานะออเดอร์" />
      <Wrapper>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          alignItems={{ sm: 'center' }}
          sx={{ mb: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
            <DatePicker
              views={['year', 'month']}
              openTo="month"
              label="เดือน"
              format="MMMM YYYY"
              value={getMonthValue(selectedMonth)}
              onChange={(value) => {
                if (value?.isValid()) setSelectedMonth(value.format('YYYY-MM'));
              }}
            />
          </LocalizationProvider>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={() => query.refetch()}
            disabled={query.isFetching}>
            รีเฟรช
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          แสดงรายการ PO ตามวันที่คาดว่าจะผลิตเสร็จ
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Tabs value={view} onChange={(_event, value) => setView(value)}>
            <Tab value="list" label="List View" />
            <Tab value="calendar" label="Calendar View" />
          </Tabs>
        </Box>
        {view === 'calendar' ? (
          query.isFetching ? (
            <Stack alignItems="center" sx={{ py: 8 }}>
              <CircularProgress />
            </Stack>
          ) : (
            <ProductionCalendarView
              key={selectedMonth}
              records={records}
              selectedMonth={selectedMonth}
              showCustomer={showCustomer}
              showProcurementDetails={showProcurementDetails}
              onMonthChange={setSelectedMonth}
              onPurchaseOrderClick={(purchaseOrderNo) =>
                history.push(ROUTE_PATHS.PURCHASE_ORDER_DETAIL.replace(':id', purchaseOrderNo))
              }
            />
          )
        ) : null}
        {view === 'list' ? (
          <TableContainer>
            {query.isFetching ? (
              <Stack alignItems="center" sx={{ py: 8 }}>
                <CircularProgress />
              </Stack>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell align="center">เลขที่ใบสั่งซื้อ</TableCell>
                    <TableCell align="center">เลขที่ใบยืนยันสั่งซื้อ</TableCell>
                    {showCustomer ? <TableCell align="center">ลูกค้า</TableCell> : null}
                    {showProcurementDetails ? <TableCell align="center">เซลล์</TableCell> : null}
                    {showProcurementDetails ? (
                      <TableCell align="center">ซัพพลายเออร์/โรงงาน</TableCell>
                    ) : null}
                    <TableCell align="center">สถานะ</TableCell>
                    <TableCell align="center">วันที่คาดว่าจะผลิตเสร็จ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.length ? (
                    records.map((item) => (
                      <TableRow
                        hover
                        key={item.purchaseOrderNo}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => openOrderDetail(item)}>
                        <TableCell>{item.purchaseOrderNo}</TableCell>
                        <TableCell>{item.salesOrderNo || '-'}</TableCell>
                        {showCustomer ? (
                          <TableCell>
                            {item.customer?.customerName || item.customer?.companyName || '-'}
                          </TableCell>
                        ) : null}
                        {showProcurementDetails ? (
                          <TableCell>{item.salesName || '-'}</TableCell>
                        ) : null}
                        {showProcurementDetails ? (
                          <TableCell>{item.supplierName || '-'}</TableCell>
                        ) : null}
                        <TableCell align="center">
                          <Chip
                            label={getDocumentStatusLabel(item.status || '')}
                            size="small"
                            color={
                              item.overdue ? 'error' : item.actualFinishDate ? 'success' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            fontWeight={600}
                            color={item.overdue ? 'error.main' : 'inherit'}>
                            {formatDate(item.expectedFinishDate)}
                          </Typography>
                          {item.overdue ? (
                            <Typography variant="caption" color="error">
                              เลยกำหนด
                            </Typography>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={visibleColumnCount} align="center" sx={{ py: 6 }}>
                        ไม่พบรายการ PO ในช่วงเวลานี้
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        ) : null}
      </Wrapper>
    </Page>
  );
}
