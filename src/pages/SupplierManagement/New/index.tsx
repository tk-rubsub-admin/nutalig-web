import {
  ArrowBackIos,
  Cancel,
  CheckBox,
  CheckBoxOutlineBlank,
  ContentCopy,
  Delete,
  PlaylistAdd,
  Save
} from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import PageTitle from 'components/PageTitle';
import { GridTextField, Wrapper } from 'components/Styled';
import * as Yup from 'yup';
import { FieldArray, FormikProvider, useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { getSystemConfig } from 'services/Config/config-api';
import { GROUP_CODE, SystemConfig } from 'services/Config/config-type';
import AddressDialog from './AddressDialog';
import {
  createSupplier,
  getSupplierType,
  uploadSupplierProfileImage
} from 'services/Supplier/supplier-api';
import {
  CreateSupplierRequest,
  CreateSupplierResponse,
  SupplierAccount,
  SupplierType
} from 'services/Supplier/supplier-type';
import { getAmphure, getProvince, getTumbon } from 'services/Address/address-api';
import { Address } from 'services/Address/address-type';
import toast from 'react-hot-toast';
import { useHistory } from 'react-router-dom';
import ConfirmDialog from 'components/ConfirmDialog';
import ImageFileUploaderWrapper from 'components/ImageFileUploaderWrapper';
import FileUploader from 'components/FileUploader';
import {
  dayColors,
  dayOfWeek,
  supplierProductTypeNoNeedToSelectProduct,
  supplierProductTypeNotDisplay,
  timeRange
} from 'utils/constant';
import styled from 'styled-components';
import { searchProduct } from 'services/Product/product-api';
import { ProductDto } from 'services/Product/product-type';
import { resizeFile } from 'utils';
import React from 'react';

const NoArrowTextField = styled(TextField)({
  '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
    display: 'none'
  },
  '& input[type=number]': {
    MozAppearance: 'textfield'
  }
});

export default function NewSupplier(): JSX.Element {
  const history = useHistory();
  const { t } = useTranslation();
  const theme = useTheme();
  const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
  const [address, setAddress] = useState<Address>();
  const [actionType, setActionType] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [msg, setMsg] = useState<string>('');
  const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
  const [isOpenAddressDialog, setIsOpenAddressDialog] = useState<boolean>(false);
  const [profileImageFiles, setProfileImageFiles] = useState<File[]>([]);
  const profileImageFileUrls = profileImageFiles.map((file) => URL.createObjectURL(file));
  const [createdSupplierId, setCreatedSupplierId] = useState('');
  const defaultProductFilter = {
    nameContain: '',
    skuContain: '',
    categoryEqual: '',
    groupEqual: '',
    subGroupEqual: '',
    parentSkuEqual: '',
    isIncludeParentSku: false
  };
  const { data: productsList, isFetching: isProductFetching } = useQuery(
    'search-product',
    () => searchProduct(defaultProductFilter, 1, 3000),
    {
      refetchOnWindowFocus: false
    }
  );
  const { data: creditTerm, isFetching: isCreditTermFetching } = useQuery(
    'credit-term',
    () => getSystemConfig(GROUP_CODE.CREDIT_TERM),
    {
      refetchOnWindowFocus: false
    }
  );
  const { data: paymentMethod, isFetching: isPaymentMethodFetching } = useQuery(
    'payment-method',
    () => getSystemConfig(GROUP_CODE.PAYMENT_METHOD),
    {
      refetchOnWindowFocus: false
    }
  );
  const { data: supplierProductType, isFetching: isSupplierProductTypeFetching } = useQuery(
    'supplier-product-type',
    () => getSystemConfig(GROUP_CODE.SUPPLIER_PRODUCT_TYPE),
    {
      refetchOnWindowFocus: false
    }
  );
  const { data: orderMethod, isFetching: isOrderMethodFetching } = useQuery(
    'order-method',
    () => getSystemConfig(GROUP_CODE.SUPPLIER_ORDER_METHOD),
    {
      refetchOnWindowFocus: false
    }
  );
  const { data: sendingMethod, isFetching: isSendingMethodFetching } = useQuery(
    'sending-method',
    () => getSystemConfig(GROUP_CODE.SUPPLIER_SENDING_METHOD),
    {
      refetchOnWindowFocus: false
    }
  );
  const { data: ranking, isFetching: isrankingFetching } = useQuery(
    'ranking',
    () => getSystemConfig(GROUP_CODE.SUPPLIER_RANKING),
    {
      refetchOnWindowFocus: false
    }
  );
  const { data: supplierTypes } = useQuery('supplier-type', () => getSupplierType(), {
    refetchOnWindowFocus: false
  });
  const { data: bankNames } = useQuery('bank-names', () => getSystemConfig(GROUP_CODE.BANK_NAME), {
    refetchOnWindowFocus: false
  });
  const { data: provinceList } = useQuery('province-list', () => getProvince(), {
    refetchOnWindowFocus: false
  });
  const { data: amphureList } = useQuery('amphure-list', () => getAmphure(), {
    refetchOnWindowFocus: false
  });
  const { data: tumbonList } = useQuery('tumbon-list', () => getTumbon(), {
    refetchOnWindowFocus: false
  });

  const formik = useFormik({
    initialValues: {
      supplierName: '',
      supplierShortName: '',
      supplierProductType: '',
      mainProduct: '',
      sellProduct: [],
      supplierRank: '',
      supplierType: '',
      status: 'ACTIVE',
      lineId: '',
      contactName: '',
      contactNumber: '',
      behavior: '',
      startWorkingHour: '',
      endWorkingHour: '',
      period: '',
      orderMethod: '',
      sendingMethod: '',
      senderName: '',
      address: '',
      tumbonId: '',
      amphureId: '',
      provinceId: '',
      location: '',
      creditTerm: '',
      paymentMethod: '',
      comment: '',
      typeId: [],
      days: dayOfWeek,
      accountList: []
    },
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      supplierName: Yup.string().max(255).required(t('supplierManagement.message.validateName')),
      supplierShortName: Yup.string()
        .max(255)
        .required(t('supplierManagement.message.validateShortName')),
      supplierProductType: Yup.string()
        .max(255)
        .required(t('supplierManagement.message.validateProductType')),
      mainProduct: Yup.string()
        .max(255)
        .required(t('supplierManagement.message.validateMainProduct')),
      contactName: Yup.string()
        .max(255)
        .required(t('supplierManagement.message.validateContactName')),
      contactNumber: Yup.string()
        .max(255)
        .required(t('supplierManagement.message.validateContactNumber')),
      creditTerm: Yup.string()
        .max(255)
        .required(t('supplierManagement.message.validateCreditTerm')),
      sellProduct: Yup.array().when('supplierProductType', {
        is: (value: string) => !supplierProductTypeNoNeedToSelectProduct.includes(value),
        then: Yup.array()
          .min(1, t('supplierManagement.message.validateSellProductRequired'))
          .required(t('supplierManagement.message.validateSellProductRequired')),
        otherwise: Yup.array().notRequired()
      }),
      accountList: Yup.array()
        .nullable()
        .of(
          Yup.object().shape({
            bankName: Yup.string().required(t('supplierManagement.message.validateBankName')),
            accountName: Yup.string().required(t('supplierManagement.message.validateAccountName')),
            accountNumber: Yup.string()
              .required(t('supplierManagement.message.validateAccountNo'))
              .matches(/^\d{10,12}$/, t('supplierManagement.message.validateAccountNoMatched'))
          })
        ),
      address: Yup.string().required(t('supplierManagement.message.validateAddress'))
    }),
    onSubmit: async (values) => {
      const createSupplierRequest: CreateSupplierRequest = {
        typeId: [values.supplierType],
        accountRequests: values.accountList,
        supplierName: values.supplierName,
        supplierShortName: values.supplierShortName,
        supplierProductType: values.supplierProductType,
        mainProduct: values.mainProduct,
        supplierRank: values.supplierRank,
        status: values.status,
        contactName: values.contactName,
        contactNumber: values.contactNumber,
        behavior: values.behavior,
        startWorkingHour: values.startWorkingHour,
        endWorkingHour: values.endWorkingHour,
        period: values.period,
        orderMethod: values.orderMethod,
        sendingMethod: values.sendingMethod,
        senderName: values.senderName,
        addressDetail: values.address,
        tumbonId: values.tumbonId,
        amphureId: values.amphureId,
        provinceId: values.provinceId,
        location: values.location,
        creditTerm: values.creditTerm,
        paymentMethod: values.paymentMethod,
        comment: '',
        openDays: values.days,
        lineId: values.lineId,
        sellProducts: values.sellProduct
      };
      console.log(JSON.stringify(createSupplierRequest));
      toast.promise(createSupplier(createSupplierRequest), {
        loading: t('toast.loading'),
        success: (res: CreateSupplierResponse) => {
          if (profileImageFiles.length !== 0) {
            uploadImage(res.data.id);
          }
          setCreatedSupplierId(res.data.id);
          return t('supplierManagement.message.createNewSupplierSuccess');
        },
        error: (err) => {
          return t('supplierManagement.message.createNewSupplierFailed', { err });
        }
      });
    }
  });

  const uploadImage = async (supId: string) => {
    const resizedFiles = await Promise.all(profileImageFiles.map((file) => resizeFile(file)));

    const formData = new FormData();
    resizedFiles.forEach((file) => {
      formData.append('picture', file);
    });
    toast.promise(uploadSupplierProfileImage(supId, formData), {
      loading: t('toast.loading'),
      success: () => {
        setCreatedSupplierId(supId);
        return t('toast.success');
      },
      error: (error) => {
        setCreatedSupplierId(supId);
        return t('toast.failed') + ' ' + error.message;
      }
    });
  };

  useEffect(() => {
    if (address !== undefined && address !== null) {
      formik.setFieldValue(
        'address',
        address.addressDetail +
        ' ,' +
        address.tumbon?.nameTh +
        ' ,' +
        address.amphure?.nameTh +
        ' ,' +
        address.province?.nameTh +
        ' ' +
        address.tumbon?.zipCode
      );
      formik.setFieldValue('address', address.addressDetail);
      formik.setFieldValue('tumbonId', address.tumbon?.id);
      formik.setFieldValue('amphureId', address.amphure?.id);
      formik.setFieldValue('provinceId', address.province?.id);
      formik.setFieldValue('location', address.location);
    }
  }, [address]);

  useEffect(() => {
    if (createdSupplierId !== '') {
      history.push(`/supplier/${createdSupplierId}`);
    }
  }, [createdSupplierId]);

  return (
    <Page>
      <PageTitle title={t('supplierManagement.action.create')} />
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
              setTitle(t('supplierManagement.message.createSupplierTitle'));
              setMsg(t('supplierManagement.message.createSupplierMsg'));
              setVisibleConfirmationDialog(true);
            }}
            startIcon={<Save />}>
            {t('button.create')}
          </Button>
        </Stack>
      </Wrapper>
      <Wrapper>
        <Grid container spacing={1}>
          <GridTextField item xs={12} sm={12}>
            <Typography>{t('supplierManagement.detail')}</Typography>
          </GridTextField>
          <GridTextField item xs={12} sm={12}>
            <Typography>{t('general.profileImage')}</Typography>
            <ImageFileUploaderWrapper
              id="logo-uploader-id"
              inputId="logo-id"
              isDisabled={false}
              readOnly={false}
              maxFiles={1}
              isMultiple={false}
              onError={() => { }}
              onDeleted={() => {
                setProfileImageFiles([]);
              }}
              onSuccess={(files) => {
                setProfileImageFiles(files);
              }}
              files={profileImageFileUrls}
              fileUploader={FileUploader}
              isError={false}
            />
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              label={t('supplierManagement.column.status')}
              fullWidth
              disabled
              variant="outlined"
              value={formik.values.status}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              // className={classes.customOutline}
              style={{ borderRadius: '50px' }}
              label={t('supplierManagement.column.rank')}
              fullWidth
              select
              variant="outlined"
              disabled={isrankingFetching}
              value={formik.values.supplierRank}
              onChange={({ target }) => formik.setFieldValue('supplierRank', target.value)}
              InputLabelProps={{ shrink: true }}>
              {ranking?.map((config: SystemConfig) => (
                <MenuItem key={config.groupCode + '-' + config.code} value={config.code}>
                  {config.nameTh}
                </MenuItem>
              ))}
            </TextField>
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              type="text"
              label={t('supplierManagement.column.id')}
              fullWidth
              disabled
              variant="outlined"
              placeholder={t('general.autoGenerated')}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              type="text"
              label={t('supplierManagement.column.name') + '*'}
              fullWidth
              onChange={({ target }) => {
                formik.setFieldValue('supplierName', target.value);
              }}
              variant="outlined"
              value={formik.values.supplierName}
              error={Boolean(formik.touched.supplierName && formik.errors.supplierName)}
              helperText={formik.touched.supplierName && formik.errors.supplierName}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              label={t('supplierManagement.column.shortName') + '*'}
              fullWidth
              onChange={({ target }) => {
                formik.setFieldValue('supplierShortName', target.value);
              }}
              variant="outlined"
              value={formik.values.supplierShortName}
              error={Boolean(formik.touched.supplierShortName && formik.errors.supplierShortName)}
              helperText={formik.touched.supplierShortName && formik.errors.supplierShortName}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              style={{ borderRadius: '50px' }}
              label={t('supplierManagement.column.types.title')}
              fullWidth
              select
              variant="outlined"
              value={formik.values.supplierType}
              onChange={({ target }) => {
                formik.setFieldValue('supplierType', target.value);
              }}
              error={Boolean(formik.touched.supplierType && formik.errors.supplierType)}
              helperText={formik.touched.supplierType && formik.errors.supplierType}
              InputLabelProps={{ shrink: true }}>
              {supplierTypes?.map((p: SupplierType) => (
                <MenuItem key={p.typeId} value={p.typeId}>
                  {p.typeIcon + ' ' + p.typeName}
                </MenuItem>
              ))}
            </TextField>
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              type="text"
              style={{ borderRadius: '50px' }}
              label={t('supplierManagement.column.productType') + '*'}
              fullWidth
              select
              variant="outlined"
              disabled={isSupplierProductTypeFetching}
              value={formik.values.supplierProductType}
              onChange={({ target }) => formik.setFieldValue('supplierProductType', target.value)}
              error={Boolean(
                formik.touched.supplierProductType && formik.errors.supplierProductType
              )}
              helperText={formik.touched.supplierProductType && formik.errors.supplierProductType}
              InputLabelProps={{ shrink: true }}>
              {supplierProductType
                ?.filter((sup) => !supplierProductTypeNotDisplay.includes(sup.code))
                .map((config: SystemConfig) => (
                  <MenuItem key={config.groupCode + '-' + config.code} value={config.code}>
                    {config.nameTh}
                  </MenuItem>
                ))}
            </TextField>
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              type="text"
              label={t('supplierManagement.column.mainProduct') + '*'}
              fullWidth
              variant="outlined"
              value={formik.values.mainProduct}
              onChange={({ target }) => formik.setFieldValue('mainProduct', target.value)}
              error={Boolean(formik.touched.mainProduct && formik.errors.mainProduct)}
              helperText={formik.touched.mainProduct && formik.errors.mainProduct}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          {!supplierProductTypeNoNeedToSelectProduct.includes(formik.values.supplierProductType) ? (
            <GridTextField item xs={12} sm={12}>
              <Autocomplete
                multiple
                disableCloseOnSelect
                disabled={isProductFetching}
                options={productsList?.data.products.map((option: ProductDto) => option) || []}
                getOptionLabel={(product: ProductDto) => product.productNameTh}
                isOptionEqualToValue={(option, value) => option.productSku === value.productSku} // important!
                filterOptions={(options, { inputValue }) => {
                  const search = inputValue.toLowerCase();

                  // 1. Filter ตามชื่อหรือ keyword
                  const filtered = options.filter((option) => {
                    const keyword = (option.keywords || '').toLowerCase();
                    const name = (option.productNameTh || '').toLowerCase();
                    return name.includes(search) || keyword.includes(search);
                  });

                  // 2. Distinct ตาม productId
                  const seen = new Set();
                  const distinct = [];
                  for (const product of filtered) {
                    if (!seen.has(product.productSku)) {
                      seen.add(product.productSku);
                      distinct.push(product);
                    }
                  }

                  return distinct;
                }}
                renderOption={(props, option) => (
                  <li {...props} key={option.productId}>
                    {option.productNameTh}
                  </li>
                )}
                value={formik.values.sellProduct}
                onChange={(_event, value: ProductDto[]) => {
                  formik.setFieldValue('sellProduct', value);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('supplierManagement.column.sellProduct') + '*'}
                    InputLabelProps={{ shrink: true }}
                    error={Boolean(formik.touched.sellProduct && formik.errors.sellProduct)}
                    helperText={formik.touched.sellProduct && formik.errors.sellProduct}
                  />
                )}
              />
            </GridTextField>
          ) : (
            <></>
          )}
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              label={t('supplierManagement.column.contactName') + '*'}
              fullWidth
              variant="outlined"
              value={formik.values.contactName}
              onChange={({ target }) => formik.setFieldValue('contactName', target.value)}
              error={Boolean(formik.touched.contactName && formik.errors.contactName)}
              helperText={formik.touched.contactName && formik.errors.contactName}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              label={t('supplierManagement.column.contactNumber') + '*'}
              fullWidth
              variant="outlined"
              value={formik.values.contactNumber}
              onChange={({ target }) => formik.setFieldValue('contactNumber', target.value)}
              error={Boolean(formik.touched.contactNumber && formik.errors.contactNumber)}
              helperText={formik.touched.contactNumber && formik.errors.contactNumber}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={12}>
            <TextField
              type="text"
              label={'Line ID'}
              fullWidth
              variant="outlined"
              value={formik.values.lineId}
              onChange={({ target }) => formik.setFieldValue('lineId', target.value)}
              error={Boolean(formik.touched.lineId && formik.errors.lineId)}
              helperText={formik.touched.lineId && formik.errors.lineId}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={12}>
            <TextField
              type="text"
              label={t('supplierManagement.column.phoneContactName')}
              fullWidth
              disabled
              variant="outlined"
              placeholder={t('general.autoGenerated')}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton disabled={true}>
                      <ContentCopy color="disabled" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={12}>
            <TextField
              type="text"
              label={t('supplierManagement.column.lineContactName')}
              fullWidth
              disabled
              variant="outlined"
              placeholder={t('general.autoGenerated')}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton disabled={true}>
                      <ContentCopy color="disabled" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={12}>
            <TextField
              type="text"
              label={t('supplierManagement.column.behavior')}
              fullWidth
              variant="outlined"
              value={formik.values.behavior}
              onChange={({ target }) => formik.setFieldValue('behavior', target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={8}>
            <Autocomplete
              multiple
              options={dayOfWeek}
              disableCloseOnSelect
              getOptionLabel={(option) => t(`days.${option}`)}
              value={formik.values.days} // <-- current value from Formik
              onChange={(event, value) => formik.setFieldValue('days', value)} // <-- update Formik
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    key={option}
                    label={t(`days.${option}`)}
                    {...getTagProps({ index })}
                    style={{
                      backgroundColor: dayColors[option] || '#e0e0e0',
                      color: '#000'
                    }}
                  />
                ))
              }
              renderOption={(props, option, { selected }) => {
                const { key, ...optionProps } = props;
                return (
                  <li key={key} {...optionProps}>
                    <Checkbox
                      icon={<CheckBoxOutlineBlank fontSize="small" />}
                      checkedIcon={<CheckBox fontSize="small" />}
                      style={{ marginRight: 8 }}
                      checked={selected}
                    />
                    {t(`days.${option}`)}
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('supplierManagement.column.period')}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </GridTextField>
          <GridTextField item xs={6} sm={2}>
            <TextField
              type="text"
              label={t('supplierManagement.column.startWorkingHour')}
              fullWidth
              select
              variant="outlined"
              value={formik.values.startWorkingHour}
              onChange={({ target }) => {
                if (target.value === 'เปิด 24 ชั่วโมง') {
                  formik.setFieldValue('startWorkingHour', '00:00');
                  formik.setFieldValue('endWorkingHour', '23:59');
                } else {
                  formik.setFieldValue('startWorkingHour', target.value);
                }
              }}
              InputLabelProps={{ shrink: true }}>
              {timeRange.map((time: string) => (
                <MenuItem key={time} value={time} disabled={time <= formik.values.endWorkingHour}>
                  {time}
                </MenuItem>
              ))}
            </TextField>
          </GridTextField>
          <GridTextField item xs={6} sm={2}>
            <TextField
              type="text"
              label={t('supplierManagement.column.endWorkingHour')}
              fullWidth
              select
              variant="outlined"
              value={formik.values.endWorkingHour}
              onChange={({ target }) => {
                if (target.value === 'เปิด 24 ชั่วโมง') {
                  formik.setFieldValue('startWorkingHour', '00:00');
                  formik.setFieldValue('endWorkingHour', '23:59');
                } else {
                  formik.setFieldValue('endWorkingHour', target.value);
                }
              }}
              InputLabelProps={{ shrink: true }}>
              {timeRange.map((time: string) => (
                <MenuItem key={time} value={time} disabled={time <= formik.values.startWorkingHour}>
                  {time}
                </MenuItem>
              ))}
            </TextField>
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              label={t('supplierManagement.column.orderMethod')}
              fullWidth
              select
              variant="outlined"
              value={formik.values.orderMethod}
              disabled={isOrderMethodFetching}
              InputLabelProps={{ shrink: true }}
              onChange={({ target }) => formik.setFieldValue('orderMethod', target.value)}>
              {orderMethod?.map((config: SystemConfig) => (
                <MenuItem key={config.groupCode + '-' + config.code} value={config.code}>
                  {config.nameTh}
                </MenuItem>
              ))}
            </TextField>
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              label={t('supplierManagement.column.sendingMethod')}
              fullWidth
              select
              variant="outlined"
              value={formik.values.sendingMethod}
              InputLabelProps={{ shrink: true }}
              disabled={isSendingMethodFetching}
              onChange={({ target }) => formik.setFieldValue('sendingMethod', target.value)}>
              {sendingMethod?.map((config: SystemConfig) => (
                <MenuItem key={config.groupCode + '-' + config.code} value={config.code}>
                  {config.nameTh}
                </MenuItem>
              ))}
            </TextField>
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              label={t('supplierManagement.column.creditTerm') + ' *'}
              fullWidth
              select
              variant="outlined"
              value={formik.values.creditTerm}
              disabled={isCreditTermFetching}
              InputLabelProps={{ shrink: true }}
              onChange={({ target }) => formik.setFieldValue('creditTerm', target.value)}
              error={Boolean(formik.touched.creditTerm && formik.errors.creditTerm)}
              helperText={formik.touched.creditTerm && formik.errors.creditTerm}>
              {creditTerm?.map((config: SystemConfig) => (
                <MenuItem key={config.groupCode + '-' + config.code} value={config.code}>
                  {config.nameTh}
                </MenuItem>
              ))}
            </TextField>
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              label={t('supplierManagement.column.transferMethod')}
              fullWidth
              select
              variant="outlined"
              value={formik.values.paymentMethod}
              disabled={isPaymentMethodFetching}
              InputLabelProps={{ shrink: true }}
              onChange={({ target }) => formik.setFieldValue('paymentMethod', target.value)}>
              {paymentMethod?.map((config: SystemConfig) => (
                <MenuItem key={config.groupCode + '-' + config.code} value={config.code}>
                  {config.nameTh}
                </MenuItem>
              ))}
            </TextField>
          </GridTextField>
          <FormikProvider value={formik}>
            <Grid container spacing={1}>
              <FieldArray name="accountList">
                {({ push, remove }) => (
                  <>
                    <GridTextField item xs={6} sm={4}>
                      {t('supplierManagement.column.account.title')}
                    </GridTextField>
                    <GridTextField item xs={6} sm={8} style={{ textAlign: 'right' }}>
                      <Button
                        variant="contained"
                        onClick={() => {
                          const newAcct = {
                            accountNumber: '',
                            accountName: '',
                            bankName: '',
                            createdDate: '',
                            createdBy: '',
                            updatedDate: '',
                            updatedBy: ''
                          };
                          push({ ...newAcct });
                        }}
                        startIcon={<PlaylistAdd />}>
                        {t('supplierManagement.action.addAccount')}
                      </Button>
                    </GridTextField>
                    {formik.values.accountList.length > 0 ? (
                      formik.values.accountList.map((acct: SupplierAccount, index) => {
                        return (
                          <React.Fragment key={index}>
                            <GridTextField item xs={6} sm={6}>
                              {t('supplierManagement.column.account.subTitle', {
                                index: index + 1
                              })}
                            </GridTextField>
                            <GridTextField item xs={6} sm={6} style={{ textAlign: 'right' }}>
                              <Button
                                variant="contained"
                                color="error"
                                startIcon={<Delete />}
                                onClick={() => remove(index)}>
                                {t('button.delete')}
                              </Button>
                            </GridTextField>
                            <GridTextField item xs={12} sm={6}>
                              <Autocomplete
                                options={bankNames?.map((option: SystemConfig) => option) || []}
                                getOptionLabel={(bank: SystemConfig) => bank.nameTh}
                                isOptionEqualToValue={(option, value) => option.code === value.code} // important!
                                renderOption={(props, bank) => (
                                  <li {...props} key={bank.code}>
                                    <Box display="flex" alignItems="center">
                                      <img
                                        src={'/bank/' + bank.code + '.png'}
                                        alt={bank.nameTh}
                                        width={24}
                                        height={24}
                                        style={{ marginRight: 8 }}
                                      />
                                      {bank.nameTh}
                                    </Box>
                                  </li>
                                )}
                                sx={{ minWidth: '150px' }}
                                value={
                                  bankNames?.find((bank) => bank.code === acct?.bankName) || null
                                }
                                onChange={(_event, value: SystemConfig, reason) => {
                                  formik.setFieldValue(
                                    `accountList[${index}].bankName`,
                                    reason === 'clear' ? '' : value.code
                                  );
                                }}
                                renderInput={(params) => {
                                  const selectedBank = bankNames?.find(
                                    (bank) => bank.code === acct?.bankName
                                  );

                                  return (
                                    <TextField
                                      {...params}
                                      label={t('supplierManagement.column.account.bankName') + ' *'}
                                      InputLabelProps={{ shrink: true }}
                                      error={Boolean(
                                        formik.touched.accountList?.[index]?.bankName &&
                                        formik.errors.accountList?.[index]?.bankName
                                      )}
                                      helperText={
                                        formik.touched.accountList?.[index]?.bankName &&
                                          typeof formik.errors.accountList?.[index]?.bankName ===
                                          'string'
                                          ? formik.errors.accountList?.[index]?.bankName
                                          : ''
                                      }
                                      InputProps={{
                                        ...params.InputProps,
                                        startAdornment: selectedBank ? (
                                          <Box display="flex" alignItems="center" sx={{ pl: 1 }}>
                                            <img
                                              src={`/bank/${selectedBank.code}.png`}
                                              alt={selectedBank.nameTh}
                                              width={24}
                                              height={24}
                                              style={{ marginRight: 8 }}
                                            />
                                          </Box>
                                        ) : null
                                      }}
                                    />
                                  );
                                }}
                              />
                            </GridTextField>
                            <GridTextField item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label={t('supplierManagement.column.account.name') + ' *'}
                                value={acct?.accountName}
                                onChange={({ target }) =>
                                  formik.setFieldValue(
                                    `accountList[${index}].accountName`,
                                    target.value
                                  )
                                }
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                                error={Boolean(
                                  formik.touched.accountList?.[index]?.accountName &&
                                  formik.errors.accountList?.[index]?.accountName
                                )}
                                helperText={
                                  formik.touched.accountList?.[index]?.accountName &&
                                    typeof formik.errors.accountList?.[index]?.accountName ===
                                    'string'
                                    ? formik.errors.accountList?.[index]?.accountName
                                    : ''
                                }
                              />
                            </GridTextField>
                            <GridTextField item xs={12} sm={6}>
                              <NoArrowTextField
                                type="number"
                                InputLabelProps={{ shrink: true }}
                                label={t('supplierManagement.column.account.number') + ' *'}
                                sx={{ width: '100%' }}
                                error={Boolean(
                                  formik.touched.accountList?.[index]?.accountNumber &&
                                  formik.errors.accountList?.[index]?.accountNumber
                                )}
                                helperText={
                                  formik.touched.accountList?.[index]?.accountNumber &&
                                    typeof formik.errors.accountList?.[index]?.accountNumber ===
                                    'string'
                                    ? formik.errors.accountList?.[index]?.accountNumber
                                    : ''
                                }
                                value={acct?.accountNumber}
                                onChange={({ target }) =>
                                  formik.setFieldValue(
                                    `accountList[${index}].accountNumber`,
                                    target.value
                                  )
                                }
                                inputProps={{
                                  inputMode: 'numeric',
                                  pattern: '[0-9]*',
                                  min: 1,
                                  max: 15
                                }}
                              />
                            </GridTextField>
                            <GridTextField item xs={12} sm={6} />
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <GridTextField item xs={12} style={{ textAlign: 'center' }}>
                        {formik.touched.accountList && formik.errors.accountList ? (
                          <Typography variant="h4" color="error">
                            {formik.errors.accountList}
                          </Typography>
                        ) : (
                          <>{t('supplierManagement.column.account.noAccount')}</>
                        )}
                      </GridTextField>
                    )}
                  </>
                )}
              </FieldArray>
            </Grid>
          </FormikProvider>
          <GridTextField item xs={6} sm={4}>
            {t('supplierManagement.column.address.title')}
          </GridTextField>
          <GridTextField item xs={6} sm={8} style={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              onClick={() => setIsOpenAddressDialog(true)}
              startIcon={<PlaylistAdd />}>
              {t('supplierManagement.column.address.addNew')}
            </Button>
          </GridTextField>
          {formik.values.address === '' ? (
            formik.touched.address && formik.errors.address ? (
              <GridTextField item xs={12} sm={12} style={{ textAlign: 'center' }}>
                <Typography color="error">{formik.errors.address}</Typography>
              </GridTextField>
            ) : (
              <GridTextField item xs={12} sm={12} style={{ textAlign: 'center' }}>
                {t('supplierManagement.column.address.noAddress')}
              </GridTextField>
            )
          ) : (
            <GridTextField item xs={12} sm={12}>
              <TextField
                type="text"
                label={t('supplierManagement.column.address.title')}
                fullWidth
                value={formik.values.address}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>
          )}
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
              setTitle(t('supplierManagement.message.createSupplierTitle'));
              setMsg(t('supplierManagement.message.createSupplierMsg'));
              setVisibleConfirmationDialog(true);
            }}
            startIcon={<Save />}>
            {t('button.create')}
          </Button>
        </Stack>
      </Wrapper>
      <AddressDialog
        open={isOpenAddressDialog}
        address={null}
        provinces={provinceList || []}
        amphures={amphureList || []}
        tumbons={tumbonList || []}
        onClose={(value: Address) => {
          setAddress(value);
          setIsOpenAddressDialog(false);
        }}
      />
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
            history.goBack();
          }
          setVisibleConfirmationDialog(false);
        }}
        onCancel={() => setVisibleConfirmationDialog(false)}
        isShowCancelButton={true}
        isShowConfirmButton={true}
      />
    </Page>
  );
}
