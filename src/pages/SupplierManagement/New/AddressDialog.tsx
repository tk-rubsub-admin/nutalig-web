import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  DialogActions,
  Grid,
  TextField,
  MenuItem
} from '@mui/material';
import { GridTextField } from 'components/Styled';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import { Address, Amphure, Province, Tumbon } from 'services/Address/address-type';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { useState } from 'react';
import CustomSwitch from 'components/CustomSwitch';

interface AddressDialogProps {
  open: boolean;
  address: Address | null;
  provinces: Province[];
  amphures: Amphure[];
  tumbons: Tumbon[];
  onClose: (value: Address) => void;
}

export default function AddressDialog(props: AddressDialogProps): JSX.Element {
  const { open, address, provinces, amphures, tumbons, onClose } = props;
  const [marker, setMarker] = useState([{ lat: Yup.number, lng: Yup.number }]);
  const { t } = useTranslation();
  const formik = useFormik({
    initialValues: {
      address: '',
      tumbon: '',
      amphure: '',
      province: '',
      postalCode: '',
      location: '',
      isPakKlong: false
    },
    validationSchema: Yup.object().shape({
      address: Yup.string().max(255).required(t('supplierManagement.message.validateAddressName')),
      province: Yup.string().max(255).required(t('supplierManagement.message.validateProvince')),
      amphure: Yup.string().max(255).required(t('supplierManagement.message.validateAmphure')),
      tumbon: Yup.string().max(255).required(t('supplierManagement.message.validateTumbon'))
    }),
    enableReinitialize: true,
    onSubmit: (values, action) => {
      const selectedProvince = provinces.find((p) => p.id === values.province);
      const selectedAmphure = amphures.find((p) => p.id === values.amphure);
      const selectedTumbon = tumbons.find((p) => p.id === values.tumbon);
      const addAddress: Address = {
        addressDetail: values.address,
        tumbon: selectedTumbon || null,
        amphure: selectedAmphure || null,
        province: selectedProvince || null,
        location: values.location
      };
      onClose(addAddress);
      action.resetForm();
    }
  });

  const handlePakKlongToggle = (checked: boolean) => {
    if (checked) {
      formik.setFieldValue('isPakKlong', true);
      formik.setFieldValue('address', 'ปากคลองตลาด');
      formik.setFieldValue('province', '1');
      formik.setFieldValue('amphure', '1001');
      formik.setFieldValue('tumbon', '100102');
      formik.setFieldValue('postalCode', '10200');
      formik.setFieldValue('location', '13.74238662922522, 100.49614290577772');
      setMarker([
        {
          lat: 13.74238662922522,
          lng: 100.49614290577772
        }
      ]);
    } else {
      formik.setFieldValue('isPakKlong', false);
      formik.setFieldValue('address', '');
      formik.setFieldValue('province', '');
      formik.setFieldValue('amphure', '');
      formik.setFieldValue('tumbon', '');
      formik.setFieldValue('postalCode', '');
      formik.setFieldValue('location', '');
      setMarker([]);
    }
  }

  const onMapClick = (e) => {
    formik.setFieldValue('location', e.detail.latLng.lat + ', ' + e.detail.latLng.lng);
    setMarker([
      {
        lat: e.detail.latLng.lat,
        lng: e.detail.latLng.lng
      }
    ]);
    const placeId = e.detail.placeId;
    if (placeId !== undefined) {
      const geocoder = new google.maps.Geocoder();
      geocoder
        .geocode({ placeId: placeId })
        .then(({ results }) => {
          console.log(JSON.stringify(results));
          if (results[0]) {
            console.log(JSON.stringify(results[0]));
          } else {
            window.alert('No results found');
          }
        })
        .catch((e) => window.alert('Geocoder failed due to: ' + e));
    }
  };

  return (
    <Dialog open={open} fullWidth scroll="paper" aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">
        {t('supplierManagement.column.address.addNew')}
      </DialogTitle>
      <DialogContent>
        <br />
        <Grid container spacing={1}>
          <GridTextField item xs={12} sm={12}>
            <CustomSwitch
              checked={formik.values.isPakKlong}
              label={t('supplierManagement.column.address.pakKlong')}
              onChange={handlePakKlongToggle}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={12}>
            <TextField
              type="text"
              label={t('supplierManagement.column.address.title')}
              fullWidth
              variant="outlined"
              value={formik.values.address}
              placeholder={t('supplierManagement.placeHolder.address')}
              error={Boolean(formik.touched.address && formik.errors.address)}
              helperText={formik.touched.address && formik.errors.address}
              onChange={({ target }) => formik.setFieldValue('address', target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              style={{ borderRadius: '50px' }}
              label={t('supplierManagement.column.address.province')}
              fullWidth
              select
              variant="outlined"
              value={formik.values.province}
              onChange={({ target }) => {
                formik.setFieldValue('province', target.value);
                formik.setFieldValue('amphure', '');
                formik.setFieldValue('tumbon', '');
                formik.setFieldValue('postalCode', '');
              }}
              error={Boolean(formik.touched.province && formik.errors.province)}
              helperText={formik.touched.province && formik.errors.province}
              InputLabelProps={{ shrink: true }}>
              {provinces?.map((p: Province) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.nameTh}
                </MenuItem>
              ))}
            </TextField>
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              style={{ borderRadius: '50px' }}
              label={t('supplierManagement.column.address.amphure')}
              fullWidth
              select
              variant="outlined"
              value={formik.values.amphure}
              disabled={formik.values.province === ''}
              error={Boolean(formik.touched.amphure && formik.errors.amphure)}
              helperText={formik.touched.amphure && formik.errors.amphure}
              onChange={({ target }) => formik.setFieldValue('amphure', target.value)}
              InputLabelProps={{ shrink: true }}>
              {amphures
                ?.filter((a) => a.provinceId === formik.values.province)
                .map((a: Amphure) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.nameTh}
                  </MenuItem>
                ))}
            </TextField>
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              style={{ borderRadius: '50px' }}
              label={t('supplierManagement.column.address.tumbon')}
              fullWidth
              select
              variant="outlined"
              value={formik.values.tumbon}
              disabled={formik.values.amphure === ''}
              error={Boolean(formik.touched.tumbon && formik.errors.tumbon)}
              helperText={formik.touched.tumbon && formik.errors.tumbon}
              onChange={({ target }) => {
                formik.setFieldValue('tumbon', target.value);
                const tumbon = tumbons.find((t) => t.id === target.value);
                formik.setFieldValue('postalCode', tumbon?.zipCode);
              }}
              InputLabelProps={{ shrink: true }}>
              {tumbons
                ?.filter((t) => t.amphureId === formik.values.amphure)
                .map((t: Tumbon) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.nameTh}
                  </MenuItem>
                ))}
            </TextField>
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              style={{ borderRadius: '50px' }}
              label={t('supplierManagement.column.address.postalCode')}
              fullWidth
              variant="outlined"
              value={formik.values.postalCode}
              disabled
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={12} style={{ height: '300px' }}>
            <TextField
              type="text"
              style={{ borderRadius: '50px' }}
              label={t('supplierManagement.column.address.location')}
              fullWidth
              variant="outlined"
              value={formik.values.location}
              disabled
              InputLabelProps={{ shrink: true }}
            />
            <APIProvider
              apiKey="AIzaSyA7t3pZu_Fc-l1l-R-e6CSyEVfT3heFlaA"
              onLoad={() => console.log('Maps API has loaded.')}>
              <Map
                style={{ paddingTop: '10px' }}
                onClick={onMapClick}
                defaultZoom={13}
                defaultCenter={{
                  lat: 13.741784051834864,
                  lng: 100.4963982507553
                }}>
                {marker.map((marker) => (
                  <Marker
                    position={{
                      lat: marker.lat,
                      lng: marker.lng
                    }}
                  />
                ))}
              </Map>
            </APIProvider>
          </GridTextField>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            formik.resetForm();
            onClose(null);
          }}
          variant="contained"
          className="btn-cool-grey">
          {t('button.close')}
        </Button>
        <Button
          onClick={() => {
            formik.handleSubmit();
          }}
          variant="contained"
          className="btn-emerald-green">
          {t('button.add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
