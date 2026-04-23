/* eslint-disable prettier/prettier */
import { Add, ArrowBackIos, Cancel, Delete, Save, UploadFile } from '@mui/icons-material';
import { Button, Grid, Stack, TextField, Typography, useMediaQuery, useTheme, Autocomplete, IconButton, Avatar, Chip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import ConfirmDialog from 'components/ConfirmDialog';
import FileUploader from 'components/FileUploader';
import ImageFileUploaderWrapper from 'components/ImageFileUploaderWrapper';
import PageTitle from 'components/PageTitle';
import { GridTextField, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { resizeFile } from 'utils';
import { FieldArray, FormikProvider, useFormik } from 'formik';
import { debounce } from 'lodash';
import { createProduct, getProductConfig, isSkuCheck } from 'services/Product/product-api';
import { useQuery } from 'react-query';

type ChildProduct = {
    id: string;
    imageFile?: File | null;
    imagePreview?: string | null;
    sku: string;
    nameTh: string;
    nameEn: string;
};

export default function NewProduct() {
    const { t } = useTranslation();
    const theme = useTheme();
    const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
    const history = useHistory();
    const useStyles = makeStyles({});
    const [actionType, setActionType] = useState<string>('');
    const [title, setTitle] = useState<string>('');
    const [msg, setMsg] = useState<string>('');
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
    const [productImageFiles, setProductImageFiles] = useState<File[]>([]);
    const logoImageFileUrls = productImageFiles.map((file) => URL.createObjectURL(file));
    const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});
    const [skuExists, setSkuExists] = useState<boolean | null>(null);
    const {
        data: categoryList,
        isFetching: isCategoryFetching
    } = useQuery('product-categories', () => getProductConfig('CATEGORY'), {
        refetchOnWindowFocus: false
    });
    const {
        data: groupList,
        isFetching: isGroupFetching
    } = useQuery('product-groups', () => getProductConfig('GROUP'), {
        refetchOnWindowFocus: false
    });
    const {
        data: subGroupList,
        isFetching: isSubgroupFetching
    } = useQuery('product-subgroups', () => getProductConfig('SUBGROUP'), {
        refetchOnWindowFocus: false
    });
    const formik = useFormik({
        initialValues: {
            sku: '',
            productNameTh: '',
            productNameEn: '',
            productCategory: '',
            productGroup: '',
            productSubgroup: '',
            keywords: [],
            childProducts: [] as ChildProduct[]
        },
        enableReinitialize: true,
        validationSchema: Yup.object().shape({
            sku: Yup.string().max(12).required(t('productManagement.newProduct.validateMessage.sku'))
                .matches(/^[0-9]+$/, t('productManagement.newProduct.validateMessage.skuNumberOnly')) // ต้องเป็นตัวเลขเท่านั้น
                .length(12, t('productManagement.newProduct.validateMessage.skuLength')),
            productNameTh: Yup.string().max(255).required(t('productManagement.newProduct.validateMessage.nameTh')),
            productNameEn: Yup.string().max(255).required(t('productManagement.newProduct.validateMessage.nameEn')),
            productCategory: Yup.string().required(t('productManagement.newProduct.validateMessage.category')),
            productGroup: Yup.string().required(t('productManagement.newProduct.validateMessage.group')),
            productSubgroup: Yup.string().required(t('productManagement.newProduct.validateMessage.subGroup')),
            keywords: Yup.array()
                .of(Yup.string().trim().max(50))
                .max(20, 'ใส่ได้ไม่เกิน 20 คีย์เวิร์ด'),
            childProducts: Yup.array().of(
                Yup.object().shape({
                    sku: Yup.string().trim().required(t('productManagement.newProduct.validateMessage.sku')),
                    nameTh: Yup.string().trim().required(t('productManagement.newProduct.validateMessage.nameTh')),
                    nameEn: Yup.string().trim().required(t('productManagement.newProduct.validateMessage.nameEn'))
                })
            )
        }),
        onSubmit: async (values, actions) => {
            actions.setSubmitting(true);
            console.log('Values : ', values)
            const formData = new FormData();
            if (productImageFiles[0] !== undefined) {
                const newFile = await resizeFile(productImageFiles[0]);
                formData.append('picture', newFile);
            }
            formData.append('sku', values.sku);
            formData.append('productNameTh', values.productNameTh);
            formData.append('productNameEn', values.productNameEn);
            formData.append('productCategory', values.productCategory);
            formData.append('productGroup', values.productGroup);
            formData.append('productSubgroup', values.productSubgroup);
            formData.append('keywords', values.keywords.join(','));
            values.childProducts.forEach((cp, i) => {
                if (cp.imageFile) formData.append(`childProducts[${i}].picture`, cp.imageFile);
                formData.append(`childProducts[${i}].sku`, cp.sku);
                formData.append(`childProducts[${i}].nameTh`, cp.nameTh);
                formData.append(`childProducts[${i}].nameEn`, cp.nameEn);
            });
            toast.promise(createProduct(formData), {
                loading: t('toast.loading'),
                success: () => {
                    history.push(ROUTE_PATHS.PRODUCT_LIST);
                    return t('productManagement.newProduct.createProductSuccess');
                },
                error: (error) => t('productManagement.newProduct.createProductFailed') + error.message
            });
        }
    });

    const handleClear = () => {
        formik.resetForm();
        setProductImageFiles([]);
    }

    const addChildProduct = (push: (v: any) => void) => {
        push({
            id: crypto.randomUUID(),
            imageFile: null,
            imagePreview: null,
            sku: '',
            nameTh: '',
            nameEn: ''
        });
    };

    const handlePickFile = (id: string) => {
        fileInputsRef.current[id]?.click();
    };

    // set file + preview ใน formik
    const handleFileChange = (
        index: number,
        file?: File | null
    ) => {
        if (!file) {
            formik.setFieldValue(`childProducts[${index}].imageFile`, null);
            formik.setFieldValue(`childProducts[${index}].imagePreview`, null);
        } else {
            const preview = URL.createObjectURL(file);
            formik.setFieldValue(`childProducts[${index}].imageFile`, file);
            formik.setFieldValue(`childProducts[${index}].imagePreview`, preview);
        }
    };

    useEffect(() => {
        const handler = debounce(async () => {
            if (formik.values.sku) {
                const exists = await isSkuCheck(formik.values.sku);
                setSkuExists(exists.isExisting);
                if (exists.isExisting) {
                    formik.setFieldError('sku', 'SKU already exists');
                } else {
                    formik.setFieldError('sku', undefined);
                }
            }
        }, 500); // 0.5s debounce
        handler();
        return () => handler.cancel();
    }, [formik.values.sku]);

    return (
        <Page>
            <PageTitle title={t('productManagement.newProduct.title')} />
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
                        color="success"
                        onClick={() => {
                            setActionType('create');
                            setTitle(t('productManagement.newProduct.createNewProductMsg'));
                            setMsg(t('productManagement.newProduct.confirmCreateNewProductMsg'));
                            setVisibleConfirmationDialog(true);
                        }}
                        startIcon={<Save />}>
                        {t('button.create')}
                    </Button>
                </Stack>
            </Wrapper>
            <Wrapper>
                <Grid container spacing={1}>
                    <GridTextField item xs={12} sm={12}>
                        <Typography>{t('productManagement.newProduct.mainProduct')}</Typography>
                    </GridTextField>
                    <GridTextField item xs={12} sm={12}>
                        <Typography>{t('productManagement.newProduct.image')}</Typography>
                        <ImageFileUploaderWrapper
                            id="logo-uploader-id"
                            inputId="logo-id"
                            isDisabled={false}
                            readOnly={false}
                            maxFiles={1}
                            isMultiple={false}
                            onError={() => { }}
                            onDeleted={() => {
                                setProductImageFiles([]);
                            }}
                            onSuccess={(files) => {
                                setProductImageFiles(files);
                            }}
                            files={logoImageFileUrls}
                            fileUploader={FileUploader}
                            isError={false}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={6}>
                        <TextField
                            type="text"
                            label={t('productManagement.newProduct.sku') + '*'}
                            fullWidth
                            variant="outlined"
                            value={formik.values.sku}
                            onChange={({ target }) => {
                                formik.setFieldValue('sku', target.value);
                            }}
                            error={Boolean(formik.touched.sku && formik.errors.sku)}
                            helperText={
                                formik.errors.sku
                                    ? formik.errors.sku
                                    : skuExists === true
                                        ? '⚠️ This SKU already exists.'
                                        : ''
                            }
                            InputLabelProps={{ shrink: true }}
                        />
                    </GridTextField>

                    <GridTextField item xs={6} sm={6}>
                        <Autocomplete
                            freeSolo
                            disableClearable
                            options={categoryList}
                            value={formik.values.productCategory}
                            onChange={(_event, value, reason) => {
                                if (reason === 'clear') {
                                    formik.setFieldValue('productCategory', '');
                                } else {
                                    formik.setFieldValue('productCategory', value);
                                }
                            }}
                            onInputChange={(_event, value) => {
                                formik.setFieldValue('productCategory', value || '');
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    required
                                    disabled={isCategoryFetching}
                                    label={t('productManagement.newProduct.category')}
                                    slotProps={{
                                        input: {
                                            ...params.InputProps,
                                            type: 'search',
                                        },
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                    error={Boolean(formik.touched.productCategory && formik.errors.productCategory)}
                                    helperText={formik.touched.productCategory && formik.errors.productCategory}
                                />
                            )}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={6}>
                        <TextField
                            type="text"
                            required
                            label={t('productManagement.newProduct.nameTh')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.productNameTh}
                            onChange={({ target }) => {
                                formik.setFieldValue('productNameTh', target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(formik.touched.productNameTh && formik.errors.productNameTh)}
                            helperText={formik.touched.productNameTh && formik.errors.productNameTh}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={6}>
                        <TextField
                            type="text"
                            required
                            label={t('productManagement.newProduct.nameEn')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.productNameEn}
                            onChange={({ target }) => {
                                formik.setFieldValue('productNameEn', target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(formik.touched.productNameEn && formik.errors.productNameEn)}
                            helperText={formik.touched.productNameEn && formik.errors.productNameEn}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={6}>
                        <Autocomplete
                            freeSolo
                            disableClearable
                            options={groupList}
                            value={formik.values.productGroup}
                            onChange={(_event, value, reason) => {
                                if (reason === 'clear') {
                                    formik.setFieldValue('productGroup', '');
                                } else {
                                    formik.setFieldValue('productGroup', value);
                                }
                            }}
                            onInputChange={(_event, value) => {
                                formik.setFieldValue('productGroup', value || '');
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    required
                                    disabled={isGroupFetching}
                                    label={t('productManagement.newProduct.group')}
                                    slotProps={{
                                        input: {
                                            ...params.InputProps,
                                            type: 'search',
                                        },
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                    error={Boolean(formik.touched.productGroup && formik.errors.productGroup)}
                                    helperText={formik.touched.productGroup && formik.errors.productGroup}
                                />
                            )}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={6}>
                        <Autocomplete
                            freeSolo
                            disableClearable
                            options={subGroupList}
                            value={formik.values.productSubgroup}
                            onChange={(_event, value, reason) => {
                                if (reason === 'clear') {
                                    formik.setFieldValue('productSubgroup', '');
                                } else {
                                    formik.setFieldValue('productSubgroup', value);
                                }
                            }}
                            onInputChange={(_event, value) => {
                                formik.setFieldValue('productSubgroup', value || '');
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    required
                                    disabled={isSubgroupFetching}
                                    label={t('productManagement.newProduct.subGroup')}
                                    slotProps={{
                                        input: {
                                            ...params.InputProps,
                                            type: 'search',
                                        },
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                    error={Boolean(formik.touched.productSubgroup && formik.errors.productSubgroup)}
                                    helperText={formik.touched.productSubgroup && formik.errors.productSubgroup}
                                />
                            )}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={12}>
                        <Autocomplete
                            multiple
                            freeSolo
                            options={[]}               // ไม่มีลิสต์ตายตัว ใส่เองได้
                            value={formik.values.keywords || []}
                            onChange={(_e, value) => {
                                // กันค่าซ้ำ/ช่องว่าง
                                const cleaned = Array.from(
                                    new Set(
                                        value
                                            .map(v => (typeof v === 'string' ? v.trim() : ''))
                                            .filter(v => v.length > 0)
                                    )
                                );
                                formik.setFieldValue('keywords', cleaned);
                            }}
                            filterSelectedOptions
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip
                                        variant="outlined"
                                        label={option}
                                        {...getTagProps({ index })}
                                        key={option}
                                        sx={{ mr: 0.5, mb: 0.5 }}
                                    />
                                ))
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t('productManagement.newProduct.keywords')}
                                    placeholder={t('productManagement.newProduct.pressEnterToAdd')}
                                    InputLabelProps={{ shrink: true }}
                                    error={Boolean(formik.touched.keywords && formik.errors.keywords)}
                                    helperText={
                                        (formik.touched.keywords && typeof formik.errors.keywords === 'string'
                                            ? formik.errors.keywords
                                            : '') || t('productManagement.newProduct.enterToCreateTag') /* ข้อความแนะนำ */
                                    }
                                    onKeyDown={(e) => {
                                        // ป้องกัน Enter ส่งฟอร์ม ตอนที่กำลังพิมพ์คีย์เวิร์ด
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                        }
                                    }}
                                />
                            )}
                        />
                    </GridTextField>
                </Grid>
            </Wrapper>
            <FormikProvider value={formik}>
                <Wrapper>
                    <Grid container spacing={1}>
                        <GridTextField item xs={9} sm={9}>
                            <Typography>{t('productManagement.newProduct.childProduct')}</Typography>
                        </GridTextField>
                        <GridTextField item xs={3} sm={3} style={{ textAlign: 'right' }}>
                            <FieldArray
                                name="childProducts"
                                render={({ push }) => (
                                    <Button
                                        fullWidth={isDownSm}
                                        variant="contained"
                                        color="primary"
                                        onClick={() => addChildProduct(push)}
                                        startIcon={<Add />}>
                                        {t('productManagement.newProduct.addChildProduct')}
                                    </Button>
                                )}
                            />
                        </GridTextField>
                        <Grid container spacing={1} sx={{ mt: 1 }}>
                            <FieldArray
                                name="childProducts"
                                render={({ remove }) => (
                                    <>
                                        {formik.values.childProducts.map((p, idx) => {
                                            const touched = (formik.touched.childProducts?.[idx] as any) || {};
                                            const errors = (formik.errors.childProducts?.[idx] as any) || {};
                                            return (
                                                <Grid item xs={12} key={p.id}>
                                                    <Grid container spacing={1} alignItems="center">
                                                        {/* รูปภาพ */}
                                                        <GridTextField item xs={12} sm={3}>
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Avatar
                                                                    variant="rounded"
                                                                    src={p.imagePreview ?? undefined}
                                                                    sx={{ width: 64, height: 64, }}
                                                                />
                                                                <div>
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        hidden
                                                                        ref={(el) => (fileInputsRef.current[p.id] = el)}
                                                                        onChange={(e) => handleFileChange(idx, e.target.files?.[0] ?? null)}
                                                                    />
                                                                    &nbsp;&nbsp;&nbsp;
                                                                    <Button
                                                                        size="small"
                                                                        variant="contained"
                                                                        className="btn-baby-blue"
                                                                        startIcon={<UploadFile />}
                                                                        onClick={() => handlePickFile(p.id)}
                                                                    >
                                                                        {t('productManagement.newProduct.chooseImage')}
                                                                    </Button>
                                                                </div>
                                                            </Stack>
                                                        </GridTextField>

                                                        {/* SKU */}
                                                        <GridTextField item xs={12} sm={3}>
                                                            <TextField
                                                                type="text"
                                                                label={t('productManagement.newProduct.sku')}
                                                                value={p.sku}
                                                                onChange={(e) => formik.setFieldValue(`childProducts[${idx}].sku`, e.target.value)}
                                                                onBlur={() => formik.setFieldTouched(`childProducts[${idx}].sku`, true)}
                                                                fullWidth
                                                                size="small"
                                                                InputLabelProps={{ shrink: true }}
                                                                error={Boolean(touched?.sku && errors?.sku)}
                                                                helperText={touched?.sku && errors?.sku}
                                                            />
                                                        </GridTextField>

                                                        {/* ชื่อไทย */}
                                                        <GridTextField item xs={12} sm={3}>
                                                            <TextField
                                                                label={t('productManagement.newProduct.nameTh')}
                                                                value={p.nameTh}
                                                                onChange={(e) => formik.setFieldValue(`childProducts[${idx}].nameTh`, e.target.value)}
                                                                onBlur={() => formik.setFieldTouched(`childProducts[${idx}].nameTh`, true)}
                                                                fullWidth
                                                                size="small"
                                                                InputLabelProps={{ shrink: true }}
                                                                error={Boolean(touched?.nameTh && errors?.nameTh)}
                                                                helperText={touched?.nameTh && errors?.nameTh}
                                                            />
                                                        </GridTextField>

                                                        {/* ชื่ออังกฤษ */}
                                                        <GridTextField item xs={12} sm={2.5}>
                                                            <TextField
                                                                label={t('productManagement.newProduct.nameEn')}
                                                                value={p.nameEn}
                                                                onChange={(e) => formik.setFieldValue(`childProducts[${idx}].nameEn`, e.target.value)}
                                                                onBlur={() => formik.setFieldTouched(`childProducts[${idx}].nameEn`, true)}
                                                                fullWidth
                                                                size="small"
                                                                InputLabelProps={{ shrink: true }}
                                                                error={Boolean(touched?.nameEn && errors?.nameEn)}
                                                                helperText={touched?.nameEn && errors?.nameEn}
                                                            />
                                                        </GridTextField>

                                                        {/* ลบแถว */}
                                                        <GridTextField item xs={12} sm={0.5} style={{ textAlign: 'right' }}>
                                                            <IconButton onClick={() => remove(idx)} aria-label="remove">
                                                                <Delete />
                                                            </IconButton>
                                                        </GridTextField>
                                                    </Grid>
                                                </Grid>
                                            );
                                        })}
                                    </>
                                )}
                            />
                        </Grid>
                    </Grid>
                </Wrapper>
            </FormikProvider>
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
                        color="success"
                        onClick={() => {
                            setActionType('create');
                            setTitle(t('productManagement.newProduct.createNewProductMsg'));
                            setMsg(t('productManagement.newProduct.confirmCreateNewProductMsg'));
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
                    if (actionType === 'create') {
                        formik.handleSubmit();
                    } else if (actionType === 'clear') {
                        handleClear();
                    } else if (actionType === 'back') {
                        history.push(ROUTE_PATHS.PRODUCT_LIST);
                    }
                    setVisibleConfirmationDialog(false);
                }}
                onCancel={() => {
                    setVisibleConfirmationDialog(false);
                }}
                isShowCancelButton={true}
                isShowConfirmButton={true}
            />
        </Page>
    );
}
