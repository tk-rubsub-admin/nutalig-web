import {
  Add,
  ArrowBackIos,
  AssignmentTurnedIn,
  DeleteOutline,
  FilePresent
} from '@mui/icons-material';
import {
  Box,
  Button,
  Grid,
  ListSubheader,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import ConfirmDialog from 'components/ConfirmDialog';
import CollapsibleWrapper from 'components/CollapsibleWrapper';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import { GridSearchSection, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { ChangeEvent, ReactElement, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { getSystemConfig } from 'services/Config/config-api';
import { GROUP_CODE } from 'services/Config/config-type';
import { createPurchaseOrder } from 'services/PurchaseOrder/purchase-order-api';
import { getRFQ, getRFQSupplierQuotes } from 'services/RFQ/rfq-api';
import { getSalesOrderV1 } from 'services/SaleOrder/sale-order-api';
import { SalesOrderDetailV1, SalesOrderV1 } from 'services/SaleOrder/sale-order-type';
import { getSupplierById, getSupplierShippings } from 'services/Supplier/supplier-api';
import { SupplierShipping } from 'services/Supplier/supplier-type';
import { getShippingMethodCategory, getShippingMethodLabel } from 'utils/shipping';
import { formatNumber } from 'utils/utils';

interface PurchaseOrderCreateParams {
  salesOrderId: string;
}

interface PurchaseOrderCreateDraft {
  supplierId: string;
  supplierShippingId: string;
  shippingMethodSnapshot: string;
  docDate: string;
  productionLeadTimeDay: string;
  shippingLeadTimeDay: string;
  containerSizeSnapshot: string;
  supplierContactSnapshot: string;
  supplierContactNoSnapshot: string;
  supplierAddressSnapshot: string;
  paymentTerm: string;
  supplierShipping: SupplierShipping | null;
  remark: string;
}

type EditablePurchaseOrderItemField =
  | 'name'
  | 'spec'
  | 'quantity'
  | 'supplierUnitPrice'
  | 'supplierShippingCost';

interface PurchaseOrderItemEdit {
  name?: string;
  spec?: string;
  quantity?: number;
  supplierUnitPrice?: number;
  supplierShippingCost?: number;
}

interface ManualPurchaseOrderItem {
  id: number;
  imageUrl: null;
  name: string;
  spec: string;
  quantity: number;
  supplierCurrency: string | null;
  supplierUnitPrice: number;
  supplierShippingCost: number;
  isAutomaticShipping?: boolean;
}

interface SupplierQuoteTierPricing {
  productPrice: number;
  shippingCost: number;
  currency: string | null;
  shippingCurrency: string | null;
}

const NUMERIC_ITEM_FIELDS = new Set<EditablePurchaseOrderItemField>([
  'quantity',
  'supplierUnitPrice',
  'supplierShippingCost'
]);

function createDraft(salesOrder?: SalesOrderV1): PurchaseOrderCreateDraft {
  const today = new Date().toISOString().slice(0, 10);
  const firstSupplierId = salesOrder?.items?.find((item) => item.supplier?.id)?.supplier?.id || '';
  return {
    supplierId: firstSupplierId,
    supplierShippingId: '',
    supplierShipping: null,
    shippingMethodSnapshot: '',
    docDate: today,
    productionLeadTimeDay: '',
    shippingLeadTimeDay: '',
    containerSizeSnapshot: '',
    supplierContactSnapshot: '',
    supplierContactNoSnapshot: '',
    supplierAddressSnapshot: '',
    paymentTerm: '',
    remark: ''
  };
}

const PO_SHIPPING_METHOD_OPTIONS = [
  'LAND',
  'SEA',
  'AIR',
  'SEA_FCL_20GP',
  'SEA_FCL_40HQ',
  'SEA_SHARE_FCL_20GP',
  'SEA_SHARE_FCL_40HQ'
];
const PO_CONTAINER_SIZE_OPTIONS = ['', '20GP', '40HQ'];

const useStyles = makeStyles({
  tableHeader: {
    border: '2px solid #e0e0e0',
    fontWeight: 'bold',
    paddingLeft: '14px',
    paddingRight: '14px',
    textAlign: 'center'
  },
  specCell: {
    width: '100%',
    minWidth: 280,
    whiteSpace: 'normal',
    wordBreak: 'break-word'
  },
  tableContainer: {
    border: '1px solid #e6ebf1',
    borderRadius: 10,
    overflow: 'hidden'
  },
  imageThumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    objectFit: 'cover',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    display: 'block'
  }
});

function resolveContainerSize(shippingMethod?: string | null): string {
  if (shippingMethod?.includes('_20GP')) {
    return '20GP';
  }
  return shippingMethod?.includes('_40HQ') ? '40HQ' : '';
}

function calculateItemTotal(item: {
  quantity?: number | null;
  supplierUnitPrice?: number | null;
  supplierShippingCost?: number | null;
}): number {
  return (
    (Number(item.supplierUnitPrice || 0) + Number(item.supplierShippingCost || 0)) *
    Number(item.quantity || 0)
  );
}

function formatShippingAddress(
  destination?: SupplierShipping['destinations'][number] | null
): string {
  if (!destination) {
    return '-';
  }
  return [
    destination.fullAddress,
    destination.subdistrict,
    destination.district,
    destination.province,
    destination.countryCode
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(' ');
}

function Info({ label, value }: { label: string; value?: string | number | null }): ReactElement {
  return (
    <Stack spacing={0.25}>
      <Typography sx={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>{label}</Typography>
      <Typography
        variant="body2"
        sx={{ fontWeight: 500, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {value || '-'}
      </Typography>
    </Stack>
  );
}

function ReadonlyTextField({
  label,
  value,
  multiline = false
}: {
  label: string;
  value?: string | number | null;
  multiline?: boolean;
}): ReactElement {
  return (
    <TextField
      fullWidth
      label={label}
      value={value || '-'}
      multiline={multiline}
      minRows={multiline ? 2 : undefined}
      InputLabelProps={{ shrink: true }}
      InputProps={{ readOnly: true }}
    />
  );
}

export default function NewPurchaseOrder(): ReactElement {
  const { salesOrderId } = useParams<PurchaseOrderCreateParams>();
  const history = useHistory();
  const [draft, setDraft] = useState<PurchaseOrderCreateDraft>(createDraft());
  const [attachments, setAttachments] = useState<File[]>([]);
  const [itemEdits, setItemEdits] = useState<Record<number, PurchaseOrderItemEdit>>({});
  const [manualItems, setManualItems] = useState<ManualPurchaseOrderItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const classes = useStyles();

  const { data: salesOrder, isFetching } = useQuery(
    ['purchase-order-create-sales-order', salesOrderId],
    () => getSalesOrderV1(salesOrderId),
    {
      enabled: Boolean(salesOrderId),
      refetchOnWindowFocus: false
    }
  );

  const { data: rfq } = useQuery(
    ['purchase-order-create-rfq', salesOrder?.rfqId],
    () => getRFQ(salesOrder?.rfqId || ''),
    {
      enabled: Boolean(salesOrder?.rfqId),
      refetchOnWindowFocus: false
    }
  );

  const { data: supplierQuotes = [], isFetching: isSupplierQuotesFetching } = useQuery(
    ['purchase-order-create-supplier-quotes', rfq?.id],
    () => getRFQSupplierQuotes(rfq?.id || ''),
    {
      enabled: Boolean(rfq?.id),
      refetchOnWindowFocus: false
    }
  );

  const { data: supplierDetail, isFetching: isSupplierFetching } = useQuery(
    ['purchase-order-create-supplier', draft.supplierId],
    () => getSupplierById(draft.supplierId),
    {
      enabled: Boolean(draft.supplierId),
      refetchOnWindowFocus: false
    }
  );

  const { data: supplierShippings = [], isFetching: isSupplierShippingsFetching } = useQuery(
    ['purchase-order-create-supplier-shippings'],
    () => getSupplierShippings(),
    {
      refetchOnWindowFocus: false
    }
  );

  const { data: paymentTerms = [] } = useQuery(
    ['purchase-order-payment-terms', GROUP_CODE.SUPPLIER_PAYMENT_TERM],
    () => getSystemConfig(GROUP_CODE.SUPPLIER_PAYMENT_TERM),
    { refetchOnWindowFocus: false }
  );

  useEffect(() => {
    setDraft(createDraft(salesOrder));
  }, [salesOrder]);

  useEffect(() => {
    if (!supplierDetail || supplierDetail.id !== draft.supplierId) {
      return;
    }
    setDraft((previous) => ({
      ...previous,
      supplierContactSnapshot: supplierDetail.contactName || '',
      supplierContactNoSnapshot: supplierDetail.contactNumber || '',
      supplierAddressSnapshot: supplierDetail.fullAddress || ''
    }));
  }, [draft.supplierId, supplierDetail]);

  const availableSupplierShippings = useMemo(() => {
    const shippingCategory = getShippingMethodCategory(salesOrder?.shippingType);
    if (shippingCategory === 'LAND') {
      return supplierShippings.filter((item) => item.shippingMethod === 'LAND');
    }
    if (shippingCategory === 'SEA') {
      return supplierShippings.filter((item) => item.shippingMethod === 'SEA');
    }
    return supplierShippings;
  }, [salesOrder?.shippingType, supplierShippings]);

  useEffect(() => {
    if (!availableSupplierShippings.length) {
      setDraft((previous) =>
        previous.supplierShippingId || previous.supplierShipping
          ? { ...previous, supplierShippingId: '', supplierShipping: null }
          : previous
      );
      return;
    }

    setDraft((previous) => {
      const isCurrentValid = availableSupplierShippings.some(
        (item) => String(item.id) === previous.supplierShippingId
      );
      if (isCurrentValid) {
        const supplierShipping =
          availableSupplierShippings.find(
            (item) => String(item.id) === previous.supplierShippingId
          ) || null;
        return previous.supplierShipping === supplierShipping
          ? previous
          : { ...previous, supplierShipping };
      }
      return {
        ...previous,
        supplierShippingId: String(availableSupplierShippings[0].id),
        supplierShipping: availableSupplierShippings[0]
      };
    });
  }, [availableSupplierShippings]);

  const supplierOptions = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    (salesOrder?.items || []).forEach((item) => {
      if (item.supplier?.id && !map.has(item.supplier.id)) {
        map.set(item.supplier.id, {
          id: item.supplier.id,
          label: item.supplier.supplierName || item.supplier.id
        });
      }
    });
    return Array.from(map.values());
  }, [salesOrder?.items]);

  const selectedShipping = useMemo(
    () =>
      availableSupplierShippings.find((item) => String(item.id) === draft.supplierShippingId) ||
      null,
    [availableSupplierShippings, draft.supplierShippingId]
  );

  const groupedSupplierShippings = useMemo(() => {
    const land = availableSupplierShippings.filter((item) => item.shippingMethod === 'LAND');
    const sea = availableSupplierShippings.filter((item) => item.shippingMethod === 'SEA');
    return { land, sea };
  }, [availableSupplierShippings]);

  useEffect(() => {
    if (!selectedShipping) {
      return;
    }
    setDraft((previous) => {
      if (previous.shippingLeadTimeDay) {
        return previous;
      }
      if (
        selectedShipping.leadTimeDayMax === null ||
        selectedShipping.leadTimeDayMax === undefined
      ) {
        return previous;
      }
      return {
        ...previous,
        shippingLeadTimeDay: String(selectedShipping.leadTimeDayMax)
      };
    });
  }, [selectedShipping]);

  const filteredItems = useMemo(() => {
    return (salesOrder?.items || []).filter(
      (item) =>
        item.supplier?.id === draft.supplierId &&
        (!selectedShipping ||
          getShippingMethodCategory(item.shippingMethod) === selectedShipping.shippingMethod)
    );
  }, [draft.supplierId, salesOrder?.items, selectedShipping]);

  const supplierQuoteTierById = useMemo(() => {
    const tiers = new Map<string, SupplierQuoteTierPricing>();
    supplierQuotes.forEach((quote) => {
      quote.details.forEach((detail) => {
        (detail.tiers || []).forEach((tier) => {
          if (tier.id !== null && tier.id !== undefined && tier.productPrice !== null) {
            tiers.set(String(tier.id), {
              productPrice: Number(tier.productPrice),
              shippingCost: Number(tier.shippingCost || 0),
              currency: tier.productPriceCurrency || tier.currency || null,
              shippingCurrency: tier.shippingCostCurrency || tier.currency || null
            });
          }
        });
      });
    });
    return tiers;
  }, [supplierQuotes]);

  const automaticShippingItems = useMemo(() => {
    const addedTierIds = new Set<string>();
    return filteredItems.flatMap((item) => {
      if (item.supplierQuoteTierId === null || item.supplierQuoteTierId === undefined) {
        return [];
      }
      const tierId = String(item.supplierQuoteTierId);
      const supplierQuoteTier = supplierQuoteTierById.get(tierId);
      if (!supplierQuoteTier || supplierQuoteTier.shippingCost <= 0 || addedTierIds.has(tierId)) {
        return [];
      }
      addedTierIds.add(tierId);
      return [
        {
          id: -Number(item.supplierQuoteTierId),
          imageUrl: null,
          name: 'Delivery',
          spec: ``,
          quantity: 1,
          supplierCurrency: supplierQuoteTier.shippingCurrency || item.supplierCurrency,
          supplierUnitPrice: supplierQuoteTier.shippingCost,
          supplierShippingCost: 0,
          isAutomaticShipping: true
        }
      ];
    });
  }, [filteredItems, supplierQuoteTierById]);

  const editableItems = useMemo(
    () => [
      ...filteredItems.map((item) => {
        const supplierQuoteTier =
          item.supplierQuoteTierId === null || item.supplierQuoteTierId === undefined
            ? undefined
            : supplierQuoteTierById.get(String(item.supplierQuoteTierId));

        return {
          ...item,
          supplierUnitPrice: supplierQuoteTier?.productPrice ?? item.supplierUnitPrice,
          supplierShippingCost: supplierQuoteTier ? 0 : item.supplierShippingCost,
          supplierCurrency: supplierQuoteTier?.currency || item.supplierCurrency,
          isAutomaticShipping: false,
          ...(itemEdits[item.id] || {})
        };
      }),
      ...manualItems,
      ...automaticShippingItems
    ],
    [automaticShippingItems, filteredItems, itemEdits, manualItems, supplierQuoteTierById]
  );
  const confirmedTier = useMemo(() => {
    if (!rfq?.confirmedTierId) {
      return null;
    }
    return (
      (rfq.details || [])
        .flatMap((detail) => detail.tiers || [])
        .find((tier) => tier.id === rfq.confirmedTierId) || null
    );
  }, [rfq?.confirmedTierId, rfq?.details]);

  const confirmedTierShippingMethod = useMemo(() => {
    return confirmedTier?.shippingMethod || rfq?.confirmedShippingMethod || '-';
  }, [confirmedTier?.shippingMethod, rfq?.confirmedShippingMethod]);
  const suggestedShippingMethodSnapshot = useMemo(
    () =>
      (PO_SHIPPING_METHOD_OPTIONS.includes((salesOrder?.shippingType || '').trim().toUpperCase())
        ? salesOrder?.shippingType?.trim().toUpperCase()
        : null) ||
      filteredItems
        .map((item) => item.shippingMethod?.trim().toUpperCase())
        .find(
          (shippingMethod) => shippingMethod && PO_SHIPPING_METHOD_OPTIONS.includes(shippingMethod)
        ) ||
      (PO_SHIPPING_METHOD_OPTIONS.includes(confirmedTierShippingMethod)
        ? confirmedTierShippingMethod
        : selectedShipping?.shippingMethod || ''),
    [
      confirmedTierShippingMethod,
      filteredItems,
      salesOrder?.shippingType,
      selectedShipping?.shippingMethod
    ]
  );

  useEffect(() => {
    if (!suggestedShippingMethodSnapshot) {
      return;
    }
    setDraft((previous) =>
      previous.shippingMethodSnapshot
        ? previous
        : { ...previous, shippingMethodSnapshot: suggestedShippingMethodSnapshot }
    );
  }, [suggestedShippingMethodSnapshot]);

  useEffect(() => {
    const shippingMethod = draft.shippingMethodSnapshot || suggestedShippingMethodSnapshot;
    const containerSize = resolveContainerSize(shippingMethod);
    setDraft((previous) =>
      previous.containerSizeSnapshot === containerSize
        ? previous
        : { ...previous, containerSizeSnapshot: containerSize }
    );
  }, [draft.shippingMethodSnapshot, suggestedShippingMethodSnapshot]);

  const selectedSupplierQuote = useMemo(() => {
    const quotesForSupplier = supplierQuotes
      .filter((quote) => quote.supplier?.id === draft.supplierId)
      .sort((left, right) => Number(right.revisionNo || 0) - Number(left.revisionNo || 0));

    return (
      quotesForSupplier.find((quote) => quote.id === rfq?.confirmedSupplierQuoteId) ||
      quotesForSupplier[0] ||
      supplierQuotes.find((quote) => quote.id === rfq?.confirmedSupplierQuoteId) ||
      null
    );
  }, [draft.supplierId, rfq?.confirmedSupplierQuoteId, supplierQuotes]);

  const selectedSupplierQuoteTierRows = useMemo(() => {
    const selectedTierIds = new Set(
      filteredItems.flatMap((item) =>
        item.supplierQuoteTierId === null || item.supplierQuoteTierId === undefined
          ? []
          : [String(item.supplierQuoteTierId)]
      )
    );

    if (!selectedTierIds.size) {
      return [];
    }

    return supplierQuotes.flatMap((quote) =>
      quote.details.flatMap((detail) =>
        (detail.tiers || [])
          .filter(
            (tier) =>
              tier.id !== null && tier.id !== undefined && selectedTierIds.has(String(tier.id))
          )
          .map((tier) => ({ quote, detail, tier }))
      )
    );
  }, [filteredItems, supplierQuotes]);

  const summary = useMemo(() => {
    const subTotal = editableItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const currency = editableItems[0]?.supplierCurrency || selectedShipping?.currency || '';
    const exchangeRate = editableItems[0]?.exchangeRate || 0;
    return { subTotal, currency, exchangeRate };
  }, [editableItems, selectedShipping?.currency]);

  const handleItemEdit = (itemId: number, field: EditablePurchaseOrderItemField, value: string) => {
    const nextValue = NUMERIC_ITEM_FIELDS.has(field) ? Number(value || 0) : value;
    if (itemId < 0) {
      setManualItems((previous) =>
        previous.map((item) => (item.id === itemId ? { ...item, [field]: nextValue } : item))
      );
      return;
    }
    setItemEdits((previous) => ({
      ...previous,
      [itemId]: {
        ...previous[itemId],
        [field]: nextValue
      }
    }));
  };

  const handleAddItem = () => {
    setManualItems((previous) => [
      ...previous,
      {
        id: -(Date.now() + previous.length),
        imageUrl: null,
        name: '',
        spec: '',
        quantity: 1,
        supplierCurrency: editableItems[0]?.supplierCurrency || selectedShipping?.currency || null,
        supplierUnitPrice: 0,
        supplierShippingCost: 0
      }
    ]);
  };

  const handleSubmit = async () => {
    if (!salesOrder?.salesOrderNo || !draft.supplierId || !draft.supplierShippingId) {
      toast.error('กรุณาเลือก Supplier และ Supplier Shipping');
      return;
    }
    if (!draft.paymentTerm) {
      toast.error('กรุณาเลือกเงื่อนไขการชำระเงิน');
      return;
    }
    setIsSaving(true);
    const req: CreatePurchaseOrderRequest = {
      salesOrderNo: salesOrder.salesOrderNo,
      supplierId: draft.supplierId,
      supplierShippingId: Number(draft.supplierShippingId),
      docDate: draft.docDate,
      productionLeadTimeDay: draft.productionLeadTimeDay
        ? Number(draft.productionLeadTimeDay)
        : null,
            shippingLeadTimeDay: draft.shippingLeadTimeDay ? Number(draft.shippingLeadTimeDay) : null,
            paymentTerm: draft.paymentTerm || null,
            shippingMethodSnapshot:
        draft.shippingMethodSnapshot || suggestedShippingMethodSnapshot || null,
      containerSizeSnapshot: draft.containerSizeSnapshot || null,
      supplierContactSnapshot: draft.supplierContactSnapshot,
      supplierContactNoSnapshot: draft.supplierContactNoSnapshot,
      supplierAddressSnapshot: draft.supplierAddressSnapshot,
      remark: draft.remark,
      items: editableItems.map((item) => ({
        salesOrderDetailId: item.id > 0 ? item.id : null,
        name: item.name,
        spec: item.spec,
        quantity: Number(item.quantity || 0),
        supplierCurrency: item.supplierCurrency || null,
        supplierUnitPrice: Number(item.supplierUnitPrice || 0),
        supplierShippingCost: Number(item.supplierShippingCost || 0)
      }))
    };
    console.log('Req:', req);
    try {
      const response = await toast.promise(createPurchaseOrder(req, attachments), {
        loading: 'กำลังสร้างใบสั่งซื้อ',
        success: 'สร้างใบสั่งซื้อสำเร็จ',
        error: 'สร้างใบสั่งซื้อไม่สำเร็จ'
      });

      history.push(ROUTE_PATHS.PURCHASE_ORDER_DETAIL.replace(':id', response.purchaseOrderNo));
    } finally {
      setIsSaving(false);
      setIsConfirmOpen(false);
    }
  };

  const handleSelectAttachments = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }
    setAttachments((previous) => [...previous, ...files]);
    event.target.value = '';
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <Page>
      <LoadingDialog
        open={isFetching || isSupplierFetching || isSupplierShippingsFetching || isSaving}
      />
      <PageTitle title="สร้างใบสั่งซื้อ" />
      <Wrapper>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{
            justifyContent: { sm: 'flex-end' },
            alignItems: { xs: 'stretch', sm: 'center' },
            mb: 2.5,
            px: { xs: 1, md: 1.5 }
          }}>
          <Button
            variant="contained"
            className="btn-emerald-green"
            startIcon={<AssignmentTurnedIn />}
            disabled={
              !salesOrder ||
              !['READY_FOR_PO', 'READY_FOR_PO_OVERRIDE', 'PO_CREATED'].includes(
                salesOrder.procurementStatus || ''
              ) ||
              !draft.supplierId ||
              !draft.supplierShippingId ||
              !draft.paymentTerm ||
              (!filteredItems.length && !manualItems.length)
            }
            onClick={() => setIsConfirmOpen(true)}>
            สร้างใบสั่งซื้อ
          </Button>
          <Button
            variant="contained"
            className="btn-cool-grey"
            startIcon={<ArrowBackIos />}
            onClick={() =>
              history.push(
                salesOrder?.salesOrderNo
                  ? ROUTE_PATHS.SALE_ORDER_DETAIL.replace(':id', salesOrder.salesOrderNo)
                  : ROUTE_PATHS.SALE_ORDER_MANAGEMENT
              )
            }>
            กลับ
          </Button>
        </Stack>
      </Wrapper>
      <Wrapper>
        <GridSearchSection
          container
          spacing={2.5}
          sx={{
            px: { xs: 1, md: 1.5 },
            pb: 1
          }}>
          <Grid item xs={12}>
            <CollapsibleWrapper title="ข้อมูลใบสั่งซื้อและสรุปยอด" defaultExpanded>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={12}>
                  <ReadonlyTextField
                    label="อ้างอิงใบยืนยันสั่งซื้อ"
                    value={salesOrder?.salesOrderNo}
                  />
                </Grid>
                <Grid item xs={12} sm={12}>
                  <ReadonlyTextField label="อ้างอิงคำขอราคาเลขที่" value={salesOrder?.rfqId} />
                </Grid>
                <Grid item xs={12} sm={12}>
                  <TextField
                    select
                    fullWidth
                    label="เงื่อนไขการชำระเงิน"
                    value={draft.paymentTerm}
                    onChange={(event) =>
                      setDraft((previous) => ({ ...previous, paymentTerm: event.target.value }))
                    }
                    InputLabelProps={{ shrink: true }}>
                    <MenuItem value="">-</MenuItem>
                    {paymentTerms.map((paymentTerm) => (
                      <MenuItem key={paymentTerm.code} value={paymentTerm.code}>
                        {paymentTerm.nameTh || paymentTerm.nameEn || paymentTerm.code}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="วันที่เอกสาร"
                    value={draft.docDate}
                    onChange={(event) =>
                      setDraft((previous) => ({ ...previous, docDate: event.target.value }))
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="ระยะเวลาผลิต"
                    value={draft.productionLeadTimeDay}
                    onChange={(event) =>
                      setDraft((previous) => ({
                        ...previous,
                        productionLeadTimeDay: event.target.value
                      }))
                    }
                    inputProps={{ min: 0, step: 1 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="ระยะเวลาส่งของ"
                    value={draft.shippingLeadTimeDay}
                    onChange={(event) =>
                      setDraft((previous) => ({
                        ...previous,
                        shippingLeadTimeDay: event.target.value
                      }))
                    }
                    inputProps={{ min: 0, step: 1 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    เอกสารแนบ
                  </Typography>
                  <Stack spacing={1.25} sx={{ mt: 1 }}>
                    <Box>
                      <Button
                        variant="contained"
                        className="btn-baby-blue"
                        component="label"
                        startIcon={<FilePresent />}
                        disabled={isSaving}>
                        อัปโหลดไฟล์
                        <input hidden type="file" multiple onChange={handleSelectAttachments} />
                      </Button>
                    </Box>
                    {attachments.length ? (
                      <Stack spacing={1}>
                        {attachments.map((file, index) => (
                          <Stack
                            key={`${file.name}-${index}`}
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
                            <Typography sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
                              {file.name}
                            </Typography>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<DeleteOutline />}
                              onClick={() => handleRemoveAttachment(index)}>
                              ลบ
                            </Button>
                          </Stack>
                        ))}
                      </Stack>
                    ) : null}
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Supplier
                  </Typography>
                  <br />
                  <ReadonlyTextField label="Supplier" value={supplierDetail?.supplierName || '-'} />
                </Grid>
                <Grid item xs={12} sm={12}>
                  <TextField
                    fullWidth
                    label="ผู้ติดต่อ"
                    value={draft.supplierContactSnapshot}
                    onChange={(event) =>
                      setDraft((previous) => ({
                        ...previous,
                        supplierContactSnapshot: event.target.value
                      }))
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={12}>
                  <TextField
                    fullWidth
                    label="เบอร์ติดต่อ"
                    value={draft.supplierContactNoSnapshot}
                    onChange={(event) =>
                      setDraft((previous) => ({
                        ...previous,
                        supplierContactNoSnapshot: event.target.value
                      }))
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label="ที่อยู่"
                    value={draft.supplierAddressSnapshot}
                    onChange={(event) =>
                      setDraft((previous) => ({
                        ...previous,
                        supplierAddressSnapshot: event.target.value
                      }))
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item sm={12}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    ขนส่ง
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="การขนส่ง"
                    value={draft.shippingMethodSnapshot || suggestedShippingMethodSnapshot || ''}
                    InputLabelProps={{ shrink: true }}
                    onChange={(event) =>
                      setDraft((previous) => ({
                        ...previous,
                        shippingMethodSnapshot: event.target.value
                      }))
                    }>
                    {PO_SHIPPING_METHOD_OPTIONS.map((shippingMethod) => (
                      <MenuItem key={shippingMethod} value={shippingMethod}>
                        {getShippingMethodLabel(shippingMethod)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="ขนาดตู้"
                    value={draft.containerSizeSnapshot}
                    InputLabelProps={{ shrink: true }}
                    onChange={(event) =>
                      setDraft((previous) => ({
                        ...previous,
                        containerSizeSnapshot: event.target.value
                      }))
                    }>
                    {PO_CONTAINER_SIZE_OPTIONS.map((containerSize) => (
                      <MenuItem key={containerSize || 'none'} value={containerSize}>
                        {containerSize || '-'}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Supplier Shipping"
                    value={draft.supplierShippingId}
                    InputLabelProps={{ shrink: true }}
                    onChange={(event) => {
                      const supplierShipping =
                        availableSupplierShippings.find(
                          (item) => String(item.id) === event.target.value
                        ) || null;
                      setDraft((previous) => ({
                        ...previous,
                        supplierShippingId: event.target.value,
                        supplierShipping,
                        shippingMethodSnapshot: ''
                      }));
                    }}
                    helperText={
                      !availableSupplierShippings.length
                        ? 'ไม่มี Shipping ที่ตรงกับประเภทการขนส่งของเอกสาร'
                        : undefined
                    }>
                    {groupedSupplierShippings.land.length ? (
                      <ListSubheader disableSticky>ทางรถ</ListSubheader>
                    ) : null}
                    {groupedSupplierShippings.land.map((shipping) => (
                      <MenuItem key={shipping.id} value={String(shipping.id)}>
                        {shipping.shippingName || `Shipping #${shipping.id}`}
                      </MenuItem>
                    ))}
                    {groupedSupplierShippings.sea.length ? (
                      <ListSubheader disableSticky>ทางเรือ</ListSubheader>
                    ) : null}
                    {groupedSupplierShippings.sea.map((shipping) => (
                      <MenuItem key={shipping.id} value={String(shipping.id)}>
                        {shipping.shippingName || `Shipping #${shipping.id}`}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ReadonlyTextField
                    label="Car Code"
                    value={draft.supplierShipping?.carCode || '-'}
                  />
                </Grid>
                <Grid item xs={12} sm={12}>
                  <ReadonlyTextField
                    label="ที่อยู่ขนส่ง"
                    value={formatShippingAddress(draft.supplierShipping?.destinations?.[0])}
                    multiline
                  />
                </Grid>
                <Grid item xs={12} sm={12}>
                  <ReadonlyTextField
                    label="หมายเหตุของขนส่ง"
                    value={draft.supplierShipping?.remark || '-'}
                    multiline
                  />
                </Grid>
              </Grid>
            </CollapsibleWrapper>
          </Grid>
          <Grid item xs={12}>
            <CollapsibleWrapper title="Supplier Quote" defaultExpanded>
              {isSupplierQuotesFetching ? (
                <Typography color="text.secondary">กำลังโหลดข้อมูล Supplier Quote...</Typography>
              ) : selectedSupplierQuote ? (
                <Stack spacing={2}>
                  <TableContainer className={classes.tableContainer}>
                    <Table size="small" sx={{ tableLayout: 'auto' }}>
                      <TableHead>
                        <TableRow>
                          <TableCell className={classes.tableHeader}>รายละเอียด</TableCell>
                          <TableCell
                            className={classes.tableHeader}
                            sx={{ width: '1%', whiteSpace: 'nowrap' }}>
                            จำนวน
                          </TableCell>
                          <TableCell
                            className={classes.tableHeader}
                            sx={{ width: '1%', whiteSpace: 'nowrap' }}>
                            ราคาสินค้า
                          </TableCell>
                          <TableCell
                            className={classes.tableHeader}
                            sx={{ width: '1%', whiteSpace: 'nowrap' }}>
                            ค่าขนส่ง
                          </TableCell>
                          <TableCell
                            className={classes.tableHeader}
                            sx={{ width: '1%', whiteSpace: 'nowrap' }}>
                            รวม
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedSupplierQuoteTierRows.map(({ quote, detail, tier }) => {
                          const productCurrency = tier.productPriceCurrency || tier.currency || '';
                          const shippingCurrency = tier.shippingCostCurrency || tier.currency || '';
                          const total =
                            Number(tier.productPrice || 0) * Number(tier.quantity || 0) +
                            Number(tier.shippingCost || 0);
                          return (
                            <TableRow
                              key={`${quote.id}-${detail.id || detail.sortOrder}-${tier.id}`}>
                              <TableCell className={classes.specCell}>
                                {detail.spec || '-'}
                              </TableCell>
                              <TableCell align="right" sx={{ width: '1%', whiteSpace: 'nowrap' }}>
                                {formatNumber(tier.quantity || 0)}
                              </TableCell>
                              <TableCell align="right" sx={{ width: '1%', whiteSpace: 'nowrap' }}>
                                {formatNumber(tier.productPrice || 0)} {productCurrency}
                              </TableCell>
                              <TableCell align="right" sx={{ width: '1%', whiteSpace: 'nowrap' }}>
                                {formatNumber(tier.shippingCost || 0)} {shippingCurrency}
                              </TableCell>
                              <TableCell align="right" sx={{ width: '1%', whiteSpace: 'nowrap' }}>
                                {formatNumber(total)} {tier.currency || productCurrency}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {!selectedSupplierQuoteTierRows.length ? (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              ไม่พบ Supplier Quote Tier ที่ลูกค้าเลือก
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {selectedSupplierQuote.additionalCosts?.length ? (
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
                        ค่าใช้จ่ายเพิ่มเติม
                      </Typography>
                      <Stack spacing={0.5}>
                        {selectedSupplierQuote.additionalCosts.map((cost) => (
                          <Typography
                            key={cost.id || `${cost.description}-${cost.sortOrder}`}
                            variant="body2">
                            {cost.description}: {cost.value || '-'} {cost.unit || ''}
                          </Typography>
                        ))}
                      </Stack>
                    </Box>
                  ) : null}
                  {selectedSupplierQuote.packages?.length ||
                    selectedSupplierQuote.details.some((detail) => detail.packages?.length) ? (
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
                        Supplier Package
                      </Typography>
                      <TableContainer className={classes.tableContainer}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell className={classes.tableHeader}>ชื่อ Package</TableCell>
                              <TableCell className={classes.tableHeader}>ขนาด</TableCell>
                              <TableCell className={classes.tableHeader}>น้ำหนัก</TableCell>
                              <TableCell className={classes.tableHeader}>ความจุ</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(selectedSupplierQuote.packages || []).map((packageItem) => (
                              <TableRow
                                key={`quote-package-${packageItem.id || packageItem.sortOrder}`}>
                                <TableCell>{packageItem.packageName || '-'}</TableCell>
                                <TableCell>{packageItem.packageDimension || '-'}</TableCell>
                                <TableCell>{packageItem.packageWeight || '-'}</TableCell>
                                <TableCell>{packageItem.packageCapacity || '-'}</TableCell>
                              </TableRow>
                            ))}
                            {selectedSupplierQuote.details.flatMap((detail) =>
                              (detail.packages || []).map((packageItem, packageIndex) => (
                                <TableRow
                                  key={`detail-package-${detail.id || detail.sortOrder}-${packageItem.id || packageIndex
                                    }`}>
                                  <TableCell>{detail.optionName || '-'}</TableCell>
                                  <TableCell>{packageItem.packageName || '-'}</TableCell>
                                  <TableCell>{packageItem.packageDimension || '-'}</TableCell>
                                  <TableCell>{packageItem.packageWeight || '-'}</TableCell>
                                  <TableCell>{packageItem.packageCapacity || '-'}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  ) : null}
                  {selectedSupplierQuote.leadTimes?.length ? (
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
                        Lead Time
                      </Typography>
                      <TableContainer className={classes.tableContainer}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell className={classes.tableHeader}>ประเภท</TableCell>
                              <TableCell className={classes.tableHeader}>ระยะเวลา (วัน)</TableCell>
                              <TableCell className={classes.tableHeader}>หมายเหตุ</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedSupplierQuote.leadTimes.map((leadTime, leadTimeIndex) => (
                              <TableRow
                                key={leadTime.id || `${leadTime.leadTimeCode}-${leadTimeIndex}`}>
                                <TableCell>
                                  {leadTime.leadTimeConfig?.nameTh ||
                                    leadTime.leadTimeConfig?.nameEn ||
                                    leadTime.leadTimeCode}
                                </TableCell>
                                <TableCell>
                                  {leadTime.leadTimeDayMin === leadTime.leadTimeDayMax
                                    ? leadTime.leadTimeDayMin
                                    : leadTime.leadTimeDayMin + ' - ' + leadTime.leadTimeDayMax}
                                </TableCell>
                                <TableCell>{leadTime.remark || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  ) : null}
                  <Grid container spacing={2}>
                    {selectedSupplierQuote.remark ? (
                      <Grid item xs={12}>
                        <Info label="หมายเหตุจาก Supplier" value={selectedSupplierQuote.remark} />
                      </Grid>
                    ) : null}
                  </Grid>
                </Stack>
              ) : (
                <Typography color="text.secondary">
                  ไม่พบ Supplier Quote สำหรับ Supplier ที่เลือก
                </Typography>
              )}
            </CollapsibleWrapper>
          </Grid>
          <Grid item xs={12}>
            <CollapsibleWrapper title="รายการสินค้า" defaultExpanded>
              <TableContainer className={classes.tableContainer} sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 880, tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: 88 }} />
                    <col />
                    <col style={{ width: 112 }} />
                    <col style={{ width: 156 }} />
                    <col style={{ width: 148 }} />
                  </colgroup>
                  <TableHead>
                    <TableRow>
                      <TableCell className={classes.tableHeader} sx={{ px: 1 }}>
                        รูป
                      </TableCell>
                      <TableCell className={classes.tableHeader}>รายละเอียด</TableCell>
                      <TableCell className={classes.tableHeader} sx={{ whiteSpace: 'nowrap' }}>
                        จำนวน
                      </TableCell>
                      <TableCell className={classes.tableHeader} sx={{ whiteSpace: 'nowrap' }}>
                        ราคาสินค้า
                      </TableCell>
                      <TableCell className={classes.tableHeader} sx={{ whiteSpace: 'nowrap' }}>
                        รวม
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {editableItems.map((item) => {
                      const total = calculateItemTotal(item);
                      return (
                        <TableRow key={item.id}>
                          <TableCell align="center" sx={{ px: 1 }}>
                            {item.imageUrl ? (
                              <Box
                                component="img"
                                src={item.imageUrl}
                                alt={item.name || 'product-image'}
                                className={classes.imageThumb}
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                -
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell className={classes.specCell}>
                            <Stack spacing={1}>
                              <TextField
                                fullWidth
                                size="small"
                                label="สินค้า"
                                value={item.name || ''}
                                onChange={(event) =>
                                  handleItemEdit(item.id, 'name', event.target.value)
                                }
                                InputProps={{ readOnly: item.isAutomaticShipping }}
                              />
                              <TextField
                                fullWidth
                                size="small"
                                multiline
                                minRows={2}
                                label="รายละเอียด"
                                value={item.spec || ''}
                                onChange={(event) =>
                                  handleItemEdit(item.id, 'spec', event.target.value)
                                }
                                InputProps={{ readOnly: item.isAutomaticShipping }}
                              />
                            </Stack>
                          </TableCell>
                          <TableCell align="right" sx={{ px: 1, verticalAlign: 'top' }}>
                            <TextField
                              size="small"
                              type="number"
                              sx={{ width: '100%' }}
                              value={item.quantity || 0}
                              onChange={(event) =>
                                handleItemEdit(item.id, 'quantity', event.target.value)
                              }
                              InputProps={{ readOnly: item.isAutomaticShipping }}
                              inputProps={{ min: 0, step: 1, style: { textAlign: 'right' } }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ px: 1, verticalAlign: 'top' }}>
                            <TextField
                              size="small"
                              type="number"
                              sx={{ width: '100%' }}
                              value={item.supplierUnitPrice || 0}
                              onChange={(event) =>
                                handleItemEdit(item.id, 'supplierUnitPrice', event.target.value)
                              }
                              InputProps={{ readOnly: item.isAutomaticShipping }}
                              inputProps={{ min: 0, step: 0.0001, style: { textAlign: 'right' } }}
                              helperText={item.supplierCurrency || undefined}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ px: 1, verticalAlign: 'top' }}>
                            <TextField
                              fullWidth
                              size="small"
                              value={`${formatNumber(total)}`}
                              InputLabelProps={{ shrink: true }}
                              InputProps={{ readOnly: true }}
                              inputProps={{ min: 0, step: 0.0001, style: { textAlign: 'right' } }}
                              helperText={item.supplierCurrency || undefined}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2.5 }}>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleAddItem}
                  sx={{ borderRadius: '999px', px: 3, py: 1.25, fontWeight: 700, minHeight: 48 }}>
                  เพิ่มรายการใหม่
                </Button>
              </Stack>
            </CollapsibleWrapper>
          </Grid>
          <Grid item xs={12}>
            <CollapsibleWrapper title="สรุป" defaultExpanded>
              <Grid container spacing={2} alignItems="flex-start">
                <Grid item xs={12} md>
                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    label="หมายเหตุ"
                    value={draft.remark}
                    onChange={(event) =>
                      setDraft((previous) => ({ ...previous, remark: event.target.value }))
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md="auto">
                  <TextField
                    fullWidth
                    label="จำนวนเงินทั้งสิ้น"
                    value={formatNumber(summary.subTotal) + ' ' + summary.currency}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ readOnly: true }}
                    inputProps={{ style: { textAlign: 'right' } }}
                    sx={{ width: { xs: '100%', md: 280 } }}
                  />
                </Grid>
              </Grid>
            </CollapsibleWrapper>
          </Grid>
        </GridSearchSection>
      </Wrapper>
      <Wrapper>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{
            justifyContent: { sm: 'flex-end' },
            alignItems: { xs: 'stretch', sm: 'center' },
            mb: 2.5,
            px: { xs: 1, md: 1.5 }
          }}>
          <Button
            variant="contained"
            className="btn-emerald-green"
            startIcon={<AssignmentTurnedIn />}
            disabled={
              !salesOrder ||
              !['READY_FOR_PO', 'READY_FOR_PO_OVERRIDE', 'PO_CREATED'].includes(
                salesOrder.procurementStatus || ''
              ) ||
              !draft.supplierId ||
              !draft.supplierShippingId ||
              !draft.paymentTerm ||
              (!filteredItems.length && !manualItems.length)
            }
            onClick={() => setIsConfirmOpen(true)}>
            สร้างใบสั่งซื้อ
          </Button>
          <Button
            variant="contained"
            className="btn-cool-grey"
            startIcon={<ArrowBackIos />}
            onClick={() =>
              history.push(
                salesOrder?.salesOrderNo
                  ? ROUTE_PATHS.SALE_ORDER_DETAIL.replace(':id', salesOrder.salesOrderNo)
                  : ROUTE_PATHS.SALE_ORDER_MANAGEMENT
              )
            }>
            กลับ
          </Button>
        </Stack>
      </Wrapper>

      <ConfirmDialog
        open={isConfirmOpen}
        title="ยืนยันสร้างใบสั่งซื้อ"
        message={`คุณต้องการสร้างใบสั่งซื้อจากใบยืนยันสั่งซื้อนี้ พร้อมเอกสารแนบ ${attachments.length} ไฟล์ ใช่หรือไม่`}
        isShowCancelButton
        isShowConfirmButton
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleSubmit}
      />
    </Page>
  );
}
