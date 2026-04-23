/* eslint-disable prettier/prettier */
import { Add, ArrowBackIos, Cancel, Delete, IosShare, Launch, LocalPhone, ShoppingCart } from "@mui/icons-material";
import { Button, Checkbox, Grid, IconButton, InputAdornment, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { makeStyles } from "@mui/styles";
import AuditInfo from "components/AuditInfo";
import ConfirmDialog from "components/ConfirmDialog";
import LoadingDialog from "components/LoadingDialog";
import PageTitle from "components/PageTitle";
import { GridTextField, Wrapper } from "components/Styled";
import { Page } from "layout/LayoutRoute";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { useHistory, useParams } from "react-router-dom";
import { ROUTE_PATHS } from "routes";
import { cancelPurchaseOrder, generatePurchaseOrderMessage, getPurchaseOrder, updateBulkPurchaseOrderLineStatus, updatePurchaseOrderLineStatus } from "services/PurchaseOrder/purchase-order-api";
import { PurchaseOrder, PurchaseOrderLine } from "services/PurchaseOrder/purchase-order-type";
import { DEFAULT_DATETIME_FORMAT_MONTH_TEXT, formatDateStringWithPattern } from "utils";
import { copyText, shareViaLine } from "utils/copyContent";
import AddNewLineDialog from "./Dialog/AddNewLineDialog";
import BuyingDialog from "./Dialog/BuyingDialog";

export interface PurchaseOrderParam {
    id: string;
}

export default function PurchaseOrderDetail() {
    const useStyles = makeStyles({
        hideObject: {
            display: 'none'
        },
        datePickerFromTo: {
            '&& .MuiOutlinedInput-input': {
                padding: '16.5px 14px'
            },
            '&& .MuiFormLabel-root': {
                fontSize: '13px'
            }
        },
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
        },
        marginButton: {
            margin: '3px 3px 3px 0px'
        }
    });
    const classes = useStyles();
    const history = useHistory();
    const theme = useTheme();
    const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
    const [actionType, setActionType] = useState<string>('');
    const [title, setTitle] = useState<string>('');
    const [msg, setMsg] = useState<string>('');
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
    const [openAddNewLineDialog, setOpenAddNewLineDialog] = useState(false);
    const [openBuyingDialog, setOpenBuyingDialog] = useState(false);
    const params = useParams<PurchaseOrderParam>();
    const { t } = useTranslation();
    const [po, setPo] = useState<PurchaseOrder>();
    const [selectedLines, setSelectedLines] = useState<PurchaseOrderLine[]>([]);
    const [selectedLineId, setSelectedLineId] = useState<string>('');

    const {
        data: poData,
        refetch: poRefetch,
        isFetching: isPoFetching
    } = useQuery(['purchase-order', params.id], () => getPurchaseOrder(params.id), {
        refetchOnWindowFocus: false
    });

    const toggleSelectLine = (line: PurchaseOrderLine) => {
        setSelectedLines((prev) => {
            const exists = prev.some(l => l.id === line.id);

            if (exists) {
                return prev.filter(l => l.id !== line.id);
            } else {
                return [...prev, line];
            }
        });
    };

    const handleGeneratePurchaseOrderMsg = async (poId: string) => {
        const res = await generatePurchaseOrderMessage(poId);
        console.log(res)
        let textMessage = res.message.replace(/<br\s*\/?>/gi, '\n').trim();
        if (!textMessage.endsWith('\n')) textMessage += '\n';
        shareViaLine(textMessage);
    }

    const handleUpdateLineStatus = (poId: string | undefined, polId: string, status: string) => {
        toast
            .promise(updatePurchaseOrderLineStatus(poId, polId, status), {
                loading: t('toast.loading'),
                success: () => {
                    poRefetch();
                    return t('toast.success');
                },
                error: () => {
                    return t('toast.failed');
                }
            });
    }

    const handleBulkUpdateLineStatus = (poId: string | undefined, polIds: string[], status: string) => {
        toast
            .promise(updateBulkPurchaseOrderLineStatus(poId, polIds, status), {
                loading: t('toast.loading'),
                success: () => {
                    poRefetch();
                    setSelectedLines([]);
                    return t('toast.success');
                },
                error: () => {
                    return t('toast.failed');
                }
            });
    }

    const handleCancelPurchaseOrder = (poId: string | undefined) => {
        toast
            .promise(cancelPurchaseOrder(poId), {
                loading: t('toast.loading'),
                success: () => {
                    poRefetch();
                    setSelectedLines([]);
                    return t('toast.success');
                },
                error: () => {
                    return t('toast.failed');
                }
            });
    }

    const canReCreate =
        selectedLines.length > 0 &&
        selectedLines.every(
            (line) => line.orderQty - line.receiveQty > 0
        );

    useEffect(() => {
        if (!poData) return;

        setPo(poData);
    });

    return (
        <Page>
            <PageTitle title={'คำสั่งซื้อ : ' + po?.id} />
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
                        variant="contained"
                        disabled={po?.status === 'CANCELED'}
                        onClick={() => {
                            handleGeneratePurchaseOrderMsg(po?.id)
                        }}
                        className="btn-indigo-blue"
                        startIcon={<IosShare />}>
                        {t('procurement.purchaseOrder.button.sendMsg')}
                    </Button>
                    <Button
                        fullWidth={isDownSm}
                        variant="contained"
                        startIcon={<Delete />}
                        className="btn-crimson-red"
                        onClick={() => {
                            setActionType('cancel_po');
                            setTitle(t('message.confirmCancelPoTitle', { poId: po?.id }));
                            setMsg(t('message.confirmCancelPoMsg'));
                            setVisibleConfirmationDialog(true);
                        }}
                    >
                        {t('procurement.purchaseOrder.button.cancelPo')}
                    </Button>
                    <Button
                        fullWidth={isDownSm}
                        variant="contained"
                        onClick={() => {
                            setActionType('back');
                            setTitle(t('message.backTitle'));
                            setMsg(t('message.backMsg'));
                            setVisibleConfirmationDialog(true);
                        }}
                        className="btn-cool-grey"
                        startIcon={<ArrowBackIos />}>
                        {t('button.back')}
                    </Button>
                </Stack>
            </Wrapper>
            <Wrapper>
                <Grid container spacing={1}>
                    <GridTextField item xs={6} sm={12}>
                        <Typography variant="subtitle1" fontWeight={600}>{t('procurement.purchaseOrder.new.purchaseSection')}</Typography>
                    </GridTextField>
                    <GridTextField item xs={12} sm={6}>
                        <TextField
                            type="text" label={t('procurement.purchaseOrder.column.purchaseDate')}
                            fullWidth
                            InputProps={{ readOnly: true }}
                            variant="outlined"
                            value={po?.purchaseDate}
                            InputLabelProps={{ shrink: true }}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={6} />
                    <GridTextField item xs={12} sm={6}>
                        <TextField
                            type="text" label={t('productManagement.productSupplier.column.supplier')}
                            fullWidth
                            InputProps={{ readOnly: true }}
                            variant="outlined"
                            value={po?.supplier.phoneContactName}
                            InputLabelProps={{ shrink: true }}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={6}>
                        <TextField
                            type="text" label={t('supplierManagement.column.contactNumber')}
                            fullWidth
                            variant="outlined"
                            value={po?.supplier.contactNumber}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                                readOnly: true,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <a
                                            href={`tel:${(po?.supplier.contactNumber || '').replaceAll('-', '')}`}
                                            style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <LocalPhone style={{ verticalAlign: 'middle' }} />
                                        </a>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={12}>
                        <AuditInfo
                            createdBy={po?.createdBy}
                            createdDate={po?.createdDate}
                            updatedBy={po?.updatedBy}
                            updatedDate={po?.updatedDate}
                            createdLabel={t('general.createdBy')}
                            updatedLabel={t('general.updatedBy')}
                            formatDate={(d) => formatDateStringWithPattern(d, DEFAULT_DATETIME_FORMAT_MONTH_TEXT)}
                        />
                    </GridTextField>
                </Grid>
            </Wrapper>
            <Wrapper>
                <Grid container spacing={1} alignItems="center">
                    <GridTextField item xs={6} sm={3}>
                        <Typography variant="subtitle1" fontWeight={600}>{t('procurement.purchaseOrder.new.itemList')}</Typography>
                    </GridTextField>
                    <GridTextField item xs={12} sm={9} sx={{ textAlign: 'right' }}>
                        {/* ===== Desktop Menu ===== */}
                        {!isDownSm && (
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Button
                                    variant="contained"
                                    disabled={!canReCreate}
                                    startIcon={<ShoppingCart />}
                                    sx={{
                                        '&.Mui-disabled': {
                                            backgroundColor: '#e0e0e0 !important',
                                            color: '#9e9e9e !important',
                                        },
                                    }}
                                    className="btn-emerald-green"
                                    onClick={() => {
                                        setActionType('re_create');
                                        setTitle(t('procurement.purchaseOrder.new.message.reCreatePoTitle'));
                                        setMsg(t('procurement.purchaseOrder.new.message.reCreatePoMsg'));
                                        setVisibleConfirmationDialog(true);
                                    }}
                                >
                                    {t('procurement.purchaseOrder.button.createNew')}
                                </Button>

                                <Button
                                    variant="contained"
                                    disabled={selectedLines.length === 0}
                                    startIcon={<Cancel />}
                                    className="btn-crimson-red"
                                    sx={{
                                        '&.Mui-disabled': {
                                            backgroundColor: '#e0e0e0 !important',
                                            color: '#9e9e9e !important',
                                        },
                                    }}
                                    onClick={() => {
                                        setActionType('cancel_list');
                                        setTitle(t('procurement.purchaseOrder.new.message.cancelItemsTitle'));
                                        setMsg(
                                            t('procurement.purchaseOrder.new.message.cancelItemsMsg', {
                                                size: selectedLines.length
                                            })
                                        );
                                        setVisibleConfirmationDialog(true);
                                    }}
                                >
                                    {t('procurement.purchaseOrder.button.cancel')}
                                </Button>
                            </Stack>
                        )}

                        {/* ===== Mobile Menu ===== */}
                        {isDownSm && (
                            <Paper
                                elevation={3}
                                sx={{
                                    mt: 1,
                                    p: 1.5,
                                    borderRadius: 2,
                                    position: 'sticky',
                                    bottom: 8,
                                    zIndex: 10
                                }}
                            >
                                <Stack spacing={1}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        disabled={!canReCreate}
                                        startIcon={<ShoppingCart />}
                                        className="btn-emerald-green"
                                        onClick={() => {
                                            setActionType('re_create');
                                            setTitle(t('procurement.purchaseOrder.new.message.reCreatePoTitle'));
                                            setMsg(t('procurement.purchaseOrder.new.message.reCreatePoMsg'));
                                            setVisibleConfirmationDialog(true);
                                        }}
                                    >
                                        {t('procurement.purchaseOrder.button.createNew')}
                                    </Button>

                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        disabled={selectedLines.length === 0}
                                        startIcon={<Cancel />}
                                        className="btn-crimson-red"
                                        sx={{
                                            '&.Mui-disabled': {
                                                backgroundColor: '#e0e0e0 !important',
                                                color: '#9e9e9e !important',
                                            },
                                        }}
                                        onClick={() => {
                                            setActionType('cancel_list');
                                            setTitle(t('procurement.purchaseOrder.new.message.cancelItemsTitle'));
                                            setMsg(
                                                t('procurement.purchaseOrder.new.message.cancelItemsMsg', {
                                                    size: selectedLines.length
                                                })
                                            );
                                            setVisibleConfirmationDialog(true);
                                        }}
                                    >
                                        {t('procurement.purchaseOrder.button.cancel')}
                                    </Button>
                                </Stack>
                            </Paper>
                        )}
                    </GridTextField>
                    {!isDownSm && (
                        <TableContainer component={Paper} sx={{ mt: 1 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell padding="checkbox" />
                                        <TableCell sx={{ minWidth: 180 }}>
                                            {t('purchaseOrder.productSection.fields.labels.name')}
                                        </TableCell>
                                        <TableCell align="center" sx={{ width: 250 }}>
                                            {t('procurement.purchaseOrder.new.referenceId')}
                                        </TableCell>
                                        <TableCell align="center" sx={{ width: 150 }}>
                                            {t('productManagement.productPrice.column.status')}
                                        </TableCell>
                                        <TableCell align="center" sx={{ width: 150 }}>
                                            {t('procurement.buyingProduct.column.orderQty')}
                                        </TableCell>
                                        <TableCell align="center" sx={{ width: 150 }}>
                                            {t('procurement.buyingProduct.column.receiveQty')}
                                        </TableCell>
                                        <TableCell sx={{ width: 60 }} />
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {po?.lines.map((item, index) => (
                                        <TableRow key={index} hover>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    disabled={item.status === 'CONFIRMED' || item.status === 'COMPLETED' || item.status === 'CANCELED'}
                                                    checked={selectedLines.some(l => l.id === item.id)}
                                                    onChange={() => toggleSelectLine(item)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography>{item.product.productNameTh}</Typography>
                                                <Typography variant="caption" color="text.secondary" fontSize={'10px'}>{item.product.productSku}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                {item.saleOrderLine ? (
                                                    <>
                                                        <Stack
                                                            direction="row"
                                                            alignItems="center"
                                                            spacing={0.5}
                                                        >
                                                            <Typography>{item.saleOrderLine?.id}</Typography>

                                                            <IconButton
                                                                size="small"
                                                                onClick={() => history.push(`/sale-order/${item.saleOrderLine.orderId}`)}
                                                            >
                                                                <Launch fontSize="small" />
                                                            </IconButton>
                                                        </Stack>
                                                    </>
                                                ) : (
                                                    <></>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography>{t(`procurement.purchaseOrder.status.${item.status}`)}</Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography>{item.orderQty}</Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography>{item.receiveQty}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <IconButton
                                                    color="error"
                                                    disabled={item.status === 'CONFIRMED' || item.status === 'COMPLETED' || item.status === 'CANCELED'}
                                                    onClick={() => {
                                                        setSelectedLineId(item.id);
                                                        setActionType('cancel');
                                                        setTitle(t('procurement.purchaseOrder.new.message.cancelItemTitle'));
                                                        setMsg(t('procurement.purchaseOrder.new.message.cancelItemMsg', { item: item.product.productNameTh }));
                                                        setVisibleConfirmationDialog(true);
                                                    }}
                                                >
                                                    <Cancel />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                    {isDownSm && (
                        <Stack spacing={1} mt={1}>
                            {po?.lines.map((item, index) => (
                                <Paper key={index} sx={{ p: 1.5 }}>
                                    <Grid container spacing={1} alignItems="center">
                                        {/* Checkbox */}
                                        <Grid item xs={2} textAlign="right">
                                            <Checkbox
                                                disabled={item.status === 'CONFIRMED' || item.status === 'COMPLETED'}
                                                checked={selectedLines.some(l => l.id === item.id)}
                                                onChange={() => toggleSelectLine(item)}
                                            />
                                        </Grid>

                                        {/* Product */}
                                        <Grid item xs={9}>
                                            <Typography>{item.product.productNameTh} x {item.orderQty}</Typography>
                                        </Grid>

                                        <Grid item xs={1} textAlign="right">
                                            <IconButton
                                                color="error"
                                                disabled={item.status === 'CONFIRMED' || item.status === 'COMPLETED'}
                                                onClick={() => {
                                                    setSelectedLineId(item.id);
                                                    setActionType('cancel');
                                                    setTitle(t('message.backTitle'));
                                                    setMsg(t('message.backMsg'));
                                                    setVisibleConfirmationDialog(true);
                                                }}
                                            >
                                                <Cancel />
                                            </IconButton>
                                        </Grid>

                                    </Grid>
                                </Paper>
                            ))}
                        </Stack>
                    )}
                </Grid>
            </Wrapper>
            <LoadingDialog open={isPoFetching} />
            <ConfirmDialog
                open={visibleConfirmationDialog}
                title={title}
                message={msg}
                confirmText={t('button.confirm')}
                cancelText={t('button.cancel')}
                onConfirm={() => {
                    if (actionType === 're_create') {
                        setOpenBuyingDialog(true);
                    } else if (actionType === 'cancel') {
                        handleUpdateLineStatus(po?.id, selectedLineId, 'CANCELED')
                    } else if (actionType === 'cancel_po') {
                        handleCancelPurchaseOrder(po?.id)
                    } else if (actionType === 'cancel_list') {
                        handleBulkUpdateLineStatus(po?.id, selectedLines.map(l => l.id), 'CANCELED');
                    } else if (actionType === 'back') {
                        history.push(ROUTE_PATHS.PURCHASE_ORDER_MANAGEMENT);
                    }
                    setVisibleConfirmationDialog(false);
                }}
                onCancel={() => setVisibleConfirmationDialog(false)}
                isShowCancelButton={true}
                isShowConfirmButton={true}
            />
            <AddNewLineDialog
                open={openAddNewLineDialog}
                poId={po?.id}
                onClose={(isSuccess: boolean) => {
                    if (isSuccess) {
                        poRefetch();
                    }
                    setOpenAddNewLineDialog(false);
                }}
            />
            <BuyingDialog
                open={openBuyingDialog}
                poId={po?.id}
                poLine={selectedLines}
                onClose={(isSuccess: boolean) => {
                    if (isSuccess) {
                        poRefetch();
                    }
                    setSelectedLines([]);
                    setOpenBuyingDialog(false);
                }}
            />
        </Page>
    )
}