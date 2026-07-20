import { Add, ArrowBackIos, Cancel, DeleteOutline, Edit, Person, Save } from '@mui/icons-material';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import ConfirmDialog from 'components/ConfirmDialog';
import ActivityHistoryTimeline from 'components/ActivityHistoryTimeline';
import PageTitle from 'components/PageTitle';
import { GridTextField, Wrapper } from 'components/Styled';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { useEffect, useMemo, useState, SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { getDistrict, getProvince, getSubDistrict } from 'services/Address/address-api';
import {
  addCustomerContact,
  addCustomerAddress,
  getCustomer,
  removeCustomerAddress,
  removeCustomerContact,
  updateCustomer
} from 'services/Customer/customer-api';
import { getActivityHistory } from 'services/ActivityHistory/activity-history-api';
import {
  Address,
  Contact,
  CreateCustomerAddressRequest,
  CreateCustomerContactRequest,
  Customer,
  UpdateCustomerRequest
} from 'services/Customer/customer-type';
import { GROUP_CODE } from 'services/Config/config-type';
import { getSystemConfig } from 'services/Config/config-api';
import { getSales } from 'services/Sales/sales-api';
import toast from 'react-hot-toast';
import LoadingDialog from 'components/LoadingDialog';
import { PERMISSIONS } from 'auth/permissions';
import Can from 'auth/Can';

export interface CustomerParam {
  id: string;
}

export default function CustomerDetail(): JSX.Element {
  const TabPanel = ({
    children,
    currentTab,
    value
  }: {
    children: React.ReactNode;
    currentTab: 'detail' | 'history';
    value: 'detail' | 'history';
  }) => {
    if (currentTab !== value) {
      return null;
    }
    return <>{children}</>;
  };

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
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [actionType, setActionType] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [msg, setMsg] = useState<string>('');
  const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [tab, setTab] = useState<'detail' | 'history'>('detail');
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const {
    data: customerData,
    refetch: customerRefetch,
    isFetching
  } = useQuery(['customer', params.id], () => getCustomer(params.id), {
    refetchOnWindowFocus: false
  });
  const {
    data: activityHistory = [],
    isFetching: isActivityHistoryFetching,
    refetch: refetchActivityHistory
  } = useQuery(['customer-activity-history', params.id], () => getActivityHistory('CUSTOMER', params.id), {
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
  const { data: paymentTermList, isFetching: isPaymentTermFetching } = useQuery(
    ['payment-term-list', GROUP_CODE.CUSTOMER_PAYMENT_TERM],
    () => getSystemConfig(GROUP_CODE.CUSTOMER_PAYMENT_TERM),
    { refetchOnWindowFocus: false }
  );
  const { data: customerTierList, isFetching: isCustomerTierFetching } = useQuery(
    ['customer-tier', GROUP_CODE.CUSTOMER_TIER],
    () => getSystemConfig(GROUP_CODE.CUSTOMER_TIER),
    { refetchOnWindowFocus: false }
  );
  const { data: customerSegmentList, isFetching: isCustomerSegmentFetching } = useQuery(
    ['customer-segment', GROUP_CODE.CUSTOMER_SEGMENT],
    () => getSystemConfig(GROUP_CODE.CUSTOMER_SEGMENT),
    { refetchOnWindowFocus: false }
  );
  const { data: salesOptions = [], isFetching: isSalesFetching } = useQuery(
    'customer-sales-options',
    () => getSales(1, 20),
    { refetchOnWindowFocus: false }
  );
  const { data: provinces = [] } = useQuery('province', () => getProvince(), {
    refetchOnWindowFocus: false
  });
  const { data: districts = [] } = useQuery('district', () => getDistrict(), {
    refetchOnWindowFocus: false
  });
  const { data: subdistricts = [] } = useQuery('subdistrict', () => getSubDistrict(), {
    refetchOnWindowFocus: false
  });

  const getSalesLabels = (salesIds: string[]) =>
    salesIds
      .map((salesId) => {
        const selectedSales = salesOptions.find((option) => option.salesId === salesId);
        return selectedSales ? `${selectedSales.salesId} - ${selectedSales.nickname || selectedSales.name}` : salesId;
      })
      .join(', ');

  const initialValues = useMemo(
    () => ({
      customerName: customer?.customerName ?? '',
      email: customer?.email ?? '',
      type: customer?.customerType?.code ?? '',
      tier: customer?.customerTier?.code ?? '',
      segment: customer?.customerSegment?.code ?? '',
      taxId: customer?.taxId ?? '',
      companyName: customer?.companyName ?? '',
      companyBranchCode: customer?.branchNumber ?? '',
      companyBranchName: customer?.branchName ?? '',
      creditTerm: customer?.customerCreditTerm?.code ?? '',
      paymentTerm: customer?.customerPaymentTerm?.code ?? '',
      salesAccounts: customer?.salesAccounts?.length
        ? customer.salesAccounts
        : customer?.salesAccount
          ? [customer.salesAccount]
          : [],
      coSalesAccount: customer?.coSalesAccount ?? ''
    }),
    [customer]
  );

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      // customerName: Yup.string()
      //   .max(255)
      //   .required(t('customerManagement.message.validateCustomerName')),
      type: Yup.string().max(255).required(t('customerManagement.message.validateType')),
      tier: Yup.string().max(255).nullable(),
      segment: Yup.string().max(255).nullable(),
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
      paymentTerm: Yup.string().max(255).required(t('customerManagement.message.validatePaymentTerm'))
    }),
    onSubmit: (values, actions) => {
      actions.setSubmitting(true);
      const payload: UpdateCustomerRequest = {
        customerName: values.customerName || null,
        customerType: values.type || null,
        customerTier: values.tier || null,
        customerSegment: values.segment || null,
        email: values.email || null,
        taxId: values.taxId || null,
        companyName: values.companyName || null,
        branchNumber: values.companyBranchCode || null,
        branchName: values.companyBranchName || null,
        creditTerm: values.creditTerm || null,
        paymentTerm: values.paymentTerm || null,
        salesAccount: values.salesAccounts[0] || null,
        salesAccounts: values.salesAccounts,
        coSalesAccount: values.coSalesAccount || null
      };
      const updatePromise = updateCustomer(customer?.id, payload);

      toast.promise(updatePromise, {
        loading: t('toast.loading'),
        success: () => {
          setCanEdit(false);
          customerRefetch();
          refetchActivityHistory();
          return t('toast.success');
        },
        error: t('toast.failed')
      });

      updatePromise.finally(() => {
        actions.setSubmitting(false);
      });
    }
  });

  const isHeadOffice = formik.values.companyBranchCode === '00000';

  useEffect(() => {
    if (!customerData) return;

    setCustomer(customerData);
    setAddresses(customerData.addresses ?? []);
  }, [customerData]);

  const handleStartEdit = () => {
    formik.resetForm();
    setCanEdit(true);
  };

  const handleCancelEdit = () => {
    formik.resetForm();
    setAddresses(customer?.addresses ?? []);
    setCanEdit(false);
  };

  const buildFullAddress = (address: {
    addressLine1: string;
    addressLine2: string;
    subdistrict: string;
    district: string;
    province: string;
    postcode: string;
  }) => {
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
  };

  const addressDialogFormik = useFormik({
    initialValues: {
      addressType: 'BILLING',
      isDefault: addresses.length === 0,
      label: '',
      addressLine1: '',
      addressLine2: '',
      province: '',
      district: '',
      subdistrict: '',
      postcode: '',
      country: 'TH'
    },
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      addressType: Yup.string().required(t('customerManagement.column.address.type')),
      addressLine1: Yup.string().required(t('customerManagement.message.validateAddress')),
      province: Yup.string().required(t('customerManagement.message.validateProvince')),
      district: Yup.string().required(t('customerManagement.message.validateDistrict')),
      subdistrict: Yup.string().required(t('customerManagement.message.validateSubdistrict')),
      country: Yup.string().required(t('customerManagement.column.address.country'))
    }),
    onSubmit: () => undefined
  });

  const openAddressDialog = () => {
    addressDialogFormik.resetForm({
      values: {
        addressType: 'BILLING',
        isDefault: addresses.length === 0,
        label: '',
        addressLine1: '',
        addressLine2: '',
        province: '',
        district: '',
        subdistrict: '',
        postcode: '',
        country: 'TH'
      }
    });
    setIsAddressDialogOpen(true);
  };

  const getAddressPayload = (): CreateCustomerAddressRequest => {
    const values = addressDialogFormik.values;
    const selectedProvince = provinces.find((item) => item.id === values.province);
    const selectedDistrict = districts.find((item) => item.id === values.district);
    const selectedSubdistrict = subdistricts.find((item) => item.id === values.subdistrict);

    return {
      addressType: values.addressType,
      isDefault: values.isDefault,
      label: values.label,
      addressLine1: values.addressLine1,
      addressLine2: values.addressLine2,
      subdistrict: selectedSubdistrict?.nameTh,
      district: selectedDistrict?.nameTh,
      province: selectedProvince?.nameTh,
      postcode: values.postcode,
      country: values.country
    };
  };

  const handleAddressSaveClick = async () => {
    const errors = await addressDialogFormik.validateForm();
    addressDialogFormik.setTouched({
      addressType: true,
      label: true,
      addressLine1: true,
      addressLine2: true,
      province: true,
      district: true,
      subdistrict: true,
      postcode: true,
      country: true
    });

    if (Object.keys(errors).length > 0) return;

    setActionType('add-address');
    setTitle(t('customerManagement.column.address.addNew'));
    setMsg(t('customerManagement.confirmMsgAddCustomerAddress'));
    setVisibleConfirmationDialog(true);
  };

  const handleConfirmAddAddress = () => {
    addressDialogFormik.setSubmitting(true);
    const addAddressPromise = addCustomerAddress(customer?.id, getAddressPayload());

    toast.promise(addAddressPromise, {
      loading: t('toast.loading'),
      success: () => {
        customerRefetch();
        refetchActivityHistory();
        addressDialogFormik.resetForm();
        setIsAddressDialogOpen(false);
        return t('toast.success');
      },
      error: t('toast.failed')
    });

    addAddressPromise.finally(() => {
      addressDialogFormik.setSubmitting(false);
    });
  };

  const handleDeleteAddressClick = (address: Address) => {
    setSelectedAddress(address);
    setActionType('delete-address');
    setTitle(t('button.delete'));
    setMsg(
      t('customerManagement.confirmMsgDeleteCustomerAddress', {
        label: address.label || address.fullAddress || address.addressLine1
      })
    );
    setVisibleConfirmationDialog(true);
  };

  const handleConfirmDeleteAddress = () => {
    if (!customer?.id || !selectedAddress?.id) return;

    const deleteAddressPromise = removeCustomerAddress(customer.id, selectedAddress.id);

    toast.promise(deleteAddressPromise, {
      loading: t('toast.loading'),
      success: () => {
        customerRefetch();
        refetchActivityHistory();
        setSelectedAddress(null);
        return t('toast.success');
      },
      error: t('toast.failed')
    });
  };

  const handleDeleteContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setActionType('delete-contact');
    setTitle(t('button.delete'));
    setMsg(
      t('customerManagement.confirmMsgDeleteCustomerContact', {
        name: contact.contactName || '-'
      })
    );
    setVisibleConfirmationDialog(true);
  };

  const handleConfirmDeleteContact = () => {
    if (!customer?.id || !selectedContact?.id) return;

    const deleteContactPromise = removeCustomerContact(customer.id, selectedContact.id);

    toast.promise(deleteContactPromise, {
      loading: t('toast.loading'),
      success: () => {
        customerRefetch();
        refetchActivityHistory();
        setSelectedContact(null);
        return t('toast.success');
      },
      error: t('toast.failed')
    });
  };

  const contactDialogFormik = useFormik({
    initialValues: {
      contactName: '',
      contactNumber: ''
    },
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      contactName: Yup.string()
        .max(255)
        .required(t('customerManagement.message.validateContactName')),
      contactNumber: Yup.string()
        .matches(/^[0-9]{9,10}$/, t('customerManagement.message.invalidPhoneNumberFormat'))
        .required(t('customerManagement.message.validateContactNumber'))
    }),
    onSubmit: () => undefined
  });

  const openContactDialog = () => {
    contactDialogFormik.resetForm({
      values: {
        contactName: '',
        contactNumber: ''
      }
    });
    setIsContactDialogOpen(true);
  };

  const getContactPayload = (): CreateCustomerContactRequest => ({
    contactName: contactDialogFormik.values.contactName,
    contactNumber: contactDialogFormik.values.contactNumber
  });

  const handleContactSaveClick = async () => {
    const errors = await contactDialogFormik.validateForm();
    contactDialogFormik.setTouched({
      contactName: true,
      contactNumber: true
    });

    if (Object.keys(errors).length > 0) return;

    setActionType('add-contact');
    setTitle(t('customerManagement.addContact'));
    setMsg(t('customerManagement.confirmMsgAddCustomerContact'));
    setVisibleConfirmationDialog(true);
  };

  const handleConfirmAddContact = () => {
    contactDialogFormik.setSubmitting(true);
    const addContactPromise = addCustomerContact(customer?.id, getContactPayload());

    toast.promise(addContactPromise, {
      loading: t('toast.loading'),
      success: () => {
        customerRefetch();
        refetchActivityHistory();
        contactDialogFormik.resetForm();
        setIsContactDialogOpen(false);
        return t('toast.success');
      },
      error: t('toast.failed')
    });

    addContactPromise.finally(() => {
      contactDialogFormik.setSubmitting(false);
    });
  };

  return (
    <Page>
      <LoadingDialog
        open={
          isFetching ||
          formik.isSubmitting ||
          addressDialogFormik.isSubmitting ||
          contactDialogFormik.isSubmitting
        }
      />
      <PageTitle title={customer?.customerName} />
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
          {canEdit ? (
            <>
              <Button
                fullWidth={isDownSm}
                variant="contained"
                className="btn-amber-orange"
                onClick={handleCancelEdit}
                startIcon={<Cancel />}>
                {t('button.cancel')}
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
              </Button>
            </>
          ) : (
            <Can permission={PERMISSIONS.CUSTOMER_EDIT}>
              <Button
                fullWidth={isDownSm}
                variant="contained"
                className="btn-emerald-green"
                onClick={handleStartEdit}
                startIcon={<Edit />}>
                {t('button.edit')}
              </Button>
            </Can>
          )}
        </Stack>
      </Wrapper>
      <Tabs
        value={tab}
        onChange={(_event: SyntheticEvent, value: 'detail' | 'history') => setTab(value)}
        sx={{ mt: 2, mb: 2 }}>
        <Tab value="detail" label={t('customerManagement.detail')} />
        <Tab value="history" label={t('customerManagement.history')} />
      </Tabs>

      <TabPanel currentTab={tab} value="detail">
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
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.customerName && formik.errors.customerName)}
                helperText={formik.touched.customerName && formik.errors.customerName}
                InputLabelProps={{ shrink: true }}
                InputProps={{ readOnly: !canEdit }}
              />
            </GridTextField>

            {/* type */}
            <GridTextField item xs={6} sm={6}>
              <TextField
                name="type"
                select
                fullWidth
                label={t('customerManagement.column.type')}
                disabled={isCustomerTypeFetching || !canEdit}
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
                InputProps={{ readOnly: !canEdit }}
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
                    disabled={!canEdit || formik.values.companyBranchCode === '00000'}
                    value={formik.values.companyBranchCode}
                    onChange={formik.handleChange}
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
                    disabled={!canEdit || formik.values.companyBranchCode === '00000'}
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
                InputProps={{ readOnly: !canEdit }}
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
                disabled={isCreditTermFetching || !canEdit}>
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
                name="paymentTerm"
                select
                fullWidth
                label={t('customerManagement.column.paymentTerm')}
                InputLabelProps={{ shrink: true }}
                error={Boolean(formik.touched.paymentTerm && formik.errors.paymentTerm)}
                helperText={formik.touched.paymentTerm && formik.errors.paymentTerm}
                value={formik.values.paymentTerm ?? ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={isPaymentTermFetching || !canEdit}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {paymentTermList?.map((option) => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.nameTh}
                  </MenuItem>
                )) || []}
              </TextField>
            </GridTextField>

            {/* tier */}
            <GridTextField item xs={6} sm={6}>
              <TextField
                name="tier"
                select
                fullWidth
                label={t('customerManagement.column.tier')}
                disabled={isCustomerTierFetching || !canEdit}
                InputLabelProps={{ shrink: true }}
                error={Boolean(formik.touched.tier && formik.errors.tier)}
                helperText={formik.touched.tier && formik.errors.tier}
                value={formik.values.tier || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {customerTierList?.map((option) => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.nameEn}
                  </MenuItem>
                )) || []}
              </TextField>
            </GridTextField>

            {/* segment */}
            <GridTextField item xs={6} sm={6}>
              <TextField
                name="segment"
                select
                fullWidth
                label={t('customerManagement.column.segment')}
                disabled={isCustomerSegmentFetching || !canEdit}
                InputLabelProps={{ shrink: true }}
                error={Boolean(formik.touched.segment && formik.errors.segment)}
                helperText={formik.touched.segment && formik.errors.segment}
                value={formik.values.segment || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {customerSegmentList?.map((option) => (
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
                disabled={isSalesFetching || !canEdit}
                SelectProps={{
                  multiple: true,
                  renderValue: (selected) => getSalesLabels(selected as string[])
                }}>
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
                onBlur={formik.handleBlur}
                variant="outlined"
                value={formik.values.coSalesAccount}
                InputLabelProps={{ shrink: true }}
                InputProps={{ readOnly: !canEdit }}
              />
            </GridTextField>
          </Grid>
        </Wrapper>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Wrapper>
              <Grid container spacing={2}>
                <Grid
                  item
                  xs={12}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1,
                    minHeight: 40
                  }}>
                  <Typography variant="h6">{t('customerManagement.column.address.title')}</Typography>
                  <Can permission={PERMISSIONS.CUSTOMER_EDIT}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Add />}
                      onClick={openAddressDialog}>
                      {t('customerManagement.column.address.addNew')}
                    </Button>
                  </Can>
                </Grid>
                {addresses.map((address, index) => (
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
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                          {/* Label */}
                          {address.label && (
                            <Typography variant="subtitle2" sx={{ color: '#888', fontWeight: 500 }}>
                              {address.label}
                            </Typography>
                          )}

                          {/* Address */}
                          <Typography variant="body2" sx={{ color: '#555' }}>
                            {buildFullAddress(address)}
                          </Typography>

                          {/* Tags */}
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            {address.isDefault && (
                              <Chip
                                label="ค่าเริ่มต้น"
                                size="small"
                                sx={{
                                  bgcolor: '#ff5722',
                                  color: '#000'
                                }}
                              />
                            )}

                            {address.addressType && (
                              <Chip
                                label={t(
                                  `customerManagement.column.addressType.${address.addressType?.toLowerCase()}`
                                )}
                                size="small"
                              />
                            )}
                          </Stack>
                        </Stack>

                        <Stack direction="row" justifyContent="flex-end">
                          <Can permission={PERMISSIONS.CUSTOMER_EDIT}>
                            <IconButton
                              size="small"
                              color="error"
                              aria-label={t('button.delete')}
                              onClick={() => handleDeleteAddressClick(address)}>
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </Can>
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
                <Grid
                  item
                  xs={12}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1,
                    minHeight: 40
                  }}>
                  <Typography variant="h6">{t('customerManagement.column.contacts')}</Typography>
                  <Can permission={PERMISSIONS.CUSTOMER_EDIT}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Add />}
                      onClick={openContactDialog}>
                      {t('customerManagement.addContact')}
                    </Button>
                  </Can>
                </Grid>

                {customer?.contacts?.map((contact: Contact, index) => (
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
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="center"
                          sx={{ flex: 1, minWidth: 0 }}>
                          <Person sx={{ fontSize: 32 }} />

                          <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body1" fontWeight={600}>
                              {contact.contactName || '-'}
                            </Typography>

                            <Typography variant="body2" sx={{ color: '#666' }}>
                              {contact.contactNumber || '-'}
                            </Typography>
                          </Stack>
                        </Stack>

                        <Stack direction="row" justifyContent="flex-end">
                          <Can permission={PERMISSIONS.CUSTOMER_EDIT}>
                            <IconButton
                              size="small"
                              color="error"
                              aria-label={t('button.delete')}
                              onClick={() => handleDeleteContactClick(contact)}>
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </Can>
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
            {canEdit ? (
              <>
                <Button
                  fullWidth={isDownSm}
                  variant="contained"
                  className="btn-amber-orange"
                  onClick={handleCancelEdit}
                  startIcon={<Cancel />}>
                  {t('button.cancel')}
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
                </Button>
              </>
            ) : (
              <Can permission={PERMISSIONS.CUSTOMER_EDIT}>
                <Button
                  fullWidth={isDownSm}
                  variant="contained"
                  className="btn-emerald-green"
                  onClick={handleStartEdit}
                  startIcon={<Edit />}>
                  {t('button.edit')}
                </Button>
              </Can>
            )}
          </Stack>
        </Wrapper>
      </TabPanel>

      <TabPanel currentTab={tab} value="history">
        <Wrapper>
          <Grid container spacing={1}>
            <GridTextField item xs={12} sm={12}>
              <Typography variant="subtitle1" fontWeight={600}>
                {t('customerManagement.history')}
              </Typography>
            </GridTextField>
            <GridTextField item xs={12}>
              {isActivityHistoryFetching ? null : (
                <ActivityHistoryTimeline records={activityHistory} />
              )}
            </GridTextField>
          </Grid>
        </Wrapper>
      </TabPanel>
      <ConfirmDialog
        open={visibleConfirmationDialog}
        title={title}
        message={msg}
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        onConfirm={() => {
          if (actionType === 'clear') {
            formik.resetForm();
          } else if (actionType === 'add-address') {
            handleConfirmAddAddress();
          } else if (actionType === 'add-contact') {
            handleConfirmAddContact();
          } else if (actionType === 'delete-address') {
            handleConfirmDeleteAddress();
          } else if (actionType === 'delete-contact') {
            handleConfirmDeleteContact();
          } else if (actionType === 'update') {
            formik.handleSubmit();
          }
          setVisibleConfirmationDialog(false);
        }}
        onCancel={() => {
          if (actionType === 'delete-address') {
            setSelectedAddress(null);
          } else if (actionType === 'delete-contact') {
            setSelectedContact(null);
          }
          setVisibleConfirmationDialog(false);
        }}
        isShowCancelButton={true}
        isShowConfirmButton={true}
      />
      <Dialog
        open={isAddressDialogOpen}
        onClose={() => setIsAddressDialogOpen(false)}
        fullWidth
        maxWidth="sm">
        <DialogTitle>{t('customerManagement.column.address.addNew')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="addressType"
                select
                fullWidth
                label={t('customerManagement.column.address.type')}
                value={addressDialogFormik.values.addressType}
                onChange={addressDialogFormik.handleChange}
                onBlur={addressDialogFormik.handleBlur}
                error={Boolean(
                  addressDialogFormik.touched.addressType && addressDialogFormik.errors.addressType
                )}
                helperText={
                  addressDialogFormik.touched.addressType && addressDialogFormik.errors.addressType
                }
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="BILLING">
                  {t('customerManagement.column.addressType.billing')}
                </MenuItem>
                <MenuItem value="SHIPPING">
                  {t('customerManagement.column.addressType.shipping')}
                </MenuItem>
                <MenuItem value="OTHER">
                  {t('customerManagement.column.addressType.other')}
                </MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="label"
                type="text"
                label={t('customerManagement.column.address.label')}
                fullWidth
                value={addressDialogFormik.values.label}
                onChange={addressDialogFormik.handleChange}
                onBlur={addressDialogFormik.handleBlur}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="addressLine1"
                type="text"
                label={t('customerManagement.column.address.addressLine1')}
                fullWidth
                required
                value={addressDialogFormik.values.addressLine1}
                onChange={addressDialogFormik.handleChange}
                onBlur={addressDialogFormik.handleBlur}
                error={Boolean(
                  addressDialogFormik.touched.addressLine1 &&
                  addressDialogFormik.errors.addressLine1
                )}
                helperText={
                  addressDialogFormik.touched.addressLine1 &&
                  addressDialogFormik.errors.addressLine1
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="addressLine2"
                type="text"
                label={t('customerManagement.column.address.addressLine2')}
                fullWidth
                value={addressDialogFormik.values.addressLine2}
                onChange={addressDialogFormik.handleChange}
                onBlur={addressDialogFormik.handleBlur}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="province"
                select
                fullWidth
                label={t('customerManagement.column.address.province')}
                value={addressDialogFormik.values.province}
                onChange={(event) => {
                  addressDialogFormik.setFieldValue('province', event.target.value);
                  addressDialogFormik.setFieldValue('district', '');
                  addressDialogFormik.setFieldValue('subdistrict', '');
                  addressDialogFormik.setFieldValue('postcode', '');
                }}
                onBlur={addressDialogFormik.handleBlur}
                error={Boolean(
                  addressDialogFormik.touched.province && addressDialogFormik.errors.province
                )}
                helperText={
                  addressDialogFormik.touched.province && addressDialogFormik.errors.province
                }
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {provinces.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.nameTh}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="district"
                select
                fullWidth
                label={t('customerManagement.column.address.amphure')}
                value={addressDialogFormik.values.district}
                onChange={(event) => {
                  addressDialogFormik.setFieldValue('district', event.target.value);
                  addressDialogFormik.setFieldValue('subdistrict', '');
                  addressDialogFormik.setFieldValue('postcode', '');
                }}
                onBlur={addressDialogFormik.handleBlur}
                error={Boolean(
                  addressDialogFormik.touched.district && addressDialogFormik.errors.district
                )}
                helperText={
                  addressDialogFormik.touched.district && addressDialogFormik.errors.district
                }
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {districts
                  .filter((option) => option.provinceId === addressDialogFormik.values.province)
                  .map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.nameTh}
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="subdistrict"
                select
                fullWidth
                label={t('customerManagement.column.address.tumbon')}
                value={addressDialogFormik.values.subdistrict}
                onChange={(event) => {
                  const selected = subdistricts.find((item) => item.id === event.target.value);
                  addressDialogFormik.setFieldValue('subdistrict', selected?.id ?? '');
                  addressDialogFormik.setFieldValue('postcode', selected?.zipCode ?? '');
                }}
                onBlur={addressDialogFormik.handleBlur}
                error={Boolean(
                  addressDialogFormik.touched.subdistrict && addressDialogFormik.errors.subdistrict
                )}
                helperText={
                  addressDialogFormik.touched.subdistrict && addressDialogFormik.errors.subdistrict
                }
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {subdistricts
                  .filter((option) => option.districtId === addressDialogFormik.values.district)
                  .map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.nameTh}
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="postcode"
                type="text"
                label={t('customerManagement.column.address.postalCode')}
                fullWidth
                disabled
                value={addressDialogFormik.values.postcode}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="country"
                type="text"
                label={t('customerManagement.column.address.country')}
                fullWidth
                value={addressDialogFormik.values.country}
                onChange={addressDialogFormik.handleChange}
                onBlur={addressDialogFormik.handleBlur}
                error={Boolean(
                  addressDialogFormik.touched.country && addressDialogFormik.errors.country
                )}
                helperText={
                  addressDialogFormik.touched.country && addressDialogFormik.errors.country
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            variant="contained"
            className="btn-crimson-red"
            onClick={() => setIsAddressDialogOpen(false)}>
            {t('button.cancel')}
          </Button>
          <Button
            variant="contained"
            className="btn-emerald-green"
            onClick={handleAddressSaveClick}>
            {t('button.save')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={isContactDialogOpen}
        onClose={() => setIsContactDialogOpen(false)}
        fullWidth
        maxWidth="sm">
        <DialogTitle>{t('customerManagement.addContact')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="contactName"
                label={t('customerManagement.column.contactName')}
                fullWidth
                required
                value={contactDialogFormik.values.contactName}
                onChange={contactDialogFormik.handleChange}
                onBlur={contactDialogFormik.handleBlur}
                error={Boolean(
                  contactDialogFormik.touched.contactName && contactDialogFormik.errors.contactName
                )}
                helperText={
                  contactDialogFormik.touched.contactName && contactDialogFormik.errors.contactName
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="contactNumber"
                label={t('customerManagement.column.contactNumber')}
                fullWidth
                required
                value={contactDialogFormik.values.contactNumber}
                onChange={contactDialogFormik.handleChange}
                onBlur={contactDialogFormik.handleBlur}
                error={Boolean(
                  contactDialogFormik.touched.contactNumber &&
                  contactDialogFormik.errors.contactNumber
                )}
                helperText={
                  contactDialogFormik.touched.contactNumber &&
                  contactDialogFormik.errors.contactNumber
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            variant="contained"
            className="btn-crimson-red"
            onClick={() => setIsContactDialogOpen(false)}>
            {t('button.cancel')}
          </Button>
          <Button
            variant="contained"
            className="btn-emerald-green"
            onClick={handleContactSaveClick}>
            {t('button.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  );
}
