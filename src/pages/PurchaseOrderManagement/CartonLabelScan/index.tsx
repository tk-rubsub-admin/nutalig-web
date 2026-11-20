import { ArrowBack, Inventory2 } from '@mui/icons-material';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Grid, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { scanPurchaseOrderCartonLabel } from 'services/PurchaseOrder/purchase-order-api';
import { CartonLabelScan } from 'services/PurchaseOrder/purchase-order-type';

const displayValue = (value?: string | number | null) => value || '-';

export default function CartonLabelScanPage() {
  const history = useHistory();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token') || '';
  const [data, setData] = useState<CartonLabelScan | null>(null);
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

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Box sx={{ p: { xs: 2, md: 4 } }}><Alert severity="error">{error}</Alert></Box>;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto' }}>
      <Stack direction="row" spacing={1} alignItems="center" mb={2}>
        <Button startIcon={<ArrowBack />} onClick={() => history.goBack()}>กลับ</Button>
        <Typography variant="h5" fontWeight={700}>ข้อมูลใบแปะข้างกล่อง</Typography>
      </Stack>
      <Card>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center" mb={2}>
            <Inventory2 color="primary" />
            <Typography variant="h6">ข้อมูลสำหรับรับสินค้า</Typography>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><Typography color="text.secondary">เลขที่ใบสั่งซื้อ</Typography><Typography fontWeight={600}>{displayValue(data?.purchaseOrderNo)}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography color="text.secondary">รหัสรายการสินค้า</Typography><Typography>{displayValue(data?.purchaseOrderDetailId)}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography color="text.secondary">สินค้า</Typography><Typography>{displayValue(data?.productName)}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography color="text.secondary">สเปค</Typography><Typography>{displayValue(data?.spec)}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography color="text.secondary">ชิ้นส่วน/อะไหล่</Typography><Typography>{displayValue(data?.componentName)}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography color="text.secondary">รายละเอียดชิ้นส่วน</Typography><Typography>{displayValue(data?.componentSpecification)}</Typography></Grid>
            <Grid item xs={12} sm={4}><Typography color="text.secondary">ขนาดกล่อง</Typography><Typography>{displayValue(data?.packageDimension)}</Typography></Grid>
            <Grid item xs={12} sm={4}><Typography color="text.secondary">น้ำหนัก</Typography><Typography>{displayValue(data?.packageWeight)}</Typography></Grid>
            <Grid item xs={12} sm={4}><Typography color="text.secondary">ความจุ</Typography><Typography>{displayValue(data?.packageCapacity)}</Typography></Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
