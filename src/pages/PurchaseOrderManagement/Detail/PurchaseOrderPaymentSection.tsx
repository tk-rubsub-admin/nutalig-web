import {
  Add,
  CheckCircleOutline,
  EditOutlined,
  FilePresent,
  HighlightOff,
  PaymentsOutlined,
  RemoveCircleOutline
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { useAuth } from 'auth/AuthContext';
import { PERMISSIONS } from 'auth/permissions';
import dayjs from 'dayjs';
import { ChangeEvent, ReactElement, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery } from 'react-query';
import {
  approvePurchaseOrderPayment,
  createPurchaseOrderPayment,
  getPurchaseOrderPaymentSchedules,
  getPurchaseOrderPayments,
  rejectPurchaseOrderPayment,
  updatePurchaseOrderPayment,
  voidPurchaseOrderPayment
} from 'services/PurchaseOrder/purchase-order-api';
import {
  PurchaseOrderPayment,
  PurchaseOrderPaymentMethod,
  PurchaseOrderPaymentRequest,
  PurchaseOrderPaymentSchedule,
  PurchaseOrderPaymentType,
  PurchaseOrderRecord
} from 'services/PurchaseOrder/purchase-order-type';
import { formatNumber } from 'utils/utils';

interface Props {
  purchaseOrder: PurchaseOrderRecord;
  onChanged: () => Promise<unknown>;
}

interface PaymentFormState {
  scheduleId: string;
  paymentType: PurchaseOrderPaymentType;
  installmentNo: string;
  paymentDate: string;
  amount: string;
  exchangeRate: string;
  paymentMethod: PurchaseOrderPaymentMethod;
  transferReference: string;
  chequeBank: string;
  chequeNo: string;
  chequeDate: string;
  chequeBranch: string;
  remark: string;
}

type DecisionType = 'APPROVE' | 'REJECT' | 'VOID';

const PAYMENT_TYPE_LABELS: Record<PurchaseOrderPaymentType, string> = {
  DEPOSIT: 'เงินมัดจำ',
  BALANCE: 'ยอดคงเหลือ',
  INSTALLMENT: 'แบ่งชำระ',
  OTHER: 'อื่น ๆ'
};

const PAYMENT_METHOD_LABELS: Record<PurchaseOrderPaymentMethod, string> = {
  TRANSFER: 'โอนเงิน',
  CHEQUE: 'เช็ค',
  CASH: 'เงินสด'
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'รออนุมัติ',
  APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ไม่อนุมัติ',
  VOIDED: 'ยกเลิกแล้ว'
};

const SCHEDULE_STATUS_LABELS: Record<string, string> = {
  UNPAID: 'ยังไม่ชำระ',
  PARTIALLY_PAID: 'ชำระบางส่วน',
  PAID: 'ชำระครบแล้ว'
};

function nowForInput(): string {
  return dayjs().format('YYYY-MM-DDTHH:mm');
}

function scheduleAvailableAmount(schedule?: PurchaseOrderPaymentSchedule | null): number {
  if (!schedule) return 0;
  return Math.max(
    Number(schedule.expectedAmount || 0) -
    Number(schedule.paidAmount || 0) -
    Number(schedule.pendingAmount || 0),
    0
  );
}

function createEmptyForm(
  availableAmount: number,
  currency?: string | null,
  schedule?: PurchaseOrderPaymentSchedule | null
): PaymentFormState {
  const scheduleAmount = schedule ? scheduleAvailableAmount(schedule) : availableAmount;
  return {
    scheduleId: schedule ? String(schedule.id) : '',
    paymentType: schedule?.paymentType || 'DEPOSIT',
    installmentNo: schedule ? String(schedule.installmentNo) : '',
    paymentDate: nowForInput(),
    amount: scheduleAmount > 0 ? String(Math.min(scheduleAmount, availableAmount)) : '',
    exchangeRate: currency === 'THB' ? '1' : '',
    paymentMethod: 'TRANSFER',
    transferReference: '',
    chequeBank: '',
    chequeNo: '',
    chequeDate: '',
    chequeBranch: '',
    remark: ''
  };
}

function createEditForm(payment: PurchaseOrderPayment): PaymentFormState {
  return {
    scheduleId: payment.scheduleId != null ? String(payment.scheduleId) : '',
    paymentType: payment.paymentType,
    installmentNo: payment.installmentNo != null ? String(payment.installmentNo) : '',
    paymentDate: payment.paymentDate
      ? dayjs(payment.paymentDate).format('YYYY-MM-DDTHH:mm')
      : nowForInput(),
    amount: String(payment.amount || ''),
    exchangeRate: String(payment.exchangeRate || ''),
    paymentMethod: payment.paymentMethod,
    transferReference: payment.transferReference || '',
    chequeBank: payment.chequeBank || '',
    chequeNo: payment.chequeNo || '',
    chequeDate: payment.chequeDate || '',
    chequeBranch: payment.chequeBranch || '',
    remark: payment.remark || ''
  };
}

function paymentStatusColor(status?: string): 'default' | 'warning' | 'success' | 'error' {
  if (status === 'PENDING') return 'warning';
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'error';
  return 'default';
}

export default function PurchaseOrderPaymentSection({
  purchaseOrder,
  onChanged
}: Props): ReactElement | null {
  const { hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.PURCHASE_ORDER_PAYMENT_VIEW);
  const canCreate = hasPermission(PERMISSIONS.PURCHASE_ORDER_PAYMENT_CREATE);
  const canApprove = hasPermission(PERMISSIONS.PURCHASE_ORDER_PAYMENT_APPROVE);
  const canVoid = hasPermission(PERMISSIONS.PURCHASE_ORDER_PAYMENT_VOID);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PurchaseOrderPayment | null>(null);
  const [form, setForm] = useState<PaymentFormState>(() => createEmptyForm(0));
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [decision, setDecision] = useState<{
    type: DecisionType;
    payment: PurchaseOrderPayment;
  } | null>(null);
  const [decisionReason, setDecisionReason] = useState('');

  const { data: payments = [], refetch: refetchPayments } = useQuery(
    ['purchase-order-payments', purchaseOrder.purchaseOrderNo],
    () => getPurchaseOrderPayments(purchaseOrder.purchaseOrderNo),
    {
      enabled: canView && Boolean(purchaseOrder.purchaseOrderNo),
      refetchOnWindowFocus: false
    }
  );
  const { data: schedules = [], refetch: refetchSchedules } = useQuery(
    ['purchase-order-payment-schedules', purchaseOrder.purchaseOrderNo],
    () => getPurchaseOrderPaymentSchedules(purchaseOrder.purchaseOrderNo),
    {
      enabled: canView && Boolean(purchaseOrder.purchaseOrderNo),
      refetchOnWindowFocus: false
    }
  );
  const pendingTotal = useMemo(
    () =>
      payments
        .filter((payment) => payment.status === 'PENDING')
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    [payments]
  );
  const availableAmount = Math.max(
    Number(purchaseOrder.grandTotal || 0) - Number(purchaseOrder.paidTotal || 0) - pendingTotal,
    0
  );
  const paymentDisabled =
    purchaseOrder.status === 'CANCELLED' ||
    purchaseOrder.status === 'CLOSED' ||
    availableAmount <= 0;
  const selectedSchedule = useMemo(
    () => schedules.find((schedule) => schedule.id === Number(form.scheduleId)) || null,
    [form.scheduleId, schedules]
  );
  const scheduleAllowedAmount = selectedSchedule
    ? scheduleAvailableAmount(selectedSchedule) +
    (editingPayment?.scheduleId === selectedSchedule.id ? Number(editingPayment.amount || 0) : 0)
    : availableAmount + Number(editingPayment?.amount || 0);
  const allowedAmount = Math.min(
    availableAmount + Number(editingPayment?.amount || 0),
    scheduleAllowedAmount
  );

  if (!canView) return null;

  const updateForm = <K extends keyof PaymentFormState>(field: K, value: PaymentFormState[K]) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const openCreateDialog = () => {
    const nextSchedule =
      schedules.find((schedule) => scheduleAvailableAmount(schedule) > 0) || null;
    setEditingPayment(null);
    setForm(createEmptyForm(availableAmount, purchaseOrder.currency, nextSchedule));
    setFiles([]);
    setShowErrors(false);
    setPaymentDialogOpen(true);
  };

  const openEditDialog = (payment: PurchaseOrderPayment) => {
    setEditingPayment(payment);
    setForm(createEditForm(payment));
    setFiles([]);
    setShowErrors(false);
    setPaymentDialogOpen(true);
  };

  const closePaymentDialog = () => {
    if (isSubmitting) return;
    setPaymentDialogOpen(false);
    setEditingPayment(null);
    setFiles([]);
  };

  const hasValidForm = (): boolean => {
    const amount = Number(form.amount || 0);
    if (schedules.length > 0 && !form.scheduleId) return false;
    if (!form.paymentDate || amount <= 0 || amount > allowedAmount) return false;
    if (form.paymentType === 'INSTALLMENT' && Number(form.installmentNo || 0) <= 0) return false;
    if (form.paymentMethod === 'TRANSFER') {
      // if (!form.transferReference.trim()) return false;
      if (!editingPayment && files.length === 0) return false;
      if (editingPayment && !editingPayment.attachments?.length && files.length === 0) return false;
    }
    if (
      form.paymentMethod === 'CHEQUE' &&
      (!form.chequeBank.trim() || !form.chequeNo.trim() || !form.chequeDate)
    ) {
      return false;
    }
    return true;
  };

  const handleSavePayment = async () => {
    setShowErrors(true);
    if (!hasValidForm()) return;

    const payload: PurchaseOrderPaymentRequest = {
      scheduleId: form.scheduleId ? Number(form.scheduleId) : null,
      paymentType: form.paymentType,
      installmentNo: form.paymentType === 'INSTALLMENT' ? Number(form.installmentNo || 0) : null,
      paymentDate: dayjs(form.paymentDate).toISOString(),
      amount: Number(form.amount),
      exchangeRate:
        purchaseOrder.currency === 'THB'
          ? 1
          : form.exchangeRate.trim()
            ? Number(form.exchangeRate)
            : null,
      paymentMethod: form.paymentMethod,
      transferReference: form.transferReference.trim() || null,
      chequeBank: form.chequeBank.trim() || null,
      chequeNo: form.chequeNo.trim() || null,
      chequeDate: form.chequeDate || null,
      chequeBranch: form.chequeBranch.trim() || null,
      remark: form.remark.trim() || null,
      requestKey: editingPayment
        ? null
        : `${purchaseOrder.purchaseOrderNo}-${Date.now()}-${Math.random().toString(36).slice(2)}`
    };

    setIsSubmitting(true);
    try {
      const action = editingPayment
        ? updatePurchaseOrderPayment(
          purchaseOrder.purchaseOrderNo,
          editingPayment.id,
          payload,
          files
        )
        : createPurchaseOrderPayment(purchaseOrder.purchaseOrderNo, payload, files);
      await toast.promise(action, {
        loading: 'กำลังบันทึกรายการชำระเงิน',
        success: editingPayment ? 'แก้ไขรายการชำระเงินแล้ว' : 'บันทึกรายการชำระเงินแล้ว',
        error: 'ไม่สามารถบันทึกรายการชำระเงินได้'
      });
      setPaymentDialogOpen(false);
      setEditingPayment(null);
      setFiles([]);
      await Promise.all([onChanged(), refetchPayments(), refetchSchedules()]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDecision = (type: DecisionType, payment: PurchaseOrderPayment) => {
    setDecision({ type, payment });
    setDecisionReason('');
  };

  const handleDecision = async () => {
    if (!decision) return;
    if (decision.type !== 'APPROVE' && !decisionReason.trim()) return;

    setIsSubmitting(true);
    try {
      const { payment, type } = decision;
      const action =
        type === 'APPROVE'
          ? approvePurchaseOrderPayment(purchaseOrder.purchaseOrderNo, payment.id)
          : type === 'REJECT'
            ? rejectPurchaseOrderPayment(
              purchaseOrder.purchaseOrderNo,
              payment.id,
              decisionReason.trim()
            )
            : voidPurchaseOrderPayment(
              purchaseOrder.purchaseOrderNo,
              payment.id,
              decisionReason.trim()
            );
      await toast.promise(action, {
        loading: 'กำลังดำเนินการ',
        success:
          type === 'APPROVE'
            ? 'อนุมัติรายการชำระเงินแล้ว'
            : type === 'REJECT'
              ? 'ไม่อนุมัติรายการชำระเงินแล้ว'
              : 'ยกเลิกรายการชำระเงินแล้ว',
        error: 'ไม่สามารถดำเนินการได้'
      });
      setDecision(null);
      setDecisionReason('');
      await Promise.all([onChanged(), refetchPayments(), refetchSchedules()]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const amountError =
    showErrors && (Number(form.amount || 0) <= 0 || Number(form.amount || 0) > allowedAmount);
  const paymentAmount = Number(form.amount || 0);
  const paymentExchangeRate = purchaseOrder.currency === 'THB' ? 1 : Number(form.exchangeRate || 0);
  const paymentAmountThb =
    form.amount &&
      Number.isFinite(paymentAmount) &&
      Number.isFinite(paymentExchangeRate) &&
      paymentExchangeRate > 0
      ? paymentAmount * paymentExchangeRate
      : null;

  return (
    <>
      <Stack
        spacing={2}
        sx={{
          backgroundColor: '#fff',
          border: '1px solid #e6ebf1',
          borderRadius: 3,
          p: 2,
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
        }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <PaymentsOutlined color="primary" />
            <Typography variant="h6">การชำระเงิน Supplier</Typography>
          </Stack>
          {canCreate ? (
            <Button
              variant="contained"
              startIcon={<Add />}
              disabled={paymentDisabled}
              onClick={openCreateDialog}>
              บันทึกการชำระเงิน
            </Button>
          ) : null}
        </Stack>

        <Grid container spacing={1.5}>
          <Grid item xs={12} sm={3}>
            <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc' }}>
              <Typography variant="caption" color="text.secondary">
                ยอด PO
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>
                {formatNumber(purchaseOrder.grandTotal || 0)} {purchaseOrder.currency || ''}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#ecfdf5' }}>
              <Typography variant="caption" color="text.secondary">
                ชำระแล้ว
              </Typography>
              <Typography sx={{ fontWeight: 700, color: '#047857' }}>
                {formatNumber(purchaseOrder.paidTotal || 0)} {purchaseOrder.currency || ''}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#fff7ed' }}>
              <Typography variant="caption" color="text.secondary">
                รออนุมัติ
              </Typography>
              <Typography sx={{ fontWeight: 700, color: '#c2410c' }}>
                {formatNumber(pendingTotal)} {purchaseOrder.currency || ''}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#eff6ff' }}>
              <Typography variant="caption" color="text.secondary">
                คงเหลือ
              </Typography>
              <Typography sx={{ fontWeight: 700, color: '#1d4ed8' }}>
                {formatNumber(purchaseOrder.outstandingTotal || 0)} {purchaseOrder.currency || ''}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {schedules.length ? (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              แผนการชำระเงิน
            </Typography>
            <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Table size="small" sx={{ minWidth: 760 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell>งวด</TableCell>
                    <TableCell>ประเภท</TableCell>
                    <TableCell align="right">สัดส่วน</TableCell>
                    <TableCell align="right">ยอดตามแผน</TableCell>
                    <TableCell align="right">ชำระแล้ว</TableCell>
                    <TableCell align="right">รออนุมัติ</TableCell>
                    <TableCell align="right">คงเหลือ</TableCell>
                    <TableCell align="center">สถานะ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.id} hover>
                      <TableCell>งวดที่ {schedule.installmentNo}</TableCell>
                      <TableCell>
                        {PAYMENT_TYPE_LABELS[schedule.paymentType] || schedule.paymentType}
                      </TableCell>
                      <TableCell align="right">{formatNumber(schedule.percentage)}%</TableCell>
                      <TableCell align="right">
                        {formatNumber(schedule.expectedAmount)} {purchaseOrder.currency || ''}
                      </TableCell>
                      <TableCell align="right">
                        {formatNumber(schedule.paidAmount)} {purchaseOrder.currency || ''}
                      </TableCell>
                      <TableCell align="right">
                        {formatNumber(schedule.pendingAmount)} {purchaseOrder.currency || ''}
                      </TableCell>
                      <TableCell align="right">
                        {formatNumber(schedule.outstandingAmount)} {purchaseOrder.currency || ''}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          color={
                            schedule.status === 'PAID'
                              ? 'success'
                              : schedule.status === 'PARTIALLY_PAID'
                                ? 'warning'
                                : 'default'
                          }
                          label={SCHEDULE_STATUS_LABELS[schedule.status] || schedule.status}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : null}

        {payments.length ? (
          <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <Table size="small" sx={{ minWidth: 980 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                  <TableCell>ประเภท</TableCell>
                  <TableCell>วันที่ชำระ</TableCell>
                  <TableCell>วิธีชำระ</TableCell>
                  <TableCell align="right">ยอดชำระ</TableCell>
                  <TableCell align="right">ยอดเงินบาท</TableCell>
                  <TableCell align="center">สถานะ</TableCell>
                  <TableCell align="center">หลักฐาน</TableCell>
                  <TableCell align="center">ดำเนินการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>
                      {payment.scheduleId
                        ? `งวดที่ ${schedules.find((schedule) => schedule.id === payment.scheduleId)
                          ?.installmentNo || '-'
                        } · `
                        : ''}
                      {PAYMENT_TYPE_LABELS[payment.paymentType] || payment.paymentType}
                      {!payment.scheduleId && payment.installmentNo
                        ? ` งวดที่ ${payment.installmentNo}`
                        : ''}
                    </TableCell>
                    <TableCell>{dayjs(payment.paymentDate).format('DD/MM/YYYY HH:mm')}</TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">
                          {PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}
                        </Typography>
                        {payment.transferReference ? (
                          <Typography variant="caption" color="text.secondary">
                            Ref: {payment.transferReference}
                          </Typography>
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      {formatNumber(payment.amount || 0)} {payment.currency || ''}
                    </TableCell>
                    <TableCell align="right">{formatNumber(payment.amountThb || 0)} THB</TableCell>
                    <TableCell align="center">
                      <Tooltip
                        title={
                          payment.rejectionReason || payment.voidReason || payment.remark || ''
                        }>
                        <Chip
                          size="small"
                          color={paymentStatusColor(payment.status)}
                          label={PAYMENT_STATUS_LABELS[payment.status] || payment.status}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      {payment.attachments?.length ? (
                        <Stack direction="row" spacing={0.25} justifyContent="center">
                          {payment.attachments.map((attachment) => (
                            <Tooltip
                              key={attachment.id}
                              title={
                                attachment.originalFileName || attachment.fileName || 'ดูไฟล์'
                              }>
                              <Button
                                size="small"
                                component="a"
                                href={attachment.fileUrl || undefined}
                                target="_blank"
                                rel="noopener noreferrer">
                                <FilePresent fontSize="small" />
                              </Button>
                            </Tooltip>
                          ))}
                        </Stack>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.25} justifyContent="center">
                        {payment.status === 'PENDING' && canCreate ? (
                          <Tooltip title="แก้ไข">
                            <Button size="small" onClick={() => openEditDialog(payment)}>
                              <EditOutlined fontSize="small" />
                            </Button>
                          </Tooltip>
                        ) : null}
                        {payment.status === 'PENDING' && canApprove ? (
                          <>
                            <Tooltip title="อนุมัติ">
                              <Button
                                size="small"
                                color="success"
                                onClick={() => openDecision('APPROVE', payment)}>
                                <CheckCircleOutline fontSize="small" />
                              </Button>
                            </Tooltip>
                            <Tooltip title="ไม่อนุมัติ">
                              <Button
                                size="small"
                                color="error"
                                onClick={() => openDecision('REJECT', payment)}>
                                <HighlightOff fontSize="small" />
                              </Button>
                            </Tooltip>
                          </>
                        ) : null}
                        {payment.status === 'APPROVED' && canVoid ? (
                          <Tooltip title="ยกเลิกรายการ">
                            <Button
                              size="small"
                              color="error"
                              onClick={() => openDecision('VOID', payment)}>
                              <RemoveCircleOutline fontSize="small" />
                            </Button>
                          </Tooltip>
                        ) : null}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="text.secondary">
            ยังไม่มีประวัติการชำระเงิน Supplier
          </Typography>
        )}
      </Stack>

      <Dialog open={paymentDialogOpen} onClose={closePaymentDialog} fullWidth maxWidth="md">
        <DialogTitle>{editingPayment ? 'แก้ไขรายการชำระเงิน' : 'บันทึกรายการชำระเงิน'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 0.5 }}>
            {schedules.length ? (
              <Grid item xs={12}>
                <FormControl fullWidth error={showErrors && !form.scheduleId}>
                  <InputLabel>งวดการชำระเงิน</InputLabel>
                  <Select
                    label="งวดการชำระเงิน"
                    value={form.scheduleId}
                    onChange={(event) => {
                      const schedule = schedules.find(
                        (item) => item.id === Number(event.target.value)
                      );
                      if (!schedule) return;
                      const remaining =
                        scheduleAvailableAmount(schedule) +
                        (editingPayment?.scheduleId === schedule.id
                          ? Number(editingPayment.amount || 0)
                          : 0);
                      setForm((previous) => ({
                        ...previous,
                        scheduleId: String(schedule.id),
                        paymentType: schedule.paymentType,
                        installmentNo: String(schedule.installmentNo),
                        amount: String(
                          Math.min(remaining, availableAmount + Number(editingPayment?.amount || 0))
                        )
                      }));
                    }}>
                    {schedules.map((schedule) => {
                      const isCurrent = editingPayment?.scheduleId === schedule.id;
                      const remaining =
                        scheduleAvailableAmount(schedule) +
                        (isCurrent ? Number(editingPayment.amount || 0) : 0);
                      return (
                        <MenuItem
                          key={schedule.id}
                          value={schedule.id}
                          disabled={remaining <= 0 && !isCurrent}>
                          งวดที่ {schedule.installmentNo} ·{' '}
                          {PAYMENT_TYPE_LABELS[schedule.paymentType]}{' '}
                          {formatNumber(schedule.percentage)}%{' · คงเหลือ '}
                          {formatNumber(remaining)} {purchaseOrder.currency || ''}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
            ) : null}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>ประเภทการชำระเงิน</InputLabel>
                <Select
                  label="ประเภทการชำระเงิน"
                  value={form.paymentType}
                  disabled={Boolean(form.scheduleId)}
                  onChange={(event) =>
                    updateForm('paymentType', event.target.value as PurchaseOrderPaymentType)
                  }>
                  {Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {form.paymentType === 'INSTALLMENT' ? (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="งวดที่"
                  value={form.installmentNo}
                  disabled={Boolean(form.scheduleId)}
                  InputLabelProps={{ shrink: true }}
                  onChange={(event) => updateForm('installmentNo', event.target.value)}
                  error={showErrors && Number(form.installmentNo || 0) <= 0}
                  helperText={
                    showErrors && Number(form.installmentNo || 0) <= 0 ? 'กรุณาระบุงวดที่' : ''
                  }
                  inputProps={{ min: 1, step: 1 }}
                />
              </Grid>
            ) : null}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="วันที่ชำระ"
                value={form.paymentDate}
                onChange={(event) => updateForm('paymentDate', event.target.value)}
                InputLabelProps={{ shrink: true }}
                error={showErrors && !form.paymentDate}
                helperText={showErrors && !form.paymentDate ? 'กรุณาระบุวันที่ชำระ' : ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="text"
                label={`ยอดชำระ (${purchaseOrder.currency || '-'})`}
                value={form.amount}
                onChange={(event) => updateForm('amount', event.target.value)}
                error={amountError}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ยอดชำระ (THB)"
                value={paymentAmountThb === null ? '' : formatNumber(paymentAmountThb)}
                InputLabelProps={{ shrink: true }}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            {purchaseOrder.currency !== 'THB' ? (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="อัตราแลกเปลี่ยนเป็น THB"
                  InputLabelProps={{ shrink: true }}
                  value={form.exchangeRate}
                  onChange={(event) => updateForm('exchangeRate', event.target.value)}
                  inputProps={{ min: 0.000001, step: 0.000001 }}
                />
              </Grid>
            ) : null}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>วิธีชำระเงิน</InputLabel>
                <Select
                  label="วิธีชำระเงิน"
                  value={form.paymentMethod}
                  onChange={(event) =>
                    updateForm('paymentMethod', event.target.value as PurchaseOrderPaymentMethod)
                  }>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {form.paymentMethod === 'TRANSFER' ? (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="เลขอ้างอิงการโอน"
                  InputLabelProps={{ shrink: true }}
                  value={form.transferReference}
                  onChange={(event) => updateForm('transferReference', event.target.value)}
                />
              </Grid>
            ) : null}
            {form.paymentMethod === 'CHEQUE' ? (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="ธนาคารเช็ค"
                    value={form.chequeBank}
                    InputLabelProps={{ shrink: true }}
                    onChange={(event) => updateForm('chequeBank', event.target.value)}
                    error={showErrors && !form.chequeBank.trim()}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="เลขที่เช็ค"
                    value={form.chequeNo}
                    InputLabelProps={{ shrink: true }}
                    onChange={(event) => updateForm('chequeNo', event.target.value)}
                    error={showErrors && !form.chequeNo.trim()}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="วันที่เช็ค"
                    value={form.chequeDate}
                    InputLabelProps={{ shrink: true }}
                    onChange={(event) => updateForm('chequeDate', event.target.value)}
                    error={showErrors && !form.chequeDate}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="สาขา"
                    value={form.chequeBranch}
                    InputLabelProps={{ shrink: true }}
                    onChange={(event) => updateForm('chequeBranch', event.target.value)}
                  />
                </Grid>
              </>
            ) : null}
            <Grid item xs={12}>
              <Button component="label" variant="outlined" startIcon={<FilePresent />}>
                แนบหลักฐานการชำระเงิน
                <input
                  hidden
                  type="file"
                  multiple
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFiles(Array.from(event.target.files || []))
                  }
                />
              </Button>
              <Typography
                variant="caption"
                display="block"
                color={
                  showErrors &&
                    form.paymentMethod === 'TRANSFER' &&
                    !editingPayment?.attachments?.length &&
                    !files.length
                    ? 'error'
                    : 'text.secondary'
                }
                sx={{ mt: 0.5 }}>
                {files.length
                  ? files.map((file) => file.name).join(', ')
                  : editingPayment?.attachments?.length
                    ? `มีไฟล์เดิม ${editingPayment.attachments.length} ไฟล์`
                    : form.paymentMethod === 'TRANSFER'
                      ? 'กรุณาแนบ Slip อย่างน้อย 1 ไฟล์'
                      : 'สามารถแนบได้หลายไฟล์'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                InputLabelProps={{ shrink: true }}
                label="หมายเหตุ"
                value={form.remark}
                onChange={(event) => updateForm('remark', event.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePaymentDialog} disabled={isSubmitting}>
            ยกเลิก
          </Button>
          <Button variant="contained" onClick={handleSavePayment} disabled={isSubmitting}>
            ยืนยัน
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(decision)}
        onClose={() => !isSubmitting && setDecision(null)}
        fullWidth
        maxWidth="sm">
        <DialogTitle>
          {decision?.type === 'APPROVE'
            ? 'ยืนยันอนุมัติรายการชำระเงิน'
            : decision?.type === 'REJECT'
              ? 'ระบุเหตุผลที่ไม่อนุมัติ'
              : 'ระบุเหตุผลการยกเลิกรายการชำระเงิน'}
        </DialogTitle>
        <DialogContent dividers>
          {decision?.type === 'APPROVE' ? (
            <Typography>
              ยืนยันยอด {formatNumber(decision.payment.amount || 0)} {decision.payment.currency}{' '}
              ใช่หรือไม่
            </Typography>
          ) : (
            <TextField
              fullWidth
              autoFocus
              multiline
              minRows={3}
              label="เหตุผล"
              value={decisionReason}
              onChange={(event) => setDecisionReason(event.target.value)}
              error={!decisionReason.trim()}
              helperText={!decisionReason.trim() ? 'กรุณาระบุเหตุผล' : ''}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDecision(null)} disabled={isSubmitting}>
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            color={decision?.type === 'APPROVE' ? 'success' : 'error'}
            onClick={handleDecision}
            disabled={isSubmitting || (decision?.type !== 'APPROVE' && !decisionReason.trim())}>
            ยืนยัน
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
