/* eslint-disable prettier/prettier */
import { Search, DisabledByDefault, AddCircle, Edit, Description, Close, AccountBalance, ReceiptLong } from "@mui/icons-material";
import { Autocomplete, Box, Button, Checkbox, Chip, CircularProgress, FormControlLabel, FormGroup, Grid, IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { makeStyles } from "@mui/styles";
import DatePicker from "components/DatePicker";
import PageTitle from "components/PageTitle";
import Paginate from "components/Paginate";
import { GridSearchSection, GridTextField, TextLineClamp, Wrapper } from "components/Styled";
import dayjs from "dayjs";
import { useFormik } from "formik";
import { Page } from "layout/LayoutRoute";
import { useEffect, useState } from "react";
import { isMobileOnly } from "react-device-detect";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { useHistory } from "react-router-dom";
import { ROUTE_PATHS } from "routes";
import { cancelBilling, viewBilling } from "services/Billing/billing-api";
import { BillingNoteDto } from "services/Billing/billing-type";
import { getAllCustomer } from "services/Customer/customer-api";
import { Customer } from "services/Customer/customer-type";
import { base64ToBlob, DEFAULT_DATE_FORMAT, DEFAULT_DATE_FORMAT_BFF, formatDateStringWithPattern, formatMoney } from "utils";
import { getStatusChipSx } from "components/StatusChip";
import ConfirmDialog from "components/ConfirmDialog";
import ViewOptionDialog from "components/ViewOptionDialog";
import { DownloadDocumentResponse } from "services/general-type";
import { viewAllReceipt } from "services/Invoice/invoice-api";
import ConfirmCustomerPaymentDialog from "pages/BillingManagement/ConfirmCustomerPaymentDialog";
import { InvoiceGroup, SearchInvoiceRequest } from "services/Invoice/invoice-type";
import { searchInvoiceGroup } from "services/Invoice/invoice-group-api";

export default function InvoiceGroupManagement() {
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
    const [page, setPage] = useState<number>(1);
    const [pages, setPages] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [openViewDialog, setOpenViewDialog] = useState(false);
    const [openViewBillingDialog, setOpenViewBillingDialog] = useState(false);
    const [openViewBillingReceiptDialog, setOpenViewBillingReceiptDialog] = useState(false);
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
    const [openConfirmCustomerPaymentDialog, setOpenConfirmCustomerPaymentDialog] = useState(false);
    const [printOriginal, setPrintOriginal] = useState(true);
    const [printCopy, setPrintCopy] = useState(false);
    const [viewTitle, setViewTitle] = useState<string>('');
    const [viewType, setViewType] = useState<string>('');
    const [selectedReceipts, setSelectedReceipts] = useState<string[]>([]);
    const [title, setTitle] = useState<string>('')
    const [msg, setMsg] = useState<string>('')
    const [action, setAction] = useState<string>('')
    const [pdfUrl, setPdfUrl] = useState('');
    const [selectedBilling, setSelectedBilling] = useState<BillingNoteDto>();

    const defaultFilter: SearchInvoiceRequest = {
        invoiceDate: '',
        customerIdEqual: '',
        paymentStatusEqual: null,
        paymentStatusIn: [],
        invoiceDateStart: '',
        invoiceDateEnd: ''
    }
    const [invoiceFilter, setInvoiceFilter] = useState<SearchInvoiceRequest>({
        ...defaultFilter

    }); const { data: customerList, isFetching: isCustomerFetching } = useQuery(
        'get-all-customer',
        () => getAllCustomer({
            idEqual: '',
            nameContain: '',
            typeEqual: '',
            rankEqual: '',
            areaEqual: ''
        }),
        {
            refetchOnWindowFocus: false,
            keepPreviousData: true
        }
    );
    const {
        data: invoiceList,
        refetch: invoiceRefetch,
        isFetching: isInvoiceFetching
    } = useQuery('invoice-group-list', () => searchInvoiceGroup(invoiceFilter, page, pageSize, 'invoiceDate'), {
        refetchOnWindowFocus: false
    });

    const searchFormik = useFormik({
        initialValues: defaultFilter,
        enableReinitialize: true,
        onSubmit: (values) => {
            const updateObj = { ...values } as unknown as SearchInvoiceRequest;
            setInvoiceFilter(updateObj);
            setPage(1);
        }
    });

    const invoiceGroupData = (!isInvoiceFetching &&
        invoiceList &&
        invoiceList.data.invoiceGroups.length > 0 &&
        invoiceList.data.invoiceGroups.map((ivg: InvoiceGroup) => {
            return (
                <>
                    <TableRow
                        hover
                        id={`invoice_group__index-${ivg.invoiceNo}`}
                        key={ivg.invoiceNo}
                    >
                        <TableCell align={!ivg.invoiceDate ? "center" : "left"}>
                            <TextLineClamp>
                                {ivg.invoiceDate ? dayjs(ivg.invoiceDate).format('DD/MM/YYYY') : '-'}
                            </TextLineClamp>
                        </TableCell>
                        <TableCell align={!ivg.invoiceNo ? "center" : "left"}>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <TextLineClamp>{ivg.invoiceNo ? ivg.invoiceNo : '-'}</TextLineClamp>
                            </Stack>
                        </TableCell>
                        <TableCell align="left">
                            <TextLineClamp>
                                {ivg.customer.displayName}
                            </TextLineClamp>
                        </TableCell>
                        <TableCell align={"center"}>
                            <Chip
                                color="info"
                                label={t(`status.invoice.${ivg.invoiceStatus}`)}
                                sx={{ ...getStatusChipSx(ivg.invoiceStatus), }}
                            />
                        </TableCell>
                        <TableCell align="right">
                            <TextLineClamp>
                                {formatMoney(ivg.totalAmount)}
                            </TextLineClamp>
                        </TableCell>
                        <TableCell align="center">
                            <Tooltip title={t('invoiceManagement.group.view')} arrow>
                                < IconButton
                                    size="small"
                                    onClick={() => history.push(`/invoice-group/${ivg.invoiceNo}`)}
                                >
                                    <Edit />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={t('invoiceManagement.group.cancel')} arrow>
                                < IconButton
                                    size="small"
                                    disabled={ivg.invoiceStatus === 'CANCELLED'}
                                    color="error"
                                    onClick={() => {
                                        setAction("CANCEL");
                                        setTitle(t('billingManagement.cancelBillingTitle'));
                                        setMsg(t('billingManagement.cancelBillingMsg', { billingNo: ivg.invoiceNo }));
                                        setSelectedBilling(ivg);
                                        setVisibleConfirmationDialog(true);
                                    }}
                                >
                                    <Close />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={t('invoiceManagement.group.viewInvoice')} arrow>
                                <IconButton
                                    disabled={ivg.invoiceStatus === 'CANCELLED'}
                                    onClick={() => {
                                        setSelectedBilling(ivg);
                                        setViewTitle(t('billingManagement.viewBillingTitle', { billingNo: selectedBilling?.billingNo }))
                                        setViewType('BILLING')
                                        setOpenViewDialog(true);
                                    }}
                                    component="span">
                                    <Description />
                                </IconButton>
                            </Tooltip>
                        </TableCell >
                    </TableRow >
                </>
            );
        })) || (
            <TableRow>
                <TableCell colSpan={6}>
                    <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
                </TableCell>
            </TableRow>
        );

    const invoiceGroupMobileData = (!isInvoiceFetching &&
        invoiceList &&
        invoiceList.data.invoiceGroups.length > 0 &&
        invoiceList.data.invoiceGroups.map((ivg: InvoiceGroup) => {

            return (
                <>
                    <TableRow
                        hover
                        id={`invoice-group-index-${ivg.invoiceNo}`}
                        key={ivg.invoiceNo}
                    >
                        <TableCell align="left" sx={{ pt: 2, pb: 2 }}>
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{ width: '100%' }}
                            >
                                <Stack spacing={1}>
                                    <Typography variant="body1" fontWeight={600}>
                                        {ivg.invoiceNo}
                                    </Typography>
                                    <Typography variant="body2">
                                        {ivg.customer?.customerName ?? '-'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        วันที่ {dayjs(ivg.invoiceDate).format('DD/MM/YYYY')}
                                    </Typography>
                                    <Typography variant="body2">
                                        ยอดรวมสุทธิ {formatMoney(ivg.totalAmount)}
                                    </Typography>
                                </Stack>
                                <Stack spacing={0.3}>
                                    <Tooltip title={t('invoiceManagement.group.view')} arrow>
                                        < IconButton
                                            size="small"
                                            onClick={() => history.push(`/invoice-group/${ivg.invoiceNo}`)}
                                        >
                                            <Edit />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={t('invoiceManagement.group.cancel')} arrow>
                                        < IconButton
                                            size="small"
                                            disabled={ivg.invoiceStatus === 'CANCELLED'}
                                            color="error"
                                            onClick={() => {
                                                setAction("CANCEL");
                                                setTitle(t('billingManagement.cancelBillingTitle'));
                                                setMsg(t('billingManagement.cancelBillingMsg', { billingNo: ivg.invoiceNo }));
                                                setSelectedBilling(ivg);
                                                setVisibleConfirmationDialog(true);
                                            }}
                                        >
                                            <Close />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={t('invoiceManagement.group.viewInvoice')} arrow>
                                        <IconButton
                                            disabled={ivg.invoiceStatus === 'CANCELLED'}
                                            onClick={() => {
                                                setSelectedBilling(ivg);
                                                setViewTitle(t('billingManagement.viewBillingTitle', { billingNo: selectedBilling?.billingNo }))
                                                setViewType('BILLING')
                                                setOpenViewDialog(true);
                                            }}
                                            component="span">
                                            <Description />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </Stack>
                        </TableCell>
                    </TableRow>
                </>
            );
        })) || (
            <TableRow>
                <TableCell colSpan={1}>
                    <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
                </TableCell>
            </TableRow>
        );

    const handleToggleReceipt = (receiptNo: string) => {
        setSelectedReceipts(prev =>
            prev.includes(receiptNo)
                ? prev.filter(r => r !== receiptNo)
                : [...prev, receiptNo]
        );
    };

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
                setOpenViewBillingDialog(true);
                return t('toast.success');
            },
            error: () => {
                return t('toast.failed');
            }
        });
    };

    const viewBillingReceiptFunction = (invoiceNos: string[], options: {
        original: boolean; copy: boolean
    }) => {
        toast.promise(viewAllReceipt(invoiceNos, options.original, options.copy), {
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
                setOpenViewBillingReceiptDialog(true);
                return t('toast.success');
            },
            error: () => {
                return t('toast.failed');
            }
        });
    };

    const cancelBillingFunction = (id: string) => {
        toast.promise(cancelBilling(id), {
            loading: t('toast.loading'),
            success: () => {
                invoiceRefetch();
                return t('toast.success');
            },
            error: () => {
                return t('toast.failed');
            }
        });
    }

    useEffect(() => {
        if (!isInvoiceFetching && invoiceList?.data.pagination) {
            setPage(invoiceList.data.pagination.page);
            setPageSize(invoiceList.data.pagination.size);
            setPages(invoiceList.data.pagination.totalPage);
        }
    }, [invoiceList]);

    useEffect(() => {
        invoiceRefetch();
    }, [invoiceFilter, pages, page, pageSize]);

    useEffect(() => {
        return () => {
            if (pdfUrl) {
                window.URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [pdfUrl]);

    return (
        <Page>
            <PageTitle title={t('invoiceManagement.group.pageTitle')} />
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
                        size="small"
                        variant="contained"
                        className={'btn-emerald-green'}
                        onClick={() => history.push(ROUTE_PATHS.NEW_INVOICE_GROUP)}
                        startIcon={<AddCircle />}
                    >
                        {t('billingManagement.create')}
                    </Button>
                    <Button
                        fullWidth={isDownSm}
                        size="small"
                        variant="contained"
                        className="btn-indigo-blue"
                        startIcon={<Search />}
                        onClick={() => searchFormik.handleSubmit()}
                    >
                        {t('button.search')}
                    </Button>
                    <Button
                        fullWidth={isDownSm}
                        size="small"
                        variant="contained"
                        className="btn-amber-orange"
                        startIcon={<DisabledByDefault />}
                        onClick={() => {
                            searchFormik.resetForm();
                            searchFormik.handleSubmit();
                        }}
                    >
                        {t('button.clear')}
                    </Button>
                </Stack>
                <GridSearchSection container spacing={1}>
                    <GridTextField item xs={12} sm={2}>
                        <Autocomplete
                            disabled={isCustomerFetching}
                            options={customerList?.data?.map((option: Customer) => option) || []}
                            getOptionLabel={(cust: Customer) => cust.customerName}
                            sx={{ width: '100%' }}
                            value={
                                customerList?.data?.find(
                                    (cust) => cust.customerId === searchFormik.values.customerIdEqual
                                ) || null
                            }
                            onChange={(_event, value, reason) => {
                                if (reason === 'clear') {
                                    searchFormik.setFieldValue('customerIdEqual', '');
                                    searchFormik.handleSubmit();
                                } else {
                                    searchFormik.setFieldValue('customerIdEqual', value?.customerId);
                                    searchFormik.handleSubmit();
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t('invoiceManagement.column.customerName')}
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}
                            renderOption={(props, option) => (
                                <li {...props} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    {`${option.displayName}`}
                                </li>
                            )}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={2}>
                        <DatePicker
                            className={classes.datePickerFromTo}
                            fullWidth
                            inputVariant="outlined"
                            InputLabelProps={{ shrink: true }}
                            label={t('invoiceManagement.column.invoiceDate') + ' (เริ่มต้น)'}
                            name="invoiceDateStart"
                            format={DEFAULT_DATE_FORMAT}
                            value={searchFormik.values.invoiceDateStart || null}
                            onChange={(date) => {
                                if (!date) {
                                    searchFormik.setFieldValue('invoiceDateStart', '');
                                    return;
                                }

                                const startDate = dayjs(date.toDate()).startOf('day');

                                searchFormik.setFieldValue(
                                    'invoiceDateStart',
                                    startDate.format(DEFAULT_DATE_FORMAT_BFF)
                                );

                                // ✅ ถ้า end < start → auto ปรับ end = start
                                if (
                                    searchFormik.values.invoiceDateEnd &&
                                    dayjs(searchFormik.values.invoiceDateEnd).isBefore(startDate)
                                ) {
                                    searchFormik.setFieldValue(
                                        'invoiceDateEnd',
                                        startDate.format(DEFAULT_DATE_FORMAT_BFF)
                                    );
                                }

                                searchFormik.handleSubmit();
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={2}>
                        <DatePicker
                            className={classes.datePickerFromTo}
                            fullWidth
                            inputVariant="outlined"
                            InputLabelProps={{ shrink: true }}
                            label={t('invoiceManagement.column.invoiceDate') + ' (สิ้นสุด)'}
                            name="invoiceDateEnd"
                            format={DEFAULT_DATE_FORMAT}
                            value={searchFormik.values.invoiceDateEnd || null}
                            minDate={
                                searchFormik.values.invoiceDateStart
                                    ? dayjs(searchFormik.values.invoiceDateStart).toDate()
                                    : undefined
                            }
                            onChange={(date) => {
                                if (!date) {
                                    searchFormik.setFieldValue('invoiceDateEnd', '');
                                    return;
                                }

                                const endDate = dayjs(date.toDate()).startOf('day');
                                const startDate = searchFormik.values.invoiceDateStart
                                    ? dayjs(searchFormik.values.invoiceDateStart)
                                    : null;

                                // ❌ กันกรณีเลือกน้อยกว่า start
                                if (startDate && endDate.isBefore(startDate)) {
                                    return;
                                }

                                searchFormik.setFieldValue(
                                    'invoiceDateEnd',
                                    endDate.format(DEFAULT_DATE_FORMAT_BFF)
                                );

                                searchFormik.handleSubmit();
                            }}
                        />
                    </GridTextField>
                </GridSearchSection>
                {isMobileOnly ? (
                    <>
                        <GridSearchSection container>
                            <TableContainer>
                                <Table id="billing-note-list___table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell
                                                align="center"
                                                key="billing-note"
                                                className={classes.tableHeader}
                                            >
                                                {t('billingManagement.billingNote')}
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    {isInvoiceFetching ? (
                                        <TableBody>
                                            <TableRow>
                                                <TableCell colSpan={1} align="center">
                                                    <CircularProgress />
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    ) : (
                                        <TableBody>{invoiceGroupMobileData}</TableBody>
                                    )}
                                </Table>
                            </TableContainer>
                        </GridSearchSection>
                        <GridSearchSection container>
                            <Grid item xs={12}>
                                <Paginate
                                    pagination={invoiceList?.data.pagination}
                                    page={page}
                                    pageSize={pageSize}
                                    setPage={setPage}
                                    setPageSize={setPageSize}
                                    refetch={invoiceRefetch}
                                    totalRecords={invoiceList?.data.pagination.totalRecords}
                                    isShow={true} />
                            </Grid>
                        </GridSearchSection>
                    </>
                ) : (
                    <>
                        <GridSearchSection container>
                            <TableContainer>
                                <Table id="billing-note-list___table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell
                                                align="center"
                                                key="billingDate"
                                                sx={{
                                                    width: 180,
                                                    maxWidth: 180,
                                                    minWidth: 100,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                                className={classes.tableHeader}
                                            >
                                                {t('billingManagement.column.billingDate')}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                key="billingNo"
                                                sx={{
                                                    width: 250,
                                                    maxWidth: 250,
                                                    minWidth: 100,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                                className={classes.tableHeader}
                                            >
                                                {t('billingManagement.column.billingNo')}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                key="customerName"
                                                className={classes.tableHeader}
                                            >
                                                {t('invoiceManagement.column.customerName')}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                key="dueDate"
                                                sx={{
                                                    width: 100,
                                                    maxWidth: 100,
                                                    minWidth: 100,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                                className={classes.tableHeader}
                                            >
                                                {t('billingManagement.column.status')}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                key="total"
                                                sx={{
                                                    width: 150,
                                                    maxWidth: 150,
                                                    minWidth: 100,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                                className={classes.tableHeader}
                                            >
                                                {t('billingManagement.column.total')}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                key="action"
                                                className={classes.tableHeader}
                                                sx={{
                                                    width: 150,
                                                    maxWidth: 150,
                                                    minWidth: 50,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    padding: '1px'
                                                }}
                                            >
                                                {t('supplierManagement.action.action')}
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    {isInvoiceFetching ? (
                                        <TableBody>
                                            <TableRow>
                                                <TableCell colSpan={6} align="center">
                                                    <CircularProgress />
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    ) : (
                                        <TableBody>{invoiceGroupData}</TableBody>
                                    )}
                                </Table>
                            </TableContainer>
                        </GridSearchSection>
                        <GridSearchSection container>
                            <Grid item xs={12}>
                                <Paginate
                                    pagination={invoiceList?.data.pagination}
                                    page={page}
                                    pageSize={pageSize}
                                    setPage={setPage}
                                    setPageSize={setPageSize}
                                    refetch={invoiceRefetch}
                                    totalRecords={invoiceList?.data.pagination.totalRecords}
                                    isShow={true} />
                            </Grid>
                        </GridSearchSection>
                    </>
                )}
            </Wrapper>
            <ConfirmDialog
                open={visibleConfirmationDialog}
                title={title}
                message={msg}
                confirmText={t('button.confirm')}
                cancelText={t('button.cancel')}
                onConfirm={() => {
                    if (action === 'CANCEL') {
                        cancelBillingFunction(selectedBilling?.id);
                    }
                    setVisibleConfirmationDialog(false);
                }}
                onCancel={() => setVisibleConfirmationDialog(false)}
                isShowCancelButton={true}
                isShowConfirmButton={true}
            ></ConfirmDialog>
            <ConfirmCustomerPaymentDialog
                open={openConfirmCustomerPaymentDialog}
                customer={selectedBilling?.customer}
                billingNote={selectedBilling}
                onClose={(val: boolean) => {
                    if (val) {
                        invoiceRefetch();
                    }
                    setSelectedBilling(null);
                    setOpenConfirmCustomerPaymentDialog(false);
                }}
            />
            <ViewOptionDialog
                open={openViewDialog}
                title={viewTitle}
                onClose={() => {
                    setSelectedReceipts([]);
                    setOpenViewDialog(false)
                }}
                onConfirm={(options) => {
                    if (viewType === 'BILLING') {
                        if (selectedBilling) {
                            viewBillingFunction(selectedBilling.id, options);
                        }
                    } else if (viewType === 'RECEIPT') {
                        if (selectedBilling && selectedReceipts) {
                            viewBillingReceiptFunction(selectedReceipts, options);
                        }
                    }
                    setPrintCopy(options.copy);
                    setPrintOriginal(options.original);
                    setOpenViewDialog(false);
                }}
            >
                {viewType === 'RECEIPT' && (
                    <Box>
                        <Typography
                            variant="subtitle1"
                            fontWeight={600}
                        >
                            {t('billingManagement.receiptList')}
                        </Typography>

                        <FormGroup>
                            <Stack spacing={1}>
                                {selectedBilling?.billingNoteItems
                                    ?.filter(item =>
                                        ['PAID', 'OVERPAID'].includes(item.invoice?.paymentStatus)
                                    )
                                    ?.flatMap(item =>
                                        (item.invoice?.receipts || []).map(receipt => ({
                                            invoiceNo: item.invoice.invoiceNo,
                                            invoiceDate: item.invoice.invoiceDate,
                                            paidAmount: receipt.amount,
                                            receiptNo: receipt.receiptNo
                                        }))
                                    )
                                    ?.map(receipt => (
                                        <FormControlLabel
                                            key={receipt.invoiceNo}
                                            control={
                                                <Checkbox
                                                    checked={selectedReceipts.includes(receipt.invoiceNo)}
                                                    onChange={() =>
                                                        handleToggleReceipt(receipt.invoiceNo)
                                                    }
                                                />
                                            }
                                            label={
                                                <Typography variant="body2">
                                                    {formatDateStringWithPattern(
                                                        receipt.invoiceDate,
                                                        DEFAULT_DATE_FORMAT
                                                    )}{' '}
                                                    ยอดเงิน {formatMoney(receipt.paidAmount)}
                                                </Typography>
                                            }
                                        />
                                    ))}
                            </Stack>
                        </FormGroup>
                    </Box>
                )}
            </ViewOptionDialog>
        </Page>
    )
}