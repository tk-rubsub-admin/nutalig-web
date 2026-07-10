import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Alert, Box, Button, Container, Paper, TextField, Typography } from '@mui/material';
import toast from 'react-hot-toast';
import LoadingDialog from 'components/LoadingDialog';
import { resolveApprovalRejectToken, submitApprovalRejectByToken } from 'services/Approval/approval-api';
import { ApprovalRejectTokenResolve } from 'services/Approval/approval-type';

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

export default function ApprovalRejectPage() {
  const location = useLocation();
  const [token, setToken] = useState('');
  const [approval, setApproval] = useState<ApprovalRejectTokenResolve | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const nextToken = params.get('token') || '';
    setToken(nextToken);

    if (!nextToken) {
      setLoadError('ไม่พบ token สำหรับคำขออนุมัติ');
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const response = await resolveApprovalRejectToken(nextToken);
        setApproval(response);
        setReason(response.rejectReason || '');
      } catch (error: any) {
        setLoadError(error?.response?.data?.message || 'ไม่สามารถโหลดข้อมูลคำขออนุมัติได้');
      } finally {
        setLoading(false);
      }
    })();
  }, [location.search]);

  const summaryItems = useMemo(() => {
    const payload = approval?.payload || {};
    return [
      { label: 'เลขที่คำขอ', value: approval?.requestNo || '-' },
      { label: 'เลขที่เอกสารอ้างอิง', value: approval?.referenceId || '-' },
      { label: 'ลูกค้า', value: payload.customerName || '-' },
      { label: 'ประเภทงาน', value: payload.orderTypeName || '-' },
      { label: 'RFQ Type', value: payload.rfqTypeName || '-' },
      { label: 'ขนาด', value: payload.capacity || '-' },
      { label: 'ผู้ขอ', value: payload.salesName || '-' },
      { label: 'วันที่ขออนุมัติ', value: formatDateTime(approval?.requestedDate) }
    ];
  }, [approval]);

  const canSubmit = approval?.status === 'PENDING' && reason.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!token || !reason.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await toast.promise(
        submitApprovalRejectByToken({
          token,
          reason: reason.trim()
        }),
        {
          loading: 'กำลังบันทึกเหตุผลไม่อนุมัติ',
          success: 'บันทึกเหตุผลและปฏิเสธรายการแล้ว',
          error: 'ไม่สามารถบันทึกเหตุผลไม่อนุมัติได้'
        }
      );
      setSubmitted(true);
      setApproval((current) => (current ? { ...current, status: 'REJECTED', rejectReason: reason.trim() } : current));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          ปฏิเสธคำขออนุมัติ
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          กรุณาระบุเหตุผลเพื่อบันทึกในประวัติการอนุมัติ
        </Typography>

        {loadError ? <Alert severity="error" sx={{ mb: 3 }}>{loadError}</Alert> : null}

        {approval ? (
          <Box sx={{ display: 'grid', gap: 1.5, mb: 3 }}>
            {summaryItems.map((item) => (
              <Box
                key={item.label}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  pb: 1
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="body2" fontWeight={600} textAlign="right">
                  {item.value}
                </Typography>
              </Box>
            ))}

            <Box
              sx={{
                mt: 1,
                p: 2,
                borderRadius: 1.5,
                bgcolor: '#FFF7E6'
              }}
            >
              <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                เหตุผลความเร่งด่วน
              </Typography>
              <Typography variant="body2">
                {approval.payload?.urgentReason || '-'}
              </Typography>
            </Box>
          </Box>
        ) : null}

        {submitted || approval?.status === 'REJECTED' ? (
          <Alert severity="success" sx={{ mb: 3 }}>
            รายการนี้ถูกปฏิเสธแล้ว
          </Alert>
        ) : null}

        <TextField
          fullWidth
          multiline
          minRows={4}
          label="เหตุผลไม่อนุมัติ"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          disabled={approval?.status !== 'PENDING' || submitting}
          error={!reason.trim() && (submitted || approval?.status === 'PENDING')}
          helperText={!reason.trim() ? 'กรุณาระบุเหตุผลไม่อนุมัติ' : ' '}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            color="error"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            ยืนยันการปฏิเสธ
          </Button>
        </Box>
      </Paper>

      <LoadingDialog open={loading || submitting} />
    </Container>
  );
}
