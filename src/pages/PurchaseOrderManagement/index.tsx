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
import { getDocumentStatusChipSx, getDocumentStatusLabel } from 'utils/documentStatus';
import { getShippingMethodLabel } from 'utils/shipping';
import { formatNumber } from 'utils/utils';

const PURCHASE_ORDER_STATUS_OPTIONS = [
  'CREATED',
  'AWAITING_PAYMENT',
  'PAID',
  'PRODUCTION_RUNNING',
  'CANCELLED',
  'CLOSED'
];
const PO_SHIPPING_METHOD_OPTIONS = [
  'LAND',
  'SEA',
  'AIR',
  'SEA_FCL_20GP',
  'SEA_FCL_40HQ',
  'SEA_SHARE_FCL_20GP',
  'SEA_SHARE_FCL_40HQ'
];
const PURCHASE_ORDER_NO_PREFIX = 'NTL-PO2026';
const SALES_ORDER_NO_PREFIX = 'NTL-SO2026';

function withDocumentNoPrefix(value: string | undefined, prefix: string): string {
  const normalizedValue = value?.trim() || '';
  if (!normalizedValue) {
    return '';
  }

  return normalizedValue.toUpperCase().startsWith(prefix)
    ? normalizedValue.toUpperCase()
    : `${prefix}${normalizedValue}`;
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
    shippingMethod: '',
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
        purchaseOrderNo: withDocumentNoPrefix(values.purchaseOrderNo, PURCHASE_ORDER_NO_PREFIX),
        salesOrderNo: withDocumentNoPrefix(values.salesOrderNo, SALES_ORDER_NO_PREFIX),
        docDateStart: values.docDateStart || '',
        docDateEnd: values.docDateEnd || '',
        status: values.status || null,
        shippingMethod: values.shippingMethod || '',
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
            <Chip
              label={getDocumentStatusLabel(purchaseOrder.status, purchaseOrder.statusProfile)}
              size="small"
              sx={getDocumentStatusChipSx(purchaseOrder.status, purchaseOrder.statusProfile)}
            />
          </Stack>
        </TableCell>
        <TableCell align="center">{purchaseOrder.docDate || '-'}</TableCell>
        <TableCell
          align="center"
          sx={{ width: 110, minWidth: 110, maxWidth: 110, whiteSpace: 'nowrap' }}>
          {purchaseOrder.productionLeadTimeDay ?? '-'}/
          {purchaseOrder.shippingLeadTimeDay ?? '-'}
        </TableCell>
        <TableCell align="center">{purchaseOrder.salesOrderNo || '-'}</TableCell>
        <TableCell align="center">
          {purchaseOrder.supplier?.supplierName || purchaseOrder.supplierNameSnapshot || '-'}
        </TableCell>
        <TableCell align="center">
          {getShippingMethodLabel(
            purchaseOrder.shippingMethodSnapshot ||
            purchaseOrder.supplierShipping?.shippingMethod
          )}
        </TableCell>
        <TableCell align="right">{formatNumber(purchaseOrder.totalCbm || 0)} CBM</TableCell>
        <TableCell align="right">
          {formatNumber(purchaseOrder.grandTotal || 0)} {purchaseOrder.currency || ''}
        </TableCell>
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
              <Chip
                label={getDocumentStatusLabel(purchaseOrder.status, purchaseOrder.statusProfile)}
                size="small"
                sx={getDocumentStatusChipSx(purchaseOrder.status, purchaseOrder.statusProfile)}
              />
            </Stack>
            <Typography variant="body2">{purchaseOrder.docDate || '-'}</Typography>
            <Typography variant="body2">
              ระยะเวลาผลิต/ระยะเวลาส่งของ: {purchaseOrder.productionLeadTimeDay ?? '-'}/
              {purchaseOrder.shippingLeadTimeDay ?? '-'}
            </Typography>
            <Typography variant="body2">{purchaseOrder.salesOrderNo || '-'}</Typography>
            <Typography variant="body2">
              {purchaseOrder.supplier?.supplierName || purchaseOrder.supplierNameSnapshot || '-'}
            </Typography>
            <Typography variant="body2">
              Shipping Method:{' '}
              {getShippingMethodLabel(
                purchaseOrder.shippingMethodSnapshot ||
                purchaseOrder.supplierShipping?.shippingMethod
              )}
            </Typography>
            <Typography variant="body2">
              CBM: {formatNumber(purchaseOrder.totalCbm || 0)}
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {formatNumber(purchaseOrder.grandTotal || 0)} {purchaseOrder.currency || ''}
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
              InputLabelProps={{ shrink: true }}
              value={searchFormik.values.purchaseOrderNo}
              onChange={(event) =>
                searchFormik.setFieldValue(
                  'purchaseOrderNo',
                  event.target.value.replace(new RegExp(`^${PURCHASE_ORDER_NO_PREFIX}`, 'i'), '')
                )
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">{PURCHASE_ORDER_NO_PREFIX}</InputAdornment>
                )
              }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              label="เลขที่ใบยืนยันสั่งซื้อ"
              name="salesOrderNo"
              InputLabelProps={{ shrink: true }}
              value={searchFormik.values.salesOrderNo}
              onChange={(event) =>
                searchFormik.setFieldValue(
                  'salesOrderNo',
                  event.target.value.replace(new RegExp(`^${SALES_ORDER_NO_PREFIX}`, 'i'), '')
                )
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">{SALES_ORDER_NO_PREFIX}</InputAdornment>
                )
              }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={4} md={3}>
            <TextField
              select
              fullWidth
              label="สถานะ"
              name="status"
              InputLabelProps={{ shrink: true }}
              value={searchFormik.values.status || ''}
              onChange={searchFormik.handleChange}>
              <MenuItem value="">ทั้งหมด</MenuItem>
              {PURCHASE_ORDER_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status} value={status}>
                  {getDocumentStatusLabel(status)}
                </MenuItem>
              ))}
            </TextField>
          </GridTextField>
          <GridTextField item xs={12} sm={4} md={3}>
            <TextField
              select
              fullWidth
              label="วิธีขนส่ง"
              name="shippingMethod"
              InputLabelProps={{ shrink: true }}
              value={searchFormik.values.shippingMethod || ''}
              onChange={searchFormik.handleChange}>
              <MenuItem value="">ทั้งหมด</MenuItem>
              {PO_SHIPPING_METHOD_OPTIONS.map((shippingMethod) => (
                <MenuItem key={shippingMethod} value={shippingMethod}>
                  {getShippingMethodLabel(shippingMethod)}
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
              InputLabelProps={{ shrink: true }}
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
                    <TableCell
                      className={classes.tableHeader}
                      sx={{ width: 110, minWidth: 110, maxWidth: 110, whiteSpace: 'normal' }}>
                      <Typography fontSize={10}>ระยะเวลาผลิต/ส่งของ</Typography>
                    </TableCell>
                    <TableCell className={classes.tableHeader}>เลขที่ใบยืนยันสั่งซื้อ</TableCell>
                    <TableCell className={classes.tableHeader}>Supplier</TableCell>
                    <TableCell className={classes.tableHeader}>Shipping Method</TableCell>
                    <TableCell className={classes.tableHeader}>CBM</TableCell>
                    <TableCell className={classes.tableHeader}>ยอดรวม</TableCell>
                  </TableRow>
                </TableHead>
              )}
              <TableBody>{isMobileOnly ? mobileRows : rows}</TableBody>
            </Table>
          )}
        </TableContainer>

        <Paginate
          pagination={purchaseOrderList?.data?.pagination}
          page={page}
          pageSize={pageSize}
          setPage={setPage}
          setPageSize={setPageSize}
          refetch={refetch}
          totalRecords={purchaseOrderList?.data?.pagination?.totalRecords}
          isShow={!isDownSm}
        />
      </Wrapper>
    </Page>
  );
}
