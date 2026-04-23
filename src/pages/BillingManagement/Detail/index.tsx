/* eslint-disable prettier/prettier */
import { Box, Button, Checkbox, Chip, Grid, IconButton, InputAdornment, MenuItem, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, useMediaQuery } from "@mui/material";
import { makeStyles } from "@mui/styles";
import PageTitle from "components/PageTitle";
import { GridTextField, Wrapper } from "components/Styled";
import { Page } from "layout/LayoutRoute";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import { useHistory, useParams } from "react-router-dom";
import { Customer } from "services/Customer/customer-type";
import { ArrowBack, Edit, Preview } from "@mui/icons-material";
import ConfirmDialog from "components/ConfirmDialog";
import { getSystemConfig } from "services/Config/config-api";
import { GROUP_CODE } from "services/Config/config-type";
import { useQuery } from "react-query";
import toast from "react-hot-toast";
import * as Yup from 'yup';
import { updateCustomer } from "services/Customer/customer-api";
import { useFormik } from "formik";
import { getProvince, getAmphure, getTumbon } from "services/Address/address-api";
import DatePicker from "components/DatePicker";
import dayjs from "dayjs";
import { base64ToBlob, DEFAULT_DATE_FORMAT, formatMoney } from "utils";
import { isMobileOnly } from "react-device-detect";
import { DownloadDocumentResponse, WITH_HOLDING_OPTIONS } from "services/general-type";
import { BillingNoteDto, BillingNoteItemDto } from "services/Billing/billing-type";
import { downloadBilling, getBillingNote, viewBilling } from "services/Billing/billing-api";
import DownloadPOButton from "components/DownloadButton";
import ViewBillingDialog from "../ViewBillingDialog";
import LoadingDialog from "components/LoadingDialog";
import { ROUTE_PATHS } from "routes";
import { getStatusChipSx } from "components/StatusChip";
import CustomerForm from "components/CustomerForm";
import ViewOptionDialog from "components/ViewOptionDialog";

const NoArrowTextField = styled(TextField)({
    '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
        display: 'none',
    },
    '& input[type=number]': {
        MozAppearance: 'textfield',
    },
});

export interface BillingNoteParam {
    id: string;
}

export default function BillingDetail() {
    const { t } = useTranslation();
    const theme = useTheme();
    const history = useHistory();
    const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
    const useStyles = makeStyles({
        hideObject: {
            display: 'none'
        },
        noResultMessage: {
            textAlign: 'center',
            fontSize: '1.2em',
            fontWeight: 'bold',
        },
        tableHeader: {
            border: '2px solid #e0e0e0',
            fontWeight: 'bold',
            paddingLeft: '10px',
            textAlign: 'center'
        },
        datePickerFromTo: {
            '&& .MuiOutlinedInput-input': {
                padding: '16.5px 14px'
            },
            '&& .MuiFormLabel-root': {
                fontSize: '13px'
            }
        },
        bkkChip: {
            backgroundColor: '#068710',
            color: 'white'
        },
        provinceChip: {
            backgroundColor: '#a533ff',
            color: 'white'
        },
        fileInput: {
            width: '100%',
            padding: '11px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px',
            '::file-selector-button': {
                color: 'red'
            }
        }
    });
    const classes = useStyles();
    const params = useParams<BillingNoteParam>();
    const [openSearchCustomerAndDocDialog, setOpenSearchCustomerAndDocDialog] = useState(false);
    const [openViewDialog, setOpenViewDialog] = useState(false);
    const [openViewOptionDialog, setOpenViewOptionDialog] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const [billingNo, setBillingNo] = useState('');
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
    const [printOriginal, setPrintOriginal] = useState(true);
    const [printCopy, setPrintCopy] = useState(false);
    const [title, setTitle] = useState<string>('')
    const [msg, setMsg] = useState<string>('')
    const [action, setAction] = useState<string>('')
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [billingNoteItems, setBilllingNoteItems] = useState<BillingNoteItemDto[]>([]);
    const [editingDiscount, setEditingDiscount] = useState(false);
    const [discountInput, setDiscountInput] = useState<string>('0');
    const [enableWithHoldingTax, setEnableWithHoldingTax] = useState(false);
    const [withHoldingPercent, setWithHoldingPercent] = useState<number>(3);
    const [apiSubtotal, setApiSubtotal] = useState<number | null>(null);
    const [apiDiscount, setApiDiscount] = useState<number | null>(null);
    const [isDirtyAmount, setIsDirtyAmount] = useState(false);
    const [isAllowEdit, setIsAllowEdit] = useState(false);

    const { data: customerTypeList, isFetching: isCustomerTypeFetching } = useQuery(
        ['customer-type', customer?.customerId],
        () => getSystemConfig(GROUP_CODE.CUSTOMER_TYPE),
        {
            enabled: !!customer,              // 🔑 ยิงเฉพาะตอน customer ไม่เป็น null
            refetchOnWindowFocus: false,
        }
    );

    const {
        data: billingData,
        isFetching: isBillingFetching
    } = useQuery(
        ['billing-note', params.id],
        () => getBillingNote(params.id),
        {
            enabled: !!params.id,
            refetchOnWindowFocus: false
        }
    );
    const { data: provinces } = useQuery('province', () => getProvince(), {
        refetchOnWindowFocus: false
    });
    const { data: amphures } = useQuery('amphure', () => getAmphure(), {
        refetchOnWindowFocus: false
    });
    const { data: tumbons } = useQuery('tumbon', () => getTumbon(), { refetchOnWindowFocus: false });


    const initialCustomerFormikValues = useMemo(
        () => ({
            customerId: customer?.customerId ?? '',
            displayName: customer?.displayName ?? '',
            customerName: customer?.customerName ?? '',
            customerAreaType: customer?.customerArea?.code ?? '',
            contactNumber1: customer?.contactNumber1 ?? '',
            contactNumber2: customer?.contactNumber2 ?? '',
            contactName: customer?.contactName ?? '',
            type: customer?.customerType?.code ?? 'INDIVIDUAL',
            taxId: customer?.taxId ?? '',
            companyName: customer?.companyName ?? '',
            companyBranchCode: customer?.branchNumber ?? '',
            companyBranchName: customer?.branchName ?? '',
            creditTerm: customer?.customerCreditTerm?.code ?? '',
            sendingBillMethod: customer?.sendingBillMethod ?? '',
            billingHeader: customer?.billingHeader ?? '',
            address: customer?.address ?? '',
            addressTumbon: customer?.addressTumbon?.id ?? '',
            addressAmphure: customer?.addressAmphure?.id ?? '',
            addressProvince: customer?.addressProvince?.id ?? '',
            postalCode: customer?.addressTumbon?.zipCode ?? ''
        }),
        [customer]
    );

    const hasAddress = (v: unknown) => typeof v === 'string' && v.trim().length > 0;

    const requireIfAddress = (schema: Yup.StringSchema, msg: string) =>
        schema.when('address', {
            is: hasAddress,
            then: (s) => s.required(msg),
            otherwise: (s) => s.notRequired().nullable()
        });

    const customerFormik = useFormik({
        initialValues: initialCustomerFormikValues,
        enableReinitialize: true,
        validateOnMount: true,
        validationSchema: Yup.object().shape({
            customerName: Yup.string()
                .max(255)
                .required(t('customerManagement.message.validateCustomerName')),
            contactName: Yup.string()
                .max(255)
                .required(t('customerManagement.message.validateContactName')),
            contactNumber1: Yup.string()
                .max(255)
                .required(t('customerManagement.message.validateContactNumber')),
            taxId: Yup.string().required(t('customerManagement.message.validateTaxId')),
            address: Yup.string().trim().nullable(), // not required by itself
            addressProvince: requireIfAddress(
                Yup.string().trim().nullable(),
                t('supplierManagement.message.validateProvince')
            ),

            addressAmphure: requireIfAddress(
                Yup.string().trim().nullable(),
                t('supplierManagement.message.validateAmphure')
            ),

            addressTumbon: requireIfAddress(
                Yup.string().trim().nullable(),
                t('supplierManagement.message.validateTumbon')
            )
        }),
        onSubmit: async (values) => {
            toast.promise(updateCustomer(values.customerId, values), {
                loading: t('toast.loading'),
                success: t('toast.success'),
                error: t('toast.failed')
            });
        }
    });

    const isHeadOffice = customerFormik.values.companyBranchCode === '00000';

    const handleHeadOfficeToggle = (checked: boolean) => {
        if (checked) {
            customerFormik.setFieldValue('companyBranchCode', '00000');
            customerFormik.setFieldValue('companyBranchName', 'สำนักงานใหญ่');
        } else {
            customerFormik.setFieldValue('companyBranchCode', '');
            customerFormik.setFieldValue('companyBranchName', '');
        }
    };
    const formik = useFormik({
        initialValues: {
            billingDate: null,
            dueDate: null,
            customerId: '',
            remark: '',
            creditDays: 0,
            items: []
        },
        enableReinitialize: false,
        validationSchema: Yup.object().shape({

        }),
        onSubmit: async (values) => {
            // const req: CreateBillingNoteRequest = {
            //     billingDate: values.billingDate,
            //     dueDate: values.dueDate,
            //     customerId: values.customerId,
            //     remark: values.remark,
            //     creditDay: values.creditDays,
            //     items: values.items.map(i => i.invoiceNo),
            //     discount,
            //     withholdingTaxPercent: enableWithHoldingTax ? withHoldingPercent : 0.0
            // }
            // toast.promise(createBillingNote(req), {
            //     loading: t('toast.loading'),
            //     success: () => {
            //         formik.resetForm();
            //         customerFormik.resetForm();
            //         history.goBack();
            //         return t('toast.success')
            //     },
            //     error: t('toast.failed')
            // });
        }
    })

    const viewBillingFunction = (id: string, options: { original: boolean; copy: boolean }) => {
        toast.promise(viewBilling(id, options.original, options.copy), {
            loading: t('toast.loading'),
            success: (response) => {
                const data = response.data as DownloadDocumentResponse;

                if (!data.files?.length) {
                    throw new Error('No file');
                }

                const file = data.files[0]; // PDF มีไฟล์เดียว

                const blob = base64ToBlob(file.base64, file.contentType);
                const url = URL.createObjectURL(blob);
                setPdfUrl(url);
                setOpenViewDialog(true);
                return t('toast.success');
            },
            error: () => {
                return t('toast.failed');
            }
        });
    };

    const downloadBillingNoteFunction = (billing: BillingNoteDto, opt: string, options: { original: boolean; copy: boolean }) => {
        toast.promise(downloadBilling(billing.id, opt, options.original, options.copy), {
            loading: t('toast.loading'),
            success: (response) => {
                const data = response.data as {
                    format: 'PDF' | 'JPG';
                    files: {
                        fileName: string;
                        base64: string;
                    }[];
                };

                // ================= PDF (ไฟล์เดียว) =================
                if (opt === 'PDF') {
                    const file = data.files[0];
                    const blob = base64ToBlob(file.base64, 'application/pdf');
                    const url = window.URL.createObjectURL(blob);

                    const link = document.createElement('a');
                    link.href = url;
                    link.download = file.fileName;
                    link.click();

                    window.URL.revokeObjectURL(url);
                }

                // ================= JPG (หลายไฟล์) =================
                if (opt === 'JPG') {
                    data.files.forEach(file => {
                        const blob = base64ToBlob(file.base64, 'image/jpeg');
                        const url = window.URL.createObjectURL(blob);

                        const link = document.createElement('a');
                        link.href = url;
                        link.download = file.fileName;
                        link.click();

                        window.URL.revokeObjectURL(url);
                    });
                }
                return t('toast.success');
            },
            error: () => {
                return t('toast.failed');
            }
        });
    };

    const memoSubtotal = useMemo(() => {
        return formik.values.items.reduce((sum, line: BillingNoteItemDto) => {
            return sum + line.payableAmount
        }, 0);
    }, [formik.values.items]);

    const memoDiscount = useMemo(() => {
        return Number(discountInput) || 0;
    }, [discountInput]);

    const subtotal = isDirtyAmount ? memoSubtotal : apiSubtotal ?? memoSubtotal;
    const discount = isDirtyAmount ? memoDiscount : apiDiscount ?? memoDiscount;
    const netAmount = subtotal - discount;
    const grandTotal = netAmount;

    const memoWhtAmount = useMemo(() => {
        if (!enableWithHoldingTax) return 0;
        return Math.round((netAmount * withHoldingPercent) / 100 * 100) / 100;
    }, [netAmount, withHoldingPercent, enableWithHoldingTax]);
    const withHoldingAmount = memoWhtAmount;

    const payAmount = useMemo(() => {
        return grandTotal - (enableWithHoldingTax ? withHoldingAmount : 0);
    }, [grandTotal, withHoldingAmount, enableWithHoldingTax]);

    useEffect(() => {
        if (!billingData) return;

        setCustomer(billingData.customer);
        setBillingNo(billingData.billingNo);
        setBilllingNoteItems(billingData.billingNoteItems);

        setApiSubtotal(billingData.subtotal);
        setApiDiscount(billingData.discount ?? 0);
        setDiscountInput(String(billingData.discount ?? 0));
        setEnableWithHoldingTax(billingData.withHoldingTaxFlag);
        setWithHoldingPercent(billingData.withHoldingPercent ?? 3);

        // 4. set formik
        formik.setValues({
            billingDate: dayjs(billingData.billingDate),
            dueDate: dayjs(billingData.dueDate),
            customerId: billingData.customer?.customerId,
            remark: billingData.remark ?? '',
            creditDays: billingData.creditDays,
            items: billingData.billingNoteItems
        });
        if (billingData.status === 'CREATED') {
            setIsAllowEdit(true);
        }

    }, [billingData]);


    useEffect(() => {
        setIsDirtyAmount(true);
    }, [formik.values.items]);

    return (
        <Page>
            <PageTitle title={t('billingManagement.viewBillingTitle', { billingNo: billingNo })}>
                <Chip
                    color="info"
                    label={t(`status.billing.${billingData?.status}`)}
                    sx={{ ...getStatusChipSx(billingData?.status), }}
                />
            </PageTitle>
            <Wrapper>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    useFlexGap
                    sx={{
                        mt: 1,
                        justifyContent: { sm: 'flex-end' }, // right-align when in row
                        alignItems: { xs: 'flex-end', sm: 'center' }, // right-align when stacked
                    }}
                >
                    <Button
                        fullWidth={isDownSm}
                        onClick={() => {
                            setTitle(t('message.confirmCloseTitle'));
                            setMsg(t('message.confirmCloseMsg'));
                            setAction('CLOSE');
                            setVisibleConfirmationDialog(true);
                        }}
                        variant="contained"
                        startIcon={<ArrowBack />}
                        className="btn-cool-grey">
                        {t('button.back')}
                    </Button>
                    {/* <Button
                        fullWidth={isDownSm}
                        disabled={!isAllowEdit}
                        onClick={() => {
                            setTitle(t('message.confirmCreateBillingNoteTitle'));
                            setMsg(t('message.confirmCreateBillingNoteMsg'));
                            setAction('SUBMIT');
                            setVisibleConfirmationDialog(true);
                        }}
                        variant="contained"
                        startIcon={<Save />}
                        className="btn-emerald-green"
                    >
                        {t('button.save')}
                    </Button> */}
                    {billingData?.status != 'CANCELLED' ?
                        <Button
                            fullWidth={isDownSm}
                            disabled={billingData?.status === 'CANCELLED'}
                            onClick={() => {
                                setOpenViewOptionDialog(true);
                            }}
                            variant="contained"
                            startIcon={<Preview />}
                            className="btn-green-teal">
                            {t('billingManagement.viewBilling')}
                        </Button>
                        : <></>}
                </Stack>
            </Wrapper>
            <Wrapper>
                <CustomerForm
                    customerFormik={customerFormik}
                    isDownSm={isDownSm}
                    customerTypeList={customerTypeList}
                    provinces={provinces}
                    amphures={amphures}
                    tumbons={tumbons}
                    isHeadOffice={isHeadOffice}
                    onToggleHeadOffice={handleHeadOfficeToggle}
                    enableUpdate={false}
                    onSubmitClick={() => {
                        setTitle(t('message.confirmUpdateCustomerTitle'));
                        setMsg(t('message.confirmUpdateCustomerMsg'));
                        setAction('UPDATE_CUSTOMER');
                        setVisibleConfirmationDialog(true);
                    }}
                />
            </Wrapper>
            <Wrapper>
                <Grid container spacing={1}>
                    <GridTextField item xs={12} sm={3}>
                        {isAllowEdit ? (
                            <DatePicker
                                className={classes.datePickerFromTo}
                                fullWidth
                                disablePast
                                inputVariant="outlined"
                                InputLabelProps={{ shrink: true }}
                                label={t('billingManagement.new.column.billingDate') + ' *'}
                                name="billingDate"
                                format={DEFAULT_DATE_FORMAT}
                                value={formik.values.billingDate}
                                onChange={(date) => {
                                    formik.setFieldValue('billingDate', date);
                                }}
                            />
                        ) : (
                            <TextField
                                fullWidth
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                                label={t('billingManagement.new.column.billingDate')}
                                value={
                                    formik.values.billingDate
                                        ? dayjs(formik.values.billingDate).format(DEFAULT_DATE_FORMAT)
                                        : '-'
                                }
                                InputProps={{
                                    readOnly: true,
                                }}
                            />
                        )}

                        {isAllowEdit &&
                            formik.touched.billingDate &&
                            formik.errors.billingDate && (
                                <Typography variant="caption" color="error">
                                    {formik.errors.billingDate}
                                </Typography>
                            )}
                    </GridTextField>

                    <GridTextField item xs={12} sm={3}>
                        {isAllowEdit ? (
                            <DatePicker
                                className={classes.datePickerFromTo}
                                fullWidth
                                disablePast
                                inputVariant="outlined"
                                InputLabelProps={{ shrink: true }}
                                label={t('billingManagement.new.column.dueDate') + ' *'}
                                name="dueDate"
                                format={DEFAULT_DATE_FORMAT}
                                value={formik.values.dueDate}
                                onChange={(date) => {
                                    formik.setFieldValue('dueDate', date);
                                }}
                            />
                        ) : (
                            <TextField
                                fullWidth
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                                label={t('billingManagement.new.column.dueDate')}
                                value={
                                    formik.values.dueDate
                                        ? dayjs(formik.values.dueDate).format(DEFAULT_DATE_FORMAT)
                                        : '-'
                                }
                                InputProps={{
                                    readOnly: true,
                                }}
                            />
                        )}

                        {isAllowEdit &&
                            formik.touched.dueDate &&
                            formik.errors.dueDate && (
                                <Typography variant="caption" color="error">
                                    {formik.errors.dueDate}
                                </Typography>
                            )}
                    </GridTextField>
                    <GridTextField item xs={12} sm={3}>
                        <NoArrowTextField
                            type="number"
                            label={t('billingManagement.new.column.creditDays')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.creditDays}
                            onChange={({ target }) => {
                                formik.setFieldValue('creditDays', target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1,
                                readOnly: !isAllowEdit
                            }}
                        />
                    </GridTextField>

                    <GridTextField item sm={3} />

                    <GridTextField item xs={12} sm={12}>
                        <TextField
                            label={t('billingManagement.new.column.remark')}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            onChange={(e) => formik.setFieldValue('remark', e.target.value)}
                            InputProps={{
                                readOnly: !isAllowEdit,
                            }}
                        />
                    </GridTextField>
                </Grid>
                <Grid container spacing={1}>
                    <GridTextField item xs={12} sm={3}>
                        <Typography variant="subtitle1" fontWeight={600}>{t('billingManagement.new.column.docList')}</Typography>
                    </GridTextField>
                    {/* {isAllowEdit && (
                        <GridTextField item xs={12} sm={9} sx={{ textAlign: 'right' }}>
                            {!isDownSm && (
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                    <Button
                                        variant="contained"
                                        startIcon={<AddCircle />}
                                        className="btn-emerald-green"
                                        onClick={() => setOpenSearchCustomerAndDocDialog(true)}
                                    >
                                        {t('billingManagement.new.addDoc')}
                                    </Button>
                                </Stack>
                            )}

                            {isDownSm && (
                                <Paper
                                    elevation={3}
                                    sx={{
                                        mt: 1,
                                        p: 1.5,
                                        borderRadius: 2,
                                        position: 'sticky',
                                        bottom: 8,
                                        zIndex: 10
                                    }}
                                >
                                    <Stack spacing={1}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            startIcon={<AddCircle />}
                                            className="btn-emerald-green"
                                            onClick={() => setOpenSearchCustomerAndDocDialog(true)}
                                        >
                                            {t('billingManagement.new.addDoc')}
                                        </Button>
                                    </Stack>
                                </Paper>
                            )}
                        </GridTextField>
                    )} */}
                </Grid>
                <TableContainer>
                    <Table id="doc_list__table" sx={{
                        tableLayout: 'fixed',
                        width: '100%'
                    }}>
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    align="center"
                                    sx={{ width: 60, whiteSpace: 'nowrap' }}
                                >
                                    {t('billingManagement.new.column.no')}
                                </TableCell>

                                <TableCell
                                    align="left"
                                    sx={{ width: 220, whiteSpace: 'nowrap' }}
                                >
                                    {t('billingManagement.column.billingNo')}
                                </TableCell>

                                <TableCell
                                    align="center"
                                    sx={{ width: 160, whiteSpace: 'nowrap' }}
                                >
                                    {t('invoiceManagement.column.invoiceDate')}
                                </TableCell>

                                <TableCell
                                    align="center"
                                    sx={{ width: 160, whiteSpace: 'nowrap' }}
                                    colSpan={2}
                                >
                                    {t('billingManagement.new.column.dueDate')}
                                </TableCell>

                                <TableCell
                                    align="right"
                                    sx={{
                                        width: 'auto',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {t('billingManagement.new.column.payAmount')}
                                </TableCell>
                                <TableCell
                                    align="center"
                                    sx={{ width: 60, whiteSpace: 'nowrap' }}
                                >
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {formik.values.items.map((item: BillingNoteItemDto, index) => {

                                return (
                                    <TableRow key={index}>
                                        <TableCell align="center">
                                            {index + 1}
                                        </TableCell>

                                        <TableCell align="left">
                                            {item.invoiceNo}
                                        </TableCell>

                                        <TableCell align="center">
                                            {item.invoiceDate
                                                ? dayjs(item.invoiceDate).format('DD/MM/YYYY')
                                                : '-'}
                                        </TableCell>

                                        <TableCell align="center" colSpan={2}>
                                            {item.invoiceDueDate
                                                ? dayjs(item.invoiceDueDate).format('DD/MM/YYYY')
                                                : '-'}
                                        </TableCell>

                                        <TableCell align="right">
                                            {formatMoney(item.payableAmount)}
                                        </TableCell>

                                        <TableCell
                                            align="center"
                                            sx={{ width: 60, whiteSpace: 'nowrap' }}
                                        >
                                        </TableCell>

                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    <Table>
                        <TableBody>
                            <TableRow sx={{
                                '& td, & th': {
                                    borderBottom: 'none'
                                }
                            }}>
                                <TableCell style={{ textAlign: 'right' }} colSpan={5}>
                                    {t('invoiceManagement.subtotal')}
                                </TableCell>
                                <TableCell style={{ textAlign: 'center', width: isMobileOnly ? '60px' : '100px' }}>
                                    <Typography
                                        sx={{
                                            fontSize: 14,
                                            fontWeight: 500,
                                            textAlign: 'right',
                                            pr: 1
                                        }}
                                    >
                                        {formatMoney(subtotal)}
                                    </Typography>
                                </TableCell>

                                <TableCell
                                    align="center"
                                    sx={{ width: 60, whiteSpace: 'nowrap' }}
                                >
                                </TableCell>
                            </TableRow>

                            <TableRow
                                sx={{
                                    '& td, & th': {
                                        borderBottom: 'none'
                                    }
                                }}
                            >
                                <TableCell style={{ textAlign: 'right' }} colSpan={5}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-end',
                                            gap: 0.5
                                        }}
                                    >
                                        {t('invoiceManagement.discount')}
                                        {isAllowEdit ??
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setEditingDiscount(true);
                                                }}
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                        }
                                    </Box>
                                </TableCell>

                                <TableCell
                                    style={{
                                        textAlign: 'right',
                                        width: isMobileOnly ? '60px' : '100px'
                                    }}
                                >
                                    {editingDiscount ? (
                                        <NoArrowTextField
                                            autoFocus
                                            value={discount}
                                            type="text"
                                            size="small"
                                            inputProps={{
                                                inputMode: 'numeric',
                                                pattern: '[0-9]*'
                                            }}
                                            sx={{
                                                width: isMobileOnly ? 55 : 80,
                                                maxWidth: isMobileOnly ? 55 : 100,
                                                minWidth: isMobileOnly ? 55 : 78,
                                                '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                                                    display: 'none'
                                                }
                                            }}
                                            onChange={(e) => {
                                                // กัน non-number
                                                const value = e.target.value.replace(/^0+(?=\d)/, '');
                                                setDiscount(value);
                                            }}
                                            InputProps={{
                                                endAdornment: !isMobileOnly ? (
                                                    <InputAdornment position="end">฿</InputAdornment>
                                                ) : null
                                            }}
                                        />
                                    ) : (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'flex-end',
                                                gap: 0.5
                                            }}
                                        >
                                            <Typography sx={{ fontSize: 14 }}>
                                                {formatMoney(discount)}
                                            </Typography>
                                        </Box>
                                    )}
                                </TableCell>

                                <TableCell
                                    align="center"
                                    sx={{ width: 60, whiteSpace: 'nowrap' }}
                                >
                                </TableCell>
                            </TableRow>

                            <TableRow sx={{
                                '& td, & th': {
                                    borderBottom: 'none'
                                }
                            }}>
                                <TableCell style={{ textAlign: 'right' }} colSpan={5}>
                                    {t('invoiceManagement.netAmount')}
                                </TableCell>
                                <TableCell style={{ textAlign: 'center', width: isMobileOnly ? '60px' : '100px' }}>
                                    <Typography
                                        sx={{
                                            fontSize: 14,
                                            fontWeight: 500,
                                            textAlign: 'right',
                                            pr: 1
                                        }}
                                    >
                                        {formatMoney(netAmount)}
                                    </Typography>
                                </TableCell>

                                <TableCell
                                    align="center"
                                    sx={{ width: 60, whiteSpace: 'nowrap' }}
                                >
                                </TableCell>
                            </TableRow>

                            <TableRow>
                                <TableCell sx={{ borderBottom: 'none' }} colSpan={4} />
                                <TableCell style={{ textAlign: 'right', width: isMobileOnly ? '80px' : '150px' }}>
                                    {t('invoiceManagement.grandTotal')}
                                </TableCell>
                                <TableCell style={{ textAlign: 'left', width: isMobileOnly ? '60px' : '100px' }}>
                                    <Typography
                                        sx={{
                                            fontSize: 14,
                                            fontWeight: 500,
                                            textAlign: 'right',
                                            pr: 1
                                        }}
                                    >
                                        {formatMoney(grandTotal)}
                                    </Typography>
                                </TableCell>

                                <TableCell
                                    align="center"
                                    sx={{ width: 60, whiteSpace: 'nowrap' }}
                                >
                                </TableCell>
                            </TableRow>

                            <TableRow sx={{ '& td, & th': { borderBottom: 'none' } }}>
                                {/* column 1 */}
                                <TableCell colSpan={5}>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                                        {isAllowEdit ??
                                            <Checkbox
                                                size="small"
                                                checked={enableWithHoldingTax}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setEnableWithHoldingTax(checked);
                                                    if (!checked) {
                                                        setWithHoldingPercent(0);
                                                    } else {
                                                        setWithHoldingPercent(3);
                                                    }
                                                }
                                                }
                                            />
                                        }

                                        <Typography sx={{ fontSize: 14 }}>
                                            {t('invoiceManagement.withHoldingTax')}
                                        </Typography>

                                        {enableWithHoldingTax && (
                                            <Select
                                                size="small"
                                                value={withHoldingPercent}
                                                onChange={(e) => setWithHoldingPercent(Number(e.target.value))}
                                                sx={{ ml: 1, minWidth: 90, height: 32 }}
                                            >
                                                {WITH_HOLDING_OPTIONS.map(p => (
                                                    <MenuItem key={p} value={p}>
                                                        {p}%
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell
                                    style={{ textAlign: 'center', width: isMobileOnly ? '60px' : '100px' }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: 14,
                                            fontWeight: 500,
                                            textAlign: 'right',
                                            pr: 1,
                                            color: enableWithHoldingTax ? 'text.primary' : 'text.disabled'
                                        }}
                                    >
                                        {formatMoney(withHoldingAmount)}
                                    </Typography>
                                </TableCell>

                                <TableCell
                                    align="center"
                                    sx={{ width: 60, whiteSpace: 'nowrap' }}
                                >
                                </TableCell>
                            </TableRow>

                            <TableRow>
                                <TableCell sx={{ borderBottom: 'none' }} colSpan={4} />
                                <TableCell style={{ textAlign: 'right', width: isMobileOnly ? '80px' : '150px' }}>
                                    {t('invoiceManagement.payAmount')}
                                </TableCell>
                                <TableCell style={{ textAlign: 'left', width: isMobileOnly ? '60px' : '100px' }}>
                                    <Typography
                                        sx={{
                                            fontSize: 14,
                                            fontWeight: 500,
                                            textAlign: 'right',
                                            pr: 1
                                        }}
                                    >
                                        {formatMoney(payAmount)}
                                    </Typography>
                                </TableCell>

                                <TableCell
                                    align="center"
                                    sx={{ width: 60, whiteSpace: 'nowrap' }}
                                >
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Wrapper>
            <Wrapper>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    useFlexGap
                    sx={{
                        mt: 1,
                        justifyContent: { sm: 'flex-end' }, // right-align when in row
                        alignItems: { xs: 'flex-end', sm: 'center' }, // right-align when stacked
                    }}
                >
                    <Button
                        fullWidth={isDownSm}
                        onClick={() => {
                            setTitle(t('message.confirmCloseTitle'));
                            setMsg(t('message.confirmCloseMsg'));
                            setAction('CLOSE');
                            setVisibleConfirmationDialog(true);
                        }}
                        variant="contained"
                        startIcon={<ArrowBack />}
                        className="btn-cool-grey">
                        {t('button.back')}
                    </Button>
                    {/* <Button
                        fullWidth={isDownSm}
                        disabled={!isAllowEdit}
                        onClick={() => {
                            setTitle(t('message.confirmCreateBillingNoteTitle'));
                            setMsg(t('message.confirmCreateBillingNoteMsg'));
                            setAction('SUBMIT');
                            setVisibleConfirmationDialog(true);
                        }}
                        variant="contained"
                        startIcon={<Save />}
                        className="btn-emerald-green"
                    >
                        {t('button.save')}
                    </Button> */}
                    {billingData?.status != 'CANCELLED' ?
                        <Button
                            fullWidth={isDownSm}
                            disabled={billingData?.status === 'CANCELLED'}
                            onClick={() => {
                                setOpenViewOptionDialog(true);
                            }}
                            variant="contained"
                            startIcon={<Preview />}
                            className="btn-green-teal">
                            {t('billingManagement.viewBilling')}
                        </Button>
                        : <></>}
                </Stack>
            </Wrapper>
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
                        history.push(ROUTE_PATHS.BILLING_MANAGEMENT)
                    } else if (action === 'UPDATE_CUSTOMER') {
                        customerFormik.handleSubmit();
                    }
                    setVisibleConfirmationDialog(false);
                }}
                onCancel={() => setVisibleConfirmationDialog(false)}
                isShowCancelButton={true}
                isShowConfirmButton={true}
            />
            <ViewBillingDialog
                open={openViewDialog}
                url={pdfUrl}
                billingNo={billingNo}
                billingNote={billingData}
                onClose={() => {
                    setOpenViewDialog(false);
                    setPrintOriginal(true); // default
                    setPrintCopy(false);
                }}
                options={{
                    original: printOriginal,
                    copy: printCopy
                }} />
            <LoadingDialog
                open={isBillingFetching}
            />
            <ViewOptionDialog
                open={openViewOptionDialog}
                title={t('billingManagement.viewBillingTitle', { billingNo: billingNo })}
                onClose={() => {
                    setOpenViewOptionDialog(false)
                }}
                onConfirm={(options) => {
                    if (billingData) {
                        viewBillingFunction(billingData.id, options);
                    }
                    setPrintCopy(options.copy);
                    setPrintOriginal(options.original);
                    setOpenViewOptionDialog(false);
                }}
            ></ViewOptionDialog>
        </Page >
    )
}