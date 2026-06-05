/* eslint-disable prettier/prettier */
import {
  AlternateEmail,
  Circle,
  DisabledByDefault,
  Person,
  PersonAddAlt1,
  Phone,
  Search
} from '@mui/icons-material';
import {
  Button,
  CircularProgress,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import PageTitle from 'components/PageTitle';
import Paginate from 'components/Paginate';
import { GridSearchSection, TextLineClamp, Wrapper } from 'components/Styled';
import { useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { useEffect, useState } from 'react';
import { isMobileOnly } from 'react-device-detect';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { getSupplierList } from 'services/Supplier/supplier-api';
import { SearchSupplierRequest, Supplier, SupplierContact } from 'services/Supplier/supplier-type';

const DEFAULT_SUPPLIER_FILTER: SearchSupplierRequest = {
  idEqual: '',
  nameContain: '',
  supplierCodeEqual: '',
  supplierEmailContain: '',
  statusEqual: '',
  countryCodeEqual: '',
  contactNameContain: '',
  contactNumberContain: ''
};

export default function SupplierManagement(): JSX.Element {
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
  const [supplierFilter, setSupplierFilter] = useState<SearchSupplierRequest>(DEFAULT_SUPPLIER_FILTER);

  const {
    data: supplierList,
    refetch: supplierRefetched,
    isFetching: isSupplierFetching
  } = useQuery(['supplier-list', supplierFilter, page, pageSize], () => getSupplierList(supplierFilter, page, pageSize), {
    refetchOnWindowFocus: false
  });

  const searchFormik = useFormik({
    initialValues: {
      idEqual: '',
      nameContain: '',
      supplierCodeEqual: '',
      supplierEmailContain: '',
      contactNameContain: '',
      contactNumberContain: ''
    },
    enableReinitialize: false,
    onSubmit: (value) => {
      setSupplierFilter({
        ...DEFAULT_SUPPLIER_FILTER,
        idEqual: value.idEqual,
        nameContain: value.nameContain,
        supplierCodeEqual: value.supplierCodeEqual,
        supplierEmailContain: value.supplierEmailContain,
        contactNameContain: value.contactNameContain,
        contactNumberContain: value.contactNumberContain
      });
      setPage(1);
    }
  });

  const getDefaultContact = (supplier: Supplier): SupplierContact | undefined =>
    supplier.contacts?.find((contact) => contact.isDefault) || supplier.contacts?.[0];

  const renderContactText = (supplier: Supplier) => {
    if (!supplier.contacts?.length) {
      return '-';
    }

    return supplier.contacts.map((contact) => `${contact.contactName} | ${contact.contactNumber}`).join(', ');
  };

  const supplierMobileViewData =
    (!isSupplierFetching &&
      supplierList?.data?.suppliers?.length > 0 &&
      supplierList?.data.suppliers.map((supplier) => {
        const defaultContact = getDefaultContact(supplier);

        return (
          <TableRow
            hover
            id={`supplier__index-${supplier.id}`}
            key={supplier.id}
            onClick={() => history.push(`/supplier/${supplier.id}`)}
          >
            <TableCell align="left">
              <Stack spacing={0.5}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {supplier.supplierName}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  {supplier.status === 'ACTIVE' ? (
                    <Circle style={{ fontSize: '12px', color: 'green', verticalAlign: 'middle' }} />
                  ) : (
                    <Circle style={{ fontSize: '12px', color: 'red', verticalAlign: 'middle' }} />
                  )}
                  &nbsp;{supplier.id}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {supplier.supplierCode || '-'}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {supplier.fullAddress || '-'}
                </Typography>

                <Typography variant="body2">
                  <Person sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                  {defaultContact?.contactName || '-'}
                  {!!defaultContact?.contactNumber && (
                    <>
                      {' '}
                      |{' '}
                      <Phone sx={{ fontSize: 14, verticalAlign: 'middle', mx: 0.5 }} />
                      {defaultContact.contactNumber}
                    </>
                  )}
                </Typography>

                <Typography variant="body2">
                  <AlternateEmail sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                  {supplier.supplierEmail || '-'}
                </Typography>
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

  const suppliers =
    (!isSupplierFetching &&
      supplierList?.data?.suppliers?.length > 0 &&
      supplierList?.data.suppliers.map((supplier) => (
        <TableRow
          hover
          id={`supplier__index-${supplier.id}`}
          key={supplier.id}
          onClick={() => history.push(`/supplier/${supplier.id}`)}
        >
          <TableCell align="center">
            <TextLineClamp>
              {supplier.status === 'ACTIVE' ? (
                <Circle style={{ fontSize: '15px', color: 'green' }} />
              ) : (
                <Circle style={{ fontSize: '15px', color: 'red' }} />
              )}
              &nbsp;
              {supplier.id}
            </TextLineClamp>
          </TableCell>
          <TableCell>
            <TextLineClamp>{supplier.supplierName}</TextLineClamp>
          </TableCell>
          <TableCell>
            <TextLineClamp>{supplier.supplierCode || '-'}</TextLineClamp>
          </TableCell>
          <TableCell>
            <TextLineClamp>{renderContactText(supplier)}</TextLineClamp>
          </TableCell>
          <TableCell>
            <TextLineClamp>{supplier.supplierEmail || '-'}</TextLineClamp>
          </TableCell>
          <TableCell>
            <TextLineClamp>{supplier.fullAddress || '-'}</TextLineClamp>
          </TableCell>
        </TableRow>
      ))) || (
      <TableRow>
        <TableCell colSpan={6}>
          <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
        </TableCell>
      </TableRow>
    );

  useEffect(() => {
    if (!isSupplierFetching && supplierList?.data?.pagination) {
      setPage(supplierList.data.pagination.page);
      setPageSize(supplierList.data.pagination.size);
      setPages(supplierList.data.pagination.totalPage);
    }
  }, [supplierList, supplierRefetched, isSupplierFetching]);

  useEffect(() => {
    supplierRefetched();
  }, [supplierFilter, pages, page, pageSize, supplierRefetched]);

  return (
    <Page>
      <PageTitle title={t('supplierManagement.title')} />
      <Wrapper>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{
            mt: 1,
            justifyContent: { sm: 'flex-end' },
            alignItems: { xs: 'flex-end', sm: 'center' }
          }}
        >
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-emerald-green"
            onClick={() => history.push(ROUTE_PATHS.SUPPLIER_NEW)}
            startIcon={<PersonAddAlt1 />}
          >
            {t('supplierManagement.action.create')}
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-indigo-blue"
            onClick={() => searchFormik.handleSubmit()}
            startIcon={<Search />}
          >
            {t('button.search')}
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-amber-orange"
            onClick={() => {
              searchFormik.resetForm();
              setSupplierFilter(DEFAULT_SUPPLIER_FILTER);
              setPage(1);
            }}
            startIcon={<DisabledByDefault />}
          >
            {t('button.clear')}
          </Button>
        </Stack>
        <GridSearchSection container spacing={1}>
          <Grid item xs={12} sm={12}>
            <Typography variant="h6" component="h2">
              {t('supplierManagement.searchPanel')}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}>
            <TextField
              type="text"
              label={t('supplierManagement.column.id')}
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
              label={t('supplierManagement.column.name')}
              fullWidth
              variant="outlined"
              value={searchFormik.values.nameContain}
              onChange={({ target }) => {
                searchFormik.setFieldValue('nameContain', target.value);
              }}
              onBlur={() => searchFormik.handleSubmit()}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={2} style={{ paddingTop: '30px', paddingLeft: '10px' }}>
            <TextField
              type="text"
              label={t('supplierManagement.column.code')}
              fullWidth
              variant="outlined"
              value={searchFormik.values.supplierCodeEqual}
              onChange={({ target }) => {
                searchFormik.setFieldValue('supplierCodeEqual', target.value);
              }}
              onBlur={() => searchFormik.handleSubmit()}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3} style={{ paddingTop: '30px', paddingLeft: '10px' }}>
            <TextField
              type="text"
              label={t('supplierManagement.column.email')}
              fullWidth
              variant="outlined"
              value={searchFormik.values.supplierEmailContain}
              onChange={({ target }) => {
                searchFormik.setFieldValue('supplierEmailContain', target.value);
              }}
              onBlur={() => searchFormik.handleSubmit()}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3} style={{ paddingTop: '30px', paddingLeft: '10px' }}>
            <TextField
              type="text"
              label={t('supplierManagement.column.contactName')}
              fullWidth
              variant="outlined"
              value={searchFormik.values.contactNameContain}
              onChange={({ target }) => {
                searchFormik.setFieldValue('contactNameContain', target.value);
              }}
              onBlur={() => searchFormik.handleSubmit()}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </GridSearchSection>
        {isMobileOnly ? (
          <GridSearchSection container>
            <TableContainer>
              <Table id="supplier_list___table">
                <TableHead>
                  <TableRow>
                    <TableCell align="center" key="supplier" className={classes.tableHeader}>
                      {t('supplierManagement.supplier')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                {isSupplierFetching ? (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={1} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                ) : (
                  <TableBody>{supplierMobileViewData}</TableBody>
                )}
              </Table>
            </TableContainer>
          </GridSearchSection>
        ) : (
          <GridSearchSection container>
            <TableContainer>
              <Table id="supplier_list___table">
                <TableHead>
                  <TableRow>
                    <TableCell align="center" key="id" className={classes.tableHeader}>
                      {t('supplierManagement.column.id')}
                    </TableCell>
                    <TableCell align="center" key="name" className={classes.tableHeader}>
                      {t('supplierManagement.column.name')}
                    </TableCell>
                    <TableCell align="center" key="code" className={classes.tableHeader}>
                      {t('supplierManagement.column.code')}
                    </TableCell>
                    <TableCell align="center" key="contact" className={classes.tableHeader}>
                      {t('supplierManagement.column.contactName')}
                    </TableCell>
                    <TableCell align="center" key="email" className={classes.tableHeader}>
                      {t('supplierManagement.column.email')}
                    </TableCell>
                    <TableCell align="center" key="address" className={classes.tableHeader}>
                      {t('supplierManagement.column.fullAddress')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                {isSupplierFetching ? (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                ) : (
                  <TableBody>{suppliers}</TableBody>
                )}
              </Table>
            </TableContainer>
          </GridSearchSection>
        )}
        <GridSearchSection container>
          <Grid item xs={12}>
            {isSupplierFetching ? (
              ' '
            ) : (
              <Paginate
                pagination={supplierList?.data.pagination}
                page={page}
                pageSize={pageSize}
                setPage={setPage}
                setPageSize={setPageSize}
                refetch={supplierRefetched}
                totalRecords={supplierList?.data.pagination.totalRecords}
                isShow={true}
              />
            )}
          </Grid>
        </GridSearchSection>
      </Wrapper>
    </Page>
  );
}
