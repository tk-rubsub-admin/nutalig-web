import { ArrowBack, Inventory2 } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatNumberWithoutDigit } from 'utils/utils';
import { scanPurchaseOrderCartonLabel } from 'services/PurchaseOrder/purchase-order-api';
import { CartonLabelScan } from 'services/PurchaseOrder/purchase-order-type';

const displayValue = (value?: string | number | null) => value || '-';

export default function CartonLabelScanPage() {
  const history = useHistory();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token') || '';
  const [data, setData] = useState<CartonLabelScan | null>(null);
  const [receivedCartonCount, setReceivedCartonCount] = useState('');
  const [quantityPerCarton, setQuantityPerCarton] = useState('');
  const [receivedCartonCountTouched, setReceivedCartonCountTouched] = useState(false);
  const [quantityPerCartonTouched, setQuantityPerCartonTouched] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!token) {
        setError('ไม่พบ token ของใบแปะข้างกล่อง');
        setLoading(false);
        return;
      }
      try {
        const result = await scanPurchaseOrderCartonLabel(token);
        if (mounted) setData(result);
      } catch (e) {
        if (mounted) {
          setError('ไม่สามารถอ่านข้อมูลใบแปะข้างกล่องได้ หรือ QR Code ไม่ถูกต้อง');
          toast.error('อ่านข้อมูล QR Code ไม่สำเร็จ');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [token]);

  const hasValidQuantity = (value: string) => value.trim() !== '' && Number(value) > 0;
  const hasValidReceivedCartonCount = hasValidQuantity(receivedCartonCount);
  const hasValidQuantityPerCarton = hasValidQuantity(quantityPerCarton);
  const totalReceivedQuantity =
    hasValidReceivedCartonCount && hasValidQuantityPerCarton
      ? Number(receivedCartonCount) * Number(quantityPerCarton)
      : '';

  const handleConfirmReceive = () => {
    setReceivedCartonCountTouched(true);
    setQuantityPerCartonTouched(true);
    if (!hasValidReceivedCartonCount || !hasValidQuantityPerCarton) {
      toast.error('กรุณากรอกจำนวนกล่องและจำนวนชิ้นต่อกล่องให้ถูกต้อง');
      return;
    }
    setConfirmDialogOpen(true);
  };

  const handleClearQuantities = () => {
    setReceivedCartonCount('');
    setQuantityPerCarton('');
    setReceivedCartonCountTouched(false);
    setQuantityPerCartonTouched(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto' }}>
      <Stack direction="row" spacing={1} alignItems="center" mb={2}>
        <Button startIcon={<ArrowBack />} onClick={() => history.goBack()}>
          กลับ
        </Button>
        <Typography variant="h5" fontWeight={700}>
          ข้อมูลรับสินค้า
        </Typography>
      </Stack>
      <Card>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center" mb={2}>
            <Inventory2 color="primary" />
            <Typography variant="h6">ข้อมูลใบแปะข้างกล่อง</Typography>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography color="text.secondary">เลขที่ใบสั่งซื้อ</Typography>
              <Typography fontWeight={600}>{displayValue(data?.purchaseOrderNo)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography color="text.secondary">รหัสรายการสินค้า</Typography>
              <Typography>{displayValue(data?.purchaseOrderDetailId)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography color="text.secondary">สินค้า</Typography>
              <Typography>{displayValue(data?.productName)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography color="text.secondary">สเปค</Typography>
              <Typography>{displayValue(data?.spec)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography color="text.secondary">ชิ้นส่วน/อะไหล่</Typography>
              <Typography>{displayValue(data?.componentId + ' : ' + data?.componentName)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography color="text.secondary">รายละเอียดชิ้นส่วน</Typography>
              <Typography>{displayValue(data?.componentSpecification)}</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography color="text.secondary">ขนาดกล่อง</Typography>
              <Typography>{displayValue(data?.packageDimension)}</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography color="text.secondary">น้ำหนัก</Typography>
              <Typography>{displayValue(data?.packageWeight)}</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography color="text.secondary">ความจุ</Typography>
              <Typography>{displayValue(data?.packageCapacity)}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 1 }}>
                ข้อมูลจำนวนรับสินค้า
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="จำนวนกล่องที่รับ"
                required
                value={receivedCartonCount}
                InputLabelProps={{ shrink: true }}
                onChange={(event) => setReceivedCartonCount(event.target.value)}
                onBlur={() => setReceivedCartonCountTouched(true)}
                error={receivedCartonCountTouched && !hasValidReceivedCartonCount}
                helperText={
                  receivedCartonCountTouched && !hasValidReceivedCartonCount
                    ? 'กรุณากรอกจำนวนกล่องที่รับมากกว่า 0'
                    : 'ระบุจำนวนกล่องที่รับ'
                }
                inputProps={{ min: 0, step: 1, inputMode: 'numeric', pattern: '[0-9]*' }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="จำนวนชิ้นต่อกล่อง"
                required
                value={quantityPerCarton}
                InputLabelProps={{ shrink: true }}
                onChange={(event) => setQuantityPerCarton(event.target.value)}
                onBlur={() => setQuantityPerCartonTouched(true)}
                error={quantityPerCartonTouched && !hasValidQuantityPerCarton}
                helperText={
                  quantityPerCartonTouched && !hasValidQuantityPerCarton
                    ? 'กรุณากรอกจำนวนชิ้นต่อกล่องมากกว่า 0'
                    : 'ระบุจำนวนชิ้นต่อกล่อง'
                }
                inputProps={{ min: 0, step: 1, inputMode: 'numeric', pattern: '[0-9]*' }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="text"
                label="จำนวนรับทั้งหมด"
                value={formatNumberWithoutDigit(String(totalReceivedQuantity))}
                InputLabelProps={{ shrink: true }}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="flex-end"
                alignItems={{ xs: 'stretch', sm: 'center' }}
                spacing={1}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="inherit"
                  onClick={handleClearQuantities}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}>
                  ล้างข้อมูล
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={handleConfirmReceive}
                  disabled={!hasValidReceivedCartonCount || !hasValidQuantityPerCarton}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}>
                  ยืนยันรับสินค้า
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        fullWidth
        maxWidth="xs">
        <DialogTitle>ตรวจสอบข้อมูลรับสินค้า</DialogTitle>
        <DialogContent dividers>
          <Typography>
            กรุณาตรวจสอบข้อมูลใบสั่งซื้อ, สินค้า, จำนวนกล่องที่รับ และจำนวนชิ้นต่อกล่องให้ถูกต้องก่อนยืนยันรับสินค้า
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 2 }}>
            <Typography>ใบสั่งซื้อ: {data?.purchaseOrderNo}</Typography>
            <Typography>สินค้า: {data?.productName}</Typography>
            <Typography>ชิ้นส่วน/อะไหล่: {data?.componentName}</Typography>
            <Typography>จำนวนกล่องที่รับ: {receivedCartonCount}</Typography>
            <Typography>จำนวนชิ้นต่อกล่อง: {quantityPerCarton}</Typography>
            <Typography fontWeight={700}>
              จำนวนรับทั้งหมด: {formatNumberWithoutDigit(String(totalReceivedQuantity))}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>ย้อนกลับไปตรวจสอบ</Button>
          <Button variant="contained" onClick={() => setConfirmDialogOpen(false)}>
            ยืนยัน
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
