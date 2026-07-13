import { ArrowBackIos, Cancel, Delete, PersonAdd, Save } from '@mui/icons-material';
import {
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import ConfirmDialog from 'components/ConfirmDialog';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import { GridTextField, Wrapper } from 'components/Styled';
import { FieldArray, FormikProvider, useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { createNewSupplier } from 'services/Supplier/supplier-api';
import {
  CreateSupplierRequest,
  CreateSupplierResponse
} from 'services/Supplier/supplier-type';
import * as Yup from 'yup';

interface SupplierContactFormValue {
  contactName: string;
  contactNumber: string;
  wechat: string;
  isDefault: boolean;
}

const DEFAULT_CONTACT: SupplierContactFormValue = {
  contactName: '',
  contactNumber: '',
  wechat: '',
  isDefault: true
};

export default function SupplierManagementNew(): JSX.Element {
  const theme = useTheme();
  const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
  const history = useHistory();
  const { t } = useTranslation();
  const [actionType, setActionType] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);

  const formik = useFormik({
    initialValues: {
      supplierName: '',
      supplierCode: '',
      supplierEmail: '',
      countryCode: 'TH',
      fullAddress: '',
      fullAddressEn: '',
      province: '',
      city: '',
      district: '',
      town: '',
      street: '',
      detailAddress: '',
      postalCode: '',
      additional: '',
      contacts: [DEFAULT_CONTACT]
    },
    validationSchema: Yup.object().shape({
      supplierName: Yup.string().trim().required(t('supplierManagement.validation.supplierName')),
      supplierEmail: Yup.string()
        .trim()
        .email(t('supplierManagement.validation.email'))
        .nullable(),
      countryCode: Yup.string().trim().required(t('supplierManagement.validation.countryCode')),
      contacts: Yup.array()
        .of(
          Yup.object().shape({
            contactName: Yup.string()
              .trim()
              .required(t('supplierManagement.validation.contactName')),
            contactNumber: Yup.string()
              .trim()
              .required(t('supplierManagement.validation.contactNumber'))
          })
        )
        .min(1, t('supplierManagement.validation.contactMin'))
    }),
    onSubmit: (values, actions) => {
      actions.setSubmitting(true);

      const contacts = values.contacts
        .filter((contact) => contact.contactName.trim() || contact.contactNumber.trim() || contact.wechat.trim())
        .map((contact, index, items) => ({
          contactName: contact.contactName.trim(),
          contactNumber: contact.contactNumber.trim(),
          wechat: contact.wechat.trim() || null,
          isDefault: contact.isDefault || (!items.some((item) => item.isDefault) && index === 0)
        }));

      const request: CreateSupplierRequest = {
        supplierName: values.supplierName.trim(),
        supplierCode: values.supplierCode.trim() || null,
        supplierEmail: values.supplierEmail.trim() || null,
        countryCode: values.countryCode.trim() || null,
        fullAddress: values.fullAddress.trim() || null,
        fullAddressEn: values.fullAddressEn.trim() || null,
        province: values.province.trim() || null,
        city: values.city.trim() || null,
        district: values.district.trim() || null,
        town: values.town.trim() || null,
        street: values.street.trim() || null,
        detailAddress: values.detailAddress.trim() || null,
        postalCode: values.postalCode.trim() || null,
        additional: values.additional.trim() || null,
        contacts
      };

      toast
        .promise(createNewSupplier(request), {
          loading: t('toast.loading'),
          success: (response: CreateSupplierResponse) => {
            history.push(ROUTE_PATHS.SUPPLIER_DETAIL.replace(':id', response.data.id));
            return t('supplierManagement.message.createSuccess');
          },
          error: () => t('supplierManagement.message.createFailed')
        })
        .finally(() => actions.setSubmitting(false));
    }
  });

  const openConfirmDialog = (nextActionType: string, nextTitle: string, nextMessage: string) => {
    setActionType(nextActionType);
    setTitle(nextTitle);
    setMessage(nextMessage);
    setVisibleConfirmationDialog(true);
  };

  return (
    <FormikProvider value={formik}>
      <Page>
        <LoadingDialog open={formik.isSubmitting} />
        <PageTitle title={t('supplierManagement.action.create')} />

        <Wrapper>
          <Grid container spacing={1}>
            <GridTextField item xs={12}>
              <Typography variant="subtitle1" fontWeight={600}>
                {t('supplierManagement.detail.generalInfo')}
              </Typography>
            </GridTextField>

            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                disabled
                label={t('supplierManagement.column.id')}
                placeholder={t('general.autoGenerated')}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>

            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label={t('supplierManagement.column.name')}
                value={formik.values.supplierName}
                onChange={(event) => formik.setFieldValue('supplierName', event.target.value)}
                error={Boolean(formik.touched.supplierName && formik.errors.supplierName)}
                helperText={formik.touched.supplierName && formik.errors.supplierName}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>

            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('supplierManagement.column.code')}
                value={formik.values.supplierCode}
                onChange={(event) => formik.setFieldValue('supplierCode', event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>

            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('supplierManagement.column.email')}
                value={formik.values.supplierEmail}
                onChange={(event) => formik.setFieldValue('supplierEmail', event.target.value)}
                error={Boolean(formik.touched.supplierEmail && formik.errors.supplierEmail)}
                helperText={formik.touched.supplierEmail && formik.errors.supplierEmail}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>

            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label={t('supplierManagement.column.countryCode')}
                value={formik.values.countryCode}
                onChange={(event) => formik.setFieldValue('countryCode', event.target.value)}
                error={Boolean(formik.touched.countryCode && formik.errors.countryCode)}
                helperText={formik.touched.countryCode && formik.errors.countryCode}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>

            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('supplierManagement.column.address.province')}
                value={formik.values.province}
                onChange={(event) => formik.setFieldValue('province', event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>

            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('supplierManagement.column.city')}
                value={formik.values.city}
                onChange={(event) => formik.setFieldValue('city', event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>

            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('supplierManagement.column.address.amphure')}
                value={formik.values.district}
                onChange={(event) => formik.setFieldValue('district', event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>

            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('supplierManagement.column.address.tumbon')}
                value={formik.values.town}
                onChange={(event) => formik.setFieldValue('town', event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>

            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('supplierManagement.column.street')}
                value={formik.values.street}
                onChange={(event) => formik.setFieldValue('street', event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>

            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('supplierManagement.column.detailAddress')}
                value={formik.values.detailAddress}
                onChange={(event) => formik.setFieldValue('detailAddress', event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>

            <GridTextField item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('supplierManagement.column.address.postalCode')}
                value={formik.values.postalCode}
                onChange={(event) => formik.setFieldValue('postalCode', event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>

            <GridTextField item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label={t('supplierManagement.column.fullAddress')}
                value={formik.values.fullAddress}
                onChange={(event) => formik.setFieldValue('fullAddress', event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>

            <GridTextField item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label={t('supplierManagement.column.fullAddressEn')}
                value={formik.values.fullAddressEn}
                onChange={(event) => formik.setFieldValue('fullAddressEn', event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>

            <GridTextField item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label={t('supplierManagement.column.additional')}
                value={formik.values.additional}
                onChange={(event) => formik.setFieldValue('additional', event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </GridTextField>
          </Grid>
        </Wrapper>

        <Wrapper>
          <FieldArray name="contacts">
            {({ push }) => (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    useFlexGap
                    sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
                  >
                    <Typography variant="subtitle1" fontWeight={600}>
                      {t('supplierManagement.detail.contactInfo')}
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<PersonAdd />}
                      onClick={() =>
                        push({
                          ...DEFAULT_CONTACT,
                          isDefault: formik.values.contacts.length === 0
                        })
                      }
                    >
                      {t('button.addNew')}
                    </Button>
                  </Stack>
                </Grid>

                {typeof formik.errors.contacts === 'string' ? (
                  <Grid item xs={12}>
                    <Typography color="error" variant="caption">
                      {formik.errors.contacts}
                    </Typography>
                  </Grid>
                ) : null}

                {formik.values.contacts.map((contact, index) => (
                  <Grid item xs={12} key={`contact-${index}`}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2
                      }}
                    >
                      <Grid container spacing={1}>
                        <Grid item xs={12}>
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                          >
                            <Typography fontWeight={600}>
                              {t('supplierManagement.contactCard', {
                                index: index + 1
                              })}
                            </Typography>
                            <IconButton
                              color="error"
                              disabled={formik.values.contacts.length === 1}
                              onClick={() => {
                                const removedWasDefault = formik.values.contacts[index]?.isDefault;
                                const nextContacts = formik.values.contacts
                                  .filter((_, contactIndex) => contactIndex !== index)
                                  .map((item, nextIndex) => ({
                                    ...item,
                                    isDefault: removedWasDefault ? nextIndex === 0 : item.isDefault
                                  }));

                                formik.setFieldValue('contacts', nextContacts);
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </Stack>
                        </Grid>

                        <GridTextField item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            required
                            label={t('supplierManagement.column.contactName')}
                            value={contact.contactName}
                            onChange={(event) =>
                              formik.setFieldValue(
                                `contacts.${index}.contactName`,
                                event.target.value
                              )
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

                        <GridTextField item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            required
                            label={t('supplierManagement.column.contactNumber')}
                            value={contact.contactNumber}
                            onChange={(event) =>
                              formik.setFieldValue(
                                `contacts.${index}.contactNumber`,
                                event.target.value
                              )
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

                        <GridTextField item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label={t('supplierManagement.column.wechat')}
                            value={contact.wechat}
                            onChange={(event) =>
                              formik.setFieldValue(`contacts.${index}.wechat`, event.target.value)
                            }
                            InputLabelProps={{ shrink: true }}
                          />
                        </GridTextField>

                        <GridTextField item xs={12} sm={6}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={contact.isDefault}
                                onChange={(event) => {
                                  if (!event.target.checked) {
                                    return;
                                  }

                                  formik.values.contacts.forEach((_, contactIndex) => {
                                    formik.setFieldValue(
                                      `contacts.${contactIndex}.isDefault`,
                                      contactIndex === index
                                    );
                                  });
                                }}
                              />
                            }
                            label={t('supplierManagement.defaultContact')}
                          />
                        </GridTextField>
                      </Grid>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </FieldArray>
        </Wrapper>

        <Wrapper>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            useFlexGap
            sx={{
              mt: 1,
              justifyContent: { sm: 'flex-end' },
              alignItems: { xs: 'flex-end', sm: 'center' }
            }}
          >
            <Button
              fullWidth={isDownSm}
              variant="contained"
              className="btn-cool-grey"
              startIcon={<ArrowBackIos />}
              onClick={() =>
                openConfirmDialog('back', t('message.backTitle'), t('message.backMsg'))
              }
            >
              {t('button.back')}
            </Button>
            <Button
              fullWidth={isDownSm}
              variant="contained"
              className="btn-amber-orange"
              startIcon={<Cancel />}
              onClick={() =>
                openConfirmDialog('clear', t('message.clearDataTitle'), t('message.clearDataMsg'))
              }
            >
              {t('button.clear')}
            </Button>
            <Button
              fullWidth={isDownSm}
              variant="contained"
              className="btn-emerald-green"
              startIcon={<Save />}
              onClick={() =>
                openConfirmDialog(
                  'create',
                  t('supplierManagement.message.confirmCreateTitle'),
                  t('supplierManagement.message.confirmCreateMessage')
                )
              }
            >
              {t('button.create')}
            </Button>
          </Stack>
        </Wrapper>

        <ConfirmDialog
          open={visibleConfirmationDialog}
          title={title}
          message={message}
          confirmText={t('button.confirm')}
          cancelText={t('button.cancel')}
          onConfirm={() => {
            if (actionType === 'create') {
              formik.handleSubmit();
            } else if (actionType === 'clear') {
              formik.resetForm();
            } else if (actionType === 'back') {
              history.push(ROUTE_PATHS.SUPPLIER_MANAGEMENT);
            }

            setVisibleConfirmationDialog(false);
          }}
          onCancel={() => setVisibleConfirmationDialog(false)}
          isShowCancelButton
          isShowConfirmButton
        />
      </Page>
    </FormikProvider>
  );
}
