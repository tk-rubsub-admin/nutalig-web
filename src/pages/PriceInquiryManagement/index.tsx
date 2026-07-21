import { DisabledByDefault, Search } from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Button,
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
import CollapsibleWrapper from 'components/CollapsibleWrapper';
import PageTitle from 'components/PageTitle';
import Paginate from 'components/Paginate';
import { GridSearchSection, GridTextField, TextLineClamp, Wrapper } from 'components/Styled';
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import { isMobileOnly } from 'react-device-detect';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { searchCustomerByKeyword } from 'services/Customer/customer-api';
import { Customer } from 'services/Customer/customer-type';
import { getSystemConfig } from 'services/Config/config-api';
import { SystemConfig } from 'services/Config/config-type';
import { getProductFamilies } from 'services/Product/product-api';
import { ProductFamily, ProductMaterial, ProductSubtype1 } from 'services/Product/product-type';
import { getRFQList } from 'services/RFQ/rfq-api';
import { RFQEmployee, RFQFileResource, RFQRecord } from 'services/RFQ/rfq-type';
import { getEmployeesByPosition, getSales } from 'services/Sales/sales-api';
import { SalesRecord } from 'services/Sales/sales-type';

function getProductFamilyLabel(productFamily: RFQRecord['productFamily']): string {
  if (!productFamily) {
    return '-';
  }

  if (typeof productFamily === 'string') {
    return productFamily;
  }

  return productFamily.nameTh || productFamily.nameEn || productFamily.code || '-';
}

function getProductSubtype1DisplayName(productSubtype1: ProductSubtype1): string {
  if (productSubtype1.nameTh && productSubtype1.nameEn) {
    return `${productSubtype1.nameTh} (${productSubtype1.nameEn})`;
  }

  return productSubtype1.nameTh || productSubtype1.nameEn || productSubtype1.code;
}

function getProductMaterialDisplayName(productMaterial: ProductMaterial): string {
  if (productMaterial.nameTh && productMaterial.nameEn) {
    return `${productMaterial.nameTh} (${productMaterial.nameEn})`;
  }

  return productMaterial.nameTh || productMaterial.nameEn || productMaterial.code;
}

function getProductMaterialOptionLabel(
  productMaterial: ProductMaterial,
  isFamilySelected: boolean
): string {
  const label = getProductMaterialDisplayName(productMaterial);

  if (isFamilySelected || !productMaterial.productFamilyCode) {
    return label;
  }

  return `${label} [${productMaterial.productFamilyCode}]`;
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

function getCustomerTierLabel(rfq: RFQRecord): string | null {
  return rfq.customer?.customerTier?.nameEn || null;
}

function getCustomerTierColor(code?: string | null): { backgroundColor: string; color: string } {
  switch (code) {
    case 'VIP':
      return { backgroundColor: '#7C3AED', color: '#FFFFFF' };
    case 'TIER_2':
      return { backgroundColor: '#2563EB', color: '#FFFFFF' };
    case 'TIER_3':
      return { backgroundColor: '#0F766E', color: '#FFFFFF' };
    case 'TIER_4':
      return { backgroundColor: '#F59E0B', color: '#FFFFFF' };
    default:
      return { backgroundColor: '#CBD5E1', color: '#334155' };
  }
}

function createDefaultFilter(salesId = '', procurementId = '') {
  return {
    id: '',
    customerId: '',
    salesId,
    procurementId,
    rfqTypeCode: '',
    orderTypeCode: '',
    productFamily: '',
    productSubtype1: '',
    productMaterial: '',
    keyword: '',
    requestedDateStart: dayjs().startOf('month').format('YYYY-MM-DD'),
    requestedDateEnd: dayjs().endOf('month').format('YYYY-MM-DD')
  };
}

type PriceInquiryFilter = ReturnType<typeof createDefaultFilter>;

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
            alt="Price inquiry preview"
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

export default function PriceInquiryManagement(): ReactElement {
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
  const { getEmployeeId, getRole, getSalesId } = useAuth();
  const { t } = useTranslation();
  const history = useHistory();
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const currentRole = getRole();
  const currentSalesId = getSalesId() || getEmployeeId();
  const isSalesRole = currentRole === ROLES.SALES;
  const currentProcurementId = getEmployeeId();
  const isProcurementRole = currentRole === ROLES.PROCUREMENT;
  const roleDefaultFilter = useMemo(
    () =>
      createDefaultFilter(
        isSalesRole ? currentSalesId : '',
        isProcurementRole ? currentProcurementId : ''
      ),
    [currentProcurementId, currentSalesId, isProcurementRole, isSalesRole]
  );
  const [filter, setFilter] = useState(roleDefaultFilter);
  const [customerKeyword, setCustomerKeyword] = useState('');
  const [debouncedCustomerKeyword, setDebouncedCustomerKeyword] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedCustomerKeyword(customerKeyword.trim());
    }, 400);

    return () => window.clearTimeout(timer);
  }, [customerKeyword]);

  const searchFormik = useFormik({
    initialValues: roleDefaultFilter,
    enableReinitialize: true,
    onSubmit: (values) => {
      const nextFilter = {
        id: values.id?.trim() || '',
        customerId: values.customerId?.trim() || '',
        salesId: values.salesId?.trim() || '',
        procurementId: values.procurementId?.trim() || '',
        rfqTypeCode: values.rfqTypeCode?.trim() || '',
        orderTypeCode: values.orderTypeCode?.trim() || '',
        productFamily: values.productFamily?.trim() || '',
        productSubtype1: values.productSubtype1?.trim() || '',
        productMaterial: values.productMaterial?.trim() || '',
        keyword: values.keyword?.trim() || '',
        requestedDateStart: values.requestedDateStart?.trim() || '',
        requestedDateEnd: values.requestedDateEnd?.trim() || ''
      };

      setPage(1);

      if (page === 1 && JSON.stringify(filter) === JSON.stringify(nextFilter)) {
        rfqRefetch();
        return;
      }

      setFilter(nextFilter);
    }
  });

  const {
    data: rfqResponse,
    refetch: rfqRefetch,
    isFetching: isRFQFetching
  } = useQuery(
    [
      'price-inquiry-list',
      page,
      pageSize,
      filter.id,
      filter.customerId,
      filter.salesId,
      filter.procurementId,
      filter.rfqTypeCode,
      filter.orderTypeCode,
      filter.productFamily,
      filter.productSubtype1,
      filter.productMaterial,
      filter.keyword,
      filter.requestedDateStart,
      filter.requestedDateEnd,
      'slaDate',
      'ASC'
    ],
    () =>
      getRFQList(page, pageSize, {
        id: filter.id,
        customerId: filter.customerId,
        salesId: filter.salesId,
        procurementId: filter.procurementId,
        rfqTypeCode: filter.rfqTypeCode,
        orderTypeCode: filter.orderTypeCode,
        productFamily: filter.productFamily,
        productSubtype1: filter.productSubtype1,
        productMaterial: filter.productMaterial,
        keyword: filter.keyword,
        requestedDateStart: filter.requestedDateStart,
        requestedDateEnd: filter.requestedDateEnd,
        sortBy: 'slaDate',
        sortDirection: 'ASC',
        statuses: ['NEW', 'IN_PROGRESS', 'SUPPLIER_QUOTED'],
        prioritizeApprovedUrgent: true
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
    ['price-inquiry-sales-options'],
    () => getSales(1, 20),
    {
      refetchOnWindowFocus: false
    }
  );

  const { data: procurementOptions = [], isFetching: isProcurementFetching } = useQuery(
    ['price-inquiry-procurement-options'],
    () => getEmployeesByPosition('PROCUREMENT', 1, 20),
    {
      refetchOnWindowFocus: false
    }
  );

  const { data: orderTypeList } = useQuery(
    'price-inquiry-order-type-list',
    () => getSystemConfig('ORDER_TYPE'),
    {
      refetchOnWindowFocus: false
    }
  );

  const { data: rfqTypeList } = useQuery(
    'price-inquiry-rfq-type-list',
    () => getSystemConfig('RFQ_TYPE'),
    {
      refetchOnWindowFocus: false
    }
  );

  const { data: productFamilyList = [], isFetching: isProductFamilyFetching } = useQuery(
    'price-inquiry-product-family-list',
    () => getProductFamilies(),
    {
      refetchOnWindowFocus: false
    }
  );

  const { data: customerOptions = [], isFetching: isCustomerFetching } = useQuery(
    ['price-inquiry-customer-options', debouncedCustomerKeyword],
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

  const selectedProductFamily = useMemo(
    () =>
      productFamilyList.find(
        (productFamily: ProductFamily) => productFamily.code === searchFormik.values.productFamily
      ) || null,
    [productFamilyList, searchFormik.values.productFamily]
  );

  const productSubtype1Options = useMemo(() => {
    if (selectedProductFamily) {
      return selectedProductFamily.subtype1List || [];
    }

    return productFamilyList.flatMap(
      (productFamily: ProductFamily) => productFamily.subtype1List || []
    );
  }, [productFamilyList, selectedProductFamily]);

  const productMaterialOptions = useMemo(() => {
    if (selectedProductFamily) {
      return selectedProductFamily.materialList || selectedProductFamily.productMaterialList || [];
    }

    return productFamilyList.flatMap(
      (productFamily: ProductFamily) =>
        productFamily.materialList || productFamily.productMaterialList || []
    );
  }, [productFamilyList, selectedProductFamily]);

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

  useEffect(() => {
    if (!isProcurementRole) {
      return;
    }

    searchFormik.setFieldValue('procurementId', currentProcurementId, false);
    setFilter((prev) => {
      if (prev.procurementId === currentProcurementId) {
        return prev;
      }

      return {
        ...prev,
        procurementId: currentProcurementId
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProcurementId, isProcurementRole]);

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
          onClick={() => history.push(ROUTE_PATHS.PRICE_INQUIRY.replace(':id', rfq.id))}
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
              {rfq.customer?.customerTier ? (
                <Chip
                  label={getCustomerTierLabel(rfq) || '-'}
                  size="small"
                  sx={{
                    ...getCustomerTierColor(rfq.customer.customerTier.code),
                    fontWeight: 700
                  }}
                />
              ) : null}
              {rfq.urgentRequestStatus === 'APPROVED' ? (
                <Chip
                  label="เร่งด่วน"
                  size="small"
                  sx={{
                    backgroundColor: '#fee2e2',
                    color: '#b91c1c',
                    fontWeight: 700
                  }}
                />
              ) : null}
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
          onClick={() => history.push(ROUTE_PATHS.PRICE_INQUIRY.replace(':id', rfq.id))}
          sx={getRFQRowSx(rfq)}>
          <TableCell align="left">
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle2" fontWeight={700}>
                  {rfq.id}
                </Typography>
                <Chip
                  label={t(`rfqManagement.status.${rfq.status}`)}
                  size="small"
                  sx={{
                    backgroundColor: '#e8f5e9',
                    color: '#2e7d32',
                    fontWeight: 700
                  }}
                />
                {rfq.customer?.customerTier ? (
                  <Chip
                    label={getCustomerTierLabel(rfq) || '-'}
                    size="small"
                    sx={{
                      ...getCustomerTierColor(rfq.customer.customerTier.code),
                      fontWeight: 700
                    }}
                  />
                ) : null}
                {rfq.urgentRequestStatus === 'APPROVED' ? (
                  <Chip
                    label="เร่งด่วน"
                    size="small"
                    sx={{
                      backgroundColor: '#fee2e2',
                      color: '#b91c1c',
                      fontWeight: 700
                    }}
                  />
                ) : null}
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
                {t('rfqManagement.column.productFamily')}: {getProductFamilyLabel(rfq.productFamily)}
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
      <PageTitle title={t('priceInquiryManagement.title')} />
      <Wrapper>
        <Stack
          direction={isDownSm ? 'column' : 'row'}
          spacing={1}
          justifyContent="flex-end"
          sx={{ mb: 2 }}>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-blue-green"
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

        <CollapsibleWrapper title="ค้นหาสอบถามราคา" defaultExpanded={false}>
          <GridSearchSection container spacing={1} sx={{ mt: 0 }}>
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
                  debouncedCustomerKeyword ? 'ไม่พบข้อมูลลูกค้า' : 'พิมพ์เพื่อค้นหาลูกค้า'
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="รหัสลูกค้า"
                    InputLabelProps={{ shrink: true }}
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
            <GridTextField item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                select
                label="รหัสเซลล์"
                name="salesId"
                value={searchFormik.values.salesId}
                onChange={searchFormik.handleChange}
                InputLabelProps={{ shrink: true }}>
                {!isSalesRole && <MenuItem value="">ทั้งหมด</MenuItem>}
                {salesDropdownOptions.map((option) => (
                  <MenuItem key={option.salesId} value={option.salesId}>
                    {`${option.salesId} - ${option.nickname || option.name}`}
                  </MenuItem>
                ))}
              </TextField>
            </GridTextField>
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
                {procurementOptions.map((option) => (
                  <MenuItem key={option.salesId} value={option.salesId}>
                    {`${option.salesId} - ${option.nickname || option.name}`}
                  </MenuItem>
                ))}
              </TextField>
            </GridTextField>
            <GridTextField item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                select
                label="ประเภท RFQ"
                name="rfqTypeCode"
                value={searchFormik.values.rfqTypeCode}
                onChange={searchFormik.handleChange}
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="">ทั้งหมด</MenuItem>
                {(rfqTypeList || []).map((item: SystemConfig) => (
                  <MenuItem key={item.code} value={item.code}>
                    {item.nameTh || item.code}
                  </MenuItem>
                ))}
              </TextField>
            </GridTextField>
            <GridTextField item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                select
                label="ประเภทงาน"
                name="orderTypeCode"
                value={searchFormik.values.orderTypeCode}
                onChange={searchFormik.handleChange}
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="">ทั้งหมด</MenuItem>
                {(orderTypeList || []).map((item: SystemConfig) => (
                  <MenuItem key={item.code} value={item.code}>
                    {item.nameTh || item.code}
                  </MenuItem>
                ))}
              </TextField>
            </GridTextField>
            <GridTextField item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                select
                label="Product Family"
                name="productFamily"
                value={searchFormik.values.productFamily}
                onChange={(event) => {
                  searchFormik.handleChange(event);
                  searchFormik.setFieldValue('productSubtype1', '');
                  searchFormik.setFieldValue('productMaterial', '');
                }}
                disabled={isProductFamilyFetching}
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="">ทั้งหมด</MenuItem>
                {productFamilyList.map((productFamily: ProductFamily) => (
                  <MenuItem key={productFamily.code} value={productFamily.code}>
                    {productFamily.nameTh && productFamily.nameEn
                      ? `${productFamily.nameTh} (${productFamily.nameEn})`
                      : productFamily.nameTh || productFamily.nameEn || productFamily.code}
                  </MenuItem>
                ))}
              </TextField>
            </GridTextField>
            <GridTextField item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                select
                label="Product Subtype 1"
                name="productSubtype1"
                value={searchFormik.values.productSubtype1}
                onChange={searchFormik.handleChange}
                disabled={isProductFamilyFetching}
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="">ทั้งหมด</MenuItem>
                {productSubtype1Options.map((productSubtype1: ProductSubtype1) => (
                  <MenuItem key={productSubtype1.code} value={productSubtype1.code}>
                    {getProductSubtype1DisplayName(productSubtype1)}
                  </MenuItem>
                ))}
              </TextField>
            </GridTextField>
            <GridTextField item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                select
                label="Product Material"
                name="productMaterial"
                value={searchFormik.values.productMaterial}
                onChange={searchFormik.handleChange}
                disabled={isProductFamilyFetching}
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="">ทั้งหมด</MenuItem>
                {productMaterialOptions.map((productMaterial: ProductMaterial) => (
                  <MenuItem
                    key={`${productMaterial.productFamilyCode || 'ALL'}-${productMaterial.code}`}
                    value={productMaterial.code}>
                    {getProductMaterialOptionLabel(
                      productMaterial,
                      Boolean(selectedProductFamily)
                    )}
                  </MenuItem>
                ))}
              </TextField>
            </GridTextField>
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
          </GridSearchSection>
        </CollapsibleWrapper>

        {isMobileOnly ? (
          <GridSearchSection container>
            <TableContainer>
              <Table id="price_inquiry_mobile___table">
                <TableHead>
                  <TableRow>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('priceInquiryManagement.mobileTitle')}
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
              <Table id="price_inquiry_list___table">
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
