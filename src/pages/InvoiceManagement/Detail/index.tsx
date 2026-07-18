import {
  ArrowBackIos,
  ArrowDropDown,
  Description,
  FilePresent,
  Menu as MenuIcon,
  NoteAdd,
  NotificationsActive,
  Payment
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Grid,
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
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { makeStyles } from '@mui/styles';
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
  useMemo,
  useState
} from 'react';
import ReceivePaymentDialog from './ReceivePaymentDialog';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { IoPencil } from 'react-icons/io5';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { getActivityHistory } from 'services/ActivityHistory/activity-history-api';
import {
  getInvoice,
  receiveInvoicePayment,
  sendAwaitingValidationNotification,
  viewInvoice
} from 'services/Invoice/invoice-api';
import { searchReceipts, viewReceipt } from 'services/Receipt/receipt-api';
import { ReceiptRecord } from 'services/Receipt/receipt-type';
import { InvoiceItem, InvoiceRecord } from 'services/Invoice/invoice-type';
import { getSalesOrderV1 } from 'services/SaleOrder/sale-order-api';
import { SalesOrderV1 } from 'services/SaleOrder/sale-order-type';
import { DownloadDocumentResponse } from 'services/general-type';
import { base64ToBlob } from 'utils';
import { formatDate } from 'utils';
import { getDocumentStatusChipSx, getDocumentStatusLabel } from 'utils/documentStatus';
import { formatNumber } from 'utils/utils';
import Can from 'auth/Can';
import { PERMISSIONS } from 'auth/permissions';

interface InvoiceDetailParams {
  id: string;
}

const getTodayDateInputValue = () => new Date().toISOString().slice(0, 10);

const toPaymentDateTimeIso = (dateValue: string) => {
  const now = new Date();
  const [year, month, day] = dateValue.split('-').map(Number);
  const paymentDateTime = new Date(
    year,
    (month || 1) - 1,
    day || 1,
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds()
  );
  return paymentDateTime.toISOString();
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

function getEmployeeName(invoice?: InvoiceRecord): string {
  const employee = invoice?.saleAccount;
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

function getCustomerLabel(invoice?: InvoiceRecord): string {
  const customer = invoice?.customer as any;
  if (!customer) return '-';
  return (
    [customer.id ? `(${customer.id})` : '', customer.customerName || customer.companyName || '']
      .filter(Boolean)
      .join(' ') || '-'
  );
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

export default function InvoiceDetail(): ReactElement {
  const { id } = useParams<InvoiceDetailParams>();
  const history = useHistory();
  const { t } = useTranslation();
  const theme = useTheme();
  const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
  const [tab, setTab] = useState<'detail' | 'history'>('detail');
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [receivePaymentDialogOpen, setReceivePaymentDialogOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(getTodayDateInputValue);
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'CHEQUE' | 'CASH'>('TRANSFER');
  const [chequeBank, setChequeBank] = useState('');
  const [chequeNo, setChequeNo] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [chequeBranch, setChequeBranch] = useState('');
  const [paymentSlipFiles, setPaymentSlipFiles] = useState<File[]>([]);
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
    }
  });
  const classes = useStyles();

  const {
    data: invoice,
    isFetching,
    refetch: refetchInvoice
  } = useQuery(['invoice-detail', id], () => getInvoice(id), {
    enabled: Boolean(id),
    refetchOnWindowFocus: false
  });

  const {
    data: activityHistory = [],
    isFetching: isActivityHistoryFetching,
    refetch: refetchActivityHistory
  } = useQuery(['invoice-activity-history', id], () => getActivityHistory('INVOICE', id), {
    enabled: Boolean(id),
    refetchOnWindowFocus: false
  });

  const {
    data: relatedReceiptsResponse,
    isFetching: isReceiptFlowFetching
  } = useQuery(
    ['invoice-receipts', invoice?.invoiceNo],
    () =>
      searchReceipts(
        {
          keyword: invoice?.invoiceNo
        },
        1,
        10
      ),
    {
      enabled: Boolean(invoice?.invoiceNo),
      refetchOnWindowFocus: false
    }
  );

  const {
    data: relatedSalesOrder,
    isFetching: isSalesOrderFlowFetching
  } = useQuery(
    ['invoice-sales-order', invoice?.salesOrderNo],
    () => getSalesOrderV1(invoice?.salesOrderNo as string),
    {
      enabled: Boolean(invoice?.salesOrderNo),
      refetchOnWindowFocus: false
    }
  );

  const summary = useMemo(() => {
    return {
      subTotal: Number(invoice?.subTotal || 0),
      discount: Number(invoice?.discount || 0),
      amount: Number(invoice?.amount || 0),
      vat: Number(invoice?.vat || 0),
      grandTotal: Number(invoice?.grandTotal || 0),
      paidTotal: Number(invoice?.paidTotal || 0),
      outstandingTotal: Number(invoice?.outstandingTotal || 0)
    };
  }, [invoice]);

  const isReceivePaymentEnabled = Boolean(
    invoice && ['ISSUED', 'PARTIALLY_PAID'].includes(invoice.status)
  );
  const relatedReceipts = relatedReceiptsResponse?.data?.records || [];
  const latestReceipt =
    relatedReceipts.find((record) => record.invoiceNo === invoice?.invoiceNo) || relatedReceipts[0] || null;

  const documentFlowItems: DocumentFlowItem[] = [
    {
      title: 'ใบเสนอราคา',
      docNo: invoice?.quotationNo || null,
      statusProfile: undefined,
      onOpen: invoice?.quotationNo
        ? () => window.open(ROUTE_PATHS.QUOTATION_DETAIL.replace(':id', invoice.quotationNo as string), '_blank', 'noopener,noreferrer')
        : undefined
    },
    {
      title: 'ใบยืนยันสั่งซื้อ',
      docNo: invoice?.salesOrderNo || null,
      status: relatedSalesOrder?.status || null,
      statusProfile: relatedSalesOrder?.statusProfile,
      isLoading: isSalesOrderFlowFetching,
      onOpen: invoice?.salesOrderNo
        ? () => window.open(ROUTE_PATHS.SALE_ORDER_DETAIL.replace(':id', invoice.salesOrderNo as string), '_blank', 'noopener,noreferrer')
        : undefined
    },
    {
      title: 'ใบแจ้งหนี้',
      docNo: invoice?.invoiceNo || null,
      status: invoice?.status || null,
      statusProfile: invoice?.statusProfile,
      isCurrent: true,
      onOpen: invoice?.invoiceNo
        ? () => window.open(ROUTE_PATHS.INVOICE_DETAIL.replace(':id', invoice.invoiceNo), '_blank', 'noopener,noreferrer')
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

  const handleChangeTab = (_event: SyntheticEvent, value: 'detail' | 'history') => {
    setTab(value);
  };

  const isActionMenuOpen = Boolean(actionMenuAnchorEl);

  const handleOpenActionMenu = (event: ReactMouseEvent<HTMLElement>) => {
    setActionMenuAnchorEl(event.currentTarget);
  };

  const handleCloseActionMenu = () => {
    setActionMenuAnchorEl(null);
  };

  const handleSelectEditInvoice = () => {
    handleCloseActionMenu();
    toast.error('ระบบยังไม่รองรับการแก้ไขใบแจ้งหนี้');
  };

  const handleOpenReceivePaymentDialog = () => {
    handleCloseActionMenu();
    setPaymentDate(getTodayDateInputValue());
    setPaymentMethod('TRANSFER');
    setChequeBank('');
    setChequeNo('');
    setChequeDate('');
    setChequeBranch('');
    setPaymentSlipFiles([]);
    setReceivePaymentDialogOpen(true);
  };

  const handleCloseReceivePaymentDialog = () => {
    setReceivePaymentDialogOpen(false);
  };

  const handleSubmitReceivePayment = () => {
    if (!invoice?.invoiceNo || !paymentDate || paymentSlipFiles.length === 0) {
      return;
    }

    const formData = new FormData();
    formData.append('paymentDate', toPaymentDateTimeIso(paymentDate));
    formData.append('amount', String(summary.outstandingTotal || 0));
    formData.append('paymentMethod', paymentMethod);
    if (paymentMethod === 'CHEQUE') {
      formData.append('chequeBank', chequeBank);
      formData.append('chequeNo', chequeNo);
      formData.append('chequeDate', chequeDate);
      formData.append('chequeBranch', chequeBranch);
    }
    if (paymentMethod === 'TRANSFER' && paymentSlipFiles[0]) {
      formData.append('slipFile', paymentSlipFiles[0]);
    }

    void toast.promise(receiveInvoicePayment(invoice.invoiceNo, formData), {
      loading: t('toast.loading'),
      success: () => t('toast.success'),
      error: (error) => error?.response?.data?.message || t('toast.failed')
    }).then(async () => {
      setReceivePaymentDialogOpen(false);
      await Promise.all([refetchInvoice(), refetchActivityHistory()]);
    });
  };

  const handleViewInvoice = async () => {
    if (!invoice?.invoiceNo) {
      return;
    }

    handleCloseActionMenu();

    await toast.promise(viewInvoice(invoice.invoiceNo, true, false), {
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
          anchor.download = file.fileName || `${invoice.invoiceNo}.pdf`;
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

  const handleSendAwaitingValidationNotification = async (paymentId: number) => {
    if (!invoice?.invoiceNo) {
      return;
    }

    await toast.promise(sendAwaitingValidationNotification(invoice.invoiceNo, paymentId), {
      loading: t('toast.loading'),
      success: () => t('toast.success'),
      error: (error) => error?.response?.data?.message || t('toast.failed')
    });
    await Promise.all([refetchInvoice(), refetchActivityHistory()]);
  };

  return (
    <Page>
      <LoadingDialog open={isFetching || isActivityHistoryFetching} />
      <PageTitle
        title={
          invoice?.invoiceNo
            ? `ใบแจ้งหนี้เลขที่ ${invoice.invoiceNo}`
            : t('documentManagement.invoice.title')
        }>
        {invoice?.status ? (
          <Chip
            label={getDocumentStatusLabel(invoice.status, invoice.statusProfile)}
            size="small"
            sx={getDocumentStatusChipSx(invoice.status, invoice.statusProfile)}
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
            disabled={!invoice}
            aria-controls={isActionMenuOpen ? 'invoice-action-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={isActionMenuOpen ? 'true' : undefined}>
            ตัวเลือก
          </Button>
          <Menu
            id="invoice-action-menu"
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
            <MenuItem onClick={handleViewInvoice} disabled={!invoice} sx={{ width: '100%' }}>
              <ListItemIcon>
                <Description fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="ดูใบแจ้งหนี้" />
            </MenuItem>
            <Can permission={PERMISSIONS.RECEIVE_PAYMENT}>
              <MenuItem
                onClick={handleOpenReceivePaymentDialog}
                disabled={!isReceivePaymentEnabled}
                sx={{ width: '100%' }}>
                <ListItemIcon>
                  <Payment fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="รับชำระเงิน" />
              </MenuItem>
            </Can>
            <MenuItem
              onClick={handleSelectEditInvoice}
              disabled={!isReceivePaymentEnabled}
              sx={{ width: '100%' }}>
              <ListItemIcon>
                <IoPencil />
              </ListItemIcon>
              <ListItemText primary="แก้ไขใบแจ้งหนี้" />
            </MenuItem>
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
          </Tabs>
        </Box>

        <TabPanel value="detail" currentTab={tab}>
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Stack spacing={1.25} className={classes.section}>
                  <Typography variant="h6">
                    {t('documentManagement.invoice.generalSection')}
                  </Typography>
                  <Info label={t('documentManagement.invoice.title')} value={invoice?.invoiceNo} />
                  <Info
                    label={t('documentManagement.invoice.referenceSalesOrder')}
                    value={invoice?.salesOrderNo}
                  />
                  <Info label={t('documentManagement.invoice.docDate')} value={invoice?.docDate} />
                  <Info label={t('documentManagement.invoice.dueDate')} value={invoice?.dueDate} />
                  <Info
                    label={t('documentManagement.invoice.currency')}
                    value={invoice?.currency || 'THB'}
                  />
                  <Info label="Revision" value={invoice?.revNo ?? '-'} />
                </Stack>
              </Grid>

              <Grid item xs={12} md={4}>
                <Stack spacing={1.25} className={classes.section}>
                  <Typography variant="h6">
                    {t('documentManagement.invoice.customerSection.title')}
                  </Typography>
                  <Info
                    label={t('customerManagement.customer')}
                    value={getCustomerLabel(invoice)}
                  />
                  <Info
                    label={t('documentManagement.invoice.customerSection.address')}
                    value={invoice?.customerAddress?.fullAddress || '-'}
                  />
                  <Info
                    label={t('documentManagement.invoice.customerSection.contactName')}
                    value={invoice?.customerContact?.contactName || '-'}
                  />
                  <Info
                    label={t('documentManagement.invoice.customerSection.contactNumber')}
                    value={invoice?.customerContact?.contactNumber || '-'}
                  />
                </Stack>
              </Grid>

              <Grid item xs={12} md={4}>
                <Stack spacing={1.25} className={classes.section}>
                  <Typography variant="h6">
                    {t('documentManagement.invoice.salesSection.title')}
                  </Typography>
                  <Info
                    label={t('documentManagement.invoice.salesSection.salesAccount')}
                    value={getEmployeeName(invoice)}
                  />
                  <Info
                    label={t('documentManagement.invoice.salesSection.coSalesAccount')}
                    value={invoice?.coSaleId || '-'}
                  />
                  <Info
                    label={t('documentManagement.invoice.salesSection.status')}
                    value={getDocumentStatusLabel(invoice?.status, invoice?.statusProfile)}
                  />
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Stack spacing={1.25} className={classes.section}>
                  <Typography variant="h6">{t('documentManagement.invoice.remark')}</Typography>
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {invoice?.remark || '-'}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>

            <GridSearchSection container>
              {isDownSm ? (
                <Stack spacing={1.25} sx={{ width: '100%' }}>
                  {invoice?.items?.length ? (
                    invoice.items.map((item: InvoiceItem, index: number) => (
                      <Stack key={item.id || index} spacing={1.25} className={classes.mobileItemCard}>
                        <Stack spacing={0.35} className={classes.mobileItemHeader}>
                          <Typography variant="caption" color="text.secondary" fontWeight={700}>
                            รายการที่ {item.lineNo || index + 1}
                          </Typography>
                          <Typography variant="body2" fontWeight={700} sx={{ wordBreak: 'break-word' }}>
                            {item.name || '-'}
                          </Typography>
                        </Stack>
                        <Stack spacing={1}>
                          <Info label={t('documentManagement.invoice.itemSection.spec')} value={item.spec || '-'} />
                          <Grid container spacing={1.25}>
                            <Grid item xs={6}>
                              <Info label={t('documentManagement.invoice.itemSection.unitPrice')} value={formatNumber(item.unitPrice || 0)} />
                            </Grid>
                            <Grid item xs={6}>
                              <Info label={t('documentManagement.invoice.itemSection.quantity')} value={formatNumber(item.quantity || 0)} />
                            </Grid>
                            <Grid item xs={12}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 1.25, py: 1, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                  {t('documentManagement.invoice.itemSection.totalAmount')}
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
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell align="center" className={`${classes.tableHeader} ${classes.fitContentCell}`}>#</TableCell>
                        <TableCell className={`${classes.tableHeader} ${classes.fitContentCell}`}>{t('documentManagement.invoice.itemSection.name')}</TableCell>
                        <TableCell className={`${classes.tableHeader} ${classes.specCell}`}>{t('documentManagement.invoice.itemSection.spec')}</TableCell>
                        <TableCell align="right" className={`${classes.tableHeader} ${classes.fitContentCell}`}>{t('documentManagement.invoice.itemSection.unitPrice')}</TableCell>
                        <TableCell align="right" className={`${classes.tableHeader} ${classes.fitContentCell}`}>{t('documentManagement.invoice.itemSection.quantity')}</TableCell>
                        <TableCell align="right" className={`${classes.tableHeader} ${classes.fitContentCell}`}>{t('documentManagement.invoice.itemSection.totalAmount')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoice?.items?.length ? (
                        invoice.items.map((item: InvoiceItem, index: number) => (
                          <TableRow key={item.id || index}>
                            <TableCell align="center" className={classes.fitContentCell}>{item.lineNo || index + 1}</TableCell>
                            <TableCell className={classes.fitContentCell}>{item.name || '-'}</TableCell>
                            <TableCell className={classes.specCell}>{item.spec || '-'}</TableCell>
                            <TableCell align="right" className={classes.fitContentCell}>{formatNumber(item.unitPrice || 0)}</TableCell>
                            <TableCell align="right" className={classes.fitContentCell}>{formatNumber(item.quantity || 0)}</TableCell>
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
                  <Typography variant="h6">
                    {t('documentManagement.invoice.summarySection.title')}
                  </Typography>
                  <Summary
                    label={t('documentManagement.invoice.summarySection.subtotal')}
                    value={summary.subTotal}
                  />
                  <Summary
                    label={t('documentManagement.invoice.summarySection.discount')}
                    value={summary.discount}
                  />
                  <Summary
                    label={t('documentManagement.invoice.summarySection.depositAmount')}
                    value={summary.amount}
                  />
                  <Summary
                    label={t('documentManagement.invoice.summarySection.vat')}
                    value={summary.vat}
                  />
                  <Summary
                    label={t('documentManagement.invoice.summarySection.grandTotal')}
                    value={summary.grandTotal}
                    strong
                  />
                  <Summary label="ชำระแล้ว" value={summary.paidTotal} />
                  <Summary label="คงเหลือ" value={summary.outstandingTotal} />
                </Stack>
              </Grid>
            </GridSearchSection>

            <GridSearchSection container sx={{ mt: 0 }}>
              <Grid item xs={12}>
                <Stack spacing={1.25} className={classes.section}>
                  <Typography variant="h6">ประวัติการรับชำระเงิน</Typography>
                  {invoice?.payments?.length ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
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
                          {invoice.payments.map((payment) => (
                            <TableRow key={payment.id}>
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
                                {invoice.status === 'AWAITING_VALIDATION' ? (
                                  <Tooltip title="ส่งแจ้งเตือน">
                                    <Button
                                      size="small"
                                      variant="text"
                                      onClick={() => {
                                        void handleSendAwaitingValidationNotification(payment.id);
                                      }}>
                                      <NotificationsActive />
                                    </Button>
                                  </Tooltip>
                                ) : null}
                              </TableCell>
                            </TableRow>
                          ))}
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
          </>
        </TabPanel>

        <TabPanel value="history" currentTab={tab}>
          <ActivityHistoryTimeline records={activityHistory} />
        </TabPanel>
        <ReceivePaymentDialog
          open={receivePaymentDialogOpen}
          invoiceNo={invoice?.invoiceNo}
          paymentDate={paymentDate}
          amount={summary.outstandingTotal}
          paymentMethod={paymentMethod}
          chequeBank={chequeBank}
          chequeNo={chequeNo}
          chequeDate={chequeDate}
          chequeBranch={chequeBranch}
          slipFiles={paymentSlipFiles}
          onClose={handleCloseReceivePaymentDialog}
          onPaymentDateChange={setPaymentDate}
          onPaymentMethodChange={setPaymentMethod}
          onChequeBankChange={setChequeBank}
          onChequeNoChange={setChequeNo}
          onChequeDateChange={setChequeDate}
          onChequeBranchChange={setChequeBranch}
          onSlipFilesChange={setPaymentSlipFiles}
          onSubmit={handleSubmitReceivePayment}
        />
      </Wrapper>
    </Page>
  );
}
