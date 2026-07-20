/* eslint-disable prettier/prettier */
import {
  PersonAddAlt1,
  Search,
  DisabledByDefault,
  Circle,
  Person,
  Phone,
  CloudUpload,
  DeleteOutline,
  Leaderboard,
  Visibility
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
  MenuItem,
  Chip,
  IconButton
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import Can from 'auth/Can';
import { PERMISSIONS } from 'auth/permissions';
import ConfirmDialog from 'components/ConfirmDialog';
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
import { deleteCustomer, searchCustomer } from 'services/Customer/customer-api';
import { Customer, SearchCustomerRequest } from 'services/Customer/customer-type';
import { getSales } from 'services/Sales/sales-api';
import UploadDialog from './UploadDialog';

export default function CustomerManagement(): JSX.Element {
  const getChipSx = (code?: string | null) => {
    const normalizedCode = code?.toUpperCase();
    const chipStyleMap: Record<string, { bgcolor: string; color: string; borderColor: string }> = {
      COMPANY: { bgcolor: '#E8F5E9', color: '#2E7D32', borderColor: '#A5D6A7' },
      INDIVIDUAL: { bgcolor: '#E3F2FD', color: '#1565C0', borderColor: '#90CAF9' },
      VIP: { bgcolor: '#F3E5F5', color: '#6A1B9A', borderColor: '#CE93D8' },
      TIER_2: { bgcolor: '#FFF3E0', color: '#EF6C00', borderColor: '#FFB74D' },
      TIER_3: { bgcolor: '#E0F7FA', color: '#00838F', borderColor: '#80DEEA' },
      TIER_4: { bgcolor: '#FCE4EC', color: '#C2185B', borderColor: '#F48FB1' },
      BRAND_OWNER: { bgcolor: '#EDE7F6', color: '#5E35B1', borderColor: '#B39DDB' },
      DISTRIBUTOR: { bgcolor: '#E8EAF6', color: '#3949AB', borderColor: '#9FA8DA' },
      MANUFACTURING: { bgcolor: '#FFF8E1', color: '#F9A825', borderColor: '#FFE082' },
      OEM: { bgcolor: '#E0F2F1', color: '#00897B', borderColor: '#80CBC4' },
      RETAIL: { bgcolor: '#F1F8E9', color: '#689F38', borderColor: '#C5E1A5' },
      TRADER: { bgcolor: '#FFF0F0', color: '#D32F2F', borderColor: '#EF9A9A' }
    };
    const style = chipStyleMap[normalizedCode || ''];
    if (!style) {
      return {};
    }
    return {
      bgcolor: style.bgcolor,
      color: style.color,
      borderColor: style.borderColor,
      '& .MuiChip-label': {
        fontWeight: 700
      }
    };
  };

  const renderCustomerChips = (cust: Customer) => (
    <>
      <Chip
        size="small"
        variant="outlined"
        label={cust.customerType?.nameTh || '-'}
        sx={getChipSx(cust.customerType?.code)}
      />
      <Chip
        size="small"
        variant="outlined"
        label={cust.customerTier?.nameEn || '-'}
        sx={getChipSx(cust.customerTier?.code)}
      />
      <Chip
        size="small"
        variant="outlined"
        label={cust.customerSegment?.nameTh || '-'}
        sx={getChipSx(cust.customerSegment?.code)}
      />
    </>
  );

  const formatCustomerSalesAccounts = (cust: Customer) => {
    const salesAccounts = cust.salesAccounts?.length ? cust.salesAccounts : cust.salesAccount ? [cust.salesAccount] : [];
    return salesAccounts.join(', ') || '-';
  };

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
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const onAutoCompleteChange = (field: string, value: SystemConfig | null, reason: string) => {
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
  const { data: customerTierList, isFetching: isCustomerTierFetching } = useQuery(
    ['customer-tier-list', GROUP_CODE.CUSTOMER_TIER],
    () => getSystemConfig(GROUP_CODE.CUSTOMER_TIER),
    { refetchOnWindowFocus: false }
  );
  const { data: customerSegmentList, isFetching: isCustomerSegmentFetching } = useQuery(
    ['customer-segment-list', GROUP_CODE.CUSTOMER_SEGMENT],
    () => getSystemConfig(GROUP_CODE.CUSTOMER_SEGMENT),
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
      tierEqual: '',
      segmentEqual: '',
      rankEqual: '',
      areaEqual: '',
      salesAccount: ''
    },
    enableReinitialize: false,
    onSubmit: (value) => {
      const updateObj = {
        idEqual: value.idEqual,
        nameContain: value.nameContain,
        typeEqual: value.typeEqual?.code || '',
        tierEqual: value.tierEqual?.code || '',
        segmentEqual: value.segmentEqual?.code || '',
        saleAccountEqual: value.salesAccount
      };
      setCustomerFilter(updateObj);
    }
  });
  const handleDeleteCustomer = async () => {
    await deleteCustomer(selectedCustomer);
    setOpenDeleteDialog(false);
    setSelectedCustomer('');
    setSelectedCustomerName('');
    customerRefetched();
  };
  const customerMobileViewData =
    (!isCustomerFetching &&
      customerList &&
      customerList?.data.customers.length > 0 &&
      customerList?.data.customers.map((cust) => {
        return (
          <TableRow hover id={`customer__index-${cust.id}`} key={cust.id}>
            <TableCell align="left">
              <Stack spacing={0.75}>
                <Typography variant="subtitle2" fontWeight={700} lineHeight={1.25}>
                  {cust.customerName}
                </Typography>

                <Typography variant="body2" color="text.secondary" lineHeight={1.35}>
                  {cust.companyName || '-'}
                  {cust.branchName ? ` • ${cust.branchName}` : ''}
                </Typography>

                <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                  {renderCustomerChips(cust)}
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  {cust.status === 'ACTIVE' ? (
                    <Circle style={{ fontSize: '12px', color: 'green', verticalAlign: 'middle' }} />
                  ) : (
                    <Circle style={{ fontSize: '12px', color: 'red', verticalAlign: 'middle' }} />
                  )}
                  &nbsp;{cust.id}
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

                <Stack direction="row" spacing={0.75} sx={{ mt: 0.5 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => history.push(`/customer/${cust.id}`)}>
                    {t('button.view')}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteOutline />}
                    onClick={() => {
                      setSelectedCustomer(cust.id);
                      setSelectedCustomerName(cust.customerName);
                      setOpenDeleteDialog(true);
                    }}>
                    {t('button.delete')}
                  </Button>
                </Stack>
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
        <TableRow hover id={`customer__index-${cust.id}`} key={cust.id}>
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
            <Stack spacing={0.75}>
              <Typography variant="subtitle2" fontWeight={700} component="span">
                {cust.customerName}
              </Typography>

              <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                {renderCustomerChips(cust)}
              </Stack>
            </Stack>
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
            {formatCustomerSalesAccounts(cust)}
          </TableCell>
          <TableCell align="center">
            <Stack direction="row" spacing={1} justifyContent="center">
              <IconButton
                aria-label={t('button.view')}
                color="primary"
                onClick={() => history.push(`/customer/${cust.id}`)}>
                <Visibility fontSize="small" />
              </IconButton>
              <Can permission={PERMISSIONS.CUSTOMER_DELETE}>
                <IconButton
                  aria-label={t('button.delete')}
                  color="error"
                  onClick={() => {
                    setSelectedCustomer(cust.id);
                    setSelectedCustomerName(cust.customerName);
                    setOpenDeleteDialog(true);
                  }}>
                  <DeleteOutline fontSize="small" />
                </IconButton>
              </Can>
            </Stack>
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
          <Can permission={PERMISSIONS.CUSTOMER_CREATE}>
            <Button
              fullWidth={isDownSm}
              variant="contained"
              className="btn-slate-grey"
              onClick={() => history.push(ROUTE_PATHS.CUSTOMER_DASHBOARD)}
              startIcon={<Leaderboard />}>
              {t('customerManagement.dashboard')}
            </Button>
            <Button
              fullWidth={isDownSm}
              variant="contained"
              className="btn-emerald-green"
              onClick={() => history.push(ROUTE_PATHS.CUSTOMER_NEW)}
              startIcon={<PersonAddAlt1 />}>
              {t('customerManagement.action.create')}
            </Button>
          </Can>
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
          <Can permission={PERMISSIONS.CUSTOMER_UPLOAD}>
            <Button
              fullWidth={isDownSm}
              variant="contained"
              className="btn-baby-blue"
              onClick={() => setOpenUploadDialog(true)}
              startIcon={<CloudUpload />}>
              {t('inputUpload.submitButton')}
            </Button>
          </Can>
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
            <Autocomplete
              disabled={isCustomerTierFetching}
              disablePortal
              options={customerTierList?.map((option) => option) || []}
              getOptionLabel={(option: SystemConfig) => option.nameEn}
              sx={{ width: '100%' }}
              value={searchFormik.values.tierEqual || null}
              onChange={(_event, value, reason) => {
                onAutoCompleteChange('tierEqual', value, reason);
                searchFormik.handleSubmit();
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('customerManagement.column.tier')}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    ...params.inputProps,
                    readOnly: true
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={2} style={{ paddingTop: '30px', paddingLeft: '10px' }}>
            <Autocomplete
              disabled={isCustomerSegmentFetching}
              disablePortal
              options={customerSegmentList?.map((option) => option) || []}
              getOptionLabel={(option: SystemConfig) => option.nameTh}
              sx={{ width: '100%' }}
              value={searchFormik.values.segmentEqual || null}
              onChange={(_event, value, reason) => {
                onAutoCompleteChange('segmentEqual', value, reason);
                searchFormik.handleSubmit();
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('customerManagement.column.segment')}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    ...params.inputProps,
                    readOnly: true
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
                      <TableCell align="center" key="updatedDate" className={classes.tableHeader}>
                        {t('customerManagement.column.salesAccount')}
                      </TableCell>
                      <TableCell align="center" key="action" className={classes.tableHeader}>
                        {t('customerManagement.column.action')}
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
      <UploadDialog
        open={openUploadDialog}
        onClose={() => setOpenUploadDialog(false)}
        onUploaded={() => {
          customerRefetched();
        }}
      />
      <ConfirmDialog
        open={openDeleteDialog}
        title={t('button.delete')}
        message={
          selectedCustomerName
            ? `${t('button.delete')} ${selectedCustomerName} ?`
            : t('button.delete')
        }
        confirmText={t('button.delete')}
        cancelText={t('button.cancel')}
        isShowCancelButton
        isShowConfirmButton
        onConfirm={handleDeleteCustomer}
        onCancel={() => {
          setOpenDeleteDialog(false);
          setSelectedCustomer('');
          setSelectedCustomerName('');
        }}
      />
    </Page>
  );
}
