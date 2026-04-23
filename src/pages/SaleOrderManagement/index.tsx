/* eslint-disable prettier/prettier */
import {
  Search,
  DisabledByDefault,
  AddShoppingCart,
  MoreVert,
  Visibility,
  Person,
  Place,
  AccessTime,
  SearchOff
} from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  Fade,
  Grid,
  IconButton,
  List,
  Menu,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import PageTitle from 'components/PageTitle';
import Paginate from 'components/Paginate';
import DatePicker from 'components/DatePicker';
import { GridSearchSection, TextLineClamp, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import dayjs from 'dayjs';
import {
  DEFAULT_DATE_FORMAT,
  DEFAULT_DATE_FORMAT_BFF
} from 'utils';
import { searchOrder } from 'services/SaleOrder/sale-order-api';
import {
  billingStatus,
  poLineStatus,
  poStatus,
  SaleOrder,
  SearchSaleOrderRequest
} from 'services/SaleOrder/sale-order-type';
import { useFormik } from 'formik';
import { getSystemConfig } from 'services/Config/config-api';
import { GROUP_CODE, SystemConfig } from 'services/Config/config-type';
import { useAuth } from 'auth/AuthContext';
import { isMobileOnly } from 'react-device-detect';
import CheckBoxComponent from 'components/CheckBoxComponent';
import AssignPackOrderDialog from './AssignPackOrderDialog';
import { searchUser } from 'services/User/user-api';
import { getAllCustomer } from 'services/Customer/customer-api';
import { Customer } from 'services/Customer/customer-type';
import { ROLES } from 'auth/roles';
import { getDuty } from 'services/Duty/duty-api';
import SimpleDialog from 'components/SimpleDialog';
import DutyDialog from 'pages/DutyDialog';
import React from 'react';

export default function OrderManagement() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));

  const history = useHistory();
  const { getRole, getStaffRole, getStaffId } = useAuth();
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
    datePickerFromTo: {
      '&& .MuiOutlinedInput-input': {
        padding: '16.5px 14px'
      },
      '&& .MuiFormLabel-root': {
        fontSize: '13px'
      }
    },
    bkkChip: {
      backgroundColor: '#068710',
      color: 'white'
    },
    provinceChip: {
      backgroundColor: '#a533ff',
      color: 'white'
    },
    poNoChip: {
      color: 'white',
      backgroundColor: 'black'
    }
  });
  const classes = useStyles();
  const today = new Date();
  const [anchorEl, setAnchorEl] = useState();
  const open = Boolean(anchorEl);
  const [page, setPage] = useState<number>(1);
  const [selectedCustomerId, setSelectCustomerId] = useState<string>('');
  const [pages, setPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [checkedAllPO, setCheckedAllPO] = useState<boolean>(false)
  const [selectedPO, setSelectedPO] = useState<SaleOrder[] | undefined>([]);
  const [isEnableNewPO, setIsEnableNewPO] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [isOpenAlertDutyDialog, setIsOpenAlertDutyDialog] = useState(false);
  const [isOpenDutyDialog, setIsOpenDutyDialog] = useState(false);
  const [orderUserList, setOrderUserList] = useState([]);
  const [selectedOrderUserList, setSelectedOrderUserList] = useState<string[]>([]);
  const defaultFilter: SearchSaleOrderRequest = {
    createdDate: null,
    deliveryDate: dayjs(today).startOf('day').format(DEFAULT_DATE_FORMAT_BFF),
    // startDeliveryDate: dayjs(today).startOf('day').format(DEFAULT_DATETIME_FORMAT_ISO),
    // endDeliveryDate: dayjs(today).endOf('day').format(DEFAULT_DATETIME_FORMAT_ISO),
    poStatusIn: [ROLES.ORDER_BKK, ROLES.ORDER_PROVINCE].includes(getRole()) ? ['AWAITING_PAYMENT', 'ORDER_CONFIRMED', 'PROCESSING'] : null,
    poStatusEqual: null,
    billingStatusIn: null,
    poLineStatusEqual: null,
    poLineStatusIn: getRole() === ROLES.PROCUREMENT || getRole() === ROLES.PROCUREMENT_ADMIN ? ['INCOMPLETE', 'OUT_OF_STOCK'] : null,
    customerNameContain: '',
    supplierIdEqual: '',
    poMakerIdEqual: [ROLES.ORDER_BKK, ROLES.ORDER_PROVINCE].includes(getStaffRole()) ? getStaffId() : '',
    areaTypeEqual: getStaffRole().endsWith('_BKK') ? 'BKK' : getStaffRole().endsWith('_PROVINCE') ? 'PROVINCE' : '',
    billingStatusEqual: null,
    customerIdEqual: null,
    orderNoEqual: null
  };
  const [orderFilter, setOrderFilter] = useState<SearchSaleOrderRequest>({
    ...defaultFilter
  });
  const {
    data: orderList,
    refetch: orderRefetch,
    isFetching: isPOFetching
  } = useQuery(['order-management-list', orderFilter, page, pageSize], () => searchOrder(orderFilter, page, pageSize), {
    refetchOnWindowFocus: false,
    keepPreviousData: true,
    onSuccess: (data) => {
      if (data?.data?.pagination) {
        setPage(data.data.pagination.page);
        setPageSize(data.data.pagination.size);
        setPages(data.data.pagination.totalPage);
      }
    }
  });
  const { data: customerAreaList, isFetching: isAreaFetching } = useQuery(
    'customer-area',
    () => getSystemConfig(GROUP_CODE.CUSTOMER_AREA),
    {
      refetchOnWindowFocus: false
    }
  );
  const { data: userList } = useQuery(
    'user-list',
    () => searchUser({
      roleIn: ['ORDER_BKK', 'ORDER_PROVINCE'],
      usernameContain: '',
      roleNameEqual: '',
      activeEqual: '',
      companyIdEqual: ''
    }, 1, 100),
    {
      refetchOnWindowFocus: false
    }
  );
  const { data: customerList, isFetching: isCustomerFetching } = useQuery(
    'get-all-customer',
    () => getAllCustomer({
      idEqual: '',
      nameContain: '',
      typeEqual: '',
      rankEqual: '',
      areaEqual: ''
    }),
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true
    }
  );

  const handleSelectAllPO = () => {
    setCheckedAllPO(!checkedAllPO);
    setSelectedPO(orderList?.data.saleOrders);

    if (checkedAllPO) {
      setSelectedPO([]);
    }
  }

  const handleSelectPO = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = event.target;
    const po = orderList?.data.saleOrders.filter((po) => po.id === id);
    setSelectedPO([...selectedPO, po[0]]);
    if (!checked) {
      setSelectedPO(selectedPO?.filter((po) => po.id !== id));
    }
  }
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleClick = (event, id: string) => {
    setSelectCustomerId(id);
    setAnchorEl(event.currentTarget);
  };
  const searchFormik = useFormik({
    initialValues: {
      ...defaultFilter,
      customer: null,
      poMaker: userList?.data?.users?.find(
        (user) => user.staff.id === defaultFilter.poMakerIdEqual
      ) || null
    },
    enableReinitialize: true,
    onSubmit: (values) => {
      const updateObj = { ...values } as unknown as SearchSaleOrderRequest;
      setOrderFilter(updateObj);
      setPage(1);
    }
  });
  const getStatusStyles = (status: string) => {
    if (status === 'AWAITING_PAYMENT') {
      return {
        bg: '#eeb050',
        fg: 'black',
        border: 'transparent',
        hoverBorder: '#e66767',
      };
    }
    return {
      bg: '#e7e7e7',
      hoverBg: '#f5f5f5',
      fg: 'text.primary',
      border: 'transparent',
      hoverBorder: '#9e9e9e',
    };
  };
  const selectedUser = useMemo(() => {
    const id = [ROLES.ORDER_BKK, ROLES.ORDER_PROVINCE].includes(getStaffRole()) ? getStaffId() : null;
    const users = userList?.data?.users ?? [];
    if (!id) return null;
    return users.find(u => u?.staff?.id === id) ?? null;
  }, [userList, searchFormik.values.poMakerIdEqual]);

  const saleOrderData = (!isPOFetching &&
    orderList &&
    orderList.data.saleOrders.length > 0 &&
    orderList.data.saleOrders.map((order: SaleOrder) => {
      return (
        <TableRow
          hover
          id={`purchase-order__index-${order.id}`}
          key={order.id}
          sx={{
            backgroundColor: order.orderStatus === 'AWAITING_PAYMENT' ? '#eeb050' : 'inherit',
            '& td, & th': {
              color: order.orderStatus === 'AWAITING_PAYMENT' ? 'white' : 'inherit',
            },
            '&:hover': {
              backgroundColor:
                order.orderStatus === 'AWAITING_PAYMENT' ? '#e66767' : '#f5f5f5', // แดงเข้มขึ้น หรือเทาอ่อน
              '& td, & th': {
                color: order.orderStatus === 'AWAITING_PAYMENT' ? 'black' : 'black', // คุม contrast
              },
            },
          }}
          onClick={() => {
            history.push(`/sale-order/${order.id}`);
          }}>
          <TableCell align="center" onClick={(e) => e.stopPropagation()}>
            <CheckBoxComponent
              key={order.id}
              type="checkbox"
              name={order.id}
              id={order.id}
              handleClick={(event: ChangeEvent<HTMLInputElement>) =>
                handleSelectPO(event)
              }
              isChecked={selectedPO?.find((od) => od.id === order.id)}
            />
          </TableCell>
          <TableCell align="left" style={order.orderStatus === 'ยกเลิก' ? { textDecoration: 'line-through' } : {}}>
            <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ ml: 0.5, color: 'blue' }}
                noWrap
              >
                {'#' + order.orderNo}
              </Typography>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{
                  ml: 0.5,
                  noWrap: true,
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px',
                  textDecorationThickness: '2px'
                }}
                noWrap
              >
                {order.customer?.customerName ?? '-'}
              </Typography>
            </Stack>
            {order.urgentOrder ? (
              <Chip
                label={t('purchaseOrder.orderInformationSection.urgentOrder')}
                color="error"
                size="small"
              />
            ) : (
              ''
            )}
            {' '}
            <Chip
              label={t(`status.saleOrder.${order.orderStatus}`)}
              color="info"
              size="small"
            />
            {' '}
            <Chip
              label={order.dropOff.area.code === 'BKK' ? 'กทม.' : 'ตจว.'}
              className={order.dropOff.area.code === 'BKK' ? classes.bkkChip : classes.provinceChip}
              size="small"
            />
            <br />
            <Place style={{ fontSize: '15px' }} />{'  '}{order.dropOff.dropOffName}
            <br />
            <AccessTime style={{ fontSize: '15px' }} />{' '}{order.sendingTime}
          </TableCell>
          <TableCell align="left" style={order.orderStatus === 'ยกเลิก' ? { textDecoration: 'line-through' } : {}}>
            <TextLineClamp>
              {order.poMaker === null ? '-' : order.poMaker?.displayName}
            </TextLineClamp>
          </TableCell>
          <TableCell align="left" style={order.orderStatus === 'ยกเลิก' ? { textDecoration: 'line-through' } : {}}>
            <TextLineClamp>
              {order.id}
            </TextLineClamp>
          </TableCell>
          <TableCell>
            <IconButton
              aria-label="more"
              id="long-button"
              aria-controls={open ? 'long-menu' : undefined}
              aria-expanded={open ? 'true' : undefined}
              aria-haspopup="true"
              onClick={(e) => handleClick(e, order.id)}>
              <MoreVert />
            </IconButton>
            <Menu
              id="fade-menu"
              MenuListProps={{
                'aria-labelledby': 'fade-button'
              }}
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              TransitionComponent={Fade}>
              <MenuItem
                onClick={() => {
                  history.push(`/sale-order/${selectedCustomerId}`);
                }}>
                <IconButton>
                  <Visibility />
                </IconButton>
                {t('supplierManagement.action.view')}
              </MenuItem>
            </Menu>
          </TableCell>
        </TableRow>
      );
    })) || (
      <TableRow>
        <TableCell colSpan={5}>
          <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
        </TableCell>
      </TableRow>
    );

  const isSelected = (orderId: string) =>
    selectedPO?.some(po => po.id === orderId) ?? false;

  const toggleSelectPO = (order: SaleOrder) => {
    setSelectedPO(prev => {
      const list = prev ?? [];
      const exists = list.some(po => po.id === order.id);

      if (exists) {
        return list.filter(po => po.id !== order.id);
      }

      return [...list, order];
    });
  };

  useEffect(() => {
    orderRefetch();
  }, [orderFilter, pages, page, pageSize]);
  useEffect(async () => {
    const role = getRole();
    if (role.startsWith('ADMIN') || role === 'SUPER_ADMIN') {
      setIsEnableNewPO(true);
      const today = new Date();
      const duty = await getDuty(dayjs(today).startOf('day').format(DEFAULT_DATE_FORMAT_BFF));
      if (
        duty.data.bkkDutyList === null ||
        duty.data.bkkDutyList.length === 0 ||
        duty.data.provinceDutyList === null ||
        duty.data.provinceDutyList.length === 0
      ) {

        const orderUserList = await searchUser({ roleIn: ['ORDER_BKK', 'ORDER_PROVINCE'] }, 1, 100);
        setOrderUserList(orderUserList.data.users);
        const ids = [
          ...(duty.data.bkkDutyList ?? []).map(u => u.id).filter(Boolean),
          ...(duty.data.provinceDutyList ?? []).map(u => u.id).filter(Boolean),
        ];

        setSelectedOrderUserList(ids);
        setIsOpenAlertDutyDialog(true);
      }
    }
  }, [getRole]);
  return (
    <Page>
      <PageTitle title={t('orderManagement.title')} />
      <Wrapper>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{
            mt: 1,
            justifyContent: { sm: 'flex-end' }, // right-align when in row
            alignItems: { xs: 'flex-end', sm: 'center' }, // right-align when stacked
          }}
        >
          <Button
            fullWidth={isDownSm}
            size="small"
            variant="contained"
            className={!isEnableNewPO ? classes.hideObject : 'btn-emerald-green'}
            onClick={() => history.push(ROUTE_PATHS.SALE_ORDER_CREATE)}
            startIcon={<AddShoppingCart />}
          >
            {t('orderManagement.action.new')}
          </Button>

          <Button
            fullWidth={isDownSm}
            size="small"
            variant="contained"
            className={!['SUPER_ADMIN', 'ADMIN_BKK', 'ADMIN_PROVINCE', 'ORDER'].includes(getRole()) ? classes.hideObject : 'btn-pastel-yellow'}
            disabled={selectedPO?.length === 0}
            onClick={() => setOpenAssignDialog(true)}
            startIcon={<AddShoppingCart />}
          >
            {t('orderManagement.action.assign')}
          </Button>

          <Button
            fullWidth={isDownSm}
            size="small"
            variant="contained"
            className="btn-indigo-blue"
            startIcon={<Search />}
            onClick={() => searchFormik.handleSubmit()}
          >
            {t('button.search')}
          </Button>

          <Button
            fullWidth={isDownSm}
            size="small"
            variant="contained"
            className="btn-amber-orange"
            startIcon={<DisabledByDefault />}
            onClick={() => {
              searchFormik.resetForm();
              setDateValue('', '');
            }}
          >
            {t('button.clear')}
          </Button>
        </Stack>
      </Wrapper>
      <Wrapper>
        <GridSearchSection container spacing={1}>
          <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}>
            <DatePicker
              className={classes.datePickerFromTo}
              fullWidth
              inputVariant="outlined"
              InputLabelProps={{ shrink: true }}
              label={t('purchaseOrder.orderInformationSection.fields.labels.deliverDate')}
              name="selectedFromDate"
              format={DEFAULT_DATE_FORMAT}
              value={searchFormik.values.deliveryDate || null}
              onChange={(date) => {
                if (date !== null) {
                  searchFormik.setFieldValue(
                    'deliveryDate',
                    dayjs(date.toDate()).format(DEFAULT_DATE_FORMAT_BFF)
                  );

                  searchFormik.handleSubmit();
                } else {
                  searchFormik.setFieldValue('deliveryDate', '');
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}>
            <Autocomplete
              disabled={isAreaFetching}
              options={customerAreaList?.map((option) => option) || []}
              getOptionLabel={(option: SystemConfig) => option.nameTh}
              isOptionEqualToValue={(option, value) => option.code === value.code}
              sx={{ width: '100%' }}
              value={
                customerAreaList?.find((area) => area.code === searchFormik.values.areaTypeEqual) ||
                null
              }
              onChange={(_event, value, reason) => {
                if (reason === 'clear') {
                  searchFormik.setFieldValue(`areaTypeEqual`, null);
                } else {
                  searchFormik.setFieldValue(`areaTypeEqual`, value?.code);
                }
                searchFormik.handleSubmit();
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('customerManagement.column.dropOff.areaType')}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    ...params.inputProps,
                    readOnly: isMobileOnly ? true : false, // Disable keyboard on mobile
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}>
            <Autocomplete
              options={poStatus}
              getOptionLabel={(option) => t(`status.saleOrder.${option}`)}
              isOptionEqualToValue={(option, value) => option === value}
              sx={{ width: '100%' }}
              value={
                poStatus?.find((status) => status === searchFormik.values.poStatusEqual) ||
                null
              }
              onChange={(_event, value, reason) => {
                if (reason === 'clear') {
                  searchFormik.setFieldValue(`poStatusEqual`, null);
                } else {
                  searchFormik.setFieldValue(`poStatusEqual`, value);
                }
                searchFormik.handleSubmit();
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('purchaseOrder.orderInformationSection.fields.labels.orderStatus')}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    ...params.inputProps,
                    readOnly: isMobileOnly ? true : false, // Disable keyboard on mobile
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}
            className={getRole() === 'PROCUREMENT' || getRole() === 'PROCUREMENT_ADMIN' || getRole() === 'SUPER_ADMIN' ? '' : classes.hideObject}>
            <Autocomplete
              options={poLineStatus}
              getOptionLabel={(option) => t(`status.saleOrderLine.${option}`)}
              isOptionEqualToValue={(option, value) => option === value}
              sx={{ width: '100%' }}
              value={
                poLineStatus?.find((status) => status === searchFormik.values.poLineStatusEqual) ||
                null
              }
              onChange={(_event, value, reason) => {
                if (reason === 'clear') {
                  searchFormik.setFieldValue(`poLineStatusEqual`, null);
                } else {
                  searchFormik.setFieldValue(`poLineStatusEqual`, value);
                }
                searchFormik.handleSubmit();
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('purchaseOrder.orderInformationSection.fields.labels.poLineStatus')}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    ...params.inputProps,
                    readOnly: isMobileOnly ? true : false, // Disable keyboard on mobile
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }} className={!['SUPER_ADMIN', 'ADMIN_BKK', 'ADMIN_PROVINCE', 'ACCOUNT'].includes(getRole()) ? classes.hideObject : ''}>
            <Autocomplete
              options={billingStatus}
              getOptionLabel={(option) => option}
              isOptionEqualToValue={(option, value) => option === value}
              sx={{ width: '100%' }}
              value={
                billingStatus?.find((status) => status === searchFormik.values.billingStatusEqual) ||
                null
              }
              onChange={(_event, value, reason) => {
                if (reason === 'clear') {
                  searchFormik.setFieldValue(`billingStatusEqual`, null);
                } else {
                  searchFormik.setFieldValue(`billingStatusEqual`, value);
                }
                searchFormik.handleSubmit();
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('purchaseOrder.orderInformationSection.fields.labels.billingStatus')}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    ...params.inputProps,
                    readOnly: isMobileOnly ? true : false, // Disable keyboard on mobile
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }} className={!['SUPER_ADMIN', 'ADMIN_BKK', 'ADMIN_PROVINCE', 'ORDER_BKK', 'ORDER_PROVINCE'].includes(getRole()) ? classes.hideObject : ''}>
            <Autocomplete
              options={userList?.data?.users ?? []}
              value={selectedUser}
              // ให้เทียบเท่ากันด้วย staff.id แทนการอ้างอิงอ็อบเจ็กต์
              isOptionEqualToValue={(opt, val) => opt?.staff?.id === val?.staff?.id}
              // ป้องกันกรณี option เป็น string/null
              getOptionLabel={(opt) =>
                typeof opt === 'string' ? opt : (opt?.staff?.displayName ?? '')
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  variant="outlined"
                  label={t('orderManagement.column.poMakerDisplayName')}
                  InputLabelProps={{ shrink: true }}
                />
              )}
              onChange={(_e, val, reason) => {
                searchFormik.setFieldValue(
                  'poMakerIdEqual',
                  reason === 'clear' ? null : val?.staff?.id ?? null
                );
                searchFormik.handleSubmit();
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}>
            <Autocomplete
              disabled={isCustomerFetching}
              options={customerList?.data?.map((option: Customer) => option) || []}
              isOptionEqualToValue={(option, value) => option.customerId === value.customerId}
              getOptionLabel={(cust: Customer) => cust.displayName}
              sx={{ width: '100%' }}
              value={searchFormik.values.customer || null}
              onChange={(_event, value, reason) => {
                if (reason === 'clear') {
                  searchFormik.setFieldValue('customer', null);
                  searchFormik.setFieldValue('customerIdEqual', null);
                } else {
                  searchFormik.setFieldValue('customer', value);
                  searchFormik.setFieldValue('customerIdEqual', value?.customerId);
                }
                searchFormik.handleSubmit();
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('purchaseOrder.customerInformationSection.fields.labels.customerName') + '*'}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}>
            <TextField
              label={t('purchaseOrder.orderInformationSection.fields.labels.orderNo')}
              value={searchFormik.values.orderNoEqual}
              type="text"
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              onBlur={() => searchFormik.handleSubmit()}
              onChange={(val) => {
                searchFormik.setFieldValue('orderNoEqual', val.target.value);
              }}
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*'
              }}
              sx={{
                '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                  display: 'none'
                },
                '& input[type=number]': { MozAppearance: 'textfield' }
              }}
            />
          </Grid>
        </GridSearchSection>
        {isMobileOnly ? (
          <>
            <GridSearchSection container>
              <TableContainer>
                <Table id="purchase-order_list___table">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        align="center"
                        key="customerName"
                        className={classes.tableHeader}
                      >
                        {t('orderManagement.order')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                </Table>
              </TableContainer>
              <Grid item xs={12} sm={12}>
                {isPOFetching ? (
                  <>
                    <br />
                    <div style={{ textAlign: 'center' }}>
                      <CircularProgress />
                    </div>
                  </>
                ) : (
                  <>
                    <br />
                    {orderList?.data?.saleOrders?.length > 0 ? (
                      <>
                        <List disablePadding>
                          {orderList?.data.saleOrders.map((order: SaleOrder) => {
                            const styles = getStatusStyles(order.orderStatus);

                            return (
                              <React.Fragment key={order.id}>
                                <Card
                                  elevation={0}
                                  sx={{
                                    borderRadius: 2,
                                    mb: 1,
                                    bgcolor: isSelected(order.id)
                                      ? 'action.selected'
                                      : styles.bg,
                                    color: styles.fg,
                                    border: isSelected(order.id)
                                      ? '2px solid #1976d2'
                                      : '1px solid transparent'
                                  }}
                                >
                                  {/* ใช้ ActionArea ให้ทั้งการ์ดกดเข้า detail ได้ ยกเว้นจุดที่ stopPropagation */}
                                  <CardActionArea
                                    onClick={() => history.push(`/sale-order/${order.id}`)}
                                    sx={{
                                      '&:hover': { borderColor: styles.hoverBorder },
                                      // เพิ่มระยะกดง่าย
                                      minHeight: 72,
                                    }}
                                  >
                                    <CardContent sx={{ py: 1.25 }}>
                                      <Stack direction="row" alignItems="center" spacing={1.25}>

                                        <Box
                                          display="flex"
                                          alignItems="center"
                                          justifyContent="center"
                                          sx={{ minHeight: '100%' }}
                                        >
                                          <Checkbox
                                            size="small"
                                            checked={isSelected(order.id)}
                                            onClick={(e) => e.stopPropagation()} // กันไม่ให้เข้า detail
                                            onChange={() => toggleSelectPO(order)}
                                            sx={{
                                              p: 0.5, mt: 0.25, '& .MuiSvgIcon-root': {
                                                fontSize: 28,
                                              },
                                            }}
                                          />
                                        </Box>

                                        <Box flex={1} minWidth={0}>
                                          {/* บรรทัดบน: PO#, ชื่อลูกค้า */}
                                          <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
                                            <Typography
                                              variant="h6"
                                              fontWeight={700}
                                              sx={{ ml: 0.5, color: 'blue' }}
                                              noWrap
                                            >
                                              {'#' + order.orderNo}
                                            </Typography>
                                            <Typography
                                              variant="subtitle1"
                                              fontWeight={700}
                                              sx={{
                                                ml: 0.5,
                                                noWrap: true,
                                                textDecoration: 'underline',
                                                textUnderlineOffset: '2px',
                                                textDecorationThickness: '2px'
                                              }}
                                              noWrap
                                            >
                                              {order.customer?.customerName ?? '-'}
                                            </Typography>
                                          </Stack>

                                          {/* บรรทัดสอง: สถานะ / โซน / ด่วน */}
                                          <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap">
                                            {order.urgentOrder && (
                                              <Chip
                                                size="small"
                                                color="error"
                                                label={t('purchaseOrder.orderInformationSection.urgentOrder')}
                                                sx={{ height: 20, fontSize: 11 }}
                                              />
                                            )}
                                            <Chip
                                              size="small"
                                              color="info"
                                              label={t(`status.saleOrder.${order.orderStatus}`)}
                                              sx={{ height: 20, fontSize: 11 }}
                                            />
                                            <Chip
                                              size="small"
                                              className={order.dropOff.area.code === 'BKK' ? classes.bkkChip : classes.provinceChip}
                                              label={order.dropOff?.area?.code === 'BKK' ? 'กทม.' : 'ตจว.'}
                                              sx={{ height: 20, fontSize: 11 }}
                                            />
                                          </Stack>

                                          {/* บรรทัดสาม: Drop-off + Supplier */}
                                          <Stack direction="row" spacing={1} alignItems="center" mt={0.75} minWidth={0}>
                                            <Place sx={{ fontSize: 16 }} />
                                            <Typography variant="body2" noWrap>
                                              {order.dropOff?.dropOffName ?? order.dropOff?.supplier?.supplierName ?? '-'}
                                            </Typography>
                                          </Stack>
                                          <Stack direction="row" spacing={1} alignItems="center" mt={0.25} minWidth={0}>
                                            <AccessTime sx={{ fontSize: 16 }} />
                                            <Typography variant="body2" noWrap>
                                              {order.sendingTime ?? '-'}
                                            </Typography>
                                          </Stack>
                                          <Stack direction="row" spacing={1} alignItems="center" mt={0.25} minWidth={0}>
                                            <Person sx={{ fontSize: 16 }} />
                                            <Typography variant="body2" noWrap>
                                              {order.poMaker?.displayName ?? '-'}
                                            </Typography>
                                          </Stack>
                                        </Box>
                                      </Stack>
                                    </CardContent>
                                  </CardActionArea>
                                </Card>
                                <Divider component="li" sx={{ opacity: 0.4 }} />
                              </React.Fragment>
                            );
                          })}
                        </List>

                        <GridSearchSection container>
                          <Grid item xs={12}>
                            <Paginate
                              pagination={orderList?.data.pagination}
                              page={page}
                              pageSize={pageSize}
                              setPage={setPage}
                              setPageSize={setPageSize}
                              refetch={orderRefetch}
                              totalRecords={orderList?.data.pagination.totalRecords}
                              isShow={true} />
                          </Grid>
                        </GridSearchSection>
                      </>
                    ) : (
                      <Card
                        elevation={0}
                        sx={{
                          borderRadius: 2,
                          p: 3,
                          mt: 2,
                          textAlign: 'center',
                          bgcolor: 'background.default',
                          color: 'text.secondary',
                        }}
                      >
                        <Stack spacing={1} alignItems="center">
                          <SearchOff sx={{ fontSize: 40, opacity: 0.6 }} />
                          <Typography variant="body2">
                            {t('orderManagement.noOrderResult')}
                          </Typography>
                        </Stack>
                      </Card>
                    )}
                  </>
                )}
              </Grid>
            </GridSearchSection>
          </>
        ) : (
          <>
            <GridSearchSection container>
              <TableContainer>
                <Table id="purchase-order_list___table">
                  <TableHead>
                    <TableRow>
                      <TableCell className={classes.tableHeader} style={{ width: '20px', padding: '10px 10px 10px 10px' }} align="center">
                        <CheckBoxComponent
                          disable={false}
                          type="checkbox"
                          name="selectAll"
                          id="selectAll"
                          handleClick={handleSelectAllPO}
                          isChecked={checkedAllPO}
                        />
                      </TableCell>
                      <TableCell
                        align="center"
                        key="customerName"
                        className={classes.tableHeader}
                      >
                        {t('orderManagement.column.customerName')}
                      </TableCell>
                      <TableCell
                        align="center"
                        key="poMakerDisplayName"
                        className={classes.tableHeader}
                        sx={{
                          width: 200,
                          maxWidth: 200,
                          minWidth: 100,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        <Person />
                      </TableCell>
                      <TableCell
                        align="center"
                        key="orderId"
                        className={classes.tableHeader}
                        sx={{
                          width: 150,
                          maxWidth: 150,
                          minWidth: 100,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {t('orderManagement.column.orderId')}
                      </TableCell>
                      <TableCell
                        align="center"
                        key="action"
                        className={classes.tableHeader}
                        sx={{
                          width: 75,
                          maxWidth: 75,
                          minWidth: 50,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {t('supplierManagement.action.action')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  {isPOFetching ? (
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  ) : (
                    <TableBody>{saleOrderData}</TableBody>
                  )}
                </Table>
              </TableContainer>
            </GridSearchSection>
            <GridSearchSection container>
              <Grid item xs={12}>
                <Paginate
                  pagination={orderList?.data.pagination}
                  page={page}
                  pageSize={pageSize}
                  setPage={setPage}
                  setPageSize={setPageSize}
                  refetch={orderRefetch}
                  totalRecords={orderList?.data.pagination.totalRecords}
                  isShow={true} />
              </Grid>
            </GridSearchSection>
          </>
        )
        }
      </Wrapper >
      <AssignPackOrderDialog
        open={openAssignDialog}
        poList={selectedPO}
        userList={userList ? userList.data.users : []}
        onClose={(val: boolean) => {
          if (val) {
            setSelectedPO([]);
            orderRefetch();
            setCheckedAllPO(false);
          }
          setOpenAssignDialog(false);
        }}
      />
      <SimpleDialog
        open={isOpenAlertDutyDialog}
        message={t('dailyDuty.noDuty')}
        icon="warning"
        onClose={() => {
          setIsOpenDutyDialog(true);
          setIsOpenAlertDutyDialog(false);
        }}
      />
      <DutyDialog
        open={isOpenDutyDialog}
        userList={orderUserList}
        checkedUser={selectedOrderUserList}
        onClose={() => {
          setIsOpenDutyDialog(false);
          setIsOpenAlertDutyDialog(false);
        }}
      />
    </Page >
  );
}
