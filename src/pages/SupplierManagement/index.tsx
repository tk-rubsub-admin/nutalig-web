import {
  PersonAddAlt1,
  Search,
  DisabledByDefault,
  Circle,
  Person,
  AccessTime,
  UploadFile,
  DownloadForOffline
} from '@mui/icons-material';
import {
  Grid,
  Typography,
  Button,
  TableContainer,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Autocomplete,
  useTheme,
  useMediaQuery,
  Stack
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import PageTitle from 'components/PageTitle';
import Paginate from 'components/Paginate';
import PhoneCallBox from 'components/PhoneCallBox';
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
import { exportSupplier, getSupplierType, searchSupplier } from 'services/Supplier/supplier-api';
import { SearchSupplierRequest, Supplier, SupplierType } from 'services/Supplier/supplier-type';
import UploadSupplierDialog from './Dialog/UploadSupplierDialog';
import toast from 'react-hot-toast';

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
  const defaultFilter: SearchSupplierRequest = {
    idEqual: '',
    nameContain: '',
    typeIn: [],
    rankEqual: '',
    mainProductContain: '',
    productTypeEqual: '',
    statusEqual: 'ACTIVE',
    contactNameContain: '',
    contactNumberContain: '',
    creditTermEqual: '',
    bankEqual: ''
  };
  const classes = useStyles();
  const theme = useTheme();
  const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();
  const history = useHistory();
  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [supplierFilter, setSupplierFilter] = useState<SearchSupplierRequest>({
    ...defaultFilter
  });
  const {
    data: supplierList,
    refetch: supplierRefetch,
    isFetching: isSupplierFetching
  } = useQuery('supplier-list', () => searchSupplier(supplierFilter, page, pageSize), {
    refetchOnWindowFocus: false
  });
  const { data: supplierTypes, isFetching: isSupplierTypeFetching } = useQuery(
    'supplier-type',
    () => getSupplierType(),
    {
      refetchOnWindowFocus: false
    }
  );
  const { data: supplierProductType, isFetching: isSupplierProductTypeFetching } = useQuery(
    'supplier-product-type',
    () => getSystemConfig(GROUP_CODE.SUPPLIER_PRODUCT_TYPE),
    {
      refetchOnWindowFocus: false
    }
  );
  const searchFormik = useFormik({
    initialValues: {
      idEqual: '',
      nameContain: '',
      typeEqual: '',
      rankEqual: '',
      mainProductContain: '',
      productTypeEqual: '',
      statusEqual: 'ACTIVE',
      contactNameContain: '',
      contactNumberContain: '',
      creditTermEqual: '',
      bankEqual: ''
    },
    enableReinitialize: false,
    onSubmit: (value) => {
      console.log(JSON.stringify(value));
      const updateObj = {
        idEqual: value.idEqual,
        nameContain: value.nameContain,
        typeEqual: value.typeEqual.typeName,
        productTypeEqual: value.productTypeEqual.code
      };
      setSupplierFilter(updateObj);
      setPage(1);
    }
  });

  const onAutoCompleteChange = (field: string, value: SystemConfig, reason: string) => {
    if (reason === 'clear') {
      searchFormik.setFieldValue(field, '');
    } else {
      searchFormik.setFieldValue(field, value);
    }
  };
  const supplierData = (!isSupplierFetching &&
    supplierList &&
    supplierList.data.suppliers.length > 0 &&
    supplierList.data.suppliers.map((sup: Supplier) => {
      return (
        <TableRow
          hover
          id={`supplier__index-${sup.supplierId}`}
          key={sup.supplierId}
          onClick={() => history.push(`/supplier/${sup.supplierId}`)}>
          <TableCell align="left">
            <TextLineClamp>
              <Circle style={{ fontSize: '15px', color: 'green' }} /> &nbsp;
              {sup.supplierId}
            </TextLineClamp>
          </TableCell>
          <TableCell align="left">
            <TextLineClamp>{sup.supplierName}</TextLineClamp>
          </TableCell>
          <TableCell align="left">
            {sup.types !== null &&
              sup.types.map((type) => {
                return <TextLineClamp>{type.typeIcon + ' ' + type.typeName}</TextLineClamp>;
              })}
          </TableCell>
          <TableCell align="left">
            <TextLineClamp>{sup.mainProduct}</TextLineClamp>
          </TableCell>
          <TableCell align="left">
            <TextLineClamp>{sup.supplierProductType?.nameTh}</TextLineClamp>
          </TableCell>
          <TableCell align="left">
            <TextLineClamp>{sup.addressProvince?.nameTh}</TextLineClamp>
          </TableCell>
        </TableRow>
      );
    })) || (
      <TableRow>
        <TableCell colSpan={6}>
          <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
        </TableCell>
      </TableRow>
    );
  const supplierMobileViewData = (!isSupplierFetching &&
    supplierList &&
    supplierList.data.suppliers.length > 0 &&
    supplierList.data.suppliers.map((sup: Supplier) => {
      return (
        <TableRow
          hover
          id={`supplier__index-${sup.supplierId}`}
          key={sup.supplierId}
          onClick={() => history.push(`/supplier/${sup.supplierId}`)}>
          <TableCell align="left">
            <Person style={{ fontSize: '15px' }} /> <strong>{sup.supplierName}</strong>
            <br />
            {sup.types.map((type) => type.typeIcon + ' ' + type.typeName)}
            <br />
            {t('supplierManagement.column.productType') + ' : ' + sup.supplierProductType.nameTh}
            <br />
            <AccessTime style={{ fontSize: '15px' }} />{' '}
            {sup.displayWorkingHour === 'open24Hrs'
              ? t('supplierManagement.open24Hrs')
              : sup.displayWorkingHour}
            <br />
            {sup.contactNumber.replaceAll('-', '').trim() === '' ||
              sup.contactNumber.replaceAll('-', '').trim() === '-' ? (
              <></>
            ) : (
              <PhoneCallBox
                phoneNumber={sup.contactNumber}
                onClickLink={(event) => event.stopPropagation()}
              />
            )}
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

  const handleExportSupplier = async () => {
    toast.promise(exportSupplier(supplierFilter), {
      loading: t('toast.loading'),
      success: (response) => {
        // Create a temporary URL for the Blob
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);

        const contentDisposition = response.headers['content-disposition'];

        let filename = 'template.xlsx';
        console.log("Download file size " + blob.size);
        if (contentDisposition) {
          const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?(.+)/);
          if (match?.[1]) {
            filename = decodeURIComponent(match[1].replace(/"/g, ''));
          }
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
  /**
   * Init pagination depends on data from the API.
   */
  useEffect(() => {
    if (!isSupplierFetching && supplierList?.data.pagination) {
      setPage(supplierList.data.pagination.page);
      setPageSize(supplierList.data.pagination.size);
      setPages(supplierList.data.pagination.totalPage);
    }
  }, [supplierList]);
  /**
   * Managing the pagination variables that will send to the API.
   */
  useEffect(() => {
    supplierRefetch();
  }, [supplierFilter, pages, page, pageSize]);

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
            justifyContent: { sm: 'flex-end' }, // right-align when in row
            alignItems: { xs: 'flex-end', sm: 'center' } // right-align when stacked
          }}>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-emerald-green"
            onClick={() => history.push(ROUTE_PATHS.SUPPLIER_NEW)}
            startIcon={<PersonAddAlt1 />}>
            {t('supplierManagement.action.create')}
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
            onClick={() => {
              searchFormik.resetForm();
              searchFormik.handleSubmit();
            }}
            startIcon={<DisabledByDefault />}>
            {t('button.clear')}
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-baby-blue"
            onClick={() => setOpenUploadDialog(true)}
            startIcon={<UploadFile />}>
            {t('button.importStocks')}
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-green-teal"
            onClick={() => handleExportSupplier()}
            startIcon={<DownloadForOffline />}>
            {t('button.export')}
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
              name="supplierId"
              placeholder={t('supplierManagement.placeHolder.id')}
              label={t('supplierManagement.column.id')}
              fullWidth
              variant="outlined"
              value={searchFormik.values.idEqual}
              onChange={({ target }) => {
                searchFormik.setFieldValue('idEqual', target.value);
                searchFormik.handleSubmit();
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}>
            <TextField
              type="text"
              name="supplierId"
              placeholder={t('supplierManagement.placeHolder.name')}
              label={t('supplierManagement.column.name')}
              fullWidth
              variant="outlined"
              value={searchFormik.values.nameContain}
              onChange={({ target }) => {
                searchFormik.setFieldValue('nameContain', target.value);
                searchFormik.handleSubmit();
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={2} style={{ paddingTop: '30px', paddingLeft: '10px' }}>
            <Autocomplete
              disabled={isSupplierTypeFetching}
              disablePortal
              options={supplierTypes?.map((type: SupplierType) => type) || []}
              getOptionLabel={(type: SupplierType) => type.typeName}
              sx={{ width: '100%' }}
              value={searchFormik.values.typeEqual || null}
              onChange={(_event, value, reason) => {
                onAutoCompleteChange('typeEqual', value, reason);
                searchFormik.handleSubmit();
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('supplierManagement.column.types.title')}
                  InputLabelProps={{ shrink: true }}
                  placeholder={t('supplierManagement.placeHolder.type')}
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
              disabled={isSupplierProductTypeFetching}
              disablePortal
              options={supplierProductType?.map((option) => option) || []}
              getOptionLabel={(option: SystemConfig) => option.nameTh}
              sx={{ width: '100%' }}
              value={searchFormik.values.productTypeEqual || null}
              onChange={(_event, value, reason) => {
                onAutoCompleteChange('productTypeEqual', value, reason);
                searchFormik.handleSubmit();
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('supplierManagement.column.productType')}
                  InputLabelProps={{ shrink: true }}
                  placeholder={t('supplierManagement.placeHolder.productType')}
                  inputProps={{
                    ...params.inputProps,
                    readOnly: true // 🔑 Prevents keyboard
                  }}
                />
              )}
            />
          </Grid>
        </GridSearchSection>
        {isMobileOnly ? (
          <>
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
          </>
        ) : (
          <>
            <GridSearchSection container>
              <TableContainer>
                <Table id="supplier_list___table">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" key="supplierId" className={classes.tableHeader}>
                        {t('supplierManagement.column.id')}
                      </TableCell>
                      <TableCell align="center" key="supplierName" className={classes.tableHeader}>
                        {t('supplierManagement.column.name')}
                      </TableCell>
                      <TableCell align="center" key="type" className={classes.tableHeader}>
                        {t('supplierManagement.column.types.title')}
                      </TableCell>
                      <TableCell align="center" key="mainProduct" className={classes.tableHeader}>
                        {t('supplierManagement.column.mainProduct')}
                      </TableCell>
                      <TableCell align="center" key="productType" className={classes.tableHeader}>
                        {t('supplierManagement.column.productType')}
                      </TableCell>
                      <TableCell align="center" key="address" className={classes.tableHeader}>
                        {t('supplierManagement.column.address.title')}
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
                    <TableBody>{supplierData}</TableBody>
                  )}
                </Table>
              </TableContainer>
            </GridSearchSection>
          </>
        )}
        <GridSearchSection container>
          <Grid item xs={12}>
            <Paginate
              pagination={supplierList?.data.pagination}
              page={page}
              pageSize={pageSize}
              setPage={setPage}
              setPageSize={setPageSize}
              refetch={supplierRefetch}
              totalRecords={supplierList?.data.pagination.totalRecords}
              isShow={true}
            />
          </Grid>
        </GridSearchSection>
      </Wrapper>
      <UploadSupplierDialog
        open={openUploadDialog}
        onSuccess={() => supplierRefetch()}
        onClose={() => setOpenUploadDialog(false)}
      />
    </Page>
  );
}
