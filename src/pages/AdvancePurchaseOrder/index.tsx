/* eslint-disable prettier/prettier */
import { Search, DisabledByDefault, AccessTime, Place, MoreVert, Visibility, Today } from "@mui/icons-material";
import { Box, Button, Card, CardActionArea, CardContent, Chip, CircularProgress, Divider, Fade, Grid, IconButton, List, Menu, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useMediaQuery } from "@mui/material";
import { makeStyles, useTheme } from "@mui/styles";
import { useAuth } from "auth/AuthContext";
import DatePicker from "components/DatePicker";
import PageTitle from "components/PageTitle";
import { GridSearchSection, TextLineClamp, Wrapper } from "components/Styled";
import dayjs from "dayjs";
import { useFormik } from "formik";
import { Page } from "layout/LayoutRoute";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { useHistory } from "react-router-dom";
import { searchOrder } from "services/SaleOrder/sale-order-api";
import { SaleOrder, SearchSaleOrderRequest } from "services/SaleOrder/sale-order-type";
import { DEFAULT_DATE_FORMAT, DEFAULT_DATE_FORMAT_BFF, DEFAULT_DATETIME_FORMAT_ISO } from "utils";
import { isMobileOnly } from "react-device-detect";
import React from "react";
import { useAdvanceSOFilter } from "hooks/useAdvanceSOFilter";

export default function AdvancePurchaseOrderManagement() {
    const { t } = useTranslation();
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
    const today = dayjs();
    const advanceDays = auth.getAdvanceSODays();
    const [anchorEl, setAnchorEl] = useState();
    const open = Boolean(anchorEl);
    const [selectedCustomerId, setSelectCustomerId] = useState<string>('');

    const handleClose = () => {
        setAnchorEl(null);
    };
    const handleClick = (event, id: string) => {
        setSelectCustomerId(id);
        setAnchorEl(event.currentTarget);
    };

    const getStatusStyles = (status: string) => {
        if (status === 'AWAITING_PAYMENT') {
            return {
                bg: '#eeb050',
                hoverBg: '#e66767',
                fg: 'black',
            };
        }
        return {
            bg: '#e7e7e7',
            hoverBg: '#f5f5f5',
            fg: 'text.primary',
        };
    };

    const defaultFilter = React.useMemo<SearchSaleOrderRequest>(() => ({
        createdDate: null,
        deliveryDate: null,
        startDeliveryDate: today.startOf('day').format(DEFAULT_DATETIME_FORMAT_ISO),
        endDeliveryDate: today.add(advanceDays, 'day').endOf('day').format(DEFAULT_DATETIME_FORMAT_ISO),
        poStatusIn: null,
        poStatusEqual: null,
        billingStatusIn: null,
        poLineStatusEqual: null,
        poLineStatusIn: ['INCOMPLETE', 'OUT_OF_STOCK'],
        customerNameContain: '',
        supplierIdEqual: '',
        poMakerIdEqual: '',
        areaTypeEqual: '',
        billingStatusEqual: null,
        customerIdEqual: null,
        orderNoEqual: null
    } as unknown as SearchSaleOrderRequest), [advanceDays]);

    const userId = auth.getUserId() || 'guest';
    const {
        filter: orderFilter,
        setFilter: setOrderFilter,
        resetFilter
    } = useAdvanceSOFilter(userId, defaultFilter);

    const {
        data: orderList,
        isFetching: isPOFetching
    } = useQuery(['order-management-list', orderFilter], () => searchOrder(orderFilter, 1, 1000), {
        refetchOnWindowFocus: false,
        keepPreviousData: true
    });

    const searchFormik = useFormik({
        initialValues: {
            ...orderFilter,
            customer: null,
            poMaker: null
        },
        enableReinitialize: true,
        onSubmit: (values) => {
            setOrderFilter(values as SearchSaleOrderRequest);
        }
    });

    const saleOrderData = (!isPOFetching &&
        orderList &&
        orderList.data.saleOrders.length > 0 &&
        orderList.data.saleOrders.map((order: SaleOrder) => {
            return (
                <TableRow
                    hover
                    id={`purchase-order__index-${order.id}`}
                    key={order.id}
                    onClick={() => {
                        history.push(`/advance-purchase-order/${order.id}`);
                    }}>
                    <TableCell align="left" style={order.orderStatus === 'ยกเลิก' ? { textDecoration: 'line-through' } : {}}>
                        <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
                            <Typography
                                variant="h6"
                                fontWeight={700}
                                sx={{ ml: 0.5, color: 'blue' }}
                                noWrap
                            >
                                {'#' + order.orderNo}
                            </Typography>
                            <Typography
                                variant="subtitle1"
                                fontWeight={700}
                                sx={{
                                    ml: 0.5,
                                    noWrap: true,
                                    textDecoration: 'underline',
                                    textUnderlineOffset: '2px',
                                    textDecorationThickness: '2px'
                                }}
                                noWrap
                            >
                                {order.customer?.customerName ?? '-'}
                            </Typography>
                        </Stack>
                        {order.urgentOrder ? (
                            <Chip
                                label={t('purchaseOrder.orderInformationSection.urgentOrder')}
                                color="error"
                                size="small"
                            />
                        ) : (
                            ''
                        )}
                        {' '}
                        <Chip
                            label={t(`status.saleOrder.${order.orderStatus}`)}
                            color="info"
                            size="small"
                        />
                        {' '}
                        <Chip
                            label={order.dropOff.area.code === 'BKK' ? 'กทม.' : 'ตจว.'}
                            className={order.dropOff.area.code === 'BKK' ? classes.bkkChip : classes.provinceChip}
                            size="small"
                        />
                        <br />
                        <Place style={{ fontSize: '15px' }} />{'  '}{order.dropOff.dropOffName}
                        <br />
                        <AccessTime style={{ fontSize: '15px' }} />{' '}{order.sendingTime}
                    </TableCell>
                    <TableCell align="left" style={order.orderStatus === 'ยกเลิก' ? { textDecoration: 'line-through' } : {}}>
                        <TextLineClamp>
                            {dayjs(order.deliveryDate).format(DEFAULT_DATE_FORMAT)}
                        </TextLineClamp>
                    </TableCell>
                    <TableCell align="left" style={order.orderStatus === 'ยกเลิก' ? { textDecoration: 'line-through' } : {}}>
                        <TextLineClamp>
                            {order.id}
                        </TextLineClamp>
                    </TableCell>
                    <TableCell>
                        <IconButton
                            aria-label="more"
                            id="long-button"
                            aria-controls={open ? 'long-menu' : undefined}
                            aria-expanded={open ? 'true' : undefined}
                            aria-haspopup="true"
                            onClick={(e) => handleClick(e, order.id)}>
                            <MoreVert />
                        </IconButton>
                        <Menu
                            id="fade-menu"
                            MenuListProps={{
                                'aria-labelledby': 'fade-button'
                            }}
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleClose}
                            TransitionComponent={Fade}>
                            <MenuItem
                                onClick={() => {
                                    history.push(`/sale-order/${selectedCustomerId}`);
                                }}>
                                <IconButton>
                                    <Visibility />
                                </IconButton>
                                {t('supplierManagement.action.view')}
                            </MenuItem>
                        </Menu>
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

    return (
        <Page>
            <PageTitle title={t('procurement.advancePurchaseOrder.title')} />
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
                            resetFilter();
                            searchFormik.resetForm({ values: defaultFilter });
                        }}>
                        {t('button.clear')}
                    </Button>
                </Stack>
            </Wrapper>
            <Wrapper>
                <GridSearchSection container spacing={1}>
                    {/* Start Date */}
                    <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}>
                        <DatePicker
                            className={classes.datePickerFromTo}
                            fullWidth
                            inputVariant="outlined"
                            InputLabelProps={{ shrink: true }}
                            label={t('procurement.advancePurchaseOrder.column.startDeliveryDate')}
                            format={DEFAULT_DATE_FORMAT}
                            value={
                                searchFormik.values.startDeliveryDate
                                    ? dayjs(searchFormik.values.startDeliveryDate).toDate()
                                    : null
                            }
                            onChange={(date) => {
                                if (!date) {
                                    searchFormik.setFieldValue('startDeliveryDate', '');
                                    return;
                                }

                                const startDate = dayjs(date.toDate()).startOf('day');

                                searchFormik.setFieldValue(
                                    'startDeliveryDate',
                                    startDate.format(DEFAULT_DATETIME_FORMAT_ISO)
                                );

                                // ✅ ถ้า end < start → auto ปรับ end = start
                                if (
                                    searchFormik.values.endDeliveryDate &&
                                    dayjs(searchFormik.values.endDeliveryDate).isBefore(startDate)
                                ) {
                                    searchFormik.setFieldValue(
                                        'endDeliveryDate',
                                        startDate.format(DEFAULT_DATETIME_FORMAT_ISO)
                                    );
                                }

                                searchFormik.handleSubmit();
                            }}
                        />
                    </Grid>

                    {/* End Date */}
                    <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}>
                        <DatePicker
                            className={classes.datePickerFromTo}
                            fullWidth
                            inputVariant="outlined"
                            InputLabelProps={{ shrink: true }}
                            label={t('procurement.advancePurchaseOrder.column.endDeliveryDate')}
                            format={DEFAULT_DATE_FORMAT}
                            minDate={
                                searchFormik.values.startDeliveryDate
                                    ? dayjs(searchFormik.values.startDeliveryDate).toDate()
                                    : undefined
                            }
                            value={
                                searchFormik.values.endDeliveryDate
                                    ? dayjs(searchFormik.values.endDeliveryDate).toDate()
                                    : null
                            }
                            onChange={(date) => {
                                if (!date) {
                                    searchFormik.setFieldValue('endDeliveryDate', '');
                                    return;
                                }

                                const endDate = dayjs(date.toDate()).startOf('day');
                                const startDate = searchFormik.values.startDeliveryDate
                                    ? dayjs(searchFormik.values.startDeliveryDate)
                                    : null;

                                // ❌ กันกรณีเลือกน้อยกว่า start
                                if (startDate && endDate.isBefore(startDate)) {
                                    return;
                                }

                                searchFormik.setFieldValue(
                                    'endDeliveryDate',
                                    endDate.format(DEFAULT_DATE_FORMAT_BFF)
                                );

                                searchFormik.handleSubmit();
                            }}
                        />
                    </Grid>
                </GridSearchSection>
            </Wrapper>
            <Wrapper>
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
                                </Table>
                            </TableContainer>
                            <Grid item xs={12} sm={12}>
                                {isPOFetching ? (
                                    <Box sx={{ py: 4, textAlign: 'center' }}>
                                        <CircularProgress />
                                    </Box>
                                ) : !orderList || orderList.data.saleOrders.length === 0 ? (
                                    <Box
                                        sx={{
                                            py: 6,
                                            textAlign: 'center',
                                            color: 'text.secondary',
                                        }}
                                    >
                                        <Typography variant="h6">
                                            {t('warning.noResultList')}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <>
                                        <br />
                                        <List disablePadding>
                                            {!isPOFetching &&
                                                orderList &&
                                                orderList.data.saleOrders.length > 0 &&
                                                orderList.data.saleOrders.map((order: SaleOrder) => {
                                                    const styles = getStatusStyles(order.orderStatus);

                                                    return (
                                                        <React.Fragment key={order.id}>
                                                            <Card
                                                                elevation={0}
                                                                sx={{
                                                                    borderRadius: 2,
                                                                    mb: 1,
                                                                    bgcolor: styles.bg,
                                                                    color: styles.fg,
                                                                }}
                                                            >
                                                                {/* ใช้ ActionArea ให้ทั้งการ์ดกดเข้า detail ได้ ยกเว้นจุดที่ stopPropagation */}
                                                                <CardActionArea
                                                                    onClick={() => history.push(`/advance-purchase-order/${order.id}`)}
                                                                    sx={{
                                                                        '&:hover': { bgcolor: styles.hoverBg },
                                                                        // เพิ่มระยะกดง่าย
                                                                        minHeight: 72,
                                                                    }}
                                                                >
                                                                    <CardContent sx={{ py: 1.25 }}>
                                                                        <Stack direction="row" alignItems="flex-start" spacing={1.25}>

                                                                            <Box flex={1} minWidth={0}>
                                                                                {/* บรรทัดบน: PO#, ชื่อลูกค้า */}
                                                                                <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
                                                                                    <Typography
                                                                                        variant="h6"
                                                                                        fontWeight={700}
                                                                                        sx={{ ml: 0.5, color: 'blue' }}
                                                                                        noWrap
                                                                                    >
                                                                                        {'#' + order.orderNo}
                                                                                    </Typography>
                                                                                    <Typography
                                                                                        variant="subtitle1"
                                                                                        fontWeight={700}
                                                                                        sx={{
                                                                                            ml: 0.5,
                                                                                            noWrap: true,
                                                                                            textDecoration: 'underline',
                                                                                            textUnderlineOffset: '2px',
                                                                                            textDecorationThickness: '2px'
                                                                                        }}
                                                                                        noWrap
                                                                                    >
                                                                                        {order.customer?.customerName ?? '-'}
                                                                                    </Typography>
                                                                                </Stack>

                                                                                {/* บรรทัดสอง: สถานะ / โซน / ด่วน */}
                                                                                <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap">
                                                                                    {order.urgentOrder && (
                                                                                        <Chip
                                                                                            size="small"
                                                                                            color="error"
                                                                                            label={t('purchaseOrder.orderInformationSection.urgentOrder')}
                                                                                            sx={{ height: 20, fontSize: 11 }}
                                                                                        />
                                                                                    )}
                                                                                    <Chip
                                                                                        size="small"
                                                                                        color="info"
                                                                                        label={t(`status.saleOrder.${order.orderStatus}`)}
                                                                                        sx={{ height: 20, fontSize: 11 }}
                                                                                    />
                                                                                    <Chip
                                                                                        size="small"
                                                                                        className={order.dropOff.area.code === 'BKK' ? classes.bkkChip : classes.provinceChip}
                                                                                        label={order.dropOff?.area?.code === 'BKK' ? 'กทม.' : 'ตจว.'}
                                                                                        sx={{ height: 20, fontSize: 11 }}
                                                                                    />
                                                                                </Stack>

                                                                                {/* บรรทัดสาม: Drop-off + Supplier */}
                                                                                <Stack direction="row" spacing={1} alignItems="center" mt={0.75} minWidth={0}>
                                                                                    <Place sx={{ fontSize: 16 }} />
                                                                                    <Typography variant="body2" noWrap>
                                                                                        {order.dropOff?.dropOffName ?? order.dropOff?.supplier?.supplierName ?? '-'}
                                                                                    </Typography>
                                                                                </Stack>
                                                                                <Stack direction="row" spacing={1} alignItems="center" mt={0.25} minWidth={0}>
                                                                                    <Today sx={{ fontSize: 16 }} />
                                                                                    <Typography variant="body2" noWrap>
                                                                                        {dayjs(order.deliveryDate).format(DEFAULT_DATE_FORMAT)}
                                                                                    </Typography>
                                                                                </Stack>
                                                                            </Box>
                                                                        </Stack>
                                                                    </CardContent>
                                                                </CardActionArea>
                                                            </Card>
                                                            <Divider component="li" sx={{ opacity: 0.4 }} />
                                                        </React.Fragment>
                                                    );
                                                })}
                                        </List>
                                    </>
                                )}
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
                                                key="deliverDate"
                                                className={classes.tableHeader}
                                                sx={{
                                                    width: 150,
                                                    maxWidth: 150,
                                                    minWidth: 100,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                            >
                                                {t('orderManagement.column.deliverDate')}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                key="orderId"
                                                className={classes.tableHeader}
                                                sx={{
                                                    width: 200,
                                                    maxWidth: 200,
                                                    minWidth: 100,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                            >
                                                {t('orderManagement.column.orderId')}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                key="action"
                                                className={classes.tableHeader}
                                                sx={{
                                                    width: 75,
                                                    maxWidth: 75,
                                                    minWidth: 50,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                            >
                                                {t('supplierManagement.action.action')}
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    {isPOFetching ? (
                                        <TableBody>
                                            <TableRow>
                                                <TableCell colSpan={4} align="center">
                                                    <CircularProgress />
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    ) : (
                                        <TableBody>{saleOrderData}</TableBody>
                                    )}
                                </Table>
                            </TableContainer>
                        </GridSearchSection>
                    </>
                )}
            </Wrapper>
        </Page>
    )
}