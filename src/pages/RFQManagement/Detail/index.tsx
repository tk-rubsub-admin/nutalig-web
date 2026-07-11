import {
  Add,
  ArrowDropDown,
  ArrowBackIos,
  CheckCircle,
  InfoOutlined,
  DeleteOutline,
  DirectionsBoat,
  Download,
  ExpandLess,
  ExpandMore,
  FilePresent,
  LocalShipping,
  Menu as MenuIcon,
  Save,
  DisabledByDefault,
  Cancel
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Radio,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import { useAuth } from 'auth/AuthContext';
import { PERMISSIONS } from 'auth/permissions';
import { useFormik } from 'formik';
import ActivityHistoryTimeline from 'components/ActivityHistoryTimeline';
import CollapsibleWrapper from 'components/CollapsibleWrapper';
import ConfirmDialog from 'components/ConfirmDialog';
import FileUploader from 'components/FileUploader';
import ImageFileUploaderWrapper from 'components/ImageFileUploaderWrapper';
import { GridTextField, Wrapper } from 'components/Styled';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import dayjs from 'dayjs';
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
import { ROUTE_PATHS } from 'routes';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import * as Yup from 'yup';
import { getActivityHistory } from 'services/ActivityHistory/activity-history-api';
import { getSystemConfig } from 'services/Config/config-api';
import { SystemConfig } from 'services/Config/config-type';
import { getQuotation, viewQuotation } from 'services/Document/document-api';
import { QuotationItem } from 'services/Document/document-type';
import { DownloadDocumentResponse } from 'services/general-type';
import { getProductFamilies } from 'services/Product/product-api';
import { ProductFamily, ProductSubtype1, ProductSubtype2 } from 'services/Product/product-type';
import { downloadSaleOrder } from 'services/SaleOrder/sale-order-api';
import {
  createRFQAdditionalCosts,
  addRFQAttachments,
  addRFQPictures,
  createRFQDetails,
  deleteRFQAdditionalCost,
  deleteRFQDetail,
  deleteRFQPicture,
  closeRFQ,
  getRFQ,
  rejectRFQ,
  updateRFQCustomer,
  updateRFQ
} from 'services/RFQ/rfq-api';
import {
  RFQAdditionalCost,
  CreateRFQAdditionalCostRequest,
  CreateRFQDetailRequest,
  RFQDetailOption,
  RFQDetailTier,
  RFQEmployee,
  RFQFileResource,
  RFQProductMaterial,
  RFQProductSubtype1,
  RFQProductSubtype2,
  RFQRecord
} from 'services/RFQ/rfq-type';
import { base64ToBlob } from 'utils';
import CreateRFQCustomerDialog from './CreateRFQCustomerDialog';
import { RequestedInformationDialog } from './RequestedInformationDialog';

interface RFQDetailParam {
  id: string;
}

interface RFQEditableFormValues {
  orderTypeCode: string;
  productFamily: string;
  productUsage: string;
  systemMechanic: string;
  material: string;
  capacity: string;
  description: string;
}

interface DraftDetailTierError {
  quantity?: string;
  productPrice?: string;
  currency?: string;
  exchangeRate?: string;
  landFreightCost?: string;
  seaFreightCost?: string;
}

interface DraftDetailValidationError {
  optionName?: string;
  spec?: string;
  tiers?: string;
  tierErrors?: Record<number, DraftDetailTierError>;
}

interface DraftAdditionalCost {
  id: number;
  description: string;
  value: string;
  unit: string;
}

interface ConfirmQuotationRow {
  key: string;
  detail: RFQDetailOption;
  tier: RFQDetailTier;
  optionIndex: number;
  shippingMethod: ConfirmRfqShippingMethod;
  quotationItem: QuotationItem;
}

function TabPanel({
  value,
  currentTab,
  children
}: {
  value: string;
  currentTab: string;
  children: ReactElement;
}): ReactElement | null {
  if (value !== currentTab) {
    return null;
  }

  return (
    <Box role="tabpanel" sx={{ pt: 3 }}>
      {children}
    </Box>
  );
}

function getProductFamilyCode(productFamily: RFQRecord['productFamily']): string {
  if (!productFamily) {
    return '';
  }

  if (typeof productFamily === 'string') {
    return productFamily;
  }

  return productFamily.code || '';
}

function getProductFamilyLabel(productFamily: RFQRecord['productFamily']): string {
  if (!productFamily) {
    return '';
  }

  if (typeof productFamily === 'string') {
    return productFamily;
  }

  if (productFamily.nameTh && productFamily.nameEn) {
    return `${productFamily.nameTh} (${productFamily.nameEn})`;
  }

  return productFamily.nameTh || productFamily.nameEn || productFamily.code || '';
}

function getShippingMethodLabel(shippingMethod?: string | null): string {
  if (shippingMethod === 'LAND') {
    return 'ทางรถ';
  }

  if (shippingMethod === 'SEA') {
    return 'ทางเรือ';
  }

  return 'ทางรถ, ทางเรือ';
}

function getNamedCodeValueCode<T extends { code?: string }>(value?: T | string | null): string {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return value.code || '';
}

function getNamedCodeValueLabel<
  T extends { code?: string; nameTh?: string | null; nameEn?: string | null }
>(value?: T | string | null): string {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value.nameTh && value.nameEn) {
    return `${value.nameTh} (${value.nameEn})`;
  }

  return value.nameTh || value.nameEn || value.code || '';
}

function getProductFamilyDisplayName(productFamily: ProductFamily): string {
  if (productFamily.nameTh && productFamily.nameEn) {
    return `${productFamily.nameTh} (${productFamily.nameEn})`;
  }

  return productFamily.nameTh || productFamily.nameEn || productFamily.code;
}

function getProductSubtype1DisplayName(productSubtype1: ProductSubtype1): string {
  if (productSubtype1.nameTh && productSubtype1.nameEn) {
    return `${productSubtype1.nameTh} (${productSubtype1.nameEn})`;
  }

  return productSubtype1.nameTh || productSubtype1.nameEn || productSubtype1.code;
}

function getProductSubtype2DisplayName(productSubtype2: ProductSubtype2): string {
  if (productSubtype2.nameTh && productSubtype2.nameEn) {
    return `${productSubtype2.nameTh} (${productSubtype2.nameEn})`;
  }

  return productSubtype2.nameTh || productSubtype2.nameEn || productSubtype2.code;
}

function getEmployeeLabel(employee?: RFQEmployee | null): string {
  if (!employee) {
    return '';
  }

  const employeeId = employee.employeeId || employee.salesId || '';
  const nickname = employee.nickName || employee.nickname || '';
  const name = [employee.firstNameTh, employee.lastNameTh].filter(Boolean).join(' ');

  return [employeeId, nickname ? `- ${nickname}` : '', name ? `(${name})` : '']
    .filter(Boolean)
    .join(' ');
}

function AttachmentFileUploader({
  id,
  inputId,
  isDisabled,
  readOnly,
  isMultiple,
  onChange
}: {
  id: string;
  inputId: string;
  isDisabled: boolean;
  readOnly?: boolean;
  isMultiple: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  isError: boolean;
}): JSX.Element {
  return (
    <Stack direction="column" alignItems="center" spacing={1}>
      <Stack direction="row" alignItems="center">
        {!readOnly && (
          <Button
            id={`${id}__upload_button_${inputId}`}
            variant="contained"
            className="btn-baby-blue"
            component="label"
            startIcon={<FilePresent />}
            size="large"
            sx={{ mt: 1 }}
            disabled={isDisabled}>
            อัปโหลดไฟล์
            <input
              hidden
              type="file"
              multiple={isMultiple}
              id={`${id}_document_uploader_button_${inputId}`}
              name={inputId}
              onChange={onChange}
              disabled={isDisabled}
            />
          </Button>
        )}
      </Stack>
    </Stack>
  );
}

function getRFQFileUrl(file?: RFQFileResource | null): string {
  return file?.pictureUrl || file?.fileUrl || '';
}

function getRFQFileName(file?: RFQFileResource | null, fallbackIndex?: number): string {
  return (
    file?.originalFileName ||
    file?.fileName ||
    getRFQFileUrl(file).split('/').pop() ||
    (fallbackIndex !== undefined ? `file-${fallbackIndex + 1}` : 'file')
  );
}

function isImageFile(file?: RFQFileResource | null): boolean {
  const fileType = (file?.fileType || '').toUpperCase();
  const mimeType = (file?.mimeType || '').toLowerCase();
  const fileUrl = getRFQFileUrl(file).toLowerCase();

  if (fileType === 'PICTURE' || fileType === 'IMAGE') {
    return true;
  }

  if (fileType === 'ATTACHMENT') {
    return false;
  }

  if (mimeType.startsWith('image/')) {
    return true;
  }

  return /\.(jpg|jpeg|png|gif|webp|bmp|svg|heic|heif)$/i.test(fileUrl);
}

function getRFQPictureResources(rfq?: RFQRecord): RFQFileResource[] {
  const files = Array.isArray(rfq?.files)
    ? rfq?.files || []
    : Array.isArray(rfq?.pictures)
      ? rfq?.pictures || []
      : [];

  return files.filter((file) => isImageFile(file));
}

function getRFQAttachmentResources(rfq?: RFQRecord): RFQFileResource[] {

  if (Array.isArray(rfq?.pictures) && rfq.pictures.length > 0) {
    return rfq.pictures.filter((file) => !isImageFile(file));
  }

  if (Array.isArray(rfq?.attachments) && rfq.attachments.length > 0) {
    return rfq.attachments;
  }

  return [];
}

function getSLADayTypeLabel(dayType?: string): string {
  switch (dayType) {
    case 'BUSINESS_DAY':
      return 'วันทำการ';
    case 'CALENDAR_DAY':
      return 'วันปฏิทิน';
    default:
      return dayType || 'วัน';
  }
}

function getSLADayLeft(requestedDate?: string | null, slaDate?: string | null): number | null {
  if (!requestedDate || !slaDate) {
    return null;
  }

  const requestDay = dayjs(requestedDate).startOf('day');
  const slaDay = dayjs(slaDate).startOf('day');
  const today = dayjs().startOf('day');
  const referenceDay = today.isBefore(requestDay) ? requestDay : today;

  return slaDay.diff(referenceDay, 'day');
}

function getSLAStatusPresentation(
  dayLeft: number | null,
  dayType?: string,
  rfqStatus?: string
): {
  label: string;
  caption: string;
  accentColor: string;
  backgroundColor: string;
} {
  const dayTypeLabel = getSLADayTypeLabel(dayType);
  const isSLAActiveStatus = ['NEW', 'IN_PROGRESS'].includes(rfqStatus || '');

  if (!isSLAActiveStatus) {
    return {
      label: '-',
      caption: 'SLA ไม่ถูกนำมาคิดในสถานะนี้',
      accentColor: '#475569',
      backgroundColor: '#f8fafc'
    };
  }

  if (dayLeft === null || dayLeft === undefined) {
    return {
      label: '-',
      caption: 'ยังไม่มีข้อมูล SLA',
      accentColor: '#475569',
      backgroundColor: '#f8fafc'
    };
  }

  if (dayLeft < 0) {
    const overdueDays = Math.abs(dayLeft);
    return {
      label: overdueDays.toString(),
      caption: `เกิน SLA ${overdueDays} ${dayTypeLabel}`,
      accentColor: '#c62828',
      backgroundColor: '#fff1f2'
    };
  }

  if (dayLeft === 0) {
    return {
      label: '0',
      caption: 'ครบกำหนดวันนี้',
      accentColor: '#ef6c00',
      backgroundColor: '#fff7ed'
    };
  }

  if (dayLeft === 1) {
    return {
      label: '1',
      caption: `เหลือ 1 ${dayTypeLabel}`,
      accentColor: '#ed6c02',
      backgroundColor: '#fff8e1'
    };
  }

  return {
    label: dayLeft.toString(),
    caption: `เหลือ ${dayLeft} ${dayTypeLabel}`,
    accentColor: '#2e7d32',
    backgroundColor: '#e8f5e9'
  };
}

function getInitialValues(rfq?: RFQRecord): RFQEditableFormValues {
  return {
    orderTypeCode: rfq?.orderType?.code || '',
    productFamily: getProductFamilyCode(rfq?.productFamily),
    productUsage:
      getNamedCodeValueCode<RFQProductSubtype1>(rfq?.productSubtype1) || rfq?.productUsage || '',
    systemMechanic:
      getNamedCodeValueCode<RFQProductSubtype2>(rfq?.productSubType2) || rfq?.systemMechanic || '',
    material: getNamedCodeValueCode<RFQProductMaterial>(rfq?.material),
    capacity: rfq?.capacity || '',
    description: rfq?.description || ''
  };
}

const quantityFormatter = new Intl.NumberFormat('th-TH');
const priceFormatter = new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const rfqStatusTimelineSteps = [
  'NEW',
  'IN_PROGRESS',
  'SUPPLIER_QUOTED',
  'QUOTED',
  'COMPLETED'
] as const;

function getRfqDisplayedStatusTimelineSteps(
  rfq?: RFQRecord
): readonly ['NEW', 'IN_PROGRESS', 'SUPPLIER_QUOTED', 'QUOTED', string] {
  const lastStatus =
    rfq?.status === 'REJECTED' || rfq?.status === 'CLOSED' || rfq?.status === 'COMPLETED'
      ? rfq.status
      : 'COMPLETED';

  return ['NEW', 'IN_PROGRESS', 'SUPPLIER_QUOTED', 'QUOTED', lastStatus];
}

function getRfqStatusTimelineStepIndex(rfq?: RFQRecord): number {
  if (!rfq) {
    return -1;
  }

  const displayedSteps = getRfqDisplayedStatusTimelineSteps(rfq);

  if (rfq.status === 'REJECTED' || rfq.status === 'CLOSED') {
    return displayedSteps.length - 1;
  }

  const timelineStatuses = new Set(
    (rfq.rfqStatusTimeline || [])
      .map((timeline) => timeline.status)
      .filter((status): status is string => Boolean(status))
  );

  const timelineReachedIndex = displayedSteps.reduce((maxIndex, status, index) => {
    if (timelineStatuses.has(status)) {
      return Math.max(maxIndex, index);
    }

    return maxIndex;
  }, -1);

  const currentStatusIndex = displayedSteps.indexOf(rfq.status);

  return Math.max(timelineReachedIndex, currentStatusIndex);
}

function getRfqCurrentStatusDurationDays(rfq?: RFQRecord): number | null {
  if (!rfq) {
    return null;
  }

  const currentStepIndex = getRfqStatusTimelineStepIndex(rfq);
  if (currentStepIndex < 0) {
    return null;
  }

  const currentStepStatus = getRfqDisplayedStatusTimelineSteps(rfq)[currentStepIndex];
  const currentStepTimeline = (rfq.rfqStatusTimeline || [])
    .filter((timeline) => timeline.status === currentStepStatus && timeline.statusDatetime)
    .sort(
      (left, right) => dayjs(right.statusDatetime).valueOf() - dayjs(left.statusDatetime).valueOf()
    )
    .at(0);

  const referenceDate =
    currentStepTimeline?.statusDatetime || rfq.updatedDate || rfq.requestedDate || null;

  if (!referenceDate) {
    return null;
  }

  const startDate = dayjs(referenceDate).startOf('day');
  const today = dayjs().startOf('day');

  return Math.max(0, today.diff(startDate, 'day'));
}

const actionButtonSx = {
  minHeight: 40,
  px: 2.25,
  borderRadius: 6,
  textTransform: 'none',
  fontWeight: 700,
  boxShadow: 'none',
  '&:hover': {
    boxShadow: 'none'
  }
};

const confirmPriceButtonSx = {
  ...actionButtonSx,
  backgroundColor: '#16A34A',
  color: '#FFFFFF',
  '&:hover': {
    backgroundColor: '#15803D',
    boxShadow: 'none'
  }
};

const outlinedActionButtonSx = {
  ...actionButtonSx,
  borderWidth: 1.5,
  '&:hover': {
    borderWidth: 1.5,
    boxShadow: 'none'
  }
};

function formatQuantity(value?: number | null): string {
  if (value === null || value === undefined) {
    return '-';
  }

  return `${quantityFormatter.format(value)} ชิ้น`;
}

function formatPrice(value?: number | null, currency?: string | null): string {
  if (value === null || value === undefined) {
    return '-';
  }

  if ((currency || '').toUpperCase() === 'CNY') {
    return `¥${priceFormatter.format(value)}`;
  }

  return `${priceFormatter.format(value)} บาท`;
}

function formatAdditionalCostValue(value?: string | null, unit?: string | null): string {
  if (value === null || value === undefined) {
    return unit || '-';
  }

  return unit ? `${value} ${unit}` : '-';
}

function getSortedDetailOptions(details?: RFQDetailOption[]): RFQDetailOption[] {
  return [...(details || [])].sort((left, right) => left.sortOrder - right.sortOrder);
}

type ConfirmRfqShippingMethod = 'LAND' | 'SEA';

function inferQuotationItemShippingMethod(name?: string | null): ConfirmRfqShippingMethod | null {
  if (!name) {
    return null;
  }

  if (name.includes('ทางเรือ')) {
    return 'SEA';
  }

  if (name.includes('ทางรถ')) {
    return 'LAND';
  }

  return null;
}

function getConfirmRfqTierKey(
  detailId: number,
  tierId: number,
  shippingMethod: ConfirmRfqShippingMethod
): string {
  return `${detailId}:${tierId}:${shippingMethod}`;
}

function getSortedAdditionalCosts(additionalCosts?: RFQAdditionalCost[]): RFQAdditionalCost[] {
  return [...(additionalCosts || [])].sort((left, right) => left.sortOrder - right.sortOrder);
}

function createDraftAdditionalCost(): DraftAdditionalCost {
  return {
    id: -Date.now(),
    description: '',
    value: '',
    unit: ''
  };
}

function createDraftDetailOption(sortOrder: number): RFQDetailOption {
  return {
    id: -Date.now(),
    optionName: `Option ${sortOrder}`,
    spec: '',
    sortOrder,
    remark: '',
    tiers: [],
    createdDate: '',
    updatedDate: '',
    createdBy: '',
    updatedBy: ''
  };
}

function createDraftTier(sortOrder: number): RFQDetailTier {
  return {
    id: -(Date.now() + sortOrder),
    quantity: 0,
    productPrice: 0,
    currency: 'THB',
    exchangeRate: 1,
    landFreightCost: 0,
    seaFreightCost: 0,
    landTotalPrice: 0,
    seaTotalPrice: 0,
    sortOrder,
    createdDate: '',
    updatedDate: ''
  };
}

function isPositiveNumber(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isNonNegativeNumber(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function buildDraftDetailPayload(detail: RFQDetailOption): CreateRFQDetailRequest {
  return {
    optionName: detail.optionName.trim(),
    spec: detail.spec.trim(),
    sortOrder: detail.sortOrder,
    remark: detail.remark?.trim() || null,
    tiers: detail.tiers.map((tier, index) => ({
      quantity: tier.quantity,
      productPrice: tier.productPrice,
      currency: tier.currency || 'THB',
      exchangeRate: tier.exchangeRate ?? 1,
      landFreightCost: tier.landFreightCost,
      seaFreightCost: tier.seaFreightCost,
      landTotalPrice: tier.productPrice + tier.landFreightCost,
      seaTotalPrice: tier.productPrice + tier.seaFreightCost,
      sortOrder: index + 1
    }))
  };
}

function validateDraftDetail(detail: RFQDetailOption): DraftDetailValidationError {
  const nextErrors: DraftDetailValidationError = {};

  if (!detail.optionName.trim()) {
    nextErrors.optionName = 'กรุณาระบุชื่อตัวเลือก';
  }

  if (!detail.spec.trim()) {
    nextErrors.spec = 'กรุณาระบุสเปค';
  }

  if (!detail.tiers.length) {
    nextErrors.tiers = 'กรุณาเพิ่ม tier อย่างน้อย 1 tier';
  }

  const nextTierErrors: Record<number, DraftDetailTierError> = {};

  for (const [index, tier] of detail.tiers.entries()) {
    const tierError: DraftDetailTierError = {};

    if (!isPositiveNumber(tier.quantity)) {
      tierError.quantity = `Tier ${index + 1}: กรุณาระบุ MOQ มากกว่า 0`;
    }

    if (!isPositiveNumber(tier.productPrice)) {
      tierError.productPrice = `Tier ${index + 1}: กรุณาระบุราคาสินค้ามากกว่า 0`;
    }

    if (!tier.currency) {
      tierError.currency = `Tier ${index + 1}: กรุณาเลือกสกุลเงิน`;
    }

    if (!isPositiveNumber(tier.exchangeRate ?? 0)) {
      tierError.exchangeRate = `Tier ${index + 1}: กรุณาระบุอัตราแลกเปลี่ยนมากกว่า 0`;
    }

    if (!isNonNegativeNumber(tier.landFreightCost)) {
      tierError.landFreightCost = `Tier ${index + 1}: ค่าขนส่งทางรถต้องเป็น 0 หรือมากกว่า`;
    }

    if (!isNonNegativeNumber(tier.seaFreightCost)) {
      tierError.seaFreightCost = `Tier ${index + 1}: ค่าขนส่งทางเรือต้องเป็น 0 หรือมากกว่า`;
    }

    if (Object.keys(tierError).length) {
      nextTierErrors[tier.id] = tierError;
    }
  }

  if (Object.keys(nextTierErrors).length) {
    nextErrors.tierErrors = nextTierErrors;
  }

  return nextErrors;
}

export default function RFQDetail(): ReactElement {
  const params = useParams<RFQDetailParam>();
  const { t } = useTranslation();
  const history = useHistory();
  const { hasPermission } = useAuth();
  const [tab, setTab] = useState<'detail' | 'history'>('detail');
  const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
  const [visibleDetailSaveConfirmationDialog, setVisibleDetailSaveConfirmationDialog] =
    useState(false);
  const [visibleMissingCustomerConfirmationDialog, setVisibleMissingCustomerConfirmationDialog] =
    useState(false);
  const [visibleCreateCustomerDialog, setVisibleCreateCustomerDialog] = useState(false);
  const [visibleConfirmRfqDialog, setVisibleConfirmRfqDialog] = useState(false);
  const [visibleRequestedInformationDialog, setVisibleRequestedInformationDialog] = useState(false);
  const [visibleUrgentDetailDialog, setVisibleUrgentDetailDialog] = useState(false);
  const [visibleRejectRfqDialog, setVisibleRejectRfqDialog] = useState(false);
  const [visibleCloseRfqConfirmDialog, setVisibleCloseRfqConfirmDialog] = useState(false);
  const [visibleCloseRfqDialog, setVisibleCloseRfqDialog] = useState(false);
  const [closeRfqRemark, setCloseRfqRemark] = useState('');
  const [lastShownRequestedInformationKey, setLastShownRequestedInformationKey] = useState<
    string | null
  >(null);
  const [selectedConfirmRfqTierKey, setSelectedConfirmRfqTierKey] = useState('');
  const [draftDetailOptions, setDraftDetailOptions] = useState<RFQDetailOption[]>([]);
  const [draftDetailErrors, setDraftDetailErrors] = useState<
    Record<number, DraftDetailValidationError>
  >({});
  const [draftAdditionalCosts, setDraftAdditionalCosts] = useState<DraftAdditionalCost[]>([]);
  const [collapsedDetailOptionIds, setCollapsedDetailOptionIds] = useState<number[]>([]);
  const [selectedDetailToDelete, setSelectedDetailToDelete] = useState<RFQDetailOption | null>(
    null
  );
  const [selectedAdditionalCostToDelete, setSelectedAdditionalCostToDelete] =
    useState<RFQAdditionalCost | null>(null);
  const [isPictureSubmitting, setIsPictureSubmitting] = useState(false);
  const [isQuotationDocumentLoading, setIsQuotationDocumentLoading] = useState(false);
  const [downloadMenuAnchorEl, setDownloadMenuAnchorEl] = useState<null | HTMLElement>(null);
  const isSalesPermission = hasPermission(PERMISSIONS.RFQ_EDIT);
  const isAllowUploadAttachment = hasPermission(PERMISSIONS.RFQ_UPLOAD_FILE);
  const isDownloadMenuOpen = Boolean(downloadMenuAnchorEl);

  const handleCloseRequestedInformationDialog = () => {
    setVisibleRequestedInformationDialog(false);
  };

  const handleOpenRequestedInformationDialog = () => {
    setVisibleRequestedInformationDialog(true);
  };

  const handleRejectRfq = async () => {
    if (!params.id) {
      return;
    }

    setVisibleRejectRfqDialog(false);

    await toast.promise(rejectRFQ(params.id), {
      loading: t('toast.loading'),
      success: t('toast.success'),
      error: t('toast.failed')
    });

    await refetchRFQ();
  };

  const handleOpenCloseRfqDialog = () => {
    setVisibleCloseRfqConfirmDialog(false);
    setCloseRfqRemark('');
    setVisibleCloseRfqDialog(true);
  };

  const handleCloseCloseRfqDialog = () => {
    setVisibleCloseRfqDialog(false);
    setCloseRfqRemark('');
  };

  const handleSubmitCloseRfq = async () => {
    if (!params.id) {
      return;
    }

    await toast.promise(closeRFQ(params.id, closeRfqRemark.trim()), {
      loading: t('toast.loading'),
      success: t('toast.success'),
      error: t('toast.failed')
    });

    handleCloseCloseRfqDialog();
    await refetchRFQ();
  };

  const {
    data: rfq,
    isFetching: isRFQFetching,
    refetch: refetchRFQ
  } = useQuery(['rfq-detail', params.id], () => getRFQ(params.id), {
    refetchOnWindowFocus: false,
    enabled: !!params.id
  });
  const {
    data: quotation,
    isFetching: isQuotationFetching,
    refetch: refetchQuotation
  } = useQuery(
    ['rfq-detail-quotation', rfq?.quotationNo],
    () => getQuotation(rfq?.quotationNo || ''),
    {
      refetchOnWindowFocus: false,
      enabled: Boolean(rfq?.quotationNo)
    }
  );
  const isAttachmentUploadVisible = !['QUOTED', 'CANCELED', 'CLOSED', 'COMPLETED'].includes(
    rfq?.status || ''
  );
  const isRejectRfqVisible = !['CANCELED', 'CLOSED', 'COMPLETED', 'ACCEPTED', 'REJECTED'].includes(
    rfq?.status || ''
  );

  const { data: activityHistory = [], isFetching: isActivityHistoryFetching } = useQuery(
    ['rfq-activity-history', params.id],
    () => getActivityHistory('RFQ', params.id),
    {
      refetchOnWindowFocus: false,
      enabled: !!params.id
    }
  );

  const requestedInformationAlertKey = useMemo(() => {
    if (!rfq?.id || !rfq?.requestInformation) {
      return null;
    }

    return `${rfq.id}:${rfq.updatedDate || ''}:${rfq.requestInformation}`;
  }, [rfq?.id, rfq?.requestInformation, rfq?.updatedDate]);

  const rfqStatusTimelineReachedIndex = useMemo(() => getRfqStatusTimelineStepIndex(rfq), [rfq]);
  const rfqCurrentStatusDurationDays = useMemo(() => getRfqCurrentStatusDurationDays(rfq), [rfq]);
  const rfqDisplayedStatusTimelineSteps = useMemo(
    () => getRfqDisplayedStatusTimelineSteps(rfq),
    [rfq]
  );
  const isRejectedOrClosedTimeline = rfq?.status === 'REJECTED' || rfq?.status === 'CLOSED';

  useEffect(() => {
    if (
      rfq?.status === 'REQUESTED_INFO' &&
      rfq.requestInformation &&
      requestedInformationAlertKey &&
      requestedInformationAlertKey !== lastShownRequestedInformationKey
    ) {
      setVisibleRequestedInformationDialog(true);
      setLastShownRequestedInformationKey(requestedInformationAlertKey);
    }
  }, [
    lastShownRequestedInformationKey,
    requestedInformationAlertKey,
    rfq?.requestInformation,
    rfq?.status
  ]);

  const { data: orderTypeList = [] } = useQuery(
    'rfq-detail-order-type-list',
    () => getSystemConfig('ORDER_TYPE'),
    {
      refetchOnWindowFocus: false
    }
  );

  const { data: productFamilyList = [], isFetching: isProductFamilyFetching } = useQuery(
    'rfq-detail-product-family-list',
    () => getProductFamilies(),
    {
      refetchOnWindowFocus: false
    }
  );
  const formik = useFormik<RFQEditableFormValues>({
    initialValues: getInitialValues(rfq),
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      orderTypeCode: Yup.string().required(t('rfqManagement.validation.orderTypeCode')),
      productFamily: Yup.string().required(t('rfqManagement.validation.productFamily')),
      productUsage: Yup.string().max(255).required(t('rfqManagement.validation.productUsage')),
      systemMechanic: Yup.string().max(255),
      material: Yup.string().max(255).required(t('rfqManagement.validation.material')),
      capacity: Yup.string().max(255).required(t('rfqManagement.validation.capacity')),
      description: Yup.string().max(1000).required(t('rfqManagement.validation.description'))
    }),
    onSubmit: async (values, actions) => {
      if (!params.id) {
        return;
      }

      try {
        await toast.promise(updateRFQ(params.id, values), {
          loading: t('toast.loading'),
          success: t('toast.success'),
          error: t('toast.failed')
        });

        await refetchRFQ();
      } finally {
        actions.setSubmitting(false);
      }
    }
  });

  const orderTypeLabel = useMemo(() => {
    return orderTypeList.find((item: SystemConfig) => item.code === formik.values.orderTypeCode)
      ?.nameTh;
  }, [formik.values.orderTypeCode, orderTypeList]);

  const requestedMoqDisplayValues = useMemo(() => {
    return (rfq?.requestedMoqs || []).map((item) => `${item}`);
  }, [rfq?.requestedMoqs]);

  const selectedProductFamily = useMemo(
    () =>
      productFamilyList.find((item: ProductFamily) => item.code === formik.values.productFamily),
    [formik.values.productFamily, productFamilyList]
  );

  const productUsageOptions = selectedProductFamily?.subtype1List || [];

  const selectedProductUsage = useMemo(
    () =>
      productUsageOptions.find((item: ProductSubtype1) => item.code === formik.values.productUsage),
    [formik.values.productUsage, productUsageOptions]
  );

  const systemMechanicOptions = selectedProductUsage?.subtype2List || [];

  const productFamilyLabel = useMemo(() => {
    if (selectedProductFamily) {
      return getProductFamilyDisplayName(selectedProductFamily);
    }

    return getProductFamilyLabel(rfq?.productFamily) || undefined;
  }, [selectedProductFamily, rfq?.productFamily]);

  const hasProductFamilyOption = useMemo(() => {
    return productFamilyList.some(
      (productFamily: ProductFamily) => productFamily.code === formik.values.productFamily
    );
  }, [formik.values.productFamily, productFamilyList]);

  const productUsageLabel = useMemo(() => {
    const selectedProductUsage = productUsageOptions.find(
      (item: ProductSubtype1) => item.code === formik.values.productUsage
    );

    if (selectedProductUsage) {
      return getProductSubtype1DisplayName(selectedProductUsage);
    }

    return getNamedCodeValueLabel<RFQProductSubtype1>(rfq?.productSubtype1) || undefined;
  }, [formik.values.productUsage, productUsageOptions, rfq?.productSubtype1]);

  const systemMechanicLabel = useMemo(() => {
    const selectedSystemMechanic = systemMechanicOptions.find(
      (item: ProductSubtype2) => item.code === formik.values.systemMechanic
    );

    if (selectedSystemMechanic) {
      return getProductSubtype2DisplayName(selectedSystemMechanic);
    }

    return getNamedCodeValueLabel<RFQProductSubtype2>(rfq?.productSubType2) || undefined;
  }, [formik.values.systemMechanic, systemMechanicOptions, rfq?.productSubType2]);

  const materialLabel = useMemo(() => {
    return getNamedCodeValueLabel<RFQProductMaterial>(rfq?.material);
  }, [rfq?.material]);

  const materialCode = useMemo(() => {
    return getNamedCodeValueCode<RFQProductMaterial>(rfq?.material);
  }, [rfq?.material]);

  const materialDisplayValue = useMemo(() => {
    if (materialLabel && formik.values.material === materialCode) {
      return materialLabel;
    }

    return formik.values.material;
  }, [formik.values.material, materialCode, materialLabel]);

  const handleProductFamilyChange = (event: ChangeEvent<HTMLInputElement>) => {
    formik.handleChange(event);
    formik.setFieldValue('productUsage', '');
    formik.setFieldValue('systemMechanic', '');
  };

  const handleProductUsageChange = (event: ChangeEvent<HTMLInputElement>) => {
    formik.handleChange(event);
    formik.setFieldValue('systemMechanic', '');
  };

  const handleRequestQuotation = () => {
    if (!rfq?.customer) {
      setVisibleMissingCustomerConfirmationDialog(true);
      return;
    }

    history.push(ROUTE_PATHS.QUOTATION_CREATE_FROM_RFQ.replace(':rfqId', params.id));
  };

  const handleOpenConfirmRfqDialog = async () => {
    if (rfq?.saleOrderId) {
      history.push(ROUTE_PATHS.SALE_ORDER_DETAIL.replace(':id', rfq.saleOrderId));
      return;
    }

    if (!rfq?.quotationNo) {
      toast.error('ยังไม่มีใบเสนอราคาสำหรับคอนเฟิร์มราคา');
      return;
    }

    if (!confirmQuotationRows.length && !isQuotationFetching) {
      const quotationResponse = await refetchQuotation();
      const refetchedItems = quotationResponse.data?.data.items || [];

      if (!refetchedItems.length) {
        toast.error('ยังไม่มีรายการใบเสนอราคาสำหรับคอนเฟิร์มราคา');
        return;
      }

      setSelectedConfirmRfqTierKey('');
      setVisibleConfirmRfqDialog(true);
      return;
    }
    if (!confirmQuotationRows.length && isQuotationFetching) {
      setVisibleConfirmRfqDialog(true);
      return;
    }

    if (!confirmQuotationRows.length) {
      toast.error('ยังไม่มีรายการใบเสนอราคาสำหรับคอนเฟิร์มราคา');
      return;
    }

    setSelectedConfirmRfqTierKey('');
    setVisibleConfirmRfqDialog(true);
  };

  const handleConfirmRfqPrice = () => {
    if (!selectedConfirmRfqTierKey) {
      toast.error('กรุณาเลือกรายการใบเสนอราคาที่ต้องการใช้สำหรับคอนเฟิร์มราคา');
      return;
    }

    const selectedRow = confirmQuotationRows.find((row) => row.key === selectedConfirmRfqTierKey);

    if (!selectedRow) {
      toast.error('ไม่พบข้อมูลรายการใบเสนอราคาที่เลือก');
      return;
    }

    const selectedDetailIndex = detailOptions.findIndex((detail) => detail.id === selectedRow.detail.id);
    const selectedDetail = selectedRow.detail;
    const selectedShippingMethod = selectedRow.shippingMethod;
    const optionLabel = selectedDetail.optionName || `Option ${selectedDetailIndex + 1}`;
    const shippingLabel = getShippingMethodLabel(selectedShippingMethod);
    const selectedPrice = selectedRow.quotationItem.unitPrice;

    const query = new URLSearchParams({
      detailId: String(selectedDetail.id),
      quotationDetailId: String(selectedRow.quotationItem.id),
      shippingMethod: selectedShippingMethod
    });

    setVisibleConfirmRfqDialog(false);
    toast.success(
      `เลือก ${selectedRow.quotationItem.name || optionLabel} จำนวน ${formatQuantity(
        selectedRow.quotationItem.quantity
      )} ${shippingLabel} ราคา ${formatPrice(selectedPrice)}`
    );
    history.push(
      `${ROUTE_PATHS.SALE_ORDER_CREATE_FROM_RFQ.replace(':rfqId', params.id)}?${query.toString()}`
    );
  };

  const handleOpenDownloadMenu = (event: ReactMouseEvent<HTMLElement>) => {
    setDownloadMenuAnchorEl(event.currentTarget);
  };

  const handleCloseDownloadMenu = () => {
    setDownloadMenuAnchorEl(null);
  };

  const downloadDocumentFiles = (data: DownloadDocumentResponse, emptyMessage: string) => {
    if (!data.files?.length) {
      throw new Error(emptyMessage);
    }

    data.files.forEach((file) => {
      const blob = base64ToBlob(file.base64, file.contentType || 'application/pdf');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = file.fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    });
  };

  const handleDownloadQuotation = async () => {
    handleCloseDownloadMenu();

    if (!rfq?.quotationNo) {
      return;
    }

    setIsQuotationDocumentLoading(true);

    try {
      await toast.promise(viewQuotation(rfq.quotationNo, true, false), {
        loading: t('toast.loading'),
        success: (response) => {
          const data = response.data as DownloadDocumentResponse;

          downloadDocumentFiles(data, 'No quotation file');

          return t('toast.success');
        },
        error: () => t('toast.failed')
      });
    } finally {
      setIsQuotationDocumentLoading(false);
    }
  };

  const handleDownloadSalesOrder = async () => {
    handleCloseDownloadMenu();

    if (!rfq?.saleOrderId) {
      return;
    }

    setIsQuotationDocumentLoading(true);

    try {
      await toast.promise(downloadSaleOrder(rfq.saleOrderId, 'PDF', true, false), {
        loading: t('toast.loading'),
        success: (response) => {
          const data = response.data as DownloadDocumentResponse;

          downloadDocumentFiles(data, 'No sales order file');

          return t('toast.success');
        },
        error: () => t('toast.failed')
      });
    } finally {
      setIsQuotationDocumentLoading(false);
    }
  };

  const hasProductUsageOption = useMemo(() => {
    return productUsageOptions.some(
      (productSubtype1: ProductSubtype1) => productSubtype1.code === formik.values.productUsage
    );
  }, [formik.values.productUsage, productUsageOptions]);

  const hasSystemMechanicOption = useMemo(() => {
    return systemMechanicOptions.some(
      (productSubtype2: ProductSubtype2) => productSubtype2.code === formik.values.systemMechanic
    );
  }, [formik.values.systemMechanic, systemMechanicOptions]);

  const detailOptions = useMemo(
    () => getSortedDetailOptions([...(rfq?.details || []), ...draftDetailOptions]),
    [draftDetailOptions, rfq?.details]
  );
  const confirmQuotationRows = useMemo<ConfirmQuotationRow[]>(() => {
    const rfqRows = detailOptions.flatMap((detail, optionIndex) => {
      const sortedTiers = [...(detail.tiers || [])].sort(
        (left, right) => left.sortOrder - right.sortOrder
      );

      return sortedTiers.flatMap((tier) => {
        const landTotalPrice = Number(tier.landTotalPrice || 0);
        const seaTotalPrice = Number(tier.seaTotalPrice || 0);

        if (landTotalPrice > 0 && seaTotalPrice > 0) {
          return (['LAND', 'SEA'] as const).map((shippingMethod) => ({
            key: getConfirmRfqTierKey(detail.id, tier.id, shippingMethod),
            detail,
            tier,
            optionIndex,
            shippingMethod,
            quotationItem: null
          }));
        }

        if (landTotalPrice > 0) {
          return [
            {
              key: getConfirmRfqTierKey(detail.id, tier.id, 'LAND'),
              detail,
              tier,
              optionIndex,
              shippingMethod: 'LAND' as const,
              quotationItem: null
            }
          ];
        }

        if (seaTotalPrice > 0) {
          return [
            {
              key: getConfirmRfqTierKey(detail.id, tier.id, 'SEA'),
              detail,
              tier,
              optionIndex,
              shippingMethod: 'SEA' as const,
              quotationItem: null
            }
          ];
        }

        return [
          {
            key: getConfirmRfqTierKey(detail.id, tier.id, 'LAND'),
            detail,
            tier,
            optionIndex,
            shippingMethod: 'LAND' as const,
            quotationItem: null
          }
        ];
      });
    });

    const availableRfqRows = [...rfqRows];
    const quotationItems = quotation?.data.items || [];

    return quotationItems.map((quotationItem, index) => {
      const inferredShippingMethod = inferQuotationItemShippingMethod(quotationItem.name);
      const quantity = Number(quotationItem.quantity || 0);
      const unitPrice = Number(quotationItem.unitPrice || 0);
      const exactMatchIndex = availableRfqRows.findIndex((row) => {
        if (inferredShippingMethod && row.shippingMethod !== inferredShippingMethod) {
          return false;
        }

        if (Number(row.tier?.quantity || 0) !== quantity) {
          return false;
        }

        const expectedPrice = Number(
          row.shippingMethod === 'SEA' ? row.tier?.seaTotalPrice || 0 : row.tier?.landTotalPrice || 0
        );

        return Math.abs(expectedPrice - unitPrice) < 0.0001;
      });
      const quantityMatchIndex =
        exactMatchIndex >= 0
          ? exactMatchIndex
          : availableRfqRows.findIndex((row) => {
            if (inferredShippingMethod && row.shippingMethod !== inferredShippingMethod) {
              return false;
            }

            return Number(row.tier?.quantity || 0) === quantity;
          });
      const fallbackIndex =
        quantityMatchIndex >= 0
          ? quantityMatchIndex
          : availableRfqRows.findIndex((row) =>
            inferredShippingMethod ? row.shippingMethod === inferredShippingMethod : true
          );
      const resolvedIndex = fallbackIndex >= 0 ? fallbackIndex : -1;
      const mappedRow =
        resolvedIndex >= 0 ? availableRfqRows.splice(resolvedIndex, 1)[0] : undefined;

      return {
        key: mappedRow?.key || `quotation:${quotationItem.id}:${index}`,
        detail: mappedRow?.detail || null,
        tier: mappedRow?.tier || null,
        optionIndex: mappedRow?.optionIndex ?? index,
        shippingMethod: mappedRow?.shippingMethod || inferredShippingMethod || 'LAND',
        quotationItem
      };
    });
  }, [detailOptions, quotation?.data.items]);
  const quotationItems = quotation?.data.items || [];
  const additionalCosts = useMemo(
    () => getSortedAdditionalCosts(rfq?.additionalCosts),
    [rfq?.additionalCosts]
  );
  const slaDayLeft = useMemo(
    () => getSLADayLeft(rfq?.requestedDate, rfq?.slaDate),
    [rfq?.requestedDate, rfq?.slaDate]
  );
  const slaPresentation = useMemo(
    () => getSLAStatusPresentation(slaDayLeft, rfq?.serviceLevelAgreement?.dayType, rfq?.status),
    [rfq?.serviceLevelAgreement?.dayType, rfq?.status, slaDayLeft]
  );
  const pictureResources = useMemo(() => getRFQPictureResources(rfq), [rfq]);
  const canEditPictures = isAllowUploadAttachment && pictureResources.length < 5;
  const attachmentResources = useMemo(() => getRFQAttachmentResources(rfq), [rfq]);
  const canRejectAction = isRejectRfqVisible && hasPermission(PERMISSIONS.RFQ_EDIT);
  const canCloseRfqAction =
    !['CLOSED', 'COMPLETED', 'REJECTED', 'CANCELED'].includes(rfq?.status || '') &&
    hasPermission(PERMISSIONS.RFQ_EDIT);
  const canConfirmPriceAction = rfq?.status === 'QUOTED' && hasPermission(PERMISSIONS.RFQ_CONFIRM);
  const canRequestQuotationAction =
    rfq?.status === 'QUOTED' && !rfq?.saleOrderId && !rfq?.quotationNo;
  const canDownloadQuotationAction = Boolean(rfq?.quotationNo);
  const canDownloadSalesOrderAction = Boolean(rfq?.saleOrderId);
  const hasActionMenu =
    canCloseRfqAction ||
    canRejectAction ||
    canConfirmPriceAction ||
    canRequestQuotationAction ||
    canDownloadQuotationAction ||
    canDownloadSalesOrderAction;
  const hasDraftDetailOptions = draftDetailOptions.length > 0;

  const handleChangeTab = (_event: SyntheticEvent, value: 'detail' | 'history') => {
    setTab(value);
  };

  const handleAddAdditionalCost = () => {
    setDraftAdditionalCosts((prev) => [...prev, createDraftAdditionalCost()]);
  };

  const handleDraftAdditionalCostChange = (
    additionalCostId: number,
    field: 'description' | 'value' | 'unit',
    value: string
  ) => {
    setDraftAdditionalCosts((prev) =>
      prev.map((item) => (item.id === additionalCostId ? { ...item, [field]: value } : item))
    );
  };

  const handleDeleteDraftAdditionalCost = (additionalCostId: number) => {
    setDraftAdditionalCosts((prev) => prev.filter((item) => item.id !== additionalCostId));
  };

  const handleSaveAdditionalCosts = async () => {
    if (!params.id || !draftAdditionalCosts.length) {
      return;
    }

    const invalidDraft = draftAdditionalCosts.some((item) => !item.description.trim());

    if (invalidDraft) {
      toast.error('กรุณากรอก Name ให้ครบทุกแถว');
      return;
    }

    const payload: CreateRFQAdditionalCostRequest[] = draftAdditionalCosts.map((item, index) => ({
      costTypeCode: '',
      description: item.description.trim(),
      unit: item.unit,
      value: item.value,
      sortOrder: additionalCosts.length + index + 1
    }));

    try {
      setIsPictureSubmitting(true);
      await toast.promise(createRFQAdditionalCosts(params.id, payload), {
        loading: t('toast.loading'),
        success: t('toast.success'),
        error: t('toast.failed')
      });
      setDraftAdditionalCosts([]);
      await refetchRFQ();
    } finally {
      setIsPictureSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    formik.resetForm({ values: getInitialValues(rfq) });
  };

  const handleConfirmSave = async () => {
    setVisibleConfirmationDialog(false);
    await formik.submitForm();
  };

  const handleUploadPictures = async (files: File[]) => {
    if (!params.id || !files.length) {
      return;
    }

    const remainingSlots = Math.max(0, 5 - pictureResources.length);
    const filesToUpload = files.slice(0, remainingSlots);

    if (!filesToUpload.length) {
      return;
    }

    try {
      setIsPictureSubmitting(true);
      await toast.promise(addRFQPictures(params.id, filesToUpload), {
        loading: t('toast.loading'),
        success: t('toast.success'),
        error: t('toast.failed')
      });
      await refetchRFQ();
    } finally {
      setIsPictureSubmitting(false);
    }
  };

  const handleUploadAttachments = async (files: File[]) => {
    if (!params.id || !files.length) {
      return;
    }

    try {
      setIsPictureSubmitting(true);
      await toast.promise(addRFQAttachments(params.id, files), {
        loading: t('toast.loading'),
        success: t('toast.success'),
        error: t('toast.failed')
      });
      await refetchRFQ();
    } finally {
      setIsPictureSubmitting(false);
    }
  };

  const handleDeletePicture = async (index: number) => {
    const targetPicture = pictureResources[index];

    if (!params.id || !targetPicture) {
      return;
    }

    try {
      setIsPictureSubmitting(true);
      await toast.promise(deleteRFQPicture(params.id, targetPicture.id), {
        loading: t('toast.loading'),
        success: t('toast.success'),
        error: t('toast.failed')
      });
      await refetchRFQ();
    } finally {
      setIsPictureSubmitting(false);
    }
  };

  const handleDeleteDetail = async () => {
    if (!selectedDetailToDelete) {
      return;
    }

    if (selectedDetailToDelete.id < 0) {
      setDraftDetailOptions((prev) =>
        prev.filter((detail) => detail.id !== selectedDetailToDelete.id)
      );
      setSelectedDetailToDelete(null);
      return;
    }

    if (!params.id) {
      return;
    }

    try {
      setIsPictureSubmitting(true);
      await toast.promise(deleteRFQDetail(params.id, selectedDetailToDelete.id), {
        loading: t('toast.loading'),
        success: t('toast.success'),
        error: t('toast.failed')
      });
      await refetchRFQ();
      setSelectedDetailToDelete(null);
    } finally {
      setIsPictureSubmitting(false);
    }
  };

  const handleDeleteAdditionalCost = async () => {
    if (!selectedAdditionalCostToDelete || !params.id) {
      return;
    }

    try {
      setIsPictureSubmitting(true);
      await toast.promise(deleteRFQAdditionalCost(params.id, selectedAdditionalCostToDelete.id), {
        loading: t('toast.loading'),
        success: t('toast.success'),
        error: t('toast.failed')
      });
      await refetchRFQ();
      setSelectedAdditionalCostToDelete(null);
    } finally {
      setIsPictureSubmitting(false);
    }
  };

  const handleAddDetailOption = () => {
    const nextDetail = createDraftDetailOption(detailOptions.length + 1);
    setDraftDetailOptions((prev) => [...prev, nextDetail]);
    setCollapsedDetailOptionIds((prev) => prev.filter((id) => id !== nextDetail.id));
  };

  const handleToggleDetailOption = (detailId: number) => {
    setCollapsedDetailOptionIds((prev) =>
      prev.includes(detailId) ? prev.filter((id) => id !== detailId) : [...prev, detailId]
    );
  };

  const handleDraftDetailChange = (
    detailId: number,
    field: 'optionName' | 'spec' | 'remark',
    value: string
  ) => {
    setDraftDetailOptions((prev) =>
      prev.map((detail) => (detail.id === detailId ? { ...detail, [field]: value } : detail))
    );
    setDraftDetailErrors((prev) => ({
      ...prev,
      [detailId]: {
        ...prev[detailId],
        [field]: undefined
      }
    }));
  };

  const handleAddTier = (detailId: number) => {
    setDraftDetailOptions((prev) =>
      prev.map((detail) =>
        detail.id === detailId
          ? {
            ...detail,
            tiers: [...detail.tiers, createDraftTier(detail.tiers.length + 1)]
          }
          : detail
      )
    );
    setDraftDetailErrors((prev) => ({
      ...prev,
      [detailId]: {
        ...prev[detailId],
        tiers: undefined
      }
    }));
  };

  const handleDraftTierChange = (
    detailId: number,
    tierId: number,
    field:
      | 'quantity'
      | 'productPrice'
      | 'currency'
      | 'exchangeRate'
      | 'landFreightCost'
      | 'seaFreightCost',
    value: string
  ) => {
    const numericField = field !== 'currency';
    const nextValue = Number(value);

    setDraftDetailOptions((prev) =>
      prev.map((detail) => {
        if (detail.id !== detailId) {
          return detail;
        }

        const nextTiers = detail.tiers.map((tier) => {
          if (tier.id !== tierId) {
            return tier;
          }

          const updatedTier = {
            ...tier,
            [field]: numericField ? (Number.isNaN(nextValue) ? 0 : nextValue) : value
          };

          return {
            ...updatedTier,
            landTotalPrice: updatedTier.productPrice + updatedTier.landFreightCost,
            seaTotalPrice: updatedTier.productPrice + updatedTier.seaFreightCost
          };
        });

        return {
          ...detail,
          tiers: nextTiers
        };
      })
    );
    setDraftDetailErrors((prev) => ({
      ...prev,
      [detailId]: {
        ...prev[detailId],
        tierErrors: {
          ...prev[detailId]?.tierErrors,
          [tierId]: {
            ...prev[detailId]?.tierErrors?.[tierId],
            [field]: undefined
          }
        }
      }
    }));
  };

  const handleDeleteTier = (detailId: number, tierId: number) => {
    setDraftDetailOptions((prev) =>
      prev.map((detail) => {
        if (detail.id !== detailId) {
          return detail;
        }

        const nextTiers = detail.tiers
          .filter((tier) => tier.id !== tierId)
          .map((tier, index) => ({
            ...tier,
            sortOrder: index + 1
          }));

        return {
          ...detail,
          tiers: nextTiers
        };
      })
    );
    setDraftDetailErrors((prev) => {
      const nextTierErrors = { ...(prev[detailId]?.tierErrors || {}) };
      delete nextTierErrors[tierId];

      return {
        ...prev,
        [detailId]: {
          ...prev[detailId],
          tierErrors: nextTierErrors
        }
      };
    });
  };

  const handleSaveAllDraftDetails = async () => {
    if (!hasDraftDetailOptions || !params.id) {
      return;
    }

    const nextErrors = draftDetailOptions.reduce<Record<number, DraftDetailValidationError>>(
      (accumulator, detail) => {
        const validationError = validateDraftDetail(detail);

        if (Object.keys(validationError).length) {
          accumulator[detail.id] = validationError;
        }

        return accumulator;
      },
      {}
    );

    setDraftDetailErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    const payload: CreateRFQDetailRequest[] = draftDetailOptions.map(buildDraftDetailPayload);

    if (!params.id) {
      return;
    }

    try {
      setIsPictureSubmitting(true);
      await toast.promise(createRFQDetails(params.id, payload), {
        loading: t('toast.loading'),
        success: t('toast.success'),
        error: t('toast.failed')
      });
      setDraftDetailErrors({});
      setDraftDetailOptions([]);
      setCollapsedDetailOptionIds([]);
      await refetchRFQ();
    } finally {
      setIsPictureSubmitting(false);
    }
  };

  const handleConfirmSaveAllDraftDetails = async () => {
    setVisibleDetailSaveConfirmationDialog(false);
    await handleSaveAllDraftDetails();
  };

  return (
    <Page>
      <LoadingDialog
        open={
          isRFQFetching ||
          isActivityHistoryFetching ||
          formik.isSubmitting ||
          isPictureSubmitting ||
          isQuotationDocumentLoading
        }
      />
      <PageTitle title={'คำขอราคาเลขที่ ' + rfq?.id || 'คำขอราคาเลขที่'}>
        <Stack direction="row" spacing={1} alignItems="center" useFlexGap>
          {rfq?.status ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={t(`rfqManagement.rfqsStatus.${rfq.status}`, rfq.status)}
                size="small"
                sx={{
                  height: 28,
                  backgroundColor: '#e8f5e9',
                  color: '#2e7d32',
                  border: '1px solid #2e7d3233',
                  fontWeight: 700,
                  alignSelf: 'center',
                  '& .MuiChip-label': {
                    px: 1.25
                  }
                }}
              />
              {rfq.status === 'REQUESTED_INFO' ? (
                <Chip
                  icon={<InfoOutlined />}
                  label="ข้อมูลเพิ่มเติม"
                  size="small"
                  variant="outlined"
                  color="info"
                  clickable
                  onClick={handleOpenRequestedInformationDialog}
                  sx={{
                    height: 28,
                    fontWeight: 700,
                    alignSelf: 'center',
                    '& .MuiChip-label': {
                      px: 1.25
                    }
                  }}
                />
              ) : null}
              {rfq.urgentRequest ? (
                <Chip
                  label={
                    rfq.urgentRequestStatus === 'APPROVED'
                      ? 'เร่งด่วนอนุมัติแล้ว'
                      : rfq.urgentRequestStatus === 'REJECTED'
                        ? 'คำขอเร่งด่วนไม่อนุมัติ'
                        : 'เร่งด่วนรออนุมัติ'
                  }
                  size="small"
                  clickable
                  onClick={() => setVisibleUrgentDetailDialog(true)}
                  sx={{
                    height: 28,
                    backgroundColor:
                      rfq.urgentRequestStatus === 'APPROVED'
                        ? '#fee2e2'
                        : rfq.urgentRequestStatus === 'REJECTED'
                          ? '#e2e8f0'
                          : '#fff7ed',
                    color:
                      rfq.urgentRequestStatus === 'APPROVED'
                        ? '#b91c1c'
                        : rfq.urgentRequestStatus === 'REJECTED'
                          ? '#475569'
                          : '#c2410c',
                    border:
                      rfq.urgentRequestStatus === 'APPROVED'
                        ? '1px solid #ef444433'
                        : rfq.urgentRequestStatus === 'REJECTED'
                          ? '1px solid #94a3b833'
                          : '1px solid #fb923c33',
                    fontWeight: 700,
                    alignSelf: 'center',
                    '& .MuiChip-label': {
                      px: 1.25
                    }
                  }}
                />
              ) : null}
            </Stack>
          ) : null}
          {rfq?.slaDate && ['NEW', 'IN_PROGRESS'].includes(rfq.status || '') ? (
            <Chip
              label={slaPresentation.caption}
              size="small"
              sx={{
                height: 28,
                backgroundColor: slaPresentation.backgroundColor,
                color: slaPresentation.accentColor,
                border: `1px solid ${slaPresentation.accentColor}33`,
                fontWeight: 700,
                alignSelf: 'center',
                '& .MuiChip-label': {
                  px: 1.25
                }
              }}
            />
          ) : null}
        </Stack>
      </PageTitle>
      <RequestedInformationDialog
        open={visibleRequestedInformationDialog}
        requestInformation={rfq?.requestInformation}
        onClose={handleCloseRequestedInformationDialog}
      />
      <Wrapper>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="flex-end" spacing={1} flexWrap="wrap" useFlexGap>
            {hasActionMenu ? (
              <>
                <Button
                  variant="contained"
                  className="btn-indigo-blue"
                  startIcon={<MenuIcon />}
                  endIcon={<ArrowDropDown />}
                  disabled={isQuotationDocumentLoading}
                  onClick={handleOpenDownloadMenu}
                  aria-controls={isDownloadMenuOpen ? 'rfq-action-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={isDownloadMenuOpen ? 'true' : undefined}>
                  ตัวเลือก
                </Button>
                <Menu
                  id="rfq-action-menu"
                  anchorEl={downloadMenuAnchorEl}
                  open={isDownloadMenuOpen}
                  onClose={handleCloseDownloadMenu}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  PaperProps={{
                    sx: {
                      minWidth: downloadMenuAnchorEl?.offsetWidth || undefined
                    }
                  }}
                  keepMounted>
                  {canConfirmPriceAction ? (
                    <MenuItem
                      onClick={() => {
                        handleCloseDownloadMenu();
                        handleOpenConfirmRfqDialog();
                      }}
                      sx={{ width: '100%' }}>
                      <ListItemIcon>
                        <CheckCircle fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="คอนเฟิร์มราคา" />
                    </MenuItem>
                  ) : null}
                  {canRequestQuotationAction ? (
                    <MenuItem
                      onClick={() => {
                        handleCloseDownloadMenu();
                        handleRequestQuotation();
                      }}
                      sx={{ width: '100%' }}>
                      <ListItemIcon>
                        <FilePresent fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="ขอใบเสนอราคา" />
                    </MenuItem>
                  ) : null}
                  {canDownloadQuotationAction ? (
                    <MenuItem onClick={handleDownloadQuotation} sx={{ width: '100%' }}>
                      <ListItemIcon>
                        <Download fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="ดาวน์โหลดใบเสนอราคา" />
                    </MenuItem>
                  ) : null}
                  {canDownloadSalesOrderAction ? (
                    <MenuItem onClick={handleDownloadSalesOrder} sx={{ width: '100%' }}>
                      <ListItemIcon>
                        <Download fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="ดาวน์โหลดใบยืนยันสั่งซื้อ" />
                    </MenuItem>
                  ) : null}
                  {canCloseRfqAction ? (
                    <MenuItem
                      onClick={() => {
                        handleCloseDownloadMenu();
                        setVisibleCloseRfqConfirmDialog(true);
                      }}
                      sx={{ width: '100%' }}>
                      <ListItemIcon>
                        <Cancel fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="ปิดงาน" />
                    </MenuItem>
                  ) : null}
                  {canRejectAction ? (
                    <MenuItem
                      onClick={() => {
                        handleCloseDownloadMenu();
                        setVisibleRejectRfqDialog(true);
                      }}
                      sx={{ width: '100%' }}>
                      <ListItemIcon>
                        <DisabledByDefault fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="ปฏิเสธ" />
                    </MenuItem>
                  ) : null}
                </Menu>
              </>
            ) : null}
            <Button
              variant="contained"
              className="btn-cool-grey"
              startIcon={<ArrowBackIos />}
              onClick={() => history.push('/rfq-management')}>
              {t('button.back')}
            </Button>
          </Stack>
          <br />
          <Box
            sx={{
              mt: 1.5,
              mb: 2,
              px: 0.5,
              overflowX: 'auto'
            }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                minWidth: 620,
                gap: 1
              }}>
              {rfqDisplayedStatusTimelineSteps.map((status, index) => {
                const isReached = rfqStatusTimelineReachedIndex >= index;
                const isLast = index === rfqDisplayedStatusTimelineSteps.length - 1;
                const reachedColor = isRejectedOrClosedTimeline ? '#DC2626' : '#16A34A';
                const pendingColor = isRejectedOrClosedTimeline ? '#FCA5A5' : '#CBD5E1';
                const textColor = isRejectedOrClosedTimeline
                  ? isReached
                    ? '#DC2626'
                    : '#FCA5A5'
                  : isReached
                    ? '#16A34A'
                    : '#94A3B8';

                return (
                  <Fragment key={status}>
                    <Stack
                      alignItems="center"
                      spacing={0.75}
                      sx={{
                        flex: '0 0 auto',
                        minWidth: 112
                      }}>
                      <Box
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isReached ? reachedColor : pendingColor,
                          color: '#FFFFFF',
                          fontSize: 12,
                          fontWeight: 700,
                          lineHeight: 1
                        }}>
                        {isReached ? <CheckCircle sx={{ fontSize: 18 }} /> : index + 1}
                      </Box>
                      <Stack
                        direction="row"
                        spacing={0.75}
                        alignItems="center"
                        justifyContent="center">
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            color: textColor,
                            textAlign: 'center',
                            lineHeight: 1.2
                          }}>
                          {t(`rfqManagement.rfqsStatus.${status}`, status)}
                        </Typography>
                        {/* {isReached &&
                        index === rfqStatusTimelineReachedIndex &&
                        rfqCurrentStatusDurationDays !== null ? (
                          <Chip
                            label={`ค้าง ${rfqCurrentStatusDurationDays} วัน`}
                            size="small"
                            sx={{
                              height: 20,
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#166534',
                              backgroundColor: '#DCFCE7',
                              border: '1px solid #86EFAC',
                              '& .MuiChip-label': {
                                px: 1
                              }
                            }}
                          />
                        ) : null} */}
                      </Stack>
                    </Stack>
                    {!isLast ? (
                      <Box
                        sx={{
                          flex: '1 1 56px',
                          minWidth: 28,
                          height: 2,
                          borderRadius: 999,
                          backgroundColor:
                            rfqStatusTimelineReachedIndex >= index + 1 ? reachedColor : pendingColor,
                          mb: 3.4
                        }}
                      />
                    ) : null}
                  </Fragment>
                );
              })}
            </Box>
          </Box>
          <br />
          <Box
            sx={{
              backgroundColor: '#fff',
              border: '1px solid #e6ebf1',
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
            }}>
            <Tabs
              value={tab}
              onChange={handleChangeTab}
              sx={{
                px: 2,
                '& .MuiTab-root': {
                  minHeight: 56,
                  textTransform: 'none',
                  fontWeight: 600
                }
              }}>
              <Tab value="detail" label="ข้อมูลการขอราคา" />
              <Tab value="history" label="ประวัติ" />
            </Tabs>
          </Box>

          <TabPanel value="detail" currentTab={tab}>
            <>
              <CollapsibleWrapper
                title="รายละเอียดการขอราคา"
                defaultExpanded
                action={
                  isSalesPermission &&
                    !['QUOTED', 'CANCELED', 'REJECTED', 'CLOSED', 'COMPLETED'].includes(
                      rfq?.status || ''
                    ) ? (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap>
                      <Button
                        variant="contained"
                        className="btn-amber-orange"
                        startIcon={<DisabledByDefault />}
                        onClick={handleCancelEdit}
                        disabled={formik.isSubmitting || isPictureSubmitting}>
                        {t('button.clear')}
                      </Button>
                      <Button
                        variant="contained"
                        className="btn-emerald-green"
                        startIcon={<Save />}
                        onClick={() => setVisibleConfirmationDialog(true)}
                        disabled={formik.isSubmitting || isPictureSubmitting}>
                        {t('button.save')}
                      </Button>
                    </Stack>
                  ) : null
                }>
                <Grid container spacing={1}>
                  <GridTextField item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="เลขที่ขอราคา"
                      value={rfq?.id || ''}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ readOnly: true }}
                    />
                  </GridTextField>
                  <GridTextField item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="วันที่ขอราคา"
                      value={
                        rfq?.requestedDate
                          ? dayjs(rfq.requestedDate).format('DD/MM/YYYY HH:mm')
                          : ''
                      }
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ readOnly: true }}
                    />
                  </GridTextField>

                  <GridTextField item xs={12} sm={12}>
                    <TextField
                      fullWidth
                      label="ผู้ติดต่อ"
                      value={rfq ? `${rfq.contactName || '-'}` : ''}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ readOnly: true }}
                    />
                  </GridTextField>

                  <GridTextField item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('rfqManagement.form.rfqTypeCode')}
                      value={getNamedCodeValueLabel(rfq?.rfqType)}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ readOnly: true }}
                    />
                  </GridTextField>

                  <GridTextField item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="ประเภทงาน"
                      name="orderTypeCode"
                      value={
                        formik.values.orderTypeCode ||
                        orderTypeLabel ||
                        rfq?.orderType?.nameTh ||
                        ''
                      }
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={Boolean(formik.touched.orderTypeCode && formik.errors.orderTypeCode)}
                      helperText={formik.touched.orderTypeCode && formik.errors.orderTypeCode}
                      InputLabelProps={{ shrink: true }}
                      disabled={!isSalesPermission}>
                      {(orderTypeList || []).map((item: SystemConfig) => (
                        <MenuItem key={item.code} value={item.code}>
                          {item.nameTh || item.code}
                        </MenuItem>
                      ))}
                    </TextField>
                  </GridTextField>

                  <GridTextField item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="เซลล์ผู้ดูแล"
                      value={getEmployeeLabel(rfq?.sales)}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ readOnly: true }}
                    />
                  </GridTextField>

                  <GridTextField item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="จัดซื้อที่ดูแล"
                      value={getEmployeeLabel(rfq?.procurement)}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ readOnly: true }}
                    />
                  </GridTextField>

                  <GridTextField item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Product Family"
                      name="productFamily"
                      value={formik.values.productFamily}
                      onChange={handleProductFamilyChange}
                      onBlur={formik.handleBlur}
                      error={Boolean(formik.touched.productFamily && formik.errors.productFamily)}
                      helperText={formik.touched.productFamily && formik.errors.productFamily}
                      InputLabelProps={{ shrink: true }}
                      disabled={!isSalesPermission || isProductFamilyFetching}>
                      {isProductFamilyFetching ? (
                        <MenuItem disabled value="">
                          กำลังโหลดข้อมูล
                        </MenuItem>
                      ) : null}
                      {formik.values.productFamily && !hasProductFamilyOption ? (
                        <MenuItem value={formik.values.productFamily}>
                          {productFamilyLabel || formik.values.productFamily}
                        </MenuItem>
                      ) : null}
                      {productFamilyList.map((productFamily: ProductFamily) => (
                        <MenuItem key={productFamily.code} value={productFamily.code}>
                          {getProductFamilyDisplayName(productFamily)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </GridTextField>

                  <GridTextField item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Product Subtype1"
                      name="productUsage"
                      value={formik.values.productUsage}
                      onChange={handleProductUsageChange}
                      onBlur={formik.handleBlur}
                      error={Boolean(formik.touched.productUsage && formik.errors.productUsage)}
                      helperText={formik.touched.productUsage && formik.errors.productUsage}
                      InputLabelProps={{ shrink: true }}
                      disabled={
                        !isSalesPermission ||
                        !formik.values.productFamily ||
                        isProductFamilyFetching
                      }>
                      {!formik.values.productFamily ? (
                        <MenuItem disabled value="">
                          กรุณาเลือก Product Family ก่อน
                        </MenuItem>
                      ) : null}
                      {formik.values.productUsage && !hasProductUsageOption ? (
                        <MenuItem value={formik.values.productUsage}>
                          {productUsageLabel || formik.values.productUsage}
                        </MenuItem>
                      ) : null}
                      {formik.values.productFamily && productUsageOptions.length === 0 ? (
                        <MenuItem disabled value="">
                          ไม่พบข้อมูล Product Subtype1
                        </MenuItem>
                      ) : null}
                      {productUsageOptions.map((productSubtype1: ProductSubtype1) => (
                        <MenuItem key={productSubtype1.code} value={productSubtype1.code}>
                          {getProductSubtype1DisplayName(productSubtype1)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </GridTextField>
                  <GridTextField item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Product Subtype2"
                      name="systemMechanic"
                      value={formik.values.systemMechanic}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={Boolean(formik.touched.systemMechanic && formik.errors.systemMechanic)}
                      helperText={formik.touched.systemMechanic && formik.errors.systemMechanic}
                      InputLabelProps={{ shrink: true }}
                      disabled={
                        !isSalesPermission || !formik.values.productUsage || isProductFamilyFetching
                      }>
                      {!formik.values.productUsage ? (
                        <MenuItem disabled value="">
                          กรุณาเลือก Product Subtype1 ก่อน
                        </MenuItem>
                      ) : null}
                      {formik.values.productUsage ? (
                        <MenuItem value="">ไม่บังคับเลือก</MenuItem>
                      ) : null}
                      {formik.values.systemMechanic && !hasSystemMechanicOption ? (
                        <MenuItem value={formik.values.systemMechanic}>
                          {systemMechanicLabel || formik.values.systemMechanic}
                        </MenuItem>
                      ) : null}
                      {formik.values.productUsage &&
                        systemMechanicOptions.map((productSubtype2: ProductSubtype2) => (
                          <MenuItem key={productSubtype2.code} value={productSubtype2.code}>
                            {getProductSubtype2DisplayName(productSubtype2)}
                          </MenuItem>
                        ))}
                    </TextField>
                  </GridTextField>
                  <GridTextField item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Material"
                      name="material"
                      value={materialDisplayValue}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={Boolean(formik.touched.material && formik.errors.material)}
                      helperText={formik.touched.material && formik.errors.material}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ readOnly: !isSalesPermission }}
                    />
                  </GridTextField>

                  <GridTextField item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Capacity"
                      name="capacity"
                      value={formik.values.capacity}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={Boolean(formik.touched.capacity && formik.errors.capacity)}
                      helperText={formik.touched.capacity && formik.errors.capacity}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ readOnly: !isSalesPermission }}
                    />
                  </GridTextField>
                  <GridTextField item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label={t('rfqManagement.form.targetPrice')}
                      value={rfq?.targetPrice != null ? rfq.targetPrice.toLocaleString() : ''}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ readOnly: true }}
                    />
                  </GridTextField>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="การขนส่ง"
                      value={getShippingMethodLabel(rfq?.shippingMethod)}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Stack spacing={1.25}>
                      <Typography
                        variant="body2"
                        sx={{ color: 'text.secondary', fontWeight: 500, px: 0.25 }}>
                        {t('rfqManagement.form.requestedMoqs')}
                      </Typography>
                      <Box
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1.5,
                          px: 1.5,
                          py: 1.5,
                          backgroundColor: 'background.paper'
                        }}>
                        <Stack spacing={1.25}>
                          {(requestedMoqDisplayValues.length ? requestedMoqDisplayValues : ['-']).map(
                            (requestedMoq, index) => (
                              <TextField
                                key={`requested-moq-display-${index}`}
                                fullWidth
                                label={`${t('rfqManagement.form.requestedMoq')} ${index + 1}`}
                                value={requestedMoq}
                                InputLabelProps={{ shrink: true }}
                                InputProps={{ readOnly: true }}
                                sx={{
                                  '& .MuiInputBase-root': {
                                    backgroundColor: 'common.white'
                                  }
                                }}
                              />
                            )
                          )}
                        </Stack>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item sm={9} />
                  <GridTextField item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Created Date"
                      value={
                        rfq?.createdDate
                          ? `${dayjs(rfq.createdDate).format('DD/MM/YYYY HH:mm')} By ${rfq?.createdBy || '-'
                          }`
                          : ''
                      }
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ readOnly: true }}
                    />
                  </GridTextField>
                  <GridTextField item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Updated Date"
                      value={
                        rfq?.updatedDate
                          ? `${dayjs(rfq.updatedDate).format('DD/MM/YYYY HH:mm')} By ${rfq?.updatedBy || '-'
                          }`
                          : ''
                      }
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ readOnly: true }}
                    />
                  </GridTextField>

                  <GridTextField item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={4}
                      label="รายละเอียด"
                      name="description"
                      value={formik.values.description}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={Boolean(formik.touched.description && formik.errors.description)}
                      helperText={formik.touched.description && formik.errors.description}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ readOnly: !isSalesPermission }}
                    />
                  </GridTextField>

                  <GridTextField item xs={12}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      รูปอ้างอิง
                    </Typography>
                  </GridTextField>
                  <GridTextField item xs={12}>
                    <ImageFileUploaderWrapper
                      id="rfq-detail-picture-uploader"
                      inputId="rfq-detail-pictures"
                      isDisabled={!canEditPictures || isPictureSubmitting}
                      readOnly={!canEditPictures}
                      maxFiles={5}
                      isMultiple
                      isError={false}
                      files={pictureResources.map((picture) => getRFQFileUrl(picture))}
                      onError={() => undefined}
                      onDeleted={handleDeletePicture}
                      onSuccess={(files) => {
                        void handleUploadPictures(files);
                      }}
                      fileUploader={FileUploader}
                    />
                  </GridTextField>
                  <GridTextField item xs={12}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      ไฟล์แนบ
                    </Typography>
                  </GridTextField>
                  <GridTextField item xs={12}>
                    {isAttachmentUploadVisible ? (
                      <ImageFileUploaderWrapper
                        id="rfq-detail-attachment-uploader"
                        inputId="rfq-detail-attachments"
                        isDisabled={!isAllowUploadAttachment || isPictureSubmitting}
                        readOnly={!isAllowUploadAttachment}
                        isMultiple
                        isError={false}
                        files={[]}
                        onError={() => undefined}
                        onDeleted={() => undefined}
                        onSuccess={(files) => {
                          void handleUploadAttachments(files);
                        }}
                        fileUploader={AttachmentFileUploader}
                      />
                    ) : null}
                  </GridTextField>
                  <GridTextField item xs={12}>
                    {attachmentResources.length ? (
                      <Stack spacing={1.25}>
                        {attachmentResources.map((attachment, index) => (
                          <Stack
                            key={`${attachment.id}-${index}`}
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{
                              px: 1.5,
                              py: 1.25,
                              border: '1px solid #dce4ee',
                              borderRadius: 2,
                              backgroundColor: '#fff'
                            }}>
                            <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                              <Typography fontWeight={600} noWrap>
                                {getRFQFileName(attachment, index)}
                              </Typography>
                              {attachment.updatedDate ? (
                                <Typography variant="caption" color="text.secondary">
                                  {dayjs(attachment.updatedDate).format('DD/MM/YYYY HH:mm')}
                                </Typography>
                              ) : null}
                            </Stack>
                            <Button
                              component="a"
                              href={getRFQFileUrl(attachment)}
                              target="_blank"
                              rel="noreferrer"
                              variant="outlined"
                              sx={outlinedActionButtonSx}>
                              เปิดไฟล์
                            </Button>
                          </Stack>
                        ))}
                      </Stack>
                    ) : (
                      <Box
                        sx={{
                          border: '1px dashed #cbd5e1',
                          borderRadius: 3,
                          py: 3,
                          px: 2,
                          textAlign: 'center',
                          backgroundColor: '#f8fafc'
                        }}>
                        <Typography variant="body2" color="text.secondary">
                          ยังไม่มีไฟล์แนบ
                        </Typography>
                      </Box>
                    )}
                  </GridTextField>
                </Grid>
              </CollapsibleWrapper>
              <CollapsibleWrapper title="ตัวเลือกราคา" defaultExpanded action={null}>
                <Stack spacing={2}>
                  {detailOptions.length ? (
                    detailOptions.map((detail, index) => {
                      const sortedTiers = [...(detail.tiers || [])].sort(
                        (left, right) => left.sortOrder - right.sortOrder
                      );
                      const isDraftDetail = detail.id < 0;
                      const detailError = draftDetailErrors[detail.id] || {};
                      const isCollapsed = collapsedDetailOptionIds.includes(detail.id);

                      return (
                        <Box
                          key={detail.id}
                          sx={{
                            border: '1px solid #dce4ee',
                            borderRadius: 3,
                            overflow: 'hidden',
                            background:
                              'linear-gradient(180deg, rgba(248,250,252,0.95) 0%, rgba(255,255,255,1) 22%)'
                          }}>
                          <Box
                            sx={{
                              px: { xs: 2, md: 3 },
                              py: 2,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: { xs: 'flex-start', md: 'center' },
                              gap: 1.5,
                              flexDirection: { xs: 'column', md: 'row' }
                            }}>
                            <Box>
                              <Stack direction="row" spacing={1} alignItems="center" useFlexGap>
                                <Chip
                                  label={`ตัวเลือก ${detail.sortOrder || index + 1}`}
                                  size="small"
                                  sx={{
                                    backgroundColor: '#eef6ff',
                                    color: '#185ea8',
                                    fontWeight: 700
                                  }}
                                />
                                {isDraftDetail ? (
                                  <Grid item xs={12} md={12}>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      label="ชื่อตัวเลือก"
                                      value={detail.optionName}
                                      InputLabelProps={{ shrink: true }}
                                      error={Boolean(detailError.optionName)}
                                      helperText={detailError.optionName}
                                      onChange={(event) =>
                                        handleDraftDetailChange(
                                          detail.id,
                                          'optionName',
                                          event.target.value
                                        )
                                      }
                                    />
                                  </Grid>
                                ) : (
                                  <Typography>
                                    {detail.optionName || `Option ${index + 1}`}
                                  </Typography>
                                )}
                              </Stack>
                              {isDraftDetail ? (
                                <Grid container spacing={1.5} sx={{ mt: 0.5, maxWidth: 860 }}>
                                  <Grid item xs={12} md={12}>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      label="สเปค"
                                      value={detail.spec}
                                      InputLabelProps={{ shrink: true }}
                                      error={Boolean(detailError.spec)}
                                      helperText={detailError.spec}
                                      onChange={(event) =>
                                        handleDraftDetailChange(
                                          detail.id,
                                          'spec',
                                          event.target.value
                                        )
                                      }
                                    />
                                  </Grid>
                                  <Grid item xs={12} md={12}>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      label="หมายเหตุ"
                                      value={detail.remark || ''}
                                      InputLabelProps={{ shrink: true }}
                                      onChange={(event) =>
                                        handleDraftDetailChange(
                                          detail.id,
                                          'remark',
                                          event.target.value
                                        )
                                      }
                                    />
                                  </Grid>
                                </Grid>
                              ) : (
                                <>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                                    {detail.spec || '-'}
                                  </Typography>
                                  {detail.remark ? (
                                    <Box
                                      sx={{
                                        mt: 1.5,
                                        px: 1.5,
                                        py: 1,
                                        borderRadius: 2,
                                        backgroundColor: '#fff8e1'
                                      }}>
                                      <Typography variant="caption" color="text.secondary">
                                        หมายเหตุ
                                      </Typography>
                                      <Typography variant="body2" fontWeight={600}>
                                        {detail.remark}
                                      </Typography>
                                    </Box>
                                  ) : null}
                                  {detail.recommend ? (
                                    <Box
                                      sx={{
                                        mt: 1.5,
                                        px: 1.5,
                                        py: 1,
                                        borderRadius: 2,
                                        backgroundColor: '#e8f5e9'
                                      }}>
                                      <Typography variant="caption" color="text.secondary">
                                        คำแนะนำ
                                      </Typography>
                                      <Typography variant="body2" fontWeight={600}>
                                        {detail.recommend}
                                      </Typography>
                                    </Box>
                                  ) : null}
                                </>
                              )}
                            </Box>
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{ alignSelf: { xs: 'flex-end', md: 'flex-start' } }}>
                              <IconButton
                                size="small"
                                onClick={() => handleToggleDetailOption(detail.id)}
                                sx={{
                                  color: '#475569',
                                  backgroundColor: '#f8fafc',
                                  border: '1px solid #dbe3ec',
                                  '&:hover': {
                                    backgroundColor: '#eef2f7'
                                  }
                                }}>
                                {isCollapsed ? (
                                  <ExpandMore fontSize="small" />
                                ) : (
                                  <ExpandLess fontSize="small" />
                                )}
                              </IconButton>
                            </Stack>
                          </Box>

                          <Collapse in={!isCollapsed} timeout="auto" unmountOnExit>
                            <Divider />

                            <Box sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
                              {isDraftDetail ? (
                                <Box sx={{ p: 2 }}>
                                  <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    justifyContent="space-between"
                                    alignItems={{ xs: 'stretch', sm: 'center' }}
                                    spacing={1.5}
                                    sx={{ mb: 2 }}>
                                    <Typography variant="subtitle1" fontWeight={700}></Typography>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      startIcon={<Add />}
                                      sx={outlinedActionButtonSx}
                                      onClick={() => handleAddTier(detail.id)}>
                                      เพิ่ม Tier
                                    </Button>
                                  </Stack>
                                  {detailError.tiers ? (
                                    <Typography variant="body2" color="error" sx={{ mb: 1.5 }}>
                                      {detailError.tiers}
                                    </Typography>
                                  ) : null}
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow
                                        sx={{
                                          '& th': {
                                            fontWeight: 700,
                                            backgroundColor: '#f8fafc',
                                            whiteSpace: 'nowrap'
                                          }
                                        }}>
                                        <TableCell>MOQ</TableCell>
                                        <TableCell>ราคาสินค้า</TableCell>
                                        <TableCell>ค่าขนส่งทางรถ</TableCell>
                                        <TableCell>ค่าขนส่งทางเรือ</TableCell>
                                        <TableCell align="right">รวมทางรถ</TableCell>
                                        <TableCell align="right">รวมทางเรือ</TableCell>
                                        <TableCell align="center">จัดการ</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {sortedTiers.length ? (
                                        sortedTiers.map((tier) => (
                                          <TableRow key={tier.id}>
                                            <TableCell sx={{ minWidth: 140 }}>
                                              <TextField
                                                fullWidth
                                                size="small"
                                                type="number"
                                                value={tier.quantity}
                                                error={Boolean(
                                                  detailError.tierErrors?.[tier.id]?.quantity
                                                )}
                                                helperText={
                                                  detailError.tierErrors?.[tier.id]?.quantity
                                                }
                                                onChange={(event) =>
                                                  handleDraftTierChange(
                                                    detail.id,
                                                    tier.id,
                                                    'quantity',
                                                    event.target.value
                                                  )
                                                }
                                              />
                                            </TableCell>
                                            <TableCell sx={{ minWidth: 140 }}>
                                              <TextField
                                                fullWidth
                                                size="small"
                                                type="number"
                                                value={tier.productPrice}
                                                error={Boolean(
                                                  detailError.tierErrors?.[tier.id]?.productPrice
                                                )}
                                                helperText={
                                                  detailError.tierErrors?.[tier.id]?.productPrice
                                                }
                                                onChange={(event) =>
                                                  handleDraftTierChange(
                                                    detail.id,
                                                    tier.id,
                                                    'productPrice',
                                                    event.target.value
                                                  )
                                                }
                                              />
                                            </TableCell>
                                            <TableCell sx={{ minWidth: 150 }}>
                                              <TextField
                                                fullWidth
                                                size="small"
                                                type="number"
                                                value={tier.landFreightCost}
                                                error={Boolean(
                                                  detailError.tierErrors?.[tier.id]?.landFreightCost
                                                )}
                                                helperText={
                                                  detailError.tierErrors?.[tier.id]?.landFreightCost
                                                }
                                                onChange={(event) =>
                                                  handleDraftTierChange(
                                                    detail.id,
                                                    tier.id,
                                                    'landFreightCost',
                                                    event.target.value
                                                  )
                                                }
                                              />
                                            </TableCell>
                                            <TableCell sx={{ minWidth: 150 }}>
                                              <TextField
                                                fullWidth
                                                size="small"
                                                type="number"
                                                value={tier.seaFreightCost}
                                                error={Boolean(
                                                  detailError.tierErrors?.[tier.id]?.seaFreightCost
                                                )}
                                                helperText={
                                                  detailError.tierErrors?.[tier.id]?.seaFreightCost
                                                }
                                                onChange={(event) =>
                                                  handleDraftTierChange(
                                                    detail.id,
                                                    tier.id,
                                                    'seaFreightCost',
                                                    event.target.value
                                                  )
                                                }
                                              />
                                            </TableCell>
                                            <TableCell
                                              align="right"
                                              sx={{ fontWeight: 700, color: '#1565c0' }}>
                                              {formatPrice(tier.landTotalPrice, tier.currency)}
                                            </TableCell>
                                            <TableCell
                                              align="right"
                                              sx={{ fontWeight: 700, color: '#00897b' }}>
                                              {formatPrice(tier.seaTotalPrice, tier.currency)}
                                            </TableCell>
                                            <TableCell align="center">
                                              <IconButton
                                                size="small"
                                                onClick={() => handleDeleteTier(detail.id, tier.id)}
                                                sx={{ color: '#c62828' }}>
                                                <DeleteOutline fontSize="small" />
                                              </IconButton>
                                            </TableCell>
                                          </TableRow>
                                        ))
                                      ) : (
                                        <TableRow>
                                          <TableCell
                                            colSpan={7}
                                            align="center"
                                            sx={{ py: 3, color: 'text.secondary' }}>
                                            ยังไม่มี tier กรุณากด "เพิ่ม Tier"
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                </Box>
                              ) : sortedTiers.length ? (
                                <Table size="small">
                                  <TableHead>
                                    <TableRow
                                      sx={{
                                        '& th': {
                                          fontWeight: 700,
                                          backgroundColor: '#f8fafc',
                                          whiteSpace: 'nowrap'
                                        }
                                      }}>
                                      <TableCell>MOQ</TableCell>
                                      <TableCell align="right">ราคาสินค้า</TableCell>
                                      <TableCell align="right">ค่าขนส่งทางรถ</TableCell>
                                      <TableCell align="right">รวมทางรถ</TableCell>
                                      <TableCell align="right">ค่าขนส่งทางเรือ</TableCell>
                                      <TableCell align="right">รวมทางเรือ</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {sortedTiers.map((tier) => (
                                      <TableRow
                                        key={tier.id}
                                        sx={{
                                          '&:last-child td': { borderBottom: 0 }
                                        }}>
                                        <TableCell sx={{ fontWeight: 600 }}>
                                          {formatQuantity(tier.quantity)}
                                        </TableCell>
                                        <TableCell align="right">
                                          {formatPrice(tier.productPrice, tier.currency)}
                                        </TableCell>
                                        <TableCell align="right">
                                          {formatPrice(tier.landFreightCost, tier.currency)}
                                        </TableCell>
                                        <TableCell
                                          align="right"
                                          sx={{ fontWeight: 700, color: '#1565c0' }}>
                                          {formatPrice(tier.landTotalPrice, tier.currency)}
                                        </TableCell>
                                        <TableCell align="right">
                                          {formatPrice(tier.seaFreightCost, tier.currency)}
                                        </TableCell>
                                        <TableCell
                                          align="right"
                                          sx={{ fontWeight: 700, color: '#00897b' }}>
                                          {formatPrice(tier.seaTotalPrice, tier.currency)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <Box
                                  sx={{
                                    px: 3,
                                    py: 2.5,
                                    color: 'text.secondary',
                                    fontSize: 14
                                  }}>
                                  ยังไม่มีช่วงราคาในตัวเลือกนี้
                                </Box>
                              )}
                            </Box>

                            <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' }, p: 2 }}>
                              {isDraftDetail ? (
                                <>
                                  <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center">
                                    <Typography variant="subtitle1" fontWeight={700}>
                                      Price Tier
                                    </Typography>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      startIcon={<Add />}
                                      sx={outlinedActionButtonSx}
                                      onClick={() => handleAddTier(detail.id)}>
                                      เพิ่ม Tier
                                    </Button>
                                  </Stack>
                                  {detailError.tiers ? (
                                    <Typography variant="body2" color="error">
                                      {detailError.tiers}
                                    </Typography>
                                  ) : null}
                                  {sortedTiers.length ? (
                                    sortedTiers.map((tier) => (
                                      <Box
                                        key={tier.id}
                                        sx={{
                                          p: 1.5,
                                          border: '1px solid #e5e7eb',
                                          borderRadius: 2,
                                          backgroundColor: '#ffffff'
                                        }}>
                                        <Grid container spacing={1}>
                                          <Grid item xs={12}>
                                            <TextField
                                              fullWidth
                                              size="small"
                                              type="number"
                                              label="MOQ"
                                              value={tier.quantity}
                                              error={Boolean(
                                                detailError.tierErrors?.[tier.id]?.quantity
                                              )}
                                              helperText={
                                                detailError.tierErrors?.[tier.id]?.quantity
                                              }
                                              onChange={(event) =>
                                                handleDraftTierChange(
                                                  detail.id,
                                                  tier.id,
                                                  'quantity',
                                                  event.target.value
                                                )
                                              }
                                            />
                                          </Grid>
                                          <Grid item xs={12}>
                                            <TextField
                                              fullWidth
                                              size="small"
                                              type="number"
                                              label="ราคาสินค้า"
                                              value={tier.productPrice}
                                              error={Boolean(
                                                detailError.tierErrors?.[tier.id]?.productPrice
                                              )}
                                              helperText={
                                                detailError.tierErrors?.[tier.id]?.productPrice
                                              }
                                              onChange={(event) =>
                                                handleDraftTierChange(
                                                  detail.id,
                                                  tier.id,
                                                  'productPrice',
                                                  event.target.value
                                                )
                                              }
                                            />
                                          </Grid>
                                          <Grid item xs={12}>
                                            <TextField
                                              fullWidth
                                              size="small"
                                              type="number"
                                              label="ค่าขนส่งทางรถ"
                                              value={tier.landFreightCost}
                                              error={Boolean(
                                                detailError.tierErrors?.[tier.id]?.landFreightCost
                                              )}
                                              helperText={
                                                detailError.tierErrors?.[tier.id]?.landFreightCost
                                              }
                                              onChange={(event) =>
                                                handleDraftTierChange(
                                                  detail.id,
                                                  tier.id,
                                                  'landFreightCost',
                                                  event.target.value
                                                )
                                              }
                                            />
                                          </Grid>
                                          <Grid item xs={12}>
                                            <TextField
                                              fullWidth
                                              size="small"
                                              type="number"
                                              label="ค่าขนส่งทางเรือ"
                                              value={tier.seaFreightCost}
                                              error={Boolean(
                                                detailError.tierErrors?.[tier.id]?.seaFreightCost
                                              )}
                                              helperText={
                                                detailError.tierErrors?.[tier.id]?.seaFreightCost
                                              }
                                              onChange={(event) =>
                                                handleDraftTierChange(
                                                  detail.id,
                                                  tier.id,
                                                  'seaFreightCost',
                                                  event.target.value
                                                )
                                              }
                                            />
                                          </Grid>
                                          <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">
                                              รวมทางรถ
                                            </Typography>
                                            <Typography
                                              variant="body2"
                                              fontWeight={700}
                                              color="#1565c0">
                                              {formatPrice(tier.landTotalPrice, tier.currency)}
                                            </Typography>
                                          </Grid>
                                          <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">
                                              รวมทางเรือ
                                            </Typography>
                                            <Typography
                                              variant="body2"
                                              fontWeight={700}
                                              color="#00897b">
                                              {formatPrice(tier.seaTotalPrice, tier.currency)}
                                            </Typography>
                                          </Grid>
                                          <Grid item xs={12}>
                                            <Button
                                              fullWidth
                                              variant="outlined"
                                              color="error"
                                              startIcon={<DeleteOutline />}
                                              sx={outlinedActionButtonSx}
                                              onClick={() => handleDeleteTier(detail.id, tier.id)}>
                                              ลบแถว
                                            </Button>
                                          </Grid>
                                        </Grid>
                                      </Box>
                                    ))
                                  ) : (
                                    <Box
                                      sx={{
                                        p: 1.5,
                                        border: '1px dashed #d1d5db',
                                        borderRadius: 2,
                                        backgroundColor: '#ffffff',
                                        color: 'text.secondary'
                                      }}>
                                      ยังไม่มี tier กรุณากด "เพิ่ม Tier"
                                    </Box>
                                  )}
                                </>
                              ) : sortedTiers.length ? (
                                sortedTiers.map((tier) => (
                                  <Box
                                    key={tier.id}
                                    sx={{
                                      p: 1.5,
                                      border: '1px solid #e5e7eb',
                                      borderRadius: 2,
                                      backgroundColor: '#ffffff'
                                    }}>
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                                      {formatQuantity(tier.quantity)}
                                    </Typography>
                                    <Grid container spacing={1}>
                                      <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">
                                          ราคาสินค้า
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                          {formatPrice(tier.productPrice, tier.currency)}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">
                                          ค่าขนส่งทางรถ
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                          {formatPrice(tier.landFreightCost, tier.currency)}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">
                                          รวมทางรถ
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          fontWeight={700}
                                          color="#1565c0">
                                          {formatPrice(tier.landTotalPrice, tier.currency)}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">
                                          ค่าขนส่งทางเรือ
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                          {formatPrice(tier.seaFreightCost, tier.currency)}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">
                                          รวมทางเรือ
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          fontWeight={700}
                                          color="#00897b">
                                          {formatPrice(tier.seaTotalPrice, tier.currency)}
                                        </Typography>
                                      </Grid>
                                    </Grid>
                                  </Box>
                                ))
                              ) : (
                                <Box
                                  sx={{
                                    p: 1.5,
                                    border: '1px dashed #d1d5db',
                                    borderRadius: 2,
                                    backgroundColor: '#ffffff',
                                    color: 'text.secondary'
                                  }}>
                                  ยังไม่มีช่วงราคาในตัวเลือกนี้
                                </Box>
                              )}
                            </Stack>
                          </Collapse>
                        </Box>
                      );
                    })
                  ) : (
                    <Box
                      sx={{
                        border: '1px dashed #cbd5e1',
                        borderRadius: 3,
                        py: 4,
                        px: 2,
                        textAlign: 'center',
                        backgroundColor: '#f8fafc'
                      }}>
                      <Typography variant="body1" fontWeight={600}>
                        ยังไม่มีข้อมูลตัวเลือกราคา
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CollapsibleWrapper>
              <CollapsibleWrapper title="รายละเอียดเพิ่มเติม" defaultExpanded action={null}>
                {additionalCosts.length || draftAdditionalCosts.length ? (
                  <Box
                    sx={{
                      border: '1px solid #dce4ee',
                      borderRadius: 3,
                      overflow: 'hidden',
                      backgroundColor: '#fff'
                    }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow
                          sx={{
                            '& th': {
                              fontWeight: 700,
                              backgroundColor: '#f8fafc',
                              whiteSpace: 'nowrap'
                            }
                          }}>
                          <TableCell align="center" width="40%">
                            Name
                          </TableCell>
                          <TableCell>Description</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {additionalCosts.map((additionalCost) => (
                          <TableRow
                            key={additionalCost.id}
                            sx={{
                              '&:last-child td': { borderBottom: 0 }
                            }}>
                            <TableCell sx={{ fontWeight: 600 }}>
                              {additionalCost.description || '-'}
                            </TableCell>
                            <TableCell>
                              {formatAdditionalCostValue(additionalCost.value, additionalCost.unit)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {draftAdditionalCosts.map((additionalCost) => (
                          <TableRow
                            key={additionalCost.id}
                            sx={{
                              '&:last-child td': { borderBottom: 0 }
                            }}>
                            <TableCell sx={{ fontWeight: 600 }}>
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="Name"
                                value={additionalCost.description}
                                onChange={(event) =>
                                  handleDraftAdditionalCostChange(
                                    additionalCost.id,
                                    'description',
                                    event.target.value
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder="Value"
                                  value={additionalCost.value}
                                  onChange={(event) =>
                                    handleDraftAdditionalCostChange(
                                      additionalCost.id,
                                      'value',
                                      event.target.value
                                    )
                                  }
                                />
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder="Unit"
                                  value={additionalCost.unit}
                                  onChange={(event) =>
                                    handleDraftAdditionalCostChange(
                                      additionalCost.id,
                                      'unit',
                                      event.target.value
                                    )
                                  }
                                />
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: '1px dashed #cbd5e1',
                      borderRadius: 3,
                      py: 4,
                      px: 2,
                      textAlign: 'center',
                      backgroundColor: '#f8fafc'
                    }}>
                    <Typography variant="body1" fontWeight={600}>
                      ยังไม่มีรายละเอียดเพิ่มเติม
                    </Typography>
                  </Box>
                )}
              </CollapsibleWrapper>
            </>
          </TabPanel>

          <TabPanel value="history" currentTab={tab}>
            <Wrapper>
              <ActivityHistoryTimeline records={activityHistory} />
            </Wrapper>
          </TabPanel>
        </Stack>
      </Wrapper>
      <ConfirmDialog
        open={visibleConfirmationDialog}
        title={t('rfqManagement.message.confirmUpdateTitle')}
        message={t('rfqManagement.message.confirmUpdateMsg')}
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        isShowCancelButton
        isShowConfirmButton
        onConfirm={handleConfirmSave}
        onCancel={() => setVisibleConfirmationDialog(false)}
      />
      <ConfirmDialog
        open={visibleDetailSaveConfirmationDialog}
        title="ยืนยันบันทึกตัวเลือกราคา"
        message="คุณยืนยันบันทึกตัวเลือกราคาที่เพิ่มใหม่ทั้งหมดใช่หรือไม่"
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        isShowCancelButton
        isShowConfirmButton
        onConfirm={handleConfirmSaveAllDraftDetails}
        onCancel={() => setVisibleDetailSaveConfirmationDialog(false)}
      />
      <ConfirmDialog
        open={Boolean(selectedDetailToDelete)}
        title="ยืนยันลบตัวเลือกราคา"
        message={`คุณยืนยันลบ ${selectedDetailToDelete?.optionName || 'ตัวเลือกราคา'} ใช่หรือไม่`}
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        isShowCancelButton
        isShowConfirmButton
        onConfirm={handleDeleteDetail}
        onCancel={() => setSelectedDetailToDelete(null)}
      />
      <ConfirmDialog
        open={Boolean(selectedAdditionalCostToDelete)}
        title="ยืนยันลบรายละเอียดเพิ่มเติม"
        message={`คุณยืนยันลบ ${selectedAdditionalCostToDelete?.description || 'รายละเอียดเพิ่มเติม'
          } ใช่หรือไม่`}
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        isShowCancelButton
        isShowConfirmButton
        onConfirm={handleDeleteAdditionalCost}
        onCancel={() => setSelectedAdditionalCostToDelete(null)}
      />
      <ConfirmDialog
        open={visibleMissingCustomerConfirmationDialog}
        title="ยังไม่มีข้อมูลลูกค้า"
        message="ยังไม่มีข้อมูลลูกค้าในระบบ กรุณาสร้างข้อมูลลูกค้าก่อนออกใบเสนอราคา"
        confirmText="ยืนยัน"
        cancelText="ปิด"
        isShowCancelButton
        isShowConfirmButton
        onConfirm={() => {
          setVisibleMissingCustomerConfirmationDialog(false);
          setVisibleCreateCustomerDialog(true);
        }}
        onCancel={() => setVisibleMissingCustomerConfirmationDialog(false)}
      />
      <ConfirmDialog
        open={visibleRejectRfqDialog}
        title="ยืนยันปฏิเสธคำขอราคา"
        message={`คุณยืนยันปฏิเสธคำขอราคา ${rfq?.id || ''} ใช่หรือไม่`}
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        isShowCancelButton
        isShowConfirmButton
        onConfirm={handleRejectRfq}
        onCancel={() => setVisibleRejectRfqDialog(false)}
      />
      <ConfirmDialog
        open={visibleCloseRfqConfirmDialog}
        title="ยืนยันปิดงาน"
        message={`คุณยืนยันปิดงานคำขอราคา ${rfq?.id || ''} ใช่หรือไม่`}
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        isShowCancelButton
        isShowConfirmButton
        onConfirm={handleOpenCloseRfqDialog}
        onCancel={() => setVisibleCloseRfqConfirmDialog(false)}
      />
      <Dialog
        open={visibleCloseRfqDialog}
        fullWidth
        maxWidth="sm"
        disableEnforceFocus
        onClose={handleCloseCloseRfqDialog}>
        <DialogTitle>ปิดงาน</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label="เหตุผล"
            value={closeRfqRemark}
            onChange={(event) => setCloseRfqRemark(event.target.value)}
            InputLabelProps={{ shrink: true }}
            placeholder="ระบุเหตุผลในการปิดงาน"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseCloseRfqDialog}
            className="btn-crimson-red"
            variant="contained">
            {t('button.cancel')}
          </Button>
          <Button
            onClick={handleSubmitCloseRfq}
            className="btn-emerald-green"
            variant="contained"
            disabled={!closeRfqRemark.trim()}>
            {t('button.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={visibleConfirmRfqDialog}
        fullWidth
        maxWidth="lg"
        disableEnforceFocus
        onClose={() => setVisibleConfirmRfqDialog(false)}>
        <DialogTitle>คอนเฟิร์มราคา</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              เลือกรายการจากใบเสนอราคาที่ต้องการใช้สำหรับคอนเฟิร์มราคา
            </Typography>
            {isQuotationFetching ? (
              <Box
                sx={{
                  border: '1px dashed #cbd5e1',
                  borderRadius: 3,
                  py: 4,
                  px: 2,
                  textAlign: 'center',
                  backgroundColor: '#f8fafc'
                }}>
                <Typography variant="body1" fontWeight={600}>
                  กำลังโหลดข้อมูลใบเสนอราคา...
                </Typography>
              </Box>
            ) : quotationItems.length ? (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        '& th': {
                          fontWeight: 700,
                          backgroundColor: '#f8fafc',
                          whiteSpace: 'nowrap'
                        }
                      }}>
                      <TableCell align="center" width={64}>
                        เลือก
                      </TableCell>
                      <TableCell>รายการใบเสนอราคา</TableCell>
                      <TableCell align="center">จำนวน</TableCell>
                      <TableCell align="center">วิธีการขนส่ง</TableCell>
                      <TableCell align="center">ราคาต่อหน่วย</TableCell>
                      <TableCell align="center">รวม</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {quotationItems.map((quotationItem, index) => {
                      const row = confirmQuotationRows[index];
                      console.log('Row: ', row);
                      const fallbackShippingMethod =
                        inferQuotationItemShippingMethod(quotationItem.name) || 'LAND';
                      const optionLabel = row?.detail?.optionName || `Option ${index + 1}`;
                      const shippingMethodLabel = getShippingMethodLabel(
                        row?.shippingMethod || fallbackShippingMethod
                      );
                      const rowCurrency = 'THB';
                      const unitPrice = quotationItem.unitPrice;
                      const amount = quotationItem.amount;
                      const rowKey = row?.key || `quotation:${quotationItem.id}:${index}`;

                      return (
                        <TableRow
                          key={rowKey}
                          hover
                          selected={selectedConfirmRfqTierKey === rowKey}
                          onClick={() => setSelectedConfirmRfqTierKey(rowKey)}
                          sx={{ cursor: 'pointer' }}>
                          <TableCell align="center">
                            <Radio
                              checked={selectedConfirmRfqTierKey === rowKey}
                              value={rowKey}
                              onChange={(event) => setSelectedConfirmRfqTierKey(event.target.value)}
                              inputProps={{
                                'aria-label': `${quotationItem.name || optionLabel} ${formatQuantity(
                                  quotationItem.quantity
                                )} ${shippingMethodLabel} ${formatPrice(unitPrice, rowCurrency)}`
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Stack spacing={0.5}>
                              <Typography variant="body2" fontWeight={700}>
                                {quotationItem.name || optionLabel}
                              </Typography>
                              {quotationItem.spec ? (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ whiteSpace: 'pre-line' }}>
                                  {row?.detail.spec}
                                </Typography>
                              ) : null}
                            </Stack>
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>
                            {formatQuantity(quotationItem.quantity)}
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.75} alignItems="center">
                              <Typography variant="body2">{shippingMethodLabel}</Typography>
                              {(row?.shippingMethod || fallbackShippingMethod) === 'SEA' ? (
                                <DirectionsBoat fontSize="small" sx={{ color: '#00897b' }} />
                              ) : (
                                <LocalShipping fontSize="small" sx={{ color: '#1565c0' }} />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>
                            {formatPrice(unitPrice, rowCurrency)}
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>
                            {formatPrice(amount, rowCurrency)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <Box
                sx={{
                  border: '1px dashed #cbd5e1',
                  borderRadius: 3,
                  py: 4,
                  px: 2,
                  textAlign: 'center',
                  backgroundColor: '#f8fafc'
                }}>
                <Typography variant="body1" fontWeight={600}>
                  ยังไม่มีรายการใบเสนอราคาสำหรับคอนเฟิร์มราคา
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setVisibleConfirmRfqDialog(false)}
            className="btn-crimson-red"
            variant="contained">
            {t('button.cancel')}
          </Button>
          <Button
            onClick={handleConfirmRfqPrice}
            className="btn-emerald-green"
            variant="contained"
            disabled={!selectedConfirmRfqTierKey}>
            {t('button.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={visibleUrgentDetailDialog}
        onClose={() => setVisibleUrgentDetailDialog(false)}
        maxWidth="sm"
        fullWidth>
        <DialogTitle>รายละเอียดคำขอเร่งด่วน</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                สถานะ
              </Typography>
              <Typography variant="body1" fontWeight={700}>
                {rfq?.urgentRequestStatus === 'APPROVED'
                  ? 'เร่งด่วนอนุมัติแล้ว'
                  : rfq?.urgentRequestStatus === 'REJECTED'
                    ? 'คำขอเร่งด่วนไม่อนุมัติ'
                    : 'เร่งด่วนรออนุมัติ'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                เหตุผลที่ขอ
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {rfq?.urgentRequestReason || '-'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                เหตุผลที่ถูกปฏิเสธ
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {rfq?.urgentRejectReason || '-'}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVisibleUrgentDetailDialog(false)} variant="contained">
            ปิด
          </Button>
        </DialogActions>
      </Dialog>
      <CreateRFQCustomerDialog
        open={visibleCreateCustomerDialog}
        rfq={rfq}
        onClose={() => setVisibleCreateCustomerDialog(false)}
        onCreated={async (customerId) => {
          if (!params.id) {
            setVisibleCreateCustomerDialog(false);
            return;
          }

          await toast.promise(updateRFQCustomer(params.id, customerId), {
            loading: t('toast.loading'),
            success: t('toast.success'),
            error: t('toast.failed')
          });

          setVisibleCreateCustomerDialog(false);
          await refetchRFQ();

          history.push(ROUTE_PATHS.QUOTATION_CREATE_FROM_RFQ.replace(':rfqId', params.id));
        }}
      />
    </Page>
  );
}
