/* eslint-disable prettier/prettier */
import { DeleteOutline, PersonAdd, Save } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Typography
} from '@mui/material';
import { FieldArray, FormikProvider, useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';
import * as Yup from 'yup';
import { GridTextField } from 'components/Styled';
import LoadingDialog from 'components/LoadingDialog';
import { getDistrict, getProvince, getSubDistrict } from 'services/Address/address-api';
import { GROUP_CODE } from 'services/Config/config-type';
import { getSystemConfig } from 'services/Config/config-api';
import { createNewCustomer } from 'services/Customer/customer-api';
import { CreateCustomerRequest, CreateCustomerResponse } from 'services/Customer/customer-type';
import { RFQRecord } from 'services/RFQ/rfq-type';
import { getSales } from 'services/Sales/sales-api';

interface CreateRFQCustomerDialogProps {
  open: boolean;
  rfq?: RFQRecord | null;
  onClose: () => void;
  onCreated?: (customerId: string) => void;
}

const digitsOnly = (value?: string | null): string => (value || '').replace(/\D/g, '');

export default function CreateRFQCustomerDialog({
  open,
  rfq,
  onClose,
  onCreated
}: CreateRFQCustomerDialogProps): JSX.Element {
  const { t } = useTranslation();

  const { data: customerTypeList, isFetching: isCustomerTypeFetching } = useQuery(
    'rfq-customer-type',
    () => getSystemConfig(GROUP_CODE.CUSTOMER_TYPE),
    { enabled: open, refetchOnWindowFocus: false }
  );
  const { data: customerSegmentList, isFetching: isCustomerSegmentFetching } = useQuery(
    'rfq-customer-segment',
    () => getSystemConfig(GROUP_CODE.CUSTOMER_SEGMENT),
    { enabled: open, refetchOnWindowFocus: false }
  );
  const { data: customerTierList } = useQuery(
    'rfq-customer-Tier',
    () => getSystemConfig(GROUP_CODE.CUSTOMER_TIER),
    { enabled: open, refetchOnWindowFocus: false }
  );
  const { data: creditTermList, isFetching: isCreditTermFetching } = useQuery(
    'rfq-customer-credit-term',
    () => getSystemConfig(GROUP_CODE.CUSTOMER_CREDIT_TERM),
    { enabled: open, refetchOnWindowFocus: false }
  );
  const { data: salesOptions = [], isFetching: isSalesFetching } = useQuery(
    'rfq-customer-sales-options',
    () => getSales(1, 20),
    { enabled: open, refetchOnWindowFocus: false }
  );
  const { data: provinces = [] } = useQuery('rfq-customer-province', () => getProvince(), {
    enabled: open,
    refetchOnWindowFocus: false
  });
  const { data: districts = [] } = useQuery('rfq-customer-district', () => getDistrict(), {
    enabled: open,
    refetchOnWindowFocus: false
  });
  const { data: subdistricts = [] } = useQuery('rfq-customer-subdistrict', () => getSubDistrict(), {
    enabled: open,
    refetchOnWindowFocus: false
  });

  const formik = useFormik({
    initialValues: {
      customerName: rfq?.contactName || '',
      email: '',
      type: 'INDIVIDUAL',
      taxId: '',
      companyName: rfq?.contactName || '',
      companyBranchCode: '',
      companyBranchName: '',
      creditTerm: 'NON',
      tier: 'TIER_4',
      segment: '',
      salesAccount: rfq?.sales?.salesId || rfq?.sales?.employeeId || '',
      coSalesAccount: '',
      address: {
        addressType: 'BILLING',
        isDefault: true,
        label: '',
        addressLine1: '',
        addressLine2: '',
        subdistrict: '',
        district: '',
        province: '',
        postcode: '',
        country: 'TH'
      },
      contacts: [
        {
          contactName: rfq?.contactName || '',
          contactNumber: digitsOnly(rfq?.contactPhone)
        }
      ]
    },
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      customerName: Yup.string().max(255).required(t('customerManagement.message.validateCustomerName')),
      type: Yup.string().max(255).required(t('customerManagement.message.validateType')),
      taxId: Yup.string().required(t('customerManagement.message.validateTaxId')),
      companyName: Yup.string().when('type', {
        is: 'COMPANY',
        then: Yup.string().required(t('customerManagement.message.validateCompanyName')),
        otherwise: Yup.string().nullable()
      }),
      companyBranchCode: Yup.string().when('type', {
        is: 'COMPANY',
        then: Yup.string().required(t('customerManagement.message.validateCompanyBranchCode')),
        otherwise: Yup.string().nullable()
      }),
      companyBranchName: Yup.string().when('type', {
        is: 'COMPANY',
        then: Yup.string().required(t('customerManagement.message.validateCompanyBranchName')),
        otherwise: Yup.string().nullable()
      }),
      creditTerm: Yup.string().max(255).required(t('customerManagement.message.validateCreditTerm')),
      salesAccount: Yup.string().required(t('customerManagement.message.validateSalesAccount')),
      address: Yup.object().shape({
        addressLine1: Yup.string().required(t('customerManagement.message.validateAddress')),
        subdistrict: Yup.string().required(t('customerManagement.message.validateSubdistrict')),
        district: Yup.string().required(t('customerManagement.message.validateDistrict')),
        province: Yup.string().required(t('customerManagement.message.validateProvince'))
      }),
      contacts: Yup.array()
        .of(
          Yup.object().shape({
            contactName: Yup.string().required(t('customerManagement.message.validateContactName')),
            contactNumber: Yup.string()
              .matches(/^[0-9]{9,10}$/, t('customerManagement.message.invalidPhoneNumberFormat'))
              .required(t('customerManagement.message.validateContactNumber'))
          })
        )
        .min(1, t('customerManagement.message.validateAtLeastOneContact'))
    }),
    onSubmit: async (values, actions) => {
      actions.setSubmitting(true);

      const payload: CreateCustomerRequest = {
        customerName: values.customerName,
        customerType: values.type,
        email: values.email,
        taxId: values.taxId,
        companyName: values.companyName,
        branchNumber: values.companyBranchCode,
        branchName: values.companyBranchName,
        creditTerm: values.creditTerm,
        salesAccount: values.salesAccount,
        coSalesAccount: values.coSalesAccount,
        address: {
          addressType: values.address.addressType,
          isDefault: values.address.isDefault,
          label: values.address.label,
          addressLine1: values.address.addressLine1,
          addressLine2: values.address.addressLine2,
          subdistrict: subdistricts.find((item) => item.id === values.address.subdistrict)?.nameTh,
          district: districts.find((item) => item.id === values.address.district)?.nameTh,
          province: provinces.find((item) => item.id === values.address.province)?.nameTh,
          postcode: values.address.postcode,
          country: values.address.country
        },
        contacts: values.contacts,
        customerSegment: values.segment,
        customerTier: values.tier
      };

      try {
        await toast.promise(createNewCustomer(payload), {
          loading: t('toast.loading'),
          success: (response: CreateCustomerResponse) => {
            onCreated?.(response.data.id);
            return t('customerManagement.message.createNewCustomerSuccess');
          },
          error: (err) => t('customerManagement.message.createNewCustomerFailed', { err })
        });
      } finally {
        actions.setSubmitting(false);
      }
    }
  });

  const addressErrors = formik.errors.address as any;
  const contactErrors = formik.errors.contacts as any;

  return (
    <Dialog open={open} fullWidth maxWidth="md" disableEnforceFocus>
      <LoadingDialog open={formik.isSubmitting} />
      <DialogTitle>สร้างข้อมูลลูกค้า</DialogTitle>
      <FormikProvider value={formik}>
        <DialogContent dividers>
          <Grid container spacing={1}>
            <GridTextField item xs={12}>
              <Typography>{t('customerManagement.detail')}</Typography>
            </GridTextField>
            <GridTextField item xs={12}>
              <TextField
                fullWidth
                required
                label={t('customerManagement.column.name')}
                value={formik.values.customerName}
                onChange={({ target }) => {
                  formik.setFieldValue('customerName', target.value);
                  formik.setFieldValue('companyName', target.value);
                }}
                error={Boolean(formik.touched.customerName && formik.errors.customerName)}
                helperText={formik.touched.customerName && formik.errors.customerName}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label={t('customerManagement.column.type')}
                disabled={isCustomerTypeFetching}
                value={formik.values.type || ''}
                onChange={(event) => formik.setFieldValue('type', event.target.value)}
                error={Boolean(formik.touched.type && formik.errors.type)}
                helperText={formik.touched.type && formik.errors.type}
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {customerTypeList?.map((option) => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.nameTh}
                  </MenuItem>
                ))}
              </TextField>
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label={t('customerManagement.column.taxId')}
                value={formik.values.taxId}
                onChange={({ target }) => formik.setFieldValue('taxId', target.value)}
                error={Boolean(formik.touched.taxId && formik.errors.taxId)}
                helperText={formik.touched.taxId && formik.errors.taxId}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>
            {formik.values.type === 'COMPANY' ? (
              <>
                <GridTextField item xs={12}>
                  <Typography>{t('customerManagement.column.company.title')}</Typography>
                </GridTextField>
                <GridTextField item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t('customerManagement.column.company.name')}
                    value={formik.values.companyName}
                    onChange={({ target }) => formik.setFieldValue('companyName', target.value)}
                    error={Boolean(formik.touched.companyName && formik.errors.companyName)}
                    helperText={formik.touched.companyName && formik.errors.companyName}
                    InputLabelProps={{ shrink: true }}
                  />
                </GridTextField>
                <GridTextField item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t('customerManagement.column.company.branchCode')}
                    value={formik.values.companyBranchCode}
                    onChange={({ target }) => formik.setFieldValue('companyBranchCode', target.value)}
                    error={Boolean(formik.touched.companyBranchCode && formik.errors.companyBranchCode)}
                    helperText={formik.touched.companyBranchCode && formik.errors.companyBranchCode}
                    InputLabelProps={{ shrink: true }}
                  />
                </GridTextField>
                <GridTextField item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t('customerManagement.column.company.branchName')}
                    value={formik.values.companyBranchName}
                    onChange={({ target }) => formik.setFieldValue('companyBranchName', target.value)}
                    error={Boolean(formik.touched.companyBranchName && formik.errors.companyBranchName)}
                    helperText={formik.touched.companyBranchName && formik.errors.companyBranchName}
                    InputLabelProps={{ shrink: true }}
                  />
                </GridTextField>
              </>
            ) : null}
            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('customerManagement.column.email')}
                value={formik.values.email}
                onChange={({ target }) => formik.setFieldValue('email', target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label={t('customerManagement.column.creditTerm')}
                disabled={isCreditTermFetching}
                value={formik.values.creditTerm || ''}
                onChange={(event) => formik.setFieldValue('creditTerm', event.target.value)}
                error={Boolean(formik.touched.creditTerm && formik.errors.creditTerm)}
                helperText={formik.touched.creditTerm && formik.errors.creditTerm}
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {creditTermList?.map((option) => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.nameTh}
                  </MenuItem>
                ))}
              </TextField>
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label={t('customerManagement.column.segment')}
                disabled={isCustomerSegmentFetching}
                value={formik.values.segment || ''}
                onChange={(event) => formik.setFieldValue('segment', event.target.value)}
                error={Boolean(formik.touched.segment && formik.errors.segment)}
                helperText={formik.touched.segment && formik.errors.segment}
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {customerSegmentList?.map((option) => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.nameTh}
                  </MenuItem>
                ))}
              </TextField>
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label={t('customerManagement.column.tier')}
                disabled
                value={formik.values.tier || ''}
                onChange={(event) => formik.setFieldValue('tier', event.target.value)}
                error={Boolean(formik.touched.tier && formik.errors.tier)}
                helperText={formik.touched.tier && formik.errors.tier}
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {customerTierList?.map((option) => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.nameEn}
                  </MenuItem>
                ))}
              </TextField>
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                required
                label={t('customerManagement.column.salesAccount')}
                disabled={isSalesFetching}
                value={formik.values.salesAccount || ''}
                onChange={(event) => formik.setFieldValue('salesAccount', event.target.value)}
                error={Boolean(formik.touched.salesAccount && formik.errors.salesAccount)}
                helperText={formik.touched.salesAccount && formik.errors.salesAccount}
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {salesOptions.map((option) => (
                  <MenuItem key={option.salesId} value={option.salesId}>
                    {`${option.salesId} - ${option.nickname || option.name}`}
                  </MenuItem>
                ))}
              </TextField>
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('customerManagement.column.coSalesAccount')}
                value={formik.values.coSalesAccount}
                onChange={({ target }) => formik.setFieldValue('coSalesAccount', target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>

            <GridTextField item xs={12}>
              <Typography>{t('customerManagement.column.address.invoice')}</Typography>
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                disabled
                label={t('customerManagement.column.address.type')}
                value={formik.values.address.addressType}
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="BILLING">{t('customerManagement.column.addressType.billing')}</MenuItem>
              </TextField>
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('customerManagement.column.address.label')}
                value={formik.values.address.label}
                onChange={({ target }) => formik.setFieldValue('address.label', target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>
            <GridTextField item xs={12}>
              <TextField
                fullWidth
                required
                label={t('customerManagement.column.address.addressLine1')}
                value={formik.values.address.addressLine1}
                onChange={({ target }) => formik.setFieldValue('address.addressLine1', target.value)}
                error={Boolean(formik.touched.address?.addressLine1 && addressErrors?.addressLine1)}
                helperText={formik.touched.address?.addressLine1 && addressErrors?.addressLine1}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>
            <GridTextField item xs={12}>
              <TextField
                fullWidth
                label={t('customerManagement.column.address.addressLine2')}
                value={formik.values.address.addressLine2}
                onChange={({ target }) => formik.setFieldValue('address.addressLine2', target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label={t('customerManagement.column.address.province')}
                value={formik.values.address.province}
                onChange={(event) => {
                  formik.setFieldValue('address.province', event.target.value);
                  formik.setFieldValue('address.district', '');
                  formik.setFieldValue('address.subdistrict', '');
                  formik.setFieldValue('address.postcode', '');
                }}
                error={Boolean(formik.touched.address?.province && addressErrors?.province)}
                helperText={formik.touched.address?.province && addressErrors?.province}
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {provinces.map((province) => (
                  <MenuItem key={province.id} value={province.id}>
                    {province.nameTh}
                  </MenuItem>
                ))}
              </TextField>
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label={t('customerManagement.column.address.amphure')}
                value={formik.values.address.district}
                onChange={(event) => {
                  formik.setFieldValue('address.district', event.target.value);
                  formik.setFieldValue('address.subdistrict', '');
                  formik.setFieldValue('address.postcode', '');
                }}
                error={Boolean(formik.touched.address?.district && addressErrors?.district)}
                helperText={formik.touched.address?.district && addressErrors?.district}
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {districts
                  .filter((district) => district.provinceId === formik.values.address.province)
                  .map((district) => (
                    <MenuItem key={district.id} value={district.id}>
                      {district.nameTh}
                    </MenuItem>
                  ))}
              </TextField>
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label={t('customerManagement.column.address.tumbon')}
                value={formik.values.address.subdistrict}
                onChange={(event) => {
                  const selected = subdistricts.find((subdistrict) => subdistrict.id === event.target.value);
                  formik.setFieldValue('address.subdistrict', selected?.id || '');
                  formik.setFieldValue('address.postcode', selected?.zipCode || '');
                }}
                error={Boolean(formik.touched.address?.subdistrict && addressErrors?.subdistrict)}
                helperText={formik.touched.address?.subdistrict && addressErrors?.subdistrict}
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {subdistricts
                  .filter((subdistrict) => subdistrict.districtId === formik.values.address.district)
                  .map((subdistrict) => (
                    <MenuItem key={subdistrict.id} value={subdistrict.id}>
                      {subdistrict.nameTh}
                    </MenuItem>
                  ))}
              </TextField>
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                disabled
                label={t('customerManagement.column.address.postalCode')}
                value={formik.values.address.postcode}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('customerManagement.column.address.country')}
                value={formik.values.address.country}
                onChange={({ target }) => formik.setFieldValue('address.country', target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>

            <GridTextField item xs={12} sm={6} />

            <FieldArray name="contacts">
              {({ push, remove }) => (
                <>
                  <GridTextField item xs={6}>
                    <Typography>{t('customerManagement.column.contacts')}</Typography>
                  </GridTextField>
                  <GridTextField item xs={6} textAlign="right">
                    <Button
                      startIcon={<PersonAdd />}
                      variant="contained"
                      onClick={() => push({ contactName: '', contactNumber: '' })}>
                      {t('customerManagement.addContact')}
                    </Button>
                  </GridTextField>
                  {typeof formik.errors.contacts === 'string' ? (
                    <GridTextField item xs={12}>
                      <Typography color="error" variant="caption">
                        {formik.errors.contacts}
                      </Typography>
                    </GridTextField>
                  ) : null}
                  {formik.values.contacts.map((contact, index) => (
                    <Grid container spacing={1} key={index}>
                      <GridTextField item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          required
                          label={t('customerManagement.column.contactName')}
                          value={contact.contactName}
                          onChange={({ target }) => formik.setFieldValue(`contacts.${index}.contactName`, target.value)}
                          error={Boolean(formik.touched.contacts?.[index]?.contactName && contactErrors?.[index]?.contactName)}
                          helperText={formik.touched.contacts?.[index]?.contactName && contactErrors?.[index]?.contactName}
                          InputLabelProps={{ shrink: true }}
                        />
                      </GridTextField>
                      <GridTextField item xs={12} sm={5}>
                        <TextField
                          fullWidth
                          required
                          label={t('customerManagement.column.contactNumber')}
                          value={contact.contactNumber}
                          onChange={({ target }) => formik.setFieldValue(`contacts.${index}.contactNumber`, digitsOnly(target.value))}
                          error={Boolean(formik.touched.contacts?.[index]?.contactNumber && contactErrors?.[index]?.contactNumber)}
                          helperText={formik.touched.contacts?.[index]?.contactNumber && contactErrors?.[index]?.contactNumber}
                          InputLabelProps={{ shrink: true }}
                        />
                      </GridTextField>
                      <GridTextField item xs={12} sm={1}>
                        <IconButton
                          color="error"
                          disabled={formik.values.contacts.length === 1}
                          onClick={() => remove(index)}>
                          <DeleteOutline />
                        </IconButton>
                      </GridTextField>
                    </Grid>
                  ))}
                </>
              )}
            </FieldArray>
          </Grid>
        </DialogContent>
        <DialogActions>

          <Button variant="contained" className="btn-cool-grey" onClick={onClose}>
            ปิด
          </Button>

          <Button
            variant="contained"
            className="btn-emerald-green"
            startIcon={<Save />}
            onClick={() => formik.handleSubmit()}>
            {t('button.create')}
          </Button>
        </DialogActions>
      </FormikProvider>
    </Dialog>
  );
}
