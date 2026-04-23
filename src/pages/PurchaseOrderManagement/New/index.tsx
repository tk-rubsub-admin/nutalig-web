/* eslint-disable prettier/prettier */
/* eslint-disable no-undef */
import { Add, ArrowBackIos, Cancel, Delete, Save } from '@mui/icons-material';
import { Autocomplete, Button, CircularProgress, Grid, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import DatePicker from 'components/DatePicker';
import PageTitle from 'components/PageTitle';
import { GridTextField, Wrapper } from 'components/Styled';
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import toast from 'react-hot-toast';
import * as Yup from 'yup';
import { Page } from 'layout/LayoutRoute';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { searchProduct } from 'services/Product/product-api';
import { searchSupplier } from 'services/Supplier/supplier-api';
import { SearchSupplierRequest, Supplier } from 'services/Supplier/supplier-type';
import { DEFAULT_DATE_FORMAT, DEFAULT_DATE_FORMAT_BFF } from 'utils';
import { Fragment } from 'react/jsx-runtime';
import { useState } from 'react';
import { Item } from 'services/Item/item-type';
import NumberTextField from 'components/NumberTextField';
import { ProductDto } from 'services/Product/product-type';
import ConfirmDialog from 'components/ConfirmDialog';
import { ROUTE_PATHS } from 'routes';
import { useHistory } from 'react-router-dom';
import { CreatePurchaseOrderRequest } from 'services/PurchaseOrder/purchase-order-type';
import LoadingDialog from 'components/LoadingDialog';
import { createPurchaseOrder } from 'services/PurchaseOrder/purchase-order-api';

export default function NewPurchaseOrder() {
    const { t } = useTranslation();
    const theme = useTheme();
    const history = useHistory();
    const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
    const [isLoading, setIsLoading] = useState(false);
    const [actionType, setActionType] = useState<string>('');
    const [title, setTitle] = useState<string>('');
    const [msg, setMsg] = useState<string>('');
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
    const useStyles = makeStyles({
        hideObject: {
            display: 'none'
        },
        noResultMessage: {
            textAlign: 'center',
            fontSize: '1.2em',
            fontWeight: 'bold'
        },
        datePickerFromTo: {
            '&& .MuiOutlinedInput-input': {
                padding: '16.5px 14px'
            },
            '&& .MuiFormLabel-root': {
                fontSize: '13px'
            }
        }
    });
    const classes = useStyles();

    const defaultSearchSupplier: SearchSupplierRequest = {
        idEqual: '',
        nameContain: '',
        typeIn: ['สวนดอกไม้', 'สวนใบไม้', 'ร้านในปากคลองตลาด', 'พ่อค้าคนกลาง'],
        typeEqual: '',
        rankEqual: '',
        mainProductContain: '',
        productTypeEqual: '',
        statusEqual: 'ACTIVE',
        contactNameContain: '',
        contactNumberContain: '',
        creditTermEqual: '',
        bankEqual: ''
    };
    const defaultProductFilter = {
        nameContain: '',
        skuContain: '',
        categoryEqual: '',
        groupEqual: '',
        subGroupEqual: '',
        parentSkuEqual: '',
        isIncludeParentSku: false
    };
    const { data: supplierList, isFetching: isSupplierFetching } = useQuery(
        'search-supplier',
        () => searchSupplier(defaultSearchSupplier, 1, 1000),
        {
            refetchOnWindowFocus: false,
            keepPreviousData: true,
        }
    );
    const { data: productsList, isFetching: isProductFetching } = useQuery(
        'search-product',
        () => searchProduct(defaultProductFilter, 1, 3000),
        {
            refetchOnWindowFocus: false
        }
    );

    const defaultItem: { index: number; }[] = [];
    Array.from({ length: 5 }, (_, index) => (
        defaultItem.push({ index })
    ));
    const formik = useFormik({
        initialValues: {
            purchaseDate: '',
            supplier: null,
            itemList: defaultItem
        },
        enableReinitialize: false,
        validationSchema: Yup.object().shape({
            purchaseDate: Yup.date()
                .required(t('procurement.purchaseOrder.new.message.purchaseDateRequired')),
            supplier: Yup.object().nullable().required(t('procurement.purchaseOrder.new.message.supplierRequired')),
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
        onSubmit: (values) => {
            console.log(values);
            const items: { productSku: any; orderQty: any; }[] = []
            values.itemList.map((item) => {
                if (item.item !== undefined && item.item !== null) {
                    items.push({
                        productSku: item.item?.productSku,
                        orderQty: item.qty
                    })
                }
            })
            const createPurchaseRequest: CreatePurchaseOrderRequest = {
                purchaseDate: dayjs(values.purchaseDate).startOf('day').format(DEFAULT_DATE_FORMAT_BFF),
                supplierId: values.supplier?.supplierId,
                lines: items
            }
            setIsLoading(true);
            toast
                .promise(createPurchaseOrder(createPurchaseRequest), {
                    loading: t('toast.loading'),
                    success: () => {
                        history.push(ROUTE_PATHS.PURCHASE_ORDER_MANAGEMENT);
                        return t('toast.success');
                    },
                    error: () => {
                        return t('toast.failed');
                    }
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
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
    const handleRemoveRow = (index: number) => {
        const updatedList = itemListState.filter((_, i) => i !== index);
        setItemListState(updatedList);
        formik.setFieldValue('itemList', updatedList);
    };
    const handleClear = () => {
        formik.resetForm({
            values: {
                purchaseDate: '',
                supplier: null,
                itemList: defaultItem
            }
        });
        setItemListState(defaultItem);
    };

    return (
        <Page>
            <PageTitle title={t('procurement.purchaseOrder.new.title')} />
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
                    <Button
                        fullWidth={isDownSm}
                        variant="contained"
                        className="btn-emerald-green"
                        onClick={() => {
                            setActionType('create');
                            setTitle(t('procurement.purchaseOrder.new.message.createPoTitle'));
                            setMsg(t('procurement.purchaseOrder.new.message.createPoMsg'));
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
                </Stack>
            </Wrapper>
            <Grid container spacing={1}>
                <Grid item sm={9}>
                    <Wrapper>
                        <Grid container spacing={1}>
                            <GridTextField item xs={6} sm={12}>
                                <Typography variant="subtitle1" fontWeight={600}>{t('procurement.purchaseOrder.new.purchaseSection')}</Typography>
                            </GridTextField>
                            <GridTextField item xs={12} sm={3}>
                                <DatePicker
                                    className={classes.datePickerFromTo}
                                    fullWidth
                                    inputVariant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                    label={t('procurement.purchaseOrder.column.purchaseDate') + ' *'}
                                    name="purchaseDate"
                                    disablePast
                                    format={DEFAULT_DATE_FORMAT}
                                    value={formik.values.purchaseDate || null}
                                    onBlur={() => formik.setFieldTouched('purchaseDate', true)}
                                    error={Boolean(formik.touched.purchaseDate && formik.errors.purchaseDate)}
                                    helperText={formik.touched.purchaseDate && formik.errors.purchaseDate}
                                    onChange={(date) => {
                                        if (date !== null) {
                                            formik.setFieldValue('purchaseDate', date.toDate());
                                        } else {
                                            formik.setFieldValue('purchaseDate', '');
                                        }
                                    }}
                                />
                            </GridTextField>
                            <GridTextField item xs={12} sm={3}>
                                <Autocomplete
                                    disablePortal
                                    disabled={isSupplierFetching}
                                    loading={isSupplierFetching}
                                    groupBy={(option) => option.supplierProductType.nameTh}
                                    options={supplierList?.data.suppliers
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
                                        formik.setFieldValue('supplier', value ?? null);
                                        formik.setFieldTouched('supplier', true, true);
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            required
                                            label={t('productManagement.productSupplier.column.supplier')}
                                            InputLabelProps={{ shrink: true }}
                                            onBlur={() => formik.setFieldTouched('supplier', true)}
                                            error={Boolean(formik.touched.supplier && formik.errors.supplier)}
                                            helperText={formik.touched.supplier && formik.errors.supplier}
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {isSupplierFetching ? (
                                                            <CircularProgress color="inherit" size={20} />
                                                        ) : (<></>)}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                )
                                            }}
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
                            <GridTextField item sm={6}></GridTextField>
                        </Grid>
                    </Wrapper>
                    <Wrapper>
                        <Grid container spacing={1} alignItems="center">
                            <GridTextField item xs={6} sm={6}>
                                <Typography variant="subtitle1" fontWeight={600}>{t('procurement.purchaseOrder.new.itemList')}</Typography>
                            </GridTextField>
                            <GridTextField item xs={6} sm={6} style={{ textAlign: 'right' }}>
                                <>
                                    {/* xs-only: Add icon */}
                                    <Tooltip title={t('purchaseOrder.addItem')}>
                                        <IconButton
                                            size="small"
                                            // disabled={!notAllowToMakeOrder}
                                            onClick={handleAddRow}
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
                                        onClick={handleAddRow}
                                        sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                                        {t('purchaseOrder.addItem')}
                                    </Button>
                                </>
                            </GridTextField>
                            {!isDownSm && (
                                <TableContainer component={Paper} sx={{ mt: 1 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ minWidth: 180 }}>
                                                    {t('purchaseOrder.productSection.fields.labels.name')}
                                                </TableCell>
                                                <TableCell sx={{ width: 250 }}>
                                                    {t('purchaseOrder.addProductSection.fields.labels.amount')}
                                                </TableCell>
                                                <TableCell sx={{ width: 60 }} />
                                            </TableRow>
                                        </TableHead>

                                        <TableBody>
                                            {itemListState.map((item, index) => (
                                                <TableRow key={index} hover>
                                                    {/* Product */}
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
                                                    </TableCell>

                                                    {/* Qty */}
                                                    <TableCell>
                                                        <NumberTextField
                                                            required
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

                                                    {/* Delete */}
                                                    <TableCell align="center">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            disabled={itemListState.length === 1}
                                                            onClick={() => handleRemoveRow(index)}
                                                        >
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                            {isDownSm && (
                                <Stack spacing={1} mt={1}>
                                    {itemListState.map((item, index) => (
                                        <Paper key={index} sx={{ p: 1.5 }}>
                                            <Grid container spacing={1} alignItems="center">

                                                {/* Product */}
                                                <Grid item xs={12}>
                                                    <Autocomplete
                                                        disabled={isProductFetching}
                                                        options={productsList?.data.products || []}
                                                        getOptionLabel={(p: ProductDto) => p.productNameTh}
                                                        value={item?.item || null}
                                                        onChange={(_e, value, reason) => {
                                                            const updated = [...itemListState];
                                                            updated[index].item = reason === 'clear' ? null : value;
                                                            setItemListState(updated);
                                                            formik.setFieldValue('itemList', updated);
                                                        }}
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                label="สินค้า"
                                                                fullWidth
                                                                InputLabelProps={{ shrink: true }}
                                                            />
                                                        )}
                                                    />
                                                </Grid>

                                                {/* Qty */}
                                                <Grid item xs={8}>
                                                    <NumberTextField
                                                        required
                                                        label={t('purchaseOrder.addProductSection.fields.labels.amount')}
                                                        value={item?.qty ?? null}
                                                        min={1}
                                                        max={9999}
                                                        fullWidth
                                                        InputLabelProps={{ shrink: true }}
                                                        onChange={(val) => {
                                                            const updated = [...itemListState];
                                                            updated[index].qty = val;
                                                            setItemListState(updated);
                                                            formik.setFieldValue('itemList', updated);
                                                        }}
                                                        error={Boolean(formik.errors.itemList && (formik.errors.itemList as any)[index])}
                                                    />
                                                </Grid>

                                                {/* Delete */}
                                                <Grid item xs={4} textAlign="right">
                                                    <IconButton
                                                        color="error"
                                                        disabled={itemListState.length === 1}
                                                        onClick={() => handleRemoveRow(index)}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    ))}
                                </Stack>
                            )}
                        </Grid>
                    </Wrapper>
                </Grid>
                <Grid item sm={3}>
                    <Wrapper>
                        <Grid container spacing={1}>
                            <GridTextField item xs={6} sm={12}>
                                <Typography variant="subtitle1" fontWeight={600}>ออเดอร์ วันที่ 29/12/2025</Typography>
                            </GridTextField>
                        </Grid>
                    </Wrapper>
                    <Wrapper>
                        <Grid container spacing={1}>
                            <GridTextField item xs={6} sm={12}>
                                <Typography variant="subtitle1" fontWeight={600}>ออเดอร์ วันที่ 30/12/2025</Typography>
                            </GridTextField>
                        </Grid>
                    </Wrapper>
                </Grid>
            </Grid>
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
                </Stack>
            </Wrapper>
            <ConfirmDialog
                open={visibleConfirmationDialog}
                title={title}
                message={msg}
                confirmText={t('button.confirm')}
                cancelText={t('button.cancel')}
                onConfirm={() => {
                    if (actionType === 'create') {
                        formik.handleSubmit();
                    } else if (actionType === 'clear') {
                        handleClear();
                    } else if (actionType === 'back') {
                        history.push(ROUTE_PATHS.PURCHASE_ORDER_MANAGEMENT);
                    }
                    setVisibleConfirmationDialog(false);
                }}
                onCancel={() => setVisibleConfirmationDialog(false)}
                isShowCancelButton={true}
                isShowConfirmButton={true}
            />
            <LoadingDialog
                open={isLoading}
            />
        </Page>
    );
}
