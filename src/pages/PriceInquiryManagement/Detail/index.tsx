import { ArrowBackIos, Save } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Grid,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
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
import { searchSupplier } from 'services/Supplier/supplier-api';
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
import { FinalPriceQuoteDialog } from './FinalPriceQuoteDialog';
import { SupplierQuoteSection } from './SupplierQuoteSection';
import { SupplierQuoteDialog } from './SupplierQuoteDialog';
import { GeneratedInquiryMessageDialog } from './GeneratedInquiryMessageDialog';
import { AddSupplierDialog } from './AddSupplierDialog';

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
  shippingCost?: string;
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

interface DraftSupplierQuoteTier {
  id: number;
  quantity: number;
  productPrice: number;
  shippingCost: number;
  currency?: string | null;
  sortOrder: number;
  createdDate: string;
  updatedDate: string;
}

interface DraftSupplierQuoteDetail {
  id: number;
  rfqDetailId?: number | null;
  optionName: string;
  spec: string;
  sortOrder: number;
  remark: string | null;
  packageDimension?: string;
  packageWeight?: string;
  packageCapacity?: string;
  packageBoxWidth?: string;
  packageBoxLength?: string;
  packageBoxHeight?: string;
  packagePiecesPerBox?: string;
  packageWeightPerBoxKg?: string;
  tiers: DraftSupplierQuoteTier[];
  createdDate: string;
  updatedDate: string;
  createdBy: string;
  updatedBy: string;
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
  maximumFractionDigits: 4
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

function formatPrice(value?: number | null, currency?: string | null): string {
  if (value === null || value === undefined) {
    return '-';
  }

  const normalizedCurrency = currency?.trim().toUpperCase();
  if (normalizedCurrency === 'CNY') {
    return `¥${priceFormatter.format(value)}`;
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

function extractPackageNumbers(value?: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .replace(/,/g, '')
    .match(/\d+(?:\.\d+)?/g) || [];
}

function mapPackageDimension(value?: string | null): Pick<
  DraftSupplierQuoteDetail,
  'packageBoxWidth' | 'packageBoxLength' | 'packageBoxHeight'
> {
  const [width = '', length = '', height = ''] = extractPackageNumbers(value);
  return {
    packageBoxWidth: width,
    packageBoxLength: length,
    packageBoxHeight: height
  };
}

function mapPackageQuantity(value?: string | null): string {
  return extractPackageNumbers(value)[0] || '';
}

function buildPackageDimension(detail: DraftSupplierQuoteDetail): string | null {
  const parts = [detail.packageBoxWidth, detail.packageBoxLength, detail.packageBoxHeight]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  return parts.length ? parts.join(' x ') : null;
}

function buildPackageWeight(detail: DraftSupplierQuoteDetail): string | null {
  const piecesPerBox = detail.packagePiecesPerBox?.trim();
  return piecesPerBox || null;
}

function buildPackageCapacity(detail: DraftSupplierQuoteDetail): string | null {
  const weightPerBoxKg = detail.packageWeightPerBoxKg?.trim();
  return weightPerBoxKg || null;
}

function createDraftQuoteDetail(sortOrder: number): DraftSupplierQuoteDetail {
  const now = Date.now();
  return {
    id: -(now + sortOrder),
    rfqDetailId: null,
    optionName: `Option ${sortOrder}`,
    spec: '',
    sortOrder,
    remark: '',
    packageDimension: '',
    packageWeight: '',
    packageCapacity: '',
    packageBoxWidth: '',
    packageBoxLength: '',
    packageBoxHeight: '',
    packagePiecesPerBox: '',
    packageWeightPerBoxKg: '',
    tiers: [
      {
        id: -(Date.now() + sortOrder),
        quantity: 0,
        productPrice: 0,
        shippingCost: 0,
        currency: 'CNY',
        sortOrder: 1,
        createdDate: '',
        updatedDate: ''
      }
    ],
    createdDate: '',
    updatedDate: '',
    createdBy: '',
    updatedBy: ''
  };
}

function createDraftDetailOption(sortOrder: number): RFQDetailOption {
  return {
    id: -Date.now(),
    optionName: `Option ${sortOrder}`,
    spec: '',
    sortOrder,
    remark: '',
    packageBoxWidth: '',
    packageBoxLength: '',
    packageBoxHeight: '',
    packagePiecesPerBox: '',
    packageWeightPerBoxKg: '',
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

function createSupplierQuoteDetailFromQuote(
  detail: RFQSupplierQuoteDetail
): DraftSupplierQuoteDetail {
  const mappedDimension = mapPackageDimension(detail.packageDimension);

  return {
    id: detail.id || -Date.now(),
    rfqDetailId: detail.rfqDetailId || null,
    optionName: detail.optionName || '',
    spec: detail.spec || '',
    sortOrder: detail.sortOrder,
    remark: detail.remark || '',
    packageDimension: detail.packageDimension || '',
    packageWeight: detail.packageWeight || '',
    packageCapacity: detail.packageCapacity || '',
    packageBoxWidth: mappedDimension.packageBoxWidth,
    packageBoxLength: mappedDimension.packageBoxLength,
    packageBoxHeight: mappedDimension.packageBoxHeight,
    packagePiecesPerBox: mapPackageQuantity(detail.packageWeight),
    packageWeightPerBoxKg: mapPackageQuantity(detail.packageCapacity),
    tiers: detail.tiers.map((tier, index) => ({
      id: tier.id || -(Date.now() + index + 1),
      quantity: tier.quantity ?? 0,
      productPrice: tier.productPrice ?? 0,
      shippingCost: tier.shippingCost ?? 0,
      currency: tier.currency || 'CNY',
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
      packageDimension:
        detail.packageDimension?.trim() || buildPackageDimension(detail),
      packageWeight: detail.packageWeight?.trim() || buildPackageWeight(detail),
      packageCapacity: detail.packageCapacity?.trim() || buildPackageCapacity(detail),
      tiers: detail.tiers.map((tier, tierIndex) => ({
        quantity: tier.quantity,
        productPrice: tier.productPrice,
        shippingCost: tier.shippingCost,
        currency: tier.currency || 'CNY',
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

function validateSupplierQuoteDraftDetail(
  detail: DraftSupplierQuoteDetail
): DraftDetailValidationError {
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

    if (!isNonNegativeNumber(tier.shippingCost)) {
      tierError.shippingCost = `Tier ${index + 1}: ค่าขนส่งต้องเป็น 0 หรือมากกว่า`;
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
  const [visibleSupplierQuoteDialog, setVisibleSupplierQuoteDialog] = useState(false);
  const [inlineEditingSupplierQuoteId, setInlineEditingSupplierQuoteId] = useState<string | null>(
    null
  );
  const [visibleSupplierQuoteSaveConfirmationDialog, setVisibleSupplierQuoteSaveConfirmationDialog] =
    useState(false);
  const [quoteSupplierSearchInput, setQuoteSupplierSearchInput] = useState('');
  const [quoteSupplierSearchKeyword, setQuoteSupplierSearchKeyword] = useState('');
  const [visibleAddSupplierDialog, setVisibleAddSupplierDialog] = useState(false);
  const [supplierSearchInput, setSupplierSearchInput] = useState('');
  const [supplierSearchKeyword, setSupplierSearchKeyword] = useState('');
  const [manuallyAddedSuggestSuppliers, setManuallyAddedSuggestSuppliers] = useState<Supplier[]>(
    []
  );
  const [quoteDraftDetails, setQuoteDraftDetails] = useState<DraftSupplierQuoteDetail[]>([]);
  const [quoteDraftAdditionalCosts, setQuoteDraftAdditionalCosts] = useState<DraftAdditionalCost[]>(
    []
  );
  const [quoteDraftErrors, setQuoteDraftErrors] = useState<
    Record<number, DraftDetailValidationError>
  >({});
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
  const { data: supplierSearchResult = [], isFetching: isSupplierSearchFetching } = useQuery(
    ['supplier-search', visibleAddSupplierDialog, supplierSearchKeyword],
    () =>
      searchSupplier(
        {
          statusEqual: 'ACTIVE',
          nameContain: supplierSearchKeyword || undefined
        },
        1,
        20
      ).then((response) => response.data.suppliers),
    {
      refetchOnWindowFocus: false,
      enabled: visibleAddSupplierDialog
    }
  );
  const { data: quoteSupplierSearchResult = [], isFetching: isQuoteSupplierSearchFetching } =
    useQuery(
      ['supplier-search-quote', visibleSupplierQuoteDialog, quoteSupplierSearchKeyword],
      () =>
        searchSupplier(
          {
            statusEqual: 'ACTIVE',
            nameContain: quoteSupplierSearchKeyword || undefined
          },
          1,
          20
        ).then((response) => response.data.suppliers),
      {
        refetchOnWindowFocus: false,
        enabled: visibleSupplierQuoteDialog
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

  const {
    data: activityHistory = [],
    isFetching: isActivityHistoryFetching,
    refetch: refetchActivityHistory
  } = useQuery(['rfq-activity-history', params.id], () => getActivityHistory('RFQ', params.id), {
    refetchOnWindowFocus: false,
    enabled: !!params.id
  });

  const refetchPriceInquiryData = async () => {
    await Promise.all([refetchRFQ(), refetchSupplierQuotes(), refetchActivityHistory()]);
  };

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

        await refetchPriceInquiryData();
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

              const hasMatchedMaterial =
                capability.materials?.some((material) =>
                  isCapabilityMaterialMatched(material, rfqMaterial)
                ) || false;

              if (hasMatchedMaterial) {
                accumulator.push({
                  ...capability
                });
              }

              return accumulator;
            }, []) || []
        }))
        .filter((supplier) => supplier.capabilities?.length),
    [rfqMaterial, rfqProductFamilyCode, suggestSuppliers]
  );
  const suggestSuppliersDisplay = useMemo(() => {
    const supplierMap = new Map<string, Supplier>();

    [...suggestSuppliersByRFQ, ...manuallyAddedSuggestSuppliers].forEach((supplier) => {
      const supplierId = supplier.supplierId || supplier.id;
      if (supplierId && !supplierMap.has(supplierId)) {
        supplierMap.set(supplierId, supplier);
      }
    });

    return Array.from(supplierMap.values());
  }, [manuallyAddedSuggestSuppliers, suggestSuppliersByRFQ]);
  const suggestedSupplierIds = useMemo(
    () =>
      new Set(
        suggestSuppliersDisplay
          .map((supplier) => supplier.supplierId || supplier.id)
          .filter(Boolean)
      ),
    [suggestSuppliersDisplay]
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
  const primarySuggestedSupplierQuote = useMemo(
    () =>
      respondedSupplierQuotes.find((quote) => {
        const supplierId = quote.supplier?.supplierId || quote.supplier?.id || '';
        return suggestedSupplierIds.has(supplierId);
      }) || null,
    [respondedSupplierQuotes, suggestedSupplierIds]
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
      await refetchPriceInquiryData();
    } finally {
      setIsUpdateInquirySubmitting(false);
    }
  };

  const initializeSupplierQuoteDialog = (
    supplier: Supplier,
    existingQuote?: RFQSupplierQuote | null
  ) => {
    setQuoteDialogSupplier(supplier);
    setQuoteDialogQuote(existingQuote || null);
    setQuoteDraftDetails(
      existingQuote?.details?.length
        ? existingQuote.details.map(createSupplierQuoteDetailFromQuote)
        : [createDraftQuoteDetail(1)]
    );
    setQuoteDraftAdditionalCosts(
      existingQuote?.additionalCosts?.length
        ? existingQuote.additionalCosts.map(createSupplierQuoteAdditionalCostFromQuote)
        : [createDraftAdditionalCost()]
    );
    setQuoteDraftErrors({});
  };

  const handleOpenSupplierQuoteDialog = () => {
    setVisibleSupplierQuoteDialog(true);
    setQuoteDialogSupplier(null);
    setQuoteDialogQuote(null);
    setQuoteDraftDetails([]);
    setQuoteDraftAdditionalCosts([]);
    setQuoteDraftErrors({});
    setQuoteSupplierSearchInput('');
    setQuoteSupplierSearchKeyword('');
  };

  const handleOpenSupplierQuoteEditDialog = (quote: RFQSupplierQuote) => {
    if (!quote.supplier) {
      return;
    }

    initializeSupplierQuoteDialog(quote.supplier, quote);
    setVisibleSupplierQuoteDialog(false);
    setInlineEditingSupplierQuoteId(quote.id);
    setQuoteSupplierSearchInput('');
    setQuoteSupplierSearchKeyword('');
  };

  const handleCloseSupplierQuoteDialog = () => {
    setQuoteDialogSupplier(null);
    setQuoteDialogQuote(null);
    setQuoteDraftDetails([]);
    setQuoteDraftAdditionalCosts([]);
    setQuoteDraftErrors({});
    setVisibleSupplierQuoteDialog(false);
    setInlineEditingSupplierQuoteId(null);
    setVisibleSupplierQuoteSaveConfirmationDialog(false);
    setQuoteSupplierSearchInput('');
    setQuoteSupplierSearchKeyword('');
  };

  const handleCancelInlineSupplierQuoteEdit = () => {
    setInlineEditingSupplierQuoteId(null);
    setQuoteDialogSupplier(null);
    setQuoteDialogQuote(null);
    setQuoteDraftDetails([]);
    setQuoteDraftAdditionalCosts([]);
    setQuoteDraftErrors({});
    setVisibleSupplierQuoteSaveConfirmationDialog(false);
  };

  const handleOpenAddSupplierDialog = () => {
    setSupplierSearchInput('');
    setSupplierSearchKeyword('');
    setVisibleAddSupplierDialog(true);
  };

  const handleCloseAddSupplierDialog = () => {
    setVisibleAddSupplierDialog(false);
    setSupplierSearchInput('');
    setSupplierSearchKeyword('');
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
            (additionalCost) => additionalCost.description.trim() && additionalCost.value.trim()
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
      await refetchPriceInquiryData();
      handleCloseFinalPriceDialog();
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
    field:
      | 'optionName'
      | 'spec'
      | 'remark'
      | 'packageDimension'
      | 'packageWeight'
      | 'packageCapacity'
      | 'packageBoxWidth'
      | 'packageBoxLength'
      | 'packageBoxHeight'
      | 'packagePiecesPerBox'
      | 'packageWeightPerBoxKg',
    value: string
  ) => {
    setQuoteDraftDetails((prev) =>
      prev.map((detail) => {
        if (detail.id !== detailId) {
          return detail;
        }

        const updatedDetail = { ...detail, [field]: value };

        if (field === 'packageDimension') {
          return {
            ...updatedDetail,
            ...mapPackageDimension(value)
          };
        }

        if (field === 'packageWeight') {
          return {
            ...updatedDetail,
            packagePiecesPerBox: mapPackageQuantity(value)
          };
        }

        if (field === 'packageCapacity') {
          return {
            ...updatedDetail,
            packageWeightPerBoxKg: mapPackageQuantity(value)
          };
        }

        return updatedDetail;
      })
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
    field: 'quantity' | 'productPrice' | 'shippingCost',
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
              ...updatedTier
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

  const handleRequestSaveSupplierQuote = () => {
    if (!params.id || !quoteDialogSupplier) {
      return;
    }

    if (!quoteDraftDetails.length) {
      toast.error('กรุณาเพิ่มรายการราคาที่ตอบกลับอย่างน้อย 1 รายการ');
      return;
    }

    const nextErrors = quoteDraftDetails.reduce<Record<number, DraftDetailValidationError>>(
      (accumulator, detail) => {
        const validationError = validateSupplierQuoteDraftDetail(detail);
        if (Object.keys(validationError).length) {
          accumulator[detail.id] = validationError;
        }
        return accumulator;
      },
      {}
    );
    setQuoteDraftErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error('กรุณาตรวจสอบข้อมูลราคาที่ supplier ตอบกลับ');
      return;
    }

    setVisibleSupplierQuoteSaveConfirmationDialog(true);
  };

  const handleConfirmSaveSupplierQuote = async () => {
    if (!params.id || !quoteDialogSupplier) {
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
      setVisibleSupplierQuoteSaveConfirmationDialog(false);
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
      await refetchPriceInquiryData();
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

  const handleSelectQuoteSupplier = (supplier: Supplier) => {
    const supplierId = supplier.supplierId || supplier.id;
    const existingQuote = supplierQuoteBySupplierId[supplierId] || null;
    setQuoteSupplierSearchInput('');
    setQuoteSupplierSearchKeyword('');
    initializeSupplierQuoteDialog(supplier, existingQuote);
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
      await refetchPriceInquiryData();
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
      await refetchPriceInquiryData();
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
      await refetchPriceInquiryData();
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
          isSuggestSuppliersFetching ||
          isSupplierQuotesFetching ||
          formik.isSubmitting ||
          isPictureSubmitting ||
          isGenerateInquirySubmitting ||
          isUpdateInquirySubmitting ||
          isSupplierQuoteSubmitting
        }
      />
      <PageTitle title={'สอบถามราคาเลขที่ ' + rfq?.id || 'Price Inquiry Detail'}>
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
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            {/* {suggestedSupplierIds.size == 0 ? ( */}
            <Button
              variant="contained"
              sx={blueActionButtonSx}
              disabled={isSupplierQuoteSubmitting}
              onClick={() => handleOpenSupplierQuoteDialog()}>
              บันทึกราคา
            </Button>
            {/* ) : null} */}

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
                  const response = await toast.promise(generateRFQInquiry(params.id), {
                    loading: t('toast.loading'),
                    success: t('toast.success'),
                    error: t('toast.failed')
                  });

                  setGeneratedInquiryMessage(response || null);
                  setEditableInquiryMessage({
                    thaiMessage: response?.thaiMessage || '',
                    chineseMessage: response?.chineseMessage || ''
                  });
                  await refetchPriceInquiryData();
                } finally {
                  setIsGenerateInquirySubmitting(false);
                }
              }}>
              {t('priceInquiryManagement.generateInquiry.button')}
            </Button>
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
                key={supplierQuotes.length ? 'rfq-detail-collapsed' : 'rfq-detail-expanded'}
                title="รายละเอียดการสอบถามราคา"
                defaultExpanded={!supplierQuotes.length}
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
                      fullWidth
                      label="การขนส่ง"
                      value={getShippingMethodLabel(rfq?.shippingMethod)}
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
              <CollapsibleWrapper title="Supplier Quote" defaultExpanded action={null}>
                <SupplierQuoteSection
                  quotes={supplierQuotes}
                  editingQuoteId={inlineEditingSupplierQuoteId}
                  quoteDraftDetails={quoteDraftDetails}
                  quoteDraftAdditionalCosts={quoteDraftAdditionalCosts}
                  quoteDraftErrors={quoteDraftErrors}
                  isSubmitting={isSupplierQuoteSubmitting}
                  onEditQuote={handleOpenSupplierQuoteEditDialog}
                  onCancelEditQuote={handleCancelInlineSupplierQuoteEdit}
                  onSaveEditQuote={handleRequestSaveSupplierQuote}
                  onDetailChange={handleQuoteDetailChange}
                  onTierChange={handleQuoteTierChange}
                  onAdditionalCostChange={handleQuoteAdditionalCostChange}
                  formatQuantity={formatQuantity}
                  formatPrice={formatPrice}
                  formatSupplierQuoteAdditionalCost={formatSupplierQuoteAdditionalCost}
                  getSupplierDisplayName={getSupplierDisplayName}
                />
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
      <FinalPriceQuoteDialog
        open={Boolean(finalPriceQuote)}
        finalPriceQuote={finalPriceQuote}
        finalPriceDraft={finalPriceDraft}
        finalPriceErrors={finalPriceErrors}
        isSubmitting={isFinalPriceSubmitting}
        onClose={handleCloseFinalPriceDialog}
        onRemarkChange={handleFinalPriceRemarkChange}
        onTierChange={handleFinalPriceTierChange}
        onAddAdditionalCost={handleAddFinalPriceAdditionalCost}
        onAdditionalCostChange={handleFinalPriceAdditionalCostChange}
        onDeleteAdditionalCost={handleDeleteFinalPriceAdditionalCost}
        onRequestSave={handleRequestSaveFinalPrice}
        formatQuantity={formatQuantity}
        formatPrice={formatPrice}
        formatSupplierQuoteAdditionalCost={formatSupplierQuoteAdditionalCost}
        getSupplierDisplayName={getSupplierDisplayName}
        t={t}
      />
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
      <AddSupplierDialog
        open={visibleAddSupplierDialog}
        supplierSearchInput={supplierSearchInput}
        onSupplierSearchInputChange={setSupplierSearchInput}
        onSearchEnter={() => setSupplierSearchKeyword(supplierSearchInput.trim())}
        onSearch={() => setSupplierSearchKeyword(supplierSearchInput.trim())}
        isSupplierSearchFetching={isSupplierSearchFetching}
        supplierSearchResult={supplierSearchResult}
        suggestedSupplierIds={suggestedSupplierIds}
        onSelectSupplier={(supplier) => {
          const supplierId = supplier.supplierId || supplier.id;
          const isAlreadySuggested = supplierId ? suggestedSupplierIds.has(supplierId) : false;
          if (!isAlreadySuggested) {
            setManuallyAddedSuggestSuppliers((previous) => {
              const nextSupplierId = supplier.supplierId || supplier.id;
              if (
                previous.some((existing) => (existing.supplierId || existing.id) === nextSupplierId)
              ) {
                return previous;
              }

              return [supplier, ...previous];
            });
          }
          handleCloseAddSupplierDialog();
        }}
        onClose={handleCloseAddSupplierDialog}
      />
      <SupplierQuoteDialog
        open={visibleSupplierQuoteDialog}
        supplier={quoteDialogSupplier}
        quote={quoteDialogQuote}
        quoteSupplierSearchInput={quoteSupplierSearchInput}
        onQuoteSupplierSearchInputChange={setQuoteSupplierSearchInput}
        onQuoteSupplierSearchEnter={() =>
          setQuoteSupplierSearchKeyword(quoteSupplierSearchInput.trim())
        }
        onQuoteSupplierSearch={() => setQuoteSupplierSearchKeyword(quoteSupplierSearchInput.trim())}
        isQuoteSupplierSearchFetching={isQuoteSupplierSearchFetching}
        quoteSupplierSearchResult={quoteSupplierSearchResult}
        supplierQuoteBySupplierId={supplierQuoteBySupplierId}
        onSelectSupplier={handleSelectQuoteSupplier}
        onChangeSupplier={() => {
          setQuoteDialogSupplier(null);
          setQuoteDialogQuote(null);
          setQuoteDraftDetails([]);
          setQuoteDraftAdditionalCosts([]);
          setQuoteDraftErrors({});
        }}
        quoteDraftDetails={quoteDraftDetails}
        quoteDraftAdditionalCosts={quoteDraftAdditionalCosts}
        quoteDraftErrors={quoteDraftErrors}
        onAddDetail={handleAddQuoteDetail}
        onDetailChange={handleQuoteDetailChange}
        onAddTier={handleAddQuoteTier}
        onTierChange={handleQuoteTierChange}
        onDeleteTier={handleDeleteQuoteTier}
        onAddAdditionalCost={handleAddQuoteAdditionalCost}
        onAdditionalCostChange={handleQuoteAdditionalCostChange}
        onDeleteAdditionalCost={handleDeleteAdditionalCost}
        onSave={handleRequestSaveSupplierQuote}
        onClose={handleCloseSupplierQuoteDialog}
        isSubmitting={isSupplierQuoteSubmitting}
        t={t}
      />
      <ConfirmDialog
        open={visibleSupplierQuoteSaveConfirmationDialog}
        title={
          quoteDialogQuote?.id
            ? 'ยืนยันแก้ไขราคาที่ supplier ตอบกลับ'
            : 'ยืนยันบันทึกราคาที่ supplier ตอบกลับ'
        }
        message={
          quoteDialogQuote?.id
            ? `คุณยืนยันแก้ไขราคาที่ supplier ตอบกลับของ ${getSupplierDisplayName(
              quoteDialogSupplier
            )} ใช่หรือไม่`
            : `คุณยืนยันบันทึกราคาที่ supplier ตอบกลับของ ${getSupplierDisplayName(
              quoteDialogSupplier
            )} ใช่หรือไม่`
        }
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        isShowCancelButton
        isShowConfirmButton
        onConfirm={handleConfirmSaveSupplierQuote}
        onCancel={() => setVisibleSupplierQuoteSaveConfirmationDialog(false)}
      />
      <GeneratedInquiryMessageDialog
        open={Boolean(generatedInquiryMessage)}
        generatedInquiryMessage={generatedInquiryMessage}
        thaiMessage={editableInquiryMessage.thaiMessage}
        chineseMessage={editableInquiryMessage.chineseMessage}
        isEdited={isInquiryMessageEdited}
        onThaiMessageChange={(value) =>
          setEditableInquiryMessage((previous) => ({
            ...previous,
            thaiMessage: value
          }))
        }
        onChineseMessageChange={(value) =>
          setEditableInquiryMessage((previous) => ({
            ...previous,
            chineseMessage: value
          }))
        }
        onRequestUpdate={() => setVisibleInquiryUpdateConfirmationDialog(true)}
        onClose={handleCloseInquiryDialog}
        t={t}
      />
    </Page>
  );
}
