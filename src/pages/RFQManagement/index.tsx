import { DisabledByDefault, Search, AddCircle } from '@mui/icons-material';
import {
  Autocomplete,
  Button,
  Box,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
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
import { useAuth } from 'auth/AuthContext';
import { ROLES } from 'auth/roles';
import PageTitle from 'components/PageTitle';
import Paginate from 'components/Paginate';
import { GridSearchSection, GridTextField, TextLineClamp, Wrapper } from 'components/Styled';
import { useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import { isMobileOnly } from 'react-device-detect';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import dayjs from 'dayjs';
import { ROUTE_PATHS } from 'routes';
import { searchCustomerByKeyword } from 'services/Customer/customer-api';
import { Customer } from 'services/Customer/customer-type';
import { getRFQList } from 'services/RFQ/rfq-api';
import { RFQEmployee, RFQFileResource, RFQRecord } from 'services/RFQ/rfq-type';
import { getMySearchFields } from 'services/SearchField/search-field-api';
import { getEmployeesByPosition, getSales } from 'services/Sales/sales-api';
import { SalesRecord } from 'services/Sales/sales-type';
import { getSystemConfig } from 'services/Config/config-api';
import { SystemConfig } from 'services/Config/config-type';
import { getProductFamilies } from 'services/Product/product-api';
import { ProductFamily } from 'services/Product/product-type';

function getProductFamilyLabel(productFamily: RFQRecord['productFamily']): string {
  if (!productFamily) {
    return '-';
  }

  if (typeof productFamily === 'string') {
    return productFamily;
  }

  return productFamily.nameTh || productFamily.nameEn || productFamily.code || '-';
}

function getEmployeeLabel(employee?: RFQEmployee | null): string {
  if (!employee) {
    return '-';
  }

  const nickname = employee.nickName || employee.nickname || '';
  const name = [employee.firstNameTh, employee.lastNameTh].filter(Boolean).join(' ');

  return nickname || name || '-';
}

function getSalesProcurementLabel(rfq: RFQRecord): string {
  return `${getEmployeeLabel(rfq.sales)} / ${getEmployeeLabel(rfq.procurement)}`;
}

function getCustomerLabel(rfq: RFQRecord): string | null {
  return rfq.customer?.customerName || rfq.customer?.companyName || null;
}

function getRFQFileUrl(file?: RFQFileResource | null): string {
  return file?.pictureUrl || file?.fileUrl || '';
}

function getPictureResources(rfq: RFQRecord): { id: number; pictureUrl: string }[] {
  if (Array.isArray(rfq.pictures) && rfq.pictures.length > 0) {
    return rfq.pictures
      .filter((file) => (file.fileType || '').toUpperCase() === 'PICTURE')
      .map((file) => ({
        id: file.id,
        pictureUrl: getRFQFileUrl(file)
      }))
      .filter((file) => Boolean(file.pictureUrl));
  }

  return (rfq.pictures || [])
    .map((picture) => ({
      id: picture.id,
      pictureUrl: picture.pictureUrl
    }))
    .filter((picture) => Boolean(picture.pictureUrl));
}

function getSLADayLeft(requestedDate?: string | null, slaDate?: string | null): number | null {
  if (!requestedDate || !slaDate) {
    return null;
  }

  const requestDay = dayjs(requestedDate).startOf('day');
  const targetDay = dayjs(slaDate).startOf('day');
  const today = dayjs().startOf('day');
  const referenceDay = today.isBefore(requestDay) ? requestDay : today;

  return targetDay.diff(referenceDay, 'day');
}

function getRFQRowSx(rfq: RFQRecord) {
  const dayLeft = getSLADayLeft(rfq.requestedDate, rfq.slaDate);
  const isSLAActiveStatus = ['NEW', 'IN_PROGRESS'].includes(rfq.status || '');

  if (!isSLAActiveStatus) {
    return {
      cursor: 'pointer'
    };
  }

  if (dayLeft === null || dayLeft === undefined) {
    return {
      cursor: 'pointer'
    };
  }

  if (dayLeft < 0) {
    return {
      cursor: 'pointer',
      backgroundColor: '#fff1f2',
      '&:hover': {
        backgroundColor: '#ffe4e6'
      }
    };
  }

  if (dayLeft === 0) {
    return {
      cursor: 'pointer',
      backgroundColor: '#fff7ed',
      '&:hover': {
        backgroundColor: '#ffedd5'
      }
    };
  }

  if (dayLeft === 1) {
    return {
      cursor: 'pointer',
      backgroundColor: '#fff8e1',
      '&:hover': {
        backgroundColor: '#ffefc2'
      }
    };
  }

  return {
    cursor: 'pointer',
    backgroundColor: '#e8f5e9',
    '&:hover': {
      backgroundColor: '#dff0e1'
    }
  };
}

function RFQPictureGrid({
  pictures
}: {
  pictures: { id: number; pictureUrl: string }[];
}): ReactElement {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!pictures.length) {
    return (
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: 2,
          border: '1px dashed #d7dce2',
          backgroundColor: '#f8fafb'
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 0.75,
        width: 180
      }}>
      {pictures.slice(0, 5).map((picture) => (
        <Box
          key={picture.id}
          onClick={(event) => {
            event.stopPropagation();
            setPreviewUrl(picture.pictureUrl);
          }}
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid #e3e8ee',
            backgroundColor: '#f8fafb',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
            cursor: 'pointer'
          }}>
          <Box
            component="img"
            src={picture.pictureUrl}
            alt={String(picture.id)}
            loading="lazy"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        </Box>
      ))}
      {previewUrl && (
        <Box
          onClick={(event) => {
            event.stopPropagation();
            setPreviewUrl(null);
          }}
          sx={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.68)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            p: 3
          }}>
          <Box
            component="img"
            src={previewUrl}
            alt="RFQ preview"
            sx={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              borderRadius: 3,
              boxShadow: '0 18px 50px rgba(0, 0, 0, 0.35)'
            }}
          />
        </Box>
      )}
    </Box>
  );
}

function createDefaultFilter(salesId = '') {
  return {
    id: '',
    customerId: '',
    salesId,
    procurementId: '',
    orderTypeCode: '',
    productFamily: '',
    status: '',
    keyword: '',
    requestedDateStart: dayjs().startOf('month').format('YYYY-MM-DD'),
    requestedDateEnd: dayjs().endOf('month').format('YYYY-MM-DD')
  };
}

const SCREEN_CODE = 'RFQ_LIST';

const RFQ_STATUS_OPTIONS = [
  'NEW',
  'IN_PROGRESS',
  'SUPPLIER_QUOTED',
  'QUOTED',
  'CANCELED',
  'CLOSED',
  'COMPLETED'
];

export default function RFQManagement(): ReactElement {
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
  const { getEmployeeId, getRole, getSalesId, hasAnyRole } = useAuth();
  const { t } = useTranslation();
  const history = useHistory();
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const canCreateRFQ = hasAnyRole([ROLES.SUPER_ADMIN, ROLES.SALES, ROLES.ADMIN]);
  const currentRole = getRole();
  const currentSalesId = getSalesId() || getEmployeeId();
  const isSalesRole = currentRole === ROLES.SALES;
  const [customerKeyword, setCustomerKeyword] = useState('');
  const [debouncedCustomerKeyword, setDebouncedCustomerKeyword] = useState('');
  const roleDefaultFilter = useMemo(
    () => createDefaultFilter(isSalesRole ? currentSalesId : ''),
    [currentSalesId, isSalesRole]
  );
  const [filter, setFilter] = useState(roleDefaultFilter);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedCustomerKeyword(customerKeyword.trim());
    }, 400);

    return () => window.clearTimeout(timer);
  }, [customerKeyword]);

  const { data: visibleSearchFields = [] } = useQuery(
    ['my-search-fields', SCREEN_CODE],
    () => getMySearchFields(SCREEN_CODE),
    {
      refetchOnWindowFocus: false
    }
  );

  const visibleFieldCodes = useMemo(
    () =>
      new Set(visibleSearchFields.filter((field) => field.visible).map((field) => field.fieldCode)),
    [visibleSearchFields]
  );

  const canShowField = (fieldCode: keyof typeof defaultFilter) =>
    fieldCode === 'keyword' || visibleFieldCodes.has(fieldCode);

  const {
    data: rfqResponse,
    refetch: rfqRefetch,
    isFetching: isRFQFetching
  } = useQuery(
    [
      'rfq-list',
      page,
      pageSize,
      filter.id,
      filter.customerId,
      filter.salesId,
      filter.orderTypeCode,
      filter.productFamily,
      filter.status,
      filter.keyword,
      'slaDate',
      'ASC'
    ],
    () =>
      getRFQList(page, pageSize, {
        id: filter.id,
        customerId: filter.customerId,
        salesId: filter.salesId,
        orderTypeCode: filter.orderTypeCode,
        productFamily: filter.productFamily,
        status: filter.status || undefined,
        keyword: filter.keyword,
        sortBy: 'slaDate',
        sortDirection: 'ASC'
      }),
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true,
      onSuccess: (data) => {
        if (data?.pagination) {
          setPage(data.pagination.page);
          setPageSize(data.pagination.size);
        }
      }
    }
  );

  const { data: salesOptions = [], isFetching: isSalesFetching } = useQuery(
    ['sales-options'],
    () => getSales(1, 20),
    {
      refetchOnWindowFocus: false
    }
  );

  const { data: procurementOptions = [], isFetching: isProcurementFetching } = useQuery(
    ['procurement-options'],
    () => getEmployeesByPosition('PROCUREMENT', 1, 20),
    {
      refetchOnWindowFocus: false
    }
  );

  const { data: orderTypeList } = useQuery(
    'rfq-order-type-list',
    () => getSystemConfig('ORDER_TYPE'),
    {
      refetchOnWindowFocus: false
    }
  );

  const { data: productFamilyList = [], isFetching: isProductFamilyFetching } = useQuery(
    'rfq-product-family-list',
    () => getProductFamilies(),
    {
      refetchOnWindowFocus: false
    }
  );

  const { data: customerOptions = [], isFetching: isCustomerFetching } = useQuery(
    ['rfq-customer-options', debouncedCustomerKeyword],
    () => searchCustomerByKeyword(debouncedCustomerKeyword, 1, 100),
    {
      refetchOnWindowFocus: false,
      enabled: debouncedCustomerKeyword.length > 0
    }
  );

  const salesDropdownOptions = useMemo(() => {
    if (!isSalesRole || !currentSalesId) {
      return salesOptions;
    }

    if (salesOptions.some((sales) => sales.salesId === currentSalesId)) {
      return salesOptions;
    }

    const currentSalesOption: SalesRecord = {
      salesId: currentSalesId,
      type: null,
      name: currentSalesId,
      nickname: '',
      mobileNo: null,
      bankAccountNo: null,
      bankName: null,
      bankAccountName: null,
      team: null
    };

    return [currentSalesOption, ...salesOptions];
  }, [currentSalesId, isSalesRole, salesOptions]);

  const searchFormik = useFormik({
    initialValues: roleDefaultFilter,
    enableReinitialize: true,
    onSubmit: (values) => {
      const nextFilter = {
        id: canShowField('id') ? values.id?.trim() || '' : '',
        customerId: canShowField('customerId') ? values.customerId?.trim() || '' : '',
        salesId: isSalesRole
          ? currentSalesId
          : canShowField('salesId')
            ? values.salesId?.trim() || ''
            : '',
        orderTypeCode: canShowField('orderTypeCode') ? values.orderTypeCode?.trim() || '' : '',
        productFamily: canShowField('productFamily') ? values.productFamily?.trim() || '' : '',
        status: canShowField('status') ? values.status?.trim() || '' : '',
        keyword: values.keyword?.trim() || ''
      };

      setPage(1);

      if (page === 1 && JSON.stringify(filter) === JSON.stringify(nextFilter)) {
        rfqRefetch();
        return;
      }

      setFilter(nextFilter);
    }
  });

  useEffect(() => {
    if (!isSalesRole) {
      return;
    }

    searchFormik.setFieldValue('salesId', currentSalesId, false);
    setFilter((prev) => {
      if (prev.salesId === currentSalesId) {
        return prev;
      }

      return {
        ...prev,
        salesId: currentSalesId
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSalesId, isSalesRole]);

  const handleClear = () => {
    searchFormik.resetForm();
    setCustomerKeyword('');
    setPage(1);

    if (page === 1 && JSON.stringify(filter) === JSON.stringify(roleDefaultFilter)) {
      rfqRefetch();
      return;
    }

    setFilter(roleDefaultFilter);
  };

  const rfqList = rfqResponse?.records || [];

  const rfqRows =
    rfqList.length > 0 ? (
      rfqList.map((rfq: RFQRecord) => (
        <TableRow
          hover
          key={rfq.id}
          onClick={() => history.push(ROUTE_PATHS.RFQ_DETAIL.replace(':id', rfq.id))}
          sx={getRFQRowSx(rfq)}>
          <TableCell align="left">
            <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 1.5 }}>
              <Typography variant="body2">{rfq.id}</Typography>
              <Chip
                label={t(`rfqManagement.rfqsStatus.${rfq.status}`)}
                size="small"
                sx={{
                  backgroundColor: '#e8f5e9',
                  color: '#2e7d32',
                  fontWeight: 700
                }}
              />
            </Stack>
          </TableCell>
          <TableCell align="center">
            <TextLineClamp>
              {rfq.requestedDate ? dayjs(rfq.requestedDate).format('DD/MM/YYYY HH:mm') : '-'}
            </TextLineClamp>
          </TableCell>
          <TableCell>
            <TextLineClamp>{rfq.contactName || '-'}</TextLineClamp>
          </TableCell>
          <TableCell>
            <TextLineClamp>{getSalesProcurementLabel(rfq)}</TextLineClamp>
          </TableCell>
          <TableCell>
            <TextLineClamp>{rfq.orderType?.nameTh || '-'}</TextLineClamp>
          </TableCell>
          <TableCell>
            <TextLineClamp>{getProductFamilyLabel(rfq.productFamily)}</TextLineClamp>
          </TableCell>
          <TableCell>
            <TextLineClamp>{rfq.capacity || '-'}</TextLineClamp>
          </TableCell>
          <TableCell>
            <RFQPictureGrid pictures={getPictureResources(rfq)} />
          </TableCell>
        </TableRow>
      ))
    ) : (
      <TableRow>
        <TableCell colSpan={8}>
          <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
        </TableCell>
      </TableRow>
    );

  const rfqMobileRows =
    rfqList.length > 0 ? (
      rfqList.map((rfq: RFQRecord) => (
        <TableRow
          hover
          key={rfq.id}
          onClick={() => history.push(ROUTE_PATHS.RFQ_DETAIL.replace(':id', rfq.id))}
          sx={getRFQRowSx(rfq)}>
          <TableCell align="left">
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle2" fontWeight={700}>
                  {rfq.id}
                </Typography>
                <Chip
                  label={t(`rfqManagement.rfqsStatus.${rfq.status}`)}
                  size="small"
                  sx={{
                    backgroundColor: '#e8f5e9',
                    color: '#2e7d32',
                    fontWeight: 700
                  }}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {rfq.requestedDate ? dayjs(rfq.requestedDate).format('DD/MM/YYYY HH:mm') : '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('rfqManagement.column.contact')}: {rfq.contactName || '-'}
              </Typography>
              {getCustomerLabel(rfq) ? (
                <Typography variant="body2" color="text.secondary">
                  ลูกค้า: {getCustomerLabel(rfq)}
                </Typography>
              ) : null}
              <Typography variant="body2" color="text.secondary">
                {t('rfqManagement.column.sales')}: {getSalesProcurementLabel(rfq)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('rfqManagement.column.orderType')}: {rfq.orderType?.nameTh || '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('rfqManagement.column.productFamily')}:{' '}
                {getProductFamilyLabel(rfq.productFamily)}
              </Typography>
              <RFQPictureGrid pictures={getPictureResources(rfq)} />
            </Stack>
          </TableCell>
        </TableRow>
      ))
    ) : (
      <TableRow>
        <TableCell colSpan={1}>
          <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
        </TableCell>
      </TableRow>
    );

  return (
    <Page>
      <PageTitle title={t('rfqManagement.title')} />
      <Wrapper>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{
            mt: 1,
            justifyContent: { sm: 'flex-end' },
            alignItems: { xs: 'stretch', sm: 'center' }
          }}>
          {canCreateRFQ ? (
            <Button
              variant="contained"
              className="btn-emerald-green"
              startIcon={<AddCircle />}
              onClick={() => history.push(ROUTE_PATHS.RFQ_CREATE)}>
              {t('rfqManagement.action.create')}
            </Button>
          ) : null}
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-indigo-blue"
            startIcon={<Search />}
            onClick={() => searchFormik.handleSubmit()}>
            {t('button.search')}
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-amber-orange"
            startIcon={<DisabledByDefault />}
            onClick={handleClear}>
            {t('button.clear')}
          </Button>
        </Stack>

        <GridSearchSection container spacing={1}>
          <Grid item xs={12}>
            <Typography variant="h6" component="h2">
              ค้นหาคำขอราคา
            </Typography>
          </Grid>
          {canShowField('id') && (
            <GridTextField item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                label="เลข RFQ"
                name="id"
                value={searchFormik.values.id}
                onChange={searchFormik.handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>
          )}
          {canShowField('customerId') && (
            <GridTextField item xs={12} sm={4} md={3}>
              <Autocomplete
                options={customerOptions}
                loading={isCustomerFetching}
                filterOptions={(options) => options}
                value={
                  customerOptions.find((customer) => customer.id === searchFormik.values.customerId) ||
                  null
                }
                getOptionLabel={(option: Customer) => `(${option.id}) ${option.customerName}`}
                onChange={(_event, value) => {
                  searchFormik.setFieldValue('customerId', value?.id || '');
                  setCustomerKeyword(value ? `(${value.id}) ${value.customerName}` : '');
                }}
                onInputChange={(_event, value, reason) => {
                  if (reason === 'input') {
                    setCustomerKeyword(value);
                  }

                  if (reason === 'clear') {
                    setCustomerKeyword('');
                    searchFormik.setFieldValue('customerId', '');
                  }
                }}
                noOptionsText={
                  debouncedCustomerKeyword
                    ? 'ไม่พบข้อมูลลูกค้า'
                    : 'พิมพ์เพื่อค้นหาลูกค้า'
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="รหัสลูกค้า"
                    InputLabelProps={{ shrink: true }}
                    onBlur={() => searchFormik.setFieldTouched('customerId', true)}
                    error={searchFormik.touched.customerId && Boolean(searchFormik.errors.customerId)}
                    helperText={searchFormik.touched.customerId && searchFormik.errors.customerId}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isCustomerFetching ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
              />
            </GridTextField>
          )}
          {(canShowField('salesId') || isSalesRole) && (
            <GridTextField item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                select
                label="รหัสเซลล์"
                name="salesId"
                value={searchFormik.values.salesId}
                onChange={searchFormik.handleChange}
                disabled={isSalesRole || isSalesFetching}
                InputLabelProps={{ shrink: true }}>
                {!isSalesRole && <MenuItem value="">ทั้งหมด</MenuItem>}
                {isSalesFetching ? (
                  <MenuItem disabled value="">
                    Loading...
                  </MenuItem>
                ) : null}
                {!isSalesFetching && salesDropdownOptions.length === 0 ? (
                  <MenuItem disabled value="">
                    No sales data
                  </MenuItem>
                ) : null}
                {salesDropdownOptions.map((option) => (
                  <MenuItem key={option.salesId} value={option.salesId}>
                    {`${option.salesId} - ${option.nickname || option.name}`}
                  </MenuItem>
                ))}
              </TextField>
            </GridTextField>
          )}
          {canShowField('procurementId') && (
            <GridTextField item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                select
                label="รหัสจัดซื้อ"
                name="procurementId"
                value={searchFormik.values.procurementId}
                onChange={searchFormik.handleChange}
                disabled={isProcurementFetching}
                InputLabelProps={{ shrink: true }}>
                {<MenuItem value="">ทั้งหมด</MenuItem>}
                {isProcurementFetching ? (
                  <MenuItem disabled value="">
                    Loading...
                  </MenuItem>
                ) : null}
                {!isProcurementFetching && procurementOptions.length === 0 ? (
                  <MenuItem disabled value="">
                    No procurement data
                  </MenuItem>
                ) : null}
                {procurementOptions.map((option) => (
                  <MenuItem key={option.salesId} value={option.salesId}>
                    {`${option.salesId} - ${option.nickname || option.name}`}
                  </MenuItem>
                ))}
              </TextField>
            </GridTextField>
          )}
          {canShowField('orderTypeCode') && (
            <GridTextField item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                select
                label="ประเภทงาน"
                name="orderTypeCode"
                value={searchFormik.values.orderTypeCode}
                onChange={searchFormik.handleChange}
                error={
                  searchFormik.touched.orderTypeCode && Boolean(searchFormik.errors.orderTypeCode)
                }
                helperText={searchFormik.touched.orderTypeCode && searchFormik.errors.orderTypeCode}
                InputLabelProps={{ shrink: true }}>
                {(orderTypeList || []).map((item: SystemConfig) => (
                  <MenuItem key={item.code} value={item.code}>
                    {item.nameTh || item.code}
                  </MenuItem>
                ))}
              </TextField>
            </GridTextField>
          )}
          {canShowField('productFamily') && (
            <GridTextField item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                select
                label="Product Family"
                name="productFamily"
                value={searchFormik.values.productFamily}
                onChange={searchFormik.handleChange}
                disabled={isProductFamilyFetching}
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="">ทั้งหมด</MenuItem>
                {isProductFamilyFetching ? (
                  <MenuItem disabled value="">
                    Loading...
                  </MenuItem>
                ) : null}
                {!isProductFamilyFetching && productFamilyList.length === 0 ? (
                  <MenuItem disabled value="">
                    No product family data
                  </MenuItem>
                ) : null}
                {productFamilyList.map((productFamily: ProductFamily) => (
                  <MenuItem key={productFamily.code} value={productFamily.code}>
                    {productFamily.nameTh && productFamily.nameEn
                      ? `${productFamily.nameTh} (${productFamily.nameEn})`
                      : productFamily.nameTh || productFamily.nameEn || productFamily.code}
                  </MenuItem>
                ))}
              </TextField>
            </GridTextField>
          )}
          {canShowField('status') && (
            <GridTextField item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                select
                label="สถานะ"
                name="status"
                value={searchFormik.values.status}
                onChange={searchFormik.handleChange}
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="">ทั้งหมด</MenuItem>
                {RFQ_STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status} value={status}>
                    {t(`rfqManagement.rfqsStatus.${status}`, status)}
                  </MenuItem>
                ))}
              </TextField>
            </GridTextField>
          )}
          {canShowField('requestedDateStart') && (
            <GridTextField item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                type="date"
                label="วันที่ขอราคาเริ่มต้น"
                name="requestedDateStart"
                value={searchFormik.values.requestedDateStart}
                onChange={searchFormik.handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>
          )}
          {canShowField('requestedDateEnd') && (
            <GridTextField item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                type="date"
                label="วันที่ขอราคาสิ้นสุด"
                name="requestedDateEnd"
                value={searchFormik.values.requestedDateEnd}
                onChange={searchFormik.handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>
          )}
          {canShowField('keyword') && (
            <GridTextField item xs={12} sm={8} md={6}>
              <TextField
                fullWidth
                label="คำค้นหา"
                placeholder="เลข RFQ, ชื่อลูกค้า, ชื่อสินค้า"
                name="keyword"
                value={searchFormik.values.keyword}
                onChange={searchFormik.handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>
          )}
        </GridSearchSection>

        {isMobileOnly ? (
          <GridSearchSection container>
            <TableContainer>
              <Table id="rfq_mobile___table">
                <TableHead>
                  <TableRow>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('rfqManagement.mobileTitle')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                {isRFQFetching ? (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={1} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                ) : (
                  <TableBody>{rfqMobileRows}</TableBody>
                )}
              </Table>
            </TableContainer>
          </GridSearchSection>
        ) : (
          <GridSearchSection container>
            <TableContainer>
              <Table id="rfq_list___table">
                <TableHead>
                  <TableRow>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('rfqManagement.column.id')}
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('rfqManagement.column.requestedDate')}
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('rfqManagement.column.contact')}
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('rfqManagement.column.sales')}
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('rfqManagement.column.orderType')}
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('rfqManagement.column.productFamily')}
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('rfqManagement.column.capacity')}
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('rfqManagement.column.pictures')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                {isRFQFetching ? (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                ) : (
                  <TableBody>{rfqRows}</TableBody>
                )}
              </Table>
            </TableContainer>
          </GridSearchSection>
        )}

        <GridSearchSection container>
          <Grid item xs={12}>
            {isRFQFetching ? (
              ' '
            ) : (
              <Paginate
                pagination={rfqResponse?.pagination}
                page={page}
                pageSize={pageSize}
                setPage={setPage}
                setPageSize={setPageSize}
                refetch={rfqRefetch}
                totalRecords={rfqResponse?.pagination.totalRecords}
                isShow={!isDownSm}
              />
            )}
          </Grid>
        </GridSearchSection>
      </Wrapper>
    </Page>
  );
}
