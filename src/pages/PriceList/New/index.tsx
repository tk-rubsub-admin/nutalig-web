/* eslint-disable prettier/prettier */
import { Autocomplete, Box, Button, Collapse, Grid, IconButton, InputAdornment, Stack, TextField, Typography, useMediaQuery, useTheme } from '@mui/material';
import PageTitle from "components/PageTitle";
import { GridSearchSection, GridTextField, Wrapper } from "components/Styled";
import { Page } from "layout/LayoutRoute";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from 'react-query';
import { useHistory } from "react-router-dom";
import toast from 'react-hot-toast';
import * as Yup from 'yup';
import { getSystemConfig } from 'services/Config/config-api';
import { Add, ArrowBackIos, Cancel, Delete, Info, Save } from '@mui/icons-material';
import { FieldArray, FormikProvider, useFormik } from 'formik';
import NumberTextField from 'components/NumberTextField';
import { createPriceList, searchProduct } from 'services/Product/product-api';
import { ProductDto } from 'services/Product/product-type';
import ConfirmDialog from 'components/ConfirmDialog';
import { ROUTE_PATHS } from 'routes';

type PriceDetail = {
    id: string;
    type: string;
    productName: string;
    salePriceBkk: number | null;
    wholeSalePriceBkk: number | null;
    salePriceProvince: number | null;
    wholeSalePriceProvince: number | null;
    cost: number | null;
    profitBkk: number | null;
    profitProvince: number | null;
    seq: number;

};

export default function NewPriceList() {
    const { t } = useTranslation();
    const theme = useTheme();
    const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
    const history = useHistory();
    const [actionType, setActionType] = useState<string>('');
    const [title, setTitle] = useState<string>('');
    const [msg, setMsg] = useState<string>('');
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null);

    const {
        data: typeList,
        isFetching,
    } = useQuery('price-list', () => getSystemConfig('PRICE_LIST'), {
        refetchOnWindowFocus: false
    });

    const { data: productsList } = useQuery(
        'search-product',
        () => searchProduct({
            nameContain: '',
            skuContain: '',
            categoryEqual: '',
            groupEqual: '',
            subGroupEqual: '',
            parentSkuEqual: '000000000000',
            isIncludeParentSku: true
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
            name: '',
            type: '',
            status: 'ACTIVE',
            details: [] as PriceDetail[]
        },
        enableReinitialize: false,
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
            toast.promise(createPriceList(normalized),
                {
                    loading: t('toast.loading'),
                    success: () => {
                        history.push(ROUTE_PATHS.PRICE_LIST);
                        return t('productManagement.priceList.createNewListSuccess')
                    },
                    error: (error) => t('productManagement.priceList.createNewListFailed') + error.message,
                }
            ).finally(() => {
                setVisibleConfirmationDialog(false)
            })
        }
    });

    const resetDetailsOnTypeChange = (details: PriceDetail[]): PriceDetail[] =>
        details.map(d => ({
            ...d,
            profitBkk: null,
            profitProvince: null,
            salePriceBkk: null,
            wholeSalePriceBkk: null,
            salePriceProvince: null,
            wholeSalePriceProvince: null,
        }));


    const normalizeDetailsForType = (type: string, details: PriceDetail[]) => {
        const isMonk = type === 'ราคาดอกไม้ไหว้พระ';
        return details.map(d => ({
            ...d,
            profitBkk: isMonk ? (d.profitBkk ?? null) : null,
            wholeSalePriceBkk: isMonk ? null : (d.wholeSalePriceBkk ?? null),
        }));
    };

    return (
        <Page>
            <PageTitle title={t('productManagement.priceList.title')} />
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
                        className="btn-indigo-blue"
                        onClick={() => setShowInfo((prev) => !prev)}
                        startIcon={<Info />}>
                        วิธีกรอกข้อมูล
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
                        className="btn-emerald-green"
                        onClick={() => {
                            setActionType('submit');
                            setTitle(t('productManagement.priceList.createNewListTitle'));
                            setMsg(t('productManagement.priceList.createNewListMsg'));
                            setVisibleConfirmationDialog(true);
                        }}
                        startIcon={<Save />}>
                        {t('button.create')}
                    </Button>
                </Stack>
            </Wrapper>
            <Wrapper>
                <GridSearchSection container spacing={1}>
                    <Grid item xs={12} sm={2}>
                        <Autocomplete
                            disabled={isFetching}
                            options={typeList?.map((t) => t.nameTh) ?? []}
                            value={formik.values.type || null}               // ✅ type เป็น string
                            onChange={(_e, value, reason) => {
                                const nextType = reason === 'clear' ? '' : (value ?? '');
                                formik.setFieldValue('type', nextType);
                                formik.setFieldValue('name', nextType);

                                // ปรับ details ให้เข้ากับ type ใหม่ทันที
                                const normalized = normalizeDetailsForType(nextType, formik.values.details);
                                formik.setFieldValue('details', normalized);
                                const reset = resetDetailsOnTypeChange(formik.values.details);
                                formik.setFieldValue('details', reset, false);
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    required
                                    label={t('productManagement.priceList.column.type')}
                                    InputLabelProps={{ shrink: true }}
                                    error={Boolean(formik.touched.type && formik.errors.type)}
                                    helperText={formik.touched.type && formik.errors.type}
                                />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
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
                </GridSearchSection>
                <Grid container>
                    <Grid item xs={12} sm={6}>
                        <Collapse in={showInfo} timeout="auto" unmountOnExit>
                            <Box
                                sx={{
                                    p: 2,
                                    mb: 2,
                                    borderRadius: 2,
                                    border: "1px solid #90caf9",
                                    backgroundColor: "#e3f2fd"
                                }}
                            >
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    {t('productManagement.priceList.howTo.title')}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    {t('productManagement.priceList.howTo.line1')}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    {t('productManagement.priceList.howTo.line2')}
                                </Typography>
                                <br />
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                    ราคาดอกไม้เชียงใหม่
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    {t('productManagement.priceList.howTo.line3')}
                                </Typography>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                    ราคาดอกไม้ไหว้พระ
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    {t('productManagement.priceList.howTo.line4')}
                                </Typography>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                    ราคาดอกไม้นำเข้า / ราคาใบไม้
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    {t('productManagement.priceList.howTo.line5')}
                                </Typography>
                            </Box>
                        </Collapse>
                    </Grid>
                </Grid>
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
                            className="btn-indigo-blue"
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
                            className="btn-slate-grey"
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
                                render={({ remove }) => (
                                    <>
                                        {formik.values.details.map((p, idx) => {
                                            const touched = (formik.touched.details?.[idx] as any) || {};
                                            const errors = (formik.errors.details?.[idx] as any) || {};

                                            return (
                                                <Grid item xs={12} key={`${p.id}-${formik.values.type}`}> {/* 👈 re-mount เมื่อ type เปลี่ยน */}
                                                    <Grid container spacing={1} alignItems="center">
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
                                                                <GridTextField item xs={12} sm={0.5} style={{ textAlign: 'right' }}>
                                                                    <IconButton onClick={() => remove(idx)} aria-label="remove">
                                                                        <Delete />
                                                                    </IconButton>
                                                                </GridTextField>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {/* ชื่อสินค้า */}
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

                                                                {/* เงื่อนไขสลับช่อง */}
                                                                {formik.values.type === 'ราคาดอกไม้ไหว้พระ' ? (
                                                                    <>
                                                                        {/* ต้นทุน */}
                                                                        <GridTextField item xs={12} sm={1}>
                                                                            <NumberTextField
                                                                                required
                                                                                label={t('productManagement.priceList.column.cost')}
                                                                                value={p.cost ?? null}
                                                                                min={1}
                                                                                max={9999}
                                                                                InputLabelProps={{ shrink: true }}
                                                                                onChange={(val) => formik.setFieldValue(`details[${idx}].cost`, val)}
                                                                                onBlur={() => formik.setFieldTouched(`details[${idx}].cost`, true)}
                                                                                fullWidth
                                                                                error={Boolean(touched?.cost && errors?.cost)}
                                                                                helperText={touched?.cost && errors?.cost}
                                                                                sx={{ '& input': { textAlign: 'center' } }}
                                                                            />
                                                                        </GridTextField>

                                                                        <GridTextField item xs={12} sm={1}>
                                                                            <NumberTextField
                                                                                key={`profit-${idx}-${formik.values.type}`}
                                                                                label={t('productManagement.priceList.column.profitBkk')}
                                                                                value={p.profitBkk ?? null}
                                                                                min={1}
                                                                                max={9999}
                                                                                InputLabelProps={{ shrink: true }}
                                                                                InputProps={{
                                                                                    startAdornment:
                                                                                        p.profitBkk ? (
                                                                                            <InputAdornment position="start">
                                                                                                <strong>+</strong>
                                                                                            </InputAdornment>
                                                                                        ) : null
                                                                                }}
                                                                                onChange={(val) => formik.setFieldValue(`details[${idx}].profitBkk`, val)}
                                                                                onBlur={() => formik.setFieldTouched(`details[${idx}].profitBkk`, true)}
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
                                                                                onChange={(val) => formik.setFieldValue(`details[${idx}].profitProvince`, val)}
                                                                                onBlur={() => formik.setFieldTouched(`details[${idx}].profitProvince`, true)}
                                                                                fullWidth
                                                                                sx={{ '& input': { textAlign: 'center' } }}
                                                                            />
                                                                        </GridTextField>
                                                                    </>
                                                                ) : formik.values.type === 'ราคาดอกไม้เชียงใหม่' ? (
                                                                    <>
                                                                        <GridTextField item xs={12} sm={1}>
                                                                            <NumberTextField
                                                                                key={`wholesale-${idx}-${formik.values.type}`}
                                                                                label={t('productManagement.priceList.column.salePriceBkk')}
                                                                                value={p.salePriceBkk ?? null}
                                                                                min={1}
                                                                                max={9999}
                                                                                InputLabelProps={{ shrink: true }}
                                                                                onChange={(val) => formik.setFieldValue(`details[${idx}].salePriceBkk`, val)}
                                                                                onBlur={() => formik.setFieldTouched(`details[${idx}].salePriceBkk`, true)}
                                                                                fullWidth
                                                                                sx={{ '& input': { textAlign: 'center' } }}
                                                                            />
                                                                        </GridTextField>
                                                                        <GridTextField item xs={12} sm={1}>
                                                                            <NumberTextField
                                                                                key={`wholesale-${idx}-${formik.values.type}`}
                                                                                label={t('productManagement.priceList.column.salePriceProvince')}
                                                                                value={p.salePriceProvince ?? null}
                                                                                min={1}
                                                                                max={9999}
                                                                                InputLabelProps={{ shrink: true }}
                                                                                onChange={(val) => formik.setFieldValue(`details[${idx}].salePriceProvince`, val)}
                                                                                onBlur={() => formik.setFieldTouched(`details[${idx}].salePriceProvince`, true)}
                                                                                fullWidth
                                                                                sx={{ '& input': { textAlign: 'center' } }}
                                                                            />
                                                                        </GridTextField>
                                                                    </>
                                                                ) : formik.values.type === 'ราคาใบไม้ VIP' ? (
                                                                    <>
                                                                        <GridTextField item xs={12} sm={1}>
                                                                            <NumberTextField
                                                                                key={`salePrice-${idx}-${formik.values.type}`}
                                                                                label={t('productManagement.priceList.column.salePrice')}
                                                                                value={p.salePriceBkk ?? null}
                                                                                min={1}
                                                                                max={9999}
                                                                                InputLabelProps={{ shrink: true }}
                                                                                onChange={(val) => formik.setFieldValue(`details[${idx}].salePrice`, val)}
                                                                                onBlur={() => formik.setFieldTouched(`details[${idx}].salePrice`, true)}
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
                                                                                onChange={(val) => formik.setFieldValue(`details[${idx}].wholeSalePrice`, val)}
                                                                                onBlur={() => formik.setFieldTouched(`details[${idx}].wholeSalePrice`, true)}
                                                                                fullWidth
                                                                                sx={{ '& input': { textAlign: 'center' } }}
                                                                            />
                                                                        </GridTextField>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <GridTextField item xs={12} sm={1}>
                                                                            <NumberTextField
                                                                                key={`salePrice-${idx}-${formik.values.type}`}
                                                                                label={t('productManagement.priceList.column.salePriceBkk')}
                                                                                value={p.salePriceBkk ?? null}
                                                                                min={1}
                                                                                max={9999}
                                                                                InputLabelProps={{ shrink: true }}
                                                                                onChange={(val) => formik.setFieldValue(`details[${idx}].salePriceBkk`, val)}
                                                                                onBlur={() => formik.setFieldTouched(`details[${idx}].salePriceBkk`, true)}
                                                                                fullWidth
                                                                                sx={{ '& input': { textAlign: 'center' } }}
                                                                            />
                                                                        </GridTextField>
                                                                        <GridTextField item xs={12} sm={1}>
                                                                            <NumberTextField
                                                                                key={`wholesale-${idx}-${formik.values.type}`}
                                                                                label={t('productManagement.priceList.column.wholeSalePriceBkk')}
                                                                                value={p.wholeSalePriceBkk ?? null}
                                                                                min={1}
                                                                                max={9999}
                                                                                InputLabelProps={{ shrink: true }}
                                                                                onChange={(val) => formik.setFieldValue(`details[${idx}].wholeSalePriceBkk`, val)}
                                                                                onBlur={() => formik.setFieldTouched(`details[${idx}].wholeSalePriceBkk`, true)}
                                                                                fullWidth
                                                                                sx={{ '& input': { textAlign: 'center' } }}
                                                                            />
                                                                        </GridTextField>
                                                                        <GridTextField item xs={12} sm={1}>
                                                                            <NumberTextField
                                                                                key={`salePrice-${idx}-${formik.values.type}`}
                                                                                label={t('productManagement.priceList.column.salePriceProvince')}
                                                                                value={p.salePriceProvince ?? null}
                                                                                min={1}
                                                                                max={9999}
                                                                                InputLabelProps={{ shrink: true }}
                                                                                onChange={(val) => formik.setFieldValue(`details[${idx}].salePriceProvince`, val)}
                                                                                onBlur={() => formik.setFieldTouched(`details[${idx}].salePriceProvince`, true)}
                                                                                fullWidth
                                                                                sx={{ '& input': { textAlign: 'center' } }}
                                                                            />
                                                                        </GridTextField>
                                                                        <GridTextField item xs={12} sm={1}>
                                                                            <NumberTextField
                                                                                key={`wholesale-${idx}-${formik.values.type}`}
                                                                                label={t('productManagement.priceList.column.wholeSalePriceProvince')}
                                                                                value={p.wholeSalePriceProvince ?? null}
                                                                                min={1}
                                                                                max={9999}
                                                                                InputLabelProps={{ shrink: true }}
                                                                                onChange={(val) => formik.setFieldValue(`details[${idx}].wholeSalePriceProvince`, val)}
                                                                                onBlur={() => formik.setFieldTouched(`details[${idx}].wholeSalePriceProvince`, true)}
                                                                                fullWidth
                                                                                sx={{ '& input': { textAlign: 'center' } }}
                                                                            />
                                                                        </GridTextField>
                                                                    </>
                                                                )}

                                                                {/* ลบแถว */}
                                                                <GridTextField item xs={12} sm={0.5} style={{ textAlign: 'right' }}>
                                                                    <IconButton onClick={() => remove(idx)} aria-label="remove">
                                                                        <Delete />
                                                                    </IconButton>
                                                                </GridTextField>
                                                            </>
                                                        )}
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
                        className="btn-emerald-green"
                        onClick={() => {
                            setActionType('submit');
                            setTitle(t('productManagement.priceList.createNewListTitle'));
                            setMsg(t('productManagement.priceList.createNewListMsg'));
                            setVisibleConfirmationDialog(true);
                        }}
                        startIcon={<Save />}>
                        {t('button.create')}
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
        </Page >
    )
}
