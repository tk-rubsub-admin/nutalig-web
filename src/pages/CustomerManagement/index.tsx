/* eslint-disable prettier/prettier */
import {
  PersonAddAlt1,
  Search,
  DisabledByDefault,
  Circle,
  Person,
  Phone
} from '@mui/icons-material';
import {
  Grid,
  Typography,
  Button,
  TableCell,
  TableRow,
  CircularProgress,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TextField,
  Autocomplete,
  useTheme,
  useMediaQuery,
  Stack,
  MenuItem
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import PageTitle from 'components/PageTitle';
import Paginate from 'components/Paginate';
import { Wrapper, GridSearchSection, TextLineClamp } from 'components/Styled';
import { useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { useEffect, useState } from 'react';
import { isMobileOnly } from 'react-device-detect';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { getSystemConfig } from 'services/Config/config-api';
import { GROUP_CODE, SystemConfig } from 'services/Config/config-type';
import { searchCustomer } from 'services/Customer/customer-api';
import { SearchCustomerRequest } from 'services/Customer/customer-type';
import { getSales } from 'services/Sales/sales-api';

export default function CustomerManagement(): JSX.Element {
  const useStyles = makeStyles({
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
    }
  });
  const classes = useStyles();
  const theme = useTheme();
  const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();
  const history = useHistory();
  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [customerFilter, setCustomerFilter] = useState<SearchCustomerRequest>({});
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState();
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>, id: string) => {
    setSelectedCustomer(id);
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const onAutoCompleteChange = (field: string, value: SystemConfig, reason: string) => {
    if (reason === 'clear') {
      searchFormik.setFieldValue(field, '');
    } else {
      searchFormik.setFieldValue(field, value);
    }
  };
  const { data: customerTypeList, isFetching: isCustomerTypeFetching } = useQuery(
    ['customer-type-list', GROUP_CODE.CUSTOMER_TYPE],
    () => getSystemConfig(GROUP_CODE.CUSTOMER_TYPE),
    { refetchOnWindowFocus: false }
  );
  const { data: salesOptions = [], isFetching: isSalesFetching } = useQuery(
    'customer-sales-options',
    () => getSales(1, 20),
    { refetchOnWindowFocus: false }
  );
  const {
    data: customerList,
    refetch: customerRefetched,
    isFetching: isCustomerFetching
  } = useQuery('customer-list', () => searchCustomer(customerFilter, page, pageSize), {
    refetchOnWindowFocus: false
  });
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
  const customerMobileViewData =
    (!isCustomerFetching &&
      customerList &&
      customerList?.data.customers.length > 0 &&
      customerList?.data.customers.map((cust) => {
        return (
          <TableRow
            hover
            id={`customer__index-${cust.id}`}
            key={cust.id}
            onClick={() => history.push(`/customer/${cust.id}`)}
          >
            <TableCell align="left">
              <Stack spacing={0.5}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {cust.customerName}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  {cust.status === 'ACTIVE' ? (
                    <Circle style={{ fontSize: '12px', color: 'green', verticalAlign: 'middle' }} />
                  ) : (
                    <Circle style={{ fontSize: '12px', color: 'red', verticalAlign: 'middle' }} />
                  )}
                  &nbsp;{cust.id}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {cust.customerType?.nameTh || '-'}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {cust.salesAccount || '-'}
                </Typography>

                {cust.contacts?.length > 0 ? (
                  <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                    {cust.contacts.map((contact, index) => (
                      <Typography key={index} variant="body2">
                        <Person sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                        {contact.contactName || '-'}
                        {!!contact.contactNumber && (
                          <>
                            {' '}
                            |{' '}
                            <Phone sx={{ fontSize: 14, verticalAlign: 'middle', mx: 0.5 }} />
                            {contact.contactNumber}
                          </>
                        )}
                      </Typography>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    -
                  </Typography>
                )}
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
  const customers = (!isCustomerFetching &&
    customerList &&
    customerList?.data.customers.length > 0 &&
    customerList?.data.customers.map((cust) => {
      return (
        <TableRow
          hover
          id={`customer__index-${cust.id}`}
          key={cust.id}
          onClick={() => history.push(`/customer/${cust.id}`)}>
          <TableCell align="center">
            <TextLineClamp>
              {cust.status === 'ACTIVE' ? (
                <Circle style={{ fontSize: '15px', color: 'green' }} />
              ) : (
                <Circle style={{ fontSize: '15px', color: 'red' }} />
              )}
              &nbsp;
              {cust.id}
            </TextLineClamp>
          </TableCell>
          <TableCell>
            <TextLineClamp>{cust.customerName}</TextLineClamp>
          </TableCell>
          <TableCell>
            {cust.contacts?.length > 0 ? (
              cust.contacts?.map((contact, index) => (
                <TextLineClamp key={index}>
                  {contact.contactName} | {contact.contactNumber}
                </TextLineClamp>
              ))
            ) : (
              '-'
            )}
          </TableCell>
          <TableCell>
            {cust.customerType?.nameTh}
          </TableCell>
          <TableCell>
            {cust.salesAccount}
          </TableCell>
        </TableRow>
      );
    })) || (
      <TableRow>
        <TableCell colSpan={5}>
          <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
        </TableCell>
      </TableRow>
    );
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
    <Page>
      <PageTitle title={t('customerManagement.title')} />
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
            className="btn-emerald-green"
            onClick={() => history.push(ROUTE_PATHS.CUSTOMER_NEW)}
            startIcon={<PersonAddAlt1 />}>
            {t('customerManagement.action.create')}
          </Button>
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
            onClick={() => searchFormik.resetForm()}
            startIcon={<DisabledByDefault />}>
            {t('button.clear')}
          </Button>
        </Stack>
        <GridSearchSection container spacing={1}>
          <Grid item xs={12} sm={12}>
            <Typography variant="h6" component="h2">
              {t('customerManagement.searchPanel')}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}>
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
          <Grid item xs={12} sm={2} style={{ paddingTop: '30px', paddingLeft: '10px' }}>
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
          <Grid item xs={12} sm={2} style={{ paddingTop: '30px', paddingLeft: '10px' }}>
            <Autocomplete
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
            />
          </Grid>
          <Grid item xs={12} sm={2} style={{ paddingTop: '30px', paddingLeft: '10px' }}>
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
        {isMobileOnly ? (
          <>
            <GridSearchSection container>
              <TableContainer>
                <Table id="customer_list___table">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" key="customer" className={classes.tableHeader}>
                        {t('customerManagement.customer')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  {isCustomerFetching ? (
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={1} align="center">
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  ) : (
                    <TableBody>{customerMobileViewData}</TableBody>
                  )}
                </Table>
              </TableContainer>
            </GridSearchSection>
          </>
        ) : (
          <>
            <GridSearchSection container>
              <TableContainer>
                <Table id="customer_list___table">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" key="id" className={classes.tableHeader}>
                        {t('customerManagement.column.id')}
                      </TableCell>
                      <TableCell align="center" key="customerName" className={classes.tableHeader}>
                        {t('customerManagement.column.name')}
                      </TableCell>
                      <TableCell align="center" key="phoneNumber" className={classes.tableHeader}>
                        {t('customerManagement.phoneNumber')}
                      </TableCell>
                      <TableCell align="center" key="areaType" className={classes.tableHeader}>
                        {t('customerManagement.column.type')}
                      </TableCell>
                      <TableCell align="center" key="updatedDate" className={classes.tableHeader}>
                        {t('customerManagement.column.salesAccount')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  {isCustomerFetching ? (
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={5} align="center">
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
          </>
        )}
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
      </Wrapper>
    </Page>
  );
}
