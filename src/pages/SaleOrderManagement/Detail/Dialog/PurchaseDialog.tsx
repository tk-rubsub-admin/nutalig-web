/* eslint-disable prettier/prettier */
import { Restore, Close, Save, LocalPhone, NavigateNext, IosShare } from '@mui/icons-material';
import { Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, InputAdornment, Step, StepLabel, Stepper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import NumberTextField from 'components/NumberTextField';
import { ReactNode, useEffect, useState } from 'react';
import { isMobileOnly } from 'react-device-detect';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { createProductSupplier } from 'services/Product/product-api';
import { CreateProductSupplier, ProductSupplier, ProductSupplierPrice } from 'services/Product/product-type';
import { generateSaleOrderMessage, updateSaleOrderLineSupplier } from 'services/SaleOrder/sale-order-api';
import { POLineSupplier, SaleOrderLine, SaleOrderMessage, UpdateSaleOrderLineSupplierRequest } from 'services/SaleOrder/sale-order-type';
import { searchSupplier } from 'services/Supplier/supplier-api';
import { SearchSupplierRequest, Supplier } from 'services/Supplier/supplier-type';
import { formaDateStringWithPattern } from 'utils';
import { shareViaLine } from 'utils/copyContent';
export interface PurchaseDialogProps {
    open: boolean;
    poId: string | undefined;
    poLine: SaleOrderLine | undefined;
    productSupplier: ProductSupplier | undefined;
    haveQty: number | 0;
    orderQty: number | 0;
    onClose: (val: boolean | false) => void;
}

type NewSupplierRow = {
    id: string;
    supplier: Supplier | null;
    price: number | "";
    qty: number | "";
};

export default function PurchaseDialog(props: PurchaseDialogProps): JSX.Element {
    const { open, poId, poLine, productSupplier, haveQty, orderQty, onClose } = props;
    const { t } = useTranslation();
    const [supplierList, setSupplierList] = useState<Supplier[]>([]);
    const [poLineSupplier, setPoLineSupplier] = useState<POLineSupplier[]>([]);
    const [messageList, setMessageList] = useState<SaleOrderMessage[]>([]);
    const [activeStep, setActiveStep] = useState(0);
    const [sharedIndexes, setSharedIndexes] = useState([]);
    const [needToOrder, setNeedToOrder] = useState(0);
    const [rows, setRows] = useState<NewSupplierRow[]>([]);

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

    const handleQuantityChange =
        (sp: ProductSupplierPrice, poLine: SaleOrderLine) =>
            (val: number | null) => {
                setPoLineSupplier(prev => {
                    const idx = prev.findIndex(
                        it => it.supplierId === sp.supplier.supplierId && it.poLineId === poLine.id
                    );

                    const updated: POLineSupplier = {
                        poLineId: poLine.id,
                        supplierId: sp.supplier.supplierId,
                        supplierName: sp.supplier.supplierName,
                        orderQty: val,                   // ได้จาก NumberTextField (number | null)
                        salePrice: sp.price,
                        productSku: poLine.itemSku,
                        productName: poLine.itemName,
                        remark: poLine.remark
                    };

                    if (idx !== -1) {
                        const copy = [...prev];
                        copy[idx] = updated;
                        return copy;
                    }
                    return [...prev, updated];
                });
            };

    const handlePriceChange =
        (sp: ProductSupplierPrice, poLine: SaleOrderLine) =>
            (val: number | null) => {
                setPoLineSupplier(prev => {
                    const idx = prev.findIndex(
                        it => it.supplierId === sp.supplier.supplierId && it.poLineId === poLine.id
                    );

                    const updated: POLineSupplier = {
                        poLineId: poLine.id,
                        supplierId: sp.supplier.supplierId,
                        supplierName: sp.supplier.supplierName,
                        orderQty:
                            idx !== -1 ? prev[idx].orderQty : null,                   // ได้จาก NumberTextField (number | null)
                        salePrice: val,
                        productSku: poLine.itemSku,
                        productName: poLine.itemName,
                        remark: poLine.remark
                    };

                    if (idx !== -1) {
                        const copy = [...prev];
                        copy[idx] = updated;
                        return copy;
                    }
                    return [...prev, updated];
                });
            };

    const handleShareToLine = (msg, id, index) => {
        let textMessage = msg.message.replace(/<br\s*\/?>/gi, '\n').trim();
        if (!textMessage.endsWith('\n')) textMessage += '\n';
        shareViaLine(textMessage);

        setSharedIndexes((prev) => [...prev, index]);

    };

    const handleSavePoLineSupplier = () => {
        const updateObj: UpdateSaleOrderLineSupplierRequest = {
            suppliers: poLineSupplier.map((supplier) => {
                // หา index ของ message ที่เป็น supplier เดียวกัน
                const messageIndex = messageList.findIndex(
                    (msg) => msg.supplierId === supplier.supplierId
                );

                return {
                    supplierId: supplier.supplierId,
                    supplierName: supplier.supplierName,
                    orderQty: Number(supplier.orderQty),
                    salePrice: Number(supplier.salePrice),
                    productSku: supplier.productSku,
                    productName: supplier.productName,
                    poLineId: supplier.poLineId,
                    isShared: messageIndex !== -1 && sharedIndexes.includes(messageIndex),
                };
            }),
        };

        toast.promise(updateSaleOrderLineSupplier(poId, poLine?.id, updateObj), {
            loading: t('toast.loading'),
            success: () => {
                handleReset();
                onClose(true);
                return t('toast.success');
            },
            error: () => {
                return t('toast.failed');
            }
        }).then(() => {
            if (rows.length > 0) {
                const req: CreateProductSupplier = {
                    supplierId: rows[0].supplier?.supplierId,
                    salePrice: Number(rows[0].price)
                }
                toast.promise(createProductSupplier(poLine?.itemSku, req), {
                    loading: t('toast.loading'),
                    success: () => {
                        return t('toast.success');
                    },
                    error: () => {
                        return t('toast.failed');
                    }
                })
            }
        });
    }

    const handleGenerateMessage = () => {
        console.log('GenerateMessage', poLineSupplier);
        const updateObj: UpdateSaleOrderLineSupplierRequest = {
            suppliers: poLineSupplier
                .filter(supplier => supplier.orderQty !== null && supplier.orderQty !== 0)
                .map(supplier => ({
                    supplierId: supplier.supplierId,
                    supplierName: supplier.supplierName,
                    orderQty: Number(supplier.orderQty),
                    salePrice: Number(supplier.salePrice),
                    productSku: supplier.productSku,
                    productName: supplier.productName
                }))
        }
        toast.promise(generateSaleOrderMessage(poId, poLine?.id, updateObj), {
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

    const handleAddSupplier = () => {
        callGetSupplier();
        setRows(prev => [
            ...prev,
            { id: crypto.randomUUID(), supplier: null, price: "", qty: "" }
        ]);
    };

    // อัพเดตแถว
    const updateRow = (id: string, patch: Partial<NewSupplierRow>) => {
        setRows(prev => {
            const newRows = prev.map(r => (r.id === id ? { ...r, ...patch } : r));
            const updatedRow = newRows.find(r => r.id === id);

            if (updatedRow) {
                const isComplete =
                    updatedRow.supplier !== null &&
                    updatedRow.qty !== ""

                if (isComplete) {
                    const updatedItem: POLineSupplier = {
                        rowId: updatedRow.id,  // 👈 สำคัญ
                        poLineId: poLine?.id,
                        supplierId: updatedRow.supplier?.supplierId,
                        supplierName: updatedRow.supplier?.supplierName,
                        orderQty: updatedRow.qty,
                        salePrice: updatedRow.price,
                        productSku: poLine?.itemSku,
                        productName: poLine?.itemName,
                        remark: poLine.remark
                    };

                    setPoLineSupplier(prev => {
                        const idx = prev.findIndex(it => it.rowId === updatedRow.id);
                        console.log('idx', idx)
                        const next = [...prev];
                        if (idx >= 0) {
                            next[idx] = updatedItem; // update
                        } else {
                            next.push(updatedItem);  // insert
                        }
                        return next;
                    });
                }
            }

            return newRows;
        });
    };

    const handleNext = () => {
        console.log("poLine", poLineSupplier)
        handleGenerateMessage();
    };

    const handleReset = () => {
        setActiveStep(0);
        setSharedIndexes([]);
        setPoLineSupplier([]);
        setRows([]);
    };

    const callGetSupplier = async () => {
        const suppliers = await searchSupplier(defaultSearchSupplier, 1, 500);
        setSupplierList(suppliers.data.suppliers);
    }

    useEffect(() => {
        setNeedToOrder(orderQty - haveQty);
        if (!open) {
            handleReset();
        }
    }, [open]);


    return (
        <Dialog open={open} maxWidth="sm" fullWidth aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">{poLine?.itemName} <br /> <Typography variant="h4" color="error">จำนวน {needToOrder}</Typography></DialogTitle>
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
                        <Grid item xs={12} sm={12} style={{ textAlign: 'right' }}>
                            <Typography style={{ color: 'blue', fontSize: '12px' }}>{t('purchaseOrder.purchaseSection.updatedDate', { date: formaDateStringWithPattern(productSupplier?.updatedDate, 'DD/MM/YYYY HH:mm') })}</Typography>
                        </Grid>
                        <TableContainer>
                            <Table id="claim_list___table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center" key="no" style={isMobileOnly ? { padding: '5px 2px' } : { width: 'auto' }}>
                                            <Typography>{t('purchaseOrder.purchaseSection.no')}</Typography>
                                        </TableCell>
                                        <TableCell align="center" key="supplierName" style={isMobileOnly ? { padding: '5px 2px' } : { width: 'auto' }}>
                                            <Typography>{t('purchaseOrder.purchaseSection.supplierName')}</Typography>
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
                                    {productSupplier && productSupplier.suppliers.length > 0 && productSupplier.suppliers.map((sp, index) => (
                                        <>
                                            <TableRow key={index}>
                                                <TableCell align="center" style={isMobileOnly ? { padding: '5px 2px' } : { width: 'auto' }}>{index + 1}</TableCell>
                                                <TableCell align="left" style={isMobileOnly ? { padding: '5px 2px' } : { width: 'auto' }}>{sp.supplier?.supplierName}
                                                    <br />
                                                    {sp.supplier?.contactNumber.replaceAll('-', '') === '' ||
                                                        sp.supplier?.contactNumber.replaceAll('-', '') === '-' ? (
                                                        <></>
                                                    ) : (
                                                        <a
                                                            href={`tel:${sp.supplier?.contactNumber.replaceAll('-', '')}`}
                                                            style={{ textDecoration: 'none', color: 'inherit' }}
                                                            onClick={(event) => event.stopPropagation()}>
                                                            <LocalPhone style={{ fontSize: '15px', verticalAlign: 'middle' }} />{' '}
                                                            {sp.supplier?.contactNumber.replaceAll('-', '')}
                                                        </a>
                                                    )}
                                                </TableCell>
                                                <TableCell align="center" style={isMobileOnly ? { padding: '5px 2px' } : { width: 'auto' }}>
                                                    <NumberTextField
                                                        required
                                                        min={1}
                                                        max={needToOrder}               // ให้คอมโพเนนต์จัดการ clamp ให้เอง
                                                        value={
                                                            poLineSupplier.find(
                                                                s => s.supplierId === sp.supplier.supplierId && s.poLineId === poLine.id
                                                            )?.orderQty ?? null
                                                        }
                                                        onChange={handleQuantityChange(sp, poLine)}
                                                        size="small"
                                                        sx={{
                                                            '& input': {
                                                                height: '35px',
                                                                width: '50px',
                                                                padding: '0 2px',
                                                                boxSizing: 'border-box',
                                                                textAlign: 'center'
                                                            },
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="center" style={isMobileOnly ? { padding: '5px 2px' } : { width: 'auto' }}>
                                                    {/* <TextField
                                                        type="text"
                                                        style={{ width: '40px' }}
                                                        value={sp.price + '฿'}
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
                                                    /> */}
                                                    <NumberTextField
                                                        required
                                                        min={1}
                                                        value={
                                                            poLineSupplier.find(
                                                                s => s.supplierId === sp.supplier.supplierId && s.poLineId === poLine.id
                                                            )?.salePrice ?? sp.price
                                                        }
                                                        onChange={handlePriceChange(sp, poLine)}
                                                        size="small"
                                                        sx={{
                                                            '& input': {
                                                                height: '35px',
                                                                width: '70px',
                                                                padding: '0 5px',
                                                                boxSizing: 'border-box',
                                                                textAlign: 'right',
                                                            },
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        </>
                                    )) || (
                                            <TableRow>
                                                <TableCell colSpan={4} style={{ textAlign: 'center' }}>
                                                    ไม่พบคู่ค้า
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    <>
                                        {rows.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} style={{ textAlign: 'center' }}>
                                                    <br />
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        onClick={handleAddSupplier}
                                                        sx={{ mt: 1 }}
                                                    >
                                                        เพิ่มคู่ค้า
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            rows.map((row) => (
                                                <TableRow key={row.id}>
                                                    <TableCell colSpan={2} align="left" style={isMobileOnly ? { padding: '5px 2px' } : { width: 'auto' }}>
                                                        <Autocomplete<Supplier>
                                                            id={`supplier-${row.id}`}
                                                            options={supplierList || []}
                                                            getOptionLabel={(option) => option.phoneContactName}
                                                            noOptionsText="ไม่พบคู่ค้า"
                                                            value={row.supplier}
                                                            onChange={(_, newValue) => updateRow(row.id, { supplier: newValue })}
                                                            renderInput={(params) => (
                                                                <TextField
                                                                    {...params}
                                                                    fullWidth
                                                                    disabled={supplierList.length === 0}
                                                                    variant="outlined"
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
                                                    </TableCell>
                                                    <TableCell align="center" style={isMobileOnly ? { width: '65px', padding: '5px 2px' } : { width: 'auto' }}>
                                                        <NumberTextField
                                                            required
                                                            value={row.qty ?? null}
                                                            min={1}
                                                            max={needToOrder}
                                                            onChange={(val) => {
                                                                // val จะเป็น number | null จาก NumberTextField
                                                                // if (val !== null) {
                                                                updateRow(row.id, { qty: val });
                                                                // }
                                                            }}
                                                            size="small"
                                                            sx={{
                                                                '& input': {
                                                                    height: 35,
                                                                    width: 70,
                                                                    textAlign: 'right',
                                                                    px: 1.75,
                                                                    boxSizing: 'border-box',
                                                                },
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center" style={isMobileOnly ? { width: '65px', padding: '5px 2px' } : { width: 'auto' }}>
                                                        <NumberTextField
                                                            required
                                                            value={row.price ?? null}
                                                            min={1}
                                                            onChange={(val) => {
                                                                // val จะเป็น number | null จาก NumberTextField
                                                                updateRow(row.id, { price: val });
                                                            }}
                                                            size="small"
                                                            sx={{
                                                                '& input': {
                                                                    height: 35,
                                                                    width: 70,
                                                                    textAlign: 'right',
                                                                    px: 1.75,
                                                                    boxSizing: 'border-box',
                                                                },
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                )}

                {activeStep === 1 && (
                    <Grid container spacing={1} style={{ marginTop: '15px' }}>
                        {messageList?.map((msg: PurchaseOrderMessage, index) => {
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
                        onClose(false);
                    }}
                    variant="contained"
                    startIcon={<Close />}
                    className="btn-cool-grey"
                >
                    {t('button.close')}
                </Button>
                {activeStep === 0 && (
                    <Button
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
                        color="success"
                        variant="contained"
                        startIcon={<Save />}
                        onClick={() => {
                            handleSavePoLineSupplier()
                        }}
                    >
                        {t('button.save')}
                    </Button>
                )}
            </DialogActions>
        </Dialog >
    );
}
