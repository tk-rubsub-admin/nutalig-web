/* eslint-disable prettier/prettier */
import { Box, Button, Checkbox, Grid, IconButton, InputAdornment, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, useMediaQuery } from "@mui/material";
import { makeStyles } from "@mui/styles";
import PageTitle from "components/PageTitle";
import { GridTextField, Wrapper } from "components/Styled";
import { Page } from "layout/LayoutRoute";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import SearchCustomerAndDocDialog from "./SearchCustomerAndDocDialog";
import { ROUTE_PATHS } from "routes";
import { useHistory } from "react-router-dom";
import { Customer } from "services/Customer/customer-type";
import { CreateInvoiceGroupRequest, Invoice } from "services/Invoice/invoice-type";
import { ArrowBack, Save, Edit, AddCircle } from "@mui/icons-material";
import ConfirmDialog from "components/ConfirmDialog";
import { getSystemConfig } from "services/Config/config-api";
import { GROUP_CODE } from "services/Config/config-type";
import { useQuery } from "react-query";
import toast from "react-hot-toast";
import * as Yup from 'yup';
import { getCustomer, updateCustomer } from "services/Customer/customer-api";
import { useFormik } from "formik";
import { getProvince, getAmphure, getTumbon } from "services/Address/address-api";
import DatePicker from "components/DatePicker";
import dayjs from "dayjs";
import { DEFAULT_DATE_FORMAT, formatMoney } from "utils";
import { isMobileOnly } from "react-device-detect";
import { WITH_HOLDING_OPTIONS } from "services/general-type";
import { CreateBillingNoteRequest } from "services/Billing/billing-type";
import { createBillingNote } from "services/Billing/billing-api";
import CustomerForm from "components/CustomerForm";
import { createInvoiceGroup } from "services/Invoice/invoice-group-api";

const NoArrowTextField = styled(TextField)({
    '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
        display: 'none',
    },
    '& input[type=number]': {
        MozAppearance: 'textfield',
    },
});

export default function NewInvoiceGroup() {
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
    const [openSearchCustomerAndDocDialog, setOpenSearchCustomerAndDocDialog] = useState(true);
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
    const [title, setTitle] = useState<string>('')
    const [msg, setMsg] = useState<string>('')
    const [action, setAction] = useState<string>('')
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [editingDiscount, setEditingDiscount] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [enableWithHoldingTax, setEnableWithHoldingTax] = useState(false);
    const [withHoldingPercent, setWithHoldingPercent] = useState<number>(3);

    const { data: customerTypeList } = useQuery(
        ['customer-type', customer?.customerId],
        () => getSystemConfig(GROUP_CODE.CUSTOMER_TYPE),
        {
            enabled: !!customer,              // 🔑 ยิงเฉพาะตอน customer ไม่เป็น null
            refetchOnWindowFocus: false,
        }
    );

    const {
        data: customerData
    } = useQuery(['customer', customer?.customerId], () => getCustomer(customer?.customerId), {
        enabled: !!customer,              // 🔑 ยิงเฉพาะตอน customer ไม่เป็น null
        refetchOnWindowFocus: false,
    });

    const { data: provinces } = useQuery('province', () => getProvince(), {
        refetchOnWindowFocus: false
    });
    const { data: amphures } = useQuery('amphure', () => getAmphure(), {
        refetchOnWindowFocus: false
    });
    const { data: tumbons } = useQuery('tumbon', () => getTumbon(), { refetchOnWindowFocus: false });


    const initialCustomerFormikValues = useMemo(
        () => ({
            customerId: customerData?.customerId ?? '',
            displayName: customerData?.displayName ?? '',
            customerName: customerData?.customerName ?? '',
            customerAreaType: customerData?.customerArea?.code ?? '',
            contactNumber1: customerData?.contactNumber1 ?? '',
            contactNumber2: customerData?.contactNumber2 ?? '',
            contactName: customerData?.contactName ?? '',
            type: customerData?.customerType?.code ?? 'INDIVIDUAL',
            taxId: customerData?.taxId ?? '',
            companyName: customerData?.companyName ?? '',
            companyBranchCode: customerData?.branchNumber ?? '',
            companyBranchName: customerData?.branchName ?? '',
            creditTerm: customerData?.customerCreditTerm?.code ?? '',
            sendingBillMethod: customerData?.sendingBillMethod ?? '',
            billingHeader: customerData?.billingHeader ?? '',
            address: customerData?.address ?? '',
            addressTumbon: customerData?.addressTumbon?.id ?? '',
            addressAmphure: customerData?.addressAmphure?.id ?? '',
            addressProvince: customerData?.addressProvince?.id ?? '',
            postalCode: customerData?.addressTumbon?.zipCode ?? ''
        }),
        [customerData]
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

    const today = dayjs();
    const formik = useFormik({
        initialValues: {
            invoiceDate: invoices.length > 0 ? today : null,
            dueDate: invoices.length > 0 ? today : null,
            customerId: customer?.customerId,
            remark: '',
            creditDays: 0,
            items: invoices
        },
        enableReinitialize: false,
        validationSchema: Yup.object().shape({

        }),
        onSubmit: async (values) => {
            const req: CreateInvoiceGroupRequest = {
                invoiceDate: values.invoiceDate,
                dueDate: values.dueDate,
                customerId: values.customerId,
                remark: values.remark,
                creditDay: values.creditDays,
                items: values.items.map(i => i.invoiceNo),
                discount,
                withholdingTaxPercent: enableWithHoldingTax ? withHoldingPercent : 0.0
            }
            toast.promise(createInvoiceGroup(req), {
                loading: t('toast.loading'),
                success: () => {
                    formik.resetForm();
                    customerFormik.resetForm();
                    history.goBack();
                    return t('toast.success')
                },
                error: t('toast.failed')
            });
        }
    })

    const subtotal = useMemo(() => {
        return formik.values.items.reduce((sum, line) => {
            const diff = line.poAmount - line.invoiceAmount;
            return sum + diff
        }, 0);
    }, [formik.values.items]);

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

    const handleSelectInvoice = ({ customer, invoices }) => {
        setCustomer(customer);
        setInvoices(invoices);
        formik.setValues({
            ...formik.values,
            customerId: customer.customerId,
            items: invoices,
            invoiceDate: today,
            dueDate: today
        });
    };

    return (
        <Page>
            <PageTitle title={t('invoiceManagement.group.new')} />
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
                    <Button
                        fullWidth={isDownSm}
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
                    </Button>
                </Stack>
            </Wrapper>
            <Wrapper>
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
                        onSubmitClick={() => {
                            setTitle(t('message.confirmUpdateCustomerTitle'));
                            setMsg(t('message.confirmUpdateCustomerMsg'));
                            setAction('UPDATE_CUSTOMER');
                            setVisibleConfirmationDialog(true);
                        }}
                    />
                </Wrapper>
            </Wrapper>
            <Wrapper>
                <Grid container spacing={1}>
                    <GridTextField item xs={12} sm={3}>
                        <DatePicker
                            className={classes.datePickerFromTo}
                            fullWidth
                            disablePast
                            inputVariant="outlined"
                            InputLabelProps={{ shrink: true }}
                            label={t('invoiceManagement.column.invoiceDate') + ' *'}
                            name="invoiceDate"
                            format={DEFAULT_DATE_FORMAT}
                            value={formik.values.invoiceDate}
                            onChange={(date) => {
                                formik.setFieldValue('invoiceDate', date);
                            }}
                        />

                        {formik.touched.invoiceDate && formik.errors.invoiceDate && (
                            <Typography variant="caption" color="error">
                                {formik.errors.invoiceDate}
                            </Typography>
                        )}
                    </GridTextField>
                    <GridTextField item xs={12} sm={3}>
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

                        {formik.touched.dueDate && formik.errors.dueDate && (
                            <Typography variant="caption" color="error">
                                {formik.errors.dueDate}
                            </Typography>
                        )}
                    </GridTextField>

                    <GridTextField item sm={6} />

                    <GridTextField item xs={12} sm={12}>
                        <TextField
                            label={t('billingManagement.new.column.remark')}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            onChange={(e) => formik.setFieldValue('remark', e.target.value)}
                        />
                    </GridTextField>
                </Grid>
                <Grid container spacing={1}>
                    <GridTextField item xs={12} sm={3}>
                        <Typography variant="subtitle1" fontWeight={600}>{t('billingManagement.new.column.docList')}</Typography>
                    </GridTextField>
                    <GridTextField item xs={12} sm={9} sx={{ textAlign: 'right' }}>
                        {!isDownSm && (
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Button
                                    variant="contained"
                                    startIcon={<AddCircle />}
                                    sx={{
                                        '&.Mui-disabled': {
                                            backgroundColor: '#e0e0e0 !important',
                                            color: '#9e9e9e !important',
                                        },
                                    }}
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
                                        sx={{
                                            '&.Mui-disabled': {
                                                backgroundColor: '#e0e0e0 !important',
                                                color: '#9e9e9e !important',
                                            },
                                        }}
                                        className="btn-emerald-green"
                                        onClick={() => setOpenSearchCustomerAndDocDialog(true)}
                                    >
                                        {t('billingManagement.new.addDoc')}
                                    </Button>
                                </Stack>
                            </Paper>)
                        }
                    </GridTextField>
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
                            {formik.values.items.map((inv, index) => {
                                const diff = inv.poAmount - inv.invoiceAmount;

                                return (
                                    <TableRow key={index}>
                                        <TableCell align="center">
                                            {index + 1}
                                        </TableCell>

                                        <TableCell align="left">
                                            {inv.invoiceNo}
                                        </TableCell>

                                        <TableCell align="center">
                                            {inv.invoiceDate
                                                ? dayjs(inv.invoiceDate).format('DD/MM/YYYY')
                                                : '-'}
                                        </TableCell>

                                        <TableCell align="center" colSpan={2}>
                                            {inv.dueDate
                                                ? dayjs(inv.dueDate).format('DD/MM/YYYY')
                                                : '-'}
                                        </TableCell>

                                        <TableCell align="right">
                                            {formatMoney(diff)}
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
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                setEditingDiscount(true);
                                            }}
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
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
                    <Button
                        fullWidth={isDownSm}
                        onClick={() => {
                            setTitle(t('message.confirmCreateInvoiceGroupTitle'));
                            setMsg(t('message.confirmCreateInvoiceGroupMsg'));
                            setAction('SUBMIT');
                            setVisibleConfirmationDialog(true);
                        }}
                        variant="contained"
                        startIcon={<Save />}
                        className="btn-emerald-green"
                    >
                        {t('button.save')}
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
                    if (action === 'SUBMIT') {
                        formik.handleSubmit();
                    } else if (action === 'CLOSE') {
                        formik.resetForm();
                        customerFormik.resetForm();
                        history.goBack();
                    } else if (action === 'UPDATE_CUSTOMER') {
                        customerFormik.handleSubmit();
                    }
                    setVisibleConfirmationDialog(false);
                }}
                onCancel={() => setVisibleConfirmationDialog(false)}
                isShowCancelButton={true}
                isShowConfirmButton={true}
            />
            <SearchCustomerAndDocDialog
                open={openSearchCustomerAndDocDialog}
                onClose={() => {
                    history.push(ROUTE_PATHS.INVOICE_GROUP_MANAGEMENT);
                    setOpenSearchCustomerAndDocDialog(false)
                }}
                onSelect={(payload) => {
                    handleSelectInvoice(payload);
                    setOpenSearchCustomerAndDocDialog(false);
                }}
                initialCustomer={customer}
                initialInvoices={invoices}
            />
        </Page >
    )
}