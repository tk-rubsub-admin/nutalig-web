import { BRAND_COLORS } from 'theme/brandTokens';
import { CheckCircleOutline, Close, OpenInNew, Refresh, Search } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { GridSearchSection, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import {
  approveInvoicePayment,
  getPendingInvoicePayments,
  rejectInvoicePayment
} from 'services/Invoice/invoice-api';
import { InvoicePendingPaymentRecord } from 'services/Invoice/invoice-type';
import { formatNumber } from 'utils/utils';
import { formatDate } from 'utils';
import toast from 'react-hot-toast';

const paymentMethodLabels: Record<string, string> = {
  TRANSFER: 'โอนเงิน',
  CHEQUE: 'เช็ค',
  CASH: 'เงินสด'
};

export default function PendingInvoicePayments(): JSX.Element {
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
  const [keyword, setKeyword] = useState('');
  const [submittedKeyword, setSubmittedKeyword] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<InvoicePendingPaymentRecord | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: records = [], isFetching, refetch } = useQuery(
    ['pending-invoice-payments'],
    getPendingInvoicePayments,
    { refetchOnWindowFocus: false, keepPreviousData: true }
  );

  const filteredRecords = useMemo(() => {
    const normalized = submittedKeyword.trim().toLowerCase();
    if (!normalized) return records;
    return records.filter((record: InvoicePendingPaymentRecord) =>
      [record.invoiceNo, record.salesOrderNo, record.customerId, record.customerName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [records, submittedKeyword]);

  const clearSearch = () => {
    setKeyword('');
    setSubmittedKeyword('');
  };

  const handleApprove = async () => {
    if (!selectedRecord) return;
    setIsSubmitting(true);
    try {
      await toast.promise(approveInvoicePayment(selectedRecord.invoiceNo, selectedRecord.paymentId), {
        loading: 'กำลังอนุมัติรายการรับชำระเงิน',
        success: 'อนุมัติรายการรับชำระเงินแล้ว',
        error: (error: any) => error?.response?.data?.message || 'ไม่สามารถอนุมัติรายการได้'
      });
      setSelectedRecord(null);
      await refetch();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRecord || !rejectReason.trim()) return;
    setIsSubmitting(true);
    try {
      await toast.promise(
        rejectInvoicePayment(selectedRecord.invoiceNo, selectedRecord.paymentId, rejectReason.trim()),
        {
          loading: 'กำลังปฏิเสธรายการรับชำระเงิน',
          success: 'ปฏิเสธรายการรับชำระเงินแล้ว',
          error: (error: any) => error?.response?.data?.message || 'ไม่สามารถปฏิเสธรายการได้'
        }
      );
      setRejectDialogOpen(false);
      setRejectReason('');
      setSelectedRecord(null);
      await refetch();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page>
      <PageTitle title="รายการรอรับชำระเงิน (ใบแจ้งหนี้)" />
      <Wrapper>
        <GridSearchSection container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              label="ค้นหา"
              placeholder="เลขที่ใบแจ้งหนี้, SO หรือชื่อลูกค้า"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') setSubmittedKeyword(keyword);
              }}
            />
          </Grid>
          <Grid item xs={12} md="auto">
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<Search />} onClick={() => setSubmittedKeyword(keyword)}>
                ค้นหา
              </Button>
              <Button variant="outlined" onClick={clearSearch}>ล้าง</Button>
              <Button variant="outlined" startIcon={<Refresh />} onClick={() => void refetch()} disabled={isFetching}>
                รีเฟรช
              </Button>
            </Stack>
          </Grid>
        </GridSearchSection>

        <GridSearchSection container sx={{ mt: 0 }}>
          <Grid item xs={12}>
            <Stack spacing={1.25}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6">รายการรับชำระเงินที่รอตรวจสอบ</Typography>
                <Chip size="small" color="warning" label={`${filteredRecords.length} รายการ`} />
              </Stack>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell className={classes.tableHeader}>ใบแจ้งหนี้</TableCell>
                      <TableCell className={classes.tableHeader}>Sales Order</TableCell>
                      <TableCell className={classes.tableHeader}>ลูกค้า</TableCell>
                      <TableCell className={classes.tableHeader}>วันที่รับชำระ</TableCell>
                      <TableCell className={classes.tableHeader}>วิธีชำระ</TableCell>
                      <TableCell className={classes.tableHeader}>จำนวนเงิน</TableCell>
                      <TableCell className={classes.tableHeader}>สถานะ</TableCell>
                      <TableCell className={classes.tableHeader}>ดำเนินการ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {!filteredRecords.length ? (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <div className={classes.noResult}>{isFetching ? 'กำลังโหลดข้อมูล...' : 'ไม่พบรายการรอรับชำระเงิน'}</div>
                        </TableCell>
                      </TableRow>
                    ) : filteredRecords.map((record) => (
                      <TableRow
                        hover
                        key={`${record.invoiceNo}-${record.paymentId}`}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => setSelectedRecord(record)}>
                        <TableCell align="center">{record.invoiceNo}</TableCell>
                        <TableCell align="center">{record.salesOrderNo || '-'}</TableCell>
                        <TableCell>{record.customerName || record.customerId || '-'}</TableCell>
                        <TableCell align="center">{record.paymentDate ? formatDate(record.paymentDate, 'DD/MM/YYYY') : '-'}</TableCell>
                        <TableCell align="center">{paymentMethodLabels[record.paymentMethod] || record.paymentMethod}</TableCell>
                        <TableCell align="right">{formatNumber(record.receivedAmount ?? record.amount)} THB</TableCell>
                        <TableCell align="center"><Chip size="small" color="warning" label="รอตรวจสอบ" /></TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedRecord(record);
                            }}>
                            <OpenInNew fontSize="small" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </Grid>
        </GridSearchSection>
      </Wrapper>

      <Dialog open={Boolean(selectedRecord)} onClose={() => !isSubmitting && setSelectedRecord(null)} fullWidth maxWidth="sm">
        <DialogTitle>รายการรับชำระเงินรอตรวจสอบ</DialogTitle>
        <DialogContent dividers>
          {selectedRecord ? (
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography fontWeight={700}>Invoice</Typography>
                <Typography>{selectedRecord.invoiceNo}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography fontWeight={700}>ลูกค้า</Typography>
                <Typography>{selectedRecord.customerName || selectedRecord.customerId || '-'}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography fontWeight={700}>วันที่รับชำระ</Typography>
                <Typography>{selectedRecord.paymentDate ? formatDate(selectedRecord.paymentDate, 'DD/MM/YYYY HH:mm') : '-'}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography fontWeight={700}>วิธีชำระ</Typography>
                <Typography>{paymentMethodLabels[selectedRecord.paymentMethod] || selectedRecord.paymentMethod}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography fontWeight={700}>จำนวนเงินที่แจ้ง</Typography>
                <Typography>{formatNumber(selectedRecord.receivedAmount ?? selectedRecord.amount)} THB</Typography>
              </Stack>
              {selectedRecord.unallocatedAmount && selectedRecord.unallocatedAmount > 0 ? (
                <Stack direction="row" justifyContent="space-between">
                  <Typography fontWeight={700}>ยอดเกิน/เงินล่วงหน้า</Typography>
                  <Typography>{formatNumber(selectedRecord.unallocatedAmount)} THB</Typography>
                </Stack>
              ) : null}
              {selectedRecord.slipFileUrl ? (
                <Stack spacing={0.75}>
                  <Typography fontWeight={700}>หลักฐานการโอน</Typography>
                  <Box
                    component="img"
                    src={selectedRecord.slipFileUrl}
                    alt={selectedRecord.slipFileName || 'หลักฐานการโอน'}
                    sx={{
                      display: 'block',
                      width: '100%',
                      maxHeight: 520,
                      objectFit: 'contain',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: 'grey.100'
                    }}
                  />
                </Stack>
              ) : null}
              <Chip color="warning" label="รอตรวจสอบ" sx={{ alignSelf: 'flex-start' }} />
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button startIcon={<OpenInNew />} onClick={() => selectedRecord && history.push(ROUTE_PATHS.INVOICE_DETAIL.replace(':id', selectedRecord.invoiceNo))}>
            เปิด Invoice
          </Button>
          <Button color="error" startIcon={<Close />} onClick={() => setRejectDialogOpen(true)} disabled={isSubmitting}>
            ปฏิเสธ
          </Button>
          <Button variant="contained" color="success" startIcon={<CheckCircleOutline />} onClick={() => void handleApprove()} disabled={isSubmitting}>
            อนุมัติ
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rejectDialogOpen} onClose={() => !isSubmitting && setRejectDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>ปฏิเสธรายการรับชำระเงิน</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="เหตุผลที่ปฏิเสธ"
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={isSubmitting}>ยกเลิก</Button>
          <Button color="error" variant="contained" onClick={() => void handleReject()} disabled={isSubmitting || !rejectReason.trim()}>
            ยืนยันปฏิเสธ
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  );
}
