import { Delete, PersonAdd, Save } from '@mui/icons-material';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import LoadingDialog from 'components/LoadingDialog';
import { GridTextField } from 'components/Styled';
import { FieldArray, FormikProvider, useFormik } from 'formik';
import { ReactElement, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { createNewSupplier, getSupplierById } from 'services/Supplier/supplier-api';
import {
  CreateSupplierRequest,
  CreateSupplierResponse,
  Supplier
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

interface NewSupplierDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (supplier: Supplier) => void;
}

export function NewSupplierDialog(props: NewSupplierDialogProps): ReactElement {
  const { open, onClose, onCreated } = props;
  const { t } = useTranslation();

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
    onSubmit: async (values, actions) => {
      actions.setSubmitting(true);

      const contacts = values.contacts
        .filter(
          (contact) =>
            contact.contactName.trim() || contact.contactNumber.trim() || contact.wechat.trim()
        )
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

      try {
        const supplier = await toast.promise(
          createNewSupplier(request).then(async (response: CreateSupplierResponse) =>
            getSupplierById(response.data.id)
          ),
          {
            loading: t('toast.loading'),
            success: t('supplierManagement.message.createSuccess'),
            error: t('supplierManagement.message.createFailed')
          }
        );

        actions.resetForm();
        onCreated(supplier);
      } finally {
        actions.setSubmitting(false);
      }
    }
  });

  useEffect(() => {
    if (!open) {
      formik.resetForm();
    }
  }, [open]);

  return (
    <FormikProvider value={formik}>
      <Dialog
        open={open}
        onClose={formik.isSubmitting ? undefined : onClose}
        maxWidth="lg"
        fullWidth>
        <LoadingDialog open={formik.isSubmitting} />
        <DialogTitle>{t('supplierManagement.action.create')}</DialogTitle>
        <DialogContent dividers>
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

            <GridTextField item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1 }}>
                {t('supplierManagement.detail.contactInfo')}
              </Typography>
            </GridTextField>

            <GridTextField item xs={12}>
              <FieldArray name="contacts">
                {({ push }) => (
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="flex-end">
                      <Button
                        variant="contained"
                        startIcon={<PersonAdd />}
                        onClick={() =>
                          push({
                            ...DEFAULT_CONTACT,
                            isDefault: formik.values.contacts.length === 0
                          })
                        }>
                        {t('button.addNew')}
                      </Button>
                    </Stack>

                    {typeof formik.errors.contacts === 'string' ? (
                      <Typography color="error" variant="caption">
                        {formik.errors.contacts}
                      </Typography>
                    ) : null}

                    {formik.values.contacts.map((contact, index) => (
                      <Paper
                        key={`new-supplier-contact-${index}`}
                        elevation={0}
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2
                        }}>
                        <Grid container spacing={1}>
                          <Grid item xs={12}>
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography fontWeight={600}>
                                {t('supplierManagement.contactCard', { index: index + 1 })}
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
                                      isDefault: removedWasDefault
                                        ? nextIndex === 0
                                        : item.isDefault
                                    }));

                                  formik.setFieldValue('contacts', nextContacts);
                                }}>
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
                    ))}
                  </Stack>
                )}
              </FieldArray>
            </GridTextField>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={formik.isSubmitting} className="btn-cool-grey">
            {t('button.cancel')}
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            disabled={formik.isSubmitting}
            onClick={() => formik.handleSubmit()}>
            {t('button.create')}
          </Button>
        </DialogActions>
      </Dialog>
    </FormikProvider>
  );
}
