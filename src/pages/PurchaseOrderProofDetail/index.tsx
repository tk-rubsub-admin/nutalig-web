import { ArrowBackIos, Cancel, CheckCircle, Description, Edit } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import PageTitle from 'components/PageTitle';
import { Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { ReactElement, useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import {
  approvePurchaseOrderProof,
  cancelPurchaseOrderProof,
  getPurchaseOrderProof,
  requestPurchaseOrderProofChanges
} from 'services/PurchaseOrder/purchase-order-api';
import { PurchaseOrderProofStatus } from 'services/PurchaseOrder/purchase-order-type';

const STATUS_LABELS: Record<PurchaseOrderProofStatus, string> = {
  DRAFT: 'ฉบับร่าง',
  PENDING_APPROVAL: 'รอเซลล์พรูฟ',
  CHANGES_REQUESTED: 'ขอแก้ไข',
  APPROVED: 'อนุมัติแล้ว',
  CANCELLED: 'ยกเลิกแล้ว'
};

function statusColor(
  status: PurchaseOrderProofStatus
): 'default' | 'warning' | 'error' | 'success' {
  if (status === 'APPROVED') return 'success';
  if (status === 'PENDING_APPROVAL') return 'warning';
  if (status === 'CHANGES_REQUESTED') return 'error';
  return 'default';
}

function formatDate(value?: string | null): string {
  return value ? new Date(value).toLocaleString('th-TH') : '-';
}

function errorMessage(error: any): string {
  return error?.response?.data?.message || error?.response?.data?.error || 'ไม่สามารถดำเนินการได้';
}

export default function PurchaseOrderProofDetail(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const proofId = Number(id);
  const [decision, setDecision] = useState<'approve' | 'changes' | null>(null);
  const [decisionText, setDecisionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    data: proof,
    isFetching,
    refetch
  } = useQuery(['purchase-order-proof', proofId], () => getPurchaseOrderProof(proofId), {
    enabled: Number.isFinite(proofId),
    refetchOnWindowFocus: true
  });

  const handleDecision = async () => {
    if (!proof || !decision) return;
    if (decision === 'changes' && !decisionText.trim()) {
      toast.error('กรุณาระบุเหตุผลที่ต้องการให้แก้ไข');
      return;
    }
    setSubmitting(true);
    try {
      if (decision === 'approve') {
        await approvePurchaseOrderProof(proof.id, decisionText.trim());
        toast.success('อนุมัติงานพรูฟแล้ว');
      } else {
        await requestPurchaseOrderProofChanges(proof.id, decisionText.trim());
        toast.success('ส่งคำขอแก้ไขให้จัดซื้อแล้ว');
      }
      setDecision(null);
      setDecisionText('');
      await refetch();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!proof || !window.confirm('ยืนยันการยกเลิกคำขอพรูฟนี้หรือไม่')) return;
    setSubmitting(true);
    try {
      await cancelPurchaseOrderProof(proof.id);
      toast.success('ยกเลิกคำขอพรูฟแล้ว');
      await refetch();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page title="รายละเอียดงานพรูฟ">
      <PageTitle title="รายละเอียดงานพรูฟ">
        {proof ? (
          <Chip
            size="small"
            color={statusColor(proof.status)}
            label={STATUS_LABELS[proof.status]}
          />
        ) : null}
      </PageTitle>
      <Wrapper>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
            <Button startIcon={<ArrowBackIos />} onClick={() => history.goBack()}>
              กลับ
            </Button>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              {proof?.canApprove ? (
                <>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={() => setDecision('approve')}>
                    อนุมัติ
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Edit />}
                    onClick={() => setDecision('changes')}>
                    ขอแก้ไข
                  </Button>
                </>
              ) : null}
              {proof?.canCancel ? (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Cancel />}
                  disabled={submitting}
                  onClick={() => void handleCancel()}>
                  ยกเลิกคำขอ
                </Button>
              ) : null}
            </Stack>
          </Stack>

          {isFetching ? <Typography>กำลังโหลดข้อมูล...</Typography> : null}

          {proof ? (
            <>
              <Stack sx={{ p: 2, border: '1px solid #dce4ee', borderRadius: 2 }} spacing={1.5}>
                <Typography variant="h6">
                  {proof.proofType.nameTh || proof.proofType.nameEn || proof.proofType.code}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      เลขที่ใบสั่งซื้อ
                    </Typography>
                    <Typography>{proof.purchaseOrderNo}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      เลขที่ใบยืนยันสั่งซื้อ
                    </Typography>
                    <Typography>{proof.salesOrderNo || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      ลูกค้า
                    </Typography>
                    <Typography>{proof.customerName || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      ผู้รับผิดชอบพรูฟ
                    </Typography>
                    <Typography>{proof.assignedSalesName || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      Revision ปัจจุบัน
                    </Typography>
                    <Typography>{proof.currentRevision}</Typography>
                  </Grid>
                </Grid>
              </Stack>

              {proof.revisions.map((revision) => (
                <Stack
                  key={revision.id}
                  sx={{ p: 2, border: '1px solid #dce4ee', borderRadius: 2 }}
                  spacing={2}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    spacing={1}>
                    <Box>
                      <Typography variant="h6">
                        Revision {revision.revisionNo}: {revision.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ส่งโดย {revision.requestedByName || '-'} เมื่อ{' '}
                        {formatDate(revision.requestedAt)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        กำหนดตอบกลับ {formatDate(revision.dueDate)}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      color={statusColor(revision.status)}
                      label={STATUS_LABELS[revision.status]}
                    />
                  </Stack>
                  {revision.procurementNote ? (
                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                      {revision.procurementNote}
                    </Typography>
                  ) : null}
                  {revision.changeReason ? (
                    <Box sx={{ p: 1.5, bgcolor: '#fff1f2', borderRadius: 1 }}>
                      <Typography variant="body2" color="error">
                        เหตุผลที่ขอแก้ไข: {revision.changeReason}
                      </Typography>
                    </Box>
                  ) : null}
                  {revision.salesComment ? (
                    <Typography variant="body2">
                      ความคิดเห็นจากเซลล์: {revision.salesComment}
                    </Typography>
                  ) : null}
                  {revision.actedAt ? (
                    <Typography variant="caption" color="text.secondary">
                      ดำเนินการโดย {revision.actedByName || '-'} เมื่อ{' '}
                      {formatDate(revision.actedAt)}
                    </Typography>
                  ) : null}
                  <Divider />
                  <Grid container spacing={2}>
                    {revision.attachments.map((attachment) => (
                      <Grid item xs={12} sm={6} md={4} key={attachment.id}>
                        <Stack
                          spacing={1}
                          sx={{
                            height: '100%',
                            p: 1.5,
                            border: '1px solid #e2e8f0',
                            borderRadius: 2
                          }}>
                          {attachment.mediaType === 'IMAGE' ? (
                            <Box
                              component="img"
                              src={attachment.fileUrl}
                              alt={attachment.originalFileName || attachment.fileName}
                              sx={{
                                width: '100%',
                                height: 220,
                                objectFit: 'contain',
                                bgcolor: '#f8fafc',
                                borderRadius: 1
                              }}
                            />
                          ) : (
                            <Box
                              component="video"
                              src={attachment.fileUrl}
                              controls
                              sx={{ width: '100%', height: 220, bgcolor: '#000', borderRadius: 1 }}
                            />
                          )}
                          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                            {attachment.originalFileName || attachment.fileName}
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Description />}
                            onClick={() =>
                              window.open(attachment.fileUrl, '_blank', 'noopener,noreferrer')
                            }>
                            เปิดไฟล์
                          </Button>
                        </Stack>
                      </Grid>
                    ))}
                  </Grid>
                </Stack>
              ))}
            </>
          ) : null}
        </Stack>
      </Wrapper>

      <Dialog
        open={decision !== null}
        onClose={() => !submitting && setDecision(null)}
        fullWidth
        maxWidth="sm">
        <DialogTitle>{decision === 'approve' ? 'อนุมัติงานพรูฟ' : 'ขอแก้ไขงานพรูฟ'}</DialogTitle>
        <DialogContent>
          <TextField
            sx={{ mt: 1 }}
            label={decision === 'approve' ? 'ความคิดเห็น (ไม่บังคับ)' : 'เหตุผลที่ต้องการให้แก้ไข'}
            value={decisionText}
            onChange={(event) => setDecisionText(event.target.value)}
            required={decision === 'changes'}
            multiline
            minRows={4}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDecision(null)} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            color={decision === 'approve' ? 'success' : 'error'}
            disabled={submitting}
            onClick={() => void handleDecision()}>
            {submitting ? 'กำลังบันทึก...' : 'ยืนยัน'}
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  );
}
