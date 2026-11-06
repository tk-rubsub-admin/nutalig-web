/* eslint-disable prettier/prettier */
import { BRAND_COLORS } from 'theme/brandTokens';
import { Save, Cancel, ArrowBackIos, Add, Delete, PersonAdd, DeleteOutline } from '@mui/icons-material';
import {
  Grid,
  Typography,
  Button,
  Checkbox,
  TextField,
  Switch,
  FormControlLabel,
  MenuItem,
  useTheme,
  useMediaQuery,
  Stack,
  IconButton
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import ConfirmDialog from 'components/ConfirmDialog';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import { Wrapper, GridTextField } from 'components/Styled';
import * as Yup from 'yup';
import { FieldArray, FormikProvider, useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { GROUP_CODE } from 'services/Config/config-type';
import { useQuery } from 'react-query';
import { getCountry, getProvince, getDistrict, getSubDistrict } from 'services/Address/address-api';
import { Country } from 'services/Address/address-type';
import { getSystemConfig } from 'services/Config/config-api';
import {
  CreateCustomerRequest,
  CreateCustomerResponse,
  CreateCustomerBillingProfileRequest
} from 'services/Customer/customer-type';
import { createNewCustomer } from 'services/Customer/customer-api';
import { getSales } from 'services/Sales/sales-api';
import toast from 'react-hot-toast';
import { isValidPhoneNumber } from 'utils/phoneNumber';

export default function NewCustomer(): JSX.Element {
  const useStyles = makeStyles({
    noResultMessage: {
      textAlign: 'center',
      fontSize: '1.2em',
      fontWeight: 'bold',
      padding: '48px 0'
    },
    tableHeader: {
      border: `2px solid ${BRAND_COLORS.sand}`,
      fontWeight: 'bold',
      paddingLeft: '10px',
      textAlign: 'center'
    },
    datePickerFromTo: {
      '&& .MuiOutlinedInput-input': {
        padding: '16.5px 14px',
        fontSize: '14px'
      },
      '&& .MuiFormLabel-root': {
        fontSize: '13px'
      }
    }
  });

  const classes = useStyles();
  const theme = useTheme();
  const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
  const history = useHistory();
  const { t } = useTranslation();
  const [actionType, setActionType] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [msg, setMsg] = useState<string>('');
  const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
  const [additionalBillingProfiles, setAdditionalBillingProfiles] = useState<
    CreateCustomerBillingProfileRequest[]
  >([]);

  const { data: customerTypeList, isFetching: isCustomerTypeFetching } = useQuery(
    'customer-type',
    () => getSystemConfig(GROUP_CODE.CUSTOMER_TYPE),
    {
      refetchOnWindowFocus: false
    }
  );

  const { data: creditTermList, isFetching: isCreditTermFetching } = useQuery(
    'credit-term-list',
    () => getSystemConfig(GROUP_CODE.CUSTOMER_CREDIT_TERM),
    { refetchOnWindowFocus: false }
  );
  const { data: paymentTermList, isFetching: isPaymentTermFetching } = useQuery(
    'payment-term-list',
    () => getSystemConfig(GROUP_CODE.CUSTOMER_PAYMENT_TERM),
    { refetchOnWindowFocus: false }
  );
  const { data: salesOptions = [], isFetching: isSalesFetching } = useQuery(
    'customer-sales-options',
    () => getSales(1, 20),
    { refetchOnWindowFocus: false }
  );

  const { data: provinces } = useQuery('province', () => getProvince(), {
    refetchOnWindowFocus: false
  });
  const { data: districts } = useQuery('district', () => getDistrict(), {
    refetchOnWindowFocus: false
  });
  const { data: subdistrict } = useQuery('subdistrict', () => getSubDistrict(), { refetchOnWindowFocus: false });
  const { data: countries = [] } = useQuery('country', () => getCountry(), {
    refetchOnWindowFocus: false
  });

  const getSalesLabels = (salesIds: string[]) =>
    salesIds
      .map((salesId) => {
        const selectedSales = salesOptions.find((option) => option.salesId === salesId);
        return selectedSales ? `${selectedSales.salesId} - ${selectedSales.nickname || selectedSales.name}` : salesId;
      })
      .join(', ');

  const formik = useFormik({
    initialValues: {
      customerName: '',
      contactNumber1: '',
      contactNumber2: '',
      contactName: '',
      email: '',
      type: 'INDIVIDUAL',
      taxId: '',
      companyName: '',
      companyBranchCode: '',
      companyBranchName: '',
      branches: [{ branchCode: '', branchName: '', isDefault: true }],
      creditTerm: 'NON',
      paymentTerm: 'DEP50',
      billingCondition: '',
      paymentCycle: '',
      salesAccounts: [] as string[],
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
      billingProfile: {
        profileName: 'หัวบิลหลัก',
        billingProfileType: 'VAT' as 'VAT' | 'NO_VAT',
        isDefault: true,
        billingName: '',
        taxId: '',
        branchCode: '',
        branchName: '',
        addressLine1: '',
        addressLine2: '',
        subdistrict: '',
        district: '',
        province: '',
        postcode: '',
        country: '',
        email: '',
        phone: ''
      },
      useCustomerAddressForBilling: false,
      contacts: [
      ]
    },
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      customerName: Yup.string().max(255).required(t('customerManagement.message.validateCustomerName')),
      type: Yup.string().max(255).required(t('customerManagement.message.validateType')),
      taxId: Yup.string().when('country', {
        is: 'TH',
        then: Yup.string().required(t('customerManagement.message.validateTaxId')),
        otherwise: Yup.string().nullable().notRequired()
      })
      ,
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
      branches: Yup.array().when('type', {
        is: 'COMPANY',
        then: Yup.array().of(Yup.object().shape({
          branchCode: Yup.string().required(t('customerManagement.message.validateCompanyBranchCode')),
          branchName: Yup.string().required(t('customerManagement.message.validateCompanyBranchName')),
          isDefault: Yup.boolean()
        })).min(1).test('one-default', 'A company must have one default branch', (branches) =>
          Boolean(branches?.some((branch) => branch.isDefault))),
        otherwise: Yup.array().notRequired()
      }),
      creditTerm: Yup.string().max(255).required(t('customerManagement.message.validateCreditTerm')),
      paymentTerm: Yup.string().max(255).required(t('customerManagement.message.validatePaymentTerm')),
      salesAccounts: Yup.array()
        .of(Yup.string().trim())
        .min(1, t('customerManagement.message.validateSalesAccount')),
      address: Yup.object().shape({
        country: Yup.string().required(t('customerManagement.column.address.country')),
        addressLine1: Yup.string().when('country', {
          is: 'TH',
          then: Yup.string().required(t('customerManagement.message.validateAddress')),
          otherwise: Yup.string().nullable().notRequired()
        }),
        subdistrict: Yup.string().when('country', {
          is: 'TH',
          then: Yup.string().required(t('customerManagement.message.validateSubdistrict')),
          otherwise: Yup.string().nullable().notRequired()
        }),
        district: Yup.string().when('country', {
          is: 'TH',
          then: Yup.string().required(t('customerManagement.message.validateDistrict')),
          otherwise: Yup.string().nullable().notRequired()
        }),
        province: Yup.string().when('country', {
          is: 'TH',
          then: Yup.string().required(t('customerManagement.message.validateProvince')),
          otherwise: Yup.string().nullable().notRequired()
        }),
      }),
      contacts: Yup.array()
        .of(
          Yup.object().shape({
            contactName: Yup.string()
              .required(t('customerManagement.message.validateContactName')),
            contactNumber: Yup.string()
              .required(t('customerManagement.message.validateContactNumber'))
          })
        )
        .min(1, t('customerManagement.message.validateAtLeastOneContact'))
    }),
    onSubmit: (values, actions) => {
      actions.setSubmitting(true);
      const primaryBillingProfile: CreateCustomerBillingProfileRequest = {
        ...values.billingProfile,
        billingName: values.billingProfile.billingName || values.customerName,
        taxId: values.billingProfile.taxId || values.taxId,
        branchCode: values.billingProfile.branchCode || values.companyBranchCode,
        branchName: values.billingProfile.branchName || values.companyBranchName,
        addressLine1: values.billingProfile.addressLine1,
        addressLine2: values.billingProfile.addressLine2,
        subdistrict: values.billingProfile.subdistrict
          ? subdistrict?.find(item => item.id === values.billingProfile.subdistrict)?.nameTh
          : '',
        district: values.billingProfile.district
          ? districts?.find(item => item.id === values.billingProfile.district)?.nameTh
          : '',
        province: values.billingProfile.province
          ? provinces?.find(item => item.id === values.billingProfile.province)?.nameTh
          : '',
        postcode: values.billingProfile.postcode,
        country: values.billingProfile.country,
        email: values.billingProfile.email || values.email,
        isDefault: values.billingProfile.isDefault
      };
      const createRequest: CreateCustomerRequest = {
        customerName: values.customerName,
        customerType: values.type,
        email: values.email,
        taxId: values.taxId,
        companyName: values.companyName,
        branchNumber: values.companyBranchCode,
        branchName: values.companyBranchName,
        branches: values.type === 'COMPANY' ? values.branches : [],
        creditTerm: values.creditTerm,
        paymentTerm: values.paymentTerm,
        billingCondition: values.billingCondition,
        paymentCycle: values.paymentCycle,
        salesAccount: values.salesAccounts[0] || '',
        salesAccounts: values.salesAccounts,
        coSalesAccount: values.coSalesAccount,

        // ✅ ส่ง address object
        address: {
          addressType: values.address.addressType,
          isDefault: values.address.isDefault,
          label: values.address.label,
          addressLine1: values.address.addressLine1,
          addressLine2: values.address.addressLine2,
          subdistrict: subdistrict?.find(sd => sd.id === values.address.subdistrict)?.nameTh,
          district: districts?.find(d => d.id === values.address.district)?.nameTh,
          province: provinces?.find(p => p.id === values.address.province)?.nameTh,
          postcode: values.address.postcode,
          country: values.address.country
        },
        billingProfiles: [
          primaryBillingProfile,
          ...additionalBillingProfiles.map(({ useCustomerAddressForBilling, ...profile }) => ({
            ...profile,
            subdistrict: profile.subdistrict
              ? subdistrict?.find(item => item.id === profile.subdistrict)?.nameTh || profile.subdistrict
              : '',
            district: profile.district
              ? districts?.find(item => item.id === profile.district)?.nameTh || profile.district
              : '',
            province: profile.province
              ? provinces?.find(item => item.id === profile.province)?.nameTh || profile.province
              : ''
          }))
        ],


        contacts: values.contacts?.filter(c => c.contactName || c.contactNumber) ?? []
      };
      toast.promise(createNewCustomer(createRequest), {
        loading: t('toast.loading'),
        success: (res: CreateCustomerResponse) => {
          history.push(`/customer/${res.data.id}`);
          return t('customerManagement.message.createNewCustomerSuccess');
        },
        error: (err) => {
          return t('customerManagement.message.createNewCustomerFailed', { err });
        }
      }).finally(() => {
        actions.setSubmitting(false);
      });
    }
  });
  const showThaiAddressFields = formik.values.address.country === 'TH';
  const isCustomerAddressComplete = Boolean(
    formik.values.address.addressLine1 &&
    formik.values.address.country &&
    (!showThaiAddressFields || (
      formik.values.address.province &&
      formik.values.address.district &&
      formik.values.address.subdistrict &&
      formik.values.address.postcode
    ))
  );

  useEffect(() => {
    if (!formik.values.useCustomerAddressForBilling) {
      return;
    }

    formik.setValues((current) => ({
      ...current,
      billingProfile: {
        ...current.billingProfile,
        addressLine1: current.address.addressLine1,
        addressLine2: current.address.addressLine2,
        subdistrict: current.address.subdistrict,
        district: current.address.district,
        province: current.address.province,
        postcode: current.address.postcode,
        country: current.address.country
      }
    }));
  }, [
    formik.values.useCustomerAddressForBilling,
    formik.values.address.addressLine1,
    formik.values.address.addressLine2,
    formik.values.address.subdistrict,
    formik.values.address.district,
    formik.values.address.province,
    formik.values.address.postcode,
    formik.values.address.country,
    subdistrict,
    districts,
    provinces
  ]);

  return (
    <FormikProvider value={formik}>
      <Page>
        <LoadingDialog open={formik.isSubmitting} />
        <PageTitle title={t('customerManagement.action.create')} />
        <Wrapper>
          <Grid container spacing={1}>
            <GridTextField item xs={12} sm={12}>
              <Typography>{t('customerManagement.detail')}</Typography>
            </GridTextField>
            <GridTextField item xs={12} sm={12}>
              <TextField
                type="text"
                label={t('customerManagement.column.id')}
                fullWidth
                disabled
                variant="outlined"
                placeholder={t('general.autoGenerated')}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>
            <GridTextField item xs={12} sm={12}>
              <TextField
                type="text"
                label={t('customerManagement.column.name')}
                fullWidth
                required
                onChange={({ target }) => {
                  formik.setFieldValue('customerName', target.value);
                  formik.setFieldValue('companyName', target.value);
                }}
                variant="outlined"
                value={formik.values.customerName}
                error={Boolean(formik.touched.customerName && formik.errors.customerName)}
                helperText={formik.touched.customerName && formik.errors.customerName}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>
            <GridTextField item xs={12} sm={6} sx={{ display: showThaiAddressFields ? 'block' : 'none' }}>
              <TextField
                select
                fullWidth
                label={t('customerManagement.column.type')}
                disabled={isCustomerTypeFetching}
                InputLabelProps={{ shrink: true }}
                error={Boolean(formik.touched.type && formik.errors.type)}
                helperText={formik.touched.type && formik.errors.type}
                value={formik.values.type || ''}
                onChange={(event) => {
                  const selectedCode = event.target.value;
                  if (selectedCode === '') {
                    formik.setFieldValue('type', selectedCode);
                  } else {
                    const selectedValue = customerTypeList?.find((type) => type.code === selectedCode) || null;
                    formik.setFieldValue('type', selectedValue?.code);
                  }
                }}
              >
                <MenuItem value="">
                  {t('general.clearSelected')}
                </MenuItem>
                {customerTypeList?.map((option) => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.nameTh}
                  </MenuItem>
                )) || []}
              </TextField>
            </GridTextField>
            <GridTextField item xs={12} sm={6} sx={{ display: showThaiAddressFields ? 'block' : 'none' }}>
              <TextField
                type="text"
                label={t('customerManagement.column.taxId')}
                fullWidth
                required
                onChange={({ target }) => {
                  formik.setFieldValue('taxId', target.value);
                }}
                variant="outlined"
                value={formik.values.taxId}
                error={Boolean(formik.touched.taxId && formik.errors.taxId)}
                helperText={formik.touched.taxId && formik.errors.taxId}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>
            {formik.values.type === 'COMPANY' ? (
              <>
                <GridTextField item xs={12}>
                  <FieldArray name="branches">
                    {({ push, remove }) => (
                      <Stack spacing={1} sx={{ mt: 1 }}>
                        <Typography variant="subtitle1">สาขา</Typography>
                        {formik.values.branches.map((branch, index) => (
                          <Stack key={index} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
                            <FormControlLabel
                              sx={{ display: { xs: 'none', sm: 'block' } }}
                              control={
                                <Switch
                                  onChange={(e) => {
                                    if (e.target.checked === true) {
                                      formik.setFieldValue('companyBranchCode', '00000');
                                      formik.setFieldValue('companyBranchName', 'สำนักงานใหญ่');
                                      formik.setFieldValue('branches.0.branchCode', '00000');
                                      formik.setFieldValue('branches.0.branchName', 'สำนักงานใหญ่');
                                    } else {
                                      formik.setFieldValue('companyBranchCode', '');
                                      formik.setFieldValue('companyBranchName', '');
                                      formik.setFieldValue('branches.0.branchCode', '');
                                      formik.setFieldValue('branches.0.branchName', '');
                                    }
                                  }}
                                />
                              }
                              label={t('customerManagement.column.company.headOffice')}
                            />
                            <TextField label={t('customerManagement.column.company.branchCode')} value={branch.branchCode} InputLabelProps={{ shrink: true }}
                              onChange={(event) => formik.setFieldValue(`branches.${index}.branchCode`, event.target.value)} fullWidth />
                            <TextField label={t('customerManagement.column.company.branchName')} value={branch.branchName} InputLabelProps={{ shrink: true }}
                              onChange={(event) => formik.setFieldValue(`branches.${index}.branchName`, event.target.value)} fullWidth />
                            <IconButton disabled={formik.values.branches.length === 1} onClick={() => remove(index)}><Delete /></IconButton>
                          </Stack>
                        ))}
                        <Button size="small" startIcon={<Add />} onClick={() => push({ branchCode: '', branchName: '', isDefault: false })}>เพิ่มสาขา</Button>
                      </Stack>
                    )}
                  </FieldArray>
                </GridTextField>
              </>
            ) : (
              <></>
            )}
            <GridTextField item xs={12} sm={6} sx={{ display: showThaiAddressFields ? 'block' : 'none' }}>
              <TextField
                type="text"
                label={t('customerManagement.column.email')}
                fullWidth
                variant="outlined"
                value={formik.values.email}
                onChange={({ target }) => formik.setFieldValue('email', target.value)}
                error={Boolean(formik.touched.email && formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>
            <GridTextField item xs={12} sm={6} sx={{ display: showThaiAddressFields ? 'block' : 'none' }}>
              <TextField
                select
                fullWidth
                label={t('customerManagement.column.creditTerm')}
                InputLabelProps={{ shrink: true }}
                error={Boolean(formik.touched.creditTerm && formik.errors.creditTerm)}
                helperText={formik.touched.creditTerm && formik.errors.creditTerm}
                value={formik.values.creditTerm || ''}
                onChange={(event) => {
                  const selectedCode = event.target.value;
                  if (selectedCode === '') {
                    formik.setFieldValue('creditTerm', selectedCode);
                  } else {
                    const selectedValue = creditTermList?.find((creditTerm) => creditTerm.code === selectedCode) || null;
                    formik.setFieldValue('creditTerm', selectedValue?.code);
                  }
                }}
                disabled={isCreditTermFetching}
              >
                <MenuItem value="">
                  {t('general.clearSelected')}
                </MenuItem>
                {creditTermList?.map((option) => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.nameTh}
                  </MenuItem>
                )) || []}
              </TextField>
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                type="text"
                fullWidth
                label={t('customerManagement.column.billingCondition')}
                InputLabelProps={{ shrink: true }}
                value={formik.values.billingCondition || ''}
                onChange={({ target }) => formik.setFieldValue('billingCondition', target.value)}
              />
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                type="text"
                fullWidth
                label={t('customerManagement.column.paymentCycle')}
                InputLabelProps={{ shrink: true }}
                value={formik.values.paymentCycle || ''}
                onChange={({ target }) => formik.setFieldValue('paymentCycle', target.value)}
              />
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label={t('customerManagement.column.paymentTerm')}
                InputLabelProps={{ shrink: true }}
                error={Boolean(formik.touched.paymentTerm && formik.errors.paymentTerm)}
                helperText={formik.touched.paymentTerm && formik.errors.paymentTerm}
                value={formik.values.paymentTerm || ''}
                onChange={(event) => {
                  const selectedCode = event.target.value;
                  if (selectedCode === '') {
                    formik.setFieldValue('paymentTerm', selectedCode);
                  } else {
                    const selectedValue = paymentTermList?.find((paymentTerm) => paymentTerm.code === selectedCode) || null;
                    formik.setFieldValue('paymentTerm', selectedValue?.code);
                  }
                }}
                disabled={isPaymentTermFetching}
              >
                <MenuItem value="">
                  {t('general.clearSelected')}
                </MenuItem>
                {paymentTermList?.map((option) => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.nameTh}
                  </MenuItem>
                )) || []}
              </TextField>
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                required
                label={t('customerManagement.column.salesAccount')}
                InputLabelProps={{ shrink: true }}
                error={Boolean(formik.touched.salesAccounts && formik.errors.salesAccounts)}
                helperText={formik.touched.salesAccounts && (formik.errors.salesAccounts as string)}
                value={formik.values.salesAccounts}
                onChange={(event) => {
                  formik.setFieldValue(
                    'salesAccounts',
                    typeof event.target.value === 'string'
                      ? event.target.value.split(',')
                      : event.target.value
                  );
                }}
                disabled={isSalesFetching}
                SelectProps={{
                  multiple: true,
                  renderValue: (selected) => getSalesLabels(selected as string[])
                }}
              >
                {salesOptions.map((option) => (
                  <MenuItem key={option.salesId} value={option.salesId}>
                    {`${option.salesId} - ${option.nickname || option.name}`}
                  </MenuItem>
                ))}
              </TextField>
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                type="text"
                label={t('customerManagement.column.coSalesAccount')}
                fullWidth
                onChange={({ target }) => {
                  formik.setFieldValue('coSalesAccount', target.value);
                }}
                variant="outlined"
                value={formik.values.coSalesAccount}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>
          </Grid>
          <Grid container spacing={1} sx={{ mt: 2 }}>
            <GridTextField item xs={12} sm={12}>
              <Typography>{t('customerManagement.column.address.invoice')}</Typography>
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                disabled
                label={t('customerManagement.column.address.type')}
                value={formik.values.address.addressType || ''}
                onChange={(e) => formik.setFieldValue('address.addressType', e.target.value)}
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="BILLING">{t('customerManagement.column.addressType.billing')}</MenuItem>
                <MenuItem value="SHIPPING">{t('customerManagement.column.addressType.shipping')}</MenuItem>
                <MenuItem value="OTHER">{t('customerManagement.column.addressType.other')}</MenuItem>
              </TextField>
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                type="text"
                label={t('customerManagement.column.address.label')}
                fullWidth
                value={formik.values.address.label || ''}
                onChange={(e) =>
                  formik.setFieldValue('address.label', e.target.value)
                }
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>
            <GridTextField item xs={12}>
              <TextField
                type="text"
                label={t('customerManagement.column.address.addressLine1')}
                fullWidth
                required
                value={formik.values.address.addressLine1 || ''}
                onChange={(e) =>
                  formik.setFieldValue('address.addressLine1', e.target.value)
                }
                error={Boolean(formik.touched.address?.addressLine1 && (formik.errors.address as any)?.addressLine1)}
                helperText={formik.touched.address?.addressLine1 && (formik.errors.address as any)?.addressLine1}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>

            <GridTextField item xs={12}>
              <TextField
                type="text"
                label={t('customerManagement.column.address.addressLine2')}
                fullWidth
                value={formik.values.address.addressLine2 || ''}
                onChange={(e) =>
                  formik.setFieldValue('address.addressLine2', e.target.value)
                }
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>
            {showThaiAddressFields && (
              <>
                <GridTextField item xs={12} sm={6}>
                  <TextField
                    name="addressProvince"
                    select
                    label={t('customerManagement.column.address.province')}
                    fullWidth
                    variant="outlined"
                    value={formik.values.address.province}
                    onChange={(e) =>
                      formik.setFieldValue('address.province', e.target.value)
                    }
                    error={Boolean(formik.touched.address?.province && formik.errors.address?.province)}
                    helperText={formik.touched.address?.province && formik.errors.address?.province}
                    InputLabelProps={{ shrink: true }}>
                    <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                    {provinces?.map((g) => (
                      <MenuItem key={g.id} value={g.id}>
                        {g.nameTh}
                      </MenuItem>
                    ))}
                  </TextField>
                </GridTextField>
                <GridTextField item xs={12} sm={6}>
                  <TextField
                    name="addressAmphure"
                    select
                    label={t('customerManagement.column.address.amphure')}
                    fullWidth
                    variant="outlined"
                    value={formik.values.address.district}
                    onChange={(e) =>
                      formik.setFieldValue('address.district', e.target.value)
                    }
                    error={Boolean(formik.touched.address?.district && formik.errors.address?.district)}
                    helperText={formik.touched.address?.district && formik.errors.address?.district}
                    InputLabelProps={{ shrink: true }}>
                    <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                    {districts
                      ?.filter((a) => formik.values.address.province === a.provinceId)
                      .map((g) => (
                        <MenuItem key={g.id} value={g.id}>
                          {g.nameTh}
                        </MenuItem>
                      ))}
                  </TextField>
                </GridTextField>
                <GridTextField item xs={12} sm={6}>
                  <TextField
                    name="addressTumbon"
                    select
                    label={t('customerManagement.column.address.tumbon')}
                    fullWidth
                    variant="outlined"
                    value={formik.values.address.subdistrict} // <-- just the id
                    error={Boolean(formik.touched.address?.subdistrict && formik.errors.address?.subdistrict)}
                    helperText={formik.touched.address?.subdistrict && formik.errors.address?.subdistrict}
                    onChange={({ target }) => {
                      const selected = subdistrict?.find((t) => t.id === target.value);
                      formik.setFieldValue('address.subdistrict', selected?.id ?? '');
                      formik.setFieldValue('address.postcode', selected?.zipCode ?? '');
                    }}
                    onBlur={formik.handleBlur}
                    InputLabelProps={{ shrink: true }}>
                    <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                    {subdistrict
                      ?.filter((t) => t.districtId === formik.values.address.district) // ← match amphure
                      .map((t) => (
                        <MenuItem key={t.id} value={t.id}>
                          {t.nameTh}
                        </MenuItem>
                      ))}
                  </TextField>
                </GridTextField>
                <GridTextField item xs={12} sm={6}>
                  <TextField
                    name="postalCode"
                    type="text"
                    label={t('customerManagement.column.address.postalCode')}
                    fullWidth
                    disabled
                    variant="outlined"
                    value={formik.values.address.postcode}
                    InputLabelProps={{ shrink: true }}
                  />
                </GridTextField>
              </>
            )}
            <GridTextField item xs={12} sm={6}>
              <TextField
                select
                label={t('customerManagement.column.address.country')}
                fullWidth
                value={formik.values.address.country || 'TH'}
                onChange={(e) => {
                  formik.setFieldValue('address.country', e.target.value);
                  formik.setFieldValue('address.province', '');
                  formik.setFieldValue('address.district', '');
                  formik.setFieldValue('address.subdistrict', '');
                  formik.setFieldValue('address.postcode', '');
                }}
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {countries.map((country: Country) => (
                  <MenuItem key={country.code} value={country.code}>
                    {country.nameTh || country.name}
                  </MenuItem>
                ))}
              </TextField>
            </GridTextField>
            <GridTextField item sm={6} />
          </Grid>
          <Grid container spacing={1} sx={{ mt: 2 }}>
            <GridTextField item xs={12} sm={12}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography>หัวบิล</Typography>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setAdditionalBillingProfiles((profiles) => [
                    ...profiles,
                    {
                      profileName: `หัวบิลเพิ่มเติม ${profiles.length + 1}`,
                      billingProfileType: 'VAT',
                      billingName: '',
                      taxId: '',
                      branchCode: '',
                      branchName: '',
                      addressLine1: '',
                      addressLine2: '',
                      subdistrict: '',
                      district: '',
                      province: '',
                      postcode: '',
                      country: 'TH',
                      email: '',
                      phone: '',
                      isDefault: false,
                      useCustomerAddressForBilling: false
                    }
                  ])}>
                  เพิ่มหัวบิล
                </Button>
              </Stack>
            </GridTextField>
            <GridTextField item xs={12} sm={2}>
              <TextField
                select
                fullWidth
                label="ประเภทหัวบิล"
                value={formik.values.billingProfile.billingProfileType}
                InputLabelProps={{ shrink: true }}
                onChange={(e) => formik.setFieldValue('billingProfile.billingProfileType', e.target.value)}
              >
                <MenuItem value="VAT">จด VAT</MenuItem>
                <MenuItem value="NO_VAT">ไม่จด VAT</MenuItem>
              </TextField>
            </GridTextField>
            <GridTextField item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(formik.values.billingProfile.isDefault)}
                    onChange={(e) => formik.setFieldValue('billingProfile.isDefault', e.target.checked)}
                  />
                }
                label="หัวบิลเริ่มต้น"
              />
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(formik.values.useCustomerAddressForBilling)}
                    disabled={!isCustomerAddressComplete}
                    onChange={(e) => formik.setFieldValue('useCustomerAddressForBilling', e.target.checked)}
                  />
                }
                label="ใช้ที่อยู่ลูกค้าเป็นที่อยู่หัวบิล"
              />
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ชื่อ (หัวบิล)"
                value={formik.values.billingProfile.billingName}
                InputLabelProps={{ shrink: true }}
                onChange={(e) => formik.setFieldValue('billingProfile.billingName', e.target.value)}
                placeholder={formik.values.customerName}
              />
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                label="เลขประจำตัวผู้เสียภาษี"
                value={formik.values.billingProfile.taxId}
                InputLabelProps={{ shrink: true }}
                onChange={(e) => formik.setFieldValue('billingProfile.taxId', e.target.value)}
                placeholder={formik.values.taxId}
              />
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                label="รหัสสาขา (หัวบิล)"
                value={formik.values.billingProfile.branchCode}
                InputLabelProps={{ shrink: true }}
                onChange={(e) => formik.setFieldValue('billingProfile.branchCode', e.target.value)}
                placeholder={formik.values.companyBranchCode}
              />
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ชื่อสาขา (หัวบิล)"
                value={formik.values.billingProfile.branchName}
                InputLabelProps={{ shrink: true }}
                onChange={(e) => formik.setFieldValue('billingProfile.branchName', e.target.value)}
                placeholder={formik.values.companyBranchName}
              />
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                label="อีเมล (หัวบิล)"
                value={formik.values.billingProfile.email}
                InputLabelProps={{ shrink: true }}
                onChange={(e) => formik.setFieldValue('billingProfile.email', e.target.value)}
                placeholder={formik.values.email}
              />
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                label="เบอร์โทร (หัวบิล)"
                value={formik.values.billingProfile.phone}
                InputLabelProps={{ shrink: true }}
                onChange={(e) => formik.setFieldValue('billingProfile.phone', e.target.value)}
              />
            </GridTextField>
            <GridTextField item xs={12}>
              <TextField
                fullWidth
                label="ที่อยู่ (หัวบิล)"
                value={formik.values.billingProfile.addressLine1}
                InputLabelProps={{ shrink: true }}
                onChange={(e) => formik.setFieldValue('billingProfile.addressLine1', e.target.value)}
              />
            </GridTextField>
            <GridTextField item xs={12}>
              <TextField
                fullWidth
                label="ที่อยู่เพิ่มเติม (หัวบิล)"
                value={formik.values.billingProfile.addressLine2}
                InputLabelProps={{ shrink: true }}
                onChange={(e) => formik.setFieldValue('billingProfile.addressLine2', e.target.value)}
              />
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="จังหวัด (หัวบิล)"
                value={formik.values.billingProfile.province}
                InputLabelProps={{ shrink: true }}
                onChange={(e) => {
                  formik.setFieldValue('billingProfile.province', e.target.value);
                  formik.setFieldValue('billingProfile.district', '');
                  formik.setFieldValue('billingProfile.subdistrict', '');
                  formik.setFieldValue('billingProfile.postcode', '');
                }}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {provinces?.map((item) => (
                  <MenuItem key={item.id} value={item.id}>{item.nameTh}</MenuItem>
                ))}
              </TextField>
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="ตำบล/แขวง (หัวบิล)"
                value={formik.values.billingProfile.subdistrict}
                InputLabelProps={{ shrink: true }}
                onChange={(e) => {
                  const selected = subdistrict?.find((item) => item.id === e.target.value);
                  formik.setFieldValue('billingProfile.subdistrict', e.target.value);
                  formik.setFieldValue('billingProfile.postcode', selected?.zipCode || '');
                }}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {subdistrict
                  ?.filter((item) => item.districtId === formik.values.billingProfile.district)
                  .map((item) => (
                    <MenuItem key={item.id} value={item.id}>{item.nameTh}</MenuItem>
                  ))}
              </TextField>
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="อำเภอ/เขต (หัวบิล)"
                value={formik.values.billingProfile.district}
                InputLabelProps={{ shrink: true }}
                onChange={(e) => {
                  formik.setFieldValue('billingProfile.district', e.target.value);
                  formik.setFieldValue('billingProfile.subdistrict', '');
                  formik.setFieldValue('billingProfile.postcode', '');
                }}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {districts
                  ?.filter((item) => item.provinceId === formik.values.billingProfile.province)
                  .map((item) => (
                    <MenuItem key={item.id} value={item.id}>{item.nameTh}</MenuItem>
                  ))}
              </TextField>
            </GridTextField>
            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                label="รหัสไปรษณีย์ (หัวบิล)"
                value={formik.values.billingProfile.postcode}
                InputLabelProps={{ shrink: true }}
                disabled
              />
            </GridTextField>
            {additionalBillingProfiles.map((profile, index) => {
              const updateProfile = (changes: Partial<CreateCustomerBillingProfileRequest>) =>
                setAdditionalBillingProfiles((profiles) => profiles.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, ...changes } : item
                ));
              const copyCustomerAddress = (checked: boolean) => updateProfile({
                useCustomerAddressForBilling: checked,
                ...(checked ? {
                  addressLine1: formik.values.address.addressLine1,
                  addressLine2: formik.values.address.addressLine2,
                  subdistrict: formik.values.address.subdistrict,
                  district: formik.values.address.district,
                  province: formik.values.address.province,
                  postcode: formik.values.address.postcode,
                  country: formik.values.address.country
                } : {})
              });
              return (
                <GridTextField item xs={12} key={`additional-billing-profile-${index}`}>
                  <Stack spacing={1} sx={{ border: '1px solid #D4C5BA', borderRadius: 1, p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography fontWeight={700}>{profile.profileName}</Typography>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteOutline />}
                        onClick={() => setAdditionalBillingProfiles((profiles) => profiles.filter((_, itemIndex) => itemIndex !== index))}>
                        ลบหัวบิล
                      </Button>
                    </Stack>
                    <Grid container spacing={1}>
                      <GridTextField item xs={12} sm={4}>
                        <TextField select fullWidth label="ประเภทหัวบิล" InputLabelProps={{ shrink: true }} value={profile.billingProfileType || 'VAT'} onChange={(e) => updateProfile({ billingProfileType: e.target.value as 'VAT' | 'NO_VAT' })}>
                          <MenuItem value="VAT">จด VAT</MenuItem>
                          <MenuItem value="NO_VAT">ไม่จด VAT</MenuItem>
                        </TextField>
                      </GridTextField>
                      <GridTextField item xs={12} sm={8}>
                        <FormControlLabel
                          control={<Switch checked={Boolean(profile.isDefault)} onChange={(e) => updateProfile({ isDefault: e.target.checked })} />}
                          label="หัวบิลเริ่มต้น"
                        />
                      </GridTextField>
                      <GridTextField item xs={12} sm={6}>
                        <TextField fullWidth label="ชื่อหัวบิล" InputLabelProps={{ shrink: true }} value={profile.billingName || ''} onChange={(e) => updateProfile({ billingName: e.target.value })} />
                      </GridTextField>
                      <GridTextField item xs={12} sm={6}>
                        <TextField fullWidth label="เลขประจำตัวผู้เสียภาษี" InputLabelProps={{ shrink: true }} value={profile.taxId || ''} onChange={(e) => updateProfile({ taxId: e.target.value })} />
                      </GridTextField>
                      <GridTextField item xs={12} sm={6}>
                        <TextField fullWidth label="รหัสสาขา" InputLabelProps={{ shrink: true }} value={profile.branchCode || ''} onChange={(e) => updateProfile({ branchCode: e.target.value })} />
                      </GridTextField>
                      <GridTextField item xs={12} sm={6}>
                        <TextField fullWidth label="ชื่อสาขา" InputLabelProps={{ shrink: true }} value={profile.branchName || ''} onChange={(e) => updateProfile({ branchName: e.target.value })} />
                      </GridTextField>
                      <GridTextField item xs={12} sm={6}>
                        <TextField fullWidth label="อีเมล (หัวบิล)" InputLabelProps={{ shrink: true }} value={profile.email || ''} onChange={(e) => updateProfile({ email: e.target.value })} />
                      </GridTextField>
                      <GridTextField item xs={12} sm={6}>
                        <TextField fullWidth label="เบอร์โทร (หัวบิล)" InputLabelProps={{ shrink: true }} value={profile.phone || ''} onChange={(e) => updateProfile({ phone: e.target.value })} />
                      </GridTextField>
                      <GridTextField item xs={12}>
                        <FormControlLabel
                          control={<Checkbox checked={Boolean(profile.useCustomerAddressForBilling)} onChange={(e) => copyCustomerAddress(e.target.checked)} disabled={!isCustomerAddressComplete} />}
                          label="ใช้ที่อยู่ลูกค้าเป็นที่อยู่หัวบิล"
                        />
                      </GridTextField>
                      <GridTextField item xs={12}>
                        <TextField fullWidth label="ที่อยู่ (หัวบิล)" InputLabelProps={{ shrink: true }} value={profile.addressLine1 || ''} onChange={(e) => updateProfile({ addressLine1: e.target.value })} />
                      </GridTextField>
                      <GridTextField item xs={12}>
                        <TextField fullWidth label="ที่อยู่เพิ่มเติม (หัวบิล)" InputLabelProps={{ shrink: true }} value={profile.addressLine2 || ''} onChange={(e) => updateProfile({ addressLine2: e.target.value })} />
                      </GridTextField>
                      <GridTextField item xs={12} sm={6}>
                        <TextField select fullWidth label="จังหวัด (หัวบิล)" InputLabelProps={{ shrink: true }} value={profile.province || ''} onChange={(e) => updateProfile({ province: e.target.value, district: '', subdistrict: '', postcode: '' })}>
                          <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                          {provinces?.map((item) => <MenuItem key={item.id} value={item.id}>{item.nameTh}</MenuItem>)}
                        </TextField>
                      </GridTextField>
                      <GridTextField item xs={12} sm={6}>
                        <TextField select fullWidth label="อำเภอ/เขต (หัวบิล)" InputLabelProps={{ shrink: true }} value={profile.district || ''} onChange={(e) => updateProfile({ district: e.target.value, subdistrict: '', postcode: '' })}>
                          <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                          {districts?.filter((item) => item.provinceId === profile.province).map((item) => <MenuItem key={item.id} value={item.id}>{item.nameTh}</MenuItem>)}
                        </TextField>
                      </GridTextField>
                      <GridTextField item xs={12} sm={6}>
                        <TextField select fullWidth label="ตำบล/แขวง (หัวบิล)" InputLabelProps={{ shrink: true }} value={profile.subdistrict || ''} onChange={(e) => updateProfile({ subdistrict: e.target.value, postcode: subdistrict?.find((item) => item.id === e.target.value)?.zipCode || '' })}>
                          <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                          {subdistrict?.filter((item) => item.districtId === profile.district).map((item) => <MenuItem key={item.id} value={item.id}>{item.nameTh}</MenuItem>)}
                        </TextField>
                      </GridTextField>
                      <GridTextField item xs={12} sm={6}>
                        <TextField fullWidth label="รหัสไปรษณีย์ (หัวบิล)" InputLabelProps={{ shrink: true }} value={profile.postcode || ''} disabled />
                      </GridTextField>
                    </Grid>
                  </Stack>
                </GridTextField>
              );
            })}
          </Grid>
          <Grid container spacing={1} sx={{ mt: 2 }}>
            <FieldArray name="contacts">
              {({ push, remove }) => (
                <>
                  <GridTextField item xs={6} sm={6} >
                    <Typography>{t('customerManagement.column.contacts')}</Typography>
                  </GridTextField>
                  {/* Add Contact Button */}
                  <GridTextField item xs={6} sm={6} textAlign={'right'}>
                    <Button
                      startIcon={<PersonAdd />}
                      variant='contained'
                      onClick={() =>
                        push({
                          contactName: '',
                          contactNumber: ''
                        })
                      }
                    >
                      {t('customerManagement.addContact')}
                    </Button>
                  </GridTextField>

                  {typeof formik.errors.contacts === 'string' && (
                    <GridTextField item xs={12}>
                      <Typography color="error" variant="caption">
                        {formik.errors.contacts}
                      </Typography>
                    </GridTextField>
                  )}

                  {formik.values.contacts.map((contact, index) => (
                    <Grid container spacing={1} key={index}>

                      {/* Contact Name */}
                      <GridTextField item xs={12} sm={6}>
                        <TextField
                          label={t('customerManagement.column.contactName')}
                          fullWidth
                          required
                          value={contact.contactName}
                          onChange={(e) =>
                            formik.setFieldValue(`contacts.${index}.contactName`, e.target.value)
                          }
                          error={Boolean(
                            formik.touched.contacts?.[index]?.contactName &&
                            (formik.errors.contacts as any)?.[index]?.contactName
                          )}
                          helperText={
                            formik.touched.contacts?.[index]?.contactName &&
                            (formik.errors.contacts as any)?.[index]?.contactName
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                      </GridTextField>

                      {/* Contact Number */}
                      <GridTextField item xs={12} sm={5}>
                        <TextField
                          label={t('customerManagement.column.contactNumber')}
                          fullWidth
                          required
                          value={contact.contactNumber}
                          onChange={(e) =>
                            formik.setFieldValue(`contacts.${index}.contactNumber`, e.target.value)
                          }
                          error={Boolean(
                            formik.touched.contacts?.[index]?.contactNumber &&
                            (formik.errors.contacts as any)?.[index]?.contactNumber
                          )}
                          helperText={
                            formik.touched.contacts?.[index]?.contactNumber &&
                            (formik.errors.contacts as any)?.[index]?.contactNumber
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                      </GridTextField>

                      {/* Delete Contact */}
                      <GridTextField item xs={12} sm={1}>
                        <IconButton
                          color="error"
                          disabled={formik.values.contacts.length === 1}
                          onClick={() => remove(index)}
                        >
                          <Delete />
                        </IconButton>
                      </GridTextField>
                    </Grid>
                  ))}
                </>
              )}
            </FieldArray>
          </Grid>
        </Wrapper>
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
              className="btn-cool-grey"
              onClick={() => {
                setActionType('back');
                setTitle(t('message.backTitle'));
                setMsg(t('message.backMsg'));
                setVisibleConfirmationDialog(true);
              }}
              startIcon={<ArrowBackIos />}>
              {t('button.back')}
            </Button>
            <Button
              fullWidth={isDownSm}
              variant="contained"
              className="btn-amber-orange"
              onClick={() => {
                setActionType('clear');
                setTitle(t('message.clearDataTitle'));
                setMsg(t('message.clearDataMsg'));
                setVisibleConfirmationDialog(true);
              }}
              startIcon={<Cancel />}>
              {t('button.clear')}
            </Button>
            <Button
              fullWidth={isDownSm}
              variant="contained"
              className="btn-emerald-green"
              onClick={() => {
                setActionType('create');
                setTitle(t('customerManagement.newCustomer'));
                setMsg(t('customerManagement.confirmMsgNewCustomer'));
                setVisibleConfirmationDialog(true);
              }}
              startIcon={<Save />}>
              {t('button.create')}
            </Button>
          </Stack>
        </Wrapper>
        <ConfirmDialog
          open={visibleConfirmationDialog}
          title={title}
          message={msg}
          confirmText={t('button.confirm')}
          cancelText={t('button.cancel')}
          onConfirm={() => {
            if (actionType === 'create') {
              formik.handleSubmit();
            } else if (actionType === 'clear') {
              formik.resetForm();
            } else if (actionType === 'back') {
              history.push(ROUTE_PATHS.CUSTOMER_MANAGEMENT);
            }
            setVisibleConfirmationDialog(false);
          }}
          onCancel={() => setVisibleConfirmationDialog(false)}
          isShowCancelButton={true}
          isShowConfirmButton={true}
        />
      </Page >
    </FormikProvider>
  );
}
