/* eslint-disable prettier/prettier */
import {
  ModeEdit,
  RateReview,
  Restore,
  LocalShipping,
  ContentCopy,
  ArrowBack,
  ArrowForward,
  Add,
  Edit,
  Cached,
  CheckCircle,
  ChecklistRtl,
  DoneAll,
  Save,
  RocketLaunch,
  DeleteForever,
  ArrowOutward
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
  Tooltip,
  Box
} from '@mui/material';
import { IoBalloon, IoHeart } from 'react-icons/io5';
import { useAuth } from 'auth/AuthContext';
import PageTitle from 'components/PageTitle';
import { GridTextField, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import {
  confirmPaidSaleOrder,
  deleteSaleOrderPackImage,
  getSaleOrder,
  updateSaleOrderLineStatus,
  uploadSaleOrderPackImage,
  updateSaleOrderStatus,
  assignSaleOrder,
  requestToMakeOrder,
  approveToMakeOrder,
  updateSaleOrder,
  getReAssignOrderInfo
} from 'services/SaleOrder/sale-order-api';
import {
  AssignPORequest,
  OrderPackage,
  SaleOrder,
  SaleOrderLine,
  UpdatePOLineRequest,
  UpdateSaleOrderRequest
} from 'services/SaleOrder/sale-order-type';
import ImageFileUploaderWrapper from 'components/ImageFileUploaderWrapper';
import FileUploader from 'components/FileUploader';
import EditBoxDialog from './Dialog/EditBoxDialog';
import ConfirmDialog from 'components/ConfirmDialog';
import styled from 'styled-components';
import ProductDialog from './Dialog/ProductDialog';
import { isMobileOnly } from 'react-device-detect';
import { DEFAULT_DATE_FORMAT, resizeFile } from 'utils';
import {
  ProductSupplier,
  SearchProductSupplierRequest,
  SearchProductSupplierResponse
} from 'services/Product/product-type';
import { getProductSupplier } from 'services/Product/product-api';
import PurchaseDialog from './Dialog/PurchaseDialog';
import LoadingDialog from 'components/LoadingDialog';
import { makeStyles } from '@mui/styles';
import BillingDialog from './Dialog/BillingDialog';
import { FreightPrice } from 'services/Freight/freight-type';
import { getFreightPriceByProvinceId } from 'services/Freight/freight-api';
import { copyText } from 'utils/copyContent';
import { urlToFile } from 'utils';
import { ROLES } from 'auth/roles';
import StaffWorkSelector from './Dialog/StaffWorkSelector';
import { searchStaff } from 'services/Staff/staff-api';
import { Staff, StaffKPI } from 'services/Staff/staff-type';
import AddNewLineDialog from './Dialog/AddNewLineDialog';
import EditLineDialog from './Dialog/EditLineDialog';
import CheckBoxComponent from 'components/CheckBoxComponent';
import { ShoppingBasket } from '@material-ui/icons';
import BuyingDialog from './Dialog/BuyingDialog';
import NumberTextField from 'components/NumberTextField';
import SimpleDialog from 'components/SimpleDialog';
import ManualHelpButton from 'pages/Manual/ManualHelpButton';
import AssignPackOrderDialog from '../AssignPackOrderDialog';
import { UserProfileResponse } from 'services/User/user-type';

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

export default function OrderCustomerDetail() {
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
  const { getRole, getStaffId } = useAuth();
  const params = useParams<SaleOrderParam>();
  const { t } = useTranslation();
  const [saleOrder, setSaleOrder] = useState<SaleOrder>();
  const [selectedPoLine, setSelectedPoLine] = useState<SaleOrderLine>();
  const [productSupplierData, setProductSupplierData] = useState<ProductSupplier>();
  const [selectedPoLineList, setSelectedPoLineList] = useState<SaleOrderLine[]>([]);
  const [selectedSku, setSelectedSku] = useState('');
  const [freightList, setFreightList] = useState<FreightPrice[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [actionType, setActionType] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [msg, setMsg] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
  const [isOpenAlertNotAllowDialog, setIsOpenAlertNotAllowDialog] = useState(false);
  const [openEditBoxDialog, setOpenEditBoxDialog] = useState(false);
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [openPurchaseDialog, setOpenPurchaseDialog] = useState(false);
  const [openBillingDialog, setOpenBillingDialog] = useState(false);
  const [openAddNewLineDialog, setOpenAddNewLineDialog] = useState(false);
  const [openBuyingDialog, setOpenBuyingDialog] = useState(false);
  const [openEditLineDialog, setOpenEditLineDialog] = useState(false);
  const [openNotAllowReAssignDialog, setOpenNotAllowReAssignDialog] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [openLoading, setOpenLoading] = useState(false);
  const [notAllowToMakeOrder, setNotAllowToMakeOrder] = useState(false);
  const [logoImageFiles, setLogoImageFiles] = useState<File[]>([]);
  const logoImageFileUrls = logoImageFiles.map((file) => URL.createObjectURL(file));
  const [slipImageFiles, setSlipImageFiles] = useState<File[]>([]);
  const slipImageFileUrls = slipImageFiles.map((file) => URL.createObjectURL(file));
  const [isDisplayInvoice, setIsDisplayInvoice] = useState(false);
  const [isDelivery, setIsDelivery] = useState(false);
  const [isHidePurchaseColumn, setIsHidePurchaseColumn] = useState(false);
  const [customerData, setCustomerData] = useState<string>('');
  const [deleteImageIdx, setDeleteImageIdx] = useState<number>(-1);
  const [userList, setUserList] = useState<UserProfileResponse>([]);
  const [packed, setPacked] = useState<StaffKPI[]>([]);
  const [manualId, setManualId] = useState('');
  const [notAllowReAssignMsg, setNotAllowReAssignMsg] = useState('');
  const [inputInvoiceHeader, setInputInvoiceHeader] = useState<string>();
  const prevInvoiceHeader = useRef(inputInvoiceHeader);

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
        checkAssignOrder();
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
        checkAssignOrder();
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
        checkAssignOrder();
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

  const checkAssignOrder = async () => {
    if (
      saleOrder &&
      saleOrder?.poMaker === null &&
      isDisplay([ROLES.ORDER_BKK, ROLES.ORDER_PROVINCE])
    ) {
      const assignReq: AssignPORequest = {
        poIds: [saleOrder.id],
        staffId: getStaffId()
      };
      toast.promise(assignSaleOrder(assignReq), {
        loading: t('toast.loading'),
        success: t('toast.success'),
        error: t('toast.failed')
      });
    }
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

  const totalPackage = useMemo(() => {
    return formatPackage(saleOrder?.totalPackage);
  }, [saleOrder]);

  function formatPackage(p?: OrderPackage): string {
    if (!p) return '-';

    const displayNames: Record<keyof OrderPackage, string> = {
      bigBox: t('purchaseOrder.updateBoxSection.bigBox'),
      smallBox: t('purchaseOrder.updateBoxSection.smallBox'),
      softBox: t('purchaseOrder.updateBoxSection.softBox'),
      phalanBox: t('purchaseOrder.updateBoxSection.phalanBox'),
      bigFoamBox: t('purchaseOrder.updateBoxSection.bigFoamBox'),
      smallFoamBox: t('purchaseOrder.updateBoxSection.smallFoamBox'),
      wrap: t('purchaseOrder.updateBoxSection.wrap'),
      bag: t('purchaseOrder.updateBoxSection.bag'),
      other: '',
      packedStaff: '',
      oasis: ''
    };

    console.log(JSON.stringify(p));

    const parts: string[] = [];

    Object.entries(p).forEach(([key, value]) => {
      if (key === 'packedStaff') return;
      if (typeof value === 'number' && value > 0) {
        const label = displayNames[key as keyof OrderPackage] || key;
        parts.push(`${label} ${value}`);
      }
      if (typeof value === 'string' && value !== '') {
        parts.push(`${value}`);
      }
    });

    return parts.length > 0 ? parts.join(', ') : '-';
  }

  const isDisplay = (roles: string[]): boolean => {
    const userRoleResult = getRole();
    const userRoles = Array.isArray(userRoleResult) ? userRoleResult : [userRoleResult];
    return userRoles.some((r) => roles.includes(r));
  };

  const buildLocalPatch = (actionType: string) => {
    switch (actionType) {
      case 'CONFIRM_BALLOON':
        return {
          status: 'OUT_OF_STOCK' as const,
          detail: 'ไม่มีสินค้าในสต๊อค',
          haveQty: 0,
          salePrice: selectedPoLine ? selectedPoLine.salesPrice : null,
          isFirstCheck: false,
          isSecondCheck: false
        };
      case 'CONFIRM_CHECK_1':
        return {
          status: 'COMPLETE' as const,
          detail: 'สินค้าครบตามที่ลูกค้าสั่ง',
          haveQty: selectedPoLine ? selectedPoLine.qty : null,
          salePrice: selectedPoLine ? selectedPoLine.salesPrice : null,
          isFirstCheck: true, // if this flag exists in your line type,
          isSecondCheck: false
        };
      case 'CONFIRM_CHECK_2':
        return {
          status: 'PACKED' as const,
          detail: 'สินค้าถูกแพ็คลงกล่อง',
          haveQty: selectedPoLine ? selectedPoLine.qty : null,
          salePrice: selectedPoLine ? selectedPoLine.salesPrice : null,
          isFirstCheck: true,
          isSecondCheck: true // if this flag exists
        };
      case 'DELETE_ITEM':
        return {
          status: 'CANCEL' as const,
          detail: 'ลูกค้าแจ้งยกเลิกรายการ',
          haveQty: selectedPoLine ? selectedPoLine.qty : null,
          salePrice: selectedPoLine ? selectedPoLine.salesPrice : null,
          isFirstCheck: false,
          isSecondCheck: false // if this flag exists
        };
      default:
        return {};
    }
  };

  const updateInvoiceHeader = () => {
    // if (saleOrder?.id) return;

    const updateReq: UpdateSaleOrderRequest = {
      poStatus: null,
      billingStatus: null,
      sendingTime: null,
      freight: null,
      additionalItem: null,
      remark: null,
      invoiceHeader: inputInvoiceHeader
    }
    toast.promise(updateSaleOrder(saleOrder?.id, updateReq), {
      loading: t('toast.loading'),
      success: () => {
        return t('toast.success');
      },
      error: () => {
        return t('toast.failed');
      }
    });
  };


  const getReAssignOrder = async () => {
    setOpenLoading(true);
    try {
      const resp = await getReAssignOrderInfo(params.id);
      setUserList(resp);
      setOpenAssignDialog(true);
      setOpenLoading(false);
    } catch (error: any) {
      const apiMessage = error.response?.data.message;
      setOpenLoading(false);
      setOpenNotAllowReAssignDialog(true);
      if ('ALLOW_ONLY_BKK' === apiMessage) {
        setNotAllowReAssignMsg(t('purchaseOrder.warning.allowOnlyBkk'));
      } else if ('CANNOT_REASSIGN' === apiMessage) {
        setNotAllowReAssignMsg(t('purchaseOrder.warning.cannotReAssign'));
      } else {
        setNotAllowReAssignMsg(t('general.commonErrorMessage'));
      }
    }
  }

  useEffect(async () => {
    if (!poData) return;

    setCanEdit(true);
    setSaleOrder(poData);
    setPacked(poData.packedStaffs);

    setNotAllowToMakeOrder(poData.isAllowToMakeOrder);
    if (!poData.isAllowToMakeOrder && !isDisplay([ROLES.SUPER_ADMIN, ROLES.ADMIN_BKK, ROLES.ADMIN_PROVINCE])) {
      setIsOpenAlertNotAllowDialog(true);
    }

    const convertToFiles = async () => {
      const packedFiles = await Promise.all(
        (poData?.packagePics || [])
          .filter((pic) => pic.picUrl.includes('_package_'))
          .map((pic) => urlToFile(pic.picUrl, `${pic.picId}`))
      );
      setLogoImageFiles(packedFiles);
      const slipFiles = await Promise.all(
        (poData?.packagePics || [])
          .filter((pic) => pic.picUrl.includes('_slip_'))
          .map((pic) => urlToFile(pic.picUrl, `${pic.picId}`))
      );
      setSlipImageFiles(slipFiles);
    };

    convertToFiles();

    const custData =
      poData?.customer.displayName +
      '\n' +
      poData?.customer.contactNumber1 +
      '\n\n' +
      poData?.dropOff.dropOffName +
      '\n' +
      'ส่ง ' +
      poData?.dropOff.supplier?.supplierShortName +
      '\n' +
      'เบอร์ติดต่อขนส่ง : ' +
      poData?.dropOff.supplier?.contactNumber;
    setCustomerData(custData);

    const freights = await getFreightPriceByProvinceId(poData.dropOff.province.id);
    setFreightList(freights.data);
    checkAssignOrder();
    const staffs = await searchStaff(
      {
        idEqual: '',
        roleEqual: '',
        roleIn: ['PACKER'],
        companyIdEqual: '',
        statusEqual: '',
        typeEqual: '',
        nationalityEqual: '',
        workspaceEqual: '',
        startWorkingTime: '',
        endWorkingTime: ''
      },
      1,
      100
    );
    setStaffList(staffs.data.staffs);

    setInputInvoiceHeader(poData.invoiceHeader);
    prevInvoiceHeader.current = inputInvoiceHeader;
  }, [poData]);

  useEffect(() => {
    const role = getRole();
    if (role === 'SUPER_ADMIN' || role === 'ACCOUNT' || role === 'ACCOUNT_ADMIN') {
      setIsDisplayInvoice(true);
    }
    if (role.startsWith('ORDER')) {
      setIsHidePurchaseColumn(true);
    }
    if (role === 'SUPER_ADMIN' || role.startsWith('ADMIN')) {
      setIsDelivery(true);
    }
  }, [getRole]);

  return (
    <Page>
      <PageTitle title={'ออเดอร์ : ' + saleOrder?.id} manualId="MANUAL000004" />
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
            className="btn-indigo-blue"
            variant="contained"
            onClick={() => {
              getReAssignOrder();
            }}
            startIcon={<ArrowOutward />}>
            {t('purchaseOrder.reAssign')}
          </Button>
          <Button
            fullWidth={isDownSm}
            className={
              !notAllowToMakeOrder && getRole() === 'SUPER_ADMIN'
                ? 'btn-lavender-pink'
                : classes.hideObject
            }
            variant="contained"
            color="info"
            onClick={() => {
              setActionType('APPROVE_REQUEST');
              setManualId('MANUAL000007');
              setTitle(t('purchaseOrder.confirmApproveTitle', { poId: saleOrder?.id }));
              setMsg(t('purchaseOrder.confirmApproveMsg'));
              setVisibleConfirmationDialog(true);
            }}
            startIcon={<DoneAll />}>
            {t('purchaseOrder.approveToMakeOrder')}
          </Button>
          <Button
            fullWidth={isDownSm}
            disabled={notAllowToMakeOrder}
            className={!notAllowToMakeOrder && isDisplay([ROLES.ORDER_BKK, ROLES.ORDER_PROVINCE]) ? 'btn-forest-green' : classes.hideObject}
            variant="contained"
            onClick={() => {
              setActionType('REQUEST_APPROVE');
              setManualId('MANUAL000006');
              setTitle(t('purchaseOrder.confirmRequestApproveTitle', { poId: saleOrder?.id }));
              setMsg(t('purchaseOrder.confirmRequestApproveMsg'));
              setVisibleConfirmationDialog(true);
            }}
            startIcon={<ChecklistRtl />}>
            {t('purchaseOrder.requestToMakeOrder')}
          </Button>
          <Button
            fullWidth={isDownSm}
            className={isDisplay([ROLES.SUPER_ADMIN, ROLES.ORDER_BKK, ROLES.ORDER_PROVINCE]) ? 'btn-forest-green' : classes.hideObject}
            variant="contained"
            color="success"
            disabled={saleOrder?.orderStatus !== 'COMPLETED'}
            onClick={() => {
              setActionType('DELIVER');
              setTitle(t('purchaseOrder.confirmDeliverTitle'));
              setMsg(t('purchaseOrder.confirmDeliverMsg'));
              setVisibleConfirmationDialog(true);
            }}
            startIcon={<LocalShipping />}>
            {t('purchaseOrder.deliver')}
          </Button>
          <Button
            fullWidth={isDownSm}
            className={
              isDisplay([ROLES.ADMIN_BKK, ROLES.ADMIN_PROVINCE, ROLES.SUPER_ADMIN])
                ? 'btn-crimson-red'
                : classes.hideObject
            }
            variant="contained"
            color="info"
            onClick={() => {
              setActionType('CANCEL_PO');
              setTitle(t('purchaseOrder.confirmCancelTitle', { poId: saleOrder?.id }));
              setMsg(t('purchaseOrder.confirmCancelMsg'));
              setVisibleConfirmationDialog(true);
            }}
            startIcon={<DeleteForever />}>
            {t('procurement.purchaseOrder.button.cancelPo')}
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
                  label={t('purchaseOrder.orderInformationSection.fields.labels.projectName')}
                  fullWidth
                  variant="outlined"
                  value={inputInvoiceHeader}
                  onChange={({ target }) => {
                    setInputInvoiceHeader(target.value);
                  }}
                  onBlur={updateInvoiceHeader}
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
                  value={t(`status.invoice.${saleOrder?.billingStatus}`)}
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
                  label={t('purchaseOrder.orderInformationSection.fields.labels.projectName')}
                  fullWidth
                  variant="outlined"
                  value={inputInvoiceHeader}
                  onChange={({ target }) => setInputInvoiceHeader(target.value)}
                  onBlur={updateInvoiceHeader}
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
                  value={t(`status.invoice.${saleOrder?.billingStatus}`)}
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
            <Box display="flex" alignItems="center">
              <Typography sx={{ marginRight: 1 }}>
                {t('purchaseOrder.productSection.title')}
              </Typography>
              <ManualHelpButton manualId="MANUAL000008" />
            </Box>
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
            {isDisplay([ROLES.SUPER_ADMIN, ROLES.ADMIN_BKK, ROLES.ADMIN_PROVINCE]) && (
              <>
                {/* xs-only: Add icon */}
                <Tooltip title={t('purchaseOrder.addItem')}>
                  <IconButton
                    size="small"
                    // disabled={!notAllowToMakeOrder}
                    onClick={() => setOpenAddNewLineDialog(true)}
                    className="btn-indigo-blue"
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
                    <Add />
                  </IconButton>
                </Tooltip>

                {/* sm-up: Add item button */}
                <Button
                  variant="contained"
                  className="btn-indigo-blue"
                  startIcon={<Add />}
                  size={isDownSm ? 'small' : 'medium'}
                  onClick={() => setOpenAddNewLineDialog(true)}
                  sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                  {t('purchaseOrder.addItem')}
                </Button>
              </>
            )}{' '}
            {isDisplay([ROLES.SUPER_ADMIN, ROLES.PROCUREMENT, ROLES.PROCUREMENT_ADMIN]) && (
              <>
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
                  // disabled={selectedPoLineList.length === 0}
                  onClick={() => setOpenBuyingDialog(true)}
                  sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                  {t('purchaseOrder.buying')}
                </Button>
              </>
            )}
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
                key="haveQty"
                align="center"
                style={{
                  width: isMobileOnly ? '50px' : '75px',
                  padding: isMobileOnly ? '16px 2px 16px 2px' : 'auto',
                  display: !isDisplay([ROLES.PROCUREMENT, ROLES.PROCUREMENT_ADMIN]) ? '' : 'none'
                }}>
                {t('purchaseOrder.productSection.fields.labels.haveQty')}
              </TableCell>
              <TableCell
                key="haveQty"
                align="center"
                style={{
                  width: isMobileOnly ? '50px' : '75px',
                  padding: isMobileOnly ? '16px 2px 16px 2px' : 'auto',
                  display: isDisplay([
                    ROLES.SUPER_ADMIN,
                    ROLES.PROCUREMENT,
                    ROLES.PROCUREMENT_ADMIN
                  ])
                    ? ''
                    : 'none'
                }}>
                ❌ {t('purchaseOrder.productSection.fields.labels.need')}
              </TableCell>
              <TableCell
                key="purchase"
                align="center"
                style={{
                  width: '300px',
                  padding: isMobileOnly ? '16px 2px 16px 2px' : 'auto',
                  display: isDisplay([
                    ROLES.SUPER_ADMIN,
                    ROLES.PROCUREMENT,
                    ROLES.PROCUREMENT_ADMIN
                  ])
                    ? ''
                    : 'none'
                }}>
                {t('purchaseOrder.productSection.fields.labels.purchaseFrom')}
              </TableCell>
              <TableCell
                key="salePrice"
                align="center"
                style={{
                  width: isMobileOnly ? '60px' : '120px',
                  padding: isMobileOnly ? '16px 2px 16px 2px' : 'auto',
                  display: isDisplay([
                    ROLES.SUPER_ADMIN,
                    ROLES.PROCUREMENT,
                    ROLES.PROCUREMENT_ADMIN,
                    ROLES.ACCOUNT,
                    ROLES.ACCOUNT_ADMIN
                  ])
                    ? ''
                    : 'none'
                }}>
                {t('purchaseOrder.productSection.fields.labels.salePrice')}
              </TableCell>
              <TableCell
                key="check1"
                align="center"
                style={{
                  width: '20px',
                  display: isDisplay([ROLES.SUPER_ADMIN, ROLES.ORDER_BKK, ROLES.ORDER_PROVINCE])
                    ? ''
                    : 'none'
                }}>
                <IoHeart
                  style={{
                    fontSize: '22px',
                    color: '#FF8C00'
                  }}
                />
              </TableCell>
              <TableCell
                key="check2"
                align="center"
                style={{
                  width: '20px',
                  display: isDisplay([ROLES.SUPER_ADMIN, ROLES.ORDER_BKK, ROLES.ORDER_PROVINCE])
                    ? ''
                    : 'none'
                }}>
                <IoHeart
                  style={{
                    fontSize: '22px',
                    color: '#9B30FF'
                  }}
                />
              </TableCell>
              <TableCell
                key="check2"
                align="center"
                style={{
                  width: '20px',
                  display: isDisplay([ROLES.SUPER_ADMIN, ROLES.ADMIN_BKK, ROLES.ADMIN_PROVINCE])
                    ? ''
                    : 'none'
                }}></TableCell>
            </TableHead>
            <TableBody>
              {saleOrder?.saleOrderLines
                .filter((item: SaleOrderLine) => item.itemSku && !/^3[12]/.test(item.itemSku))
                .filter((item: SaleOrderLine) => {
                  if (isDisplay([ROLES.PROCUREMENT, ROLES.PROCUREMENT_ADMIN])) {
                    return ['INCOMPLETE', 'OUT_OF_STOCK'].includes(item.status);
                  }
                  return true;
                })
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
                        {isDisplay([ROLES.PROCUREMENT, ROLES.PROCUREMENT_ADMIN]) ? (
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
                        ) : (
                          <IconButton
                            disabled={!notAllowToMakeOrder}
                            onClick={() => {
                              setTitle(t('purchaseOrder.confirmBalloonTitle'));
                              setMsg(t('purchaseOrder.confirmBalloonMsg'));
                              setActionType('CONFIRM_BALLOON');
                              setVisibleConfirmationDialog(true);
                              setSelectedPoLine(item); // ✅ ใช้ item ตรง ๆ
                            }}>
                            <IoBalloon
                              style={{ color: item.status === 'OUT_OF_STOCK' ? 'RED' : 'inherit' }}
                            />
                          </IconButton>
                        )}
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
                          }}
                          onClick={() => {
                            setSelectedSku(item.itemSku);
                            setOpenProductDialog(true);
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
                          </Typography>)
                          : null} */}
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

                      {/* Col: haveQty (editable only by ORDER roles) */}
                      <TableCell
                        style={
                          isMobileOnly
                            ? {
                              ...isMobileCellPad,
                              textAlign: 'center',
                              display: !isDisplay([ROLES.PROCUREMENT, ROLES.PROCUREMENT_ADMIN])
                                ? ''
                                : 'none'
                            }
                            : {
                              display: !isDisplay([ROLES.PROCUREMENT, ROLES.PROCUREMENT_ADMIN])
                                ? ''
                                : 'none'
                            }
                        }>
                        {isDisplay([ROLES.SUPER_ADMIN, ROLES.ORDER_BKK, ROLES.ORDER_PROVINCE]) ? (
                          <NumberTextField
                            required
                            value={item.haveQty ?? null}
                            min={1}
                            onChange={(val) => {
                              updatePoLine(item.id, (line) => ({ ...line, haveQty: val }));
                            }}
                            onCommit={(val) => {
                              if (val !== null) {
                                // ✅ ปรับให้ส่ง id แทน index
                                onUpdatedProductQty(item.id, item, val);
                              }
                            }}
                            disabled={!notAllowToMakeOrder}
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
                            style={
                              item.status === 'CANCEL' ? { textDecoration: 'line-through' } : {}
                            }
                            size="small"
                          />
                        ) : (
                          <Typography
                            sx={{ textAlign: 'center' }}
                            style={
                              item.status === 'CANCEL' ? { textDecoration: 'line-through' } : {}
                            }>
                            {item.haveQty ?? '-'}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Col: haveQty (editable only by ORDER roles) */}
                      <TableCell
                        style={{
                          textAlign: 'center',
                          padding: isMobileOnly ? '16px 2px 16px 2px' : 'auto',
                          display: isDisplay([
                            ROLES.SUPER_ADMIN,
                            ROLES.PROCUREMENT,
                            ROLES.PROCUREMENT_ADMIN
                          ])
                            ? ''
                            : 'none'
                        }}>
                        {item.qty - item.haveQty <= 0 ? '-' : item.qty - item.haveQty}
                      </TableCell>

                      {/* Col: Supplier (readonly with edit) */}
                      <TableCell
                        style={{
                          textAlign: 'center',
                          padding: isMobileOnly ? '16px 2px 16px 2px' : 'auto',
                          display: isDisplay([
                            ROLES.SUPER_ADMIN,
                            ROLES.PROCUREMENT,
                            ROLES.PROCUREMENT_ADMIN
                          ])
                            ? ''
                            : 'none'
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
                          disabled={item.status === 'CANCEL' || !notAllowToMakeOrder}
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
                                  disabled={
                                    item.haveQty === item.qty ||
                                    item.status === 'CANCEL' ||
                                    !notAllowToMakeOrder
                                  }
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
                              textAlign: 'center',
                              display: isDisplay([
                                ROLES.SUPER_ADMIN,
                                ROLES.PROCUREMENT,
                                ROLES.PROCUREMENT_ADMIN,
                                ROLES.ACCOUNT,
                                ROLES.ACCOUNT_ADMIN
                              ])
                                ? ''
                                : 'none'
                            }
                            : {
                              textAlign: 'center',
                              display: isDisplay([
                                ROLES.SUPER_ADMIN,
                                ROLES.PROCUREMENT,
                                ROLES.PROCUREMENT_ADMIN,
                                ROLES.ACCOUNT,
                                ROLES.ACCOUNT_ADMIN
                              ])
                                ? ''
                                : 'none'
                            }
                        }>
                        <NumberTextField
                          required
                          disabled={!notAllowToMakeOrder}
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

                      {/* Col: First Check */}
                      <TableCell
                        align="center"
                        style={
                          isMobileOnly
                            ? {
                              ...isMobileCellPad,
                              display: isDisplay([
                                ROLES.SUPER_ADMIN,
                                ROLES.ORDER_BKK,
                                ROLES.ORDER_PROVINCE
                              ])
                                ? ''
                                : 'none'
                            }
                            : {
                              display: isDisplay([
                                ROLES.SUPER_ADMIN,
                                ROLES.ORDER_BKK,
                                ROLES.ORDER_PROVINCE
                              ])
                                ? ''
                                : 'none'
                            }
                        }>
                        <IconButton
                          id={`is_first_check_${item.id}_check_box`}
                          disabled={item.status === 'CANCEL' || !notAllowToMakeOrder}
                          onClick={() => {
                            setTitle(t('purchaseOrder.confirmCheck1Title'));
                            setMsg(t('purchaseOrder.confirmCheck1Msg'));
                            setActionType('CONFIRM_CHECK_1');
                            setVisibleConfirmationDialog(true);
                            setSelectedPoLine(item); // ✅
                          }}>
                          <IoHeart style={{ color: item.isFirstCheck ? '#FF8C00' : 'inherit' }} />
                        </IconButton>
                      </TableCell>

                      {/* Col: Second Check */}
                      <TableCell
                        align="center"
                        style={
                          isMobileOnly
                            ? {
                              ...isMobileCellPad,
                              display: isDisplay([
                                ROLES.SUPER_ADMIN,
                                ROLES.ORDER_BKK,
                                ROLES.ORDER_PROVINCE
                              ])
                                ? ''
                                : 'none'
                            }
                            : {
                              display: isDisplay([
                                ROLES.SUPER_ADMIN,
                                ROLES.ORDER_BKK,
                                ROLES.ORDER_PROVINCE
                              ])
                                ? ''
                                : 'none'
                            }
                        }>
                        <IconButton
                          id={`is_second_check_${item.id}_check_box`}
                          disabled={item.status !== 'COMPLETE' || !notAllowToMakeOrder}
                          onClick={() => {
                            setTitle(t('purchaseOrder.confirmCheck2Title'));
                            setMsg(t('purchaseOrder.confirmCheck2Msg'));
                            setActionType('CONFIRM_CHECK_2');
                            setVisibleConfirmationDialog(true);
                            setSelectedPoLine(item); // ✅
                          }}>
                          <IoHeart style={{ color: item.isSecondCheck ? '#9B30FF' : 'inherit' }} />
                        </IconButton>
                      </TableCell>

                      {/* Col: Edit */}
                      <TableCell
                        align="center"
                        style={
                          isMobileOnly
                            ? {
                              ...isMobileCellPad,
                              display: isDisplay([
                                ROLES.SUPER_ADMIN,
                                ROLES.ADMIN_BKK,
                                ROLES.ADMIN_PROVINCE
                              ])
                                ? ''
                                : 'none'
                            }
                            : {
                              display: isDisplay([
                                ROLES.SUPER_ADMIN,
                                ROLES.ADMIN_BKK,
                                ROLES.ADMIN_PROVINCE
                              ])
                                ? ''
                                : 'none'
                            }
                        }>
                        <Tooltip title={t('purchaseOrder.editItem')}>
                          <IconButton
                            id={`edit_item_${item.id}_btn`}
                            disabled={item.status === 'CANCEL'}
                            onClick={() => {
                              setSelectedPoLine(item); // ✅
                              setOpenEditLineDialog(true);
                            }}
                            sx={{
                              transition: 'all 0.2s',
                              '&:hover': { bgcolor: 'rgba(21, 0, 255, 0.1)', color: 'blue' }
                            }}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
      </Wrapper>
      {isDisplay([ROLES.SUPER_ADMIN, ROLES.ORDER_BKK, ROLES.ORDER_PROVINCE]) &&
        notAllowToMakeOrder ? (
        <>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
              <Wrapper>
                <Grid container spacing={1}>
                  <GridTextField item xs={12} sm={4}>
                    <Typography>{t('purchaseOrder.deliverySection.title')}</Typography>
                  </GridTextField>
                  <GridTextField item xs={12} sm={8} />
                  <GridTextField item xs={12} sm={6}>
                    <TextField
                      type="text"
                      label={t(
                        'purchaseOrder.customerInformationSection.fields.labels.envelopeName'
                      )}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      value={saleOrder?.dropOff.envelopName}
                      InputLabelProps={{ shrink: true }}
                    />
                  </GridTextField>
                  <GridTextField item xs={12} sm={6} />
                  <GridTextField item xs={12} sm={4}>
                    <Typography>{t('purchaseOrder.deliverySection.image')}</Typography>
                  </GridTextField>
                  <GridTextField item xs={12} sm={12}>
                    <ImageFileUploaderWrapper
                      id="logo-uploader-id"
                      inputId="logo-id"
                      isDisabled={false}
                      readOnly={false}
                      maxFiles={6}
                      isMultiple={true}
                      onError={() => { }}
                      onDeleted={(index) => {
                        setTitle(t('purchaseOrder.confirmDeletePicTitle'));
                        setMsg(t('purchaseOrder.confirmDeletePicMsg'));
                        setActionType('DELETE_PIC');
                        setVisibleConfirmationDialog(true);
                        setDeleteImageIdx(index);
                      }}
                      onSuccess={async (files) => {
                        const resizedFiles = await Promise.all(
                          files.map((file) => resizeFile(file))
                        );

                        const formData = new FormData();
                        resizedFiles.forEach((file) => {
                          formData.append('pictures', file);
                        });

                        toast.promise(uploadSaleOrderPackImage(params.id, formData), {
                          loading: t('toast.loading'),
                          success: () => {
                            setLogoImageFiles(files);
                            return t('toast.success');
                          },
                          error: (error) => t('toast.failed') + ' ' + error.message
                        });
                      }}
                      files={logoImageFileUrls}
                      fileUploader={FileUploader}
                      isError={false}
                    />
                  </GridTextField>
                </Grid>
              </Wrapper>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Wrapper>
                <Grid container spacing={1}>
                  <GridTextField item xs={12} sm={12} />
                  <GridTextField item xs={12} sm={4}>
                    <Box display="flex" alignItems="center">
                      <Typography sx={{ marginRight: 1 }}>
                        {t('purchaseOrder.updateBoxSection.title')}
                      </Typography>
                      <ManualHelpButton manualId="MANUAL000009" />
                    </Box>
                  </GridTextField>
                  <GridTextField item xs={12} sm={8} />
                  <GridTextField item xs={12} sm={12}>
                    <TextField
                      label={t('purchaseOrder.updateBoxSection.title')}
                      value={totalPackage}
                      multiline
                      maxRows={2}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
                            <ModeEdit />
                          </InputAdornment>
                        )
                      }}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      onClick={() => setOpenEditBoxDialog(true)}
                    />
                  </GridTextField>
                  <GridTextField item xs={12} sm={12}>
                    <StaffWorkSelector
                      poId={params.id}
                      staffList={staffList}
                      value={packed}
                      onChange={setPacked}
                      label={t('purchaseOrder.updateBoxSection.packedStaff')}
                    />
                  </GridTextField>
                </Grid>
              </Wrapper>
            </Grid>
          </Grid>
        </>
      ) : (
        <></>
      )}
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
              history.push(ROUTE_PATHS.SALE_ORDER_MANAGEMENT);
            }}
            startIcon={<Save />}>
            {t('button.save')}
          </Button>
          <Button
            fullWidth={isDownSm}
            className="btn-pastel-yellow "
            variant="contained"
            onClick={() => {
              setActionType('CONFIRMED');
              setTitle(t('purchaseOrder.confirmConfirmTitle'));
              setMsg(t('purchaseOrder.confirmConfirmMsg'));
              setVisibleConfirmationDialog(true);
            }}
            startIcon={<CheckCircle />}>
            {t('purchaseOrder.confirmConfirmTitle')}
          </Button>
          <Button
            fullWidth={isDownSm}
            className="btn-indigo-blue"
            variant="contained"
            disabled={saleOrder?.previousId === '' || saleOrder?.previousId === null}
            onClick={() => {
              window.location.href = `/sale-order/${saleOrder?.previousId}`;
            }}
            startIcon={<ArrowBack />}>
            {t('purchaseOrder.previousOrder')}
          </Button>
          <Button
            fullWidth={isDownSm}
            className="btn-indigo-blue"
            variant="contained"
            disabled={saleOrder?.nextId === '' || saleOrder?.nextId === null}
            onClick={() => {
              window.location.href = `/sale-order/${saleOrder?.nextId}`;
            }}
            startIcon={<ArrowForward />}>
            {t('purchaseOrder.nextOrder')}
          </Button>
        </Stack>
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
            className="btn-lavender-pink"
            variant="contained"
            onClick={() => {
              setActionType('CONFIRM');
              setTitle(t('purchaseOrder.confirmCompleteTitle'));
              setMsg(t('purchaseOrder.confirmCompleteMsg'));
              setVisibleConfirmationDialog(true);
            }}
            startIcon={<RocketLaunch />}>
            {t('purchaseOrder.complete')}
          </Button>
        </Stack>
      </Wrapper>
      <LoadingDialog open={isPoFetching} />
      <EditBoxDialog
        open={openEditBoxDialog}
        poId={saleOrder?.id}
        orderPackage={saleOrder?.totalPackage}
        onClose={async (value: OrderPackage | null, isSuccess: boolean) => {
          if (isSuccess && value) {
            setOpenLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 2500));
            const poData = await getSaleOrder(params.id);
            setSaleOrder(poData);
            setOpenLoading(false);
          }
          setOpenEditBoxDialog(false);
        }}
      />
      <AddNewLineDialog
        open={openAddNewLineDialog}
        poId={saleOrder?.id}
        onClose={(isSuccess: boolean) => {
          if (isSuccess) {
            poRefetch();
          }
          setOpenAddNewLineDialog(false);
        }}
      />
      <EditLineDialog
        open={openEditLineDialog}
        poId={saleOrder?.id}
        poLine={selectedPoLine}
        onClose={(isSuccess: boolean) => {
          if (isSuccess) {
            poRefetch();
          }
          setOpenEditLineDialog(false);
        }}
      />
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
      <ProductDialog
        open={openProductDialog}
        itemSku={selectedSku}
        onClose={() => {
          setSelectedSku('');
          setOpenProductDialog(false);
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
      <BillingDialog
        open={openBillingDialog}
        po={saleOrder || undefined}
        orderPackage={saleOrder?.totalPackage}
        freights={freightList}
        onClose={(value: boolean) => {
          if (value) {
            poRefetch();
          }
          setOpenBillingDialog(false);
        }}
      />
      <SimpleDialog
        open={isOpenAlertNotAllowDialog}
        message={t('purchaseOrder.warningNotAllowToMakeOrder')}
        icon="error"
        onClose={() => {
          setIsOpenAlertNotAllowDialog(false);
        }}
      />
      <SimpleDialog
        open={openNotAllowReAssignDialog}
        message={notAllowReAssignMsg}
        icon="warning"
        onClose={() => {
          // setIsOpenDutyDialog(true);
          setOpenNotAllowReAssignDialog(false);
        }}
      />
      <AssignPackOrderDialog
        open={openAssignDialog}
        poList={poData ? [poData] : []}
        userList={userList}
        onClose={() => {
          setOpenAssignDialog(false);
        }}
      />
      <LoadingDialog open={openLoading} />
      <ConfirmDialog
        open={visibleConfirmationDialog}
        title={title}
        message={msg}
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        manualId={manualId}
        onConfirm={async () => {
          // 1) build request body for the API like you already do
          let updateObj: UpdatePOLineRequest | undefined;

          if (actionType === 'CONFIRM_BALLOON') {
            updateObj = {
              status: 'OUT_OF_STOCK',
              detail: 'ไม่มีสินค้าในสต๊อค',
              haveQty: 0,
              salePrice: 0
            };
          } else if (actionType === 'CONFIRM_CHECK_1') {
            updateObj = {
              status: 'COMPLETE',
              detail: 'สินค้าครบตามที่ลูกค้าสั่ง',
              haveQty: selectedPoLine ? selectedPoLine.qty : 0,
              salePrice: selectedPoLine ? selectedPoLine.salesPrice : null,
              isFirstCheck: true,
              isSecondCheck: false
            };
          } else if (actionType === 'CONFIRM_CHECK_2') {
            updateObj = {
              status: 'PACKED',
              detail: 'สินค้าถูกแพ็คลงกล่อง',
              haveQty: selectedPoLine ? selectedPoLine.qty : 0,
              salePrice: selectedPoLine ? selectedPoLine.salesPrice : null,
              isFirstCheck: true,
              isSecondCheck: true
            };
          } else if (actionType === 'DELETE_ITEM') {
            updateObj = {
              status: 'CANCEL',
              detail: 'ลูกค้าแจ้งยกเลิกสินค้า',
              haveQty: null,
              salePrice: null,
              isFirstCheck: false,
              isSecondCheck: false
            };
          }

          try {
            if (actionType === 'DELIVER') {
              await updateSaleOrderStatus(params.id, 'SHIPPED').then(() => poRefetch());
            } else if (actionType === 'CONFIRMED') {
              await updateSaleOrderStatus(params.id, 'ORDER_CONFIRMED').then(() => poRefetch());
            } else if (actionType === 'COMPLETE') {
              await updateSaleOrderStatus(params.id, 'COMPLETED').then(() => poRefetch());
            } else if (actionType === 'CANCEL_PO') {
              await updateSaleOrderStatus(params.id, 'CANCELLED').then(() => poRefetch());
            } else if (actionType === 'DELETE_PIC') {
              if (deleteImageIdx === -1) {
                return;
              }
              const deletedFile = logoImageFiles.filter((_, i) => i === deleteImageIdx)[0];
              toast.promise(deleteSaleOrderPackImage(params.id, deletedFile.name), {
                loading: t('toast.loading'),
                success: () => {
                  const newFiles = logoImageFiles.filter((_, i) => i !== deleteImageIdx);
                  setLogoImageFiles(newFiles);
                  return t('toast.success');
                },
                error: (error) => t('toast.failed') + ' ' + error.message
              });
            } else if (actionType === 'CONFIRM_TRANSFER') {
              const formData = new FormData();
              if (slipImageFiles.length !== 0) {
                const resizedFiles = await Promise.all(
                  slipImageFiles.map((file) => resizeFile(file))
                );

                resizedFiles.forEach((file) => {
                  formData.append('pictures', file);
                });
              }

              toast.promise(confirmPaidSaleOrder(params.id, formData), {
                loading: t('toast.loading'),
                success: () => {
                  poRefetch();
                  return t('toast.success');
                },
                error: (error) => t('toast.failed') + ' ' + error.message
              });
            } else if (actionType === 'REQUEST_APPROVE') {
              toast.promise(requestToMakeOrder(params.id), {
                loading: t('toast.loading'),
                success: () => {
                  poRefetch();
                  return t('toast.success');
                },
                error: (error) => t('toast.failed') + ' ' + error.message
              });
            } else if (actionType === 'APPROVE_REQUEST') {
              toast.promise(approveToMakeOrder(params.id), {
                loading: t('toast.loading'),
                success: () => {
                  poRefetch();
                  return t('toast.success');
                },
                error: (error) => t('toast.failed') + ' ' + error.message
              });
            } else if (updateObj) {
              // 2) call backend and await toast
              await toast.promise(
                updateSaleOrderLineStatus(saleOrder?.id, selectedPoLine?.id, updateObj),
                {
                  loading: t('toast.loading'),
                  success: () => {
                    checkAssignOrder();
                    return t('toast.success');
                  },
                  error: () => t('toast.failed')
                }
              );

              // 3) optimistic local patch (no reload / no refetch)
              const localPatch = buildLocalPatch(actionType);

              setSaleOrder((prev) =>
                !prev
                  ? prev
                  : {
                    ...prev,
                    saleOrderLines: prev.saleOrderLines.map((line, i) => {
                      if (
                        selectedPoLine?.id
                          ? line.id === selectedPoLine.id
                          : i === (selectedIndex ?? -1)
                      ) {
                        return {
                          ...line,
                          ...localPatch
                        };
                      }
                      return line;
                    })
                  }
              );
            }
          } finally {
            setVisibleConfirmationDialog(false);
            setSelectedIndex(null);
          }
        }}
        onCancel={() => setVisibleConfirmationDialog(false)}
        isShowCancelButton={true}
        isShowConfirmButton={true}
      />
    </Page>
  );
}
