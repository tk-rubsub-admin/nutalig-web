import { CloudUpload, SkipNext, Visibility } from '@mui/icons-material';
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
  TextField,
  Typography
} from '@mui/material';
import { PERMISSIONS } from 'auth/permissions';
import { usePermissions } from 'auth/PermissionContext';
import { ChangeEvent, ReactElement, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { getSystemConfig } from 'services/Config/config-api';
import { GROUP_CODE, SystemConfig } from 'services/Config/config-type';
import {
  getPurchaseOrderProofs,
  resubmitPurchaseOrderProof,
  skipPurchaseOrderMilestone,
  submitPurchaseOrderProof
} from 'services/PurchaseOrder/purchase-order-api';
import {
  PurchaseOrderProof,
  PurchaseOrderProofStatus,
  PurchaseOrderTimelineEvent
} from 'services/PurchaseOrder/purchase-order-type';

const PROOF_TYPE_DESCRIPTIONS: Record<string, string> = {
  DIGITAL_PROOF: 'ตรวจแบบ Artwork, Layout, สี และข้อความก่อนผลิต',
  ON_PRESS_COLOR_CHECK: 'ตรวจสีจากงานจริงขณะขึ้นเครื่องผลิต'
};

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

function errorMessage(error: any): string {
  return error?.response?.data?.message || error?.response?.data?.error || 'ไม่สามารถดำเนินการได้';
}

interface Props {
  purchaseOrderNo: string;
  purchaseOrderStatus?: string | null;
  timelineEvents?: PurchaseOrderTimelineEvent[];
  onChanged?: () => void | Promise<unknown>;
}

export default function PurchaseOrderProofSection({
  purchaseOrderNo,
  purchaseOrderStatus,
  timelineEvents = [],
  onChanged
}: Props): ReactElement {
  const history = useHistory();
  const { has } = usePermissions();
  const canView = has(PERMISSIONS.PO_PROOF_VIEW);
  const canRequest = has(PERMISSIONS.PO_PROOF_REQUEST);
  const canManageTimeline = has(PERMISSIONS.PURCHASE_ORDER_START_RUN);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  const [skipReason, setSkipReason] = useState('');
  const [selectedProof, setSelectedProof] = useState<PurchaseOrderProof | null>(null);
  const [proofType, setProofType] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    data: proofs = [],
    isFetching,
    refetch
  } = useQuery(
    ['purchase-order-proofs', purchaseOrderNo],
    () => getPurchaseOrderProofs(purchaseOrderNo),
    { enabled: Boolean(purchaseOrderNo) && canView, refetchOnWindowFocus: false }
  );
  const { data: proofTypes = [], isFetching: isProofTypesFetching } = useQuery(
    ['system-config', GROUP_CODE.PURCHASE_ORDER_PROOF_TYPE],
    () => getSystemConfig(GROUP_CODE.PURCHASE_ORDER_PROOF_TYPE),
    { enabled: canView, staleTime: 5 * 60 * 1000 }
  );

  const proofsByType = useMemo(
    () => new Map(proofs.map((proof) => [proof.proofType.code, proof])),
    [proofs]
  );
  const digitalProofResolved = timelineEvents.some(
    (event) => event.type === 'DIGITAL_PROOF' && ['COMPLETED', 'SKIPPED'].includes(event.status)
  );
  const digitalProofMilestone = timelineEvents.find((event) => event.type === 'DIGITAL_PROOF');
  const digitalProofSkipped = digitalProofMilestone?.status === 'SKIPPED';
  const canSkipDigitalProof =
    canManageTimeline &&
    purchaseOrderStatus === 'PRODUCTION_RUNNING' &&
    Boolean(digitalProofMilestone?.canSkip);

  const openSubmitDialog = (type: SystemConfig, proof?: PurchaseOrderProof) => {
    if (type.code === 'DIGITAL_PROOF' && digitalProofSkipped) return;
    const currentRevision = proof?.revisions?.find(
      (revision) => revision.revisionNo === proof.currentRevision
    );
    setSelectedProof(proof || null);
    setProofType(type.code);
    setTitle(currentRevision?.title || type.nameTh || type.nameEn || type.code);
    setNote('');
    setDueDate('');
    setFiles([]);
    setDialogOpen(true);
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length > 10) {
      toast.error('แนบไฟล์ได้สูงสุด 10 ไฟล์ต่อ Revision');
      return;
    }
    setFiles(selected);
  };

  const handleSubmit = async () => {
    if (proofType === 'DIGITAL_PROOF' && digitalProofSkipped) {
      toast.error('ไม่สามารถส่งงานพรูฟดิจิตอลปริ้นท์ได้ เนื่องจากข้ามขั้นตอนนี้แล้ว');
      setDialogOpen(false);
      return;
    }
    if (!title.trim()) {
      toast.error('กรุณาระบุหัวข้อ');
      return;
    }
    if (!files.length) {
      toast.error('กรุณาแนบรูปภาพหรือวิดีโออย่างน้อย 1 ไฟล์');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        proofType,
        title: title.trim(),
        procurementNote: note.trim() || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null
      };
      if (selectedProof) {
        await resubmitPurchaseOrderProof(selectedProof.id, payload, files);
        toast.success('ส่ง Revision ใหม่ให้เซลล์พรูฟแล้ว');
      } else {
        await submitPurchaseOrderProof(purchaseOrderNo, payload, files);
        toast.success('ส่งงานให้เซลล์พรูฟแล้ว');
      }
      setDialogOpen(false);
      await refetch();
      await onChanged?.();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipDigitalProof = async () => {
    if (!skipReason.trim()) {
      toast.error('กรุณาระบุเหตุผลที่ข้ามการพรูฟดิจิตอลปริ้นท์');
      return;
    }
    setSubmitting(true);
    try {
      await skipPurchaseOrderMilestone(purchaseOrderNo, 'DIGITAL_PROOF', skipReason.trim());
      toast.success('ข้ามการพรูฟดิจิตอลปริ้นท์แล้ว');
      setSkipDialogOpen(false);
      setSkipReason('');
      await refetch();
      await onChanged?.();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Stack spacing={0.5}>
        <Typography variant="h6">งานตัวอย่าง / Proof Approval</Typography>
        <Typography variant="body2" color="text.secondary">
          ส่งรูปภาพหรือวิดีโอให้เซลล์ตรวจและเก็บประวัติแยกตาม Revision
        </Typography>
      </Stack>

      {isFetching || isProofTypesFetching ? (
        <Typography color="text.secondary">กำลังโหลดข้อมูล...</Typography>
      ) : null}

      <Grid container spacing={2}>
        {proofTypes.map((definition) => {
          const proof = proofsByType.get(definition.code);
          const isSkipped = definition.code === 'DIGITAL_PROOF' && digitalProofSkipped;
          const prerequisiteReady =
            definition.code !== 'ON_PRESS_COLOR_CHECK' || digitalProofResolved;
          const currentRevision = proof?.revisions?.find(
            (revision) => revision.revisionNo === proof.currentRevision
          );
          return (
            <Grid item xs={12} md={6} key={definition.code}>
              <Stack
                spacing={1.5}
                sx={{
                  height: '100%',
                  p: 2,
                  border: '1px solid #dce4ee',
                  borderRadius: 2,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                {isSkipped ? (
                  <Box
                    aria-label="ข้ามการพรูฟดิจิตอลปริ้นท์แล้ว"
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      zIndex: 1
                    }}>
                    <Typography
                      sx={{
                        color: 'warning.main',
                        fontSize: { xs: 52, sm: 68 },
                        fontWeight: 900,
                        letterSpacing: 8,
                        opacity: 0.16,
                        transform: 'rotate(-18deg)',
                        userSelect: 'none'
                      }}>
                      SKIP
                    </Typography>
                  </Box>
                ) : null}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  spacing={1}>
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>
                      {definition.nameTh || definition.nameEn || definition.code}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {PROOF_TYPE_DESCRIPTIONS[definition.code] || 'ประเภทงานพรูฟสำหรับใบสั่งซื้อ'}
                    </Typography>
                  </Box>
                  {isSkipped ? (
                    <Chip size="small" color="warning" label="ข้ามแล้ว" />
                  ) : proof ? (
                    <Chip
                      size="small"
                      color={statusColor(proof.status)}
                      label={STATUS_LABELS[proof.status]}
                    />
                  ) : (
                    <Chip size="small" label="ยังไม่ส่ง" />
                  )}
                </Stack>

                {proof ? (
                  <Stack spacing={0.5}>
                    <Typography variant="body2">Revision {proof.currentRevision}</Typography>
                    <Typography variant="body2">
                      ผู้พรูฟ: {proof.assignedSalesName || '-'}
                    </Typography>
                    <Typography variant="body2">
                      ไฟล์แนบ: {currentRevision?.attachments?.length || 0} ไฟล์
                    </Typography>
                    {currentRevision?.changeReason ? (
                      <Typography variant="body2" color="error">
                        เหตุผลที่ขอแก้ไข: {currentRevision.changeReason}
                      </Typography>
                    ) : null}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {isSkipped
                      ? 'ข้ามขั้นตอนการพรูฟดิจิตอลปริ้นท์แล้ว'
                      : prerequisiteReady
                      ? 'ยังไม่มีงานประเภทนี้'
                      : 'ต้องอนุมัติหรือข้ามพรูฟดิจิตอลปริ้นท์ก่อน'}
                  </Typography>
                )}

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  sx={{ mt: 'auto !important' }}>
                  {proof ? (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() =>
                        history.push(
                          ROUTE_PATHS.PURCHASE_ORDER_PROOF_DETAIL.replace(':id', String(proof.id))
                        )
                      }>
                      ดูรายละเอียด
                    </Button>
                  ) : null}
                  {canRequest &&
                  purchaseOrderStatus === 'PRODUCTION_RUNNING' &&
                  prerequisiteReady &&
                  !proof ? (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<CloudUpload />}
                      disabled={isSkipped}
                      onClick={() => openSubmitDialog(definition)}>
                      ส่งให้เซลล์พรูฟ
                    </Button>
                  ) : null}
                  {canRequest &&
                  purchaseOrderStatus === 'PRODUCTION_RUNNING' &&
                  prerequisiteReady &&
                  proof?.canResubmit ? (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<CloudUpload />}
                      disabled={isSkipped}
                      onClick={() => openSubmitDialog(definition, proof)}>
                      ส่ง Revision ใหม่
                    </Button>
                  ) : null}
                  {definition.code === 'DIGITAL_PROOF' && canSkipDigitalProof ? (
                    <Button
                      size="small"
                      variant="outlined"
                      className="btn-amber-orange"
                      startIcon={<SkipNext />}
                      onClick={() => {
                        setSkipReason('');
                        setSkipDialogOpen(true);
                      }}>
                      ข้ามการพรูฟ
                    </Button>
                  ) : null}
                </Stack>
              </Stack>
            </Grid>
          );
        })}
      </Grid>

      {purchaseOrderStatus !== 'PRODUCTION_RUNNING' && canRequest ? (
        <Typography variant="caption" color="text.secondary">
          สามารถส่งงานพรูฟได้เมื่อ PO อยู่ในสถานะกำลังผลิตเท่านั้น
        </Typography>
      ) : null}

      <Dialog
        open={skipDialogOpen}
        onClose={() => !submitting && setSkipDialogOpen(false)}
        fullWidth
        maxWidth="sm">
        <DialogTitle>ข้ามการพรูฟดิจิตอลปริ้นท์</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              ขั้นตอนนี้จะถูกบันทึกเป็น “ข้าม” ใน Timeline และสามารถดำเนินการพรูฟสีหน้าเครื่องต่อได้
            </Typography>
            <TextField
              label="เหตุผลที่ข้าม"
              value={skipReason}
              onChange={(event) => setSkipReason(event.target.value)}
              required
              multiline
              minRows={3}
              fullWidth
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSkipDialogOpen(false)} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleSkipDigitalProof()}
            disabled={submitting || !skipReason.trim()}>
            {submitting ? 'กำลังบันทึก...' : 'ยืนยันข้ามการพรูฟ'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={dialogOpen}
        onClose={() => !submitting && setDialogOpen(false)}
        fullWidth
        maxWidth="sm">
        <DialogTitle>{selectedProof ? 'ส่ง Revision ใหม่' : 'ส่งงานให้เซลล์พรูฟ'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="ประเภท"
              value={
                proofTypes.find((item) => item.code === proofType)?.nameTh ||
                proofTypes.find((item) => item.code === proofType)?.nameEn ||
                proofType
              }
              disabled
              fullWidth
            />
            <TextField
              label="หัวข้อ"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              fullWidth
            />
            <TextField
              label="รายละเอียดที่ต้องการให้ตรวจ"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              multiline
              InputLabelProps={{ shrink: true }}
              minRows={3}
              fullWidth
            />
            <TextField
              label="วันครบกำหนด"
              type="datetime-local"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <Button component="label" variant="outlined" startIcon={<CloudUpload />}>
              เลือกรูปภาพ/วิดีโอ
              <input
                hidden
                multiple
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
                onChange={handleFiles}
              />
            </Button>
            <Typography variant="caption" color="text.secondary">
              รูปภาพไม่เกิน 20 MB, วิดีโอไม่เกิน 200 MB และรวมไม่เกิน 10 ไฟล์
            </Typography>
            {files.map((file) => (
              <Typography key={`${file.name}-${file.lastModified}`} variant="body2">
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button variant="contained" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? 'กำลังส่ง...' : 'ส่งให้เซลล์พรูฟ'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
