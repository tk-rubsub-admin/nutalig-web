import { BRAND_COLORS, BRAND_UI } from 'theme/brandTokens';
import {
  Add,
  CheckCircleOutline,
  EditOutlined,
  FilePresent,
  HighlightOff,
  NotificationsActiveOutlined,
  Paid,
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
  IconButton,
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
import ConfirmDialog from 'components/ConfirmDialog';
import dayjs from 'dayjs';
import { ChangeEvent, ReactElement, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery } from 'react-query';
import {
  approvePurchaseOrderPayment,
  createPurchaseOrderPayment,
  createPurchaseOrderPaymentInstruction,
  createPurchaseOrderPaymentInstructionDraft,
  submitPurchaseOrderPaymentInstructionDraft,
  updatePurchaseOrderPaymentInstruction,
  cancelPurchaseOrderPaymentInstruction,
  confirmPurchaseOrderPaymentInstructionPaid,
  getExchangeRate,
  getPurchaseOrderPaymentInstructions,
  getPurchaseOrderPaymentSchedules,
  getPurchaseOrderPayments,
  notifySuperAdminsOfPaymentSchedule,
  notifyAccountingAdminsOfPaymentSchedule,
  rejectPurchaseOrderPayment,
  updatePurchaseOrderPayment,
  voidPurchaseOrderPayment,
  notifyAccountingAdminsForSavePayment
} from 'services/PurchaseOrder/purchase-order-api';
import {
  PurchaseOrderPayment,
  PurchaseOrderPaymentMethod,
  PurchaseOrderPaymentRequest,
  PurchaseOrderPaymentInstruction,
  PurchaseOrderPaymentInstructionRequest,
  PurchaseOrderPaymentSchedule,
  PurchaseOrderPaymentType,
  PurchaseOrderRecord,
  ExchangeRateResponse
} from 'services/PurchaseOrder/purchase-order-type';
import { formatNumber } from 'utils/utils';

interface Props {
  purchaseOrder: PurchaseOrderRecord;
  onChanged: () => Promise<unknown>;
  openCreateRequest?: number;
  openDraftRequest?: number;
  draftScheduleId?: number | '';
  onCreatePaymentSaved?: () => void;
  onCreatePaymentCancelled?: () => void;
}

interface PaymentFormState {
  scheduleId: string;
  instructionId: string;
  paymentType: PurchaseOrderPaymentType;
  installmentNo: string;
  paymentDate: string;
  amount: string;
  amountThb: string;
  exchangeRate: string;
  paymentMethod: PurchaseOrderPaymentMethod;
  transferReference: string;
  chequeBank: string;
  chequeNo: string;
  chequeDate: string;
  chequeBranch: string;
  remark: string;
}

interface InstructionFormState {
  scheduleId: string;
  amountThb: string;
  exchangeRate: string;
  plannedPaymentDate: string;
  remark: string;
}

type InstructionInputMode = 'NONE' | 'EXCHANGE_RATE' | 'AMOUNT_THB';

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
  AWAITING_PAYMENT_SETUP: 'รอตั้งจ่าย',
  AWAITING_PAYMENT: 'รอชำระเงิน',
  PARTIALLY_PAID: 'ชำระบางส่วน',
  PAID: 'ชำระครบแล้ว'
};

const INSTRUCTION_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'รอตรวจสอบ',
  AWAITING_PAYMENT: 'รอชำระเงิน',
  PARTIALLY_PAID: 'ชำระบางส่วน',
  PAID: 'ชำระครบแล้ว',
  CANCELLED: 'ยกเลิกแล้ว'
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
    instructionId: '',
    paymentType: schedule?.paymentType || 'DEPOSIT',
    installmentNo: schedule ? String(schedule.installmentNo) : '',
    paymentDate: nowForInput(),
    amount: scheduleAmount > 0 ? String(Math.min(scheduleAmount, availableAmount)) : '',
    amountThb: '',
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
    instructionId: payment.instructionId != null ? String(payment.instructionId) : '',
    paymentType: payment.paymentType,
    installmentNo: payment.installmentNo != null ? String(payment.installmentNo) : '',
    paymentDate: payment.paymentDate
      ? dayjs(payment.paymentDate).format('YYYY-MM-DDTHH:mm')
      : nowForInput(),
    amount: String(payment.amount || ''),
    amountThb: String(payment.amountThb || ''),
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

function createEmptyInstructionForm(
  schedule?: PurchaseOrderPaymentSchedule | null
): InstructionFormState {
  return {
    scheduleId: schedule ? String(schedule.id) : '',
    amountThb: '',
    exchangeRate: '',
    plannedPaymentDate: dayjs().format('YYYY-MM-DD'),
    remark: ''
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
  onChanged,
  openCreateRequest = 0,
  openDraftRequest = 0,
  draftScheduleId = '',
  onCreatePaymentSaved,
  onCreatePaymentCancelled
}: Props): ReactElement | null {
  const { hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.PURCHASE_ORDER_PAYMENT_VIEW);
  const canCreate = hasPermission(PERMISSIONS.PURCHASE_ORDER_PAYMENT_CREATE);
  const canInstruct = hasPermission(PERMISSIONS.PURCHASE_ORDER_PAYMENT_INSTRUCT);
  const canStartRun = hasPermission(PERMISSIONS.PURCHASE_ORDER_START_RUN);
  const canConfirmPayment = hasPermission(PERMISSIONS.PURCHASE_ORDER_PAYMENT_CONFIRM);
  const canApprove = hasPermission(PERMISSIONS.PURCHASE_ORDER_PAYMENT_APPROVE);
  const canVoid = hasPermission(PERMISSIONS.PURCHASE_ORDER_PAYMENT_VOID);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [setPaymentDialogVisible, setSetPaymentDialogOpen] = useState(false);
  const [instructionForm, setInstructionForm] = useState<InstructionFormState>(() =>
    createEmptyInstructionForm()
  );
  const [instructionInputMode, setInstructionInputMode] = useState<InstructionInputMode>('NONE');
  const [isInstructionAmountFocused, setIsInstructionAmountFocused] = useState(false);
  const [isPaymentAmountFocused, setIsPaymentAmountFocused] = useState(false);
  const [editingInstruction, setEditingInstruction] =
    useState<PurchaseOrderPaymentInstruction | null>(null);
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [instructionToConfirmPaid, setInstructionToConfirmPaid] =
    useState<PurchaseOrderPaymentInstruction | null>(null);
  const [editingPayment, setEditingPayment] = useState<PurchaseOrderPayment | null>(null);
  const [form, setForm] = useState<PaymentFormState>(() => createEmptyForm(0));
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [notifyingScheduleId, setNotifyingScheduleId] = useState<number | null>(null);
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
  const { data: instructions = [], refetch: refetchInstructions } = useQuery(
    ['purchase-order-payment-instructions', purchaseOrder.purchaseOrderNo],
    () => getPurchaseOrderPaymentInstructions(purchaseOrder.purchaseOrderNo),
    {
      enabled: canView && Boolean(purchaseOrder.purchaseOrderNo),
      refetchOnWindowFocus: false
    }
  );
  const {
    data: exchangeRateResponse,
    isLoading: isExchangeRateLoading,
    isError: isExchangeRateError
  } = useQuery<ExchangeRateResponse>(
    ['purchase-order-payment-exchange-rate', purchaseOrder.currency],
    () => getExchangeRate(purchaseOrder.currency || '', 'THB'),
    {
      enabled:
        (paymentDialogOpen || setPaymentDialogVisible) &&
        Boolean(purchaseOrder.currency) &&
        purchaseOrder.currency !== 'THB',
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
  const activeInstructions = instructions.filter(
    (instruction) =>
      instruction.status === 'DRAFT' || instruction.status === 'AWAITING_PAYMENT' || instruction.status === 'PARTIALLY_PAID'
  );
  const instructionRemaining = (instruction: PurchaseOrderPaymentInstruction) =>
    Math.max(Number(instruction.amount || 0) - Number(instruction.paidAmount || 0), 0);
  const reservedForSchedule = (scheduleId: number) =>
    activeInstructions
      .filter((instruction) => instruction.scheduleId === scheduleId)
      .reduce((sum, instruction) => sum + instructionRemaining(instruction), 0);
  const instructionCapacity = (schedule: PurchaseOrderPaymentSchedule) =>
    Math.max(scheduleAvailableAmount(schedule) - reservedForSchedule(schedule.id), 0);
  const instructionScheduleRemaining = (schedule: PurchaseOrderPaymentSchedule) =>
    instructionCapacity(schedule) +
    (editingInstruction?.scheduleId === schedule.id ? instructionRemaining(editingInstruction) : 0);
  const activeInstructionTotal = activeInstructions.reduce(
    (sum, instruction) => sum + instructionRemaining(instruction),
    0
  );
  const uninstructedAvailableAmount = Math.max(availableAmount - activeInstructionTotal, 0);
  const selectedInstruction =
    instructions.find((instruction) => instruction.id === Number(form.instructionId)) || null;
  const selectedScheduleInstructions = selectedSchedule
    ? instructions.filter((instruction) => instruction.scheduleId === selectedSchedule.id)
    : [];
  const scheduleAllowedAmount = selectedSchedule
    ? (selectedInstruction
      ? instructionRemaining(selectedInstruction)
      : instructionCapacity(selectedSchedule)) +
    (editingPayment?.scheduleId === selectedSchedule.id ? Number(editingPayment.amount || 0) : 0)
    : availableAmount + Number(editingPayment?.amount || 0);
  const allowedAmount = Math.min(
    availableAmount + Number(editingPayment?.amount || 0),
    scheduleAllowedAmount
  );

  const updateForm = <K extends keyof PaymentFormState>(field: K, value: PaymentFormState[K]) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const openCreateDialog = () => {
    const nextInstruction = activeInstructions[0] || null;
    const nextSchedule = nextInstruction
      ? schedules.find((schedule) => schedule.id === nextInstruction.scheduleId) || null
      : schedules.find((schedule) => instructionCapacity(schedule) > 0) || null;
    setEditingPayment(null);
    setIsPaymentAmountFocused(false);
    const nextForm = createEmptyForm(
      uninstructedAvailableAmount,
      purchaseOrder.currency,
      nextSchedule
    );
    if (nextInstruction) {
      nextForm.instructionId = String(nextInstruction.id);
      nextForm.amount = String(Math.min(instructionRemaining(nextInstruction), availableAmount));
    }
    setForm(nextForm);
    setFiles([]);
    setShowErrors(false);
    setPaymentDialogOpen(true);
  };

  const openInstructionDialog = (instruction?: PurchaseOrderPaymentInstruction) => {
    setCreatingDraft(false);
    const nextSchedule = instruction
      ? schedules.find((schedule) => schedule.id === instruction.scheduleId) || null
      : schedules.find((schedule) => instructionCapacity(schedule) > 0) || null;
    setEditingInstruction(instruction || null);
    setInstructionInputMode(instruction ? 'EXCHANGE_RATE' : 'NONE');
    setIsInstructionAmountFocused(false);
    setInstructionForm(
      instruction
        ? {
          scheduleId: String(instruction.scheduleId),
          amountThb: instruction.amountThb == null ? '' : String(instruction.amountThb),
          exchangeRate: instruction.exchangeRate == null ? '' : String(instruction.exchangeRate),
          plannedPaymentDate: instruction.plannedPaymentDate,
          remark: instruction.remark || ''
        }
        : (() => {
          return createEmptyInstructionForm(nextSchedule);
        })()
    );
    setSetPaymentDialogOpen(true);
  };

  const openDraftDialog = (requestedScheduleId?: number | '') => {
    const nextSchedule = schedules.find((schedule) =>
      requestedScheduleId ? schedule.id === requestedScheduleId : instructionCapacity(schedule) > 0
    ) || null;
    setEditingInstruction(null);
    setCreatingDraft(true);
    setInstructionInputMode('NONE');
    setInstructionForm(createEmptyInstructionForm(nextSchedule));
    setSetPaymentDialogOpen(true);
  };

  const openEditDialog = (payment: PurchaseOrderPayment) => {
    setEditingPayment(payment);
    setIsPaymentAmountFocused(false);
    setForm(createEditForm(payment));
    setFiles([]);
    setShowErrors(false);
    setPaymentDialogOpen(true);
  };

  const notifySuperAdmins = async (schedule: PurchaseOrderPaymentSchedule) => {
    setNotifyingScheduleId(schedule.id);
    try {
      await toast.promise(
        notifySuperAdminsOfPaymentSchedule(purchaseOrder.purchaseOrderNo, schedule.id),
        {
          loading: 'กำลังส่งการแจ้งเตือน',
          success: 'ส่งการแจ้งเตือน Super Admin แล้ว',
          error: 'ไม่สามารถส่งการแจ้งเตือนได้'
        }
      );
    } finally {
      setNotifyingScheduleId(null);
    }
  };

  const notifyAccounting = async (schedule: PurchaseOrderPaymentSchedule) => {
    setNotifyingScheduleId(schedule.id);
    try {
      await toast.promise(
        notifyAccountingAdminsOfPaymentSchedule(purchaseOrder.purchaseOrderNo, schedule.id),
        {
          loading: 'กำลังแจ้งบัญชี',
          success: 'ส่งการแจ้งเตือนไปยังบัญชีแล้ว',
          error: 'ไม่สามารถส่งการแจ้งเตือนไปยังบัญชีได้'
        }
      );
    } finally {
      setNotifyingScheduleId(null);
    }
  };

  const confirmScheduleWithAccounting = async (schedule: PurchaseOrderPaymentSchedule) => {
    setNotifyingScheduleId(schedule.id);
    try {
      await toast.promise(
        notifyAccountingAdminsForSavePayment(purchaseOrder.purchaseOrderNo, schedule.id),
        {
          loading: 'กำลังแจ้งบัญชี',
          success: 'ส่งการแจ้งเตือนไปยังบัญชีแล้ว',
          error: 'ไม่สามารถส่งการแจ้งเตือนไปยังบัญชีได้'
        }
      );
    } finally {
      setNotifyingScheduleId(null);
    }
  };

  const closePaymentDialog = () => {
    if (isSubmitting) return;
    setPaymentDialogOpen(false);
    setEditingPayment(null);
    setFiles([]);
    onCreatePaymentCancelled?.();
  };

  const hasValidForm = (): boolean => {
    const amount = Number(form.amount || 0);
    if (schedules.length > 0 && !form.scheduleId) return false;
    if (!form.paymentDate || amount <= 0 || amount > allowedAmount) return false;
    if (!Number.isFinite(Number(form.amountThb)) || Number(form.amountThb) <= 0) return false;
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
      instructionId: form.instructionId ? Number(form.instructionId) : null,
      paymentType: form.paymentType,
      installmentNo: form.paymentType === 'INSTALLMENT' ? Number(form.installmentNo || 0) : null,
      paymentDate: dayjs(form.paymentDate).toISOString(),
      amount: Number(form.amount),
      amountThb: Number(form.amountThb),
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
      await Promise.all([
        onChanged(),
        refetchPayments(),
        refetchSchedules(),
        refetchInstructions()
      ]);
      if (!editingPayment) onCreatePaymentSaved?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveInstruction = async () => {
    const amountThb = Number(instructionForm.amountThb || 0);
    const scheduleId = Number(instructionForm.scheduleId);
    const schedule = schedules.find((item) => item.id === scheduleId);
    if (!schedule) {
      toast.error('กรุณาเลือกงวดการชำระเงิน');
      return;
    }
    if (!Number.isFinite(amountThb) || amountThb <= 0) {
      toast.error(creatingDraft ? 'กรุณากรอกยอด CNY ให้มากกว่า 0' : 'กรุณากรอกยอดตั้งจ่ายให้มากกว่า 0');
      return;
    }
    if (!instructionForm.plannedPaymentDate) {
      toast.error('กรุณาระบุวันที่ตั้งจ่าย');
      return;
    }
    const isDraftSubmit = editingInstruction?.status === 'DRAFT';
    const amountInPoCurrency = creatingDraft ? amountThb : isDraftSubmit ? editingInstruction.amount : instructionScheduleRemaining(schedule);
    const maxAmount =
      instructionCapacity(schedule) +
      (editingInstruction?.scheduleId === schedule.id
        ? instructionRemaining(editingInstruction)
        : 0);
    if (amountInPoCurrency > maxAmount + 0.00001) {
      toast.error('กรุณาตรวจสอบงวดและยอดตั้งจ่าย');
      return;
    }

    const payload: PurchaseOrderPaymentInstructionRequest = {
      scheduleId,
      amount: creatingDraft ? amountThb : amountInPoCurrency,
      ...(creatingDraft ? {} : { amountThb }),
      ...(instructionForm.exchangeRate.trim()
        ? { exchangeRate: Number(instructionForm.exchangeRate) }
        : {}),
      plannedPaymentDate: instructionForm.plannedPaymentDate,
      remark: instructionForm.remark.trim() || null
    };
    setIsSubmitting(true);
    try {
      await toast.promise(
        editingInstruction
          ? isDraftSubmit
            ? submitPurchaseOrderPaymentInstructionDraft(purchaseOrder.purchaseOrderNo, editingInstruction.id, payload)
            : updatePurchaseOrderPaymentInstruction(
              purchaseOrder.purchaseOrderNo,
              editingInstruction.id,
              payload
            )
          : creatingDraft
            ? createPurchaseOrderPaymentInstructionDraft(purchaseOrder.purchaseOrderNo, payload)
            : createPurchaseOrderPaymentInstruction(purchaseOrder.purchaseOrderNo, payload),
        {
          loading: 'กำลังบันทึกรายการตั้งจ่าย',
          success: isDraftSubmit
            ? 'ส่งรายการตั้งจ่ายให้ผู้อนุมัติแล้ว'
            : editingInstruction
              ? 'แก้ไขรายการตั้งจ่ายแล้ว'
              : creatingDraft ? 'สร้างร่างรายการตั้งจ่ายแล้ว' : 'บันทึกรายการตั้งจ่ายและแจ้งผู้อนุมัติแล้ว',
          error: 'ไม่สามารถบันทึกรายการตั้งจ่ายได้'
        }
      );
      setSetPaymentDialogOpen(false);
      setEditingInstruction(null);
      setCreatingDraft(false);
      await Promise.all([onChanged(), refetchInstructions(), refetchSchedules()]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelInstruction = async (instruction: PurchaseOrderPaymentInstruction) => {
    setIsSubmitting(true);
    try {
      await toast.promise(
        cancelPurchaseOrderPaymentInstruction(purchaseOrder.purchaseOrderNo, instruction.id),
        {
          loading: 'กำลังยกเลิกรายการตั้งจ่าย',
          success: 'ยกเลิกรายการตั้งจ่ายแล้ว',
          error: 'ไม่สามารถยกเลิกรายการตั้งจ่ายได้'
        }
      );
      await Promise.all([onChanged(), refetchInstructions(), refetchSchedules()]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmInstructionPaid = async () => {
    if (!instructionToConfirmPaid) return;
    setIsSubmitting(true);
    try {
      await toast.promise(
        confirmPurchaseOrderPaymentInstructionPaid(
          purchaseOrder.purchaseOrderNo,
          instructionToConfirmPaid.id
        ),
        {
          loading: 'กำลังยืนยันการชำระเงิน',
          success: 'ยืนยันการชำระเงินแล้ว',
          error: 'ไม่สามารถยืนยันการชำระเงินได้'
        }
      );
      setInstructionToConfirmPaid(null);
      try {
        await toast.promise(
          notifyAccountingAdminsForSavePayment(
            purchaseOrder.purchaseOrderNo,
            instructionToConfirmPaid.scheduleId
          ),
          {
            loading: 'กำลังแจ้งบัญชี',
            success: 'ส่ง LINE แจ้งบัญชีแล้ว',
            error: 'ยืนยันการชำระเงินแล้ว แต่ส่ง LINE แจ้งบัญชีไม่สำเร็จ'
          }
        );
      } catch {
        // Keep refreshing the saved payment status even if LINE notification fails.
      }
      await refetchInstructions();
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
      await Promise.all([
        onChanged(),
        refetchPayments(),
        refetchSchedules(),
        refetchInstructions()
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const amountError =
    showErrors && (Number(form.amount || 0) <= 0 || Number(form.amount || 0) > allowedAmount);
  const amountThbError = showErrors && Number(form.amountThb || 0) <= 0;
  useEffect(() => {
    if (openCreateRequest > 0) openCreateDialog();
    // The dialog should open only when the parent sends a new request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCreateRequest]);

  useEffect(() => {
    if (openDraftRequest > 0) openDraftDialog(draftScheduleId);
    // Parent sends a new request when production completion needs a draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openDraftRequest]);

  if (!canView) return null;

  return (
    <>
      <Stack
        spacing={2}
        sx={{
          backgroundColor: BRAND_COLORS.ivory,
          border: `1px solid ${BRAND_COLORS.sand}`,
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
          {canInstruct || canCreate || canStartRun ? (
            <Stack direction="row" spacing={1}>
              {canInstruct ? (
                <Button
                  variant="contained"
                  startIcon={<PaymentsOutlined />}
                  disabled={
                    paymentDisabled ||
                    !schedules.some((schedule) => instructionCapacity(schedule) > 0)
                  }
                  onClick={() => openInstructionDialog()}>
                  ตั้งจ่าย
                </Button>
              ) : null}
              {canStartRun ? (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  disabled={paymentDisabled || !schedules.some((s) => instructionCapacity(s) > 0)}
                  onClick={openDraftDialog}>
                  สร้างร่างตั้งจ่าย
                </Button>
              ) : null}
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
          ) : null}
        </Stack>

        <Grid container spacing={1.5}>
          <Grid item xs={12} sm={3}>
            <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: BRAND_UI.sandTint }}>
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
            <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: BRAND_UI.greenTint }}>
              <Typography variant="caption" color="text.secondary">
                คงเหลือ
              </Typography>
              <Typography sx={{ fontWeight: 700, color: BRAND_COLORS.green }}>
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
            <TableContainer sx={{ border: `1px solid ${BRAND_COLORS.sand}`, borderRadius: 2 }}>
              <Table size="small" sx={{ minWidth: 760 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: BRAND_UI.sandTint }}>
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
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <span>งวดที่ {schedule.installmentNo}</span>
                          {canCreate && schedule.status === 'AWAITING_PAYMENT_SETUP' ? (
                            <Tooltip title="แจ้งเตือน Super Admin">
                              <span>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  aria-label={`แจ้งเตือนงวดที่ ${schedule.installmentNo}`}
                                  disabled={notifyingScheduleId !== null}
                                  onClick={() => void notifySuperAdmins(schedule)}>
                                  <NotificationsActiveOutlined fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          ) : null}
                        </Stack>
                      </TableCell>
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
                        <Tooltip
                          title={
                            canConfirmPayment && schedule.status === 'AWAITING_PAYMENT_SETUP'
                              ? 'กดเพื่อแจ้งบัญชีตั้งจ่าย'
                              : ''
                          }>
                          <span>
                            <Chip
                              size="small"
                              color={
                                schedule.status === 'PAID'
                                  ? 'success'
                                  : schedule.status === 'PARTIALLY_PAID'
                                    ? 'warning'
                                    : schedule.status === 'AWAITING_PAYMENT_SETUP'
                                      ? 'info'
                                      : schedule.status === 'AWAITING_PAYMENT'
                                        ? 'warning'
                                        : 'default'
                              }
                              label={SCHEDULE_STATUS_LABELS[schedule.status] || schedule.status}
                              clickable={
                                canConfirmPayment && schedule.status === 'AWAITING_PAYMENT_SETUP'
                              }
                              disabled={
                                canConfirmPayment &&
                                schedule.status === 'AWAITING_PAYMENT_SETUP' &&
                                notifyingScheduleId !== null
                              }
                              onClick={() => {
                                if (
                                  canConfirmPayment &&
                                  schedule.status === 'AWAITING_PAYMENT_SETUP'
                                ) {
                                  void notifyAccounting(schedule);
                                }
                              }}
                            />
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : null}

        {instructions.length ? (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              รายการตั้งจ่าย
            </Typography>
            <TableContainer sx={{ border: `1px solid ${BRAND_COLORS.sand}`, borderRadius: 2 }}>
              <Table size="small" sx={{ minWidth: 820 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: BRAND_UI.sandTint }}>
                    <TableCell>งวด</TableCell>
                    <TableCell>วันที่วางแผนจ่าย</TableCell>
                    <TableCell align="right">ยอดตั้งจ่าย</TableCell>
                    <TableCell align="right">ยอด PO (CNY)</TableCell>
                    <TableCell align="right">จ่ายแล้ว</TableCell>
                    <TableCell align="center">สถานะ</TableCell>
                    <TableCell align="center">ดำเนินการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {instructions.map((instruction) => {
                    const instructionSchedule = schedules.find(
                      (schedule) => schedule.id === instruction.scheduleId
                    );
                    const editable =
                      canInstruct &&
                      (instruction.status === 'DRAFT' || instruction.status === 'AWAITING_PAYMENT') &&
                      Number(instruction.paidAmount || 0) === 0;
                    const confirmable =
                      canConfirmPayment &&
                      instruction.status === 'AWAITING_PAYMENT' &&
                      Number(instruction.paidAmount || 0) === 0;
                    const canNotifyAccounting =
                      canConfirmPayment &&
                      instruction.status === 'PAID' &&
                      Boolean(instructionSchedule);
                    return (
                      <TableRow key={instruction.id} hover>
                        <TableCell>งวดที่ {instruction.installmentNo}</TableCell>
                        <TableCell>
                          {dayjs(instruction.plannedPaymentDate).format('DD/MM/YYYY')}
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(instruction.amountThb)} THB
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(instruction.amount)} {instruction.currency}
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(instruction.paidAmount)} {instruction.currency}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            color={
                              instruction.status === 'PAID'
                                ? 'success'
                                : instruction.status === 'PARTIALLY_PAID'
                                  ? 'warning'
                                  : instruction.status === 'DRAFT'
                                    ? 'warning'
                                    : instruction.status === 'AWAITING_PAYMENT'
                                      ? 'info'
                                      : 'default'
                            }
                            label={
                              INSTRUCTION_STATUS_LABELS[instruction.status] || instruction.status
                            }
                          />
                        </TableCell>
                        <TableCell align="center">
                          {editable || confirmable || canNotifyAccounting ? (
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              {editable ? (
                                <>
                                  <Tooltip title="แก้ไขรายการตั้งจ่าย">
                                    <IconButton
                                      size="small"
                                      onClick={() => openInstructionDialog(instruction)}>
                                      <EditOutlined fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="ยกเลิกรายการตั้งจ่าย">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      disabled={isSubmitting}
                                      onClick={() => void handleCancelInstruction(instruction)}>
                                      <HighlightOff fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              ) : null}
                              {confirmable ? (
                                <Tooltip title="ยืนยันว่าชำระเงินแล้ว">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    disabled={isSubmitting}
                                    onClick={() => setInstructionToConfirmPaid(instruction)}>
                                    <Paid fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              ) : null}
                              {canNotifyAccounting && instructionSchedule ? (
                                <Tooltip title="แจ้งบัญชีให้บันทึกรายการชำระเงิน">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    disabled={notifyingScheduleId !== null}
                                    onClick={() =>
                                      void confirmScheduleWithAccounting(instructionSchedule)
                                    }>
                                    <NotificationsActiveOutlined fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              ) : null}
                            </Stack>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : null}

        {payments.length ? (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              รายการชำระแล้ว
            </Typography>
            <TableContainer sx={{ border: `1px solid ${BRAND_COLORS.sand}`, borderRadius: 2 }}>
              <Table size="small" sx={{ minWidth: 980 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: BRAND_UI.sandTint }}>
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
                        {payment.instructionId ? ` · ตั้งจ่าย #${payment.instructionId}` : ''}
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
                                <IconButton
                                  size="small"
                                  component="a"
                                  href={attachment.fileUrl || undefined}
                                  target="_blank"
                                  rel="noopener noreferrer">
                                  <FilePresent fontSize="small" />
                                </IconButton>
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
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => openDecision('APPROVE', payment)}>
                                  <CheckCircleOutline fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="ไม่อนุมัติ">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => openDecision('REJECT', payment)}>
                                  <HighlightOff fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : null}
                          {payment.status === 'APPROVED' && canVoid ? (
                            <Tooltip title="ยกเลิกรายการ">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => openDecision('VOID', payment)}>
                                <RemoveCircleOutline fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : null}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
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
                        instructionCapacity(schedule) +
                        (editingPayment?.scheduleId === schedule.id
                          ? Number(editingPayment.amount || 0)
                          : 0);
                      setForm((previous) => ({
                        ...previous,
                        scheduleId: String(schedule.id),
                        instructionId: '',
                        paymentType: schedule.paymentType,
                        installmentNo: String(schedule.installmentNo),
                        amount: String(
                          Math.min(
                            remaining,
                            uninstructedAvailableAmount + Number(editingPayment?.amount || 0)
                          )
                        )
                      }));
                    }}>
                    {schedules.map((schedule) => {
                      const isCurrent = editingPayment?.scheduleId === schedule.id;
                      const hasActiveInstruction = activeInstructions.some(
                        (instruction) => instruction.scheduleId === schedule.id
                      );
                      const remaining =
                        instructionCapacity(schedule) +
                        (isCurrent ? Number(editingPayment.amount || 0) : 0);
                      return (
                        <MenuItem
                          key={schedule.id}
                          value={schedule.id}
                          disabled={remaining <= 0 && !isCurrent && !hasActiveInstruction}>
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
            {selectedScheduleInstructions.map((instruction) => {
              return (
                <Grid item xs={12} key={instruction.id}>
                  <Box
                    sx={{
                      p: 1.5,
                      border: `1px solid ${BRAND_COLORS.sand}`,
                      borderRadius: 2,
                      backgroundColor: BRAND_UI.sandTint
                    }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                      ข้อมูลรายการตั้งจ่าย #{instruction.id}
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="จำนวนตั้งจ่าย (THB)"
                          value={formatNumber(instruction.amountThb)}
                          InputLabelProps={{ shrink: true }}
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="สถานะ"
                          value={
                            INSTRUCTION_STATUS_LABELS[instruction.status] || instruction.status
                          }
                          InputLabelProps={{ shrink: true }}
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="วันที่ยืนยันชำระเงิน"
                          value={instruction.confirmedPaidDate && dayjs(instruction.confirmedPaidDate).isValid()
                            ? dayjs(instruction.confirmedPaidDate).format('DD/MM/YYYY HH:mm')
                            : '-'}
                          InputLabelProps={{ shrink: true }}
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              );
            })}
            {selectedSchedule &&
              activeInstructions.some(
                (instruction) => instruction.scheduleId === selectedSchedule.id
              ) ? (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>รายการตั้งจ่าย</InputLabel>
                  <Select
                    label="รายการตั้งจ่าย"
                    value={form.instructionId}
                    onChange={(event) => {
                      const instructionId = String(event.target.value || '');
                      const instruction = instructions.find(
                        (item) => item.id === Number(instructionId)
                      );
                      setForm((previous) => ({
                        ...previous,
                        instructionId,
                        amount: instruction
                          ? String(Math.min(instructionRemaining(instruction), availableAmount))
                          : String(
                            Math.min(
                              instructionCapacity(selectedSchedule),
                              uninstructedAvailableAmount
                            )
                          )
                      }));
                    }}>
                    <MenuItem value="">ไม่ผูกกับรายการตั้งจ่าย</MenuItem>
                    {activeInstructions
                      .filter((instruction) => instruction.scheduleId === selectedSchedule.id)
                      .map((instruction) => (
                        <MenuItem key={instruction.id} value={instruction.id}>
                          #{instruction.id} · {formatNumber(instructionRemaining(instruction))}{' '}
                          {instruction.currency} คงเหลือ
                        </MenuItem>
                      ))}
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
                value={
                  form.amount
                    ? isPaymentAmountFocused
                      ? form.amount
                      : formatNumber(Number(form.amount))
                    : ''
                }
                onFocus={() => setIsPaymentAmountFocused(true)}
                onBlur={() => setIsPaymentAmountFocused(false)}
                onChange={(event) => updateForm('amount', event.target.value.replace(/,/g, ''))}
                error={amountError}
                InputLabelProps={{ shrink: true }}
                inputProps={{ inputMode: 'decimal' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="text"
                label="ยอดชำระ (THB)"
                value={form.amountThb}
                onChange={(event) => updateForm('amountThb', event.target.value.replace(/,/g, ''))}
                error={amountThbError}
                helperText={amountThbError ? 'กรุณากรอกยอดชำระ THB ให้มากกว่า 0' : ''}
                InputLabelProps={{ shrink: true }}
                inputProps={{ inputMode: 'decimal' }}
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
                  helperText={
                    isExchangeRateLoading
                      ? 'กำลังโหลดอัตราแลกเปลี่ยน...'
                      : isExchangeRateError
                        ? 'ไม่สามารถโหลดอัตราแลกเปลี่ยนได้ กรุณากรอกอัตราแลกเปลี่ยน'
                        : exchangeRateResponse
                          ? `${exchangeRateResponse.base} → ${exchangeRateResponse.quote}: ${exchangeRateResponse.rate} @${exchangeRateResponse.date}`
                          : ''
                  }
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
        open={setPaymentDialogVisible}
        onClose={() => !isSubmitting && setSetPaymentDialogOpen(false)}
        fullWidth
        maxWidth="md">
        <DialogTitle>{creatingDraft ? 'สร้างร่างรายการตั้งจ่าย' : editingInstruction ? 'แก้ไขรายการตั้งจ่าย' : 'ตั้งจ่าย'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 0.5 }}>
            {schedules.length ? (
              <Grid item xs={12}>
                <FormControl fullWidth error={!instructionForm.scheduleId}>
                  <InputLabel>งวดการชำระเงิน</InputLabel>
                  <Select
                    label="งวดการชำระเงิน"
                    value={instructionForm.scheduleId}
                    onChange={(event) => {
                      const schedule = schedules.find(
                        (item) => item.id === Number(event.target.value)
                      );
                      if (!schedule) return;
                      setInstructionForm((previous) => ({
                        ...previous,
                        scheduleId: String(schedule.id),
                        amountThb:
                          instructionInputMode === 'EXCHANGE_RATE'
                            ? (
                              instructionScheduleRemaining(schedule) *
                              Number(previous.exchangeRate || 0)
                            ).toFixed(2)
                            : previous.amountThb
                      }));
                    }}>
                    {schedules.map((schedule) => {
                      const remaining = instructionScheduleRemaining(schedule);
                      return (
                        <MenuItem
                          key={schedule.id}
                          value={schedule.id}
                          disabled={
                            remaining <= 0 && editingInstruction?.scheduleId !== schedule.id
                          }>
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
              <TextField
                fullWidth
                type="date"
                label="วันที่วางแผนจ่าย"
                value={instructionForm.plannedPaymentDate}
                onChange={(event) =>
                  setInstructionForm((previous) => ({
                    ...previous,
                    plannedPaymentDate: event.target.value
                  }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="text"
                label={creatingDraft ? `ยอดที่โรงงานแจ้ง (${purchaseOrder.currency || 'CNY'})` : 'ยอดตั้งจ่าย (THB)'}
                value={
                  instructionForm.amountThb
                    ? isInstructionAmountFocused
                      ? instructionForm.amountThb
                      : formatNumber(Number(instructionForm.amountThb))
                    : ''
                }
                onChange={(event) => {
                  const amountThb = event.target.value.replace(/,/g, '');
                  setInstructionInputMode(amountThb ? 'AMOUNT_THB' : 'NONE');
                  setInstructionForm((previous) => ({
                    ...previous,
                    amountThb,
                    exchangeRate: ''
                  }));
                }}
                onFocus={() => setIsInstructionAmountFocused(true)}
                onBlur={() => setIsInstructionAmountFocused(false)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  readOnly: instructionInputMode === 'EXCHANGE_RATE',
                  disabled: instructionInputMode === 'EXCHANGE_RATE'
                }}
                inputProps={{ inputMode: 'decimal' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={`ยอดคงเหลืองวด PO (${purchaseOrder.currency || '-'})`}
                value={(() => {
                  const schedule = schedules.find(
                    (item) => item.id === Number(instructionForm.scheduleId)
                  );
                  return schedule ? formatNumber(instructionScheduleRemaining(schedule)) : '';
                })()}
                InputLabelProps={{ shrink: true }}
                InputProps={{ readOnly: true, disabled: true }}
              />
            </Grid>
            {!creatingDraft && purchaseOrder.currency !== 'THB' ? (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="อัตราแลกเปลี่ยนเป็น THB"
                  value={instructionForm.exchangeRate}
                  onChange={(event) => {
                    const exchangeRate = event.target.value;
                    const parsedRate = Number(exchangeRate || 0);
                    setInstructionInputMode(parsedRate > 0 ? 'EXCHANGE_RATE' : 'NONE');
                    setInstructionForm((previous) => {
                      const schedule = schedules.find(
                        (item) => item.id === Number(previous.scheduleId)
                      );
                      return {
                        ...previous,
                        exchangeRate,
                        amountThb:
                          parsedRate > 0 && schedule
                            ? (instructionScheduleRemaining(schedule) * parsedRate).toFixed(2)
                            : ''
                      };
                    });
                  }}
                  InputLabelProps={{ shrink: true }}
                  disabled={instructionInputMode === 'AMOUNT_THB'}
                  inputProps={{ min: 0.000001, step: 0.000001 }}
                  helperText={
                    isExchangeRateLoading
                      ? 'กำลังโหลดอัตราแลกเปลี่ยน...'
                      : isExchangeRateError
                        ? 'ไม่สามารถโหลดอัตราแลกเปลี่ยนได้ กรุณากรอกอัตราแลกเปลี่ยน'
                        : exchangeRateResponse
                          ? `${exchangeRateResponse.base} → ${exchangeRateResponse.quote}: ${exchangeRateResponse.rate} @${exchangeRateResponse.date}`
                          : ''
                  }
                />
              </Grid>
            ) : null}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="หมายเหตุ"
                value={instructionForm.remark}
                onChange={(event) =>
                  setInstructionForm((previous) => ({
                    ...previous,
                    remark: event.target.value
                  }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSetPaymentDialogOpen(false)} disabled={isSubmitting}>
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleSaveInstruction()}
            disabled={isSubmitting}>
            {creatingDraft ? 'สร้างร่าง' : editingInstruction ? 'บันทึกการแก้ไข' : 'ยืนยันตั้งจ่าย'}
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

      <ConfirmDialog
        open={Boolean(instructionToConfirmPaid)}
        title="ยืนยันการชำระเงิน"
        message={
          instructionToConfirmPaid
            ? `ยืนยันว่าได้ชำระเงินตามยอดตั้งจ่าย งวดที่ ${instructionToConfirmPaid.installmentNo
            } จำนวน ${formatNumber(instructionToConfirmPaid.amountThb)} THB (${formatNumber(
              instructionToConfirmPaid.amount
            )} ${instructionToConfirmPaid.currency}) แล้วใช่หรือไม่`
            : ''
        }
        confirmText="ยืนยันชำระเงินแล้ว"
        confirmDisabled={isSubmitting}
        cancelText="ยกเลิก"
        isShowCancelButton
        isShowConfirmButton
        onCancel={() => !isSubmitting && setInstructionToConfirmPaid(null)}
        onConfirm={() => void handleConfirmInstructionPaid()}
      />
    </>
  );
}
