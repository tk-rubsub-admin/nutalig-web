/* eslint-disable prettier/prettier */
import { Search, DisabledByDefault, AccountBalance, AssuredWorkload, RemoveCircle, CheckCircle, Edit, Description, ReceiptLong, FileDownload } from '@mui/icons-material';
import { Grid, Typography, Button, Autocomplete, TextField, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip, Stack, useTheme, useMediaQuery, Checkbox, Box, FormControlLabel, FormGroup } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useAuth } from 'auth/AuthContext';
import PageTitle from 'components/PageTitle';
import DatePicker from 'components/DatePicker';
import { GridSearchSection, GridTextField, TextLineClamp, Wrapper } from 'components/Styled';
import { useFormik } from 'formik';
import dayjs from 'dayjs';
import { Page } from 'layout/LayoutRoute';
import { useEffect, useMemo, useState } from 'react';
import { isMobileOnly } from 'react-device-detect';
import { useTranslation } from 'react-i18next';
import { Link, useHistory } from 'react-router-dom';
import { base64ToBlob, DEFAULT_DATE_FORMAT, DEFAULT_DATE_FORMAT_BFF, formatDateStringWithPattern, formatMoney } from 'utils';
import { Invoice, SearchInvoiceRequest } from 'services/Invoice/invoice-type';
import { useQuery } from 'react-query';
import { downloadInvoiceList, downloadReceiptList, searchInvoice, viewAllReceipt, viewInvoice, viewReceipt } from 'services/Invoice/invoice-api';
import Paginate from 'components/Paginate';
import toast from 'react-hot-toast';
import LoadingDialog from 'components/LoadingDialog';
import ConfirmPaymentDialog from './ConfirmPaymentDialog';
import { getAllCustomer } from 'services/Customer/customer-api';
import { Customer } from 'services/Customer/customer-type';
import ViewInvoiceDialog from './ViewInvoiceDialog';
import { ROUTE_PATHS } from 'routes';
import { paymentStatus } from 'services/SaleOrder/sale-order-type';
import ViewReceiptDialog from './ViewReceiptDialog';
import ConfirmCustomerPaymentDialog from './ConfirmCustomerPaymentDialog';
import ViewOptionDialog from 'components/ViewOptionDialog';
import { DownloadDocumentResponse } from 'services/general-type';

export default function InvoiceManagement() {
    const { t } = useTranslation();
    const { getRole } = useAuth();
    const theme = useTheme();
    const auth = useAuth();
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
    const history = useHistory();
    const [page, setPage] = useState<number>(1);
    const [pages, setPages] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [openLoading, setOpenLoading] = useState(false);
    const [openViewInvoiceDialog, setOpenViewInvoiceDialog] = useState(false);
    const [openViewReceiptDialog, setOpenViewReceiptDialog] = useState(false);
    const [openConfirmPaymentDialog, setOpenConfirmPaymentDialog] = useState(false);
    const [openConfirmCustomerPaymentDialog, setOpenConfirmCustomerPaymentDialog] = useState(false);
    const [openViewDialog, setOpenViewDialog] = useState(false);
    const [printOriginal, setPrintOriginal] = useState(true);
    const [printCopy, setPrintCopy] = useState(false);
    const [viewDialogTitle, setViewDialogTitle] = useState('');
    const [viewDoc, setViewDoc] = useState('');
    const [showOutstanding, setShowOutstanding] = useState(false);
    const [outStandingBalance, setOutStandingBalance] = useState<number>(0);
    const [showBulkConfirmButton, setShowBulkConfirmButton] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice>();
    const [selectedInvoiceList, setSelectedInvoiceList] = useState<Invoice[]>([]);
    const [selectedReceipts, setSelectedReceipts] = useState<string[]>([]);
    const [pdfUrl, setPdfUrl] = useState('');
    const [invNo, setInvNo] = useState('');
    const today = dayjs();
    const advanceDays = auth.getAdvanceSODays();

    const defaultFilter: SearchInvoiceRequest = {
        invoiceDate: '',
        poStatusIn: [],
        poStatusEqual: null,
        billingStatusIn: ['เปิดบิลแล้ว', 'ยังไม่ได้เปิดบิล'],
        billingStatusEqual: '',
        customerIdEqual: '',
        paymentStatusEqual: null,
        paymentStatusIn: [],
        // invoiceDateStart: today.subtract(advanceDays, 'day').startOf('day').format(DEFAULT_DATE_FORMAT_BFF),
        // invoiceDateEnd: today.endOf('day').format(DEFAULT_DATE_FORMAT_BFF),
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
    } = useQuery('invoice-list', () => searchInvoice(invoiceFilter, page, pageSize, 'invoiceDate'), {
        refetchOnWindowFocus: false
    });

    const searchFormik = useFormik({
        initialValues: defaultFilter,
        enableReinitialize: true,
        onSubmit: (values) => {
            console.log(values);
            const updateObj = { ...values } as unknown as SearchInvoiceRequest;
            setInvoiceFilter(updateObj);
            setPage(1);
        }
    });

    const isInvoiceSelected = (poId: string) =>
        selectedInvoiceList.some(inv => inv.poId === poId);

    const toggleInvoiceSelection = (inv: Invoice, checked: boolean) => {
        setSelectedInvoiceList(prev => {
            if (checked) {
                // add
                return prev.some(i => i.poId === inv.poId)
                    ? prev
                    : [...prev, inv];
            }
            // remove
            return prev.filter(i => i.poId !== inv.poId);
        });
    };

    const viewReceiptListFunction = (id: string, receiptNos: string[], options: { original: boolean; copy: boolean }) => {
        setOpenLoading(true);
        toast.promise(downloadReceiptList(id, receiptNos, options.original, options.copy), {
            loading: t('toast.loading'),
            success: (response) => {
                const data = response.data as {
                    format: 'PDF' | 'JPG';
                    files: {
                        fileName: string;
                        base64: string;
                    }[];
                };

                const file = data.files[0];
                const blob = base64ToBlob(file.base64, 'application/pdf');
                const url = window.URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = file.fileName;
                link.click();

                window.URL.revokeObjectURL(url);

                return t('toast.success');
            },
            error: (error) => {
                console.log(error)
                return t('toast.failed');
            }
        }).finally(() => {
            setOpenLoading(false);
        });
    };

    const invoiceMobileData = (!isInvoiceFetching &&
        invoiceList &&
        invoiceList.data.invoices.length > 0 &&
        invoiceList.data.invoices.map((inv: Invoice) => {
            const diff = inv.poAmount - inv.invoiceAmount;
            const disabled = ['PAID', 'OVERPAID'].includes(inv.paymentStatus);
            return (
                <TableRow hover key={inv.poId}>
                    <TableCell sx={{ pt: 2, pb: 2 }}>
                        <Checkbox
                            size="small"
                            // disabled={disabled}
                            checked={isInvoiceSelected(inv.poId)}
                            onChange={(e) =>
                                toggleInvoiceSelection(inv, e.target.checked)
                            }
                        />
                    </TableCell>
                    <TableCell sx={{ pt: 2, pb: 2 }}>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ width: '100%' }}
                        >
                            <Stack spacing={1}>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Typography variant="body1" fontWeight={600}>
                                        {inv.invoiceNo}
                                    </Typography>
                                </Stack>

                                <Typography variant="body2">
                                    {inv.customer?.displayName ?? '-'}
                                </Typography>

                                <Typography variant="body2" color="text.secondary">
                                    วันที่ {dayjs(inv.invoiceDate).format('DD/MM/YYYY HH:mm')}
                                </Typography>

                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Typography variant="body1" fontWeight={600}>
                                        ชำระแล้ว {formatMoney(inv.invoiceAmount)}
                                    </Typography>
                                    {inv.paymentStatus === 'UNPAID' ? (
                                        <RemoveCircle sx={{ fontSize: 18 }} />
                                    ) : inv.paymentStatus === 'PARTIALLY_PAID' ? (
                                        <RemoveCircle color="warning" sx={{ fontSize: 18 }} />
                                    ) : (
                                        <CheckCircle color="success" sx={{ fontSize: 18 }} />
                                    )}
                                </Stack>

                                {diff !== 0 && (
                                    <Typography
                                        variant="body2"
                                        color={diff < 0 ? 'error' : 'text.primary'}
                                    >
                                        {diff < 0
                                            ? `ยอดชำระเกิน ${formatMoney(Math.abs(diff))}`
                                            : `ค้างชำระ ${formatMoney(diff)}`}
                                    </Typography>
                                )}
                            </Stack>

                            {/* Actions */}
                            <Stack spacing={0.3}>
                                <Tooltip title={t('invoiceManagement.editInvoice')} arrow>
                                    <IconButton
                                        size="small"
                                        component={Link}
                                        to={{
                                            pathname: ROUTE_PATHS.NEW_INVOICE,
                                            state: { invoice: inv },
                                        }}
                                    >
                                        <Edit />
                                    </IconButton>
                                </Tooltip>

                                {!disabled && (
                                    <Tooltip
                                        title={t('invoiceManagement.outstandingBalance')}
                                        arrow
                                    >
                                        <IconButton
                                            onClick={() => {
                                                setSelectedInvoice(inv);
                                                setOpenConfirmPaymentDialog(true);
                                            }}
                                        >
                                            <AccountBalance />
                                        </IconButton>
                                    </Tooltip>
                                )}

                                {inv.poAmount > 0 && (
                                    <Tooltip
                                        title={t('invoiceManagement.viewInvoice')}
                                        arrow
                                    >
                                        <IconButton
                                            onClick={() => {
                                                setSelectedInvoice(inv);
                                                setPrintOriginal(true); // default
                                                setPrintCopy(false);
                                                setViewDialogTitle(t('invoiceManagement.invoiceNoTitle', { invoiceNo: inv.invoiceNo }));
                                                setViewDoc('INVOICE')
                                                setOpenViewDialog(true);
                                            }}
                                        >
                                            <Description />
                                        </IconButton>
                                    </Tooltip>
                                )}

                                {['PAID', 'OVERPAID'].includes(inv.paymentStatus) && (
                                    <Tooltip
                                        title={t('invoiceManagement.viewReceipt')}
                                        arrow
                                    >
                                        <IconButton
                                            onClick={() => {
                                                setSelectedInvoice(inv);
                                                setPrintOriginal(true); // default
                                                setPrintCopy(false);
                                                setViewDialogTitle(t('invoiceManagement.receiptNoTitle', { receiptNo: inv.receiptNo }));
                                                setViewDoc('RECEIPT')
                                                setOpenViewDialog(true);
                                            }}
                                        >
                                            <ReceiptLong />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Stack>
                        </Stack>
                    </TableCell>
                </TableRow>
            );
        })) || (
            <TableRow>
                <TableCell>
                    <div className={classes.noResultMessage}>
                        {t('warning.noResultList')}
                    </div>
                </TableCell>
            </TableRow>
        );

    const invoiceData = (!isInvoiceFetching &&
        invoiceList &&
        invoiceList.data.invoices.length > 0 &&
        invoiceList.data.invoices.map((inv: Invoice) => {
            const diff = inv.poAmount - inv.invoiceAmount;
            return (
                <>
                    <TableRow
                        hover
                        id={`invoice__index-${inv.poId}`}
                        key={inv.poId}
                    >
                        <TableCell padding="checkbox">
                            <Checkbox
                                // disabled={['PAID', 'OVERPAID'].includes(inv.paymentStatus)}
                                checked={isInvoiceSelected(inv.poId)}
                                onChange={(e) =>
                                    toggleInvoiceSelection(inv, e.target.checked)
                                }
                            />
                        </TableCell>
                        <TableCell align={!inv.invoiceDate ? "center" : "left"}>
                            <TextLineClamp>
                                {inv.invoiceDate ? dayjs(inv.invoiceDate).format('DD/MM/YYYY HH:mm') : '-'}
                            </TextLineClamp>
                        </TableCell>
                        <TableCell align={!inv.invoiceNo ? "center" : "left"}>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                {['ISSUED', 'PAID', 'PARTIALLY_PAID'].includes(inv.invoiceStatus) && (
                                    <CheckCircle color="success" sx={{ fontSize: 18 }} />
                                )}

                                {inv.invoiceStatus === 'DRAFT' &&
                                    inv.orderStatus === 'ORDER_CONFIRMED' && (
                                        <RemoveCircle sx={{ fontSize: 18 }} />
                                    )}

                                <TextLineClamp>
                                    {inv.invoiceNo ? inv.invoiceNo : '-'}
                                </TextLineClamp>
                            </Stack>
                        </TableCell>
                        <TableCell align="left">
                            <TextLineClamp>
                                {inv.customer.displayName}
                            </TextLineClamp>
                        </TableCell>
                        <TableCell align="left">
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                {inv.paymentStatus === 'UNPAID' ? (
                                    <RemoveCircle sx={{ fontSize: 18 }} />
                                ) : inv.paymentStatus === 'PARTIALLY_PAID' ? (
                                    <RemoveCircle color="warning" sx={{ fontSize: 18 }} />
                                ) : (
                                    <CheckCircle color="success" sx={{ fontSize: 18 }} />
                                )}
                                <TextLineClamp>
                                    {formatMoney(inv.invoiceAmount)}
                                </TextLineClamp>
                            </Stack>
                        </TableCell>
                        <TableCell align="left">
                            <TextLineClamp>
                                {diff < 0 ? (
                                    <Typography>{formatMoney(0)}</Typography>
                                ) : (
                                    <Typography>{formatMoney(diff)}</Typography>
                                )}
                            </TextLineClamp>
                        </TableCell>
                        <TableCell align="left">
                            <Tooltip title={t('invoiceManagement.editInvoice')} arrow>
                                <IconButton
                                    size="small"
                                    onClick={() => history.push(`/invoice/${inv.invoiceNo}`)}
                                >
                                    <Edit />
                                </IconButton>
                            </Tooltip>
                            {inv.paymentStatus === 'PAID' ? (
                                <Tooltip title={t('invoiceManagement.confirmPaid')} arrow>
                                    <IconButton component="span">
                                        <AssuredWorkload color="success" />
                                    </IconButton>
                                </Tooltip>
                            ) : inv.paymentStatus === 'OVERPAID' ? (
                                <Tooltip title={t('invoiceManagement.confirmPaid')} arrow>
                                    <IconButton component="span">
                                        <AssuredWorkload color="success" />
                                    </IconButton>
                                </Tooltip>
                            ) : inv.paymentStatus === 'PARTIALLY_PAID' ? (
                                <Tooltip title={t('invoiceManagement.outstandingBalance')} arrow>
                                    <IconButton
                                        onClick={() => {
                                            setSelectedInvoice(inv);
                                            setOpenConfirmPaymentDialog(true);
                                        }}
                                        component="span">
                                        <AccountBalance />
                                    </IconButton>
                                </Tooltip>
                            ) : inv.invoiceStatus !== 'DRAFT' ? (
                                <label htmlFor={`upload-button-${inv.poId}`}>
                                    <Tooltip title={t('purchaseOrder.confirmTransfer')} arrow>
                                        <IconButton
                                            onClick={() => {
                                                setSelectedInvoice(inv);
                                                setOpenConfirmPaymentDialog(true);
                                            }}
                                            component="span">
                                            <AccountBalance />
                                        </IconButton>
                                    </Tooltip>
                                </label>
                            ) : <></>}
                            {inv.poAmount > 0 ?
                                <Tooltip title={t('invoiceManagement.viewInvoice')} arrow>
                                    <IconButton
                                        onClick={() => {
                                            setSelectedInvoice(inv);
                                            setPrintOriginal(true); // default
                                            setPrintCopy(false);
                                            setViewDialogTitle(t('invoiceManagement.invoiceNoTitle', { invoiceNo: inv.invoiceNo }));
                                            setViewDoc('INVOICE')
                                            setOpenViewDialog(true);
                                        }}
                                        component="span">
                                        <Description />
                                    </IconButton>
                                </Tooltip>
                                : <></>
                            }
                            {['PAID', 'OVERPAID'].includes(inv.paymentStatus) ?
                                <>
                                    <Tooltip title={t('invoiceManagement.viewReceipt')} arrow>
                                        <IconButton
                                            onClick={() => {
                                                setSelectedInvoice(inv);
                                                setPrintOriginal(true);
                                                setPrintCopy(false);
                                                setViewDialogTitle(t('invoiceManagement.receiptNoTitle', { receiptNo: inv.receiptNo }));
                                                setViewDoc('RECEIPT')
                                                setOpenViewDialog(true);
                                            }}
                                            component="span">
                                            <ReceiptLong />
                                        </IconButton>
                                    </Tooltip>
                                </> :
                                <>
                                </>
                            }
                        </TableCell>
                    </TableRow>
                </>
            );
        })) || (
            <TableRow>
                <TableCell colSpan={7}>
                    <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
                </TableCell>
            </TableRow>
        );

    const viewInvoiceFunction = (inv: Invoice, options: { original: boolean; copy: boolean }) => {
        toast.promise(viewInvoice(inv.invoiceNo, options.original, options.copy), {
            loading: t('toast.loading'),
            success: (response) => {
                const data = response.data as DownloadDocumentResponse;

                if (!data.files?.length) {
                    throw new Error('No file');
                }

                const file = data.files[0]; // PDF มีไฟล์เดียว

                const blob = base64ToBlob(file.base64, file.contentType);
                const url = URL.createObjectURL(blob);
                setSelectedInvoice(inv);
                setInvNo(inv.invoiceNo);
                setPdfUrl(url);
                setOpenViewInvoiceDialog(true);
                return t('toast.success');
            },
            error: () => {
                return t('toast.failed');
            }
        });
    };

    const viewReceiptFunction = (inv: Invoice, ids: string[], options: { original: boolean; copy: boolean }) => {
        toast.promise(viewReceipt(inv.invoiceNo, ids, options.original, options.copy), {
            loading: t('toast.loading'),
            success: (response) => {
                const data = response.data as DownloadDocumentResponse;

                if (!data.files?.length) {
                    throw new Error('No file');
                }

                const file = data.files[0]; // PDF มีไฟล์เดียว

                const blob = base64ToBlob(file.base64, file.contentType);
                const url = URL.createObjectURL(blob);
                setSelectedInvoice(inv);
                setPdfUrl(url);
                setOpenViewReceiptDialog(true);
                return t('toast.success');
            },
            error: () => {
                return t('toast.failed');
            }
        });
    };

    const downloadInvoiceListFunction = (invoiceList: Invoice[], options: { original: boolean; copy: boolean }) => {
        setOpenLoading(true);
        toast.promise(downloadInvoiceList(invoiceList.map(inv => inv.poId), options.original, options.copy), {
            loading: t('toast.loading'),
            success: (response) => {
                const data = response.data as {
                    format: 'PDF' | 'JPG';
                    files: {
                        fileName: string;
                        base64: string;
                    }[];
                };

                const file = data.files[0];
                const blob = base64ToBlob(file.base64, 'application/pdf');
                const url = window.URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = file.fileName;
                link.click();

                window.URL.revokeObjectURL(url);
                return t('toast.success');
            },
            error: (error) => {
                console.log(error)
                return t('toast.failed');
            },
        }).finally(() => {
            setOpenLoading(false);
        });
    };

    const downloadReceiptListFunction = (invoiceList: Invoice[], options: { original: boolean; copy: boolean }) => {
        setOpenLoading(true);
        toast.promise(viewAllReceipt(invoiceList.filter(inv => ['OVERPAID', 'PAID'].includes(inv.paymentStatus)).map(inv => inv.invoiceNo), options.original, options.copy), {
            loading: t('toast.loading'),
            success: (response) => {
                const data = response.data as {
                    format: 'PDF' | 'JPG';
                    files: {
                        fileName: string;
                        base64: string;
                    }[];
                };

                const file = data.files[0];
                const blob = base64ToBlob(file.base64, 'application/pdf');
                const url = window.URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = file.fileName;
                link.click();

                window.URL.revokeObjectURL(url);

                return t('toast.success');
            },
            error: (error) => {
                console.log(error)
                return t('toast.failed');
            }
        }).finally(() => {
            setOpenLoading(false);
        });
    };

    const handleToggleReceipt = (receiptNo: string) => {
        setSelectedReceipts(prev =>
            prev.includes(receiptNo)
                ? prev.filter(r => r !== receiptNo)
                : [...prev, receiptNo]
        );
    };

    const creditBalance = useMemo(() => {
        if (!invoiceList?.data?.invoices?.length) return 0;
        return invoiceList.data.invoices[0].customer?.creditBalance ?? 0;
    }, [invoiceList]);

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

    useEffect(() => {
        if (!showOutstanding || !invoiceList?.data?.invoices) {
            setOutStandingBalance(0);
            return;
        }

        const totalOutstanding = invoiceList.data.invoices.reduce(
            (sum: number, inv: Invoice) => {
                const diff = inv.poAmount - inv.invoiceAmount;
                return diff > 0 ? sum + diff : sum; // นับเฉพาะยอดค้าง
            },
            0
        );

        setOutStandingBalance(totalOutstanding);
    }, [invoiceList, showOutstanding]);

    return (
        <Page>
            <PageTitle title={t('invoiceManagement.title')} />
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
                        disabled={selectedInvoiceList.length == 0}
                        size="small"
                        variant="contained"
                        className="btn-baby-blue"
                        startIcon={<FileDownload />}
                        // onClick={() => downloadInvoiceListFunction(selectedInvoiceList)}
                        onClick={() => {
                            setPrintOriginal(true); // default
                            setPrintCopy(false);
                            setViewDialogTitle(t('button.download') + t('invoiceManagement.invoice'));
                            setViewDoc('INVOICE_LIST')
                            setOpenViewDialog(true);
                        }}
                    >
                        {t('button.download') + t('invoiceManagement.invoice')}
                    </Button>
                    <Button
                        fullWidth={isDownSm}
                        disabled={selectedInvoiceList.length == 0}
                        size="small"
                        variant="contained"
                        className="btn-green-teal"
                        startIcon={<FileDownload />}
                        // onClick={() => downloadReceiptListFunction(selectedInvoiceList)}
                        onClick={() => {
                            setPrintOriginal(true); // default
                            setPrintCopy(false);
                            setViewDialogTitle(t('button.download') + t('invoiceManagement.receipt'));
                            setViewDoc('RECEIPT_LIST')
                            setOpenViewDialog(true);
                        }}

                    >
                        {t('button.download') + t('invoiceManagement.receipt')}
                    </Button>

                    <Button
                        fullWidth={isDownSm}
                        disabled={selectedInvoiceList.length == 0}
                        size="small"
                        variant="contained"
                        className={showBulkConfirmButton ? "btn-pastel-yellow" : classes.hideObject}
                        startIcon={<AccountBalance />}
                        onClick={() =>
                            setOpenConfirmCustomerPaymentDialog(true)}
                    >
                        {t('invoiceManagement.confirmPayment')}
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
                            setSelectedInvoiceList([]);
                            setSelectedInvoice(null);
                            setShowBulkConfirmButton(false);
                        }}
                    >
                        {t('button.clear')}
                    </Button>
                </Stack>
            </Wrapper>
            <Wrapper>
                <GridSearchSection container spacing={1}>
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
                                    setShowOutstanding(false);
                                    setOutStandingBalance(0);
                                    setShowBulkConfirmButton(false);
                                    searchFormik.handleSubmit();
                                } else {
                                    searchFormik.setFieldValue('customerIdEqual', value?.customerId);
                                    setShowOutstanding(true);
                                    setShowBulkConfirmButton(true);
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
                    <GridTextField item xs={12} sm={2} className={!['SUPER_ADMIN', 'ADMIN_BKK', 'ADMIN_PROVINCE', 'ACCOUNT'].includes(getRole()) ? classes.hideObject : ''}>
                        <Autocomplete
                            options={paymentStatus}
                            getOptionLabel={(option) => t(`status.payment.${option}`)}
                            isOptionEqualToValue={(option, value) => option === value}
                            sx={{ width: '100%' }}
                            value={
                                paymentStatus?.find((status) => status === searchFormik.values.paymentStatusEqual) ||
                                null
                            }
                            onChange={(_event, value, reason) => {
                                if (reason === 'clear') {
                                    searchFormik.setFieldValue(`paymentStatusEqual`, null);
                                } else {
                                    searchFormik.setFieldValue(`paymentStatusEqual`, value);
                                }
                                searchFormik.handleSubmit();
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t('invoiceManagement.column.paymentStatus')}
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{
                                        ...params.inputProps,
                                        readOnly: isMobileOnly ? true : false, // Disable keyboard on mobile
                                    }}
                                />
                            )}
                        />
                    </GridTextField>
                    <GridTextField item xs={0} sm={4} />
                    {showOutstanding && creditBalance > 0 && !isInvoiceFetching && (
                        <GridTextField
                            item
                            xs={6}
                            sm={1}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: 80,
                            }}
                        >
                            <Typography variant="body2" fontWeight={600}>
                                ยอด Credit
                            </Typography>
                            <Typography variant="h3" sx={{ color: '#1976d2' }}>
                                {formatMoney(creditBalance)}
                            </Typography>
                        </GridTextField>
                    )}

                    {showOutstanding && !isInvoiceFetching && (
                        <GridTextField
                            item
                            xs={6}
                            sm={1}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: 80,
                            }}
                        >
                            <Typography variant="body2" fontWeight={600}>
                                ยอดคงค้าง
                            </Typography>
                            <Typography variant="h3" color="error">
                                {formatMoney(outStandingBalance)}
                            </Typography>
                        </GridTextField>
                    )}
                </GridSearchSection>
                {isMobileOnly ? (
                    <>
                        <GridSearchSection container>
                            <TableContainer>
                                <Table id="purchase-order_list___table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell
                                                colSpan={2}
                                                align="center"
                                                key="customerName"
                                                className={classes.tableHeader}
                                            >
                                                {t('purchaseOrder.invoice')}
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    {isInvoiceFetching ? (
                                        <TableBody>
                                            <TableRow>
                                                <TableCell colSpan={2} align="center">
                                                    <CircularProgress />
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    ) : (
                                        <TableBody>{invoiceMobileData}</TableBody>
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
                                <Table id="invoice-list___table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{
                                                width: 20,
                                                maxWidth: 20,
                                                minWidth: 20,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }} className={classes.tableHeader}></TableCell>
                                            <TableCell
                                                align="center"
                                                key="invoiceDate"
                                                sx={{
                                                    width: 180,
                                                    maxWidth: 180,
                                                    minWidth: 100,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                                className={classes.tableHeader}
                                            >
                                                {t('invoiceManagement.column.invoiceDate')}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                key="invoiceNo"
                                                sx={{
                                                    width: 210,
                                                    maxWidth: 210,
                                                    minWidth: 100,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                                className={classes.tableHeader}
                                            >
                                                {t('invoiceManagement.column.invoiceNo')}
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
                                                key="invoiceAmount"
                                                sx={{
                                                    width: 120,
                                                    maxWidth: 120,
                                                    minWidth: 100,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                                className={classes.tableHeader}
                                            >
                                                {t('invoiceManagement.column.transferAmount')}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                key="invoiceAmount"
                                                sx={{
                                                    width: 120,
                                                    maxWidth: 120,
                                                    minWidth: 100,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                                className={classes.tableHeader}
                                            >
                                                {t('invoiceManagement.column.outstandingAmount')}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                key="action"
                                                className={classes.tableHeader}
                                                sx={{
                                                    width: 200,
                                                    maxWidth: 200,
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
                                                <TableCell colSpan={7} align="center">
                                                    <CircularProgress />
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    ) : (
                                        <TableBody>{invoiceData}</TableBody>
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
            <LoadingDialog
                open={openLoading}
            />
            <ConfirmPaymentDialog
                open={openConfirmPaymentDialog}
                inv={selectedInvoice}
                customer={selectedInvoice?.customer}
                onClose={(val: boolean) => {
                    if (val) {
                        invoiceRefetch();
                    }
                    setOpenConfirmPaymentDialog(false);
                }}
            />
            <ConfirmCustomerPaymentDialog
                open={openConfirmCustomerPaymentDialog}
                inv={selectedInvoiceList.filter(inv => !['OVERPAID', 'PAID'].includes(inv.paymentStatus))}
                customer={selectedInvoiceList[0]?.customer}
                onClose={(val: boolean) => {
                    if (val) {
                        invoiceRefetch();
                    }
                    setSelectedInvoiceList([]);
                    setOpenConfirmCustomerPaymentDialog(false);
                }}
            />
            <ViewInvoiceDialog
                open={openViewInvoiceDialog}
                url={pdfUrl}
                invNo={invNo}
                invoice={selectedInvoice}
                options={{ original: printOriginal, copy: printCopy }}
                type='INVOICE'
                onClose={() => setOpenViewInvoiceDialog(false)}
            />
            <ViewReceiptDialog
                open={openViewReceiptDialog}
                url={pdfUrl}
                receiptNo={selectedInvoice?.receiptNo}
                invoice={selectedInvoice}
                options={{ original: printOriginal, copy: printCopy }}
                onClose={() => setOpenViewReceiptDialog(false)}
            />
            <ViewOptionDialog
                open={openViewDialog}
                title={viewDialogTitle}
                onClose={() => setOpenViewDialog(false)}
                onConfirm={(options) => {
                    if (viewDoc === '' || viewDoc === undefined) return;
                    if (viewDoc === 'INVOICE') {
                        viewInvoiceFunction(selectedInvoice, options);
                    } else if (viewDoc === 'RECEIPT') {
                        // viewReceiptFunction(selectedInvoice, selectedReceipts, options);
                        viewReceiptListFunction(selectedInvoice?.invoiceNo, selectedReceipts, options);
                    } else if (viewDoc === 'INVOICE_LIST') {
                        downloadInvoiceListFunction(selectedInvoiceList, options);
                    } else if (viewDoc === 'RECEIPT_LIST') {
                        downloadReceiptListFunction(selectedInvoiceList, options);
                    }
                    console.log(options)
                    setPrintCopy(options.copy);
                    setPrintOriginal(options.original);
                    setOpenViewDialog(false);
                }}
            >
                {viewDoc === 'RECEIPT' && (
                    <Box>
                        <Typography
                            variant="subtitle1"
                            fontWeight={600}
                        >
                            {t('billingManagement.receiptList')}
                        </Typography>

                        <FormGroup>
                            <Stack spacing={1}>
                                {selectedInvoice?.receipts
                                    .filter(item => item.receiptNo)
                                    .map(item => (
                                        <FormControlLabel
                                            key={item.receiptNo}
                                            control={
                                                <Checkbox
                                                    checked={selectedReceipts.includes(item.receiptNo)}
                                                    onChange={() =>
                                                        handleToggleReceipt(item.receiptNo)
                                                    }
                                                />
                                            }
                                            label={
                                                <Typography variant="body2">
                                                    {formatDateStringWithPattern(item.receiptDate, DEFAULT_DATE_FORMAT)}  ยอดเงิน  {formatMoney(item.amount)}
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
    );
}
