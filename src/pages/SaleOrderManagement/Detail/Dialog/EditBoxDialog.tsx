/* eslint-disable no-unused-vars */
/* eslint-disable prettier/prettier */
import { CheckBox, CheckBoxOutlineBlank, Close, Restore, Save } from '@mui/icons-material';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, TextField } from '@mui/material';
import ConfirmDialog from 'components/ConfirmDialog';
import { GridTextField } from 'components/Styled';
import { useFormik } from 'formik';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { updateSaleOrderPackage } from 'services/SaleOrder/sale-order-api';
import { OrderPackage } from 'services/SaleOrder/sale-order-type';
import styled from 'styled-components';

export interface EditBoxDialogProps {
    open: boolean;
    poId: string | undefined;
    orderPackage: OrderPackage | undefined;
    onClose: (value: OrderPackage | null, val: boolean | false) => void;
}

const NoArrowTextField = styled(TextField)({
    '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
        display: 'none',
    },
    '& input[type=number]': {
        MozAppearance: 'textfield',
    },
});

export default function EditBoxDialog(props: EditBoxDialogProps): JSX.Element {
    const { open, poId, orderPackage, onClose } = props;
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
    const { t } = useTranslation();
    const [title, setTitle] = useState<string>('')
    const [msg, setMsg] = useState<string>('')
    const [action, setAction] = useState<string>('')
    const formik = useFormik({
        initialValues: {
            poId: poId,
            bigBox: orderPackage?.bigBox,
            smallBox: orderPackage?.smallBox,
            softBox: orderPackage?.softBox,
            phalanBox: orderPackage?.phalanBox,
            bigFoamBox: orderPackage?.bigFoamBox,
            smallFoamBox: orderPackage?.smallFoamBox,
            wrap: orderPackage?.wrap,
            oasis: orderPackage?.oasis,
            bag: orderPackage?.bag,
            other: orderPackage?.other
        },
        enableReinitialize: true,
        onSubmit: async (values, actions) => {
            actions.setSubmitting(true);
            const orderPackage: OrderPackage = {
                bigBox: values.bigBox,
                smallBox: values.smallBox,
                softBox: values.softBox,
                phalanBox: values.phalanBox,
                bigFoamBox: values.bigFoamBox,
                smallFoamBox: values.smallFoamBox,
                wrap: values.wrap,
                oasis: values.oasis,
                bag: values.bag,
                other: values.other,
                packedStaff: []
            };
            toast.promise(updateSaleOrderPackage(values.poId, orderPackage), {
                loading: t('toast.loading'),
                success: () => {
                    return t('toast.success');
                },
                error: () => {
                    return t('toast.failed');
                }
            });
            onClose(orderPackage, true);
        }
    });
    useEffect(() => {
        resetAllValue()
    }, []);


    const icon = <CheckBoxOutlineBlank fontSize="small" />;
    const checkedIcon = <CheckBox fontSize="small" />;
    const resetAllValue = () => {
        formik.setFieldValue('poId', poId);
        formik.setFieldValue('bigBox', orderPackage?.bigBox);
        formik.setFieldValue('smallBox', orderPackage?.smallBox);
        formik.setFieldValue('softBox', orderPackage?.softBox);
        formik.setFieldValue('phalanBox', orderPackage?.phalanBox);
        formik.setFieldValue('bigFoamBox', orderPackage?.bigFoamBox);
        formik.setFieldValue('smallFoamBox', orderPackage?.smallFoamBox);
        formik.setFieldValue('wrap', orderPackage?.wrap);
        formik.setFieldValue('oasis', orderPackage?.oasis);
        formik.setFieldValue('bag', orderPackage?.bag);
        formik.setFieldValue('other', orderPackage?.other);
    }
    return (
        <Dialog open={open} maxWidth="xs" fullWidth aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">{t('purchaseOrder.updateBoxSection.title') + ' : ' + poId}</DialogTitle>
            <DialogContent>
                <Grid container spacing={1} style={{ paddingTop: '10px' }}>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.bigBox')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.bigBox === 0 ? '' : formik.values.bigBox}
                            onChange={({ target }) => {
                                const val = target.value === '' ? 0 : Number(target.value);
                                formik.setFieldValue('bigBox', val);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.smallBox')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.smallBox === 0 ? '' : formik.values.smallBox}
                            onChange={({ target }) => {
                                const val = target.value === '' ? 0 : Number(target.value);
                                formik.setFieldValue('smallBox', val);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.phalanBox')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.phalanBox === 0 ? '' : formik.values.phalanBox}
                            onChange={({ target }) => {
                                const val = target.value === '' ? 0 : Number(target.value);
                                formik.setFieldValue('phalanBox', val);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.bigFoamBox')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.bigFoamBox === 0 ? '' : formik.values.bigFoamBox}
                            onChange={({ target }) => {
                                const val = target.value === '' ? 0 : Number(target.value);
                                formik.setFieldValue('bigFoamBox', val);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.smallFoamBox')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.smallFoamBox === 0 ? '' : formik.values.smallFoamBox}
                            onChange={({ target }) => {
                                const val = target.value === '' ? 0 : Number(target.value);
                                formik.setFieldValue('smallFoamBox', val);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.softBox')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.softBox === 0 ? '' : formik.values.softBox}
                            onChange={({ target }) => {
                                const val = target.value === '' ? 0 : Number(target.value);
                                formik.setFieldValue('softBox', val);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.wrap')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.wrap === 0 ? '' : formik.values.wrap}
                            onChange={({ target }) => {
                                const val = target.value === '' ? 0 : Number(target.value);
                                formik.setFieldValue('wrap', val);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.bag')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.bag === 0 ? '' : formik.values.bag}
                            onChange={({ target }) => {
                                const val = target.value === '' ? 0 : Number(target.value);
                                formik.setFieldValue('bag', val);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={4} />
                    <GridTextField item xs={12} sm={12}>
                        <TextField
                            type="text"
                            label={t('purchaseOrder.updateBoxSection.other')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.other === 0 ? '' : formik.values.other}
                            onChange={({ target }) => {
                                formik.setFieldValue('other', target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                        />
                    </GridTextField>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        setTitle(t('message.clearDataTitle'));
                        setMsg(t('message.clearDataMsg'));
                        setAction('CLEAR')
                        setVisibleConfirmationDialog(true);
                    }}
                    variant="contained"
                    startIcon={<Restore />}
                    className="btn-amber-orange">
                    {t('button.clear')}
                </Button>
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
                        setTitle(t('message.confirmUpdateTitle') + ' ' + poId);
                        setMsg(t('message.confirmUpdateMsg'));
                        setAction('UPDATE')
                        setVisibleConfirmationDialog(true);
                    }}>
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
                    if (action === 'UPDATE') {
                        formik.handleSubmit();
                    } else if (action === 'CLOSE') {
                        resetAllValue()
                        onClose(orderPackage, false);
                    } else if (action === 'CLEAR') {
                        resetAllValue()
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
