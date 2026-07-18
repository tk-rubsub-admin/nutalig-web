import { DisabledByDefault, Search } from '@mui/icons-material';
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
import { useAuth } from 'auth/AuthContext';
import { ROLES } from 'auth/roles';
import PageTitle from 'components/PageTitle';
import Paginate from 'components/Paginate';
import { GridSearchSection, GridTextField, Wrapper } from 'components/Styled';
import { useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import { isMobileOnly } from 'react-device-detect';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { searchSalesOrdersV1 } from 'services/SaleOrder/sale-order-api';
import { SearchSalesOrderRequestV1, SalesOrderV1 } from 'services/SaleOrder/sale-order-type';
import { getSales } from 'services/Sales/sales-api';
import { SalesRecord } from 'services/Sales/sales-type';
import { getMySearchFields } from 'services/SearchField/search-field-api';
import { formatNumber } from 'utils/utils';
import { getDocumentStatusChipSx, getDocumentStatusLabel } from 'utils/documentStatus';

function getCustomerLabel(salesOrder: SalesOrderV1): string {
  const customer = salesOrder.customer as any;
  if (!customer) return '-';
  return [customer.id ? `(${customer.id})` : '', customer.customerName || customer.companyName || '']
    .filter(Boolean)
    .join(' ') || '-';
}

function getSalesLabel(salesOrder: SalesOrderV1): string {
  const sales = salesOrder.saleAccount as any;
  if (!sales) return '-';

  const name = [sales.firstNameTh || sales.firstName, sales.lastNameTh || sales.lastName]
    .filter(Boolean)
    .join(' ');

  return sales.nickName || sales.nickname || sales.displayName || name || sales.employeeId || '-';
}

const defaultFilter: SearchSalesOrderRequestV1 = {
  salesOrderNo: '',
  docDateStart: '',
  docDateEnd: '',
  customerId: '',
  salesId: '',
  status: null,
  keyword: ''
};

const SCREEN_CODE = 'SALE_ORDER_LIST';

export default function SalesOrderManagement(): ReactElement {
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
  const { getEmployeeId, getRole, getSalesId } = useAuth();
  const { t } = useTranslation();
  const history = useHistory();
  const currentRole = getRole();
  const currentSalesId = getSalesId() || getEmployeeId();
  const isSalesRole = currentRole === ROLES.SALES;
  const roleDefaultFilter = useMemo(
    () => ({
      ...defaultFilter,
      salesId: isSalesRole ? currentSalesId : ''
    }),
    [currentSalesId, isSalesRole]
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filter, setFilter] = useState<SearchSalesOrderRequestV1>(roleDefaultFilter);

  const { data: visibleSearchFields = [] } = useQuery(
    ['my-search-fields', SCREEN_CODE],
    () => getMySearchFields(SCREEN_CODE),
    {
      refetchOnWindowFocus: false
    }
  );

  const { data: salesOptions = [], isFetching: isSalesFetching } = useQuery(
    ['sales-options'],
    () => getSales(1, 20),
    {
      refetchOnWindowFocus: false
    }
  );

  const visibleFieldCodes = useMemo(
    () => new Set(visibleSearchFields.filter((field) => field.visible).map((field) => field.fieldCode)),
    [visibleSearchFields]
  );

  const canShowField = (fieldCode: keyof SearchSalesOrderRequestV1) => visibleFieldCodes.has(fieldCode);
  const salesDropdownOptions = useMemo(() => {
    if (!isSalesRole || !currentSalesId) {
      return salesOptions;
    }

    if (salesOptions.some((sales) => sales.salesId === currentSalesId)) {
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

  const {
    data: salesOrderList,
    refetch: refetchSalesOrders,
    isFetching
  } = useQuery(
    ['sales-order-list', filter, page, pageSize],
    () => searchSalesOrdersV1(filter, page, pageSize),
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true
    }
  );

  const searchFormik = useFormik<SearchSalesOrderRequestV1>({
    initialValues: roleDefaultFilter,
    enableReinitialize: true,
    onSubmit: (values) => {
      const nextFilter: SearchSalesOrderRequestV1 = {
        salesOrderNo: canShowField('salesOrderNo') ? values.salesOrderNo?.trim() || '' : '',
        docDateStart: canShowField('docDateStart') ? values.docDateStart || '' : '',
        docDateEnd: canShowField('docDateEnd') ? values.docDateEnd || '' : '',
        customerId: canShowField('customerId') ? values.customerId?.trim() || '' : '',
        salesId: isSalesRole ? currentSalesId : canShowField('salesId') ? values.salesId?.trim() || '' : '',
        status: canShowField('status') ? values.status || null : null,
        keyword: canShowField('keyword') ? values.keyword?.trim() || '' : ''
      };

      setPage(1);

      if (page === 1 && JSON.stringify(filter) === JSON.stringify(nextFilter)) {
        refetchSalesOrders();
        return;
      }

      setFilter(nextFilter);
    }
  });

  useEffect(() => {
    if (!isSalesRole) {
      return;
    }

    searchFormik.setFieldValue('salesId', currentSalesId, false);
    setFilter((prev) => {
      if (prev.salesId === currentSalesId) {
        return prev;
      }

      return {
        ...prev,
        salesId: currentSalesId
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSalesId, isSalesRole]);

  const handleClear = () => {
    searchFormik.resetForm();
    setPage(1);
    const nextDefaultFilter = {
      ...defaultFilter,
      salesId: isSalesRole ? currentSalesId : ''
    };

    if (page === 1 && JSON.stringify(filter) === JSON.stringify(nextDefaultFilter)) {
      refetchSalesOrders();
      return;
    }

    setFilter(nextDefaultFilter);
  };

  const rows = salesOrderList?.data?.records || [];

  const salesOrderRows = useMemo(() => {
    if (!rows.length) {
      return (
        <TableRow>
          <TableCell colSpan={6}>
            <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
          </TableCell>
        </TableRow>
      );
    }

    return rows.map((salesOrder) => (
      <TableRow
        hover
        key={salesOrder.salesOrderNo}
        sx={{ cursor: 'pointer' }}
        onClick={() => history.push(ROUTE_PATHS.SALE_ORDER_DETAIL.replace(':id', salesOrder.salesOrderNo))}>
        <TableCell align="center">
          <Stack spacing={1} alignItems="center">
            <Typography variant="body2">{salesOrder.salesOrderNo}</Typography>
            <Chip
              label={getDocumentStatusLabel(salesOrder.status, salesOrder.statusProfile)}
              size="small"
              sx={getDocumentStatusChipSx(salesOrder.status, salesOrder.statusProfile)}
            />
          </Stack>
        </TableCell>
        <TableCell align="center">{salesOrder.docDate || '-'}</TableCell>
        <TableCell align="center">{getCustomerLabel(salesOrder)}</TableCell>
        <TableCell align="center">{getSalesLabel(salesOrder)}</TableCell>
        <TableCell align="right">{formatNumber(salesOrder.grandTotal)}</TableCell>
        <TableCell align="center">{salesOrder.shippingType || '-'}</TableCell>
      </TableRow>
    ));
  }, [classes.noResultMessage, history, rows, t]);

  const salesOrderMobileRows = useMemo(() => {
    if (!rows.length) {
      return (
        <TableRow>
          <TableCell>
            <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
          </TableCell>
        </TableRow>
      );
    }

    return rows.map((salesOrder) => (
      <TableRow
        hover
        key={salesOrder.salesOrderNo}
        sx={{ cursor: 'pointer' }}
        onClick={() => history.push(ROUTE_PATHS.SALE_ORDER_DETAIL.replace(':id', salesOrder.salesOrderNo))}>
        <TableCell sx={{ py: 2 }}>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Typography variant="body1" fontWeight={700}>
                {salesOrder.salesOrderNo}
              </Typography>
              <Chip
                label={getDocumentStatusLabel(salesOrder.status, salesOrder.statusProfile)}
                size="small"
                sx={getDocumentStatusChipSx(salesOrder.status, salesOrder.statusProfile)}
              />
            </Stack>
            <Typography variant="body2">{salesOrder.docDate || '-'}</Typography>
            <Typography variant="body2">{getCustomerLabel(salesOrder)}</Typography>
            <Typography variant="body2" color="text.secondary">
              {getSalesLabel(salesOrder)}
            </Typography>
            <Typography variant="body1" fontWeight={700}>
              {formatNumber(salesOrder.grandTotal)}
            </Typography>
          </Stack>
        </TableCell>
      </TableRow>
    ));
  }, [classes.noResultMessage, history, rows, t]);

  return (
    <Page>
      <PageTitle title="รายการใบยืนยันสั่งซื้อ" />
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
            onClick={() => searchFormik.handleSubmit()}>
            {t('button.search')}
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-amber-orange"
            startIcon={<DisabledByDefault />}
            onClick={handleClear}>
            {t('button.clear')}
          </Button>
        </Stack>

        <GridSearchSection container spacing={1}>
          <Grid item xs={12}>
            <Typography variant="h6" component="h2">
              ค้นหาใบยืนยันสั่งซื้อ
            </Typography>
          </Grid>
          {canShowField('salesOrderNo') && (
            <GridTextField item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                label="เลขที่เอกสาร"
                name="salesOrderNo"
                value={searchFormik.values.salesOrderNo}
                onChange={searchFormik.handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>
          )}
          {canShowField('customerId') && (
            <GridTextField item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                label="รหัสลูกค้า"
                name="customerId"
                value={searchFormik.values.customerId}
                onChange={searchFormik.handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>
          )}
          {(canShowField('salesId') || isSalesRole) && (
            <GridTextField item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                select
                label="รหัสเซลล์"
                name="salesId"
                value={searchFormik.values.salesId}
                onChange={searchFormik.handleChange}
                disabled={isSalesRole || isSalesFetching}
                InputLabelProps={{ shrink: true }}>
                {!isSalesRole && <MenuItem value="">ทั้งหมด</MenuItem>}
                {isSalesFetching ? (
                  <MenuItem disabled value="">
                    Loading...
                  </MenuItem>
                ) : null}
                {!isSalesFetching && salesDropdownOptions.length === 0 ? (
                  <MenuItem disabled value="">
                    No sales data
                  </MenuItem>
                ) : null}
                {salesDropdownOptions.map((option) => (
                  <MenuItem key={option.salesId} value={option.salesId}>
                    {`${option.salesId} - ${option.nickname || option.name}`}
                  </MenuItem>
                ))}
              </TextField>
            </GridTextField>
          )}
          {canShowField('status') && (
            <GridTextField item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                select
                label="สถานะ"
                name="status"
                value={searchFormik.values.status}
                onChange={searchFormik.handleChange}
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="">ทั้งหมด</MenuItem>
                {['DRAFT', 'CREATED', 'ISSUED', 'SENT', 'ACCEPTED', 'REJECTED', 'CANCELLED'].map((status) => (
                  <MenuItem key={status} value={status}>
                    {getDocumentStatusLabel(status)}
                  </MenuItem>
                ))}
              </TextField>
            </GridTextField>
          )}
          {canShowField('docDateStart') && (
            <GridTextField item xs={12} sm={4} md={3}>
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
          )}
          {canShowField('docDateEnd') && (
            <GridTextField item xs={12} sm={4} md={3}>
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
          )}
          {canShowField('keyword') && (
            <GridTextField item xs={12} sm={8} md={6}>
              <TextField
                fullWidth
                label="คำค้นหา"
                name="keyword"
                placeholder="เลข SO, ชื่อลูกค้า, ชื่อสินค้า"
                value={searchFormik.values.keyword}
                onChange={searchFormik.handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>
          )}
        </GridSearchSection>

        {isMobileOnly ? (
          <GridSearchSection container>
            <TableContainer>
              <Table id="sales_order_list___table">
                <TableHead>
                  <TableRow>
                    <TableCell align="center" className={classes.tableHeader}>
                      ใบยืนยันสั่งซื้อ
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isFetching ? (
                    <TableRow>
                      <TableCell align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : (
                    salesOrderMobileRows
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </GridSearchSection>
        ) : (
          <GridSearchSection container>
            <TableContainer>
              <Table id="sales_order_list___table">
                <TableHead>
                  <TableRow>
                    <TableCell align="center" className={classes.tableHeader}>
                      เลขที่เอกสาร
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      วันที่เอกสาร
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      ลูกค้า
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      เซลล์ที่ดูแล
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      ยอดรวม
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      วิธีขนส่ง
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isFetching ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : (
                    salesOrderRows
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </GridSearchSection>
        )}

        <GridSearchSection container>
          <Grid item xs={12}>
            <Paginate
              pagination={salesOrderList?.data.pagination}
              page={page}
              pageSize={pageSize}
              setPage={setPage}
              setPageSize={setPageSize}
              refetch={refetchSalesOrders}
              totalRecords={salesOrderList?.data.pagination.totalRecords}
              isShow
            />
          </Grid>
        </GridSearchSection>
      </Wrapper>
    </Page>
  );
}
