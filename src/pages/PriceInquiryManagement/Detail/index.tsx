import {
  Add,
  ArrowBackIos,
  ContentCopy,
  DeleteOutline,
  ExpandLess,
  ExpandMore,
  InfoOutlined,
  Save
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  Tooltip,
  Typography
} from '@mui/material';
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
import { ChangeEvent, ReactElement, SyntheticEvent, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import * as Yup from 'yup';
import { ROLES } from 'auth/roles';
import { useAuth } from 'auth/AuthContext';
import { getActivityHistory } from 'services/ActivityHistory/activity-history-api';
import { getSystemConfig } from 'services/Config/config-api';
import { SystemConfig } from 'services/Config/config-type';
import { getProductFamilies } from 'services/Product/product-api';
import { ProductFamily, ProductSubtype1, ProductSubtype2 } from 'services/Product/product-type';
import {
  createRFQAdditionalCosts,
  addRFQPictures,
  createRFQDetails,
  createRFQSupplierQuote,
  deleteRFQAdditionalCost,
  deleteRFQDetail,
  deleteRFQPicture,
  generateRFQInquiry,
  getRFQ,
  getRFQSuggestSuppliers,
  getRFQSupplierQuotes,
  updateRFQInquiry,
  updateRFQ,
  updateRFQSupplierQuote
} from 'services/RFQ/rfq-api';
import {
  RFQAdditionalCost,
  CreateRFQAdditionalCostRequest,
  CreateRFQDetailRequest,
  RFQDetailOption,
  RFQDetailTier,
  RFQEmployee,
  RFQFileResource,
  RFQInquiryMessage,
  RFQProductMaterial,
  RFQRecord,
  RFQSupplierQuote,
  RFQSupplierQuoteAdditionalCost,
  RFQSupplierQuoteDetail,
  UpsertRFQSupplierQuoteRequest
} from 'services/RFQ/rfq-type';
import {
  Supplier,
  SupplierCapability,
  SupplierCapabilityMaterial,
  SupplierContact
} from 'services/Supplier/supplier-type';
import { copyText } from 'utils/copyContent';

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

interface FinalPriceDraftTier {
  id: number;
  quantity: number;
  productPrice: number;
  landFreightCost: string;
  seaFreightCost: string;
  sortOrder: number;
}

interface FinalPriceDraftDetail {
  id: number;
  optionName: string;
  spec: string;
  sortOrder: number;
  tiers: FinalPriceDraftTier[];
}

interface FinalPriceDraft {
  details: FinalPriceDraftDetail[];
  additionalCosts: DraftAdditionalCost[];
  remark: string;
}

interface FinalPriceDraftErrors {
  details?: Record<number, DraftDetailTierError>;
}

interface DraftSupplierQuoteDetail extends RFQDetailOption {
  rfqDetailId?: number | null;
}

interface SupplierQuoteComparisonRow {
  key: string;
  quantity: number;
  values: Record<
    string,
    {
      productPrice: number;
      landFreightCost: number;
      seaFreightCost: number;
      landTotalPrice: number;
      seaTotalPrice: number;
    }
  >;
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

function getRFQProductSubtype1Value(rfq?: RFQRecord): string {
  if (rfq?.productSubtype1) {
    return (
      rfq.productSubtype1.nameTh || rfq.productSubtype1.nameEn || rfq.productSubtype1.code || ''
    );
  }

  return rfq?.productUsage || '';
}

function getRFQProductSubtype2Value(rfq?: RFQRecord): string {
  if (rfq?.productSubType2) {
    return (
      rfq.productSubType2.nameTh || rfq.productSubType2.nameEn || rfq.productSubType2.code || ''
    );
  }

  return rfq?.systemMechanic || '';
}

function getRFQMaterialValue(material?: RFQProductMaterial | string | null): string {
  if (!material) {
    return '';
  }

  if (typeof material === 'string') {
    return material;
  }

  if (material.nameTh && material.nameEn) {
    return `${material.nameTh} (${material.nameEn})`;
  }

  return material.nameTh || material.nameEn || material.code || '';
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

function getDefaultContact(supplier?: Supplier | null): SupplierContact | undefined {
  return supplier?.contacts?.find((contact) => contact.isDefault) || supplier?.contacts?.[0];
}

function getCapabilityFamilyLabel(capability?: SupplierCapability | null): string {
  const productFamily = capability?.productFamily;

  if (!productFamily) {
    return capability?.productFamilyCode || '-';
  }

  if (productFamily.nameTh && productFamily.nameEn) {
    return `${productFamily.nameTh} (${productFamily.nameEn})`;
  }

  return productFamily.nameTh || productFamily.nameEn || productFamily.code || '-';
}

function getCapabilityMaterialLabel(material?: SupplierCapabilityMaterial | null): string {
  const productMaterial = material?.productMaterial;

  if (!productMaterial) {
    return material?.productMaterialCode || '-';
  }

  if (productMaterial.nameTh && productMaterial.nameEn) {
    return `${productMaterial.nameTh} (${productMaterial.nameEn})`;
  }

  return productMaterial.nameTh || productMaterial.nameEn || productMaterial.code || '-';
}

function normalizeCompareValue(value?: string | null): string {
  return (value || '').trim().toLowerCase();
}

function isCapabilityMaterialMatched(
  material: SupplierCapabilityMaterial,
  rfqMaterial: RFQProductMaterial | string | null
): boolean {
  const normalizedRFQMaterialValues = (() => {
    if (!rfqMaterial) {
      return [];
    }

    if (typeof rfqMaterial === 'string') {
      return [normalizeCompareValue(rfqMaterial)].filter(Boolean);
    }

    return [rfqMaterial.code, rfqMaterial.nameTh, rfqMaterial.nameEn]
      .map((value) => normalizeCompareValue(value))
      .filter(Boolean);
  })();

  if (!normalizedRFQMaterialValues.length) {
    return true;
  }

  const productMaterial = material.productMaterial;
  const candidates = [
    material.productMaterialCode,
    productMaterial?.code,
    productMaterial?.nameTh,
    productMaterial?.nameEn
  ]
    .map((value) => normalizeCompareValue(value))
    .filter(Boolean);

  return normalizedRFQMaterialValues.some((value) => candidates.includes(value));
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
    productUsage: getRFQProductSubtype1Value(rfq),
    systemMechanic: getRFQProductSubtype2Value(rfq),
    material: getRFQMaterialValue(rfq?.material),
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

const blueActionButtonSx = {
  ...actionButtonSx,
  backgroundColor: '#1976d2',
  color: '#fff',
  '&:hover': {
    backgroundColor: '#1565c0',
    boxShadow: 'none'
  }
};

const outlinedBlueActionButtonSx = {
  ...outlinedActionButtonSx,
  borderColor: '#1976d2',
  color: '#1976d2',
  '&:hover': {
    borderColor: '#1565c0',
    backgroundColor: '#e3f2fd',
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

function parsePriceInput(value: string): number | null {
  const normalizedValue = value.replace(/,/g, '').trim();
  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number(normalizedValue);
  return Number.isNaN(parsedValue) ? null : parsedValue;
}

function createFinalPriceDraftFromQuote(quote: RFQSupplierQuote): FinalPriceDraft {
  return {
    details: quote.details.map((detail, detailIndex) => ({
      id: detail.id || -(Date.now() + detailIndex + 1),
      optionName: detail.optionName || `Option ${detailIndex + 1}`,
      spec: detail.spec || '',
      sortOrder: detail.sortOrder || detailIndex + 1,
      tiers: detail.tiers.map((tier, tierIndex) => ({
        id: tier.id || -(Date.now() + detailIndex * 100 + tierIndex + 1),
        quantity: tier.quantity,
        productPrice: tier.productPrice,
        landFreightCost: '',
        seaFreightCost: '',
        sortOrder: tier.sortOrder || tierIndex + 1
      }))
    })),
    additionalCosts: [],
    remark: ''
  };
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

function getSupplierDisplayName(supplier?: Supplier | null): string {
  if (!supplier) {
    return '-';
  }

  return (
    supplier.supplierName || supplier.supplierCode || supplier.supplierId || supplier.id || '-'
  );
}

function buildSupplierQuoteComparisonRows(
  quotes: RFQSupplierQuote[]
): SupplierQuoteComparisonRow[] {
  const rows: Record<string, SupplierQuoteComparisonRow> = {};

  quotes.forEach((quote) => {
    const supplierId = quote.supplier?.supplierId || quote.supplier?.id;
    if (!supplierId) {
      return;
    }

    quote.details.forEach((detail) => {
      detail.tiers.forEach((tier) => {
        const rowKey = String(tier.quantity);

        if (!rows[rowKey]) {
          rows[rowKey] = {
            key: rowKey,
            quantity: tier.quantity,
            values: {}
          };
        }

        const currentValue = rows[rowKey].values[supplierId];
        const nextValue = {
          productPrice: tier.productPrice,
          landFreightCost: tier.landFreightCost,
          seaFreightCost: tier.seaFreightCost,
          landTotalPrice: tier.landTotalPrice,
          seaTotalPrice: tier.seaTotalPrice
        };

        if (!currentValue || nextValue.seaTotalPrice < currentValue.seaTotalPrice) {
          rows[rowKey].values[supplierId] = nextValue;
        }
      });
    });
  });

  return Object.values(rows).sort((left, right) => left.quantity - right.quantity);
}

function getLowestSupplierQuotePrice(
  row: SupplierQuoteComparisonRow,
  quotes: RFQSupplierQuote[],
  priceKey: keyof SupplierQuoteComparisonRow['values'][string]
): number | null {
  const prices = quotes
    .map((quote) => {
      const supplierId = quote.supplier?.supplierId || quote.supplier?.id;
      return supplierId ? row.values[supplierId]?.[priceKey] : undefined;
    })
    .filter((price): price is number => typeof price === 'number' && price > 0);

  return prices.length ? Math.min(...prices) : null;
}

function formatSupplierQuoteAdditionalCost(additionalCost: RFQSupplierQuoteAdditionalCost): string {
  return [additionalCost.description, additionalCost.value, additionalCost.unit]
    .filter(Boolean)
    .join(' ');
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

function createSupplierQuoteDetailFromRFQDetail(detail: RFQDetailOption): DraftSupplierQuoteDetail {
  return {
    ...detail,
    id: -Date.now() - detail.id,
    rfqDetailId: detail.id > 0 ? detail.id : null,
    tiers: detail.tiers.map((tier, index) => ({
      ...tier,
      id: -(Date.now() + detail.id + index + 1),
      sortOrder: index + 1
    }))
  };
}

function createSupplierQuoteDetailFromQuote(
  detail: RFQSupplierQuoteDetail
): DraftSupplierQuoteDetail {
  return {
    id: detail.id || -Date.now(),
    rfqDetailId: detail.rfqDetailId || null,
    optionName: detail.optionName || '',
    spec: detail.spec || '',
    sortOrder: detail.sortOrder,
    remark: detail.remark || '',
    tiers: detail.tiers.map((tier, index) => ({
      id: tier.id || -(Date.now() + index + 1),
      quantity: tier.quantity,
      productPrice: tier.productPrice,
      landFreightCost: tier.landFreightCost,
      seaFreightCost: tier.seaFreightCost,
      landTotalPrice: tier.landTotalPrice,
      seaTotalPrice: tier.seaTotalPrice,
      sortOrder: tier.sortOrder,
      createdDate: tier.createdDate || '',
      updatedDate: tier.updatedDate || ''
    })),
    createdDate: detail.createdDate || '',
    updatedDate: detail.updatedDate || '',
    createdBy: '',
    updatedBy: ''
  };
}

function createSupplierQuoteAdditionalCostFromQuote(
  additionalCost: RFQSupplierQuoteAdditionalCost
): DraftAdditionalCost {
  return {
    id: additionalCost.id || -Date.now(),
    description: additionalCost.description || '',
    value: additionalCost.value || '',
    unit: additionalCost.unit || ''
  };
}

function buildSupplierQuotePayload(
  supplier: Supplier,
  details: DraftSupplierQuoteDetail[],
  additionalCosts: DraftAdditionalCost[],
  quote?: RFQSupplierQuote | null
): UpsertRFQSupplierQuoteRequest {
  return {
    supplierId: supplier.supplierId || supplier.id,
    inquiryId: quote?.inquiryId || null,
    status: 'RESPONDED',
    remark: quote?.remark || null,
    details: details.map((detail, index) => ({
      rfqDetailId: detail.rfqDetailId || null,
      optionName: detail.optionName.trim(),
      spec: detail.spec.trim(),
      sortOrder: index + 1,
      remark: detail.remark?.trim() || null,
      tiers: detail.tiers.map((tier, tierIndex) => ({
        quantity: tier.quantity,
        productPrice: tier.productPrice,
        landFreightCost: tier.landFreightCost,
        seaFreightCost: tier.seaFreightCost,
        landTotalPrice: tier.productPrice + tier.landFreightCost,
        seaTotalPrice: tier.productPrice + tier.seaFreightCost,
        sortOrder: tierIndex + 1
      }))
    })),
    additionalCosts: additionalCosts
      .filter((additionalCost) => additionalCost.description.trim())
      .map((additionalCost, index) => ({
        description: additionalCost.description.trim(),
        value: additionalCost.value,
        unit: additionalCost.unit,
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
  const { hasRole } = useAuth();
  const history = useHistory();
  const canFinalPrice = hasRole(ROLES.SUPER_ADMIN);
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
  const [generatedInquiryMessage, setGeneratedInquiryMessage] = useState<RFQInquiryMessage | null>(
    null
  );
  const [editableInquiryMessage, setEditableInquiryMessage] = useState({
    thaiMessage: '',
    chineseMessage: ''
  });
  const [isGenerateInquirySubmitting, setIsGenerateInquirySubmitting] = useState(false);
  const [isUpdateInquirySubmitting, setIsUpdateInquirySubmitting] = useState(false);
  const [visibleInquiryUpdateConfirmationDialog, setVisibleInquiryUpdateConfirmationDialog] =
    useState(false);
  const [quoteDialogSupplier, setQuoteDialogSupplier] = useState<Supplier | null>(null);
  const [quoteDialogQuote, setQuoteDialogQuote] = useState<RFQSupplierQuote | null>(null);
  const [quoteDraftDetails, setQuoteDraftDetails] = useState<DraftSupplierQuoteDetail[]>([]);
  const [quoteDraftAdditionalCosts, setQuoteDraftAdditionalCosts] = useState<DraftAdditionalCost[]>(
    []
  );
  const [quoteDraftErrors, setQuoteDraftErrors] = useState<
    Record<number, DraftDetailValidationError>
  >({});
  const [supplierQuoteInfo, setSupplierQuoteInfo] = useState<RFQSupplierQuote | null>(null);
  const [finalPriceQuote, setFinalPriceQuote] = useState<RFQSupplierQuote | null>(null);
  const [visibleFinalPriceConfirmationDialog, setVisibleFinalPriceConfirmationDialog] =
    useState(false);
  const [finalPriceDraft, setFinalPriceDraft] = useState<FinalPriceDraft>({
    details: [],
    additionalCosts: [],
    remark: ''
  });
  const [finalPriceErrors, setFinalPriceErrors] = useState<FinalPriceDraftErrors>({});
  const [isSupplierQuoteSubmitting, setIsSupplierQuoteSubmitting] = useState(false);
  const [isFinalPriceSubmitting, setIsFinalPriceSubmitting] = useState(false);
  const isReadOnly = true;
  const canManageInquiryPricing = true;

  const {
    data: rfq,
    isFetching: isRFQFetching,
    refetch: refetchRFQ
  } = useQuery(['rfq-detail', params.id], () => getRFQ(params.id), {
    refetchOnWindowFocus: false,
    enabled: !!params.id
  });

  const { data: suggestSuppliers = [], isFetching: isSuggestSuppliersFetching } = useQuery(
    ['rfq-suggest-suppliers', params.id],
    () => getRFQSuggestSuppliers(params.id),
    {
      refetchOnWindowFocus: false,
      enabled: !!params.id
    }
  );

  const {
    data: supplierQuotes = [],
    isFetching: isSupplierQuotesFetching,
    refetch: refetchSupplierQuotes
  } = useQuery(['rfq-supplier-quotes', params.id], () => getRFQSupplierQuotes(params.id), {
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
    return selectedProductFamily ? getProductFamilyDisplayName(selectedProductFamily) : undefined;
  }, [selectedProductFamily]);

  const productUsageLabel = useMemo(() => {
    const selectedProductUsage = productUsageOptions.find(
      (item: ProductSubtype1) => item.code === formik.values.productUsage
    );

    return selectedProductUsage ? getProductSubtype1DisplayName(selectedProductUsage) : undefined;
  }, [formik.values.productUsage, productUsageOptions]);

  const systemMechanicLabel = useMemo(() => {
    const selectedSystemMechanic = systemMechanicOptions.find(
      (item: ProductSubtype2) => item.code === formik.values.systemMechanic
    );

    return selectedSystemMechanic
      ? getProductSubtype2DisplayName(selectedSystemMechanic)
      : undefined;
  }, [formik.values.systemMechanic, systemMechanicOptions]);

  const handleProductFamilyChange = (event: ChangeEvent<HTMLInputElement>) => {
    formik.handleChange(event);
    formik.setFieldValue('productUsage', '');
    formik.setFieldValue('systemMechanic', '');
  };

  const handleProductUsageChange = (event: ChangeEvent<HTMLInputElement>) => {
    formik.handleChange(event);
    formik.setFieldValue('systemMechanic', '');
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
  const rfqProductFamilyCode = useMemo(
    () => getProductFamilyCode(rfq?.productFamily),
    [rfq?.productFamily]
  );
  const rfqMaterial = useMemo(() => rfq?.material || null, [rfq?.material]);
  const suggestSuppliersByRFQ = useMemo(
    () =>
      suggestSuppliers
        .map((supplier) => ({
          ...supplier,
          capabilities:
            supplier.capabilities?.reduce<SupplierCapability[]>((accumulator, capability) => {
              if (rfqProductFamilyCode && capability.productFamilyCode !== rfqProductFamilyCode) {
                return accumulator;
              }

              if (capability.coversAllMaterials) {
                accumulator.push(capability);
                return accumulator;
              }

              const matchedMaterials =
                capability.materials?.filter((material) =>
                  isCapabilityMaterialMatched(material, rfqMaterial)
                ) || [];

              if (matchedMaterials.length) {
                accumulator.push({
                  ...capability,
                  materials: matchedMaterials
                });
              }

              return accumulator;
            }, []) || []
        }))
        .filter((supplier) => supplier.capabilities?.length),
    [rfqMaterial, rfqProductFamilyCode, suggestSuppliers]
  );
  const supplierQuoteBySupplierId = useMemo(() => {
    return supplierQuotes.reduce<Record<string, RFQSupplierQuote>>((accumulator, quote) => {
      const supplierId = quote.supplier?.supplierId || quote.supplier?.id;
      if (supplierId) {
        accumulator[supplierId] = quote;
      }
      return accumulator;
    }, {});
  }, [supplierQuotes]);
  const respondedSupplierQuotes = useMemo(
    () => supplierQuotes.filter((quote) => quote.details?.length),
    [supplierQuotes]
  );
  const supplierQuoteComparisonRows = useMemo(
    () => buildSupplierQuoteComparisonRows(respondedSupplierQuotes),
    [respondedSupplierQuotes]
  );
  const isInquiryMessageEdited = useMemo(() => {
    if (!generatedInquiryMessage) {
      return false;
    }

    return (
      editableInquiryMessage.thaiMessage !== (generatedInquiryMessage.thaiMessage || '') ||
      editableInquiryMessage.chineseMessage !== (generatedInquiryMessage.chineseMessage || '')
    );
  }, [editableInquiryMessage, generatedInquiryMessage]);

  const handleCloseInquiryDialog = () => {
    setGeneratedInquiryMessage(null);
    setEditableInquiryMessage({
      thaiMessage: '',
      chineseMessage: ''
    });
    setVisibleInquiryUpdateConfirmationDialog(false);
  };

  const handleConfirmUpdateInquiry = async () => {
    if (!params.id || !generatedInquiryMessage?.id) {
      return;
    }

    setVisibleInquiryUpdateConfirmationDialog(false);
    setIsUpdateInquirySubmitting(true);

    try {
      const response = await toast.promise(
        updateRFQInquiry(params.id, generatedInquiryMessage.id, editableInquiryMessage),
        {
          loading: t('toast.loading'),
          success: t('toast.success'),
          error: t('toast.failed')
        }
      );

      if (response) {
        setGeneratedInquiryMessage(response);
        setEditableInquiryMessage({
          thaiMessage: response.thaiMessage || '',
          chineseMessage: response.chineseMessage || ''
        });
      }
    } finally {
      setIsUpdateInquirySubmitting(false);
    }
  };

  const handleOpenSupplierQuoteDialog = (supplier: Supplier) => {
    const supplierId = supplier.supplierId || supplier.id;
    const existingQuote = supplierQuoteBySupplierId[supplierId] || null;

    setQuoteDialogSupplier(supplier);
    setQuoteDialogQuote(existingQuote);
    setQuoteDraftDetails(
      existingQuote?.details?.length
        ? existingQuote.details.map(createSupplierQuoteDetailFromQuote)
        : detailOptions.map(createSupplierQuoteDetailFromRFQDetail)
    );
    setQuoteDraftAdditionalCosts(
      existingQuote?.additionalCosts?.length
        ? existingQuote.additionalCosts.map(createSupplierQuoteAdditionalCostFromQuote)
        : []
    );
    setQuoteDraftErrors({});
  };

  const handleCloseSupplierQuoteDialog = () => {
    setQuoteDialogSupplier(null);
    setQuoteDialogQuote(null);
    setQuoteDraftDetails([]);
    setQuoteDraftAdditionalCosts([]);
    setQuoteDraftErrors({});
  };

  const handleOpenFinalPriceDialog = (quote: RFQSupplierQuote) => {
    setFinalPriceQuote(quote);
    setFinalPriceDraft(createFinalPriceDraftFromQuote(quote));
    setFinalPriceErrors({});
  };

  const handleCloseFinalPriceDialog = () => {
    setFinalPriceQuote(null);
    setVisibleFinalPriceConfirmationDialog(false);
    setFinalPriceDraft({
      details: [],
      additionalCosts: [],
      remark: ''
    });
    setFinalPriceErrors({});
  };

  const handleFinalPriceRemarkChange = (value: string) => {
    setFinalPriceDraft((prev) => ({ ...prev, remark: value }));
  };

  const handleFinalPriceTierChange = (
    detailId: number,
    tierId: number,
    field: 'landFreightCost' | 'seaFreightCost',
    value: string
  ) => {
    setFinalPriceDraft((prev) => ({
      ...prev,
      details: prev.details.map((detail) =>
        detail.id === detailId
          ? {
            ...detail,
            tiers: detail.tiers.map((tier) =>
              tier.id === tierId ? { ...tier, [field]: value } : tier
            )
          }
          : detail
      )
    }));
    setFinalPriceErrors((prev) => ({
      ...prev,
      details: {
        ...prev.details,
        [tierId]: {
          ...prev.details?.[tierId],
          [field]: undefined
        }
      }
    }));
  };

  const handleAddFinalPriceAdditionalCost = () => {
    setFinalPriceDraft((prev) => ({
      ...prev,
      additionalCosts: [...prev.additionalCosts, createDraftAdditionalCost()]
    }));
  };

  const handleFinalPriceAdditionalCostChange = (
    additionalCostId: number,
    field: 'description' | 'value' | 'unit',
    value: string
  ) => {
    setFinalPriceDraft((prev) => ({
      ...prev,
      additionalCosts: prev.additionalCosts.map((additionalCost) =>
        additionalCost.id === additionalCostId
          ? { ...additionalCost, [field]: value }
          : additionalCost
      )
    }));
  };

  const handleDeleteFinalPriceAdditionalCost = (additionalCostId: number) => {
    setFinalPriceDraft((prev) => ({
      ...prev,
      additionalCosts: prev.additionalCosts.filter(
        (additionalCost) => additionalCost.id !== additionalCostId
      )
    }));
  };

  const handleRequestSaveFinalPrice = () => {
    if (!params.id || !finalPriceQuote) {
      return;
    }

    const tierErrors: Record<number, DraftDetailTierError> = {};

    finalPriceDraft.details.forEach((detail) => {
      detail.tiers.forEach((tier) => {
        const landFreightCost = parsePriceInput(tier.landFreightCost);
        const seaFreightCost = parsePriceInput(tier.seaFreightCost);
        const nextTierError: DraftDetailTierError = {};

        if (landFreightCost === null || landFreightCost < 0) {
          nextTierError.landFreightCost = 'กรุณาระบุค่าขนส่งทางรถ';
        }
        if (seaFreightCost === null || seaFreightCost < 0) {
          nextTierError.seaFreightCost = 'กรุณาระบุค่าขนส่งทางเรือ';
        }

        if (Object.keys(nextTierError).length) {
          tierErrors[tier.id] = nextTierError;
        }
      });
    });

    setFinalPriceErrors({ details: tierErrors });
    if (Object.keys(tierErrors).length) {
      return;
    }

    setVisibleFinalPriceConfirmationDialog(true);
  };

  const handleConfirmSaveFinalPrice = async () => {
    if (!params.id || !finalPriceQuote) {
      return;
    }

    try {
      setIsFinalPriceSubmitting(true);
      setVisibleFinalPriceConfirmationDialog(false);
      const supplierId = finalPriceQuote.supplier?.supplierId || finalPriceQuote.supplier?.id;
      const detailPayload: CreateRFQDetailRequest[] = finalPriceDraft.details.map(
        (detail, detailIndex) => ({
          optionName: detail.optionName,
          spec: detail.spec,
          sortOrder: detailIndex + 1,
          remark: finalPriceDraft.remark.trim() || null,
          supplierId,
          tiers: detail.tiers.map((tier, tierIndex) => {
            const landFreightCost = parsePriceInput(tier.landFreightCost) || 0;
            const seaFreightCost = parsePriceInput(tier.seaFreightCost) || 0;

            return {
              quantity: tier.quantity,
              productPrice: tier.productPrice,
              landFreightCost,
              seaFreightCost,
              landTotalPrice: tier.productPrice + landFreightCost,
              seaTotalPrice: tier.productPrice + seaFreightCost,
              sortOrder: tierIndex + 1
            };
          })
        })
      );
      const supplierAdditionalCostPayload: CreateRFQAdditionalCostRequest[] = (
        finalPriceQuote.additionalCosts || []
      )
        .filter((additionalCost) => additionalCost.description && additionalCost.value)
        .map((additionalCost, index) => ({
          costTypeCode: '',
          description: additionalCost.description,
          value: additionalCost.value || '',
          unit: additionalCost.unit || '',
          sortOrder: index + 1,
          supplierId
        }));
      const addedAdditionalCostPayload: CreateRFQAdditionalCostRequest[] =
        finalPriceDraft.additionalCosts
          .filter(
            (additionalCost) =>
              additionalCost.description.trim() && additionalCost.value.trim()
          )
          .map((additionalCost, index) => ({
            costTypeCode: '',
            description: additionalCost.description.trim(),
            value: additionalCost.value.trim(),
            unit: additionalCost.unit.trim(),
            sortOrder: supplierAdditionalCostPayload.length + index + 1,
            supplierId
          }));
      const additionalCostPayload = [
        ...supplierAdditionalCostPayload,
        ...addedAdditionalCostPayload
      ];

      await toast.promise(
        (async () => {
          await createRFQDetails(params.id, detailPayload);
          if (additionalCostPayload.length) {
            await createRFQAdditionalCosts(params.id, additionalCostPayload);
          }
        })(),
        {
          loading: t('toast.loading'),
          success: t('toast.success'),
          error: t('toast.failed')
        }
      );
      await refetchRFQ();
      handleCloseFinalPriceDialog();
      setSupplierQuoteInfo(null);
    } finally {
      setIsFinalPriceSubmitting(false);
    }
  };

  const handleAddQuoteDetail = () => {
    const nextDetail = createDraftDetailOption(
      quoteDraftDetails.length + 1
    ) as DraftSupplierQuoteDetail;
    nextDetail.rfqDetailId = null;
    setQuoteDraftDetails((prev) => [...prev, nextDetail]);
  };

  const handleQuoteDetailChange = (
    detailId: number,
    field: 'optionName' | 'spec' | 'remark',
    value: string
  ) => {
    setQuoteDraftDetails((prev) =>
      prev.map((detail) => (detail.id === detailId ? { ...detail, [field]: value } : detail))
    );
    setQuoteDraftErrors((prev) => ({
      ...prev,
      [detailId]: {
        ...prev[detailId],
        [field]: undefined
      }
    }));
  };

  const handleAddQuoteTier = (detailId: number) => {
    setQuoteDraftDetails((prev) =>
      prev.map((detail) =>
        detail.id === detailId
          ? {
            ...detail,
            tiers: [...detail.tiers, createDraftTier(detail.tiers.length + 1)]
          }
          : detail
      )
    );
    setQuoteDraftErrors((prev) => ({
      ...prev,
      [detailId]: {
        ...prev[detailId],
        tiers: undefined
      }
    }));
  };

  const handleQuoteTierChange = (
    detailId: number,
    tierId: number,
    field: 'quantity' | 'productPrice' | 'landFreightCost' | 'seaFreightCost',
    value: string
  ) => {
    const nextValue = Number(value);

    setQuoteDraftDetails((prev) =>
      prev.map((detail) => {
        if (detail.id !== detailId) {
          return detail;
        }

        return {
          ...detail,
          tiers: detail.tiers.map((tier) => {
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
          })
        };
      })
    );
    setQuoteDraftErrors((prev) => ({
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

  const handleDeleteQuoteTier = (detailId: number, tierId: number) => {
    setQuoteDraftDetails((prev) =>
      prev.map((detail) =>
        detail.id === detailId
          ? {
            ...detail,
            tiers: detail.tiers
              .filter((tier) => tier.id !== tierId)
              .map((tier, index) => ({ ...tier, sortOrder: index + 1 }))
          }
          : detail
      )
    );
  };

  const handleAddQuoteAdditionalCost = () => {
    setQuoteDraftAdditionalCosts((prev) => [...prev, createDraftAdditionalCost()]);
  };

  const handleQuoteAdditionalCostChange = (
    additionalCostId: number,
    field: 'description' | 'value' | 'unit',
    value: string
  ) => {
    setQuoteDraftAdditionalCosts((prev) =>
      prev.map((item) => (item.id === additionalCostId ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveSupplierQuote = async () => {
    if (!params.id || !quoteDialogSupplier) {
      return;
    }

    if (!quoteDraftDetails.length) {
      toast.error('กรุณาเพิ่มรายการราคาที่ตอบกลับอย่างน้อย 1 รายการ');
      return;
    }

    const nextErrors = quoteDraftDetails.reduce<Record<number, DraftDetailValidationError>>(
      (accumulator, detail) => {
        const validationError = validateDraftDetail(detail);
        if (Object.keys(validationError).length) {
          accumulator[detail.id] = validationError;
        }
        return accumulator;
      },
      {}
    );
    setQuoteDraftErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    const payload = buildSupplierQuotePayload(
      quoteDialogSupplier,
      quoteDraftDetails,
      quoteDraftAdditionalCosts,
      quoteDialogQuote
    );

    try {
      setIsSupplierQuoteSubmitting(true);
      await toast.promise(
        quoteDialogQuote?.id
          ? updateRFQSupplierQuote(params.id, quoteDialogQuote.id, payload)
          : createRFQSupplierQuote(params.id, payload),
        {
          loading: t('toast.loading'),
          success: t('toast.success'),
          error: t('toast.failed')
        }
      );
      await refetchSupplierQuotes();
      handleCloseSupplierQuoteDialog();
    } finally {
      setIsSupplierQuoteSubmitting(false);
    }
  };

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

  const renderPriceOptionsSection = (): ReactElement => (
    <CollapsibleWrapper
      title="ตัวเลือกราคา"
      defaultExpanded
      action={
        canManageInquiryPricing ? (
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
                              handleDraftDetailChange(detail.id, 'optionName', event.target.value)
                            }
                          />
                        </Grid>
                      ) : (
                        <Typography>{detail.optionName || `Option ${index + 1}`}</Typography>
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
                              handleDraftDetailChange(detail.id, 'spec', event.target.value)
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
                              handleDraftDetailChange(detail.id, 'remark', event.target.value)
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
                    {canManageInquiryPricing ? (
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
                                      error={Boolean(detailError.tierErrors?.[tier.id]?.quantity)}
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
                                      helperText={detailError.tierErrors?.[tier.id]?.productPrice}
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
                                      helperText={detailError.tierErrors?.[tier.id]?.seaFreightCost}
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
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
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
                            <TableCell>ราคาสินค้า</TableCell>
                            <TableCell>ค่าขนส่งทางบก</TableCell>
                            <TableCell>ค่าขนส่งทางเรือ</TableCell>
                            <TableCell align="right">รวมทางบก</TableCell>
                            <TableCell align="right">รวมทางเรือ</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sortedTiers.map((tier) => (
                            <TableRow key={tier.id}>
                              <TableCell sx={{ fontWeight: 600 }}>
                                {formatQuantity(tier.quantity)}
                              </TableCell>
                              <TableCell>{formatPrice(tier.productPrice)}</TableCell>
                              <TableCell>{formatPrice(tier.landFreightCost)}</TableCell>
                              <TableCell>{formatPrice(tier.seaFreightCost)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: '#1565c0' }}>
                                {formatPrice(tier.landTotalPrice)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: '#00897b' }}>
                                {formatPrice(tier.seaTotalPrice)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                        ยังไม่มีช่วงราคาในตัวเลือกนี้
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: { xs: 'block', md: 'none' }, p: 2 }}>
                    <Stack spacing={1.5}>
                      {isDraftDetail ? (
                        <>
                          <Grid container spacing={1.5}>
                            <Grid item xs={12}>
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
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                size="small"
                                label="สเปค"
                                value={detail.spec}
                                InputLabelProps={{ shrink: true }}
                                error={Boolean(detailError.spec)}
                                helperText={detailError.spec}
                                onChange={(event) =>
                                  handleDraftDetailChange(detail.id, 'spec', event.target.value)
                                }
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                size="small"
                                label="หมายเหตุ"
                                value={detail.remark || ''}
                                InputLabelProps={{ shrink: true }}
                                onChange={(event) =>
                                  handleDraftDetailChange(detail.id, 'remark', event.target.value)
                                }
                              />
                            </Grid>
                          </Grid>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Add />}
                            sx={outlinedActionButtonSx}
                            onClick={() => handleAddTier(detail.id)}>
                            เพิ่ม Tier
                          </Button>
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
                                      error={Boolean(detailError.tierErrors?.[tier.id]?.quantity)}
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
                                      helperText={detailError.tierErrors?.[tier.id]?.productPrice}
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
                                      helperText={detailError.tierErrors?.[tier.id]?.seaFreightCost}
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
                                    <Typography variant="body2" fontWeight={700} color="#1565c0">
                                      {formatPrice(tier.landTotalPrice)}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                      รวมทางเรือ
                                    </Typography>
                                    <Typography variant="body2" fontWeight={700} color="#00897b">
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
                  </Box>
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
  );

  const renderAdditionalCostsSection = (): ReactElement => (
    <CollapsibleWrapper
      title="รายละเอียดเพิ่มเติม"
      defaultExpanded
      action={
        canManageInquiryPricing ? (
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
                {canManageInquiryPricing ? (
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
                  {canManageInquiryPricing ? (
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
                  {canManageInquiryPricing ? (
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
  );

  return (
    <Page>
      <LoadingDialog
        open={
          isRFQFetching ||
          isActivityHistoryFetching ||
          isSuggestSuppliersFetching ||
          isSupplierQuotesFetching ||
          formik.isSubmitting ||
          isPictureSubmitting ||
          isGenerateInquirySubmitting ||
          isUpdateInquirySubmitting ||
          isSupplierQuoteSubmitting
        }
      />
      <PageTitle title={rfq?.id || 'Price Inquiry Detail'}>
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
              onClick={() => history.push('/price-inquiry-management')}>
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
              <Tab value="detail" label="ข้อมูลการสอบถามราคา" />
              <Tab value="history" label="History" />
            </Tabs>
          </Box>

          <TabPanel value="detail" currentTab={tab}>
            <>
              <CollapsibleWrapper
                title="รายละเอียดการสอบถามราคา"
                defaultExpanded
                action={
                  !isReadOnly ? (
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
                      disabled={isReadOnly}>
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
                      onChange={handleProductFamilyChange}
                      onBlur={formik.handleBlur}
                      error={Boolean(formik.touched.productFamily && formik.errors.productFamily)}
                      helperText={formik.touched.productFamily && formik.errors.productFamily}
                      InputLabelProps={{ shrink: true }}
                      disabled={isReadOnly || isProductFamilyFetching}>
                      {isProductFamilyFetching ? (
                        <MenuItem disabled value="">
                          กำลังโหลดข้อมูล
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
                      value={
                        formik.values.productUsage || productUsageLabel || rfq?.productUsage || ''
                      }
                      onChange={handleProductUsageChange}
                      onBlur={formik.handleBlur}
                      error={Boolean(formik.touched.productUsage && formik.errors.productUsage)}
                      helperText={formik.touched.productUsage && formik.errors.productUsage}
                      InputLabelProps={{ shrink: true }}
                      disabled={
                        isReadOnly || !formik.values.productFamily || isProductFamilyFetching
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
                      value={
                        formik.values.systemMechanic ||
                        systemMechanicLabel ||
                        rfq?.systemMechanic ||
                        ''
                      }
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={Boolean(formik.touched.systemMechanic && formik.errors.systemMechanic)}
                      helperText={formik.touched.systemMechanic && formik.errors.systemMechanic}
                      InputLabelProps={{ shrink: true }}
                      disabled={
                        isReadOnly || !formik.values.productUsage || isProductFamilyFetching
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
                      value={formik.values.material}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={Boolean(formik.touched.material && formik.errors.material)}
                      helperText={formik.touched.material && formik.errors.material}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ readOnly: true }}
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
                      InputProps={{ readOnly: true }}
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
                      InputProps={{ readOnly: true }}
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
                      isDisabled
                      readOnly
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
                title={t('priceInquiryManagement.suggestSupplier.title')}
                defaultExpanded>
                {isSuggestSuppliersFetching ? (
                  <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('priceInquiryManagement.suggestSupplier.loading')}
                    </Typography>
                  </Stack>
                ) : suggestSuppliersByRFQ.length ? (
                  <Stack spacing={2}>
                    {suggestSuppliersByRFQ.map((supplier) => {
                      const defaultContact = getDefaultContact(supplier);
                      const supplierQuote =
                        supplierQuoteBySupplierId[supplier.supplierId || supplier.id];

                      return (
                        <Box
                          key={supplier.id}
                          sx={{
                            border: '1px solid #dce4ee',
                            borderRadius: 3,
                            p: 2,
                            backgroundColor: '#fff'
                          }}>
                          <Stack spacing={1.5}>
                            <Stack
                              direction={{ xs: 'column', sm: 'row' }}
                              spacing={1}
                              justifyContent="space-between"
                              alignItems={{ xs: 'flex-start', sm: 'center' }}>
                              <div>
                                <Typography variant="subtitle1" fontWeight={700}>
                                  {supplier.supplierName || '-'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {supplier.id} | {supplier.supplierCode || '-'}
                                </Typography>
                                {supplierQuote ? (
                                  <Chip
                                    size="small"
                                    label={`ตอบราคาแล้ว (${supplierQuote.details.length} รายการ)`}
                                    sx={{
                                      mt: 0.75,
                                      backgroundColor: '#e8f5e9',
                                      color: '#2e7d32',
                                      border: '1px solid #2e7d3233',
                                      fontWeight: 700
                                    }}
                                  />
                                ) : null}
                              </div>
                              <Stack spacing={1} alignItems={{ xs: 'stretch', sm: 'flex-end' }}>
                                <Button
                                  variant="contained"
                                  sx={blueActionButtonSx}
                                  disabled={isGenerateInquirySubmitting}
                                  onClick={async () => {
                                    if (!params.id) {
                                      return;
                                    }

                                    try {
                                      setIsGenerateInquirySubmitting(true);
                                      const response = await toast.promise(
                                        generateRFQInquiry(params.id, {
                                          supplierId: supplier.supplierId || supplier.id
                                        }),
                                        {
                                          loading: t('toast.loading'),
                                          success: t('toast.success'),
                                          error: t('toast.failed')
                                        }
                                      );

                                      setGeneratedInquiryMessage(response || null);
                                      setEditableInquiryMessage({
                                        thaiMessage: response?.thaiMessage || '',
                                        chineseMessage: response?.chineseMessage || ''
                                      });
                                    } finally {
                                      setIsGenerateInquirySubmitting(false);
                                    }
                                  }}>
                                  {t('priceInquiryManagement.generateInquiry.button')}
                                </Button>
                                <Button
                                  variant={supplierQuote ? 'outlined' : 'contained'}
                                  sx={
                                    supplierQuote ? outlinedBlueActionButtonSx : blueActionButtonSx
                                  }
                                  disabled={isSupplierQuoteSubmitting}
                                  onClick={() => handleOpenSupplierQuoteDialog(supplier)}>
                                  {supplierQuote ? 'แก้ไขราคา' : 'บันทึกราคา'}
                                </Button>
                              </Stack>
                            </Stack>

                            <Grid container spacing={1.5}>
                              <Grid item xs={12} md={6}>
                                <Typography variant="body2" color="text.secondary">
                                  Email
                                </Typography>
                                <Typography variant="body2">
                                  {supplier.supplierEmail || '-'}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <Typography variant="body2" color="text.secondary">
                                  Contact
                                </Typography>
                                <Typography variant="body2">
                                  {defaultContact
                                    ? `${defaultContact.contactName || '-'} | ${defaultContact.contactNumber || '-'
                                    }`
                                    : '-'}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <Typography variant="body2" color="text.secondary">
                                  WeChat
                                </Typography>
                                <Typography variant="body2">
                                  {defaultContact?.wechat || '-'}
                                </Typography>
                              </Grid>
                              <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary">
                                  Address
                                </Typography>
                                <Typography variant="body2">
                                  {supplier.fullAddress || '-'}
                                </Typography>
                              </Grid>
                            </Grid>

                            <Divider />

                            <Stack spacing={1}>
                              <Typography variant="body2" fontWeight={700}>
                                {t('priceInquiryManagement.suggestSupplier.capabilities')}
                              </Typography>
                              {supplier.capabilities?.length ? (
                                <Stack spacing={1.25}>
                                  {supplier.capabilities.map((capability) => (
                                    <Box key={capability.productFamilyCode}>
                                      <Typography variant="body2" sx={{ mb: 0.75 }}>
                                        {getCapabilityFamilyLabel(capability)}
                                      </Typography>
                                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                        {capability.coversAllMaterials ? (
                                          <Chip
                                            label={t(
                                              'priceInquiryManagement.suggestSupplier.allMaterials'
                                            )}
                                            size="small"
                                            variant="outlined"
                                          />
                                        ) : capability.materials?.length ? (
                                          capability.materials.map((material) => (
                                            <Chip
                                              key={`${capability.productFamilyCode}-${material.productMaterialCode}`}
                                              label={getCapabilityMaterialLabel(material)}
                                              size="small"
                                              variant="outlined"
                                            />
                                          ))
                                        ) : (
                                          <Typography variant="body2" color="text.secondary">
                                            -
                                          </Typography>
                                        )}
                                      </Stack>
                                    </Box>
                                  ))}
                                </Stack>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  {t('priceInquiryManagement.suggestSupplier.noCapabilities')}
                                </Typography>
                              )}
                            </Stack>
                          </Stack>
                        </Box>
                      );
                    })}
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
                      {t('priceInquiryManagement.suggestSupplier.noData')}
                    </Typography>
                  </Box>
                )}
              </CollapsibleWrapper>

              <CollapsibleWrapper title="เปรียบเทียบราคาคู่ค้า" defaultExpanded action={null}>
                {respondedSupplierQuotes.length && supplierQuoteComparisonRows.length ? (
                  <Box>
                    {rfq?.finalSupplierQuoteId ? (
                      <Box
                        sx={{
                          border: '1px solid #bbf7d0',
                          borderRadius: 2,
                          p: 2,
                          mb: 2,
                          backgroundColor: '#f0fdf4'
                        }}>
                        <Stack spacing={1}>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Chip
                              size="small"
                              label="Final แล้ว"
                              sx={{
                                backgroundColor: '#dcfce7',
                                color: '#166534',
                                fontWeight: 700
                              }}
                            />
                            <Typography variant="body2" fontWeight={700}>
                              {getSupplierDisplayName(rfq.finalSupplier)}
                            </Typography>
                          </Stack>
                          <Grid container spacing={1.5}>
                            <Grid item xs={12} md={4}>
                              <Typography variant="caption" color="text.secondary">
                                ค่าขนส่งทางรถ
                              </Typography>
                              <Typography variant="body2" fontWeight={700}>
                                {formatPrice(rfq.finalLandFreightCost)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Typography variant="caption" color="text.secondary">
                                ค่าขนส่งทางเรือ
                              </Typography>
                              <Typography variant="body2" fontWeight={700}>
                                {formatPrice(rfq.finalSeaFreightCost)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Typography variant="caption" color="text.secondary">
                                Remark / คำแนะนำ
                              </Typography>
                              <Typography variant="body2">
                                {rfq.finalRemark || '-'}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Stack>
                      </Box>
                    ) : null}
                    <Box
                      sx={{
                        border: '1px solid #dce4ee',
                        borderRadius: 3,
                        overflow: 'auto',
                        backgroundColor: '#fff'
                      }}>
                      <Table size="small" sx={{ minWidth: 760 }}>
                        <TableHead>
                          <TableRow
                            sx={{
                              '& th': {
                                fontWeight: 700,
                                backgroundColor: '#f8fafc',
                                whiteSpace: 'nowrap'
                              }
                            }}>
                            <TableCell
                              sx={{
                                position: 'sticky',
                                left: 0,
                                zIndex: 2,
                                backgroundColor: '#f8fafc',
                                minWidth: 160
                              }}>
                              MOQ
                            </TableCell>
                            {respondedSupplierQuotes.map((quote) => (
                              <TableCell key={quote.id} align="center" sx={{ minWidth: 190 }}>
                                <Stack spacing={0.25} alignItems="center">
                                  <Stack
                                    direction="row"
                                    spacing={0.5}
                                    alignItems="center"
                                    justifyContent="center">
                                    <Typography variant="body2" fontWeight={700}>
                                      {getSupplierDisplayName(quote.supplier)}
                                    </Typography>
                                    <Tooltip title="ข้อมูล supplier">
                                      <IconButton
                                        size="small"
                                        onClick={() => setSupplierQuoteInfo(quote)}
                                        sx={{ p: 0.25, color: 'text.secondary' }}>
                                        <InfoOutlined sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>
                                  <Typography variant="caption" color="text.secondary">
                                    {quote.supplier?.supplierCode || quote.supplier?.id || '-'}
                                  </Typography>
                                </Stack>
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {supplierQuoteComparisonRows.map((row) => {
                            const lowestSeaTotalPrice = getLowestSupplierQuotePrice(
                              row,
                              respondedSupplierQuotes,
                              'seaTotalPrice'
                            );

                            return (
                              <TableRow
                                key={row.key}
                                sx={{
                                  '&:nth-of-type(odd) td': {
                                    backgroundColor: '#fcfdff'
                                  }
                                }}>
                                <TableCell
                                  sx={{
                                    position: 'sticky',
                                    left: 0,
                                    zIndex: 1,
                                    backgroundColor: '#fff',
                                    minWidth: 160,
                                    verticalAlign: 'top'
                                  }}>
                                  <Chip
                                    size="small"
                                    label={formatQuantity(row.quantity)}
                                    sx={{
                                      backgroundColor: '#eef2ff',
                                      color: '#1d4ed8',
                                      fontWeight: 700
                                    }}
                                  />
                                </TableCell>
                                {respondedSupplierQuotes.map((quote) => {
                                  const supplierId =
                                    quote.supplier?.supplierId || quote.supplier?.id;
                                  const value = supplierId ? row.values[supplierId] : undefined;
                                  const isBestSeaPrice =
                                    Boolean(value) &&
                                    lowestSeaTotalPrice !== null &&
                                    value?.seaTotalPrice === lowestSeaTotalPrice;

                                  return (
                                    <TableCell
                                      key={`${row.key}-${quote.id}-comparison-value`}
                                      align="right"
                                      sx={{
                                        minWidth: 190,
                                        verticalAlign: 'top',
                                        backgroundColor: isBestSeaPrice
                                          ? '#f0fdf4 !important'
                                          : undefined,
                                        borderLeft: isBestSeaPrice
                                          ? '2px solid #22c55e'
                                          : '1px solid #eef2f7'
                                      }}>
                                      {value ? (
                                        <Stack spacing={0.75}>
                                          <Box
                                            sx={{
                                              display: 'flex',
                                              justifyContent: 'flex-end',
                                              minHeight: 22
                                            }}>
                                            {isBestSeaPrice ? (
                                              <Chip
                                                size="small"
                                                label="ถูกสุด"
                                                sx={{
                                                  height: 22,
                                                  backgroundColor: '#dcfce7',
                                                  color: '#166534',
                                                  fontWeight: 700
                                                }}
                                              />
                                            ) : null}
                                          </Box>
                                          <Stack
                                            direction="row"
                                            spacing={1}
                                            justifyContent="space-between">
                                            <Typography variant="caption" color="text.secondary">
                                              ราคาสินค้า
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                              {formatPrice(value.productPrice)}
                                            </Typography>
                                          </Stack>
                                          {value.landFreightCost > 0 ? (
                                            <Stack
                                              direction="row"
                                              spacing={1}
                                              justifyContent="space-between">
                                              <Typography variant="caption" color="text.secondary">
                                                ราคาสินค้ารวมขนส่งทางรถ
                                              </Typography>
                                              <Typography variant="body2" fontWeight={600}>
                                                {formatPrice(value.landTotalPrice)}
                                              </Typography>
                                            </Stack>
                                          ) : null}
                                          {value.seaFreightCost > 0 ? (
                                            <Stack
                                              direction="row"
                                              spacing={1}
                                              justifyContent="space-between">
                                              <Typography variant="caption" color="text.secondary">
                                                ราคาสินค้ารวมขนส่งทางเรือ
                                              </Typography>
                                              <Typography
                                                variant="body2"
                                                fontWeight={800}
                                                color={isBestSeaPrice ? '#166534' : 'text.primary'}>
                                                {formatPrice(value.seaTotalPrice)}
                                              </Typography>
                                            </Stack>
                                          ) : null}
                                        </Stack>
                                      ) : (
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                          align="center">
                                          ยังไม่ตอบราคา
                                        </Typography>
                                      )}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            );
                          })}
                          {canFinalPrice ?
                            <>
                              <TableRow>
                                <TableCell
                                  sx={{
                                    position: 'sticky',
                                    left: 0,
                                    zIndex: 1,
                                    backgroundColor: '#f8fafc',
                                    minWidth: 160,
                                    fontWeight: 700
                                  }}
                                />
                                {respondedSupplierQuotes.map((quote) => (
                                  <TableCell
                                    key={`${quote.id}-select-action`}
                                    align="center"
                                    sx={{
                                      minWidth: 190,
                                      backgroundColor: '#f8fafc',
                                      borderLeft: '1px solid #eef2f7'
                                    }}>
                                    <Button
                                      variant="contained"
                                      size="small"
                                      fullWidth
                                      sx={blueActionButtonSx}
                                      onClick={() => handleOpenFinalPriceDialog(quote)}>
                                      เลือก
                                    </Button>
                                  </TableCell>
                                ))}
                              </TableRow>
                            </>
                            : null}
                        </TableBody>
                      </Table>
                    </Box>
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
                      ยังไม่มีข้อมูลราคาที่ supplier ตอบกลับสำหรับเปรียบเทียบ
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
        open={visibleInquiryUpdateConfirmationDialog}
        title={t('priceInquiryManagement.generateInquiry.confirmUpdateTitle')}
        message={t('priceInquiryManagement.generateInquiry.confirmUpdateMsg')}
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        isShowCancelButton
        isShowConfirmButton
        onConfirm={handleConfirmUpdateInquiry}
        onCancel={() => setVisibleInquiryUpdateConfirmationDialog(false)}
      />
      <Dialog
        open={Boolean(supplierQuoteInfo)}
        onClose={() => setSupplierQuoteInfo(null)}
        maxWidth="md"
        fullWidth>
        <DialogTitle>รายละเอียด Supplier Quote</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                {getSupplierDisplayName(supplierQuoteInfo?.supplier)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {supplierQuoteInfo?.supplier?.supplierCode ||
                  supplierQuoteInfo?.supplier?.id ||
                  '-'}
              </Typography>
            </Box>

            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight={700}>
                รายละเอียดราคา
              </Typography>
              {supplierQuoteInfo?.details?.length ? (
                supplierQuoteInfo.details.map((detail, detailIndex) => (
                  <Box
                    key={detail.id || `${detail.optionName}-${detailIndex}`}
                    sx={{
                      border: '1px solid #dce4ee',
                      borderRadius: 2,
                      p: 2,
                      backgroundColor: '#fff'
                    }}>
                    <Stack spacing={1.5}>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {detail.optionName || `Option ${detailIndex + 1}`}
                        </Typography>
                        {detail.spec ? (
                          <Typography variant="body2" color="text.secondary">
                            {detail.spec}
                          </Typography>
                        ) : null}
                        {detail.remark ? (
                          <Typography variant="caption" color="text.secondary">
                            Remark: {detail.remark}
                          </Typography>
                        ) : null}
                      </Box>

                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>MOQ</TableCell>
                            <TableCell align="right">ราคาสินค้า</TableCell>
                            <TableCell align="right">ค่าขนส่งทางรถ</TableCell>
                            <TableCell align="right">รวมทางรถ</TableCell>
                            <TableCell align="right">ค่าขนส่งทางเรือ</TableCell>
                            <TableCell align="right">รวมทางเรือ</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {detail.tiers.map((tier, tierIndex) => (
                            <TableRow key={tier.id || `${detail.id || detailIndex}-${tierIndex}`}>
                              <TableCell>{formatQuantity(tier.quantity)}</TableCell>
                              <TableCell align="right">{formatPrice(tier.productPrice)}</TableCell>
                              <TableCell align="right">
                                {formatPrice(tier.landFreightCost)}
                              </TableCell>
                              <TableCell align="right">
                                {formatPrice(tier.landTotalPrice)}
                              </TableCell>
                              <TableCell align="right">
                                {formatPrice(tier.seaFreightCost)}
                              </TableCell>
                              <TableCell align="right">{formatPrice(tier.seaTotalPrice)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Stack>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  ยังไม่มีรายละเอียดราคา
                </Typography>
              )}
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle1" fontWeight={700}>
                Additional Cost
              </Typography>
              {supplierQuoteInfo?.additionalCosts?.length ? (
                <Stack spacing={0.75}>
                  {supplierQuoteInfo.additionalCosts.map((additionalCost, index) => (
                    <Typography
                      key={additionalCost.id || `${additionalCost.description}-${index}`}
                      variant="body2">
                      {formatSupplierQuoteAdditionalCost(additionalCost) || '-'}
                    </Typography>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  ไม่มี Additional Cost
                </Typography>
              )}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          {canFinalPrice ? (
            <Button
              variant="contained"
              onClick={() => {
                supplierQuoteInfo ? handleOpenFinalPriceDialog(supplierQuoteInfo) : undefined;
              }}>
              เลือก
            </Button>
          ) : null}
          <Button variant="contained" onClick={() => setSupplierQuoteInfo(null)}>
            {t('button.close')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={Boolean(finalPriceQuote)}
        onClose={isFinalPriceSubmitting ? undefined : handleCloseFinalPriceDialog}
        maxWidth="lg"
        fullWidth>
        <DialogTitle>Final ราคา RFQ</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                {getSupplierDisplayName(finalPriceQuote?.supplier)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {finalPriceQuote?.supplier?.supplierCode || finalPriceQuote?.supplier?.id || '-'}
              </Typography>
            </Box>

            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight={700}>
                รายการ Final ราคา
              </Typography>
              {finalPriceDraft.details.length ? (
                finalPriceDraft.details.map((detail, detailIndex) => (
                  <Box
                    key={detail.id}
                    sx={{
                      border: '1px solid #dce4ee',
                      borderRadius: 2,
                      p: 2,
                      backgroundColor: '#fff'
                    }}>
                    <Stack spacing={1.5}>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {detail.optionName || `Option ${detailIndex + 1}`}
                        </Typography>
                        {detail.spec ? (
                          <Typography variant="body2" color="text.secondary">
                            {detail.spec}
                          </Typography>
                        ) : null}
                      </Box>

                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>MOQ</TableCell>
                            <TableCell align="right">ราคาสินค้า</TableCell>
                            <TableCell align="right">ค่าขนส่งทางรถ</TableCell>
                            <TableCell align="right">รวมทางรถ</TableCell>
                            <TableCell align="right">ค่าขนส่งทางเรือ</TableCell>
                            <TableCell align="right">รวมทางเรือ</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {detail.tiers.map((tier) => {
                            const landFreightCost = parsePriceInput(tier.landFreightCost) || 0;
                            const seaFreightCost = parsePriceInput(tier.seaFreightCost) || 0;
                            const tierError = finalPriceErrors.details?.[tier.id] || {};

                            return (
                              <TableRow key={tier.id}>
                                <TableCell>{formatQuantity(tier.quantity)}</TableCell>
                                <TableCell align="right">{formatPrice(tier.productPrice)}</TableCell>
                                <TableCell align="right" sx={{ minWidth: 160 }}>
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={tier.landFreightCost}
                                    onChange={(event) =>
                                      handleFinalPriceTierChange(
                                        detail.id,
                                        tier.id,
                                        'landFreightCost',
                                        event.target.value
                                      )
                                    }
                                    error={Boolean(tierError.landFreightCost)}
                                    helperText={tierError.landFreightCost}
                                    inputProps={{ min: 0, step: '0.01' }}
                                    fullWidth
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  {formatPrice(tier.productPrice + landFreightCost)}
                                </TableCell>
                                <TableCell align="right" sx={{ minWidth: 160 }}>
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={tier.seaFreightCost}
                                    onChange={(event) =>
                                      handleFinalPriceTierChange(
                                        detail.id,
                                        tier.id,
                                        'seaFreightCost',
                                        event.target.value
                                      )
                                    }
                                    error={Boolean(tierError.seaFreightCost)}
                                    helperText={tierError.seaFreightCost}
                                    inputProps={{ min: 0, step: '0.01' }}
                                    fullWidth
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  {formatPrice(tier.productPrice + seaFreightCost)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </Stack>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  ยังไม่มีรายละเอียดราคาจาก supplier quote
                </Typography>
              )}

              <Stack spacing={1}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Additional Cost จาก Supplier Quote
                </Typography>
                {finalPriceQuote?.additionalCosts?.length ? (
                  <Box
                    sx={{
                      border: '1px solid #dce4ee',
                      borderRadius: 2,
                      p: 2,
                      backgroundColor: '#fff'
                    }}>
                    <Stack spacing={0.75}>
                      {finalPriceQuote.additionalCosts.map((additionalCost, index) => (
                        <Typography
                          key={additionalCost.id || `${additionalCost.description}-${index}`}
                          variant="body2">
                          {formatSupplierQuoteAdditionalCost(additionalCost) || '-'}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    ไม่มี Additional Cost
                  </Typography>
                )}
              </Stack>

              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" fontWeight={700}>
                    Additional Cost เพิ่มเติม
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    sx={outlinedActionButtonSx}
                    onClick={handleAddFinalPriceAdditionalCost}>
                    เพิ่มค่าใช้จ่าย
                  </Button>
                </Stack>
                {finalPriceDraft.additionalCosts.length ? (
                  finalPriceDraft.additionalCosts.map((additionalCost) => (
                    <Grid container spacing={1} key={additionalCost.id} alignItems="center">
                      <Grid item xs={12} md={5}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Name"
                          value={additionalCost.description}
                          onChange={(event) =>
                            handleFinalPriceAdditionalCostChange(
                              additionalCost.id,
                              'description',
                              event.target.value
                            )
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Value"
                          value={additionalCost.value}
                          onChange={(event) =>
                            handleFinalPriceAdditionalCostChange(
                              additionalCost.id,
                              'value',
                              event.target.value
                            )
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Unit"
                          value={additionalCost.unit}
                          onChange={(event) =>
                            handleFinalPriceAdditionalCostChange(
                              additionalCost.id,
                              'unit',
                              event.target.value
                            )
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={1}>
                        <Tooltip title="ลบค่าใช้จ่าย">
                          <IconButton
                            color="error"
                            onClick={() =>
                              handleDeleteFinalPriceAdditionalCost(additionalCost.id)
                            }>
                            <DeleteOutline />
                          </IconButton>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    ยังไม่มี Additional Cost เพิ่มเติม
                  </Typography>
                )}
              </Stack>

              <TextField
                label="Remark / คำแนะนำสำหรับ RFQ นี้"
                value={finalPriceDraft.remark}
                onChange={(event) => handleFinalPriceRemarkChange(event.target.value)}
                multiline
                minRows={4}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={isFinalPriceSubmitting} onClick={handleCloseFinalPriceDialog}>
            {t('button.cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={isFinalPriceSubmitting}
            onClick={handleRequestSaveFinalPrice}>
            บันทึก Final ราคา
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={visibleFinalPriceConfirmationDialog}
        title="ยืนยัน Final ราคา"
        message={`คุณยืนยัน Final ราคา RFQ นี้ด้วยราคาจาก ${getSupplierDisplayName(
          finalPriceQuote?.supplier
        )} ใช่หรือไม่`}
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        isShowCancelButton
        isShowConfirmButton
        onConfirm={handleConfirmSaveFinalPrice}
        onCancel={() => setVisibleFinalPriceConfirmationDialog(false)}
      />
      <Dialog
        open={Boolean(quoteDialogSupplier)}
        onClose={handleCloseSupplierQuoteDialog}
        maxWidth="lg"
        fullWidth>
        <DialogTitle>
          {quoteDialogQuote ? 'แก้ไขราคาที่ supplier ตอบกลับ' : 'บันทึกราคาที่ supplier ตอบกลับ'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                {quoteDialogSupplier?.supplierName || '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {quoteDialogSupplier?.supplierId || quoteDialogSupplier?.id || '-'} |{' '}
                {quoteDialogSupplier?.supplierCode || '-'}
              </Typography>
            </Box>

            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight={700}>
                  รายการราคาที่ตอบกลับ
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  sx={outlinedActionButtonSx}
                  onClick={handleAddQuoteDetail}>
                  เพิ่มรายการ
                </Button>
              </Stack>
              {quoteDraftDetails.map((detail, index) => {
                const detailError = quoteDraftErrors[detail.id] || {};
                return (
                  <Box
                    key={detail.id}
                    sx={{
                      border: '1px solid #dce4ee',
                      borderRadius: 3,
                      p: 2,
                      backgroundColor: '#fff'
                    }}>
                    <Stack spacing={2}>
                      <Grid container spacing={1.5}>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Option"
                            value={detail.optionName}
                            error={Boolean(detailError.optionName)}
                            helperText={detailError.optionName}
                            onChange={(event) =>
                              handleQuoteDetailChange(detail.id, 'optionName', event.target.value)
                            }
                          />
                        </Grid>
                        <Grid item xs={12} md={8}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Spec"
                            value={detail.spec}
                            error={Boolean(detailError.spec)}
                            helperText={detailError.spec}
                            onChange={(event) =>
                              handleQuoteDetailChange(detail.id, 'spec', event.target.value)
                            }
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Remark"
                            value={detail.remark || ''}
                            onChange={(event) =>
                              handleQuoteDetailChange(detail.id, 'remark', event.target.value)
                            }
                          />
                        </Grid>
                      </Grid>

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" fontWeight={700}>
                          Tier {index + 1}
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Add />}
                          onClick={() => handleAddQuoteTier(detail.id)}>
                          เพิ่ม Tier
                        </Button>
                      </Stack>
                      {detailError.tiers ? (
                        <Typography variant="caption" color="error">
                          {detailError.tiers}
                        </Typography>
                      ) : null}
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>MOQ</TableCell>
                            <TableCell>Product Price</TableCell>
                            <TableCell>Land Freight</TableCell>
                            <TableCell>Land Total</TableCell>
                            <TableCell>Sea Freight</TableCell>
                            <TableCell>Sea Total</TableCell>
                            <TableCell align="center">จัดการ</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {detail.tiers.map((tier) => {
                            const tierError = detailError.tierErrors?.[tier.id] || {};
                            return (
                              <TableRow key={tier.id}>
                                <TableCell>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    type="number"
                                    value={tier.quantity}
                                    error={Boolean(tierError.quantity)}
                                    helperText={tierError.quantity}
                                    onChange={(event) =>
                                      handleQuoteTierChange(
                                        detail.id,
                                        tier.id,
                                        'quantity',
                                        event.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    type="number"
                                    value={tier.productPrice}
                                    error={Boolean(tierError.productPrice)}
                                    helperText={tierError.productPrice}
                                    onChange={(event) =>
                                      handleQuoteTierChange(
                                        detail.id,
                                        tier.id,
                                        'productPrice',
                                        event.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    type="number"
                                    value={tier.landFreightCost}
                                    error={Boolean(tierError.landFreightCost)}
                                    helperText={tierError.landFreightCost}
                                    onChange={(event) =>
                                      handleQuoteTierChange(
                                        detail.id,
                                        tier.id,
                                        'landFreightCost',
                                        event.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell>{formatPrice(tier.landTotalPrice)}</TableCell>
                                <TableCell>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    type="number"
                                    value={tier.seaFreightCost}
                                    error={Boolean(tierError.seaFreightCost)}
                                    helperText={tierError.seaFreightCost}
                                    onChange={(event) =>
                                      handleQuoteTierChange(
                                        detail.id,
                                        tier.id,
                                        'seaFreightCost',
                                        event.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell>{formatPrice(tier.seaTotalPrice)}</TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteQuoteTier(detail.id, tier.id)}
                                    sx={{ color: '#c62828' }}>
                                    <DeleteOutline fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>

            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight={700}>
                  Additional Cost
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  sx={outlinedActionButtonSx}
                  onClick={handleAddQuoteAdditionalCost}>
                  เพิ่มค่าใช้จ่าย
                </Button>
              </Stack>
              {quoteDraftAdditionalCosts.map((additionalCost) => (
                <Grid container spacing={1} key={additionalCost.id}>
                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Name"
                      value={additionalCost.description}
                      onChange={(event) =>
                        handleQuoteAdditionalCostChange(
                          additionalCost.id,
                          'description',
                          event.target.value
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Value"
                      value={additionalCost.value}
                      onChange={(event) =>
                        handleQuoteAdditionalCostChange(
                          additionalCost.id,
                          'value',
                          event.target.value
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Unit"
                      value={additionalCost.unit}
                      onChange={(event) =>
                        handleQuoteAdditionalCostChange(
                          additionalCost.id,
                          'unit',
                          event.target.value
                        )
                      }
                    />
                  </Grid>
                </Grid>
              ))}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" color="secondary" onClick={handleSaveSupplierQuote}>
            {t('button.save')}
          </Button>
          <Button variant="contained" onClick={handleCloseSupplierQuoteDialog}>
            {t('button.close')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={Boolean(generatedInquiryMessage)}
        onClose={handleCloseInquiryDialog}
        maxWidth="md"
        fullWidth>
        <DialogTitle>{t('priceInquiryManagement.generateInquiry.title')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {t('priceInquiryManagement.generateInquiry.thaiMessage')}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ContentCopy />}
                  onClick={() => copyText(editableInquiryMessage.thaiMessage || '')}>
                  {t('button.copy')}
                </Button>
              </Stack>
              <TextField
                fullWidth
                multiline
                minRows={8}
                value={editableInquiryMessage.thaiMessage}
                onChange={(event) =>
                  setEditableInquiryMessage((previous) => ({
                    ...previous,
                    thaiMessage: event.target.value
                  }))
                }
              />
            </Box>
            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {t('priceInquiryManagement.generateInquiry.chineseMessage')}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ContentCopy />}
                  onClick={() => copyText(editableInquiryMessage.chineseMessage || '')}>
                  {t('button.copy')}
                </Button>
              </Stack>
              <TextField
                fullWidth
                multiline
                minRows={8}
                value={editableInquiryMessage.chineseMessage}
                onChange={(event) =>
                  setEditableInquiryMessage((previous) => ({
                    ...previous,
                    chineseMessage: event.target.value
                  }))
                }
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="secondary"
            disabled={!isInquiryMessageEdited}
            onClick={() => setVisibleInquiryUpdateConfirmationDialog(true)}>
            {t('button.update')}
          </Button>
          <Button variant="contained" onClick={handleCloseInquiryDialog}>
            {t('button.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  );
}
