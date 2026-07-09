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
import { InvoiceRecord, SearchInvoiceRequest } from 'services/Invoice/invoice-type';
import { searchInvoices } from 'services/Invoice/invoice-api';
import { formatNumber } from 'utils/utils';

const INVOICE_STATUS_OPTIONS = ['ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'VOID'];

export default function InvoiceManagement(): JSX.Element {
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

  const defaultFilter: SearchInvoiceRequest = {
    invoiceNo: '',
    docDateStart: '',
    docDateEnd: '',
    status: null,
    keyword: ''
  };

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [invoiceFilter, setInvoiceFilter] = useState<SearchInvoiceRequest>(defaultFilter);

  const {
    data: invoiceList,
    refetch: refetchInvoices,
    isFetching: isInvoiceFetching
  } = useQuery(
    ['invoice-list', invoiceFilter, page, pageSize],
    () => searchInvoices(invoiceFilter, page, pageSize),
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true
    }
  );

  const searchFormik = useFormik<SearchInvoiceRequest>({
    initialValues: defaultFilter,
    enableReinitialize: false,
    onSubmit: (values) => {
      const nextFilter: SearchInvoiceRequest = {
        invoiceNo: values.invoiceNo?.trim() || '',
        docDateStart: values.docDateStart || '',
        docDateEnd: values.docDateEnd || '',
        status: values.status || null,
        keyword: values.keyword?.trim() || ''
      };

      setPage(1);

      if (page === 1 && JSON.stringify(invoiceFilter) === JSON.stringify(nextFilter)) {
        refetchInvoices();
        return;
      }

      setInvoiceFilter(nextFilter);
    }
  });

  const handleClear = () => {
    searchFormik.resetForm();
    setPage(1);

    if (page === 1 && JSON.stringify(invoiceFilter) === JSON.stringify(defaultFilter)) {
      refetchInvoices();
      return;
    }

    setInvoiceFilter(defaultFilter);
  };

  const openInvoiceDetail = (invoiceNo: string) => {
    history.push(ROUTE_PATHS.INVOICE_DETAIL.replace(':id', invoiceNo));
  };

  const invoiceRows = useMemo(() => {
    if (!invoiceList?.data?.records?.length) {
      return (
        <TableRow>
          <TableCell colSpan={7}>
            <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
          </TableCell>
        </TableRow>
      );
    }

    return invoiceList.data.records.map((invoice: InvoiceRecord) => (
      <TableRow
        hover
        key={invoice.invoiceNo}
        sx={{ cursor: 'pointer' }}
        onClick={() => openInvoiceDetail(invoice.invoiceNo)}>
        <TableCell align="center">
          <Stack spacing={1} alignItems="center">
            <Typography variant="body2">{invoice.invoiceNo}</Typography>
            <Stack
              direction="row"
              spacing={0.75}
              justifyContent="center"
              flexWrap="wrap"
              useFlexGap>
              <Chip label={invoice.status} size="small" />
            </Stack>
          </Stack>
        </TableCell>
        <TableCell align="center">{invoice.docDate || '-'}</TableCell>
        <TableCell align="center">{invoice.dueDate || '-'}</TableCell>
        <TableCell align="center">
          {invoice.customer ? `(${invoice.customer.id}) ${invoice.customer.customerName}` : '-'}
        </TableCell>
        <TableCell align="center">
          {invoice.saleAccount?.nickName || invoice.salesNameSnapshot || '-'}
        </TableCell>
        <TableCell align="right">{formatNumber(invoice.grandTotal || 0)}</TableCell>
        <TableCell align="right">{formatNumber(invoice.outstandingTotal || 0)}</TableCell>
      </TableRow>
    ));
  }, [classes.noResultMessage, invoiceList?.data?.records, t]);

  const invoiceMobileRows = useMemo(() => {
    if (!invoiceList?.data?.records?.length) {
      return (
        <TableRow>
          <TableCell>
            <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
          </TableCell>
        </TableRow>
      );
    }

    return invoiceList.data.records.map((invoice: InvoiceRecord) => (
      <TableRow
        hover
        key={invoice.invoiceNo}
        sx={{ cursor: 'pointer' }}
        onClick={() => openInvoiceDetail(invoice.invoiceNo)}>
        <TableCell sx={{ pt: 2, pb: 2 }}>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body1" fontWeight={600}>
                {invoice.invoiceNo}
              </Typography>
              <Chip label={invoice.status} size="small" />
            </Stack>
            <Typography variant="body2">{invoice.docDate || '-'}</Typography>
            <Typography variant="body2">{invoice.dueDate || '-'}</Typography>
            <Typography variant="body2">
              {invoice.customer ? `(${invoice.customer.id}) ${invoice.customer.customerName}` : '-'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {invoice.saleAccount?.nickName || invoice.salesNameSnapshot || '-'}
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {formatNumber(invoice.grandTotal || 0)}
            </Typography>
            <Typography variant="body2" color="error.main">
              คงเหลือ {formatNumber(invoice.outstandingTotal || 0)}
            </Typography>
          </Stack>
        </TableCell>
      </TableRow>
    ));
  }, [classes.noResultMessage, invoiceList?.data?.records, t]);

  return (
    <Page>
      <PageTitle title={t('documentManagement.invoice.title')} />
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
            disabled={isInvoiceFetching}
            onClick={() => searchFormik.handleSubmit()}>
            {t('button.search')}
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-amber-orange"
            startIcon={<DisabledByDefault />}
            disabled={isInvoiceFetching}
            onClick={handleClear}>
            {t('button.clear')}
          </Button>
        </Stack>

        <GridSearchSection
          container
          spacing={1}
          component="form"
          onSubmit={searchFormik.handleSubmit}>
          <Grid item xs={12}>
            <Typography variant="h6" component="h2">
              ค้นหาใบแจ้งหนี้
            </Typography>
          </Grid>
          <GridTextField item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              label="เลขที่ใบแจ้งหนี้"
              name="invoiceNo"
              value={searchFormik.values.invoiceNo || ''}
              onChange={searchFormik.handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              select
              label="สถานะ"
              name="status"
              value={searchFormik.values.status || ''}
              onChange={searchFormik.handleChange}
              InputLabelProps={{ shrink: true }}>
              <MenuItem value="">ทั้งหมด</MenuItem>
              {INVOICE_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
          </GridTextField>
          <GridTextField item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              type="date"
              label="วันที่เอกสารเริ่มต้น"
              name="docDateStart"
              value={searchFormik.values.docDateStart || ''}
              onChange={searchFormik.handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              type="date"
              label="วันที่เอกสารสิ้นสุด"
              name="docDateEnd"
              value={searchFormik.values.docDateEnd || ''}
              onChange={searchFormik.handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={8} md={6}>
            <TextField
              fullWidth
              label="คำค้นหา"
              name="keyword"
              placeholder="เลขที่ใบแจ้งหนี้, ชื่อลูกค้า"
              value={searchFormik.values.keyword || ''}
              onChange={searchFormik.handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
        </GridSearchSection>

        <GridSearchSection container>
          <TableContainer>
            <Table>
              {isMobileOnly ? (
                <>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" className={classes.tableHeader}>
                        ใบแจ้งหนี้
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isInvoiceFetching ? (
                      <TableRow>
                        <TableCell align="center">
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoiceMobileRows
                    )}
                  </TableBody>
                </>
              ) : (
                <>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" className={classes.tableHeader}>
                        เลขที่ใบแจ้งหนี้
                      </TableCell>
                      <TableCell align="center" className={classes.tableHeader}>
                        วันที่เอกสาร
                      </TableCell>
                      <TableCell align="center" className={classes.tableHeader}>
                        ครบกำหนด
                      </TableCell>
                      <TableCell align="center" className={classes.tableHeader}>
                        ลูกค้า
                      </TableCell>
                      <TableCell align="center" className={classes.tableHeader}>
                        ฝ่ายขาย
                      </TableCell>
                      <TableCell align="center" className={classes.tableHeader}>
                        ยอดรวม
                      </TableCell>
                      <TableCell align="center" className={classes.tableHeader}>
                        ยอดคงเหลือ
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isInvoiceFetching ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoiceRows
                    )}
                  </TableBody>
                </>
              )}
            </Table>
          </TableContainer>
        </GridSearchSection>

        <Paginate
          pagination={invoiceList?.data?.pagination}
          page={page}
          pageSize={pageSize}
          setPage={setPage}
          setPageSize={setPageSize}
          refetch={refetchInvoices}
          totalRecords={invoiceList?.data?.pagination?.totalRecords}
          isShow={!isDownSm}
        />
      </Wrapper>
    </Page>
  );
}
