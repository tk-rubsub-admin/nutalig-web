/* eslint-disable prettier/prettier */
import {
  ArrowBackIos,
  RateReview,
  Restore,
  ContentCopy,
  Cached,
  CheckCircle
} from '@mui/icons-material';
import {
  Button,
  Grid,
  IconButton,
  InputAdornment,
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Stack,
  useMediaQuery,
  useTheme,
  Tooltip
} from '@mui/material';
import { IoHeart } from 'react-icons/io5';
import { useAuth } from 'auth/AuthContext';
import PageTitle from 'components/PageTitle';
import { GridTextField, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { ChangeEvent, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import {
  getSaleOrder,
  updateSaleOrderLineStatus
} from 'services/SaleOrder/sale-order-api';
import {
  SaleOrder,
  SaleOrderLine,
  UpdatePOLineRequest
} from 'services/SaleOrder/sale-order-type';
import ConfirmDialog from 'components/ConfirmDialog';
import styled from 'styled-components';
import { isMobileOnly } from 'react-device-detect';
import { DEFAULT_DATE_FORMAT } from 'utils';
import {
  ProductSupplier,
  SearchProductSupplierRequest,
  SearchProductSupplierResponse
} from 'services/Product/product-type';
import { getProductSupplier } from 'services/Product/product-api';
import LoadingDialog from 'components/LoadingDialog';
import { makeStyles } from '@mui/styles';
import { copyText } from 'utils/copyContent';
import CheckBoxComponent from 'components/CheckBoxComponent';
import { ShoppingBasket } from '@material-ui/icons';
import NumberTextField from 'components/NumberTextField';
import { ROLES } from 'auth/roles';
import BuyingDialog from 'pages/SaleOrderManagement/Detail/Dialog/BuyingDialog';
import PurchaseDialog from 'pages/SaleOrderManagement/Detail/Dialog/PurchaseDialog';

export interface SaleOrderParam {
  id: string;
}

const StickyWrapper = styled(Wrapper)`
  position: sticky;
  top: 0;
  background-color: white;
  z-index: 100;
  padding-bottom: 12px; // optional, to add spacing
  border-bottom: 1px solid #ddd; // optional, for visual separation
`;

export default function AdvanceOrderDetail() {
  const useStyles = makeStyles({
    hideObject: {
      display: 'none'
    },
    noResultMessage: {
      textAlign: 'center',
      fontSize: '1.2em',
      fontWeight: 'bold',
      padding: '48px 0'
    },
    tableHeader: {
      border: '2px solid #e0e0e0',
      fontWeight: 'bold',
      paddingLeft: '10px',
      textAlign: 'center'
    },
    marginButton: {
      margin: '3px 3px 3px 0px'
    }
  });
  const classes = useStyles();
  const history = useHistory();
  const theme = useTheme();
  const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
  const { getRole } = useAuth();
  const params = useParams<SaleOrderParam>();
  const { t } = useTranslation();
  const [saleOrder, setSaleOrder] = useState<SaleOrder>();
  const [selectedPoLine, setSelectedPoLine] = useState<SaleOrderLine>();
  const [productSupplierData, setProductSupplierData] = useState<ProductSupplier>();
  const [selectedPoLineList, setSelectedPoLineList] = useState<SaleOrderLine[]>([]);
  const [actionType, setActionType] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [msg, setMsg] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
  const [openPurchaseDialog, setOpenPurchaseDialog] = useState(false);
  const [openBuyingDialog, setOpenBuyingDialog] = useState(false);
  const [openLoading, setOpenLoading] = useState(false);
  const [customerData, setCustomerData] = useState<string>('');

  const {
    data: poData,
    refetch: poRefetch,
    isFetching: isPoFetching
  } = useQuery(['sale-order', params.id], () => getSaleOrder(params.id), {
    refetchOnWindowFocus: false
  });

  const onUpdateProductSalePrice = (id: string, poLine: SaleOrderLine, price: number) => {
    const updateObj: UpdatePOLineRequest = {
      status: null,
      detail: null,
      haveQty: null,
      salePrice: price
    };
    toast.promise(updateSaleOrderLineStatus(saleOrder?.id, poLine?.id, updateObj), {
      loading: t('toast.loading'),
      success: () => {
        return t('toast.success');
      },
      error: () => {
        return t('toast.failed');
      }
    });
  };

  const onUpdatedOrderQty = (id: string, poLine: SaleOrderLine, qty: string) => {
    const updateObj: UpdatePOLineRequest = {
      status: null,
      detail: '',
      haveQty: null,
      salePrice: null,
      qty: Number(qty)
    };
    toast.promise(updateSaleOrderLineStatus(saleOrder?.id, poLine?.id, updateObj), {
      loading: t('toast.loading'),
      success: () => {
        return t('toast.success');
      },
      error: () => {
        return t('toast.failed');
      }
    });
  };

  const onUpdatedProductQty = (id: string, poLine: SaleOrderLine, qty: string) => {
    let status;
    let qtyNumber = Number(qty);
    if (qtyNumber >= poLine.qty) {
      status = 'COMPLETE';
      qtyNumber = poLine.qty;
    } else if (qtyNumber === 0) {
      status = 'OUT_OF_STOCK';
    } else {
      status = 'INCOMPLETE';
    }
    const updateObj: UpdatePOLineRequest = {
      status: status,
      detail: '',
      haveQty: qtyNumber,
      salePrice: null,
      qty: null
    };
    toast.promise(updateSaleOrderLineStatus(saleOrder?.id, poLine?.id, updateObj), {
      loading: t('toast.loading'),
      success: () => {
        return t('toast.success');
      },
      error: () => {
        return t('toast.failed');
      }
    });
    const localPatch = {
      status,
      detail: '',
      haveQty: qtyNumber,
      salePrice: poLine ? poLine.salesPrice : null,
      isFirstCheck: qtyNumber >= poLine.qty ? true : false,
      isSecondCheck: false
    };
    console.log(localPatch);

    setSaleOrder((prev) =>
      !prev
        ? prev
        : {
          ...prev,
          saleOrderLines: prev.saleOrderLines.map((line) => {
            if (line.id === poLine.id) {
              return {
                ...line,
                ...localPatch
              };
            }
            return line;
          })
        }
    );
  };

  const updatePoLine = (poLineId: string, updater: (line: SaleOrderLine) => SaleOrderLine) => {
    setSaleOrder((prev) => {
      if (!prev) return prev;
      const updatedLines = prev.saleOrderLines.map((line) =>
        line.id === poLineId ? updater({ ...line }) : line
      );
      return { ...prev, saleOrderLines: updatedLines };
    });
  };


  const handlePurchaseProduct = async (pol: SaleOrderLine) => {
    setOpenLoading(true);
    const filter: SearchProductSupplierRequest = {
      sku: pol.itemSku,
      productCategory: ''
    };
    const response: SearchProductSupplierResponse = await getProductSupplier(filter, 1, 1);
    setSelectedPoLine(pol);
    setProductSupplierData(response.data.products[0]);
    setOpenPurchaseDialog(true);
    setOpenLoading(false);
  };

  // handle select po line
  const handleSelectLine = (event: ChangeEvent<HTMLInputElement>, poLine: SaleOrderLine) => {
    const { checked } = event.target;

    setSelectedPoLineList((prev) => {
      if (checked) {
        // ✅ ถ้าเช็ค → เพิ่มเข้าไป (กันซ้ำด้วย find)
        if (!prev.find((line) => line.id === poLine.id)) {
          return [...prev, poLine];
        }
        return prev;
      } else {
        // ❌ ถ้า uncheck → เอาออก
        return prev.filter((line) => line.id !== poLine.id);
      }
    });
  };

  const isDisplay = (roles: string[]): boolean => {
    const userRoleResult = getRole();
    const userRoles = Array.isArray(userRoleResult) ? userRoleResult : [userRoleResult];
    return userRoles.some((r) => roles.includes(r));
  };

  useEffect(async () => {
    if (!poData) return;

    setSaleOrder(poData);

    const custData =
      poData?.customer.customerName +
      '\n' +
      poData?.customer.contactNumber1 +
      '\n\n' +
      poData?.dropOff.dropOffName +
      '\n' +
      'ส่ง ' +
      poData?.dropOff.supplier?.supplierName +
      '\n' +
      'เบอร์ติดต่อขนส่ง : ' +
      poData?.dropOff.supplier?.contactNumber;
    setCustomerData(custData);
  }, [poData]);

  return (
    <Page>
      <PageTitle title={'ออเดอร์ : ' + saleOrder?.id} />
      <Wrapper>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{
            mt: 1,
            justifyContent: { sm: 'flex-end' }, // right-align when in row
            alignItems: { xs: 'flex-end', sm: 'center' } // right-align when stacked
          }}>
          <Button
            fullWidth={isDownSm}
            className="btn-cool-grey"
            variant="contained"
            onClick={() => {
              history.push(ROUTE_PATHS.ADVANCE_PURCHASE_ORDER_MANAGEMENT);
            }}
            startIcon={<ArrowBackIos />}>
            {t('button.back')}
          </Button>
          <Button
            fullWidth={isDownSm}
            className="btn-amber-orange"
            variant="contained"
            onClick={() => {
              setActionType('CLEAR');
              setTitle(t('message.clearDataTitle'));
              setMsg(t('message.clearDataMsg'));
              setVisibleConfirmationDialog(true);
            }}
            startIcon={<Restore />}>
            {t('button.clear')}
          </Button>
        </Stack>
      </Wrapper>
      {/* Customer Section */}
      {isMobileOnly ? (
        <>
          <StickyWrapper>
            <Grid container spacing={1}>
              <GridTextField item xs={12}>
                <Typography>{t('purchaseOrder.orderInformationSection.title')}</Typography>
              </GridTextField>
            </Grid>
            <Grid container spacing={1}>
              <GridTextField item xs={12}>
                <TextField
                  type="text"
                  label={t('purchaseOrder.customerInformationSection.title')}
                  fullWidth
                  multiline
                  rows={6}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  value={customerData}
                  InputLabelProps={{ shrink: true }}
                />
              </GridTextField>
            </Grid>
          </StickyWrapper>
          <Wrapper>
            <Grid container spacing={1}>
              <GridTextField item xs={12} sm={6}>
                <TextField
                  type="text"
                  label={t('purchaseOrder.orderInformationSection.fields.labels.notes')}
                  fullWidth
                  multiline
                  rows={6}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  value={saleOrder?.remark}
                  InputLabelProps={{ shrink: true }}
                />
              </GridTextField>
              <GridTextField item xs={12} sm={6}>
                <TextField
                  type="text"
                  label={t('purchaseOrder.orderInformationSection.fields.labels.orderMaker')}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  value={saleOrder?.poMaker?.displayName}
                  InputLabelProps={{ shrink: true }}
                />
              </GridTextField>
              <GridTextField item xs={12} sm={6}>
                <TextField
                  type="text"
                  label={t('purchaseOrder.orderLink')}
                  fullWidth
                  disabled
                  variant="outlined"
                  value={saleOrder?.generatedLink.substring(0, 100)}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          disabled={saleOrder?.generatedLink === ''}
                          onClick={() => {
                            copyText(saleOrder?.generatedLink);
                          }}>
                          <ContentCopy />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </GridTextField>
              <GridTextField item xs={6} sm={6}>
                <TextField
                  type="text"
                  label={t('purchaseOrder.orderInformationSection.fields.labels.deliverDate')}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  value={dayjs(saleOrder?.deliveryDate).format(DEFAULT_DATE_FORMAT)}
                  InputLabelProps={{ shrink: true }}
                />
              </GridTextField>
              <GridTextField item xs={6} sm={6}>
                <TextField
                  type="text"
                  label={t('purchaseOrder.orderInformationSection.fields.labels.sendingTime')}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  value={saleOrder?.sendingTime}
                  InputLabelProps={{ shrink: true }}
                />
              </GridTextField>
              <GridTextField item xs={6} sm={6}>
                <TextField
                  type="text"
                  label={t('purchaseOrder.orderInformationSection.fields.labels.billingStatus')}
                  fullWidth
                  variant="outlined"
                  value={saleOrder?.billingStatus}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ readOnly: true }}
                />
              </GridTextField>
              <GridTextField item xs={6} sm={6}>
                <TextField
                  type="text"
                  label={t('purchaseOrder.orderInformationSection.fields.labels.orderStatus')}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  value={t(`status.saleOrder.${saleOrder?.orderStatus}`)}
                  InputLabelProps={{ shrink: true }}
                />
              </GridTextField>
              <GridTextField item xs={6} sm={6}>
                <TextField
                  type="text"
                  label={t('purchaseOrder.orderInformationSection.fields.labels.paymentStatus')}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  value={t(`status.payment.${saleOrder?.paymentStatus}`)}
                  InputLabelProps={{ shrink: true }}
                />
              </GridTextField>
            </Grid>
          </Wrapper>
        </>
      ) : (
        <>
          <Wrapper>
            <Grid container spacing={1}>
              <GridTextField item xs={12}>
                <Typography>{t('purchaseOrder.orderInformationSection.title')}</Typography>
              </GridTextField>
            </Grid>
            <Grid container spacing={1}>
              <GridTextField item xs={12} sm={6}>
                <TextField
                  type="text"
                  label={t('purchaseOrder.customerInformationSection.title')}
                  fullWidth
                  multiline
                  rows={6}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  value={customerData}
                  InputLabelProps={{ shrink: true }}
                />
              </GridTextField>
              <GridTextField item xs={12} sm={6}>
                <TextField
                  type="text"
                  label={t('purchaseOrder.orderInformationSection.fields.labels.notes')}
                  fullWidth
                  multiline
                  rows={6}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  value={saleOrder?.remark}
                  InputLabelProps={{ shrink: true }}
                />
              </GridTextField>
              <GridTextField item xs={12} sm={6}>
                <TextField
                  type="text"
                  label={t('purchaseOrder.orderInformationSection.fields.labels.orderMaker')}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  value={saleOrder?.poMaker?.displayName}
                  InputLabelProps={{ shrink: true }}
                />
              </GridTextField>
              <GridTextField item xs={12} sm={6}>
                <TextField
                  type="text"
                  label={t('purchaseOrder.orderLink')}
                  fullWidth
                  disabled
                  variant="outlined"
                  value={saleOrder?.generatedLink.substring(0, 100)}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          disabled={saleOrder?.generatedLink === ''}
                          onClick={() => {
                            copyText(saleOrder?.generatedLink);
                          }}>
                          <ContentCopy />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </GridTextField>
              <GridTextField item xs={6} sm={6}>
                <TextField
                  type="text"
                  label={t('purchaseOrder.orderInformationSection.fields.labels.deliverDate')}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  value={dayjs(saleOrder?.deliveryDate).format(DEFAULT_DATE_FORMAT)}
                  InputLabelProps={{ shrink: true }}
                />
              </GridTextField>
              <GridTextField item xs={6} sm={6}>
                <TextField
                  type="text"
                  label={t('purchaseOrder.orderInformationSection.fields.labels.sendingTime')}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  value={saleOrder?.sendingTime}
                  InputLabelProps={{ shrink: true }}
                />
              </GridTextField>
              <GridTextField item xs={6} sm={6}>
                <TextField
                  type="text"
                  label={t('purchaseOrder.orderInformationSection.fields.labels.billingStatus')}
                  fullWidth
                  variant="outlined"
                  value={saleOrder?.billingStatus}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ readOnly: true }}
                />
              </GridTextField>
              <GridTextField item xs={6} sm={6}>
                <TextField
                  type="text"
                  label={t('purchaseOrder.orderInformationSection.fields.labels.orderStatus')}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  value={t(`status.saleOrder.${saleOrder?.orderStatus}`)}
                  InputLabelProps={{ shrink: true }}
                />
              </GridTextField>
              <GridTextField item xs={6} sm={6}>
                <TextField
                  type="text"
                  label={t('purchaseOrder.orderInformationSection.fields.labels.paymentStatus')}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  value={t(`status.payment.${saleOrder?.paymentStatus}`)}
                  InputLabelProps={{ shrink: true }}
                />
              </GridTextField>
            </Grid>
          </Wrapper>
        </>
      )}
      {/* Product Section */}
      <Wrapper>
        <Grid container spacing={1} alignItems="center">
          {/* ด้านซ้าย */}
          <Grid item xs={6} sm={6}>
            <Typography>{t('purchaseOrder.productSection.title')}</Typography>
          </Grid>

          {/* ด้านขวา */}
          <Grid item xs={6} sm={6} style={{ textAlign: 'right' }}>
            {isMobileOnly ? (
              <Tooltip title={t('purchaseOrder.refresh')}>
                <IconButton
                  size="small"
                  onClick={() => poRefetch()}
                  className="btn-slate-grey"
                  sx={{
                    display: { xs: 'inline-flex', sm: 'none' },
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'rgba(25, 118, 210, 0.08)', // พื้นหลังฟ้าอ่อน (primary.main แบบโปร่งใส)
                      color: 'primary.main', // เปลี่ยน icon เป็นสี primary
                      transform: 'scale(1.1)' // ขยายเล็กน้อยตอน hover
                    },
                    '&:active': {
                      transform: 'scale(0.95)' // กดแล้วหดลงเล็กน้อย
                    }
                  }}>
                  <Cached />
                </IconButton>
              </Tooltip>
            ) : (
              <Button
                variant="contained"
                className="btn-slate-grey"
                startIcon={<Cached />}
                size={isDownSm ? 'small' : 'medium'}
                onClick={() => poRefetch()}>
                {t('purchaseOrder.refresh')}
              </Button>
            )}{' '}
            {/* xs-only: Add icon */}
            <Tooltip title={t('purchaseOrder.buying')}>
              <IconButton
                size="small"
                className="btn-emerald-green"
                onClick={() => setOpenBuyingDialog(true)}
                disabled={selectedPoLineList.length === 0}
                sx={{
                  display: { xs: 'inline-flex', sm: 'none' },
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(25, 118, 210, 0.08)', // พื้นหลังฟ้าอ่อน (primary.main แบบโปร่งใส)
                    color: 'primary.main', // เปลี่ยน icon เป็นสี primary
                    transform: 'scale(1.1)' // ขยายเล็กน้อยตอน hover
                  },
                  '&:active': {
                    transform: 'scale(0.95)' // กดแล้วหดลงเล็กน้อย
                  }
                }}>
                <ShoppingBasket />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              className="btn-emerald-green"
              startIcon={<ShoppingBasket />}
              size={isDownSm ? 'small' : 'medium'}
              disabled={selectedPoLineList.length === 0}
              onClick={() => setOpenBuyingDialog(true)}
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
              {t('purchaseOrder.buying')}
            </Button>
          </Grid>
        </Grid>
        <TableContainer>
          <Table id="purchase_order_line__table">
            <TableHead>
              <TableCell
                key="no"
                align="center"
                style={{ width: isMobileOnly ? '10px' : 'auto' }}
              />
              <TableCell key="name" align="center" style={{ width: 'auto' }}>
                {t('purchaseOrder.productSection.fields.labels.name')}
              </TableCell>
              <TableCell
                key="qty"
                align="center"
                style={{
                  width: isMobileOnly ? '50px' : '75px',
                  padding: isMobileOnly ? '16px 2px 16px 2px' : 'auto'
                }}>
                {t('purchaseOrder.productSection.fields.labels.qty')}
              </TableCell>
              <TableCell
                key="purchase"
                align="center"
                style={{
                  width: '300px',
                  padding: isMobileOnly ? '16px 2px 16px 2px' : 'auto',
                }}>
                {t('purchaseOrder.productSection.fields.labels.purchaseFrom')}
              </TableCell>
              <TableCell
                key="salePrice"
                align="center"
                style={{
                  width: isMobileOnly ? '60px' : '120px',
                  padding: isMobileOnly ? '16px 2px 16px 2px' : 'auto',
                }}>
                {t('purchaseOrder.productSection.fields.labels.salePrice')}
              </TableCell>
            </TableHead>
            <TableBody>
              {saleOrder?.saleOrderLines
                .filter((item: SaleOrderLine) => item.itemSku && !/^3[12]/.test(item.itemSku))
                .map((item: SaleOrderLine) => {
                  const isMobileCellPad = isMobileOnly ? { padding: '10px 2px 10px 2px' } : {};
                  return (
                    <TableRow key={item.id}>
                      {/* Col: Checkbox / Balloon */}
                      <TableCell
                        align="left"
                        sx={
                          !isMobileOnly
                            ? { width: 20, maxWidth: 20, minWidth: 10 }
                            : { width: 10, maxWidth: 10, minWidth: 5, padding: 0 }
                        }
                        style={item.status === 'CANCEL' ? { textDecoration: 'line-through' } : {}}>
                        <CheckBoxComponent
                          key={item.id}
                          type="checkbox"
                          name={item.id}
                          id={item.id}
                          handleClick={(event: ChangeEvent<HTMLInputElement>) =>
                            handleSelectLine(event, item)
                          }
                          isChecked={!!selectedPoLineList.find((line) => line.id === item.id)}
                          disable={false}
                        />
                      </TableCell>

                      {/* Col: Name + badges */}
                      <TableCell
                        style={
                          item.status === 'CANCEL'
                            ? !isMobileOnly
                              ? { textDecoration: 'line-through' }
                              : { textDecoration: 'line-through', ...isMobileCellPad }
                            : isMobileOnly
                              ? isMobileCellPad
                              : {}
                        }>
                        {item.status === 'NEW' ? 'เพิ่ม ' : ''}
                        <Typography
                          style={{
                            cursor: item.status === 'CANCEL' ? 'not-allowed' : 'pointer',
                            color: item.status === 'CANCEL' ? 'gray' : 'blue',
                            pointerEvents: item.status === 'CANCEL' ? 'none' : 'auto'
                          }}>
                          {item.itemName}
                        </Typography>

                        {item.remark ? <Typography color="error">{item.remark}</Typography> : null}

                        {item.status === 'COMPLETE' && <IoHeart style={{ color: '#FF8C00' }} />}
                        {item.status === 'PACKED' && (
                          <>
                            <IoHeart style={{ color: '#FF8C00' }} />
                            <IoHeart style={{ color: '#9B30FF' }} />
                          </>
                        )}
                        {item.supplier && isDisplay([ROLES.ORDER_BKK, ROLES.ORDER_PROVINCE]) && (
                          <>
                            <IoHeart style={{ color: '#0D70F7' }} />
                            {item.supplier.supplierShortName}
                          </>
                        )}
                      </TableCell>

                      {/* Col: Qty/OldQty */}
                      <TableCell
                        style={
                          isMobileOnly
                            ? { ...isMobileCellPad, textAlign: 'center' }
                            : { textAlign: 'center' }
                        }>
                        {/* {item.status !== 'CANCEL' && item.oldQty !== null ? (
                          <Typography sx={{ textDecoration: 'line-through' }}>
                            {item.oldQty}
                          </Typography>
                        ) : null} */}
                        {item.status !== 'CANCEL' && Array.isArray(item.oldQty) && (
                          <Typography sx={{ textDecoration: 'line-through' }}>
                            {item.oldQty.map((qty, index) => (
                              <div key={index}>{qty}</div>
                            ))}
                          </Typography>
                        )}

                        <Typography
                          style={
                            item.status === 'CANCEL' ? { textDecoration: 'line-through' } : {}
                          }>
                          {item.qty /* ✅ เดิมอ้าง index+1 → แก้เป็น qty ของบรรทัดนี้ */}
                        </Typography>
                      </TableCell>

                      {/* Col: Supplier (readonly with edit) */}
                      <TableCell
                        style={{
                          textAlign: 'center',
                          padding: isMobileOnly ? '16px 2px 16px 2px' : 'auto',
                        }}>
                        <TextField
                          value={
                            item.supplier ? `${item.supplier.supplierName} (${item.orderQty})` : ''
                          }
                          type="text"
                          style={
                            item.status === 'CANCEL'
                              ? { textDecoration: 'line-through' }
                              : { width: '120px' }
                          }
                          disabled={item.status === 'CANCEL'}
                          size="small"
                          InputProps={{
                            readOnly: true,
                            endAdornment: (
                              <InputAdornment position="end" sx={{ mr: -0.8 }}>
                                {' '}
                                {/* ลด marginRight */}
                                <IconButton
                                  size="small"
                                  sx={{ p: 0.25 }} // ลด padding ด้านในของปุ่ม
                                  disabled={item.haveQty === item.qty || item.status === 'CANCEL'}
                                  onClick={() => handlePurchaseProduct(item)}>
                                  <RateReview fontSize="small" />
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                        />
                      </TableCell>

                      {/* Col: salesPrice */}
                      <TableCell
                        style={
                          isMobileOnly
                            ? {
                              ...isMobileCellPad,
                              textAlign: 'center'
                            }
                            : {
                              textAlign: 'center'
                            }
                        }>
                        <NumberTextField
                          required
                          value={item.salesPrice ?? null}
                          min={1}
                          onChange={(val) => {
                            updatePoLine(item.id, (line) => ({ ...line, salesPrice: val }));
                          }}
                          onCommit={(val) => {
                            if (val !== null) {
                              onUpdateProductSalePrice(item.id, item, val); // ✅ ส่ง id
                            }
                          }}
                          size="small"
                          sx={{
                            '& input': {
                              height: '35px',
                              width: '50px',
                              padding: '0 2px',
                              boxSizing: 'border-box',
                              textAlign: 'center'
                            },
                            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button':
                            {
                              display: 'none'
                            },
                            '& input[type=number]': { MozAppearance: 'textfield' }
                          }}
                          style={item.status === 'CANCEL' ? { textDecoration: 'line-through' } : {}}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
      </Wrapper>

      <Wrapper>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{
            mt: 1,
            justifyContent: { sm: 'flex-end' }, // right-align when in row
            alignItems: { xs: 'flex-end', sm: 'center' } // right-align when stacked
          }}>
          <Button
            fullWidth={isDownSm}
            className="btn-emerald-green"
            variant="contained"
            onClick={() => {
              history.push(ROUTE_PATHS.ADVANCE_PURCHASE_ORDER_MANAGEMENT);
            }}
            startIcon={<CheckCircle />}>
            {t('button.finish')}
          </Button>
          <Button
            fullWidth={isDownSm}
            className="btn-cool-grey"
            variant="contained"
            onClick={() => {
              history.push(ROUTE_PATHS.ADVANCE_PURCHASE_ORDER_MANAGEMENT);
            }}
            startIcon={<ArrowBackIos />}>
            {t('button.back')}
          </Button>
        </Stack>
      </Wrapper>
      <LoadingDialog open={isPoFetching} />
      <BuyingDialog
        open={openBuyingDialog}
        poId={saleOrder?.id}
        poLine={selectedPoLineList}
        onClose={(isSuccess: boolean) => {
          if (isSuccess) {
            poRefetch();
          }
          setSelectedPoLineList([]);
          setOpenBuyingDialog(false);
        }}
      />
      <PurchaseDialog
        open={openPurchaseDialog}
        poId={saleOrder?.id}
        poLine={selectedPoLine}
        productSupplier={productSupplierData}
        haveQty={selectedPoLine?.haveQty || 0}
        orderQty={selectedPoLine?.qty || 0}
        onClose={(value: boolean) => {
          if (value) {
            poRefetch();
          }
          setOpenPurchaseDialog(false);
        }}
      />
      <LoadingDialog open={openLoading} />
      <ConfirmDialog
        open={visibleConfirmationDialog}
        title={title}
        message={msg}
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        onConfirm={async () => {
          // 1) build request body for the API like you already do
          let updateObj: UpdatePOLineRequest | undefined;

          if (updateObj) {
            // 2) call backend and await toast
            await toast.promise(
              updateSaleOrderLineStatus(saleOrder?.id, selectedPoLine?.id, updateObj),
              {
                loading: t('toast.loading'),
                success: () => {
                  return t('toast.success');
                },
                error: () => t('toast.failed')
              }
            );
          }
        }
        }
        onCancel={() => setVisibleConfirmationDialog(false)}
        isShowCancelButton={true}
        isShowConfirmButton={true}
      />
    </Page>
  );
}
