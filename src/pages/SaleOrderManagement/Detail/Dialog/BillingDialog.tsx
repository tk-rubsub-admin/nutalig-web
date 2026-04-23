/* eslint-disable no-unused-vars */
/* eslint-disable prettier/prettier */
import { TableContainer } from '@material-ui/core';
import { Restore, Close, Save, ReceiptLong, Print, Sync } from '@mui/icons-material';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, InputAdornment, Table, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import ConfirmDialog from 'components/ConfirmDialog';
import { GridTextField } from 'components/Styled';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useEffect, useState } from 'react';
import { isMobileOnly } from 'react-device-detect';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { OrderPackage, SaleOrder, SaleOrderLine, UpdateSaleOrderBilling, UpdateSaleOrderRequest } from 'services/SaleOrder/sale-order-type';
import { downloadSaleOrder, updateSaleOrder, updateSaleOrderBilling, updateSaleOrderPackage } from 'services/SaleOrder/sale-order-api';
import { makeStyles } from '@mui/styles';
import styled from 'styled-components';
import { FreightPrice } from 'services/Freight/freight-type';


export interface BillingDialogProps {
    open: boolean;
    po: SaleOrder | undefined;
    orderPackage: OrderPackage | undefined;
    freights: FreightPrice[] | [];
    onClose: (val: boolean | false) => void;
}

const NoArrowTextField = styled(TextField)({
    '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
        display: 'none',
    },
    '& input[type=number]': {
        MozAppearance: 'textfield',
    },
});
export default function BillingDialog(props: BillingDialogProps): JSX.Element {
    const { open, po, orderPackage, freights, onClose } = props;
    const { t } = useTranslation();
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
    const [enableOpenBillButton, setEnableOpenBillButton] = useState(true);
    const [changeBox, setChangeBox] = useState(false);
    const [title, setTitle] = useState<string>('')
    const [msg, setMsg] = useState<string>('')
    const [action, setAction] = useState<string>('')
    const useStyles = makeStyles({
        hideObject: {
            display: 'none'
        }
    });
    const classes = useStyles();

    useEffect(() => {
        if (open) {
            setChangeBox(false);
        }
    }, [open]);

    const handlePackageChange = (fieldName: string, value: number) => {
        formik.setFieldValue(fieldName, value);

        const freight = freights.find(f => f.packages === fieldName);
        if (!freight) return;

        const packagePoLine = {
            itemName: freight.packageName,
            itemSku: freight.packageProductSku,
            qty: value,
            status: 'COMPLETE',
            salesPrice: freight.packagePrice

        };

        const freightPoLine = {
            itemName: freight.freightName,
            itemSku: freight.freightProductSku,
            qty: value,
            status: 'COMPLETE',
            salesPrice: freight.freightPrice
        };

        let updatedPoLines = formik.values.poLines.filter(
            pol => pol.itemName !== freight.packageName && pol.itemName !== freight.freightName
        );

        if (value > 0) {
            if (packagePoLine.salesPrice > 0) {
                updatedPoLines = [...updatedPoLines, packagePoLine];
            }
            if (freightPoLine.salesPrice > 0) {
                updatedPoLines = [...updatedPoLines, freightPoLine];
            }
        }

        formik.setFieldValue('poLines', updatedPoLines);
    };

    const initialFreight = () => {
        if (!orderPackage || !po) return;

        const packageFields = [
            'bigBox',
            'smallBox',
            'softBox',
            'bigFoamBox',
            'smallFoamBox',
            'wrap',
            'oasis',
            'bag',
            'other',
        ] as const;

        let updatedPoLines = po.saleOrderLines.filter(pol => pol.status !== 'CANCEL');

        for (const field of packageFields) {
            const value = orderPackage[field];
            if (typeof value !== 'number' || value <= 0) continue;

            const freight = freights.find(f => f.packages === field);
            if (!freight) continue;

            const packagePoLine = {
                itemSku: freight.packageProductSku,
                itemName: freight.packageName,
                qty: value,
                status: 'COMPLETE',
                salesPrice: freight.packagePrice,
                no: 200
            };

            const freightPoLine = {
                itemSku: freight.freightProductSku,
                itemName: freight.freightName,
                qty: value,
                status: 'COMPLETE',
                salesPrice: freight.freightPrice,
                no: 200
            };

            // Remove duplicates
            updatedPoLines = updatedPoLines.filter(
                pol => pol.itemName !== freight.packageName && pol.itemName !== freight.freightName
            );

            // Add if price > 0
            if (packagePoLine.salesPrice > 0) updatedPoLines.push(packagePoLine);
            if (freightPoLine.salesPrice > 0) updatedPoLines.push(freightPoLine);

            // Update field value like 'bigBox', 'smallBox', etc.
            formik.setFieldValue(field, value);
        }

        // Set all poLines at once
        formik.setFieldValue('poLines', updatedPoLines);
    }

    const formik = useFormik({
        initialValues: {
            poId: po ? po.id : '',
            bigBox: orderPackage?.bigBox,
            smallBox: orderPackage?.smallBox,
            softBox: orderPackage?.softBox,
            bigFoamBox: orderPackage?.bigFoamBox,
            smallFoamBox: orderPackage?.smallFoamBox,
            wrap: orderPackage?.wrap,
            oasis: orderPackage?.oasis,
            bag: orderPackage?.bag,
            other: orderPackage?.other,
            poLines: po ? po.saleOrderLines.filter(pol => pol.status !== 'CANCEL') : [],
        },
        validationSchema: Yup.object().shape({
            poId: Yup.string().required(),
            poLines: Yup.array().of(
                Yup.object().shape({
                    salesPrice: Yup.number()
                        .typeError('Sale price must be a number')
                        .required('Sale price is required')
                        .moreThan(0, 'Sale price must be greater than 0')
                })
            )
        }),
        enableReinitialize: true,
        onSubmit: async (values, actions) => {
            actions.setSubmitting(true);
            if (changeBox) {
                const orderPackage: OrderPackage = {
                    bigBox: values.bigBox,
                    smallBox: values.smallBox,
                    softBox: values.softBox,
                    bigFoamBox: values.bigFoamBox,
                    smallFoamBox: values.smallFoamBox,
                    wrap: values.wrap,
                    oasis: values.oasis,
                    bag: values.bag,
                    other: values.other,
                    packedStaff: []
                };
                await toast.promise(updateSaleOrderPackage(values.poId, orderPackage), {
                    loading: t('toast.loading'),
                    success: () => {
                        return t('toast.success');
                    },
                    error: () => {
                        return t('toast.failed');
                    }
                });
            }

            const updateReq: UpdateSaleOrderBilling = {
                poLines: values.poLines
            }

            await toast.promise(updateSaleOrderBilling(values.poId, updateReq), {
                loading: t('toast.loading'),
                success: () => {
                    setEnableOpenBillButton(false)
                    return t('toast.success');
                },
                error: () => {
                    return t('toast.failed');
                }
            });
        }
    });

    function getSalePriceError(index: number): string {
        const touched = formik.touched.poLines?.[index]?.salesPrice;
        const error = formik.errors.poLines?.[index]?.salesPrice;
        return touched && error ? String(error) : '';
    }

    const changeBillingStatus = (id: string) => {
        const updateReq: UpdateSaleOrderRequest = {
            poStatus: null,
            billingStatus: 'เปิดบิลแล้ว',
            sendingTime: null,
            freight: null,
            additionalItem: null,
            remark: null
        }
        toast.promise(updateSaleOrder(id, updateReq), {
            loading: t('toast.loading'),
            success: () => {
                onClose(true);
                return t('toast.success');
            },
            error: () => {
                return t('toast.failed');
            }
        });

    }

    const downloadSaleOrderFunction = (po: SaleOrder) => {
        toast.promise(downloadSaleOrder(po.id), {
            loading: t('toast.loading'),
            success: (response) => {
                // Create a temporary URL for the Blob
                const url = window.URL.createObjectURL(new Blob([response.data]));

                let filename = po.invoiceNo; // fallback
                const match = response.headers['content-disposition']?.match(/filename="?([^"]+)"?/);
                if (match && match[1]) {
                    filename = match[1];
                }

                // Create a temporary <a> element to trigger the download
                const tempLink = document.createElement('a');
                tempLink.href = url;
                tempLink.setAttribute('download', filename); // Set the desired filename for the downloaded file

                // Append the <a> element to the body and click it to trigger the download
                document.body.appendChild(tempLink);
                tempLink.click();

                // Clean up the temporary elements and URL
                document.body.removeChild(tempLink);
                window.URL.revokeObjectURL(url);
                return t('toast.success');
            },
            error: () => {
                return t('toast.failed');
            }
        });
    };

    useEffect(() => {
        if (!po) return;

        const allSalesPriceValid = po.saleOrderLines.filter(line => line.status !== 'CANCEL').every(line => line.salesPrice > 0);

        setEnableOpenBillButton(!(allSalesPriceValid));
    }, [po]);

    useEffect(() => {
        initialFreight();
    }, [open]);

    return (
        <Dialog open={open} maxWidth="xs" fullWidth aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">
                {t('purchaseOrder.billingSection.title', { poId: po?.id })}
            </DialogTitle>
            <DialogContent>
                <br />
                <Grid container spacing={1}>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.bigBox')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.bigBox === 0 ? '' : formik.values.bigBox}
                            onChange={({ target }) => {
                                setChangeBox(true);
                                handlePackageChange('bigBox', target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.smallBox')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.smallBox === 0 ? '' : formik.values.smallBox}
                            onChange={({ target }) => {
                                setChangeBox(true);
                                handlePackageChange('smallBox', target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.softBox')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.softBox === 0 ? '' : formik.values.softBox}
                            onChange={({ target }) => {
                                setChangeBox(true);
                                handlePackageChange('softBox', target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.bigFoamBox')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.bigFoamBox === 0 ? '' : formik.values.bigFoamBox}
                            onChange={({ target }) => {
                                setChangeBox(true);
                                handlePackageChange('bigFoamBox', target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.smallFoamBox')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.smallFoamBox === 0 ? '' : formik.values.smallFoamBox}
                            onChange={({ target }) => {
                                setChangeBox(true);
                                handlePackageChange('smallFoamBox', target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.wrap')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.wrap === 0 ? '' : formik.values.wrap}
                            onChange={({ target }) => {
                                setChangeBox(true);
                                handlePackageChange('wrap', target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.oasis')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.oasis === 0 ? '' : formik.values.oasis}
                            onChange={({ target }) => {
                                setChangeBox(true);
                                handlePackageChange('oasis', target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.bag')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.bag === 0 ? '' : formik.values.bag}
                            onChange={({ target }) => {
                                setChangeBox(true);
                                handlePackageChange('bag', target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.other')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.other === 0 ? '' : formik.values.other}
                            onChange={({ target }) => {
                                setChangeBox(true);
                                handlePackageChange('other', target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                </Grid>
                <Box sx={{ maxHeight: 300, overflowY: 'auto', overflowX: 'auto' }}>
                    <TableContainer>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell style={{ textAlign: 'center' }}>
                                        {t('purchaseOrder.productSection.fields.labels.name')}
                                    </TableCell>
                                    <TableCell style={{ textAlign: 'center', width: isMobileOnly ? '60px' : '95px' }}>
                                        {t('purchaseOrder.productSection.fields.labels.qty')}
                                    </TableCell>
                                    <TableCell style={{ textAlign: 'center', width: isMobileOnly ? '60px' : '100px' }}>
                                        {t('purchaseOrder.productSection.fields.labels.salePrice')}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {formik.values.poLines
                                    // .filter(pol => pol.status !== 'CANCEL')
                                    .map((pol: SaleOrderLine, index) => {
                                        return (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    {pol.itemName}
                                                </TableCell>
                                                <TableCell style={{ textAlign: 'center' }}>
                                                    {pol.qty}
                                                </TableCell>
                                                <TableCell>
                                                    <NoArrowTextField
                                                        inputProps={{
                                                            inputMode: 'numeric',
                                                            pattern: '[0-9]*',
                                                            min: 1
                                                        }}
                                                        disabled={pol.status === 'CANCEL'}
                                                        value={pol.salesPrice === 0 ? '' : pol.salesPrice}
                                                        error={Boolean(getSalePriceError(index))}
                                                        type="number"
                                                        sx={{
                                                            width: isMobileOnly ? 55 : 80,
                                                            maxWidth: isMobileOnly ? 55 : 100,
                                                            minWidth: isMobileOnly ? 55 : 78,
                                                            // For Chrome, Safari, Edge, Opera
                                                            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                                                                display: 'none'
                                                            },
                                                            // For Firefox
                                                            '& input[type=number]': {
                                                                MozAppearance: 'textfield'
                                                            }
                                                        }}
                                                        onChange={(e) => {
                                                            const value = (e.target.value) || 0;
                                                            const updatedList = formik.values.poLines.map((line, i) =>
                                                                i === index ? { ...line, salesPrice: Number(value) } : line
                                                            );
                                                            formik.setFieldValue('poLines', updatedList);
                                                        }}
                                                        size="small"
                                                        InputProps={{
                                                            endAdornment: !isMobileOnly ? (
                                                                <InputAdornment position="end">฿</InputAdornment>
                                                            ) : null,
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        setTitle(t('message.confirmCloseTitle'));
                        setMsg(t('message.confirmCloseMsg'));
                        setAction('CLOSE');
                        setVisibleConfirmationDialog(true);
                    }}
                    variant="contained"
                    startIcon={<Close />}
                    className="btn-cool-grey">
                    {t('button.close')}
                </Button>
                <Button
                    onClick={() => {
                        setTitle(t('message.confirmUpdateBillingTitle', { poId: po?.id }));
                        setMsg(t('message.confirmUpdateBillingMsg'));
                        setAction('SUBMIT');
                        setVisibleConfirmationDialog(true);
                    }}
                    variant="contained"
                    startIcon={<Save />}
                    className="btn-emerald-green"
                >
                    {t('button.save')}
                </Button>
                {po?.billingStatus === 'ยังไม่ได้เปิดบิล' ? (
                    <Button
                        onClick={() => {
                            setTitle(t('purchaseOrder.confirmOpenBillTitle', { poId: po?.id }));
                            setMsg(t('purchaseOrder.confirmOpenBillMsg'));
                            setAction('OPEN');
                            setVisibleConfirmationDialog(true);
                        }}
                        variant="contained"
                        disabled={enableOpenBillButton}
                        startIcon={<ReceiptLong />}
                        className="btn-indigo-blue">
                        {t('purchaseOrder.billingSection.openBill')}
                    </Button>
                ) : (
                    <Button
                        onClick={() => {
                            if (!po) return;
                            downloadSaleOrderFunction(po);
                        }}
                        variant="contained"
                        startIcon={<Print />}
                        className="btn-indigo-blue">
                        {t('purchaseOrder.billingSection.downloadInvoice')}
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
                    if (action === 'SUBMIT') {
                        formik.handleSubmit();
                    } else if (action === 'CLOSE') {
                        formik.resetForm();
                        onClose(false);
                    } else if (action === 'OPEN') {
                        if (!po) return;
                        changeBillingStatus(po.id)
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
