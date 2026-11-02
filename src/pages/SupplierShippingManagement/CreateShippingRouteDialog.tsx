import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { checkShippingRouteExists, createShippingRoute } from 'services/Supplier/supplier-api';
import { ShippingLocation } from 'services/Supplier/supplier-type';

interface Props {
  open: boolean;
  locations: ShippingLocation[];
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}

export default function CreateShippingRouteDialog({
  open,
  locations,
  onClose,
  onCreated
}: Props): JSX.Element {
  const [routeCode, setRouteCode] = useState('');
  const [originLocationId, setOriginLocationId] = useState('');
  const [destinationLocationId, setDestinationLocationId] = useState('');
  const [saving, setSaving] = useState(false);
  const routeExistsQuery = useQuery(
    ['shipping-route-exists', originLocationId, destinationLocationId],
    () => checkShippingRouteExists(Number(originLocationId), Number(destinationLocationId)),
    {
      enabled: Boolean(
        originLocationId && destinationLocationId && originLocationId !== destinationLocationId
      ),
      refetchOnWindowFocus: false
    }
  );
  const routeExists = routeExistsQuery.data === true;

  useEffect(() => {
    const origin = locations.find((location) => String(location.id) === originLocationId);
    const destination = locations.find((location) => String(location.id) === destinationLocationId);
    setRouteCode(origin?.code && destination?.code ? `${origin.code}_${destination.code}` : '');
  }, [destinationLocationId, locations, originLocationId]);

  const close = () => {
    if (saving) return;
    setRouteCode('');
    setOriginLocationId('');
    setDestinationLocationId('');
    onClose();
  };

  const submit = async () => {
    if (
      !originLocationId ||
      !destinationLocationId ||
      originLocationId === destinationLocationId ||
      routeExists
    )
      return;
    setSaving(true);
    try {
      await createShippingRoute({
        routeCode: routeCode.trim() || undefined,
        originLocationId: Number(originLocationId),
        destinationLocationId: Number(destinationLocationId)
      });
      close();
      await onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>สร้างเส้นทางขนส่ง</DialogTitle>
      <DialogContent dividers>
        {routeExists ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            มีเส้นทางนี้ในระบบอยู่แล้ว
          </Alert>
        ) : null}
        <TextField
          select
          fullWidth
          required
          label="ต้นทาง"
          InputLabelProps={{ shrink: true }}
          value={originLocationId}
          onChange={(event) => setOriginLocationId(event.target.value)}
          sx={{ mb: 2 }}>
          <MenuItem value="">เลือกต้นทาง</MenuItem>
          {locations.map((location) => (
            <MenuItem key={location.id} value={location.id}>
              {location.name} {location.code ? `(${location.code})` : ''}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          fullWidth
          required
          label="ปลายทาง"
          value={destinationLocationId}
          InputLabelProps={{ shrink: true }}
          onChange={(event) => setDestinationLocationId(event.target.value)}>
          <MenuItem value="">เลือกปลายทาง</MenuItem>
          {locations.map((location) => (
            <MenuItem key={location.id} value={location.id}>
              {location.name} {location.code ? `(${location.code})` : ''}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button disabled={saving} onClick={close}>
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          disabled={
            saving ||
            routeExists ||
            routeExistsQuery.isFetching ||
            !originLocationId ||
            !destinationLocationId ||
            originLocationId === destinationLocationId
          }
          onClick={submit}>
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
