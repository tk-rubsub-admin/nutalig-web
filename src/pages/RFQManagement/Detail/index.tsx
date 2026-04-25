import { Add, ArrowBackIos, DeleteOutline, ExpandLess, ExpandMore, Save } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  Grid,
  IconButton,
  MenuItem,
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
import { ROLES } from 'auth/roles';
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
import { ReactElement, SyntheticEvent, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import * as Yup from 'yup';
import { getActivityHistory } from 'services/ActivityHistory/activity-history-api';
import { getSystemConfig } from 'services/Config/config-api';
import { SystemConfig } from 'services/Config/config-type';
import { getProductFamilies } from 'services/Product/product-api';
import { ProductFamily } from 'services/Product/product-type';
import {
  createRFQAdditionalCosts,
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
  RFQRecord
} from 'services/RFQ/rfq-type';

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

  return productFamily.nameTh || productFamily.nameEn || productFamily.code || '';
}

function getEmployeeLabel(employee?: RFQEmployee | null): string {
  if (!employee) {
    return '';
  }

  const employeeId = employee.employeeId || employee.salesId || '';
  const nickname = employee.nickName || employee.nickname || '';
  const name = [employee.firstNameTh, employee.lastNameTh]
    .filter(Boolean)
    .join(' ');

  return [employeeId, nickname ? `- ${nickname}` : '', name ? `(${name})` : '']
    .filter(Boolean)
    .join(' ');
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
  console.log('File Type : ' + fileType)
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
  console.log('xxx:', rfq)
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
    productUsage: rfq?.productUsage || '',
    systemMechanic: rfq?.systemMechanic || '',
    material: rfq?.material || '',
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
      tierError.landFreightCost = `Tier ${index + 1}: ค่าขนส่งทางบกต้องเป็น 0 หรือมากกว่า`;
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
  const { getRole } = useAuth();
  const roleCode = getRole();
  const [tab, setTab] = useState<'detail' | 'history'>('detail');
  const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
  const [visibleDetailSaveConfirmationDialog, setVisibleDetailSaveConfirmationDialog] =
    useState(false);
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
  const isSalesPermission = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SALES].includes(roleCode);
  const isProcurementPermission = [ROLES.SUPER_ADMIN, ROLES.PROCUREMENT].includes(roleCode);

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

  const { data: productFamilyList = [] } = useQuery(
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
      systemMechanic: Yup.string().max(255).required(t('rfqManagement.validation.systemMechanic')),
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

  const productFamilyLabel = useMemo(() => {
    return productFamilyList.find(
      (item: ProductFamily) => item.code === formik.values.productFamily
    )?.nameTh;
  }, [formik.values.productFamily, productFamilyList]);

  const detailOptions = useMemo(
    () => getSortedDetailOptions([...(rfq?.details || []), ...draftDetailOptions]),
    [draftDetailOptions, rfq?.details]
  );
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
          isRFQFetching || isActivityHistoryFetching || formik.isSubmitting || isPictureSubmitting
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
          <Stack direction="row" justifyContent="flex-end">
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
                  isSalesPermission ? (
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
                      value={
                        formik.values.productFamily ||
                        productFamilyLabel ||
                        getProductFamilyLabel(rfq?.productFamily)
                      }
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={Boolean(formik.touched.productFamily && formik.errors.productFamily)}
                      helperText={formik.touched.productFamily && formik.errors.productFamily}
                      InputLabelProps={{ shrink: true }}
                      disabled={!isSalesPermission}>
                      {productFamilyList.map((productFamily: ProductFamily) => (
                        <MenuItem key={productFamily.code} value={productFamily.code}>
                          {productFamily.nameTh || productFamily.nameEn || productFamily.code}
                        </MenuItem>
                      ))}
                    </TextField>
                  </GridTextField>

                  <GridTextField item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Product Usage"
                      name="productUsage"
                      value={formik.values.productUsage}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={Boolean(formik.touched.productUsage && formik.errors.productUsage)}
                      helperText={formik.touched.productUsage && formik.errors.productUsage}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ readOnly: !isSalesPermission }}
                    />
                  </GridTextField>
                  <GridTextField item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="System Mechanic"
                      name="systemMechanic"
                      value={formik.values.systemMechanic}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={Boolean(formik.touched.systemMechanic && formik.errors.systemMechanic)}
                      helperText={formik.touched.systemMechanic && formik.errors.systemMechanic}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ readOnly: !isSalesPermission }}
                    />
                  </GridTextField>
                  <GridTextField item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Material"
                      name="material"
                      value={formik.values.material}
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
                          ? `${dayjs(rfq.createdDate).format('DD/MM/YYYY HH:mm')} By ${rfq?.createdBy || '-'}`
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
                          ? `${dayjs(rfq.updatedDate).format('DD/MM/YYYY HH:mm')} By ${rfq?.updatedBy || '-'}`
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
                      isDisabled={
                        !isSalesPermission ||
                        isPictureSubmitting ||
                        pictureResources.length >= 5
                      }
                      readOnly={!isSalesPermission}
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
              <CollapsibleWrapper
                title="ตัวเลือกราคา"
                defaultExpanded
                action={
                  isProcurementPermission ? (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Add />}
                        className="btn-emerald-green"
                        sx={actionButtonSx}
                        onClick={handleAddDetailOption}
                        disabled={formik.isSubmitting || isPictureSubmitting}>
                        เพิ่มตัวเลือกราคา
                      </Button>
                      {hasDraftDetailOptions ? (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Save />}
                          className="btn-emerald-green"
                          sx={actionButtonSx}
                          onClick={() => setVisibleDetailSaveConfirmationDialog(true)}
                          disabled={formik.isSubmitting || isPictureSubmitting}>
                          บันทึกตัวเลือกราคา
                        </Button>
                      ) : null}
                    </Stack>
                  ) : null
                }>
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
                              {isProcurementPermission ? (
                                <IconButton
                                  size="small"
                                  onClick={() => setSelectedDetailToDelete(detail)}
                                  disabled={formik.isSubmitting || isPictureSubmitting}
                                  sx={{
                                    color: '#c62828',
                                    backgroundColor: '#fff5f5',
                                    border: '1px solid #ffd7d7',
                                    '&:hover': {
                                      backgroundColor: '#ffe5e5'
                                    }
                                  }}>
                                  <DeleteOutline fontSize="small" />
                                </IconButton>
                              ) : null}
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
                                        <TableCell>ค่าขนส่งทางบก</TableCell>
                                        <TableCell>ค่าขนส่งทางเรือ</TableCell>
                                        <TableCell align="right">รวมทางบก</TableCell>
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
                                      <TableCell align="right">ค่าขนส่งทางบก</TableCell>
                                      <TableCell align="right">รวมทางบก</TableCell>
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

                            <Stack
                              spacing={1.5}
                              sx={{ display: { xs: 'flex', md: 'none' }, p: 2 }}>
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
                                              helperText={detailError.tierErrors?.[tier.id]?.quantity}
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
                                              label="ค่าขนส่งทางบก"
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
                                              รวมทางบก
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
                                          ค่าขนส่งทางบก
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                          {formatPrice(tier.landFreightCost)}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">
                                          รวมทางบก
                                        </Typography>
                                        <Typography variant="body2" fontWeight={700} color="#1565c0">
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
                                        <Typography variant="body2" fontWeight={700} color="#00897b">
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
              <CollapsibleWrapper
                title="รายละเอียดเพิ่มเติม"
                defaultExpanded
                action={
                  isProcurementPermission ? (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Add />}
                        className="btn-emerald-green"
                        sx={actionButtonSx}
                        onClick={handleAddAdditionalCost}
                        disabled={formik.isSubmitting || isPictureSubmitting}>
                        เพิ่มรายละเอียด
                      </Button>
                      {draftAdditionalCosts.length ? (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Save />}
                          className="btn-emerald-green"
                          sx={actionButtonSx}
                          onClick={handleSaveAdditionalCosts}
                          disabled={formik.isSubmitting || isPictureSubmitting}>
                          บันทึก
                        </Button>
                      ) : null}
                    </Stack>
                  ) : null
                }>
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
                          {isProcurementPermission ? (
                            <TableCell align="center" width="88">
                              จัดการ
                            </TableCell>
                          ) : null}
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
                            {isProcurementPermission ? (
                              <TableCell align="center">
                                <IconButton
                                  size="small"
                                  onClick={() => setSelectedAdditionalCostToDelete(additionalCost)}
                                  disabled={formik.isSubmitting || isPictureSubmitting}
                                  sx={{
                                    color: '#c62828',
                                    backgroundColor: '#fff5f5',
                                    border: '1px solid #ffd7d7',
                                    '&:hover': {
                                      backgroundColor: '#ffe5e5'
                                    }
                                  }}>
                                  <DeleteOutline fontSize="small" />
                                </IconButton>
                              </TableCell>
                            ) : null}
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
                            {isProcurementPermission ? (
                              <TableCell align="center">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteDraftAdditionalCost(additionalCost.id)}
                                  sx={{
                                    color: '#c62828',
                                    backgroundColor: '#fff5f5',
                                    border: '1px solid #ffd7d7',
                                    '&:hover': {
                                      backgroundColor: '#ffe5e5'
                                    }
                                  }}>
                                  <DeleteOutline fontSize="small" />
                                </IconButton>
                              </TableCell>
                            ) : null}
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
        message={`คุณยืนยันลบ ${selectedAdditionalCostToDelete?.description || 'รายละเอียดเพิ่มเติม'} ใช่หรือไม่`}
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        isShowCancelButton
        isShowConfirmButton
        onConfirm={handleDeleteAdditionalCost}
        onCancel={() => setSelectedAdditionalCostToDelete(null)}
      />
    </Page>
  );
}
