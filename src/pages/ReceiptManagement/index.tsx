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
import { ReceiptRecord, ReceiptType, SearchReceiptRequest } from 'services/Receipt/receipt-type';
import { searchReceipts } from 'services/Receipt/receipt-api';
import { formatDate } from 'utils';
import { formatNumber } from 'utils/utils';

const RECEIPT_STATUS_OPTIONS = ['ISSUED', 'CANCELLED', 'VOID'];
const RECEIPT_TYPE_OPTIONS: { value: ReceiptType; label: string }[] = [
  { value: 'RECEIPT', label: 'ใบเสร็จรับเงิน' },
  { value: 'DEPOSIT_RECEIPT', label: 'ใบรับเงินมัดจำ' },
  { value: 'RECEIPT_TAX_INVOICE', label: 'ใบเสร็จรับเงิน/ใบกำกับภาษี' },
  { value: 'DEPOSIT_TAX_INVOICE', label: 'ใบรับเงินมัดจำ/ใบกำกับภาษี' }
];

function getReceiptStatusColor(status?: string) {
  switch (status) {
    case 'ISSUED':
      return { backgroundColor: '#dcfce7', color: '#166534' };
    case 'CANCELLED':
      return { backgroundColor: '#fef3c7', color: '#92400e' };
    case 'VOID':
      return { backgroundColor: '#fee2e2', color: '#991b1b' };
    default:
      return { backgroundColor: '#e5e7eb', color: '#374151' };
  }
}

function getReceiptStatusLabel(status?: string | null): string {
  switch (status) {
    case 'ISSUED':
      return 'ออกเอกสารแล้ว';
    case 'CANCELLED':
      return 'ยกเลิก';
    case 'VOID':
      return 'Void';
    default:
      return status || '-';
  }
}

export default function ReceiptManagement(): JSX.Element {
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

  const defaultFilter: SearchReceiptRequest = {
    receiptNo: '',
    docDateStart: '',
    docDateEnd: '',
    receiptType: null,
    status: null,
    keyword: ''
  };

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [receiptFilter, setReceiptFilter] = useState<SearchReceiptRequest>(defaultFilter);

  const {
    data: receiptList,
    refetch: refetchReceipts,
    isFetching: isReceiptFetching
  } = useQuery(
    ['receipt-list', receiptFilter, page, pageSize],
    () => searchReceipts(receiptFilter, page, pageSize),
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true
    }
  );

  const searchFormik = useFormik<SearchReceiptRequest>({
    initialValues: defaultFilter,
    enableReinitialize: false,
    onSubmit: (values) => {
      const nextFilter: SearchReceiptRequest = {
        receiptNo: values.receiptNo?.trim() || '',
        docDateStart: values.docDateStart || '',
        docDateEnd: values.docDateEnd || '',
        receiptType: values.receiptType || null,
        status: values.status || null,
        keyword: values.keyword?.trim() || ''
      };

      setPage(1);

      if (page === 1 && JSON.stringify(receiptFilter) === JSON.stringify(nextFilter)) {
        refetchReceipts();
        return;
      }

      setReceiptFilter(nextFilter);
    }
  });

  const handleClear = () => {
    searchFormik.resetForm();
    setPage(1);

    if (page === 1 && JSON.stringify(receiptFilter) === JSON.stringify(defaultFilter)) {
      refetchReceipts();
      return;
    }

    setReceiptFilter(defaultFilter);
  };

  const openReceiptDetail = (receiptNo: string) => {
    history.push(ROUTE_PATHS.RECEIPT_DETAIL.replace(':id', receiptNo));
  };

  const receiptRows = useMemo(() => {
    if (!receiptList?.data?.records?.length) {
      return (
        <TableRow>
          <TableCell colSpan={8}>
            <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
          </TableCell>
        </TableRow>
      );
    }

    return receiptList.data.records.map((receipt: ReceiptRecord) => (
      <TableRow hover key={receipt.receiptNo} sx={{ cursor: 'pointer' }} onClick={() => openReceiptDetail(receipt.receiptNo)}>
        <TableCell align="center">
          <Stack spacing={1} alignItems="center">
            <Typography variant="body2">{receipt.receiptNo}</Typography>
            <Chip
              label={getReceiptStatusLabel(receipt.status)}
              size="small"
              sx={{ ...getReceiptStatusColor(receipt.status), fontWeight: 700 }}
            />
          </Stack>
        </TableCell>
        <TableCell align="center">
          {RECEIPT_TYPE_OPTIONS.find((option) => option.value === receipt.receiptType)?.label ||
            receipt.receiptType}
        </TableCell>
        <TableCell align="center">{receipt.docDate || '-'}</TableCell>
        <TableCell align="center">
          {receipt.paidDate ? formatDate(receipt.paidDate, 'DD/MM/YYYY HH:mm') : '-'}
        </TableCell>
        <TableCell align="center">
          {receipt.customer ? `(${receipt.customer.id}) ${receipt.customer.customerName}` : '-'}
        </TableCell>
        <TableCell align="center">
          {receipt.saleAccount?.nickName || receipt.coSaleId || '-'}
        </TableCell>
        <TableCell align="center">{receipt.invoiceNo || '-'}</TableCell>
        <TableCell align="right">{formatNumber(receipt.grandTotal || 0)}</TableCell>
      </TableRow>
    ));
  }, [classes.noResultMessage, receiptList?.data?.records, t]);

  const receiptMobileRows = useMemo(() => {
    if (!receiptList?.data?.records?.length) {
      return (
        <TableRow>
          <TableCell>
            <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
          </TableCell>
        </TableRow>
      );
    }

    return receiptList.data.records.map((receipt: ReceiptRecord) => (
      <TableRow hover key={receipt.receiptNo} sx={{ cursor: 'pointer' }} onClick={() => openReceiptDetail(receipt.receiptNo)}>
        <TableCell sx={{ pt: 2, pb: 2 }}>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body1" fontWeight={600}>
                {receipt.receiptNo}
              </Typography>
              <Chip
                label={getReceiptStatusLabel(receipt.status)}
                size="small"
                sx={{ ...getReceiptStatusColor(receipt.status), fontWeight: 700 }}
              />
            </Stack>
            <Typography variant="body2" fontWeight={500}>
              {RECEIPT_TYPE_OPTIONS.find((option) => option.value === receipt.receiptType)?.label ||
                receipt.receiptType}
            </Typography>
            <Typography variant="body2">{receipt.docDate || '-'}</Typography>
            <Typography variant="body2">
              {receipt.paidDate ? formatDate(receipt.paidDate, 'DD/MM/YYYY HH:mm') : '-'}
            </Typography>
            <Typography variant="body2">
              {receipt.customer ? `(${receipt.customer.id}) ${receipt.customer.customerName}` : '-'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {receipt.saleAccount?.nickName || receipt.coSaleId || '-'}
            </Typography>
            <Typography variant="body2">{receipt.invoiceNo || '-'}</Typography>
            <Typography variant="body1" fontWeight={600}>
              {formatNumber(receipt.grandTotal || 0)}
            </Typography>
          </Stack>
        </TableCell>
      </TableRow>
    ));
  }, [classes.noResultMessage, receiptList?.data?.records, t]);

  return (
    <Page>
      <PageTitle title={t('sidebar.documentManagement.receipt')} />
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
            disabled={isReceiptFetching}
            onClick={() => searchFormik.handleSubmit()}>
            {t('button.search')}
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-amber-orange"
            startIcon={<DisabledByDefault />}
            disabled={isReceiptFetching}
            onClick={handleClear}>
            {t('button.clear')}
          </Button>
        </Stack>

        <GridSearchSection container spacing={1} component="form" onSubmit={searchFormik.handleSubmit}>
          <Grid item xs={12}>
            <Typography variant="h6" component="h2">
              ค้นหาใบเสร็จรับเงิน
            </Typography>
          </Grid>
          <GridTextField item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              label="เลขที่ใบเสร็จรับเงิน"
              name="receiptNo"
              value={searchFormik.values.receiptNo || ''}
              onChange={searchFormik.handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              select
              label="ประเภทเอกสาร"
              name="receiptType"
              value={searchFormik.values.receiptType || ''}
              onChange={searchFormik.handleChange}
              InputLabelProps={{ shrink: true }}>
              <MenuItem value="">ทั้งหมด</MenuItem>
              {RECEIPT_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
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
              {RECEIPT_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status} value={status}>
                  {getReceiptStatusLabel(status)}
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
              placeholder="เลขที่ใบเสร็จรับเงิน, ชื่อลูกค้า, เลขที่ใบแจ้งหนี้"
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
                        ใบเสร็จรับเงิน
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isReceiptFetching ? (
                      <TableRow>
                        <TableCell align="center">
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : (
                      receiptMobileRows
                    )}
                  </TableBody>
                </>
              ) : (
                <>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" className={classes.tableHeader}>
                        เลขที่ใบเสร็จรับเงิน
                      </TableCell>
                      <TableCell align="center" className={classes.tableHeader}>
                        ประเภทเอกสาร
                      </TableCell>
                      <TableCell align="center" className={classes.tableHeader}>
                        วันที่เอกสาร
                      </TableCell>
                      <TableCell align="center" className={classes.tableHeader}>
                        วันที่รับชำระ
                      </TableCell>
                      <TableCell align="center" className={classes.tableHeader}>
                        ลูกค้า
                      </TableCell>
                      <TableCell align="center" className={classes.tableHeader}>
                        ฝ่ายขาย
                      </TableCell>
                      <TableCell align="center" className={classes.tableHeader}>
                        เลขที่ใบแจ้งหนี้
                      </TableCell>
                      <TableCell align="center" className={classes.tableHeader}>
                        ยอดรวม
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isReceiptFetching ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : (
                      receiptRows
                    )}
                  </TableBody>
                </>
              )}
            </Table>
          </TableContainer>
        </GridSearchSection>

        <Paginate
          pagination={receiptList?.data?.pagination}
          page={page}
          pageSize={pageSize}
          setPage={setPage}
          setPageSize={setPageSize}
          refetch={refetchReceipts}
          totalRecords={receiptList?.data?.pagination?.totalRecords}
          isShow={!isDownSm}
        />
      </Wrapper>
    </Page>
  );
}
