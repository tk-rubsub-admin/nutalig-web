import {
  ArrowBackIos,
  ArrowDropDown,
  Block,
  Description,
  Menu as MenuIcon
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
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import ActivityHistoryTimeline from 'components/ActivityHistoryTimeline';
import ConfirmDialog from 'components/ConfirmDialog';
import DocumentFlow, { DocumentFlowItem } from 'components/DocumentFlow';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import { GridSearchSection, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { MouseEvent as ReactMouseEvent, ReactElement, SyntheticEvent, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { getActivityHistory } from 'services/ActivityHistory/activity-history-api';
import { getInvoice } from 'services/Invoice/invoice-api';
import { InvoiceRecord } from 'services/Invoice/invoice-type';
import { getReceipt, viewReceipt, voidReceipt } from 'services/Receipt/receipt-api';
import { ReceiptItem, ReceiptRecord } from 'services/Receipt/receipt-type';
import { getSalesOrderV1 } from 'services/SaleOrder/sale-order-api';
import { SalesOrderV1 } from 'services/SaleOrder/sale-order-type';
import { DownloadDocumentResponse } from 'services/general-type';
import { base64ToBlob } from 'utils';
import { formatDate } from 'utils';
import { getDocumentStatusChipSx, getDocumentStatusLabel } from 'utils/documentStatus';
import { formatNumber } from 'utils/utils';

interface ReceiptDetailParams {
  id: string;
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

function getEmployeeName(receipt?: ReceiptRecord): string {
  const employee = receipt?.saleAccount;
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

function getCustomerLabel(receipt?: ReceiptRecord): string {
  const customer = receipt?.customer as any;
  if (!customer) return '-';
  return (
    [customer.id ? `(${customer.id})` : '', customer.customerName || customer.companyName || '']
      .filter(Boolean)
      .join(' ') || '-'
  );
}

function receiptTypeLabel(type?: string | null): string {
  switch (type) {
    case 'RECEIPT':
      return 'ใบเสร็จรับเงิน';
    case 'DEPOSIT_RECEIPT':
      return 'ใบรับเงินมัดจำ';
    case 'RECEIPT_TAX_INVOICE':
      return 'ใบเสร็จรับเงิน/ใบกำกับภาษี';
    case 'DEPOSIT_TAX_INVOICE':
      return 'ใบรับเงินมัดจำ/ใบกำกับภาษี';
    default:
      return type || '-';
  }
}

function paymentMethodLabel(paymentMethod?: string | null): string {
  switch (paymentMethod) {
    case 'TRANSFER':
      return 'โอนเงิน';
    case 'CHEQUE':
      return 'เช็ค';
    case 'CASH':
      return 'เงินสด';
    default:
      return '-';
  }
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

export default function ReceiptDetail(): ReactElement {
  const { id } = useParams<ReceiptDetailParams>();
  const history = useHistory();
  const { t } = useTranslation();
  const theme = useTheme();
  const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
  const [tab, setTab] = useState<'detail' | 'history'>('detail');
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [isVoidConfirmOpen, setIsVoidConfirmOpen] = useState(false);

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
    data: receipt,
    isFetching,
    refetch: refetchReceipt
  } = useQuery(['receipt-detail', id], () => getReceipt(id), {
    enabled: Boolean(id),
    refetchOnWindowFocus: false
  });

  const {
    data: activityHistory = [],
    isFetching: isActivityHistoryFetching,
    refetch: refetchActivityHistory
  } = useQuery(['receipt-activity-history', id], () => getActivityHistory('RECEIPT', id), {
    enabled: Boolean(id),
    refetchOnWindowFocus: false
  });

  const {
    data: relatedInvoice,
    isFetching: isInvoiceFlowFetching
  } = useQuery(['receipt-invoice', receipt?.invoiceNo], () => getInvoice(receipt?.invoiceNo as string), {
    enabled: Boolean(receipt?.invoiceNo),
    refetchOnWindowFocus: false
  });

  const {
    data: relatedSalesOrder,
    isFetching: isSalesOrderFlowFetching
  } = useQuery(
    ['receipt-sales-order', receipt?.salesOrderNo],
    () => getSalesOrderV1(receipt?.salesOrderNo as string),
    {
      enabled: Boolean(receipt?.salesOrderNo),
      refetchOnWindowFocus: false
    }
  );

  const summary = useMemo(() => {
    return {
      subTotal: Number(receipt?.subTotal || 0),
      discount: Number(receipt?.discount || 0),
      amount: Number(receipt?.amount || 0),
      vat: Number(receipt?.vat || 0),
      grandTotal: Number(receipt?.grandTotal || 0)
    };
  }, [receipt]);

  const isActionMenuOpen = Boolean(actionMenuAnchorEl);
  const isVoidReceiptEnabled = Boolean(receipt && receipt.status !== 'VOID');
  const documentFlowItems: DocumentFlowItem[] = [
    {
      title: 'คำขอราคา',
      docNo: relatedSalesOrder?.rfqId || null,
      onOpen: relatedSalesOrder?.rfqId
        ? () =>
            window.open(
              ROUTE_PATHS.RFQ_DETAIL.replace(':id', String(relatedSalesOrder.rfqId)),
              '_blank',
              'noopener,noreferrer'
            )
        : undefined
    },
    {
      title: 'ใบเสนอราคา',
      docNo: receipt?.quotationNo || relatedInvoice?.quotationNo || null,
      onOpen: receipt?.quotationNo || relatedInvoice?.quotationNo
        ? () =>
            window.open(
              ROUTE_PATHS.QUOTATION_DETAIL.replace(
                ':id',
                String(receipt?.quotationNo || relatedInvoice?.quotationNo)
              ),
              '_blank',
              'noopener,noreferrer'
            )
        : undefined
    },
    {
      title: 'ใบยืนยันสั่งซื้อ',
      docNo: receipt?.salesOrderNo || relatedInvoice?.salesOrderNo || null,
      status: relatedSalesOrder?.status || null,
      statusProfile: relatedSalesOrder?.statusProfile,
      isLoading: isSalesOrderFlowFetching,
      onOpen: receipt?.salesOrderNo || relatedInvoice?.salesOrderNo
        ? () =>
            window.open(
              ROUTE_PATHS.SALE_ORDER_DETAIL.replace(
                ':id',
                String(receipt?.salesOrderNo || relatedInvoice?.salesOrderNo)
              ),
              '_blank',
              'noopener,noreferrer'
            )
        : undefined
    },
    {
      title: 'ใบแจ้งหนี้',
      docNo: receipt?.invoiceNo || null,
      status: relatedInvoice?.status || null,
      statusProfile: relatedInvoice?.statusProfile,
      isLoading: isInvoiceFlowFetching,
      onOpen: receipt?.invoiceNo
        ? () => window.open(ROUTE_PATHS.INVOICE_DETAIL.replace(':id', receipt.invoiceNo), '_blank', 'noopener,noreferrer')
        : undefined
    },
    {
      title: 'ใบเสร็จรับเงิน',
      docNo: receipt?.receiptNo || null,
      status: receipt?.status || null,
      statusProfile: receipt?.statusProfile,
      isCurrent: true,
      onOpen: receipt?.receiptNo
        ? () => window.open(ROUTE_PATHS.RECEIPT_DETAIL.replace(':id', receipt.receiptNo), '_blank', 'noopener,noreferrer')
        : undefined
    }
  ];

  const handleChangeTab = (_event: SyntheticEvent, value: 'detail' | 'history') => {
    setTab(value);
  };

  const handleOpenActionMenu = (event: ReactMouseEvent<HTMLElement>) => {
    setActionMenuAnchorEl(event.currentTarget);
  };

  const handleCloseActionMenu = () => {
    setActionMenuAnchorEl(null);
  };

  const handleViewReceipt = async () => {
    if (!receipt?.receiptNo) {
      return;
    }

    handleCloseActionMenu();

    await toast.promise(viewReceipt(receipt.receiptNo, true, false), {
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
          anchor.download = file.fileName || `${receipt.receiptNo}.pdf`;
          anchor.click();
          URL.revokeObjectURL(url);
        });

        return t('toast.success');
      },
      error: t('toast.failed')
    });
  };

  const handleOpenVoidConfirm = () => {
    handleCloseActionMenu();
    setIsVoidConfirmOpen(true);
  };

  const handleVoidReceipt = async () => {
    if (!receipt?.receiptNo) {
      return;
    }

    await toast.promise(voidReceipt(receipt.receiptNo), {
      loading: t('toast.loading'),
      success: async () => {
        setIsVoidConfirmOpen(false);
        await Promise.all([refetchReceipt(), refetchActivityHistory()]);
        return t('toast.success');
      },
      error: (error: any) => error?.response?.data?.message || t('toast.failed')
    });
  };

  return (
    <Page>
      <LoadingDialog open={isFetching || isActivityHistoryFetching} />
      <PageTitle title={receipt?.receiptNo ? `ใบเสร็จรับเงินเลขที่ ${receipt.receiptNo}` : 'รายละเอียดใบเสร็จรับเงิน'}>
        {receipt?.status ? (
          <Chip
            label={getDocumentStatusLabel(receipt.status, receipt.statusProfile)}
            size="small"
            sx={getDocumentStatusChipSx(receipt.status, receipt.statusProfile)}
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
            disabled={!receipt}
            aria-controls={isActionMenuOpen ? 'receipt-action-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={isActionMenuOpen ? 'true' : undefined}>
            ตัวเลือก
          </Button>
          <Menu
            id="receipt-action-menu"
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
            <MenuItem onClick={handleViewReceipt} disabled={!receipt} sx={{ width: '100%' }}>
              <ListItemIcon>
                <Description fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="ดูใบเสร็จรับเงิน" />
            </MenuItem>
            <MenuItem
              onClick={handleOpenVoidConfirm}
              disabled={!isVoidReceiptEnabled}
              sx={{ width: '100%' }}>
              <ListItemIcon>
                <Block fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Void ใบเสร็จรับเงิน" />
            </MenuItem>
          </Menu>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-cool-grey"
            startIcon={<ArrowBackIos />}
            onClick={() => history.push(ROUTE_PATHS.RECEIPT_MANAGEMENT)}>
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
                  <Typography variant="h6">ข้อมูลใบเสร็จรับเงิน</Typography>
                  <Info label="เลขที่ใบเสร็จรับเงิน" value={receipt?.receiptNo} />
                  <Info label="ประเภทเอกสาร" value={receiptTypeLabel(receipt?.receiptType)} />
                  <Info label="อ้างอิงใบแจ้งหนี้" value={receipt?.invoiceNo} />
                  <Info label="อ้างอิงใบยืนยันสั่งซื้อ" value={receipt?.salesOrderNo} />
                  <Info label="วันที่เอกสาร" value={receipt?.docDate} />
                  <Info
                    label="วันที่รับชำระ"
                    value={receipt?.paidDate ? formatDate(receipt.paidDate, 'DD/MM/YYYY HH:mm') : '-'}
                  />
                  <Info label="สกุลเงิน" value={receipt?.currency || 'THB'} />
                  <Info label="Revision" value={receipt?.revNo ?? '-'} />
                </Stack>
              </Grid>

              <Grid item xs={12} md={4}>
                <Stack spacing={1.25} className={classes.section}>
                  <Typography variant="h6">ข้อมูลลูกค้า</Typography>
                  <Info label={t('customerManagement.customer')} value={getCustomerLabel(receipt)} />
                  <Info label="ที่อยู่" value={receipt?.customerAddress?.fullAddress || receipt?.customerAddressSnapshot || '-'} />
                  <Info label="ผู้ติดต่อ" value={receipt?.customerContact?.contactName || receipt?.customerContactSnapshot || '-'} />
                  <Info label="เบอร์ติดต่อ" value={receipt?.customerContact?.contactNumber || receipt?.customerPhoneSnapshot || '-'} />
                </Stack>
              </Grid>

              <Grid item xs={12} md={4}>
                <Stack spacing={1.25} className={classes.section}>
                  <Typography variant="h6">ข้อมูลการรับชำระเงิน</Typography>
                  <Info label="ฝ่ายขาย" value={getEmployeeName(receipt)} />
                  <Info label="วิธีการชำระเงิน" value={paymentMethodLabel(receipt?.paymentMethod)} />
                  <Info
                    label="ข้อมูลเช็ค"
                    value={
                      receipt?.paymentMethod === 'CHEQUE'
                        ? [
                            receipt.chequeBank ? `ธนาคาร ${receipt.chequeBank}` : null,
                            receipt.chequeNo ? `เลขที่ ${receipt.chequeNo}` : null,
                            receipt.chequeDate ? `วันที่ ${receipt.chequeDate}` : null,
                            receipt.chequeBranch ? `สาขา ${receipt.chequeBranch}` : null
                          ]
                            .filter(Boolean)
                            .join(' | ') || '-'
                        : '-'
                    }
                  />
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Stack spacing={1.25} className={classes.section}>
                  <Typography variant="h6">หมายเหตุ</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {receipt?.remark || '-'}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>

            <GridSearchSection container>
              {isDownSm ? (
                <Stack spacing={1.25} sx={{ width: '100%' }}>
                  {receipt?.items?.length ? (
                    receipt.items.map((item: ReceiptItem, index: number) => (
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
                          <Info label="รายละเอียด" value={item.spec || '-'} />
                          <Grid container spacing={1.25}>
                            <Grid item xs={6}>
                              <Info label="ราคาต่อหน่วย" value={formatNumber(item.unitPrice || 0)} />
                            </Grid>
                            <Grid item xs={6}>
                              <Info label="จำนวน" value={formatNumber(item.quantity || 0)} />
                            </Grid>
                            <Grid item xs={12}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 1.25, py: 1, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
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
                  <Table>
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
                      {receipt?.items?.length ? (
                        receipt.items.map((item: ReceiptItem, index: number) => (
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
                  <Typography variant="h6">สรุปยอด</Typography>
                  <Summary label="ยอดก่อนภาษี" value={summary.subTotal} />
                  <Summary label="ส่วนลด" value={summary.discount} />
                  <Summary label="จำนวนเงิน" value={summary.amount} />
                  <Summary label="ภาษีมูลค่าเพิ่ม" value={summary.vat} />
                  <Summary label="จำนวนเงินทั้งสิ้น" value={summary.grandTotal} strong />
                </Stack>
              </Grid>
            </GridSearchSection>
          </>
        </TabPanel>

        <TabPanel value="history" currentTab={tab}>
          <ActivityHistoryTimeline records={activityHistory} />
        </TabPanel>
      </Wrapper>
      <ConfirmDialog
        open={isVoidConfirmOpen}
        title="ยืนยัน Void ใบเสร็จรับเงิน"
        message={`คุณยืนยัน Void ใบเสร็จรับเงิน ${receipt?.receiptNo || ''} ใช่หรือไม่`}
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        isShowCancelButton
        isShowConfirmButton
        onConfirm={handleVoidReceipt}
        onCancel={() => setIsVoidConfirmOpen(false)}
      />
    </Page>
  );
}
