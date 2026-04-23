/* eslint-disable prettier/prettier */
import { Close, Save, Add, Delete } from '@mui/icons-material';
import {
    Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle,
    Grid, TextField, IconButton, Stack, Tooltip,
    Typography
} from '@mui/material';
import { useFormik, FieldArray, FormikProvider } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { searchProduct } from 'services/Product/product-api';
import { ProductDto } from 'services/Product/product-type';
import { useQuery } from 'react-query';
import { createSaleOrderLine } from 'services/SaleOrder/sale-order-api';
import ConfirmDialog from 'components/ConfirmDialog';
import LoadingDialog from 'components/LoadingDialog';
import { useState } from 'react';
import NumberTextField from 'components/NumberTextField';
import { createPurchaseOrderLine } from 'services/PurchaseOrder/purchase-order-api';
import { CreatePurchaseOrderLineListRequest } from 'services/PurchaseOrder/purchase-order-type';

type LineForm = { item: ProductDto | null; qty: number | null; remark: string };
const makeEmptyLine = (): LineForm => ({ item: null, qty: null, remark: '' });

export interface AddNewLineDialogProps {
    open: boolean;
    poId?: string;
    onClose: (isSuccess: boolean) => void;
}

function useProducts() {
    return useQuery({
        queryKey: ['products', 'all'],
        queryFn: () =>
            searchProduct({
                nameContain: '', skuContain: '', categoryEqual: '', groupEqual: '', subGroupEqual: '', parentSkuEqual: '', isIncludeParentSku: false,
                categoryIn: [],
                groupIn: [],
                subGroupIn: []
            }, 1, 3000)
                .then(res => res.data.products),
        staleTime: 10 * 60 * 1000,
        cacheTime: 60 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
        keepPreviousData: true,
    });
}

export default function AddNewLineDialog({ open, poId, onClose }: AddNewLineDialogProps) {
    const { t } = useTranslation();
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
    const [title, setTitle] = useState<string>('')
    const [msg, setMsg] = useState<string>('')
    const [action, setAction] = useState<string>('')
    const { data: productList = [], isFetching } = useProducts();

    // ✅ Validation: อย่างน้อย 1 แถว + แต่ละแถวต้องมี item และ qty 1..999 + SKU ไม่ซ้ำกัน
    const schema = Yup.object({
        lines: Yup.array()
            .min(1, t('warning.required'))
            .of(
                Yup.object({
                    item: Yup.object().nullable().required(t('warning.required')),
                    qty: Yup.number()
                        .typeError(t('warning.required'))
                        .required(t('warning.required'))
                        .min(1, t('warning.moreThanZero'))
                        .max(999, t('warning.reachMaxLimit', { limit: 999 })),
                    remark: Yup.string().nullable().default('')
                })
            )
            .test('unique-sku', t('purchaseOrder.warningDuplicateItem'), (lines?: LineForm[]) => {
                if (!lines) return false;
                const skus = lines
                    .map(l => l.item?.productSku)
                    .filter(Boolean) as string[];
                return new Set(skus).size === skus.length;
            }),
    });

    const formik = useFormik({
        initialValues: {
            lines: [makeEmptyLine()], // เริ่มด้วย 1 แถว
        },
        validationSchema: schema,
        enableReinitialize: false,
        onSubmit: async (values) => {
            if (!poId) return;

            const payload = values.lines
                .filter(l => l.item && l.qty) // กัน null
                .map(l => ({
                    productSku: l.item!.productSku,
                    orderQty: l.qty!,
                }));

            if (payload.length === 0) return;

            const req: CreatePurchaseOrderLineListRequest = {
                lines: payload
            }
            await toast.promise(
                createPurchaseOrderLine(poId, req),
                {
                    loading: t('toast.loading'),
                    success: () => {
                        formik.resetForm({ values: { lines: [makeEmptyLine()] } });
                        onClose(true);
                        return t('toast.success');
                    },
                    error: (err: any) => (err?.response?.data?.message ?? err?.message ?? t('toast.failed')),
                }
            );
        },
    });

    // ————————————————— UI —————————————————
    return (
        <Dialog open={open} maxWidth="sm" fullWidth aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">
                {t('purchaseOrder.addItem')}
            </DialogTitle>
            <FormikProvider value={formik}>
                {/* ถ้าจะใช้ submit ผ่าน form */}
                <form onSubmit={formik.handleSubmit}>
                    <DialogContent>
                        <FieldArray
                            name="lines"
                            render={({ push, remove }) => (
                                <Stack spacing={2}>
                                    {formik.values.lines.map((line, idx) => {
                                        const itemErr = (formik.touched.lines?.[idx] as any)?.item && (formik.errors.lines?.[idx] as any)?.item;
                                        const qtyErr = (formik.touched.lines?.[idx] as any)?.qty && (formik.errors.lines?.[idx] as any)?.qty;

                                        return (
                                            <Grid
                                                key={idx}
                                                container
                                                columnSpacing={1}
                                                alignItems="flex-start"           // ← จัดให้ทุกคอลัมน์ชิดบน
                                                sx={{ pt: 1.5 }}                  // ระยะห่างบนระหว่างแถว (แทน inline style)
                                            >
                                                {/* สินค้า */}
                                                <Grid item xs={12} sm={8}>
                                                    <Autocomplete
                                                        options={productList}
                                                        value={line.item}
                                                        isOptionEqualToValue={(o, v) => o.productSku === v.productSku}
                                                        getOptionLabel={(p) => p?.productNameTh ?? ''}
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
                                                        onChange={(_, v, reason) =>
                                                            formik.setFieldValue(`lines[${idx}].item`, reason === 'clear' ? null : v)
                                                        }
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                label={t('purchaseOrder.productSection.fields.labels.name')}
                                                                InputLabelProps={{ shrink: true }}
                                                                error={Boolean(itemErr)}
                                                                helperText={itemErr || ' '}           // ← เว้นช่องว่างไว้แม้ไม่มี error
                                                                sx={{
                                                                    '& .MuiFormHelperText-root': {
                                                                        minHeight: 22,                    // ← ความสูง helper เท่ากันทุกช่อง
                                                                    },
                                                                }}
                                                            />
                                                        )}
                                                    />
                                                </Grid>

                                                {/* จำนวน */}
                                                <Grid item xs={3} sm={3}>
                                                    <NumberTextField
                                                        fullWidth
                                                        label={t('purchaseOrder.addProductSection.fields.labels.amount')}
                                                        value={line.qty ?? null}                  // ใช้ null แทน '' เวลาค่าว่าง
                                                        min={1}
                                                        max={999}
                                                        onChange={(val) => {
                                                            formik.setFieldValue(`lines[${idx}].qty`, val);
                                                        }}
                                                        onBlur={formik.handleBlur}
                                                        name={`lines[${idx}].qty`}
                                                        error={Boolean(qtyErr)}
                                                        helperText={qtyErr || ' '}
                                                        InputLabelProps={{ shrink: true }}
                                                        sx={{
                                                            '& .MuiFormHelperText-root': { minHeight: 22 }, // เว้นระยะเท่ากัน
                                                        }}
                                                    />
                                                </Grid>

                                                {/* ลบแถว */}
                                                <Grid item xs={1} sm={1}
                                                    sx={{ display: 'flex', alignItems: 'flex-start' }}> {/* ← ปุ่มชิดบน */}
                                                    <Tooltip title={t('button.delete') as string}>
                                                        <span>
                                                            <IconButton
                                                                color="error"
                                                                onClick={() => remove(idx)}
                                                                disabled={formik.values.lines.length === 1}
                                                                sx={{ mt: '2px' }}                    // เล็กน้อยให้เสมอ label
                                                            >
                                                                <Delete />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                </Grid>
                                            </Grid>
                                        );
                                    })}
                                </Stack>
                            )}
                        />
                        {typeof formik.errors.lines === 'string' && (
                            <Typography color="error" variant="body2">
                                {formik.errors.lines}
                            </Typography>
                        )}
                    </DialogContent>

                    <DialogActions>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => {
                                // กันซ้ำ SKU: ถ้าต้องการ เติม logic ช่วยได้ เช่น focus row ที่ยังไม่ได้เลือก
                                (formik.setTouched as any)({}); // เคลียร์ error momentarily เพื่อ UX ดีขึ้นตอนเพิ่มแถว
                                formik.setFieldValue('lines', [...formik.values.lines, makeEmptyLine()]);
                            }}
                        >
                            {t('purchaseOrder.addProductSection.addItem')}
                        </Button>
                        <Button
                            onClick={() => {
                                // ยืนยันปิด
                                setTitle(t('message.confirmCloseTitle'));
                                setMsg(t('message.confirmCloseMsg'));
                                setAction('CLOSE');
                                setVisibleConfirmationDialog(true);
                            }}
                            variant="contained"
                            className="btn-cool-grey"
                            startIcon={<Close />}
                        >
                            {t('button.close')}
                        </Button>

                        <Button
                            variant="contained"
                            className="btn-emerald-green"
                            startIcon={<Save />}
                            onClick={() => {
                                setTitle(t('purchaseOrder.confirmAddItemTitle'));
                                setMsg(t('purchaseOrder.confirmAddItemMsg', { item: formik.values.lines.length }));
                                setAction('ADD')
                                setVisibleConfirmationDialog(true);
                            }}
                        >
                            {t('button.save')}
                        </Button>
                    </DialogActions>
                </form>
            </FormikProvider>
            <LoadingDialog open={isFetching} />
            <ConfirmDialog
                open={visibleConfirmationDialog}
                title={title}
                message={msg}
                confirmText={t('button.confirm')}
                cancelText={t('button.cancel')}
                onConfirm={() => {
                    if (action === 'ADD') {
                        formik.handleSubmit();
                    } else if (action === 'CLOSE') {
                        formik.resetForm({ values: { lines: [makeEmptyLine()] } });
                        onClose(false);
                    }
                    setVisibleConfirmationDialog(false);
                }}
                onCancel={() => setVisibleConfirmationDialog(false)}
                isShowCancelButton={true}
                isShowConfirmButton={true}
            />
        </Dialog>
    );
}