/* eslint-disable prettier/prettier */
import { Clear, Close, Save } from '@mui/icons-material';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, TextField, Typography } from '@mui/material';
import ConfirmDialog from 'components/ConfirmDialog';
import NumberTextField from 'components/NumberTextField';
import { GridTextField } from 'components/Styled';
import { useFormik } from 'formik';
import { useState } from 'react';
import { isMobileOnly } from 'react-device-detect';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { updateSaleOrderLineStatus } from 'services/SaleOrder/sale-order-api';
import { SaleOrderLine } from 'services/SaleOrder/sale-order-type';

export interface EditLineDialogProps {
    open: boolean;
    poId?: string | null;
    poLine: SaleOrderLine | undefined;
    onClose: (isSuccess: boolean) => void;
}

export default function EditLineDialog({ open, poId, poLine, onClose }: EditLineDialogProps) {
    const { t } = useTranslation();
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
    const [title, setTitle] = useState<string>('');
    const [msg, setMsg] = useState<string>('');
    const [action, setAction] = useState<string>('');

    const formik = useFormik({
        initialValues: {
            status: poLine?.status,
            detail: '',
            remark: poLine?.remark,
            qty: poLine?.qty,
            newQty: null
        },
        enableReinitialize: true,
        onSubmit: async (values) => {
            if (!poId || !poLine) return;

            let updateObj;
            if (values.newQty === 0) {
                updateObj = {
                    status: 'CANCEL',
                    detail: 'ลูกค้าแจ้งยกเลิกสินค้า',
                    haveQty: 0,
                    salePrice: null,
                    qty: null
                };
            } else {
                updateObj = {
                    status: null,
                    detail: null,
                    haveQty: null,
                    salePrice: null,
                    qty: poLine?.qty,
                    newQty: values.newQty
                };
            }
            await toast.promise(
                updateSaleOrderLineStatus(poId, poLine.id, updateObj),
                {
                    loading: t('toast.loading'),
                    success: () => {
                        onClose(true);
                        return t('toast.success');
                    },
                    error: () => t('toast.failed')
                });
        }
    });

    const functionDeleteItem = async () => {
        if (!poId || !poLine) return;

        const updateObj = {
            status: 'CANCEL',
            detail: 'ลูกค้าแจ้งยกเลิกสินค้า',
            haveQty: null,
            salePrice: null,
            qty: null
        };
        await toast.promise(
            updateSaleOrderLineStatus(poId, poLine.id, updateObj),
            {
                loading: t('toast.loading'),
                success: () => {
                    onClose(true);
                    return t('toast.success');
                },
                error: () => t('toast.failed')
            });
    }

    return (
        <Dialog open={open} maxWidth="sm" fullWidth aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title" sx={{ fontSize: isMobileOnly ? '0.82rem' : 'auto' }}>{t('purchaseOrder.editItem') + ' ' + poLine?.itemName}</DialogTitle>
            <DialogContent>
                <Grid container spacing={1} style={{ paddingTop: '10px' }}>
                    <GridTextField item xs={6} sm={6}>
                        <NumberTextField
                            label={t('purchaseOrder.productSection.fields.labels.qty')}
                            value={poLine?.qty ?? null}   // ถ้า null จะไม่แสดง 0 อัตโนมัติ
                            disabled
                            min={1}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={6}>
                        <NumberTextField
                            required
                            label="จำนวนที่สั่งใหม่"
                            value={formik.values.newQty}
                            InputLabelProps={{ shrink: true }}
                            min={1}
                            max={poLine?.qty}   // ✅ กำหนด max ได้
                            onChange={(val) => {
                                let next = val;
                                if (next !== null && poLine?.qty !== undefined && next > poLine.qty) {
                                    next = poLine.qty; // clamp ไม่ให้เกิน
                                }
                                formik.setFieldValue('newQty', next);
                            }}
                        />
                    </GridTextField>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    className="btn-crimson-red"
                    sx={{
                        fontSize: isMobileOnly ? '0.715rem' : 'auto',
                    }}
                    onClick={() => {
                        setTitle(t('purchaseOrder.confirmDeleteItemTitle'));
                        setMsg(
                            t('purchaseOrder.confirmDeleteItemMsg', {
                                item: poLine?.itemName
                            })
                        );
                        setAction('DELETE_ITEM');
                        setVisibleConfirmationDialog(true);
                    }}
                    startIcon={<Clear />}
                >
                    ลูกค้าแจ้งยกเลิก
                </Button>
                <Button
                    onClick={() => {
                        setTitle(t('message.confirmCloseTitle'));
                        setMsg(t('message.confirmCloseMsg'));
                        setAction('CLOSE');
                        setVisibleConfirmationDialog(true);
                    }}
                    variant="contained"
                    className="btn-cool-grey"
                    startIcon={<Close />}>
                    {t('button.close')}
                </Button>
                <Button
                    variant="contained"
                    className="btn-emerald-green"
                    disabled={
                        formik.values.newQty === null || formik.values.newQty === poLine?.qty
                    }
                    startIcon={<Save />}
                    onClick={() => {
                        setTitle(t('purchaseOrder.confirmEdittemTitle'));
                        setMsg(t('purchaseOrder.confirmEditItemMsg'));
                        setAction('EDIT');
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
                    if (action === 'EDIT') {
                        formik.handleSubmit();
                    } else if (action === 'CLOSE') {
                        formik.resetForm();
                        onClose(false);
                    } else if (action === 'DELETE_ITEM') {
                        functionDeleteItem();
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
