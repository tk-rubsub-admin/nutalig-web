import { ArrowBackIos, DirectionsBoat, LocalShipping, Save } from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
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
  useMediaQuery,
  InputAdornment
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
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { getCustomer } from 'services/Customer/customer-api';
import { Address, Contact, Customer, CustomerDropOff } from 'services/Customer/customer-type';
import { getQuotation } from 'services/Document/document-api';
import { Quotation } from 'services/Document/document-type';
import { getFreelanceSales } from 'services/FreelanceSale/freelance-sale-api';
import { getRFQ, linkRFQSalesOrder } from 'services/RFQ/rfq-api';
import { RFQDetailOption, RFQDetailTier, RFQRecord } from 'services/RFQ/rfq-type';
import { createSalesOrderV1 } from 'services/SaleOrder/sale-order-api';
import {
  CreateSalesOrderRequestV1,
  CreateSalesOrderStatus
} from 'services/SaleOrder/sale-order-type';
import { DEFAULT_DATE_FORMAT, DEFAULT_DATE_FORMAT_BFF } from 'utils';
import { formatCurrency, formatNumber, formatNumberWithoutDigit } from 'utils/utils';
import * as Yup from 'yup';

interface SaleOrderRFQParams {
  rfqId: string;
}

interface SaleOrderRFQItem {
  id: number;
  optionId?: number;
  tierId?: number;
  supplierQuoteTierId?: number;
  quotationDetailId?: number | string;
  shippingMethod: 'LAND' | 'SEA';
  isFcl?: boolean;
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
    response?.data?.id ||
    response?.data?.orderId ||
    response?.data?.saleOrderId ||
    response?.id ||
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

function getRFQImageUrl(rfq?: RFQRecord): string {
  return rfq?.pictures?.[0]?.pictureUrl || '';
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

function getShippingMethodLabel(shippingMethod?: string): string {
  if (shippingMethod === 'SEA') return 'ส่งทางเรือ';
  if (shippingMethod === 'LAND') return 'ส่งทางรถ';
  return '';
}

function getShippingMethodIcon(shippingMethod?: string): JSX.Element | null {
  if (shippingMethod === 'SEA') {
    return <DirectionsBoat sx={{ color: '#00897b', fontSize: 30 }} />;
  }

  if (shippingMethod === 'LAND') {
    return <LocalShipping sx={{ color: '#1565c0', fontSize: 30 }} />;
  }

  return null;
}

function getShippingMethodColor(shippingMethod?: string): string {
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
  shippingMethod: 'LAND' | 'SEA',
  isFcl?: boolean | null
): string {
  const shippingLabel = shippingMethod === 'SEA' ? 'ส่งทางเรือ' : 'ส่งทางรถ';

  return shippingMethod === 'SEA' && Boolean(isFcl)
    ? `${shippingLabel} แบบปิดตู้`
    : shippingLabel;
}

function hasFclShippingTag(item: Pick<SaleOrderRFQItem, 'shippingMethod' | 'isFcl' | 'name' | 'remark'>): boolean {
  if (item.shippingMethod !== 'SEA') {
    return false;
  }

  if (Boolean(item.isFcl)) {
    return true;
  }

  return [item.name, item.remark].some((value) => String(value || '').includes('แบบปิดตู้'));
}

function buildPaymentTermRemark(baseRemark: string | null | undefined, customer?: Customer | null): string {
  const normalizedBaseRemark = (baseRemark || '').trim();
  const paymentTermLabel =
    customer?.customerPaymentTerm?.nameTh ||
    customer?.customerPaymentTerm?.nameEn ||
    customer?.customerPaymentTerm?.code ||
    '';

  if (!paymentTermLabel) {
    return normalizedBaseRemark;
  }

  const paymentTermPrefix = 'เงื่อนไขการชำระเงิน :';
  const paymentTermLine = `${paymentTermPrefix} ${paymentTermLabel}`;

  if (normalizedBaseRemark.includes(paymentTermPrefix)) {
    return normalizedBaseRemark;
  }

  return [paymentTermLine, normalizedBaseRemark].filter(Boolean).join('\n');
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
        const shippingDisplayLabel = getShippingDisplayLabel(shippingMethod, tier.isFcl);

        return {
          id: Number(`${detail.id}${tier.id}${shippingIndex}`),
          optionId: detail.id,
          tierId: tier.id,
          supplierQuoteTierId: tier.supplierQuoteTierId || undefined,
          shippingMethod,
          isFcl: Boolean(tier.isFcl),
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
    const shippingDisplayLabel = getShippingDisplayLabel(mappedShippingMethod, mappedTier?.isFcl);
    const normalizedItemName = item.name || productFamily || 'PRE-ORDER';
    const itemNameWithShippingLabel =
      normalizedItemName.includes(shippingDisplayLabel)
        ? normalizedItemName
        : `${normalizedItemName} - ${shippingDisplayLabel}`;

    return {
      id: Number.isFinite(numericItemId) ? numericItemId : mappedRow?.fallbackId || Date.now() + index,
      optionId: mappedRow?.optionId,
      tierId: mappedRow?.tierId,
      quotationDetailId: item.id,
      supplierQuoteTierId: mappedTier?.supplierQuoteTierId || undefined,
      shippingMethod: mappedShippingMethod,
      isFcl: Boolean(mappedTier?.isFcl),
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
      remark: [
        `RFQ: ${rfq.id}`,
        `Shipping: ${shippingDisplayLabel}`
      ].join('\n')
    };
  });
}

export default function SalesOrderRFQ(): JSX.Element {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const { rfqId } = useParams<SaleOrderRFQParams>();
  const isDownSm = useMediaQuery('(max-width:600px)');
  const today = dayjs();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<CreateSalesOrderStatus | 'back'>('CREATED');
  const useStyles = makeStyles({
    hideObject: {
      display: 'none'
    },
    noResultMessage: {
      textAlign: 'center',
      fontSize: '1.2em',
      fontWeight: 'bold',
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
  const { data: quotation, isFetching: isQuotationFetching } = useQuery(
    ['sale-order-rfq-quotation', rfq?.quotationNo],
    () => getQuotation(rfq?.quotationNo || ''),
    {
      enabled: Boolean(rfq?.quotationNo),
      refetchOnWindowFocus: false
    }
  );
  const { data: freelanceSales = [], isFetching: isFreelanceSalesFetching } = useQuery(
    'sale-order-rfq-freelance-sales',
    () => getFreelanceSales(),
    { refetchOnWindowFocus: false }
  );
  const imageUrl = getRFQImageUrl(rfq);

  const formik = useFormik<SaleOrderRFQFormValues>({
    initialValues: {
      rfqId,
      isVat: false,
      discount: 0,
      salesId: '',
      coSaleId: '',
      docDate: today,
      effectiveDate: today.add(7, 'day'),
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
      shippingType:
        new Set(selectedItems.map((item) => item.shippingMethod)).size > 1
          ? 'ALL'
          : selectedItems[0]?.shippingMethod,
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
        imageUrl,
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
      const items = hasSelectedRFQParams
        ? selectedItemFromDialog
        : allItems.slice(0, 1);
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
      const primarySelectedDetail = rfq.details?.find(
        (detail) => detail.id === items[0]?.optionId
      );

      setCustomer(fullCustomer || (rfq.customer as Customer) || null);
      formik.setValues({
        ...formik.values,
        rfqId,
        salesId: getRFQSalesEmployeeId(rfq.sales),
        coSaleId: quotation?.data?.coSaleId || rfq.customer?.coSalesAccount || '',
        customerId: rfq.customer?.id || '',
        customerAddressId: defaultAddress?.id || '',
        customerContactId: defaultContact?.id || '',
        customerName: rfq.customer?.customerName || '',
        contactNumber: rfq.contactPhone || '',
        creditTerm: fullCustomer?.customerCreditTerm?.code || '',
        dropOffId: defaultDropOff?.id || '',
        dropOffName: defaultDropOff?.dropOffName || '',
        supplierId:
          getRFQDetailSupplierId(primarySelectedDetail) ||
          defaultDropOff?.supplier?.supplierId ||
          '',
        areaType: getSystemConfigLabel(defaultDropOff?.area),
        provinceId: defaultDropOff?.province?.id || '',
        amphureId: defaultDropOff?.amphure?.id || '',
        orderMakerId: getRFQSalesEmployeeId(rfq.sales),
        notes: buildPaymentTermRemark(
          rfq.finalRemark || rfq.description || `สร้างจาก RFQ ${rfq.id}`,
          fullCustomer || (rfq.customer as Customer) || null
        ),
        requestCoa: false,
        requestPo: false,
        items
      });
    };

    applyRFQ();
  }, [
    rfq,
    quotation,
    hasSelectedRFQParams,
    selectedRFQParams,
  ]);
  const summaryShippingOptions = useMemo(() => {
    const shippingSummary = new Map<
      string,
      {
        key: string;
        shippingMethod: 'LAND' | 'SEA';
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
        label: getShippingDisplayLabel(item.shippingMethod, isFcl),
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

  return (
    <Page>
      <PageTitle title="สร้าง Sales Order จาก RFQ" />
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
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
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

          <GridTextField item sm={6} />

          <GridTextField item xs={12} sm={6}>
            <TextField
              fullWidth
              label="เซลล์ที่ดูแล"
              value={getRFQSalesDisplayValue(rfq?.sales)}
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
            />
          </GridTextField>

          <GridTextField item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="เซลล์นอก/เซลล์ฟรีแลนซ์"
              value={formik.values.coSaleId || ''}
              disabled={isFreelanceSalesFetching}
              onChange={(event) => formik.setFieldValue('coSaleId', event.target.value)}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">{t('general.clearSelected')}</MenuItem>
              {freelanceSales.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {`${option.id} - ${option.name}`}
                </MenuItem>
              ))}
            </TextField>
          </GridTextField>
        </Grid>
      </CollapsibleWrapper>

      <CollapsibleWrapper
        title={t('documentManagement.quotation.customerSection.title')}
        isCompleted={isCustomerSectionCompleted}
        defaultExpanded>
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
              onChange={(e) => formik.setFieldValue('customerAddressId', e.target.value)}
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
              onChange={(e) => formik.setFieldValue('customerContactId', e.target.value)}
              InputLabelProps={{ shrink: true }}>
              {(customer?.contacts || []).map((contact: Contact) => (
                <MenuItem key={contact.id} value={contact.id}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>{`${contact.contactName} : ${contact.contactNumber}`}</span>
                  </Stack>
                </MenuItem>
              ))}
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
                      {imageUrl ? (
                        <Box
                          component="img"
                          src={imageUrl}
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
                    <Typography sx={{ fontSize: 20, color: '#2F3447' }}>
                      {formatNumberWithoutDigit(row.quantity)}
                    </Typography>
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
                </TableRow>
              ))}
              {!formik.values.items.length ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="error">
                      ไม่พบรายการสินค้าที่เลือกจาก Confirm Price Dialog
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Paper>
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
                  <Typography fontWeight={500}>Subtotal</Typography>
                  <Typography fontWeight={600}>{formatCurrency(subtotal)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                  <Typography fontWeight={500}>Discount</Typography>
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
                    <Typography fontWeight={500}>VAT (7%)</Typography>
                    <Typography fontWeight={600}>{formatCurrency(vatAmount)}</Typography>
                  </Stack>
                ) : null}
                <Divider />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="h6" fontWeight={700}>
                    Grand Total
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
      <LoadingDialog open={isLoading || isRFQFetching} />
    </Page>
  );
}
