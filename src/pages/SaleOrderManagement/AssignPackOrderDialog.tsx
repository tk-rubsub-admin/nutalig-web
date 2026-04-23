/* eslint-disable prettier/prettier */
import { Close, Save } from '@mui/icons-material';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Button,
    DialogActions,
    Autocomplete,
    Grid,
    TextField
} from '@mui/material';
import ConfirmDialog from 'components/ConfirmDialog';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useState } from 'react';
import { isMobileOnly } from 'react-device-detect';
import { useTranslation } from 'react-i18next';
import { AssignPORequest, SaleOrder } from 'services/SaleOrder/sale-order-type';
import { Staff } from 'services/Staff/staff-type';
import toast from 'react-hot-toast';
import { assignSaleOrder } from 'services/SaleOrder/sale-order-api';
import { UserProfileResponse } from 'services/User/user-type';
import ManualHelpButton from 'pages/Manual/ManualHelpButton';

/* eslint-disable prettier/prettier */
export interface AssignPackOrderDialogProps {
    open: boolean;
    poList: SaleOrder[] | undefined;
    userList: UserProfileResponse[] | undefined;
    onClose: (val: boolean) => void;
}

export default function AssignPackOrderDialog(props: AssignPackOrderDialogProps): JSX.Element {
    const { open, poList, userList, onClose } = props;
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
    const [title, setTitle] = useState<string>('')
    const [msg, setMsg] = useState<string>('')
    const [action, setAction] = useState<string>('')
    const [selectedStaff, setSelectedStaff] = useState<Staff>();
    const { t } = useTranslation();
    const formik = useFormik({
        initialValues: {
            poIds: poList?.map((po) => po.id),
            staff: null
        },
        enableReinitialize: true,
        validationSchema: Yup.object().shape({
            staff: Yup.object().nullable().required(t('purchaseOrder.warning.staffRequired')),
        }),
        onSubmit: (values, actions) => {
            console.log('handleSubmit ', values);
            actions.setSubmitting(true);
            const assignReq: AssignPORequest = {
                poIds: values.poIds ? values.poIds : [],
                staffId: selectedStaff ? selectedStaff.id : ''
            };
            toast.promise(assignSaleOrder(assignReq), {
                loading: t('toast.loading'),
                success: () => {
                    onClose(true);
                    return t('toast.success');
                },
                error: () => {
                    onClose(false);
                    return t('toast.failed');
                }
            });
        }
    });

    return (
        <Dialog open={open} maxWidth="xs" fullWidth aria-labelledby="form-dialog-title" >
            <DialogTitle
                id="form-dialog-title"
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pr: 1, // เว้นที่ให้ icon
                }}
            >
                {t('purchaseOrder.assignStaff', { amount: poList?.length })}

                <ManualHelpButton manualId="MANUAL000005" />
            </DialogTitle>
            <DialogContent>
                <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}>
                    <Autocomplete
                        options={userList?.map((user) => user) || []}
                        getOptionLabel={(option: UserProfileResponse) => option.staff.displayName}
                        value={userList?.filter((user) => user.staff.id === formik.values.staff?.id)[0]}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                fullWidth
                                variant="outlined"
                                label={t('orderManagement.column.poMakerDisplayName')}
                                InputLabelProps={{ shrink: true }}
                                error={Boolean(formik.touched.staff && formik.errors.staff)}
                                helperText={formik.touched.staff && formik.errors.staff}
                                inputProps={{
                                    ...params.inputProps,
                                    readOnly: isMobileOnly ? false : false, // Disable keyboard on mobile
                                }}
                            />
                        )}
                        onChange={(_event, value, reason) => {
                            if (reason === 'clear') {
                                formik.setFieldValue('staff', null);
                                setSelectedStaff(null);
                            } else {
                                formik.setFieldValue('staff', value);
                                setSelectedStaff(value?.staff);
                            }
                        }}
                    />
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
                    color="error">
                    {t('button.close')}
                </Button>
                <Button
                    color="success"
                    variant="contained"
                    startIcon={<Save />}
                    onClick={() => {
                        setTitle(t('purchaseOrder.assignStaff', { amount: poList?.length }));
                        setMsg(t('purchaseOrder.confirmAssignStaffMsg', { name: selectedStaff?.nickname }));
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
                        onClose();
                    }
                    setVisibleConfirmationDialog(false);
                }}
                onCancel={() => setVisibleConfirmationDialog(false)}
                isShowCancelButton={true}
                isShowConfirmButton={true}
            />
        </Dialog >
    )
}