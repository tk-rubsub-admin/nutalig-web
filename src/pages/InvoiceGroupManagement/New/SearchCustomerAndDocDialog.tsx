/* eslint-disable prettier/prettier */
import { Close } from '@mui/icons-material';
import { Autocomplete, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { GridSearchSection, GridTextField } from 'components/Styled';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { getAllCustomer } from 'services/Customer/customer-api';
import { Customer } from 'services/Customer/customer-type';
import { searchInvoice } from 'services/Invoice/invoice-api';
import { Invoice } from 'services/Invoice/invoice-type';
import { formatMoney } from 'utils';

export interface SearchCustomerAndDocDialogProps {
    open: boolean;
    onClose: () => void;
    onSelect: (payload: {
        customer: Customer;
        invoices: Invoice[];
    }) => void;

    initialCustomer?: Customer | null;
    initialInvoices?: Invoice[];
}

export default function SearchCustomerAndDocDialog(props: SearchCustomerAndDocDialogProps): JSX.Element {
    const {
        open,
        onClose,
        onSelect,
        initialCustomer = null,
        initialInvoices = []
    } = props;
    const { t } = useTranslation();

    const useStyles = makeStyles({
        hideObject: {
            display: 'none'
        },
        noResultMessage: {
            textAlign: 'center',
            fontSize: '1.2em',
            fontWeight: 'bold',
        },
        tableHeader: {
            border: '2px solid #e0e0e0',
            fontWeight: 'bold',
            paddingLeft: '10px',
            textAlign: 'center'
        },
        datePickerFromTo: {
            '&& .MuiOutlinedInput-input': {
                padding: '16.5px 14px'
            },
            '&& .MuiFormLabel-root': {
                fontSize: '13px'
            }
        },
    });
    const classes = useStyles();
    const { data: customerList, isFetching: isCustomerFetching } = useQuery(
        'get-all-customer',
        () => getAllCustomer({
            idEqual: '',
            nameContain: '',
            typeEqual: '',
            rankEqual: '',
            areaEqual: ''
        }),
        {
            enabled: open,                 // 🔑 เรียกเฉพาะตอน dialog เปิด
            refetchOnWindowFocus: false,
            staleTime: Infinity,            // 🔑 เรียกครั้งเดียว
            cacheTime: Infinity,            // 🔑 เก็บ cache ไว้ตลอด
        }
    );

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice[]>([]);
    const [totalAmount, setTotalAmount] = useState<number>(0);

    const { data: invoiceList, isFetching: isInvoiceFetching } = useQuery(
        ['search-invoice', selectedCustomer?.customerId],
        () =>
            searchInvoice({
                invoiceDate: '',
                poStatusIn: [],
                poStatusEqual: null,
                billingStatusIn: [],
                billingStatusEqual: '',
                customerIdEqual: selectedCustomer?.customerId,
                paymentStatusEqual: null,
                paymentStatusIn: ['UNPAID', 'PARTIALLY_PAID']
            }, 1, 500, 'invoiceDate'),
        {
            enabled: !!selectedCustomer, // 🔑 ยิงเมื่อเลือก customer แล้วเท่านั้น
            refetchOnWindowFocus: false,
            keepPreviousData: false,
        }
    );

    const getInvoiceDiff = (inv: Invoice) => inv.poAmount - inv.invoiceAmount;

    const handleToggleInvoice = (inv: Invoice) => {
        const diff = getInvoiceDiff(inv);

        setSelectedInvoice((prev) => {
            const exists = prev.some((i) => i.invoiceNo === inv.invoiceNo);

            if (exists) {
                setTotalAmount((amt) => amt - diff);
                return prev.filter((i) => i.invoiceNo !== inv.invoiceNo);
            } else {
                setTotalAmount((amt) => amt + diff);
                return [...prev, inv];
            }
        });
    };
    const handleToggleAll = () => {
        if (!invoiceList?.data?.invoices) return;

        if (selectedInvoice.length === invoiceList.data.invoices.length) {
            setSelectedInvoice([]);
            setTotalAmount(0);
        } else {
            setSelectedInvoice(invoiceList.data.invoices);

            const total = invoiceList.data.invoices.reduce(
                (sum: number, inv: Invoice) => sum + getInvoiceDiff(inv),
                0
            );
            setTotalAmount(total);
        }
    };

    const invoiceData = (!isInvoiceFetching &&
        invoiceList &&
        invoiceList.data.invoices.length > 0 &&
        invoiceList.data.invoices.map((inv: Invoice) => {
            const diff = getInvoiceDiff(inv);
            const checked = selectedInvoice.some(
                (i) => i.invoiceNo === inv.invoiceNo
            );
            return (
                <>
                    <TableRow
                        hover
                        id={`invoice__index-${inv.invoiceNo}`}
                        key={inv.invoiceNo}
                    >
                        <TableCell align="center" key={`check-index-${inv.invoiceNo}`}>
                            <Checkbox
                                checked={checked}
                                onChange={() => handleToggleInvoice(inv)}
                            />
                        </TableCell>
                        <TableCell align='center' key={inv.invoiceNo}>
                            {inv.invoiceNo}
                        </TableCell>
                        <TableCell align='center' key={inv.customer.customerName}>
                            {inv.customer.displayName}
                        </TableCell>
                        <TableCell align='center' key={inv.invoiceDate}>
                            {inv.invoiceDate ? dayjs(inv.invoiceDate).format('DD/MM/YYYY') : '-'}
                        </TableCell>
                        <TableCell align='right' key={inv.poAmount}>
                            {formatMoney(diff)}
                        </TableCell>
                    </TableRow>
                </>
            )
        })) || (
            <TableRow>
                <TableCell colSpan={5}>
                    <div className={classes.noResultMessage}>{t('billingManagement.new.pleaseSelectCustomer')}</div>
                </TableCell>
            </TableRow>
        );

    // useEffect(() => {
    //     if (!open) {
    //         setSelectedCustomer(undefined);
    //         setSelectedInvoice([]);
    //         setTotalAmount(0);
    //     }
    // }, [open]);

    useEffect(() => {
        if (open) {
            setSelectedCustomer(initialCustomer);
            setSelectedInvoice(initialInvoices);
            const total = initialInvoices.reduce(
                (sum: number, inv: Invoice) => sum + getInvoiceDiff(inv),
                0
            );
            setTotalAmount(total);
        }
    }, [open, initialCustomer, initialInvoices]);

    return (
        <Dialog open={open} maxWidth="md" fullWidth aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">
                {t('billingManagement.new.searchCustomerAndDoc')}
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={1}>
                    <GridTextField item xs={12} sm={6}>
                        <Typography>
                            {t('billingManagement.new.searchCustomer')}
                        </Typography>
                        <Autocomplete
                            disabled={isCustomerFetching}
                            options={customerList?.data || []}
                            getOptionLabel={(cust: Customer) => cust.customerName}
                            sx={{ width: '100%' }}
                            value={selectedCustomer}
                            onChange={(_event, value, reason) => {
                                if (reason === 'clear') {
                                    setSelectedCustomer(null);
                                    setSelectedInvoice([]);
                                    setTotalAmount(0);
                                } else {
                                    setSelectedCustomer(value);
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                />
                            )}
                            renderOption={(props, option) => (
                                <li {...props} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} key={option.customerId}>
                                    {`${option.displayName}`}
                                </li>
                            )}
                        />
                    </GridTextField>
                    <GridTextField item sm={6}>
                        {/* RIGHT : Summary */}
                        <Grid container spacing={2} justifyContent="flex-end">
                            {/* Item count */}
                            <Grid item>
                                <Typography variant="body2" color="text.secondary" align="right">
                                    {t('billingManagement.new.txnLabel')}
                                </Typography>
                                <Typography variant="h4" color="primary" align="right">
                                    {selectedInvoice.length}
                                </Typography>
                            </Grid>

                            {/* Divider */}
                            <Grid item>
                                <Divider orientation="vertical" flexItem />
                            </Grid>

                            {/* Grand total */}
                            <Grid item>
                                <Typography variant="body2" color="text.secondary" align="right">
                                    {t('billingManagement.new.totalAmount')}
                                </Typography>
                                <Typography variant="h4" color="primary" align="right">
                                    {formatMoney(totalAmount)}
                                </Typography>
                            </Grid>
                        </Grid>
                    </GridTextField>
                </Grid>
                <GridSearchSection container>
                    <TableContainer>
                        <Table sx={{ tableLayout: 'auto' }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        align="center"
                                        key="check-all"
                                        className={classes.tableHeader}
                                        sx={{
                                            width: 50,
                                            maxWidth: 80,
                                            minWidth: 50,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                        <Checkbox
                                            checked={
                                                invoiceList?.data?.invoices?.length > 0 &&
                                                selectedInvoice.length === invoiceList?.data.invoices.length
                                            }
                                            indeterminate={
                                                selectedInvoice.length > 0 &&
                                                selectedInvoice.length < (invoiceList?.data?.invoices?.length || 0)
                                            }
                                            onChange={handleToggleAll}
                                        />
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        key="invoiceNo"
                                        className={classes.tableHeader}
                                        sx={{
                                            width: 180,
                                            maxWidth: 180,
                                            minWidth: 100,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}
                                    >
                                        {t('invoiceManagement.column.invoiceNo')}
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        key="customer"
                                        className={classes.tableHeader}
                                    >
                                        {t('invoiceManagement.column.customerName')}
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        key="dueDate"
                                        className={classes.tableHeader}
                                        sx={{
                                            width: 180,
                                            maxWidth: 180,
                                            minWidth: 100,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}
                                    >
                                        {t('billingManagement.column.dueDate')}
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        key="amount"
                                        className={classes.tableHeader}
                                        sx={{
                                            width: 180,
                                            maxWidth: 180,
                                            minWidth: 100,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}
                                    >
                                        {t('billingManagement.new.amount')}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            {isInvoiceFetching ? (
                                <TableBody>
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            <CircularProgress />
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            ) : (
                                <TableBody>{invoiceData}</TableBody>
                            )}
                        </Table>
                    </TableContainer>
                </GridSearchSection>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onClose}
                    variant="contained"
                    startIcon={<Close />}
                    className="btn-cool-grey">
                    {t('button.cancel')}
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    disabled={!selectedCustomer || selectedInvoice.length === 0}
                    onClick={() =>
                        onSelect({
                            customer: selectedCustomer,
                            invoices: selectedInvoice,
                            totalAmount
                        })
                    }
                >
                    {t('billingManagement.new.selectButtonLabel')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}