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
  Save,
  Search
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  LinearProgress,
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
import { useAuth } from 'auth/AuthContext';
import Can from 'auth/Can';
import { PERMISSIONS } from 'auth/permissions';
import { ROLES } from 'auth/roles';
import ActivityHistoryTimeline from 'components/ActivityHistoryTimeline';
import ConfirmDialog from 'components/ConfirmDialog';
import DocumentLanguageDialog from 'components/DocumentLanguageDialog';
import DocumentFlow from 'components/DocumentFlow';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import CreateFreelanceSaleDialog from 'dialogs/QuotationManagement/New/CreateFreelanceSaleDialog';
import SearchFreelanceSalesDialog from 'dialogs/QuotationManagement/New/SearchFreelanceSalesDialog';
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
import { getFreelanceSales } from 'services/FreelanceSale/freelance-sale-api';
import { FreelanceSaleRecord } from 'services/FreelanceSale/freelance-sale-type';
import { searchReceipts, viewReceipt } from 'services/Receipt/receipt-api';
import { ReceiptRecord } from 'services/Receipt/receipt-type';
import { getRFQ, getRFQQuotationNos } from 'services/RFQ/rfq-api';
import { RFQRecord } from 'services/RFQ/rfq-type';
import {
  getSalesOrderV1,
  deleteSalesOrderAttachment,
  updateSalesOrderV1,
  downloadSaleOrder,
  uploadSalesOrderAttachments,
  requestUrgentApproval,
  approveUrgentSalesOrder,
  rejectUrgentSalesOrder
} from 'services/SaleOrder/sale-order-api';
import {
  SalesOrderAttachment,
  CustomerSnapshot,
  SalesOrderDetailV1,
  SalesOrderV1,
  UpdateSalesOrderRequestV1
} from 'services/SaleOrder/sale-order-type';
import { DownloadDocumentResponse } from 'services/general-type';
import { base64ToBlob } from 'utils';
import { formatDate } from 'utils';
import { getDocumentStatusChipSx, getDocumentStatusLabel } from 'utils/documentStatus';
import { formatNumber, formatNumberWithDigit } from 'utils/utils';
import { buildSalesOrderDocumentFlowItems } from 'utils/documentFlow';
import { TemplateLanguage } from 'services/Document/document-type';

interface SalesOrderDetailParams {
  id: string;
}

interface SalesOrderDraft {
  docDate: string;
  expireDate: string;
  coSaleId: string;
  quotationNo: string;
  shippingType: string;
  shipping: string;
  subTotal: number;
  discount: number;
  freight: number;
  amount: number;
  commission: number;
  // Keep this as text while editing so an in-progress decimal value (e.g. "12.")
  // is not converted back to an integer before the user finishes typing.
  coSaleCommission: string;
  isVat: boolean;
  requestCoa: boolean;
  requestPo: boolean;
  remark: string;
  customerSnapshot: CustomerSnapshot;
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
  const snapshot = salesOrder?.customerSnapshot;
  return (
    [customer?.id ? `(${customer.id})` : '', snapshot?.customerName || customer?.customerName || customer?.companyName || '']
      .filter(Boolean)
      .join(' ') || '-'
  );
}

function getCustomerAddress(salesOrder?: SalesOrderV1): string {
  if (salesOrder?.customerSnapshot?.address) {
    return salesOrder.customerSnapshot.address;
  }
  const customer = salesOrder?.customer as any;
  const address =
    customer?.addresses?.find((item: any) => item.isDefault) || customer?.addresses?.[0];

  if (!address) {
    return '-';
  }

  return (
    address.fullAddress ||
    [
      address.addressLine1,
      address.addressLine2,
      [address.subdistrict, address.district, address.province].filter(Boolean).join(' '),
      address.postcode,
      address.country
    ]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    '-'
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

    if (shippingType === 'ALL') {
      return 'ทางรถ / ทางเรือ';
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
    case 'READY_FOR_PO_OVERRIDE':
      return 'พร้อมสร้าง PO (Override)';
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
  const customer = salesOrder?.customer as any;
  const fallbackAddress = getCustomerAddress(salesOrder);
  const fallbackContact = salesOrder?.customerContact || customer?.contacts?.[0];
  return {
    docDate: toDateInput(salesOrder?.docDate),
    expireDate: toDateInput(salesOrder?.expireDate),
    coSaleId: salesOrder?.coSaleId || '',
    quotationNo: salesOrder?.quotationNo || '',
    shippingType: salesOrder?.shippingType || '',
    shipping: salesOrder?.shipping || '',
    subTotal: Number(salesOrder?.subTotal || 0),
    discount: Number(salesOrder?.discount || 0),
    freight: Number(salesOrder?.freight || 0),
    amount: Number(salesOrder?.amount || 0),
    commission: Number(salesOrder?.commission || 0),
    coSaleCommission: String(salesOrder?.coSaleCommission ?? 0),
    isVat: Number(salesOrder?.vatRate || 0) > 0,
    requestCoa: Boolean(salesOrder?.requestCoa),
    requestPo: Boolean(salesOrder?.requestPo),
    remark: salesOrder?.remark || '',
    customerSnapshot: {
      customerName: salesOrder?.customerSnapshot?.customerName || customer?.customerName || customer?.companyName || '',
      taxId: salesOrder?.customerSnapshot?.taxId || customer?.taxId || '',
      branchCode: salesOrder?.customerSnapshot?.branchCode || customer?.branchNumber || '',
      branchName: salesOrder?.customerSnapshot?.branchName || customer?.branchName || '',
      address: fallbackAddress === '-' ? '' : fallbackAddress,
      contactName: salesOrder?.customerSnapshot?.contactName || fallbackContact?.contactName || '',
      contactNumber: salesOrder?.customerSnapshot?.contactNumber || fallbackContact?.contactNumber || ''
    },
    items: (salesOrder?.items || []).map((item) => ({ ...item }))
  };
}

function recalculateSalesOrderItem(item: SalesOrderDetailV1): SalesOrderDetailV1 {
  const quantity = Number(item.quantity || 0);
  const unitPrice = Number(item.unitPrice || 0);

  return {
    ...item,
    quantity,
    unitPrice,
    amount: quantity * unitPrice
  };
}

function calculateSalesOrderFreight(items: SalesOrderDetailV1[]): number {
  return items.reduce((sum, item) => {
    const quantity = Number(item.quantity || 0);
    const shippingCost = Number(item.supplierShippingCost || 0);

    return sum + quantity * shippingCost;
  }, 0);
}

export default function SalesOrderDetail(): ReactElement {
  const { id } = useParams<SalesOrderDetailParams>();
  const history = useHistory();
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const theme = useTheme();
  const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
  const [tab, setTab] = useState<'detail' | 'history' | 'paymentHistory'>('detail');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [quotationNoError, setQuotationNoError] = useState(false);
  const [draft, setDraft] = useState<SalesOrderDraft>(createDraft());
  const [openSearchFreelanceSalesDialog, setOpenSearchFreelanceSalesDialog] = useState(false);
  const [openCreateFreelanceSaleDialog, setOpenCreateFreelanceSaleDialog] = useState(false);
  const [selectedFreelanceSaleItem, setSelectedFreelanceSaleItem] = useState<FreelanceSaleRecord | null>(null);
  const [selectedFreelanceSaleLabel, setSelectedFreelanceSaleLabel] = useState('');
  const [requestPoConfirmOpen, setRequestPoConfirmOpen] = useState(false);
  const [requestPoReason, setRequestPoReason] = useState('');
  const [requestPoPaymentScheduleDate, setRequestPoPaymentScheduleDate] = useState('');
  const [visibleUrgentDetailDialog, setVisibleUrgentDetailDialog] = useState(false);
  const [visibleSalesOrderLanguageDialog, setVisibleSalesOrderLanguageDialog] = useState(false);
  const [isSalesOrderDocumentLoading, setIsSalesOrderDocumentLoading] = useState(false);
  const [urgentRejectReason, setUrgentRejectReason] = useState('');
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
    productImage: {
      width: 64,
      height: 64,
      objectFit: 'cover',
      borderRadius: 8,
      border: '1px solid #e6ebf1',
      backgroundColor: '#f8fafc'
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

  const { data: relatedReceiptsResponse, isFetching: isReceiptFlowFetching } = useQuery(
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

  const { data: rfqResponse, isFetching: isRfqFlowFetching } = useQuery(
    ['sales-order-document-flow-rfq', salesOrder?.rfqId],
    () => getRFQ(salesOrder?.rfqId || ''),
    {
      enabled: Boolean(salesOrder?.rfqId),
      refetchOnWindowFocus: false
    }
  );

  const { data: rfqQuotationNos = [], isFetching: isRfqQuotationNosFetching } = useQuery(
    ['sales-order-rfq-quotation-nos', salesOrder?.rfqId],
    () => getRFQQuotationNos(salesOrder?.rfqId || ''),
    {
      enabled: Boolean(isEditing && salesOrder?.rfqId),
      refetchOnWindowFocus: false
    }
  );

  const { data: freelanceSales = [] } = useQuery(
    'sales-order-detail-freelance-sales',
    () => getFreelanceSales(),
    { enabled: isEditing, refetchOnWindowFocus: false }
  );

  useEffect(() => {
    setDraft(createDraft(salesOrder));
    setSelectedFreelanceSaleItem(null);
    setSelectedFreelanceSaleLabel('');
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
  const rfq = rfqResponse as RFQRecord | undefined;
  const selectedFreelanceSale =
    selectedFreelanceSaleItem || freelanceSales.find((item) => item.id === draft.coSaleId) || null;
  const selectedFreelanceSaleDisplay =
    selectedFreelanceSaleLabel ||
    (selectedFreelanceSale ? `${selectedFreelanceSale.id} - ${selectedFreelanceSale.name}` : '') ||
    draft.coSaleId;
  const salesId = salesOrder?.saleAccount?.employeeId || '';
  const quotationNo =
    salesOrder?.quotationNo ||
    latestInvoice?.quotationNo ||
    latestReceipt?.quotationNo ||
    rfq?.quotations?.find((quotation) => quotation.isLatest)?.quotationNo ||
    rfq?.quotations?.[0]?.quotationNo ||
    null;

  const documentFlowItems = buildSalesOrderDocumentFlowItems({
    rfqId: salesOrder?.rfqId || null,
    quotationNo,
    salesOrder,
    latestInvoice,
    latestReceipt,
    isRfqLoading: isRfqFlowFetching,
    isInvoiceLoading: isInvoicePaymentsFetching,
    isReceiptLoading: isReceiptFlowFetching,
    invoiceCount: relatedInvoices.length,
    receiptCount: relatedReceipts.length
  });

  const summary = useMemo(() => {
    const subTotal = displayItems.reduce((sum, item) => {
      return sum + Number(item.unitPrice || 0) * Number(item.quantity || 0);
    }, 0);

    return { subTotal };
  }, [displayItems]);
  const editableSubTotal = Number(isEditing ? draft.subTotal : summary.subTotal || 0);
  const editableDiscount = Number(isEditing ? draft.discount : salesOrder?.discount || 0);
  const editableFreight = Number(isEditing ? draft.freight : salesOrder?.freight || 0);
  const editableVat = (isEditing ? draft.isVat : Number(salesOrder?.vatRate || 0) > 0)
    ? Math.max(editableSubTotal - editableDiscount, 0) * 0.07
    : 0;
  const editableGrandTotal = Math.max(editableSubTotal - editableDiscount, 0) + editableVat;
  const calculatedSalesOrderAmount = useMemo(() => {
    return Math.max(editableSubTotal - editableFreight, 0);
  }, [editableFreight, editableSubTotal]);

  const paymentProgress = useMemo(() => {
    const grandTotal = Number(salesOrder?.grandTotal || 0);
    const paidTotal = Number(salesOrder?.paidTotal || 0);

    if (grandTotal <= 0) {
      return 0;
    }

    return Math.min(100, Math.max(0, (paidTotal / grandTotal) * 100));
  }, [salesOrder?.grandTotal, salesOrder?.paidTotal]);

  const handleChangeTab = (
    _event: SyntheticEvent,
    value: 'detail' | 'history' | 'paymentHistory'
  ) => {
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

  const updateCustomerSnapshotField = <K extends keyof CustomerSnapshot>(
    field: K,
    value: CustomerSnapshot[K]
  ) => {
    setDraft((previous) => ({
      ...previous,
      customerSnapshot: {
        ...previous.customerSnapshot,
        [field]: value
      }
    }));
  };

  const updateDraftItem = (
    index: number,
    field: keyof SalesOrderDetailV1,
    value: string | number
  ) => {
    setDraft((previous) => {
      const updatedItems = previous.items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return recalculateSalesOrderItem(item);
        }

        const nextItem = {
          ...item,
          [field]: value
        };

        return recalculateSalesOrderItem(nextItem);
      });
      const updatedSubTotal = updatedItems.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );
      const updatedFreight = calculateSalesOrderFreight(updatedItems);

      return {
        ...previous,
        items: updatedItems,
        subTotal: updatedSubTotal,
        freight: updatedFreight,
        amount: Math.max(updatedSubTotal - updatedFreight, 0)
      };
    });
  };

  const handleEdit = () => {
    setDraft(createDraft(salesOrder));
    setSelectedFreelanceSaleItem(null);
    setSelectedFreelanceSaleLabel('');
    setQuotationNoError(false);
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

  const handleOpenRequestPoConfirm = () => {
    if (!salesOrder?.salesOrderNo) {
      return;
    }

    setRequestPoReason('');
    setRequestPoPaymentScheduleDate('');
    setRequestPoConfirmOpen(true);
  };

  const handleCloseRequestPoConfirm = () => {
    setRequestPoConfirmOpen(false);
    setRequestPoReason('');
    setRequestPoPaymentScheduleDate('');
  };

  const handleConfirmRequestPo = async () => {
    if (!salesOrder?.salesOrderNo || !requestPoReason.trim() || !requestPoPaymentScheduleDate) {
      return;
    }

    setIsSaving(true);
    try {
      await toast.promise(
        requestUrgentApproval(salesOrder.salesOrderNo, {
          reason: requestPoReason.trim(),
          paymentScheduleDate: requestPoPaymentScheduleDate
        }),
        {
          loading: 'กำลังส่งคำขออนุมัติสร้างใบสั่งซื้อ',
          success: 'ส่งคำขออนุมัติสร้างใบสั่งซื้อสำเร็จ',
          error: 'ส่งคำขออนุมัติสร้างใบสั่งซื้อไม่สำเร็จ'
        }
      );

      setRequestPoConfirmOpen(false);
      setRequestPoReason('');
      await refetch();
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenUrgentDetailDialog = () => {
    setUrgentRejectReason(salesOrder?.urgentRejectReason || '');
    setVisibleUrgentDetailDialog(true);
  };

  const handleCloseUrgentDetailDialog = () => {
    setVisibleUrgentDetailDialog(false);
    setUrgentRejectReason('');
  };

  const handleApproveUrgent = async () => {
    if (!salesOrder?.salesOrderNo) {
      return;
    }

    setIsSaving(true);
    try {
      await toast.promise(approveUrgentSalesOrder(salesOrder.salesOrderNo), {
        loading: 'กำลังอนุมัติคำขอเร่งด่วน',
        success: 'อนุมัติคำขอเร่งด่วนแล้ว',
        error: 'ไม่สามารถอนุมัติคำขอเร่งด่วนได้'
      });

      handleCloseUrgentDetailDialog();
      await refetch();
    } finally {
      setIsSaving(false);
    }
  };

  const handleRejectUrgent = async () => {
    if (!salesOrder?.salesOrderNo || !urgentRejectReason.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await toast.promise(
        rejectUrgentSalesOrder(salesOrder.salesOrderNo, {
          reason: urgentRejectReason.trim()
        }),
        {
          loading: 'กำลังไม่อนุมัติคำขอเร่งด่วน',
          success: 'ไม่อนุมัติคำขอเร่งด่วนแล้ว',
          error: 'ไม่สามารถไม่อนุมัติคำขอเร่งด่วนได้'
        }
      );

      handleCloseUrgentDetailDialog();
      await refetch();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    handleCloseActionMenu();
    setDraft(createDraft(salesOrder));
    setSelectedFreelanceSaleItem(null);
    setSelectedFreelanceSaleLabel('');
    setQuotationNoError(false);
    setIsEditing(false);
  };

  const handleOpenSalesOrderLanguageDialog = () => {
    handleCloseActionMenu();
    setVisibleSalesOrderLanguageDialog(true);
  };

  const handleCloseSalesOrderLanguageDialog = () => {
    setVisibleSalesOrderLanguageDialog(false);
  };

  const handleSelectSalesOrderLanguage = async (language: TemplateLanguage) => {
    if (!salesOrder?.salesOrderNo) {
      return;
    }

    setVisibleSalesOrderLanguageDialog(false);
    setIsSalesOrderDocumentLoading(true);
    const shouldDownloadFile = isDownSm;

    try {
      await toast.promise(downloadSaleOrder(salesOrder.salesOrderNo, 'PDF', true, false, language), {
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

            if (shouldDownloadFile) {
              const anchor = document.createElement('a');
              anchor.href = url;
              anchor.download = file.fileName || `${salesOrder.salesOrderNo}.pdf`;
              anchor.rel = 'noopener';
              document.body.appendChild(anchor);
              anchor.click();
              anchor.remove();
            } else {
              window.open(url, '_blank', 'noopener,noreferrer');
            }

            setTimeout(() => URL.revokeObjectURL(url), 60_000);
          });

          return t('toast.success');
        },
        error: t('toast.failed')
      });
    } finally {
      setIsSalesOrderDocumentLoading(false);
    }
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

    if (!draft.quotationNo.trim()) {
      setQuotationNoError(true);
      return;
    }

    const payload: UpdateSalesOrderRequestV1 = {
      docDate: draft.docDate || null,
      expireDate: draft.expireDate || null,
      coSaleId: draft.coSaleId || null,
      quotationNo: draft.quotationNo,
      subTotal: editableSubTotal,
      discount: Number(draft.discount || 0),
      freight: Number(draft.freight || 0),
      amount: calculatedSalesOrderAmount,
      commission: Number(draft.commission || 0),
      coSaleCommission: draft.coSaleId ? Number(draft.coSaleCommission || 0) : null,
      isVat: draft.isVat,
      shippingType: draft.shippingType || null,
      shipping: draft.shipping || null,
      customerSnapshot: draft.customerSnapshot,
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
      setQuotationNoError(false);
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
      <LoadingDialog
        open={isFetching || isActivityHistoryFetching || isInvoicePaymentsFetching || isSaving}
      />
      <PageTitle
        title={
          salesOrder?.salesOrderNo
            ? `ใบยืนยันสั่งซื้อเลขที่ ${salesOrder.salesOrderNo}`
            : 'ใบยืนยันสั่งซื้อ'
        }>
        <Stack direction="row" spacing={1} useFlexGap alignItems="center">
          {salesOrder?.status ? (
            <Chip
              label={getDocumentStatusLabel(salesOrder.status, salesOrder.statusProfile)}
              size="small"
              sx={getDocumentStatusChipSx(salesOrder.status, salesOrder.statusProfile)}
            />
          ) : null}
          {salesOrder?.urgentRequest ? (
            <Chip
              clickable
              onClick={handleOpenUrgentDetailDialog}
              label={
                salesOrder.urgentRequestStatus === 'APPROVED'
                  ? 'เร่งด่วนอนุมัติแล้ว'
                  : salesOrder.urgentRequestStatus === 'REJECTED'
                    ? 'คำขอเร่งด่วนไม่อนุมัติ'
                    : 'เร่งด่วนรออนุมัติ 🔥🔥🔥'
              }
              size="small"
              sx={{
                height: 28,
                backgroundColor:
                  salesOrder.urgentRequestStatus === 'APPROVED'
                    ? '#fee2e2'
                    : salesOrder.urgentRequestStatus === 'REJECTED'
                      ? '#e2e8f0'
                      : '#fff7ed',
                color:
                  salesOrder.urgentRequestStatus === 'APPROVED'
                    ? '#b91c1c'
                    : salesOrder.urgentRequestStatus === 'REJECTED'
                      ? '#475569'
                      : '#b45309',
                cursor: 'pointer'
              }}
            />
          ) : null}
        </Stack>
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
            className="btn-emerald-green"
            onClick={handleOpenRequestPoConfirm}
            disabled={
              !salesOrder ||
              salesOrder?.urgentRequest ||
              ['READY_FOR_PO', 'READY_FOR_PO_OVERRIDE', 'PO_CREATED'].includes(
                salesOrder?.procurementStatus
              )}>
            ขออนุมัติสร้างใบสั่งซื้อ
          </Button>
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
                    <ListItemText primary="แก้ไขใบยืนยันสั่งซื้อ" />
                  </MenuItem>
                </Can>
                <MenuItem
                  onClick={handleOpenSalesOrderLanguageDialog}
                  disabled={!salesOrder || isSalesOrderDocumentLoading}
                  sx={{ width: '100%' }}>
                  <ListItemIcon>
                    <Description fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={isDownSm ? 'ดาวน์โหลดไฟล์ใบยืนยันสั่งซื้อ' : 'ดูใบยืนยันสั่งซื้อ'}
                  />
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
                    disabled={
                      !salesOrder ||
                      !['READY_FOR_PO', 'READY_FOR_PO_OVERRIDE', 'PO_CREATED'].includes(
                        salesOrder.procurementStatus
                      )
                    }
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
                      select
                      label="อ้างอิงใบเสนอราคา"
                      value={draft.quotationNo}
                      onChange={(event) => {
                        updateDraftField('quotationNo', event.target.value);
                        if (quotationNoError && event.target.value) {
                          setQuotationNoError(false);
                        }
                      }}
                      disabled={!salesOrder?.rfqId || isRfqQuotationNosFetching}
                      error={quotationNoError}
                      helperText={quotationNoError ? 'กรุณาเลือกอ้างอิงใบเสนอราคา' : ' '}
                      InputLabelProps={{ shrink: true }}>
                      <MenuItem value="">-</MenuItem>
                      {rfqQuotationNos.map((quotation) => (
                        <MenuItem key={quotation.quotationNo} value={quotation.quotationNo}>
                          {quotation.quotationNo}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    <Info label="อ้างอิงใบเสนอราคา" value={salesOrder?.quotationNo} />
                  )}
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
                      <MenuItem value="ALL">ทางรถ / ทางเรือ</MenuItem>
                      <MenuItem value="LAND">ทางรถ</MenuItem>
                      <MenuItem value="SEA">ทางเรือ</MenuItem>
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
                  {isEditing ? (
                    <>
                      <TextField label="ชื่อลูกค้า" value={draft.customerSnapshot.customerName}
                        onChange={(event) => updateCustomerSnapshotField('customerName', event.target.value)} />
                      <TextField label="เลขประจำตัวผู้เสียภาษี" value={draft.customerSnapshot.taxId}
                        onChange={(event) => updateCustomerSnapshotField('taxId', event.target.value)} />
                      <TextField label="รหัสสาขา" value={draft.customerSnapshot.branchCode}
                        onChange={(event) => updateCustomerSnapshotField('branchCode', event.target.value)} />
                      <TextField label="ชื่อสาขา" value={draft.customerSnapshot.branchName}
                        onChange={(event) => updateCustomerSnapshotField('branchName', event.target.value)} />
                      <TextField label="ชื่อผู้ติดต่อ" value={draft.customerSnapshot.contactName}
                        onChange={(event) => updateCustomerSnapshotField('contactName', event.target.value)} />
                      <TextField label="เบอร์โทรผู้ติดต่อ" value={draft.customerSnapshot.contactNumber}
                        onChange={(event) => updateCustomerSnapshotField('contactNumber', event.target.value)} />
                      <TextField label="ที่อยู่" multiline minRows={2} value={draft.customerSnapshot.address}
                        onChange={(event) => updateCustomerSnapshotField('address', event.target.value)} />
                    </>
                  ) : (
                    <>
                      <Info label="เลขประจำตัวผู้เสียภาษี" value={salesOrder?.customerSnapshot?.taxId || salesOrder?.customer?.taxId} />
                      <Info label="สาขา" value={[salesOrder?.customerSnapshot?.branchCode, salesOrder?.customerSnapshot?.branchName].filter(Boolean).join(' ') || '-'} />
                      <Info label={t('documentManagement.quotation.customerSection.contactName')} value={salesOrder?.customerSnapshot?.contactName || salesOrder?.customerContact?.contactName || salesOrder?.customer?.contacts?.[0]?.contactName} />
                      <Info label={t('documentManagement.quotation.customerSection.contactNumber')} value={salesOrder?.customerSnapshot?.contactNumber || salesOrder?.customerContact?.contactNumber || salesOrder?.customer?.contacts?.[0]?.contactNumber} />
                      <Info label="ที่อยู่" value={getCustomerAddress(salesOrder)} />
                    </>
                  )}
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
                      value={selectedFreelanceSaleDisplay}
                      variant="outlined"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <IconButton
                            edge="end"
                            onClick={() => setOpenSearchFreelanceSalesDialog(true)}>
                            <Search />
                          </IconButton>
                        )
                      }}
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
                    <Info label="Request COA" value={salesOrder?.requestCoa ? 'ใช่' : 'ไม่ใช่'} />
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
                    <Info label="Request PO" value={salesOrder?.requestPo ? 'ใช่' : 'ไม่ใช่'} />
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
              <Grid item xs={12}>
                <Stack spacing={1.25} className={classes.section}>
                  <Typography variant="h6">การขนส่ง</Typography>
                  {isEditing ? (
                    <TextField
                      multiline
                      minRows={2}
                      fullWidth
                      value={draft.shipping}
                      onChange={(event) => updateDraftField('shipping', event.target.value)}
                    />
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {salesOrder?.shipping || '-'}
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
                      <Stack
                        key={item.id || item.lineNo || index}
                        spacing={1.25}
                        className={classes.mobileItemCard}>
                        <Stack
                          direction="row"
                          spacing={1.25}
                          alignItems="flex-start"
                          className={classes.mobileItemHeader}>
                          {item.imageUrl ? (
                            <Box
                              component="img"
                              src={item.imageUrl}
                              alt={item.name || 'รูปภาพสินค้า'}
                              className={classes.productImage}
                            />
                          ) : (
                            <Stack
                              justifyContent="center"
                              alignItems="center"
                              className={classes.productImage}
                              sx={{ color: '#94a3b8', fontSize: 11, textAlign: 'center', px: 1 }}>
                              ไม่มีรูป
                            </Stack>
                          )}
                          <Stack spacing={0.35} sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>
                              รายการที่ {item.lineNo || index + 1}
                            </Typography>
                            {isEditing ? (
                              <TextField
                                className={classes.itemTextField}
                                fullWidth
                                value={item.name || ''}
                                onChange={(event) =>
                                  updateDraftItem(index, 'name', event.target.value)
                                }
                              />
                            ) : (
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                sx={{ wordBreak: 'break-word' }}>
                                {item.name || '-'}
                              </Typography>
                            )}
                          </Stack>
                        </Stack>
                        <Stack spacing={1}>
                          <Info
                            label="รายละเอียด"
                            value={isEditing ? undefined : item.spec || '-'}
                          />
                          {isEditing ? (
                            <TextField
                              className={classes.itemTextField}
                              value={item.spec || ''}
                              fullWidth
                              multiline
                              minRows={2}
                              label="รายละเอียด"
                              InputLabelProps={{ shrink: true }}
                              onChange={(event) =>
                                updateDraftItem(index, 'spec', event.target.value)
                              }
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
                                  onChange={(event) =>
                                    updateDraftItem(
                                      index,
                                      'unitPrice',
                                      Number(event.target.value || 0)
                                    )
                                  }
                                />
                              ) : (
                                <Info
                                  label="ราคาต่อหน่วย"
                                  value={formatNumberWithDigit(item.unitPrice || 0, 4)}
                                />
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
                                  onChange={(event) =>
                                    updateDraftItem(
                                      index,
                                      'quantity',
                                      Number(event.target.value || 0)
                                    )
                                  }
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
                                sx={{
                                  px: 1.25,
                                  py: 1,
                                  borderRadius: 2,
                                  backgroundColor: '#f8fafc',
                                  border: '1px solid #e2e8f0'
                                }}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  fontWeight={700}>
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
                        <TableCell
                          align="center"
                          className={`${classes.tableHeader} ${classes.fitContentCell}`}>
                          #
                        </TableCell>
                        <TableCell
                          align="center"
                          className={`${classes.tableHeader} ${classes.fitContentCell}`}>
                          รูปภาพสินค้า
                        </TableCell>
                        <TableCell className={`${classes.tableHeader} ${classes.fitContentCell}`}>
                          สินค้า
                        </TableCell>
                        <TableCell className={`${classes.tableHeader} ${classes.specCell}`}>
                          รายละเอียด
                        </TableCell>
                        <TableCell
                          align="right"
                          className={`${classes.tableHeader} ${classes.fitContentCell}`}>
                          ราคาต่อหน่วย
                        </TableCell>
                        <TableCell
                          align="right"
                          className={`${classes.tableHeader} ${classes.fitContentCell}`}>
                          จำนวน
                        </TableCell>
                        <TableCell
                          align="right"
                          className={`${classes.tableHeader} ${classes.fitContentCell}`}>
                          รวม
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayItems.length ? (
                        displayItems.map((item, index) => (
                          <TableRow key={item.id || item.lineNo || index}>
                            <TableCell align="center" className={classes.fitContentCell}>
                              {item.lineNo || index + 1}
                            </TableCell>
                            <TableCell align="center" className={classes.fitContentCell}>
                              {item.imageUrl ? (
                                <Box
                                  component="img"
                                  src={item.imageUrl}
                                  alt={item.name || 'รูปภาพสินค้า'}
                                  className={classes.productImage}
                                />
                              ) : (
                                <Typography variant="caption" color="text.secondary">
                                  ไม่มีรูป
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell className={classes.fitContentCell}>
                              {isEditing ? (
                                <TextField
                                  className={classes.itemTextField}
                                  value={item.name || ''}
                                  onChange={(event) =>
                                    updateDraftItem(index, 'name', event.target.value)
                                  }
                                />
                              ) : (
                                item.name || '-'
                              )}
                            </TableCell>
                            <TableCell className={classes.specCell}>
                              {isEditing ? (
                                <TextField
                                  className={classes.itemTextField}
                                  value={item.spec || ''}
                                  fullWidth
                                  multiline
                                  minRows={2}
                                  onChange={(event) =>
                                    updateDraftItem(index, 'spec', event.target.value)
                                  }
                                />
                              ) : (
                                item.spec || '-'
                              )}
                            </TableCell>
                            <TableCell align="right" className={classes.fitContentCell}>
                              {isEditing ? (
                                <TextField
                                  type="number"
                                  className={classes.itemTextField}
                                  value={item.unitPrice ?? 0}
                                  onChange={(event) =>
                                    updateDraftItem(
                                      index,
                                      'unitPrice',
                                      Number(event.target.value || 0)
                                    )
                                  }
                                />
                              ) : (
                                formatNumberWithDigit(item.unitPrice || 0, 4)
                              )}
                            </TableCell>
                            <TableCell align="right" className={classes.fitContentCell}>
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
                            <TableCell align="right" className={classes.fitContentCell}>
                              {formatNumber(item.amount || 0)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            {t('warning.noResultList')}
                          </TableCell>
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
                  {isEditing ? (
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={2}>
                      <Typography sx={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>
                        ค่าสินค้า
                      </Typography>
                      <TextField
                        type="number"
                        value={draft.amount}
                        onChange={(event) =>
                          updateDraftField('amount', Number(event.target.value || 0))
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
                    <Summary label="ค่าสินค้า" value={salesOrder?.amount} />
                  )}
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
                      value={editableFreight}
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
                      <Typography sx={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>
                        {'ค่าคอมมิชชั่น'}
                      </Typography>
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
                          onChange={(event) =>
                            updateDraftField('coSaleCommission', event.target.value)
                          }
                          inputProps={{
                            step: 'any'
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
                    value={editableSubTotal}
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
                      value={editableDiscount}
                    />
                  )}
                  <Summary
                    label={t('documentManagement.quotation.summarySection.vat')}
                    value={editableVat}
                  />
                  <Summary
                    label={t('documentManagement.quotation.summarySection.grandTotal')}
                    value={editableGrandTotal}
                    strong
                  />
                </Stack>
              </Grid>
            </GridSearchSection>

            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <Stack spacing={2} className={classes.section}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={2}>
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
                              {attachment.originalFileName ||
                                attachment.fileName ||
                                `attachment-${attachment.id}`}
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
                <Stack spacing={1}>
                  <Stack
                    direction={isDownSm ? 'column' : 'row'}
                    spacing={1}
                    justifyContent="space-between"
                    alignItems={isDownSm ? 'flex-start' : 'center'}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ยอดชำระแล้ว
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatNumber(Number(salesOrder?.paidTotal || 0))} /{' '}
                      {formatNumber(
                        Number(
                          isEditing
                            ? editableGrandTotal
                            : salesOrder?.grandTotal || editableGrandTotal
                        )
                      )}
                    </Typography>
                  </Stack>
                  <Box>
                    <LinearProgress
                      variant="determinate"
                      value={paymentProgress}
                      sx={{
                        height: 10,
                        borderRadius: 999,
                        backgroundColor: '#e2e8f0',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 999,
                          background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)'
                        }
                      }}
                    />
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      sx={{ mt: 0.75 }}
                      spacing={1}>
                      <Typography variant="caption" color="text.secondary">
                        {paymentProgress.toFixed(0)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        คงเหลือ {formatNumber(Number(salesOrder?.outstandingTotal || 0))}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
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
                                      onClick={() =>
                                        handleViewReceipt(payment.receiptNo as string)
                                      }>
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

      <DocumentLanguageDialog
        open={visibleSalesOrderLanguageDialog}
        title={isDownSm ? 'ดาวน์โหลดไฟล์ใบยืนยันสั่งซื้อ' : 'ดูใบยืนยันสั่งซื้อ'}
        onClose={handleCloseSalesOrderLanguageDialog}
        onSelect={handleSelectSalesOrderLanguage}
      />
      <SearchFreelanceSalesDialog
        open={openSearchFreelanceSalesDialog}
        onClose={() => setOpenSearchFreelanceSalesDialog(false)}
        onAddNew={() => {
          setOpenSearchFreelanceSalesDialog(false);
          setOpenCreateFreelanceSaleDialog(true);
        }}
        salesId={salesId}
        initialFreelanceSale={selectedFreelanceSale}
        onSelect={({ freelanceSale }) => {
          updateDraftField('coSaleId', freelanceSale.id || '');
          setSelectedFreelanceSaleItem(freelanceSale);
          setSelectedFreelanceSaleLabel(`${freelanceSale.id} - ${freelanceSale.name}`);
          setOpenSearchFreelanceSalesDialog(false);
        }}
      />
      <CreateFreelanceSaleDialog
        open={openCreateFreelanceSaleDialog}
        onClose={() => setOpenCreateFreelanceSaleDialog(false)}
        defaultSaleCoverage={salesId}
        customerLabel={draft.customerSnapshot.customerName || salesOrder?.customer?.customerName || ''}
        onCreated={(freelanceSale) => {
          updateDraftField('coSaleId', freelanceSale.id || '');
          setSelectedFreelanceSaleItem(freelanceSale);
          setSelectedFreelanceSaleLabel(`${freelanceSale.id} - ${freelanceSale.name}`);
          setOpenCreateFreelanceSaleDialog(false);
        }}
      />
      <Dialog
        open={visibleUrgentDetailDialog}
        onClose={handleCloseUrgentDetailDialog}
        fullWidth
        maxWidth="sm">
        <DialogTitle>รายละเอียดคำขออนุมัติเร่งด่วน</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="สถานะคำขอเร่งด่วน"
              value={
                salesOrder?.urgentRequestStatus === 'APPROVED'
                  ? 'เร่งด่วนอนุมัติแล้ว'
                  : salesOrder?.urgentRequestStatus === 'REJECTED'
                    ? 'คำขอเร่งด่วนไม่อนุมัติ'
                    : 'เร่งด่วนรออนุมัติ'
              }
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
            />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="เหตุผลที่ขอ"
              value={salesOrder?.urgentRequestReason || '-'}
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
            />
            <TextField
              fullWidth
              label="เหตุผลที่ไม่อนุมัติ"
              value={
                hasRole(ROLES.SUPER_ADMIN) && salesOrder?.urgentRequestStatus === 'PENDING_APPROVAL'
                  ? urgentRejectReason
                  : salesOrder?.urgentRejectReason || '-'
              }
              onChange={(event) => setUrgentRejectReason(event.target.value)}
              multiline
              minRows={3}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                readOnly: !(hasRole(ROLES.SUPER_ADMIN) && salesOrder?.urgentRequestStatus === 'PENDING_APPROVAL')
              }}
              helperText={
                hasRole(ROLES.SUPER_ADMIN) && salesOrder?.urgentRequestStatus === 'PENDING_APPROVAL'
                  ? 'จำเป็นต้องกรอกเมื่อกดไม่อนุมัติ'
                  : undefined
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {hasRole(ROLES.SUPER_ADMIN) && salesOrder?.urgentRequestStatus === 'PENDING_APPROVAL' ? (
            <>
              <Button className="btn-crimson-red" onClick={() => void handleRejectUrgent()}>
                ไม่อนุมัติเร่งด่วน
              </Button>
              <Button className="btn-indigo-blue" onClick={() => void handleApproveUrgent()}>
                อนุมัติเร่งด่วน
              </Button>
            </>
          ) : null}
          <Button onClick={handleCloseUrgentDetailDialog}>{t('button.close')}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={requestPoConfirmOpen}
        title="ขออนุมัติสร้างใบสั่งซื้อ"
        confirmDisabled={!requestPoReason.trim()}
        confirmText="ยืนยัน"
        cancelText="ยกเลิก"
        isShowCancelButton
        isShowConfirmButton
        onConfirm={() => {
          void handleConfirmRequestPo();
        }}
        onCancel={handleCloseRequestPoConfirm}
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            ต้องการส่งคำขออนุมัติสร้างใบสั่งซื้อนี้ใช่หรือไม่
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={4}
            label="เหตุผลในการขออนุมัติ"
            placeholder="ระบุเหตุผลในการขออนุมัติ"
            value={requestPoReason}
            onChange={(event) => setRequestPoReason(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            type="date"
            label="วันที่จะชำระ"
            value={requestPoPaymentScheduleDate}
            onChange={(event) => setRequestPoPaymentScheduleDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </ConfirmDialog>
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
