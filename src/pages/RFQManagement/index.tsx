import { DisabledByDefault, Search, AddCircle, Download } from '@mui/icons-material';
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
import CollapsibleWrapper from 'components/CollapsibleWrapper';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import Paginate from 'components/Paginate';
import { GridSearchSection, GridTextField, TextLineClamp, Wrapper } from 'components/Styled';
import { useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import { isMobileOnly } from 'react-device-detect';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { ROUTE_PATHS } from 'routes';
import { searchCustomerByKeyword } from 'services/Customer/customer-api';
import { Customer } from 'services/Customer/customer-type';
import { exportRFQList, getRFQList } from 'services/RFQ/rfq-api';
import { RFQEmployee, RFQFileResource, RFQRecord } from 'services/RFQ/rfq-type';
import { getMySearchFields } from 'services/SearchField/search-field-api';
import { getEmployeesByPosition, getSales } from 'services/Sales/sales-api';
import { SalesRecord } from 'services/Sales/sales-type';
import { getSystemConfig } from 'services/Config/config-api';
import { SystemConfig } from 'services/Config/config-type';
import { getProductFamilies } from 'services/Product/product-api';
import { ProductFamily, ProductMaterial, ProductSubtype1 } from 'services/Product/product-type';
import { PERMISSIONS } from 'auth/permissions';
import Can from 'auth/Can';

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

function getRfqProductSubtype1Label(rfq: RFQRecord): string | null {
  const productSubtype1 = rfq.productSubtype1;

  if (!productSubtype1) {
    return rfq.productUsage || null;
  }

  return (
    productSubtype1.nameTh ||
    productSubtype1.nameEn ||
    productSubtype1.code ||
    rfq.productUsage ||
    null
  );
}

function getRfqProductMaterialLabel(rfq: RFQRecord): string | null {
  const material = rfq.material;

  if (!material) {
    return null;
  }

  if (typeof material === 'string') {
    return material;
  }

  return material.nameTh || material.nameEn || material.code || null;
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

function getRfqTypeLabel(rfq: RFQRecord): string {
  return rfq.rfqType?.nameTh || rfq.rfqType?.nameEn || rfq.rfqType?.code || '-';
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
            onError={(event) => {
              const image = event.currentTarget as HTMLImageElement;
              if (image.getAttribute('src') === FALLBACK_RFQ_IMAGE_URL) {
                return;
              }
              image.src = FALLBACK_RFQ_IMAGE_URL;
            }}
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
            onError={(event) => {
              const image = event.currentTarget as HTMLImageElement;
              if (image.getAttribute('src') === FALLBACK_RFQ_IMAGE_URL) {
                return;
              }
              image.src = FALLBACK_RFQ_IMAGE_URL;
            }}
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
    rfqTypeCode: '',
    orderTypeCode: '',
    productFamily: '',
    productSubtype1: '',
    productMaterial: '',
    status: '',
    isAccept: '',
    keyword: '',
    requestedDateStart: dayjs().startOf('month').format('YYYY-MM-DD'),
    requestedDateEnd: dayjs().endOf('month').format('YYYY-MM-DD')
  };
}

type RFQManagementFilter = ReturnType<typeof createDefaultFilter>;

function createFilterFromRequestParams(search: string, salesId = ''): RFQManagementFilter {
  const defaultFilter = createDefaultFilter(salesId);
  const params = new URLSearchParams(search);

  const filterKeys: (keyof RFQManagementFilter)[] = [
    'id',
    'customerId',
    'salesId',
    'procurementId',
    'rfqTypeCode',
    'orderTypeCode',
    'productFamily',
    'productSubtype1',
    'productMaterial',
    'status',
    'isAccept',
    'keyword',
    'requestedDateStart',
    'requestedDateEnd'
  ];

  filterKeys.forEach((key) => {
    const value = params.get(key);
    if (value !== null) {
      defaultFilter[key] = value;
    }
  });

  return defaultFilter;
}

function parseBooleanFilter(value?: string): boolean | undefined {
  const normalized = value?.trim().toLowerCase();

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  return undefined;
}

const SCREEN_CODE = 'RFQ_LIST';
const FALLBACK_RFQ_IMAGE_URL = '/no-image.jpg';

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
  const location = useLocation();
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const canCreateRFQ = hasAnyRole([ROLES.SUPER_ADMIN, ROLES.SALES, ROLES.ADMIN]);
  const currentRole = getRole();
  const currentSalesId = getSalesId() || getEmployeeId();
  const isSalesRole = currentRole === ROLES.SALES;
  const requestParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const hasSalesIdRequestParam = requestParams.has('salesId');
  const [customerKeyword, setCustomerKeyword] = useState('');
  const [debouncedCustomerKeyword, setDebouncedCustomerKeyword] = useState('');
  const roleDefaultFilter = useMemo(
    () => createFilterFromRequestParams(location.search, isSalesRole ? currentSalesId : ''),
    [currentSalesId, isSalesRole, location.search]
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

  const canShowField = (fieldCode: keyof RFQManagementFilter) =>
    fieldCode === 'keyword' ||
    fieldCode === 'status' ||
    fieldCode === 'rfqTypeCode' ||
    fieldCode === 'productSubtype1' ||
    fieldCode === 'productMaterial' ||
    visibleFieldCodes.has(fieldCode);

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
      filter.procurementId,
      filter.rfqTypeCode,
      filter.orderTypeCode,
      filter.productFamily,
      filter.productSubtype1,
      filter.productMaterial,
      filter.status,
      filter.isAccept,
      filter.keyword,
      filter.requestedDateStart,
      filter.requestedDateEnd,
      'requestedDate',
      'DESC'
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
        status: filter.status || undefined,
        isAccept: parseBooleanFilter(filter.isAccept),
        keyword: filter.keyword,
        requestedDateStart: filter.requestedDateStart,
        requestedDateEnd: filter.requestedDateEnd,
        sortBy: 'requestedDate',
        sortDirection: 'DESC'
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

  const { data: rfqTypeList } = useQuery('rfq-type-list', () => getSystemConfig('RFQ_TYPE'), {
    refetchOnWindowFocus: false
  });

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
        salesId: canShowField('salesId') ? values.salesId?.trim() || '' : '',
        procurementId: canShowField('procurementId') ? values.procurementId?.trim() || '' : '',
        rfqTypeCode: canShowField('rfqTypeCode') ? values.rfqTypeCode?.trim() || '' : '',
        orderTypeCode: canShowField('orderTypeCode') ? values.orderTypeCode?.trim() || '' : '',
        productFamily: canShowField('productFamily') ? values.productFamily?.trim() || '' : '',
        productSubtype1: canShowField('productSubtype1')
          ? values.productSubtype1?.trim() || ''
          : '',
        productMaterial: canShowField('productMaterial')
          ? values.productMaterial?.trim() || ''
          : '',
        status: canShowField('status') ? values.status?.trim() || '' : '',
        isAccept: filter.isAccept,
        keyword: values.keyword?.trim() || '',
        requestedDateStart: canShowField('requestedDateStart')
          ? values.requestedDateStart?.trim() || ''
          : '',
        requestedDateEnd: canShowField('requestedDateEnd')
          ? values.requestedDateEnd?.trim() || ''
          : ''
      };

      setPage(1);

      if (page === 1 && JSON.stringify(filter) === JSON.stringify(nextFilter)) {
        rfqRefetch();
        return;
      }

      setFilter(nextFilter);
    }
  });

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
    if (!isSalesRole || hasSalesIdRequestParam) {
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
  }, [currentSalesId, hasSalesIdRequestParam, isSalesRole]);

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

  const handleExport = async () => {
    const exportFilter = {
      id: filter.id,
      customerId: filter.customerId,
      salesId: filter.salesId,
      procurementId: filter.procurementId,
      rfqTypeCode: filter.rfqTypeCode,
      orderTypeCode: filter.orderTypeCode,
      productFamily: filter.productFamily,
      productSubtype1: filter.productSubtype1,
      productMaterial: filter.productMaterial,
      status: filter.status || undefined,
      isAccept: parseBooleanFilter(filter.isAccept),
      keyword: filter.keyword,
      requestedDateStart: filter.requestedDateStart,
      requestedDateEnd: filter.requestedDateEnd
    };

    setIsExporting(true);
    try {
      await toast.promise(exportRFQList(exportFilter), {
        loading: t('toast.loading'),
        success: (response) => {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const tempLink = document.createElement('a');
          tempLink.href = url;
          tempLink.setAttribute('download', 'rfq-export.xlsx');
          document.body.appendChild(tempLink);
          tempLink.click();
          document.body.removeChild(tempLink);
          window.URL.revokeObjectURL(url);
          return t('toast.success');
        },
        error: () => t('toast.failed')
      });
    } finally {
      setIsExporting(false);
    }
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
            <Stack spacing={0.25} sx={{ pl: 1.5 }}>
              <Typography variant="body2" fontWeight={700}>
                {rfq.id}
              </Typography>
              <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                <Chip
                  label={getRfqTypeLabel(rfq)}
                  size="small"
                  sx={{
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    fontWeight: 700
                  }}
                />
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
            {getRfqProductSubtype1Label(rfq) ? getRfqProductSubtype1Label(rfq) : null}{' '}
            {getRfqProductMaterialLabel(rfq) ? getRfqProductMaterialLabel(rfq) : null}
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
              <Typography variant="subtitle2" fontWeight={700}>
                {rfq.id}
              </Typography>
              <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                <Chip
                  label={getRfqTypeLabel(rfq)}
                  size="small"
                  sx={{
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    fontWeight: 700
                  }}
                />
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
              {getRfqProductSubtype1Label(rfq) ? (
                <Typography variant="body2" color="text.secondary">
                  Product Subtype 1: {getRfqProductSubtype1Label(rfq)}
                </Typography>
              ) : null}
              {getRfqProductMaterialLabel(rfq) ? (
                <Typography variant="body2" color="text.secondary">
                  Product Material: {getRfqProductMaterialLabel(rfq)}
                </Typography>
              ) : null}
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
          <Can permission={PERMISSIONS.RFQ_EXPORT}>
            <Button
              fullWidth={isDownSm}
              variant="contained"
              className="btn-emerald-green"
              startIcon={<Download />}
              onClick={handleExport}>
              {t('button.export')}
            </Button>
          </Can>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-amber-orange"
            startIcon={<DisabledByDefault />}
            onClick={handleClear}>
            {t('button.clear')}
          </Button>
        </Stack>

        <CollapsibleWrapper title="ค้นหาคำขอราคา" defaultExpanded={false}>
          <GridSearchSection container spacing={1} sx={{ mt: 0 }}>
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
                    customerOptions.find(
                      (customer) => customer.id === searchFormik.values.customerId
                    ) || null
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
                      onBlur={() => searchFormik.setFieldTouched('customerId', true)}
                      error={
                        searchFormik.touched.customerId && Boolean(searchFormik.errors.customerId)
                      }
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
                  disabled={isSalesFetching}
                  InputLabelProps={{ shrink: true }}>
                  {<MenuItem value="">ทั้งหมด</MenuItem>}
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
            {canShowField('rfqTypeCode') && (
              <GridTextField item xs={12} sm={4} md={3}>
                <TextField
                  fullWidth
                  select
                  label="ประเภท RFQ"
                  name="rfqTypeCode"
                  value={searchFormik.values.rfqTypeCode}
                  onChange={searchFormik.handleChange}
                  error={
                    searchFormik.touched.rfqTypeCode && Boolean(searchFormik.errors.rfqTypeCode)
                  }
                  helperText={searchFormik.touched.rfqTypeCode && searchFormik.errors.rfqTypeCode}
                  InputLabelProps={{ shrink: true }}>
                  <MenuItem value="">ทั้งหมด</MenuItem>
                  {(rfqTypeList || []).map((item: SystemConfig) => (
                    <MenuItem key={item.code} value={item.code}>
                      {item.nameTh || item.code}
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
                      {t(`rfqManagement.rfqsStatus.${status}`)}
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
                  helperText={
                    searchFormik.touched.orderTypeCode && searchFormik.errors.orderTypeCode
                  }
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
                  onChange={(event) => {
                    searchFormik.handleChange(event);
                    searchFormik.setFieldValue('productSubtype1', '');
                    searchFormik.setFieldValue('productMaterial', '');
                  }}
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
            {canShowField('productSubtype1') && (
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
                  {!isProductFamilyFetching && productSubtype1Options.length === 0 ? (
                    <MenuItem disabled value="">
                      No product subtype 1 data
                    </MenuItem>
                  ) : null}
                  {productSubtype1Options.map((productSubtype1: ProductSubtype1) => (
                    <MenuItem key={productSubtype1.code} value={productSubtype1.code}>
                      {getProductSubtype1DisplayName(productSubtype1)}
                    </MenuItem>
                  ))}
                </TextField>
              </GridTextField>
            )}
            {canShowField('productMaterial') && (
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
                  {!isProductFamilyFetching && productMaterialOptions.length === 0 ? (
                    <MenuItem disabled value="">
                      No product material data
                    </MenuItem>
                  ) : null}
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
        </CollapsibleWrapper>

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
                      ลูกค้า
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('rfqManagement.column.sales')}
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      สินค้า
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
                      <TableCell colSpan={7} align="center">
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
      <LoadingDialog open={isExporting} />
    </Page>
  );
}
