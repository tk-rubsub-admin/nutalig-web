import {
  ArrowBackIos,
  ArrowDropDown,
  Description,
  Menu as MenuIcon,
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
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import Can from 'auth/Can';
import { PERMISSIONS } from 'auth/permissions';
import ActivityHistoryTimeline from 'components/ActivityHistoryTimeline';
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
import {
  getSalesOrderV1,
  updateSalesOrderV1,
  downloadSaleOrder
} from 'services/SaleOrder/sale-order-api';
import {
  SalesOrderDetailV1,
  SalesOrderV1,
  UpdateSalesOrderRequestV1
} from 'services/SaleOrder/sale-order-type';
import { DownloadDocumentResponse } from 'services/general-type';
import { base64ToBlob } from 'utils';
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
  isVat: boolean;
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

  return shippingType;
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
    isVat: Number(salesOrder?.vatRate || 0) > 0,
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
  const [tab, setTab] = useState<'detail' | 'history'>('detail');
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

  useEffect(() => {
    setDraft(createDraft(salesOrder));
    setIsEditing(false);
  }, [salesOrder]);

  const displayItems = isEditing ? draft.items : salesOrder?.items || [];
  const isActionMenuOpen = Boolean(actionMenuAnchorEl);

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

  const handleChangeTab = (_event: SyntheticEvent, value: 'detail' | 'history') => {
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

  const handleCancel = () => {
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
      isVat: draft.isVat,
      shippingType: draft.shippingType || null,
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
        imageUrl: item.imageUrl || null
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
      await Promise.all([refetch(), refetchHistory()]);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Page>
      <LoadingDialog open={isFetching || isActivityHistoryFetching || isSaving} />
      <PageTitle
        title={
          salesOrder?.salesOrderNo
            ? `ใบยืนยันสั่งซื้อเลขที่ ${salesOrder.salesOrderNo}`
            : 'ใบยืนยันสั่งซื้อ'
        }>
        {salesOrder?.status ? <Chip label={salesOrder.status} size="small" /> : null}
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
          {isEditing ? (
            <>
              <Button
                fullWidth={isDownSm}
                variant="contained"
                className="btn-emerald-green"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={isSaving}>
                {t('button.save')}
              </Button>
              <Button
                fullWidth={isDownSm}
                variant="contained"
                className="btn-cool-grey"
                onClick={handleCancel}
                disabled={isSaving}>
                {t('button.cancel')}
              </Button>
            </>
          ) : (
            <>
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
                <MenuItem
                  onClick={handleDownloadSalesOrder}
                  disabled={!salesOrder}
                  sx={{ width: '100%' }}>
                  <ListItemIcon>
                    <Description fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="ดูใบสั่งซื้อ" />
                </MenuItem>
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
              </Menu>
            </>
          )}
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-cool-grey"
            startIcon={<ArrowBackIos />}
            onClick={() => history.push(ROUTE_PATHS.SALE_ORDER_MANAGEMENT)}>
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
            <Tab value="detail" label="รายละเอียด" />
            <Tab value="history" label="ประวัติ" />
          </Tabs>
        </Box>

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
                  <Info label="สถานะ" value={salesOrder?.status} />
                  <Info label="Revision" value={salesOrder?.revNo ?? '-'} />
                  {isEditing ? (
                    <TextField
                      select
                      label="วิธีขนส่ง"
                      value={draft.shippingType}
                      onChange={(event) => updateDraftField('shippingType', event.target.value)}>
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
              <TableContainer>
                <Table id="sales_order_detail_items___table">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        align="center"
                        className={`${classes.tableHeader} ${classes.fitContentCell}`}>
                        #
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
                              formatNumber(item.unitPrice || 0)
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
                        <TableCell colSpan={6} align="center">
                          {t('warning.noResultList')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
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
          </>
        </TabPanel>

        <TabPanel value="history" currentTab={tab}>
          <ActivityHistoryTimeline records={activityHistory} />
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
