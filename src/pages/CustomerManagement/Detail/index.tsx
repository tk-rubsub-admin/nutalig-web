import { ArrowBackIos, Cancel, LocalPhone, Person, Save } from '@mui/icons-material';
import {
  Button,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useAuth } from 'auth/AuthContext';
import ConfirmDialog from 'components/ConfirmDialog';
import PageTitle from 'components/PageTitle';
import { GridTextField, Wrapper } from 'components/Styled';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { getCustomer, updateCustomer } from 'services/Customer/customer-api';
import { Customer } from 'services/Customer/customer-type';
import { GROUP_CODE } from 'services/Config/config-type';
import { getSystemConfig } from 'services/Config/config-api';
import { getSales } from 'services/Sales/sales-api';
import toast from 'react-hot-toast';
import LoadingDialog from 'components/LoadingDialog';

export interface CustomerParam {
  id: string;
}

export default function CustomerDetail(): JSX.Element {
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
    },
    hideObject: {
      display: 'none'
    }
  });
  const classes = useStyles();
  const theme = useTheme();
  const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
  const history = useHistory();
  const params = useParams<CustomerParam>();
  const { t } = useTranslation();
  const [customer, setCustomer] = useState<Customer>();
  const [canEdit, setCanEdit] = useState<boolean>(true);
  const [actionType, setActionType] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [msg, setMsg] = useState<string>('');
  const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);

  const {
    data: customerData,
    refetch: customerRefetch,
    isFetching
  } = useQuery(['customer', params.id], () => getCustomer(params.id), {
    refetchOnWindowFocus: false
  });
  const { data: customerTypeList, isFetching: isCustomerTypeFetching } = useQuery(
    ['customer-type', GROUP_CODE.CUSTOMER_TYPE],
    () => getSystemConfig(GROUP_CODE.CUSTOMER_TYPE),
    {
      refetchOnWindowFocus: false
    }
  );
  const { data: creditTermList, isFetching: isCreditTermFetching } = useQuery(
    ['credit-term-list', GROUP_CODE.CUSTOMER_CREDIT_TERM],
    () => getSystemConfig(GROUP_CODE.CUSTOMER_CREDIT_TERM),
    { refetchOnWindowFocus: false }
  );
  const { data: salesOptions = [], isFetching: isSalesFetching } = useQuery(
    'customer-sales-options',
    () => getSales(1, 20),
    { refetchOnWindowFocus: false }
  );

  const initialValues = useMemo(
    () => ({
      customerName: customer?.customerName ?? '',
      contactNumber1: customer?.contactNumber1 ?? '',
      contactNumber2: customer?.contactNumber2 ?? '',
      contactName: customer?.contactName ?? '',
      email: customer?.email ?? '',
      type: customer?.customerType?.code ?? '',
      taxId: customer?.taxId ?? '',
      companyName: customer?.companyName ?? '',
      companyBranchCode: customer?.branchNumber ?? '',
      companyBranchName: customer?.branchName ?? '',
      creditTerm: customer?.customerCreditTerm?.code ?? '',
      address: customer?.address ?? '',
      salesAccount: customer?.salesAccount ?? '',
      coSalesAccount: customer?.coSalesAccount ?? ''
    }),
    [customer]
  );

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      customerName: Yup.string()
        .max(255)
        .required(t('customerManagement.message.validateCustomerName')),
      contactName: Yup.string()
        .max(255)
        .required(t('customerManagement.message.validateContactName')),
      contactNumber1: Yup.string()
        .max(255)
        .required(t('customerManagement.message.validateContactNumber')),
      customerAreaType: Yup.string()
        .max(255)
        .required(t('customerManagement.message.validateCustomerAreaType')),
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
      creditTerm: Yup.string()
        .max(255)
        .required(t('customerManagement.message.validateCreditTerm')),
      address: Yup.string().trim().nullable()
    }),
    onSubmit: (values, actions) => {
      actions.setSubmitting(true);
      toast.promise(updateCustomer(customer?.id, values), {
        loading: t('toast.loading'),
        success: t('toast.success'),
        error: t('toast.failed')
      });
    }
  });

  const isHeadOffice = formik.values.companyBranchCode === '00000';

  const handleHeadOfficeToggle = (checked: boolean) => {
    if (checked) {
      formik.setFieldValue('companyBranchCode', '00000');
      formik.setFieldValue('companyBranchName', 'สำนักงานใหญ่');
    } else {
      formik.setFieldValue('companyBranchCode', '');
      formik.setFieldValue('companyBranchName', '');
    }
  };

  useEffect(() => {
    if (!customerData) return;

    setCustomer(customerData);
  }, [customerData]);

  return (
    <Page>
      <LoadingDialog open={isFetching} />
      <PageTitle title={customer?.customerName} />
      <Wrapper>
        <Grid container spacing={1}>
          <GridTextField item xs={12} sm={12}>
            <Typography variant="subtitle1" fontWeight={600}>
              {t('customerManagement.detail')}
            </Typography>
          </GridTextField>

          {/* customerName */}
          <GridTextField item xs={12} sm={6}>
            <TextField
              name="customerName"
              type="text"
              label={t('customerManagement.column.id')}
              fullWidth
              variant="outlined"
              value={customer?.id}
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              name="customerName"
              type="text"
              label={t('customerManagement.column.name')}
              fullWidth
              variant="outlined"
              value={formik.values.customerName}
              error={Boolean(formik.touched.customerName && formik.errors.customerName)}
              helperText={formik.touched.customerName && formik.errors.customerName}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>

          {/* type */}
          <GridTextField item xs={6} sm={6}>
            <TextField
              name="type"
              select
              fullWidth
              label={t('customerManagement.column.type')}
              disabled={isCustomerTypeFetching}
              InputLabelProps={{ shrink: true }}
              error={Boolean(formik.touched.type && formik.errors.type)}
              helperText={formik.touched.type && formik.errors.type}
              value={formik.values.type || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}>
              <MenuItem value="">{t('general.clearSelected')}</MenuItem>
              {customerTypeList?.map((option) => (
                <MenuItem key={option.code} value={option.code}>
                  {option.nameTh}
                </MenuItem>
              )) || []}
            </TextField>
          </GridTextField>

          {/* taxId */}
          <GridTextField item xs={12} sm={6}>
            <TextField
              name="taxId"
              type="text"
              label={t('customerManagement.column.taxId')}
              fullWidth
              variant="outlined"
              value={formik.values.taxId}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.taxId && formik.errors.taxId)}
              helperText={formik.touched.taxId && formik.errors.taxId}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>

          {/* Company block */}
          {formik.values.type === 'COMPANY' ? (
            <>
              <GridTextField item xs={6} md={6}>
                <TextField
                  name="companyBranchCode"
                  type="text"
                  label={t('customerManagement.column.company.branchCode')}
                  fullWidth
                  variant="outlined"
                  disabled={formik.values.companyBranchCode === '00000'}
                  value={formik.values.companyBranchCode}
                  onChange={formik.handleChange} // ← fix: previously set branchNumber
                  onBlur={formik.handleBlur}
                  error={Boolean(
                    formik.touched.companyBranchCode && formik.errors.companyBranchCode
                  )}
                  helperText={formik.touched.companyBranchCode && formik.errors.companyBranchCode}
                  InputLabelProps={{ shrink: true }}
                />
              </GridTextField>

              <GridTextField item xs={6} md={6}>
                <TextField
                  name="companyBranchName"
                  type="text"
                  label={t('customerManagement.column.company.branchName')}
                  fullWidth
                  variant="outlined"
                  disabled={formik.values.companyBranchCode === '00000'}
                  value={formik.values.companyBranchName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={Boolean(
                    formik.touched.companyBranchName && formik.errors.companyBranchName
                  )}
                  helperText={formik.touched.companyBranchName && formik.errors.companyBranchName}
                  InputLabelProps={{ shrink: true }}
                />
              </GridTextField>
            </>
          ) : null}

          {/* email */}
          <GridTextField item xs={6} sm={6}>
            <TextField
              name="email"
              type="text"
              label={t('customerManagement.column.email')}
              fullWidth
              variant="outlined"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.email && formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>

          {/* creditTerm */}
          <GridTextField item xs={12} sm={6}>
            <TextField
              name="creditTerm"
              select
              fullWidth
              label={t('customerManagement.column.creditTerm')}
              InputLabelProps={{ shrink: true }}
              error={Boolean(formik.touched.creditTerm && formik.errors.creditTerm)}
              helperText={formik.touched.creditTerm && formik.errors.creditTerm}
              value={formik.values.creditTerm ?? ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={isCreditTermFetching}>
              <MenuItem value="">{t('general.clearSelected')}</MenuItem>
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
              InputProps={{ readOnly: true }}
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
              disabled={isSalesFetching || !canEdit}>
              <MenuItem value="">{t('general.clearSelected')}</MenuItem>
              {salesOptions.map((option) => (
                <MenuItem key={option.salesId} value={option.salesId}>
                  {`${option.salesId} - ${option.nickname || option.name}`}
                </MenuItem>
              ))}
            </TextField>
          </GridTextField>
        </Grid>
      </Wrapper>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Wrapper>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6">{t('customerManagement.column.address.title')}</Typography>
              </Grid>
              {customer?.addresses?.map((address, index) => (
                <Grid item xs={12} key={address.id || index}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: '#fafafa'
                      }
                    }}>
                    <Stack spacing={1}>
                      {/* Label */}
                      {address.label && (
                        <Typography variant="subtitle2" sx={{ color: '#888', fontWeight: 500 }}>
                          {address.label}
                        </Typography>
                      )}

                      {/* Address */}
                      <Typography variant="body2" sx={{ color: '#555' }}>
                        {(() => {
                          const isBangkok = address.province === 'กรุงเทพมหานคร';

                          const subdistrictPrefix = isBangkok ? 'แขวง' : 'ตำบล';
                          const districtPrefix = isBangkok ? 'เขต' : 'อำเภอ';

                          return [
                            address.addressLine1,
                            address.addressLine2,
                            address.subdistrict && `${subdistrictPrefix}${address.subdistrict}`,
                            address.district && `${districtPrefix}${address.district}`,
                            address.province && `จังหวัด${address.province}`,
                            address.postcode
                          ]
                            .filter(Boolean)
                            .join(' ');
                        })()}
                      </Typography>

                      {/* Tags */}
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        {address.isDefault && (
                          <Chip
                            label="ค่าเริ่มต้น"
                            size="small"
                            sx={{
                              borderColor: '#ff5722',
                              color: '#ff5722'
                            }}
                            variant="outlined"
                          />
                        )}

                        {address.addressType && (
                          <Chip
                            label={t(`customerManagement.column.addressType.${address.addressType?.toLowerCase()}`)}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Wrapper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Wrapper>
            <Grid container spacing={2}>
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6">{t('customerManagement.column.contacts')}</Typography>
              </Grid>

              {customer?.contacts?.map((contact, index) => (
                <Grid item xs={12} key={contact.id || index}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: '#fafafa'
                      }
                    }}>
                    <Stack direction="row" spacing={2} alignItems="center">

                      {/* Person Icon */}
                      <Person sx={{ fontSize: 32 }} />

                      {/* Contact Info */}
                      <Stack spacing={0.5}>
                        <Typography variant="body1" fontWeight={600}>
                          {contact.contactName || '-'}
                        </Typography>

                        <Typography variant="body2" sx={{ color: '#666' }}>
                          {contact.contactNumber || '-'}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Wrapper>
        </Grid>
      </Grid>

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
              history.push(ROUTE_PATHS.CUSTOMER_MANAGEMENT);
            }}
            startIcon={<ArrowBackIos />}>
            {t('button.back')}
          </Button>
          {/* <Button
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
              setActionType('update');
              setTitle(t('customerManagement.updateCustomer'));
              setMsg(t('customerManagement.confirmMsgUpdateCustomer'));
              setVisibleConfirmationDialog(true);
            }}
            startIcon={<Save />}>
            {t('button.update')}
          </Button> */}
        </Stack>
      </Wrapper>
      <ConfirmDialog
        open={visibleConfirmationDialog}
        title={title}
        message={msg}
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        onConfirm={() => {
          if (actionType === 'add') {
            dropOffFormik.handleSubmit();
          } else if (actionType === 'delete') {
            removeCustomerDropOff();
          } else if (actionType === 'back') {
            history.push(ROUTE_PATHS.CUSTOMER_MANAGEMENT);
          } else if (actionType === 'clear') {
            formik.resetForm();
          } else if (actionType === 'update') {
            formik.handleSubmit();
          }
          setVisibleConfirmationDialog(false);
        }}
        onCancel={() => setVisibleConfirmationDialog(false)}
        isShowCancelButton={true}
        isShowConfirmButton={true}
      />
    </Page >
  );
}
