import { Add, DeleteOutline } from '@mui/icons-material';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField
} from '@mui/material';
import { useState } from 'react';
import { createSupplierShippingV2 } from 'services/Supplier/supplier-api';
import { ShippingRoute } from 'services/Supplier/supplier-type';

interface Props {
  open: boolean;
  routes: ShippingRoute[];
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}

export default function CreateSupplierShippingDialog({
  open,
  routes,
  onClose,
  onCreated
}: Props): JSX.Element {
  const [shippingMethod, setShippingMethod] = useState<'LAND' | 'SEA'>('SEA');
  const [shippingMode, setShippingMode] = useState<'STANDARD' | 'FCL'>('STANDARD');
  const [shippingName, setShippingName] = useState('');
  const [carCode, setCarCode] = useState('');
  const [remark, setRemark] = useState('');
  const [selectedRouteIds, setSelectedRouteIds] = useState<number[]>([]);
  const [routeId, setRouteId] = useState('');
  const [saving, setSaving] = useState(false);

  const close = () => {
    if (saving) return;
    setShippingMethod('SEA');
    setShippingMode('STANDARD');
    setShippingName('');
    setCarCode('');
    setRemark('');
    setSelectedRouteIds([]);
    setRouteId('');
    onClose();
  };

  const selectedRoutes = routes.filter((route) => selectedRouteIds.includes(route.id));
  const availableRoutes = routes.filter((route) => !selectedRouteIds.includes(route.id));

  const submit = async () => {
    if (!selectedRouteIds.length) return;
    setSaving(true);
    try {
      await createSupplierShippingV2({
        shippingMethod,
        shippingMode: shippingMethod === 'LAND' ? 'STANDARD' : shippingMode,
        shippingName: shippingName.trim() || undefined,
        carCode: carCode.trim() || undefined,
        remark: remark.trim() || undefined,
        shippingRouteIds: selectedRouteIds
      });
      close();
      await onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="md">
      <DialogTitle>สร้างขนส่งใหม่</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              fullWidth
              label="วิธีขนส่ง"
              InputLabelProps={{ shrink: true }}
              value={shippingMethod}
              onChange={(event) => setShippingMethod(event.target.value as 'LAND' | 'SEA')}>
              <MenuItem value="LAND">LAND</MenuItem>
              <MenuItem value="SEA">SEA</MenuItem>
            </TextField>
            <TextField
              select
              fullWidth
              label="โหมดขนส่ง"
              InputLabelProps={{ shrink: true }}
              value={shippingMode}
              disabled={shippingMethod === 'LAND'}
              onChange={(event) => setShippingMode(event.target.value as 'STANDARD' | 'FCL')}>
              <MenuItem value="STANDARD">STANDARD</MenuItem>
              <MenuItem value="FCL">FCL</MenuItem>
            </TextField>
          </Stack>
          <TextField
            fullWidth
            label="ชื่อขนส่ง"
            InputLabelProps={{ shrink: true }}
            value={shippingName}
            onChange={(event) => setShippingName(event.target.value)}
          />
          <TextField
            fullWidth
            label="รหัสรถ"
            InputLabelProps={{ shrink: true }}
            value={carCode}
            onChange={(event) => setCarCode(event.target.value)}
          />
          <TextField
            select
            fullWidth
            InputLabelProps={{ shrink: true }}
            label="เลือกเส้นทาง"
            value={routeId}
            onChange={(event) => {
              const value = event.target.value;
              setRouteId(value);
              if (value) setSelectedRouteIds((previous) => [...previous, Number(value)]);
              setRouteId('');
            }}>
            <MenuItem value="">เลือกเส้นทาง</MenuItem>
            {availableRoutes.map((route) => (
              <MenuItem key={route.id} value={route.id}>
                {`${route.routeCode} | ${route.originLocationName} → ${route.destinationLocationName}`}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {selectedRoutes.map((route) => (
              <Chip
                key={route.id}
                label={`${route.originLocationName} → ${route.destinationLocationName}`}
                onDelete={() =>
                  setSelectedRouteIds((previous) => previous.filter((id) => id !== route.id))
                }
                deleteIcon={<DeleteOutline />}
              />
            ))}
            {!selectedRoutes.length ? (
              <Chip variant="outlined" label="ยังไม่ได้เลือกเส้นทาง" />
            ) : null}
          </Stack>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="หมายเหตุ"
            InputLabelProps={{ shrink: true }}
            value={remark}
            onChange={(event) => setRemark(event.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={saving} onClick={close}>
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          startIcon={<Add />}
          disabled={saving || !selectedRouteIds.length}
          onClick={submit}>
          {saving ? 'กำลังบันทึก...' : 'สร้างขนส่ง'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
