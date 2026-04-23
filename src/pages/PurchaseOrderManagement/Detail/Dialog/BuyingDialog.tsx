/* eslint-disable prettier/prettier */
import { Restore, Close, NavigateNext, IosShare, ShoppingCart } from '@mui/icons-material';
import { Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, InputAdornment, Step, StepLabel, Stepper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import ConfirmDialog from 'components/ConfirmDialog';
import NumberTextField from 'components/NumberTextField';
import { GridTextField } from 'components/Styled';
import { ReactNode, useEffect, useState } from 'react';
import { isMobileOnly } from 'react-device-detect';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { generateReCreatePurchaseOrderMessage, reCreatePurchaseOrder } from 'services/PurchaseOrder/purchase-order-api';
import { PurchaseOrderLine, ReCreatePurchaseOrderLineRequest, ReCreatePurchaseOrderRequest } from 'services/PurchaseOrder/purchase-order-type';
import { updateSaleOrderLineSupplierV2 } from 'services/SaleOrder/sale-order-api';
import { POLineSupplier, SaleOrderMessage, UpdateSaleOrderLineSupplierRequest, UpdateSaleOrderLineSupplierRequestV2 } from 'services/SaleOrder/sale-order-type';
import { searchSupplier } from 'services/Supplier/supplier-api';
import { SearchSupplierRequest, Supplier } from 'services/Supplier/supplier-type';

export interface BuyingDialogProps {
    open: boolean;
    poId: string | undefined;
    poLine: PurchaseOrderLine[] | undefined;
    onClose: (val: boolean | false) => void;
}

export default function BuyingDialog({ open, poId, poLine, onClose }: BuyingDialogProps): JSX.Element {
    const { t } = useTranslation();
    const [supplierList, setSupplierList] = useState<Supplier[]>([]);
    const [purchaseOrderLine, setPurchaseOrderLine] = useState<PurchaseOrderLine[] | undefined>();
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [poLineSupplier, setPoLineSupplier] = useState<POLineSupplier[]>([]);
    const [messageList, setMessageList] = useState<SaleOrderMessage[]>([]);
    const [activeStep, setActiveStep] = useState(0);
    const [sharedIndexes, setSharedIndexes] = useState([]);
    const [actionType, setActionType] = useState<string>('');
    const [title, setTitle] = useState<string>('');
    const [msg, setMsg] = useState<string>('');
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);

    const steps = [t('purchaseOrder.purchaseSection.step1'), t('purchaseOrder.purchaseSection.step2')];

    const defaultSearchSupplier: SearchSupplierRequest = {
        idEqual: '',
        nameContain: '',
        typeIn: ['สวนดอกไม้', 'สวนใบไม้', 'ร้านในปากคลองตลาด', 'พ่อค้าคนกลาง'],
        rankEqual: '',
        mainProductContain: '',
        productTypeEqual: '',
        statusEqual: 'ACTIVE',
        contactNameContain: '',
        contactNumberContain: '',
        creditTermEqual: '',
        bankEqual: '',
        typeEqual: ''
    };

    const clamp = (n: number, min: number, max: number) =>
        Math.min(max, Math.max(min, n));

    const handlePriceChange =
        (index: number) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                if (!selectedSupplier) return;
                const inputValue = e.target.value; // ปล่อยเป็น string ได้ (รวมถึง '')

                setPurchaseOrderLine(prev => {
                    const next = [...prev];
                    next[index] = { ...next[index], salesPrice: inputValue === '' ? '' : inputValue }; // ยังไม่บังคับเป็น number
                    return next;
                });
            };

    const handlePriceBlur =
        (index: number, poLine: PurchaseOrderLine) =>
            (e: React.FocusEvent<HTMLInputElement>) => {
                if (!selectedSupplier) return;

                const raw = e.target.value.trim();

                // ว่าง → เคลียร์เป็น null
                if (raw === '') {
                    setPurchaseOrderLine(prev => {
                        const next = [...prev];
                        next[index] = { ...next[index], salesPrice: null };
                        return next;
                    });
                    setPoLineSupplier(prev => {
                        const i = prev.findIndex(it => it.supplierId === selectedSupplier.supplierId && it.poLineId === poLine.id);
                        if (i === -1) return prev;
                        const copy = [...prev];
                        copy[i] = { ...copy[i], salePrice: null }; // ✅ เคลียร์ salePrice (ไม่ใช่ orderQty)
                        return copy;
                    });
                    return;
                }

                // มีค่า → แปลงเป็น number
                let val = Number(raw);
                if (Number.isNaN(val)) val = 1; // กัน NaN

                // เขียนกลับเข้าไลน์
                setPurchaseOrderLine(prev => {
                    const next = [...prev];
                    next[index] = { ...next[index], salesPrice: val };
                    return next;
                });

                // upsert เข้า poLineSupplier (key = supplierId + poLineId)
                setPoLineSupplier(prev => {
                    const keyMatch = (it: POLineSupplier) => it.supplierId === selectedSupplier.supplierId && it.poLineId === poLine.id;
                    const existingIndex = prev.findIndex(keyMatch);

                    const updatedItem: POLineSupplier = {
                        poLineId: poLine.id,
                        supplierId: selectedSupplier.supplierId,
                        supplierName: selectedSupplier.supplierName,
                        orderQty: poLine.orderQty - poLine.receiveQty, // ❗อย่าใส่ val มาที่ orderQty
                        salePrice: val,
                        productSku: poLine.product.productSku,
                        productName: poLine.product.productNameTh,
                        remark: poLine.saleOrderLine.remark
                    };

                    if (existingIndex !== -1) {
                        const copy = [...prev];
                        copy[existingIndex] = { ...copy[existingIndex], salePrice: val };
                        return copy;
                    }
                    return [...prev, updatedItem];
                });
            };

    const handleQtyChange =
        (index: number) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const inputValue = e.target.value; // เก็บเป็น string ระหว่างพิมพ์

                if (!selectedSupplier) return;

                // อัปเดต state แถวบนโต๊ะ (ปล่อยให้เป็น string หรือค่าว่างได้)
                setPurchaseOrderLine(prev => {
                    const next = [...prev];
                    next[index] = { ...next[index], orderQty: inputValue === '' ? '' : inputValue };
                    return next;
                });
            };

    // บังคับช่วง/อัปเดต mapping ตอน blur
    const handleQtyBlur =
        (index: number, poLine: PurchaseOrderLine) =>
            (e: React.FocusEvent<HTMLInputElement>) => {
                if (!selectedSupplier) return;

                const raw = e.target.value.trim();
                if (raw === '') {
                    // ถ้าปล่อยว่าง ให้เคลียร์ค่ากลับไป null ทั้งสองฝั่ง
                    setPurchaseOrderLine(prev => {
                        const next = [...prev];
                        next[index] = { ...next[index], orderQty: null };
                        return next;
                    });
                    setPoLineSupplier(prev => {
                        const i = prev.findIndex(
                            it => it.supplierId === selectedSupplier.supplierId && it.poLineId === poLine.id
                        );
                        if (i === -1) return prev;
                        const copy = [...prev];
                        copy[i] = { ...copy[i], orderQty: null };
                        return copy;
                    });
                    return;
                }

                // แปลงเป็นตัวเลขและ clamp ตอน blur
                let val = Number(raw);
                if (Number.isNaN(val)) val = 1;
                val = clamp(val, 1, poLine.qty - poLine.haveQty);

                console.log('Val : ' + val)
                // เขียนกลับออเดอร์ไลน์
                setPurchaseOrderLine(prev => {
                    const next = [...prev];
                    next[index] = { ...next[index], orderQty: val };
                    return next;
                });

                // upsert เข้า poLineSupplier โดยผูกกับ supplier + poLine (จะได้ไม่ซ้ำ)
                setPoLineSupplier(prev => {
                    const keyMatch = (it: POLineSupplier) =>
                        it.supplierId === selectedSupplier.supplierId && it.poLineId === poLine.id;

                    const existingIndex = prev.findIndex(keyMatch);
                    const updatedItem: POLineSupplier = {
                        poLineId: poLine.id,
                        supplierId: selectedSupplier.supplierId,
                        supplierName: selectedSupplier.supplierName,
                        orderQty: val,
                        salePrice: poLine.salesPrice,
                        productSku: poLine.product.productSku,
                        productName: poLine.product.productNameTh,
                        remark: poLine.saleOrderLine.remark
                    };

                    if (existingIndex !== -1) {
                        const copy = [...prev];
                        copy[existingIndex] = updatedItem;
                        return copy;
                    }
                    return [...prev, updatedItem];
                });
            };

    const handleShareToLine = (msg, id, index) => {
        let textMessage = msg.message.replace(/<br\s*\/?>/gi, '\n').trim();
        if (!textMessage.endsWith('\n')) {
            textMessage += '\n';
        }

        const encoded = encodeURIComponent(textMessage);
        const lineUrl = `https://line.me/R/share?text=${encoded}`;
        window.open(lineUrl, '_blank', 'noopener,noreferrer');

        // Mark as shared
        setSharedIndexes((prev) => [...prev, index]);

    };

    const handleReCreatePO = () => {
        const lineReq: ReCreatePurchaseOrderLineRequest[] =
            poLineSupplier.map(supp => ({
                orderQty: supp.orderQty,
                salePrice: supp.salePrice,
                polId: supp.poLineId,
            }));

        const req: ReCreatePurchaseOrderRequest = {
            supplierId: poLineSupplier[0].supplierId,
            lines: lineReq,
        };

        toast.promise(reCreatePurchaseOrder(poId, req), {
            loading: t('toast.loading'),
            success: () => {
                handleReset();
                onClose(true);
                return t('toast.success');
            },
            error: () => {
                return t('toast.failed');
            }
        });
    };

    const handleSavePoLineSupplier = () => {
        const updateObj: UpdateSaleOrderLineSupplierRequestV2 = {
            suppliers: poLineSupplier.map(supplier => ({
                supplierId: supplier.supplierId,
                supplierName: supplier.supplierName,
                orderQty: Number(supplier.orderQty),
                salePrice: Number(supplier.salePrice),
                productSku: supplier.productSku,
                productName: supplier.productName,
                poLineId: supplier.poLineId
            }))
        }
        console.log(JSON.stringify(updateObj));

        toast.promise(updateSaleOrderLineSupplierV2(poId, updateObj), {
            loading: t('toast.loading'),
            success: () => {
                handleReset();
                onClose(true);
                return t('toast.success');
            },
            error: () => {
                return t('toast.failed');
            }
        });
    }

    const handleGenerateMessage = () => {
        const updateObj: UpdateSaleOrderLineSupplierRequest = {
            suppliers: poLineSupplier.map(supplier => ({
                supplierId: supplier.supplierId,
                supplierName: supplier.supplierName,
                orderQty: Number(supplier.orderQty),
                salePrice: Number(supplier.salePrice),
                productSku: supplier.productSku,
                productName: supplier.productName
            }))
        }
        toast.promise(generateReCreatePurchaseOrderMessage(poId, updateObj), {
            loading: t('toast.loading'),
            success: (response: SaleOrderMessage[]) => {
                setMessageList(response);
                setActiveStep((prevActiveStep) => prevActiveStep + 1);
                return t('toast.success');
            },
            error: () => {
                return t('toast.failed');
            }
        });
    }

    const handleNext = () => {
        handleGenerateMessage();
    };

    const handleReset = () => {
        setActiveStep(0);
        setSharedIndexes([]);
        setPoLineSupplier([]);
        setSelectedSupplier(null);
        setPurchaseOrderLine(poLine);
    };

    useEffect(async () => {
        if (!open) {
            handleReset();
        }

        if (open) {
            setPurchaseOrderLine(
                (poLine ?? []).map(l => ({
                    ...l,
                    salesPrice: l.salesPrice === 0 ? null : l.salesPrice
                }))
            );
            const suppliers = await searchSupplier(defaultSearchSupplier, 1, 500);
            setSupplierList(suppliers.data.suppliers);
        }

    }, [open]);


    return (
        <Dialog open={open} maxWidth="sm" fullWidth aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">{t('purchaseOrder.buying')}</DialogTitle>
            <DialogContent style={{ paddingLeft: '10px', paddingRight: '10px' }}>
                <Stepper activeStep={activeStep}>
                    {steps.map((label, index) => {
                        const stepProps: { completed?: boolean } = {};
                        const labelProps: {
                            optional?: ReactNode;
                        } = {};
                        return (
                            <Step key={label} {...stepProps}>
                                <StepLabel {...labelProps}>{label}</StepLabel>
                            </Step>
                        );
                    })}
                </Stepper>
                {activeStep === 0 && (
                    <Grid container spacing={1} style={{ marginTop: '15px' }}>
                        <Grid container spacing={1}>
                            <GridTextField item xs={12} sm={12}>
                                <Autocomplete
                                    options={supplierList || []}
                                    isOptionEqualToValue={(opt, val) => opt.supplierId === val.supplierId}
                                    getOptionLabel={(option) => option.phoneContactName}
                                    renderOption={(props, option) => (
                                        <li {...props}>
                                            {option.phoneContactName}
                                        </li>
                                    )}
                                    noOptionsText="ไม่พบคู่ค้า"
                                    value={selectedSupplier}
                                    onChange={(_, newValue) => setSelectedSupplier(newValue)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            label={t('purchaseOrder.purchaseSection.supplierName')}
                                            disabled={supplierList.length === 0}
                                            variant="outlined"
                                            InputLabelProps={{ shrink: true }}
                                            InputProps={{
                                                ...params.InputProps,
                                                sx: {
                                                    height: 40,
                                                    p: 0,
                                                    '& .MuiInputBase-input': { px: 1.75, boxSizing: 'border-box' }
                                                }
                                            }}
                                        />
                                    )}
                                />
                            </GridTextField>
                        </Grid>
                        <TableContainer>
                            <Table id="poLine_list___table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center" key="supplierName" style={isMobileOnly ? { padding: '5px 2px' } : { width: 'auto' }}>
                                            <Typography>{t('purchaseOrder.purchaseSection.productName')}</Typography>
                                        </TableCell>
                                        <TableCell align="center" key="orderQty" style={isMobileOnly ? { width: '65px', padding: '5px 2px' } : { width: 'auto' }}>
                                            <Typography>{t('purchaseOrder.purchaseSection.needToOrder')}</Typography>
                                        </TableCell>
                                        <TableCell align="center" key="salePrice" style={isMobileOnly ? { width: '65px', padding: '5px 2px' } : { width: 'auto' }}>
                                            <Typography>{t('purchaseOrder.purchaseSection.salePrice')}</Typography>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {purchaseOrderLine && purchaseOrderLine?.length > 0 && purchaseOrderLine?.map((pl, index) => (
                                        <TableRow key={index}>
                                            <TableCell align="left" style={isMobileOnly ? { padding: '5px 2px' } : { width: 'auto' }}>
                                                {pl.product.productNameTh} <br />
                                                <Typography variant="caption">อ้างอิง: {pl.id}</Typography><br />
                                                <Typography variant="caption">❌ {pl.orderQty - pl.receiveQty}</Typography>
                                            </TableCell>
                                            <TableCell align="center" style={isMobileOnly ? { padding: '5px 2px' } : { width: 'auto' }}>
                                                <NumberTextField
                                                    required
                                                    value={pl.orderQty - pl.receiveQty}                // ใช้ null แทน '' ระหว่างพิมพ์ได้
                                                    onChange={(val) => {
                                                        // ให้ onChange เก็บ raw input ระหว่างพิมพ์
                                                        handleQtyChange(index, pl)({ target: { value: val } } as any);
                                                    }}
                                                    onBlur={(e) => {
                                                        // เวลา blur ค่อย clamp + upsert
                                                        handleQtyBlur(index, pl)(e);
                                                    }}
                                                    min={1}
                                                    sx={{
                                                        '& input': { height: 35, width: 50, p: '0 2px', boxSizing: 'border-box', textAlign: 'center' },
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="center" style={isMobileOnly ? { padding: '5px 2px' } : { width: 'auto' }}>
                                                <TextField
                                                    type="text"
                                                    style={{ width: '40px' }}
                                                    value={pl.salesPrice ?? ''}              // ปล่อยให้เป็น '' ได้ระหว่างพิมพ์
                                                    onChange={handlePriceChange(index, pl)}  // ไม่แปลง/ไม่ clamp ตอนพิมพ์
                                                    onBlur={handlePriceBlur(index, pl)}      // ✅ ค่อย clamp + upsert ตอน blur
                                                    disabled={selectedSupplier === null}
                                                    sx={{
                                                        '& input': {
                                                            height: '35px',
                                                            width: '60px',
                                                            padding: '0 5px',
                                                            boxSizing: 'border-box',
                                                            textAlign: 'center',
                                                        },
                                                        // For Chrome, Safari, Edge, Opera
                                                        '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                                                            display: 'none'
                                                        },
                                                        // For Firefox
                                                        '& input[type=number]': {
                                                            MozAppearance: 'textfield'
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                )}

                {activeStep === 1 && (
                    <Grid container spacing={1} style={{ marginTop: '15px' }}>
                        {messageList?.map((msg: SaleOrderMessage, index) => {
                            return (
                                <Grid item xs={12} sm={12} key={msg.supplierId} style={{ marginTop: '20px' }}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={8}
                                        label={msg.supplierLineGroupName}
                                        variant="outlined"
                                        value={msg.message.replace(/<br\s*\/?>/gi, '\n')}
                                        InputLabelProps={{ shrink: true }}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => handleShareToLine(msg, msg.supplierId, index)}
                                                        sx={{
                                                            backgroundColor: sharedIndexes.includes(index) ? 'green' : 'grey.200',
                                                            borderRadius: '50%',
                                                            padding: 1,
                                                            '&:hover': {
                                                                backgroundColor: sharedIndexes.includes(index) ? 'darkgreen' : 'grey.300',
                                                            },
                                                        }}
                                                    >
                                                        <IosShare style={sharedIndexes.includes(index) ? { color: 'white' } : {}} />
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={handleReset}
                    variant="contained"
                    startIcon={<Restore />}
                    className="btn-amber-orange"
                >
                    {t('button.clear')}
                </Button>
                <Button
                    onClick={() => {
                        setActionType('close')
                        setTitle(t('message.clearDataTitle'));
                        setMsg(t('message.clearDataMsg'));
                        setVisibleConfirmationDialog(true);
                    }}
                    variant="contained"
                    startIcon={<Close />}
                    className="btn-cool-grey"
                >
                    {t('button.close')}
                </Button>
                {activeStep === 0 && (
                    <Button
                        className="btn-indigo-blue"
                        variant="contained"
                        startIcon={<NavigateNext />}
                        disabled={poLineSupplier.length === 0}
                        onClick={() => {
                            handleNext()
                        }}
                    >
                        {t('button.next')}
                    </Button>
                )}
                {activeStep === 1 && (
                    <Button
                        className="btn-emerald-green"
                        variant="contained"
                        startIcon={<ShoppingCart />}
                        onClick={() => {
                            setActionType('re_create')
                            setTitle(t('procurement.purchaseOrder.new.message.reCreatePoTitle'));
                            setMsg(t('procurement.purchaseOrder.new.message.reCreatePoMsg'));
                            setVisibleConfirmationDialog(true);
                        }}
                    >
                        สั่งซื้อ
                    </Button>
                )}
            </DialogActions>
            <ConfirmDialog
                open={visibleConfirmationDialog}
                title={title}
                message={msg}
                confirmText={t('button.confirm')}
                cancelText={t('button.cancel')}
                onConfirm={() => {
                    if (actionType === 're_create') {
                        handleReCreatePO()
                    } else if (actionType === 'close') {
                        handleReset();
                        onClose(false);
                    }
                    setVisibleConfirmationDialog(false);
                }}
                onCancel={() => setVisibleConfirmationDialog(false)}
                isShowCancelButton={true}
                isShowConfirmButton={true}
            />
        </Dialog >
    );
}
