/* eslint-disable prettier/prettier */
import { Search, DisabledByDefault, AddShoppingCart, IosShare, Visibility } from '@mui/icons-material';
import { useMediaQuery, Stack, Button, Grid, Autocomplete, CircularProgress, TextField, Typography, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, IconButton, Tooltip, Chip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import DatePicker from 'components/DatePicker';
import PageTitle from 'components/PageTitle';
import Paginate from 'components/Paginate';
import { GridSearchSection, Wrapper } from 'components/Styled';
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { Fragment, useEffect, useState } from 'react';
import { isMobileOnly } from 'react-device-detect';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { generatePurchaseOrderMessage, searchPurchaseOrder } from 'services/PurchaseOrder/purchase-order-api';
import { PurchaseOrder, SearchPurchaseOrderRequest } from 'services/PurchaseOrder/purchase-order-type';
import { searchSupplier } from 'services/Supplier/supplier-api';
import { SearchSupplierRequest, Supplier } from 'services/Supplier/supplier-type';
import { useTheme } from 'styled-components';
import { DEFAULT_DATE_FORMAT, DEFAULT_DATE_FORMAT_BFF } from 'utils';
import { shareViaLine } from 'utils/copyContent';

export default function PurchaseOrderManagement() {
    const { t } = useTranslation();
    const theme = useTheme();
    const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
    const useStyles = makeStyles({
        hideObject: {
            display: 'none'
        },
        noResultMessage: {
            textAlign: 'center',
            fontSize: '1.2em',
            fontWeight: 'bold'
        },
        tableHeader: {
            border: '2px solid #e0e0e0',
            fontWeight: 'bold',
            paddingLeft: '10px',
            textAlign: 'center'
        },
        tableMobileHeader: {
            border: '2px solid #e0e0e0',
            textAlign: 'center',
            padding: '2px'
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
    const today = new Date();
    const defaultSearchSupplier: SearchSupplierRequest = {
        idEqual: '',
        nameContain: '',
        typeIn: ['สวนดอกไม้', 'สวนใบไม้', 'ร้านในปากคลองตลาด', 'พ่อค้าคนกลาง'],
        typeEqual: '',
        rankEqual: '',
        mainProductContain: '',
        productTypeEqual: '',
        statusEqual: 'ACTIVE',
        contactNameContain: '',
        contactNumberContain: '',
        creditTermEqual: '',
        bankEqual: ''
    };
    const defaultFilter: SearchPurchaseOrderRequest = {
        purchaseDate: dayjs(today).startOf('day').format(DEFAULT_DATE_FORMAT_BFF),
        supplier: null,
    };
    const [purchaseOrderFilter, setPurchaseOrderFilter] = useState<SearchPurchaseOrderRequest>({
        ...defaultFilter
    });
    const {
        data: purchaseOrderList,
        refetch: poRefetch,
        isFetching: isPOFetching
    } = useQuery(
        ['po-management-list', purchaseOrderFilter, page, pageSize],
        () => searchPurchaseOrder(purchaseOrderFilter, page, pageSize),
        {
            refetchOnWindowFocus: false,
            keepPreviousData: true,
            onSuccess: (data) => {
                if (data?.data?.pagination) {
                    setPage(data.data.pagination.page);
                    setPageSize(data.data.pagination.size);
                    setPages(data.data.pagination.totalPage);
                }
            }
        }
    );

    const { data: supplierList, isFetching: isSupplierFetching } = useQuery(
        'search-supplier',
        () => searchSupplier(defaultSearchSupplier, 1, 1000),
        {
            refetchOnWindowFocus: false,
            keepPreviousData: true,
        }
    );
    const searchFormik = useFormik({
        initialValues: {
            ...defaultFilter,
        },
        enableReinitialize: true,
        onSubmit: (values) => {
            console.log(values);
            const updateObj = { ...values } as unknown as SearchPurchaseOrderRequest;
            setPurchaseOrderFilter(updateObj);
            setPage(1);
        }
    });

    const purchaseOrders = (!isPOFetching &&
        purchaseOrderList &&
        purchaseOrderList?.data.purchaseOrders.length > 0 &&
        purchaseOrderList?.data.purchaseOrders.map((po: PurchaseOrder) => {
            return (
                <TableRow
                    hover
                    id={`po__index-${po.id}`}
                    key={po.id}
                >
                    <TableCell align="center">
                        <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
                            <Typography>{po.id}</Typography>
                            <Chip
                                label={t(`procurement.purchaseOrder.status.${po.status}`)}
                                color="info"
                                size="small"
                            />
                        </Stack>
                    </TableCell>
                    <TableCell align="center">
                        <Typography>{po.purchaseOrderNo}</Typography>
                    </TableCell>
                    <TableCell align="center">
                        <Typography>{dayjs(po.purchaseDate).startOf('day').format(DEFAULT_DATE_FORMAT)}</Typography>
                    </TableCell>
                    <TableCell>
                        <Typography>{po.supplier.phoneContactName}</Typography>
                    </TableCell>
                    <TableCell align="center">
                        <Tooltip title={t('procurement.purchaseOrder.button.view')} arrow>
                            <IconButton
                                size="small"
                                onClick={() => history.push(`/purchase-order/${po.id}`)}
                            >
                                <Visibility />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={t('procurement.purchaseOrder.button.sendMsg')} arrow>
                            <IconButton
                                size="small"
                                onClick={() => handleGeneratePurchaseOrderMsg(po.id)}
                            >
                                <IosShare />
                            </IconButton>
                        </Tooltip>
                    </TableCell>
                </TableRow>
            )
        })) || (
            <TableRow>
                <TableCell colSpan={5}>
                    <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
                </TableCell>
            </TableRow>
        );

    const handleGeneratePurchaseOrderMsg = async (poId: string) => {
        const res = await generatePurchaseOrderMessage(poId);
        let textMessage = res.message.replace(/<br\s*\/?>/gi, '\n').trim();
        if (!textMessage.endsWith('\n')) textMessage += '\n';
        shareViaLine(textMessage);
    }

    useEffect(() => {
        poRefetch();
    }, [purchaseOrderFilter, pages, page, pageSize]);
    return (
        <Page>
            <PageTitle title={t('procurement.purchaseOrder.title')} />
            <Wrapper>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    useFlexGap
                    sx={{
                        mt: 1,
                        justifyContent: { sm: 'flex-end' }, // right-align when in row
                        alignItems: { xs: 'flex-end', sm: 'center' } // right-align when stacked
                    }}>
                    <Button
                        fullWidth={isDownSm}
                        size="small"
                        variant="contained"
                        className={'btn-emerald-green'}
                        onClick={() => history.push(ROUTE_PATHS.NEW_PURCHASE_ORDER)}
                        startIcon={<AddShoppingCart />}
                    >
                        {t('procurement.purchaseOrder.button.create')}
                    </Button>
                    <Button
                        fullWidth={isDownSm}
                        size="small"
                        variant="contained"
                        className="btn-indigo-blue"
                        startIcon={<Search />}
                        onClick={() => searchFormik.handleSubmit()}>
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
                        }}>
                        {t('button.clear')}
                    </Button>
                </Stack>
            </Wrapper>
            <Wrapper>
                <GridSearchSection container spacing={1}>
                    <Grid item xs={12} sm={12}>
                        <Typography variant="h6" component="h2">
                            {t('procurement.purchaseOrder.searchPanel')}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}>
                        <DatePicker
                            className={classes.datePickerFromTo}
                            fullWidth
                            inputVariant="outlined"
                            InputLabelProps={{ shrink: true }}
                            label={t('procurement.purchaseOrder.column.purchaseDate')}
                            name="selectedFromDate"
                            format={DEFAULT_DATE_FORMAT}
                            value={searchFormik.values.purchaseDate || null}
                            onChange={(date) => {
                                if (date !== null) {
                                    searchFormik.setFieldValue(
                                        'purchaseDate',
                                        dayjs(date.toDate()).startOf('day').format(DEFAULT_DATE_FORMAT_BFF)
                                    );
                                } else {
                                    searchFormik.setFieldValue('purchaseDate', '');
                                }
                                searchFormik.handleSubmit();
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3} style={{ paddingTop: '30px' }}>
                        <Autocomplete
                            disablePortal
                            disabled={isSupplierFetching}
                            loading={isSupplierFetching}
                            groupBy={(option) => option.supplierProductType.nameTh}
                            options={supplierList?.data.suppliers
                                .sort((a, b) => a.supplierProductType.code.localeCompare(b.supplierProductType.code))
                                .map((supplier) => supplier)
                                || []}
                            getOptionLabel={(option: Supplier) => option.phoneContactName}
                            sx={{ width: '100%', paddingRight: '4px' }}
                            slotProps={{
                                popper: { sx: { zIndex: (theme) => theme.zIndex.modal + 1 } }
                            }}
                            value={searchFormik.values.supplier || null}
                            onChange={(_event, value, reason) => {
                                if (reason === 'clear') {
                                    searchFormik.setFieldValue('supplier', null);
                                } else {
                                    searchFormik.setFieldValue('supplier', value);
                                }
                                searchFormik.handleSubmit();
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t('productManagement.productSupplier.column.supplier')}
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{
                                        ...params.inputProps,
                                        readOnly: isMobileOnly ? true : false, // Disable keyboard on mobile
                                    }}

                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {isSupplierFetching ? (
                                                    <CircularProgress color="inherit" size={20} />
                                                ) : (<></>)}
                                                {params.InputProps.endAdornment}
                                            </>
                                        )
                                    }}
                                />
                            )}
                            renderGroup={(params) => (
                                <Fragment key={params.key}>
                                    <div style={{ textAlign: 'center', fontWeight: 'bold', marginTop: 10 }}>{`======== ${params.group} ========`}</div>
                                    <ul>{params.children}</ul>
                                </Fragment>
                            )}
                        />
                    </Grid>
                </GridSearchSection>
                <GridSearchSection container spacing={1}>
                    <TableContainer>
                        <Table id="purchase_order_list___table">
                            <TableHead>
                                <TableRow>
                                    <TableCell align="center" key="poId" width={250} className={classes.tableHeader}>
                                        {t('procurement.purchaseOrder.column.id')}
                                    </TableCell>
                                    <TableCell align="center" key="poNo" width={100} className={classes.tableHeader}>
                                        {t('procurement.purchaseOrder.column.poNo')}
                                    </TableCell>
                                    <TableCell align="center" key="purchaseDate" className={classes.tableHeader}>
                                        {t('procurement.purchaseOrder.column.purchaseDate')}
                                    </TableCell>
                                    <TableCell align="center" key="supplier" className={classes.tableHeader}>
                                        {t('procurement.purchaseOrder.column.supplier')}
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
                            {isPOFetching ? (
                                <TableBody>
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            <CircularProgress />
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            ) : (
                                <TableBody>{purchaseOrders}</TableBody>
                            )}
                        </Table>
                    </TableContainer>
                </GridSearchSection>
                <GridSearchSection container>
                    <Grid item xs={12} sm={12}>
                        <Paginate
                            pagination={purchaseOrderList?.data.pagination}
                            page={page}
                            pageSize={pageSize}
                            setPage={setPage}
                            setPageSize={setPageSize}
                            refetch={poRefetch}
                            totalRecords={purchaseOrderList?.data.pagination.totalRecords}
                            isShow={true}
                        />
                    </Grid>
                </GridSearchSection>
            </Wrapper>
        </Page>
    );
}
