/* eslint-disable prettier/prettier */
import { Save, Cancel, ArrowBackIos, Add, Delete, PersonAdd } from '@mui/icons-material';
import {
  Grid,
  Typography,
  Button,
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
import PageTitle from 'components/PageTitle';
import { Wrapper, GridTextField } from 'components/Styled';
import * as Yup from 'yup';
import { FieldArray, FormikProvider, useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { GROUP_CODE } from 'services/Config/config-type';
import { useQuery } from 'react-query';
import { getProvince, getDistrict, getSubDistrict } from 'services/Address/address-api';
import { getSystemConfig } from 'services/Config/config-api';
import {
  CreateCustomerRequest,
  CreateCustomerResponse
} from 'services/Customer/customer-type';
import { createNewCustomer } from 'services/Customer/customer-api';
import { getSales } from 'services/Sales/sales-api';
import toast from 'react-hot-toast';

export default function NewCustomer(): JSX.Element {
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
      creditTerm: 'NON',
      salesAccount: '',
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
        province: Yup.string().required(t('customerManagement.message.validateProvince')),
      }),
      contacts: Yup.array()
        .of(
          Yup.object().shape({
            contactName: Yup.string()
              .required(t('customerManagement.message.validateContactName')),
            contactNumber: Yup.string()
              .matches(/^[0-9]{9,10}$/, t('customerManagement.message.invalidPhoneNumberFormat'))
              .required(t('customerManagement.message.validateContactNumber'))
          })
        )
        .min(1, t('customerManagement.message.validateAtLeastOneContact'))
    }),
    onSubmit: (values, actions) => {
      actions.setSubmitting(true);
      const createRequest: CreateCustomerRequest = {
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
      });
    }
  });

  return (
    <FormikProvider value={formik}>
      <Page>
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
            <GridTextField item xs={12} sm={6}>
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
            <GridTextField item xs={12} sm={6}>
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
                <GridTextField item xs={12} sm={12}>
                  <Typography>{t('customerManagement.column.company.title')}</Typography>
                </GridTextField>
                <GridTextField item xs={6} sm={6}>
                  <Grid container>
                    <Grid item sm={3}>
                      <FormControlLabel
                        sx={{ display: { xs: 'none', sm: 'block' } }}
                        control={
                          <Switch
                            onChange={(e) => {
                              if (e.target.checked === true) {
                                formik.setFieldValue('companyBranchCode', '00000');
                                formik.setFieldValue('companyBranchName', 'สำนักงานใหญ่');
                              } else {
                                formik.setFieldValue('companyBranchCode', '');
                                formik.setFieldValue('companyBranchName', '');
                              }
                            }}
                          />
                        }
                        label={t('customerManagement.column.company.headOffice')}
                      />
                    </Grid>
                    <Grid item xs={12} sm={9}>
                      <TextField
                        type="text"
                        label={t('customerManagement.column.company.branchCode')}
                        fullWidth
                        onChange={({ target }) => {
                          formik.setFieldValue('branchNumber', target.value);
                        }}
                        variant="outlined"
                        disabled={formik.values.companyBranchCode === '00000'}
                        value={formik.values.companyBranchCode}
                        error={Boolean(
                          formik.touched.companyBranchCode && formik.errors.companyBranchCode
                        )}
                        helperText={
                          formik.touched.companyBranchCode && formik.errors.companyBranchCode
                        }
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                </GridTextField>
                <GridTextField item xs={6} sm={6}>
                  <TextField
                    type="text"
                    label={t('customerManagement.column.company.branchName')}
                    fullWidth
                    onChange={({ target }) => {
                      formik.setFieldValue('companyBranchName', target.value);
                    }}
                    variant="outlined"
                    disabled={formik.values.companyBranchCode === '00000'}
                    value={formik.values.companyBranchName}
                    error={Boolean(
                      formik.touched.companyBranchName && formik.errors.companyBranchName
                    )}
                    helperText={formik.touched.companyBranchName && formik.errors.companyBranchName}
                    InputLabelProps={{ shrink: true }}
                  />
                </GridTextField>
              </>
            ) : (
              <></>
            )}
            <GridTextField item xs={12} sm={6}>
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
            <GridTextField item xs={12} sm={6}>
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
                select
                fullWidth
                required
                label={t('customerManagement.column.salesAccount')}
                InputLabelProps={{ shrink: true }}
                error={Boolean(formik.touched.salesAccount && formik.errors.salesAccount)}
                helperText={formik.touched.salesAccount && formik.errors.salesAccount}
                value={formik.values.salesAccount || ''}
                onChange={(event) => {
                  const selectedCode = event.target.value;
                  if (selectedCode === '') {
                    formik.setFieldValue('salesAccount', selectedCode);
                  } else {
                    formik.setFieldValue('salesAccount', selectedCode);
                  }
                }}
                disabled={isSalesFetching}
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
            <GridTextField item xs={12} sm={6}>
              <TextField
                label={t('customerManagement.column.address.country')}
                fullWidth
                value={formik.values.address.country || ''}
                onChange={(e) =>
                  formik.setFieldValue('address.country', e.target.value)
                }
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>
            <GridTextField item sm={6} />

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
