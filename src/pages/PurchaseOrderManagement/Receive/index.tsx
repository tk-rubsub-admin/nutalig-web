import { ArrowBack, CheckCircle, History, Inventory2 } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useHistory, useLocation } from 'react-router-dom';
import {
  cancelPurchaseOrderReceipt,
  createPurchaseOrderDeliveryReceipt,
  getPurchaseOrderDeliveryReceiveContext,
  getPurchaseOrderDeliveryReceipts,
  uploadPurchaseOrderDeliveryAttachments
} from 'services/PurchaseOrder/purchase-order-api';
import {
  CreatePurchaseOrderReceiptRequest,
  PurchaseOrderReceipt,
  PurchaseOrderReceiptDetail
} from 'services/PurchaseOrder/purchase-order-type';

type ReceiptRow = PurchaseOrderReceiptDetail & {
  received: number;
  damaged: number;
  shortage: number;
  excess: number;
};

const asNumber = (value: string): number => (value === '' ? 0 : Number(value));

export default function PurchaseOrderReceivePage() {
  const history = useHistory();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const purchaseOrderNo = query.get('poNo') || '';
  const numericDeliveryId = Number(query.get('deliveryId'));
  const [context, setContext] = useState<PurchaseOrderReceipt | null>(null);
  const [receipts, setReceipts] = useState<PurchaseOrderReceipt[]>([]);
  const [rows, setRows] = useState<ReceiptRow[]>([]);
  const [receivedDate, setReceivedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [warehouseId, setWarehouseId] = useState('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    if (!purchaseOrderNo || !Number.isFinite(numericDeliveryId) || numericDeliveryId <= 0) {
      setLoadError('ไม่พบ poNo หรือ deliveryId ใน URL');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [receiveContext, receiptHistory] = await Promise.all([
        getPurchaseOrderDeliveryReceiveContext(purchaseOrderNo, numericDeliveryId),
        getPurchaseOrderDeliveryReceipts(purchaseOrderNo, numericDeliveryId)
      ]);
      setContext(receiveContext);
      setReceipts(Array.isArray(receiptHistory) ? receiptHistory : []);
      setRows(
        (receiveContext.details || []).map((detail) => ({
          ...detail,
          received: 0,
          damaged: 0,
          shortage: 0,
          excess: 0
        }))
      );
    } catch (error) {
      setContext(null);
      setReceipts([]);
      setRows([]);
      setLoadError('ไม่สามารถโหลดข้อมูลรับสินค้าได้ กรุณาตรวจสอบสิทธิ์และสถานะเที่ยวส่ง');
      toast.error('ไม่สามารถโหลดข้อมูลรับสินค้าได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [purchaseOrderNo, numericDeliveryId]);

  const updateRow = (deliveryDetailId: number, field: keyof ReceiptRow, value: string) => {
    setRows((current) =>
      current.map((row) =>
        row.deliveryDetailId === deliveryDetailId ? { ...row, [field]: asNumber(value) } : row
      )
    );
  };

  const submit = async () => {
    if (!warehouseId || Number(warehouseId) <= 0) {
      toast.error('กรุณาระบุคลังสินค้า');
      return;
    }
    const details = rows
      .filter((row) => row.received + row.damaged + row.shortage + row.excess > 0)
      .map((row) => ({
        deliveryDetailId: row.deliveryDetailId,
        receivedQuantity: row.received,
        damagedQuantity: row.damaged,
        shortageQuantity: row.shortage,
        excessQuantity: row.excess,
        lotNo: row.lotNo || null,
        expiryDate: row.expiryDate || null,
        warehouseLocationId: row.warehouseLocationId || null,
        remark: row.remark || null
      }));
    if (!details.length) {
      toast.error('กรุณาระบุจำนวนรับสินค้าอย่างน้อย 1 รายการ');
      return;
    }
    setSaving(true);
    try {
      const request: CreatePurchaseOrderReceiptRequest = {
        warehouseId: Number(warehouseId),
        receivedDate,
        remark: remark || null,
        details
      };
      await createPurchaseOrderDeliveryReceipt(purchaseOrderNo, numericDeliveryId, request);
      if (attachments.length) {
        await uploadPurchaseOrderDeliveryAttachments(
          purchaseOrderNo,
          numericDeliveryId,
          attachments,
          'GOODS_RECEIPT'
        );
        setAttachments([]);
      }
      toast.success('บันทึกการรับสินค้าแล้ว');
      await load();
      setRows((current) =>
        current.map((row) => ({ ...row, received: 0, damaged: 0, shortage: 0, excess: 0 }))
      );
    } catch (error) {
      toast.error('บันทึกการรับสินค้าไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const cancelReceipt = async (receiptNo: string) => {
    if (!window.confirm(`ยืนยันยกเลิกเอกสาร ${receiptNo} หรือไม่`)) return;
    try {
      await cancelPurchaseOrderReceipt(receiptNo);
      toast.success('ยกเลิกเอกสารรับสินค้าแล้ว');
      await load();
    } catch (error) {
      toast.error('ยกเลิกเอกสารรับสินค้าไม่สำเร็จ');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loadError)
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {loadError}
      </Alert>
    );
  if (!context) return <Alert severity="error">ไม่พบข้อมูลเที่ยวขนส่ง</Alert>;

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        spacing={1}
        mb={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button startIcon={<ArrowBack />} onClick={() => history.goBack()}>
            กลับ
          </Button>
          <Typography variant="h5" fontWeight={700}>
            รับสินค้าเข้าคลัง
          </Typography>
        </Stack>
        <Typography color="text.secondary">
          PO: {context.purchaseOrderNo} / เที่ยวส่ง: {context.deliveryNo || numericDeliveryId}
        </Typography>
      </Stack>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary">
                Supplier
              </Typography>
              <Typography>{context.supplierName || '-'}</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary">
                Route
              </Typography>
              <Typography>
                {context.originLocationName || '-'} → {context.destinationLocationName || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary">
                Tracking
              </Typography>
              <Typography>{context.trackingNumber || '-'}</Typography>
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="date"
                label="วันที่รับสินค้า"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="รหัสคลังสินค้า"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="หมายเหตุ"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                alignItems={{ sm: 'center' }}>
                <Button component="label" variant="outlined">
                  แนบไฟล์รับสินค้า
                  <input
                    hidden
                    type="file"
                    multiple
                    onChange={(e) => setAttachments(Array.from(e.target.files || []))}
                  />
                </Button>
                <Typography variant="body2" color="text.secondary">
                  {attachments.length
                    ? attachments.map((file) => file.name).join(', ')
                    : 'ยังไม่มีไฟล์แนบ'}
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
            <Inventory2 color="primary" />
            <Typography variant="h6">รายการสินค้า</Typography>
          </Stack>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>สินค้า</TableCell>
                  <TableCell align="right">ส่งมา</TableCell>
                  <TableCell align="right">รับสะสม</TableCell>
                  <TableCell align="right">คงเหลือ</TableCell>
                  <TableCell>รับครั้งนี้</TableCell>
                  <TableCell>เสียหาย</TableCell>
                  <TableCell>ขาด</TableCell>
                  <TableCell>เกิน</TableCell>
                  <TableCell>Lot</TableCell>
                  <TableCell>Expiry</TableCell>
                  <TableCell>ตำแหน่งจัดเก็บ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => {
                  const remaining =
                    row.remainingQuantity ??
                    Math.max(0, row.shippedQuantity - (row.receivedQuantityToDate || 0));
                  return (
                    <TableRow key={row.deliveryDetailId}>
                      <TableCell>{row.productName || row.componentName || '-'}</TableCell>
                      <TableCell align="right">{row.shippedQuantity}</TableCell>
                      <TableCell align="right">{row.receivedQuantityToDate || 0}</TableCell>
                      <TableCell align="right">{remaining}</TableCell>
                      {(['received', 'damaged', 'shortage', 'excess'] as const).map((field) => (
                        <TableCell key={field}>
                          <TextField
                            type="number"
                            size="small"
                            value={row[field]}
                            onChange={(e) => updateRow(row.deliveryDetailId, field, e.target.value)}
                            inputProps={{ min: 0, step: 'any' }}
                            sx={{ width: 90 }}
                          />
                        </TableCell>
                      ))}
                      <TableCell>
                        <TextField
                          size="small"
                          value={row.lotNo || ''}
                          onChange={(e) =>
                            setRows((current) =>
                              current.map((item) =>
                                item.deliveryDetailId === row.deliveryDetailId
                                  ? { ...item, lotNo: e.target.value }
                                  : item
                              )
                            )
                          }
                          sx={{ width: 110 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="date"
                          size="small"
                          value={row.expiryDate || ''}
                          onChange={(e) =>
                            setRows((current) =>
                              current.map((item) =>
                                item.deliveryDetailId === row.deliveryDetailId
                                  ? { ...item, expiryDate: e.target.value }
                                  : item
                              )
                            )
                          }
                          InputLabelProps={{ shrink: true }}
                          sx={{ width: 145 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={row.warehouseLocationId || ''}
                          onChange={(e) =>
                            setRows((current) =>
                              current.map((item) =>
                                item.deliveryDetailId === row.deliveryDetailId
                                  ? {
                                    ...item,
                                    warehouseLocationId:
                                      e.target.value === '' ? null : Number(e.target.value)
                                  }
                                  : item
                              )
                            )
                          }
                          inputProps={{ min: 1 }}
                          sx={{ width: 110 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
          <Stack direction="row" justifyContent="flex-end" mt={2}>
            <Button
              variant="contained"
              startIcon={<CheckCircle />}
              onClick={submit}
              disabled={saving}>
              {saving ? 'กำลังบันทึก...' : 'ยืนยันรับสินค้า'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
            <History color="primary" />
            <Typography variant="h6">ประวัติการรับสินค้า</Typography>
          </Stack>
          {!receipts.length ? (
            <Typography color="text.secondary">ยังไม่มีประวัติการรับสินค้า</Typography>
          ) : (
            receipts.map((receipt) => (
              <Stack
                key={receipt.receiptNo}
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ sm: 'center' }}
                sx={{ borderBottom: 1, borderColor: 'divider', py: 1 }}>
                <Typography>
                  {receipt.receiptNo} · {receipt.receivedDate} · {receipt.status}
                </Typography>
                {receipt.status === 'CONFIRMED' && (
                  <Button
                    color="error"
                    size="small"
                    onClick={() => receipt.receiptNo && void cancelReceipt(receipt.receiptNo)}>
                    ยกเลิก
                  </Button>
                )}
              </Stack>
            ))
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
