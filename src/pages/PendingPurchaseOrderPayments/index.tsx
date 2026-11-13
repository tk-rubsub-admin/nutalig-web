import { BRAND_COLORS } from 'theme/brandTokens';
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
import { Page } from 'layout/LayoutRoute';
import { useFormik } from 'formik';
import { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
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
  keyword: '',
  scheduleStatus: 'AWAITING_PAYMENT_SETUP'
};

const paymentTypeLabels: Record<string, string> = {
  DEPOSIT: 'มัดจำ',
  BALANCE: 'ส่วนที่เหลือ',
  INSTALLMENT: 'งวด',
  OTHER: 'อื่น ๆ'
};

export default function PendingPurchaseOrderPayments(): JSX.Element {
  const classes = makeStyles({
    tableHeader: {
      border: `2px solid ${BRAND_COLORS.sand}`,
      fontWeight: 'bold',
      textAlign: 'center',
      whiteSpace: 'nowrap'
    },
    noResult: { textAlign: 'center', fontSize: '1.1em', fontWeight: 'bold', padding: '40px 0' }
  })();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filter, setFilter] = useState(defaultFilter);
  const history = useHistory();
  const { data, isFetching, refetch } = useQuery(
    ['pending-purchase-order-payment-schedules', filter, page, pageSize],
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
        keyword: values.keyword?.trim() || '',
        scheduleStatus: values.scheduleStatus
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
          <TableCell colSpan={5}>
            <div className={classes.noResult}>
              {isFetching ? 'กำลังโหลดข้อมูล...' : 'ไม่พบรายการรอตั้งจ่าย'}
            </div>
          </TableCell>
        </TableRow>
      );
    }
    return records.map((record: PendingSupplierPaymentRecord) => (
      <TableRow
        hover
        key={record.scheduleId}
        sx={{ cursor: 'pointer' }}
        onClick={() =>
          history.push(
            `${ROUTE_PATHS.PURCHASE_ORDER_DETAIL.replace(':id', record.purchaseOrderNo)}?tab=payment&openPaymentInstruction=1&instructionScheduleId=${record.scheduleId}`
          )
        }>
        <TableCell align="left">
          {record.purchaseOrderNo}#{record.installmentNo} ·{' '}
          {paymentTypeLabels[record.paymentType] || record.paymentType}
        </TableCell>
        <TableCell align="left">{record.supplierName}</TableCell>
        <TableCell align="right">
          {formatNumber(record.expectedAmount)} {record.currency}
        </TableCell>
        <TableCell align="right">
          {formatNumber(record.paidAmount)} {record.currency} / {formatNumber(record.outstandingAmount)} {record.currency}
        </TableCell>
        <TableCell align="center">{record.dueDate || '-'}</TableCell>
      </TableRow>
    ));
  }, [classes.noResult, data?.data?.records, history, isFetching]);

  return (
    <Page>
      <PageTitle title="รอตั้งจ่าย (ใบสั่งซื้อ)" />
      <Wrapper>
        <GridSearchSection container spacing={1} component="form" onSubmit={formik.handleSubmit}>
          <Grid item xs={12}>
            <Typography variant="h6" component="h2">
              ค้นหารายการ Payment Schedule รอตั้งจ่าย
            </Typography>
          </Grid>
          <GridTextField item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="รหัส supplier"
              name="supplierId"
              value={formik.values.supplierId || ''}
              onChange={formik.handleChange}
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
              placeholder="ค้นหารายการ"
              value={formik.values.keyword || ''}
              onChange={formik.handleChange}
            />
          </GridTextField>
          <Grid item xs={12}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="flex-end">
              <Button
                type="submit"
                variant="contained"
                startIcon={<Search />}
                disabled={isFetching}>
                ค้นหา
              </Button>
              <Button
                type="button"
                variant="contained"
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
                    'รายการใบสั่งซื้อ/งวด',
                    'Supplier',
                    'ยอดตามงวด',
                    'ชำระแล้ว/คงค้าง',
                    'กำหนดจ่าย'
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
