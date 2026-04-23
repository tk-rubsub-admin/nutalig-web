/* eslint-disable prettier/prettier */
import { Search, DisabledByDefault, AddCircle, Edit, Preview, Description, Close, AccountBalance, ReceiptLong } from "@mui/icons-material";
import { Autocomplete, Box, Button, Checkbox, Chip, CircularProgress, FormControlLabel, FormGroup, Grid, IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { makeStyles } from "@mui/styles";
import DatePicker from "components/DatePicker";
import PageTitle from "components/PageTitle";
import Paginate from "components/Paginate";
import { GridSearchSection, TextLineClamp, Wrapper } from "components/Styled";
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
import { cancelBilling, searchBilling, viewBilling, viewBillingReceipt } from "services/Billing/billing-api";
import { BillingNoteDto, SearchBillingNoteRequest } from "services/Billing/billing-type";
import { getAllCustomer } from "services/Customer/customer-api";
import { Customer } from "services/Customer/customer-type";
import { base64ToBlob, DEFAULT_DATE_FORMAT, DEFAULT_DATE_FORMAT_2, DEFAULT_DATE_FORMAT_BFF, formatDateStringWithPattern, formatMoney } from "utils";
import ViewBillingDialog from "./ViewBillingDialog";
import { getStatusChipSx } from "components/StatusChip";
import ConfirmDialog from "components/ConfirmDialog";
import ConfirmCustomerPaymentDialog from "./ConfirmCustomerPaymentDialog";
import ViewBillingReceiptDialog from "./ViewBillingReceiptDialog";
import ViewOptionDialog from "components/ViewOptionDialog";
import { DownloadDocumentResponse } from "services/general-type";
import { downloadAllReceipt, viewAllReceipt } from "services/Invoice/invoice-api";
import ViewReceiptDialog from "pages/InvoiceManagement/ViewReceiptDialog";

export default function BillingManagement() {
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

    const defaultFilter: SearchBillingNoteRequest = {
        billingDate: "",
        billingStatusIn: [],
        billingStatusEqual: null,
        customerIdEqual: ""
    }
    const [billingFilter, setBillingFilter] = useState<SearchBillingNoteRequest>({ ...defaultFilter });

    const {
        data: billingNoteList,
        refetch: billingRefetch,
        isFetching: isBillingFetching
    } = useQuery('billing-note-list', () => searchBilling(billingFilter, page, pageSize), {
        refetchOnWindowFocus: false
    });
    const { data: customerList, isFetching: isCustomerFetching } = useQuery(
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
    const searchFormik = useFormik({
        initialValues: defaultFilter,
        enableReinitialize: true,
        onSubmit: (values) => {
            const updateObj = { ...values } as unknown as SearchBillingNoteRequest;
            setBillingFilter(updateObj);
            setPage(1);
        }
    });

    const billingData = (!isBillingFetching &&
        billingNoteList &&
        billingNoteList.data.billingNotes.length > 0 &&
        billingNoteList.data.billingNotes.map((bl: BillingNoteDto) => {
            return (
                <>
                    <TableRow
                        hover
                        id={`billing_note__index-${bl.id}`}
                        key={bl.id}
                    >
                        <TableCell align={!bl.billingDate ? "center" : "left"}>
                            <TextLineClamp>
                                {bl.billingDate ? dayjs(bl.billingDate).format('DD/MM/YYYY') : '-'}
                            </TextLineClamp>
                        </TableCell>
                        <TableCell align={!bl.billingNo ? "center" : "left"}>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <TextLineClamp>{bl.billingNo ? bl.billingNo : '-'}</TextLineClamp>
                            </Stack>
                        </TableCell>
                        <TableCell align="left">
                            <TextLineClamp>
                                {bl.customer.customerName}
                            </TextLineClamp>
                        </TableCell>
                        <TableCell align={"center"}>
                            <Chip
                                color="info"
                                label={t(`status.billing.${bl.status}`)}
                                sx={{ ...getStatusChipSx(bl.status), }}
                            />
                        </TableCell>
                        <TableCell align="right">
                            <TextLineClamp>
                                {formatMoney(bl.totalAmount)}
                            </TextLineClamp>
                        </TableCell>
                        <TableCell align="center">
                            <Tooltip title={t('billingManagement.editBilling')} arrow>
                                < IconButton
                                    size="small"
                                    onClick={() => history.push(`/billing-note/${bl.id}`)}
                                >
                                    <Edit />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={t('billingManagement.cancel')} arrow>
                                < IconButton
                                    size="small"
                                    disabled={bl.status === 'CANCELLED' || bl.status === 'COMPLETED'}
                                    color="error"
                                    onClick={() => {
                                        setAction("CANCEL");
                                        setTitle(t('billingManagement.cancelBillingTitle'));
                                        setMsg(t('billingManagement.cancelBillingMsg', { billingNo: bl.billingNo }));
                                        setSelectedBilling(bl);
                                        setVisibleConfirmationDialog(true);
                                    }}
                                >
                                    <Close />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={t('billingManagement.viewBilling')} arrow>
                                <IconButton
                                    disabled={bl.status === 'CANCELLED'}
                                    onClick={() => {
                                        setSelectedBilling(bl);
                                        setViewTitle(t('billingManagement.viewBillingTitle', { billingNo: selectedBilling?.billingNo }))
                                        setViewType('BILLING')
                                        setOpenViewDialog(true);
                                    }}
                                    component="span">
                                    <Description />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={t('billingManagement.confirmTransfer')} arrow>
                                <IconButton
                                    onClick={() => {
                                        setSelectedBilling(bl);
                                        setOpenConfirmCustomerPaymentDialog(true);
                                    }}
                                    disabled={bl.status === 'COMPLETED'}
                                    component="span">
                                    <AccountBalance />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={t('billingManagement.viewReceipt')} arrow>
                                <IconButton
                                    onClick={() => {
                                        setSelectedBilling(bl);
                                        // viewBillingReceiptFunction(bl.id);
                                        setViewTitle(t('billingManagement.viewBillingReceiptTitle'))
                                        setViewType('RECEIPT')
                                        setOpenViewDialog(true);
                                    }}
                                    disabled={bl.status !== 'COMPLETED'}
                                    component="span">
                                    <ReceiptLong />
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

    const billingMobileData = (!isBillingFetching &&
        billingNoteList &&
        billingNoteList.data.billingNotes.length > 0 &&
        billingNoteList.data.billingNotes.map((bl: BillingNoteDto) => {

            return (
                <>
                    <TableRow
                        hover
                        id={`billing-note-${bl.id}`}
                        key={bl.id}
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
                                        {bl.billingNo}
                                    </Typography>
                                    <Typography variant="body2">
                                        {bl.customer?.customerName ?? '-'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        วันที่ {dayjs(bl.billingDate).format('DD/MM/YYYY')}
                                    </Typography>
                                    <Typography variant="body2">
                                        ยอดรวมสุทธิ {formatMoney(bl.totalAmount)}
                                    </Typography>
                                </Stack>
                                <Stack spacing={0.3}>
                                    <Tooltip title={t('billingManagement.editBilling')} arrow>
                                        < IconButton
                                            size="small"
                                            onClick={() => history.push(`/billing-note/${bl.id}`)}
                                        >
                                            <Edit />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={t('billingManagement.cancel')} arrow>
                                        < IconButton
                                            size="small"
                                            disabled={bl.status === 'CANCELLED'}
                                            color="error"
                                            onClick={() => {
                                                setAction("CANCEL");
                                                setTitle(t('billingManagement.cancelBillingTitle'));
                                                setMsg(t('billingManagement.cancelBillingMsg', { billingNo: bl.billingNo }));
                                                setSelectedBilling(bl);
                                                setVisibleConfirmationDialog(true);
                                            }}
                                        >
                                            <Close />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={t('billingManagement.viewBilling')} arrow>
                                        <IconButton
                                            disabled={bl.status === 'CANCELLED'}
                                            onClick={() => {
                                                setSelectedBilling(bl);
                                                setViewTitle(t('billingManagement.viewBillingTitle', { billingNo: selectedBilling?.billingNo }))
                                                setViewType('BILLING')
                                                setOpenViewDialog(true);
                                            }}
                                            component="span">
                                            <Description />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={t('billingManagement.confirmTransfer')} arrow>
                                        <IconButton
                                            onClick={() => {
                                                setSelectedBilling(bl);
                                                setOpenConfirmCustomerPaymentDialog(true);
                                            }}
                                            disabled={bl.status === 'COMPLETED'}
                                            component="span">
                                            <AccountBalance />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={t('billingManagement.viewReceipt')} arrow>
                                        <IconButton
                                            onClick={() => {
                                                setSelectedBilling(bl);
                                                // viewBillingReceiptFunction(bl.id);
                                                setViewTitle(t('billingManagement.viewBillingReceiptTitle'))
                                                setViewType('RECEIPT')
                                                setOpenViewDialog(true);
                                            }}
                                            disabled={bl.status !== 'COMPLETED'}
                                            component="span">
                                            <ReceiptLong />
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
                billingRefetch();
                return t('toast.success');
            },
            error: () => {
                return t('toast.failed');
            }
        });
    }

    useEffect(() => {
        if (!isBillingFetching && billingNoteList?.data.pagination) {
            setPage(billingNoteList.data.pagination.page);
            setPageSize(billingNoteList.data.pagination.size);
            setPages(billingNoteList.data.pagination.totalPage);
        }
    }, [billingNoteList]);

    useEffect(() => {
        billingRefetch();
    }, [billingFilter, pages, page, pageSize]);

    useEffect(() => {
        return () => {
            if (pdfUrl) {
                window.URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [pdfUrl]);

    return (
        <Page>
            <PageTitle title={t('billingManagement.title')} />
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
                        onClick={() => history.push(ROUTE_PATHS.BILLING_CREATE)}
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
                    <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}>
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
                    </Grid>
                    <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}>
                        <DatePicker
                            className={classes.datePickerFromTo}
                            fullWidth
                            inputVariant="outlined"
                            InputLabelProps={{ shrink: true }}
                            label={t('billingManagement.column.billingDate')}
                            name="billingDate"
                            format={DEFAULT_DATE_FORMAT}
                            value={searchFormik.values.billingDate || null}
                            onChange={(date) => {
                                if (date !== null) {
                                    searchFormik.setFieldValue('billingDate', dayjs(date.toDate()).startOf('day').format(DEFAULT_DATE_FORMAT_BFF));
                                    searchFormik.handleSubmit();
                                } else {
                                    searchFormik.setFieldValue('billingDate', '');
                                }
                            }}
                        />
                    </Grid>
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
                                    {isBillingFetching ? (
                                        <TableBody>
                                            <TableRow>
                                                <TableCell colSpan={1} align="center">
                                                    <CircularProgress />
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    ) : (
                                        <TableBody>{billingMobileData}</TableBody>
                                    )}
                                </Table>
                            </TableContainer>
                        </GridSearchSection>
                        <GridSearchSection container>
                            <Grid item xs={12}>
                                <Paginate
                                    pagination={billingNoteList?.data.pagination}
                                    page={page}
                                    pageSize={pageSize}
                                    setPage={setPage}
                                    setPageSize={setPageSize}
                                    refetch={billingRefetch}
                                    totalRecords={billingNoteList?.data.pagination.totalRecords}
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
                                                    width: 180,
                                                    maxWidth: 180,
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
                                                    width: 250,
                                                    maxWidth: 250,
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
                                    {isBillingFetching ? (
                                        <TableBody>
                                            <TableRow>
                                                <TableCell colSpan={6} align="center">
                                                    <CircularProgress />
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    ) : (
                                        <TableBody>{billingData}</TableBody>
                                    )}
                                </Table>
                            </TableContainer>
                        </GridSearchSection>
                        <GridSearchSection container>
                            <Grid item xs={12}>
                                <Paginate
                                    pagination={billingNoteList?.data.pagination}
                                    page={page}
                                    pageSize={pageSize}
                                    setPage={setPage}
                                    setPageSize={setPageSize}
                                    refetch={billingRefetch}
                                    totalRecords={billingNoteList?.data.pagination.totalRecords}
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
            <ViewBillingDialog
                open={openViewBillingDialog}
                url={pdfUrl}
                billingNo={selectedBilling?.billingNo}
                billingNote={selectedBilling}
                options={{ original: printOriginal, copy: printCopy }}
                onClose={() => {
                    setOpenViewBillingDialog(false)
                    setPrintOriginal(true); // default
                    setPrintCopy(false);
                }}
            />
            <ViewBillingReceiptDialog
                open={openViewBillingReceiptDialog}
                url={pdfUrl}
                receiptNos={selectedReceipts}
                billingNote={selectedBilling}
                options={{ original: printOriginal, copy: printCopy }}
                onClose={() => {
                    setSelectedReceipts([]);
                    setPrintOriginal(true); // default
                    setPrintCopy(false);
                    setOpenViewBillingReceiptDialog(false);
                }}
            />
            <ConfirmCustomerPaymentDialog
                open={openConfirmCustomerPaymentDialog}
                customer={selectedBilling?.customer}
                billingNote={selectedBilling}
                onClose={(val: boolean) => {
                    if (val) {
                        billingRefetch();
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