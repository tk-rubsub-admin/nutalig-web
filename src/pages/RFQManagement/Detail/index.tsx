import {
  Add,
  ArrowDropDown,
  ArrowBackIos,
  CheckCircle,
  DeleteOutline,
  DirectionsBoat,
  Download,
  ExpandLess,
  ExpandMore,
  FilePresent,
  LocalShipping,
  Save
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
import { viewQuotation } from 'services/Document/document-api';
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
  getRFQ,
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
import Can from 'auth/Can';

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

interface ConfirmRfqTierRow {
  key: string;
  detail: RFQDetailOption;
  tier: RFQDetailTier;
  optionIndex: number;
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
  console.log('File Type : ' + fileType);
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
  console.log('xxx:', rfq);
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

const actionButtonSx = {
  minHeight: 40,
  px: 2.25,
  borderRadius: 999,
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

function formatPrice(value?: number | null): string {
  if (value === null || value === undefined) {
    return '-';
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

  const {
    data: rfq,
    isFetching: isRFQFetching,
    refetch: refetchRFQ
  } = useQuery(['rfq-detail', params.id], () => getRFQ(params.id), {
    refetchOnWindowFocus: false,
    enabled: !!params.id
  });

  const { data: activityHistory = [], isFetching: isActivityHistoryFetching } = useQuery(
    ['rfq-activity-history', params.id],
    () => getActivityHistory('RFQ', params.id),
    {
      refetchOnWindowFocus: false,
      enabled: !!params.id
    }
  );

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

  const handleOpenConfirmRfqDialog = () => {
    if (rfq?.saleOrderId) {
      history.push(ROUTE_PATHS.SALE_ORDER_DETAIL.replace(':id', rfq.saleOrderId));
      return;
    }

    if (!confirmRfqTierRows.length) {
      toast.error('ยังไม่มี Option, Tier หรือวิธีการขนส่งสำหรับคอนเฟิร์มราคา');
      return;
    }

    setSelectedConfirmRfqTierKey('');
    setVisibleConfirmRfqDialog(true);
  };

  const handleConfirmRfqPrice = () => {
    if (!selectedConfirmRfqTierKey) {
      toast.error('กรุณาเลือก Option, MOQ และวิธีการขนส่งที่ต้องการคอนเฟิร์มราคา');
      return;
    }

    const [selectedDetailId, selectedTierId, selectedShippingMethod] =
      selectedConfirmRfqTierKey.split(':');
    const selectedDetailIndex = detailOptions.findIndex(
      (detail) => detail.id === Number(selectedDetailId)
    );
    const selectedDetail = detailOptions[selectedDetailIndex];
    const selectedTier = selectedDetail?.tiers.find((tier) => tier.id === Number(selectedTierId));

    if (!selectedDetail || !selectedTier) {
      toast.error('ไม่พบข้อมูล Option หรือ MOQ ที่เลือก');
      return;
    }

    const optionLabel = selectedDetail.optionName || `Option ${selectedDetailIndex + 1}`;
    const shippingLabel = selectedShippingMethod === 'SEA' ? 'ส่งทางเรือ' : 'ส่งทางรถ';
    const selectedPrice =
      selectedShippingMethod === 'SEA' ? selectedTier.seaTotalPrice : selectedTier.landTotalPrice;

    const query = new URLSearchParams({
      detailId: String(selectedDetail.id),
      tierId: String(selectedTier.id),
      shippingMethod: selectedShippingMethod
    });

    setVisibleConfirmRfqDialog(false);
    toast.success(
      `เลือก ${optionLabel} MOQ ${formatQuantity(selectedTier.quantity)} ${shippingLabel} ราคา ${formatPrice(selectedPrice)}`
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
  const confirmRfqTierRows = useMemo<ConfirmRfqTierRow[]>(() => {
    return detailOptions.flatMap((detail, optionIndex) => {
      const sortedTiers = [...(detail.tiers || [])].sort(
        (left, right) => left.sortOrder - right.sortOrder
      );

      return sortedTiers.map((tier) => ({
        key: getConfirmRfqTierKey(detail.id, tier.id, 'LAND'),
        detail,
        tier,
        optionIndex
      }));
    });
  }, [detailOptions]);
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
    field: 'quantity' | 'productPrice' | 'landFreightCost' | 'seaFreightCost',
    value: string
  ) => {
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
            [field]: Number.isNaN(nextValue) ? 0 : nextValue
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
      <PageTitle title={rfq?.id || 'RFQ Detail'}>
        <Stack direction="row" spacing={1} alignItems="center" useFlexGap>
          {rfq?.status ? (
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
      <Wrapper>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="flex-end" spacing={1} flexWrap="wrap" useFlexGap>
            {rfq?.status === 'QUOTED' ? (
              <Can permission={PERMISSIONS.RFQ_CONFIRM}>
                <Button
                  variant="contained"
                  startIcon={<CheckCircle />}
                  sx={confirmPriceButtonSx}
                  onClick={handleOpenConfirmRfqDialog}>
                  คอนเฟิร์มราคา
                </Button>
              </Can>
            ) : null}
            {rfq?.saleOrderId || rfq?.quotationNo ? (
              <>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  endIcon={<ArrowDropDown />}
                  sx={actionButtonSx}
                  disabled={isQuotationDocumentLoading}
                  onClick={handleOpenDownloadMenu}
                  aria-controls={isDownloadMenuOpen ? 'rfq-download-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={isDownloadMenuOpen ? 'true' : undefined}>
                  ดาวน์โหลด
                </Button>
                <Menu
                  id="rfq-download-menu"
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
                  {rfq?.quotationNo ? (
                    <MenuItem onClick={handleDownloadQuotation} sx={{ width: '100%' }}>
                      <ListItemText primary="ใบเสนอราคา" />
                    </MenuItem>
                  ) : null}
                  {rfq?.saleOrderId ? (
                    <MenuItem onClick={handleDownloadSalesOrder} sx={{ width: '100%' }}>
                      <ListItemText primary="ใบยืนยันสั่งซื้อ" />
                    </MenuItem>
                  ) : null}
                </Menu>
              </>
            ) : rfq?.status === 'QUOTED' ? (
              <Button
                variant="contained"
                startIcon={<FilePresent />}
                sx={actionButtonSx}
                onClick={handleRequestQuotation}>
                ขอใบเสนอราคา
              </Button>
            ) : null}
            <Button
              variant="contained"
              className="btn-cool-grey"
              startIcon={<ArrowBackIos />}
              sx={actionButtonSx}
              onClick={() => history.push('/rfq-management')}>
              {t('button.back')}
            </Button>
          </Stack>
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
              <Tab value="history" label="History" />
            </Tabs>
          </Box>

          <TabPanel value="detail" currentTab={tab}>
            <>
              <CollapsibleWrapper
                title="รายละเอียดการขอราคา"
                defaultExpanded
                action={
                  isSalesPermission && rfq?.status !== 'QUOTED' ? (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap>
                      <Button
                        variant="contained"
                        className="btn-cool-grey"
                        sx={actionButtonSx}
                        onClick={handleCancelEdit}
                        disabled={formik.isSubmitting || isPictureSubmitting}>
                        {t('button.clear')}
                      </Button>
                      <Button
                        variant="contained"
                        className="btn-emerald-green"
                        startIcon={<Save />}
                        sx={actionButtonSx}
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
                                              {formatPrice(tier.landTotalPrice)}
                                            </TableCell>
                                            <TableCell
                                              align="right"
                                              sx={{ fontWeight: 700, color: '#00897b' }}>
                                              {formatPrice(tier.seaTotalPrice)}
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
                                          {formatPrice(tier.productPrice)}
                                        </TableCell>
                                        <TableCell align="right">
                                          {formatPrice(tier.landFreightCost)}
                                        </TableCell>
                                        <TableCell
                                          align="right"
                                          sx={{ fontWeight: 700, color: '#1565c0' }}>
                                          {formatPrice(tier.landTotalPrice)}
                                        </TableCell>
                                        <TableCell align="right">
                                          {formatPrice(tier.seaFreightCost)}
                                        </TableCell>
                                        <TableCell
                                          align="right"
                                          sx={{ fontWeight: 700, color: '#00897b' }}>
                                          {formatPrice(tier.seaTotalPrice)}
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
                                              {formatPrice(tier.landTotalPrice)}
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
                                              {formatPrice(tier.seaTotalPrice)}
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
                                          {formatPrice(tier.productPrice)}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">
                                          ค่าขนส่งทางรถ
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                          {formatPrice(tier.landFreightCost)}
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
                                          {formatPrice(tier.landTotalPrice)}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">
                                          ค่าขนส่งทางเรือ
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                          {formatPrice(tier.seaFreightCost)}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={12}>
                                        <Typography variant="caption" color="text.secondary">
                                          รวมทางเรือ
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          fontWeight={700}
                                          color="#00897b">
                                          {formatPrice(tier.seaTotalPrice)}
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
              เลือก Option, MOQ และวิธีการขนส่งที่ต้องการใช้สำหรับคอนเฟิร์มราคา
            </Typography>
            {confirmRfqTierRows.length ? (
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
                      <TableCell align="center">MOQ</TableCell>
                      <TableCell align="center">วิธีการขนส่งสินค้า</TableCell>
                      <TableCell align="center">ราคาสินค้า</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailOptions.map((detail, optionIndex) => {
                      const sortedTiers = [...(detail.tiers || [])].sort(
                        (left, right) => left.sortOrder - right.sortOrder
                      );

                      return (
                        <Fragment key={detail.id}>
                          <TableRow
                            key={`option-${detail.id}`}
                            sx={{
                              '& td': {
                                backgroundColor: '#eef6ff',
                                borderBottom: '1px solid #cfe4ff'
                              }
                            }}>
                            <TableCell colSpan={4}>
                              <Stack spacing={0.5}>
                                <Typography variant="body2" fontWeight={800} color="#185ea8">
                                  {detail.optionName || `Option ${optionIndex + 1}`}
                                </Typography>
                                {detail.spec ? (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ whiteSpace: 'pre-line' }}>
                                    {detail.spec}
                                  </Typography>
                                ) : null}
                              </Stack>
                            </TableCell>
                          </TableRow>
                          {sortedTiers.length ? (
                            sortedTiers.map((tier) => {
                              const landKey = getConfirmRfqTierKey(detail.id, tier.id, 'LAND');
                              const seaKey = getConfirmRfqTierKey(detail.id, tier.id, 'SEA');
                              const optionLabel = detail.optionName || `Option ${optionIndex + 1}`;

                              return (
                                <Fragment key={`${detail.id}-${tier.id}`}>
                                  <TableRow
                                    hover
                                    selected={selectedConfirmRfqTierKey === landKey}
                                    onClick={() => setSelectedConfirmRfqTierKey(landKey)}
                                    sx={{
                                      cursor: 'pointer'
                                    }}>
                                    <TableCell align="center">
                                      <Radio
                                        checked={selectedConfirmRfqTierKey === landKey}
                                        value={landKey}
                                        onChange={(event) =>
                                          setSelectedConfirmRfqTierKey(event.target.value)
                                        }
                                        inputProps={{
                                          'aria-label': `${optionLabel} MOQ ${formatQuantity(tier.quantity)} ส่งทางรถ ${formatPrice(tier.landTotalPrice)}`
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                                      {formatQuantity(tier.quantity)}
                                    </TableCell>
                                    <TableCell>
                                      <Stack direction="row" spacing={0.75} alignItems="center">
                                        <Typography variant="body2">ส่งทางรถ</Typography>
                                        <LocalShipping fontSize="small" sx={{ color: '#1565c0' }} />
                                      </Stack>
                                    </TableCell>
                                    <TableCell
                                      align="center"
                                      sx={{ fontWeight: 700, color: '#1565c0' }}>
                                      {formatPrice(tier.landTotalPrice)}
                                    </TableCell>
                                  </TableRow>
                                  <TableRow
                                    hover
                                    selected={selectedConfirmRfqTierKey === seaKey}
                                    onClick={() => setSelectedConfirmRfqTierKey(seaKey)}
                                    sx={{
                                      cursor: 'pointer'
                                    }}>
                                    <TableCell align="center">
                                      <Radio
                                        checked={selectedConfirmRfqTierKey === seaKey}
                                        value={seaKey}
                                        onChange={(event) =>
                                          setSelectedConfirmRfqTierKey(event.target.value)
                                        }
                                        inputProps={{
                                          'aria-label': `${optionLabel} MOQ ${formatQuantity(tier.quantity)} ส่งทางเรือ ${formatPrice(tier.seaTotalPrice)}`
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                                      {formatQuantity(tier.quantity)}
                                    </TableCell>
                                    <TableCell>
                                      <Stack direction="row" spacing={0.75} alignItems="center">
                                        <Typography variant="body2">ส่งทางเรือ</Typography>
                                        <DirectionsBoat fontSize="small" sx={{ color: '#00897b' }} />
                                      </Stack>
                                    </TableCell>
                                    <TableCell
                                      align="center"
                                      sx={{ fontWeight: 700, color: '#00897b' }}>
                                      {formatPrice(tier.seaTotalPrice)}
                                    </TableCell>
                                  </TableRow>
                                </Fragment>
                              );
                            })
                          ) : (
                            <TableRow key={`empty-${detail.id}`}>
                              <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary' }}>
                                ยังไม่มี MOQ ใน Option นี้
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
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
                  ยังไม่มี Option, Tier หรือวิธีการขนส่งสำหรับคอนเฟิร์มราคา
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
      <CreateRFQCustomerDialog
        open={visibleCreateCustomerDialog}
        rfq={rfq}
        onClose={() => setVisibleCreateCustomerDialog(false)}
        onCreated={async () => {
          setVisibleCreateCustomerDialog(false);
          await refetchRFQ();
        }}
      />
    </Page>
  );
}
