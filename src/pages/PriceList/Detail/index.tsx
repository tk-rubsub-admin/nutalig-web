/* eslint-disable prettier/prettier */
import { ArrowBackIos, Cancel, Save, Add, Delete, Download, ArrowDownward, ArrowUpward } from '@mui/icons-material';
import {
    useMediaQuery,
    Stack,
    Button,
    Grid,
    Autocomplete,
    TextField,
    Typography,
    IconButton,
    Switch,
    useTheme,
    FormControlLabel,
    Box,
    InputAdornment
} from '@mui/material';
import ConfirmDialog from 'components/ConfirmDialog';
import NumberTextField from 'components/NumberTextField';
import PageTitle from 'components/PageTitle';
import { Wrapper, GridSearchSection, GridTextField } from 'components/Styled';
import { useFormik, FormikProvider, FieldArray } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import * as Yup from 'yup';
import { searchProduct, getPriceListById, updatePriceList, generatePriceListImage } from 'services/Product/product-api';
import { PriceListHeader, ProductDto } from 'services/Product/product-type';
import LoadingDialog from 'components/LoadingDialog';
import AuditInfo from 'components/AuditInfo';
import { DEFAULT_DATETIME_FORMAT_MONTH_TEXT, formatDateStringWithPattern } from 'utils';


export interface PriceListParam {
    id: string;
}

export default function PriceListDetail() {
    const { t } = useTranslation();
    const theme = useTheme();
    const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
    const history = useHistory();
    const params = useParams<PriceListParam>();
    const [pl, setPl] = useState<PriceListHeader>();
    const [actionType, setActionType] = useState<string>('');
    const [title, setTitle] = useState<string>('');
    const [msg, setMsg] = useState<string>('');
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null);

    const { data: productsList } = useQuery(
        'search-product',
        () => searchProduct({
            nameContain: '',
            skuContain: '',
            categoryEqual: '',
            groupEqual: '',
            subGroupEqual: '',
            parentSkuEqual: '',
            isIncludeParentSku: true,
            categoryIn: ['ดอกไม้', 'ใบไม้', 'พวงมาลัยและงานไทย']
        }, 1, 3000),
        {
            refetchOnWindowFocus: false
        }
    );

    const productOptions = useMemo(
        () => productsList?.data.products ?? [],
        [productsList]
    );

    const formik = useFormik({
        initialValues: {
            name: pl?.name,
            type: pl?.type,
            status: pl?.status,
            isActive: pl?.status === 'ACTIVE' ? true : false,
            details: pl?.details
        },
        enableReinitialize: true,
        validationSchema: Yup.object().shape({
            type: Yup.string().required(t('productManagement.priceList.validateMessage.type')),
            name: Yup.string().required(t('productManagement.priceList.validateMessage.name')),
            details: Yup.array()
                .of(
                    Yup.object().shape({
                        productName: Yup.string()
                            .trim()
                            .required(t('productManagement.priceList.validateMessage.productName'))
                    })
                )
                .min(1, t('productManagement.priceList.validateMessage.detailMoreThanZero'))
        }),
        onSubmit: async (values, actions) => {
            const normalized = {
                ...values,
                details: values.details.map((d, idx) => ({
                    ...d,
                    seq: idx + 1
                }))
            };
            actions.setSubmitting(true);
            toast
                .promise(updatePriceList(params.id, normalized), {
                    loading: t('toast.loading'),
                    success: () => {
                        return t('productManagement.priceList.updateListSuccess');
                    },
                    error: (error) => t('productManagement.priceList.updateListFailed') + error.message
                })
                .finally(() => {
                    setVisibleConfirmationDialog(false);
                });
        }
    });

    const handleDownload = async (id: string) => {
        try {
            setIsLoading(true);

            // 1) เรียก API แล้ว "รอ" ให้เสร็จ
            const resp = await generatePriceListImage(id);
            console.log(JSON.stringify(resp));
            const imageUrls: string[] = resp?.data?.imageUrls ?? [];

            if (imageUrls.length === 0) {
                setIsLoading(false);
                alert('ไม่พบลิงก์ไฟล์ในระบบ');
                return;
            }

            // 2) โหลดพร้อมกันทั้งหมด (เร็วกว่า)
            await Promise.all(
                imageUrls.map(async (url, index) => {
                    const res = await fetch(url);
                    if (!res.ok) throw new Error(`Fetch failed: ${url}`);
                    const blob = await res.blob();

                    // ดึงชื่อไฟล์จาก URL (รองรับชื่อไทย + มี query string)
                    const beforeQuery = url.split('?')[0];
                    const rawName = beforeQuery.substring(beforeQuery.lastIndexOf('/') + 1);
                    const decoded = decodeURIComponent(rawName);
                    const fallback = `price_list_page-${index + 1}.jpg`;
                    const filename = decoded || fallback;

                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = filename;
                    // บาง browser ต้องแทรกใน DOM ชั่วคราว
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(a.href);
                })
            );
        } catch (error) {
            console.error('Download error:', error);
            alert('เกิดข้อผิดพลาดระหว่างดาวน์โหลด');
        } finally {
            setIsLoading(false);
        }
    };

    const addProduct = (push: (v: any) => void) => {
        push({
            id: crypto.randomUUID(),
            imageFile: null,
            imagePreview: null,
            sku: '',
            nameTh: '',
            nameEn: ''
        });
    };

    useEffect(async () => {
        if (!params.id) return;
        setIsLoading(true);
        const data = await getPriceListById(params.id);

        if (data.status === 'success') {
            setPl(data.data);
        }
        setIsLoading(false);

    }, [params.id]);

    return (
        <Page>
            <PageTitle title={t('productManagement.priceList.title') + ' : ' + pl?.headerId} />
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
                        color="secondary"
                        onClick={() => {
                            setActionType('back');
                            setTitle(t('message.backTitle'));
                            setMsg(t('message.backMsg'));
                            setVisibleConfirmationDialog(true);
                        }}
                        startIcon={<ArrowBackIos />}>
                        {t('button.back')}
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
                        color="primary"
                        onClick={() => { handleDownload(pl?.headerId) }}
                        startIcon={<Download />}>
                        {t('button.download')}
                    </Button>
                    <Button
                        fullWidth={isDownSm}
                        variant="contained"
                        color="success"
                        onClick={() => {
                            setActionType('submit');
                            setTitle(t('productManagement.priceList.updateListTitle'));
                            setMsg(t('productManagement.priceList.updateListMsg'));
                            setVisibleConfirmationDialog(true);
                        }}
                        startIcon={<Save />}>
                        {t('button.update')}
                    </Button>
                </Stack>
            </Wrapper>
            <Wrapper>
                <GridSearchSection container spacing={1}>
                    <Grid item xs={12} sm={2}>
                        <TextField
                            type="text"
                            required
                            fullWidth
                            value={formik.values.type}
                            label={t('productManagement.priceList.column.type')}
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(formik.touched.type && formik.errors.type)}
                            helperText={formik.touched.type && formik.errors.type}
                        />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                        <TextField
                            type="text"
                            required
                            label={t('productManagement.priceList.column.name')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.name}
                            onChange={({ target }) => {
                                formik.setFieldValue('name', target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(formik.touched.name && formik.errors.name)}
                            helperText={formik.touched.name && formik.errors.name}
                        />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                            <FormControlLabel
                                sx={{ display: { xs: 'flex', md: 'flex' }, m: 0 }}
                                control={
                                    <Switch
                                        checked={formik.values.isActive}
                                        onChange={(e) => {
                                            console.log('1:' + e.target.checked);
                                            formik.setFieldValue('isActive', e.target.checked)
                                            if (e.target.checked) {
                                                formik.setFieldValue('status', 'ACTIVE');
                                            } else {
                                                formik.setFieldValue('status', 'INACTIVE');
                                            }
                                        }}
                                    />
                                }
                                label={formik.values.isActive ? t('general.statuses.active') : t('general.statuses.inactive')}
                            />
                        </Stack>
                    </Grid>
                    <GridTextField item xs={12} sm={12}>
                        <AuditInfo
                            createdBy={pl?.createdBy}
                            createdDate={pl?.createdDate}
                            updatedBy={pl?.updatedBy}
                            updatedDate={pl?.updatedDate}
                            createdLabel={t('general.createdBy')}
                            updatedLabel={t('general.updatedBy')}
                            formatDate={(d) => formatDateStringWithPattern(d, DEFAULT_DATETIME_FORMAT_MONTH_TEXT)}
                        />
                    </GridTextField>
                </GridSearchSection>
            </Wrapper>
            <Wrapper>
                <Grid container spacing={1}>
                    <GridTextField item xs={12} sm={7}>
                        <Typography>{t('productManagement.priceList.column.productList')}</Typography>
                    </GridTextField>
                    <GridTextField item xs={9} sm={3}>
                        <Autocomplete<ProductDto>
                            options={productOptions}
                            value={selectedProduct ?? null}
                            isOptionEqualToValue={(option, value) => option.productSku === value.productSku}
                            getOptionLabel={(option) => {
                                // กันทุกเคส: null / string / object
                                if (!option) return '';
                                if (typeof option === 'string') return option;
                                return option.productNameTh ?? '';
                            }}
                            filterOptions={(options, { inputValue }) => {
                                const search = inputValue.toLowerCase();

                                const filtered = options.filter((option) => {
                                    const keyword = (option.keywords || '').toLowerCase();
                                    const name = (option.productNameTh || '').toLowerCase();
                                    return name.includes(search) || keyword.includes(search);
                                });

                                const seen = new Set<string>();
                                const distinct: ProductDto[] = [];
                                for (const product of filtered) {
                                    if (!seen.has(product.productSku)) {
                                        seen.add(product.productSku);
                                        distinct.push(product);
                                    }
                                }

                                return distinct;
                            }}
                            renderOption={(props, option) => (
                                <li {...props} key={option.productSku}>
                                    {option.productNameTh}
                                </li>
                            )}
                            onChange={(_e, value, reason) => {
                                if (reason === 'clear' || !value) {
                                    setSelectedProduct(null);
                                    return;
                                }
                                if (typeof value === 'string') {
                                    setSelectedProduct(null);
                                    return;
                                }
                                setSelectedProduct(value);
                            }}
                            fullWidth
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    required
                                    label={t('productManagement.priceList.column.productName')}
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}
                        />
                    </GridTextField>

                    {/* ปุ่มเพิ่มสินค้า */}
                    <GridTextField item xs={3} sm={2} style={{ textAlign: 'right' }}>
                        <Button
                            fullWidth={isDownSm}
                            variant="contained"
                            color="primary"
                            disabled={!selectedProduct}  // enable เฉพาะเมื่อมี selectedProduct แล้วจริง ๆ
                            onClick={() => {
                                if (!selectedProduct) return;
                                const newDetail = {
                                    id: crypto.randomUUID(),
                                    type: 'product',
                                    productSku: selectedProduct.productSku,
                                    productName: selectedProduct.productNameTh,
                                    cost: null,
                                    profitBkk: null,
                                    profitProvince: null,
                                    wholeSalePriceBkk: null,
                                    salePriceBkk: null,
                                    wholeSalePriceProvince: null,
                                    salePriceProvince: null,
                                };

                                // ✅ ใช้ setFieldValue แทน push
                                formik.setFieldValue('details', [
                                    ...formik.values.details,
                                    newDetail,
                                ]);

                                // clear selection → Autocomplete ว่าง + ปุ่ม disable
                                setSelectedProduct(null);
                            }}
                        >
                            {t('productManagement.priceList.addProduct')}
                        </Button>
                        &nbsp;
                        {/* ปุ่มเพิ่มช่องว่าง */}
                        <Button
                            fullWidth={isDownSm}
                            variant="contained"
                            color="primary"
                            onClick={() => {
                                const newDetail = {
                                    id: crypto.randomUUID(),
                                    type: 'space',
                                    productSku: '000000000000',
                                    productName: '',
                                    cost: null,
                                    profitBkk: null,
                                    profitProvince: null,
                                    wholeSalePriceBkk: null,
                                    salePriceBkk: null,
                                    wholeSalePriceProvince: null,
                                    salePriceProvince: null,
                                };

                                // ✅ ใช้ setFieldValue แทน push
                                formik.setFieldValue('details', [
                                    ...formik.values.details,
                                    newDetail,
                                ]);
                            }}
                        >
                            {t('productManagement.priceList.addSpace')}
                        </Button>
                    </GridTextField>

                    {formik.errors.details && typeof formik.errors.details === 'string' && (
                        <Grid item xs={12}>
                            <Typography color="error" sx={{ fontWeight: 'bold', mt: 1 }} align='center'>
                                {formik.errors.details}
                            </Typography>
                        </Grid>
                    )}
                    <FormikProvider value={formik}>
                        <Grid container spacing={1} sx={{ mt: 1 }}>
                            <FieldArray
                                name="details"
                                render={({ remove, move }) => (
                                    <>
                                        {formik.values.details?.map((p, idx) => {
                                            const touched = (formik.touched.details?.[idx] as any) || {};
                                            const errors = (formik.errors.details?.[idx] as any) || {};

                                            return (
                                                <Grid item xs={12} key={`${p.id}-${formik.values.type}`}>
                                                    {' '}
                                                    {/* 👈 re-mount เมื่อ type เปลี่ยน */}
                                                    <Grid container spacing={1} alignItems="center">
                                                        {/* ชื่อสินค้า */}
                                                        {p.type === 'space' ? (
                                                            <>
                                                                <GridTextField item xs={12} sm={10}>
                                                                    <TextField
                                                                        type="text"
                                                                        fullWidth
                                                                        variant="outlined"
                                                                        value={p.productName ?? ''}
                                                                        onChange={({ target }) => {
                                                                            formik.setFieldValue(`details[${idx}].productName`, target.value);
                                                                        }}
                                                                        InputLabelProps={{ shrink: true }}
                                                                        inputProps={{
                                                                            style: {
                                                                                padding: '4px 8px',
                                                                            }
                                                                        }}
                                                                        sx={{
                                                                            '& .MuiOutlinedInput-root': {
                                                                                height: '32px',
                                                                            },
                                                                            '& input': {
                                                                                textAlign: 'center',
                                                                                fontWeight: 'bold',
                                                                                color: 'red',
                                                                            }
                                                                        }}
                                                                    />
                                                                </GridTextField>

                                                                {/* ลบแถว */}
                                                                {/* <GridTextField item xs={12} sm={0.5} style={{ textAlign: 'right' }}>
                                                                    <IconButton onClick={() => remove(idx)} aria-label="remove">
                                                                        <Delete />
                                                                    </IconButton>
                                                                </GridTextField> */}
                                                                <GridTextField
                                                                    item
                                                                    xs={12}
                                                                    sm={2}
                                                                    style={{ textAlign: 'right' }}
                                                                >
                                                                    <Box display="flex" justifyContent="flex-end" gap={0.5}>
                                                                        {/* ย้ายขึ้น */}
                                                                        <IconButton
                                                                            size="small"
                                                                            aria-label="move-up"
                                                                            onClick={() => move(idx, idx - 1)}
                                                                            disabled={idx === 0} // แถวแรก ห้ามขึ้น
                                                                        >
                                                                            <ArrowUpward />
                                                                        </IconButton>

                                                                        {/* ย้ายลง */}
                                                                        <IconButton
                                                                            size="small"
                                                                            aria-label="move-down"
                                                                            onClick={() => move(idx, idx + 1)}
                                                                            disabled={idx === formik.values.details.length - 1} // แถวสุดท้าย ห้ามลง
                                                                        >
                                                                            <ArrowDownward />
                                                                        </IconButton>

                                                                        {/* ลบ */}
                                                                        <IconButton
                                                                            size="small"
                                                                            aria-label="remove"
                                                                            onClick={() => remove(idx)}
                                                                        >
                                                                            <Delete />
                                                                        </IconButton>
                                                                    </Box>
                                                                </GridTextField>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <GridTextField item xs={12} sm={7}>
                                                                    <TextField
                                                                        type="text"
                                                                        required
                                                                        label={t('productManagement.priceList.column.productName')}
                                                                        fullWidth
                                                                        variant="outlined"
                                                                        value={p.productName ?? ''}
                                                                        onChange={({ target }) => {
                                                                            formik.setFieldValue(`details[${idx}].productName`, target.value);
                                                                        }}
                                                                        InputLabelProps={{ shrink: true }}
                                                                        error={Boolean(touched?.productName && errors?.productName)}
                                                                        helperText={touched?.productName && errors?.productName}
                                                                    />
                                                                </GridTextField>

                                                                {/* ต้นทุน */}
                                                                <GridTextField item xs={12} sm={1}>
                                                                    <NumberTextField
                                                                        required
                                                                        label={t('productManagement.priceList.column.cost')}
                                                                        value={p.cost ?? null}
                                                                        min={1}
                                                                        max={9999}
                                                                        InputLabelProps={{ shrink: true }}
                                                                        onChange={(val) =>
                                                                            formik.setFieldValue(`details[${idx}].cost`, val)
                                                                        }
                                                                        onBlur={() => formik.setFieldTouched(`details[${idx}].cost`, true)}
                                                                        fullWidth
                                                                        error={Boolean(touched?.cost && errors?.cost)}
                                                                        helperText={touched?.cost && errors?.cost}
                                                                        sx={{ '& input': { textAlign: 'center' } }}
                                                                    />
                                                                </GridTextField>

                                                                {/* เงื่อนไขสลับช่อง */}
                                                                {formik.values.type === 'ราคาดอกไม้ไหว้พระ' ? (
                                                                    <>
                                                                        <GridTextField item xs={12} sm={1}>
                                                                            <NumberTextField
                                                                                key={`profit-${idx}-${formik.values.type}`}
                                                                                label={t('productManagement.priceList.column.profitBkk')}
                                                                                value={p.profitBkk ?? null}
                                                                                min={1}
                                                                                max={9999}
                                                                                InputLabelProps={{ shrink: true }} InputProps={{
                                                                                    startAdornment:
                                                                                        p.profitBkk ? (
                                                                                            <InputAdornment position="start">
                                                                                                <strong>+</strong>
                                                                                            </InputAdornment>
                                                                                        ) : null
                                                                                }}
                                                                                onChange={(val) =>
                                                                                    formik.setFieldValue(`details[${idx}].profitBkk`, val)
                                                                                }
                                                                                onBlur={() =>
                                                                                    formik.setFieldTouched(`details[${idx}].profitBkk`, true)
                                                                                }
                                                                                fullWidth
                                                                                sx={{ '& input': { textAlign: 'center' } }}
                                                                            />
                                                                        </GridTextField>
                                                                        <GridTextField item xs={12} sm={1}>
                                                                            <NumberTextField
                                                                                key={`profitProvince-${idx}-${formik.values.type}`}
                                                                                label={t('productManagement.priceList.column.profitProvince')}
                                                                                value={p.profitProvince ?? null}
                                                                                min={1}
                                                                                max={9999}
                                                                                InputLabelProps={{ shrink: true }}
                                                                                InputProps={{
                                                                                    startAdornment:
                                                                                        p.profitProvince ? (
                                                                                            <InputAdornment position="start">
                                                                                                <strong>+</strong>
                                                                                            </InputAdornment>
                                                                                        ) : null
                                                                                }}
                                                                                onChange={(val) =>
                                                                                    formik.setFieldValue(`details[${idx}].profitProvince`, val)
                                                                                }
                                                                                onBlur={() =>
                                                                                    formik.setFieldTouched(`details[${idx}].profitProvince`, true)
                                                                                }
                                                                                fullWidth
                                                                                sx={{ '& input': { textAlign: 'center' } }}
                                                                            />
                                                                        </GridTextField>
                                                                    </>
                                                                ) : formik.values.type === 'ราคาดอกไม้เชียงใหม่' ? (
                                                                    <>
                                                                    </>
                                                                ) : formik.values.type === 'ราคาใบไม้ VIP' ? (
                                                                    <>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <GridTextField item xs={12} sm={1}>
                                                                            <NumberTextField
                                                                                key={`salePrice-${idx}-${formik.values.type}`}
                                                                                label={t('productManagement.priceList.column.salePrice')}
                                                                                value={p.salePriceBkk ?? null}
                                                                                min={1}
                                                                                max={9999}
                                                                                InputLabelProps={{ shrink: true }}
                                                                                onChange={(val) =>
                                                                                    formik.setFieldValue(`details[${idx}].salePrice`, val)
                                                                                }
                                                                                onBlur={() =>
                                                                                    formik.setFieldTouched(`details[${idx}].salePrice`, true)
                                                                                }
                                                                                fullWidth
                                                                                sx={{ '& input': { textAlign: 'center' } }}
                                                                            />
                                                                        </GridTextField>
                                                                        <GridTextField item xs={12} sm={1}>
                                                                            <NumberTextField
                                                                                key={`wholesale-${idx}-${formik.values.type}`}
                                                                                label={t('productManagement.priceList.column.wholeSalePrice')}
                                                                                value={p.wholeSalePriceBkk ?? null}
                                                                                min={1}
                                                                                max={9999}
                                                                                InputLabelProps={{ shrink: true }}
                                                                                onChange={(val) =>
                                                                                    formik.setFieldValue(`details[${idx}].wholeSalePrice`, val)
                                                                                }
                                                                                onBlur={() =>
                                                                                    formik.setFieldTouched(`details[${idx}].wholeSalePrice`, true)
                                                                                }
                                                                                fullWidth
                                                                                sx={{ '& input': { textAlign: 'center' } }}
                                                                            />
                                                                        </GridTextField>
                                                                    </>
                                                                )}

                                                                {/* ลบแถว */}
                                                                {/* <GridTextField item xs={12} sm={0.5} style={{ textAlign: 'right' }}>
                                                                    <IconButton onClick={() => remove(idx)} aria-label="remove">
                                                                        <Delete />
                                                                    </IconButton>
                                                                </GridTextField> */}
                                                                <GridTextField
                                                                    item
                                                                    xs={12}
                                                                    sm={2}
                                                                    style={{ textAlign: 'right' }}
                                                                >
                                                                    <Box display="flex" justifyContent="flex-end" gap={0.5}>
                                                                        {/* ย้ายขึ้น */}
                                                                        <IconButton
                                                                            size="small"
                                                                            aria-label="move-up"
                                                                            onClick={() => move(idx, idx - 1)}
                                                                            disabled={idx === 0} // แถวแรก ห้ามขึ้น
                                                                        >
                                                                            <ArrowUpward />
                                                                        </IconButton>

                                                                        {/* ย้ายลง */}
                                                                        <IconButton
                                                                            size="small"
                                                                            aria-label="move-down"
                                                                            onClick={() => move(idx, idx + 1)}
                                                                            disabled={idx === formik.values.details.length - 1} // แถวสุดท้าย ห้ามลง
                                                                        >
                                                                            <ArrowDownward />
                                                                        </IconButton>

                                                                        {/* ลบ */}
                                                                        <IconButton
                                                                            size="small"
                                                                            aria-label="remove"
                                                                            onClick={() => remove(idx)}
                                                                        >
                                                                            <Delete />
                                                                        </IconButton>
                                                                    </Box>
                                                                </GridTextField>
                                                            </>)}
                                                    </Grid>
                                                </Grid>
                                            );
                                        })}
                                    </>
                                )}
                            />
                        </Grid>
                    </FormikProvider>
                </Grid>
            </Wrapper>
            <ConfirmDialog
                open={visibleConfirmationDialog}
                title={title}
                message={msg}
                confirmText={t('button.confirm')}
                cancelText={t('button.cancel')}
                onConfirm={() => {
                    if (actionType === 'submit') {
                        formik.handleSubmit();
                    } else if (actionType === 'clear') {
                        formik.resetForm();
                    } else if (actionType === 'back') {
                        history.push(ROUTE_PATHS.PRICE_LIST);
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
