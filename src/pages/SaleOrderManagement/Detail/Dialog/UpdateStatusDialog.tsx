/* eslint-disable prettier/prettier */
import { Restore, Close, Save } from '@mui/icons-material';
import { Dialog, DialogTitle, DialogContent, Grid, Button, DialogActions, TextField, MenuItem } from '@mui/material';
import ConfirmDialog from 'components/ConfirmDialog';
import { GridTextField } from 'components/Styled';
import { useFormik } from 'formik';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { updateSaleOrderLineStatus } from 'services/SaleOrder/sale-order-api';
import { SaleOrderLine, UpdatePOLineRequest } from 'services/SaleOrder/sale-order-type';

export interface UpdateStatusDialogProps {
    open: boolean;
    poId: string | undefined;
    poLine: SaleOrderLine | undefined;
    onClose: () => void;
}
export default function UpdateStatusDialog(props: UpdateStatusDialogProps): JSX.Element {
    const { open, poId, poLine, onClose } = props;
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
    const { t } = useTranslation();
    const formik = useFormik({
        initialValues: {
            poId,
            poLineId: poLine?.id,
            status: poLine?.status,
            statusDetail: poLine?.statusDetail
        },
        onSubmit: async (values, actions) => {
            actions.setSubmitting(true);
            const request = {
                status: values.status,
                detail: values.statusDetail
            } as UpdatePOLineRequest
            toast.promise(updateSaleOrderLineStatus(values.poId, values.poLineId, request), {
                loading: t('toast.loading'),
                success: () => {
                    onClose();
                    return t('toast.success');
                },
                error: () => {
                    return t('toast.failed');
                }
            })
        }
    });
    useEffect(() => {
        resetAllValue();
    }, [poLine]);
    const resetAllValue = () => {
        formik.setFieldValue('poLineId', poLine?.id);
        formik.setFieldValue('status', poLine?.status);
        formik.setFieldValue('statusDetail', poLine?.statusDetail);
        formik.setFieldValue('poId', poId)
    };
    return (
        <Dialog open={open} maxWidth="xs" fullWidth aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">{'อัพเดตสถานะ ' + poLine?.id}</DialogTitle>
            <DialogContent>
                <Grid container spacing={1} style={{ paddingTop: '10px' }}>
                    <GridTextField item xs={12} sm={12}>
                        <TextField
                            select
                            label="สถานะ"
                            fullWidth
                            variant="outlined"
                            value={formik.values.status}
                            onChange={({ target }) => {
                                formik.setFieldValue('status', target.value)
                            }}
                            InputLabelProps={{ shrink: true }}
                        >
                            <MenuItem value="INCOMPLETE">{t('status.saleOrderLine.INCOMPLETE')}</MenuItem>
                            <MenuItem value="CANCEL">{t('status.saleOrderLine.CANCEL')}</MenuItem>
                            <MenuItem value="PROCESSING" disabled>{t('status.saleOrderLine.PROCESSING')}</MenuItem>
                            <MenuItem value="COMPLETE" disabled>{t('status.saleOrderLine.COMPLETE')}</MenuItem>
                        </TextField>
                    </GridTextField>
                    <GridTextField item xs={12} sm={12}>
                        <TextField
                            label="รายละเอียด"
                            fullWidth
                            multiline
                            rows={4}
                            value={formik.values.statusDetail}
                            onChange={({ target }) => {
                                formik.setFieldValue('statusDetail', target.value)
                            }}
                            InputLabelProps={{ shrink: true }}
                        />
                    </GridTextField>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        resetAllValue()
                    }}
                    variant="contained"
                    startIcon={<Restore />}
                    className="btn-amber-orange">
                    {t('button.clear')}
                </Button>
                <Button
                    onClick={() => {
                        resetAllValue()
                        onClose();
                    }}
                    variant="contained"
                    startIcon={<Close />}
                    color="primary">
                    {t('button.close')}
                </Button>
                <Button
                    color="primary"
                    variant="contained"
                    startIcon={<Save />}
                    onClick={() => setVisibleConfirmationDialog(true)}>
                    {t('button.save')}
                </Button>
            </DialogActions>
            <ConfirmDialog
                open={visibleConfirmationDialog}
                title={"อัพเดตสถานะของ " + poLine?.id}
                message="คุณต้องการยืนยันอัพเดตสถานะใช่ไหม"
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
        </Dialog>
    )
}
