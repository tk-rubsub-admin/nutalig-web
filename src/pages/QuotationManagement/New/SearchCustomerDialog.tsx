/* eslint-disable prettier/prettier */
import { Close } from '@mui/icons-material';
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Radio, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material';
import { makeStyles } from '@mui/styles';
import Paginate from 'components/Paginate';
import { GridSearchSection, TextLineClamp } from 'components/Styled';
import { useFormik } from 'formik';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { searchCustomer } from 'services/Customer/customer-api';
import { Customer, SearchCustomerRequest } from 'services/Customer/customer-type';
import { getSales } from 'services/Sales/sales-api';

export interface SearchCustomerDialogProps {
    open: boolean;
    onClose: () => void;
    onSelect: (payload: {
        customer: Customer;
    }) => void;

    initialCustomer?: Customer | null;
}

export default function SearchCustomerDialog(props: SearchCustomerDialogProps): JSX.Element {
    const {
        open,
        onClose,
        onSelect,
        initialCustomer = null,
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
    const [customerFilter, setCustomerFilter] = useState<SearchCustomerRequest>({});
    const [page, setPage] = useState<number>(1);
    const [pages, setPages] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const {
        data: customerList,
        refetch: customerRefetched,
        isFetching: isCustomerFetching
    } = useQuery('customer-list', () => searchCustomer(customerFilter, page, pageSize), {
        enabled: open,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
        cacheTime: Infinity,
    });
    const { data: salesOptions = [], isFetching: isSalesFetching } = useQuery(
        'customer-sales-options',
        () => getSales(1, 20),
        {
            enabled: open,
            refetchOnWindowFocus: false,
            staleTime: Infinity,
            cacheTime: Infinity,
        }
    );

    const searchFormik = useFormik({
        initialValues: {
            idEqual: '',
            nameContain: '',
            typeEqual: '',
            rankEqual: '',
            areaEqual: '',
            salesAccount: ''
        },
        enableReinitialize: false,
        onSubmit: (value) => {
            const updateObj = {
                idEqual: value.idEqual,
                nameContain: value.nameContain,
                typeEqual: value.typeEqual.code,
                saleAccountEqual: value.salesAccount
            };
            setCustomerFilter(updateObj);
        }
    });

    const customers =
        (!isCustomerFetching &&
            customerList &&
            customerList?.data.customers.length > 0 &&
            customerList?.data.customers.map((cust) => {
                const isSelected = selectedCustomer?.id === cust.id;

                return (
                    <TableRow
                        hover
                        id={`customer__index-${cust.id}`}
                        key={cust.id}
                        onClick={() => setSelectedCustomer(cust)}
                        sx={{
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.08)' : 'inherit',
                            '& td': {
                                fontWeight: isSelected ? 600 : 400
                            },
                            '&:hover': {
                                backgroundColor: isSelected
                                    ? 'rgba(25, 118, 210, 0.12)'
                                    : 'rgba(0, 0, 0, 0.04)'
                            }
                        }}
                    >
                        <TableCell align="center">
                            <Radio checked={isSelected} />
                        </TableCell>

                        <TableCell align="center">
                            {cust.id}
                        </TableCell>

                        <TableCell>
                            <TextLineClamp>{cust.customerName}</TextLineClamp>
                        </TableCell>
                    </TableRow>
                );
            })) || (
            <TableRow>
                <TableCell colSpan={3}>
                    <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
                </TableCell>
            </TableRow>
        );

    useEffect(() => {
        if (open) {
            setSelectedCustomer(initialCustomer);
        }
    }, [open, initialCustomer]);
    /**
       * Init pagination depends on data from the API.
       */
    useEffect(() => {
        if (!isCustomerFetching && customerList?.data.pagination) {
            setPage(customerList.data.pagination.page);
            setPageSize(customerList.data.pagination.size);
            setPages(customerList.data.pagination.totalPage);
        }
    }, [customerList, customerRefetched]);
    /**
     * Managing the pagination variables that will send to the API.
     */
    useEffect(() => {
        customerRefetched();
    }, [customerFilter, pages, page, pageSize, customerRefetched]);

    return (
        <Dialog open={open} maxWidth="md" fullWidth aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">
                {t('customerManagement.searchCustomerButton')}
            </DialogTitle>
            <DialogContent>
                <GridSearchSection container spacing={1}>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            type="text"
                            name="id"
                            label={t('customerManagement.column.id')}
                            fullWidth
                            variant="outlined"
                            value={searchFormik.values.idEqual}
                            onChange={({ target }) => {
                                searchFormik.setFieldValue('idEqual', target.value);
                            }}
                            onBlur={() => searchFormik.handleSubmit()}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            type="text"
                            name="firstName"
                            label={t('customerManagement.customerFirstName')}
                            fullWidth
                            variant="outlined"
                            value={searchFormik.values.firstNameContain}
                            onChange={({ target }) => {
                                searchFormik.setFieldValue('firstNameContain', target.value);
                            }}
                            onBlur={() => searchFormik.handleSubmit()}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        {/* <Autocomplete
                                disabled={isCustomerTypeFetching}
                                disablePortal
                                options={customerTypeList?.map((option) => option) || []}
                                getOptionLabel={(option: SystemConfig) => option.nameTh}
                                sx={{ width: '100%' }}
                                value={searchFormik.values.typeEqual || null}
                                onChange={(_event, value, reason) => {
                                    onAutoCompleteChange('typeEqual', value, reason);
                                    searchFormik.handleSubmit();
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={t('customerManagement.column.type')}
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{
                                            ...params.inputProps,
                                            readOnly: true // 🔑 Prevents keyboard
                                        }}
                                    />
                                )}
                            /> */}
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            select
                            fullWidth
                            label={t('customerManagement.column.salesAccount')}
                            InputLabelProps={{ shrink: true }}
                            value={searchFormik.values.salesAccount || ''}
                            disabled={isSalesFetching}
                            onChange={(event) => {
                                const selectedCode = event.target.value;
                                searchFormik.setFieldValue('salesAccount', selectedCode);
                                searchFormik.handleSubmit();
                            }}
                        >
                            <MenuItem value="">
                                {t('general.clearSelected')}
                            </MenuItem>
                            {salesOptions.map((option) => (
                                <MenuItem key={option.salesId} value={option.salesId}>
                                    {`${option.salesId} - ${option.nickname || option.name}`}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                </GridSearchSection>
                <GridSearchSection container>
                    <TableContainer>
                        <Table id="customer_list___table">
                            <TableHead>
                                <TableRow>
                                    <TableCell align="center" className={classes.tableHeader}>

                                    </TableCell>
                                    <TableCell align="center" key="id" className={classes.tableHeader}>
                                        {t('customerManagement.column.id')}
                                    </TableCell>
                                    <TableCell align="center" key="name" className={classes.tableHeader}>
                                        {t('customerManagement.column.customerName')}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            {isCustomerFetching ? (
                                <TableBody>
                                    <TableRow>
                                        <TableCell colSpan={3} align="center">
                                            <CircularProgress />
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            ) : (
                                <TableBody>{customers}</TableBody>
                            )}
                        </Table>
                    </TableContainer>
                </GridSearchSection>
                <GridSearchSection container>
                    <Grid item xs={12}>
                        {isCustomerFetching ? (
                            ' '
                        ) : (
                            <Paginate
                                pagination={customerList?.data.pagination}
                                page={page}
                                pageSize={pageSize}
                                setPage={setPage}
                                setPageSize={setPageSize}
                                refetch={customerRefetched}
                                totalRecords={customerList?.data.pagination.totalRecords}
                                isShow={true}
                            />
                        )}
                    </Grid>
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
                    disabled={!selectedCustomer}
                    onClick={() =>
                        onSelect({
                            customer: selectedCustomer
                        })
                    }
                >
                    {t('customerManagement.chooseCustomer')}
                </Button>
            </DialogActions>
        </Dialog >
    )
}
