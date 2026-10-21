import { BRAND_COLORS, BRAND_UI } from 'theme/brandTokens';
import {
  ArrowBackIos,
  ArrowDropDown,
  Add,
  CalendarMonth,
  Cancel,
  CancelPresentation,
  Calculate,
  DeleteOutline,
  Description,
  Edit,
  FilePresent,
  Menu as MenuIcon,
  OpenInNew,
  PlayArrow,
  PrecisionManufacturing,
  Save,
  Settings,
  TaskAlt
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { PERMISSIONS } from 'auth/permissions';
import { usePermissions } from 'auth/PermissionContext';
import ActivityHistoryTimeline from 'components/ActivityHistoryTimeline';
import ConfirmDialog from 'components/ConfirmDialog';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import PurchaseOrderProductionSteps from 'components/PurchaseOrderProductionSteps';
import { GridTextField, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import {
  ChangeEvent,
  Fragment,
  MouseEvent as ReactMouseEvent,
  ReactElement,
  SyntheticEvent,
  useEffect,
  useMemo,
  useState
} from 'react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { openDocumentPreview } from 'utils/documentPreview';
import { getActivityHistory } from 'services/ActivityHistory/activity-history-api';
import {
  cancelPurchaseOrder,
  checkPurchaseOrderLateStart,
  closePurchaseOrder,
  getPurchaseOrderPayments,
  getPurchaseOrderPaymentSchedules,
  getPurchaseOrderPaymentInstructions,
  getPurchaseOrderProductionTimeline,
  completePurchaseOrderMilestone,
  completePurchaseOrderProduction,
  skipPurchaseOrderMilestone,
  deletePurchaseOrderAttachment,
  getPurchaseOrder,
  viewPurchaseOrder,
  updatePurchaseOrder,
  updatePurchaseOrderProductionExpectedEndDate,
  startPurchaseOrderRun,
  uploadPurchaseOrderAttachments
} from 'services/PurchaseOrder/purchase-order-api';
import {
  PurchaseOrderAttachmentDocumentType,
  PurchaseOrderDetailComponent,
  PurchaseOrderItem,
  PurchaseOrderMilestoneCode,
  PurchaseOrderTimelineEvent,
  PurchaseOrderRecord,
  PurchaseOrderPaymentInstruction,
  CompletePurchaseOrderProductionRequest,
  UpdatePurchaseOrderRequest
} from 'services/PurchaseOrder/purchase-order-type';
import { base64ToBlob } from 'utils';
import { getDocumentStatusChipSx, getDocumentStatusLabel } from 'utils/documentStatus';
import { getShippingMethodLabel } from 'utils/shipping';
import { getPurchaseOrderStartRunWarnings } from 'utils/purchaseOrderStartRun';
import { formatNumber } from 'utils/utils';
import PurchaseOrderPaymentSection from './PurchaseOrderPaymentSection';
import PurchaseOrderDeliverySection from './PurchaseOrderDeliverySection';
import PurchaseOrderProofSection from './PurchaseOrderProofSection';
import App from 'App';

interface PurchaseOrderDetailParams {
  id: string;
}

interface PurchaseOrderDraft {
  docDate: string;
  productionLeadTimeDay: string;
  shippingLeadTimeDay: string;
  remark: string;
  items: PurchaseOrderItem[];
}

interface PurchaseOrderAttachmentCategory {
  documentType: PurchaseOrderAttachmentDocumentType;
  title: string;
  description: string;
}

interface ProductionDeliveryDetailDraft {
  optionNo: number;
  purchaseOrderDetailId: number;
  purchaseOrderDetailComponentId: number | null;
  label: string;
  quantity: string;
  remainingQuantity: string;
  cartonCount: string;
  piecesPerCarton: string;
  netWeightKg: string;
  grossWeightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  cbmM3: string;
}

interface ProductionDeliveryDraft {
  shippedDate: string;
  expectedWarehouseDate: string;
  receivedDate: string;
  shippingMethod: string;
  shippingLocationId: string;
  details: ProductionDeliveryDetailDraft[];
}

function createProductionDeliveryDraft(
  purchaseOrder?: PurchaseOrderRecord | null
): ProductionDeliveryDraft {
  const today = dayjs();
  const expectedDate = today.add(Number(purchaseOrder?.shippingLeadTimeDay || 0), 'day');
  const activeDestinations = purchaseOrder?.supplierShipping?.destinations || [];
  const deliveredQuantityFor = (purchaseOrderDetailId: number, componentId: number | null) =>
    (purchaseOrder?.deliveries || [])
      .filter((delivery) => delivery.status !== 'CANCELLED')
      .flatMap((delivery) => delivery.details || [])
      .filter(
        (detail) =>
          detail.purchaseOrderDetailId === purchaseOrderDetailId &&
          (detail.purchaseOrderDetailComponentId ?? null) === componentId
      )
      .reduce((total, detail) => total + Number(detail.quantity || 0), 0);
  const details = (purchaseOrder?.items || [])
    .filter((item) => item.name?.trim().toLowerCase() !== 'delivery')
    .flatMap((item) => {
      const packageRows = (item.packages || []).filter(
        (itemPackage) => itemPackage.selectedForCalculation
      );
      const primaryPackage = packageRows[0] || item.packages?.[0];
      const cartons = packageRows.reduce(
        (sum, itemPackage) => sum + Number(itemPackage.cartonCount || 0),
        0
      );
      const cbm = packageRows.reduce(
        (sum, itemPackage) => sum + Number(itemPackage.totalCbm || 0),
        0
      );
      const base = {
        purchaseOrderDetailId: item.id,
        label: item.name,
        cartonCount: cartons ? String(cartons) : '',
        piecesPerCarton: primaryPackage?.capacityQty ? String(primaryPackage.capacityQty) : '',
        netWeightKg: '',
        grossWeightKg: '',
        lengthCm: primaryPackage?.lengthCm ? String(primaryPackage.lengthCm) : '',
        widthCm: primaryPackage?.widthCm ? String(primaryPackage.widthCm) : '',
        heightCm: primaryPackage?.heightCm ? String(primaryPackage.heightCm) : '',
        cbmM3: cbm ? String(cbm) : ''
      };
      return [
        ...(item.components || [])
          .map((component) => ({
            ...base,
            optionNo: 1,
            purchaseOrderDetailComponentId: component.id || null,
            label: component.componentName || 'อะไหล่/ชิ้นส่วน',
            quantity: '',
            remainingQuantity: String(
              Math.max(
                Number(
                  component.totalQuantity ??
                  Number(item.quantity || 0) * Number(component.quantityPerItem || 0)
                ) - deliveredQuantityFor(item.id, component.id || null),
                0
              )
            ),
            cartonCount: '',
            piecesPerCarton: '',
            lengthCm: '',
            widthCm: '',
            heightCm: '',
            cbmM3: ''
          }))
          .filter(
            (detail) =>
              detail.purchaseOrderDetailComponentId !== null && Number(detail.remainingQuantity) > 0
          )
      ];
    });
  return {
    shippedDate: today.format('YYYY-MM-DD'),
    expectedWarehouseDate: expectedDate.format('YYYY-MM-DD'),
    receivedDate: '',
    shippingMethod:
      purchaseOrder?.shippingMethodSnapshot ||
      purchaseOrder?.supplierShipping?.shippingMethod ||
      '',
    shippingLocationId: activeDestinations.length === 1 ? String(activeDestinations[0].id) : '',
    details
  };
}

const PURCHASE_ORDER_ATTACHMENT_CATEGORIES: PurchaseOrderAttachmentCategory[] = [
  {
    documentType: 'FACTORY_CONTRACT',
    title: 'สัญญากับทางโรงงาน',
    description: 'สัญญา ข้อตกลง หรือเอกสารยืนยันจากโรงงาน'
  },
  {
    documentType: 'FINAL_ARTWORK',
    title: 'Final Artwork',
    description: 'Artwork ฉบับสุดท้ายที่อนุมัติแล้ว'
  },
  {
    documentType: 'PAYMENT_SLIP',
    title: 'สลิปโอนเงิน',
    description: 'หลักฐานการชำระเงินหรือสลิปโอนเงิน'
  },
  {
    documentType: 'OTHER',
    title: 'เอกสารอื่นๆ',
    description: 'เอกสารประกอบอื่นที่เกี่ยวข้องกับใบสั่งซื้อ'
  }
];

const resolveAttachmentDocumentType = (
  documentType?: PurchaseOrderAttachmentDocumentType | null
): PurchaseOrderAttachmentDocumentType =>
  PURCHASE_ORDER_ATTACHMENT_CATEGORIES.some((item) => item.documentType === documentType)
    ? (documentType as PurchaseOrderAttachmentDocumentType)
    : 'OTHER';

function TabPanel({
  value,
  currentTab,
  children,
  keepMounted = false
}: {
  value: string;
  currentTab: string;
  children: ReactElement;
  keepMounted?: boolean;
}): ReactElement | null {
  if (value !== currentTab && !keepMounted) {
    return null;
  }
  return (
    <Box role="tabpanel" hidden={value !== currentTab} sx={{ pt: 3 }}>
      {children}
    </Box>
  );
}

function Info({ label, value }: { label: string; value?: string | number | null }): ReactElement {
  return (
    <Stack spacing={0.25}>
      <Typography sx={{ color: BRAND_UI.mutedText, fontSize: 12, fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontWeight: 500, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {value || '-'}
      </Typography>
    </Stack>
  );
}

function Summary({
  label,
  value,
  suffix
}: {
  label: string;
  value: number;
  suffix?: string;
}): ReactElement {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
      <Typography sx={{ color: BRAND_UI.mutedText, fontSize: 12, fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {formatNumber(value || 0)} {suffix || ''}
      </Typography>
    </Stack>
  );
}

function createDraft(purchaseOrder?: PurchaseOrderRecord): PurchaseOrderDraft {
  return {
    docDate: purchaseOrder?.docDate?.replace(/^(\d{2})\/(\d{2})\/(\d{4})$/, '$3-$2-$1') || '',
    productionLeadTimeDay:
      purchaseOrder?.productionLeadTimeDay !== null &&
        purchaseOrder?.productionLeadTimeDay !== undefined
        ? String(purchaseOrder.productionLeadTimeDay)
        : '',
    shippingLeadTimeDay:
      purchaseOrder?.shippingLeadTimeDay !== null &&
        purchaseOrder?.shippingLeadTimeDay !== undefined
        ? String(purchaseOrder.shippingLeadTimeDay)
        : '',
    remark: purchaseOrder?.remark || '',
    items: (purchaseOrder?.items || []).map((item) => ({ ...item }))
  };
}

function milestoneErrorMessage(error: any): string {
  return (
    error?.response?.data?.message || error?.response?.data?.error || 'ไม่สามารถอัปเดต Timeline ได้'
  );
}

function optionalNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function milestoneActionLabel(event?: PurchaseOrderTimelineEvent): string {
  if (!event) return '';
  const labels: Record<string, string> = {
    PRODUCTION_STARTED: 'เริ่มผลิต',
    PRODUCTION_COMPLETED: 'บันทึกผลิตเสร็จ'
  };
  return labels[event.type] || `บันทึก ${event.label}`;
}

export default function PurchaseOrderDetail(): ReactElement {
  const { id } = useParams<PurchaseOrderDetailParams>();
  const history = useHistory();
  const theme = useTheme();
  const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();
  const { has } = usePermissions();
  const canViewProof = has(PERMISSIONS.PO_PROOF_VIEW);
  const canViewSupplierPayment = has(PERMISSIONS.PURCHASE_ORDER_PAYMENT_VIEW);
  const canManageTimeline = has(PERMISSIONS.PURCHASE_ORDER_START_RUN);
  const availableTabs: Array<'detail' | 'payment' | 'proof' | 'delivery' | 'history'> = [
    'detail',
    ...(canViewSupplierPayment ? ['payment' as const] : []),
    ...(canViewProof ? ['proof' as const] : []),
    'delivery',
    'history'
  ];
  const [tab, setTab] = useState<'detail' | 'payment' | 'proof' | 'delivery' | 'history'>(() => {
    const searchParams = new URLSearchParams(history.location.search);
    const requestedTab = searchParams.get('tab') as
      | 'detail'
      | 'payment'
      | 'proof'
      | 'delivery'
      | 'history'
      | null;
    if (requestedTab && availableTabs.includes(requestedTab)) return requestedTab;

    const requestedIndex = Number(searchParams.get('tabIndex'));
    if (
      searchParams.has('tabIndex') &&
      Number.isInteger(requestedIndex) &&
      requestedIndex >= 0 &&
      requestedIndex < availableTabs.length
    ) {
      return availableTabs[requestedIndex];
    }
    return 'detail';
  });
  useEffect(() => {
    const searchParams = new URLSearchParams(history.location.search);
    const requestedTab = searchParams.get('tab') as
      | 'detail'
      | 'payment'
      | 'proof'
      | 'delivery'
      | 'history'
      | null;
    if (requestedTab && availableTabs.includes(requestedTab)) {
      setTab(requestedTab);
      return;
    }

    const requestedIndex = Number(searchParams.get('tabIndex'));
    if (
      searchParams.has('tabIndex') &&
      Number.isInteger(requestedIndex) &&
      requestedIndex >= 0 &&
      requestedIndex < availableTabs.length
    ) {
      setTab(availableTabs[requestedIndex]);
    }
  }, [history.location.search, canViewSupplierPayment, canViewProof]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draft, setDraft] = useState<PurchaseOrderDraft>(createDraft());
  const [operationMenuAnchorEl, setOperationMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [isStartRunConfirmOpen, setIsStartRunConfirmOpen] = useState(false);
  const [isProductionPaymentSummaryOpen, setIsProductionPaymentSummaryOpen] = useState(false);
  const [selectedProductionScheduleId, setSelectedProductionScheduleId] = useState<number | ''>('');
  const [openPaymentDraftRequest, setOpenPaymentDraftRequest] = useState(0);
  const [paymentDraftScheduleId, setPaymentDraftScheduleId] = useState<number | ''>('');
  const [productionPaymentWarning, setProductionPaymentWarning] = useState('');
  const [isExpectedEndDateDialogOpen, setIsExpectedEndDateDialogOpen] = useState(false);
  const [newExpectedEndDate, setNewExpectedEndDate] = useState('');
  const [isLateStart, setIsLateStart] = useState(false);
  const [lateStartReason, setLateStartReason] = useState('');
  const [startRunOverrideReason, setStartRunOverrideReason] = useState('');
  const [isCheckingLateStart, setIsCheckingLateStart] = useState(false);
  const [milestoneDialog, setMilestoneDialog] = useState<{
    event: PurchaseOrderTimelineEvent;
    mode: 'complete' | 'skip';
  } | null>(null);
  const [milestonePlannedDate, setMilestonePlannedDate] = useState('');
  const [milestoneNote, setMilestoneNote] = useState('');
  const [productionDeliveryDraft, setProductionDeliveryDraft] = useState<ProductionDeliveryDraft>(
    () => createProductionDeliveryDraft()
  );
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const useStyles = makeStyles({
    tableHeader: {
      border: `2px solid ${BRAND_COLORS.sand}`,
      fontWeight: 'bold',
      paddingLeft: '10px',
      textAlign: 'center'
    },
    section: {
      backgroundColor: BRAND_COLORS.ivory,
      border: `1px solid ${BRAND_COLORS.sand}`,
      borderRadius: 12,
      padding: 16,
      boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
    },
    specCell: {
      width: 320,
      maxWidth: 320,
      whiteSpace: 'normal',
      wordBreak: 'break-word'
    },
    productCell: {
      width: '1%',
      whiteSpace: 'nowrap',
      verticalAlign: 'top',
      '& .MuiTextField-root': {
        minWidth: 200
      }
    },
    numericCell: {
      width: '1%',
      whiteSpace: 'nowrap',
      verticalAlign: 'top',
      '& .MuiTextField-root': {
        minWidth: 120
      }
    },
    imageCell: {
      width: '1%',
      whiteSpace: 'nowrap',
      verticalAlign: 'top'
    },
    imageThumb: {
      width: 64,
      height: 64,
      borderRadius: 8,
      objectFit: 'cover',
      border: `1px solid ${BRAND_COLORS.sand}`,
      backgroundColor: BRAND_UI.sandTint,
      display: 'block',
      cursor: 'pointer'
    },
    itemTextField: {
      '& .MuiInputBase-input': {
        fontSize: 13,
        padding: '8px 10px'
      }
    }
  });
  const classes = useStyles();

  const {
    data: purchaseOrder,
    isFetching,
    refetch
  } = useQuery(['purchase-order-detail', id], () => getPurchaseOrder(id), {
    enabled: Boolean(id),
    refetchOnWindowFocus: false
  });

  const {
    data: activityHistory = [],
    isFetching: isActivityHistoryFetching,
    refetch: refetchHistory
  } = useQuery(
    ['purchase-order-activity-history', id],
    () => getActivityHistory('PURCHASE_ORDER', id),
    {
      enabled: Boolean(id),
      refetchOnWindowFocus: false
    }
  );

  const { data: purchaseOrderPayments = [], isFetching: isStartRunPaymentsFetching } = useQuery(
    ['purchase-order-payments', id],
    () => getPurchaseOrderPayments(id),
    {
      enabled: Boolean(id),
      refetchOnWindowFocus: true
    }
  );

  const {
    data: purchaseOrderPaymentSchedules = [],
    isFetching: isStartRunPaymentSchedulesFetching,
    isError: isPaymentSchedulesError,
    refetch: refetchPaymentSchedules
  } = useQuery(
    ['purchase-order-payment-schedules', id],
    () => getPurchaseOrderPaymentSchedules(id),
    {
      enabled: Boolean(id),
      refetchOnWindowFocus: true
    }
  );

  const {
    data: purchaseOrderPaymentInstructions = [],
    isFetching: isPaymentInstructionsFetching,
    isError: isPaymentInstructionsError,
    refetch: refetchPaymentInstructions
  } = useQuery<PurchaseOrderPaymentInstruction[]>(
    ['purchase-order-payment-instructions', id],
    () => getPurchaseOrderPaymentInstructions(id),
    {
      enabled: Boolean(id) && canViewSupplierPayment,
      refetchOnWindowFocus: true
    }
  );

  const {
    data: productionTimeline,
    isFetching: isProductionTimelineFetching,
    refetch: refetchProductionTimeline
  } = useQuery(
    ['purchase-order-production-timeline', id],
    () => getPurchaseOrderProductionTimeline(id),
    { enabled: Boolean(id), refetchOnWindowFocus: false }
  );

  useEffect(() => {
    setDraft(createDraft(purchaseOrder));
    setIsEditing(false);
  }, [purchaseOrder]);

  const displayItems = isEditing ? draft.items : purchaseOrder?.items || [];
  const isActionMenuOpen = Boolean(actionMenuAnchorEl);
  const isOperationMenuOpen = Boolean(operationMenuAnchorEl);
  const canEditPurchaseOrder =
    Boolean(purchaseOrder) &&
    purchaseOrder?.status !== 'CANCELLED' &&
    purchaseOrder?.status !== 'CLOSED';
  const canManagePurchaseOrder =
    purchaseOrder?.status === 'CREATED' ||
    purchaseOrder?.status === 'AWAITING_PAYMENT' ||
    purchaseOrder?.status === 'PAID' ||
    purchaseOrder?.status === 'PRODUCTION_RUNNING';
  const canClosePurchaseOrder =
    Boolean(purchaseOrder) &&
    purchaseOrder?.status !== 'CANCELLED' &&
    purchaseOrder?.status !== 'CLOSED';
  const canStartPurchaseOrderRun =
    canManageTimeline &&
    ['CREATED', 'AWAITING_PAYMENT', 'PAID'].includes(purchaseOrder?.status || '');
  const startRunWarnings = getPurchaseOrderStartRunWarnings(
    purchaseOrder?.status,
    purchaseOrderPayments,
    purchaseOrderPaymentSchedules
  );
  const canUpdateExpectedEndDate =
    canManageTimeline &&
    purchaseOrder?.status === 'PRODUCTION_RUNNING' &&
    !purchaseOrder.productionCompletedDate;
  const productionStartedMilestone = productionTimeline?.events.find(
    (event) => event.type === 'PRODUCTION_STARTED'
  );
  const canStartProduction =
    canManageTimeline &&
    purchaseOrder?.status === 'PRODUCTION_RUNNING' &&
    !purchaseOrder.productionStartedDate &&
    !purchaseOrder.productionCompletedDate &&
    Boolean(productionStartedMilestone?.canComplete);
  const productionCompletedMilestone = productionTimeline?.events.find(
    (event) => event.type === 'PRODUCTION_COMPLETED'
  );
  const canCompleteProduction =
    canManageTimeline &&
    purchaseOrder?.status === 'PRODUCTION_RUNNING' &&
    Boolean(purchaseOrder.productionStartedDate) &&
    !purchaseOrder.productionCompletedDate &&
    Boolean(productionCompletedMilestone?.canComplete);
  const missingStartRunDocuments = [
    ...(purchaseOrder?.attachments?.some(
      (attachment) => resolveAttachmentDocumentType(attachment.documentType) === 'FACTORY_CONTRACT'
    )
      ? []
      : ['สัญญาจากโรงงาน']),
    ...(purchaseOrder?.attachments?.some(
      (attachment) => resolveAttachmentDocumentType(attachment.documentType) === 'FINAL_ARTWORK'
    )
      ? []
      : ['Final Artwork'])
  ];
  const nextProofMilestone = productionTimeline?.events.find(
    (event) =>
      ['DIGITAL_PROOF', 'ON_PRESS_COLOR_CHECK'].includes(event.type) &&
      !['COMPLETED', 'SKIPPED'].includes(event.status)
  );
  const nextCompletableMilestone = productionTimeline?.events.find((event) => event.canComplete);
  const unpaidPaymentSchedules = purchaseOrderPaymentSchedules.filter(
    (schedule) =>
      Number(schedule.outstandingAmount || 0) - Number(schedule.pendingAmount || 0) > 0
  );
  const selectedProductionSchedule = unpaidPaymentSchedules.find(
    (schedule) => schedule.id === selectedProductionScheduleId
  );
  const selectedProductionInstruction = selectedProductionSchedule
    ? purchaseOrderPaymentInstructions
      .filter(
        (instruction) =>
          instruction.scheduleId === selectedProductionSchedule.id &&
          instruction.status !== 'CANCELLED'
      )
      .sort((left, right) =>
        (right.createdDate || '').localeCompare(left.createdDate || '')
      )[0]
    : undefined;

  const openMilestoneDialog = (event: PurchaseOrderTimelineEvent, mode: 'complete' | 'skip') => {
    setMilestoneDialog({ event, mode });
    setMilestonePlannedDate(
      event.type === 'PRODUCTION_STARTED' ? productionTimeline?.productionExpectedEndDate || '' : ''
    );
    setMilestoneNote('');
    if (event.type === 'PRODUCTION_COMPLETED') {
      setProductionDeliveryDraft(createProductionDeliveryDraft(purchaseOrder));
    }
  };

  const handleOpenProductionCompletion = () => {
    if (!productionCompletedMilestone) return;
    if (isStartRunPaymentSchedulesFetching || (canViewSupplierPayment && isPaymentInstructionsFetching)) {
      toast.error('กำลังตรวจสอบแผนการชำระเงิน กรุณาลองอีกครั้ง');
      return;
    }
    if (isPaymentSchedulesError || (canViewSupplierPayment && isPaymentInstructionsError)) {
      toast.error('ไม่สามารถตรวจสอบรายการตั้งจ่ายได้ กรุณาลองอีกครั้ง');
      return;
    }

    const remainingSchedule = unpaidPaymentSchedules[0];
    if (!remainingSchedule) {
      setProductionPaymentWarning('');
      openMilestoneDialog(productionCompletedMilestone, 'complete');
      return;
    }

    const existingInstruction = purchaseOrderPaymentInstructions
      .filter((instruction) =>
        instruction.scheduleId === remainingSchedule.id && instruction.status !== 'CANCELLED'
      )
      .sort((left, right) => (right.createdDate || '').localeCompare(left.createdDate || ''))[0];

    if (!existingInstruction) {
      setPaymentDraftScheduleId(remainingSchedule.id);
      setTab('payment');
      setOpenPaymentDraftRequest((request) => request + 1);
      return;
    }

    setProductionPaymentWarning(
      existingInstruction.status === 'PAID'
        ? ''
        : `มีรายการตั้งจ่ายของงวดที่ ${remainingSchedule.installmentNo} แล้ว แต่ยังไม่ได้ชำระ กรุณาตรวจสอบก่อนบันทึกผลิตเสร็จ`
    );
    openMilestoneDialog(productionCompletedMilestone, 'complete');
  };

  const updateProductionDeliveryHeader = (
    field: keyof Omit<ProductionDeliveryDraft, 'details'>,
    value: string
  ) => {
    setProductionDeliveryDraft((current) => ({ ...current, [field]: value }));
  };

  const updateProductionDeliveryDetail = (
    index: number,
    field:
      | 'quantity'
      | 'cartonCount'
      | 'piecesPerCarton'
      | 'netWeightKg'
      | 'grossWeightKg'
      | 'lengthCm'
      | 'widthCm'
      | 'heightCm'
      | 'cbmM3',
    value: string
  ) => {
    setProductionDeliveryDraft((current) => ({
      ...current,
      details: current.details.map((detail, detailIndex) =>
        detailIndex === index ? { ...detail, [field]: value } : detail
      )
    }));
  };

  const addProductionDeliveryOption = (index: number) => {
    setProductionDeliveryDraft((current) => {
      const source = current.details[index];
      if (!source) return current;
      const matchingOptions = current.details.filter(
        (detail) =>
          detail.purchaseOrderDetailId === source.purchaseOrderDetailId &&
          detail.purchaseOrderDetailComponentId === source.purchaseOrderDetailComponentId
      );
      const optionNo = Math.max(...matchingOptions.map((detail) => detail.optionNo)) + 1;
      const option = { ...source, optionNo, quantity: '' };
      return {
        ...current,
        details: [
          ...current.details.slice(0, index + 1),
          option,
          ...current.details.slice(index + 1)
        ]
      };
    });
  };

  const calculateProductionDeliveryCbm = (index: number) => {
    const detail = productionDeliveryDraft.details[index];
    const cartonCount = Number(detail?.cartonCount);
    const lengthCm = Number(detail?.lengthCm);
    const widthCm = Number(detail?.widthCm);
    const heightCm = Number(detail?.heightCm);
    if (
      !detail ||
      !Number.isFinite(cartonCount) ||
      cartonCount <= 0 ||
      !Number.isFinite(lengthCm) ||
      lengthCm <= 0 ||
      !Number.isFinite(widthCm) ||
      widthCm <= 0 ||
      !Number.isFinite(heightCm) ||
      heightCm <= 0
    ) {
      toast.error('กรุณากรอกจำนวนกล่องและขนาดยาว กว้าง สูง ให้ครบก่อนคำนวณ CBM');
      return;
    }
    const cbm = (cartonCount * lengthCm * widthCm * heightCm) / 1_000_000;
    updateProductionDeliveryDetail(index, 'cbmM3', cbm.toFixed(6));
  };

  const summary = useMemo(() => {
    const exchangeRate = Number(purchaseOrder?.exchangeRate || 0);
    const subTotal = displayItems.reduce(
      (sum, item) => sum + Number(item.amountSupplierCurrency || 0),
      0
    );
    const subTotalThb = displayItems.reduce((sum, item) => sum + Number(item.amountThb || 0), 0);

    return {
      subTotal,
      subTotalThb,
      grandTotal: subTotal,
      grandTotalThb: subTotalThb,
      exchangeRate
    };
  }, [displayItems, purchaseOrder?.exchangeRate]);

  const updateDraftField = <K extends keyof PurchaseOrderDraft>(
    field: K,
    value: PurchaseOrderDraft[K]
  ) => {
    setDraft((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const updateDraftItem = (
    index: number,
    field: 'quantity' | 'supplierUnitPrice' | 'supplierShippingCost',
    value: number
  ) => {
    setDraft((previous) => ({
      ...previous,
      items: previous.items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        const quantity = Number(field === 'quantity' ? value : item.quantity || 0);
        const supplierUnitPrice = Number(
          field === 'supplierUnitPrice' ? value : item.supplierUnitPrice || 0
        );
        const supplierShippingCost = Number(
          field === 'supplierShippingCost' ? value : item.supplierShippingCost || 0
        );
        const exchangeRate = Number(
          item.exchangeRate || previous.items[itemIndex].exchangeRate || 0
        );
        const supplierTotalUnitCost = supplierUnitPrice + supplierShippingCost;
        const amountSupplierCurrency = supplierTotalUnitCost * quantity;
        const amountThb = amountSupplierCurrency * exchangeRate;

        return {
          ...item,
          quantity,
          supplierUnitPrice,
          supplierShippingCost,
          supplierTotalUnitCost,
          amountSupplierCurrency,
          amountThb
        };
      })
    }));
  };

  const updateDraftItemText = (index: number, field: 'name' | 'spec', value: string) => {
    setDraft((previous) => ({
      ...previous,
      items: previous.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addDraftItem = () => {
    setDraft((previous) => ({
      ...previous,
      items: [
        ...previous.items,
        {
          id: -Date.now(),
          salesOrderDetailId: null,
          lineNo: previous.items.length + 1,
          name: '',
          type: null,
          capacity: null,
          size: null,
          spec: null,
          quantity: 1,
          supplierCurrency: purchaseOrder?.currency || null,
          supplierUnitPrice: 0,
          exchangeRate: purchaseOrder?.exchangeRate || 0,
          supplierShippingCost: 0,
          supplierTotalUnitCost: 0,
          amountSupplierCurrency: 0,
          amountThb: 0,
          imageUrl: null,
          rfqDetailId: null,
          rfqTierId: null,
          rfqTierSplitId: null,
          quotationDetailId: null,
          shippingMethod: purchaseOrder?.shippingMethodSnapshot || null,
          supplierQuoteTierId: null,
          packages: [],
          components: []
        }
      ]
    }));
  };

  const removeDraftItem = (index: number) => {
    setDraft((previous) => ({
      ...previous,
      items: previous.items.filter((_item, itemIndex) => itemIndex !== index)
    }));
  };

  const updateDraftComponent = (
    itemIndex: number,
    componentIndex: number,
    field: keyof PurchaseOrderDetailComponent,
    value: string | number
  ) => {
    setDraft((previous) => ({
      ...previous,
      items: previous.items.map((item, index) => {
        if (index !== itemIndex) return item;
        const components = [...(item.components || [])];
        components[componentIndex] = { ...components[componentIndex], [field]: value };
        return { ...item, components };
      })
    }));
  };

  const addDraftComponent = (itemIndex: number) => {
    setDraft((previous) => ({
      ...previous,
      items: previous.items.map((item, index) =>
        index === itemIndex
          ? {
            ...item,
            components: [
              ...(item.components || []),
              {
                componentName: '',
                quantityPerItem: 1,
                unit: 'pcs',
                sortOrder: item.components?.length || 0
              }
            ]
          }
          : item
      )
    }));
  };

  const removeDraftComponent = (itemIndex: number, componentIndex: number) => {
    setDraft((previous) => ({
      ...previous,
      items: previous.items.map((item, index) =>
        index === itemIndex
          ? { ...item, components: (item.components || []).filter((_, i) => i !== componentIndex) }
          : item
      )
    }));
  };

  const handleOpenActionMenu = (event: ReactMouseEvent<HTMLElement>) => {
    setActionMenuAnchorEl(event.currentTarget);
  };

  const handleCloseActionMenu = () => {
    setActionMenuAnchorEl(null);
  };

  const handleOpenOperationMenu = (event: ReactMouseEvent<HTMLElement>) => {
    setOperationMenuAnchorEl(event.currentTarget);
  };

  const handleCloseOperationMenu = () => {
    setOperationMenuAnchorEl(null);
  };

  const handleSelectEdit = () => {
    handleCloseActionMenu();
    setDraft(createDraft(purchaseOrder));
    setIsEditing(true);
  };

  const handleViewPurchaseOrder = async () => {
    if (!purchaseOrder?.purchaseOrderNo) {
      return;
    }
    handleCloseActionMenu();
    if (!isDownSm) {
      openDocumentPreview('purchase-order', purchaseOrder.purchaseOrderNo);
      return;
    }
    const response = await toast.promise(
      viewPurchaseOrder(purchaseOrder.purchaseOrderNo, true, false),
      {
        loading: t('toast.loading'),
        success: t('toast.success'),
        error: t('toast.failed')
      }
    );

    const files = response?.data?.files || [];
    files.forEach((file: { fileName: string; base64: string; contentType?: string }) => {
      const blob = base64ToBlob(file.base64, file.contentType || 'application/pdf');
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${purchaseOrder.purchaseOrderNo}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    });
  };

  const handleCancelEdit = () => {
    handleCloseActionMenu();
    setDraft(createDraft(purchaseOrder));
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!purchaseOrder?.purchaseOrderNo) {
      return;
    }

    const invalidNewItem = draft.items.find(
      (item) => item.id < 0 && (!item.name.trim() || Number(item.quantity) <= 0)
    );
    if (invalidNewItem) {
      toast.error('กรุณาระบุชื่อสินค้าและจำนวนของรายการสินค้าใหม่ให้ครบถ้วน');
      return;
    }

    const payload: UpdatePurchaseOrderRequest = {
      docDate: draft.docDate || null,
      productionLeadTimeDay: draft.productionLeadTimeDay
        ? Number(draft.productionLeadTimeDay)
        : null,
      shippingLeadTimeDay: draft.shippingLeadTimeDay ? Number(draft.shippingLeadTimeDay) : null,
      remark: draft.remark || null,
      items: draft.items.map((item) => ({
        id: item.id > 0 ? item.id : null,
        salesOrderDetailId: item.salesOrderDetailId ?? null,
        name: item.name || null,
        type: item.type || null,
        capacity: item.capacity || null,
        size: item.size || null,
        spec: item.spec || null,
        quantity: Number(item.quantity || 0),
        supplierCurrency: item.supplierCurrency || null,
        supplierUnitPrice: Number(item.supplierUnitPrice || 0),
        exchangeRate: Number(item.exchangeRate || 0),
        supplierShippingCost: Number(item.supplierShippingCost || 0),
        supplierTotalUnitCost: Number(item.supplierTotalUnitCost || 0),
        imageUrl: item.imageUrl || null,
        rfqDetailId: item.rfqDetailId ?? null,
        rfqTierId: item.rfqTierId ?? null,
        quotationDetailId: item.quotationDetailId ?? null,
        shippingMethod: item.shippingMethod || null,
        supplierQuoteTierId: item.supplierQuoteTierId ?? null,
        components: item.components?.map((component, componentIndex) => ({
          sourceQuoteDetailPackageId: component.sourceQuoteDetailPackageId ?? null,
          componentCode: component.componentCode || null,
          componentName: component.componentName || null,
          specification: component.specification || null,
          quantityPerItem: Number(component.quantityPerItem || 0),
          unit: component.unit || 'pcs',
          remark: component.remark || null,
          sortOrder: component.sortOrder ?? componentIndex
        }))
      }))
    };

    setIsSubmitting(true);
    try {
      await toast.promise(updatePurchaseOrder(purchaseOrder.purchaseOrderNo, payload), {
        loading: t('toast.loading'),
        success: t('toast.success'),
        error: t('toast.failed')
      });
      setIsEditing(false);
      await Promise.all([refetch(), refetchHistory(), refetchProductionTimeline()]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMilestoneAction = async () => {
    if (!purchaseOrder?.purchaseOrderNo || !milestoneDialog || isSubmitting) return;
    if (milestoneDialog.mode === 'skip' && !milestoneNote.trim()) {
      toast.error('กรุณาระบุเหตุผลที่ข้ามขั้นตอน');
      return;
    }
    setIsSubmitting(true);
    try {
      let successMessage =
        milestoneDialog.mode === 'skip'
          ? `ข้ามขั้นตอน ${milestoneDialog.event.label} แล้ว`
          : `บันทึก ${milestoneDialog.event.label} แล้ว`;
      const milestoneCode = milestoneDialog.event.type as PurchaseOrderMilestoneCode;
      if (milestoneDialog.mode === 'skip') {
        await skipPurchaseOrderMilestone(
          purchaseOrder.purchaseOrderNo,
          milestoneCode,
          milestoneNote.trim()
        );
      } else if (milestoneCode === 'PRODUCTION_COMPLETED') {
        if (
          !productionDeliveryDraft.shippedDate ||
          !productionDeliveryDraft.expectedWarehouseDate ||
          !productionDeliveryDraft.shippingMethod ||
          !productionDeliveryDraft.shippingLocationId ||
          productionDeliveryDraft.details.length === 0 ||
          productionDeliveryDraft.details.some(
            (detail) => !detail.quantity.trim() || Number(detail.quantity) <= 0
          )
        ) {
          toast.error(
            'กรุณาระบุวันที่ส่งออก วันที่คาดว่าจะถึงคลัง วิธีขนส่ง สถานที่ขนส่ง และจำนวนสินค้าให้ครบถ้วน'
          );
          setIsSubmitting(false);
          return;
        }
        if (productionDeliveryDraft.expectedWarehouseDate < productionDeliveryDraft.shippedDate) {
          toast.error('วันที่คาดว่าจะถึงคลังต้องไม่ก่อนวันที่ส่งออก');
          setIsSubmitting(false);
          return;
        }
        const deliveryRequest: CompletePurchaseOrderProductionRequest['delivery'] = {
          shippedDate: productionDeliveryDraft.shippedDate,
          expectedWarehouseDate: productionDeliveryDraft.expectedWarehouseDate,
          receivedDate: productionDeliveryDraft.receivedDate || null,
          shippingMethod: productionDeliveryDraft.shippingMethod,
          shippingLocationId: Number(productionDeliveryDraft.shippingLocationId),
          details: productionDeliveryDraft.details.map((detail, sortOrder) => {
            const cartonCount = optionalNumber(detail.cartonCount);
            const lengthCm = optionalNumber(detail.lengthCm);
            const widthCm = optionalNumber(detail.widthCm);
            const heightCm = optionalNumber(detail.heightCm);
            const calculatedCbm =
              cartonCount && lengthCm && widthCm && heightCm
                ? (cartonCount * lengthCm * widthCm * heightCm) / 1000000
                : null;
            return {
              purchaseOrderDetailId: detail.purchaseOrderDetailId,
              purchaseOrderDetailComponentId: detail.purchaseOrderDetailComponentId,
              quantity: Number(detail.quantity),
              cartonCount,
              piecesPerCarton: optionalNumber(detail.piecesPerCarton),
              netWeightKg: optionalNumber(detail.netWeightKg),
              grossWeightKg: optionalNumber(detail.grossWeightKg),
              lengthCm,
              widthCm,
              heightCm,
              cbmM3: optionalNumber(detail.cbmM3) ?? calculatedCbm,
              sortOrder
            };
          })
        };
        const updatedPurchaseOrder = await completePurchaseOrderProduction(
          purchaseOrder.purchaseOrderNo,
          {
            note: milestoneNote.trim() || null,
            delivery: deliveryRequest
          }
        );
        if (!updatedPurchaseOrder.productionCompletedDate) {
          successMessage = 'บันทึกเที่ยวส่งแล้ว แต่ยังมียอดคงเหลือ จึงคงสถานะกำลังผลิต';
        }
      } else {
        await completePurchaseOrderMilestone(purchaseOrder.purchaseOrderNo, milestoneCode, {
          plannedDate:
            milestoneDialog.event.type === 'PRODUCTION_STARTED' && milestonePlannedDate
              ? milestonePlannedDate
              : null,
          note: milestoneNote.trim() || null
        });
      }
      toast.success(successMessage);
      setMilestoneDialog(null);
      await Promise.all([refetch(), refetchHistory(), refetchProductionTimeline()]);
    } catch (error) {
      toast.error(milestoneErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseExpectedEndDateDialog = () => {
    setIsExpectedEndDateDialogOpen(false);
    setNewExpectedEndDate('');
  };

  const handleUpdateExpectedEndDate = async () => {
    if (!purchaseOrder?.purchaseOrderNo || !newExpectedEndDate) {
      toast.error('กรุณาระบุวันที่ผลิตเสร็จใหม่');
      return;
    }
    if (
      purchaseOrder.productionStartedDate &&
      newExpectedEndDate < purchaseOrder.productionStartedDate
    ) {
      toast.error('วันที่ผลิตเสร็จต้องไม่ก่อนวันที่เริ่มผลิต');
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePurchaseOrderProductionExpectedEndDate(
        purchaseOrder.purchaseOrderNo,
        newExpectedEndDate
      );
      toast.success('บันทึกกำหนดวันผลิตเสร็จแล้ว');
      handleCloseExpectedEndDateDialog();
      await Promise.all([refetch(), refetchHistory(), refetchProductionTimeline()]);
    } catch (error) {
      toast.error(milestoneErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartPurchaseOrderRun = async () => {
    if (!purchaseOrder?.purchaseOrderNo) return;
    if (startRunWarnings.length && !startRunOverrideReason.trim()) {
      toast.error('กรุณาระบุเหตุผลในการเริ่มรันงานแบบ Override');
      return;
    }
    if (isLateStart && !lateStartReason.trim()) {
      toast.error('กรุณาระบุเหตุผลที่รันงานล่าช้า');
      return;
    }
    handleCloseActionMenu();
    setIsStartRunConfirmOpen(false);
    setIsSubmitting(true);
    try {
      await toast.promise(
        startPurchaseOrderRun(
          purchaseOrder.purchaseOrderNo,
          isLateStart ? lateStartReason.trim() : null,
          startRunWarnings.length ? startRunOverrideReason.trim() : null
        ),
        {
          loading: 'กำลังเริ่มรันงาน',
          success: 'เริ่มรันงานสำเร็จ',
          error: 'ไม่สามารถเริ่มรันงานได้ กรุณาลองใหม่'
        }
      );
      await Promise.all([refetch(), refetchHistory(), refetchProductionTimeline()]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestStartPurchaseOrderRun = async () => {
    if (!canStartPurchaseOrderRun) return;
    if (!purchaseOrder?.purchaseOrderNo) return;
    setIsCheckingLateStart(true);
    try {
      const late = await checkPurchaseOrderLateStart(purchaseOrder.purchaseOrderNo);
      setIsLateStart(late);
      setLateStartReason('');
      setStartRunOverrideReason('');
      setIsStartRunConfirmOpen(true);
    } catch (_error) {
      toast.error('ไม่สามารถตรวจสอบกำหนดเริ่มรันงานได้');
    } finally {
      setIsCheckingLateStart(false);
    }
  };

  const handleConfirmCancelPurchaseOrder = async () => {
    if (!purchaseOrder?.purchaseOrderNo) {
      return;
    }

    setIsSubmitting(true);
    try {
      await toast.promise(cancelPurchaseOrder(purchaseOrder.purchaseOrderNo), {
        loading: t('toast.loading'),
        success: t('toast.success'),
        error: t('toast.failed')
      });
      setIsCancelDialogOpen(false);
      await Promise.all([refetch(), refetchHistory()]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmClosePurchaseOrder = async () => {
    if (!purchaseOrder?.purchaseOrderNo) {
      return;
    }

    setIsSubmitting(true);
    try {
      await toast.promise(closePurchaseOrder(purchaseOrder.purchaseOrderNo), {
        loading: t('toast.loading'),
        success: t('toast.success'),
        error: t('toast.failed')
      });
      setIsCloseDialogOpen(false);
      await Promise.all([refetch(), refetchHistory()]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadAttachments = async (
    event: ChangeEvent<HTMLInputElement>,
    documentType: PurchaseOrderAttachmentDocumentType
  ) => {
    if (!purchaseOrder?.purchaseOrderNo || !event.target.files?.length) {
      return;
    }

    const files = Array.from(event.target.files);
    setIsSubmitting(true);
    try {
      await toast.promise(
        uploadPurchaseOrderAttachments(purchaseOrder.purchaseOrderNo, files, documentType),
        {
          loading: t('toast.loading'),
          success: t('toast.success'),
          error: t('toast.failed')
        }
      );
      await Promise.all([refetch(), refetchHistory()]);
    } finally {
      event.target.value = '';
      setIsSubmitting(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!purchaseOrder?.purchaseOrderNo) {
      return;
    }

    setIsSubmitting(true);
    try {
      await toast.promise(
        deletePurchaseOrderAttachment(purchaseOrder.purchaseOrderNo, attachmentId),
        {
          loading: t('toast.loading'),
          success: t('toast.success'),
          error: t('toast.failed')
        }
      );
      await Promise.all([refetch(), refetchHistory()]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page>
      <LoadingDialog open={isFetching || isActivityHistoryFetching || isSubmitting} />
      <Dialog
        open={Boolean(previewImageUrl)}
        onClose={() => setPreviewImageUrl(null)}
        maxWidth="lg"
        fullWidth>
        <DialogTitle>รูปสินค้า</DialogTitle>
        <DialogContent>
          {previewImageUrl ? (
            <Box
              component="img"
              src={previewImageUrl}
              alt="product preview"
              sx={{
                display: 'block',
                width: '100%',
                maxHeight: '80vh',
                objectFit: 'contain'
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      <PageTitle
        title={
          purchaseOrder?.purchaseOrderNo
            ? `ใบสั่งซื้อเลขที่ ${purchaseOrder.purchaseOrderNo}`
            : 'ใบสั่งซื้อ'
        }>
        {purchaseOrder?.status ? (
          <Chip
            label={getDocumentStatusLabel(purchaseOrder.status, purchaseOrder.statusProfile)}
            size="small"
            sx={getDocumentStatusChipSx(purchaseOrder.status, purchaseOrder.statusProfile)}
          />
        ) : null}
      </PageTitle>
      <Wrapper>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{
            justifyContent: { sm: 'flex-end' },
            alignItems: { xs: 'stretch', sm: 'center' },
            mb: 2
          }}>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-indigo-blue"
            startIcon={<Settings />}
            endIcon={<ArrowDropDown />}
            onClick={handleOpenOperationMenu}
            disabled={!purchaseOrder}
            aria-controls={isOperationMenuOpen ? 'purchase-order-operation-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={isOperationMenuOpen ? 'true' : undefined}>
            ดำเนินการ
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-indigo-blue"
            startIcon={<MenuIcon />}
            endIcon={<ArrowDropDown />}
            onClick={handleOpenActionMenu}
            disabled={!purchaseOrder}
            aria-controls={isActionMenuOpen ? 'purchase-order-action-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={isActionMenuOpen ? 'true' : undefined}>
            ตัวเลือก
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-cool-grey"
            startIcon={<ArrowBackIos />}
            onClick={() => history.push(ROUTE_PATHS.PURCHASE_ORDER_MANAGEMENT)}>
            กลับ
          </Button>
        </Stack>

        <Menu
          id="purchase-order-operation-menu"
          anchorEl={operationMenuAnchorEl}
          open={isOperationMenuOpen}
          onClose={handleCloseOperationMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          PaperProps={{
            sx: {
              minWidth: operationMenuAnchorEl?.offsetWidth || undefined
            }
          }}
          keepMounted>
          <MenuItem
            onClick={() => {
              handleCloseOperationMenu();
              void handleRequestStartPurchaseOrderRun();
            }}
            disabled={!canStartPurchaseOrderRun || isSubmitting || isCheckingLateStart}
            sx={{ width: '100%' }}>
            <ListItemIcon>
              <PlayArrow fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="เริ่มรันงาน" />
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (!canStartProduction || !productionStartedMilestone) return;
              handleCloseOperationMenu();
              openMilestoneDialog(productionStartedMilestone, 'complete');
            }}
            disabled={!canStartProduction || isSubmitting || isProductionTimelineFetching}
            sx={{ width: '100%' }}>
            <ListItemIcon>
              <PrecisionManufacturing fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="เริ่มผลิต"
              secondary={
                purchaseOrder?.status === 'PRODUCTION_RUNNING' &&
                  !purchaseOrder.productionStartedDate &&
                  !productionStartedMilestone?.canComplete
                  ? 'ต้องอนุมัติหรือข้ามพรูฟทั้งสองขั้นตอนก่อน'
                  : undefined
              }
            />
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleCloseOperationMenu();
              handleOpenProductionCompletion();
            }}
            disabled={!canCompleteProduction || isSubmitting || isProductionTimelineFetching}
            sx={{ width: '100%' }}>
            <ListItemIcon>
              <PrecisionManufacturing fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="ผลิตเสร็จ"
              secondary={
                purchaseOrder?.status === 'PRODUCTION_RUNNING' &&
                  !purchaseOrder.productionStartedDate &&
                  !purchaseOrder.productionCompletedDate &&
                  !productionCompletedMilestone?.canComplete
                  ? 'ต้องบันทึกเริ่มผลิตก่อน'
                  : undefined
              }
            />
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleCloseOperationMenu();
              setNewExpectedEndDate('');
              setIsExpectedEndDateDialogOpen(true);
            }}
            disabled={!canUpdateExpectedEndDate || isSubmitting}
            sx={{ width: '100%' }}>
            <ListItemIcon>
              <CalendarMonth fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="กำหนดวันผลิตเสร็จ" />
          </MenuItem>
        </Menu>

        <Menu
          id="purchase-order-action-menu"
          anchorEl={actionMenuAnchorEl}
          open={isActionMenuOpen}
          onClose={handleCloseActionMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          PaperProps={{
            sx: {
              minWidth: actionMenuAnchorEl?.offsetWidth || undefined
            }
          }}
          keepMounted>
          {isEditing ? (
            <>
              <MenuItem
                onClick={() => {
                  handleCloseActionMenu();
                  void handleSave();
                }}
                disabled={isSubmitting}
                sx={{ width: '100%' }}>
                <ListItemIcon>
                  <Save fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('button.save')} />
              </MenuItem>
              <MenuItem onClick={handleCancelEdit} disabled={isSubmitting} sx={{ width: '100%' }}>
                <ListItemIcon>
                  <Cancel fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('button.cancel')} />
              </MenuItem>
            </>
          ) : (
            <>
              <MenuItem onClick={handleViewPurchaseOrder} sx={{ width: '100%' }}>
                <ListItemIcon>
                  <Description fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="ดูใบสั่งซื้อ" />
              </MenuItem>
              <MenuItem
                onClick={handleSelectEdit}
                disabled={!canEditPurchaseOrder}
                sx={{ width: '100%' }}>
                <ListItemIcon>
                  <Edit fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="แก้ไขใบสั่งซื้อ" />
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleCloseActionMenu();
                  setIsCancelDialogOpen(true);
                }}
                disabled={!canManagePurchaseOrder}
                sx={{ width: '100%' }}>
                <ListItemIcon>
                  <CancelPresentation fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="ยกเลิกใบสั่งซื้อ" />
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleCloseActionMenu();
                  setIsCloseDialogOpen(true);
                }}
                disabled={!canClosePurchaseOrder}
                sx={{ width: '100%' }}>
                <ListItemIcon>
                  <TaskAlt fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="ปิดใบสั่งซื้อ" />
              </MenuItem>
            </>
          )}
        </Menu>

        <Dialog
          open={isExpectedEndDateDialogOpen}
          onClose={handleCloseExpectedEndDateDialog}
          fullWidth
          maxWidth="xs">
          <DialogTitle>กำหนดวันผลิตเสร็จ</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                type="date"
                label="วันที่กำหนดผลิตเสร็จปัจจุบัน"
                value={purchaseOrder?.productionExpectedEndDate || ''}
                InputLabelProps={{ shrink: true }}
                disabled
                fullWidth
              />
              <TextField
                type="date"
                label="วันที่ผลิตเสร็จใหม่"
                value={newExpectedEndDate}
                onChange={(event) => setNewExpectedEndDate(event.target.value)}
                inputProps={{ min: purchaseOrder?.productionStartedDate || undefined }}
                InputLabelProps={{ shrink: true }}
                required
                autoFocus
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseExpectedEndDateDialog} disabled={isSubmitting}>
              ยกเลิก
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleUpdateExpectedEndDate()}
              disabled={
                isSubmitting ||
                !newExpectedEndDate ||
                newExpectedEndDate === purchaseOrder?.productionExpectedEndDate
              }>
              บันทึก
            </Button>
          </DialogActions>
        </Dialog>

        <ConfirmDialog
          open={isCancelDialogOpen}
          title="ยืนยันการยกเลิกใบสั่งซื้อ"
          message="เมื่อยกเลิกใบสั่งซื้อแล้ว ระบบจะเปิดให้สร้าง Purchase Order ใหม่ได้อีกครั้ง ต้องการดำเนินการต่อหรือไม่"
          confirmText="ยืนยัน"
          cancelText="ยกเลิก"
          isShowCancelButton
          isShowConfirmButton
          onCancel={() => setIsCancelDialogOpen(false)}
          onConfirm={handleConfirmCancelPurchaseOrder}
        />

        <ConfirmDialog
          open={isCloseDialogOpen}
          title="ยืนยันการปิดใบสั่งซื้อ"
          message="เมื่อปิดใบสั่งซื้อแล้ว จะไม่สามารถแก้ไขหรือยกเลิกเอกสารนี้ได้อีก ต้องการดำเนินการต่อหรือไม่"
          confirmText="ยืนยัน"
          cancelText="ยกเลิก"
          isShowCancelButton
          isShowConfirmButton
          onCancel={() => setIsCloseDialogOpen(false)}
          onConfirm={handleConfirmClosePurchaseOrder}
        />

        <ConfirmDialog
          open={isStartRunConfirmOpen}
          title="ยืนยันการเริ่มรันงาน"
          confirmText={startRunWarnings.length ? 'ยืนยันเริ่มรันงานต่อ' : 'ยืนยันเริ่มรันงาน'}
          confirmDisabled={
            isSubmitting ||
            isStartRunPaymentsFetching ||
            isStartRunPaymentSchedulesFetching ||
            (startRunWarnings.length > 0 && !startRunOverrideReason.trim()) ||
            (isLateStart && !lateStartReason.trim())
          }
          cancelText="ยกเลิก"
          isShowCancelButton
          isShowConfirmButton
          onCancel={() => setIsStartRunConfirmOpen(false)}
          onConfirm={() => void handleStartPurchaseOrderRun()}>
          <Stack spacing={2}>
            <Typography>
              ยืนยันการเริ่มรันงานสำหรับใบสั่งซื้อเลขที่{' '}
              <strong>{purchaseOrder?.purchaseOrderNo || ''}</strong> หรือไม่
            </Typography>
            {startRunWarnings.length ? (
              <Box>
                <Typography color="warning.main">
                  <strong>คำเตือนก่อนเริ่มรันงาน:</strong>
                </Typography>
                <Box component="ul" sx={{ mt: 1, mb: 1, pl: 3 }}>
                  {startRunWarnings.map((warning) => (
                    <Typography component="li" color="warning.main" key={warning}>
                      {warning}
                    </Typography>
                  ))}
                </Box>
                <TextField
                  label="เหตุผลในการเริ่มรันงานแบบ Override"
                  value={startRunOverrideReason}
                  onChange={(event) => setStartRunOverrideReason(event.target.value)}
                  helperText="กรุณาระบุเหตุผลที่เริ่มงานก่อนผ่านเงื่อนไขสถานะหรือชำระเงินงวดที่ 1 ครบ"
                  inputProps={{ maxLength: 2000 }}
                  required
                  multiline
                  minRows={3}
                  fullWidth
                />
              </Box>
            ) : null}
            {isLateStart ? (
              <>
                <Typography color="warning.main">
                  PO นี้เริ่มรันงานล่าช้ากว่ากำหนด กรุณาระบุเหตุผลก่อนดำเนินการต่อ
                </Typography>
                <TextField
                  label="เหตุผลที่รันงานล่าช้า"
                  value={lateStartReason}
                  onChange={(event) => setLateStartReason(event.target.value)}
                  required
                  multiline
                  minRows={3}
                  fullWidth
                />
              </>
            ) : null}
            {missingStartRunDocuments.length ? (
              <Typography color="warning.main">
                <strong>คำเตือน:</strong> ยังไม่มีไฟล์ {missingStartRunDocuments.join(' และ ')}{' '}
                แต่สามารถเริ่มรันงานได้
              </Typography>
            ) : (
              <Typography>เอกสารประกอบที่เกี่ยวข้องมีครบแล้ว</Typography>
            )}
          </Stack>
        </ConfirmDialog>

        <Dialog
          open={isProductionPaymentSummaryOpen}
          onClose={() => setIsProductionPaymentSummaryOpen(false)}
          fullWidth
          maxWidth="sm">
          <DialogTitle>ยอดผลิตและงวดที่รอตั้งจ่าย</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={1.5}>
              <Typography>
                {!canViewSupplierPayment || isPaymentSchedulesError
                  ? 'ไม่มีสิทธิ์หรือไม่สามารถโหลดข้อมูลแผนการชำระเงินได้'
                  : unpaidPaymentSchedules.length > 0
                    ? 'ตรวจสอบยอดคงเหลือและวันที่วางแผนจ่ายของงวดก่อนบันทึกผลิตเสร็จ'
                    : 'ไม่มีงวดชำระเงินคงค้าง สามารถดำเนินการบันทึกผลิตเสร็จต่อได้'}
              </Typography>
              {canViewSupplierPayment &&
                !isPaymentSchedulesError &&
                unpaidPaymentSchedules.length > 0 ? (
                <TextField
                  select
                  fullWidth
                  label="งวดการชำระเงิน"
                  value={selectedProductionScheduleId}
                  onChange={(event) =>
                    setSelectedProductionScheduleId(
                      event.target.value ? Number(event.target.value) : ''
                    )
                  }
                  InputLabelProps={{ shrink: true }}>
                  {unpaidPaymentSchedules.map((schedule) => (
                    <MenuItem key={schedule.id} value={schedule.id}>
                      งวดที่ {schedule.installmentNo}
                    </MenuItem>
                  ))}
                </TextField>
              ) : null}
              {canViewSupplierPayment &&
                !isPaymentSchedulesError &&
                unpaidPaymentSchedules.length > 0 &&
                selectedProductionSchedule ? (
                <>
                  <TextField
                    fullWidth
                    label="วันที่วางแผนจ่าย"
                    value={
                      selectedProductionInstruction?.plannedPaymentDate
                        ? dayjs(selectedProductionInstruction.plannedPaymentDate).format(
                          'DD/MM/YYYY'
                        )
                        : ''
                    }
                    placeholder="ยังไม่กำหนด"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ readOnly: true }}
                    helperText={
                      isPaymentInstructionsError
                        ? 'ไม่สามารถโหลดวันที่วางแผนจ่ายได้'
                        : selectedProductionInstruction?.plannedPaymentDate
                          ? ''
                          : 'ยังไม่กำหนด'
                    }
                  />
                  <TextField
                    fullWidth
                    label={`ยอดที่โรงงานแจ้ง (CNY)`}
                    value={formatNumber(
                      Number(selectedProductionSchedule.outstandingAmount || 0) -
                      Number(selectedProductionSchedule.pendingAmount || 0)
                    )}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ readOnly: true }}
                  />
                </>
              ) : null}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setIsProductionPaymentSummaryOpen(false);
              }}>
              ยกเลิก
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setIsProductionPaymentSummaryOpen(false);
                if (productionCompletedMilestone) {
                  openMilestoneDialog(productionCompletedMilestone, 'complete');
                }
              }}>
              ดำเนินการต่อ
            </Button>
          </DialogActions>
        </Dialog>

        <ConfirmDialog
          open={Boolean(milestoneDialog && milestoneDialog.event.type !== 'PRODUCTION_COMPLETED')}
          title={
            milestoneDialog?.mode === 'skip'
              ? `ข้ามขั้นตอน ${milestoneDialog.event.label}`
              : milestoneActionLabel(milestoneDialog?.event)
          }
          confirmText={milestoneDialog?.mode === 'skip' ? 'ยืนยันข้ามขั้นตอน' : 'ยืนยัน'}
          confirmDisabled={isSubmitting}
          cancelText="ยกเลิก"
          isShowCancelButton
          isShowConfirmButton
          onCancel={() => {
            if (!isSubmitting) setMilestoneDialog(null);
          }}
          onConfirm={() => void handleMilestoneAction()}>
          <Stack spacing={2}>
            <Typography>
              {milestoneDialog?.mode === 'skip'
                ? 'ขั้นตอนที่ข้ามจะแสดงอยู่ใน Timeline เพื่อเก็บประวัติการตัดสินใจ'
                : `ยืนยันการบันทึกขั้นตอน ${milestoneDialog?.event.label || ''}`}
            </Typography>
            {milestoneDialog?.event.type === 'PRODUCTION_STARTED' ? (
              <Typography color="text.secondary">
                ระบบจะบันทึกวันที่เริ่มผลิตเป็นวันนี้ และเปลี่ยนขั้นตอนจากรอเริ่มผลิตเป็นเริ่มผลิต
              </Typography>
            ) : null}
            {milestoneDialog?.event.type === 'PRODUCTION_STARTED' ? (
              <TextField
                type="date"
                label="กำหนดผลิตเสร็จ"
                value={milestonePlannedDate}
                onChange={(event) => setMilestonePlannedDate(event.target.value)}
                helperText="ระบบใช้กำหนดผลิตเสร็จเดิม หากยังไม่มีและไม่ระบุ จะคำนวณจากวันนี้บวก Production Lead Time"
                disabled={isSubmitting}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            ) : null}
            <TextField
              label={milestoneDialog?.mode === 'skip' ? 'เหตุผลที่ข้ามขั้นตอน' : 'หมายเหตุ'}
              value={milestoneNote}
              onChange={(event) => setMilestoneNote(event.target.value)}
              disabled={isSubmitting}
              required={milestoneDialog?.mode === 'skip'}
              multiline
              minRows={3}
              fullWidth
            />
          </Stack>
        </ConfirmDialog>

        <Dialog
          open={
            milestoneDialog?.event.type === 'PRODUCTION_COMPLETED' &&
            milestoneDialog.mode === 'complete'
          }
          onClose={() => {
            if (!isSubmitting) setMilestoneDialog(null);
          }}
          maxWidth="md"
          fullWidth
          scroll="paper">
          <DialogTitle>บันทึกผลิตเสร็จ</DialogTitle>
          <DialogContent dividers>
            {/* <Stack spacing={2} sx={{ pt: 1 }}> */}
            <Grid container spacing={2}>
              <GridTextField item xs={12} sm={12}>
                {productionPaymentWarning ? (
                  <Alert severity="warning" sx={{ mb: 1 }}>
                    {productionPaymentWarning}
                  </Alert>
                ) : null}
                <Typography color="text.secondary">
                  ระบุข้อมูลเที่ยวส่งจากโรงงาน ระบบจะบันทึกข้อมูล delivery พร้อมกับ milestone
                  ผลิตเสร็จ
                </Typography>
              </GridTextField>
              <GridTextField item xs={12} sm={6}>
                <TextField
                  type="date"
                  label="วันที่ส่งออก"
                  value={productionDeliveryDraft.shippedDate}
                  onChange={(event) =>
                    updateProductionDeliveryHeader('shippedDate', event.target.value)
                  }
                  disabled={isSubmitting}
                  required
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </GridTextField>
              <GridTextField item xs={12} sm={6}>
                <TextField
                  type="date"
                  label="วันที่คาดว่าจะถึงคลัง"
                  value={productionDeliveryDraft.expectedWarehouseDate}
                  onChange={(event) =>
                    updateProductionDeliveryHeader('expectedWarehouseDate', event.target.value)
                  }
                  disabled={isSubmitting}
                  required
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </GridTextField>
              <GridTextField item xs={12} sm={6}>
                <TextField
                  label="วิธีขนส่ง"
                  value={productionDeliveryDraft.shippingMethod}
                  disabled
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </GridTextField>
              <GridTextField item xs={12}>
                <TextField
                  select
                  label="สถานที่ขนส่ง"
                  value={productionDeliveryDraft.shippingLocationId}
                  onChange={(event) =>
                    updateProductionDeliveryHeader('shippingLocationId', event.target.value)
                  }
                  disabled={isSubmitting}
                  required
                  InputLabelProps={{ shrink: true }}
                  fullWidth>
                  {(purchaseOrder?.supplierShipping?.destinations || []).map((destination) => (
                    <MenuItem key={destination.id} value={String(destination.id)}>
                      {destination.destinationName}
                      {destination.fullAddress ? ` — ${destination.fullAddress}` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </GridTextField>

              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={700}>
                  รายการอะไหล่/ชิ้นส่วนในเที่ยวส่ง
                </Typography>
              </Grid>

              <Grid item xs={12}>
                {productionDeliveryDraft.details.map((detail, index) => (
                  <Box
                    key={`${detail.purchaseOrderDetailId}-${detail.purchaseOrderDetailComponentId ?? 'product'
                      }-${detail.optionNo}`}
                    sx={{ border: `1px solid ${BRAND_COLORS.sand}`, borderRadius: 2, p: 2 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {detail.label}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          startIcon={<Calculate fontSize="small" />}
                          onClick={() => calculateProductionDeliveryCbm(index)}
                          disabled={isSubmitting}>
                          คำนวณ CBM
                        </Button>
                        <Button
                          size="small"
                          startIcon={<Add fontSize="small" />}
                          onClick={() => addProductionDeliveryOption(index)}
                          disabled={isSubmitting}>
                          เพิ่ม option
                        </Button>
                      </Stack>
                    </Stack>
                    <Chip
                      label={`เหลือรับอีก ${Number(
                        detail.remainingQuantity || 0
                      ).toLocaleString()} ชิ้น`}
                      color="warning"
                      variant="filled"
                      sx={{ fontWeight: 700, mb: 1.5 }}
                    />
                    <Grid container spacing={1.5}>
                      {(
                        [
                          ['quantity', 'จำนวนชิ้น', true],
                          ['cartonCount', 'จำนวนกล่อง', false],
                          ['piecesPerCarton', 'จำนวนชิ้นต่อกล่อง', false],
                          ['netWeightKg', 'Net Weight (KGS)', false],
                          ['grossWeightKg', 'Gross Weight (KGS)', false],
                          ['cbmM3', 'CBM (M³)', false],
                          ['lengthCm', 'ยาว (CM)', false],
                          ['widthCm', 'กว้าง (CM)', false],
                          ['heightCm', 'สูง (CM)', false]
                        ] as const
                      ).map(([field, label, required]) => (
                        <Grid item xs={12} sm={6} md={4} key={field}>
                          <TextField
                            type="number"
                            label={label}
                            value={detail[field]}
                            onChange={(event) =>
                              updateProductionDeliveryDetail(index, field, event.target.value)
                            }
                            disabled={isSubmitting}
                            required={required}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: 0, step: 'any' }}
                            fullWidth
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ))}
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="หมายเหตุ"
                  value={milestoneNote}
                  onChange={(event) => setMilestoneNote(event.target.value)}
                  disabled={isSubmitting}
                  InputLabelProps={{ shrink: true }}
                  multiline
                  minRows={3}
                  fullWidth
                />
              </Grid>
            </Grid>
            {/* </Stack> */}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMilestoneDialog(null)} disabled={isSubmitting}>
              ยกเลิก
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleMilestoneAction()}
              disabled={isSubmitting}>
              ยืนยันผลิตเสร็จ
            </Button>
          </DialogActions>
        </Dialog>

        <Stack className={classes.section} spacing={2} sx={{ mb: 2 }}>
          {isProductionTimelineFetching ? (
            <Typography color="text.secondary">กำลังโหลด Timeline การผลิต...</Typography>
          ) : productionTimeline ? (
            <PurchaseOrderProductionSteps
              timeline={productionTimeline}
              purchaseOrderStatus={purchaseOrder?.status}
              actions={null}
            //   purchaseOrder?.status === 'PRODUCTION_RUNNING' ? (
            //     <Stack
            //       direction={{ xs: 'column', sm: 'row' }}
            //       spacing={1}
            //       justifyContent="flex-end">
            //       {nextProofMilestone && canViewProof ? (
            //         <Button variant="outlined" onClick={() => setTab('proof')}>
            //           {nextProofMilestone.status === 'IN_PROGRESS'
            //             ? `ดู ${nextProofMilestone.label}`
            //             : `ดำเนินการ ${nextProofMilestone.label}`}
            //         </Button>
            //       ) : null}
            //       {nextProofMilestone?.canSkip && canManageTimeline ? (
            //         <Button
            //           variant="outlined"
            //           color="inherit"
            //           onClick={() => openMilestoneDialog(nextProofMilestone, 'skip')}>
            //           ข้าม {nextProofMilestone.label}
            //         </Button>
            //       ) : null}
            //       {!nextProofMilestone && nextCompletableMilestone && canManageTimeline ? (
            //         <Button
            //           variant="contained"
            //           onClick={() => openMilestoneDialog(nextCompletableMilestone, 'complete')}>
            //           {milestoneActionLabel(nextCompletableMilestone)}
            //         </Button>
            //       ) : null}
            //     </Stack>
            //   ) : null
            // }
            />
          ) : (
            <Typography color="text.secondary">ยังไม่มีข้อมูล Timeline การผลิต</Typography>
          )}
        </Stack>

        <Tabs
          value={tab}
          onChange={(
            _event: SyntheticEvent,
            value: 'detail' | 'payment' | 'proof' | 'delivery' | 'history'
          ) =>
            setTab(value)
          }>
          <Tab value="detail" label="รายละเอียด" />
          {canViewSupplierPayment ? <Tab value="payment" label="ชำระเงิน" /> : null}
          {canViewProof ? <Tab value="proof" label="งานพรูฟ" /> : null}
          <Tab value="delivery" label="ขนส่งสินค้า" />
          <Tab value="history" label="ประวัติ" />
        </Tabs>

        <TabPanel value="detail" currentTab={tab}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Stack className={classes.section} spacing={2}>
                <Typography variant="h6">ข้อมูลใบสั่งซื้อ</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Info label="เลขที่ใบสั่งซื้อ" value={purchaseOrder?.purchaseOrderNo} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Stack spacing={0.25}>
                      <Typography sx={{ color: BRAND_UI.mutedText, fontSize: 12, fontWeight: 700 }}>
                        อ้างอิงใบยืนยันสั่งซื้อ
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
                          {purchaseOrder?.salesOrderNo || '-'}
                        </Typography>
                        {purchaseOrder?.salesOrderNo ? (
                          <IconButton
                            onClick={() =>
                              window.open(
                                ROUTE_PATHS.SALE_ORDER_DETAIL.replace(
                                  ':id',
                                  encodeURIComponent(purchaseOrder.salesOrderNo as string)
                                ),
                                '_blank',
                                'noopener,noreferrer'
                              )
                            }>
                            <OpenInNew fontSize="small" />
                          </IconButton>
                        ) : null}
                      </Stack>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {isEditing ? (
                      <TextField
                        type="date"
                        label="วันที่เอกสาร"
                        value={draft.docDate}
                        onChange={(event) => updateDraftField('docDate', event.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    ) : (
                      <Info label="วันที่เอกสาร" value={purchaseOrder?.docDate} />
                    )}
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    {isEditing ? (
                      <TextField
                        type="number"
                        label="ระยะเวลาผลิต"
                        value={draft.productionLeadTimeDay}
                        onChange={(event) =>
                          updateDraftField('productionLeadTimeDay', event.target.value)
                        }
                        fullWidth
                        inputProps={{ min: 0, step: 1 }}
                        InputLabelProps={{ shrink: true }}
                      />
                    ) : (
                      <Info
                        label="ระยะเวลาผลิต"
                        value={purchaseOrder?.productionLeadTimeDay ?? '-'}
                      />
                    )}
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    {isEditing ? (
                      <TextField
                        type="number"
                        label="ระยะเวลาส่งของ"
                        value={draft.shippingLeadTimeDay}
                        onChange={(event) =>
                          updateDraftField('shippingLeadTimeDay', event.target.value)
                        }
                        fullWidth
                        inputProps={{ min: 0, step: 1 }}
                        InputLabelProps={{ shrink: true }}
                      />
                    ) : (
                      <Info
                        label="ระยะเวลาส่งของ"
                        value={purchaseOrder?.shippingLeadTimeDay ?? '-'}
                      />
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Info
                      label="สถานะ"
                      value={getDocumentStatusLabel(
                        purchaseOrder?.status,
                        purchaseOrder?.statusProfile
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Info label="สกุลเงิน" value={purchaseOrder?.currency} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Info
                      label="Supplier Shipping"
                      value={
                        purchaseOrder?.supplierShipping
                          ? `${purchaseOrder.supplierShipping.shippingMethod === 'SEA'
                            ? 'ทางเรือ'
                            : 'ทางรถ'
                          } | ${purchaseOrder.supplierShipping.shippingName ||
                          `Shipping #${purchaseOrder.supplierShipping.id}`
                          }`
                          : '-'
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Info label="อัตราแลกเปลี่ยน" value={purchaseOrder?.exchangeRate || 0} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Info label="Car Code" value={purchaseOrder?.carCodeSnapshot || '-'} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Info
                      label="Shipping Method"
                      value={getShippingMethodLabel(
                        purchaseOrder?.shippingMethodSnapshot ||
                        purchaseOrder?.supplierShipping?.shippingMethod
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Info
                      label="Payment Term"
                      value={
                        purchaseOrder?.paymentTerm?.nameTh ||
                        purchaseOrder?.paymentTerm?.nameEn ||
                        purchaseOrder?.paymentTerm?.code
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    {isEditing ? (
                      <TextField
                        label="หมายเหตุ"
                        value={draft.remark}
                        onChange={(event) => updateDraftField('remark', event.target.value)}
                        fullWidth
                        multiline
                        minRows={3}
                      />
                    ) : (
                      <Info label="หมายเหตุ" value={purchaseOrder?.remark} />
                    )}
                  </Grid>
                  {purchaseOrder?.startRunOverrideReason ? (
                    <Grid item xs={12}>
                      <Info
                        label="เหตุผลในการเริ่มรันงานแบบ Override"
                        value={purchaseOrder.startRunOverrideReason}
                      />
                    </Grid>
                  ) : null}
                </Grid>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack className={classes.section} spacing={2}>
                <Typography variant="h6">ข้อมูล Supplier</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Info
                      label="Supplier"
                      value={
                        purchaseOrder?.supplier?.supplierName || purchaseOrder?.supplierNameSnapshot
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Info
                      label="จุดส่งของ"
                      value={
                        purchaseOrder?.supplierShipping?.destinations?.length
                          ? purchaseOrder.supplierShipping.destinations
                            .map((item) => item.destinationName || item.fullAddress || '-')
                            .join(', ')
                          : '-'
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Info label="ที่อยู่" value={purchaseOrder?.supplierAddressSnapshot} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Info label="ผู้ติดต่อ" value={purchaseOrder?.supplierContactSnapshot} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Info label="เบอร์ติดต่อ" value={purchaseOrder?.supplierPhoneSnapshot} />
                  </Grid>
                </Grid>
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <Stack className={classes.section} spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">รายการสินค้า</Typography>
                  {isEditing ? (
                    <Button variant="outlined" startIcon={<Add />} onClick={addDraftItem}>
                      เพิ่มรายการสินค้า
                    </Button>
                  ) : null}
                </Stack>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell className={`${classes.tableHeader} ${classes.imageCell}`}>
                          รูปภาพ
                        </TableCell>
                        <TableCell className={`${classes.tableHeader} ${classes.productCell}`}>
                          สินค้า
                        </TableCell>
                        <TableCell className={classes.tableHeader}>รายละเอียด</TableCell>
                        <TableCell className={`${classes.tableHeader} ${classes.numericCell}`}>
                          จำนวน
                        </TableCell>
                        <TableCell className={`${classes.tableHeader} ${classes.numericCell}`}>
                          ราคาสินค้า
                        </TableCell>
                        <TableCell className={`${classes.tableHeader} ${classes.numericCell}`}>
                          รวม
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayItems.length ? (
                        displayItems.map((item, index) => (
                          <Fragment key={item.id || item.lineNo || index}>
                            <TableRow>
                              <TableCell align="center" className={classes.imageCell}>
                                {item.imageUrl ? (
                                  <Box
                                    component="img"
                                    src={item.imageUrl}
                                    alt={item.name || 'product-image'}
                                    className={classes.imageThumb}
                                    role="button"
                                    tabIndex={0}
                                    title="กดเพื่อดูรูปภาพ"
                                    onClick={() => setPreviewImageUrl(item.imageUrl || null)}
                                    onKeyDown={(event) => {
                                      if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        setPreviewImageUrl(item.imageUrl || null);
                                      }
                                    }}
                                  />
                                ) : (
                                  <Typography variant="caption" color="text.secondary">
                                    -
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell className={classes.productCell}>
                                {isEditing ? (
                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    <TextField
                                      className={classes.itemTextField}
                                      value={item.name || ''}
                                      onChange={(event) =>
                                        updateDraftItemText(index, 'name', event.target.value)
                                      }
                                      fullWidth
                                      size="small"
                                    />
                                    {item.id < 0 ? (
                                      <IconButton
                                        size="small"
                                        color="error"
                                        aria-label="ลบรายการสินค้าใหม่"
                                        onClick={() => removeDraftItem(index)}>
                                        <DeleteOutline fontSize="small" />
                                      </IconButton>
                                    ) : null}
                                  </Stack>
                                ) : (
                                  item.name || '-'
                                )}
                              </TableCell>
                              <TableCell className={classes.specCell}>
                                {isEditing ? (
                                  <TextField
                                    className={classes.itemTextField}
                                    value={item.spec || ''}
                                    onChange={(event) =>
                                      updateDraftItemText(index, 'spec', event.target.value)
                                    }
                                    fullWidth
                                    multiline
                                    minRows={2}
                                    size="small"
                                  />
                                ) : (
                                  item.spec || '-'
                                )}
                              </TableCell>
                              <TableCell align="right" className={classes.numericCell}>
                                {isEditing ? (
                                  <TextField
                                    type="number"
                                    className={classes.itemTextField}
                                    value={item.quantity ?? 0}
                                    onChange={(event) =>
                                      updateDraftItem(
                                        index,
                                        'quantity',
                                        Number(event.target.value || 0)
                                      )
                                    }
                                  />
                                ) : (
                                  formatNumber(item.quantity || 0)
                                )}
                              </TableCell>
                              <TableCell align="right" className={classes.numericCell}>
                                {isEditing ? (
                                  <TextField
                                    type="number"
                                    className={classes.itemTextField}
                                    value={item.supplierUnitPrice ?? 0}
                                    onChange={(event) =>
                                      updateDraftItem(
                                        index,
                                        'supplierUnitPrice',
                                        Number(event.target.value || 0)
                                      )
                                    }
                                  />
                                ) : (
                                  `${formatNumber(item.supplierUnitPrice || 0)} ${item.supplierCurrency || ''
                                  }`
                                )}
                              </TableCell>
                              <TableCell align="right" className={classes.numericCell}>
                                {formatNumber(item.amountSupplierCurrency || 0)}{' '}
                                {item.supplierCurrency || ''}
                              </TableCell>
                            </TableRow>
                            {item.components?.length || isEditing ? (
                              <TableRow>
                                <TableCell colSpan={6} sx={{ backgroundColor: '#fffaf0', p: 1.5 }}>
                                  <Stack spacing={1}>
                                    <Stack
                                      direction="row"
                                      justifyContent="space-between"
                                      alignItems="center">
                                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                        ชิ้นส่วน / อะไหล่
                                      </Typography>
                                      {isEditing ? (
                                        <Button
                                          size="small"
                                          startIcon={<Edit />}
                                          onClick={() => addDraftComponent(index)}>
                                          เพิ่มชิ้นส่วน
                                        </Button>
                                      ) : null}
                                    </Stack>
                                    <TableContainer
                                      sx={{ border: '1px solid #eadfca', borderRadius: 2 }}>
                                      <Table size="small">
                                        <TableHead>
                                          <TableRow sx={{ backgroundColor: '#fff3d6' }}>
                                            <TableCell>รหัส</TableCell>
                                            <TableCell>ชื่อชิ้นส่วน</TableCell>
                                            <TableCell>สเปก</TableCell>
                                            <TableCell align="right">ต่อสินค้า</TableCell>
                                            <TableCell align="right">รวม</TableCell>
                                            <TableCell>หน่วย</TableCell>
                                            {isEditing ? <TableCell /> : null}
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {(item.components || []).map(
                                            (component, componentIndex) => (
                                              <TableRow key={component.id || componentIndex}>
                                                <TableCell>
                                                  {isEditing ? (
                                                    <TextField
                                                      size="small"
                                                      value={component.componentCode || ''}
                                                      onChange={(e) =>
                                                        updateDraftComponent(
                                                          index,
                                                          componentIndex,
                                                          'componentCode',
                                                          e.target.value
                                                        )
                                                      }
                                                    />
                                                  ) : (
                                                    component.componentCode || '-'
                                                  )}
                                                </TableCell>
                                                <TableCell>
                                                  {isEditing ? (
                                                    <TextField
                                                      required
                                                      size="small"
                                                      value={component.componentName || ''}
                                                      onChange={(e) =>
                                                        updateDraftComponent(
                                                          index,
                                                          componentIndex,
                                                          'componentName',
                                                          e.target.value
                                                        )
                                                      }
                                                    />
                                                  ) : (
                                                    component.componentName || '-'
                                                  )}
                                                </TableCell>
                                                <TableCell>
                                                  {isEditing ? (
                                                    <TextField
                                                      size="small"
                                                      value={component.specification || ''}
                                                      onChange={(e) =>
                                                        updateDraftComponent(
                                                          index,
                                                          componentIndex,
                                                          'specification',
                                                          e.target.value
                                                        )
                                                      }
                                                    />
                                                  ) : (
                                                    component.specification || '-'
                                                  )}
                                                </TableCell>
                                                <TableCell align="right">
                                                  {isEditing ? (
                                                    <TextField
                                                      size="small"
                                                      type="number"
                                                      inputProps={{ min: 0.00001, step: 0.00001 }}
                                                      value={component.quantityPerItem || 0}
                                                      onChange={(e) =>
                                                        updateDraftComponent(
                                                          index,
                                                          componentIndex,
                                                          'quantityPerItem',
                                                          Number(e.target.value || 0)
                                                        )
                                                      }
                                                    />
                                                  ) : (
                                                    formatNumber(component.quantityPerItem || 0)
                                                  )}
                                                </TableCell>
                                                <TableCell align="right">
                                                  {formatNumber(
                                                    Number(item.quantity || 0) *
                                                    Number(component.quantityPerItem || 0)
                                                  )}
                                                </TableCell>
                                                <TableCell>
                                                  {isEditing ? (
                                                    <TextField
                                                      size="small"
                                                      value={component.unit || 'pcs'}
                                                      onChange={(e) =>
                                                        updateDraftComponent(
                                                          index,
                                                          componentIndex,
                                                          'unit',
                                                          e.target.value
                                                        )
                                                      }
                                                    />
                                                  ) : (
                                                    component.unit || 'pcs'
                                                  )}
                                                </TableCell>
                                                {isEditing ? (
                                                  <TableCell>
                                                    <Button
                                                      color="error"
                                                      size="small"
                                                      onClick={() =>
                                                        removeDraftComponent(index, componentIndex)
                                                      }>
                                                      <DeleteOutline />
                                                    </Button>
                                                  </TableCell>
                                                ) : null}
                                              </TableRow>
                                            )
                                          )}
                                          {!item.components?.length ? (
                                            <TableRow>
                                              <TableCell colSpan={isEditing ? 7 : 6} align="center">
                                                ยังไม่มีรายการชิ้นส่วน
                                              </TableCell>
                                            </TableRow>
                                          ) : null}
                                        </TableBody>
                                      </Table>
                                    </TableContainer>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            ) : null}
                            {item.packages?.length ? (
                              <TableRow>
                                <TableCell
                                  colSpan={6}
                                  sx={{ backgroundColor: BRAND_UI.sandTint, p: 1.5 }}>
                                  <Stack spacing={1}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                      ข้อมูล Package และ CBM
                                    </Typography>
                                    <TableContainer
                                      sx={{
                                        border: `1px solid ${BRAND_COLORS.sand}`,
                                        borderRadius: 2
                                      }}>
                                      <Table size="small" sx={{ minWidth: 920 }}>
                                        <TableHead>
                                          <TableRow sx={{ backgroundColor: '#eef4fa' }}>
                                            <TableCell>Package</TableCell>
                                            <TableCell>ขนาดกล่อง</TableCell>
                                            <TableCell>น้ำหนัก</TableCell>
                                            <TableCell align="right">บรรจุ/ลัง</TableCell>
                                            <TableCell align="right">จำนวนลัง</TableCell>
                                            <TableCell align="right">CBM/ลัง</TableCell>
                                            <TableCell align="right">CBM รวม</TableCell>
                                            <TableCell align="center">สถานะ</TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {item.packages.map((packageItem, packageIndex) => (
                                            <TableRow
                                              key={
                                                packageItem.id ||
                                                packageItem.sourcePackageId ||
                                                packageIndex
                                              }>
                                              <TableCell>
                                                {packageItem.packageName || '-'}
                                              </TableCell>
                                              <TableCell>
                                                {packageItem.packageDimension || '-'}
                                              </TableCell>
                                              <TableCell>
                                                {packageItem.packageWeight || '-'}
                                              </TableCell>
                                              <TableCell align="right">
                                                {packageItem.packageCapacity ||
                                                  (packageItem.capacityQty != null
                                                    ? `${formatNumber(
                                                      packageItem.capacityQty
                                                    )} pcs.`
                                                    : '-')}
                                              </TableCell>
                                              <TableCell align="right">
                                                {packageItem.cartonCount != null
                                                  ? formatNumber(packageItem.cartonCount)
                                                  : '-'}
                                              </TableCell>
                                              <TableCell align="right">
                                                {packageItem.cbmPerCarton != null
                                                  ? formatNumber(packageItem.cbmPerCarton)
                                                  : '-'}
                                              </TableCell>
                                              <TableCell align="right">
                                                {packageItem.totalCbm != null
                                                  ? formatNumber(packageItem.totalCbm)
                                                  : '-'}
                                              </TableCell>
                                              <TableCell align="center">
                                                <Chip
                                                  size="small"
                                                  color={
                                                    packageItem.selectedForCalculation
                                                      ? 'success'
                                                      : 'default'
                                                  }
                                                  label={
                                                    packageItem.selectedForCalculation
                                                      ? 'รวมใน CBM'
                                                      : 'ไม่นำมาคำนวณ'
                                                  }
                                                />
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                          <TableRow sx={{ backgroundColor: '#eef4fa' }}>
                                            <TableCell colSpan={6} align="right">
                                              <Typography
                                                variant="subtitle2"
                                                sx={{ fontWeight: 700 }}>
                                                รวม CBM
                                              </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                              <Typography
                                                variant="subtitle2"
                                                sx={{ fontWeight: 700 }}>
                                                {formatNumber(
                                                  item.packages.reduce(
                                                    (total, packageItem) =>
                                                      total + Number(packageItem.totalCbm || 0),
                                                    0
                                                  )
                                                )}{' '}
                                                CBM
                                              </Typography>
                                            </TableCell>
                                            <TableCell />
                                          </TableRow>
                                        </TableBody>
                                      </Table>
                                    </TableContainer>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            ) : null}
                          </Fragment>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            {t('warning.noResultList')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            </Grid>
            <Grid item xs={8}>
              <Stack className={classes.section} spacing={2}>
                <Typography variant="h6">ไฟล์แนบ</Typography>
                <Grid container spacing={2}>
                  {PURCHASE_ORDER_ATTACHMENT_CATEGORIES.map((category) => {
                    const categoryAttachments = (purchaseOrder?.attachments || []).filter(
                      (attachment) =>
                        resolveAttachmentDocumentType(attachment.documentType) ===
                        category.documentType
                    );

                    return (
                      <Grid item xs={12} md={12} key={category.documentType}>
                        <Stack
                          spacing={1.5}
                          sx={{
                            height: '100%',
                            p: 2,
                            border: `1px solid ${BRAND_COLORS.sand}`,
                            borderRadius: 2,
                            backgroundColor: BRAND_UI.sandTint
                          }}>
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            alignItems={{ xs: 'flex-start', sm: 'center' }}
                            justifyContent="space-between"
                            spacing={1}>
                            <Stack spacing={0.25}>
                              <Typography sx={{ fontWeight: 700 }}>{category.title}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {category.description}
                              </Typography>
                            </Stack>
                            {canManagePurchaseOrder ? (
                              <Button
                                variant="contained"
                                className="btn-baby-blue"
                                component="label"
                                size="small"
                                startIcon={<FilePresent />}
                                disabled={isSubmitting}>
                                อัปโหลดไฟล์
                                <input
                                  hidden
                                  type="file"
                                  multiple
                                  onChange={(event) =>
                                    void handleUploadAttachments(event, category.documentType)
                                  }
                                />
                              </Button>
                            ) : null}
                          </Stack>

                          {categoryAttachments.length ? (
                            <Stack spacing={1}>
                              {categoryAttachments.map((attachment) => (
                                <Stack
                                  key={attachment.id}
                                  direction={{ xs: 'column', sm: 'row' }}
                                  spacing={1}
                                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                                  justifyContent="space-between"
                                  sx={{
                                    px: 1.5,
                                    py: 1.25,
                                    border: `1px solid ${BRAND_COLORS.sand}`,
                                    borderRadius: 2,
                                    backgroundColor: BRAND_COLORS.ivory
                                  }}>
                                  <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                                      {attachment.originalFileName ||
                                        attachment.fileName ||
                                        `attachment-${attachment.id}`}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {attachment.contentType || '-'}
                                    </Typography>
                                  </Stack>
                                  <Stack direction="row" spacing={1} flexShrink={0}>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      startIcon={<Description />}
                                      onClick={() => {
                                        if (attachment.fileUrl) {
                                          window.open(
                                            attachment.fileUrl,
                                            '_blank',
                                            'noopener,noreferrer'
                                          );
                                        }
                                      }}>
                                      ดูไฟล์
                                    </Button>
                                    {canManagePurchaseOrder ? (
                                      <Button
                                        variant="outlined"
                                        color="error"
                                        size="small"
                                        startIcon={<DeleteOutline />}
                                        onClick={() => {
                                          void handleDeleteAttachment(attachment.id);
                                        }}
                                        disabled={isSubmitting}>
                                        ลบ
                                      </Button>
                                    ) : null}
                                  </Stack>
                                </Stack>
                              ))}
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              ยังไม่มีไฟล์ในหมวดนี้
                            </Typography>
                          )}
                        </Stack>
                      </Grid>
                    );
                  })}
                </Grid>
              </Stack>
            </Grid>
            <Grid item xs={4}>
              <Stack className={classes.section} spacing={1.25}>
                <Typography variant="h6">สรุปยอด</Typography>
                <Summary
                  label="จำนวนเงินทั้งสิ้น"
                  value={summary.grandTotal}
                  suffix={purchaseOrder?.currency || ''}
                />
                <Summary
                  label="CBM รวม"
                  value={Number(purchaseOrder?.totalCbm || 0)}
                  suffix="CBM"
                />
              </Stack>
            </Grid>
          </Grid>
        </TabPanel>

        {canViewSupplierPayment ? (
          <TabPanel value="payment" currentTab={tab} keepMounted>
            {purchaseOrder ? (
              <PurchaseOrderPaymentSection
                purchaseOrder={purchaseOrder}
                openDraftRequest={openPaymentDraftRequest}
                draftScheduleId={paymentDraftScheduleId}
                onChanged={() =>
                  Promise.all([
                    refetch(),
                    refetchHistory(),
                    refetchPaymentSchedules(),
                    refetchPaymentInstructions()
                  ])
                }
              />
            ) : null}
          </TabPanel>
        ) : null}

        {canViewProof ? (
          <TabPanel value="proof" currentTab={tab}>
            <PurchaseOrderProofSection
              purchaseOrderNo={id}
              purchaseOrderStatus={purchaseOrder?.status}
              timelineEvents={productionTimeline?.events}
              onChanged={() =>
                Promise.all([refetch(), refetchHistory(), refetchProductionTimeline()])
              }
            />
          </TabPanel>
        ) : null}

        <TabPanel value="delivery" currentTab={tab}>
          <PurchaseOrderDeliverySection
            deliveries={purchaseOrder?.deliveries}
            onDeliveryUpdated={() => refetch()}
          />
        </TabPanel>

        <TabPanel value="history" currentTab={tab}>
          <ActivityHistoryTimeline records={activityHistory} />
        </TabPanel>
      </Wrapper>
    </Page>
  );
}
