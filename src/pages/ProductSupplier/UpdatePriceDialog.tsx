/* eslint-disable prettier/prettier */
import { Close, Save } from '@mui/icons-material';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Grid,
    Button,
    DialogActions,
    TextField
} from '@mui/material';
import ConfirmDialog from 'components/ConfirmDialog';
import { GridTextField } from 'components/Styled';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProductSupplier, UpdateProductSupplierPrice } from 'services/Product/product-type';
import { Supplier } from 'services/Supplier/supplier-type';
import toast from 'react-hot-toast';
import { updateProductSupplierPrice } from 'services/Product/product-api';

export interface UpdatePriceDialogProps {
    open: boolean;
    productSupplier: ProductSupplier | undefined;
    supplier: Supplier | undefined;
    onClose: () => void;
}

export default function UpdatePriceDialog(props: UpdatePriceDialogProps): JSX.Element {
    const { open, productSupplier, supplier, onClose } = props;
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
    const [title, setTitle] = useState<string>('')
    const [msg, setMsg] = useState<string>('')
    const [action, setAction] = useState<string>('')
    const { t } = useTranslation();

    const formik = useFormik({
        initialValues: {
            productSku: productSupplier?.product.productSku,
            price: productSupplier?.suppliers.find(sup => sup.supplier.supplierId === supplier?.supplierId)?.price,
            supplier: supplier,
        },
        validationSchema: Yup.object().shape({
            price: Yup.number().min(1).required(t('productManagement.productSupplier.validateSalePriceMsg'))
        }),
        enableReinitialize: true,
        onSubmit: (values, actions) => {
            actions.setSubmitting(true);
            const req: UpdateProductSupplierPrice = {
                salePrice: Number(values.price)
            }
            toast.promise(updateProductSupplierPrice(values.productSku, values.supplier?.supplierId, req), {
                loading: t('toast.loading'),
                success: () => {
                    actions.resetForm();
                    onClose();
                    return t('toast.success');
                },
                error: () => {
                    return t('toast.failed');
                }
            })
        }
    });

    return (
        <Dialog open={open} maxWidth="xs" fullWidth aria-labelledby="form-dialog-title" >
            <DialogTitle id="form-dialog-title">{t('productManagement.productSupplier.updateSupplierPrice')}</DialogTitle>
            <DialogContent>
                <br />
                <Grid container spacing={1}>
                    <GridTextField item xs={12} sm={12}>
                        <TextField
                            fullWidth
                            label={t('productManagement.productSupplier.product')}
                            value={productSupplier?.product.productSku + ' : ' + productSupplier?.product.productName}
                            type="text"
                            InputLabelProps={{ shrink: true }}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={12}>
                        <TextField
                            fullWidth
                            label={t('productManagement.productSupplier.column.supplier')}
                            value={supplier?.phoneContactName}
                            type="text"
                            InputLabelProps={{ shrink: true }}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={12}>
                        <TextField
                            fullWidth
                            label={t('productManagement.productSupplier.column.price')}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1,
                            }}
                            type="number"
                            value={formik.values.price}
                            onChange={({ target }) => formik.setFieldValue('price', target.value)}
                            sx={{
                                // For Chrome, Safari, Edge, Opera
                                '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                                    display: 'none'
                                },
                                // For Firefox
                                '& input[type=number]': {
                                    MozAppearance: 'textfield'
                                }
                            }}
                            error={Boolean(
                                formik.touched.price && formik.errors.price
                            )}
                            helperText={
                                formik.touched.price && formik.errors.price
                            }
                        />
                    </GridTextField>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        setTitle(t('message.confirmCloseTitle'));
                        setMsg(t('message.confirmCloseMsg'));
                        setAction('CLOSE');
                        setVisibleConfirmationDialog(true);
                    }}
                    variant="contained"
                    startIcon={<Close />}
                    className="btn-cool-grey">
                    {t('button.close')}
                </Button>
                <Button
                    className="btn-emerald-green"
                    variant="contained"
                    startIcon={<Save />}
                    onClick={() => {
                        setTitle(t('productManagement.productSupplier.confirmUpdatePriceTitle'));
                        setMsg(t('productManagement.productSupplier.confirmUpdatePriceMsg', { product: productSupplier?.product.productName }));
                        setAction('SUBMIT');
                        setVisibleConfirmationDialog(true);
                    }}
                >
                    {t('button.save')}
                </Button>
            </DialogActions>
            <ConfirmDialog
                open={visibleConfirmationDialog}
                title={title}
                message={msg}
                confirmText={t('button.confirm')}
                cancelText={t('button.cancel')}
                onConfirm={() => {
                    if (action === 'SUBMIT') {
                        formik.handleSubmit();
                    } else if (action === 'CLOSE') {
                        onClose();
                    }
                    setVisibleConfirmationDialog(false);
                }}
                onCancel={() => setVisibleConfirmationDialog(false)}
                isShowCancelButton={true}
                isShowConfirmButton={true}
            />
        </Dialog>
    )
}