/* eslint-disable prettier/prettier */
import { ArrowBackIos, ArrowDropDown, Cancel, CloudUpload, DeleteOutline, Description, DirectionsBoat, LocalShipping, Menu as MenuIcon, Save, Search } from '@mui/icons-material';
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tab,
    Tabs,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
    Checkbox
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import Can from 'auth/Can';
import { PERMISSIONS } from 'auth/permissions';
import ActivityHistoryTimeline from 'components/ActivityHistoryTimeline';
import ConfirmDialog from 'components/ConfirmDialog';
import DocumentFlow from 'components/DocumentFlow';
import DocumentLanguageDialog from 'components/DocumentLanguageDialog';
import CreateFreelanceSaleDialog from 'dialogs/QuotationManagement/New/CreateFreelanceSaleDialog';
import SearchFreelanceSalesDialog from 'dialogs/QuotationManagement/New/SearchFreelanceSalesDialog';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import { GridSearchSection, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { MouseEvent as ReactMouseEvent, ReactElement, SyntheticEvent, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { IoPencil } from 'react-icons/io5';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { getShippingMethodLabel, isSeaShippingMethod } from 'utils/shipping';
import { getActivityHistory } from 'services/ActivityHistory/activity-history-api';
import { getQuotation, syncQuotationCustomerSnapshot, updateQuotation, viewQuotation } from 'services/Document/document-api';
import { Quotation, QuotationCustomerSnapshot, QuotationItem, TemplateLanguage } from 'services/Document/document-type';
import { searchInvoices } from 'services/Invoice/invoice-api';
import { getFreelanceSales } from 'services/FreelanceSale/freelance-sale-api';
import { FreelanceSaleRecord } from 'services/FreelanceSale/freelance-sale-type';
import { searchReceipts } from 'services/Receipt/receipt-api';
import { getRFQ } from 'services/RFQ/rfq-api';
import { RFQDetailOption, RFQDetailTier, RFQRecord } from 'services/RFQ/rfq-type';
import { getSalesOrderV1 } from 'services/SaleOrder/sale-order-api';
import { DownloadDocumentResponse } from 'services/general-type';
import { uploadFile } from 'services/general-api';
import { base64ToBlob } from 'utils';
import { getDocumentStatusChipSx, getDocumentStatusLabel } from 'utils/documentStatus';
import { formatNumber, formatNumberWithDigit } from 'utils/utils';
import { buildQuotationDocumentFlowItems } from 'utils/documentFlow';

const getEmployeeName = (quotation?: Quotation) => {
    const employee = quotation?.saleAccount || quotation?.salesAccount;
    if (!employee) {
        return '-';
    }

    return [employee.firstNameTh, employee.lastNameTh].filter(Boolean).join(' ').trim() || '-';
};

const getCustomerAddress = (quotation?: Quotation): string => {
    if (quotation?.customerSnapshot?.address) {
        return quotation.customerSnapshot.address;
    }
    const address = quotation?.customerAddress;
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
};

type ConfirmQuotationRow = {
    key: string;
    quotationItem: QuotationItem;
    detailId: number | null;
    tierId: string | null;
    shippingMethod: string;
    optionName: string;
    quantity: number;
    unitPrice: number;
    isFcl: boolean;
    isShareFCL: boolean;
};

const recalculateQuotationItem = (item: QuotationItem): QuotationItem => {
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unitPrice || 0);

    return {
        ...item,
        quantity,
        unitPrice,
        amount: quantity * unitPrice
    };
};

const inferQuotationItemShippingMethod = (name?: string | null): 'LAND' | 'SEA' | null => {
    const normalizedName = (name || '').toLowerCase();

    if (normalizedName.includes('ทางเรือ')) return 'SEA';
    if (normalizedName.includes('sea')) return 'SEA';
    if (normalizedName.includes('ทางรถ')) return 'LAND';
    if (normalizedName.includes('land')) return 'LAND';

    return null;
};

const matchesShippingMethod = (shippingMethod: string, expectedMethod: 'LAND' | 'SEA' | null) => {
    if (!expectedMethod) {
        return true;
    }

    return expectedMethod === 'SEA' ? shippingMethod.startsWith('SEA') : shippingMethod === expectedMethod;
};

const isQuotationNotFoundError = (error: any): boolean => {
    const status = error?.response?.status;
    const responseStatus = error?.response?.data?.status;
    const message = String(error?.response?.data?.message || '').toLowerCase();

    return (
        status === 404 ||
        (status === 400 && (responseStatus === 'data_not_found' || message.includes('not found')))
    );
};

const findMatchingTier = (
    detailOptions: RFQDetailOption[],
    quotationItem: QuotationItem
): { detail: RFQDetailOption | null; tier: RFQDetailTier | null; shippingMethod: string } => {
    const tierId = quotationItem.tierId ? String(quotationItem.tierId) : '';
    const rfqDetailId = quotationItem.rfqDetailId;
    const inferredShippingMethod = inferQuotationItemShippingMethod(quotationItem.name);
    const quantity = Number(quotationItem.quantity || 0);
    const unitPrice = Number(quotationItem.unitPrice || 0);

    const allRows = detailOptions.flatMap((detail) =>
        (detail.tiers || []).map((tier) => ({
            detail,
            tier,
            shippingMethod: tier.shippingMethod || 'LAND',
            price: Number(tier.totalPrice || 0)
        }))
    );

    const exactTierMatch = allRows.find((row) => {
        if (rfqDetailId !== undefined && rfqDetailId !== null && row.detail.id !== rfqDetailId) {
            return false;
        }
        if (tierId && String(row.tier.id) !== tierId) {
            return false;
        }
        if (!matchesShippingMethod(row.shippingMethod, inferredShippingMethod)) {
            return false;
        }
        return Number(row.tier.quantity || 0) === quantity && Math.abs(row.price - unitPrice) < 0.0001;
    });

    if (exactTierMatch) {
        return exactTierMatch;
    }

    const quantityTierMatch = allRows.find((row) => {
        if (rfqDetailId !== undefined && rfqDetailId !== null && row.detail.id !== rfqDetailId) {
            return false;
        }
        if (tierId && String(row.tier.id) !== tierId) {
            return false;
        }
        if (!matchesShippingMethod(row.shippingMethod, inferredShippingMethod)) {
            return false;
        }
        return Number(row.tier.quantity || 0) === quantity;
    });

    if (quantityTierMatch) {
        return quantityTierMatch;
    }

    const tierOnlyMatch = allRows.find((row) => {
        if (rfqDetailId !== undefined && rfqDetailId !== null && row.detail.id !== rfqDetailId) {
            return false;
        }
        if (tierId && String(row.tier.id) !== tierId) {
            return false;
        }
        return matchesShippingMethod(row.shippingMethod, inferredShippingMethod);
    });

    if (tierOnlyMatch) {
        return tierOnlyMatch;
    }

    return {
        detail: null,
        tier: null,
        shippingMethod: inferredShippingMethod || 'LAND'
    };
};

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

export default function QuotationDetail(): JSX.Element {
    const { id: quotationNo = '' } = useParams<{ id: string }>();
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
        label: {
            color: '#64748b',
            fontSize: 12,
            fontWeight: 700
        },
        productImage: {
            width: 64,
            height: 64,
            objectFit: 'cover',
            borderRadius: 8,
            border: '1px solid #e6ebf1',
            backgroundColor: '#f8fafc'
        },
        specCell: {
            width: 260,
            maxWidth: 260,
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
    const { t } = useTranslation();
    const history = useHistory();
    const theme = useTheme();
    const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
    const [tab, setTab] = useState<'detail' | 'history'>('detail');
    const [isEditing, setIsEditing] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [draftRemark, setDraftRemark] = useState('');
    const [draftItems, setDraftItems] = useState<QuotationItem[]>([]);
    const [draftIsVat, setDraftIsVat] = useState(false);
    const [draftShipping, setDraftShipping] = useState<'ALL' | 'LAND' | 'SEA'>('ALL');
    const [draftProject, setDraftProject] = useState('');
    const [draftSampleLeadTime, setDraftSampleLeadTime] = useState('');
    const [draftProductionLeadTime, setDraftProductionLeadTime] = useState('');
    const [draftMoldLeadTime, setDraftMoldLeadTime] = useState('');
    const [draftShippingLeadTime, setDraftShippingLeadTime] = useState('');
    const [draftProductQtyTolerance, setDraftProductQtyTolerance] = useState('');
    const [draftCoSaleId, setDraftCoSaleId] = useState('');
    const [draftCustomerSnapshot, setDraftCustomerSnapshot] = useState<QuotationCustomerSnapshot>({ customerName: '', taxId: '', branchCode: '', branchName: '', address: '', contactName: '', contactNumber: '' });
    const [openSearchFreelanceSalesDialog, setOpenSearchFreelanceSalesDialog] = useState(false);
    const [openCreateFreelanceSaleDialog, setOpenCreateFreelanceSaleDialog] = useState(false);
    const [selectedFreelanceSaleItem, setSelectedFreelanceSaleItem] = useState<FreelanceSaleRecord | null>(null);
    const [selectedFreelanceSaleLabel, setSelectedFreelanceSaleLabel] = useState('');
    const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [visibleConfirmPriceDialog, setVisibleConfirmPriceDialog] = useState(false);
    const [selectedConfirmQuotationRowKeys, setSelectedConfirmQuotationRowKeys] = useState<string[]>([]);
    const [visibleQuotationNotFoundDialog, setVisibleQuotationNotFoundDialog] = useState(false);
    const [visibleQuotationLanguageDialog, setVisibleQuotationLanguageDialog] = useState(false);

    const {
        data: quotationResponse,
        isFetching,
        error: quotationError,
        refetch: refetchQuotation
    } = useQuery(
        ['quotation-detail', quotationNo],
        () => getQuotation(quotationNo),
        {
            enabled: !!quotationNo,
            refetchOnWindowFocus: false,
            retry: false
        }
    );

    const { data: activityHistory = [], isFetching: isActivityHistoryFetching, refetch: refetchActivityHistory } = useQuery(
        ['quotation-activity-history', quotationNo],
        () => getActivityHistory('QUOTATION', quotationNo),
        {
            enabled: !!quotationNo,
            refetchOnWindowFocus: false
        }
    );

    const { data: invoiceSearchResponse, isFetching: isInvoiceFlowFetching } = useQuery(
        ['quotation-document-flow-invoices', quotationNo],
        () =>
            searchInvoices(
                {
                    keyword: quotationNo
                },
                1,
                10
            ),
        {
            enabled: !!quotationNo,
            refetchOnWindowFocus: false
        }
    );

    const { data: receiptSearchResponse, isFetching: isReceiptFlowFetching } = useQuery(
        ['quotation-document-flow-receipts', quotationNo],
        () =>
            searchReceipts(
                {
                    keyword: quotationNo
                },
                1,
                10
            ),
        {
            enabled: !!quotationNo,
            refetchOnWindowFocus: false
        }
    );

    const quotation = quotationResponse?.data;
    const { data: freelanceSales = [], isFetching: isFreelanceSalesFetching } = useQuery(
        'quotation-detail-freelance-sales',
        () => getFreelanceSales(),
        { enabled: isEditing, refetchOnWindowFocus: false }
    );
    const selectedFreelanceSale = selectedFreelanceSaleItem || freelanceSales.find((item) => item.id === draftCoSaleId) || null;
    const selectedFreelanceSaleDisplay = selectedFreelanceSaleLabel
        || (selectedFreelanceSale ? `${selectedFreelanceSale.id} - ${selectedFreelanceSale.name}` : '')
        || draftCoSaleId;
    const salesId = quotation?.saleAccount?.employeeId || quotation?.salesAccount?.employeeId || '';
    const displayItems = isEditing ? draftItems : quotation?.items || [];
    const isActionMenuOpen = Boolean(actionMenuAnchorEl);
    const invoiceRecords = invoiceSearchResponse?.data?.records || [];
    const receiptRecords = receiptSearchResponse?.data?.records || [];
    const latestInvoice =
        invoiceRecords.find((record) => record.quotationNo === quotationNo) || invoiceRecords[0] || null;
    const latestReceipt =
        receiptRecords.find((record) => record.quotationNo === quotationNo) || receiptRecords[0] || null;
    const rfqId = quotation?.rfqId || quotation?.referenceRfqId || '';

    const { data: rfqResponse, isFetching: isRfqFetching } = useQuery(
        ['quotation-detail-rfq', rfqId],
        () => getRFQ(rfqId),
        {
            enabled: Boolean(rfqId),
            refetchOnWindowFocus: false
        }
    );

    const rfq = rfqResponse as RFQRecord | undefined;
    const salesOrderNo = latestInvoice?.salesOrderNo || latestReceipt?.salesOrderNo || rfq?.saleOrderId || null;
    const rfqQuotationOptions = useMemo(() => rfq?.quotations || [], [rfq?.quotations]);

    const { data: salesOrder, isFetching: isSalesOrderFlowFetching } = useQuery(
        ['quotation-document-flow-sales-order', salesOrderNo],
        () => getSalesOrderV1(salesOrderNo as string),
        {
            enabled: !!salesOrderNo,
            refetchOnWindowFocus: false
        }
    );
    const documentFlowItems = buildQuotationDocumentFlowItems({
        quotation: quotation
            ? {
                rfqId: quotation.rfqId || null,
                referenceRfqId: quotation.referenceRfqId || null,
                quotationNo: quotation.quotationNo || null,
                status: quotation.status || null,
                statusProfile: quotation.statusProfile || null
            }
            : null,
        rfqQuotations: rfqQuotationOptions,
        salesOrder,
        salesOrderNo,
        latestInvoice,
        latestReceipt,
        isSalesOrderLoading: isSalesOrderFlowFetching,
        isInvoiceLoading: isInvoiceFlowFetching,
        isReceiptLoading: isReceiptFlowFetching,
        invoiceCount: invoiceRecords.length,
        receiptCount: receiptRecords.length
    });
    const confirmQuotationRows: ConfirmQuotationRow[] = (quotation?.items || []).map((item, index) => {
        const matched = findMatchingTier(rfq?.details || [], item);
        return {
            key: `${item.id || index}:${matched.shippingMethod}`,
            quotationItem: item,
            detailId: item.rfqDetailId ?? matched.detail?.id ?? null,
            tierId: matched.tier ? String(matched.tier.id) : item.tierId || null,
            shippingMethod: matched.tier?.shippingMethod || matched.shippingMethod,
            optionName: matched.detail?.optionName || item.name || `รายการที่ ${index + 1}`,
            quantity: Number(item.quantity || 0),
            unitPrice: Number(item.unitPrice || 0),
            isFcl: Boolean(matched.tier?.isFcl),
            isShareFCL: Boolean(matched.tier?.isShareFCL)
        };
    });
    const selectableConfirmQuotationRowKeys = useMemo(
        () => confirmQuotationRows.filter((row) => Boolean(row.detailId)).map((row) => row.key),
        [confirmQuotationRows]
    );
    const isAllConfirmQuotationRowsSelected =
        selectableConfirmQuotationRowKeys.length > 0 &&
        selectableConfirmQuotationRowKeys.every((key) => selectedConfirmQuotationRowKeys.includes(key));
    // const canConfirmPriceAction = Boolean(quotation?.rfqId && quotation?.quotationNo && !salesOrder?.salesOrderNo);
    const canConfirmPriceAction = true;
    useEffect(() => {
        if (quotationError && isQuotationNotFoundError(quotationError)) {
            setVisibleQuotationNotFoundDialog(true);
        }
    }, [quotationError]);

    useEffect(() => {
        if (!quotation) {
            return;
        }

        setDraftRemark(quotation.remark || '');
        setDraftItems(quotation.items || []);
        setDraftIsVat(Number(quotation.vatRate || 0) > 0);
        setDraftShipping(quotation.shipping === 'LAND' || quotation.shipping === 'SEA' ? quotation.shipping : 'ALL');
        setDraftProject(quotation.project || '');
        setDraftSampleLeadTime(quotation.sampleLeadTime || '');
        setDraftProductionLeadTime(quotation.productionLeadTime || '');
        setDraftMoldLeadTime(quotation.moldLeadTime || '');
        setDraftShippingLeadTime(quotation.shippingLeadTime || '');
        setDraftProductQtyTolerance(quotation.productQtyTolerance || '');
        setDraftCoSaleId(quotation.coSaleId || quotation.coSalesId || '');
        setSelectedFreelanceSaleItem(null);
        setSelectedFreelanceSaleLabel('');
        setDraftCustomerSnapshot(quotation.customerSnapshot || { customerName: quotation.customer?.customerName || '', taxId: quotation.customer?.taxId || '', branchCode: quotation.customer?.branchNumber || '', branchName: quotation.customer?.branchName || '', address: getCustomerAddress(quotation), contactName: quotation.customerContact?.contactName || '', contactNumber: quotation.customerContact?.contactNumber || '' });
        setIsEditing(false);
    }, [quotation]);

    const handleEditQuotation = () => {
        if (!quotation) {
            return;
        }

        setDraftRemark(quotation.remark || '');
        setDraftItems(quotation.items || []);
        setDraftIsVat(Number(quotation.vatRate || 0) > 0);
        setDraftShipping(quotation.shipping === 'LAND' || quotation.shipping === 'SEA' ? quotation.shipping : 'ALL');
        setDraftProject(quotation.project || '');
        setDraftSampleLeadTime(quotation.sampleLeadTime || '');
        setDraftProductionLeadTime(quotation.productionLeadTime || '');
        setDraftMoldLeadTime(quotation.moldLeadTime || '');
        setDraftShippingLeadTime(quotation.shippingLeadTime || '');
        setDraftProductQtyTolerance(quotation.productQtyTolerance || '');
        setDraftCoSaleId(quotation.coSaleId || quotation.coSalesId || '');
        setSelectedFreelanceSaleItem(null);
        setSelectedFreelanceSaleLabel('');
        setDraftCustomerSnapshot(quotation.customerSnapshot || { customerName: quotation.customer?.customerName || '', taxId: quotation.customer?.taxId || '', branchCode: quotation.customer?.branchNumber || '', branchName: quotation.customer?.branchName || '', address: getCustomerAddress(quotation), contactName: quotation.customerContact?.contactName || '', contactNumber: quotation.customerContact?.contactNumber || '' });
        setIsEditing(true);
    };

    const handleCancelEditQuotation = () => {
        handleCloseActionMenu();
        setDraftRemark(quotation?.remark || '');
        setDraftItems(quotation?.items || []);
        setDraftIsVat(Number(quotation?.vatRate || 0) > 0);
        setDraftShipping(quotation?.shipping === 'LAND' || quotation?.shipping === 'SEA' ? quotation.shipping : 'ALL');
        setDraftProject(quotation?.project || '');
        setDraftSampleLeadTime(quotation?.sampleLeadTime || '');
        setDraftProductionLeadTime(quotation?.productionLeadTime || '');
        setDraftMoldLeadTime(quotation?.moldLeadTime || '');
        setDraftShippingLeadTime(quotation?.shippingLeadTime || '');
        setDraftProductQtyTolerance(quotation?.productQtyTolerance || '');
        setDraftCoSaleId(quotation?.coSaleId || quotation?.coSalesId || '');
        setSelectedFreelanceSaleItem(null);
        setSelectedFreelanceSaleLabel('');
        setDraftCustomerSnapshot(quotation?.customerSnapshot || { customerName: quotation?.customer?.customerName || '', taxId: quotation?.customer?.taxId || '', branchCode: quotation?.customer?.branchNumber || '', branchName: quotation?.customer?.branchName || '', address: getCustomerAddress(quotation), contactName: quotation?.customerContact?.contactName || '', contactNumber: quotation?.customerContact?.contactNumber || '' });
        setIsEditing(false);
    };

    const handleOpenActionMenu = (event: ReactMouseEvent<HTMLElement>) => {
        setActionMenuAnchorEl(event.currentTarget);
    };

    const handleCloseActionMenu = () => {
        setActionMenuAnchorEl(null);
    };

    const updateDraftItem = (index: number, field: keyof QuotationItem, value: string) => {
        setDraftItems((prev) =>
            prev.map((item, itemIndex) => {
                if (itemIndex !== index) {
                    return recalculateQuotationItem(item);
                }

                if (field === 'unitPrice' || field === 'quantity') {
                    const nextValue = Number(value) || 0;
                    const nextItem = {
                        ...item,
                        [field]: nextValue
                    };

                    return recalculateQuotationItem(nextItem);
                }

                return {
                    ...item,
                    [field]: value
                };
            })
        );
    };

    const handleRemoveDraftItem = (index: number) => {
        if (draftItems.length <= 1) {
            toast.error('ใบเสนอราคาต้องมีรายการสินค้าอย่างน้อย 1 รายการ');
            return;
        }

        setDraftItems((items) => items.filter((_item, itemIndex) => itemIndex !== index));
    };

    const handleUploadQuotationItemImage = async (index: number, file?: File | null) => {
        if (!file) {
            return;
        }

        setIsUpdating(true);
        try {
            const uploadResult = await uploadFile(file);
            setDraftItems((items) =>
                items.map((item, itemIndex) =>
                    itemIndex === index
                        ? { ...item, imagePreview: uploadResult.url, imageUrl: uploadResult.url }
                        : item
                )
            );
            toast.success(t('toast.success'));
        } catch {
            toast.error(t('toast.failed'));
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSelectQuotationItemRfqPicture = (index: number, pictureUrl: string) => {
        setDraftItems((items) =>
            items.map((item, itemIndex) =>
                itemIndex === index
                    ? { ...item, imagePreview: pictureUrl, imageUrl: pictureUrl }
                    : item
            )
        );
    };

    const handleRemoveQuotationItemImage = (index: number) => {
        setDraftItems((items) =>
            items.map((item, itemIndex) =>
                itemIndex === index
                    ? { ...item, imagePreview: '', imageUrl: '' }
                    : item
            )
        );
    };

    const draftSubTotal = useMemo(
        () => draftItems.reduce((sum, item) => sum + Number(item.amount || 0), 0),
        [draftItems]
    );
    const draftDiscount = Number(quotation?.discount || 0);
    const draftFreight = Number(quotation?.freight || 0);
    const draftVatAmount = draftIsVat ? Math.max(draftSubTotal - draftDiscount, 0) * 0.07 : 0;
    const draftGrandTotal = Math.max(draftSubTotal - draftDiscount, 0) + draftVatAmount + draftFreight;

    const handleOpenQuotationLanguageDialog = () => {
        handleCloseActionMenu();

        if (!quotation?.quotationNo) {
            return;
        }

        setVisibleQuotationLanguageDialog(true);
    };

    const handleCloseQuotationLanguageDialog = () => {
        setVisibleQuotationLanguageDialog(false);
    };

    const handleSelectQuotationLanguage = async (language: TemplateLanguage) => {
        handleCloseQuotationLanguageDialog();

        if (!quotation?.quotationNo) {
            return;
        }

        await toast.promise(viewQuotation(quotation.quotationNo, true, false, language), {
            loading: t('toast.loading'),
            success: (response) => {
                const data = response.data as DownloadDocumentResponse;

                if (!data.files?.length) {
                    throw new Error('No file');
                }

                if (isDownSm) {
                    data.files.forEach((file) => {
                        const blob = base64ToBlob(file.base64, file.contentType);
                        const url = URL.createObjectURL(blob);

                        const link = document.createElement('a');
                        link.href = url;
                        link.download = file.fileName || `${quotation.quotationNo}.pdf`;
                        link.click();

                        setTimeout(() => URL.revokeObjectURL(url), 30_000);
                    });
                } else {
                    const file = data.files[0];
                    const blob = base64ToBlob(file.base64, file.contentType || 'application/pdf');
                    const url = URL.createObjectURL(blob);

                    window.open(url, '_blank', 'noopener,noreferrer');
                    setTimeout(() => URL.revokeObjectURL(url), 30_000);
                }

                return t('toast.success');
            },
            error: () => t('toast.failed')
        });
    };

    const handleSelectEditQuotation = () => {
        handleCloseActionMenu();
        handleEditQuotation();
    };

    const handleOpenConfirmPriceDialog = () => {
        handleCloseActionMenu();

        if (salesOrder?.salesOrderNo) {
            history.push(ROUTE_PATHS.SALE_ORDER_DETAIL.replace(':id', salesOrder.salesOrderNo));
            return;
        }

        if (!quotation?.rfqId) {
            toast.error('ไม่พบ RFQ อ้างอิงสำหรับคอนเฟิร์มราคา');
            return;
        }

        if (!confirmQuotationRows.length) {
            toast.error('ยังไม่มีรายการใบเสนอราคาสำหรับคอนเฟิร์มราคา');
            return;
        }

        setSelectedConfirmQuotationRowKeys([]);
        setVisibleConfirmPriceDialog(true);
    };

    const toggleConfirmQuotationRow = (rowKey: string) => {
        setSelectedConfirmQuotationRowKeys((currentKeys) =>
            currentKeys.includes(rowKey)
                ? currentKeys.filter((key) => key !== rowKey)
                : [...currentKeys, rowKey]
        );
    };

    const toggleSelectAllConfirmQuotationRows = () => {
        setSelectedConfirmQuotationRowKeys(
            isAllConfirmQuotationRowsSelected ? [] : selectableConfirmQuotationRowKeys
        );
    };

    const handleConfirmQuotationPrice = () => {
        if (!quotation?.rfqId) {
            toast.error('ไม่พบ RFQ อ้างอิงสำหรับคอนเฟิร์มราคา');
            return;
        }

        if (!selectedConfirmQuotationRowKeys.length) {
            toast.error('กรุณาเลือกรายการใบเสนอราคาที่ต้องการใช้สำหรับคอนเฟิร์มราคา');
            return;
        }

        const selectedRows = selectedConfirmQuotationRowKeys
            .map((rowKey) => confirmQuotationRows.find((row) => row.key === rowKey))
            .filter((row): row is ConfirmQuotationRow => Boolean(row));

        if (!selectedRows.length) {
            toast.error('ไม่พบข้อมูลรายการใบเสนอราคาที่เลือก');
            return;
        }

        console.log('selectedRows', selectedRows);

        if (selectedRows.some((row) => !row.detailId)) {
            toast.error('ไม่สามารถจับคู่รายการใบเสนอราคากับ RFQ เดิมได้ครบทุกแถว');
            return;
        }

        const serializedSelections = encodeURIComponent(
            JSON.stringify(
                selectedRows.map((row) => ({
                    detailId: row.detailId,
                    quotationDetailId: String(row.quotationItem.id || ''),
                    shippingMethod: row.shippingMethod
                }))
            )
        );

        setVisibleConfirmPriceDialog(false);
        toast.success(
            selectedRows.length === 1
                ? `เลือก ${selectedRows[0].optionName} จำนวน ${formatNumber(selectedRows[0].quantity)} ${getShippingMethodLabel(
                    selectedRows[0].shippingMethod,
                    '-',
                    selectedRows[0].isFcl,
                    selectedRows[0].isShareFCL
                )}`
                : `เลือกรายการสำหรับคอนเฟิร์มราคาแล้ว ${selectedRows.length} รายการ`
        );
        history.push(
            `${ROUTE_PATHS.SALE_ORDER_CREATE_FROM_RFQ.replace(':rfqId', quotation.rfqId)}?quotationNo=${encodeURIComponent(quotation.quotationNo)}&selectedItems=${serializedSelections}`
        );
    };

    const handleSaveQuotation = async () => {
        if (!quotationNo) {
            return;
        }

        setIsUpdating(true);

        try {
            await toast.promise(
                updateQuotation(quotationNo, {
                    remark: draftRemark,
                    items: draftItems,
                    isVat: draftIsVat,
                    customerSnapshot: draftCustomerSnapshot,
                    coSaleId: draftCoSaleId,
                    shipping: draftShipping,
                    project: draftProject,
                    sampleLeadTime: draftSampleLeadTime,
                    productionLeadTime: draftProductionLeadTime,
                    moldLeadTime: draftMoldLeadTime,
                    shippingLeadTime: draftShippingLeadTime,
                    productQtyTolerance: draftProductQtyTolerance
                }),
                {
                    loading: t('toast.loading'),
                    success: t('toast.success'),
                    error: t('toast.failed')
                }
            );
            setIsEditing(false);
            await Promise.all([refetchQuotation(), refetchActivityHistory()]);
        } catch {
            // Toast already shows the failed state.
        } finally {
            setIsUpdating(false);
        }
    };

    const handleChangeTab = (_event: SyntheticEvent, value: 'detail' | 'history') => {
        setTab(value);
    };

    return (
        <Page>
            <LoadingDialog open={isFetching || isActivityHistoryFetching || isUpdating} />
            <ConfirmDialog
                open={visibleQuotationNotFoundDialog}
                title="ไม่พบข้อมูลใบเสนอราคา"
                message={`ไม่พบข้อมูลใบเสนอราคาเลขที่ ${quotationNo}`}
                confirmText="ตกลง"
                isShowCancelButton={false}
                isShowConfirmButton
                onConfirm={() => history.push(ROUTE_PATHS.QUOTATION_MANAGEMENT)}
            />
            <DocumentLanguageDialog
                open={visibleQuotationLanguageDialog}
                title={isDownSm ? 'ดาวน์โหลดไฟล์ใบเสนอราคา' : t('documentManagement.quotation.viewQuotation')}
                description={
                    isDownSm
                        ? 'เลือกภาษาเพื่อดาวน์โหลดไฟล์ลงเครื่อง'
                        : 'กรุณาเลือกภาษาที่ต้องการดูเอกสาร'
                }
                onClose={handleCloseQuotationLanguageDialog}
                onSelect={handleSelectQuotationLanguage}
            />
            <PageTitle title={'ใบเสนอราคาเลขที่ ' + quotation?.quotationNo || t('documentManagement.quotation.title')}>
                {quotation?.status ? (
                    <Chip
                        label={getDocumentStatusLabel(quotation.status, quotation.statusProfile)}
                        size="small"
                        sx={getDocumentStatusChipSx(quotation.status, quotation.statusProfile)}
                    />
                ) : null}
            </PageTitle>
            <Wrapper>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    useFlexGap
                    sx={{ justifyContent: { sm: 'flex-end' }, alignItems: { xs: 'stretch', sm: 'center' }, mb: 2 }}>
                    <Button
                        fullWidth={isDownSm}
                        variant="contained"
                        className="btn-indigo-blue"
                        startIcon={<MenuIcon />}
                        endIcon={<ArrowDropDown />}
                        onClick={handleOpenActionMenu}
                        disabled={!quotation}
                        aria-controls={isActionMenuOpen ? 'quotation-action-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={isActionMenuOpen ? 'true' : undefined}>
                        ตัวเลือก
                    </Button>
                    <Menu
                        id="quotation-action-menu"
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
                        <>
                            <Can permission={PERMISSIONS.QUOTATION_EDIT}>
                                <MenuItem
                                    onClick={handleSelectEditQuotation}
                                    disabled={!quotation || quotation.status === 'CANCELLED'}
                                    sx={{ width: '100%' }}>
                                    <ListItemIcon>
                                        <IoPencil />
                                    </ListItemIcon>
                                    <ListItemText primary={t('documentManagement.quotation.editQuotation')} />
                                </MenuItem>
                            </Can>
                            <MenuItem
                                onClick={handleOpenQuotationLanguageDialog}
                                disabled={!quotation || quotation.status === 'CANCELLED'}
                                sx={{ width: '100%' }}>
                                <ListItemIcon>
                                    <Description fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        isDownSm
                                            ? 'ดาวน์โหลดไฟล์'
                                            : t('documentManagement.quotation.viewQuotation')
                                    }
                                />
                            </MenuItem>
                            {canConfirmPriceAction ? (
                                <MenuItem
                                    onClick={handleOpenConfirmPriceDialog}
                                    disabled={!quotation || quotation.status === 'CANCELLED'}
                                    sx={{ width: '100%' }}>
                                    <ListItemIcon>
                                        <Save fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary="คอนเฟิร์มราคา" />
                                </MenuItem>
                            ) : null}
                        </>
                    </Menu>
                    <Button
                        fullWidth={isDownSm}
                        variant="contained"
                        className="btn-cool-grey"
                        startIcon={<ArrowBackIos />}
                        onClick={() => history.push(ROUTE_PATHS.QUOTATION_MANAGEMENT)}>
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
                        <Tab value="detail" label={t('documentManagement.quotation.detail')} />
                        <Tab value="history" label="ประวัติ" />
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
                            variant="outlined"
                            onClick={() => {
                                if (!quotationNo) return;
                                void toast.promise(syncQuotationCustomerSnapshot(quotationNo), {
                                    loading: t('toast.loading'), success: t('toast.success'), error: t('toast.failed')
                                }).then(() => refetchQuotation());
                            }}
                            disabled={isUpdating}>
                            ดึงข้อมูลลูกค้ากลางมาใช้กับใบนี้
                        </Button>
                        <Button
                            fullWidth={isDownSm}
                            variant="contained"
                            className="btn-cool-grey"
                            startIcon={<Cancel />}
                            onClick={handleCancelEditQuotation}
                            disabled={isUpdating}>
                            {t('button.cancel')}
                        </Button>
                        <Button
                            fullWidth={isDownSm}
                            variant="contained"
                            className="btn-emerald-green"
                            startIcon={<Save />}
                            onClick={() => {
                                void handleSaveQuotation();
                            }}
                            disabled={isUpdating}>
                            {t('button.save')}
                        </Button>
                    </Stack>
                ) : null}

                <TabPanel value="detail" currentTab={tab}>
                    <>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={1.25} className={classes.section}>
                                    <Typography variant="h6">{t('documentManagement.quotation.title')}</Typography>
                                    <Info label={t('documentManagement.quotation.docNo')} value={quotation?.quotationNo} asTextField={isEditing} />
                                    <Info label={t('documentManagement.quotation.docDate')} value={quotation?.docDate} asTextField={isEditing} />
                                    <Info label={t('documentManagement.quotation.expectiveDate')} value={quotation?.effectiveDate} asTextField={isEditing} />
                                    <Info
                                        label={t('documentManagement.quotation.status')}
                                        value={getDocumentStatusLabel(quotation?.status, quotation?.statusProfile)}
                                        asTextField={isEditing}
                                    />
                                    <Info label={"Revision "} value={quotation?.revNo ?? '-'} asTextField={isEditing} />
                                    <Info label="อ้างอิง RFQ " value={quotation?.rfqId} asTextField={isEditing} />
                                    {isEditing ? (
                                        <TextField
                                            select

                                            label="การขนส่ง"
                                            value={draftShipping}
                                            onChange={(event) => setDraftShipping(event.target.value as 'ALL' | 'LAND' | 'SEA')}>
                                            <MenuItem value="ALL">ทางรถ / ทางเรือ</MenuItem>
                                            <MenuItem value="LAND">ทางรถ</MenuItem>
                                            <MenuItem value="SEA">ทางเรือ</MenuItem>
                                        </TextField>
                                    ) : (
                                        <Info
                                            label="การขนส่ง"
                                            value={quotation?.shipping === 'LAND' ? 'ทางรถ' : quotation?.shipping === 'SEA' ? 'ทางเรือ' : 'ทางรถ / ทางเรือ'}
                                        />
                                    )}
                                    {isEditing ? (
                                        <TextField
                                            select
                                            label="ภาษีมูลค่าเพิ่ม"
                                            value={draftIsVat ? 'VAT' : 'NO_VAT'}
                                            onChange={(event) => setDraftIsVat(event.target.value === 'VAT')}>
                                            <MenuItem value="VAT">มี VAT 7%</MenuItem>
                                            <MenuItem value="NO_VAT">ไม่มี VAT</MenuItem>
                                        </TextField>
                                    ) : (
                                        <Info
                                            label="ภาษีมูลค่าเพิ่ม"
                                            value={Number(quotation?.vatRate || 0) > 0 ? 'มี VAT 7%' : 'ไม่มี VAT'}
                                        />
                                    )}
                                    {isEditing ? (
                                        <TextField
                                            InputLabelProps={{ shrink: true }}
                                            label="โครงการ"
                                            value={draftProject}
                                            onChange={(event) => setDraftProject(event.target.value)}
                                        />
                                    ) : (
                                        <Info label="โครงการ" value={quotation?.project || '-'} />
                                    )}
                                    {isEditing ? (
                                        <TextField
                                            InputLabelProps={{ shrink: true }}
                                            label="ระยะเวลาทำตัวอย่าง"
                                            value={draftSampleLeadTime}
                                            onChange={(event) => setDraftSampleLeadTime(event.target.value)}
                                        />
                                    ) : (
                                        <Info label="ระยะเวลาทำตัวอย่าง" value={quotation?.sampleLeadTime || '-'} />
                                    )}
                                    {isEditing ? (
                                        <TextField
                                            InputLabelProps={{ shrink: true }}
                                            label="ระยะเวลาผลิต"
                                            value={draftProductionLeadTime}
                                            onChange={(event) => setDraftProductionLeadTime(event.target.value)}
                                        />
                                    ) : (
                                        <Info label="ระยะเวลาผลิต" value={quotation?.productionLeadTime || '-'} />
                                    )}
                                    {isEditing ? (
                                        <TextField
                                            InputLabelProps={{ shrink: true }}
                                            label="ระยะเวลาทำแม่พิมพ์"
                                            value={draftMoldLeadTime}
                                            onChange={(event) => setDraftMoldLeadTime(event.target.value)}
                                        />
                                    ) : (
                                        <Info label="ระยะเวลาทำแม่พิมพ์" value={quotation?.moldLeadTime || '-'} />
                                    )}
                                    {isEditing ? (
                                        <TextField
                                            InputLabelProps={{ shrink: true }}
                                            label="ระยะเวลาขนส่ง"
                                            value={draftShippingLeadTime}
                                            onChange={(event) => setDraftShippingLeadTime(event.target.value)}
                                        />
                                    ) : (
                                        <Info label="ระยะเวลาขนส่ง" value={quotation?.shippingLeadTime || '-'} />
                                    )}
                                    {isEditing ? (
                                        <TextField
                                            InputLabelProps={{ shrink: true }}
                                            label="ค่าคลาดเคลื่อนปริมาณสินค้า"
                                            value={draftProductQtyTolerance}
                                            onChange={(event) => setDraftProductQtyTolerance(event.target.value)}
                                        />
                                    ) : (
                                        <Info label="ค่าคลาดเคลื่อนปริมาณสินค้า" value={quotation?.productQtyTolerance || '-'} />
                                    )}
                                </Stack>
                            </Grid>
                            <Grid
                                item
                                xs={12}
                                md={6}
                                sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                            >
                                <Stack spacing={1.25} className={classes.section}>
                                    <Typography variant="h6">{t('customerManagement.customer')}</Typography>
                                    {isEditing ? (
                                        <Stack spacing={1} sx={{ mt: 1 }}>
                                            <TextField label="ชื่อลูกค้า" value={draftCustomerSnapshot.customerName} onChange={(event) => setDraftCustomerSnapshot({ ...draftCustomerSnapshot, customerName: event.target.value })} />
                                            <TextField label="เลขประจำตัวผู้เสียภาษี" InputLabelProps={{ shrink: true }} value={draftCustomerSnapshot.taxId} onChange={(event) => setDraftCustomerSnapshot({ ...draftCustomerSnapshot, taxId: event.target.value })} />
                                            <TextField label="รหัสสาขา" InputLabelProps={{ shrink: true }} value={draftCustomerSnapshot.branchCode} onChange={(event) => setDraftCustomerSnapshot({ ...draftCustomerSnapshot, branchCode: event.target.value })} />
                                            <TextField label="ชื่อสาขา" InputLabelProps={{ shrink: true }} value={draftCustomerSnapshot.branchName} onChange={(event) => setDraftCustomerSnapshot({ ...draftCustomerSnapshot, branchName: event.target.value })} />
                                            <TextField label="ผู้ติดต่อ" InputLabelProps={{ shrink: true }} value={draftCustomerSnapshot.contactName} onChange={(event) => setDraftCustomerSnapshot({ ...draftCustomerSnapshot, contactName: event.target.value })} />
                                            <TextField label="เบอร์โทร" InputLabelProps={{ shrink: true }} value={draftCustomerSnapshot.contactNumber} onChange={(event) => setDraftCustomerSnapshot({ ...draftCustomerSnapshot, contactNumber: event.target.value })} />
                                            <TextField multiline minRows={2} InputLabelProps={{ shrink: true }} label="ที่อยู่" value={draftCustomerSnapshot.address} onChange={(event) => setDraftCustomerSnapshot({ ...draftCustomerSnapshot, address: event.target.value })} />
                                        </Stack>
                                    ) : (
                                        <>
                                            <Info
                                                label={t('customerManagement.customer')}
                                                value={quotation?.customer ? `(${quotation.customer.id}) ${quotation.customerSnapshot?.customerName || quotation.customer.customerName}` : '-'}
                                            />
                                            <Info label="สาขา" value={quotation?.customerSnapshot?.branchCode ? `(${quotation.customerSnapshot.branchCode}) ${quotation.customerSnapshot.branchName || ''}` : '-'} />
                                            <Info label={t('documentManagement.quotation.customerSection.contactName')} value={quotation?.customerSnapshot?.contactName || quotation?.customerContact?.contactName} />
                                            <Info label={t('documentManagement.quotation.customerSection.contactNumber')} value={quotation?.customerSnapshot?.contactNumber || quotation?.customerContact?.contactNumber} />
                                            <Info label="ที่อยู่" value={getCustomerAddress(quotation)} />
                                        </>
                                    )}
                                </Stack>
                                <Stack spacing={1.25} className={classes.section}>
                                    <Typography variant="h6">{t('documentManagement.quotation.salesAccount')}</Typography>
                                    <Info label={t('documentManagement.quotation.salesAccount')} value={getEmployeeName(quotation)} asTextField={isEditing} />
                                    {isEditing ? (
                                        <TextField
                                            label="เซลล์นอก/เซลล์ฟรีแลนซ์"
                                            value={selectedFreelanceSaleDisplay}
                                            fullWidth
                                            InputLabelProps={{ shrink: true }}
                                            InputProps={{
                                                readOnly: true,
                                                endAdornment: (
                                                    <IconButton
                                                        edge="end"
                                                        onClick={() => setOpenSearchFreelanceSalesDialog(true)}
                                                        disabled={isFreelanceSalesFetching}>
                                                        <Search />
                                                    </IconButton>
                                                )
                                            }}
                                        />
                                    ) : (
                                        <Info label={t('documentManagement.quotation.coSalesAccount')} value={quotation?.coSaleId || quotation?.coSalesId} />
                                    )}
                                </Stack>
                            </Grid>
                            <Grid item xs={12}>
                                <Stack spacing={1.25} className={classes.section}>
                                    <Typography variant="h6">{t('documentManagement.quotation.remark')}</Typography>
                                    {isEditing ? (
                                        <TextField
                                            label={t('documentManagement.quotation.remark')}
                                            multiline
                                            minRows={3}
                                            fullWidth
                                            InputLabelProps={{ shrink: true }}
                                            value={draftRemark}
                                            onChange={(event) => setDraftRemark(event.target.value)}
                                        />
                                    ) : (
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                            {quotation?.remark || '-'}
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
                                            <Stack key={item.id || index} spacing={1.25} className={classes.mobileItemCard}>
                                                <Stack
                                                    direction="row"
                                                    spacing={1.25}
                                                    alignItems="flex-start"
                                                    className={classes.mobileItemHeader}>
                                                    {item.imagePreview || item.imageUrl ? (
                                                        <Box
                                                            component="img"
                                                            src={item.imagePreview || item.imageUrl}
                                                            alt={item.name || t('documentManagement.quotation.itemSection.name')}
                                                            className={classes.productImage}
                                                        />
                                                    ) : (
                                                        <Stack
                                                            justifyContent="center"
                                                            alignItems="center"
                                                            className={classes.productImage}
                                                            sx={{ color: '#94a3b8', fontSize: 11, textAlign: 'center', px: 1 }}>
                                                            {t('documentManagement.quotation.itemSection.noImage')}
                                                        </Stack>
                                                    )}
                                                    <Stack spacing={0.35} sx={{ minWidth: 0, flex: 1 }}>
                                                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                                            รายการที่ {index + 1}
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
                                                </Stack>

                                                {isEditing ? (
                                                    <Stack spacing={0.75}>
                                                        <Stack direction="row" spacing={0.75} flexWrap="wrap">
                                                            <Button
                                                                component="label"
                                                                size="small"
                                                                variant="outlined"
                                                                startIcon={<CloudUpload />}
                                                                disabled={isUpdating}>
                                                                อัปโหลดรูป
                                                                <input
                                                                    hidden
                                                                    accept="image/*"
                                                                    type="file"
                                                                    onChange={(event) => {
                                                                        void handleUploadQuotationItemImage(index, event.target.files?.[0]);
                                                                        event.target.value = '';
                                                                    }}
                                                                />
                                                            </Button>
                                                            {item.imagePreview || item.imageUrl ? (
                                                                <Button
                                                                    size="small"
                                                                    color="error"
                                                                    variant="outlined"
                                                                    disabled={isUpdating}
                                                                    onClick={() => handleRemoveQuotationItemImage(index)}>
                                                                    ลบรูป
                                                                </Button>
                                                            ) : null}
                                                            <Button
                                                                size="small"
                                                                color="error"
                                                                variant="outlined"
                                                                startIcon={<DeleteOutline />}
                                                                disabled={isUpdating || draftItems.length <= 1}
                                                                onClick={() => handleRemoveDraftItem(index)}>
                                                                ลบรายการ
                                                            </Button>
                                                        </Stack>
                                                        {(rfq?.pictures || []).some((picture) => Boolean(picture.pictureUrl)) ? (
                                                            <Stack spacing={0.5}>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    เลือกรูปจาก RFQ
                                                                </Typography>
                                                                <Stack direction="row" spacing={0.75} sx={{ overflowX: 'auto', pb: 0.5 }}>
                                                                    {(rfq?.pictures || [])
                                                                        .filter((picture) => Boolean(picture.pictureUrl))
                                                                        .map((picture, pictureIndex) => {
                                                                            const isSelected = (item.imagePreview || item.imageUrl) === picture.pictureUrl;
                                                                            return (
                                                                                <Box
                                                                                    key={picture.id || picture.pictureUrl || pictureIndex}
                                                                                    component="img"
                                                                                    src={picture.pictureUrl}
                                                                                    alt={`RFQ ${pictureIndex + 1}`}
                                                                                    onClick={() => handleSelectQuotationItemRfqPicture(index, picture.pictureUrl)}
                                                                                    sx={{
                                                                                        width: 52,
                                                                                        height: 52,
                                                                                        flexShrink: 0,
                                                                                        objectFit: 'cover',
                                                                                        cursor: 'pointer',
                                                                                        borderRadius: 1,
                                                                                        border: isSelected ? '2px solid #1976d2' : '1px solid #cbd5e1'
                                                                                    }}
                                                                                />
                                                                            );
                                                                        })}
                                                                </Stack>
                                                            </Stack>
                                                        ) : null}
                                                    </Stack>
                                                ) : null}

                                                <Stack spacing={1}>
                                                    <Info
                                                        label={t('documentManagement.quotation.itemSection.spec')}
                                                        value={isEditing ? undefined : item.spec || '-'}
                                                    />
                                                    {isEditing ? (
                                                        <TextField
                                                            className={classes.itemTextField}
                                                            value={item.spec || ''}
                                                            fullWidth
                                                            multiline
                                                            minRows={2}
                                                            label={t('documentManagement.quotation.itemSection.spec')}
                                                            InputLabelProps={{ shrink: true }}
                                                            onChange={(event) => updateDraftItem(index, 'spec', event.target.value)}
                                                        />
                                                    ) : null}

                                                    <Grid container spacing={1.25}>
                                                        <Grid item xs={6}>
                                                            {isEditing ? (
                                                                <TextField
                                                                    className={classes.itemTextField}
                                                                    type="number"
                                                                    fullWidth
                                                                    label={t('documentManagement.quotation.itemSection.unitPrice')}
                                                                    InputLabelProps={{ shrink: true }}
                                                                    value={item.unitPrice || 0}
                                                                    onChange={(event) => updateDraftItem(index, 'unitPrice', event.target.value)}
                                                                />
                                                            ) : (
                                                                <Info
                                                                    label={t('documentManagement.quotation.itemSection.unitPrice')}
                                                                    value={formatNumber(item.unitPrice || 0)}
                                                                />
                                                            )}
                                                        </Grid>
                                                        <Grid item xs={6}>
                                                            {isEditing ? (
                                                                <TextField
                                                                    className={classes.itemTextField}
                                                                    type="number"
                                                                    fullWidth
                                                                    label={t('documentManagement.quotation.itemSection.quantity')}
                                                                    InputLabelProps={{ shrink: true }}
                                                                    value={item.quantity || 0}
                                                                    onChange={(event) => updateDraftItem(index, 'quantity', event.target.value)}
                                                                />
                                                            ) : (
                                                                <Info
                                                                    label={t('documentManagement.quotation.itemSection.quantity')}
                                                                    value={formatNumber(item.quantity || 0)}
                                                                />
                                                            )}
                                                        </Grid>
                                                        <Grid item xs={12}>
                                                            {isEditing ? (
                                                                <TextField
                                                                    fullWidth
                                                                    label={t('documentManagement.quotation.itemSection.totalAmount')}
                                                                    value={formatNumber(item.amount || 0)}
                                                                    InputProps={{ readOnly: true }}
                                                                />
                                                            ) : (
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
                                                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                                                        {t('documentManagement.quotation.itemSection.totalAmount')}
                                                                    </Typography>
                                                                    <Typography variant="body2" fontWeight={700}>
                                                                        {formatNumber(item.amount || 0)}
                                                                    </Typography>
                                                                </Stack>
                                                            )}
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
                                    <Table id="quotation_detail___table">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell align="center" className={`${classes.tableHeader} ${classes.fitContentCell}`}>#</TableCell>
                                                <TableCell align="center" className={`${classes.tableHeader} ${classes.fitContentCell}`}>
                                                    {t('documentManagement.quotation.itemSection.image')}
                                                </TableCell>
                                                <TableCell className={`${classes.tableHeader} ${classes.fitContentCell}`}>{t('documentManagement.quotation.itemSection.name')}</TableCell>
                                                <TableCell className={`${classes.tableHeader} ${classes.specCell}`}>{t('documentManagement.quotation.itemSection.spec')}</TableCell>
                                                <TableCell align="right" className={`${classes.tableHeader} ${classes.fitContentCell}`}>{t('documentManagement.quotation.itemSection.unitPrice')}</TableCell>
                                                <TableCell align="right" className={`${classes.tableHeader} ${classes.fitContentCell}`}>{t('documentManagement.quotation.itemSection.quantity')}</TableCell>
                                                <TableCell align="right" className={`${classes.tableHeader} ${classes.fitContentCell}`}>{t('documentManagement.quotation.itemSection.totalAmount')}</TableCell>
                                                {isEditing ? (
                                                    <TableCell align="center" className={`${classes.tableHeader} ${classes.fitContentCell}`}>
                                                        จัดการ
                                                    </TableCell>
                                                ) : null}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {displayItems.length ? (
                                                displayItems.map((item, index) => (
                                                    <TableRow key={item.id || index}>
                                                        <TableCell align="center" className={classes.fitContentCell}>{index + 1}</TableCell>
                                                        <TableCell align="center" className={classes.fitContentCell}>
                                                            {item.imagePreview || item.imageUrl ? (
                                                                <Box
                                                                    component="img"
                                                                    src={item.imagePreview || item.imageUrl}
                                                                    alt={item.name || t('documentManagement.quotation.itemSection.name')}
                                                                    className={classes.productImage}
                                                                />
                                                            ) : (
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {t('documentManagement.quotation.itemSection.noImage')}
                                                                </Typography>
                                                            )}
                                                            {isEditing ? (
                                                                <Stack spacing={0.75} alignItems="center" sx={{ mt: 1 }}>
                                                                    <Button
                                                                        component="label"
                                                                        size="small"
                                                                        variant="outlined"
                                                                        startIcon={<CloudUpload />}
                                                                        disabled={isUpdating}>
                                                                        อัปโหลดรูป
                                                                        <input
                                                                            hidden
                                                                            accept="image/*"
                                                                            type="file"
                                                                            onChange={(event) => {
                                                                                void handleUploadQuotationItemImage(index, event.target.files?.[0]);
                                                                                event.target.value = '';
                                                                            }}
                                                                        />
                                                                    </Button>
                                                                    {item.imagePreview || item.imageUrl ? (
                                                                        <Button
                                                                            size="small"
                                                                            color="error"
                                                                            variant="outlined"
                                                                            disabled={isUpdating}
                                                                            onClick={() => handleRemoveQuotationItemImage(index)}>
                                                                            ลบรูป
                                                                        </Button>
                                                                    ) : null}
                                                                    {(rfq?.pictures || []).some((picture) => Boolean(picture.pictureUrl)) ? (
                                                                        <Stack direction="row" spacing={0.5} sx={{ maxWidth: 160, overflowX: 'auto', pb: 0.25 }}>
                                                                            {(rfq?.pictures || [])
                                                                                .filter((picture) => Boolean(picture.pictureUrl))
                                                                                .map((picture, pictureIndex) => {
                                                                                    const isSelected = (item.imagePreview || item.imageUrl) === picture.pictureUrl;
                                                                                    return (
                                                                                        <Box
                                                                                            key={picture.id || picture.pictureUrl || pictureIndex}
                                                                                            component="img"
                                                                                            src={picture.pictureUrl}
                                                                                            alt={`RFQ ${pictureIndex + 1}`}
                                                                                            onClick={() => handleSelectQuotationItemRfqPicture(index, picture.pictureUrl)}
                                                                                            sx={{
                                                                                                width: 36,
                                                                                                height: 36,
                                                                                                flexShrink: 0,
                                                                                                objectFit: 'cover',
                                                                                                cursor: 'pointer',
                                                                                                borderRadius: 0.75,
                                                                                                border: isSelected ? '2px solid #1976d2' : '1px solid #cbd5e1'
                                                                                            }}
                                                                                        />
                                                                                    );
                                                                                })}
                                                                        </Stack>
                                                                    ) : null}
                                                                </Stack>
                                                            ) : null}
                                                        </TableCell>
                                                        <TableCell className={classes.fitContentCell}>
                                                            {isEditing ? (
                                                                <TextField
                                                                    className={classes.itemTextField}
                                                                    value={item.name || ''}
                                                                    onChange={(event) => updateDraftItem(index, 'name', event.target.value)}
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
                                                                    onChange={(event) => updateDraftItem(index, 'spec', event.target.value)}
                                                                />
                                                            ) : (
                                                                item.spec || '-'
                                                            )}
                                                        </TableCell>
                                                        <TableCell align="right" className={classes.fitContentCell}>
                                                            {isEditing ? (
                                                                <TextField
                                                                    className={classes.itemTextField}
                                                                    type="number"
                                                                    value={item.unitPrice || 0}
                                                                    onChange={(event) => updateDraftItem(index, 'unitPrice', event.target.value)}
                                                                />
                                                            ) : (
                                                                formatNumberWithDigit(item.unitPrice || 0, 4)
                                                            )}
                                                        </TableCell>
                                                        <TableCell align="right" className={classes.fitContentCell}>
                                                            {isEditing ? (
                                                                <TextField
                                                                    className={classes.itemTextField}
                                                                    type="number"
                                                                    value={item.quantity || 0}
                                                                    onChange={(event) => updateDraftItem(index, 'quantity', event.target.value)}
                                                                />
                                                            ) : (
                                                                formatNumber(item.quantity || 0)
                                                            )}
                                                        </TableCell>
                                                        <TableCell align="right" className={classes.fitContentCell}>
                                                            {isEditing ? (
                                                                <TextField
                                                                    className={classes.itemTextField}
                                                                    value={formatNumber(item.amount || 0)}
                                                                    InputProps={{ readOnly: true }}
                                                                />
                                                            ) : (
                                                                formatNumber(item.amount || 0)
                                                            )}
                                                        </TableCell>
                                                        {isEditing ? (
                                                            <TableCell align="center" className={classes.fitContentCell}>
                                                                <IconButton
                                                                    color="error"
                                                                    aria-label="ลบรายการสินค้า"
                                                                    title="ลบรายการสินค้า"
                                                                    disabled={isUpdating || draftItems.length <= 1}
                                                                    onClick={() => handleRemoveDraftItem(index)}>
                                                                    <DeleteOutline />
                                                                </IconButton>
                                                            </TableCell>
                                                        ) : null}
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={isEditing ? 8 : 7} align="center">
                                                        {t('warning.noResultList')}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </GridSearchSection>

                        {quotation?.isShowSummary ? (
                            <GridSearchSection container spacing={2} justifyContent="flex-end">
                                <Grid item xs={12} md={4}>
                                    <Stack spacing={1.25} className={classes.section}>
                                        <Summary label={t('documentManagement.quotation.summarySection.subtotal')} value={isEditing ? draftSubTotal : quotation?.subTotal} asTextField={isEditing} />
                                        <Summary label={t('documentManagement.quotation.summarySection.discount')} value={quotation?.discount} asTextField={isEditing} />
                                        <Summary label={t('documentManagement.quotation.summarySection.vat')} value={isEditing ? draftVatAmount : quotation?.vat} asTextField={isEditing} />
                                        <Summary label={t('documentManagement.quotation.summarySection.grandTotal')} value={isEditing ? draftGrandTotal : quotation?.grandTotal} strong asTextField={isEditing} />
                                    </Stack>
                                </Grid>
                            </GridSearchSection>
                        ) : null}

                    </>
                </TabPanel>

                <TabPanel value="history" currentTab={tab}>
                    <Wrapper>
                        <ActivityHistoryTimeline records={activityHistory} />
                    </Wrapper>
                </TabPanel>
            </Wrapper>

            <Dialog
                open={visibleConfirmPriceDialog}
                onClose={() => setVisibleConfirmPriceDialog(false)}
                fullWidth
                maxWidth="lg">
                <DialogTitle>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                        <Typography variant="h6">คอนเฟิร์มราคา</Typography>
                        <Button
                            size="small"
                            onClick={toggleSelectAllConfirmQuotationRows}
                            disabled={!selectableConfirmQuotationRowKeys.length}>
                            {isAllConfirmQuotationRowsSelected ? 'ยกเลิกเลือกทั้งหมด' : 'เลือกทั้งหมด'}
                        </Button>
                    </Stack>
                </DialogTitle>
                <DialogContent dividers>
                    <TableContainer>
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
                                    <TableCell padding="checkbox" />
                                    <TableCell>รายการ</TableCell>
                                    <TableCell align="right">จำนวน</TableCell>
                                    <TableCell>วิธีขนส่ง</TableCell>
                                    <TableCell align="right">ราคา</TableCell>
                                    <TableCell align="right">รวม</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {confirmQuotationRows.length ? (
                                    confirmQuotationRows.map((row) => (
                                        <TableRow key={row.key} hover>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={selectedConfirmQuotationRowKeys.includes(row.key)}
                                                    onChange={() => toggleConfirmQuotationRow(row.key)}
                                                    disabled={!row.detailId}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Stack spacing={0.25}>
                                                    <Typography variant="body2" fontWeight={700}>
                                                        {row.quotationItem.name || row.optionName}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {row.quotationItem.spec || '-'}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="right">{formatNumber(row.quantity)}</TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    {isSeaShippingMethod(row.shippingMethod) ? (
                                                        <DirectionsBoat fontSize="small" sx={{ color: '#00897b' }} />
                                                    ) : (
                                                        <LocalShipping fontSize="small" sx={{ color: '#1565c0' }} />
                                                    )}
                                                    <Typography variant="body2">
                                                        {getShippingMethodLabel(
                                                            row.shippingMethod,
                                                            '-',
                                                            row.isFcl,
                                                            row.isShareFCL
                                                        )}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="right">{formatNumber(row.unitPrice)}</TableCell>
                                            <TableCell align="right">
                                                {formatNumber(row.quantity * row.unitPrice)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                            {isRfqFetching ? 'กำลังโหลดข้อมูล...' : 'ยังไม่มีรายการใบเสนอราคาสำหรับคอนเฟิร์มราคา'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setVisibleConfirmPriceDialog(false)}>ยกเลิก</Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirmQuotationPrice}
                        disabled={!confirmQuotationRows.length}>
                        ยืนยัน
                    </Button>
                </DialogActions>
            </Dialog>
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
                    setDraftCoSaleId(freelanceSale.id || '');
                    setSelectedFreelanceSaleItem(freelanceSale);
                    setSelectedFreelanceSaleLabel(`${freelanceSale.id} - ${freelanceSale.name}`);
                    setOpenSearchFreelanceSalesDialog(false);
                }}
            />
            <CreateFreelanceSaleDialog
                open={openCreateFreelanceSaleDialog}
                onClose={() => setOpenCreateFreelanceSaleDialog(false)}
                defaultSaleCoverage={salesId}
                customerLabel={draftCustomerSnapshot.customerName || quotation?.customer?.customerName || ''}
                onCreated={(freelanceSale) => {
                    setDraftCoSaleId(freelanceSale.id || '');
                    setSelectedFreelanceSaleItem(freelanceSale);
                    setSelectedFreelanceSaleLabel(`${freelanceSale.id} - ${freelanceSale.name}`);
                    setOpenCreateFreelanceSaleDialog(false);
                }}
            />
        </Page>
    );
}

function Info({ label, value, asTextField = false }: { label: string; value?: string | null; asTextField?: boolean }) {
    if (asTextField) {
        return (
            <TextField
                label={label}
                value={value || '-'}
                fullWidth
                InputProps={{ readOnly: true }}
            />
        );
    }

    return (
        <Stack spacing={0.25}>
            <Typography color="text.secondary" fontWeight={700}>
                {label}
            </Typography>
            <Typography variant="body2">{value || '-'}</Typography>
        </Stack>
    );
}

function Summary({ label, value, strong = false, asTextField = false }: { label: string; value?: number | null; strong?: boolean; asTextField?: boolean }) {
    if (asTextField) {
        return (
            <TextField
                label={label}
                value={formatNumber(value || 0)}
                fullWidth
                InputProps={{ readOnly: true }}
            />
        );
    }

    return (
        <Stack direction="row" justifyContent="space-between" spacing={1}>
            <Typography variant="body2" fontWeight={strong ? 700 : 400}>
                {label}
            </Typography>
            <Typography variant="body2" fontWeight={strong ? 700 : 400}>
                {formatNumber(value || 0)}
            </Typography>
        </Stack>
    );
}
