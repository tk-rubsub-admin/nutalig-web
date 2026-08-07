/* eslint-disable prettier/prettier */
import { Search, DisabledByDefault, Description, AddCircle } from "@mui/icons-material";
import {
    Button,
    Chip,
    CircularProgress,
    Grid,
    IconButton,
    MenuItem,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme
} from "@mui/material";
import { makeStyles } from '@mui/styles';
import PageTitle from "components/PageTitle";
import Paginate from "components/Paginate";
import { GridSearchSection, GridTextField, Wrapper } from "components/Styled";
import { useFormik } from "formik";
import { Page } from "layout/LayoutRoute";
import { useMemo, useState } from "react";
import { isMobileOnly } from "react-device-detect";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { useHistory } from "react-router-dom";
import { searchQuotation, viewQuotation } from "services/Document/document-api";
import { Quotation, SearchQuotationRequest } from "services/Document/document-type";
import { DownloadDocumentResponse } from "services/general-type";
import { EmployeeRecord } from "services/Employee/employee-type";
import { ROUTE_PATHS } from "routes";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { base64ToBlob } from "utils";
import { getDocumentStatusChipSx, getDocumentStatusLabel } from "utils/documentStatus";
import { formatNumber } from "utils/utils";
import { getSales } from "services/Sales/sales-api";
import { SalesRecord } from "services/Sales/sales-type";
import ViewQuotationDialog from "./ViewQuotationDialog";

function getDefaultDocDateRange() {
    const now = dayjs();

    return {
        docDateStart: now.startOf('month').format('YYYY-MM-DD'),
        docDateEnd: now.endOf('month').format('YYYY-MM-DD')
    };
}

export default function QuotationManagement(): JSX.Element {
    const useStyles = makeStyles({
        noResultMessage: {
            textAlign: 'center',
            fontSize: '1.2em',
            fontWeight: 'bold',
            padding: '48px 0'
        },
        tableHeader: {
            border: '2px solid #e0e0e0',
            fontWeight: 'bold',
            paddingLeft: '10px',
            textAlign: 'center'
        }
    });

    const classes = useStyles();
    const theme = useTheme();
    const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
    const { t } = useTranslation();
    const history = useHistory();

    const defaultFilter: SearchQuotationRequest = {
        docNoEqual: '',
        ...getDefaultDocDateRange(),
        customerIdEqual: '',
        salesId: '',
        statusEqual: null,
        keyword: ''
    };

    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [quotationFilter, setQuotationFilter] = useState<SearchQuotationRequest>(defaultFilter);
    const [openViewDialog, setOpenViewDialog] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const [selectedQuotation, setSelectedQuotation] = useState<Quotation>();

    const { data: salesOptions = [], isFetching: isSalesFetching } = useQuery(
        ['quotation-sales-options'],
        () => getSales(1, 20),
        {
            refetchOnWindowFocus: false
        }
    );

    const {
        data: quotationList,
        refetch: quotationRefetched,
        isFetching: isQuotationFetching
    } = useQuery(
        ['quotation-list', quotationFilter, page, pageSize],
        () => searchQuotation(quotationFilter, page, pageSize),
        {
            refetchOnWindowFocus: false,
            keepPreviousData: true
        }
    );

    const searchFormik = useFormik<SearchQuotationRequest>({
        initialValues: defaultFilter,
        enableReinitialize: false,
        onSubmit: (values) => {
            const nextFilter: SearchQuotationRequest = {
                docNoEqual: values.docNoEqual?.trim() || '',
                docDateStart: values.docDateStart || '',
                docDateEnd: values.docDateEnd || '',
                customerIdEqual: values.customerIdEqual?.trim() || '',
                salesId: values.salesId?.trim() || '',
                statusEqual: values.statusEqual || null,
                keyword: values.keyword?.trim() || ''
            };

            setPage(1);

            if (page === 1 && JSON.stringify(quotationFilter) === JSON.stringify(nextFilter)) {
                quotationRefetched();
                return;
            }

            setQuotationFilter(nextFilter);
        }
    });

    const getEmployeeName = (employee?: EmployeeRecord | null) => {
        if (!employee) {
            return '-';
        }

        const name = [employee.firstNameTh, employee.lastNameTh].filter(Boolean).join(' ').trim();
        console.log(name);
        return name || '-';
    };

    const viewQuotationFunction = (quotation: Quotation) => {
        toast.promise(viewQuotation(quotation.quotationNo, true, false), {
            loading: t('toast.loading'),
            success: (response) => {
                const data = response.data as DownloadDocumentResponse;

                if (!data.files?.length) {
                    throw new Error('No file');
                }

                const file = data.files[0];
                const blob = base64ToBlob(file.base64, file.contentType);
                const url = URL.createObjectURL(blob);

                setSelectedQuotation(quotation);
                setPdfUrl(url);
                setOpenViewDialog(true);

                return t('toast.success');
            },
            error: () => {
                return t('toast.failed');
            }
        });
    };

    const handleClear = () => {
        searchFormik.resetForm();
        setPage(1);

        if (page === 1 && JSON.stringify(quotationFilter) === JSON.stringify(defaultFilter)) {
            quotationRefetched();
            return;
        }

        setQuotationFilter(defaultFilter);
    };

    const openQuotationDetail = (quotationNo: string) => {
        history.push(ROUTE_PATHS.QUOTATION_DETAIL.replace(':id', quotationNo));
    };

    const salesDropdownOptions = useMemo(() => salesOptions, [salesOptions]);

    const quotationRows = useMemo(() => {
        if (!quotationList?.data?.quotationList?.length) {
            return (
                <TableRow>
                    <TableCell colSpan={7}>
                        <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
                    </TableCell>
                </TableRow>
            );
        }

        return quotationList.data.quotationList.map((quo) => (
            <TableRow
                hover
                id={`quotation__index-${quo.quotationNo}`}
                key={quo.quotationNo}
                sx={{ cursor: 'pointer' }}
                onClick={() => openQuotationDetail(quo.quotationNo)}>
                <TableCell align="center">
                    <Stack spacing={1} alignItems="center">
                        <Typography variant="body2">{quo.quotationNo}</Typography>
                        <Stack direction="row" spacing={0.75} justifyContent="center" flexWrap="wrap" useFlexGap>
                            <Chip
                                label={getDocumentStatusLabel(quo.status, quo.statusProfile)}
                                size="small"
                                sx={getDocumentStatusChipSx(quo.status, quo.statusProfile)}
                            />
                        </Stack>
                    </Stack>
                </TableCell>
                <TableCell align="center">{quo.docDate || '-'}</TableCell>
                <TableCell align="center">
                    {quo.customer ? `(${quo.customer.id}) ${quo.customer.customerName}` : '-'}
                </TableCell>
                <TableCell align="center">{getEmployeeName(quo.saleAccount || quo.salesAccount)}</TableCell>
                <TableCell align="center">{formatNumber(quo.grandTotal)}</TableCell>
                <TableCell align="center">
                    <Tooltip title={t('documentManagement.quotation.viewQuotation')} arrow>
                        <span>
                            <IconButton
                                disabled={quo.status === 'CANCELLED'}
                                onMouseDown={(event) => event.stopPropagation()}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    viewQuotationFunction(quo);
                                }}
                                component="span">
                                <Description />
                            </IconButton>
                        </span>
                    </Tooltip>
                </TableCell>
            </TableRow>
        ));
    }, [classes.noResultMessage, quotationList?.data?.quotationList, t]);

    const quotationMobileRows = useMemo(() => {
        if (!quotationList?.data?.quotationList?.length) {
            return (
                <TableRow>
                    <TableCell>
                        <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
                    </TableCell>
                </TableRow>
            );
        }

        return quotationList.data.quotationList.map((quo) => (
            <TableRow hover key={quo.quotationNo} sx={{ cursor: 'pointer' }} onClick={() => openQuotationDetail(quo.quotationNo)}>
                <TableCell sx={{ pt: 2, pb: 2 }}>
                    <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body1" fontWeight={600}>
                                {quo.quotationNo}
                            </Typography>
                            <Stack direction="row" spacing={0.75} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                                <Chip
                                    label={getDocumentStatusLabel(quo.status, quo.statusProfile)}
                                    size="small"
                                    sx={getDocumentStatusChipSx(quo.status, quo.statusProfile)}
                                />
                            </Stack>
                        </Stack>
                        <Typography variant="body2">{quo.docDate || '-'}</Typography>
                        <Typography variant="body2">
                            {quo.customer ? `(${quo.customer.id}) ${quo.customer.customerName}` : '-'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {getEmployeeName(quo.saleAccount || quo.salesAccount)}
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                            {formatNumber(quo.grandTotal)}
                        </Typography>
                        <Stack direction="row" justifyContent="flex-end">
                            <Tooltip title={t('documentManagement.quotation.viewQuotation')} arrow>
                                <span>
                                    <IconButton
                                        disabled={quo.status === 'CANCELLED'}
                                        onMouseDown={(event) => event.stopPropagation()}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            viewQuotationFunction(quo);
                                        }}
                                        component="span">
                                        <Description />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Stack>
                    </Stack>
                </TableCell>
            </TableRow>
        ));
    }, [classes.noResultMessage, quotationList?.data?.quotationList, t]);

    return (
        <Page>
            <PageTitle title={t('documentManagement.title') + t('documentManagement.quotation.title')} />
            <Wrapper>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    useFlexGap
                    sx={{
                        mt: 1,
                        justifyContent: { sm: 'flex-end' },
                        alignItems: { xs: 'flex-end', sm: 'center' }
                    }}>
                    <Button
                        fullWidth={isDownSm}
                        variant="contained"
                        className="btn-emerald-green"
                        onClick={() => history.push(ROUTE_PATHS.QUOTATION_CREATE)}
                        startIcon={<AddCircle />}>
                        {t('customerManagement.action.create')}
                    </Button>
                    <Button
                        fullWidth={isDownSm}
                        variant="contained"
                        className="btn-indigo-blue"
                        onClick={() => searchFormik.handleSubmit()}
                        startIcon={<Search />}>
                        {t('button.search')}
                    </Button>
                    <Button
                        fullWidth={isDownSm}
                        variant="contained"
                        className="btn-amber-orange"
                        onClick={handleClear}
                        startIcon={<DisabledByDefault />}>
                        {t('button.clear')}
                    </Button>
                </Stack>

                <GridSearchSection container spacing={1}>
                    <Grid item xs={12} sm={12}>
                        <Typography variant="h6" component="h2">
                            {t('documentManagement.quotation.searchPanel')}
                        </Typography>
                    </Grid>
                    <GridTextField item xs={12} sm={4} md={3}>
                        <TextField
                            fullWidth
                            label="เลขที่เอกสาร"
                            name="docNoEqual"
                            value={searchFormik.values.docNoEqual}
                            onChange={searchFormik.handleChange}
                            InputLabelProps={{ shrink: true }}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={4} md={3}>
                        <TextField
                            fullWidth
                            label="รหัสลูกค้า"
                            name="customerIdEqual"
                            value={searchFormik.values.customerIdEqual}
                            onChange={searchFormik.handleChange}
                            InputLabelProps={{ shrink: true }}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={4} md={3}>
                        <TextField
                            fullWidth
                            select
                            label="รหัสเซลล์"
                            name="salesId"
                            value={searchFormik.values.salesId}
                            onChange={searchFormik.handleChange}
                            disabled={isSalesFetching}
                            InputLabelProps={{ shrink: true }}>
                            <MenuItem value="">ทั้งหมด</MenuItem>
                            {isSalesFetching ? (
                                <MenuItem disabled value="">
                                    Loading...
                                </MenuItem>
                            ) : null}
                            {!isSalesFetching && salesDropdownOptions.length === 0 ? (
                                <MenuItem disabled value="">
                                    No sales data
                                </MenuItem>
                            ) : null}
                            {salesDropdownOptions.map((option: SalesRecord) => (
                                <MenuItem key={option.salesId} value={option.salesId}>
                                    {`${option.salesId} - ${option.nickname || option.name}`}
                                </MenuItem>
                            ))}
                        </TextField>
                    </GridTextField>
                    <GridTextField item xs={12} sm={4} md={3}>
                        <TextField
                            fullWidth
                            select
                            label="สถานะ"
                            name="statusEqual"
                            value={searchFormik.values.statusEqual || ''}
                            onChange={searchFormik.handleChange}
                            InputLabelProps={{ shrink: true }}>
                            <MenuItem value="">ทั้งหมด</MenuItem>
                            {['DRAFT', 'CREATED', 'ISSUED', 'SENT', 'ACCEPTED', 'REJECTED', 'CANCELLED'].map((status) => (
                                <MenuItem key={status} value={status}>
                                    {getDocumentStatusLabel(status)}
                                </MenuItem>
                            ))}
                        </TextField>
                    </GridTextField>
                    <GridTextField item xs={12} sm={4} md={3}>
                        <TextField
                            fullWidth
                            type="date"
                            label="วันที่เอกสารเริ่มต้น"
                            name="docDateStart"
                            value={searchFormik.values.docDateStart}
                            onChange={searchFormik.handleChange}
                            InputLabelProps={{ shrink: true }}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={4} md={3}>
                        <TextField
                            fullWidth
                            type="date"
                            label="วันที่เอกสารสิ้นสุด"
                            name="docDateEnd"
                            value={searchFormik.values.docDateEnd}
                            onChange={searchFormik.handleChange}
                            InputLabelProps={{ shrink: true }}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={8} md={6}>
                        <TextField
                            fullWidth
                            label="คำค้นหา"
                            name="keyword"
                            placeholder="เลขใบเสนอราคา, ชื่อลูกค้า, ชื่อสินค้า"
                            value={searchFormik.values.keyword}
                            onChange={searchFormik.handleChange}
                            InputLabelProps={{ shrink: true }}
                        />
                    </GridTextField>
                </GridSearchSection>

                {isMobileOnly ? (
                    <GridSearchSection container>
                        <TableContainer>
                            <Table id="quotation_list___table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center" key="quotation" className={classes.tableHeader}>
                                            {t('documentManagement.quotation.title')}
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {isQuotationFetching ? (
                                        <TableRow>
                                            <TableCell align="center">
                                                <CircularProgress />
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        quotationMobileRows
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </GridSearchSection>
                ) : (
                    <GridSearchSection container>
                        <TableContainer>
                            <Table id="quotation_list___table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center" key="docNo" className={classes.tableHeader}>
                                            {t('documentManagement.quotation.docNo')}
                                        </TableCell>
                                        <TableCell align="center" key="docDate" className={classes.tableHeader}>
                                            {t('documentManagement.quotation.docDate')}
                                        </TableCell>
                                        <TableCell align="center" key="customer" className={classes.tableHeader}>
                                            {t('customerManagement.customer')}
                                        </TableCell>
                                        <TableCell align="center" key="sale" className={classes.tableHeader}>
                                            {t('documentManagement.quotation.salesAccount')}
                                        </TableCell>
                                        <TableCell align="center" key="amount" className={classes.tableHeader}>
                                            {t('documentManagement.quotation.summarySection.total')}
                                        </TableCell>
                                        <TableCell align="center" key="action" className={classes.tableHeader}>
                                            Action
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {isQuotationFetching ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                <CircularProgress />
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        quotationRows
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </GridSearchSection>
                )}

                <GridSearchSection container>
                    <Grid item xs={12}>
                        <Paginate
                            pagination={quotationList?.data.pagination}
                            page={page}
                            pageSize={pageSize}
                            setPage={setPage}
                            setPageSize={setPageSize}
                            refetch={quotationRefetched}
                            totalRecords={quotationList?.data.pagination.totalRecords}
                            isShow={true}
                        />
                    </Grid>
                </GridSearchSection>
            </Wrapper>

            <ViewQuotationDialog
                open={openViewDialog}
                url={pdfUrl}
                quotationNo={selectedQuotation?.quotationNo}
                quotation={selectedQuotation}
                options={{
                    original: true,
                    copy: false
                }}
                onClose={() => setOpenViewDialog(false)}
            />
        </Page>
    );
}
