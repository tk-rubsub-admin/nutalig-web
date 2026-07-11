import {
  ArrowBackIos,
  ArrowDropDown,
  Cancel,
  CancelPresentation,
  DeleteOutline,
  Description,
  Edit,
  FilePresent,
  Menu as MenuIcon,
  Save,
  TaskAlt
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
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import ActivityHistoryTimeline from 'components/ActivityHistoryTimeline';
import ConfirmDialog from 'components/ConfirmDialog';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import { Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import {
  ChangeEvent,
  MouseEvent as ReactMouseEvent,
  ReactElement,
  SyntheticEvent,
  useEffect,
  useMemo,
  useState
} from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { getActivityHistory } from 'services/ActivityHistory/activity-history-api';
import {
  cancelPurchaseOrder,
  closePurchaseOrder,
  deletePurchaseOrderAttachment,
  getPurchaseOrder,
  viewPurchaseOrder,
  updatePurchaseOrder,
  uploadPurchaseOrderAttachments
} from 'services/PurchaseOrder/purchase-order-api';
import {
  PurchaseOrderItem,
  PurchaseOrderRecord,
  UpdatePurchaseOrderRequest
} from 'services/PurchaseOrder/purchase-order-type';
import { base64ToBlob } from 'utils';
import { formatNumber } from 'utils/utils';

interface PurchaseOrderDetailParams {
  id: string;
}

interface PurchaseOrderDraft {
  docDate: string;
  productionLeadTimeDay: string;
  shippingLeadTimeDay: string;
  remark: string;
  items: PurchaseOrderItem[];
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

function Info({ label, value }: { label: string; value?: string | number | null }): ReactElement {
  return (
    <Stack spacing={0.25}>
      <Typography sx={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {value || '-'}
      </Typography>
    </Stack>
  );
}

function Summary({ label, value, suffix }: { label: string; value: number; suffix?: string }): ReactElement {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
      <Typography sx={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {formatNumber(value || 0)} {suffix || ''}
      </Typography>
    </Stack>
  );
}

function getStatusLabel(status?: string | null): string {
  switch (status) {
    case 'CREATED':
      return 'สร้างแล้ว';
    case 'CANCELLED':
      return 'ยกเลิก';
    case 'CLOSED':
      return 'ปิดงาน';
    default:
      return status || '-';
  }
}

function createDraft(purchaseOrder?: PurchaseOrderRecord): PurchaseOrderDraft {
  return {
    docDate: purchaseOrder?.docDate || '',
    productionLeadTimeDay:
      purchaseOrder?.productionLeadTimeDay !== null && purchaseOrder?.productionLeadTimeDay !== undefined
        ? String(purchaseOrder.productionLeadTimeDay)
        : '',
    shippingLeadTimeDay:
      purchaseOrder?.shippingLeadTimeDay !== null && purchaseOrder?.shippingLeadTimeDay !== undefined
        ? String(purchaseOrder.shippingLeadTimeDay)
        : '',
    remark: purchaseOrder?.remark || '',
    items: (purchaseOrder?.items || []).map((item) => ({ ...item }))
  };
}

export default function PurchaseOrderDetail(): ReactElement {
  const { id } = useParams<PurchaseOrderDetailParams>();
  const history = useHistory();
  const theme = useTheme();
  const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();
  const [tab, setTab] = useState<'detail' | 'history'>('detail');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draft, setDraft] = useState<PurchaseOrderDraft>(createDraft());
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
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
    imageThumb: {
      width: 64,
      height: 64,
      borderRadius: 8,
      objectFit: 'cover',
      border: '1px solid #e2e8f0',
      backgroundColor: '#f8fafc',
      display: 'block'
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
    data: purchaseOrder,
    isFetching,
    refetch
  } = useQuery(['purchase-order-detail', id], () => getPurchaseOrder(id), {
    enabled: Boolean(id),
    refetchOnWindowFocus: false
  });

  const {
    data: activityHistory = [],
    isFetching: isActivityHistoryFetching,
    refetch: refetchHistory
  } = useQuery(['purchase-order-activity-history', id], () => getActivityHistory('PURCHASE_ORDER', id), {
    enabled: Boolean(id),
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    setDraft(createDraft(purchaseOrder));
    setIsEditing(false);
  }, [purchaseOrder]);

  const displayItems = isEditing ? draft.items : purchaseOrder?.items || [];
  const isActionMenuOpen = Boolean(actionMenuAnchorEl);
  const canManagePurchaseOrder = purchaseOrder?.status === 'CREATED';

  const summary = useMemo(() => {
    const exchangeRate = Number(purchaseOrder?.exchangeRate || 0);
    const subTotal = displayItems.reduce((sum, item) => sum + Number(item.amountSupplierCurrency || 0), 0);
    const subTotalThb = displayItems.reduce((sum, item) => sum + Number(item.amountThb || 0), 0);

    return {
      subTotal,
      subTotalThb,
      grandTotal: subTotal,
      grandTotalThb: subTotalThb,
      exchangeRate
    };
  }, [displayItems, purchaseOrder?.exchangeRate]);

  const updateDraftField = <K extends keyof PurchaseOrderDraft>(
    field: K,
    value: PurchaseOrderDraft[K]
  ) => {
    setDraft((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const updateDraftItem = (
    index: number,
    field: 'quantity' | 'supplierUnitPrice' | 'supplierShippingCost',
    value: number
  ) => {
    setDraft((previous) => ({
      ...previous,
      items: previous.items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        const quantity = Number(field === 'quantity' ? value : item.quantity || 0);
        const supplierUnitPrice = Number(field === 'supplierUnitPrice' ? value : item.supplierUnitPrice || 0);
        const supplierShippingCost = Number(field === 'supplierShippingCost' ? value : item.supplierShippingCost || 0);
        const exchangeRate = Number(item.exchangeRate || previous.items[itemIndex].exchangeRate || 0);
        const supplierTotalUnitCost = supplierUnitPrice + supplierShippingCost;
        const amountSupplierCurrency = supplierTotalUnitCost * quantity;
        const amountThb = amountSupplierCurrency * exchangeRate;

        return {
          ...item,
          quantity,
          supplierUnitPrice,
          supplierShippingCost,
          supplierTotalUnitCost,
          amountSupplierCurrency,
          amountThb
        };
      })
    }));
  };

  const handleOpenActionMenu = (event: ReactMouseEvent<HTMLElement>) => {
    setActionMenuAnchorEl(event.currentTarget);
  };

  const handleCloseActionMenu = () => {
    setActionMenuAnchorEl(null);
  };

  const handleSelectEdit = () => {
    handleCloseActionMenu();
    setDraft(createDraft(purchaseOrder));
    setIsEditing(true);
  };

  const handleViewPurchaseOrder = async () => {
    if (!purchaseOrder?.purchaseOrderNo) {
      return;
    }
    handleCloseActionMenu();
    const response = await toast.promise(viewPurchaseOrder(purchaseOrder.purchaseOrderNo, true, false), {
      loading: t('toast.loading'),
      success: t('toast.success'),
      error: t('toast.failed')
    });

    const files = response?.data?.files || [];
    files.forEach((file: { fileName: string; base64: string; contentType?: string }) => {
      const blob = base64ToBlob(file.base64, file.contentType || 'application/pdf');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName || `${purchaseOrder.purchaseOrderNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
  };

  const handleCancelEdit = () => {
    handleCloseActionMenu();
    setDraft(createDraft(purchaseOrder));
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!purchaseOrder?.purchaseOrderNo) {
      return;
    }

    const payload: UpdatePurchaseOrderRequest = {
      docDate: draft.docDate || null,
      productionLeadTimeDay: draft.productionLeadTimeDay ? Number(draft.productionLeadTimeDay) : null,
      shippingLeadTimeDay: draft.shippingLeadTimeDay ? Number(draft.shippingLeadTimeDay) : null,
      remark: draft.remark || null,
      items: draft.items.map((item) => ({
        id: item.id,
        salesOrderDetailId: item.salesOrderDetailId ?? null,
        name: item.name || null,
        type: item.type || null,
        capacity: item.capacity || null,
        size: item.size || null,
        spec: item.spec || null,
        quantity: Number(item.quantity || 0),
        supplierCurrency: item.supplierCurrency || null,
        supplierUnitPrice: Number(item.supplierUnitPrice || 0),
        exchangeRate: Number(item.exchangeRate || 0),
        supplierShippingCost: Number(item.supplierShippingCost || 0),
        supplierTotalUnitCost: Number(item.supplierTotalUnitCost || 0),
        imageUrl: item.imageUrl || null,
        rfqDetailId: item.rfqDetailId ?? null,
        rfqTierId: item.rfqTierId ?? null,
        quotationDetailId: item.quotationDetailId ?? null,
        shippingMethod: item.shippingMethod || null,
        supplierQuoteTierId: item.supplierQuoteTierId ?? null
      }))
    };

    setIsSubmitting(true);
    try {
      await toast.promise(updatePurchaseOrder(purchaseOrder.purchaseOrderNo, payload), {
        loading: t('toast.loading'),
        success: t('toast.success'),
        error: t('toast.failed')
      });
      setIsEditing(false);
      await Promise.all([refetch(), refetchHistory()]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCancelPurchaseOrder = async () => {
    if (!purchaseOrder?.purchaseOrderNo) {
      return;
    }

    setIsSubmitting(true);
    try {
      await toast.promise(cancelPurchaseOrder(purchaseOrder.purchaseOrderNo), {
        loading: t('toast.loading'),
        success: t('toast.success'),
        error: t('toast.failed')
      });
      setIsCancelDialogOpen(false);
      await Promise.all([refetch(), refetchHistory()]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmClosePurchaseOrder = async () => {
    if (!purchaseOrder?.purchaseOrderNo) {
      return;
    }

    setIsSubmitting(true);
    try {
      await toast.promise(closePurchaseOrder(purchaseOrder.purchaseOrderNo), {
        loading: t('toast.loading'),
        success: t('toast.success'),
        error: t('toast.failed')
      });
      setIsCloseDialogOpen(false);
      await Promise.all([refetch(), refetchHistory()]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadAttachments = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!purchaseOrder?.purchaseOrderNo || !event.target.files?.length) {
      return;
    }

    const files = Array.from(event.target.files);
    setIsSubmitting(true);
    try {
      await toast.promise(uploadPurchaseOrderAttachments(purchaseOrder.purchaseOrderNo, files), {
        loading: t('toast.loading'),
        success: t('toast.success'),
        error: t('toast.failed')
      });
      await Promise.all([refetch(), refetchHistory()]);
    } finally {
      event.target.value = '';
      setIsSubmitting(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!purchaseOrder?.purchaseOrderNo) {
      return;
    }

    setIsSubmitting(true);
    try {
      await toast.promise(deletePurchaseOrderAttachment(purchaseOrder.purchaseOrderNo, attachmentId), {
        loading: t('toast.loading'),
        success: t('toast.success'),
        error: t('toast.failed')
      });
      await Promise.all([refetch(), refetchHistory()]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page>
      <LoadingDialog open={isFetching || isActivityHistoryFetching || isSubmitting} />
      <PageTitle title={purchaseOrder?.purchaseOrderNo ? `ใบสั่งซื้อเลขที่ ${purchaseOrder.purchaseOrderNo}` : 'ใบสั่งซื้อ'}>
        {purchaseOrder?.status ? <Chip label={getStatusLabel(purchaseOrder.status)} size="small" /> : null}
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
            disabled={!purchaseOrder}
            aria-controls={isActionMenuOpen ? 'purchase-order-action-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={isActionMenuOpen ? 'true' : undefined}>
            ตัวเลือก
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-cool-grey"
            startIcon={<ArrowBackIos />}
            onClick={() => history.push(ROUTE_PATHS.PURCHASE_ORDER_MANAGEMENT)}>
            กลับ
          </Button>
        </Stack>

        <Menu
          id="purchase-order-action-menu"
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
          {isEditing ? (
            <>
              <MenuItem
                onClick={() => {
                  handleCloseActionMenu();
                  void handleSave();
                }}
                disabled={isSubmitting}
                sx={{ width: '100%' }}>
                <ListItemIcon>
                  <Save fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('button.save')} />
              </MenuItem>
              <MenuItem onClick={handleCancelEdit} disabled={isSubmitting} sx={{ width: '100%' }}>
                <ListItemIcon>
                  <Cancel fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('button.cancel')} />
              </MenuItem>
            </>
          ) : (
            <>
              <MenuItem onClick={handleViewPurchaseOrder} sx={{ width: '100%' }}>
                <ListItemIcon>
                  <Description fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="ดูใบสั่งซื้อ" />
              </MenuItem>
              <MenuItem
                onClick={handleSelectEdit}
                disabled={!canManagePurchaseOrder}
                sx={{ width: '100%' }}>
                <ListItemIcon>
                  <Edit fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="แก้ไขใบสั่งซื้อ" />
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleCloseActionMenu();
                  setIsCancelDialogOpen(true);
                }}
                disabled={!canManagePurchaseOrder}
                sx={{ width: '100%' }}>
                <ListItemIcon>
                  <CancelPresentation fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="ยกเลิกใบสั่งซื้อ" />
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleCloseActionMenu();
                  setIsCloseDialogOpen(true);
                }}
                disabled={!canManagePurchaseOrder}
                sx={{ width: '100%' }}>
                <ListItemIcon>
                  <TaskAlt fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="ปิดใบสั่งซื้อ" />
              </MenuItem>
            </>
          )}
        </Menu>

        <ConfirmDialog
          open={isCancelDialogOpen}
          title="ยืนยันการยกเลิกใบสั่งซื้อ"
          message="เมื่อยกเลิกใบสั่งซื้อแล้ว ระบบจะเปิดให้สร้าง Purchase Order ใหม่ได้อีกครั้ง ต้องการดำเนินการต่อหรือไม่"
          confirmText="ยืนยัน"
          cancelText="ยกเลิก"
          isShowCancelButton
          isShowConfirmButton
          onCancel={() => setIsCancelDialogOpen(false)}
          onConfirm={handleConfirmCancelPurchaseOrder}
        />

        <ConfirmDialog
          open={isCloseDialogOpen}
          title="ยืนยันการปิดใบสั่งซื้อ"
          message="เมื่อปิดใบสั่งซื้อแล้ว จะไม่สามารถแก้ไขหรือยกเลิกเอกสารนี้ได้อีก ต้องการดำเนินการต่อหรือไม่"
          confirmText="ยืนยัน"
          cancelText="ยกเลิก"
          isShowCancelButton
          isShowConfirmButton
          onCancel={() => setIsCloseDialogOpen(false)}
          onConfirm={handleConfirmClosePurchaseOrder}
        />

        <Tabs value={tab} onChange={(_event: SyntheticEvent, value: 'detail' | 'history') => setTab(value)}>
          <Tab value="detail" label="รายละเอียด" />
          <Tab value="history" label="ประวัติ" />
        </Tabs>

        <TabPanel value="detail" currentTab={tab}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Stack className={classes.section} spacing={2}>
                <Typography variant="h6">ข้อมูลใบสั่งซื้อ</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}><Info label="เลขที่ใบสั่งซื้อ" value={purchaseOrder?.purchaseOrderNo} /></Grid>
                  <Grid item xs={12} sm={6}><Info label="อ้างอิงใบยืนยันสั่งซื้อ" value={purchaseOrder?.salesOrderNo} /></Grid>
                  <Grid item xs={12} sm={6}>
                    {isEditing ? (
                      <TextField
                        type="date"
                        label="วันที่เอกสาร"
                        value={draft.docDate}
                        onChange={(event) => updateDraftField('docDate', event.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    ) : (
                      <Info label="วันที่เอกสาร" value={purchaseOrder?.docDate} />
                    )}
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    {isEditing ? (
                      <TextField
                        type="number"
                        label="ระยะเวลาผลิต"
                        value={draft.productionLeadTimeDay}
                        onChange={(event) => updateDraftField('productionLeadTimeDay', event.target.value)}
                        fullWidth
                        inputProps={{ min: 0, step: 1 }}
                        InputLabelProps={{ shrink: true }}
                      />
                    ) : (
                      <Info label="ระยะเวลาผลิต" value={purchaseOrder?.productionLeadTimeDay ?? '-'} />
                    )}
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    {isEditing ? (
                      <TextField
                        type="number"
                        label="ระยะเวลาส่งของ"
                        value={draft.shippingLeadTimeDay}
                        onChange={(event) => updateDraftField('shippingLeadTimeDay', event.target.value)}
                        fullWidth
                        inputProps={{ min: 0, step: 1 }}
                        InputLabelProps={{ shrink: true }}
                      />
                    ) : (
                      <Info label="ระยะเวลาส่งของ" value={purchaseOrder?.shippingLeadTimeDay ?? '-'} />
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}><Info label="สถานะ" value={getStatusLabel(purchaseOrder?.status)} /></Grid>
                  <Grid item xs={12} sm={6}><Info label="สกุลเงิน" value={purchaseOrder?.currency} /></Grid>
                  <Grid item xs={12} sm={6}>
                    <Info
                      label="Supplier Shipping"
                      value={
                        purchaseOrder?.supplierShipping
                          ? `${purchaseOrder.supplierShipping.shippingMethod === 'SEA' ? 'ทางเรือ' : 'ทางรถ'} | ${
                              purchaseOrder.supplierShipping.shippingName || `Shipping #${purchaseOrder.supplierShipping.id}`
                            }`
                          : '-'
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}><Info label="อัตราแลกเปลี่ยน" value={purchaseOrder?.exchangeRate || 0} /></Grid>
                  <Grid item xs={12}>
                    {isEditing ? (
                      <TextField
                        label="หมายเหตุ"
                        value={draft.remark}
                        onChange={(event) => updateDraftField('remark', event.target.value)}
                        fullWidth
                        multiline
                        minRows={3}
                      />
                    ) : (
                      <Info label="หมายเหตุ" value={purchaseOrder?.remark} />
                    )}
                  </Grid>
                </Grid>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack className={classes.section} spacing={2}>
                <Typography variant="h6">ข้อมูล Supplier</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}><Info label="Supplier" value={purchaseOrder?.supplier?.supplierName || purchaseOrder?.supplierNameSnapshot} /></Grid>
                  <Grid item xs={12}>
                    <Info
                      label="จุดส่งของ"
                      value={
                        purchaseOrder?.supplierShipping?.destinations?.length
                          ? purchaseOrder.supplierShipping.destinations
                              .map((item) => item.destinationName || item.fullAddress || '-')
                              .join(', ')
                          : '-'
                      }
                    />
                  </Grid>
                  <Grid item xs={12}><Info label="ที่อยู่" value={purchaseOrder?.supplierAddressSnapshot} /></Grid>
                  <Grid item xs={12} sm={6}><Info label="ผู้ติดต่อ" value={purchaseOrder?.supplierContactSnapshot} /></Grid>
                  <Grid item xs={12} sm={6}><Info label="เบอร์ติดต่อ" value={purchaseOrder?.supplierPhoneSnapshot} /></Grid>
                </Grid>
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <Stack className={classes.section} spacing={2}>
                <Typography variant="h6">รายการสินค้า</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell className={classes.tableHeader}>รูปภาพ</TableCell>
                        <TableCell className={classes.tableHeader}>สินค้า</TableCell>
                        <TableCell className={classes.tableHeader}>รายละเอียด</TableCell>
                        <TableCell className={classes.tableHeader}>จำนวน</TableCell>
                        <TableCell className={classes.tableHeader}>ราคาสินค้า</TableCell>
                        <TableCell className={classes.tableHeader}>ค่าขนส่ง/หน่วย</TableCell>
                        <TableCell className={classes.tableHeader}>ต้นทุนรวม/หน่วย</TableCell>
                        <TableCell className={classes.tableHeader}>รวม</TableCell>
                        <TableCell className={classes.tableHeader}>รวม (บาท)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayItems.length ? (
                        displayItems.map((item, index) => (
                          <TableRow key={item.id || item.lineNo || index}>
                            <TableCell align="center">
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
                            <TableCell>{item.name || '-'}</TableCell>
                            <TableCell className={classes.specCell}>{item.spec || '-'}</TableCell>
                            <TableCell align="right">
                              {isEditing ? (
                                <TextField
                                  type="number"
                                  className={classes.itemTextField}
                                  value={item.quantity ?? 0}
                                  onChange={(event) => updateDraftItem(index, 'quantity', Number(event.target.value || 0))}
                                />
                              ) : (
                                formatNumber(item.quantity || 0)
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {isEditing ? (
                                <TextField
                                  type="number"
                                  className={classes.itemTextField}
                                  value={item.supplierUnitPrice ?? 0}
                                  onChange={(event) =>
                                    updateDraftItem(index, 'supplierUnitPrice', Number(event.target.value || 0))
                                  }
                                />
                              ) : (
                                `${formatNumber(item.supplierUnitPrice || 0)} ${item.supplierCurrency || ''}`
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {isEditing ? (
                                <TextField
                                  type="number"
                                  className={classes.itemTextField}
                                  value={item.supplierShippingCost ?? 0}
                                  onChange={(event) =>
                                    updateDraftItem(index, 'supplierShippingCost', Number(event.target.value || 0))
                                  }
                                />
                              ) : (
                                `${formatNumber(item.supplierShippingCost || 0)} ${item.supplierCurrency || ''}`
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {formatNumber(item.supplierTotalUnitCost || 0)} {item.supplierCurrency || ''}
                            </TableCell>
                            <TableCell align="right">
                              {formatNumber(item.amountSupplierCurrency || 0)} {item.supplierCurrency || ''}
                            </TableCell>
                            <TableCell align="right">{formatNumber(item.amountThb || 0)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} align="center">
                            {t('warning.noResultList')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <Stack className={classes.section} spacing={2}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                  <Typography variant="h6">ไฟล์แนบ</Typography>
                  {canManagePurchaseOrder ? (
                    <Button
                      variant="contained"
                      className="btn-baby-blue"
                      component="label"
                      startIcon={<FilePresent />}
                      disabled={isSubmitting}>
                      อัปโหลดไฟล์
                      <input hidden type="file" multiple onChange={handleUploadAttachments} />
                    </Button>
                  ) : null}
                </Stack>
                {purchaseOrder?.attachments?.length ? (
                  <Stack spacing={1.25}>
                    {purchaseOrder.attachments.map((attachment) => (
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
                          {canManagePurchaseOrder ? (
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<DeleteOutline />}
                              onClick={() => {
                                void handleDeleteAttachment(attachment.id);
                              }}
                              disabled={isSubmitting}>
                              ลบ
                            </Button>
                          ) : null}
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
            <Grid item xs={12} md={5}>
              <Stack className={classes.section} spacing={1.25}>
                <Typography variant="h6">สรุปยอด</Typography>
                <Summary label="ยอดรวม" value={summary.subTotal} suffix={purchaseOrder?.currency || ''} />
                <Summary label="ยอดรวม (บาท)" value={summary.subTotalThb} suffix="THB" />
                <Summary label="จำนวนเงินทั้งสิ้น" value={summary.grandTotal} suffix={purchaseOrder?.currency || ''} />
                <Summary label="จำนวนเงินทั้งสิ้น (บาท)" value={summary.grandTotalThb} suffix="THB" />
              </Stack>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value="history" currentTab={tab}>
          <ActivityHistoryTimeline history={activityHistory} />
        </TabPanel>
      </Wrapper>
    </Page>
  );
}
