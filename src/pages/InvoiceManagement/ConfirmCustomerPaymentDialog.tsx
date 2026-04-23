/* eslint-disable prettier/prettier */
import { Check, Close } from '@mui/icons-material';
import { Autocomplete, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, Stack, TextField, Typography } from '@mui/material';
import ConfirmDialog from 'components/ConfirmDialog';
import FileUploader from 'components/FileUploader';
import ImageFileUploaderWrapper from 'components/ImageFileUploaderWrapper';
import { GridTextField } from 'components/Styled';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { Invoice } from 'services/Invoice/invoice-type';
import { formatMoney, resizeFile, urlToFile } from 'utils';
import NumberTextField from 'components/NumberTextField';
import { confirmPaidSaleOrderList, deleteSaleOrderPackImage } from 'services/SaleOrder/sale-order-api';
import { GROUP_CODE, SystemConfig } from 'services/Config/config-type';
import { getSystemConfig } from 'services/Config/config-api';
import { Customer } from 'services/Customer/customer-type';

export interface ConfirmCustomerPaymentDialogProps {
    open: boolean;
    inv: Invoice[] | undefined;
    customer: Customer;
    onClose: (val: boolean) => void;
}

export default function ConfirmCustomerPaymentDialog(props: ConfirmCustomerPaymentDialogProps): JSX.Element {
    const { open, inv, customer, onClose } = props;
    const { t } = useTranslation();
    const originalSlipFilesRef = useRef<File[]>([]);
    const [slipImageFiles, setSlipImageFiles] = useState<File[]>([]);
    const slipImageFileUrls = slipImageFiles.map((file) => URL.createObjectURL(file));
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
    const [systemConfig, setSystemConfig] = useState<SystemConfig[]>([]);
    const [title, setTitle] = useState<string>('')
    const [msg, setMsg] = useState<string>('')
    const [action, setAction] = useState<string>('')
    const [creditBalance, setCreditBalance] = useState(0);

    const formik = useFormik({
        initialValues: {
            amount: '',
            slipFiles: [],
            paymentChannel: '',
            bankAccount: null,
            creditEnabled: false,
            credit: creditBalance
        },
        validationSchema: Yup.object({
            paymentChannel: Yup.string().nullable().required(t('invoiceManagement.confirmPaymentDialog.validatePaymentChannelMsg')),
            amount: Yup.number()
                .min(1, t('invoiceManagement.confirmPaymentDialog.validateAmountMustMoreThanZero'))
                .required(t('invoiceManagement.confirmPaymentDialog.validateAmountMsg')),
            slipFiles: Yup.array().when('paymentChannel', {
                is: (val: string) => val === 'TRANSFER',
                then: (schema) =>
                    schema
                        .min(1, t('invoiceManagement.confirmPaymentDialog.validateFileMsg'))
                        .required(t('invoiceManagement.confirmPaymentDialog.validateFileMsg')),
                otherwise: (schema) => schema.notRequired(),
            }),
            bankAccount: Yup.object().nullable().when('paymentChannel', {
                is: (val: string) => val === 'TRANSFER',
                then: (schema) =>
                    schema.required(
                        t('invoiceManagement.confirmPaymentDialog.validateBankAccountMsg')
                    ),
                otherwise: (schema) => schema.notRequired(),
            }),
        }),
        onSubmit: async (values) => {
            const formData = new FormData();
            const ids = inv?.map(inv => inv.poId) || []
            for (const f of slipImageFiles) {
                if (!(f as any).isOriginal) {
                    // new file → resize before sending
                    const resized = await resizeFile(f);
                    formData.append('pictures', resized);
                }
            }
            ids.forEach(id => {
                formData.append('ids', id);
            });
            formData.append('amount', values.amount);
            formData.append('paymentChannel', values.paymentChannel);
            formData.append('bankAccount', values?.bankAccount.code);
            formData.append('credit', values.creditEnabled ? values.credit : 0);

            toast.promise(confirmPaidSaleOrderList(formData), {
                loading: t('toast.loading'),
                success: () => {
                    resetUploads();
                    onClose(true);
                    return t('toast.success');
                },
                error: (error) => t('toast.failed') + ' ' + error.message
            });
        }
    });

    const outstandingAmount = useMemo(() => {
        if (!inv || inv.length === 0) return 0;

        return inv.reduce((sum, invoice) => {
            const diff = invoice.poAmount - invoice.invoiceAmount;
            return sum + (diff > 0 ? diff : 0); // เอาเฉพาะยอดค้าง
        }, 0);
    }, [inv]);

    const resetUploads = () => {
        // cleanup blob URLs to avoid leaks (optional but good)
        slipImageFiles.forEach(f => URL.revokeObjectURL(URL.createObjectURL(f)));
        setSlipImageFiles(originalSlipFilesRef.current);
        formik.resetForm();
    };

    useEffect(() => {
        if (!open || !inv || inv.length === 0) return;

        const credit = inv[0].customer.creditBalance;
        setCreditBalance(credit);
        formik.setFieldValue('credit', credit);
        formik.setFieldValue('creditEnabled', false);

        (async () => {
            const allSlipFiles: File[] = [];

            for (const invoice of inv) {
                for (const slip of invoice.slips || []) {
                    const file = await urlToFile(slip.picUrl, `${slip.picId}`);
                    (file as any).isOriginal = true;
                    (file as any).invoiceId = invoice.poId; // (optional) ไว้ trace
                    allSlipFiles.push(file);
                }
            }

            setSlipImageFiles(allSlipFiles);
            formik.setFieldValue('slipFiles', allSlipFiles);
            originalSlipFilesRef.current = allSlipFiles;

            const config = await getSystemConfig(GROUP_CODE.BANK_ACCOUNT);
            setSystemConfig(config);

            formik.setFieldValue('bankAccount', '');
        })();
    }, [open, inv]);

    useEffect(() => {
        return () => slipImageFileUrls.forEach(url => URL.revokeObjectURL(url));
    }, [slipImageFiles]);

    return (
        <Dialog open={open} maxWidth="xs" fullWidth aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">
                {t('invoiceManagement.confirmPaymentDialog.title')}
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={1}>
                    <GridTextField item xs={12} sm={12}>
                        <Typography variant="subtitle1" gutterBottom>
                            {t('invoiceManagement.confirmPaymentDialog.uploadSlip')}
                        </Typography>
                        <ImageFileUploaderWrapper
                            id="slip-uploader-id"
                            inputId="slip-id"
                            isDisabled={false}
                            readOnly={false}
                            maxFiles={5}
                            isMultiple={true}
                            onError={() => { }}
                            onDeleted={(index) => {
                                const deletedFile = slipImageFiles[index];
                                const invoiceId = (deletedFile as any).invoiceId;

                                toast.promise(
                                    deleteSaleOrderPackImage(invoiceId, deletedFile.name),
                                    {
                                        loading: t('toast.loading'),
                                        success: () => {
                                            setSlipImageFiles(prev => prev.filter((_, i) => i !== index));
                                            formik.setFieldValue(
                                                'slipFiles',
                                                formik.values.slipFiles.filter((_: File, i: number) => i !== index)
                                            );
                                            return t('toast.success');
                                        },
                                        error: (error) => t('toast.failed') + ' ' + error.message
                                    }
                                );
                            }}
                            onSuccess={(files) => {
                                setSlipImageFiles(prev => [...prev, ...files]);
                                formik.setFieldValue('slipFiles', [...formik.values.slipFiles, ...files]);
                            }}
                            files={slipImageFileUrls}
                            fileUploader={FileUploader}
                            isError={false}
                        />
                        {formik.touched.slipFiles && formik.errors.slipFiles && (
                            <Typography variant="caption" color="error">
                                {formik.errors.slipFiles}
                            </Typography>
                        )}
                    </GridTextField>
                    <GridTextField item xs={6} sm={6}>
                        <FormControl>
                            <FormLabel>
                                {t('invoiceManagement.confirmPaymentDialog.paymentChannel.title')}
                            </FormLabel>
                            <RadioGroup
                                row
                                value={formik.values.paymentChannel}
                                name="payment-channel-radio-buttons-group"
                                onChange={({ target }) => {
                                    formik.setFieldValue(`paymentChannel`, target.value);
                                }}
                            >
                                <FormControlLabel
                                    aria-readonly
                                    value="CASH"
                                    control={<Radio />}
                                    label={t('invoiceManagement.confirmPaymentDialog.paymentChannel.cash')}
                                />
                                <FormControlLabel
                                    value="TRANSFER"
                                    control={<Radio />}
                                    label={t('invoiceManagement.confirmPaymentDialog.paymentChannel.transfer')}
                                />
                            </RadioGroup>
                            {formik.touched.paymentChannel && formik.errors.paymentChannel && (
                                <Typography variant="caption" color="error">
                                    {formik.errors.paymentChannel}
                                </Typography>
                            )}
                        </FormControl>
                    </GridTextField>
                    {/* {creditBalance > 0 ?
                        <GridTextField item xs={6} sm={6}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Checkbox
                                    size="small"
                                    checked={formik.values.creditEnabled}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        formik.setFieldValue('creditEnabled', checked);

                                        // ถ้าปิด checkbox → เคลียร์ค่า credit
                                        if (!checked) {
                                            formik.setFieldValue('credit', creditBalance);
                                        }
                                    }}
                                />

                                <Typography variant="body2">
                                    {t('invoiceManagement.confirmPaymentDialog.paymentChannel.credit')}
                                </Typography>

                                <NumberTextField
                                    variant="outlined"
                                    min={1}
                                    max={creditBalance}
                                    sx={{ width: 160 }}
                                    disabled={!formik.values.creditEnabled}   // 🔑 คุม enable / disable
                                    value={
                                        formik.values.credit === ''
                                            ? null
                                            : Number(formik.values.credit)
                                    }
                                    onChange={(v) => {
                                        formik.setFieldValue('credit', v === null ? '' : v);
                                    }}
                                    onCommit={(v) => {
                                        formik.setFieldValue('credit', v === null ? '' : v);
                                    }}
                                />
                            </Stack>
                        </GridTextField>
                        : <><GridTextField item xs={6} sm={6} /></>} */}
                    {formik.values.paymentChannel === 'TRANSFER' ? (
                        <GridTextField item xs={12} sm={12}>
                            <Autocomplete
                                disabled={systemConfig.length === 0}
                                disablePortal
                                options={systemConfig?.map((option) => option) || []}
                                getOptionLabel={(option: SystemConfig) => option.nameTh}
                                isOptionEqualToValue={(option, value) => option.code === value}
                                sx={{ width: '100%' }}
                                value={formik.values.bankAccount || null}
                                onChange={(_event, value, reason) => {
                                    const selectValue = reason === 'clear' ? '' : (value ?? '');
                                    formik.setFieldValue('bankAccount', selectValue);
                                }}
                                renderOption={(props, option) => (
                                    <li {...props}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span>{option.nameTh}</span>
                                            <Typography variant='caption'>
                                                {t('invoiceManagement.confirmPaymentDialog.accountNoLabel', { acct: option.code })}
                                            </Typography>
                                        </div>
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={t('invoiceManagement.confirmPaymentDialog.bankAccount')}
                                        InputLabelProps={{ shrink: true }}
                                        placeholder={t('invoiceManagement.confirmPaymentDialog.validateBankAccountMsg')}
                                        inputProps={{
                                            ...params.inputProps,
                                            readOnly: true // 🔑 Prevents keyboard
                                        }}
                                        error={formik.touched.bankAccount && Boolean(formik.errors.bankAccount)}
                                        helperText={formik.touched.bankAccount && formik.errors.bankAccount}
                                    />
                                )}
                            />
                        </GridTextField>
                    ) : (<></>)}
                    <Grid item xs={6} sm={6} style={{ paddingTop: '10px' }}>
                        <TextField
                            type="text"
                            label={t('invoiceManagement.column.outstandingAmount')}
                            fullWidth
                            variant="outlined"
                            value={formatMoney(outstandingAmount)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <GridTextField item xs={6} sm={6}>
                        <NumberTextField
                            label={t('invoiceManagement.confirmPaymentDialog.amount')}
                            fullWidth
                            variant="outlined"
                            InputLabelProps={{ shrink: true }}
                            min={1}
                            value={formik.values.amount === '' ? null : Number(formik.values.amount)}
                            onChange={(v) => {
                                // ระหว่างพิมพ์ (ยังไม่ clamp)
                                formik.setFieldValue('amount', v === null ? '' : v);
                            }}
                            onCommit={(v) => {
                                // เมื่อ blur หรือกด Enter (ค่าถูก clamp แล้ว)
                                formik.setFieldValue('amount', v === null ? '' : v);
                            }}
                            error={formik.touched.amount && Boolean(formik.errors.amount)}
                            helperText={formik.touched.amount && formik.errors.amount}
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
                    onClick={() => {
                        setTitle(t('invoiceManagement.confirmPaymentDialog.title'));
                        setMsg(t('invoiceManagement.confirmPaymentDialog.confirmMsg'));
                        setAction('SUBMIT');
                        setVisibleConfirmationDialog(true);
                    }}
                    variant="contained"
                    startIcon={<Check />}
                    className="btn-emerald-green"
                >
                    {t('button.confirm')}
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
                        resetUploads();
                        onClose(false);
                    }
                    setVisibleConfirmationDialog(false);
                }}
                onCancel={() => setVisibleConfirmationDialog(false)}
                isShowCancelButton={true}
                isShowConfirmButton={true}
            >
                <Stack spacing={1}>
                    <Typography variant="body2" fontWeight={600}>
                        รายการใบแจ้งหนี้ของลูกค้า {customer?.displayName} จำนวน {inv?.length} รายการ
                    </Typography>

                    {inv?.map((inv, index) => (
                        <Stack
                            key={inv.poId}
                            direction="row"
                            justifyContent="space-between"
                            sx={{ borderBottom: '1px solid #eee', pb: 0.5, pt: 2.0 }}
                        >
                            <Typography variant="body2">{'#' + (index + 1) + ' ' + inv.invoiceNo}</Typography>
                        </Stack>
                    ))}
                </Stack>
                <br />
            </ConfirmDialog>
        </Dialog>
    );
}
