import { BRAND_COLORS } from 'theme/brandTokens';
import {
  Box,
  Chip,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import dayjs from 'dayjs';
import { PurchaseOrderDeliveryRecord } from 'services/PurchaseOrder/purchase-order-type';
import { getShippingMethodLabel } from 'utils/shipping';

interface Props {
  deliveries?: PurchaseOrderDeliveryRecord[];
}

const DELIVERY_STATUS: Record<PurchaseOrderDeliveryRecord['status'], string> = {
  DRAFT: 'ฉบับร่าง',
  HANDED_OVER_TO_CARRIER: 'ส่งมอบให้ขนส่งแล้ว',
  RECEIVED_AT_WAREHOUSE: 'รับเข้าคลังแล้ว',
  CANCELLED: 'ยกเลิกแล้ว'
};

function formatDate(value?: string | null): string {
  return value && dayjs(value).isValid() ? dayjs(value).format('DD/MM/YYYY') : '-';
}

function formatNumber(value?: number | null, suffix = ''): string {
  if (value === undefined || value === null) return '-';
  return `${Number(value).toLocaleString('th-TH', { maximumFractionDigits: 3 })}${suffix}`;
}

function getDimension(detail: PurchaseOrderDeliveryRecord['details'][number]): string {
  const values = [detail.lengthCm, detail.widthCm, detail.heightCm];
  if (values.every((value) => value === undefined || value === null)) return '-';
  return `${values.map((value) => (value == null ? '-' : formatNumber(value))).join(' × ')} cm`;
}

export default function PurchaseOrderDeliverySection({ deliveries = [] }: Props) {
  if (!deliveries.length) {
    return (
      <Box sx={{ py: 3 }}>
        <Typography color="text.secondary" align="center">
          ยังไม่มีข้อมูลการขนส่งสินค้า
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">รายการเที่ยวขนส่ง ({deliveries.length})</Typography>
      {deliveries.map((delivery) => (
        <Paper
          key={delivery.id}
          variant="outlined"
          sx={{ p: { xs: 1.5, sm: 2 }, borderColor: BRAND_COLORS.sand, borderRadius: 2 }}>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              spacing={1}>
              <Typography variant="subtitle1" fontWeight={700}>
                {delivery.deliveryNo || `เที่ยวส่ง #${delivery.id}`}
              </Typography>
              <Chip
                size="small"
                color={
                  delivery.status === 'RECEIVED_AT_WAREHOUSE'
                    ? 'success'
                    : delivery.status === 'CANCELLED'
                    ? 'default'
                    : 'info'
                }
                label={DELIVERY_STATUS[delivery.status] || delivery.status}
              />
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  วันที่ส่งออก
                </Typography>
                <Typography variant="body2">{formatDate(delivery.shippedAt)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  คาดว่าจะถึงคลัง
                </Typography>
                <Typography variant="body2">
                  {formatDate(delivery.expectedWarehouseDate)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  วันที่รับสินค้า
                </Typography>
                <Typography variant="body2">{formatDate(delivery.receivedAt)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  วิธีขนส่ง
                </Typography>
                <Typography variant="body2">
                  {getShippingMethodLabel(delivery.shippingMethod)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  สถานที่ขนส่ง
                </Typography>
                <Typography variant="body2">{delivery.shippingLocationName || '-'}</Typography>
              </Grid>
            </Grid>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small" sx={{ minWidth: 980 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>สินค้า / อะไหล่หรือชิ้นส่วน</TableCell>
                    <TableCell align="right">จำนวนชิ้น</TableCell>
                    <TableCell align="right">กล่อง</TableCell>
                    <TableCell align="right">ชิ้น/กล่อง</TableCell>
                    <TableCell align="right">Net (kg)</TableCell>
                    <TableCell align="right">Gross (kg)</TableCell>
                    <TableCell>Dimension</TableCell>
                    <TableCell align="right">CBM (m³)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {delivery.details?.length ? (
                    delivery.details.map((detail, index) => (
                      <TableRow key={detail.id ?? `${detail.purchaseOrderDetailId}-${index}`}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {detail.productName || 'สินค้า'}
                          </Typography>
                          {detail.componentName ? (
                            <Typography variant="caption" color="text.secondary">
                              {detail.componentName}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell align="right">{formatNumber(detail.quantity)}</TableCell>
                        <TableCell align="right">{formatNumber(detail.cartonCount)}</TableCell>
                        <TableCell align="right">{formatNumber(detail.piecesPerCarton)}</TableCell>
                        <TableCell align="right">{formatNumber(detail.netWeightKg)}</TableCell>
                        <TableCell align="right">{formatNumber(detail.grossWeightKg)}</TableCell>
                        <TableCell>{getDimension(detail)}</TableCell>
                        <TableCell align="right">{formatNumber(detail.cbmM3)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        ไม่มีรายการสินค้าในเที่ยวส่งนี้
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {delivery.remark ? (
              <Typography variant="body2" color="text.secondary">
                หมายเหตุ: {delivery.remark}
              </Typography>
            ) : null}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
