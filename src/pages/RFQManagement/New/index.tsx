import {
  AddCircleOutline,
  ArrowBackIos,
  Cancel,
  DeleteOutline,
  RemoveCircleOutline,
  Save,
  UploadFile
} from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  ListSubheader,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import ConfirmDialog from 'components/ConfirmDialog';
import FileUploader from 'components/FileUploader';
import ImageFileUploaderWrapper from 'components/ImageFileUploaderWrapper';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import { GridTextField, Wrapper } from 'components/Styled';
import { useAuth } from 'auth/AuthContext';
import { useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { createSystemConfig, getSystemConfig } from 'services/Config/config-api';
import { SystemConfig } from 'services/Config/config-type';
import { searchCustomerByKeyword } from 'services/Customer/customer-api';
import { Contact, Customer } from 'services/Customer/customer-type';
import { getProductFamilies } from 'services/Product/product-api';
import {
  ProductFamily,
  ProductMaterial,
  ProductSubtype1,
  ProductSubtype2
} from 'services/Product/product-type';
import { addRFQAttachments, createRFQ } from 'services/RFQ/rfq-api';
import { getProcurementEmployees, getSales } from 'services/Sales/sales-api';
import { SalesRecord } from 'services/Sales/sales-type';
import * as Yup from 'yup';

const CUSTOM_UNIT_OPTION = '__custom_unit__';
const RFQ_SALES_TEAM_CODES = ['SALES_ONLINE', 'SALES_OFFLINE'];

function getProductFamilyDisplayName(productFamily: ProductFamily): string {
  if (productFamily.nameTh && productFamily.nameEn) {
    return `${productFamily.nameTh} (${productFamily.nameEn})`;
  }

  return productFamily.nameTh || productFamily.nameEn || productFamily.code;
}

function getProductSubtype1DisplayName(productSubtype1: ProductSubtype1): string {
  if (productSubtype1.nameTh && productSubtype1.nameEn) {
    return `${productSubtype1.nameTh} (${productSubtype1.nameEn})`;
  }

  return productSubtype1.nameTh || productSubtype1.nameEn || productSubtype1.code;
}

function getProductSubtype2DisplayName(productSubtype2: ProductSubtype2): string {
  if (productSubtype2.nameTh && productSubtype2.nameEn) {
    return `${productSubtype2.nameTh} (${productSubtype2.nameEn})`;
  }

  return productSubtype2.nameTh || productSubtype2.nameEn || productSubtype2.code;
}

function getProductMaterialDisplayName(productMaterial: ProductMaterial): string {
  if (productMaterial.nameTh && productMaterial.nameEn) {
    return `${productMaterial.nameTh} (${productMaterial.nameEn})`;
  }

  return productMaterial.nameTh || productMaterial.nameEn || productMaterial.code;
}

function getSystemConfigDisplayName(systemConfig: SystemConfig): string {
  if (systemConfig.nameTh && systemConfig.nameEn) {
    return `${systemConfig.nameTh} (${systemConfig.nameEn})`;
  }

  return systemConfig.nameTh || systemConfig.nameEn || systemConfig.code;
}

export default function NewRFQ(): JSX.Element {
  const theme = useTheme();
  const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
  const history = useHistory();
  const { hasRole, getEmployeeId } = useAuth();
  const { t } = useTranslation();
  const [actionType, setActionType] = useState('');
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
  const [urgentReasonDialogOpen, setUrgentReasonDialogOpen] = useState(false);
  const [urgentReason, setUrgentReason] = useState('');
  const [pictureFiles, setPictureFiles] = useState<File[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [customerKeyword, setCustomerKeyword] = useState('');
  const [debouncedCustomerKeyword, setDebouncedCustomerKeyword] = useState('');
  const [customUnitInput, setCustomUnitInput] = useState('');
  const [isCreatingUnit, setIsCreatingUnit] = useState(false);

  const pictureUrls = pictureFiles.map((file) => URL.createObjectURL(file));
  const isSalesRole = hasRole('SALES');
  const defaultSalesId = isSalesRole ? getEmployeeId() : '';
  const submitModeRef = useRef<'NORMAL' | 'URGENT'>('NORMAL');
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedCustomerKeyword(customerKeyword.trim());
    }, 400);

    return () => window.clearTimeout(timer);
  }, [customerKeyword]);

  const { data: orderTypeList } = useQuery(
    'rfq-order-type-list',
    () => getSystemConfig('ORDER_TYPE'),
    {
      refetchOnWindowFocus: false
    }
  );

  const { data: rfqTypeList = [] } = useQuery(
    'rfq-type-list',
    () => getSystemConfig('RFQ_TYPE'),
    {
      refetchOnWindowFocus: false
    }
  );

  const { data: unitOptions = [], isFetching: isUnitFetching, refetch: refetchUnitOptions } = useQuery(
    'rfq-unit-options',
    () => getSystemConfig('UNIT'),
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

  const { data: productFamilyList = [], isFetching: isProductFamilyFetching } = useQuery(
    'rfq-product-family-list',
    () => getProductFamilies(),
    {
      refetchOnWindowFocus: false
    }
  );

  const { data: salesOptions = [], isFetching: isSalesFetching } = useQuery(
    'rfq-sales-options',
    () => getSales(1, 20),
    {
      refetchOnWindowFocus: false
    }
  );

  const rfqSalesOptions = salesOptions.filter((sales) =>
    sales.team?.code ? RFQ_SALES_TEAM_CODES.includes(sales.team.code) : false
  );

  const groupedSalesOptions = rfqSalesOptions.reduce(
    (groups: { groupLabel: string; records: SalesRecord[] }[], sales: SalesRecord) => {
      const groupLabel =
        sales.team?.nameTh || sales.team?.nameEn || sales.team?.code || 'ไม่ระบุทีม';
      const existingGroup = groups.find((group) => group.groupLabel === groupLabel);

      if (existingGroup) {
        existingGroup.records.push(sales);
        return groups;
      }

      groups.push({
        groupLabel,
        records: [sales]
      });

      return groups;
    },
    []
  );

  const submitCreateRFQ = async (
    values: {
      customerMode: string;
      customerId: string;
      contactName: string;
      contactPhone: string;
      salesId: string;
      purchaseAccount: string;
      rfqTypeCode: string;
      orderTypeCode: string;
      shippingMethod: 'ALL' | 'LAND' | 'SEA' | string;
      productFamily: string;
      productUsage: string;
      systemMechanic: string;
      material: string;
      capacity: string;
      capacityUnit: string;
      targetPrice: string;
      requestedMoqs: string[];
      description: string;
    },
    actions: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    actions.setSubmitting(true);

    try {
      let selectedCapacityUnit = values.capacityUnit;

      if (selectedCapacityUnit === CUSTOM_UNIT_OPTION) {
        selectedCapacityUnit = (await createCustomUnit()) || '';
      }

      const isUrgentRequest = submitModeRef.current === 'URGENT';
      const response = await createRFQ({
        customerId: values.customerMode === 'EXISTING' ? values.customerId : undefined,
        contactName: values.contactName,
        contactPhone: values.contactPhone,
        salesId: values.salesId,
        procurementId: values.purchaseAccount || undefined,
        rfqTypeCode: values.rfqTypeCode,
        orderTypeCode: values.orderTypeCode,
        shippingMethod: values.shippingMethod as 'ALL' | 'LAND' | 'SEA',
        productFamily: values.productFamily,
        productUsage: values.productUsage,
        systemMechanic: values.systemMechanic,
        material: values.material,
        capacity: selectedCapacityUnit
          ? `${values.capacity.trim()} ${selectedCapacityUnit}`.trim()
          : values.capacity,
        targetPrice: values.targetPrice ? Number(values.targetPrice) : undefined,
        requestedMoqs: values.requestedMoqs
          .map((value) => value.trim())
          .filter((value) => value.length > 0)
          .map((value) => Number(value)),
        urgentRequest: isUrgentRequest,
        urgentRequestReason: isUrgentRequest ? urgentReason.trim() : undefined,
        description: values.description,
        pictures: pictureFiles
      });

      toast.success(t('rfqManagement.message.createSuccess'));

      const rfqId = response?.data?.id;
      if (rfqId) {
        if (attachmentFiles.length > 0) {
          await addRFQAttachments(rfqId, attachmentFiles);
        }

        history.push(ROUTE_PATHS.RFQ_DETAIL.replace(':id', rfqId));
      } else {
        history.push(ROUTE_PATHS.RFQ_MANAGEMENT);
      }
    } catch (error: any) {
      toast.error(`${t('rfqManagement.message.createFailed')}${error?.message || ''}`);
    } finally {
      submitModeRef.current = 'NORMAL';
      setUrgentReasonDialogOpen(false);
      setUrgentReason('');
      actions.setSubmitting(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      customerMode: 'NEW',
      customerId: '',
      contactName: '',
      contactPhone: '',
      salesId: defaultSalesId,
      purchaseAccount: '',
      rfqTypeCode: '',
      orderTypeCode: '',
      shippingMethod: 'ALL',
      productFamily: '',
      productUsage: '',
      systemMechanic: '',
      material: '',
      capacity: '',
      capacityUnit: '',
      targetPrice: '',
      requestedMoqs: [''],
      description: ''
    },
    validationSchema: Yup.object().shape({
      customerMode: Yup.string().oneOf(['NEW', 'EXISTING']).required(),
      customerId: Yup.string().when('customerMode', {
        is: 'EXISTING',
        then: Yup.string().required(t('rfqManagement.validation.customerId')),
        otherwise: Yup.string().nullable()
      }),
      contactName: Yup.string().when('customerMode', {
        is: 'NEW',
        then: Yup.string().max(255).required(t('rfqManagement.validation.contactName')),
        otherwise: Yup.string().nullable()
      }),
      salesId: Yup.string().required(t('rfqManagement.validation.salesId')),
      purchaseAccount: Yup.string().required('กรุณาเลือกจัดซื้อที่ดูแล'),
      rfqTypeCode: Yup.string().required(t('rfqManagement.validation.rfqTypeCode')),
      orderTypeCode: Yup.string().required(t('rfqManagement.validation.orderTypeCode')),
      shippingMethod: Yup.string().oneOf(['ALL', 'LAND', 'SEA']).required(),
      productFamily: Yup.string().max(255).required(t('rfqManagement.validation.productFamily')),
      productUsage: Yup.string().max(255).required(t('rfqManagement.validation.productUsage')),
      systemMechanic: Yup.string().max(255),
      material: Yup.string().max(255).required(t('rfqManagement.validation.material')),
      capacity: Yup.string().max(255).required(t('rfqManagement.validation.capacity')),
      targetPrice: Yup.string().test(
        'target-price-format',
        t('rfqManagement.validation.targetPrice'),
        (value) => !value || (!Number.isNaN(Number(value)) && Number(value) > 0)
      ),
      requestedMoqs: Yup.array()
        .of(
          Yup.string().test(
            'requested-moq-format',
            t('rfqManagement.validation.requestedMoqs'),
            (value) => !value || (!Number.isNaN(Number(value)) && Number(value) > 0)
          )
        )
        .test(
          'requested-moq-required',
          t('rfqManagement.validation.requestedMoqsRequired'),
          (values) => {
            if (!Array.isArray(values) || values.length === 0) {
              return false;
            }

            return values.every((value) => value && value.trim().length > 0);
          }
        ),
      description: Yup.string().max(1000).required(t('rfqManagement.validation.description'))
    }),
    onSubmit: submitCreateRFQ
  });
  const { data: procurementOptions = [], isFetching: isProcurementFetching } = useQuery(
    ['rfq-procurement-options', formik.values.salesId],
    () => getProcurementEmployees(formik.values.salesId),
    {
      refetchOnWindowFocus: false,
      enabled: Boolean(formik.values.salesId)
    }
  );

  const selectedProductFamily = useMemo(
    () =>
      productFamilyList.find(
        (productFamily: ProductFamily) => productFamily.code === formik.values.productFamily
      ),
    [formik.values.productFamily, productFamilyList]
  );

  const productUsageOptions = selectedProductFamily?.subtype1List || [];

  const selectedProductUsage = useMemo(
    () =>
      productUsageOptions.find(
        (productSubtype1: ProductSubtype1) => productSubtype1.code === formik.values.productUsage
      ),
    [formik.values.productUsage, productUsageOptions]
  );

  const systemMechanicOptions = selectedProductUsage?.subtype2List || [];
  const materialOptions =
    selectedProductFamily?.materialList || selectedProductFamily?.productMaterialList || [];

  const createCustomUnit = async (): Promise<string | null> => {
    const trimmedValue = customUnitInput.trim();

    if (!trimmedValue) {
      return null;
    }

    const matchedUnit = unitOptions.find(
      (unit: SystemConfig) => unit.code.toLowerCase() === trimmedValue.toLowerCase()
    );

    if (matchedUnit) {
      formik.setFieldValue('capacityUnit', matchedUnit.code);
      setCustomUnitInput('');
      return matchedUnit.code;
    }

    setIsCreatingUnit(true);

    try {
      await toast.promise(
        createSystemConfig({
          groupCode: 'UNIT',
          code: trimmedValue,
          nameTh: trimmedValue,
          nameEn: trimmedValue,
          sort: 99
        }),
        {
          loading: t('toast.loading'),
          success: t('toast.success'),
          error: t('toast.failed')
        }
      );

      await refetchUnitOptions();
      formik.setFieldValue('capacityUnit', trimmedValue);
      setCustomUnitInput('');

      return trimmedValue;
    } finally {
      setIsCreatingUnit(false);
    }
  };

  useEffect(() => {
    if (
      !formik.values.salesId ||
      formik.values.purchaseAccount ||
      procurementOptions.length === 0
    ) {
      return;
    }

    const defaultProcurement = procurementOptions.find((option) => option.isDefault);

    if (defaultProcurement) {
      formik.setFieldValue('purchaseAccount', defaultProcurement.salesId);
    }
  }, [formik, procurementOptions]);

  const handleOpenConfirm = (type: string, title: string, message: string) => {
    setActionType(type);
    setDialogTitle(title);
    setDialogMessage(message);
    setVisibleConfirmationDialog(true);
  };

  const handleOpenUrgentReasonDialog = async () => {
    const touchedFields = {
      customerMode: true,
      customerId: true,
      contactName: true,
      contactPhone: true,
      salesId: true,
      purchaseAccount: true,
      rfqTypeCode: true,
      orderTypeCode: true,
      shippingMethod: true,
      productFamily: true,
      productUsage: true,
      systemMechanic: true,
      material: true,
      capacity: true,
      capacityUnit: true,
      targetPrice: true,
      requestedMoqs: formik.values.requestedMoqs.map(() => true),
      description: true
    } as const;

    formik.setTouched(touchedFields, true);
    const validationErrors = await formik.validateForm();

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setUrgentReasonDialogOpen(true);
  };

  const handleConfirm = async () => {
    setVisibleConfirmationDialog(false);

    if (actionType === 'back') {
      history.push(ROUTE_PATHS.RFQ_MANAGEMENT);
      return;
    }

    if (actionType === 'clear') {
      formik.resetForm({
        values: {
          ...formik.initialValues,
          salesId: defaultSalesId
        }
      });
      setPictureFiles([]);
      setAttachmentFiles([]);
      return;
    }

    if (actionType === 'create') {
      submitModeRef.current = 'NORMAL';
      await formik.submitForm();
    }
  };

  const handleProductFamilyChange = (event: ChangeEvent<HTMLInputElement>) => {
    formik.handleChange(event);
    formik.setFieldValue('productUsage', '');
    formik.setFieldValue('systemMechanic', '');
    formik.setFieldValue('material', '');
  };

  const handleProductUsageChange = (event: ChangeEvent<HTMLInputElement>) => {
    formik.handleChange(event);
    formik.setFieldValue('systemMechanic', '');
  };

  const handleCapacityUnitChange = (event: ChangeEvent<HTMLInputElement>) => {
    formik.handleChange(event);

    if (event.target.value !== CUSTOM_UNIT_OPTION) {
      setCustomUnitInput('');
    }
  };

  return (
    <Page>
      <LoadingDialog open={formik.isSubmitting} />
      <PageTitle title={t('rfqManagement.action.create')} />
      <Wrapper>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{
            mt: 1,
            justifyContent: { sm: 'flex-end' },
            alignItems: { xs: 'flex-end', sm: 'center' }
          }}>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-cool-grey"
            onClick={() => handleOpenConfirm('back', t('message.backTitle'), t('message.backMsg'))}
            startIcon={<ArrowBackIos />}>
            {t('button.back')}
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-amber-orange"
            onClick={() =>
              handleOpenConfirm('clear', t('message.clearDataTitle'), t('message.clearDataMsg'))
            }
            startIcon={<Cancel />}>
            {t('button.clear')}
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-emerald-green"
            disabled={formik.isSubmitting}
            onClick={() =>
              handleOpenConfirm(
                'create',
                t('rfqManagement.message.confirmCreateTitle'),
                t('rfqManagement.message.confirmCreateMsg')
              )
            }
            startIcon={<Save />}>
            {/* {t('button.create')} */}
            ขอราคา
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-pastel-yellow"
            disabled={formik.isSubmitting}
            onClick={() => {
              void handleOpenUrgentReasonDialog();
            }}
            startIcon={<Save />}>
            ขอราคาแบบเร่งด่วน 🔥
          </Button>
        </Stack>
      </Wrapper>

      <Wrapper>
        <Grid container spacing={1}>
          {/* <GridTextField item xs={12}>
            <Typography>{t('rfqManagement.createTitle')}</Typography>
          </GridTextField> */}

          <GridTextField item xs={12}>
            <Typography sx={{ mb: 1 }}>{t('rfqManagement.form.customerMode')}</Typography>
            <RadioGroup
              row
              name="customerMode"
              value={formik.values.customerMode}
              onChange={(event) => {
                const mode = event.target.value;
                formik.setFieldValue('customerMode', mode);

                if (mode === 'NEW') {
                  formik.setFieldValue('customerId', '');
                  setCustomerKeyword('');
                } else {
                  formik.setFieldValue('contactName', '');
                  formik.setFieldValue('contactPhone', '');
                }
              }}>
              <FormControlLabel
                value="NEW"
                control={<Radio />}
                label={t('rfqManagement.form.customerModeNew')}
              />
              <FormControlLabel
                value="EXISTING"
                control={<Radio />}
                label={t('rfqManagement.form.customerModeExisting')}
              />
            </RadioGroup>
          </GridTextField>

          {formik.values.customerMode === 'NEW' ? (
            <>
              <GridTextField item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('rfqManagement.form.contactName')}
                  InputLabelProps={{ shrink: true }}
                  name="contactName"
                  value={formik.values.contactName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.contactName && Boolean(formik.errors.contactName)}
                  helperText={formik.touched.contactName && formik.errors.contactName}
                />
              </GridTextField>
              <GridTextField item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('rfqManagement.form.contactPhone')}
                  InputLabelProps={{ shrink: true }}
                  name="contactPhone"
                  value={formik.values.contactPhone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.contactPhone && Boolean(formik.errors.contactPhone)}
                  helperText={formik.touched.contactPhone && formik.errors.contactPhone}
                />
              </GridTextField>
            </>
          ) : (
            <GridTextField item xs={12}>
              <Autocomplete
                options={customerOptions}
                loading={isCustomerFetching}
                filterOptions={(options) => options}
                value={
                  customerOptions.find((customer) => customer.id === formik.values.customerId) ||
                  null
                }
                getOptionLabel={(option: Customer) => '(' + option.id + ') ' + option.customerName}
                onChange={(_event, value) => {
                  const defaultContact =
                    value?.contacts?.find((contact: Contact) => contact.isDefault) ||
                    value?.contacts?.[0];

                  formik.setFieldValue('customerId', value?.id || '');
                  formik.setFieldValue('contactName', defaultContact?.contactName || '');
                  formik.setFieldValue('contactPhone', defaultContact?.contactNumber || '');
                }}
                onInputChange={(_event, value, reason) => {
                  if (reason === 'input') {
                    setCustomerKeyword(value);
                  }

                  if (reason === 'clear') {
                    setCustomerKeyword('');
                    formik.setFieldValue('customerId', '');
                    formik.setFieldValue('contactName', '');
                    formik.setFieldValue('contactPhone', '');
                  }
                }}
                noOptionsText={
                  debouncedCustomerKeyword
                    ? t('rfqManagement.form.noCustomerOptions')
                    : t('rfqManagement.form.customerSearchHelper')
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label={t('rfqManagement.form.customerId')}
                    InputLabelProps={{ shrink: true }}
                    onBlur={() => formik.setFieldTouched('customerId', true)}
                    error={formik.touched.customerId && Boolean(formik.errors.customerId)}
                    helperText={
                      (formik.touched.customerId && formik.errors.customerId) ||
                      t('rfqManagement.form.customerSearchHelper')
                    }
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

          <GridTextField item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label={t('rfqManagement.form.rfqTypeCode')}
              InputLabelProps={{ shrink: true }}
              name="rfqTypeCode"
              value={formik.values.rfqTypeCode}
              onChange={formik.handleChange}
              onBlur={() => formik.setFieldTouched('rfqTypeCode', true)}
              error={formik.touched.rfqTypeCode && Boolean(formik.errors.rfqTypeCode)}
              helperText={formik.touched.rfqTypeCode && formik.errors.rfqTypeCode}>
              {rfqTypeList.map((item: SystemConfig) => (
                <MenuItem key={item.code} value={item.code}>
                  {getSystemConfigDisplayName(item)}
                </MenuItem>
              ))}
            </TextField>
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label={t('rfqManagement.form.orderTypeCode')}
              InputLabelProps={{ shrink: true }}
              name="orderTypeCode"
              value={formik.values.orderTypeCode}
              onChange={formik.handleChange}
              onBlur={() => formik.setFieldTouched('orderTypeCode', true)}
              error={formik.touched.orderTypeCode && Boolean(formik.errors.orderTypeCode)}
              helperText={formik.touched.orderTypeCode && formik.errors.orderTypeCode}>
              {(orderTypeList || []).map((item: SystemConfig) => (
                <MenuItem key={item.code} value={item.code}>
                  {item.nameTh || item.code}
                </MenuItem>
              ))}
            </TextField>
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label={t('rfqManagement.form.salesId')}
              InputLabelProps={{ shrink: true }}
              name="salesId"
              value={formik.values.salesId}
              onChange={(event) => {
                const selectedSalesId = event.target.value;
                formik.setFieldValue('salesId', selectedSalesId);
                formik.setFieldValue('purchaseAccount', '');
              }}
              onBlur={() => formik.setFieldTouched('salesId', true)}
              disabled={isSalesRole}
              SelectProps={{ displayEmpty: true }}
              error={formik.touched.salesId && Boolean(formik.errors.salesId)}
              helperText={formik.touched.salesId && formik.errors.salesId}>
              {isSalesFetching ? (
                <MenuItem disabled value="">
                  Loading...
                </MenuItem>
              ) : null}
              {!isSalesFetching && rfqSalesOptions.length === 0 ? (
                <MenuItem disabled value="">
                  No sales data
                </MenuItem>
              ) : null}
              {groupedSalesOptions.flatMap((group) => [
                <ListSubheader key={`group-${group.groupLabel}`}>
                  {'ทีม' + group.groupLabel}
                </ListSubheader>,
                ...group.records.map((sales: SalesRecord) => (
                  <MenuItem key={sales.salesId} value={sales.salesId}>
                    {`${sales.salesId} - ${sales.nickname || sales.name}`}
                  </MenuItem>
                ))
              ])}
            </TextField>
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="จัดซื้อที่ดูแล"
              InputLabelProps={{ shrink: true }}
              name="purchaseAccount"
              value={formik.values.purchaseAccount}
              onChange={formik.handleChange}
              onBlur={() => formik.setFieldTouched('purchaseAccount', true)}
              disabled={!formik.values.salesId || isProcurementFetching}
              SelectProps={{ displayEmpty: true }}
              error={formik.touched.purchaseAccount && Boolean(formik.errors.purchaseAccount)}
              helperText={formik.touched.purchaseAccount && formik.errors.purchaseAccount}>
              {!formik.values.salesId ? (
                <MenuItem disabled value="">
                  กรุณาเลือกเซลล์ที่ดูแลก่อน
                </MenuItem>
              ) : null}
              {formik.values.salesId && isProcurementFetching ? (
                <MenuItem disabled value="">
                  Loading...
                </MenuItem>
              ) : null}
              {formik.values.salesId &&
                !isProcurementFetching &&
                procurementOptions.length === 0 ? (
                <MenuItem disabled value="">
                  ไม่มีจัดซื้อดูแล
                </MenuItem>
              ) : null}
              {procurementOptions.map((procurement) => (
                <MenuItem key={procurement.salesId} value={procurement.salesId}>
                  {`${procurement.salesId} - ${procurement.nickname || procurement.name}`}
                </MenuItem>
              ))}
            </TextField>
          </GridTextField>

          <GridTextField item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label={t('rfqManagement.form.productFamily')}
              InputLabelProps={{ shrink: true }}
              name="productFamily"
              value={formik.values.productFamily}
              onChange={handleProductFamilyChange}
              onBlur={() => formik.setFieldTouched('productFamily', true)}
              disabled={isProductFamilyFetching}
              error={formik.touched.productFamily && Boolean(formik.errors.productFamily)}
              helperText={formik.touched.productFamily && formik.errors.productFamily}>
              {isProductFamilyFetching ? (
                <MenuItem disabled value="">
                  กำลังโหลดข้อมูล
                </MenuItem>
              ) : null}
              {!isProductFamilyFetching && productFamilyList.length === 0 ? (
                <MenuItem disabled value="">
                  ไม่พบข้อมูล Product Family
                </MenuItem>
              ) : null}
              {productFamilyList.map((productFamily: ProductFamily) => (
                <MenuItem key={productFamily.code} value={productFamily.code}>
                  {getProductFamilyDisplayName(productFamily)}
                </MenuItem>
              ))}
            </TextField>
          </GridTextField>

          <GridTextField item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label={t('rfqManagement.form.material')}
              InputLabelProps={{ shrink: true }}
              name="material"
              value={formik.values.material}
              onChange={formik.handleChange}
              onBlur={() => formik.setFieldTouched('material', true)}
              disabled={!formik.values.productFamily || isProductFamilyFetching}
              error={formik.touched.material && Boolean(formik.errors.material)}
              helperText={formik.touched.material && formik.errors.material}>
              {!formik.values.productFamily ? (
                <MenuItem disabled value="">
                  กรุณาเลือก Product Family ก่อน
                </MenuItem>
              ) : null}
              {formik.values.productFamily && materialOptions.length === 0 ? (
                <MenuItem disabled value="">
                  ไม่พบข้อมูล Material
                </MenuItem>
              ) : null}
              {materialOptions.map((productMaterial: ProductMaterial) => (
                <MenuItem key={productMaterial.code} value={productMaterial.code}>
                  {getProductMaterialDisplayName(productMaterial)}
                </MenuItem>
              ))}
            </TextField>
          </GridTextField>

          <GridTextField item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label={t('rfqManagement.form.productUsage')}
              InputLabelProps={{ shrink: true }}
              name="productUsage"
              value={formik.values.productUsage}
              onChange={handleProductUsageChange}
              onBlur={() => formik.setFieldTouched('productUsage', true)}
              disabled={!formik.values.productFamily || isProductFamilyFetching}
              error={formik.touched.productUsage && Boolean(formik.errors.productUsage)}
              helperText={formik.touched.productUsage && formik.errors.productUsage}>
              {!formik.values.productFamily ? (
                <MenuItem disabled value="">
                  กรุณาเลือก Product Family ก่อน
                </MenuItem>
              ) : null}
              {formik.values.productFamily && productUsageOptions.length === 0 ? (
                <MenuItem disabled value="">
                  ไม่พบข้อมูล Product Subtype1
                </MenuItem>
              ) : null}
              {productUsageOptions.map((productSubtype1: ProductSubtype1) => (
                <MenuItem key={productSubtype1.code} value={productSubtype1.code}>
                  {getProductSubtype1DisplayName(productSubtype1)}
                </MenuItem>
              ))}
            </TextField>
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label={t('rfqManagement.form.systemMechanic')}
              InputLabelProps={{ shrink: true }}
              name="systemMechanic"
              value={formik.values.systemMechanic}
              onChange={formik.handleChange}
              onBlur={() => formik.setFieldTouched('systemMechanic', true)}
              disabled={!formik.values.productUsage || isProductFamilyFetching}
              error={formik.touched.systemMechanic && Boolean(formik.errors.systemMechanic)}
              helperText={formik.touched.systemMechanic && formik.errors.systemMechanic}>
              {!formik.values.productUsage ? (
                <MenuItem disabled value="">
                  กรุณาเลือก Product Subtype1 ก่อน
                </MenuItem>
              ) : null}
              {formik.values.productUsage ? <MenuItem value="">ไม่บังคับเลือก</MenuItem> : null}
              {formik.values.productUsage &&
                systemMechanicOptions.map((productSubtype2: ProductSubtype2) => (
                  <MenuItem key={productSubtype2.code} value={productSubtype2.code}>
                    {getProductSubtype2DisplayName(productSubtype2)}
                  </MenuItem>
                ))}
            </TextField>
          </GridTextField>

          <GridTextField item xs={12} sm={5}>
            <TextField
              fullWidth
              label={t('rfqManagement.form.capacity')}
              InputLabelProps={{ shrink: true }}
              name="capacity"
              value={formik.values.capacity}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.capacity && Boolean(formik.errors.capacity)}
              helperText={formik.touched.capacity && formik.errors.capacity}
            />
          </GridTextField>

          <GridTextField item xs={12} sm={1}>
            <TextField
              select
              fullWidth
              label="Unit"
              InputLabelProps={{ shrink: true }}
              name="capacityUnit"
              value={formik.values.capacityUnit}
              onChange={handleCapacityUnitChange}
              onBlur={() => formik.setFieldTouched('capacityUnit', true)}
              disabled={isUnitFetching || isCreatingUnit}>
              {isUnitFetching ? (
                <MenuItem disabled value="">
                  กำลังโหลดข้อมูล
                </MenuItem>
              ) : null}
              {!isUnitFetching && unitOptions.length === 0 ? (
                <MenuItem disabled value="">
                  ไม่พบข้อมูล Unit
                </MenuItem>
              ) : null}
              {unitOptions.map((unit: SystemConfig) => (
                <MenuItem key={unit.code} value={unit.code}>
                  {getSystemConfigDisplayName(unit)}
                </MenuItem>
              ))}
              <MenuItem value={CUSTOM_UNIT_OPTION}>เพิ่มตัวเลือกใหม่</MenuItem>
            </TextField>
            {formik.values.capacityUnit === CUSTOM_UNIT_OPTION ? (
              <TextField
                fullWidth
                label="New Unit"
                value={customUnitInput}
                onChange={(event) => setCustomUnitInput(event.target.value)}
                onBlur={() => {
                  void createCustomUnit();
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void createCustomUnit();
                  }
                }}
                disabled={isCreatingUnit}
                sx={{ mt: 1 }}
              />
            ) : null}
          </GridTextField>

          <GridTextField item xs={6} sm={3}>
            <TextField
              fullWidth
              type="number"
              label={t('rfqManagement.form.targetPrice')}
              InputLabelProps={{ shrink: true }}
              name="targetPrice"
              value={formik.values.targetPrice}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.targetPrice && Boolean(formik.errors.targetPrice)}
              helperText={formik.touched.targetPrice && formik.errors.targetPrice}
              inputProps={{ min: 0, step: '0.0001' }}
            />
          </GridTextField>

          <GridTextField item xs={6} sm={3} style={{ paddingLeft: '25px' }}>
            <Box>
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', fontWeight: 500, px: 0.25 }}>
                การขนส่ง
              </Typography>
              <RadioGroup
                row
                name="shippingMethod"
                value={formik.values.shippingMethod}
                onChange={formik.handleChange}>
                <FormControlLabel value="ALL" control={<Radio size="small" />} label="ทั้งหมด" />
                <FormControlLabel value="LAND" control={<Radio size="small" />} label="ทางรถ" />
                <FormControlLabel value="SEA" control={<Radio size="small" />} label="ทางเรือ" />
              </RadioGroup>
            </Box>
          </GridTextField>

          <GridTextField item xs={3} sm={3}>
            <Stack spacing={1.25}>
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', fontWeight: 500, px: 0.25 }}>
                {t('rfqManagement.form.requestedMoqs')}
              </Typography>
              {(() => {
                const requestedMoqGroupError =
                  typeof formik.errors.requestedMoqs === 'string' ? formik.errors.requestedMoqs : undefined;
                const shouldShowGroupError =
                  Boolean(requestedMoqGroupError) &&
                  (formik.submitCount > 0 || Boolean(formik.touched.requestedMoqs));

                return (
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: shouldShowGroupError ? 'error.main' : 'divider',
                      borderRadius: 1.5,
                      px: 1.5,
                      py: 1.5,
                      backgroundColor: 'background.paper'
                    }}>
                    <Stack spacing={1.25}>
                      {formik.values.requestedMoqs.map((requestedMoq, index) => {
                        const requestedMoqErrors = formik.errors.requestedMoqs;
                        const requestedMoqTouched = formik.touched.requestedMoqs;
                        const helperText =
                          Array.isArray(requestedMoqTouched) &&
                            requestedMoqTouched[index] &&
                            Array.isArray(requestedMoqErrors) &&
                            typeof requestedMoqErrors[index] === 'string'
                            ? requestedMoqErrors[index]
                            : undefined;
                        const fieldError =
                          Boolean(helperText) ||
                          (shouldShowGroupError && !requestedMoq?.trim());

                        return (
                          <Stack
                            key={`requested-moq-${index}`}
                            direction="row"
                            spacing={1}
                            alignItems="flex-start">
                            <TextField
                              fullWidth
                              type="number"
                              label={`${t('rfqManagement.form.requestedMoq')} ${index + 1}`}
                              InputLabelProps={{ shrink: true }}
                              value={requestedMoq}
                              onChange={(event) => {
                                const nextValues = [...formik.values.requestedMoqs];
                                nextValues[index] = event.target.value;
                                formik.setFieldValue('requestedMoqs', nextValues);
                              }}
                              onBlur={() => formik.setFieldTouched(`requestedMoqs.${index}`, true)}
                              error={fieldError}
                              helperText={helperText}
                              inputProps={{ min: 0, step: '1' }}
                              sx={{
                                '& .MuiInputBase-root': {
                                  backgroundColor: 'common.white'
                                }
                              }}
                            />
                            <Stack direction="row" spacing={0.5} sx={{ pt: 0.5, flexShrink: 0 }}>
                              <IconButton
                                color="primary"
                                sx={{
                                  border: '1px solid',
                                  borderColor: 'primary.main',
                                  borderRadius: 1.5
                                }}
                                onClick={() =>
                                  formik.setFieldValue('requestedMoqs', [...formik.values.requestedMoqs, ''])
                                }>
                                <AddCircleOutline />
                              </IconButton>
                              <IconButton
                                color="error"
                                disabled={formik.values.requestedMoqs.length === 1}
                                sx={{
                                  border: '1px solid',
                                  borderColor:
                                    formik.values.requestedMoqs.length === 1 ? 'divider' : 'error.main',
                                  borderRadius: 1.5
                                }}
                                onClick={() => {
                                  const nextValues = formik.values.requestedMoqs.filter(
                                    (_, itemIndex) => itemIndex !== index
                                  );
                                  formik.setFieldValue('requestedMoqs', nextValues.length ? nextValues : ['']);
                                }}>
                                <RemoveCircleOutline />
                              </IconButton>
                            </Stack>
                          </Stack>
                        );
                      })}
                    </Stack>
                    {shouldShowGroupError ? (
                      <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                        {requestedMoqGroupError}
                      </Typography>
                    ) : null}
                  </Box>
                );
              })()}
            </Stack>
          </GridTextField>

          <GridTextField item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={4}
              label={t('rfqManagement.form.description')}
              InputLabelProps={{ shrink: true }}
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.description && Boolean(formik.errors.description)}
              helperText={formik.touched.description && formik.errors.description}
            />
          </GridTextField>

          <GridTextField item xs={12}>
            <Typography>{t('rfqManagement.form.pictures')}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('rfqManagement.form.pictureHelper')}
            </Typography>
            <ImageFileUploaderWrapper
              id="rfq-picture-uploader"
              inputId="rfq-pictures"
              isDisabled={pictureFiles.length >= 5}
              readOnly={false}
              maxFiles={5}
              isMultiple
              isError={false}
              files={pictureUrls}
              onError={() => undefined}
              onDeleted={(index) => {
                setPictureFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
              }}
              onSuccess={(files) => {
                setPictureFiles((prev) => [...prev, ...files].slice(0, 5));
              }}
              fileUploader={FileUploader}
            />
          </GridTextField>

          <GridTextField item xs={12}>
            <Typography>{t('rfqManagement.form.attachments')}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('rfqManagement.form.attachmentHelper')}
            </Typography>
            <Box
              sx={{
                border: '1px dashed #c8d7ea',
                borderRadius: 2.5,
                backgroundColor: '#f8fbff',
                px: { xs: 2, sm: 2.5 },
                py: 2
              }}>
              {attachmentFiles.length > 0 ? (
                <Stack spacing={1.5}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    alignItems={{ sm: 'center' }}
                    justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {`${attachmentFiles.length} ${t('rfqManagement.form.attachments')}`}
                    </Typography>
                    <Button
                      variant="contained"
                      component="label"
                      className="btn-baby-blue"
                      startIcon={<UploadFile />}>
                      {t('inputUpload.submitButton')}
                      <input
                        hidden
                        type="file"
                        multiple
                        onChange={(event) => {
                          const files = Array.from(event.target.files || []);

                          if (files.length > 0) {
                            setAttachmentFiles((prev) => [...prev, ...files]);
                          }

                          event.target.value = '';
                        }}
                      />
                    </Button>
                  </Stack>

                  <Stack spacing={1}>
                    {attachmentFiles.map((file, index) => (
                      <Stack
                        key={`${file.name}-${file.size}-${index}`}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{
                          px: 1.5,
                          py: 1.25,
                          border: '1px solid #dce4ee',
                          borderRadius: 2,
                          backgroundColor: '#fff',
                          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)'
                        }}>
                        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                          <Typography fontWeight={600} noWrap>
                            {file.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                        </Stack>
                        <Button
                          color="error"
                          onClick={() => {
                            setAttachmentFiles((prev) =>
                              prev.filter((_, fileIndex) => fileIndex !== index)
                            );
                          }}
                          startIcon={<DeleteOutline />}>
                          {t('button.delete')}
                        </Button>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              ) : (
                <Stack
                  spacing={1.25}
                  alignItems="center"
                  justifyContent="center"
                  sx={{
                    minHeight: 160,
                    textAlign: 'center'
                  }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('rfqManagement.form.noAttachments')}
                  </Typography>
                  <Button
                    variant="contained"
                    component="label"
                    className="btn-baby-blue"
                    startIcon={<UploadFile />}>
                    {t('inputUpload.submitButton')}
                    <input
                      hidden
                      type="file"
                      multiple
                      onChange={(event) => {
                        const files = Array.from(event.target.files || []);

                        if (files.length > 0) {
                          setAttachmentFiles((prev) => [...prev, ...files]);
                        }

                        event.target.value = '';
                      }}
                    />
                  </Button>
                </Stack>
              )}
            </Box>
          </GridTextField>
        </Grid>
      </Wrapper>

      <ConfirmDialog
        open={visibleConfirmationDialog}
        title={dialogTitle}
        message={dialogMessage}
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        isShowCancelButton
        isShowConfirmButton
        onConfirm={handleConfirm}
        onCancel={() => setVisibleConfirmationDialog(false)}
      />

      <Dialog
        open={urgentReasonDialogOpen}
        onClose={() => {
          setUrgentReasonDialogOpen(false);
          setUrgentReason('');
        }}
        fullWidth
        maxWidth="sm">
        <DialogTitle>เหตุผลในการขอราคาแบบเร่งด่วน</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={4}
            margin="dense"
            label="เหตุผล"
            value={urgentReason}
            onChange={(event) => setUrgentReason(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setUrgentReasonDialogOpen(false);
              setUrgentReason('');
            }}>
            {t('button.cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={!urgentReason.trim()}
            onClick={async () => {
              submitModeRef.current = 'URGENT';
              await formik.submitForm();
            }}>
            {t('button.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  );
}
