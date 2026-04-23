/* eslint-disable prettier/prettier */
import { Close, Save } from '@mui/icons-material';
import { Dialog, DialogTitle, DialogContent, Grid, Button, DialogActions, TextField } from '@mui/material';
import ConfirmDialog from 'components/ConfirmDialog';
import { GridTextField } from 'components/Styled';
import * as Yup from 'yup';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Customer, UpdateCustomerRequest } from 'services/Customer/customer-type';
import { useFormik } from 'formik';
import toast from 'react-hot-toast';
import { updateCustomer } from 'services/Customer/customer-api';

export interface EditCustomerDialogProps {
    open: boolean;
    customer: Customer | undefined;
    onClose: (val: Customer) => void;
}

export default function EditCustomerDialog(props: EditCustomerDialogProps): JSX.Element {
    const { open, customer, onClose } = props;
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
    const { t } = useTranslation();
    const formik = useFormik({
        initialValues: {
            customerId: customer?.customerId,
            customerName: customer?.customerName,
            contactNumber: customer?.contactNumber
        },
        enableReinitialize: true,
        validationSchema: Yup.object().shape({
            customerName: Yup.string().max(255).required(t('warning.required')),
            contactNumber: Yup.string().max(255).required(t('warning.required')),
        }),
        onSubmit: (values, actions) => {
            actions.setSubmitting(true);
            const updateCustomerObj: UpdateCustomerRequest = {
                customerName: values.customerName,
                contactNumber: values.contactNumber
            }
            const cust: Customer = {
                customerId: values.customerId,
                customerName: values.customerName,
                contactNumber: values.contactNumber
            };
            toast.promise(updateCustomer(values.customerId, updateCustomerObj), {
                loading: t('toast.loading'),
                success: () => {
                    onClose(cust);
                    actions.resetForm();
                    return t('customerManagement.updateCustomerSuccess')
                },
                error: (err) => {
                    return t('customerManagement.updateCustomerFailed') + err;
                }
            });
        }
    })

    return (
        <Dialog open={open} fullWidth aria-labelledby="form-dialog-title" >
            <DialogTitle id="form-dialog-title">{t('customerManagement.updateCustomer') + ' : ' + formik.values.customerId}</DialogTitle>
            <DialogContent>
                <br />
                <Grid container spacing={3}>
                    <GridTextField item xs={12} sm={12}>
                        <TextField
                            type="text"
                            label={t('purchaseOrder.customerInformationSection.fields.labels.customerName') + '*'}
                            fullWidth
                            value={formik.values.customerName}
                            onChange={({ target }) => {
                                formik.setFieldValue('customerName', target.value);
                            }}
                            variant="outlined"
                            error={Boolean(formik.touched.customerName && formik.errors.customerName)}
                            helperText={formik.touched.customerName && formik.errors.customerName}
                            InputLabelProps={{ shrink: true }}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={12}>
                        <TextField
                            type="text"
                            label={t('purchaseOrder.customerInformationSection.fields.labels.contactNumber') + '*'}
                            fullWidth
                            value={formik.values.contactNumber}
                            onChange={({ target }) => {
                                formik.setFieldValue('contactNumber', target.value);
                            }}
                            variant="outlined"
                            error={Boolean(formik.touched.contactNumber && formik.errors.contactNumber)}
                            helperText={formik.touched.contactNumber && formik.errors.contactNumber}
                            InputLabelProps={{ shrink: true }}
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
                    {t('button.save')}
                </Button>
            </DialogActions>
            <ConfirmDialog
                open={visibleConfirmationDialog}
                title={t('customerManagement.updateCustomer')}
                message={t('customerManagement.confirmMsgUpdateCustomer')}
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
