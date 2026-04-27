/* eslint-disable prettier/prettier */
import { Add, ArrowBack, DeleteOutline, Save } from "@mui/icons-material";
import { Box, Button, Chip, Divider, FormControlLabel, Grid, IconButton, MenuItem, Paper, Radio, RadioGroup, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, useMediaQuery } from "@mui/material";
import { makeStyles } from "@mui/styles";
import PageTitle from "components/PageTitle";
import { GridTextField, Wrapper } from "components/Styled";
import { Page } from "layout/LayoutRoute";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { useHistory } from "react-router-dom";
import { Address, Contact, Customer } from "services/Customer/customer-type";
import { getSales } from "services/Sales/sales-api";
import { useTheme } from "styled-components";
import SearchCustomerDialog from "./SearchCustomerDialog";
import { ROUTE_PATHS } from "routes";
import { useFormik } from "formik";
import * as Yup from 'yup';
import dayjs from "dayjs";
import CollapsibleWrapper from "components/CollapsibleWrapper";
import DatePicker from "components/DatePicker";
import { DEFAULT_DATE_FORMAT } from "utils";
import { CreateQuotationItem } from "services/Document/document-type";
import ConfirmDialog from "components/ConfirmDialog";
import { uploadFile } from "services/general-api";
import toast from "react-hot-toast";
import { createQuotation } from "services/Document/document-api";
import LoadingDialog from "components/LoadingDialog";
import { formatCurrency, formatNumber } from "utils/utils";

const createEmptyRow = (): CreateQuotationItem => ({
    id: Date.now() + Math.floor(Math.random() * 1000),
    name: '',
    type: '',
    capacity: '',
    size: '',
    spec: '',
    unitPrice: 0,
    quantity: 1,
    unitPriceInput: '',
    amount: 0,
    imageFile: null,
    imagePreview: '',
});

const fieldSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '12px',
        backgroundColor: '#fff',
        minHeight: 54
    },
    '& .MuiInputBase-input': {
        fontSize: 16,
        py: 1.8
    }
};

export default function NewQuotation() {
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
    const [isLoading, setIsLoading] = useState(false);
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
    const [title, setTitle] = useState<string>('')
    const [msg, setMsg] = useState<string>('')
    const [action, setAction] = useState<string>('')
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [rows, setRows] = useState<CreateQuotationItem[]>([createEmptyRow()])
    const today = dayjs();
    const { data: salesOptions = [], isFetching: isSalesFetching } = useQuery(
        'quotation-sales-options',
        () => getSales(1, 20),
        { refetchOnWindowFocus: false }
    );
    const formik = useFormik({
        initialValues: {
            customerId: '',
            customerAddressId: '',
            customerContactId: '',
            docDate: today,
            effectiveDate: today.add(7, 'day'),
            salesId: '',
            coSaleId: '',
            remark: '',
            discount: 0,
            freight: 0,
            isVat: false,
            items: [
                {
                    name: '',
                    type: '',
                    capacity: '',
                    spec: '',
                    quantity: 1,
                    unitPrice: 0,
                    amount: 0,
                    imageFile: null,
                    imagePreview: ''
                }
            ]
        },
        enableReinitialize: false,
        validationSchema: Yup.object().shape({

        }),
        onSubmit: async (values) => {
            setIsLoading(true);
            toast
                .promise(createQuotation(values), {
                    loading: t('toast.loading'),
                    success: () => {
                        history.push(ROUTE_PATHS.ROOT);
                        return t('toast.success');
                    },
                    error: () => {
                        return t('toast.failed');
                    }
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    });

    const isGeneralSectionCompleted =
        !!formik.values.docDate &&
        !!formik.values.effectiveDate &&
        !!formik.values.salesId &&
        formik.values.isVat !== undefined;

    const isCustomerSectionCompleted =
        !!formik.values.customerId &&
        !!formik.values.customerAddressId;

    const isItemSectionCompleted =
        formik.values.items.length > 0 &&
        formik.values.items.every((item) => {
            const hasImage = !!item.imagePreview;
            const hasName = !!item.name?.trim();
            const hasQuantity = Number(item.quantity) > 0;
            const hasPrice = Number(item.unitPrice) > 0;

            return hasImage && hasName && hasQuantity && hasPrice;
        });

    const isQuotationFormCompleted =
        isCustomerSectionCompleted &&
        isGeneralSectionCompleted &&
        isItemSectionCompleted;

    const updateItem = (index: number, field: string, value: any) => {
        const items = [...formik.values.items];

        items[index][field] = value;

        const quantity = Number(items[index].quantity || 0);
        const unitPrice = Number(items[index].unitPrice || 0);

        items[index].amount = quantity * unitPrice;

        formik.setFieldValue('items', items);
    };

    const addNewRow = () => {
        const items = [...formik.values.items];

        items.push({
            name: '',
            type: '',
            capacity: '',
            spec: '',
            quantity: 1,
            unitPrice: 0,
            amount: 0,
            imageFile: null,
            imagePreview: ''
        });

        formik.setFieldValue('items', items);
    };

    const removeRow = (index: number) => {
        const items = [...formik.values.items];

        if (items.length === 1) return;

        items.splice(index, 1);

        formik.setFieldValue('items', items);
    };

    const handleUploadImage = async (index: number, file?: File | null) => {
        if (!file) return;

        setIsLoading(true)
        const uploadResult = await uploadFile(file);
        setIsLoading(false)

        const items = [...formik.values.items];
        items[index] = {
            ...items[index],
            imageFile: file,
            imagePreview: uploadResult.url,
            imageUrl: uploadResult.url
        };

        formik.setFieldValue('items', items);
    };

    const removeImage = (index: number) => {
        const items = [...formik.values.items];

        items[index].imageFile = null;
        items[index].imagePreview = '';

        formik.setFieldValue('items', items);
    };

    const subTotal = (formik.values.items || []).reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
    );

    const discount = Number(formik.values.discount || 0);
    const freight = Number(formik.values.freight || 0);

    const taxableAmount = Math.max(subTotal - discount, 0);

    const vatRate = 0.07;
    const vatAmount = formik.values.isVat ? taxableAmount * vatRate : 0;

    const grandTotal = taxableAmount + vatAmount + freight;

    return (
        <Page>
            <PageTitle title={t('documentManagement.quotation.newQuotation')} />
            <CollapsibleWrapper
                title={t('documentManagement.quotation.generalSection')}
                isCompleted={isGeneralSectionCompleted}
                defaultExpanded={true}
            >
                <Grid container spacing={1}>
                    <GridTextField item xs={12} sm={2} style={{ paddingTop: '30px' }}>
                        <DatePicker
                            className={classes.datePickerFromTo}
                            fullWidth
                            inputVariant="outlined"
                            InputLabelProps={{ shrink: true }}
                            required
                            label={t('documentManagement.quotation.docDate')}
                            format={DEFAULT_DATE_FORMAT}
                            value={
                                formik.values.docDate
                                    ? dayjs(formik.values.docDate).toDate()
                                    : null
                            }
                            onChange={(date) => {
                                if (!date) {
                                    formik.setFieldValue('docDate', '');
                                    return;
                                }

                                const startDate = dayjs(date.toDate()).startOf('day');

                                formik.setFieldValue(
                                    'docDate',
                                    startDate.format(DEFAULT_DATE_FORMAT)
                                );

                                // ✅ ถ้า end < start → auto ปรับ end = start
                                if (
                                    formik.values.effectiveDate &&
                                    dayjs(formik.values.effectiveDate).isBefore(startDate)
                                ) {
                                    formik.setFieldValue(
                                        'endDeliveryDate',
                                        startDate.format(DEFAULT_DATE_FORMAT)
                                    );
                                }

                                formik.handleSubmit();
                            }}
                        />
                    </GridTextField>

                    <GridTextField item xs={12} sm={2} style={{ paddingTop: '30px' }}>
                        <DatePicker
                            className={classes.datePickerFromTo}
                            fullWidth
                            inputVariant="outlined"
                            required
                            InputLabelProps={{ shrink: true }}
                            label={t('documentManagement.quotation.expectiveDate')}
                            format={DEFAULT_DATE_FORMAT}
                            minDate={
                                formik.values.docDate
                                    ? dayjs(formik.values.docDate).toDate()
                                    : undefined
                            }
                            value={
                                formik.values.effectiveDate
                                    ? dayjs(formik.values.effectiveDate).toDate()
                                    : null
                            }
                            onChange={(date) => {
                                if (!date) {
                                    formik.setFieldValue('effectiveDate', '');
                                    return;
                                }

                                const endDate = dayjs(date.toDate()).startOf('day');
                                const startDate = formik.values.docDate
                                    ? dayjs(formik.values.docDate)
                                    : null;

                                // ❌ กันกรณีเลือกน้อยกว่า start
                                if (startDate && endDate.isBefore(startDate)) {
                                    return;
                                }

                                formik.setFieldValue(
                                    'effectiveDate',
                                    endDate.format(DEFAULT_DATE_FORMAT)
                                );

                                formik.handleSubmit();
                            }}
                        />
                    </GridTextField>

                    <GridTextField item sm={8} />

                    <GridTextField item xs={12} sm={6}>
                        <RadioGroup
                            row
                            value={String(formik.values.isVat)}
                            onChange={(e) => formik.setFieldValue('isVat', e.target.value === 'true')}
                        >
                            <FormControlLabel value="true" control={<Radio />} label="มี VAT" />
                            <FormControlLabel value="false" control={<Radio />} label="ไม่มี VAT" />
                        </RadioGroup>
                    </GridTextField>

                    <GridTextField item sm={6} />

                    <GridTextField item xs={12} sm={6}>
                        <TextField
                            select
                            fullWidth
                            required
                            label={t('customerManagement.column.salesAccount')}
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(formik.touched.salesId && formik.errors.salesId)}
                            helperText={formik.touched.salesId && formik.errors.salesId}
                            value={formik.values.salesId || ''}
                            disabled={isSalesFetching}
                            onChange={(event) => {
                                const selectedCode = event.target.value;
                                if (selectedCode === '') {
                                    formik.setFieldValue('salesId', selectedCode);
                                } else {
                                    formik.setFieldValue('salesId', selectedCode);
                                }
                            }}>
                            <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                            {salesOptions.map((option) => (
                                <MenuItem key={option.salesId} value={option.salesId}>
                                    {`${option.salesId} - ${option.nickname || option.name}`}
                                </MenuItem>
                            ))}
                        </TextField>
                    </GridTextField>

                    <GridTextField item xs={12} sm={6}>
                        <TextField
                            type="text"
                            label={t('customerManagement.column.coSalesAccount')}
                            fullWidth
                            onChange={({ target }) => {
                                formik.setFieldValue('coSaleId', target.value);
                            }}
                            variant="outlined"
                            value={formik.values.coSaleId}
                            InputLabelProps={{ shrink: true }}
                        />
                    </GridTextField>
                </Grid>
            </CollapsibleWrapper>
            <CollapsibleWrapper
                title={t('documentManagement.quotation.customerSection.title')}
                isCompleted={isCustomerSectionCompleted}
                defaultExpanded={true}
            >
                <Grid container spacing={1}>
                    {/* customerName */}
                    <GridTextField item xs={12} sm={6}>
                        <TextField
                            name="customerName"
                            type="text"
                            label={t('customerManagement.column.id')}
                            fullWidth
                            variant="outlined"
                            value={customer?.id}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{ readOnly: true }}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={6}>
                        <TextField
                            name="customerName"
                            type="text"
                            label={t('customerManagement.column.name')}
                            fullWidth
                            variant="outlined"
                            value={customer?.customerName}
                            InputLabelProps={{ shrink: true }}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={6}>
                        <TextField
                            name="taxId"
                            type="text"
                            label={t('customerManagement.column.taxId')}
                            fullWidth
                            variant="outlined"
                            value={customer?.taxId}
                            InputLabelProps={{ shrink: true }}
                        />
                    </GridTextField>
                    {customer?.customerType.code === 'COMPANY' ?
                        <>
                            <GridTextField item xs={12} sm={6}>
                                <TextField
                                    name="taxId"
                                    type="text"
                                    label={t('documentManagement.quotation.customerSection.branch')}
                                    fullWidth
                                    variant="outlined"
                                    value={'(' + customer?.branchNumber + ') ' + customer?.branchName}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </GridTextField>
                        </> :
                        <> </>
                    }
                    <GridTextField item xs={12} sm={12}>
                        <TextField
                            select
                            name="customerAddressId"
                            label={t('customerManagement.column.address.title')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.customerAddressId || ''}
                            onChange={(e) => formik.setFieldValue('customerAddressId', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            helperText={
                                customer?.addresses.length
                                    ? undefined
                                    : t('customerManagement.column.address.noAddress')
                            }
                        >
                            {(customer?.addresses || []).map((address: Address) => (
                                <MenuItem key={address.id} value={address.id}>
                                    <Stack direction="row" spacing={1} alignItems="center">

                                        {/* Address Type Tag */}
                                        <Chip
                                            size="small"
                                            label={t(`customerManagement.column.addressType.${address.addressType.toLowerCase()}`)}
                                            variant="outlined"
                                        />

                                        {/* Address */}
                                        <span>{address.fullAddress}</span>

                                    </Stack>
                                </MenuItem>
                            ))}
                        </TextField>
                    </GridTextField>
                    <GridTextField item xs={12} sm={12}>
                        <TextField
                            select
                            name="customerContactId"
                            label={t('customerManagement.column.contact')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.customerContactId || ''}
                            onChange={(e) => formik.setFieldValue('customerContactId', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        >
                            {(customer?.contacts || []).map((contact: Contact) => (
                                <MenuItem key={contact.id} value={contact.id}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <span>{contact.contactName + " : " + contact.contactNumber}</span>
                                    </Stack>
                                </MenuItem>
                            ))}
                        </TextField>
                    </GridTextField>
                </Grid>
            </CollapsibleWrapper>
            <CollapsibleWrapper
                title={t('documentManagement.quotation.itemSection.title')}
                isCompleted={isItemSectionCompleted}
                defaultExpanded={true}
            >
                <Paper
                    elevation={0}
                    sx={{
                        border: '1px solid #D9DCE3',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        backgroundColor: '#fff'
                    }}
                >
                    <Table
                        sx={{
                            minWidth: 1100,
                            '& .MuiTableCell-root': {
                                borderColor: '#E6EAF0',
                                verticalAlign: 'middle'
                            }
                        }}
                    >
                        <TableHead>
                            <TableRow
                                sx={{
                                    backgroundColor: '#F7F8FB',
                                    '& .MuiTableCell-root': {
                                        py: 2.25,
                                        fontSize: 16,
                                        borderBottom: '1px solid #D9DCE3'
                                    }
                                }}
                            >
                                <TableCell width={70} />
                                <TableCell width={140} align="center">
                                    <Typography fontWeight={700}>รูปสินค้า</Typography>
                                </TableCell>
                                <TableCell sx={{ minWidth: 320 }}>
                                    <Typography fontWeight={700}>
                                        {t('documentManagement.quotation.itemSection.name')}
                                    </Typography>
                                </TableCell>
                                <TableCell width={160} align="center">
                                    <Typography fontWeight={700}>
                                        {t('documentManagement.quotation.itemSection.quantity')}
                                    </Typography>
                                </TableCell>
                                <TableCell width={180} align="center">
                                    <Typography fontWeight={700}>
                                        {t('documentManagement.quotation.itemSection.unitPrice')}
                                    </Typography>
                                </TableCell>
                                <TableCell width={180} align="center">
                                    <Typography fontWeight={700}>
                                        {t('documentManagement.quotation.itemSection.totalAmount')}
                                    </Typography>
                                </TableCell>
                                <TableCell width={70} />
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {formik.values.items.map((row, index) => (
                                <TableRow
                                    key={index}
                                    sx={{
                                        '& .MuiTableCell-root': {
                                            py: 2,
                                            backgroundColor: '#fff'
                                        },
                                        '&:hover .delete-btn': {
                                            opacity: 1
                                        }
                                    }}
                                >
                                    {/* Index */}
                                    <TableCell align="center">
                                        <Box
                                            sx={{
                                                width: 34,
                                                height: 34,
                                                borderRadius: '10px',
                                                backgroundColor: '#F1F4F9',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 700,
                                                color: '#3A4256',
                                                mx: 'auto'
                                            }}
                                        >
                                            {index + 1}
                                        </Box>
                                    </TableCell>

                                    <TableCell align="center">
                                        <Stack spacing={1} alignItems="center">
                                            <Box
                                                sx={{
                                                    width: 88,
                                                    height: 88,
                                                    border: '1px dashed #C8D0DB',
                                                    borderRadius: '14px',
                                                    overflow: 'hidden',
                                                    backgroundColor: '#FAFBFC',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                {row.imagePreview ? (
                                                    <Box
                                                        component="img"
                                                        src={row.imagePreview}
                                                        alt="product"
                                                        sx={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                ) : (
                                                    <Typography variant="caption" color="text.secondary" textAlign="center">
                                                        {t('documentManagement.quotation.itemSection.noImage')}
                                                    </Typography>
                                                )}
                                            </Box>

                                            <Button
                                                component="label"
                                                variant="outlined"
                                                size="small"
                                                sx={{ borderRadius: '999px' }}
                                            >
                                                {t('documentManagement.quotation.itemSection.uploadImage')}
                                                <input
                                                    hidden
                                                    accept="image/*"
                                                    type="file"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        handleUploadImage(index, file);
                                                    }}
                                                />
                                            </Button>

                                            {row.imagePreview && (
                                                <Button
                                                    color="error"
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ borderRadius: '999px' }}
                                                    onClick={() => removeImage(index)}
                                                >
                                                    {t('documentManagement.quotation.itemSection.removeImage')}
                                                </Button>
                                            )}
                                        </Stack>
                                    </TableCell>

                                    {/* Name */}
                                    <TableCell>
                                        <Stack spacing={1.25}>
                                            <TextField
                                                fullWidth
                                                required
                                                label={t('documentManagement.quotation.itemSection.name')}
                                                value={row.name}
                                                onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                variant="outlined"
                                                sx={fieldSx}
                                            />

                                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25}>
                                                <TextField
                                                    fullWidth
                                                    label={t('documentManagement.quotation.itemSection.type')}
                                                    value={row.type}
                                                    onChange={(e) => updateItem(index, 'type', e.target.value)}
                                                    variant="outlined"
                                                    sx={fieldSx}
                                                />

                                                <TextField
                                                    fullWidth
                                                    label={t('documentManagement.quotation.itemSection.capacity')}
                                                    value={row.capacity}
                                                    onChange={(e) => updateItem(index, 'capacity', e.target.value)}
                                                    variant="outlined"
                                                    sx={fieldSx}
                                                />
                                            </Stack>

                                            <TextField
                                                fullWidth
                                                label={t('documentManagement.quotation.itemSection.spec')}
                                                multiline
                                                minRows={2}
                                                value={row.spec}
                                                onChange={(e) => updateItem(index, 'spec', e.target.value)}
                                                variant="outlined"
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: '12px',
                                                        backgroundColor: '#fff'
                                                    },
                                                    '& .MuiInputBase-input': {
                                                        fontSize: 16
                                                    }
                                                }}
                                            />
                                        </Stack>
                                    </TableCell>

                                    {/* Quantity */}
                                    <TableCell align="center">
                                        <TextField
                                            fullWidth
                                            type="number"
                                            value={row.quantity}
                                            onChange={(e) =>
                                                updateItem(index, 'quantity', Number(e.target.value || 0))
                                            }
                                            inputProps={{
                                                min: 0,
                                                step: '0.01',
                                                style: { textAlign: 'center' }
                                            }}
                                            variant="outlined"
                                            sx={{
                                                maxWidth: 130,
                                                mx: 'auto',
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '12px',
                                                    minHeight: 54,
                                                    backgroundColor: '#fff'
                                                },
                                                '& .MuiInputBase-input': {
                                                    fontSize: 16,
                                                    fontWeight: 500
                                                }
                                            }}
                                        />
                                    </TableCell>

                                    {/* Unit Price */}
                                    <TableCell align="center">
                                        <TextField
                                            fullWidth
                                            type="text"
                                            inputMode="decimal"
                                            value={row.unitPrice}
                                            onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                                            variant="outlined"
                                            sx={{
                                                maxWidth: 155,
                                                mx: 'auto',
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '12px',
                                                    minHeight: 54,
                                                    backgroundColor: '#fff'
                                                },
                                                '& .MuiInputBase-input': {
                                                    fontSize: 16,
                                                    fontWeight: 500,
                                                    textAlign: 'right'
                                                }
                                            }}
                                        />
                                    </TableCell>

                                    {/* Amount */}
                                    <TableCell align="center">
                                        <Box
                                            sx={{
                                                minHeight: 54,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'flex-end',
                                                px: 1.5
                                            }}
                                        >
                                            <Typography
                                                fontWeight={700}
                                                sx={{
                                                    fontSize: 20,
                                                    color: '#2F3447'
                                                }}
                                            >
                                                {formatNumber(row.amount)}
                                            </Typography>
                                        </Box>
                                    </TableCell>

                                    {/* Delete */}
                                    <TableCell align="center">
                                        <IconButton
                                            className="delete-btn"
                                            onClick={() => removeRow(index)}
                                            sx={{
                                                opacity: 0.7,
                                                transition: '0.2s',
                                                borderRadius: '12px',
                                                '&:hover': {
                                                    backgroundColor: '#FFF1F1'
                                                }
                                            }}
                                        >
                                            <DeleteOutline sx={{ color: '#B0B7C3' }} />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>

                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{ mt: 2.5 }}
                >
                    <Button
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={addNewRow}
                        sx={{
                            borderRadius: '999px',
                            px: 3,
                            py: 1.25,
                            fontWeight: 700,
                            minHeight: 48
                        }}
                    >
                        {t('documentManagement.quotation.itemSection.addItem') || 'เพิ่มรายการใหม่'}
                    </Button>
                </Stack>
            </CollapsibleWrapper>
            <CollapsibleWrapper
                title={t('documentManagement.quotation.summarySection.title')}
                defaultExpanded={true}
            >
                <Grid container spacing={1}>
                    <Grid item xs={12} md={7}>
                        <TextField
                            type="text"
                            label={t('documentManagement.quotation.remark')}
                            fullWidth
                            multiline
                            rows={6}
                            variant="outlined"
                            value={formik.values.remark}
                            InputLabelProps={{ shrink: true }}
                            onChange={(event) => {
                                formik.setFieldValue('remark', event.target.value);
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} md={5}>
                        <Paper
                            elevation={0}
                            sx={{
                                border: '1px solid #E6EAF0',
                                borderRadius: '18px',
                                p: 2.5,
                                backgroundColor: '#FAFBFC'
                            }}
                        >
                            <Stack spacing={2}>
                                {/* Subtotal */}
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography fontWeight={500}>
                                        {t('documentManagement.quotation.summarySection.subtotal')}
                                    </Typography>
                                    <Typography fontWeight={600}>
                                        {formatCurrency(subTotal)}
                                    </Typography>
                                </Stack>

                                {/* Discount */}
                                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                                    <Typography fontWeight={500} sx={{ minWidth: 120 }}>
                                        {t('documentManagement.quotation.summarySection.discount')}
                                    </Typography>

                                    <TextField
                                        type="number"
                                        value={formik.values.discount}
                                        onChange={(e) =>
                                            formik.setFieldValue('discount', Number(e.target.value || 0))
                                        }
                                        inputProps={{
                                            min: 0,
                                            style: { textAlign: 'right' }
                                        }}
                                        sx={{
                                            maxWidth: 180,
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '12px',
                                                backgroundColor: '#fff'
                                            }
                                        }}
                                    />
                                </Stack>

                                {/* VAT */}
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography fontWeight={500}>
                                        {t('documentManagement.quotation.summarySection.vat')}
                                        {formik.values.isVat ? ' (7%)' : ''}
                                    </Typography>
                                    <Typography fontWeight={600}>
                                        {formatCurrency(vatAmount)}
                                    </Typography>
                                </Stack>

                                {/* Freight */}
                                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                                    <Typography fontWeight={500} sx={{ minWidth: 120 }}>
                                        {t('documentManagement.quotation.summarySection.freight')}
                                    </Typography>

                                    <TextField
                                        type="number"
                                        value={formik.values.freight}
                                        onChange={(e) =>
                                            formik.setFieldValue('freight', Number(e.target.value || 0))
                                        }
                                        inputProps={{
                                            min: 0,
                                            style: { textAlign: 'right' }
                                        }}
                                        sx={{
                                            maxWidth: 180,
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '12px',
                                                backgroundColor: '#fff'
                                            }
                                        }}
                                    />
                                </Stack>

                                <Divider />

                                {/* Grand Total */}
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6" fontWeight={700}>
                                        {t('documentManagement.quotation.summarySection.grandTotal')}
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        fontWeight={800}
                                        sx={{ color: '#1B5E20' }}
                                    >
                                        {formatCurrency(grandTotal)}
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                    </Grid>

                </Grid>
            </CollapsibleWrapper>
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
                            setTitle(t('general.confirmCloseTitle'));
                            setMsg(t('general.confirmCloseMsg'));
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

                        }}
                        startIcon={<Save />}
                        variant="contained"
                        className="btn-baby-blue"
                    >
                        {t('button.saveDraft')}
                    </Button>
                    <Button
                        fullWidth={isDownSm}
                        disabled={!isQuotationFormCompleted}
                        onClick={() => {
                            setAction('create');
                            setTitle(t('documentManagement.message.confirmCreateQuotationTitle'));
                            setMsg(t('documentManagement.message.confirmCreateQuotationMsg'));
                            setVisibleConfirmationDialog(true);
                        }}
                        startIcon={<Save />}
                        variant="contained"
                        className="btn-emerald-green">
                        {t('documentManagement.quotation.newQuotationButton')}
                    </Button>
                </Stack>
            </Wrapper>
            <SearchCustomerDialog
                open={openSearchCustomerAndDocDialog}
                onClose={() => {
                    history.push(ROUTE_PATHS.ROOT);
                    setOpenSearchCustomerAndDocDialog(false)
                }}
                onSelect={(payload) => {
                    setCustomer(payload.customer);
                    formik.setValues({
                        ...formik.values,
                        salesId: payload.customer.salesAccount,
                        customerId: payload.customer.id,
                        docDate: today,
                        effectiveDate: today.add(7, 'day')
                    });
                    if (payload.customer?.addresses?.length) {
                        const defaultAddress =
                            payload.customer.addresses.find((addr) => addr.isDefault) ||
                            payload.customer.addresses[0];

                        if (defaultAddress?.id && !formik.values.customerAddressId) {
                            formik.setFieldValue("customerAddressId", defaultAddress.id);
                        }
                    }
                    if (payload.customer?.contacts?.length) {
                        const defaultContact =
                            payload.customer.contacts.find((contact) => contact.isDefault) ||
                            payload.customer.contacts[0];

                        if (defaultContact?.id && !formik.values.customerContactId) {
                            formik.setFieldValue("customerContactId", defaultContact.id);
                        }
                    }
                    setOpenSearchCustomerAndDocDialog(false);
                }}
                initialCustomer={customer}
            />
            <ConfirmDialog
                open={visibleConfirmationDialog}
                title={title}
                message={msg}
                confirmText={t('button.confirm')}
                cancelText={t('button.cancel')}
                onConfirm={() => {
                    if (action === 'create') {
                        formik.handleSubmit();
                    } else if (action === 'clear') {
                        // handleClear();
                    } else if (action === 'back') {
                        history.push(ROUTE_PATHS.ROOT);
                    }
                    setVisibleConfirmationDialog(false);
                }}
                onCancel={() => setVisibleConfirmationDialog(false)}
                isShowCancelButton={true}
                isShowConfirmButton={true}
            />
            <LoadingDialog
                open={isLoading}
            />
        </Page >
    );
}
