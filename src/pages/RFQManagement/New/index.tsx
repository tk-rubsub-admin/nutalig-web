import { ArrowBackIos, Cancel, Save } from '@mui/icons-material';
import {
  Autocomplete,
  Button,
  CircularProgress,
  FormControlLabel,
  Grid,
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
import PageTitle from 'components/PageTitle';
import { GridTextField, Wrapper } from 'components/Styled';
import { useAuth } from 'auth/AuthContext';
import { useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { getSystemConfig } from 'services/Config/config-api';
import { SystemConfig } from 'services/Config/config-type';
import { searchCustomerByKeyword } from 'services/Customer/customer-api';
import { Contact, Customer } from 'services/Customer/customer-type';
import { getProductFamilies } from 'services/Product/product-api';
import { ProductFamily } from 'services/Product/product-type';
import { createRFQ } from 'services/RFQ/rfq-api';
import { getProcurementEmployees, getSales } from 'services/Sales/sales-api';
import { SalesRecord } from 'services/Sales/sales-type';
import * as Yup from 'yup';

export default function NewRFQ(): JSX.Element {
  const theme = useTheme();
  const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
  const history = useHistory();
  const { getRole, getSalesId } = useAuth();
  const { t } = useTranslation();
  const [actionType, setActionType] = useState('');
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
  const [pictureFiles, setPictureFiles] = useState<File[]>([]);
  const [customerKeyword, setCustomerKeyword] = useState('');
  const [debouncedCustomerKeyword, setDebouncedCustomerKeyword] = useState('');

  const pictureUrls = pictureFiles.map((file) => URL.createObjectURL(file));
  const isSalesRole = getRole() === 'SALES';
  const defaultSalesId = isSalesRole ? getSalesId() : '';

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

  const { data: customerOptions = [], isFetching: isCustomerFetching } = useQuery(
    ['rfq-customer-options', debouncedCustomerKeyword],
    () => searchCustomerByKeyword(debouncedCustomerKeyword, 1, 100),
    {
      refetchOnWindowFocus: false,
      enabled: debouncedCustomerKeyword.length > 0
    }
  );

  const { data: productFamilyList = [] } = useQuery(
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

  const groupedSalesOptions = salesOptions.reduce(
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

  const formik = useFormik({
    initialValues: {
      customerMode: 'NEW',
      customerId: '',
      contactName: '',
      contactPhone: '',
      salesId: defaultSalesId,
      purchaseAccount: '',
      orderTypeCode: '',
      productFamily: '',
      productUsage: '',
      systemMechanic: '',
      material: '',
      capacity: '',
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
      orderTypeCode: Yup.string().required(t('rfqManagement.validation.orderTypeCode')),
      productFamily: Yup.string().max(255).required(t('rfqManagement.validation.productFamily')),
      productUsage: Yup.string().max(255).required(t('rfqManagement.validation.productUsage')),
      systemMechanic: Yup.string().max(255).required(t('rfqManagement.validation.systemMechanic')),
      material: Yup.string().max(255).required(t('rfqManagement.validation.material')),
      capacity: Yup.string().max(255).required(t('rfqManagement.validation.capacity')),
      description: Yup.string().max(1000).required(t('rfqManagement.validation.description'))
    }),
    onSubmit: async (values, actions) => {
      actions.setSubmitting(true);

      try {
        const response = await createRFQ({
          customerId: values.customerMode === 'EXISTING' ? values.customerId : undefined,
          contactName: values.contactName,
          contactPhone: values.contactPhone,
          salesId: values.salesId,
          procurementId: values.purchaseAccount || undefined,
          orderTypeCode: values.orderTypeCode,
          productFamily: values.productFamily,
          productUsage: values.productUsage,
          systemMechanic: values.systemMechanic,
          material: values.material,
          capacity: values.capacity,
          description: values.description,
          pictures: pictureFiles
        });

        toast.success(t('rfqManagement.message.createSuccess'));

        const rfqId = response?.data?.id;
        if (rfqId) {
          history.push(ROUTE_PATHS.RFQ_DETAIL.replace(':id', rfqId));
        } else {
          history.push(ROUTE_PATHS.RFQ_MANAGEMENT);
        }
      } catch (error: any) {
        toast.error(`${t('rfqManagement.message.createFailed')}${error?.message || ''}`);
      } finally {
        actions.setSubmitting(false);
      }
    }
  });
  const { data: procurementOptions = [], isFetching: isProcurementFetching } = useQuery(
    ['rfq-procurement-options', formik.values.salesId],
    () => getProcurementEmployees(formik.values.salesId),
    {
      refetchOnWindowFocus: false,
      enabled: Boolean(formik.values.salesId)
    }
  );

  useEffect(() => {
    if (!formik.values.salesId || formik.values.purchaseAccount || procurementOptions.length === 0) {
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
      return;
    }

    if (actionType === 'create') {
      await formik.submitForm();
    }
  };

  return (
    <Page>
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
            onClick={() =>
              handleOpenConfirm('back', t('message.backTitle'), t('message.backMsg'))
            }
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
            {t('button.create')}
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
                value={customerOptions.find((customer) => customer.id === formik.values.customerId) || null}
                getOptionLabel={(option: Customer) => '(' + option.id + ') ' + option.customerName}
                onChange={(_event, value) => {
                  const defaultContact =
                    value?.contacts?.find((contact: Contact) => contact.isDefault) || value?.contacts?.[0];

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
                          {isCustomerFetching ? <CircularProgress color="inherit" size={20} /> : null}
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
              label={t('rfqManagement.form.salesId')}
              InputLabelProps={{ shrink: true }}
              name="salesId"
              value={formik.values.salesId}
              onChange={(event) => {
                const selectedSalesId = event.target.value;
                formik.setFieldValue('salesId', selectedSalesId);
                formik.setFieldValue('purchaseAccount', '');
              }}
              onBlur={formik.handleBlur}
              disabled={isSalesRole}
              SelectProps={{ displayEmpty: true }}
              error={formik.touched.salesId && Boolean(formik.errors.salesId)}
              helperText={formik.touched.salesId && formik.errors.salesId}>
              {isSalesFetching ? (
                <MenuItem disabled value="">
                  Loading...
                </MenuItem>
              ) : null}
              {!isSalesFetching && salesOptions.length === 0 ? (
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
              onBlur={formik.handleBlur}
              disabled={!formik.values.salesId || isProcurementFetching}
              SelectProps={{ displayEmpty: true }}
              error={
                formik.touched.purchaseAccount && Boolean(formik.errors.purchaseAccount)
              }
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
              label={t('rfqManagement.form.orderTypeCode')}
              InputLabelProps={{ shrink: true }}
              name="orderTypeCode"
              value={formik.values.orderTypeCode}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
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
              label={t('rfqManagement.form.productFamily')}
              InputLabelProps={{ shrink: true }}
              name="productFamily"
              value={formik.values.productFamily}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.productFamily && Boolean(formik.errors.productFamily)}
              helperText={formik.touched.productFamily && formik.errors.productFamily}>
              {productFamilyList.map((productFamily: ProductFamily) => (
                <MenuItem key={productFamily.code} value={productFamily.code}>
                  {productFamily.nameTh || productFamily.nameEn || productFamily.code}
                </MenuItem>
              ))}
            </TextField>
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
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

          <GridTextField item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('rfqManagement.form.productUsage')}
              InputLabelProps={{ shrink: true }}
              name="productUsage"
              value={formik.values.productUsage}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.productUsage && Boolean(formik.errors.productUsage)}
              helperText={formik.touched.productUsage && formik.errors.productUsage}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('rfqManagement.form.systemMechanic')}
              InputLabelProps={{ shrink: true }}
              name="systemMechanic"
              value={formik.values.systemMechanic}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.systemMechanic && Boolean(formik.errors.systemMechanic)}
              helperText={formik.touched.systemMechanic && formik.errors.systemMechanic}
            />
          </GridTextField>

          <GridTextField item xs={12}>
            <TextField
              fullWidth
              label={t('rfqManagement.form.material')}
              InputLabelProps={{ shrink: true }}
              name="material"
              value={formik.values.material}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.material && Boolean(formik.errors.material)}
              helperText={formik.touched.material && formik.errors.material}
            />
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
    </Page>
  );
}
