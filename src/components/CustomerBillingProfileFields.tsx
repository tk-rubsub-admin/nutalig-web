import { Chip, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Customer, CustomerBillingProfile } from 'services/Customer/customer-type';

export interface CustomerBillingSnapshot {
  customerName: string;
  taxId: string;
  branchCode: string;
  branchName: string;
  address: string;
  contactName: string;
  contactNumber: string;
}

interface Props {
  customer?: Customer | null;
  snapshot?: CustomerBillingSnapshot;
  onSnapshotChange?: (snapshot: CustomerBillingSnapshot) => void;
  isVat?: boolean;
  readOnly?: boolean;
}

const getAddress = (profile: CustomerBillingProfile) =>
  [profile.addressLine1, profile.addressLine2, profile.subdistrict, profile.district, profile.province, profile.postcode]
    .filter(Boolean)
    .join(' ');

const getProfile = (profiles: CustomerBillingProfile[], isVat: boolean) => {
  if (!profiles.length) return undefined;
  if (isVat) return profiles.find((profile) => profile.billingProfileType === 'VAT') || profiles[0];
  const noVat = profiles.filter((profile) => profile.billingProfileType === 'NO_VAT');
  return noVat[noVat.length - 1] || profiles[0];
};

export default function CustomerBillingProfileFields({
  customer,
  snapshot,
  onSnapshotChange,
  isVat = false,
  readOnly = false
}: Props): JSX.Element | null {
  const profiles = customer?.billingProfiles || [];
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const selected = profiles.find((profile) => profile.id === selectedId);

  const applyProfile = (profile?: CustomerBillingProfile) => {
    setSelectedId(profile?.id || '');
    if (!profile || !snapshot || !onSnapshotChange) return;
    onSnapshotChange({
      ...snapshot,
      customerName: profile.billingName || snapshot.customerName,
      taxId: profile.taxId || '',
      branchCode: profile.branchCode || '',
      branchName: profile.branchName || '',
      address: getAddress(profile),
      contactNumber: profile.phone || snapshot.contactNumber
    });
  };

  useEffect(() => {
    applyProfile(getProfile(profiles, isVat));
    // Select the default profile only when the available profiles or VAT mode changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id, profiles.length, isVat]);

  if (!customer) return null;

  return (
    <Grid container spacing={1}>
      <Grid item xs={12}>
        <TextField
          select
          fullWidth
          label="หัวบิลลูกค้า"
          value={selectedId}
          InputLabelProps={{ shrink: true }}
          disabled={!profiles.length || readOnly}
          onChange={(event) => applyProfile(profiles.find((profile) => profile.id === Number(event.target.value)))}>
          <MenuItem value="">{profiles.length ? 'เลือกหัวบิล' : 'ไม่มีข้อมูลหัวบิล'}</MenuItem>
          {profiles.map((profile) => (
            <MenuItem key={profile.id} value={profile.id}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip size="small" label={profile.billingProfileType === 'NO_VAT' ? 'ไม่จด VAT' : 'จด VAT'} />
                {profile.isDefault && <Chip size="small" label="ค่าเริ่มต้น" />}
                <span>{profile.billingName || profile.profileName || `หัวบิล ${profile.id}`}</span>
              </Stack>
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      {selected && (
        <>
          <Grid item xs={12} sm={6}><TextField fullWidth label="ชื่อหัวบิล" value={selected.billingName || ''} InputLabelProps={{ shrink: true }} InputProps={{ readOnly: true }} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="ประเภทหัวบิล" value={selected.billingProfileType === 'NO_VAT' ? 'ไม่จด VAT' : 'จด VAT'} InputLabelProps={{ shrink: true }} InputProps={{ readOnly: true }} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="เลขประจำตัวผู้เสียภาษี" value={selected.taxId || ''} InputLabelProps={{ shrink: true }} InputProps={{ readOnly: true }} /></Grid>
          <Grid item xs={12} sm={3}><TextField fullWidth label="รหัสสาขา" value={selected.branchCode || ''} InputLabelProps={{ shrink: true }} InputProps={{ readOnly: true }} /></Grid>
          <Grid item xs={12} sm={3}><TextField fullWidth label="ชื่อสาขา" value={selected.branchName || ''} InputLabelProps={{ shrink: true }} InputProps={{ readOnly: true }} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="อีเมล" value={selected.email || ''} InputLabelProps={{ shrink: true }} InputProps={{ readOnly: true }} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="เบอร์โทร" value={selected.phone || ''} InputLabelProps={{ shrink: true }} InputProps={{ readOnly: true }} /></Grid>
          <Grid item xs={12}><TextField fullWidth multiline minRows={2} label="ที่อยู่หัวบิล" value={getAddress(selected)} InputLabelProps={{ shrink: true }} InputProps={{ readOnly: true }} /></Grid>
        </>
      )}
    </Grid>
  );
}
