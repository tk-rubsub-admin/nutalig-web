import { BRAND_COLORS } from 'theme/brandTokens';
import { useAuth } from 'auth/AuthContext';
import { DisabledByDefault, Search } from '@mui/icons-material';
import {
  Button,
  Grid,
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
import { makeStyles } from '@mui/styles';
import PageTitle from 'components/PageTitle';
import Paginate from 'components/Paginate';
import { GridSearchSection, GridTextField, Wrapper } from 'components/Styled';
import { useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { PERMISSIONS } from 'auth/permissions';
import {
  PendingSupplierPaymentRecord,
  SearchPendingSupplierPaymentRequest
} from 'services/PurchaseOrder/purchase-order-type';
import { searchPendingSupplierPayments } from 'services/PurchaseOrder/purchase-order-api';
import { formatNumber } from 'utils/utils';

const defaultFilter: SearchPendingSupplierPaymentRequest = {
  supplierId: '',
  docDateStart: '',
  docDateEnd: '',
  keyword: ''
};

const paymentTypeLabels: Record<string, string> = {
  DEPOSIT: 'มัดจำ',
  BALANCE: 'ส่วนที่เหลือ',
  INSTALLMENT: 'งวด',
  OTHER: 'อื่น ๆ'
};

export default function PendingSupplierPayments(): JSX.Element {
  const classes = makeStyles({
    tableHeader: {
      border: `2px solid ${BRAND_COLORS.sand}`,
      fontWeight: 'bold',
      textAlign: 'center',
      whiteSpace: 'nowrap'
    },
    noResult: { textAlign: 'center', fontSize: '1.1em', fontWeight: 'bold', padding: '40px 0' }
  })();
  const history = useHistory();
  const { hasPermission } = useAuth();
  const canOpenPurchaseOrder = hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filter, setFilter] = useState(defaultFilter);
  const { data, isFetching, refetch } = useQuery(
    ['pending-supplier-payments', filter, page, pageSize],
    () => searchPendingSupplierPayments(filter, page, pageSize),
    { refetchOnWindowFocus: false, keepPreviousData: true }
  );

  const formik = useFormik<SearchPendingSupplierPaymentRequest>({
    initialValues: defaultFilter,
    onSubmit: (values) => {
      const nextFilter = {
        supplierId: values.supplierId?.trim() || '',
        docDateStart: values.docDateStart || '',
        docDateEnd: values.docDateEnd || '',
        keyword: values.keyword?.trim() || ''
      };
      setPage(1);
      if (page === 1 && JSON.stringify(filter) === JSON.stringify(nextFilter)) refetch();
      else setFilter(nextFilter);
    }
  });

  const clear = () => {
    formik.resetForm();
    setPage(1);
    if (page === 1 && JSON.stringify(filter) === JSON.stringify(defaultFilter)) refetch();
    else setFilter(defaultFilter);
  };

  const rows = useMemo(() => {
    const records = data?.data?.records || [];
    if (!records.length) {
      return (
        <TableRow>
          <TableCell colSpan={9}>
            <div className={classes.noResult}>ไม่พบรายการค้างชำระ</div>
          </TableCell>
        </TableRow>
      );
    }
    return records.map((record: PendingSupplierPaymentRecord) => (
      <TableRow
        hover
        key={`${record.scheduleId}`}
        sx={{ cursor: canOpenPurchaseOrder ? 'pointer' : 'default' }}
        onClick={() =>
          canOpenPurchaseOrder &&
          history.push(ROUTE_PATHS.PURCHASE_ORDER_DETAIL.replace(':id', record.purchaseOrderNo))
        }>
        <TableCell align="center">{record.purchaseOrderNo}</TableCell>
        <TableCell align="center">{record.docDate || '-'}</TableCell>
        <TableCell align="center">{record.supplierName || record.supplierId}</TableCell>
        <TableCell align="center">{record.salesOrderNo || '-'}</TableCell>
        <TableCell align="center">{`${record.installmentNo} · ${paymentTypeLabels[record.paymentType] || record.paymentType
          }`}</TableCell>
        <TableCell align="right">
          {formatNumber(record.expectedAmount)} {record.currency}
        </TableCell>
        <TableCell align="right">
          {formatNumber(record.paidAmount)} {record.currency}
        </TableCell>
        <TableCell align="right">
          <Stack alignItems="flex-end" spacing={0.25}>
            <Typography fontWeight={700}>
              {formatNumber(record.outstandingAmount)} {record.currency}
            </Typography>
            {record.pendingAmount > 0 && (
              <Typography variant="caption" color="warning.dark">
                รออนุมัติ {formatNumber(record.pendingAmount)} {record.currency}
              </Typography>
            )}
          </Stack>
        </TableCell>
      </TableRow>
    ));
  }, [canOpenPurchaseOrder, classes.noResult, data?.data?.records, history]);

  return (
    <Page>
      <PageTitle title="รายการรอชำระเงิน" />
      <Wrapper>
        <GridSearchSection container spacing={1} component="form" onSubmit={formik.handleSubmit}>
          <Grid item xs={12}>
            <Typography variant="h6" component="h2">
              ค้นหารายการรอชำระเงิน
            </Typography>
          </Grid>
          <GridTextField item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="รหัส supplier"
              name="supplierId"
              value={formik.values.supplierId || ''}
              onChange={formik.handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="วันที่เอกสารเริ่มต้น"
              name="docDateStart"
              value={formik.values.docDateStart || ''}
              onChange={formik.handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="วันที่เอกสารสิ้นสุด"
              name="docDateEnd"
              value={formik.values.docDateEnd || ''}
              onChange={formik.handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="คำค้นหา"
              name="keyword"
              placeholder="เลขที่ใบสั่งซื้อ, ใบสั่งขาย, supplier"
              value={formik.values.keyword || ''}
              onChange={formik.handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <Grid item xs={12}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="flex-end">
              <Button
                type="submit"
                variant="contained"
                className="btn-indigo-blue"
                startIcon={<Search />}
                disabled={isFetching}>
                ค้นหา
              </Button>
              <Button
                type="button"
                variant="contained"
                className="btn-amber-orange"
                startIcon={<DisabledByDefault />}
                disabled={isFetching}
                onClick={clear}>
                ล้าง
              </Button>
            </Stack>
          </Grid>
        </GridSearchSection>
        <GridSearchSection container>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {[
                    'ใบสั่งซื้อ',
                    'วันที่เอกสาร',
                    'Supplier',
                    'ใบสั่งซื้อ',
                    'งวดชำระ',
                    'ยอดตามงวด',
                    'ชำระแล้ว',
                    'คงค้าง'
                  ].map((label) => (
                    <TableCell key={label} className={classes.tableHeader}>
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>{rows}</TableBody>
            </Table>
          </TableContainer>
          <Paginate
            pagination={data?.data?.pagination}
            page={page}
            pageSize={pageSize}
            setPage={setPage}
            setPageSize={setPageSize}
            refetch={refetch}
            totalRecords={data?.data?.pagination?.totalRecords}
            isShow
          />
        </GridSearchSection>
      </Wrapper>
    </Page>
  );
}
