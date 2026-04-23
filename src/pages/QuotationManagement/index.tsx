/* eslint-disable prettier/prettier */
import { Search, DisabledByDefault, Description } from "@mui/icons-material";
import { Button, Chip, CircularProgress, Grid, IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { makeStyles } from '@mui/styles';
import PageTitle from "components/PageTitle";
import Paginate from "components/Paginate";
import { GridSearchSection, Wrapper } from "components/Styled";
import { useFormik } from "formik";
import { Page } from "layout/LayoutRoute";
import { useEffect, useState } from "react";
import { isMobileOnly } from "react-device-detect";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { useHistory } from "react-router-dom";
import { searchQuotation, viewQuotation } from "services/Document/document-api";
import { Quotation, SearchQuotationRequest } from "services/Document/document-type";
import { formatNumber } from "utils/utils";
import ViewQuotationDialog from "./ViewQuotationDialog";
import toast from "react-hot-toast";
import { DownloadDocumentResponse } from "services/general-type";
import { base64ToBlob } from "utils";

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
    const [page, setPage] = useState<number>(1);
    const [pages, setPages] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [quotationFilter, setQuotationFilter] = useState<SearchQuotationRequest>({});
    const [openViewDialog, setOpenViewDialog] = useState(false);
    const [viewTitle, setViewTitle] = useState<string>('');
    const [title, setTitle] = useState<string>('');
    const [msg, setMsg] = useState<string>('');
    const [action, setAction] = useState<string>('');
    const [pdfUrl, setPdfUrl] = useState('');
    const [selectedQuotation, setSelectedQuotation] = useState<Quotation>();

    const {
        data: quotationList,
        refetch: quotationRefetched,
        isFetching: isQuotationFetching
    } = useQuery('quotation-list', () => searchQuotation(quotationFilter, page, pageSize), {
        refetchOnWindowFocus: false
    });
    const searchFormik = useFormik({
        initialValues: {
            docNoEqual: '',
            docDateStart: '',
            docDateEnd: '',
            customerIdEqual: '',
            statusEqual: null
        },
        enableReinitialize: false,
        onSubmit: (value) => {
            setQuotationFilter(value);
        }
    });
    const quotations = (!isQuotationFetching &&
        quotationList &&
        quotationList?.data.quotationList.length > 0 &&
        quotationList?.data.quotationList.map((quo) => {
            return (
                <TableRow
                    hover
                    id={`quotation__index-${quo.quotationNo}`}
                    key={quo.quotationNo}
                // onClick={() => history.push(`/customer/${cust.id}`)}
                >
                    <TableCell align="center">
                        {quo.quotationNo}
                        <Chip
                            label={quo.status}
                        ></Chip>
                    </TableCell>
                    <TableCell align="center">
                        {quo.docDate}
                    </TableCell>
                    <TableCell align="center">
                        {"(" + quo.customer.id + ") " + quo.customer.customerName}
                    </TableCell>
                    <TableCell align="center">
                        {quo.salesAccount}
                    </TableCell>
                    <TableCell align="center">
                        {formatNumber(quo.grandTotal)}
                    </TableCell>
                    <TableCell align="center">
                        <Tooltip title={t('documentManagement.quotation.viewQuotation')} arrow>
                            <IconButton
                                disabled={quo.status === 'CANCELLED'}
                                onClick={() => {
                                    viewQuotationFunction(quo);
                                }}
                                component="span">
                                <Description />
                            </IconButton>
                        </Tooltip>
                    </TableCell>
                </TableRow>
            );
        })) || (
            <TableRow>
                <TableCell colSpan={6}>
                    <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
                </TableCell>
            </TableRow>
        );
    const viewQuotationFunction = (quotation: Quotation) => {
        toast.promise(viewQuotation(quotation.quotationNo, true, false), {
            loading: t('toast.loading'),
            success: (response) => {
                const data = response.data as DownloadDocumentResponse;

                if (!data.files?.length) {
                    throw new Error('No file');
                }

                const file = data.files[0]; // PDF มีไฟล์เดียว

                const blob = base64ToBlob(file.base64, file.contentType);
                const url = URL.createObjectURL(blob);
                setSelectedQuotation(quotation);
                setPdfUrl(url);
                setViewTitle(t('documentManagement.quotation.viewQuotationTitle', { docNo: quotation.quotationNo }))
                setOpenViewDialog(true);
                return t('toast.success');
            },
            error: () => {
                return t('toast.failed');
            }
        });
    }
    /**
    * Init pagination depends on data from the API.
    */
    useEffect(() => {
        if (!isQuotationFetching && quotationList?.data.pagination) {
            setPage(quotationList.data.pagination.page);
            setPageSize(quotationList.data.pagination.size);
            setPages(quotationList.data.pagination.totalPage);
        }
    }, [quotationList, quotationRefetched]);
    /**
     * Managing the pagination variables that will send to the API.
     */
    useEffect(() => {
        quotationRefetched();
    }, [quotationFilter, pages, page, pageSize, quotationRefetched]);

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
                        className="btn-indigo-blue"
                        onClick={() => searchFormik.handleSubmit()}
                        startIcon={<Search />}>
                        {t('button.search')}
                    </Button>
                    <Button
                        fullWidth={isDownSm}
                        variant="contained"
                        className="btn-amber-orange"
                        onClick={() => searchFormik.resetForm()}
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
                </GridSearchSection>
                {isMobileOnly ? (
                    <>
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
                                </Table>
                            </TableContainer>
                        </GridSearchSection>
                    </>
                ) : (
                    <>
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
                                    {isQuotationFetching ? (
                                        <TableBody>
                                            <TableRow>
                                                <TableCell colSpan={6} align="center">
                                                    <CircularProgress />
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    ) : (
                                        <TableBody>{quotations}</TableBody>
                                    )}
                                </Table>
                            </TableContainer>
                        </GridSearchSection>
                    </>)}
                <GridSearchSection container>
                    <Grid item xs={12}>
                        {isQuotationFetching ? (
                            ' '
                        ) : (
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
                        )}
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