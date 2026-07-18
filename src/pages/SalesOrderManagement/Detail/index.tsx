import {
  ArrowBackIos,
  ArrowDropDown,
  AssignmentTurnedIn,
  Cancel,
  DeleteOutline,
  Description,
  FilePresent,
  Menu as MenuIcon,
  NoteAdd,
  ReceiptLong,
  Save
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Checkbox,
  FormControlLabel,
  Grid,
  InputAdornment,
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
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import Can from 'auth/Can';
import { PERMISSIONS } from 'auth/permissions';
import ActivityHistoryTimeline from 'components/ActivityHistoryTimeline';
import DocumentFlow, { DocumentFlowItem } from 'components/DocumentFlow';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import { GridSearchSection, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import {
  MouseEvent as ReactMouseEvent,
  ReactElement,
  SyntheticEvent,
  useEffect,
  useMemo,
  useState
} from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { IoPencil } from 'react-icons/io5';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { getActivityHistory } from 'services/ActivityHistory/activity-history-api';
import { getInvoicesBySalesOrderId } from 'services/Invoice/invoice-api';
import { InvoiceRecord } from 'services/Invoice/invoice-type';
import { searchReceipts, viewReceipt } from 'services/Receipt/receipt-api';
import { ReceiptRecord } from 'services/Receipt/receipt-type';
import {
  getSalesOrderV1,
  deleteSalesOrderAttachment,
  updateSalesOrderV1,
  downloadSaleOrder,
  uploadSalesOrderAttachments
} from 'services/SaleOrder/sale-order-api';
import {
  SalesOrderAttachment,
  SalesOrderDetailV1,
  SalesOrderV1,
  UpdateSalesOrderRequestV1
} from 'services/SaleOrder/sale-order-type';
import { DownloadDocumentResponse } from 'services/general-type';
import { base64ToBlob } from 'utils';
import { formatDate } from 'utils';
import { getDocumentStatusChipSx, getDocumentStatusLabel } from 'utils/documentStatus';
import { formatNumber } from 'utils/utils';

interface SalesOrderDetailParams {
  id: string;
}

interface SalesOrderDraft {
  docDate: string;
  expireDate: string;
  coSaleId: string;
  shippingType: string;
  discount: number;
  freight: number;
  amount: number;
  commission: number;
  coSaleCommission: number;
  isVat: boolean;
  requestCoa: boolean;
  requestPo: boolean;
  remark: string;
  items: SalesOrderDetailV1[];
}

function getEmployeeName(salesOrder?: SalesOrderV1): string {
  const employee = salesOrder?.saleAccount;
  if (!employee) {
    return '-';
  }

  return (
    [employee.firstNameTh || employee.firstName, employee.lastNameTh || employee.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() || '-'
  );
}

function getCustomerLabel(salesOrder?: SalesOrderV1): string {
  const customer = salesOrder?.customer as any;
  if (!customer) return '-';
  return (
    [customer.id ? `(${customer.id})` : '', customer.customerName || customer.companyName || '']
      .filter(Boolean)
      .join(' ') || '-'
  );
}

function getShippingTypeLabel(shippingType?: string | null): string {
  if (!shippingType) {
    return '-';
  }

  if (shippingType === 'LAND') {
    return 'ทางรถ';
  }

  if (shippingType === 'SEA') {
    return 'ทางเรือ';
  }

  if (shippingType === 'FULL_CONTAINER_LOAD') {
    return 'ทางเรือแบบปิดตู้';
  }

  return shippingType;
}

function getProcurementStatusLabel(status?: string | null): string {
  switch (status) {
    case 'NOT_READY':
      return 'ยังไม่พร้อมสร้าง PO';
    case 'READY_FOR_PO':
      return 'พร้อมสร้าง PO';
    case 'PO_CREATED':
      return 'สร้าง PO แล้ว';
    default:
      return status || '-';
  }
}

function toDateInput(value?: string | null): string {
  if (!value) {
    return '';
  }

  const parts = value.split('/');
  if (parts.length !== 3) {
    return value;
  }

  return `${parts[2]}-${parts[1]}-${parts[0]}`;
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

function createDraft(salesOrder?: SalesOrderV1): SalesOrderDraft {
  return {
    docDate: toDateInput(salesOrder?.docDate),
    expireDate: toDateInput(salesOrder?.expireDate),
    coSaleId: salesOrder?.coSaleId || '',
    shippingType: salesOrder?.shippingType || '',
    discount: Number(salesOrder?.discount || 0),
    freight: Number(salesOrder?.freight || 0),
    amount: Number(salesOrder?.amount || 0),
    commission: Number(salesOrder?.commission || 0),
    coSaleCommission: Number(salesOrder?.coSaleCommission || 0),
    isVat: Number(salesOrder?.vatRate || 0) > 0,
    requestCoa: Boolean(salesOrder?.requestCoa),
    requestPo: Boolean(salesOrder?.requestPo),
    remark: salesOrder?.remark || '',
    items: (salesOrder?.items || []).map((item) => ({ ...item }))
  };
}

export default function SalesOrderDetail(): ReactElement {
  const { id } = useParams<SalesOrderDetailParams>();
  const history = useHistory();
  const { t } = useTranslation();
  const theme = useTheme();
  const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
  const [tab, setTab] = useState<'detail' | 'history' | 'paymentHistory'>('detail');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<SalesOrderDraft>(createDraft());
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState<null | HTMLElement>(null);
  const useStyles = makeStyles({
    tableHeader: {
      border: '2px solid #e0e0e0',
      fontWeight: 'bold',
      paddingLeft: '10px',
      textAlign: 'center'
    },
    section: {
      backgroundColor: '#fff',
      border: '1px solid #e6ebf1',
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
    fitContentCell: {
      width: 1,
      whiteSpace: 'nowrap'
    },
    mobileItemCard: {
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      padding: 14,
      backgroundColor: '#ffffff'
    },
    mobileItemHeader: {
      paddingBottom: 10,
      borderBottom: '1px solid #eef2f7'
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
    data: salesOrder,
    isFetching,
    refetch
  } = useQuery(['sales-order-detail', id], () => getSalesOrderV1(id), {
    enabled: Boolean(id),
    refetchOnWindowFocus: false
  });

  const {
    data: activityHistory = [],
    isFetching: isActivityHistoryFetching,
    refetch: refetchHistory
  } = useQuery(['sales-order-activity-history', id], () => getActivityHistory('SALES_ORDER', id), {
    enabled: Boolean(id),
    refetchOnWindowFocus: false
  });

  const {
    data: relatedInvoices = [],
    isFetching: isInvoicePaymentsFetching,
    refetch: refetchInvoices
  } = useQuery(
    ['sales-order-invoices', salesOrder?.salesOrderNo],
    () => getInvoicesBySalesOrderId(salesOrder!.salesOrderNo),
    {
      enabled: Boolean(salesOrder?.salesOrderNo),
      refetchOnWindowFocus: false
    }
  );

  const {
    data: relatedReceiptsResponse,
    isFetching: isReceiptFlowFetching
  } = useQuery(
    ['sales-order-receipts', salesOrder?.salesOrderNo],
    () =>
      searchReceipts(
        {
          keyword: salesOrder?.salesOrderNo
        },
        1,
        10
      ),
    {
      enabled: Boolean(salesOrder?.salesOrderNo),
      refetchOnWindowFocus: false
    }
  );

  useEffect(() => {
    setDraft(createDraft(salesOrder));
    setIsEditing(false);
  }, [salesOrder]);

  const displayItems = isEditing ? draft.items : salesOrder?.items || [];
  const isActionMenuOpen = Boolean(actionMenuAnchorEl);
  const canManageSalesOrderAttachments =
    salesOrder?.status !== 'CANCELLED' && salesOrder?.status !== 'REJECTED';
  const relatedReceipts = relatedReceiptsResponse?.data?.records || [];
  const latestInvoice = relatedInvoices[0] || null;
  const latestReceipt =
    relatedReceipts.find((record) => record.salesOrderNo === salesOrder?.salesOrderNo) ||
    relatedReceipts[0] ||
    null;
  const quotationNo = latestInvoice?.quotationNo || latestReceipt?.quotationNo || null;

  const documentFlowItems: DocumentFlowItem[] = [
    {
      title: 'ใบเสนอราคา',
      docNo: quotationNo,
      status: latestInvoice?.status || latestReceipt?.status || null,
      statusProfile: latestInvoice?.statusProfile || latestReceipt?.statusProfile,
      onOpen: quotationNo
        ? () => window.open(ROUTE_PATHS.QUOTATION_DETAIL.replace(':id', quotationNo), '_blank', 'noopener,noreferrer')
        : undefined
    },
    {
      title: 'ใบยืนยันสั่งซื้อ',
      docNo: salesOrder?.salesOrderNo || null,
      status: salesOrder?.status || null,
      statusProfile: salesOrder?.statusProfile,
      isCurrent: true,
      onOpen: salesOrder?.salesOrderNo
        ? () => window.open(ROUTE_PATHS.SALE_ORDER_DETAIL.replace(':id', salesOrder.salesOrderNo), '_blank', 'noopener,noreferrer')
        : undefined
    },
    {
      title: 'ใบแจ้งหนี้',
      docNo: latestInvoice?.invoiceNo || null,
      status: latestInvoice?.status || null,
      statusProfile: latestInvoice?.statusProfile,
      count: relatedInvoices.length > 1 ? relatedInvoices.length : undefined,
      isLoading: isInvoicePaymentsFetching,
      onOpen: latestInvoice?.invoiceNo
        ? () => window.open(ROUTE_PATHS.INVOICE_DETAIL.replace(':id', latestInvoice.invoiceNo), '_blank', 'noopener,noreferrer')
        : undefined
    },
    {
      title: 'ใบเสร็จรับเงิน',
      docNo: latestReceipt?.receiptNo || null,
      status: latestReceipt?.status || null,
      statusProfile: latestReceipt?.statusProfile,
      count: relatedReceipts.length > 1 ? relatedReceipts.length : undefined,
      isLoading: isReceiptFlowFetching,
      onOpen: latestReceipt?.receiptNo
        ? () => window.open(ROUTE_PATHS.RECEIPT_DETAIL.replace(':id', latestReceipt.receiptNo), '_blank', 'noopener,noreferrer')
        : undefined
    }
  ];

  const summary = useMemo(() => {
    const subTotal = displayItems.reduce((sum, item) => {
      return sum + Number(item.unitPrice || 0) * Number(item.quantity || 0);
    }, 0);
    const discount = Number(isEditing ? draft.discount : salesOrder?.discount || 0);
    const freight = Number(isEditing ? draft.freight : salesOrder?.freight || 0);
    const taxable = Math.max(subTotal - discount, 0);
    const vat = (isEditing ? draft.isVat : Number(salesOrder?.vatRate || 0) > 0)
      ? taxable * 0.07
      : 0;
    const grandTotal = taxable + vat;

    return { subTotal, discount, freight, vat, grandTotal };
  }, [
    displayItems,
    draft.discount,
    draft.freight,
    draft.isVat,
    isEditing,
    salesOrder?.discount,
    salesOrder?.freight,
    salesOrder?.vatRate
  ]);

  const handleChangeTab = (_event: SyntheticEvent, value: 'detail' | 'history' | 'paymentHistory') => {
    setTab(value);
  };

  const updateDraftField = <K extends keyof SalesOrderDraft>(
    field: K,
    value: SalesOrderDraft[K]
  ) => {
    setDraft((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const updateDraftItem = (
    index: number,
    field: keyof SalesOrderDetailV1,
    value: string | number
  ) => {
    setDraft((previous) => ({
      ...previous,
      items: previous.items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        const nextItem = {
          ...item,
          [field]: value
        };

        const unitPrice = Number(field === 'unitPrice' ? value : nextItem.unitPrice || 0);
        const quantity = Number(field === 'quantity' ? value : nextItem.quantity || 0);

        return {
          ...nextItem,
          unitPrice,
          quantity,
          amount: unitPrice * quantity
        };
      })
    }));
  };

  const handleEdit = () => {
    setDraft(createDraft(salesOrder));
    setIsEditing(true);
  };

  const handleOpenActionMenu = (event: ReactMouseEvent<HTMLElement>) => {
    setActionMenuAnchorEl(event.currentTarget);
  };

  const handleCloseActionMenu = () => {
    setActionMenuAnchorEl(null);
  };

  const handleSelectEdit = () => {
    handleCloseActionMenu();
    handleEdit();
  };

  const handleCreateInvoice = () => {
    if (!salesOrder?.salesOrderNo) {
      return;
    }

    handleCloseActionMenu();
    history.push(
      ROUTE_PATHS.INVOICE_CREATE_FROM_SALES_ORDER.replace(':salesOrderId', salesOrder.salesOrderNo)
    );
  };

  const handleCreatePurchaseOrder = () => {
    if (!salesOrder?.salesOrderNo) {
      return;
    }

    handleCloseActionMenu();
    history.push(
      ROUTE_PATHS.PURCHASE_ORDER_CREATE_FROM_SALES_ORDER.replace(
        ':salesOrderId',
        salesOrder.salesOrderNo
      )
    );
  };

  const handleCancel = () => {
    handleCloseActionMenu();
    setDraft(createDraft(salesOrder));
    setIsEditing(false);
  };

  const handleDownloadSalesOrder = async () => {
    if (!salesOrder?.salesOrderNo) {
      return;
    }

    handleCloseActionMenu();

    await toast.promise(downloadSaleOrder(salesOrder.salesOrderNo, 'PDF', true, false), {
      loading: t('toast.loading'),
      success: (response) => {
        const data = response.data as DownloadDocumentResponse;
        const files = data.files || [];

        if (!files.length) {
          throw new Error('No file');
        }

        files.forEach((file) => {
          const blob = base64ToBlob(file.base64, file.contentType || 'application/pdf');
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = file.fileName || `${salesOrder.salesOrderNo}.pdf`;
          anchor.click();
          URL.revokeObjectURL(url);
        });

        return t('toast.success');
      },
      error: t('toast.failed')
    });
  };

  const handleViewReceipt = async (receiptNo: string) => {
    await toast.promise(viewReceipt(receiptNo, true, false), {
      loading: t('toast.loading'),
      success: (response) => {
        const data = response.data as DownloadDocumentResponse;
        const files = data.files || [];

        if (!files.length) {
          throw new Error('No file');
        }

        files.forEach((file) => {
          const blob = base64ToBlob(file.base64, file.contentType || 'application/pdf');
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = file.fileName || `${receiptNo}.pdf`;
          anchor.click();
          URL.revokeObjectURL(url);
        });

        return t('toast.success');
      },
      error: t('toast.failed')
    });
  };

  const handleSave = async () => {
    if (!salesOrder?.salesOrderNo) {
      return;
    }

    const payload: UpdateSalesOrderRequestV1 = {
      docDate: draft.docDate || null,
      expireDate: draft.expireDate || null,
      coSaleId: draft.coSaleId || null,
      discount: Number(draft.discount || 0),
      freight: Number(draft.freight || 0),
      amount: Number(draft.amount || 0),
      commission: Number(draft.commission || 0),
      coSaleCommission: draft.coSaleId ? Number(draft.coSaleCommission || 0) : null,
      isVat: draft.isVat,
      shippingType: draft.shippingType || null,
      requestCoa: draft.requestCoa,
      requestPo: draft.requestPo,
      remark: draft.remark,
      items: draft.items.map((item) => ({
        id: item.id,
        supplierId: item.supplier?.id || '',
        name: item.name || '',
        type: item.type || null,
        capacity: item.capacity || null,
        size: item.size || null,
        spec: item.spec || null,
        unitPrice: Number(item.unitPrice || 0),
        quantity: Number(item.quantity || 0),
        imageUrl: item.imageUrl || null,
        rfqDetailId: item.rfqDetailId ?? null,
        rfqTierId: item.rfqTierId ?? null,
        quotationDetailId: item.quotationDetailId ?? null,
        shippingMethod: item.shippingMethod || null,
        supplierCurrency: item.supplierCurrency || null,
        supplierUnitPrice: item.supplierUnitPrice ?? null,
        exchangeRate: item.exchangeRate ?? null,
        supplierShippingCost: item.supplierShippingCost ?? null,
        supplierTotalUnitCost: item.supplierTotalUnitCost ?? null,
        supplierQuoteTierId: item.supplierQuoteTierId ?? null
      }))
    };

    setIsSaving(true);
    try {
      await toast.promise(updateSalesOrderV1(salesOrder.salesOrderNo, payload), {
        loading: t('toast.loading'),
        success: t('toast.success'),
        error: t('toast.failed')
      });
      setIsEditing(false);
      await Promise.all([refetch(), refetchHistory(), refetchInvoices()]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadAttachments = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!salesOrder?.salesOrderNo || !event.target.files?.length) {
      return;
    }

    const files = Array.from(event.target.files);
    setIsSaving(true);
    try {
      await toast.promise(uploadSalesOrderAttachments(salesOrder.salesOrderNo, files), {
        loading: t('toast.loading'),
        success: t('toast.success'),
        error: t('toast.failed')
      });
      await Promise.all([refetch(), refetchHistory()]);
    } finally {
      event.target.value = '';
      setIsSaving(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!salesOrder?.salesOrderNo) {
      return;
    }

    setIsSaving(true);
    try {
      await toast.promise(deleteSalesOrderAttachment(salesOrder.salesOrderNo, attachmentId), {
        loading: t('toast.loading'),
        success: t('toast.success'),
        error: t('toast.failed')
      });
      await Promise.all([refetch(), refetchHistory()]);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Page>
      <LoadingDialog open={isFetching || isActivityHistoryFetching || isInvoicePaymentsFetching || isSaving} />
      <PageTitle
        title={
          salesOrder?.salesOrderNo
            ? `ใบยืนยันสั่งซื้อเลขที่ ${salesOrder.salesOrderNo}`
            : 'ใบยืนยันสั่งซื้อ'
        }>
        {salesOrder?.status ? (
          <Chip
            label={getDocumentStatusLabel(salesOrder.status, salesOrder.statusProfile)}
            size="small"
            sx={getDocumentStatusChipSx(salesOrder.status, salesOrder.statusProfile)}
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
            startIcon={<MenuIcon />}
            endIcon={<ArrowDropDown />}
            onClick={handleOpenActionMenu}
            disabled={!salesOrder}
            aria-controls={isActionMenuOpen ? 'sales-order-action-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={isActionMenuOpen ? 'true' : undefined}>
            ตัวเลือก
          </Button>
          <Menu
            id="sales-order-action-menu"
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
            {
              <>
                <Can permission={PERMISSIONS.SALES_ORDER_EDIT}>
                  <MenuItem
                    onClick={handleSelectEdit}
                    disabled={!salesOrder}
                    sx={{ width: '100%' }}>
                    <ListItemIcon>
                      <IoPencil />
                    </ListItemIcon>
                    <ListItemText primary="แก้ไขใบสั่งซื้อ" />
                  </MenuItem>
                </Can>
                <MenuItem
                  onClick={handleDownloadSalesOrder}
                  disabled={!salesOrder}
                  sx={{ width: '100%' }}>
                  <ListItemIcon>
                    <Description fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="ดูใบสั่งซื้อ" />
                </MenuItem>
                <Can permission={PERMISSIONS.INVOICE_CREATE}>
                  <MenuItem
                    onClick={handleCreateInvoice}
                    disabled={!salesOrder || Boolean(salesOrder.invoiceNo)}
                    sx={{ width: '100%' }}>
                    <ListItemIcon>
                      <ReceiptLong fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={t('documentManagement.invoice.createInvoiceMenu')} />
                  </MenuItem>
                </Can>
                <Can permission={PERMISSIONS.PURCHASE_ORDER_CREATE}>
                  <MenuItem
                    onClick={handleCreatePurchaseOrder}
                    disabled={!salesOrder || salesOrder.procurementStatus !== 'READY_FOR_PO'}
                    sx={{ width: '100%' }}>
                    <ListItemIcon>
                      <AssignmentTurnedIn fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={t('documentManagement.invoice.createPOMenu')} />
                  </MenuItem>
                </Can>
              </>
            }
          </Menu>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-cool-grey"
            startIcon={<ArrowBackIos />}
            onClick={() => history.push(ROUTE_PATHS.SALE_ORDER_MANAGEMENT)}>
            {t('button.back')}
          </Button>
        </Stack>

        <DocumentFlow items={documentFlowItems} />

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
            <Tab value="detail" label="รายละเอียด" />
            <Tab value="history" label="ประวัติ" />
            <Tab value="paymentHistory" label="ประวัติการชำระเงิน" />
          </Tabs>
        </Box>

        {isEditing ? (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            useFlexGap
            sx={{
              justifyContent: 'flex-end',
              alignItems: { xs: 'stretch', sm: 'center' },
              mt: 2
            }}>
            <Button
              fullWidth={isDownSm}
              variant="contained"
              className="btn-cool-grey"
              startIcon={<Cancel />}
              onClick={handleCancel}
              disabled={isSaving}>
              {t('button.cancel')}
            </Button>
            <Button
              fullWidth={isDownSm}
              variant="contained"
              className="btn-emerald-green"
              startIcon={<Save />}
              onClick={() => {
                void handleSave();
              }}
              disabled={isSaving}>
              {t('button.save')}
            </Button>
          </Stack>
        ) : null}

        <TabPanel value="detail" currentTab={tab}>
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Stack spacing={1.25} className={classes.section}>
                  <Typography variant="h6">ใบยืนยันสั่งซื้อ</Typography>
                  <Info label="เลขที่เอกสาร" value={salesOrder?.salesOrderNo} />
                  {isEditing ? (
                    <TextField
                      type="date"
                      label="วันที่เอกสาร"
                      value={draft.docDate}
                      onChange={(event) => updateDraftField('docDate', event.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  ) : (
                    <Info label="วันที่เอกสาร" value={salesOrder?.docDate} />
                  )}
                  {isEditing ? (
                    <TextField
                      type="date"
                      label="วันที่หมดอายุ"
                      value={draft.expireDate}
                      onChange={(event) => updateDraftField('expireDate', event.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  ) : (
                    <Info label="วันที่หมดอายุ" value={salesOrder?.expireDate} />
                  )}
                  <Info
                    label="สถานะ"
                    value={getDocumentStatusLabel(salesOrder?.status, salesOrder?.statusProfile)}
                  />
                  <Info
                    label="สถานะจัดซื้อ"
                    value={getProcurementStatusLabel(salesOrder?.procurementStatus)}
                  />
                  <Info label="Revision" value={salesOrder?.revNo ?? '-'} />
                  {isEditing ? (
                    <TextField
                      select
                      label="วิธีขนส่ง"
                      value={draft.shippingType}
                      onChange={(event) => updateDraftField('shippingType', event.target.value)}>
                      <MenuItem value="LAND">ทางรถ</MenuItem>
                      <MenuItem value="SEA">ทางเรือ</MenuItem>
                      <MenuItem value="FULL_CONTAINER_LOAD">ทางเรือแบบปิดตู้</MenuItem>
                    </TextField>
                  ) : (
                    <Info
                      label="วิธีขนส่ง"
                      value={getShippingTypeLabel(salesOrder?.shippingType)}
                    />
                  )}
                </Stack>
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack spacing={1.25} className={classes.section}>
                  <Typography variant="h6">{t('customerManagement.customer')}</Typography>
                  <Info
                    label={t('customerManagement.customer')}
                    value={getCustomerLabel(salesOrder)}
                  />
                  <Info
                    label={t('documentManagement.quotation.customerSection.contactName')}
                    value={
                      salesOrder?.customerContact?.contactName ||
                      salesOrder?.customer?.contacts?.[0]?.contactName
                    }
                  />
                  <Info
                    label={t('documentManagement.quotation.customerSection.contactNumber')}
                    value={
                      salesOrder?.customerContact?.contactNumber ||
                      salesOrder?.customer?.contacts?.[0]?.contactNumber
                    }
                  />
                </Stack>
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack spacing={1.25} className={classes.section}>
                  <Typography variant="h6">
                    {t('documentManagement.quotation.salesAccount')}
                  </Typography>
                  <Info
                    label={t('documentManagement.quotation.salesAccount')}
                    value={getEmployeeName(salesOrder)}
                  />
                  {isEditing ? (
                    <TextField
                      label={t('documentManagement.quotation.coSalesAccount')}
                      value={draft.coSaleId}
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      onChange={(event) => updateDraftField('coSaleId', event.target.value)}
                    />
                  ) : (
                    <Info
                      label={t('documentManagement.quotation.coSalesAccount')}
                      value={salesOrder?.coSaleId}
                    />
                  )}
                  {isEditing ? (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={draft.isVat}
                          onChange={(event) => updateDraftField('isVat', event.target.checked)}
                        />
                      }
                      label="คิด VAT 7%"
                    />
                  ) : (
                    <Info
                      label="VAT"
                      value={Number(salesOrder?.vatRate || 0) > 0 ? 'รวม VAT' : 'ไม่รวม VAT'}
                    />
                  )}
                  {isEditing ? (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={draft.requestCoa}
                          onChange={(event) => updateDraftField('requestCoa', event.target.checked)}
                        />
                      }
                      label="Request COA"
                    />
                  ) : (
                    <Info
                      label="Request COA"
                      value={salesOrder?.requestCoa ? 'ใช่' : 'ไม่ใช่'}
                    />
                  )}
                  {isEditing ? (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={draft.requestPo}
                          onChange={(event) => updateDraftField('requestPo', event.target.checked)}
                        />
                      }
                      label="Request PO"
                    />
                  ) : (
                    <Info
                      label="Request PO"
                      value={salesOrder?.requestPo ? 'ใช่' : 'ไม่ใช่'}
                    />
                  )}
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Stack spacing={1.25} className={classes.section}>
                  <Typography variant="h6">หมายเหตุ</Typography>
                  {isEditing ? (
                    <TextField
                      multiline
                      minRows={3}
                      fullWidth
                      value={draft.remark}
                      onChange={(event) => updateDraftField('remark', event.target.value)}
                    />
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {salesOrder?.remark || '-'}
                    </Typography>
                  )}
                </Stack>
              </Grid>
            </Grid>

            <GridSearchSection container>
              {isDownSm ? (
                <Stack spacing={1.25} sx={{ width: '100%' }}>
                  {displayItems.length ? (
                    displayItems.map((item, index) => (
                      <Stack key={item.id || item.lineNo || index} spacing={1.25} className={classes.mobileItemCard}>
                        <Stack spacing={0.35} className={classes.mobileItemHeader}>
                          <Typography variant="caption" color="text.secondary" fontWeight={700}>
                            รายการที่ {item.lineNo || index + 1}
                          </Typography>
                          {isEditing ? (
                            <TextField
                              className={classes.itemTextField}
                              fullWidth
                              value={item.name || ''}
                              onChange={(event) => updateDraftItem(index, 'name', event.target.value)}
                            />
                          ) : (
                            <Typography variant="body2" fontWeight={700} sx={{ wordBreak: 'break-word' }}>
                              {item.name || '-'}
                            </Typography>
                          )}
                        </Stack>
                        <Stack spacing={1}>
                          <Info label="รายละเอียด" value={isEditing ? undefined : item.spec || '-'} />
                          {isEditing ? (
                            <TextField
                              className={classes.itemTextField}
                              value={item.spec || ''}
                              fullWidth
                              multiline
                              minRows={2}
                              label="รายละเอียด"
                              InputLabelProps={{ shrink: true }}
                              onChange={(event) => updateDraftItem(index, 'spec', event.target.value)}
                            />
                          ) : null}
                          <Grid container spacing={1.25}>
                            <Grid item xs={6}>
                              {isEditing ? (
                                <TextField
                                  type="number"
                                  className={classes.itemTextField}
                                  fullWidth
                                  label="ราคาต่อหน่วย"
                                  InputLabelProps={{ shrink: true }}
                                  value={item.unitPrice ?? 0}
                                  onChange={(event) => updateDraftItem(index, 'unitPrice', Number(event.target.value || 0))}
                                />
                              ) : (
                                <Info label="ราคาต่อหน่วย" value={formatNumber(item.unitPrice || 0)} />
                              )}
                            </Grid>
                            <Grid item xs={6}>
                              {isEditing ? (
                                <TextField
                                  type="number"
                                  className={classes.itemTextField}
                                  fullWidth
                                  label="จำนวน"
                                  InputLabelProps={{ shrink: true }}
                                  value={item.quantity ?? 0}
                                  onChange={(event) => updateDraftItem(index, 'quantity', Number(event.target.value || 0))}
                                />
                              ) : (
                                <Info label="จำนวน" value={formatNumber(item.quantity || 0)} />
                              )}
                            </Grid>
                            <Grid item xs={12}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{ px: 1.25, py: 1, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                  รวม
                                </Typography>
                                <Typography variant="body2" fontWeight={700}>
                                  {formatNumber(item.amount || 0)}
                                </Typography>
                              </Stack>
                            </Grid>
                          </Grid>
                        </Stack>
                      </Stack>
                    ))
                  ) : (
                    <Typography align="center">{t('warning.noResultList')}</Typography>
                  )}
                </Stack>
              ) : (
                <TableContainer>
                  <Table id="sales_order_detail_items___table">
                    <TableHead>
                      <TableRow>
                        <TableCell align="center" className={`${classes.tableHeader} ${classes.fitContentCell}`}>#</TableCell>
                        <TableCell className={`${classes.tableHeader} ${classes.fitContentCell}`}>สินค้า</TableCell>
                        <TableCell className={`${classes.tableHeader} ${classes.specCell}`}>รายละเอียด</TableCell>
                        <TableCell align="right" className={`${classes.tableHeader} ${classes.fitContentCell}`}>ราคาต่อหน่วย</TableCell>
                        <TableCell align="right" className={`${classes.tableHeader} ${classes.fitContentCell}`}>จำนวน</TableCell>
                        <TableCell align="right" className={`${classes.tableHeader} ${classes.fitContentCell}`}>รวม</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayItems.length ? (
                        displayItems.map((item, index) => (
                          <TableRow key={item.id || item.lineNo || index}>
                            <TableCell align="center" className={classes.fitContentCell}>{item.lineNo || index + 1}</TableCell>
                            <TableCell className={classes.fitContentCell}>
                              {isEditing ? (
                                <TextField className={classes.itemTextField} value={item.name || ''} onChange={(event) => updateDraftItem(index, 'name', event.target.value)} />
                              ) : (
                                item.name || '-'
                              )}
                            </TableCell>
                            <TableCell className={classes.specCell}>
                              {isEditing ? (
                                <TextField className={classes.itemTextField} value={item.spec || ''} fullWidth multiline minRows={2} onChange={(event) => updateDraftItem(index, 'spec', event.target.value)} />
                              ) : (
                                item.spec || '-'
                              )}
                            </TableCell>
                            <TableCell align="right" className={classes.fitContentCell}>
                              {isEditing ? (
                                <TextField type="number" className={classes.itemTextField} value={item.unitPrice ?? 0} onChange={(event) => updateDraftItem(index, 'unitPrice', Number(event.target.value || 0))} />
                              ) : (
                                formatNumber(item.unitPrice || 0)
                              )}
                            </TableCell>
                            <TableCell align="right" className={classes.fitContentCell}>
                              {isEditing ? (
                                <TextField type="number" className={classes.itemTextField} value={item.quantity ?? 0} onChange={(event) => updateDraftItem(index, 'quantity', Number(event.target.value || 0))} />
                              ) : (
                                formatNumber(item.quantity || 0)
                              )}
                            </TableCell>
                            <TableCell align="right" className={classes.fitContentCell}>{formatNumber(item.amount || 0)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center">{t('warning.noResultList')}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </GridSearchSection>

            <GridSearchSection container spacing={2} justifyContent="flex-end">
              <Grid item xs={12} md={4}>
                <Stack spacing={1.25} className={classes.section}>
                  <Typography variant="h6">Commission</Typography>
                  <Summary label="ค่าสินค้า" value={salesOrder?.amount} />
                  {isEditing ? (
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={2}>
                      <Typography sx={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>
                        {t('documentManagement.quotation.summarySection.freight')}
                      </Typography>
                      <TextField
                        type="number"
                        value={draft.freight}
                        onChange={(event) =>
                          updateDraftField('freight', Number(event.target.value || 0))
                        }
                        sx={{
                          width: { xs: '100%', sm: 180 },
                          '& .MuiInputBase-input': {
                            textAlign: 'right'
                          }
                        }}
                      />
                    </Stack>
                  ) : (
                    <Summary
                      label={t('documentManagement.quotation.summarySection.freight')}
                      value={summary.freight}
                    />
                  )}
                  {isEditing ? (
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={2}>
                      <Typography sx={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>
                        ค่าคอมมิชชั่น
                      </Typography>
                      <TextField
                        type="number"
                        value={draft.commission}
                        onChange={(event) => {
                          const rawValue = event.target.value;
                          const parsedValue = Math.trunc(Number(rawValue || 0));
                          const safeValue = Number.isNaN(parsedValue)
                            ? 0
                            : Math.min(100, Math.max(0, parsedValue));
                          updateDraftField('commission', safeValue);
                        }}
                        inputProps={{
                          min: 0,
                          max: 100,
                          step: 1
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">%</InputAdornment>
                        }}
                        sx={{
                          width: { xs: '100%', sm: 180 },
                          '& .MuiInputBase-input': {
                            textAlign: 'right'
                          }
                        }}
                      />
                    </Stack>
                  ) : (
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={2}>
                      <Typography sx={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>{"ค่าคอมมิชชั่น"}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {`${salesOrder?.commission || 0} %`}
                      </Typography>
                    </Stack>
                  )}
                  {(isEditing ? draft.coSaleId : salesOrder?.coSaleId) ? (
                    isEditing ? (
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={2}>
                        <Typography sx={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>
                          ค่าคอมเซลล์นอก
                        </Typography>
                        <TextField
                          type="number"
                          value={draft.coSaleCommission}
                          onChange={(event) => {
                            const rawValue = event.target.value;
                            const parsedValue = Math.trunc(Number(rawValue || 0));
                            const safeValue = Number.isNaN(parsedValue) ? 0 : parsedValue;
                            updateDraftField('coSaleCommission', safeValue);
                          }}
                          inputProps={{
                            step: 1
                          }}
                          sx={{
                            width: { xs: '100%', sm: 180 },
                            '& .MuiInputBase-input': {
                              textAlign: 'right'
                            }
                          }}
                        />
                      </Stack>
                    ) : (
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={2}>
                        <Typography sx={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>
                          ค่าคอมเซลล์นอก
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {salesOrder?.coSaleCommission || 0}
                        </Typography>
                      </Stack>
                    )
                  ) : null}
                </Stack>
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack spacing={1.25} className={classes.section}>
                  <Typography variant="h6">สรุปยอด</Typography>
                  <Summary
                    label={t('documentManagement.quotation.summarySection.subtotal')}
                    value={summary.subTotal}
                  />
                  {isEditing ? (
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={2}>
                      <Typography sx={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>
                        {t('documentManagement.quotation.summarySection.discount')}
                      </Typography>
                      <TextField
                        type="number"
                        value={draft.discount}
                        onChange={(event) =>
                          updateDraftField('discount', Number(event.target.value || 0))
                        }
                        sx={{
                          width: { xs: '100%', sm: 180 },
                          '& .MuiInputBase-input': {
                            textAlign: 'right'
                          }
                        }}
                      />
                    </Stack>
                  ) : (
                    <Summary
                      label={t('documentManagement.quotation.summarySection.discount')}
                      value={summary.discount}
                    />
                  )}
                  <Summary
                    label={t('documentManagement.quotation.summarySection.vat')}
                    value={summary.vat}
                  />
                  <Summary
                    label={t('documentManagement.quotation.summarySection.grandTotal')}
                    value={summary.grandTotal}
                    strong
                  />
                </Stack>
              </Grid>
            </GridSearchSection>

            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <Stack spacing={2} className={classes.section}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                    <Typography variant="h6">ไฟล์แนบ</Typography>
                    <Can permission={PERMISSIONS.SALES_ORDER_EDIT}>
                      {canManageSalesOrderAttachments ? (
                        <Button
                          variant="contained"
                          className="btn-baby-blue"
                          component="label"
                          startIcon={<FilePresent />}
                          disabled={isSaving}>
                          อัปโหลดไฟล์
                          <input hidden type="file" multiple onChange={handleUploadAttachments} />
                        </Button>
                      ) : null}
                    </Can>
                  </Stack>
                  {salesOrder?.attachments?.length ? (
                    <Stack spacing={1.25}>
                      {salesOrder.attachments.map((attachment: SalesOrderAttachment) => (
                        <Stack
                          key={attachment.id}
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={1}
                          alignItems={{ xs: 'flex-start', sm: 'center' }}
                          justifyContent="space-between"
                          sx={{
                            px: 1.5,
                            py: 1.25,
                            border: '1px solid #dce4ee',
                            borderRadius: 2,
                            backgroundColor: '#fff'
                          }}>
                          <Stack spacing={0.25}>
                            <Typography sx={{ fontWeight: 600 }}>
                              {attachment.originalFileName || attachment.fileName || `attachment-${attachment.id}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {attachment.contentType || '-'}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={1}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Description />}
                              onClick={() => {
                                if (attachment.fileUrl) {
                                  window.open(attachment.fileUrl, '_blank', 'noopener,noreferrer');
                                }
                              }}>
                              ดูไฟล์
                            </Button>
                            <Can permission={PERMISSIONS.SALES_ORDER_EDIT}>
                              {canManageSalesOrderAttachments ? (
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  startIcon={<DeleteOutline />}
                                  onClick={() => {
                                    void handleDeleteAttachment(attachment.id);
                                  }}
                                  disabled={isSaving}>
                                  ลบ
                                </Button>
                              ) : null}
                            </Can>
                          </Stack>
                        </Stack>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      ยังไม่มีไฟล์แนบ
                    </Typography>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </>
        </TabPanel>

        <TabPanel value="history" currentTab={tab}>
          <ActivityHistoryTimeline records={activityHistory} />
        </TabPanel>

        <TabPanel value="paymentHistory" currentTab={tab}>
          <GridSearchSection container sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <Stack spacing={1.25} className={classes.section}>
                <Typography variant="h6">ประวัติการรับชำระเงิน</Typography>
                {relatedInvoices.some((invoice) => invoice.payments?.length) ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell align="center" className={classes.tableHeader}>
                            เลขที่ใบแจ้งหนี้
                          </TableCell>
                          <TableCell align="center" className={classes.tableHeader}>
                            วิธีชำระเงิน
                          </TableCell>
                          <TableCell align="center" className={classes.tableHeader}>
                            วันเวลาทำรายการ
                          </TableCell>
                          <TableCell align="center" className={classes.tableHeader}>
                            วันที่รับชำระ
                          </TableCell>
                          <TableCell align="left" className={classes.tableHeader}>
                            ข้อมูลเช็ค
                          </TableCell>
                          <TableCell align="right" className={classes.tableHeader}>
                            จำนวนเงิน
                          </TableCell>
                          <TableCell align="center" className={classes.tableHeader}>
                            ดำเนินการ
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {relatedInvoices.flatMap((invoice: InvoiceRecord) =>
                          (invoice.payments || []).map((payment) => (
                            <TableRow key={`${invoice.invoiceNo}-${payment.id}`}>
                              <TableCell align="center">{invoice.invoiceNo}</TableCell>
                              <TableCell align="center">
                                {payment.paymentMethod === 'TRANSFER'
                                  ? 'โอนเงิน'
                                  : payment.paymentMethod === 'CHEQUE'
                                    ? 'เช็ค'
                                    : payment.paymentMethod === 'CASH'
                                      ? 'เงินสด'
                                      : '-'}
                              </TableCell>
                              <TableCell align="center">
                                {payment.createdDate
                                  ? formatDate(payment.createdDate, 'DD/MM/YYYY HH:mm')
                                  : '-'}
                              </TableCell>
                              <TableCell align="center">
                                {payment.paymentDate
                                  ? formatDate(payment.paymentDate, 'DD/MM/YYYY')
                                  : '-'}
                              </TableCell>
                              <TableCell align="left">
                                {payment.paymentMethod === 'CHEQUE'
                                  ? [
                                    payment.chequeBank ? `ธนาคาร ${payment.chequeBank}` : null,
                                    payment.chequeNo ? `เลขที่ ${payment.chequeNo}` : null,
                                    payment.chequeDate
                                      ? `วันที่ ${formatDate(payment.chequeDate, 'DD/MM/YYYY')}`
                                      : null,
                                    payment.chequeBranch ? `สาขา ${payment.chequeBranch}` : null
                                  ]
                                    .filter(Boolean)
                                    .join(' | ') || '-'
                                  : '-'}
                              </TableCell>
                              <TableCell align="right">
                                {formatNumber(payment.amount || 0)}
                              </TableCell>
                              <TableCell align="center">
                                {payment.slipFileUrl ? (
                                  <Tooltip title="ดูสลิป">
                                    <Button
                                      size="small"
                                      variant="text"
                                      component="a"
                                      href={payment.slipFileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer">
                                      <FilePresent />
                                    </Button>
                                  </Tooltip>
                                ) : (
                                  '-'
                                )}
                                {payment.receiptNo ? (
                                  <Tooltip title="ดาวน์โหลดใบเสร็จรับเงิน">
                                    <Button
                                      size="small"
                                      variant="text"
                                      onClick={() => handleViewReceipt(payment.receiptNo as string)}>
                                      <Description />
                                    </Button>
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="สร้างใบเสร็จรับเงิน">
                                    <Button
                                      size="small"
                                      variant="text"
                                      onClick={() =>
                                        history.push(
                                          ROUTE_PATHS.RECEIPT_CREATE_FROM_INVOICE_PAYMENT.replace(
                                            ':invoiceId',
                                            invoice.invoiceNo
                                          ).replace(':paymentId', String(payment.id))
                                        )
                                      }>
                                      <NoteAdd />
                                    </Button>
                                  </Tooltip>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    ยังไม่มีประวัติการรับชำระเงิน
                  </Typography>
                )}
              </Stack>
            </Grid>
          </GridSearchSection>
        </TabPanel>
      </Wrapper>
    </Page>
  );
}

function Info({ label, value }: { label: string; value?: string | number | null }): ReactElement {
  return (
    <Stack spacing={0.25}>
      <Typography sx={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value || '-'}
      </Typography>
    </Stack>
  );
}

function Summary({
  label,
  value,
  strong = false
}: {
  label: string;
  value: number;
  strong?: boolean;
}): ReactElement {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
      <Typography sx={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: strong ? 700 : 500 }}>
        {formatNumber(value || 0)}
      </Typography>
    </Stack>
  );
}
