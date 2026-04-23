/* eslint-disable prettier/prettier */
import { Save, Cancel, ArrowBackIos, Add, Edit } from '@mui/icons-material';
import styled from 'styled-components';
import { Autocomplete, Box, Button, Checkbox, CircularProgress, FormControl, FormControlLabel, FormGroup, Grid, IconButton, MenuItem, Paper, Radio, RadioGroup, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, useMediaQuery, useTheme } from '@mui/material';
import ConfirmDialog from 'components/ConfirmDialog';
import PageTitle from 'components/PageTitle';
import { Wrapper, GridTextField } from 'components/Styled';
import { useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { ChangeEvent, useState } from 'react';
import toast from 'react-hot-toast';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { Customer, CustomerDropOff } from 'services/Customer/customer-type';
import { useQuery } from 'react-query';
import { getAllCustomer, getCustomer, searchCustomer } from 'services/Customer/customer-api';
import { SystemConfig } from 'services/Config/config-type';
import { DEFAULT_DATE_FORMAT, DEFAULT_DATE_FORMAT_BFF, DEFAULT_DATETIME_FORMAT_ISO, isObject } from 'utils';
import { Supplier } from 'services/Supplier/supplier-type';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers';
import SearchStaffDialog from './SearchStaffDialog';
import { Staff } from 'services/Staff/staff-type';
import { searchProduct } from 'services/Product/product-api';
import { ProductDto } from 'services/Product/product-type';
import { Item } from 'services/Item/item-type';
import { CreateSaleOrderRequest } from 'services/SaleOrder/sale-order-type';
import { createSaleOrder } from 'services/SaleOrder/sale-order-api';
import { makeStyles } from '@mui/styles';
import AddNewCustomerDialog from './Dialog/AddNewCustomerDialog';
import AddNewDropOffDialog from './Dialog/AddNewDropOffDialog';
import EditCustomerDialog from './Dialog/EditCustomerDialog';
import { Amphure, Province } from 'services/Address/address-type';
import DatePicker from 'components/DatePicker';
import NumberTextField from 'components/NumberTextField';
import LoadingDialog from 'components/LoadingDialog';
import CustomSwitch from 'components/CustomSwitch';

const HeaderTableCell = styled.div`
  border-left: 2px solid #e0e0e0;
  font-weight: 500;
  padding-left: 16px;
`;

export default function NewOrder(): JSX.Element {
    const { t } = useTranslation();
    const theme = useTheme();
    const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
    const useStyles = makeStyles({
        hideObject: {
            display: 'none'
        },
        datePickerFromTo: {
            '&& .MuiOutlinedInput-input': {
                // padding: '16.5px 14px'
            },
            '&& .MuiFormLabel-root': {
                fontSize: '13px'
            },
            '&& .MuiInputAdornment-root svg': {
                fontSize: '18px', // ↓ Change this to control icon size
            },
        },
    });
    const classes = useStyles();
    const history = useHistory();
    const [isLoading, setIsLoading] = useState(false);
    const [actionType, setActionType] = useState<string>('');
    const [disableCustomerField, setDisableCustomerField] = useState(true);
    const [disableCustomerDropOffField, setDisableCustomerDropOffField] = useState(true);
    const [title, setTitle] = useState<string>('');
    const [msg, setMsg] = useState<string>('');
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customerDropOffs, setCustomerDropOffs] = useState<CustomerDropOff[]>([]);
    const [selectedStaff, setSelectedStaff] = useState<Staff>();
    const [selectedCustomer, setSelectedCustomer] = useState<Customer>();
    const [openSearchStaffDialog, setOpenSearchStaffDialog] = useState(false);
    const [openEditCustomerDialog, setOpenEditCustomerDialog] = useState(false);
    const [openAddNewCustomerDialog, setOpenAddNewCustomerDialog] = useState(false);
    const [openAddNewDropOffDialog, setOpenAddNewDropOffDialog] = useState(false);
    const [iceChecked, setIceChecked] = useState(false);
    const defaultCustomerFilter = {
        idEqual: '',
        nameContain: '',
        typeEqual: '',
        rankEqual: '',
        areaEqual: ''
    };
    const defaultItemFilter = {
        nameContain: '',
        skuContain: '',
        categoryEqual: '',
        groupEqual: '',
        subGroupEqual: '',
        parentSkuEqual: '',
        isIncludeParentSku: false
    };
    const { data: productsList, isFetching: isProductFetching } = useQuery(
        'search-product',
        () => searchProduct(defaultItemFilter, 1, 3000),
        {
            refetchOnWindowFocus: false
        }
    );
    const { data: customerList, isFetching: isCustomerFetching } = useQuery(
        'get-all-customer',
        () => getAllCustomer(defaultCustomerFilter),
        {
            refetchOnWindowFocus: false,
            keepPreviousData: true,
            onSuccess: (data) => {
                if (data?.data) {
                    setCustomers(data?.data);
                }
            }
        }
    );
    const handleSubmitForm = (values: any) => {
        const items: { itemSku: any; itemName: any; qty: any; remark: any; isClaimed: boolean }[] = []
        values.itemList.map((item) => {
            if (item.item !== undefined && item.item !== null) {
                items.push({
                    itemSku: item.item?.productSku,
                    itemName: item.item?.productNameTh,
                    qty: item.qty,
                    isClaimed: item.isClaimed ?? false,
                    remark: item.remark
                })
            }
        })
        const saleOrderRequest: CreateSaleOrderRequest = {
            customerId: values.customerId,
            customerName: values.customerName,
            contactNumber: values.contactNumber,
            creditTerm: values.creditTerm,
            dropOffId: values.dropOffId,
            dropOffName: values.dropOffName,
            supplierId: values.supplier.supplierId,
            areaType: values.areaType.code,
            orderMakerId: values.orderMakerId,
            deliveryDate: dayjs(values.deliveryDate).format(DEFAULT_DATETIME_FORMAT_ISO),
            sendingTime: values.sendingTime,
            notes: values.notes,
            itemList: items,
            urgentOrder: values.urgentOrder,
            provinceId: values.province.id,
            amphureId: values.amphure?.id
        }
        setIsLoading(true);
        toast
            .promise(createSaleOrder(saleOrderRequest), {
                loading: t('toast.loading'),
                success: () => {
                    history.push(ROUTE_PATHS.SALE_ORDER_MANAGEMENT);
                    return t('toast.success');
                },
                error: () => {
                    return t('toast.failed');
                }
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const defaultItem: { index: number; }[] = [];
    Array.from({ length: 10 }, (_, index) => (
        defaultItem.push({ index })
    ));

    const formik = useFormik({
        initialValues: {
            urgentOrder: false,
            customer: null as unknown as Customer,
            customerId: '',
            customerName: '',
            contactNumber: '',
            creditTerm: '',
            dropOff: null as unknown as CustomerDropOff,
            dropOffId: '',
            dropOffName: '',
            supplier: null as unknown as Supplier,
            areaType: null as unknown as SystemConfig,
            province: null as unknown as Province,
            amphure: null as unknown as Amphure,
            orderStatus: 'IN_PROGRESS',
            orderMakerId: '',
            orderMakerName: '',
            billingStatus: 'BILL_NOT_CREATED',
            deliveryDate: new Date(),
            sendingTime: null,
            envelopName: '',
            notes: '',
            shippingMethod: '',
            shopName: '',
            itemList: defaultItem
        },
        enableReinitialize: false,
        validationSchema: Yup.object().shape({
            customer: Yup.mixed()
                .test('is-valid-customer', t('purchaseOrder.warning.customerNameRequired'), function (value) {
                    // Accept either a non-empty string or an object with customerName
                    if (!value) return false;
                    if (typeof value === 'object' && value.customerName) {
                        return value.customerName.trim().length > 0;
                    }
                    return false;
                })
                .required(t('purchaseOrder.warning.customerNameRequired')),
            contactNumber: Yup.string().required(t('purchaseOrder.warning.contactNumberRequired')),
            creditTerm: Yup.string().required(t('purchaseOrder.warning.creditTermRequired')),
            dropOff: Yup.mixed()
                .test('is-valid-customer', t('purchaseOrder.warning.dropOffRequired'), function (value) {
                    // Accept either a non-empty string or an object with addressName
                    if (!value) return false;
                    if (typeof value === 'object' && value.dropOffName) {
                        return value.dropOffName.trim().length > 0;
                    }
                    return false;
                })
                .required(t('purchaseOrder.warning.dropOffRequired')),
            areaType: Yup.object().nullable().required(t('purchaseOrder.warning.areaTypeRequired')),
            supplier: Yup.object().nullable().required(t('purchaseOrder.warning.supplierRequired')),
            deliveryDate: Yup.date()
                .required('กรุณาเลือกวันที่จัดส่ง'),
            itemList: Yup.array()
                .of(
                    Yup.object({
                        item: Yup.object().nullable(),
                        qty: Yup.number()
                            .nullable()
                            .when('item', {
                                is: (item: any) => item != null,
                                then: (schema) =>
                                    schema
                                        .typeError('จำนวนต้องเป็นตัวเลข') // "Amount must be a number"
                                        .required('กรุณาระบุจำนวน')         // "Please enter quantity"
                                        .min(1, 'จำนวนขั้นต่ำคือ 1')
                                        .max(9999, 'จำนวนสูงสุดคือ 9,999'),
                                otherwise: (schema) => schema.notRequired()
                            })
                    })
                )
                .min(1, 'At least 1 product is required')
        }),
        onSubmit: handleSubmitForm
    });

    const [itemListState, setItemListState] = useState<Item[]>(formik.values.itemList || []);
    const handleAddRow = () => {
        const newItem = {
            item: null,
            qty: '',
        };

        const updatedList = [...itemListState, newItem];

        setItemListState(updatedList); // for rendering
        formik.setFieldValue('itemList', updatedList); // update Formik values too
    };
    const handleIceCheck = (event: ChangeEvent<HTMLInputElement>) => {
        setIceChecked(event.target.value === 'true');
        let oldValue = formik.values.notes;
        if (event.target.value === 'true') {
            if (event.target.value === 'true') {
                // ✅ เพิ่มเฉพาะเมื่อยังไม่มีคำว่า "ใส่น้ำแข็ง"
                if (!oldValue.includes('ใส่น้ำแข็ง')) {
                    formik.setFieldValue('notes', oldValue.concat(' ใส่น้ำแข็ง'));
                }
            } else {
                formik.setFieldValue('notes', oldValue.replaceAll(' ใส่น้ำแข็ง ', ''));
            }
        }
    }

    return (
        <Page>
            <PageTitle title={t('purchaseOrder.title')} manualId='MANUAL000002' />
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
                        variant="contained"
                        className="btn-emerald-green"
                        onClick={() => {
                            setActionType('create');
                            setTitle(t('message.createOrderTitle'));
                            setMsg(t('message.createOrderMsg'));
                            setVisibleConfirmationDialog(true);
                        }}
                        startIcon={<Save />}>
                        {t('button.create')}
                    </Button>
                    <Button
                        fullWidth={isDownSm}
                        variant="contained"
                        className="btn-amber-orange"
                        onClick={() => {
                            setActionType('clear');
                            setTitle(t('message.clearDataTitle'));
                            setMsg(t('message.clearDataMsg'));
                            setVisibleConfirmationDialog(true);
                        }}
                        startIcon={<Cancel />}>
                        {t('button.clear')}
                    </Button>
                    <Button
                        fullWidth={isDownSm}
                        variant="contained"
                        className="btn-cool-grey"
                        onClick={() => {
                            setActionType('back');
                            setTitle(t('message.backTitle'));
                            setMsg(t('message.backMsg'));
                            setVisibleConfirmationDialog(true);
                        }}
                        startIcon={<ArrowBackIos />}>
                        {t('button.back')}
                    </Button>
                </Stack>
            </Wrapper>
            <Wrapper>
                <Grid container spacing={1}>
                    <GridTextField item xs={12} sm={12}>
                        <Typography variant="h6">{t('purchaseOrder.customerInformationSection.title')}</Typography>
                    </GridTextField>
                </Grid>
                <Grid
                    container
                    spacing={1}
                >
                    <GridTextField item xs={12} sm={6}>
                        <Autocomplete
                            disabled={isCustomerFetching}
                            loading={isCustomerFetching}
                            options={
                                [
                                    { customerId: '__add_new__', customerName: `➕ ${t('customerManagement.addNewCustomerButton')}` },
                                    ...(customers.map((option: Customer) => option).sort(
                                        (a, b) => b.customerId.localeCompare(a.customerId)) || []),
                                    { customerId: '__add_new__', customerName: `➕ ${t('customerManagement.addNewCustomerButton')}` }
                                ]
                            }
                            getOptionLabel={(cust: Customer) =>
                                cust.customerId === '__add_new__'
                                    ? cust.customerName
                                    : `${cust.displayName} (${cust.customerId})`
                            }
                            sx={{ width: '100%' }}
                            value={formik.values.customer || null}
                            onChange={async (_event, value, reason) => {
                                if (value?.customerId === '__add_new__') {
                                    setOpenAddNewCustomerDialog(true);
                                    setDisableCustomerField(false);
                                    return
                                }
                                if (reason === 'clear') {
                                    formik.setFieldValue('customerId', '');
                                    formik.setFieldValue('customerName', '');
                                    formik.setFieldValue('contactNumber', '');
                                    formik.setFieldValue('creditTerm', null);
                                    formik.setFieldValue('customer', null);
                                    formik.setFieldValue('dropOff', null);
                                    formik.setFieldValue('dropOffName', '');
                                    formik.setFieldValue('envelopName', '');
                                    formik.setFieldValue('dropOffId', '');
                                    formik.setFieldValue('supplier', null);
                                    formik.setFieldValue('areaType', null);
                                    formik.setFieldValue('province', null);
                                    formik.setFieldValue('amphure', null);
                                    formik.setFieldValue('shippingMethod', '');
                                    formik.setFieldValue('shopName', '');
                                    setDisableCustomerDropOffField(false);
                                    setDisableCustomerField(false);
                                } else {
                                    if (isObject(value)) {
                                        setIsLoading(true);
                                        const customerInfo = await getCustomer(value?.customerId);
                                        setIsLoading(false);
                                        let selectedValue: Customer = customerInfo;
                                        setSelectedCustomer(selectedValue);
                                        formik.setFieldValue('customer', selectedValue);
                                        formik.setFieldValue('customerName', selectedValue.customerName);
                                        formik.setFieldValue('customerId', selectedValue.customerId);
                                        formik.setFieldValue('contactNumber', selectedValue.contactNumber1);
                                        formik.setFieldValue('creditTerm', selectedValue.customerCreditTerm.code);
                                        if (selectedValue.customerDropOffs.length === 1) {
                                            formik.setFieldValue('dropOff', selectedValue.customerDropOffs[0]);
                                            formik.setFieldValue('dropOffName', selectedValue.customerDropOffs[0].dropOffName);
                                            formik.setFieldValue('dropOffId', selectedValue.customerDropOffs[0].id);
                                            formik.setFieldValue('supplier', selectedValue.customerDropOffs[0].supplier);
                                            formik.setFieldValue('areaType', selectedValue.customerDropOffs[0].area);
                                            formik.setFieldValue('province', selectedValue.customerDropOffs[0].province);
                                            formik.setFieldValue('amphure', selectedValue.customerDropOffs[0].amphure);
                                            formik.setFieldValue('shippingMethod', selectedValue.customerDropOffs[0].shippingMethod?.code);
                                            formik.setFieldValue('shopName', selectedValue.customerDropOffs[0].shopName);
                                            formik.setFieldValue('envelopName', selectedValue.customerDropOffs[0].envelopName);
                                            if (selectedValue.customerArea.code === 'PROVINCE') {
                                                setIceChecked(true);
                                                let oldValue = formik.values.notes;
                                                // ✅ เพิ่มเฉพาะเมื่อยังไม่มีคำว่า "ใส่น้ำแข็ง"
                                                if (!oldValue.includes('ใส่น้ำแข็ง')) {
                                                    formik.setFieldValue('notes', oldValue.concat(' ใส่น้ำแข็ง'));
                                                }
                                            }
                                            setDisableCustomerDropOffField(true)
                                        } else if (selectedValue.customerDropOffs.length > 1) {
                                            let defaultDropOff: CustomerDropOff = selectedValue.customerDropOffs.filter((dof) => dof.isDefault === true)[0];
                                            formik.setFieldValue('dropOff', defaultDropOff);
                                            formik.setFieldValue('dropOffName', defaultDropOff.dropOffName);
                                            formik.setFieldValue('dropOffId', defaultDropOff.id);
                                            formik.setFieldValue('areaType', defaultDropOff.area);
                                            formik.setFieldValue('supplier', defaultDropOff.supplier);
                                            formik.setFieldValue('province', defaultDropOff.province);
                                            formik.setFieldValue('amphure', defaultDropOff.amphure);
                                            formik.setFieldValue('shippingMethod', defaultDropOff.shippingMethod?.code);
                                            formik.setFieldValue('shopName', defaultDropOff.shopName);
                                            formik.setFieldValue('envelopName', defaultDropOff.envelopName);
                                            setDisableCustomerDropOffField(true)
                                        }
                                        setCustomerDropOffs(selectedValue.customerDropOffs);
                                        setDisableCustomerField(true);
                                    }
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t('purchaseOrder.customerInformationSection.fields.labels.customerName') + '*'}
                                    InputLabelProps={{ shrink: true }}
                                    error={Boolean(formik.touched.customer && formik.errors.customer)}
                                    helperText={formik.touched.customer && formik.errors.customer}
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {isCustomerFetching ? (
                                                    <CircularProgress color="inherit" size={20} />
                                                ) : (
                                                    <>
                                                        {formik.values.customer && formik.values.customer.customerId !== 'CUST-99999' && (
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => setOpenEditCustomerDialog(true)}
                                                            >
                                                                <Edit />
                                                            </IconButton>
                                                        )}
                                                    </>
                                                )}
                                                {params.InputProps.endAdornment}
                                            </>
                                        )
                                    }}
                                />
                            )}
                            renderOption={(props, option) => (
                                <li {...props} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    {option.customerId === '__add_new__' ? (
                                        <strong style={{ color: 'blue' }}>{option.customerName}</strong>
                                    ) : (
                                        `${option.displayName} (${option.customerId})`
                                    )}
                                </li>
                            )}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={6}>
                        <TextField
                            type="text"
                            label={t('purchaseOrder.customerInformationSection.fields.labels.contactNumber') + '*'}
                            fullWidth
                            value={formik.values.contactNumber}
                            disabled={disableCustomerField}
                            onChange={({ target }) => {
                                formik.setFieldValue('contactNumber', target.value);
                            }}
                            variant="outlined"
                            error={Boolean(formik.touched.contactNumber && formik.errors.contactNumber)}
                            helperText={formik.touched.contactNumber && formik.errors.contactNumber}
                            InputLabelProps={{ shrink: true }}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={6}>
                        <Autocomplete
                            disabled={selectedCustomer === undefined}
                            options={[
                                ...(customerDropOffs?.map((option) => option) || []),
                                { id: '__add_new__', dropOffName: `➕ ${t('customerManagement.addNewCustomerDropOffButton')}` }
                            ]}
                            getOptionLabel={(option) =>
                                typeof option === 'string'
                                    ? option
                                    : option.id === '__add_new__'
                                        ? option.dropOffName
                                        : `จุดที่ ${option.index} ${option.dropOffName}`
                            }
                            renderOption={(props, option) => (
                                <li
                                    {...props}
                                    key={typeof option === 'string' ? option : option.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        ...(option.id === '__add_new__' ? { fontWeight: 'bold', color: 'blue' } : {})
                                    }}
                                >
                                    {typeof option === 'string'
                                        ? option
                                        : option.id === '__add_new__'
                                            ? option.dropOffName
                                            : `จุดที่ ${option.index} ${option.dropOffName}`}
                                </li>
                            )}
                            sx={{ width: '100%' }}
                            value={formik.values.dropOff || null}
                            onChange={(_event, value, reason) => {
                                if (value?.id === '__add_new__') {
                                    setOpenAddNewDropOffDialog(true);
                                    setDisableCustomerDropOffField(false);
                                    return;
                                }
                                if (reason === 'clear') {
                                    formik.setFieldValue('dropOff', null);
                                    formik.setFieldValue('dropOffName', '');
                                    formik.setFieldValue('dropOffId', '');
                                    formik.setFieldValue('supplier', null);
                                    formik.setFieldValue('areaType', null);
                                    formik.setFieldValue('province', null);
                                    formik.setFieldValue('amphure', null);
                                    formik.setFieldValue('envelopName', '');
                                    formik.setFieldValue('shippingMethod', '');
                                    formik.setFieldValue('shopName', '');
                                    setDisableCustomerDropOffField(false);
                                } else if (value) {
                                    formik.setFieldValue('dropOff', value);
                                    formik.setFieldValue('dropOffName', value.dropOffName);
                                    formik.setFieldValue('dropOffId', value.id);
                                    formik.setFieldValue('areaType', value.area);
                                    formik.setFieldValue('supplier', value.supplier);
                                    formik.setFieldValue('province', value.province);
                                    formik.setFieldValue('amphure', value.amphure);
                                    formik.setFieldValue('shippingMethod', value.shippingMethod?.code);
                                    formik.setFieldValue('shopName', value.shopName);
                                    formik.setFieldValue('envelopName', value.envelopName);
                                    setDisableCustomerDropOffField(true)
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t('purchaseOrder.customerInformationSection.fields.labels.dropOff') + '*'}
                                    InputLabelProps={{ shrink: true }}
                                    error={Boolean(formik.touched.dropOff && formik.errors.dropOff)}
                                    helperText={formik.touched.dropOff && formik.errors.dropOff}
                                />
                            )}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={6}>
                        <TextField
                            type="text"
                            label={t('purchaseOrder.customerInformationSection.fields.labels.envelopeName') + '*'}
                            fullWidth
                            value={formik.values.envelopName}
                            disabled
                            variant="outlined"
                            InputLabelProps={{ shrink: true }}
                            placeholder="ชื่อ + อำเภอ/จังหวัด + เบอร์โทร "
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={6}>
                        <TextField
                            select
                            label={t('customerManagement.column.dropOff.shippingMethod')}
                            fullWidth
                            value={formik.values.shippingMethod}
                            disabled={disableCustomerDropOffField}
                            variant="outlined"
                            InputLabelProps={{ shrink: true }}
                        >
                            <MenuItem key="DELIVERY" value="DELIVERY">
                                {t('customerManagement.column.dropOff.delivery')}
                            </MenuItem>
                            <MenuItem key="PICK_UP" value="PICK_UP">
                                {t('customerManagement.column.dropOff.selfPickup')}
                            </MenuItem>
                            <MenuItem key="LEAVE_SHOP" value="LEAVE_SHOP">
                                {t('customerManagement.column.dropOff.leaveOther')}
                            </MenuItem>
                            <MenuItem key="SEND_TO_SHOP" value="SEND_TO_SHOP">
                                {t('customerManagement.column.dropOff.sendToShop')}
                            </MenuItem>
                        </TextField>
                    </GridTextField>
                    {(formik.values.shippingMethod === 'SEND_TO_SHOP' || formik.values.shippingMethod === 'LEAVE_SHOP') && (
                        <GridTextField item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                required
                                label={formik.values.shippingMethod === 'LEAVE_SHOP' ? t('customerManagement.column.dropOff.leaveShopName') : t('customerManagement.column.dropOff.sendToShopName')}
                                value={formik.values.shopName}
                                disabled={disableCustomerDropOffField}
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                                error={Boolean(
                                    formik.touched.shopName &&
                                    formik.errors.shopName
                                )}
                                helperText={
                                    formik.touched.shopName &&
                                        typeof formik.errors.shopName === 'string'
                                        ? formik.errors.shopName
                                        : ''
                                }
                            />
                        </GridTextField>
                    )}
                    <GridTextField item xs={12} sm={6}>
                        <TextField
                            type="text"
                            label={t('customerManagement.column.dropOff.areaType') + '*'}
                            fullWidth
                            value={formik.values.areaType?.nameTh || ''}
                            disabled={disableCustomerDropOffField}
                            variant="outlined"
                            error={Boolean(formik.touched.areaType && formik.errors.areaType)}
                            helperText={formik.touched.areaType && formik.errors.areaType}
                            InputLabelProps={{ shrink: true }}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={6}>
                        <TextField
                            type="text"
                            fullWidth
                            value={formik.values.supplier?.phoneContactName || ''}
                            disabled={disableCustomerDropOffField}
                            variant="outlined"
                            label={t('customerManagement.column.dropOff.supplier') + '*'}
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(formik.touched.supplier && formik.errors.supplier)}
                            helperText={formik.touched.supplier && formik.errors.supplier}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={3}>
                        <TextField
                            type="text"
                            fullWidth
                            value={formik.values.province?.nameTh || ''}
                            disabled={disableCustomerDropOffField}
                            variant="outlined"
                            label={t('supplierManagement.column.address.province') + '*'}
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(formik.touched.province && formik.errors.province)}
                            helperText={formik.touched.province && formik.errors.province}
                        />
                    </GridTextField>
                    {(formik.values.amphure) && (
                        <GridTextField item xs={12} sm={3}>
                            <TextField
                                type="text"
                                fullWidth
                                value={formik.values.amphure?.nameTh || ''}
                                disabled={disableCustomerDropOffField}
                                variant="outlined"
                                label={t('supplierManagement.column.address.amphure') + '*'}
                                InputLabelProps={{ shrink: true }}
                                error={Boolean(formik.touched.amphure && formik.errors.amphure)}
                                helperText={formik.touched.amphure && formik.errors.amphure}
                            />
                        </GridTextField>
                    )}
                </Grid>
            </Wrapper>
            <Wrapper>
                <Typography variant="h6" sx={{ marginBottom: '1rem' }}>
                    {t('purchaseOrder.orderInformationSection.title')}
                </Typography>
                <Grid container spacing={1}>
                    <GridTextField item xs={6} sm={3}>
                        <FormControl component="fieldset">
                            <FormGroup aria-label="position" row>
                                <FormControlLabel
                                    control={<Checkbox />}
                                    checked={formik.values.urgentOrder}
                                    onChange={(event) => {
                                        formik.setFieldValue('urgentOrder', event.target.checked);
                                    }}
                                    label={t('purchaseOrder.orderInformationSection.fields.labels.urgentOrder')}
                                    labelPlacement="end"
                                />
                            </FormGroup>
                        </FormControl>
                        <FormControl>
                            <RadioGroup
                                aria-labelledby="demo-controlled-radio-buttons-group"
                                name="controlled-radio-buttons-group"
                                value={iceChecked}
                                onChange={handleIceCheck}
                            >
                                <FormControlLabel value={true} control={<Radio />} label={t('purchaseOrder.orderInformationSection.fields.labels.ice')} />
                                <FormControlLabel value={false} control={<Radio />} label={t('purchaseOrder.orderInformationSection.fields.labels.noIce')} />
                            </RadioGroup>
                        </FormControl>
                    </GridTextField>
                    <GridTextField item xs={6} sm={3} style={{ paddingTop: '0px' }}>
                        <Grid container spacing={1}>
                            <GridTextField item xs={12} sm={12}>
                                <DatePicker
                                    className={classes.datePickerFromTo}
                                    fullWidth
                                    inputVariant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                    label={t('purchaseOrder.orderInformationSection.fields.labels.deliverDate') + ' *'}
                                    name="deliveryDate"
                                    format={DEFAULT_DATE_FORMAT}
                                    value={formik.values.deliveryDate || null}
                                    onChange={(date) => {
                                        if (date !== null) {
                                            formik.setFieldValue('deliveryDate', date.toDate());
                                        } else {
                                            formik.setFieldValue('deliveryDate', '');
                                        }
                                    }}
                                />
                                {formik.touched.deliveryDate && formik.errors.deliveryDate && (
                                    <Typography variant="caption" color="error">
                                        {formik.errors.deliveryDate}
                                    </Typography>
                                )}
                            </GridTextField>
                            <GridTextField item xs={12} sm={12}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <TimePicker
                                        label={t('purchaseOrder.orderInformationSection.fields.labels.sendingTime')}
                                        value={formik.values.sendingTime}
                                        onChange={(newValue) =>
                                            formik.setFieldValue('sendingTime', dayjs(newValue).format('HH:mm'))
                                        }
                                        slotProps={{
                                            textField: {
                                                fullWidth: true, // ✅ put it here
                                                InputLabelProps: { shrink: true },
                                            }
                                        }}
                                        format="HH:mm"
                                        ampm={false}
                                        clearable
                                    />
                                </LocalizationProvider>
                            </GridTextField>
                        </Grid>
                    </GridTextField>
                    <GridTextField item xs={12} sm={6} style={{ paddingTop: '15px' }}>
                        <TextField
                            label={t('purchaseOrder.orderInformationSection.fields.labels.notes')}
                            fullWidth
                            multiline
                            rows={4}
                            InputLabelProps={{ shrink: true }}
                            value={formik.values.notes}
                            onChange={({ target }) => formik.setFieldValue('notes', target.value)}
                            name="orderInfo.notes"
                        />
                    </GridTextField>
                </Grid>
            </Wrapper>
            <Wrapper>
                <Grid container spacing={1}>
                    <GridTextField item xs={12} sm={4}>
                        <Typography variant="h6">{t('purchaseOrder.addProductSection.title')}</Typography>
                    </GridTextField>
                    <TableContainer component={Paper}>
                        <Table sx={{ minWidth: 650 }} aria-label="simple table">
                            <TableHead>
                                <TableRow>
                                    <TableCell key={'name'} sx={{ minWidth: '180px', width: '180px' }}>
                                        <HeaderTableCell>ชื่อสินค้า</HeaderTableCell>
                                    </TableCell>
                                    <TableCell key={'amount'}>
                                        <HeaderTableCell>จำนวน</HeaderTableCell>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {itemListState.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <Autocomplete
                                                disabled={isProductFetching}
                                                options={productsList?.data.products.map((option: ProductDto) => option) || []}
                                                getOptionLabel={(product: ProductDto) => product.productNameTh}
                                                isOptionEqualToValue={(option, value) => option.productSku === value.productSku} // important!
                                                filterOptions={(options, { inputValue }) => {
                                                    const search = inputValue.toLowerCase();

                                                    // 1. Filter ตามชื่อหรือ keyword
                                                    const filtered = options.filter((option) => {
                                                        const keyword = (option.keywords || '').toLowerCase();
                                                        const name = (option.productNameTh || '').toLowerCase();
                                                        return name.includes(search) || keyword.includes(search);
                                                    });

                                                    // 2. Distinct ตาม productId
                                                    const seen = new Set();
                                                    const distinct = [];
                                                    for (const product of filtered) {
                                                        if (!seen.has(product.productSku)) {
                                                            seen.add(product.productSku);
                                                            distinct.push(product);
                                                        }
                                                    }

                                                    return distinct;
                                                }}
                                                renderOption={(props, option) => (
                                                    <li {...props} key={option.productSku + ' : ' + option.productSku}>
                                                        {option.productNameTh}
                                                    </li>
                                                )}
                                                sx={{ minWidth: '180px' }}
                                                value={item?.item || null}
                                                onChange={(_event, value: ProductDto, reason) => {
                                                    const updatedList = [...itemListState];
                                                    updatedList[index].item = reason === 'clear' ? null : value;
                                                    setItemListState(updatedList);
                                                    formik.setFieldValue('itemList', updatedList);
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                )}
                                            />


                                            <TextField
                                                style={{ marginTop: '10px' }}
                                                type='text'
                                                label={t('purchaseOrder.productSection.fields.labels.remark')}
                                                InputLabelProps={{ shrink: true }}
                                                sx={{ minWidth: '180px' }}
                                                value={item?.remark}
                                                onChange={(e) => {
                                                    const updatedList = [...itemListState];
                                                    updatedList[index].remark = e.target.value;
                                                    setItemListState(updatedList);
                                                    formik.setFieldValue('itemList', updatedList);
                                                }}
                                            />

                                            <CustomSwitch
                                                style={{ marginTop: '10px' }}
                                                checked={item?.isClaimed || false}
                                                label={'สินค้าเคลม'}
                                                onChange={(e) => {
                                                    const updatedList = [...itemListState];
                                                    updatedList[index].isClaimed = e;
                                                    if (e) {
                                                        updatedList[index].remark = 'สินค้าเคลม';
                                                    } else {
                                                        updatedList[index].remark = '';
                                                    }
                                                    setItemListState(updatedList);
                                                    formik.setFieldValue('itemList', updatedList);
                                                }}
                                            />

                                        </TableCell>
                                        <TableCell>
                                            <NumberTextField
                                                required
                                                label={t('purchaseOrder.addProductSection.fields.labels.amount')}
                                                value={item?.qty ?? null}                 // ← ใช้ number | null
                                                min={1}
                                                max={9999}
                                                sx={{ width: 'auto', minWidth: '80px' }}
                                                InputLabelProps={{ shrink: true }}
                                                onChange={(val) => {
                                                    // val เป็น number | null (null ตอนลบเลขทั้งหมด)
                                                    const updatedList = [...itemListState];
                                                    updatedList[index].qty = val;           // ← เก็บเป็น number | null
                                                    setItemListState(updatedList);
                                                    formik.setFieldValue('itemList', updatedList);
                                                }}
                                                error={Boolean(formik.errors.itemList && (formik.errors.itemList as any)[index])}
                                                helperText={
                                                    formik.errors.itemList && (formik.errors.itemList as any)[index]
                                                        ? t('purchaseOrder.addProductSection.fields.errors.invalidAmount')
                                                        : ''
                                                }
                                            />
                                        </TableCell>
                                    </TableRow >
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
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
                            variant="contained"
                            onClick={handleAddRow}
                            className="btn-indigo-blue"
                            startIcon={<Add />}>
                            {t('purchaseOrder.addProductSection.addItem')}
                        </Button>
                        <Button
                            fullWidth={isDownSm}
                            variant="contained"
                            className="btn-emerald-green"
                            onClick={() => {
                                setActionType('create');
                                setTitle(t('message.createOrderTitle'));
                                setMsg(t('message.createOrderMsg'));
                                setVisibleConfirmationDialog(true);
                            }}
                            startIcon={<Save />}>
                            {t('button.create')}
                        </Button>
                        <Button
                            fullWidth={isDownSm}
                            variant="contained"
                            className="btn-amber-orange"
                            onClick={() => {
                                setActionType('clear');
                                setTitle(t('message.clearDataTitle'));
                                setMsg(t('message.clearDataMsg'));
                                setVisibleConfirmationDialog(true);
                            }}
                            startIcon={<Cancel />}>
                            {t('button.clear')}
                        </Button>
                        <Button
                            fullWidth={isDownSm}
                            variant="contained"
                            onClick={() => {
                                setActionType('back');
                                setTitle(t('message.backTitle'));
                                setMsg(t('message.backMsg'));
                                setVisibleConfirmationDialog(true);
                            }}
                            className="btn-cool-grey"
                            startIcon={<ArrowBackIos />}>
                            {t('button.back')}
                        </Button>
                    </Stack>
                </Wrapper>
            </Wrapper>
            <ConfirmDialog
                open={visibleConfirmationDialog}
                title={title}
                message={msg}
                confirmText={t('button.confirm')}
                cancelText={t('button.cancel')}
                onConfirm={() => {
                    if (actionType === 'create') {
                        console.log("Request : ", formik.values);
                        formik.handleSubmit();
                    } else if (actionType === 'clear') {
                        window.location.reload();
                    } else if (actionType === 'back') {
                        history.push(ROUTE_PATHS.SALE_ORDER_MANAGEMENT);
                    }
                    setVisibleConfirmationDialog(false);
                }}
                onCancel={() => setVisibleConfirmationDialog(false)}
                isShowCancelButton={true}
                isShowConfirmButton={true}
            />
            <SearchStaffDialog
                currentSelectStaff={selectedStaff}
                onSelectStaff={(staff) => setSelectedStaff(staff)}
                open={openSearchStaffDialog}
                setOpen={setOpenSearchStaffDialog}
            />
            <EditCustomerDialog
                open={openEditCustomerDialog}
                customer={selectedCustomer}
                onClose={(cust: Customer) => {
                    setOpenEditCustomerDialog(false);
                    formik.setFieldValue('contactNumber', cust.contactNumber);
                    formik.setFieldValue('customerName', cust.customerName);
                    formik.setFieldValue('customer', cust);
                }}
            />
            <AddNewCustomerDialog
                open={openAddNewCustomerDialog}
                onClose={(newCust: Customer, dropOff: CustomerDropOff) => {
                    setOpenAddNewCustomerDialog(false);
                    if (!newCust) return;

                    formik.setFieldValue('contactNumber', newCust.contactNumber);
                    formik.setFieldValue('customerName', newCust.customerName);
                    formik.setFieldValue('customer', newCust);
                    formik.setFieldValue('customerId', newCust.customerId);
                    formik.setFieldValue('creditTerm', newCust.customerCreditTerm.code);
                    setDisableCustomerField(true);
                    setCustomers([...customers, newCust]);
                    setSelectedCustomer(newCust);
                    const newDropOff = {
                        ...dropOff,
                        dropOffName: dropOff.dropOffName
                    };
                    formik.setFieldValue('dropOffId', newDropOff.id);
                    formik.setFieldValue('dropOff', newDropOff);
                    formik.setFieldValue('dropOffName', newDropOff.dropOffName);
                    formik.setFieldValue('supplier', newDropOff.supplier);
                    formik.setFieldValue('areaType', newDropOff.area);
                    formik.setFieldValue('province', newDropOff.province);
                    formik.setFieldValue('amphure', newDropOff.amphure);
                    formik.setFieldValue('shippingMethod', newDropOff.shippingMethod);

                    if (dropOff.area.code === 'PROVINCE') {
                        setIceChecked(true);
                        let oldValue = formik.values.notes;
                        if (!oldValue.includes('ใส่น้ำแข็ง')) {
                            formik.setFieldValue('notes', oldValue.concat(' ใส่น้ำแข็ง'));
                        }
                    }
                    setCustomerDropOffs([...customerDropOffs, newDropOff]);
                    // setDisableCustomerDropOffField(true)
                }}
            />
            <AddNewDropOffDialog
                open={openAddNewDropOffDialog}
                customerId={selectedCustomer?.customerId}
                onClose={(dropOff: CustomerDropOff) => {
                    setOpenAddNewDropOffDialog(false);
                    if (!dropOff) return;

                    const newDropOff = {
                        ...dropOff,
                        index: customerDropOffs.length + 1,
                        dropOffName: dropOff.dropOffName
                    };
                    console.log(newDropOff);
                    formik.setFieldValue('dropOffId', newDropOff.id);
                    formik.setFieldValue('dropOff', newDropOff);
                    formik.setFieldValue('dropOffName', dropOff.dropOffName);
                    formik.setFieldValue('supplier', dropOff.supplier);
                    formik.setFieldValue('areaType', dropOff.area);
                    formik.setFieldValue('province', newDropOff.province);
                    formik.setFieldValue('amphure', newDropOff.amphure);
                    formik.setFieldValue('shippingMethod', newDropOff.shippingMethod);
                    formik.setFieldValue('shopName', newDropOff.shopName);

                    if (dropOff.area.code === 'PROVINCE') {
                        setIceChecked(true);
                        let oldValue = formik.values.notes;
                        // ✅ เพิ่มเฉพาะเมื่อยังไม่มีคำว่า "ใส่น้ำแข็ง"
                        if (!oldValue.includes('ใส่น้ำแข็ง')) {
                            formik.setFieldValue('notes', oldValue.concat(' ใส่น้ำแข็ง'));
                        }
                    }

                    setCustomerDropOffs([...customerDropOffs, newDropOff]);
                    setDisableCustomerDropOffField(true)
                }}
            />
            <LoadingDialog
                open={isLoading}
            />
        </Page >
    );
}

