/* eslint-disable prettier/prettier */
import { Search, DisabledByDefault, Person, LocalShipping, CheckCircle } from '@mui/icons-material';
import { useMediaQuery, useTheme, Button, Stack, Grid, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import PageTitle from 'components/PageTitle';
import DatePicker from 'components/DatePicker';
import { GridSearchSection, TextLineClamp, Wrapper } from 'components/Styled';
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { searchOrder } from 'services/SaleOrder/sale-order-api';
import { SaleOrder, SaleOrderLine, SearchSaleOrderRequest } from 'services/SaleOrder/sale-order-type';
import { DEFAULT_DATE_FORMAT, DEFAULT_DATE_FORMAT_BFF } from 'utils';
import Paginate from 'components/Paginate';
import { isMobileOnly } from 'react-device-detect';
import { useHistory } from 'react-router-dom';

export default function BuyingProduct() {
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
    const defaultFilter: SearchSaleOrderRequest = {
        createdDate: null,
        deliveryDate: dayjs(today).startOf('day').format(DEFAULT_DATE_FORMAT_BFF),
        poStatusIn: null,
        poStatusEqual: null,
        billingStatusIn: null,
        saleOrderLineStatusEqual: null,
        saleOrderLineStatusIn: ['INCOMPLETE', 'OUT_OF_STOCK'],
        customerNameContain: '',
        supplierIdEqual: '',
        poMakerIdEqual: '',
        areaTypeEqual: '',
        billingStatusEqual: null
    };
    const [orderFilter, setOrderFilter] = useState<SearchSaleOrderRequest>({
        ...defaultFilter
    });
    const {
        data: orderList,
        refetch: orderRefetch,
        isFetching: isPOFetching
    } = useQuery(['order-management-list', orderFilter, page, pageSize], () => searchOrder(orderFilter, page, pageSize), {
        refetchOnWindowFocus: false,
        keepPreviousData: true,
        onSuccess: (data) => {
            if (data?.data?.pagination) {
                setPage(data.data.pagination.page);
                setPageSize(data.data.pagination.size);
                setPages(data.data.pagination.totalPage);
            }
        }
    });
    const searchFormik = useFormik({
        initialValues: {
            createdDate: null,
            deliveryDate: dayjs(today).startOf('day').format(DEFAULT_DATE_FORMAT_BFF),
            poStatusIn: null,
            poStatusEqual: null,
            billingStatusIn: null,
            saleOrderLineStatusEqual: null,
            saleOrderLineStatusIn: ['INCOMPLETE', 'OUT_OF_STOCK'],
            customerNameContain: '',
            supplierIdEqual: '',
            poMakerIdEqual: '',
            areaTypeEqual: ''
        },
        enableReinitialize: true,
        onSubmit: (values) => {
            console.log(values);
            const updateObj = { ...values } as unknown as SearchSaleOrderRequest;
            setOrderFilter(updateObj);
            setPage(1);
        }
    });

    const getSupplierCheckStatus = (
        saleOrderLines: SaleOrderLine[]
    ): 'NONE' | 'YELLOW' | 'GREEN' => {
        const targetLines = saleOrderLines.filter(
            (line) =>
                line.status === 'INCOMPLETE' || line.status === 'OUT_OF_STOCK'
        );

        if (targetLines.length === 0) return 'NONE';

        const hasNullSupplier = targetLines.some((line) => !line.supplier);
        const hasNonNullSupplier = targetLines.some((line) => line.supplier);

        if (hasNullSupplier && hasNonNullSupplier) return 'YELLOW';
        if (!hasNullSupplier && hasNonNullSupplier) return 'GREEN';

        return 'NONE';
    };

    const purchaseOrderData = (!isPOFetching &&
        orderList &&
        orderList.data.saleOrders.length > 0 &&
        orderList.data.saleOrders.map((order: SaleOrder) => {
            const supplierStatus = getSupplierCheckStatus(order.saleOrderLines);
            return (
                <TableRow
                    hover
                    id={`sale-order__index-${order.id}`}
                    key={order.id}
                    onClick={() => {
                        history.push(`/sale-order/${order.id}`);
                    }}>
                    <TableCell
                        align="left"
                        sx={{
                            textDecoration: order.orderStatus === 'ยกเลิก' ? 'line-through' : 'none',
                        }}
                    >
                        {/* แถวบน */}
                        <Stack
                            direction="row"
                            spacing={0.75}
                            alignItems="center"
                            flexWrap="wrap"
                        >
                            <Typography fontWeight={500}>
                                {order.customer.customerName}
                            </Typography>

                            {supplierStatus === 'GREEN' && (
                                <CheckCircle color="success" sx={{ fontSize: 18 }} />
                            )}

                            {supplierStatus === 'YELLOW' && (
                                <CheckCircle color="warning" sx={{ fontSize: 18 }} />
                            )}
                        </Stack>

                        <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                            sx={{ mt: 0.5, color: 'text.secondary' }}
                        >

                            {order.urgentOrder && (
                                <Chip
                                    label={t('purchaseOrder.orderInformationSection.urgentOrder')}
                                    color="error"
                                    size="small"
                                />
                            )}

                            <Chip
                                label={t(`status.saleOrder.${order.orderStatus}`)}
                                color="info"
                                size="small"
                            />

                            <Chip
                                label={order.customer.customerArea?.code === 'BKK' ? 'กทม.' : 'ตจว.'}
                                className={
                                    order.customer.customerArea?.code === 'BKK'
                                        ? classes.bkkChip
                                        : classes.provinceChip
                                }
                                size="small"
                            />

                        </Stack>

                        {/* แถวล่าง */}
                        <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                            sx={{ mt: 0.5, color: 'text.secondary' }}
                        >
                            <LocalShipping fontSize="small" />
                            <Typography variant="body2">
                                {order.dropOff.supplier?.supplierName ?? '-'}
                            </Typography>
                        </Stack>
                    </TableCell>
                    <TableCell align="left" style={order.orderStatus === 'ยกเลิก' ? { textDecoration: 'line-through' } : {}}>
                        <TextLineClamp>
                            {order.poMaker === null ? '-' : order.poMaker?.displayName}
                        </TextLineClamp>
                    </TableCell>
                    <TableCell align="left" style={order.orderStatus === 'ยกเลิก' ? { textDecoration: 'line-through' } : {}}>
                        <TextLineClamp>
                            {order.id}
                        </TextLineClamp>
                    </TableCell>
                </TableRow>
            );
        })) || (
            <TableRow>
                <TableCell colSpan={4}>
                    <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
                </TableCell>
            </TableRow>
        );
    const purchaseOrderMobileViewData = (!isPOFetching &&
        orderList &&
        orderList.data.saleOrders.length > 0 &&
        orderList.data.saleOrders.map((order: SaleOrder) => {
            const supplierStatus = getSupplierCheckStatus(order.saleOrderLines);
            return (
                <TableRow
                    hover
                    id={`sale-order__index-${order.id}`}
                    key={order.id}
                    onClick={() => {
                        history.push(`/sale-order/${order.id}`);
                    }}>
                    <TableCell align="left">
                        {/* แถวที่ 1 : ชื่อลูกค้า + supplier status */}
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography fontWeight="bold">
                                {order.customer.customerName}
                            </Typography>

                            {supplierStatus === 'GREEN' && (
                                <CheckCircle fontSize="small" color="success" />
                            )}

                            {supplierStatus === 'YELLOW' && (
                                <CheckCircle fontSize="small" color="warning" />
                            )}
                        </Stack>

                        {/* แถวที่ 2 : chip ต่าง ๆ */}
                        <Stack direction="row" spacing={0.5} alignItems="center" mt={0.5}>
                            {order.urgentOrder && (
                                <Chip
                                    label={t('purchaseOrder.orderInformationSection.urgentOrder')}
                                    color="error"
                                    size="small"
                                />
                            )}

                            <Chip
                                label={order.customer.customerArea?.code === 'BKK' ? 'กทม.' : 'ตจว.'}
                                className={
                                    order.customer.customerArea?.code === 'BKK'
                                        ? classes.bkkChip
                                        : classes.provinceChip
                                }
                                size="small"
                            />
                        </Stack>

                        {/* แถวที่ 3 : ข้อมูลขนส่ง */}
                        <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                            mt={1}
                            color="text.secondary"
                        >
                            <LocalShipping fontSize="small" />
                            <Typography variant="body2" fontWeight={500}>
                                {order.dropOff.supplier?.supplierName ?? '-'}
                            </Typography>
                        </Stack>

                        {/* แถวที่ 4 : ผู้ทำ PO */}
                        <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                            mt={0.25}
                            color="text.secondary"
                        >
                            <Person fontSize="small" />
                            <Typography variant="body2">
                                {order.poMaker?.displayName ?? '-'}
                            </Typography>
                        </Stack>
                    </TableCell>
                </TableRow>
            );
        })) || (
            <TableRow>
                <TableCell colSpan={1}>
                    <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
                </TableCell>
            </TableRow>
        );
    useEffect(() => {
        orderRefetch();
    }, [orderFilter, pages, page, pageSize]);
    return (
        <Page>
            <PageTitle title={t('procurement.buyingProduct.title')} />
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
                        }}
                    >
                        {t('button.clear')}
                    </Button>
                </Stack>
            </Wrapper>
            <Wrapper>
                <GridSearchSection container spacing={1}>
                    <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}>
                        <DatePicker
                            className={classes.datePickerFromTo}
                            fullWidth
                            inputVariant="outlined"
                            InputLabelProps={{ shrink: true }}
                            label={t('purchaseOrder.orderInformationSection.fields.labels.deliverDate')}
                            name="selectedFromDate"
                            format={DEFAULT_DATE_FORMAT}
                            value={searchFormik.values.deliveryDate || null}
                            onChange={(date) => {
                                if (date !== null) {
                                    searchFormik.setFieldValue(
                                        'deliveryDate',
                                        dayjs(date.toDate()).startOf('day').format(DEFAULT_DATE_FORMAT_BFF)
                                    );
                                    searchFormik.handleSubmit();
                                } else {
                                    searchFormik.setFieldValue('deliveryDate', '');
                                }
                            }}
                        />
                    </Grid>
                </GridSearchSection>
                {isMobileOnly ? (
                    <>
                        <GridSearchSection container>
                            <TableContainer>
                                <Table id="purchase-order_list___table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell
                                                align="center"
                                                key="customerName"
                                                className={classes.tableHeader}
                                            >
                                                {t('orderManagement.order')}
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    {isPOFetching ? (
                                        <TableBody>
                                            <TableRow>
                                                <TableCell colSpan={1} align="center">
                                                    <CircularProgress />
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    ) : (
                                        <TableBody>{purchaseOrderMobileViewData}</TableBody>
                                    )}
                                </Table>
                            </TableContainer>
                        </GridSearchSection>
                        <GridSearchSection container>
                            <Grid item xs={12}>
                                <Paginate
                                    pagination={orderList?.data.pagination}
                                    page={page}
                                    pageSize={pageSize}
                                    setPage={setPage}
                                    setPageSize={setPageSize}
                                    refetch={orderRefetch}
                                    totalRecords={orderList?.data.pagination.totalRecords}
                                    isShow={true} />
                            </Grid>
                        </GridSearchSection>
                    </>
                ) : (
                    <>
                        <GridSearchSection container>
                            <TableContainer>
                                <Table id="purchase-order_list___table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell
                                                align="center"
                                                key="customerName"
                                                className={classes.tableHeader}
                                            >
                                                {t('orderManagement.column.customerName')}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                key="poMakerDisplayName"
                                                className={classes.tableHeader}
                                                sx={{
                                                    width: 200,
                                                    maxWidth: 200,
                                                    minWidth: 100,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                            >
                                                <Person />
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                key="orderId"
                                                className={classes.tableHeader}
                                                sx={{
                                                    width: 150,
                                                    maxWidth: 150,
                                                    minWidth: 100,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                            >
                                                {t('orderManagement.column.orderId')}
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    {isPOFetching ? (
                                        <TableBody>
                                            <TableRow>
                                                <TableCell colSpan={3} align="center">
                                                    <CircularProgress />
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    ) : (
                                        <TableBody>{purchaseOrderData}</TableBody>
                                    )}
                                </Table>
                            </TableContainer>
                        </GridSearchSection>
                        <GridSearchSection container>
                            <Grid item xs={12}>
                                <Paginate
                                    pagination={orderList?.data.pagination}
                                    page={page}
                                    pageSize={pageSize}
                                    setPage={setPage}
                                    setPageSize={setPageSize}
                                    refetch={orderRefetch}
                                    totalRecords={orderList?.data.pagination.totalRecords}
                                    isShow={true} />
                            </Grid>
                        </GridSearchSection>
                    </>
                )}
            </Wrapper>
        </Page>
    );
}
