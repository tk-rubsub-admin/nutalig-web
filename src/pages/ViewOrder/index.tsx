/* eslint-disable prettier/prettier */
import { useStyles } from '@material-ui/pickers/views/Calendar/SlideTransition';
import { useLocation } from 'react-router-dom';
import { Avatar, Box, Button, Card, CardContent, CardMedia, Divider, Grid, List, ListItem, ListItemAvatar, ListItemText, Stack, Typography } from '@mui/material';
import { Page } from 'layout/LayoutRoute';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import LoadingDialog from 'components/LoadingDialog';
import { useState } from 'react';
import SimpleDialog from 'components/SimpleDialog';
import { DEFAULT_DATE_FORMAT, DEFAULT_DATETIME_FORMAT_2, formaDateStringWithPattern, formatMoney } from 'utils';
import { Payment, ShoppingCart, Inventory, LocalShipping, CheckCircle, Cancel, ShoppingBasket, LocalPhone, ImageNotSupported } from '@mui/icons-material';
import OrderProgress from 'components/OrderProgress';
import { viewSaleOrder } from 'services/SaleOrder/sale-order-api';

export interface OrderStepType {
    key: string;
    at: number;
    label: string;
    type: "normal" | "success" | "cancel";
}

export const OrderSteps: OrderStepType[] = [
    { key: "AWAITING_PAYMENT", at: 1, label: "AWAITING_PAYMENT", type: "normal" },
    { key: "ORDER_CONFIRMED", at: 2, label: "ORDER_CONFIRMED", type: "normal" },
    { key: "PROCESSING", at: 3, label: "PROCESSING", type: "normal" },
    { key: "COMPLETED", at: 4, label: "COMPLETED", type: "normal" },
    { key: "SHIPPED", at: 5, label: "SHIPPED", type: "normal" },
    { key: "DELIVERED", at: 6, label: "รับสินค้าครบ", type: "success" },
    { key: "CANCELLED", at: 7, label: "ยกเลิก", type: "cancel" },
];
export const stepIcons: Record<string, JSX.Element> = {
    "AWAITING_PAYMENT": <Payment />,
    "ORDER_CONFIRMED": <ShoppingCart />,
    "PROCESSING": <Inventory />,
    "COMPLETED": <Inventory />,
    "SHIPPED": <LocalShipping />,
    "DELIVERED": <CheckCircle color="success" />,
    "CANCELLED": <Cancel color="error" />,
};

export default function ViewOrder(): JSX.Element {
    const classes = useStyles();
    const { t } = useTranslation();
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMessage, setDialogMessage] = useState<string>();
    const searchParams = useLocation().search
    const queryString = new URLSearchParams(searchParams)

    const orderId = queryString.get('orderId') || "";
    const token = queryString.get('token') || "";

    const {
        data: purchaseOrder,
        isFetching
    } = useQuery(
        ["view-order", orderId, token],
        () => viewSaleOrder(orderId, token),
        {
            refetchOnWindowFocus: false,
            retry: false, // don’t keep retrying on 403
            onError: (err: any) => {
                if (err?.response?.status === 403) {
                    setDialogMessage(t('viewOrder.tokenExpiredMsg'));
                    setOpenDialog(true);
                } else if (err?.response?.status === 400) {
                    setDialogMessage(t('viewOrder.orderNotFound', { orderId }));
                    setOpenDialog(true);
                }
            }
        }
    );

    const productAmount = purchaseOrder?.poLines
        .filter((item) => item.itemSku && !/^3[12]/.test(item.itemSku))
        .reduce((sum, item) => sum + (item.qty * item.salesPrice), 0) ?? 0;
    const shippingAmount = purchaseOrder?.poLines
        .filter((item) => item.itemSku && /^3[12]/.test(item.itemSku) || item.itemSku)
        .reduce((sum, item) => sum + (item.qty * item.salesPrice), 0) ?? 0;
    const totalOrderAmount = productAmount + shippingAmount;

    return (
        <Page>
            <Box p={{ xs: 2, md: 3 }}>
                {/* Header */}
                <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent="space-between" mb={2} gap={1}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="h5">คำสั่งซื้อ #{purchaseOrder?.id}</Typography>
                    </Stack>
                </Stack>

                <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                        <Card sx={{ mb: 2 }}>
                            <CardContent>
                                <OrderProgress status={purchaseOrder?.orderStatus} />
                            </CardContent>
                        </Card>
                        <Card sx={{ mb: 2 }}>
                            <CardContent>
                                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                    <ShoppingBasket />
                                    <Typography variant="subtitle1">รายละเอียดคำสั่งซื้อ</Typography>
                                </Stack>
                                <br />
                                <Grid container spacing={1}>
                                    <Grid item xs={12} md={6}>
                                        <Stack spacing={1}>
                                            <Typography variant="body2"><b>{t('viewOrder.customerName')}:</b> {purchaseOrder?.customer.customerName}</Typography>
                                            <Typography variant="body2"><b>{t('viewOrder.contactNumber')}:</b> {purchaseOrder?.customer.contactNumber}</Typography>
                                            <Typography variant="body2"><b>{t('viewOrder.remark')}:</b> {purchaseOrder?.remark}</Typography>
                                        </Stack>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Stack spacing={1}>
                                            <Typography variant="body2"><b>{t('viewOrder.deliverDate')}:</b>{formaDateStringWithPattern(purchaseOrder?.deliveryDate, DEFAULT_DATE_FORMAT)}</Typography>
                                            <Typography variant="body2"><b>{t('viewOrder.supplier')}:</b> {purchaseOrder?.dropOff.supplier?.supplierName}</Typography>
                                            <Typography variant="body2"><b>{t('viewOrder.supplierContact')}:</b>{"  "}
                                                <a
                                                    href={`tel:${purchaseOrder?.dropOff.supplier?.contactNumber.replaceAll('-', '')}`}
                                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                                    onClick={(event) => event.stopPropagation()}>
                                                    <LocalPhone style={{ fontSize: '15px', verticalAlign: 'middle' }} />{' '}
                                                    {purchaseOrder?.dropOff.supplier?.contactNumber}
                                                </a>
                                            </Typography>
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                        <Card sx={{ mb: 2 }}>
                            <CardContent>
                                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                    <ShoppingCart />
                                    <Typography variant="subtitle1">{t('viewOrder.itemList')}</Typography>
                                </Stack>
                                <br />
                                <List>
                                    {purchaseOrder?.poLines
                                        .filter((item) => item.itemSku && !/^3[12]/.test(item.itemSku))
                                        .map((it) => (
                                            <ListItem key={it.itemSku} disableGutters>
                                                <ListItemAvatar>
                                                    {it.itemImageUrl ? (
                                                        <Avatar variant="rounded" src={it.itemImageUrl} />
                                                    ) : (
                                                        <Avatar variant="rounded">
                                                            <ImageNotSupported />
                                                        </Avatar>
                                                    )}
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={<Stack direction="row" justifyContent="space-between">
                                                        <Typography>{it.itemName}</Typography>
                                                        <Typography>{formatMoney(it.salesPrice * it.qty)}</Typography>
                                                    </Stack>}
                                                    secondary={`x ${it.qty}`}
                                                />
                                            </ListItem>
                                        ))}
                                </List>
                                <Divider sx={{ my: 2 }} />
                                <Grid container spacing={1}>
                                    <Grid item xs={12} md={12}>
                                        <Stack spacing={1}>
                                            <Typography variant="body2">{t('viewOrder.productAmount')}: {formatMoney(productAmount)}</Typography>
                                            <Typography variant="body2">{t('viewOrder.shippingAmount')}: {formatMoney(shippingAmount)}</Typography>
                                        </Stack>
                                    </Grid>
                                    <Grid item xs={12} md={12} style={{ textAlign: 'right' }}>
                                        <Stack spacing={1} alignItems="flex-end">
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Typography variant="body2"><b>{t('viewOrder.totalOrderAmount')}: </b>{formatMoney(totalOrderAmount)}</Typography>
                                            </Stack>
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ mb: 2 }}>
                            <CardContent>
                                <Typography variant="subtitle1" gutterBottom>{t('viewOrder.needHelp')}</Typography>
                                <Stack direction="row" spacing={1}>
                                    <Button fullWidth variant="outlined"
                                        onClick={() => {
                                            // 👉 แทนค่า lineUrl ด้วย Official Account หรือ ID ของคุณ
                                            const lineId = purchaseOrder?.customer.customerArea?.code === 'BKK' ? "@pawanbaimai" : "@dpkflower";
                                            const lineUrl = `https://line.me/R/ti/p/${lineId}`;
                                            window.location.href = lineUrl;
                                        }}
                                    >{t('viewOrder.contactAdmin')}</Button>
                                </Stack>
                            </CardContent>
                        </Card>
                        <Card sx={{ mb: 2 }}>
                            <CardContent>
                                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                    <LocalShipping />
                                    <Typography variant="subtitle1">{t('viewOrder.image')}</Typography>
                                </Stack>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    flexWrap="wrap"
                                    justifyContent="center"
                                    alignItems="center"
                                    sx={{ minHeight: 150 }}>
                                    {purchaseOrder?.packagePics?.some(pic => pic.includes('_package_')) ? (
                                        purchaseOrder.packagePics
                                            .filter(pic => pic.includes('_package_'))
                                            .map((url, idx) => (
                                                <CardMedia
                                                    key={idx}
                                                    component="img"
                                                    image={url}
                                                    alt={`package-pic-${idx}`}
                                                    sx={{
                                                        width: 150,
                                                        height: 150,
                                                        objectFit: 'cover',
                                                        borderRadius: 1,
                                                        boxShadow: 1,
                                                        border: '1px solid black'
                                                    }}
                                                />
                                            ))
                                    ) : (
                                        <Box textAlign="center">
                                            <ImageNotSupported fontSize="large" color="disabled" />
                                            <Typography variant="body2" color="text.secondary">
                                                {t('viewOrder.noImage')}
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary">
                    {t('viewOrder.lastUpdatedDate')}: {formaDateStringWithPattern(purchaseOrder?.updatedDate, DEFAULT_DATETIME_FORMAT_2)}
                </Typography>
            </Box>
            <LoadingDialog open={isFetching} />
            <SimpleDialog
                open={openDialog}
                message={dialogMessage}
                icon="error"
                onClose={() => {
                    window.location.href = "https://www.dpkflower.com/how-to-buy/";
                    setOpenDialog(false)
                }}
            />
        </Page>
    );
}
