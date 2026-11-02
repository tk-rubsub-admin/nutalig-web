import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField
} from '@mui/material';
import { useState } from 'react';
import { createShippingLocation } from 'services/Supplier/supplier-api';
import { Country } from 'services/Address/address-type';
import { SystemConfig } from 'services/Config/config-type';

interface Props {
  open: boolean;
  countries: Country[];
  locationTypes: SystemConfig[];
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}

const EMPTY_LOCATION = {
  code: '',
  name: '',
  locationType: '',
  countryCode: '',
  province: '',
  district: '',
  address: ''
};

export default function CreateShippingLocationDialog({
  open,
  countries,
  locationTypes,
  onClose,
  onCreated
}: Props): JSX.Element {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_LOCATION);

  const update = (field: keyof typeof EMPTY_LOCATION, value: string) =>
    setForm((previous) => ({ ...previous, [field]: value }));

  const close = () => {
    if (saving) return;
    setForm(EMPTY_LOCATION);
    onClose();
  };

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await createShippingLocation({
        ...form,
        code: form.code.trim() || undefined,
        name: form.name.trim(),
        locationType: form.locationType || undefined,
        countryCode: form.countryCode || undefined,
        province: form.province.trim() || undefined,
        district: form.district.trim() || undefined,
        address: form.address.trim() || undefined
      });
      setForm(EMPTY_LOCATION);
      onClose();
      await onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>เพิ่มท่าเรือ / สถานที่ขนส่ง</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="ชื่อท่าเรือ/สถานที่"
              value={form.name}
              InputLabelProps={{ shrink: true }}
              onChange={(event) => update('name', event.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Code"
              value={form.code}
              InputLabelProps={{ shrink: true }}
              onChange={(event) => update('code', event.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="ประเภทสถานที่"
              value={form.locationType}
              InputLabelProps={{ shrink: true }}
              onChange={(event) => update('locationType', event.target.value)}>
              <MenuItem value="">ไม่ระบุ</MenuItem>
              {locationTypes.map((config) => (
                <MenuItem key={config.code} value={config.code}>
                  {config.nameTh || config.nameEn || config.code}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="ประเทศ"
              value={form.countryCode}
              InputLabelProps={{ shrink: true }}
              onChange={(event) => update('countryCode', event.target.value)}>
              <MenuItem value="">ไม่ระบุ</MenuItem>
              {countries.map((country) => (
                <MenuItem key={country.code} value={country.code}>
                  {country.nameTh || country.name} ({country.code})
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="จังหวัด"
              value={form.province}
              InputLabelProps={{ shrink: true }}
              onChange={(event) => update('province', event.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="เขต/อำเภอ"
              value={form.district}
              InputLabelProps={{ shrink: true }}
              onChange={(event) => update('district', event.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="ที่อยู่"
              value={form.address}
              InputLabelProps={{ shrink: true }}
              onChange={(event) => update('address', event.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button disabled={saving} onClick={close}>
          ยกเลิก
        </Button>
        <Button variant="contained" disabled={saving || !form.name.trim()} onClick={submit}>
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
