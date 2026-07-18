import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Alert, Box, Button, Chip, Container, Paper, Stack, Typography } from '@mui/material';
import LoadingDialog from 'components/LoadingDialog';
import toast from 'react-hot-toast';
import {
  approveAwaitingValidationInvoice,
  rejectAwaitingValidationInvoice,
  resolveAwaitingValidationInvoice
} from 'services/Invoice/invoice-api';
import { InvoiceRecord } from 'services/Invoice/invoice-type';
import { formatDate } from 'utils';
import { formatNumber } from 'utils/utils';

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getCustomerLabel = (invoice?: InvoiceRecord | null) => {
  if (!invoice) {
    return '-';
  }

  const snapshotName = invoice.customerNameSnapshot?.trim();
  if (snapshotName) {
    return snapshotName;
  }

  return invoice.customer?.customerName || '-';
};

const getInvoiceStatusLabel = (status?: string | null) => {
  switch (status) {
    case 'ISSUED':
      return 'ออกใบแจ้งหนี้แล้ว';
    case 'AWAITING_VALIDATION':
      return 'รอตรวจสอบ';
    case 'PARTIALLY_PAID':
      return 'ชำระบางส่วน';
    case 'PAID':
      return 'ชำระแล้ว';
    case 'CANCELLED':
      return 'ยกเลิก';
    case 'VOID':
      return 'เป็นโมฆะ';
    default:
      return status || '-';
  }
};

const getPaymentMethodLabel = (paymentMethod?: string | null) => {
  switch (paymentMethod) {
    case 'TRANSFER':
      return 'โอนเงิน';
    case 'CHEQUE':
      return 'เช็ค';
    case 'CASH':
      return 'เงินสด';
    default:
      return paymentMethod || '-';
  }
};

export default function InvoiceAwaitingValidationPage() {
  const location = useLocation();
  const [token, setToken] = useState('');
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const nextToken = params.get('token') || '';
    setToken(nextToken);

    if (!nextToken) {
      setLoadError('ไม่พบ token สำหรับรายการรับชำระเงิน');
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const response = await resolveAwaitingValidationInvoice(nextToken);
        setInvoice(response.invoice);
        setPaymentId(response.paymentId);
      } catch (error: any) {
        setLoadError(error?.response?.data?.message || 'ไม่สามารถโหลดข้อมูลใบแจ้งหนี้ได้');
      } finally {
        setLoading(false);
      }
    })();
  }, [location.search]);

  const summaryItems = useMemo(() => {
    const latestPayment = (invoice?.payments || []).slice().sort((left, right) => {
      const leftTime = left.paymentDate ? new Date(left.paymentDate).getTime() : 0;
      const rightTime = right.paymentDate ? new Date(right.paymentDate).getTime() : 0;
      return rightTime - leftTime;
    })[0];

    return [
      { label: 'เลขที่ Invoice', value: invoice?.invoiceNo || '-' },
      { label: 'ลูกค้า', value: getCustomerLabel(invoice) },
      { label: 'วันที่รับชำระ', value: formatDateTime(latestPayment?.paymentDate) },
      { label: 'วิธีการชำระ', value: getPaymentMethodLabel(latestPayment?.paymentMethod) },
      { label: 'ยอดรับชำระ', value: formatNumber(invoice?.paidTotal || 0) }
    ];
  }, [invoice]);

  const latestPayment = useMemo(() => {
    const payments = invoice?.payments || [];
    if (paymentId != null) {
      const targetPayment = payments.find((payment) => payment.id === paymentId);
      if (targetPayment) {
        return targetPayment;
      }
    }
    return payments.slice().sort((left, right) => {
      const leftTime = left.paymentDate ? new Date(left.paymentDate).getTime() : 0;
      const rightTime = right.paymentDate ? new Date(right.paymentDate).getTime() : 0;
      return rightTime - leftTime;
    })[0];
  }, [invoice, paymentId]);

  const canReview = Boolean(
    token &&
    latestPayment &&
    latestPayment.status === 'PENDING' &&
    invoice?.status === 'AWAITING_VALIDATION'
  );

  const handleApprove = async () => {
    if (!token) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await toast.promise(approveAwaitingValidationInvoice(token), {
        loading: 'กำลังอนุมัติรายการรับชำระเงิน',
        success: 'อนุมัติรายการรับชำระเงินแล้ว',
        error: 'ไม่สามารถอนุมัติรายการรับชำระเงินได้'
      });
      setInvoice(response.invoice);
      setPaymentId(response.paymentId);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!token) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await toast.promise(rejectAwaitingValidationInvoice(token), {
        loading: 'กำลังปฏิเสธรายการรับชำระเงิน',
        success: 'ปฏิเสธรายการรับชำระเงินแล้ว',
        error: 'ไม่สามารถปฏิเสธรายการรับชำระเงินได้'
      });
      setInvoice(response.invoice);
      setPaymentId(response.paymentId);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: { xs: 2.5, sm: 4 }, mb: { xs: 2, sm: 0 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              รายการรับชำระเงินรอตรวจสอบ
            </Typography>
            <Typography variant="body2" color="text.secondary">
              เปิดดูรายการนี้ได้จากลิงก์แจ้งเตือนโดยไม่ต้องเข้าสู่ระบบ
            </Typography>
          </Box>
          {invoice?.status ? (
            <Chip color="warning" label={getInvoiceStatusLabel(invoice.status)} />
          ) : null}
        </Stack>

        {loadError ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {loadError}
          </Alert>
        ) : null}

        {invoice ? (
          <Stack spacing={3}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                gap: 2
              }}>
              {summaryItems.map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 2
                  }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    {item.label}
                  </Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
                หลักฐานการชำระเงิน
              </Typography>
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 2
                }}>
                {latestPayment?.slipFileUrl ? (
                  <Box
                    component="img"
                    src={latestPayment.slipFileUrl}
                    alt={latestPayment.slipFileName || 'payment-slip'}
                    sx={{
                      display: 'block',
                      width: '100%',
                      maxHeight: 560,
                      objectFit: 'contain',
                      bgcolor: '#f8fafc'
                    }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    ไม่พบรูปภาพแนบ
                  </Typography>
                )}
              </Box>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
              <Button
                variant="contained"
                color="error"
                disabled={!canReview || submitting}
                onClick={handleReject}>
                ปฏิเสธการชำระ
              </Button>
              <Button
                variant="contained"
                color="success"
                disabled={!canReview || submitting}
                onClick={handleApprove}>
                อนุมัติรับชำระเงิน
              </Button>
            </Stack>
          </Stack>
        ) : null}
      </Paper>

      <LoadingDialog open={loading || submitting} />
    </Container>
  );
}
