import { Search, DisabledByDefault } from '@mui/icons-material';
import {
  Button,
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useAuth } from 'auth/AuthContext';
import PageTitle from 'components/PageTitle';
import Paginate from 'components/Paginate';
import { GridSearchSection, GridTextField, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { useMemo, useState } from 'react';
import { isMobileOnly } from 'react-device-detect';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { searchPurchaseOrders } from 'services/PurchaseOrder/purchase-order-api';
import {
  PurchaseOrderRecord,
  SearchPurchaseOrderRequest
} from 'services/PurchaseOrder/purchase-order-type';
import { getDocumentStatusChipSx, getDocumentStatusLabel } from 'utils/documentStatus';
import { getShippingMethodLabel } from 'utils/shipping';
import { formatNumber } from 'utils/utils';

const statuses = [
  'CREATED',
  'AWAITING_PAYMENT',
  'PAID',
  'PRODUCTION_RUNNING',
  'CANCELLED',
  'CLOSED'
];

export default function MyPurchaseOrderManagement(): JSX.Element {
  const classes = makeStyles({
    header: { border: '2px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center' },
    empty: { textAlign: 'center', fontSize: '1.1em', fontWeight: 'bold', padding: '48px 0' }
  })();
  const theme = useTheme();
  const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
  const history = useHistory();
  const { getSalesId, getEmployeeId, authReady } = useAuth();
  const salesId = getSalesId() || getEmployeeId();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filter, setFilter] = useState<SearchPurchaseOrderRequest>({ salesId });
  const [draft, setDraft] = useState({ purchaseOrderNo: '', salesOrderNo: '', status: '' });

  const query = useQuery(
    ['my-purchase-orders', filter, page, pageSize],
    () => searchPurchaseOrders(filter, page, pageSize),
    { enabled: authReady && Boolean(salesId), keepPreviousData: true, refetchOnWindowFocus: false }
  );

  const submit = () => {
    setPage(1);
    setFilter({
      salesId,
      purchaseOrderNo: draft.purchaseOrderNo.trim()
        ? `NTL-PO${draft.purchaseOrderNo.trim().replace(/^NTL-PO/i, '')}`
        : undefined,
      salesOrderNo: draft.salesOrderNo.trim()
        ? `NTL-SO${draft.salesOrderNo.trim().replace(/^NTL-SO/i, '')}`
        : undefined,
      status: draft.status || null
    });
  };
  const clear = () => {
    setDraft({ purchaseOrderNo: '', salesOrderNo: '', status: '' });
    setPage(1);
    setFilter({ salesId });
  };
  const openDetail = (id: string) =>
    history.push(ROUTE_PATHS.PURCHASE_ORDER_DETAIL.replace(':id', id));
  const records = query.data?.data?.records || [];
  const rows = useMemo(
    () =>
      records.map((po: PurchaseOrderRecord) => (
        <TableRow
          hover
          key={po.purchaseOrderNo}
          sx={{ cursor: 'pointer' }}
          onClick={() => openDetail(po.purchaseOrderNo)}>
          <TableCell align="center">
            <Stack spacing={1} alignItems="center">
              <Typography>{po.purchaseOrderNo}</Typography>
              <Chip
                label={getDocumentStatusLabel(po.status, po.statusProfile)}
                size="small"
                sx={getDocumentStatusChipSx(po.status, po.statusProfile)}
              />
            </Stack>
          </TableCell>
          <TableCell align="center">{po.docDate || '-'}</TableCell>
          <TableCell align="center">{po.salesOrderNo || '-'}</TableCell>
          <TableCell align="center">
            {po.supplier?.supplierName || po.supplierNameSnapshot || '-'}
          </TableCell>
          <TableCell align="center">
            {getShippingMethodLabel(
              po.shippingMethodSnapshot || po.supplierShipping?.shippingMethod
            )}
          </TableCell>
          <TableCell align="right">
            {formatNumber(po.grandTotal || 0)} {po.currency || ''}
          </TableCell>
        </TableRow>
      )),
    [records]
  );
  const mobileRows = records.map((po: PurchaseOrderRecord) => (
    <TableRow
      hover
      key={po.purchaseOrderNo}
      sx={{ cursor: 'pointer' }}
      onClick={() => openDetail(po.purchaseOrderNo)}>
      <TableCell sx={{ py: 2 }}>
        <Stack spacing={0.75}>
          <Stack direction="row" justifyContent="space-between">
            <Typography fontWeight={600}>{po.purchaseOrderNo}</Typography>
            <Chip
              label={getDocumentStatusLabel(po.status, po.statusProfile)}
              size="small"
              sx={getDocumentStatusChipSx(po.status, po.statusProfile)}
            />
          </Stack>
          <Typography variant="body2">วันที่เอกสาร: {po.docDate || '-'}</Typography>
          <Typography variant="body2">SO: {po.salesOrderNo || '-'}</Typography>
          <Typography variant="body2">
            Supplier: {po.supplier?.supplierName || po.supplierNameSnapshot || '-'}
          </Typography>
          <Typography fontWeight={600}>
            {formatNumber(po.grandTotal || 0)} {po.currency || ''}
          </Typography>
        </Stack>
      </TableCell>
    </TableRow>
  ));

  return (
    <Page>
      <PageTitle title="รายการสั่งซื้อของฉัน" />
      <Wrapper>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          justifyContent="flex-end"
          sx={{ mb: 1 }}>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-indigo-blue"
            startIcon={<Search />}
            onClick={submit}
            disabled={query.isFetching}>
            ค้นหา
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-amber-orange"
            startIcon={<DisabledByDefault />}
            onClick={clear}
            disabled={query.isFetching}>
            ล้าง
          </Button>
        </Stack>
        <GridSearchSection
          container
          spacing={1}
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}>
          <Grid item xs={12}>
            <Typography variant="h6">ค้นหาใบสั่งซื้อของฉัน</Typography>
          </Grid>
          <GridTextField item xs={12} sm={4}>
            <TextField
              fullWidth
              label="เลขที่ใบสั่งซื้อ"
              value={draft.purchaseOrderNo}
              onChange={(e) => setDraft({ ...draft, purchaseOrderNo: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">NTL-PO</InputAdornment>
              }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={4}>
            <TextField
              fullWidth
              label="เลขที่ใบยืนยันสั่งซื้อ"
              value={draft.salesOrderNo}
              onChange={(e) => setDraft({ ...draft, salesOrderNo: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">NTL-SO</InputAdornment>
              }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label="สถานะ"
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
              <MenuItem value="">ทั้งหมด</MenuItem>
              {statuses.map((status) => (
                <MenuItem value={status} key={status}>
                  {getDocumentStatusLabel(status)}
                </MenuItem>
              ))}
            </TextField>
          </GridTextField>
        </GridSearchSection>
        <TableContainer>
          {query.isFetching ? (
            <Stack alignItems="center" sx={{ py: 8 }}>
              <CircularProgress />
            </Stack>
          ) : (
            <Table>
              {!isMobileOnly && (
                <TableHead>
                  <TableRow>
                    <TableCell className={classes.header}>เลขที่ใบสั่งซื้อ</TableCell>
                    <TableCell className={classes.header}>วันที่เอกสาร</TableCell>
                    <TableCell className={classes.header}>เลขที่ใบยืนยันสั่งซื้อ</TableCell>
                    <TableCell className={classes.header}>Supplier</TableCell>
                    <TableCell className={classes.header}>Shipping Method</TableCell>
                    <TableCell className={classes.header}>ยอดรวม</TableCell>
                  </TableRow>
                </TableHead>
              )}
              <TableBody>
                {records.length ? (
                  isMobileOnly ? (
                    mobileRows
                  ) : (
                    rows
                  )
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className={classes.empty}>ไม่พบรายการ</div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
        <Paginate
          pagination={query.data?.data?.pagination}
          page={page}
          pageSize={pageSize}
          setPage={setPage}
          setPageSize={setPageSize}
          refetch={query.refetch}
          totalRecords={query.data?.data?.pagination?.totalRecords}
          isShow={!isDownSm}
        />
      </Wrapper>
    </Page>
  );
}
