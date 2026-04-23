/* eslint-disable prettier/prettier */
import { Search, DisabledByDefault, MapOutlined, IosShare } from '@mui/icons-material';
import {
    Grid,
    Button,
    TableContainer,
    TableHead,
    Table,
    TableRow,
    TableCell,
    Divider,
    TableBody,
    IconButton,
    TextField,
    Autocomplete,
    Typography,
    Stack,
    useMediaQuery,
    useTheme,
    Tooltip
} from '@mui/material';
import { IoHeart } from 'react-icons/io5';
import { makeStyles } from '@mui/styles';
import PageTitle from 'components/PageTitle';
import DatePicker from 'components/DatePicker';
import { GridSearchSection, GridTextField, Wrapper } from 'components/Styled';
import { useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { DEFAULT_DATE_FORMAT, DEFAULT_DATE_FORMAT_BFF, formatDate } from 'utils';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import LoadingDialog from 'components/LoadingDialog';
import { isMobileOnly } from 'react-device-detect';
import { useAuth } from 'auth/AuthContext';
import { Supplier } from 'services/Supplier/supplier-type';
import React from 'react';
import { UpdateReceiveProductRequest } from 'services/PurchaseOrder/purchase-order-type';
import NumberTextField from 'components/NumberTextField';
import { generateReceiveMessage, getReceiveProductByDate, updateReceiveProduct } from 'services/PurchaseOrder/purchase-order-api';
import { shareViaLine } from 'utils/copyContent';

export default function ReceiveProduct() {
    const { t } = useTranslation();
    const theme = useTheme();
    const { getRole } = useAuth();
    const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
    const today = new Date();
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
    const { getStaffId, getStaffRole } = useAuth();
    const [actionType, setActionType] = useState<string>('');
    const [title, setTitle] = useState<string>('');
    const [msg, setMsg] = useState<string>('');
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
    const [searchDate, setSearchDate] = useState<Date>(today);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const {
        data: receiveList,
        isFetching,
        refetch
    } = useQuery(
        ['receive-list', searchDate],
        () => getReceiveProductByDate(formatDate(searchDate, DEFAULT_DATE_FORMAT_BFF)),
        {
            refetchOnWindowFocus: false,
            keepPreviousData: true
        }
    );

    const searchFormik = useFormik({
        initialValues: {
            searchDate: searchDate
        },
        enableReinitialize: false,
        onSubmit: (value) => {
            setSearchDate(value.searchDate);
            refetch();
        }
    });

    const [localReceiveList, setLocalReceiveList] = useState(null);

    useEffect(() => {
        if (selectedSupplier && receiveList) {
            const supplierData = receiveList.suppliers.find(
                (s) => s.supplier.supplierId === selectedSupplier.supplierId
            );
            setLocalReceiveList(supplierData ? { ...receiveList, suppliers: [supplierData] } : null);
        }
    }, [selectedSupplier, receiveList]);

    const handleReceiveQtyChange = (supplierIndex: number, productIndex: number, value: number) => {
        const updatedList = [...localReceiveList.suppliers];
        updatedList[supplierIndex].receiveProducts[productIndex].receiveQty = value;
        setLocalReceiveList({ ...localReceiveList, suppliers: updatedList });
    };

    const handleHeartIconChange = (supplierIndex: number, productIndex: number, heartIndex: number, checked: boolean) => {
        const updatedList = [...localReceiveList.suppliers];
        if (heartIndex === 1) {
            updatedList[supplierIndex].receiveProducts[productIndex].isFirstCheck = checked;
            updatedList[supplierIndex].receiveProducts[productIndex].status = 'RECEIVED';
        }
        if (heartIndex === 2) {
            updatedList[supplierIndex].receiveProducts[productIndex].isSecondCheck = checked;
            updatedList[supplierIndex].receiveProducts[productIndex].status = 'CONFIRMED';
        }
        setLocalReceiveList({ ...localReceiveList, suppliers: updatedList });
    };

    const handleGenerateMessage = async (poId: string) => {
        const res = await generateReceiveMessage(poId);
        let textMessage = res[0].message.replace(/<br\s*\/?>/gi, '\n').trim();
        if (!textMessage.endsWith('\n')) textMessage += '\n';
        shareViaLine(textMessage);
    }

    const handleSave = (supplierIndex: number, productIndex: number, checked: boolean, checked2: boolean, polId: string) => {
        const updateReq: UpdateReceiveProductRequest = {
            receiveDate: localReceiveList.receiveDate,
            supplierId: localReceiveList.suppliers[supplierIndex].supplier.supplierId,
            productSku:
                localReceiveList.suppliers[supplierIndex].receiveProducts[productIndex].product.productSku,
            receiveQty:
                localReceiveList.suppliers[supplierIndex].receiveProducts[productIndex].receiveQty,
            isFirstCheck: checked,
            isSecondCheck: checked2,
            status: localReceiveList.suppliers[supplierIndex].receiveProducts[productIndex].status,
            receivePerson: getStaffId()
        };
        console.log(JSON.stringify(localReceiveList));
        toast.promise(updateReceiveProduct(polId, updateReq), {
            loading: t('toast.loading'),
            success: () => {
                refetch();
                return t('toast.success');
            },
            error: (error) => t('toast.failed') + ' ' + error.message
        });
    };


    return (
        <Page>
            <PageTitle title={t('procurement.receiveProduct.title')} />
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
                        className="btn-indigo-blue"
                        onClick={() => searchFormik.handleSubmit()}
                        startIcon={<Search />}>
                        {t('button.search')}
                    </Button>
                    <Button
                        fullWidth={isDownSm}
                        variant="contained"
                        className="btn-amber-orange"
                        onClick={() => {
                            searchFormik.resetForm();
                            setLocalReceiveList(null);
                            setSelectedSupplier(null);
                        }}
                        startIcon={<DisabledByDefault />}>
                        {t('button.clear')}
                    </Button>
                </Stack>
                <GridSearchSection container spacing={1}>
                    <GridTextField item xs={12} sm={3}>
                        <DatePicker
                            className={classes.datePickerFromTo}
                            fullWidth
                            inputVariant="outlined"
                            InputLabelProps={{ shrink: true }}
                            label={t('procurement.receiveProduct.receiveDate')}
                            name="receiveDate"
                            format={DEFAULT_DATE_FORMAT}
                            value={searchFormik.values.searchDate || null}
                            onChange={(date) => {
                                if (date !== null) {
                                    searchFormik.setFieldValue(
                                        'searchDate',
                                        dayjs(date.toDate()).startOf('day').format(DEFAULT_DATE_FORMAT_BFF)
                                    );
                                    searchFormik.handleSubmit();
                                } else {
                                    searchFormik.setFieldValue('searchDate', '');
                                }
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={3}>
                        <Autocomplete
                            disabled={isFetching}
                            options={(receiveList?.suppliers ?? []).map((s) => s.supplier)}
                            isOptionEqualToValue={(option, value) => option.supplierId === value.supplierId}
                            getOptionLabel={(option) => option.supplierName}
                            sx={{ width: '100%' }}
                            value={selectedSupplier}
                            onChange={(_event, value, reason) => {
                                setSelectedSupplier(reason === 'clear' ? null : value);
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t('procurement.receiveProduct.supplier')}
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}
                        />
                    </GridTextField>
                </GridSearchSection>
                {isMobileOnly ? (
                    <>
                        <GridSearchSection container spacing={1}>
                            {localReceiveList?.suppliers &&
                                localReceiveList.suppliers.filter(
                                    (s) => s.supplier.supplierId === selectedSupplier?.supplierId
                                ).length > 0 ? (
                                localReceiveList?.suppliers
                                    ?.filter((s) => s.supplier.supplierId === selectedSupplier?.supplierId)
                                    .map((rcv, index: number) => (
                                        <>
                                            <Grid item xs={12} style={{ paddingTop: '50px' }}>
                                                <Typography>
                                                    <strong>
                                                        {t('procurement.receiveProduct.column.no')} {rcv.supplier.supplierName}
                                                    </strong>
                                                    {'  '}
                                                    {rcv.supplier?.location ? (
                                                        <Tooltip title={t('procurement.receiveProduct.mapToShop')}>
                                                            <IconButton
                                                                size='small'
                                                                onClick={() => {
                                                                    if (rcv.supplier?.location) {
                                                                        const [lat, lng] = rcv.supplier.location.split(',').map(Number);
                                                                        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                                                                        window.open(url, '_blank');
                                                                    }
                                                                }}>
                                                                <MapOutlined />
                                                            </IconButton>
                                                        </Tooltip>
                                                    ) : (
                                                        <></>
                                                    )}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <TableContainer>
                                                    <Table>
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell
                                                                    align="center"
                                                                    key="products"
                                                                    className={classes.tableMobileHeader}>
                                                                    {t('procurement.receiveProduct.column.products')}
                                                                </TableCell>
                                                                <TableCell
                                                                    align="center"
                                                                    key="orderQty"
                                                                    width={40}
                                                                    className={classes.tableMobileHeader}>
                                                                    {t('procurement.receiveProduct.mobileColumn.orderQty')}
                                                                </TableCell>
                                                                <TableCell
                                                                    align="center"
                                                                    key="receiveQty"
                                                                    width={40}
                                                                    className={classes.tableMobileHeader}>
                                                                    {t('procurement.receiveProduct.mobileColumn.receiveQty')}
                                                                </TableCell>
                                                                <TableCell
                                                                    align="center"
                                                                    key="check1"
                                                                    width={40}
                                                                    className={classes.tableMobileHeader}>
                                                                    <IoHeart
                                                                        style={{
                                                                            fontSize: '22px',
                                                                            color: '#FF8C00'
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell
                                                                    align="center"
                                                                    key="check2"
                                                                    width={40}
                                                                    className={classes.tableMobileHeader}>
                                                                    <IoHeart
                                                                        style={{
                                                                            fontSize: '22px',
                                                                            color: '#9B30FF'
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {localReceiveList?.suppliers[index].receiveProducts?.length > 0 ? (
                                                                // 1. Group ก่อน
                                                                Object.entries(
                                                                    localReceiveList?.suppliers[index].receiveProducts.reduce((acc: Record<string, any[]>, p) => {
                                                                        const key = p.buyingNo ?? 'NO_GROUP';
                                                                        if (!acc[key]) acc[key] = [];
                                                                        acc[key].push(p);
                                                                        return acc;
                                                                    }, {})
                                                                ).map(([buyingNo, products]) => (
                                                                    <React.Fragment key={buyingNo}>
                                                                        {/* Header ของ group */}
                                                                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                                                            <TableCell
                                                                                colSpan={5}
                                                                                sx={{
                                                                                    py: 2,              // ⬅ เพิ่มความสูงแนวตั้ง (แนะนำ 2–3)
                                                                                    px: 2,
                                                                                    borderBottom: 'none',
                                                                                }}
                                                                            >
                                                                                <Typography
                                                                                    fontWeight="bold"
                                                                                    sx={{
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        fontSize: '1.1rem',   // ⬅ ขยายตัวอักษร
                                                                                    }}
                                                                                >
                                                                                    #{buyingNo}
                                                                                    <IconButton
                                                                                        size="small"
                                                                                        sx={{ ml: 1 }}
                                                                                        disabled={products[0].status === 'CREATED'}
                                                                                        onClick={() => handleGenerateMessage(products[0].poId)}
                                                                                    >
                                                                                        <IosShare fontSize="small" />
                                                                                    </IconButton>
                                                                                </Typography>
                                                                            </TableCell>
                                                                        </TableRow>

                                                                        {/* สินค้าใน group */}
                                                                        {products.map((p, productIndex) => (
                                                                            <TableRow key={p.product.productSku}>
                                                                                <TableCell style={{ padding: '2px' }}>{p.product.productNameTh}</TableCell>
                                                                                <TableCell style={{ padding: '2px' }} align="center">{p.orderQty}</TableCell>
                                                                                <TableCell style={{ padding: '2px' }} align="center">
                                                                                    <NumberTextField
                                                                                        required
                                                                                        size="small"
                                                                                        disabled={p.isSecondCheck}
                                                                                        min={1}
                                                                                        max={p.orderQty}
                                                                                        value={
                                                                                            localReceiveList?.suppliers[index].receiveProducts?.find(
                                                                                                (product) => product.product.productSku === p.product.productSku
                                                                                            )?.receiveQty ?? null
                                                                                        }
                                                                                        onChange={(v) => {
                                                                                            // อัปเดต state ระหว่างผู้ใช้พิมพ์ (ยังไม่ clamp)
                                                                                            handleReceiveQtyChange(index, rcv.receiveProducts.indexOf(p), v);
                                                                                        }}
                                                                                        onCommit={(v) => {
                                                                                            // commit เมื่อ blur/Enter (ถูก clamp แล้ว)
                                                                                            handleReceiveQtyChange(index, rcv.receiveProducts.indexOf(p), v);
                                                                                            if (v !== null) {
                                                                                                handleSave(index, rcv.receiveProducts.indexOf(p), false, false, p.polId);
                                                                                            }
                                                                                        }}
                                                                                    />
                                                                                </TableCell>
                                                                                <TableCell style={{ padding: '2px' }} align="center">
                                                                                    <IconButton
                                                                                        id={`is_first_check_${index}_check_box`}
                                                                                        disabled={getRole() !== 'RECEIVER'}
                                                                                        onClick={() => {
                                                                                            handleHeartIconChange(
                                                                                                index,
                                                                                                rcv.receiveProducts.indexOf(p),
                                                                                                1,
                                                                                                true
                                                                                            );
                                                                                            handleSave(index, rcv.receiveProducts.indexOf(p), true, false, p.polId);
                                                                                        }}>
                                                                                        <IoHeart
                                                                                            style={{
                                                                                                color: p.isFirstCheck ? '#FF8C00' : 'inherit'
                                                                                            }}
                                                                                        />
                                                                                    </IconButton>
                                                                                </TableCell>
                                                                                <TableCell style={{ padding: '2px' }} align="center">
                                                                                    <IconButton
                                                                                        id={`is_second_check_${index}_check_box`}
                                                                                        disabled={getRole() !== 'RECEIVER_PAK_KLONG'}
                                                                                        onClick={() => {
                                                                                            handleReceiveQtyChange(
                                                                                                index,
                                                                                                rcv.receiveProducts.indexOf(p),
                                                                                                p.orderQty
                                                                                            );
                                                                                            handleHeartIconChange(
                                                                                                index,
                                                                                                rcv.receiveProducts.indexOf(p),
                                                                                                2,
                                                                                                true
                                                                                            );
                                                                                            handleSave(index, rcv.receiveProducts.indexOf(p), true, true, p.polId);
                                                                                        }}>
                                                                                        <IoHeart
                                                                                            style={{
                                                                                                color: p.isSecondCheck ? '#9B30FF' : 'inherit'
                                                                                            }}
                                                                                        />
                                                                                    </IconButton>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </React.Fragment>
                                                                ))
                                                            ) : (
                                                                <TableRow>
                                                                    <TableCell colSpan={5} align="center">
                                                                        {t('procurement.receiveProduct.receiveComplete')}
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </Grid>
                                        </>
                                    ))
                            ) : (
                                <>
                                    <Grid item xs={12} style={{ padding: '20px', textAlign: 'center' }}>
                                        <Typography variant="body1">{t('warning.noData')}</Typography>
                                    </Grid>
                                </>
                            )}
                        </GridSearchSection>
                    </>
                ) : (
                    <>
                        <GridSearchSection container spacing={1}>
                            {localReceiveList?.suppliers &&
                                localReceiveList.suppliers.filter(
                                    (s) => s.supplier.supplierId === selectedSupplier?.supplierId
                                ).length > 0 ? (
                                localReceiveList?.suppliers
                                    ?.filter((s) => s.supplier.supplierId === selectedSupplier?.supplierId)
                                    .map((rcv, index: number) => (
                                        <>
                                            <Grid item xs={12} style={{ paddingTop: '50px' }}>
                                                <Typography>
                                                    <strong>
                                                        {t('procurement.receiveProduct.column.no')} {rcv.supplier.supplierName}
                                                    </strong>
                                                    {'  '}
                                                    {rcv.supplier?.location ? (
                                                        <Tooltip title={t('procurement.receiveProduct.mapToShop')}>
                                                            <IconButton
                                                                size='small'
                                                                onClick={() => {
                                                                    if (rcv.supplier?.location) {
                                                                        const [lat, lng] = rcv.supplier.location.split(',').map(Number);
                                                                        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                                                                        window.open(url, '_blank');
                                                                    }
                                                                }}>
                                                                <MapOutlined />
                                                            </IconButton>
                                                        </Tooltip>
                                                    ) : (
                                                        <></>
                                                    )}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <TableContainer>
                                                    <Table>
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell
                                                                    align="center"
                                                                    key="products"
                                                                    className={
                                                                        isMobileOnly ? classes.tableMobileHeader : classes.tableHeader
                                                                    }>
                                                                    {t('procurement.receiveProduct.column.products')}
                                                                </TableCell>
                                                                <TableCell
                                                                    align="center"
                                                                    key="orderQty"
                                                                    width={100}
                                                                    className={classes.tableHeader}>
                                                                    {t('procurement.receiveProduct.column.orderQty')}
                                                                </TableCell>
                                                                <TableCell
                                                                    align="center"
                                                                    key="receiveQty"
                                                                    width={150}
                                                                    className={classes.tableHeader}>
                                                                    {t('procurement.receiveProduct.column.receiveQty')}
                                                                </TableCell>
                                                                <TableCell
                                                                    align="center"
                                                                    key="check1"
                                                                    width={100}
                                                                    className={classes.tableHeader}>
                                                                    check1
                                                                </TableCell>
                                                                <TableCell
                                                                    align="center"
                                                                    key="check2"
                                                                    width={100}
                                                                    className={classes.tableHeader}>
                                                                    check2
                                                                </TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {localReceiveList?.suppliers[index].receiveProducts?.length > 0 ? (
                                                                // 1. Group ก่อน
                                                                Object.entries(
                                                                    localReceiveList?.suppliers[index].receiveProducts.reduce((acc: Record<string, any[]>, p) => {
                                                                        const key = p.buyingNo ?? 'NO_GROUP';
                                                                        if (!acc[key]) acc[key] = [];
                                                                        acc[key].push(p);
                                                                        return acc;
                                                                    }, {})
                                                                ).map(([buyingNo, products]) => (
                                                                    <React.Fragment key={buyingNo}>
                                                                        {/* Header ของ group */}
                                                                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                                                            <TableCell
                                                                                colSpan={5}
                                                                                sx={{
                                                                                    py: 2,              // ⬅ เพิ่มความสูงแนวตั้ง (แนะนำ 2–3)
                                                                                    px: 2,
                                                                                    borderBottom: 'none',
                                                                                }}
                                                                            >
                                                                                <Typography
                                                                                    fontWeight="bold"
                                                                                    sx={{
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        fontSize: '1.1rem',   // ⬅ ขยายตัวอักษร
                                                                                    }}
                                                                                >
                                                                                    #{buyingNo}
                                                                                    <IconButton
                                                                                        size="small"
                                                                                        sx={{ ml: 1 }}
                                                                                        disabled={products[0].status === 'CREATED'}
                                                                                        onClick={() => handleGenerateMessage(products[0].poId)}
                                                                                    >
                                                                                        <IosShare fontSize="small" />
                                                                                    </IconButton>
                                                                                </Typography>
                                                                            </TableCell>
                                                                        </TableRow>

                                                                        {/* สินค้าใน group */}
                                                                        {products.map((p, productIndex) => (
                                                                            <TableRow key={p.product.productSku}>
                                                                                <TableCell>{p.product.productNameTh}</TableCell>
                                                                                <TableCell align="center">{p.orderQty}</TableCell>
                                                                                <TableCell align="center">
                                                                                    <NumberTextField
                                                                                        required
                                                                                        size="small"
                                                                                        disabled={p.isFirstCheck}
                                                                                        min={1}
                                                                                        max={p.orderQty}
                                                                                        value={
                                                                                            localReceiveList?.suppliers[index].receiveProducts?.find(
                                                                                                (product) => product.product.productSku === p.product.productSku
                                                                                            )?.receiveQty ?? null
                                                                                        }
                                                                                        onChange={(v) => {
                                                                                            // อัปเดต state ระหว่างผู้ใช้พิมพ์ (ยังไม่ clamp)
                                                                                            handleReceiveQtyChange(index, rcv.receiveProducts.indexOf(p), v);
                                                                                        }}
                                                                                        onCommit={(v) => {
                                                                                            // commit เมื่อ blur/Enter (ถูก clamp แล้ว)
                                                                                            handleReceiveQtyChange(index, rcv.receiveProducts.indexOf(p), v);
                                                                                            if (v !== null) {
                                                                                                handleSave(index, rcv.receiveProducts.indexOf(p), false, false, p.polId);
                                                                                            }
                                                                                        }}
                                                                                    />
                                                                                </TableCell>
                                                                                <TableCell align="center">
                                                                                    <IconButton
                                                                                        id={`is_first_check_${index}_check_box`}
                                                                                        disabled={getRole() !== 'RECEIVER'}
                                                                                        onClick={() => {
                                                                                            handleHeartIconChange(index, rcv.receiveProducts.indexOf(p), 1, true);
                                                                                            handleSave(index, rcv.receiveProducts.indexOf(p), true, false, p.polId);
                                                                                        }}
                                                                                    >
                                                                                        <IoHeart style={{ color: p.isFirstCheck ? '#FF8C00' : 'inherit' }} />
                                                                                    </IconButton>
                                                                                </TableCell>
                                                                                <TableCell align="center">
                                                                                    <IconButton
                                                                                        id={`is_second_check_${index}_check_box`}
                                                                                        disabled={getRole() !== 'RECEIVER_PAK_KLONG'}
                                                                                        onClick={() => {
                                                                                            handleReceiveQtyChange(index, rcv.receiveProducts.indexOf(p), p.orderQty);
                                                                                            handleHeartIconChange(index, rcv.receiveProducts.indexOf(p), 2, true);
                                                                                            handleSave(index, rcv.receiveProducts.indexOf(p), true, true, p.polId);
                                                                                        }}
                                                                                    >
                                                                                        <IoHeart style={{ color: p.isSecondCheck ? '#9B30FF' : 'inherit' }} />
                                                                                    </IconButton>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </React.Fragment>
                                                                ))
                                                            ) : (
                                                                <TableRow>
                                                                    <TableCell colSpan={5} align="center">
                                                                        {t('procurement.receiveProduct.receiveComplete')}
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </Grid>
                                            <Divider />
                                        </>
                                    ))
                            ) : (
                                <>
                                    <Grid item xs={12} style={{ padding: '20px', textAlign: 'center' }}>
                                        <Typography variant="body1">{t('warning.noData')}</Typography>
                                    </Grid>
                                </>
                            )}
                        </GridSearchSection>
                    </>
                )}
            </Wrapper >
            <LoadingDialog open={isFetching} />
            {/* <ConfirmDialog
                open={visibleConfirmationDialog}
                title={title}
                message={msg}
                confirmText={t('button.confirm')}
                cancelText={t('button.cancel')}
                onConfirm={async () => {
                    // 1) build request body for the API like you already do
                    let updateObj: UpdatePOLineRequest | undefined;

                    if (actionType === 'CONFIRM_CHECK_1') {
                        updateObj = {
                            status: 'COMPLETE',
                            detail: 'สินค้าครบตามที่ลูกค้าสั่ง',
                            haveQty: selectedPoLine ? selectedPoLine.qty : 0,
                            salePrice: selectedPoLine ? selectedPoLine.salesPrice : null,
                            isFirstCheck: true,
                            isSecondCheck: false
                        };
                    } else if (actionType === 'CONFIRM_CHECK_2') {
                        updateObj = {
                            status: 'PACKED',
                            detail: 'สินค้าถูกแพ็คลงกล่อง',
                            haveQty: selectedPoLine ? selectedPoLine.qty : 0,
                            salePrice: selectedPoLine ? selectedPoLine.salesPrice : null,
                            isFirstCheck: true,
                            isSecondCheck: true
                        };
                    }

                    try {
                        if (updateObj) {
                            // 2) call backend and await toast
                            await toast.promise(
                                updatePurchaseOrderLineStatus(selectedPoLine?.id, updateObj),
                                {
                                    loading: t('toast.loading'),
                                    success: () => {
                                        return t('toast.success');
                                    },
                                    error: () => t('toast.failed')
                                }
                            );

                            // 3) optimistic local patch (no reload / no refetch)
                            const localPatch = buildLocalPatch(actionType);

                            setSaleOrder((prev) =>
                                !prev
                                    ? prev
                                    : {
                                        ...prev,
                                        saleOrderLines: prev.saleOrderLines.map((line, i) => {
                                            if (
                                                selectedPoLine?.id
                                                    ? line.id === selectedPoLine.id
                                                    : i === (selectedIndex ?? -1)
                                            ) {
                                                return {
                                                    ...line,
                                                    ...localPatch
                                                };
                                            }
                                            return line;
                                        })
                                    }
                            );
                        }
                    } finally {
                        setVisibleConfirmationDialog(false);
                        setSelectedIndex(null);
                    }
                }}
                onCancel={() => setVisibleConfirmationDialog(false)}
                isShowCancelButton={true}
                isShowConfirmButton={true}
            /> */}
        </Page >
    );
}
