/* eslint-disable prettier/prettier */
import { Close, Save } from '@mui/icons-material';
import { Dialog, DialogTitle, DialogContent, Grid, Button, DialogActions, TextField, Autocomplete, FormControl, FormControlLabel, Radio, RadioGroup, CircularProgress } from '@mui/material';
import ConfirmDialog from 'components/ConfirmDialog';
import { GridTextField } from 'components/Styled';
import * as Yup from 'yup';
import { Fragment, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreateCustomerRequestV2, CreateCustomerResponseV2, Customer, CustomerDropOff } from 'services/Customer/customer-type';
import { useFormik } from 'formik';
import { GROUP_CODE, SystemConfig } from 'services/Config/config-type';
import { Amphure, Province } from 'services/Address/address-type';
import { SearchSupplierRequest, Supplier } from 'services/Supplier/supplier-type';
import { getProvince, getAmphure } from 'services/Address/address-api';
import { getSystemConfig } from 'services/Config/config-api';
import { searchSupplier } from 'services/Supplier/supplier-api';
import { isMobileOnly } from 'react-device-detect';
import toast from 'react-hot-toast';
import { createNewCustomerV2 } from 'services/Customer/customer-api';
import ManualHelpButton from 'pages/Manual/ManualHelpButton';

export interface AddNewCustomerDialogProps {
    open: boolean;
    onClose: (cust: Customer, dropOff: CustomerDropOff) => void;
}

export default function AddNewCustomerDialog(props: AddNewCustomerDialogProps): JSX.Element {
    const { open, onClose } = props;
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [areaTypes, setAreaTypes] = useState<SystemConfig[]>([]);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [amphures, setAmphures] = useState<Amphure[]>([]);
    const { t } = useTranslation();
    const formik = useFormik({
        initialValues: {
            customerName: '',
            contactNumber: '',
            dropOffName: '-',
            supplier: null as unknown as Supplier,
            areaType: null as unknown as SystemConfig,
            province: null as unknown as Province,
            amphure: null as unknown as Amphure,
            shippingMethod: 'DELIVERY',
            shopName: ''
        },
        enableReinitialize: false,
        validationSchema: Yup.object().shape({
            customerName: Yup.string().max(255).required(t('warning.required')),
            contactNumber: Yup.string().max(255).required(t('warning.required')).matches(
                /^(0[689]\d{8}|0[2-9]\d{7})$/,
                t('purchaseOrder.warning.invalidPhoneNumberFormat')
            ),
            areaType: Yup.object().nullable().required(t('purchaseOrder.warning.areaTypeRequired')),
            dropOffName: Yup.string().max(255).required(t('warning.required')),
            supplier: Yup.object().nullable().required(t('purchaseOrder.warning.supplierRequired')),
            province: Yup.object().nullable().required(t('supplierManagement.message.validateProvince'))
        }),
        onSubmit: (values, actions) => {
            actions.setSubmitting(true);
            console.log('request ', values);
            const createNewCust: CreateCustomerRequestV2 = {
                customerName: values.customerName,
                contactNumber: values.contactNumber,
                area: values.areaType.code,
                creditTerm: 'TRANSFER',
                supplierId: values.supplier.supplierId,
                dropOffName: values.dropOffName,
                amphureId: values.amphure?.id,
                provinceId: values.province.id,
                isDefaultDropOff: true,
                shippingMethod: values.shippingMethod,
                shopName: values.shopName
            }
            toast.promise(createNewCustomerV2(createNewCust), {
                loading: t('toast.loading'),
                success: (response: CreateCustomerResponseV2) => {
                    // onClose();
                    console.log(response);
                    const newCustomer: Customer = {
                        customerId: response.data.customerId,
                        customerName: values.customerName,
                        contactNumber: values.contactNumber,
                        customerCreditTerm: {
                            groupCode: 'CUSTOMER_CREDIT_TERM',
                            code: 'TRANSFER',
                            nameTh: 'โอนก่อนส่งเท่านั้น',
                            nameEn: 'โอนก่อนส่งเท่านั้น',
                            iconUrl: ''
                        }
                    };
                    const newDropOff: CustomerDropOff = {
                        index: 1,
                        id: response.data.dropOffId,
                        dropOffName: values.dropOffName,
                        area: values.areaType,
                        supplier: values.supplier,
                        province: values.province,
                        amphure: values.amphure,
                        shippingMethod: values.shippingMethod
                    }
                    onClose(newCustomer, newDropOff);
                    return t('toast.success');
                },
                error: (error) => t('toast.failed') + ' ' + error.message
            }).finally(() => {
                setVisibleConfirmationDialog(false);
            });

        }
    })

    const onAutoCompleteChange = (field: string, value: any, reason: string) => {
        if (reason === 'clear') {
            formik.setFieldValue(field, null);
        } else {
            formik.setFieldValue(field, value);
        }
    };

    useEffect(async () => {
        if (open) {
            const defaultSearchSupplier: SearchSupplierRequest = {
                typeIn: ['ขนส่ง'],
                statusEqual: 'ACTIVE'
            };
            const supplierList = await searchSupplier(defaultSearchSupplier, 1, 100);
            const customerAreaList = await getSystemConfig(GROUP_CODE.CUSTOMER_AREA);
            const provinceList = await getProvince();
            const amphureList = await getAmphure();

            setSuppliers(supplierList.data.suppliers);
            setAreaTypes(customerAreaList);
            setProvinces(provinceList);
            setAmphures(amphureList);
        }
    }, [open]);

    return (
        <Dialog open={open} fullWidth aria-labelledby="form-dialog-title">
            <DialogTitle
                id="form-dialog-title"
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pr: 1, // เว้นที่ให้ icon
                }}
            >
                {t('customerManagement.addNewCustomerButton')}

                <ManualHelpButton manualId="MANUAL000003" />
            </DialogTitle>
            <DialogContent sx={{ overflow: 'visible' }}>
                <br />
                <Grid container spacing={3}>
                    <GridTextField item xs={12} sm={12}>
                        <TextField
                            type="text"
                            label={t('purchaseOrder.customerInformationSection.fields.labels.customerName') + '*'}
                            fullWidth
                            value={formik.values.customerName}
                            onChange={({ target }) => {
                                const value = target.value;
                                formik.setFieldValue('customerName', value);
                            }}
                            variant="outlined"
                            error={Boolean(formik.touched.customerName && formik.errors.customerName)}
                            helperText={formik.touched.customerName && formik.errors.customerName}
                            InputLabelProps={{ shrink: true }}
                            placeholder="ชื่อร้านค้า + จังหวัด หรือ อำเภอ ที่ตั้ง"
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={12}>
                        <TextField
                            type="number"
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*'
                            }}
                            label={t('purchaseOrder.customerInformationSection.fields.labels.contactNumber') + '*'}
                            fullWidth
                            value={formik.values.contactNumber}
                            placeholder='ระบุเบอร์ติดต่อ โดยระบุเฉพาะตัวเลข 9-10 หลัก'
                            onChange={({ target }) => {
                                const value = target.value;
                                formik.setFieldValue('contactNumber', value);
                            }}
                            variant="outlined"
                            error={Boolean(formik.touched.contactNumber && formik.errors.contactNumber)}
                            helperText={formik.touched.contactNumber && formik.errors.contactNumber}
                            InputLabelProps={{ shrink: true }}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={12}>
                        <FormControl>
                            {t('customerManagement.column.dropOff.shippingMethod')}
                            <RadioGroup
                                row
                                value={formik.values.shippingMethod}
                                onChange={({ target }) => {
                                    formik.setFieldValue('shippingMethod', target.value);
                                    if (target.value === 'DELIVERY') {
                                        formik.setFieldValue('shopName', '');
                                        formik.setFieldValue('dropOffName', '-');
                                        formik.setFieldValue('areaType', null);
                                        formik.setFieldValue('province', null);
                                        formik.setFieldValue('supplier', null);
                                    } else if (target.value === 'PICK_UP') {
                                        formik.setFieldValue('shopName', '');
                                        formik.setFieldValue('dropOffName', 'มารับเอง');
                                        formik.setFieldValue('areaType', areaTypes.find(area => area.code === 'BKK'));
                                        formik.setFieldValue('province', provinces.find(p => p.id === '1'));
                                        formik.setFieldValue('supplier', suppliers.find(supp => supp.supplierProductType.code === 'SELF_PICKUP'));
                                    } else if (target.value === 'SEND_TO_SHOP') {
                                        formik.setFieldValue('shopName', '');
                                        formik.setFieldValue('dropOffName', '-');
                                        formik.setFieldValue('areaType', areaTypes.find(area => area.code === 'BKK'));
                                        formik.setFieldValue('province', provinces.find(p => p.id === '1'));
                                        formik.setFieldValue('supplier', suppliers.find(supp => supp.supplierProductType.code === 'DELIVERY_TO_SHOP'));
                                    } else {
                                        formik.setFieldValue('shopName', '');
                                        formik.setFieldValue('dropOffName', '-');
                                        formik.setFieldValue('areaType', areaTypes.find(area => area.code === 'BKK'));
                                        formik.setFieldValue('province', provinces.find(p => p.id === '1'));
                                        formik.setFieldValue('supplier', suppliers.find(supp => supp.supplierProductType.code === 'DELIVERY_BY_OTHER_STORE'));
                                    }
                                }}
                            >
                                <FormControlLabel value="DELIVERY" control={<Radio />} label={t('customerManagement.column.dropOff.delivery')} />
                                <FormControlLabel value="PICK_UP" control={<Radio />} label={t('customerManagement.column.dropOff.selfPickup')} />
                                <FormControlLabel value="LEAVE_SHOP" control={<Radio />} label={t('customerManagement.column.dropOff.leaveOther')} />
                                <FormControlLabel value="SEND_TO_SHOP" control={<Radio />} label={t('customerManagement.column.dropOff.sendToShop')} />
                            </RadioGroup>
                        </FormControl>
                    </GridTextField>
                    {(formik.values.shippingMethod === 'SEND_TO_SHOP' || formik.values.shippingMethod === 'LEAVE_SHOP') && (
                        <GridTextField item xs={12} sm={12}>
                            <TextField
                                fullWidth
                                required
                                label={formik.values.shippingMethod === 'LEAVE_SHOP' ? t('customerManagement.column.dropOff.leaveShopName') : t('customerManagement.column.dropOff.sendToShopName')}
                                value={formik.values.shopName}
                                onChange={({ target }) =>
                                    formik.setFieldValue(`shopName`, target.value)
                                }
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
                    {(formik.values.shippingMethod === 'DELIVERY' || formik.values.shippingMethod === 'PICK_UP') && (
                        <GridTextField item xs={12} sm={12}>
                            <TextField
                                type="text"
                                label={t('purchaseOrder.customerInformationSection.fields.labels.dropOff') + '*'}
                                fullWidth
                                value={formik.values.dropOffName}
                                placeholder="ระบุจุดลงของ ในกรณีที่ขนส่งไม่ได้จัดส่งถึงร้าน"
                                onChange={({ target }) => {
                                    formik.setFieldValue('dropOffName', target.value);
                                }}
                                variant="outlined"
                                error={Boolean(formik.touched.dropOffName && formik.errors.dropOffName)}
                                helperText={formik.touched.dropOffName && formik.errors.dropOffName}
                                InputLabelProps={{ shrink: true }}
                            />
                        </GridTextField>
                    )}
                    <GridTextField item xs={12} sm={12}>
                        <Autocomplete
                            disabled={areaTypes.length === 0 || formik.values.shippingMethod !== 'DELIVERY'}
                            loading={areaTypes.length === 0}
                            disablePortal
                            options={areaTypes?.map((option) => option) || []}
                            getOptionLabel={(option: SystemConfig) => option.nameTh}
                            sx={{ width: '100%' }}
                            slotProps={{
                                popper: { sx: { zIndex: (theme) => theme.zIndex.modal + 1 } }
                            }}
                            value={formik.values.areaType || null}
                            onChange={(_event, value, reason) => {
                                onAutoCompleteChange(`areaType`, value, reason);
                                if (value?.code === 'BKK') {
                                    let bkk = provinces.find(p => p.id === '1')
                                    onAutoCompleteChange(`province`, bkk, reason);
                                } else {
                                    onAutoCompleteChange(`province`, null, reason);
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t('customerManagement.column.dropOff.areaType') + '*'}
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{
                                        ...params.inputProps,
                                        readOnly: isMobileOnly ? true : false, // Disable keyboard on mobile
                                    }}
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {areaTypes.length === 0 ? (
                                                    <CircularProgress color="inherit" size={20} />
                                                ) : (<></>)}
                                                {params.InputProps.endAdornment}
                                            </>
                                        )
                                    }}
                                    error={Boolean(formik.touched.areaType && formik.errors.areaType)}
                                    helperText={formik.touched.areaType && formik.errors.areaType}
                                />
                            )}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={12}>
                        <Autocomplete
                            disablePortal
                            disabled={provinces.length === 0 || formik.values.shippingMethod !== 'DELIVERY'}
                            loading={provinces.length === 0}
                            options={provinces?.filter(p => p.type === formik.values.areaType?.code).map((option) => option) || []}
                            getOptionLabel={(option: Province) => option.nameTh}
                            sx={{ width: '100%' }}
                            slotProps={{
                                popper: { sx: { zIndex: (theme) => theme.zIndex.modal + 1 } }
                            }}
                            value={formik.values.province || null}
                            onChange={(_event, value, reason) => {
                                onAutoCompleteChange(`province`, value, reason);
                                if (value?.id !== '1') {
                                    const amphureMueng = amphures.filter(a => a.provinceId === value?.id && a.nameTh.includes("เมือง"));
                                    console.log("amphureMeung", amphureMueng);
                                    onAutoCompleteChange('amphure', amphureMueng[0], reason);
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t('supplierManagement.column.address.province') + '*'}
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{
                                        ...params.inputProps,
                                        // readOnly: isMobileOnly ? true : false,
                                    }}
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {provinces.length === 0 ? (
                                                    <CircularProgress color="inherit" size={20} />
                                                ) : (<></>)}
                                                {params.InputProps.endAdornment}
                                            </>
                                        )
                                    }}
                                    error={Boolean(formik.touched.province && formik.errors.province)}
                                    helperText={formik.touched.province && formik.errors.province}
                                />
                            )}
                        />
                    </GridTextField>
                    {formik.values.province !== null && formik.values.province?.id !== '1' ?
                        <>
                            <GridTextField item xs={12} sm={12}>
                                <Autocomplete
                                    disablePortal
                                    disabled={amphures.length === 0 || formik.values.shippingMethod !== 'DELIVERY'}
                                    loading={amphures.length === 0}
                                    options={amphures?.filter((amp) => {
                                        if (formik.values.province !== null) {
                                            return amp.provinceId === formik.values.province?.id;
                                        } else {
                                            return amp;
                                        }
                                    }
                                    ).map((option) => option) || []}
                                    getOptionLabel={(option: Amphure) => option.nameTh}
                                    sx={{ width: '100%' }}
                                    slotProps={{
                                        popper: { sx: { zIndex: (theme) => theme.zIndex.modal + 1 } }
                                    }}
                                    value={formik.values.amphure || null}
                                    onChange={(_event, value, reason) => {
                                        onAutoCompleteChange(`amphure`, value, reason);
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={t('supplierManagement.column.address.amphure') + '*'}
                                            InputLabelProps={{ shrink: true }}
                                            inputProps={{
                                                ...params.inputProps,
                                                // readOnly: isMobileOnly ? true : false,
                                            }}
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {amphures.length === 0 ? (
                                                            <CircularProgress color="inherit" size={20} />
                                                        ) : (<></>)}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                )
                                            }}
                                            error={Boolean(formik.touched.amphure && formik.errors.amphure)}
                                            helperText={formik.touched.amphure && formik.errors.amphure}
                                        />
                                    )}
                                />
                            </GridTextField>
                        </> : <></>}
                    <GridTextField item xs={12} sm={12}>
                        <Autocomplete
                            disablePortal
                            disabled={suppliers.length === 0 || formik.values.shippingMethod !== 'DELIVERY'}
                            loading={suppliers.length === 0}
                            groupBy={(option) => option.supplierProductType.nameTh}
                            options={suppliers
                                .filter((supplier) => supplier.supplierProductType.code !== 'DELIVERY_CNX_TO_BKK')
                                .sort((a, b) => a.supplierProductType.code.localeCompare(b.supplierProductType.code))
                                .map((supplier) => supplier)
                                || []}
                            getOptionLabel={(option: Supplier) => option.phoneContactName}
                            sx={{ width: '100%', paddingRight: '4px' }}
                            slotProps={{
                                popper: { sx: { zIndex: (theme) => theme.zIndex.modal + 1 } }
                            }}
                            value={formik.values.supplier || null}
                            onChange={(_event, value, reason) => {
                                onAutoCompleteChange(`supplier`, value, reason);
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t('customerManagement.column.dropOff.supplier') + '*'}
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{
                                        ...params.inputProps,
                                        readOnly: isMobileOnly ? true : false, // Disable keyboard on mobile
                                    }}

                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {suppliers.length === 0 ? (
                                                    <CircularProgress color="inherit" size={20} />
                                                ) : (<></>)}
                                                {params.InputProps.endAdornment}
                                            </>
                                        )
                                    }}
                                    error={Boolean(formik.touched.supplier && formik.errors.supplier)}
                                    helperText={formik.touched.supplier && formik.errors.supplier}
                                />
                            )}
                            renderGroup={(params) => (
                                <Fragment key={params.key}>
                                    <div style={{ textAlign: 'center', fontWeight: 'bold', marginTop: 10 }}>{`======== ${params.group} ========`}</div>
                                    <ul>{params.children}</ul>
                                </Fragment>
                            )}
                        />
                    </GridTextField>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        // resetAllValue()
                        onClose(null);
                    }}
                    variant="contained"
                    startIcon={<Close />}
                    color="error">
                    {t('button.close')}
                </Button>
                <Button
                    color="success"
                    variant="contained"
                    startIcon={<Save />}
                    onClick={() => setVisibleConfirmationDialog(true)}>
                    {t('button.create')}
                </Button>
            </DialogActions>
            <ConfirmDialog
                open={visibleConfirmationDialog}
                title={t('customerManagement.newCustomer')}
                message={t('customerManagement.confirmMsgNewCustomer')}
                confirmText={t('button.confirm')}
                cancelText={t('button.cancel')}
                onConfirm={() => {
                    formik.handleSubmit();
                    setVisibleConfirmationDialog(false);
                }}
                onCancel={() => setVisibleConfirmationDialog(false)}
                isShowCancelButton={true}
                isShowConfirmButton={true}
            />
        </Dialog >
    );
}
