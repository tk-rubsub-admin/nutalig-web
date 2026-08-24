import {
  AddCircle,
  ArrowBackIos,
  DeleteOutline,
  DirectionsBoat,
  LocalShipping,
  Save,
  Search
} from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  ListItemIcon,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import Can from 'auth/Can';
import { PERMISSIONS } from 'auth/permissions';
import CollapsibleWrapper from 'components/CollapsibleWrapper';
import ConfirmDialog from 'components/ConfirmDialog';
import DatePicker from 'components/DatePicker';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import { GridTextField, Wrapper } from 'components/Styled';
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useQueryClient } from 'react-query';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { getCustomer } from 'services/Customer/customer-api';
import { Address, Contact, Customer, CustomerDropOff } from 'services/Customer/customer-type';
import { getQuotation } from 'services/Document/document-api';
import { Quotation } from 'services/Document/document-type';
import { createFreelanceSale, getFreelanceSales } from 'services/FreelanceSale/freelance-sale-api';
import { FreelanceSaleRecord } from 'services/FreelanceSale/freelance-sale-type';
import { getRFQ, linkRFQSalesOrder } from 'services/RFQ/rfq-api';
import { RFQDetailOption, RFQDetailTier, RFQRecord } from 'services/RFQ/rfq-type';
import { getCountry, getDistrict, getProvince, getSubDistrict } from 'services/Address/address-api';
import { Country, District, Province, SubDistrict } from 'services/Address/address-type';
import { createSalesOrderV1 } from 'services/SaleOrder/sale-order-api';
import {
  CreateSalesOrderRequestV1,
  CreateSalesOrderStatus
} from 'services/SaleOrder/sale-order-type';
import { DEFAULT_DATE_FORMAT, DEFAULT_DATE_FORMAT_BFF } from 'utils';
import { formatCurrency, formatNumber } from 'utils/utils';
import * as Yup from 'yup';
import { addCustomerAddress, addCustomerContact, updateCustomer } from 'services/Customer/customer-api';
import {
  CreateCustomerAddressRequest,
  CreateCustomerContactRequest
} from 'services/Customer/customer-type';
import { GROUP_CODE, SystemConfig } from 'services/Config/config-type';
import { getSystemConfig } from 'services/Config/config-api';
import SearchFreelanceSalesDialog from 'dialogs/QuotationManagement/New/SearchFreelanceSalesDialog';

interface SaleOrderRFQParams {
  rfqId: string;
}

interface SaleOrderRFQItem {
  id: number;
  imageUrl?: string | null;
  optionId?: number;
  tierId?: number;
  supplierQuoteTierId?: number;
  quotationDetailId?: number | string;
  shippingMethod: 'LAND' | 'SEA' | null;
  isFcl?: boolean;
  isShareFCL?: boolean;
  supplierCurrency?: string | null;
  supplierUnitPrice?: number | null;
  exchangeRate?: number | null;
  supplierShippingCost?: number | null;
  supplierTotalUnitCost?: number | null;
  name: string;
  spec: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  totalFreight: number;
  remark: string;
}

interface SaleOrderRFQFormValues {
  rfqId: string;
  isVat: boolean;
  discount: number;
  salesId: string;
  coSaleId: string;
  shippingType: string;
  shipping: string;
  docDate: dayjs.Dayjs | string;
  effectiveDate: dayjs.Dayjs | string;
  urgentOrder: boolean;
  customerId: string;
  customerAddressId: string;
  customerContactId: string;
  customerName: string;
  contactNumber: string;
  creditTerm: string;
  dropOffId: string;
  dropOffName: string;
  supplierId: string;
  areaType: string;
  provinceId: string;
  amphureId: string;
  orderMakerId: string;
  deliveryDate: string;
  sendingTime: string;
  notes: string;
  requestCoa: boolean;
  requestPo: boolean;
  items: SaleOrderRFQItem[];
}

interface SelectedRFQQueryItem {
  detailId: number;
  quotationDetailId: string;
  shippingMethod: 'LAND' | 'SEA';
}

function createEmptySaleOrderItem(id: number): SaleOrderRFQItem {
  return {
    id,
    imageUrl: null,
    shippingMethod: null,
    name: '',
    spec: '',
    quantity: 1,
    unitPrice: 0,
    amount: 0,
    totalFreight: 0,
    remark: ''
  };
}

function getExpireDays(config?: SystemConfig[] | null, fallbackDays = 7): number {
  const parsedDays = Number(
    config?.[0]?.code || config?.[0]?.nameTh || config?.[0]?.nameEn || fallbackDays
  );
  return Math.max(1, Number.isFinite(parsedDays) ? parsedDays : fallbackDays);
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: '#fff',
    minHeight: 54
  },
  '& .MuiInputBase-input': {
    fontSize: 16,
    py: 1.8
  }
};

function getCreatedSaleOrderId(response: any): string {
  return (
    response?.data?.data?.id ||
    response?.data?.data?.salesOrderNo ||
    response?.data?.data?.saleOrderId ||
    response?.data?.id ||
    response?.data?.salesOrderNo ||
    response?.data?.orderId ||
    response?.data?.saleOrderId ||
    response?.id ||
    response?.salesOrderNo ||
    response?.orderId ||
    response?.saleOrderId ||
    ''
  );
}

function getSystemConfigLabel(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.nameTh || value.nameEn || value.code || '';
}

function getRFQProductLabel(value: RFQRecord['productFamily'] | RFQRecord['material']): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.nameTh || value.nameEn || value.code || '';
}

function getQuotationImageUrl(quotation?: Quotation, quotationDetailId?: number | string): string {
  if (!quotation?.items?.length) {
    return '';
  }

  if (quotationDetailId !== undefined && quotationDetailId !== null) {
    console.log('quotation ', quotation);
    console.log('quotationDetailId ', quotationDetailId);
    const matchedItem = quotation.items.find((item) => String(item.id) === String(quotationDetailId));
    if (matchedItem?.imagePreview) {
      return matchedItem.imagePreview;
    }
  }

  return quotation.items.find((item) => Boolean(item.imagePreview))?.imagePreview || '';
}

function deriveShippingTypeFromItems(items: SaleOrderRFQItem[]): string {
  const shippingMethods = Array.from(
    new Set(
      items
        .map((item) => item.shippingMethod)
        .filter((shippingMethod): shippingMethod is 'LAND' | 'SEA' => Boolean(shippingMethod))
    )
  );

  if (!shippingMethods.length) {
    return '';
  }

  return shippingMethods.length > 1 ? 'ALL' : shippingMethods[0];
}

function getDefaultDropOff(customer: any): CustomerDropOff | null {
  const dropOffs = customer?.customerDropOffs || customer?.dropOffs || [];
  return dropOffs.find((dropOff: CustomerDropOff) => dropOff.isDefault) || dropOffs[0] || null;
}

function getRFQSalesEmployeeId(sales?: RFQRecord['sales']): string {
  return sales?.employeeId || '';
}

function getRFQSalesDisplayValue(sales?: RFQRecord['sales']): string {
  const employeeId = getRFQSalesEmployeeId(sales);
  const nickname = sales?.nickname || sales?.nickName || '';

  return [employeeId, nickname].filter(Boolean).join(' - ');
}

function getShippingTypeLabel(shippingType?: string | null): string {
  if (shippingType === 'SEA') return 'ส่งทางเรือ';
  if (shippingType === 'LAND') return 'ส่งทางรถ';
  if (shippingType === 'ALL') return 'ส่งทางรถ / ส่งทางเรือ';
  return '';
}

function getShippingMethodIcon(shippingMethod?: string | null): JSX.Element | null {
  if (shippingMethod === 'SEA') {
    return <DirectionsBoat sx={{ color: '#00897b', fontSize: 30 }} />;
  }

  if (shippingMethod === 'LAND') {
    return <LocalShipping sx={{ color: '#1565c0', fontSize: 30 }} />;
  }

  return null;
}

function getShippingMethodColor(shippingMethod?: string | null): string {
  if (shippingMethod === 'SEA') return '#00897b';
  if (shippingMethod === 'LAND') return '#1565c0';
  return '#64748b';
}

function inferQuotationItemShippingMethod(name?: string | null): 'LAND' | 'SEA' | null {
  if (!name) return null;
  if (name.includes('ทางเรือ')) return 'SEA';
  if (name.includes('ทางรถ')) return 'LAND';
  return null;
}

const ADD_NEW_FREELANCE_SALE_VALUE = '__ADD_NEW_FREELANCE_SALE__';
const ADD_NEW_ADDRESS_VALUE = '__ADD_NEW_ADDRESS__';
const ADD_NEW_CONTACT_VALUE = '__ADD_NEW_CONTACT__';
const CO_SALE_MODE_NONE = 'NONE';
const CO_SALE_MODE_FREELANCE = 'FREELANCE';
const CO_SALE_MODE_EXTERNAL = 'EXTERNAL';

const matchesFreelanceSaleCoverage = (
  saleCoverage?: string | null,
  salesId?: string | null
): boolean => {
  const normalizedSaleCoverage = (saleCoverage || '').trim();
  const normalizedSalesId = (salesId || '').trim();

  if (!normalizedSaleCoverage || !normalizedSalesId) {
    return false;
  }

  return normalizedSaleCoverage === normalizedSalesId;
};

function detectCoSaleMode(
  coSaleId?: string | null,
  freelanceSales: FreelanceSaleRecord[] = []
): string {
  const normalizedCoSaleId = (coSaleId || '').trim();

  if (!normalizedCoSaleId) {
    return CO_SALE_MODE_NONE;
  }

  if (freelanceSales.some((option) => option.id === normalizedCoSaleId)) {
    return CO_SALE_MODE_FREELANCE;
  }

  return CO_SALE_MODE_NONE;
}

function getShippingPrice(tier: RFQDetailTier, shippingMethod: 'LAND' | 'SEA'): number {
  return Number(
    shippingMethod === 'SEA'
      ? tier.seaTotalPrice || tier.productPrice || 0
      : tier.landTotalPrice || tier.productPrice || 0
  );
}

function getTotalFreight(tier: RFQDetailTier | undefined, shippingMethod: 'LAND' | 'SEA'): number {
  if (!tier) {
    return 0;
  }

  const quantity = Number(tier.quantity || 0);
  const freightCost = Number(
    shippingMethod === 'SEA' ? tier.seaFreightCost || 0 : tier.landFreightCost || 0
  );

  return quantity * freightCost;
}

function getRFQDetailSupplierId(detail?: RFQDetailOption): string {
  return detail?.supplier?.supplierId || detail?.supplier?.id || '';
}

function formatApiDate(value: dayjs.Dayjs | string): string | undefined {
  if (!value) return undefined;
  if (dayjs.isDayjs(value)) return value.format(DEFAULT_DATE_FORMAT_BFF);
  const dateParts = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (dateParts) {
    return `${dateParts[3]}-${dateParts[2]}-${dateParts[1]}`;
  }

  const date = dayjs(value);
  return date.isValid() ? date.format(DEFAULT_DATE_FORMAT_BFF) : undefined;
}

function getShippingDisplayLabel(
  shippingMethod: 'LAND' | 'SEA' | null,
  isFcl?: boolean | null,
  isShareFCL?: boolean | null
): string {
  if (!shippingMethod) {
    return '';
  }

  const shippingLabel = shippingMethod === 'SEA' ? 'ส่งทางเรือ' : 'ส่งทางรถ';

  if (shippingMethod === 'SEA') {
    if (Boolean(isShareFCL)) {
      return `${shippingLabel} แบบแชร์ปิดตู้`;
    }

    if (Boolean(isFcl)) {
      return `${shippingLabel} แบบปิดตู้`;
    }
  }

  return shippingLabel;
}

function hasFclShippingTag(
  item: Pick<SaleOrderRFQItem, 'shippingMethod' | 'isFcl' | 'isShareFCL' | 'name' | 'remark'>
): boolean {
  if (item.shippingMethod !== 'SEA') {
    return false;
  }

  if (Boolean(item.isFcl) || Boolean(item.isShareFCL)) {
    return true;
  }

  return [item.name, item.remark].some((value) => String(value || '').includes('แบบปิดตู้'));
}

function buildPaymentTermRemark(customer?: Customer | null): string {
  const paymentTermLabel =
    customer?.customerPaymentTerm?.nameTh ||
    customer?.customerPaymentTerm?.nameEn ||
    customer?.customerPaymentTerm?.code ||
    '';

  if (!paymentTermLabel) {
    return '';
  }

  const paymentTermPrefix = 'เงื่อนไขการชำระเงิน :';
  const paymentTermLine = `${paymentTermPrefix} ${paymentTermLabel}`;

  return paymentTermLine;
}

function createSaleOrderItemsFromRFQ(rfq: RFQRecord): SaleOrderRFQItem[] {
  const material = getRFQProductLabel(rfq.material);
  const productFamily = getRFQProductLabel(rfq.productFamily);
  const orderType = getSystemConfigLabel(rfq.orderType);

  if (!rfq.details?.length) {
    return [
      {
        id: Date.now(),
        shippingMethod: 'LAND',
        name: productFamily || 'PRE-ORDER',
        spec: [orderType, material, rfq.capacity, rfq.description].filter(Boolean).join('\n'),
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        totalFreight: 0,
        remark: `RFQ: ${rfq.id}`
      }
    ];
  }

  return rfq.details.flatMap((detail: RFQDetailOption, optionIndex) => {
    const tiers = detail.tiers?.length ? detail.tiers : [undefined];

    return tiers.flatMap((tier, tierIndex) => {
      if (!tier) {
        return [
          {
            id: Date.now() + optionIndex,
            optionId: detail.id,
            shippingMethod: 'LAND' as const,
            name: detail.optionName || productFamily || 'PRE-ORDER',
            spec: [detail.spec, material, rfq.capacity, rfq.description].filter(Boolean).join('\n'),
            quantity: 1,
            unitPrice: 0,
            amount: 0,
            totalFreight: 0,
            remark: `RFQ: ${rfq.id}`
          }
        ];
      }

      return (['LAND', 'SEA'] as const).map((shippingMethod, shippingIndex) => {
        const quantity = Number(tier.quantity || 1);
        const unitPrice = getShippingPrice(tier, shippingMethod);
        const shippingDisplayLabel = getShippingDisplayLabel(
          shippingMethod,
          tier.isFcl,
          tier.isShareFCL
        );

        return {
          id: Number(`${detail.id}${tier.id}${shippingIndex}`),
          optionId: detail.id,
          tierId: tier.id,
          supplierQuoteTierId: tier.supplierQuoteTierId || undefined,
          shippingMethod,
          isFcl: Boolean(tier.isFcl),
          isShareFCL: Boolean(tier.isShareFCL),
          supplierCurrency: tier.currency || null,
          supplierUnitPrice: Number(tier.productPrice || 0),
          exchangeRate: Number(tier.exchangeRate || 0),
          supplierShippingCost: Number(
            shippingMethod === 'SEA' ? tier.seaFreightCost || 0 : tier.landFreightCost || 0
          ),
          supplierTotalUnitCost:
            Number(tier.productPrice || 0) +
            Number(shippingMethod === 'SEA' ? tier.seaFreightCost || 0 : tier.landFreightCost || 0),
          name: `${detail.optionName || productFamily || 'PRE-ORDER'} - MOQ ${formatNumber(
            quantity
          )} - ${shippingDisplayLabel}`,
          spec: [detail.spec, material, rfq.capacity, rfq.description].filter(Boolean).join('\n'),
          quantity,
          unitPrice,
          amount: quantity * unitPrice,
          totalFreight: getTotalFreight(tier, shippingMethod),
          remark: [
            `RFQ: ${rfq.id}`,
            `Option: ${detail.optionName || `Option ${optionIndex + 1}`}`,
            `MOQ: ${formatNumber(quantity)}`,
            `Shipping: ${shippingDisplayLabel}`
          ].join('\n')
        };
      });
    });
  });
}

function createSaleOrderItemsFromQuotation(
  rfq: RFQRecord,
  quotation: Quotation
): SaleOrderRFQItem[] {
  const material = getRFQProductLabel(rfq.material);
  const productFamily = getRFQProductLabel(rfq.productFamily);
  const rfqRows = (rfq.details || []).flatMap((detail: RFQDetailOption, optionIndex) => {
    const tiers = detail.tiers?.length ? detail.tiers : [undefined];

    return tiers.flatMap((tier, tierIndex) => {
      if (!tier) {
        return [
          {
            optionId: detail.id,
            tierId: undefined,
            shippingMethod: 'LAND' as const,
            fallbackId: Number(`${detail.id}${optionIndex}${tierIndex}`)
          }
        ];
      }

      const landTotalPrice = Number(tier.landTotalPrice || 0);
      const seaTotalPrice = Number(tier.seaTotalPrice || 0);

      if (landTotalPrice > 0 && seaTotalPrice > 0) {
        return (['LAND', 'SEA'] as const).map((shippingMethod, shippingIndex) => ({
          optionId: detail.id,
          tierId: tier.id,
          shippingMethod,
          fallbackId: Number(`${detail.id}${tier.id}${shippingIndex}`)
        }));
      }

      if (landTotalPrice > 0) {
        return [
          {
            optionId: detail.id,
            tierId: tier.id,
            shippingMethod: 'LAND' as const,
            fallbackId: Number(`${detail.id}${tier.id}0`)
          }
        ];
      }

      if (seaTotalPrice > 0) {
        return [
          {
            optionId: detail.id,
            tierId: tier.id,
            shippingMethod: 'SEA' as const,
            fallbackId: Number(`${detail.id}${tier.id}1`)
          }
        ];
      }

      return [
        {
          optionId: detail.id,
          tierId: tier.id,
          shippingMethod: 'LAND' as const,
          fallbackId: Number(`${detail.id}${tier.id}0`)
        }
      ];
    });
  });

  const availableRfqRows = [...rfqRows];

  return (quotation.items || []).map((item, index) => {
    const inferredShippingMethod = inferQuotationItemShippingMethod(item.name);
    const quantity = Number(item.quantity || 1);
    const unitPrice = Number(item.unitPrice || 0);
    const exactMatchIndex = availableRfqRows.findIndex((row) => {
      if (inferredShippingMethod && row.shippingMethod !== inferredShippingMethod) {
        return false;
      }

      const tierQuantity = Number(
        rfq.details
          ?.find((detail) => detail.id === row.optionId)
          ?.tiers?.find((tier) => tier.id === row.tierId)?.quantity || 0
      );

      if (tierQuantity !== quantity) {
        return false;
      }

      const detail = rfq.details?.find((candidate) => candidate.id === row.optionId);
      const tier = detail?.tiers?.find((candidate) => candidate.id === row.tierId);
      const expectedPrice = Number(
        row.shippingMethod === 'SEA' ? tier?.seaTotalPrice || 0 : tier?.landTotalPrice || 0
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

          const tierQuantity = Number(
            rfq.details
              ?.find((detail) => detail.id === row.optionId)
              ?.tiers?.find((tier) => tier.id === row.tierId)?.quantity || 0
          );

          return tierQuantity === quantity;
        });
    const fallbackIndex =
      quantityMatchIndex >= 0
        ? quantityMatchIndex
        : availableRfqRows.findIndex((row) =>
          inferredShippingMethod ? row.shippingMethod === inferredShippingMethod : true
        );
    const mappedRow = fallbackIndex >= 0 ? availableRfqRows.splice(fallbackIndex, 1)[0] : undefined;
    const numericItemId = Number(item.id);
    const mappedDetail = rfq.details?.find((detail) => detail.id === mappedRow?.optionId);
    const mappedTier = mappedDetail?.tiers?.find((tier) => tier.id === mappedRow?.tierId);
    const mappedShippingMethod = mappedRow?.shippingMethod || 'LAND';
    const shippingDisplayLabel = getShippingDisplayLabel(
      mappedShippingMethod,
      mappedTier?.isFcl,
      mappedTier?.isShareFCL
    );
    const normalizedItemName = item.name || productFamily || 'PRE-ORDER';
    const itemNameWithShippingLabel = normalizedItemName.includes(shippingDisplayLabel)
      ? normalizedItemName
      : `${normalizedItemName} - ${shippingDisplayLabel}`;

    return {
      id: Number.isFinite(numericItemId)
        ? numericItemId
        : mappedRow?.fallbackId || Date.now() + index,
      optionId: mappedRow?.optionId,
      tierId: mappedRow?.tierId,
      quotationDetailId: item.id,
      supplierQuoteTierId: mappedTier?.supplierQuoteTierId || undefined,
      shippingMethod: mappedShippingMethod,
      isFcl: Boolean(mappedTier?.isFcl),
      isShareFCL: Boolean(mappedTier?.isShareFCL),
      supplierCurrency: mappedTier?.currency || null,
      supplierUnitPrice: Number(mappedTier?.productPrice || 0),
      exchangeRate: Number(mappedTier?.exchangeRate || 0),
      supplierShippingCost: Number(
        mappedShippingMethod === 'SEA'
          ? mappedTier?.seaFreightCost || 0
          : mappedTier?.landFreightCost || 0
      ),
      supplierTotalUnitCost:
        Number(mappedTier?.productPrice || 0) +
        Number(
          mappedShippingMethod === 'SEA'
            ? mappedTier?.seaFreightCost || 0
            : mappedTier?.landFreightCost || 0
        ),
      name: itemNameWithShippingLabel,
      spec: item.spec || [material, rfq.capacity, rfq.description].filter(Boolean).join('\n'),
      quantity,
      unitPrice: Number(item.unitPrice || 0),
      amount: Number(item.amount || 0) || quantity * Number(item.unitPrice || 0),
      totalFreight: getTotalFreight(mappedTier, mappedShippingMethod),
      remark: [`RFQ: ${rfq.id}`, `Shipping: ${shippingDisplayLabel}`].join('\n')
    };
  });
}

export default function SalesOrderRFQ(): JSX.Element {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { rfqId } = useParams<SaleOrderRFQParams>();
  const isDownSm = useMediaQuery('(max-width:600px)');
  const today = dayjs();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddCustomerAddressDialogOpen, setIsAddCustomerAddressDialogOpen] = useState(false);
  const [isAddCustomerContactDialogOpen, setIsAddCustomerContactDialogOpen] = useState(false);
  const [isUpdateCustomerDialogOpen, setIsUpdateCustomerDialogOpen] = useState(false);
  const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<CreateSalesOrderStatus | 'back'>('CREATED');
  const [nextManualItemId, setNextManualItemId] = useState(-1);
  const [coSaleMode, setCoSaleMode] = useState(CO_SALE_MODE_NONE);
  const [hasInitializedCoSale, setHasInitializedCoSale] = useState(false);
  const [openSearchFreelanceSalesDialog, setOpenSearchFreelanceSalesDialog] = useState(false);
  const [openCreateFreelanceSaleDialog, setOpenCreateFreelanceSaleDialog] = useState(false);
  const [selectedFreelanceSaleItem, setSelectedFreelanceSaleItem] = useState<FreelanceSaleRecord | null>(null);
  const [selectedFreelanceSaleLabel, setSelectedFreelanceSaleLabel] = useState('');
  const [newFreelanceSale, setNewFreelanceSale] = useState<{
    name: string;
    contactNumber: string;
    saleCoverage: string;
    additional: string;
  }>({
    name: '',
    contactNumber: '',
    saleCoverage: '',
    additional: ''
  });
  const useStyles = makeStyles({
    hideObject: {
      display: 'none'
    },
    noResultMessage: {
      textAlign: 'center',
      fontSize: '1.2em',
      fontWeight: 'bold'
    },
    tableHeader: {
      border: '2px solid #e0e0e0',
      fontWeight: 'bold',
      paddingLeft: '10px',
      textAlign: 'center'
    },
    datePickerFromTo: {
      '&& .MuiOutlinedInput-input': {
        padding: '16.5px 14px'
      },
      '&& .MuiFormLabel-root': {
        fontSize: '13px'
      }
    },
    bkkChip: {
      backgroundColor: '#068710',
      color: 'white'
    },
    provinceChip: {
      backgroundColor: '#a533ff',
      color: 'white'
    },
    fileInput: {
      width: '100%',
      padding: '11px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontSize: '14px',
      '::file-selector-button': {
        color: 'red'
      }
    }
  });
  const classes = useStyles();
  const selectedRFQParams = useMemo<SelectedRFQQueryItem[]>(() => {
    const params = new URLSearchParams(location.search);
    const serializedItems = params.get('selectedItems');

    if (serializedItems) {
      try {
        const parsedItems = JSON.parse(decodeURIComponent(serializedItems));

        if (Array.isArray(parsedItems)) {
          return parsedItems
            .map((item) => ({
              detailId: Number(item?.detailId || 0),
              quotationDetailId: String(item?.quotationDetailId || ''),
              shippingMethod: item?.shippingMethod === 'SEA' ? 'SEA' : 'LAND'
            }))
            .filter((item) => item.detailId && item.quotationDetailId);
        }
      } catch (error) {
        console.error('Failed to parse selected RFQ items from query string', error);
      }
    }

    const detailId = Number(params.get('detailId') || 0);
    const quotationDetailId = params.get('quotationDetailId') || '';

    if (!detailId || !quotationDetailId) {
      return [];
    }

    return [
      {
        detailId,
        quotationDetailId,
        shippingMethod: params.get('shippingMethod') === 'SEA' ? 'SEA' : 'LAND'
      }
    ];
  }, [location.search]);
  const hasSelectedRFQParams = selectedRFQParams.length > 0;

  const { data: rfq, isFetching: isRFQFetching } = useQuery(
    ['sale-order-rfq', rfqId],
    () => getRFQ(rfqId),
    {
      enabled: Boolean(rfqId),
      refetchOnWindowFocus: false
    }
  );
  const quotationNo = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const explicitQuotationNo = params.get('quotationNo') || '';

    if (explicitQuotationNo) {
      return explicitQuotationNo;
    }

    return (
      rfq?.quotations?.find((quotation) => quotation.isLatest)?.quotationNo ||
      rfq?.quotations?.[0]?.quotationNo ||
      ''
    );
  }, [location.search, rfq?.quotations]);
  const { data: quotation } = useQuery(
    ['sale-order-rfq-quotation', quotationNo],
    () => getQuotation(quotationNo || ''),
    {
      enabled: Boolean(quotationNo),
      refetchOnWindowFocus: false
    }
  );
  const shouldLoadFreelanceSales = coSaleMode === CO_SALE_MODE_FREELANCE;
  const { data: freelanceSales = [], isFetching: isFreelanceSalesFetching } = useQuery(
    'sale-order-rfq-freelance-sales',
    () => getFreelanceSales(),
    {
      enabled: shouldLoadFreelanceSales,
      refetchOnWindowFocus: false
    }
  );
  const { data: provinces = [] } = useQuery('sale-order-rfq-province', () => getProvince(), {
    refetchOnWindowFocus: false
  });
  const { data: districts = [] } = useQuery('sale-order-rfq-district', () => getDistrict(), {
    refetchOnWindowFocus: false
  });
  const { data: subdistricts = [] } = useQuery(
    'sale-order-rfq-subdistrict',
    () => getSubDistrict(),
    {
      refetchOnWindowFocus: false
    }
  );
  const { data: countries = [] } = useQuery('sale-order-rfq-country', () => getCountry(), {
    refetchOnWindowFocus: false
  });
  const showThaiAddressFields = addressDialogFormik.values.country === 'TH';
  const { data: salesOrderExpireDayConfig = [] } = useQuery(
    ['sale-order-rfq-expire-day', GROUP_CODE.SALES_ORDER_EXPIRE_DAY],
    () => getSystemConfig(GROUP_CODE.SALES_ORDER_EXPIRE_DAY),
    {
      refetchOnWindowFocus: false
    }
  );
  const { data: customerTypeList = [] } = useQuery(
    ['sale-order-rfq-customer-type', GROUP_CODE.CUSTOMER_TYPE],
    () => getSystemConfig(GROUP_CODE.CUSTOMER_TYPE),
    {
      refetchOnWindowFocus: false
    }
  );
  const { data: customerTierList = [] } = useQuery(
    ['sale-order-rfq-customer-tier', GROUP_CODE.CUSTOMER_TIER],
    () => getSystemConfig(GROUP_CODE.CUSTOMER_TIER),
    {
      refetchOnWindowFocus: false
    }
  );
  const { data: customerSegmentList = [] } = useQuery(
    ['sale-order-rfq-customer-segment', GROUP_CODE.CUSTOMER_SEGMENT],
    () => getSystemConfig(GROUP_CODE.CUSTOMER_SEGMENT),
    {
      refetchOnWindowFocus: false
    }
  );
  const { data: customerCreditTermList = [] } = useQuery(
    ['sale-order-rfq-customer-credit-term', GROUP_CODE.CUSTOMER_CREDIT_TERM],
    () => getSystemConfig(GROUP_CODE.CUSTOMER_CREDIT_TERM),
    {
      refetchOnWindowFocus: false
    }
  );
  const { data: customerPaymentTermList = [] } = useQuery(
    ['sale-order-rfq-customer-payment-term', GROUP_CODE.CUSTOMER_PAYMENT_TERM],
    () => getSystemConfig(GROUP_CODE.CUSTOMER_PAYMENT_TERM),
    {
      refetchOnWindowFocus: false
    }
  );
  const { data: customerBillingConditionList = [] } = useQuery(
    ['sale-order-rfq-customer-billing-condition', GROUP_CODE.CUSTOMER_BILLING_CONDITION],
    () => getSystemConfig(GROUP_CODE.CUSTOMER_BILLING_CONDITION),
    {
      refetchOnWindowFocus: false
    }
  );
  const { data: customerPaymentCycleList = [] } = useQuery(
    ['sale-order-rfq-customer-payment-cycle', GROUP_CODE.CUSTOMER_PAYMENT_CYCLE],
    () => getSystemConfig(GROUP_CODE.CUSTOMER_PAYMENT_CYCLE),
    {
      refetchOnWindowFocus: false
    }
  );
  const salesOrderExpireDays = getExpireDays(salesOrderExpireDayConfig, 7);
  const salesOrderDefaultEffectiveDate = today.add(salesOrderExpireDays, 'day');
  const formik = useFormik<SaleOrderRFQFormValues>({
    initialValues: {
      rfqId,
      isVat: false,
      discount: 0,
      salesId: '',
      coSaleId: '',
      shippingType: '',
      shipping: '',
      docDate: today,
      effectiveDate: salesOrderDefaultEffectiveDate,
      urgentOrder: false,
      customerId: '',
      customerAddressId: '',
      customerContactId: '',
      customerName: '',
      contactNumber: '',
      creditTerm: '',
      dropOffId: '',
      dropOffName: '',
      supplierId: '',
      areaType: '',
      provinceId: '',
      amphureId: '',
      orderMakerId: '',
      deliveryDate: today.format(DEFAULT_DATE_FORMAT),
      sendingTime: '',
      notes: '',
      requestCoa: false,
      requestPo: false,
      items: []
    },
    validationSchema: Yup.object({
      customerId: Yup.string().required(),
      deliveryDate: Yup.string().required()
    }),
    onSubmit: () => undefined
  });
  const selectedFreelanceSale =
    selectedFreelanceSaleItem ||
    freelanceSales.find((option) => option.id === formik.values.coSaleId) ||
    null;
  const selectedFreelanceSaleDisplay =
    selectedFreelanceSaleLabel ||
    (selectedFreelanceSale ? `${selectedFreelanceSale.id} - ${selectedFreelanceSale.name}` : '') ||
    formik.values.coSaleId ||
    '';

  useEffect(() => {
    const shippingTypeFromItems = deriveShippingTypeFromItems(formik.values.items);
    if (formik.values.shipping !== shippingTypeFromItems) {
      formik.setFieldValue('shipping', getShippingTypeLabel(shippingTypeFromItems), false);
    }
  }, [formik.values.items]);

  useEffect(() => {
    const fallbackEffectiveDate = today.add(7, 'day');
    const currentEffectiveDate = formik.values.effectiveDate
      ? dayjs(formik.values.effectiveDate)
      : null;

    if (!currentEffectiveDate || currentEffectiveDate.isSame(fallbackEffectiveDate, 'day')) {
      formik.setFieldValue('effectiveDate', salesOrderDefaultEffectiveDate, false);
    }
  }, [salesOrderExpireDays]);

  const addressDialogFormik = useFormik({
    initialValues: {
      addressType: 'BILLING',
      label: '',
      addressLine1: '',
      addressLine2: '',
      province: '',
      district: '',
      subdistrict: '',
      postcode: '',
      country: 'TH'
    },
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      addressType: Yup.string().required(),
      country: Yup.string().required(),
      addressLine1: Yup.string().when('country', {
        is: 'TH',
        then: Yup.string().required(),
        otherwise: Yup.string().nullable().notRequired()
      }),
      province: Yup.string().when('country', {
        is: 'TH',
        then: Yup.string().required(),
        otherwise: Yup.string().nullable().notRequired()
      }),
      district: Yup.string().when('country', {
        is: 'TH',
        then: Yup.string().required(),
        otherwise: Yup.string().nullable().notRequired()
      }),
      subdistrict: Yup.string().when('country', {
        is: 'TH',
        then: Yup.string().required(),
        otherwise: Yup.string().nullable().notRequired()
      })
    }),
    onSubmit: () => undefined
  });

  const contactDialogFormik = useFormik({
    initialValues: {
      contactName: '',
      contactNumber: ''
    },
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      contactName: Yup.string()
        .max(255)
        .required(t('customerManagement.message.validateContactName')),
      contactNumber: Yup.string()
        .matches(/^[0-9]{9,10}$/, t('customerManagement.message.invalidPhoneNumberFormat'))
        .required(t('customerManagement.message.validateContactNumber'))
    }),
    onSubmit: () => undefined
  });
  const updateCustomerDialogFormik = useFormik({
    initialValues: {
      customerName: customer?.customerName ?? '',
      email: customer?.email ?? '',
      type: customer?.customerType?.code ?? '',
      tier: customer?.customerTier?.code ?? '',
      segment: customer?.customerSegment?.code ?? '',
      taxId: customer?.taxId ?? '',
      companyName: customer?.companyName ?? '',
      companyBranchCode: customer?.branchNumber ?? '',
      companyBranchName: customer?.branchName ?? '',
      creditTerm: customer?.customerCreditTerm?.code ?? '',
      paymentTerm: customer?.customerPaymentTerm?.code ?? '',
      billingCondition: customer?.customerBillingCondition ?? '',
      paymentCycle: customer?.customerPaymentCycle ?? '',
      salesAccounts: customer?.salesAccounts?.length
        ? customer.salesAccounts
        : customer?.salesAccount
          ? [customer.salesAccount]
          : [],
      coSalesAccount: customer?.coSalesAccount ?? ''
    },
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      customerName: Yup.string().max(255).required(t('customerManagement.message.validateCustomerName')),
      type: Yup.string().max(255).required(t('customerManagement.message.validateType')),
      tier: Yup.string().max(255).nullable(),
      segment: Yup.string().max(255).nullable(),
      companyName: Yup.string().when('type', {
        is: 'COMPANY',
        then: Yup.string().required(t('customerManagement.message.validateCompanyName')),
        otherwise: Yup.string().nullable()
      }),
      companyBranchCode: Yup.string().when('type', {
        is: 'COMPANY',
        then: Yup.string().required(t('customerManagement.message.validateCompanyBranchCode')),
        otherwise: Yup.string().nullable()
      }),
      companyBranchName: Yup.string().when('type', {
        is: 'COMPANY',
        then: Yup.string().required(t('customerManagement.message.validateCompanyBranchName')),
        otherwise: Yup.string().nullable()
      }),
      creditTerm: Yup.string().max(255).required(t('customerManagement.message.validateCreditTerm')),
      paymentTerm: Yup.string().max(255).required(t('customerManagement.message.validatePaymentTerm'))
    }),
    onSubmit: async (values, actions) => {
      if (!customer?.id) {
        return;
      }

      actions.setSubmitting(true);
      const payload = {
        customerName: values.customerName || null,
        customerType: values.type || null,
        customerTier: values.tier || null,
        customerSegment: values.segment || null,
        email: values.email || null,
        taxId: values.taxId || null,
        companyName: values.companyName || null,
        branchNumber: values.companyBranchCode || null,
        branchName: values.companyBranchName || null,
        creditTerm: values.creditTerm || null,
        paymentTerm: values.paymentTerm || null,
        billingCondition: values.billingCondition || null,
        paymentCycle: values.paymentCycle || null,
        salesAccount: values.salesAccounts[0] || null,
        salesAccounts: values.salesAccounts,
        coSalesAccount: values.coSalesAccount || null
      };

      const updatePromise = updateCustomer(customer.id, payload).then(() => getCustomer(customer.id));

      toast.promise(updatePromise, {
        loading: t('toast.loading'),
        success: (response) => {
          const updatedCustomer = response as Customer;
          if (updatedCustomer) {
            setCustomer(updatedCustomer);
            formik.setFieldValue('salesId', updatedCustomer.salesAccounts?.[0] || updatedCustomer.salesAccount || '');
            formik.setFieldValue('coSaleId', updatedCustomer.coSalesAccount || '');
            setCoSaleMode(
              updatedCustomer.coSalesAccount ? CO_SALE_MODE_FREELANCE : CO_SALE_MODE_NONE
            );
          }
          setIsUpdateCustomerDialogOpen(false);
          return t('toast.success');
        },
        error: t('toast.failed')
      });

      updatePromise.finally(() => {
        actions.setSubmitting(false);
      });
    }
  });

  useEffect(() => {
    if (!formik.values.coSaleId) {
      if (hasInitializedCoSale && coSaleMode !== CO_SALE_MODE_NONE) {
        setCoSaleMode(CO_SALE_MODE_NONE);
      }
      setSelectedFreelanceSaleItem(null);
      setSelectedFreelanceSaleLabel('');
      return;
    }

    const detectedMode = detectCoSaleMode(formik.values.coSaleId, freelanceSales);
    if (detectedMode !== CO_SALE_MODE_NONE) {
      setHasInitializedCoSale(true);
      if (coSaleMode !== detectedMode) {
        setCoSaleMode(detectedMode);
      }
    }
  }, [coSaleMode, freelanceSales, formik.values.coSaleId, hasInitializedCoSale]);

  useEffect(() => {
    if (!formik.values.coSaleId) {
      return;
    }

    const matchedFreelanceSale = freelanceSales.find(
      (option) => option.id === formik.values.coSaleId
    );

    if (!matchedFreelanceSale) {
      return;
    }

    setSelectedFreelanceSaleItem(matchedFreelanceSale);
    setSelectedFreelanceSaleLabel(`${matchedFreelanceSale.id} - ${matchedFreelanceSale.name}`);
  }, [formik.values.coSaleId, freelanceSales]);

  useEffect(() => {
    if (!hasInitializedCoSale || !formik.values.coSaleId) {
      return;
    }

    if (coSaleMode === CO_SALE_MODE_NONE) {
      formik.setFieldValue('coSaleId', '');
      setSelectedFreelanceSaleItem(null);
      setSelectedFreelanceSaleLabel('');
      return;
    }

    if (
      coSaleMode === CO_SALE_MODE_FREELANCE &&
      !freelanceSales.some((option) => option.id === formik.values.coSaleId)
    ) {
      formik.setFieldValue('coSaleId', '');
      setSelectedFreelanceSaleItem(null);
      setSelectedFreelanceSaleLabel('');
      return;
    }

    // external mode intentionally keeps the current value, matching quotation flow
  }, [coSaleMode, freelanceSales, formik.values.coSaleId, hasInitializedCoSale]);

  useEffect(() => {
    if (!openCreateFreelanceSaleDialog) {
      return;
    }

    setNewFreelanceSale((prev) => ({
      ...prev,
      saleCoverage: formik.values.salesId || ''
    }));
  }, [formik.values.salesId, openCreateFreelanceSaleDialog]);

  const handleOpenCreateFreelanceSaleDialog = () => {
    setNewFreelanceSale({
      name: '',
      contactNumber: '',
      saleCoverage: formik.values.salesId || '',
      additional: ''
    });
    setOpenCreateFreelanceSaleDialog(true);
  };

  const handleCreateFreelanceSale = async () => {
    if (!newFreelanceSale.name.trim()) {
      toast.error(t('toast.failed'));
      return;
    }

    setIsLoading(true);
    const request = createFreelanceSale({
      name: newFreelanceSale.name.trim(),
      contactNumber: newFreelanceSale.contactNumber?.trim() || '',
      saleCoverage: newFreelanceSale.saleCoverage?.trim() || '',
      additional: newFreelanceSale.additional?.trim() || ''
    });

    toast.promise(request, {
      loading: t('toast.loading'),
      success: () => t('toast.success'),
      error: () => t('toast.failed')
    });

    try {
      const createdFreelanceSale = await request;
      await queryClient.invalidateQueries('sale-order-rfq-freelance-sales');

      setCoSaleMode(CO_SALE_MODE_FREELANCE);
      formik.setFieldValue('coSaleId', createdFreelanceSale?.id || '');
      setSelectedFreelanceSaleItem(createdFreelanceSale || null);
      setSelectedFreelanceSaleLabel(
        createdFreelanceSale ? `${createdFreelanceSale.id} - ${createdFreelanceSale.name}` : ''
      );
      setOpenCreateFreelanceSaleDialog(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddCustomerAddressDialog = () => {
    if (!customer?.id) {
      toast.error('กรุณาเลือกลูกค้าก่อน');
      return;
    }

    addressDialogFormik.resetForm({
      values: {
        addressType: 'BILLING',
        label: '',
        addressLine1: '',
        addressLine2: '',
        province: '',
        district: '',
        subdistrict: '',
        postcode: '',
        country: 'TH'
      }
    });
    setIsAddCustomerAddressDialogOpen(true);
  };

  const getAddressPayload = (): CreateCustomerAddressRequest => {
    const values = addressDialogFormik.values;
    const selectedProvince = provinces.find((item: Province) => item.id === values.province);
    const selectedDistrict = districts.find((item: District) => item.id === values.district);
    const selectedSubdistrict = subdistricts.find(
      (item: SubDistrict) => item.id === values.subdistrict
    );

    return {
      addressType: values.addressType,
      isDefault: false,
      label: values.label,
      addressLine1: values.addressLine1,
      addressLine2: values.addressLine2,
      subdistrict: selectedSubdistrict?.nameTh,
      district: selectedDistrict?.nameTh,
      province: selectedProvince?.nameTh,
      postcode: values.postcode,
      country: values.country
    };
  };

  const handleConfirmAddCustomerAddress = async () => {
    if (!customer?.id) {
      return;
    }

    const errors = await addressDialogFormik.validateForm();
    addressDialogFormik.setTouched({
      addressType: true,
      label: true,
      addressLine1: true,
      addressLine2: true,
      province: true,
      district: true,
      subdistrict: true,
      country: true
    });

    if (Object.keys(errors).length > 0) {
      return;
    }

    addressDialogFormik.setSubmitting(true);
    const addAddressPromise = addCustomerAddress(customer.id, getAddressPayload());

    toast.promise(addAddressPromise, {
      loading: t('toast.loading'),
      success: (response) => {
        const updatedCustomer = response as Customer;
        setCustomer(updatedCustomer);

        const updatedAddresses = updatedCustomer.addresses || [];
        const selectedAddress =
          updatedAddresses.find((address) => address.isDefault) ||
          updatedAddresses[updatedAddresses.length - 1];

        if (selectedAddress?.id) {
          formik.setFieldValue('customerAddressId', selectedAddress.id);
        }

        addressDialogFormik.resetForm();
        setIsAddCustomerAddressDialogOpen(false);
        return t('toast.success');
      },
      error: t('toast.failed')
    });

    addAddressPromise.finally(() => {
      addressDialogFormik.setSubmitting(false);
    });
  };

  const handleOpenAddCustomerContactDialog = () => {
    if (!customer?.id) {
      toast.error('กรุณาเลือกลูกค้าก่อน');
      return;
    }

    contactDialogFormik.resetForm({
      values: {
        contactName: '',
        contactNumber: ''
      }
    });
    setIsAddCustomerContactDialogOpen(true);
  };

  const handleOpenUpdateCustomer = () => {
    if (!customer?.id) {
      return;
    }

    updateCustomerDialogFormik.resetForm();
    setIsUpdateCustomerDialogOpen(true);
  };

  const getContactPayload = (): CreateCustomerContactRequest => ({
    contactName: contactDialogFormik.values.contactName,
    contactNumber: contactDialogFormik.values.contactNumber
  });

  const handleConfirmAddCustomerContact = async () => {
    if (!customer?.id) {
      return;
    }

    const errors = await contactDialogFormik.validateForm();
    contactDialogFormik.setTouched({
      contactName: true,
      contactNumber: true
    });

    if (Object.keys(errors).length > 0) {
      return;
    }

    contactDialogFormik.setSubmitting(true);
    const addContactPromise = addCustomerContact(customer.id, getContactPayload());

    toast.promise(addContactPromise, {
      loading: t('toast.loading'),
      success: (response) => {
        const updatedCustomer = response as Customer;
        setCustomer(updatedCustomer);

        const updatedContacts = updatedCustomer.contacts || [];
        const selectedContact =
          updatedContacts.find((contact) => contact.isDefault) ||
          updatedContacts[updatedContacts.length - 1];

        if (selectedContact?.id) {
          formik.setFieldValue('customerContactId', selectedContact.id);
        }

        contactDialogFormik.resetForm();
        setIsAddCustomerContactDialogOpen(false);
        return t('toast.success');
      },
      error: t('toast.failed')
    });

    addContactPromise.finally(() => {
      contactDialogFormik.setSubmitting(false);
    });
  };

  const submitSalesOrder = async (status: CreateSalesOrderStatus) => {
    const errors = await formik.validateForm();
    formik.setTouched({
      customerId: true,
      deliveryDate: true
    });

    if (Object.keys(errors).length) return;

    const selectedItems = formik.values.items.filter((item) => Number(item.quantity || 0) > 0);

    if (!selectedItems.length) {
      toast.error('กรุณาเลือกรายการสินค้าจาก RFQ');
      return;
    }

    const fallbackSupplierId =
      rfq?.finalSupplier?.supplierId || rfq?.finalSupplier?.id || formik.values.supplierId;

    if (
      selectedItems.some(
        (item) =>
          !(
            getRFQDetailSupplierId(rfq?.details?.find((detail) => detail.id === item.optionId)) ||
            fallbackSupplierId
          )
      )
    ) {
      toast.error('ไม่พบข้อมูล Supplier สำหรับสร้าง Sales Order');
      return;
    }

    const payload: CreateSalesOrderRequestV1 = {
      rfqId,
      status,
      docDate: formatApiDate(formik.values.docDate),
      expireDate: formatApiDate(formik.values.effectiveDate),
      customerId: formik.values.customerId,
      customerAddressId: formik.values.customerAddressId,
      customerContactId: formik.values.customerContactId,
      salesId: formik.values.salesId,
      coSaleId: formik.values.coSaleId || undefined,
      discount: 0,
      freight: selectedItems.reduce((sum, item) => sum + Number(item.totalFreight || 0), 0),
      isVat: formik.values.isVat,
      shippingType: formik.values.shippingType || null,
      shipping: formik.values.shipping,
      requestCoa: formik.values.requestCoa,
      requestPo: formik.values.requestPo,
      remark: formik.values.notes,
      items: selectedItems.map((selectedItem) => ({
        supplierId:
          getRFQDetailSupplierId(
            rfq?.details?.find((detail) => detail.id === selectedItem.optionId)
          ) || fallbackSupplierId,
        name: selectedItem.name,
        capacity: rfq?.capacity || null,
        spec: selectedItem.spec,
        unitPrice: selectedItem.unitPrice,
        quantity: selectedItem.quantity,
        imageUrl: selectedItem.imageUrl || null,
        rfqDetailId: selectedItem.optionId,
        rfqTierId: selectedItem.tierId,
        quotationDetailId: selectedItem.quotationDetailId
          ? Number(selectedItem.quotationDetailId)
          : null,
        shippingMethod: selectedItem.shippingMethod,
        supplierCurrency: selectedItem.supplierCurrency || null,
        supplierUnitPrice: selectedItem.supplierUnitPrice ?? null,
        exchangeRate: selectedItem.exchangeRate ?? null,
        supplierShippingCost: selectedItem.supplierShippingCost ?? null,
        supplierTotalUnitCost: selectedItem.supplierTotalUnitCost ?? null,
        supplierQuoteTierId: selectedItem.supplierQuoteTierId
      }))
    };

    setIsLoading(true);

    try {
      const response = await toast.promise(createSalesOrderV1(payload), {
        loading: status === 'DRAFT' ? 'กำลังบันทึกฉบับร่าง' : 'กำลังสร้าง Sales Order',
        success: status === 'DRAFT' ? 'บันทึกฉบับร่างสำเร็จ' : 'สร้าง Sales Order สำเร็จ',
        error: status === 'DRAFT' ? 'บันทึกฉบับร่างไม่สำเร็จ' : 'สร้าง Sales Order ไม่สำเร็จ'
      });
      const saleOrderId = getCreatedSaleOrderId(response);

      const linkSelections = selectedItems
        .filter((item) => item.optionId && item.tierId)
        .map((item) => ({
          detailId: Number(item.optionId),
          tierId: Number(item.tierId),
          shippingMethod: item.shippingMethod,
          price: item.unitPrice
        }));

      if (saleOrderId && linkSelections.length) {
        await linkRFQSalesOrder(rfqId, {
          saleOrderId,
          detailId: linkSelections[0].detailId,
          tierId: linkSelections[0].tierId,
          shippingMethod: linkSelections[0].shippingMethod,
          price: linkSelections[0].price,
          selections: linkSelections
        });
      }

      history.push(
        saleOrderId
          ? ROUTE_PATHS.SALE_ORDER_DETAIL.replace(':id', saleOrderId)
          : ROUTE_PATHS.RFQ_DETAIL.replace(':id', rfqId)
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!rfq) return;

    const applyRFQ = async () => {
      const allItems = quotation
        ? createSaleOrderItemsFromQuotation(rfq, quotation?.data)
        : createSaleOrderItemsFromRFQ(rfq);
      const selectedItemFromDialog = allItems.filter((item) =>
        selectedRFQParams.some(
          (selectedItem) =>
            item.optionId === selectedItem.detailId &&
            String(item.quotationDetailId || '') === String(selectedItem.quotationDetailId) &&
            item.shippingMethod === selectedItem.shippingMethod
        )
      );
      const items = hasSelectedRFQParams ? selectedItemFromDialog : allItems.slice(0, 1);
      const itemsWithImage = items.map((item) => ({
        ...item,
        imageUrl:
          getQuotationImageUrl(quotation?.data, item.quotationDetailId) ||
          getQuotationImageUrl(quotation?.data) ||
          null
      }));
      let fullCustomer: Customer | null = null;
      let defaultDropOff: CustomerDropOff | null = null;

      // if (hasSelectedRFQParams && !selectedItemFromDialog) {
      //   toast.error('ไม่พบรายการสินค้าที่เลือกจากใบเสนอราคา');
      // }

      if (rfq.customer?.id) {
        try {
          fullCustomer = await getCustomer(rfq.customer.id);
          defaultDropOff = getDefaultDropOff(fullCustomer);
        } catch {
          fullCustomer = rfq.customer as Customer;
        }
      }
      const customerAddresses = fullCustomer?.addresses || rfq.customer?.addresses || [];
      const customerContacts = fullCustomer?.contacts || rfq.customer?.contacts || [];
      const defaultAddress =
        customerAddresses.find((address) => address.isDefault) || customerAddresses[0];
      const defaultContact =
        customerContacts.find((contact) => contact.contactName === rfq.contactName) ||
        customerContacts.find((contact) => contact.isDefault) ||
        customerContacts[0];
      const primarySelectedDetail = rfq.details?.find((detail) => detail.id === items[0]?.optionId);

      setCustomer(fullCustomer || (rfq.customer as Customer) || null);
      formik.setValues({
        ...formik.values,
        rfqId,
        isVat: Number(quotation?.data?.vat || 0) > 0,
        salesId: getRFQSalesEmployeeId(rfq.sales),
        coSaleId: quotation?.data?.coSaleId || rfq.customer?.coSalesAccount || '',
        coSaleMode:
          quotation?.data?.coSaleId || rfq.customer?.coSalesAccount
            ? CO_SALE_MODE_FREELANCE
            : CO_SALE_MODE_NONE,
        customerId: rfq.customer?.id || '',
        customerAddressId: defaultAddress?.id || '',
        customerContactId: defaultContact?.id || '',
        customerName: rfq.customer?.customerName || '',
        contactNumber: rfq.contactPhone || '',
        creditTerm: fullCustomer?.customerCreditTerm?.code || '',
        dropOffId: defaultDropOff?.id || '',
        dropOffName: defaultDropOff?.dropOffName || '',
        shippingType: rfq.shippingMethod,
        supplierId:
          getRFQDetailSupplierId(primarySelectedDetail) ||
          defaultDropOff?.supplier?.supplierId ||
          '',
        areaType: getSystemConfigLabel(defaultDropOff?.area),
        provinceId: defaultDropOff?.province?.id || '',
        amphureId: defaultDropOff?.amphure?.id || '',
        orderMakerId: getRFQSalesEmployeeId(rfq.sales),
        notes: buildPaymentTermRemark(fullCustomer || (rfq.customer as Customer) || null),
        requestCoa: false,
        requestPo: false,
        items: itemsWithImage
      });
    };

    applyRFQ();
  }, [rfq, quotation, hasSelectedRFQParams, selectedRFQParams]);
  const summaryShippingOptions = useMemo(() => {
    const shippingSummary = new Map<
      string,
      {
        key: string;
        shippingMethod: 'LAND' | 'SEA' | null;
        isFcl: boolean;
        label: string;
        icon: JSX.Element | null;
        color: string;
        unitPrice: number;
        quantity: number;
        amount: number;
        isSelected: boolean;
      }
    >();

    formik.values.items.forEach((item) => {
      if (!item.shippingMethod) {
        return;
      }

      const isFcl = hasFclShippingTag(item);
      const summaryKey = `${item.shippingMethod}:${isFcl ? 'FCL' : 'NORMAL'}`;
      const currentSummary = shippingSummary.get(summaryKey);

      if (currentSummary) {
        currentSummary.quantity += Number(item.quantity || 0);
        currentSummary.amount += Number(item.amount || 0);
        return;
      }

      shippingSummary.set(summaryKey, {
        key: summaryKey,
        shippingMethod: item.shippingMethod,
        isFcl,
        label: getShippingDisplayLabel(item.shippingMethod, isFcl, item.isShareFCL),
        icon: getShippingMethodIcon(item.shippingMethod),
        color: getShippingMethodColor(item.shippingMethod),
        unitPrice: Number(item.unitPrice || 0),
        quantity: Number(item.quantity || 0),
        amount: Number(item.amount || 0),
        isSelected: true
      });
    });

    return Array.from(shippingSummary.values());
  }, [formik.values.items]);
  const subtotal = formik.values.items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const discount = Number(formik.values.discount || 0);
  const taxableAmount = Math.max(subtotal - discount, 0);
  const vatRate = 0.07;
  const vatAmount = formik.values.isVat ? taxableAmount * vatRate : 0;
  const grandTotal = taxableAmount + vatAmount;

  const isGeneralSectionCompleted = Boolean(
    formik.values.deliveryDate && formik.values.orderMakerId
  );
  const isCustomerSectionCompleted = Boolean(formik.values.customerId);
  const isItemSectionCompleted = formik.values.items.some((item) => Number(item.quantity || 0) > 0);
  const isFormCompleted =
    isGeneralSectionCompleted && isCustomerSectionCompleted && isItemSectionCompleted;

  const updateItem = (index: number, field: keyof SaleOrderRFQItem, value: any) => {
    const items = [...formik.values.items];
    items[index] = {
      ...items[index],
      [field]: value
    };
    items[index].amount = Number(items[index].quantity || 0) * Number(items[index].unitPrice || 0);
    formik.setFieldValue('items', items);
  };

  const handleAddManualItem = () => {
    formik.setFieldValue('items', [
      ...formik.values.items,
      createEmptySaleOrderItem(nextManualItemId)
    ]);
    setNextManualItemId((currentId) => currentId - 1);
  };

  const handleDeleteItem = (index: number) => {
    formik.setFieldValue(
      'items',
      formik.values.items.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  return (
    <Page>
      <PageTitle title="สร้าง Sales Order จาก RFQ" />
      <CollapsibleWrapper
        title="ข้อมูลใบยืนยันคำสั่งซื้อ"
        isCompleted={isGeneralSectionCompleted}
        defaultExpanded>
        <Grid container spacing={1}>
          <GridTextField item xs={12} sm={2} style={{ paddingTop: '30px' }}>
            <DatePicker
              className={classes.datePickerFromTo}
              fullWidth
              inputVariant="outlined"
              InputLabelProps={{ shrink: true }}
              required
              label={t('documentManagement.quotation.docDate')}
              format={DEFAULT_DATE_FORMAT}
              value={formik.values.docDate ? dayjs(formik.values.docDate).toDate() : null}
              onChange={(date) => {
                if (!date) {
                  formik.setFieldValue('docDate', '');
                  return;
                }

                const startDate = dayjs(date.toDate()).startOf('day');

                formik.setFieldValue('docDate', startDate.format(DEFAULT_DATE_FORMAT));

                // ✅ ถ้า end < start → auto ปรับ end = start
                if (
                  formik.values.effectiveDate &&
                  dayjs(formik.values.effectiveDate).isBefore(startDate)
                ) {
                  formik.setFieldValue('endDeliveryDate', startDate.format(DEFAULT_DATE_FORMAT));
                }
              }}
            />
          </GridTextField>

          <GridTextField item xs={12} sm={2} style={{ paddingTop: '30px' }}>
            <DatePicker
              className={classes.datePickerFromTo}
              fullWidth
              inputVariant="outlined"
              required
              InputLabelProps={{ shrink: true }}
              label={t('documentManagement.quotation.expectiveDate')}
              format={DEFAULT_DATE_FORMAT}
              minDate={formik.values.docDate ? dayjs(formik.values.docDate).toDate() : undefined}
              value={
                formik.values.effectiveDate ? dayjs(formik.values.effectiveDate).toDate() : null
              }
              onChange={(date) => {
                if (!date) {
                  formik.setFieldValue('effectiveDate', '');
                  return;
                }

                const endDate = dayjs(date.toDate()).startOf('day');
                const startDate = formik.values.docDate ? dayjs(formik.values.docDate) : null;

                // ❌ กันกรณีเลือกน้อยกว่า start
                if (startDate && endDate.isBefore(startDate)) {
                  return;
                }

                formik.setFieldValue('effectiveDate', endDate.format(DEFAULT_DATE_FORMAT));
              }}
            />
          </GridTextField>

          <GridTextField item sm={8} />

          <GridTextField item xs={12} sm={6}>
            <RadioGroup
              row
              value={String(formik.values.isVat)}
              onChange={(e) => formik.setFieldValue('isVat', e.target.value === 'true')}>
              <FormControlLabel value="true" control={<Radio />} label="มี VAT" />
              <FormControlLabel value="false" control={<Radio />} label="ไม่มี VAT" />
            </RadioGroup>
          </GridTextField>

          <GridTextField item sm={6} />

          <GridTextField item xs={12} sm={6}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap flexWrap="wrap">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formik.values.requestCoa}
                    onChange={(event) => formik.setFieldValue('requestCoa', event.target.checked)}
                  />
                }
                label="Request COA"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formik.values.requestPo}
                    onChange={(event) => formik.setFieldValue('requestPo', event.target.checked)}
                  />
                }
                label="Request PO"
              />
            </Stack>
          </GridTextField>

          <GridTextField item xs={12} sm={6}>
            <Box>
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', fontWeight: 500, px: 0.25 }}>
                เซลล์นอก/เซลล์ฟรีแลนซ์
              </Typography>
              <RadioGroup
                row
                value={coSaleMode}
                onChange={(event) => setCoSaleMode(event.target.value)}>
                <FormControlLabel value={CO_SALE_MODE_NONE} control={<Radio />} label="ไม่มี" />
                <FormControlLabel
                  value={CO_SALE_MODE_FREELANCE}
                  control={<Radio />}
                  label="เซลล์นอก/เซลล์ฟรีแลนซ์"
                />
              </RadioGroup>
            </Box>
          </GridTextField>

          <GridTextField item xs={12} sm={6}>
            <TextField
              fullWidth
              label="เซลล์ที่ดูแล"
              value={getRFQSalesDisplayValue(rfq?.sales)}
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
            />
          </GridTextField>

          {coSaleMode !== CO_SALE_MODE_NONE ? (
            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                label="เซลล์นอก/เซลล์ฟรีแลนซ์"
                value={selectedFreelanceSaleDisplay}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <IconButton
                      edge="end"
                      onClick={() => setOpenSearchFreelanceSalesDialog(true)}
                      disabled={isFreelanceSalesFetching}
                    >
                      <Search />
                    </IconButton>
                  )
                }}
              />
            </GridTextField>
          ) : (
            <GridTextField item xs={12} sm={6} />
          )}
        </Grid>
      </CollapsibleWrapper>

      <CollapsibleWrapper
        title={t('documentManagement.quotation.customerSection.title')}
        isCompleted={isCustomerSectionCompleted}
        defaultExpanded
        action={
          customer?.id ? (
            <Button
              variant="outlined"
              size="small"
              onClick={handleOpenUpdateCustomer}
              sx={{
                borderRadius: '999px',
                px: 2,
                py: 0.75,
                fontWeight: 700,
                whiteSpace: 'nowrap'
              }}>
              อัพเดตข้อมูล
            </Button>
          ) : null
        }>
        <Grid container spacing={1}>
          <GridTextField item xs={12} sm={6}>
            <TextField
              name="customerName"
              type="text"
              fullWidth
              variant="outlined"
              label={t('customerManagement.column.id')}
              value={customer?.id || ''}
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              name="customerName"
              type="text"
              fullWidth
              variant="outlined"
              label={t('customerManagement.column.name')}
              value={customer?.customerName || ''}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              name="taxId"
              type="text"
              fullWidth
              variant="outlined"
              label={t('customerManagement.column.taxId')}
              value={customer?.taxId || ''}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              fullWidth
              variant="outlined"
              label={t('customerManagement.column.paymentTerm')}
              value={
                customer?.customerPaymentTerm?.nameTh ||
                customer?.customerPaymentTerm?.nameEn ||
                customer?.customerPaymentTerm?.code ||
                ''
              }
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
            />
          </GridTextField>
          {customer?.customerType?.code === 'COMPANY' ? (
            <GridTextField item xs={12} sm={6}>
              <TextField
                name="taxId"
                type="text"
                fullWidth
                variant="outlined"
                label={t('documentManagement.quotation.customerSection.branch')}
                value={`(${customer?.branchNumber || ''}) ${customer?.branchName || ''}`}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>
          ) : null}
          <GridTextField item xs={12} sm={12}>
            <TextField
              select
              name="customerAddressId"
              fullWidth
              variant="outlined"
              label={t('customerManagement.column.address.title')}
              value={formik.values.customerAddressId || ''}
              onChange={(e) => {
                if (e.target.value === ADD_NEW_ADDRESS_VALUE) {
                  handleOpenAddCustomerAddressDialog();
                  return;
                }
                formik.setFieldValue('customerAddressId', e.target.value);
              }}
              InputLabelProps={{ shrink: true }}
              helperText={
                (customer?.addresses || []).length
                  ? undefined
                  : t('customerManagement.column.address.noAddress')
              }>
              {(customer?.addresses || []).map((address: Address) => (
                <MenuItem key={address.id} value={address.id}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      size="small"
                      label={t(
                        `customerManagement.column.addressType.${address.addressType.toLowerCase()}`
                      )}
                      variant="outlined"
                    />
                    <span>{address.fullAddress}</span>
                  </Stack>
                </MenuItem>
              ))}
              <MenuItem value={ADD_NEW_ADDRESS_VALUE}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <AddCircle fontSize="small" />
                </ListItemIcon>
                {t('customerManagement.column.address.addNew')}
              </MenuItem>
            </TextField>
          </GridTextField>
          <GridTextField item xs={12} sm={12}>
            <TextField
              select
              name="customerContactId"
              fullWidth
              variant="outlined"
              label={t('customerManagement.column.contact')}
              value={formik.values.customerContactId || ''}
              onChange={(e) => {
                if (e.target.value === ADD_NEW_CONTACT_VALUE) {
                  handleOpenAddCustomerContactDialog();
                  return;
                }
                formik.setFieldValue('customerContactId', e.target.value);
              }}
              InputLabelProps={{ shrink: true }}>
              {(customer?.contacts || []).map((contact: Contact) => (
                <MenuItem key={contact.id} value={contact.id}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>{`${contact.contactName} : ${contact.contactNumber}`}</span>
                  </Stack>
                </MenuItem>
              ))}
              <MenuItem value={ADD_NEW_CONTACT_VALUE}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <AddCircle fontSize="small" />
                </ListItemIcon>
                {t('customerManagement.addContact')}
              </MenuItem>
            </TextField>
          </GridTextField>
          {!customer ? (
            <Grid item xs={12}>
              <Typography color="error">
                RFQ นี้ยังไม่มีข้อมูลลูกค้า จึงยังสร้าง Sales Order ไม่ได้
              </Typography>
            </Grid>
          ) : null}
        </Grid>
      </CollapsibleWrapper>

      <Dialog
        open={isUpdateCustomerDialogOpen}
        onClose={() => {
          setIsUpdateCustomerDialogOpen(false);
          updateCustomerDialogFormik.resetForm();
        }}
        fullWidth
        maxWidth="md">
        <DialogTitle>อัพเดตข้อมูลลูกค้า</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6} sx={{ display: showThaiAddressFields ? 'block' : 'none' }}>
              <TextField
                fullWidth
                name="customerName"
                label={t('customerManagement.column.name')}
                value={updateCustomerDialogFormik.values.customerName}
                onChange={updateCustomerDialogFormik.handleChange}
                onBlur={updateCustomerDialogFormik.handleBlur}
                error={Boolean(
                  updateCustomerDialogFormik.touched.customerName &&
                  updateCustomerDialogFormik.errors.customerName
                )}
                helperText={
                  updateCustomerDialogFormik.touched.customerName &&
                  updateCustomerDialogFormik.errors.customerName
                }
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ display: showThaiAddressFields ? 'block' : 'none' }}>
              <TextField
                fullWidth
                name="email"
                label={t('customerManagement.column.email')}
                value={updateCustomerDialogFormik.values.email}
                onChange={updateCustomerDialogFormik.handleChange}
                onBlur={updateCustomerDialogFormik.handleBlur}
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                name="type"
                label={t('customerManagement.column.type')}
                value={updateCustomerDialogFormik.values.type}
                onChange={updateCustomerDialogFormik.handleChange}
                onBlur={updateCustomerDialogFormik.handleBlur}
                error={Boolean(
                  updateCustomerDialogFormik.touched.type && updateCustomerDialogFormik.errors.type
                )}
                helperText={updateCustomerDialogFormik.touched.type && updateCustomerDialogFormik.errors.type}
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}>
                {customerTypeList.map((option) => (
                  <MenuItem key={option.code} value={option.code}>
                    {getSystemConfigLabel(option)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                name="tier"
                label={t('customerManagement.column.tier')}
                value={updateCustomerDialogFormik.values.tier}
                onChange={updateCustomerDialogFormik.handleChange}
                onBlur={updateCustomerDialogFormik.handleBlur}
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {customerTierList.map((option) => (
                  <MenuItem key={option.code} value={option.code}>
                    {getSystemConfigLabel(option)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                name="segment"
                label={t('customerManagement.column.segment')}
                value={updateCustomerDialogFormik.values.segment}
                onChange={updateCustomerDialogFormik.handleChange}
                onBlur={updateCustomerDialogFormik.handleBlur}
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {customerSegmentList.map((option) => (
                  <MenuItem key={option.code} value={option.code}>
                    {getSystemConfigLabel(option)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} sx={{ display: showThaiAddressFields ? 'block' : 'none' }}>
              <TextField
                fullWidth
                name="taxId"
                label={t('customerManagement.column.taxId')}
                value={updateCustomerDialogFormik.values.taxId}
                onChange={updateCustomerDialogFormik.handleChange}
                onBlur={updateCustomerDialogFormik.handleBlur}
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ display: showThaiAddressFields ? 'block' : 'none' }}>
              <TextField
                fullWidth
                name="companyName"
                label={t('customerManagement.column.company.name')}
                value={updateCustomerDialogFormik.values.companyName}
                onChange={updateCustomerDialogFormik.handleChange}
                onBlur={updateCustomerDialogFormik.handleBlur}
                error={Boolean(
                  updateCustomerDialogFormik.touched.companyName &&
                  updateCustomerDialogFormik.errors.companyName
                )}
                helperText={
                  updateCustomerDialogFormik.touched.companyName &&
                  updateCustomerDialogFormik.errors.companyName
                }
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}
              />
            </Grid>
            {updateCustomerDialogFormik.values.type === 'COMPANY' ? (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="companyBranchCode"
                    label={t('customerManagement.column.company.branchCode')}
                    value={updateCustomerDialogFormik.values.companyBranchCode}
                    onChange={updateCustomerDialogFormik.handleChange}
                    onBlur={updateCustomerDialogFormik.handleBlur}
                    error={Boolean(
                      updateCustomerDialogFormik.touched.companyBranchCode &&
                      updateCustomerDialogFormik.errors.companyBranchCode
                    )}
                    helperText={
                      updateCustomerDialogFormik.touched.companyBranchCode &&
                      updateCustomerDialogFormik.errors.companyBranchCode
                    }
                    InputLabelProps={{ shrink: true }}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="companyBranchName"
                    label={t('customerManagement.column.company.branchName')}
                    value={updateCustomerDialogFormik.values.companyBranchName}
                    onChange={updateCustomerDialogFormik.handleChange}
                    onBlur={updateCustomerDialogFormik.handleBlur}
                    error={Boolean(
                      updateCustomerDialogFormik.touched.companyBranchName &&
                      updateCustomerDialogFormik.errors.companyBranchName
                    )}
                    helperText={
                      updateCustomerDialogFormik.touched.companyBranchName &&
                      updateCustomerDialogFormik.errors.companyBranchName
                    }
                    InputLabelProps={{ shrink: true }}
                    sx={fieldSx}
                  />
                </Grid>
              </>
            ) : null}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                name="creditTerm"
                label={t('customerManagement.column.creditTerm')}
                value={updateCustomerDialogFormik.values.creditTerm}
                onChange={updateCustomerDialogFormik.handleChange}
                onBlur={updateCustomerDialogFormik.handleBlur}
                error={Boolean(
                  updateCustomerDialogFormik.touched.creditTerm &&
                  updateCustomerDialogFormik.errors.creditTerm
                )}
                helperText={
                  updateCustomerDialogFormik.touched.creditTerm &&
                  updateCustomerDialogFormik.errors.creditTerm
                }
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}>
                {customerCreditTermList.map((option) => (
                  <MenuItem key={option.code} value={option.code}>
                    {getSystemConfigLabel(option)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                name="paymentTerm"
                label={t('customerManagement.column.paymentTerm')}
                value={updateCustomerDialogFormik.values.paymentTerm}
                onChange={updateCustomerDialogFormik.handleChange}
                onBlur={updateCustomerDialogFormik.handleBlur}
                error={Boolean(
                  updateCustomerDialogFormik.touched.paymentTerm &&
                  updateCustomerDialogFormik.errors.paymentTerm
                )}
                helperText={
                  updateCustomerDialogFormik.touched.paymentTerm &&
                  updateCustomerDialogFormik.errors.paymentTerm
                }
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}>
                {customerPaymentTermList.map((option) => (
                  <MenuItem key={option.code} value={option.code}>
                    {getSystemConfigLabel(option)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                name="billingCondition"
                label={t('customerManagement.column.billingCondition')}
                value={updateCustomerDialogFormik.values.billingCondition}
                onChange={updateCustomerDialogFormik.handleChange}
                onBlur={updateCustomerDialogFormik.handleBlur}
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {customerBillingConditionList.map((option) => (
                  <MenuItem key={option.code} value={option.code}>
                    {getSystemConfigLabel(option)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                name="paymentCycle"
                label={t('customerManagement.column.paymentCycle')}
                value={updateCustomerDialogFormik.values.paymentCycle}
                onChange={updateCustomerDialogFormik.handleChange}
                onBlur={updateCustomerDialogFormik.handleBlur}
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {customerPaymentCycleList.map((option) => (
                  <MenuItem key={option.code} value={option.code}>
                    {getSystemConfigLabel(option)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setIsUpdateCustomerDialogOpen(false);
              updateCustomerDialogFormik.resetForm();
            }}>
            {t('button.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={() => updateCustomerDialogFormik.handleSubmit()}
            disabled={updateCustomerDialogFormik.isSubmitting}>
            {t('button.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <CollapsibleWrapper title="รายการสินค้า" isCompleted={isItemSectionCompleted} defaultExpanded>
        <Paper
          elevation={0}
          sx={{
            border: '1px solid #D9DCE3',
            borderRadius: '24px',
            overflow: 'hidden',
            backgroundColor: '#fff'
          }}>
          <Table
            sx={{
              minWidth: 1100,
              '& .MuiTableCell-root': {
                borderColor: '#E6EAF0',
                verticalAlign: 'middle'
              }
            }}>
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: '#F7F8FB',
                  '& .MuiTableCell-root': {
                    py: 2.25,
                    fontSize: 16,
                    borderBottom: '1px solid #D9DCE3'
                  }
                }}>
                <TableCell width={140} align="center">
                  รูปสินค้า
                </TableCell>
                <TableCell sx={{ minWidth: 320 }}>รายการ</TableCell>
                <TableCell width={160} align="center">
                  จำนวน
                </TableCell>
                <TableCell width={180} align="center">
                  ราคา
                </TableCell>
                <TableCell width={180} align="center">
                  รวม
                </TableCell>
                <TableCell width={110} align="center">
                  จัดการ
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formik.values.items.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell align="center">
                    <Box
                      sx={{
                        width: 88,
                        height: 88,
                        border: '1px dashed #C8D0DB',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        backgroundColor: '#FAFBFC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto'
                      }}>
                      {row.imageUrl ? (
                        <Box
                          component="img"
                          src={row.imageUrl}
                          alt="product"
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary" textAlign="center">
                          ไม่มีรูป
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={1.25}>
                      <TextField
                        fullWidth
                        required
                        label="สินค้า"
                        value={row.name}
                        onChange={(event) => updateItem(index, 'name', event.target.value)}
                        sx={fieldSx}
                      />
                      <TextField
                        fullWidth
                        label="Spec"
                        multiline
                        minRows={2}
                        value={row.spec}
                        onChange={(event) => updateItem(index, 'spec', event.target.value)}
                      />
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          size="small"
                          label="SKU: PRE-ORDER"
                          color="primary"
                          variant="outlined"
                        />
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={row.quantity}
                      onChange={(event) =>
                        updateItem(index, 'quantity', Number(event.target.value || 0))
                      }
                      inputProps={{ min: 0, style: { textAlign: 'right' } }}
                      sx={{ maxWidth: 140, mx: 'auto' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={row.unitPrice}
                      onChange={(event) =>
                        updateItem(index, 'unitPrice', Number(event.target.value || 0))
                      }
                      inputProps={{ min: 0, style: { textAlign: 'right' } }}
                      sx={{ maxWidth: 155, mx: 'auto' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700} sx={{ fontSize: 20, color: '#2F3447' }}>
                      {formatNumber(row.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      color="error"
                      variant="text"
                      startIcon={<DeleteOutline />}
                      onClick={() => handleDeleteItem(index)}>
                      ลบ
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!formik.values.items.length ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="error">
                      ยังไม่มีรายการสินค้า กรุณาเพิ่มรายการหรือเลือกมาจาก Confirm Price Dialog
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Paper>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2.5 }}>
          <Button
            variant="outlined"
            startIcon={<AddCircle />}
            onClick={handleAddManualItem}
            sx={{
              borderRadius: '999px',
              px: 3,
              py: 1.25,
              fontWeight: 700,
              minHeight: 48
            }}>
            เพิ่มรายการใหม่
          </Button>
        </Stack>
      </CollapsibleWrapper>

      <CollapsibleWrapper title="สรุป" isCompleted={true} defaultExpanded>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Grid container spacing={1.5}>
              {summaryShippingOptions.map((option) => (
                <Grid item xs={12} sm={6} key={option.key}>
                  <Paper
                    elevation={0}
                    sx={{
                      border: `2px solid ${option.isSelected ? option.color : '#CBD5E1'}`,
                      borderRadius: '18px',
                      p: 2,
                      backgroundColor: option.isSelected ? `${option.color}12` : '#F8FAFC',
                      opacity: option.isSelected ? 1 : 0.48,
                      filter: option.isSelected ? 'none' : 'grayscale(1)'
                    }}>
                    <Stack spacing={1.25}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                          {option.icon}
                          <Typography
                            fontWeight={800}
                            sx={{ color: option.isSelected ? option.color : '#64748B' }}>
                            {option.shippingMethod}
                          </Typography>
                          <Typography
                            fontWeight={700}
                            sx={{ color: option.isSelected ? 'text.primary' : '#64748B' }}>
                            {option.label}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Grid>
          <GridTextField sm={6} />
          <Grid item xs={12} md={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="การขนส่ง"
              value={formik.values.shipping}
              onChange={(event) => formik.setFieldValue('shipping', event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={7}>
            <TextField
              fullWidth
              multiline
              rows={6}
              label="หมายเหตุ"
              value={formik.values.notes}
              onChange={(event) => formik.setFieldValue('notes', event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <Paper
              elevation={0}
              sx={{
                border: '1px solid #E6EAF0',
                borderRadius: '18px',
                p: 2.5,
                backgroundColor: '#FAFBFC'
              }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography fontWeight={500}>ยอดรวมสินค้า</Typography>
                  <Typography fontWeight={600}>{formatCurrency(subtotal)}</Typography>
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={2}>
                  <Typography fontWeight={500}>ส่วนลด</Typography>
                  <TextField
                    type="number"
                    value={formik.values.discount}
                    onChange={(event) =>
                      formik.setFieldValue('discount', Number(event.target.value || 0))
                    }
                    inputProps={{ min: 0, style: { textAlign: 'right' } }}
                    sx={{ maxWidth: 180 }}
                  />
                </Stack>
                {formik.values.isVat ? (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography fontWeight={500}>ภาษีมูลค่าเพิ่ม (7%)</Typography>
                    <Typography fontWeight={600}>{formatCurrency(vatAmount)}</Typography>
                  </Stack>
                ) : null}
                <Divider />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="h6" fontWeight={700}>
                    จำนวนเงินทั้งสิ้น
                  </Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ color: '#1B5E20' }}>
                    {formatCurrency(grandTotal)}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </CollapsibleWrapper>

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
            startIcon={<ArrowBackIos />}
            className="btn-cool-grey"
            onClick={() => {
              setConfirmAction('back');
              setVisibleConfirmationDialog(true);
            }}>
            {t('button.back')}
          </Button>
          <Button
            fullWidth={isDownSm}
            disabled={!isFormCompleted}
            variant="contained"
            startIcon={<Save />}
            className="btn-amber-orange"
            onClick={() => {
              setConfirmAction('DRAFT');
              setVisibleConfirmationDialog(true);
            }}>
            บันทึกฉบับร่าง
          </Button>
          <Can permission={PERMISSIONS.SALES_ORDER_CREATE}>
            <Button
              fullWidth={isDownSm}
              disabled={!isFormCompleted}
              variant="contained"
              startIcon={<Save />}
              className="btn-emerald-green"
              onClick={() => {
                setConfirmAction('CREATED');
                setVisibleConfirmationDialog(true);
              }}>
              สร้าง
            </Button>
          </Can>
        </Stack>
      </Wrapper>

      <ConfirmDialog
        open={visibleConfirmationDialog}
        title={
          confirmAction === 'DRAFT'
            ? 'ยืนยันบันทึกฉบับร่าง'
            : confirmAction === 'CREATED'
              ? 'ยืนยันสร้าง Sales Order'
              : t('general.confirmCloseTitle')
        }
        message={
          confirmAction === 'DRAFT'
            ? 'คุณต้องการบันทึก Sales Order จาก RFQ นี้เป็นฉบับร่างหรือไม่'
            : confirmAction === 'CREATED'
              ? 'คุณต้องการสร้าง Sales Order จาก RFQ นี้หรือไม่'
              : t('general.confirmCloseMsg')
        }
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        onConfirm={() => {
          if (confirmAction === 'back') {
            history.push(ROUTE_PATHS.RFQ_DETAIL.replace(':id', rfqId));
          } else {
            submitSalesOrder(confirmAction);
          }
          setVisibleConfirmationDialog(false);
        }}
        onCancel={() => setVisibleConfirmationDialog(false)}
        isShowCancelButton
        isShowConfirmButton
      />
      <Dialog
        open={isAddCustomerAddressDialogOpen}
        onClose={() => setIsAddCustomerAddressDialogOpen(false)}
        fullWidth
        maxWidth="sm">
        <DialogTitle>{t('customerManagement.column.address.addNew')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="addressType"
                select
                fullWidth
                label={t('customerManagement.column.address.type')}
                value={addressDialogFormik.values.addressType}
                onChange={addressDialogFormik.handleChange}
                onBlur={addressDialogFormik.handleBlur}
                error={Boolean(
                  addressDialogFormik.touched.addressType && addressDialogFormik.errors.addressType
                )}
                helperText={
                  addressDialogFormik.touched.addressType && addressDialogFormik.errors.addressType
                }
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="BILLING">
                  {t('customerManagement.column.addressType.billing')}
                </MenuItem>
                <MenuItem value="SHIPPING">
                  {t('customerManagement.column.addressType.shipping')}
                </MenuItem>
                <MenuItem value="OTHER">
                  {t('customerManagement.column.addressType.other')}
                </MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="label"
                type="text"
                label={t('customerManagement.column.address.label')}
                fullWidth
                value={addressDialogFormik.values.label}
                onChange={addressDialogFormik.handleChange}
                onBlur={addressDialogFormik.handleBlur}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="addressLine1"
                type="text"
                label={t('customerManagement.column.address.addressLine1')}
                fullWidth
                required
                value={addressDialogFormik.values.addressLine1}
                onChange={addressDialogFormik.handleChange}
                onBlur={addressDialogFormik.handleBlur}
                error={Boolean(
                  addressDialogFormik.touched.addressLine1 &&
                  addressDialogFormik.errors.addressLine1
                )}
                helperText={
                  addressDialogFormik.touched.addressLine1 &&
                  addressDialogFormik.errors.addressLine1
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="addressLine2"
                type="text"
                label={t('customerManagement.column.address.addressLine2')}
                fullWidth
                value={addressDialogFormik.values.addressLine2}
                onChange={addressDialogFormik.handleChange}
                onBlur={addressDialogFormik.handleBlur}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="country"
                select
                fullWidth
                label={t('customerManagement.column.address.country')}
                value={addressDialogFormik.values.country || 'TH'}
                onChange={(event) => {
                  addressDialogFormik.setFieldValue('country', event.target.value);
                  addressDialogFormik.setFieldValue('province', '');
                  addressDialogFormik.setFieldValue('district', '');
                  addressDialogFormik.setFieldValue('subdistrict', '');
                  addressDialogFormik.setFieldValue('postcode', '');
                }}
                onBlur={addressDialogFormik.handleBlur}
                error={Boolean(
                  addressDialogFormik.touched.country && addressDialogFormik.errors.country
                )}
                helperText={
                  addressDialogFormik.touched.country && addressDialogFormik.errors.country
                }
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {countries.map((country: Country) => (
                  <MenuItem key={country.code} value={country.code}>
                    {country.nameTh || country.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="province"
                select
                fullWidth
                label={t('customerManagement.column.address.province')}
                value={addressDialogFormik.values.province}
                onChange={(event) => {
                  addressDialogFormik.setFieldValue('province', event.target.value);
                  addressDialogFormik.setFieldValue('district', '');
                  addressDialogFormik.setFieldValue('subdistrict', '');
                  addressDialogFormik.setFieldValue('postcode', '');
                }}
                onBlur={addressDialogFormik.handleBlur}
                error={Boolean(
                  addressDialogFormik.touched.province && addressDialogFormik.errors.province
                )}
                helperText={
                  addressDialogFormik.touched.province && addressDialogFormik.errors.province
                }
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {provinces.map((option: Province) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.nameTh}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="district"
                select
                fullWidth
                label={t('customerManagement.column.address.amphure')}
                value={addressDialogFormik.values.district}
                onChange={(event) => {
                  addressDialogFormik.setFieldValue('district', event.target.value);
                  addressDialogFormik.setFieldValue('subdistrict', '');
                  addressDialogFormik.setFieldValue('postcode', '');
                }}
                onBlur={addressDialogFormik.handleBlur}
                error={Boolean(
                  addressDialogFormik.touched.district && addressDialogFormik.errors.district
                )}
                helperText={
                  addressDialogFormik.touched.district && addressDialogFormik.errors.district
                }
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {districts
                  .filter(
                    (option: District) => option.provinceId === addressDialogFormik.values.province
                  )
                  .map((option: District) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.nameTh}
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="subdistrict"
                select
                fullWidth
                label={t('customerManagement.column.address.tumbon')}
                value={addressDialogFormik.values.subdistrict}
                onChange={(event) => {
                  const selected = subdistricts.find(
                    (item: SubDistrict) => item.id === event.target.value
                  );
                  addressDialogFormik.setFieldValue('subdistrict', selected?.id ?? '');
                  addressDialogFormik.setFieldValue('postcode', selected?.zipCode ?? '');
                }}
                onBlur={addressDialogFormik.handleBlur}
                error={Boolean(
                  addressDialogFormik.touched.subdistrict && addressDialogFormik.errors.subdistrict
                )}
                helperText={
                  addressDialogFormik.touched.subdistrict && addressDialogFormik.errors.subdistrict
                }
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {subdistricts
                  .filter(
                    (option: SubDistrict) =>
                      option.districtId === addressDialogFormik.values.district
                  )
                  .map((option: SubDistrict) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.nameTh}
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="postcode"
                type="text"
                label={t('customerManagement.column.address.postalCode')}
                fullWidth
                disabled
                value={addressDialogFormik.values.postcode}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            variant="contained"
            className="btn-crimson-red"
            onClick={() => setIsAddCustomerAddressDialogOpen(false)}>
            {t('button.cancel')}
          </Button>
          <Button
            variant="contained"
            className="btn-emerald-green"
            onClick={handleConfirmAddCustomerAddress}
            disabled={addressDialogFormik.isSubmitting}>
            {t('button.save')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={isAddCustomerContactDialogOpen}
        onClose={() => setIsAddCustomerContactDialogOpen(false)}
        fullWidth
        maxWidth="sm">
        <DialogTitle>{t('customerManagement.addContact')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="contactName"
                type="text"
                label={t('customerManagement.column.contactName')}
                fullWidth
                required
                value={contactDialogFormik.values.contactName}
                onChange={contactDialogFormik.handleChange}
                onBlur={contactDialogFormik.handleBlur}
                error={Boolean(
                  contactDialogFormik.touched.contactName && contactDialogFormik.errors.contactName
                )}
                helperText={
                  contactDialogFormik.touched.contactName && contactDialogFormik.errors.contactName
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="contactNumber"
                type="text"
                label={t('customerManagement.column.contactNumber')}
                fullWidth
                required
                value={contactDialogFormik.values.contactNumber}
                onChange={contactDialogFormik.handleChange}
                onBlur={contactDialogFormik.handleBlur}
                error={Boolean(
                  contactDialogFormik.touched.contactNumber &&
                  contactDialogFormik.errors.contactNumber
                )}
                helperText={
                  contactDialogFormik.touched.contactNumber &&
                  contactDialogFormik.errors.contactNumber
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            variant="contained"
            className="btn-crimson-red"
            onClick={() => setIsAddCustomerContactDialogOpen(false)}>
            {t('button.cancel')}
          </Button>
          <Button
            variant="contained"
            className="btn-emerald-green"
            onClick={handleConfirmAddCustomerContact}
            disabled={contactDialogFormik.isSubmitting}>
            {t('button.save')}
          </Button>
        </DialogActions>
      </Dialog>
      <SearchFreelanceSalesDialog
        open={openSearchFreelanceSalesDialog}
        onClose={() => setOpenSearchFreelanceSalesDialog(false)}
        onAddNew={() => {
          setOpenSearchFreelanceSalesDialog(false);
          handleOpenCreateFreelanceSaleDialog();
        }}
        salesId={formik.values.salesId || ''}
        initialFreelanceSale={selectedFreelanceSale}
        onSelect={({ freelanceSale }) => {
          formik.setFieldValue('coSaleId', freelanceSale.id || '');
          setCoSaleMode(CO_SALE_MODE_FREELANCE);
          setSelectedFreelanceSaleItem(freelanceSale);
          setSelectedFreelanceSaleLabel(`${freelanceSale.id} - ${freelanceSale.name}`);
          setOpenSearchFreelanceSalesDialog(false);
        }}
      />
      <Dialog
        open={openCreateFreelanceSaleDialog}
        onClose={() => setOpenCreateFreelanceSaleDialog(false)}
        fullWidth
        maxWidth="sm">
        <DialogTitle>{`เพิ่ม${t('customerManagement.column.coSalesAccount')}`}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                disabled
                label="ID"
                placeholder="ระบบจะทำการ Generate ให้อัตโนมัติ"
                value=""
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="ชื่อ-นามสกุล"
                value={newFreelanceSale.name}
                onChange={(event) =>
                  setNewFreelanceSale((prev) => ({ ...prev, name: event.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('customerManagement.column.contactNumber')}
                value={newFreelanceSale.contactNumber}
                onChange={(event) =>
                  setNewFreelanceSale((prev) => ({ ...prev, contactNumber: event.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ดูแลโดย Sales"
                value={formik.values.salesId || ''}
                InputLabelProps={{ shrink: true }}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sale Coverage"
                value={newFreelanceSale.saleCoverage}
                InputLabelProps={{ shrink: true }}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Additional"
                value={newFreelanceSale.additional}
                onChange={(event) =>
                  setNewFreelanceSale((prev) => ({ ...prev, additional: event.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateFreelanceSaleDialog(false)}>
            {t('button.cancel')}
          </Button>
          <Button variant="contained" onClick={handleCreateFreelanceSale}>
            {t('button.save')}
          </Button>
        </DialogActions>
      </Dialog>
      <LoadingDialog
        open={
          isLoading ||
          isRFQFetching ||
          addressDialogFormik.isSubmitting ||
          contactDialogFormik.isSubmitting
        }
      />
    </Page>
  );
}
