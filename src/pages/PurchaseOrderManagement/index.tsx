import { Search, DisabledByDefault } from '@mui/icons-material';
import {
  Button,
  Chip,
  CircularProgress,
  Grid,
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
import PageTitle from 'components/PageTitle';
import Paginate from 'components/Paginate';
import { GridSearchSection, GridTextField, Wrapper } from 'components/Styled';
import { useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { useMemo, useState } from 'react';
import { isMobileOnly } from 'react-device-detect';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { searchPurchaseOrders } from 'services/PurchaseOrder/purchase-order-api';
import {
  PurchaseOrderRecord,
  SearchPurchaseOrderRequest
} from 'services/PurchaseOrder/purchase-order-type';
import { formatNumber } from 'utils/utils';

const PURCHASE_ORDER_STATUS_OPTIONS = ['CREATED', 'CANCELLED', 'CLOSED'];

function getPurchaseOrderStatusLabel(status?: string | null): string {
  switch (status) {
    case 'CREATED':
      return 'สร้างแล้ว';
    case 'CANCELLED':
      return 'ยกเลิก';
    case 'CLOSED':
      return 'ปิดงาน';
    default:
      return status || '-';
  }
}

export default function PurchaseOrderManagement(): JSX.Element {
  const useStyles = makeStyles({
    noResultMessage: {
      textAlign: 'center',
      fontSize: '1.2em',
      fontWeight: 'bold',
      padding: '48px 0'
    },
    tableHeader: {
      border: '2px solid #e0e0e0',
      fontWeight: 'bold',
      paddingLeft: '10px',
      textAlign: 'center'
    }
  });

  const classes = useStyles();
  const theme = useTheme();
  const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();
  const history = useHistory();

  const defaultFilter: SearchPurchaseOrderRequest = {
    purchaseOrderNo: '',
    salesOrderNo: '',
    docDateStart: '',
    docDateEnd: '',
    status: null,
    keyword: ''
  };

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [filter, setFilter] = useState<SearchPurchaseOrderRequest>(defaultFilter);

  const {
    data: purchaseOrderList,
    refetch,
    isFetching
  } = useQuery(
    ['purchase-order-list', filter, page, pageSize],
    () => searchPurchaseOrders(filter, page, pageSize),
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true
    }
  );

  const searchFormik = useFormik<SearchPurchaseOrderRequest>({
    initialValues: defaultFilter,
    onSubmit: (values) => {
      const nextFilter: SearchPurchaseOrderRequest = {
        purchaseOrderNo: values.purchaseOrderNo?.trim() || '',
        salesOrderNo: values.salesOrderNo?.trim() || '',
        docDateStart: values.docDateStart || '',
        docDateEnd: values.docDateEnd || '',
        status: values.status || null,
        keyword: values.keyword?.trim() || ''
      };

      setPage(1);

      if (page === 1 && JSON.stringify(filter) === JSON.stringify(nextFilter)) {
        refetch();
        return;
      }

      setFilter(nextFilter);
    }
  });

  const handleClear = () => {
    searchFormik.resetForm();
    setPage(1);

    if (page === 1 && JSON.stringify(filter) === JSON.stringify(defaultFilter)) {
      refetch();
      return;
    }

    setFilter(defaultFilter);
  };

  const openDetail = (purchaseOrderNo: string) => {
    history.push(ROUTE_PATHS.PURCHASE_ORDER_DETAIL.replace(':id', purchaseOrderNo));
  };

  const rows = useMemo(() => {
    if (!purchaseOrderList?.data?.records?.length) {
      return (
        <TableRow>
          <TableCell colSpan={8}>
            <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
          </TableCell>
        </TableRow>
      );
    }

    return purchaseOrderList.data.records.map((purchaseOrder: PurchaseOrderRecord) => (
      <TableRow
        hover
        key={purchaseOrder.purchaseOrderNo}
        sx={{ cursor: 'pointer' }}
        onClick={() => openDetail(purchaseOrder.purchaseOrderNo)}>
        <TableCell align="center">
          <Stack spacing={1} alignItems="center">
            <Typography variant="body2">{purchaseOrder.purchaseOrderNo}</Typography>
            <Chip label={getPurchaseOrderStatusLabel(purchaseOrder.status)} size="small" />
          </Stack>
        </TableCell>
        <TableCell align="center">{purchaseOrder.docDate || '-'}</TableCell>
        <TableCell align="center">{purchaseOrder.productionLeadTimeDay ?? '-'}</TableCell>
        <TableCell align="center">{purchaseOrder.shippingLeadTimeDay ?? '-'}</TableCell>
        <TableCell align="center">{purchaseOrder.salesOrderNo || '-'}</TableCell>
        <TableCell align="center">
          {purchaseOrder.supplier?.supplierName || purchaseOrder.supplierNameSnapshot || '-'}
        </TableCell>
        <TableCell align="right">
          {formatNumber(purchaseOrder.grandTotal || 0)} {purchaseOrder.currency || ''}
        </TableCell>
        <TableCell align="right">{formatNumber(purchaseOrder.grandTotalThb || 0)}</TableCell>
      </TableRow>
    ));
  }, [classes.noResultMessage, purchaseOrderList?.data?.records, t]);

  const mobileRows = useMemo(() => {
    if (!purchaseOrderList?.data?.records?.length) {
      return (
        <TableRow>
          <TableCell>
            <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
          </TableCell>
        </TableRow>
      );
    }

    return purchaseOrderList.data.records.map((purchaseOrder: PurchaseOrderRecord) => (
      <TableRow
        hover
        key={purchaseOrder.purchaseOrderNo}
        sx={{ cursor: 'pointer' }}
        onClick={() => openDetail(purchaseOrder.purchaseOrderNo)}>
        <TableCell sx={{ pt: 2, pb: 2 }}>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body1" fontWeight={600}>
                {purchaseOrder.purchaseOrderNo}
              </Typography>
              <Chip label={getPurchaseOrderStatusLabel(purchaseOrder.status)} size="small" />
            </Stack>
            <Typography variant="body2">{purchaseOrder.docDate || '-'}</Typography>
            <Typography variant="body2">ระยะเวลาผลิต: {purchaseOrder.productionLeadTimeDay ?? '-'}</Typography>
            <Typography variant="body2">ระยะเวลาส่งของ: {purchaseOrder.shippingLeadTimeDay ?? '-'}</Typography>
            <Typography variant="body2">{purchaseOrder.salesOrderNo || '-'}</Typography>
            <Typography variant="body2">
              {purchaseOrder.supplier?.supplierName || purchaseOrder.supplierNameSnapshot || '-'}
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {formatNumber(purchaseOrder.grandTotal || 0)} {purchaseOrder.currency || ''}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatNumber(purchaseOrder.grandTotalThb || 0)} THB
            </Typography>
          </Stack>
        </TableCell>
      </TableRow>
    ));
  }, [classes.noResultMessage, purchaseOrderList?.data?.records, t]);

  return (
    <Page>
      <PageTitle title="ใบสั่งซื้อ" />
      <Wrapper>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{
            mt: 1,
            justifyContent: { sm: 'flex-end' },
            alignItems: { xs: 'stretch', sm: 'center' }
          }}>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-indigo-blue"
            startIcon={<Search />}
            disabled={isFetching}
            onClick={() => searchFormik.handleSubmit()}>
            {t('button.search')}
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-amber-orange"
            startIcon={<DisabledByDefault />}
            disabled={isFetching}
            onClick={handleClear}>
            {t('button.clear')}
          </Button>
        </Stack>

        <GridSearchSection container spacing={1} component="form" onSubmit={searchFormik.handleSubmit}>
          <Grid item xs={12}>
            <Typography variant="h6" component="h2">
              ค้นหาใบสั่งซื้อ
            </Typography>
          </Grid>
          <GridTextField item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              label="เลขที่ใบสั่งซื้อ"
              name="purchaseOrderNo"
              value={searchFormik.values.purchaseOrderNo}
              onChange={searchFormik.handleChange}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              label="เลขที่ใบยืนยันสั่งซื้อ"
              name="salesOrderNo"
              value={searchFormik.values.salesOrderNo}
              onChange={searchFormik.handleChange}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={4} md={3}>
            <TextField
              select
              fullWidth
              label="สถานะ"
              name="status"
              value={searchFormik.values.status || ''}
              onChange={searchFormik.handleChange}>
              <MenuItem value="">ทั้งหมด</MenuItem>
              {PURCHASE_ORDER_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status} value={status}>
                  {getPurchaseOrderStatusLabel(status)}
                </MenuItem>
              ))}
            </TextField>
          </GridTextField>
          <GridTextField item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="วันที่เอกสารเริ่มต้น"
              name="docDateStart"
              value={searchFormik.values.docDateStart}
              onChange={searchFormik.handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="วันที่เอกสารสิ้นสุด"
              name="docDateEnd"
              value={searchFormik.values.docDateEnd}
              onChange={searchFormik.handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} md={6}>
            <TextField
              fullWidth
              label="คำค้นหา"
              name="keyword"
              value={searchFormik.values.keyword}
              onChange={searchFormik.handleChange}
            />
          </GridTextField>
        </GridSearchSection>

        <TableContainer>
          {isFetching ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
              <CircularProgress />
            </Stack>
          ) : (
            <Table>
              {!isMobileOnly && (
                <TableHead>
                  <TableRow>
                    <TableCell className={classes.tableHeader}>เลขที่ใบสั่งซื้อ</TableCell>
                    <TableCell className={classes.tableHeader}>วันที่เอกสาร</TableCell>
                    <TableCell className={classes.tableHeader}>ระยะเวลาผลิต</TableCell>
                    <TableCell className={classes.tableHeader}>ระยะเวลาส่งของ</TableCell>
                    <TableCell className={classes.tableHeader}>เลขที่ใบยืนยันสั่งซื้อ</TableCell>
                    <TableCell className={classes.tableHeader}>Supplier</TableCell>
                    <TableCell className={classes.tableHeader}>ยอดรวม</TableCell>
                    <TableCell className={classes.tableHeader}>ยอดรวม (บาท)</TableCell>
                  </TableRow>
                </TableHead>
              )}
              <TableBody>{isMobileOnly ? mobileRows : rows}</TableBody>
            </Table>
          )}
        </TableContainer>

        <Paginate
          page={page}
          setPage={setPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          total={purchaseOrderList?.data?.pagination?.total || 0}
        />
      </Wrapper>
    </Page>
  );
}
