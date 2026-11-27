import { ArrowBack, CameraAlt, CheckCircle, History, Inventory2, Save } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import FileUploader from 'components/FileUploader';
import ConfirmDialog from 'components/ConfirmDialog';
import ImageFileUploaderWrapper from 'components/ImageFileUploaderWrapper';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import { GridTextField, Wrapper } from 'components/Styled';
import config from 'config';
import dayjs from 'dayjs';
import { Page } from 'layout/LayoutRoute';
import { getCartonLabelLink, ReceiveMethodDialog } from '../ReceiveList';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useHistory, useLocation } from 'react-router-dom';
import {
  cancelPurchaseOrderReceipt,
  createPurchaseOrderDeliveryReceipt,
  getPurchaseOrder,
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
};

const formatReceivedAt = (value?: string | null): string =>
  value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '-';

const deliveryDetailStatusLabel = (status?: string | null): string => {
  switch (status) {
    case 'RECEIVED_AT_WAREHOUSE':
      return 'รับเข้าคลังแล้ว';
    case 'STORE_RECEIVE_CONFIRMED':
      return 'ยืนยันรับเข้าคลังแล้ว';
    case 'PENDING':
    default:
      return 'รอรับเข้าคลัง';
  }
};

const lotInputValue = (value?: string | null): string => value?.replace(/^Lot/i, '') || '';

export default function PurchaseOrderReceivePage() {
  const history = useHistory();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const query = new URLSearchParams(location.search);
  const purchaseOrderNo = query.get('poNo') || '';
  const numericDeliveryId = Number(query.get('deliveryId'));
  const [context, setContext] = useState<PurchaseOrderReceipt | null>(null);
  const [receipts, setReceipts] = useState<PurchaseOrderReceipt[]>([]);
  const [rows, setRows] = useState<ReceiptRow[]>([]);
  const [receivedDate, setReceivedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [warehouseId, setWarehouseId] = useState('1');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isGoodReceiveMode = ['RECEIVED_AT_WAREHOUSE', 'STORE_RECEIVE_CONFIRMED'].includes(
    context?.deliveryStatus || ''
  );
  const pictureUrls = attachments.map((file) => URL.createObjectURL(file));
  const [receiveMethodDialogOpen, setReceiveMethodDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'choice' | 'camera' | 'manual'>('choice');
  const [manualLink, setManualLink] = useState('');
  const [manualLinkError, setManualLinkError] = useState('');
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);

  const openReceiveDialog = () => {
    setReceiveMethodDialogOpen(true);
    setDialogMode('choice');
    setManualLink('');
    setManualLinkError('');
  };

  const closeReceiveDialog = () => {
    setReceiveMethodDialogOpen(false);
    setDialogMode('choice');
    setManualLink('');
    setManualLinkError('');
  };

  const openCartonLabelLink = (value: string) => {
    const link = getCartonLabelLink(value);
    if (!link) {
      setManualLinkError('กรุณาระบุลิงก์ QR ใบแปะข้างกล่องที่ถูกต้อง');
      return;
    }
    closeReceiveDialog();
    const returnUrl = `${location.pathname}${location.search}`;
    history.push(`${link}&returnUrl=${encodeURIComponent(returnUrl)}`);
  };

  const load = async () => {
    if (!purchaseOrderNo || !Number.isFinite(numericDeliveryId) || numericDeliveryId <= 0) {
      setLoadError('ไม่พบ poNo หรือ deliveryId ใน URL');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [purchaseOrder, receiptHistory] = await Promise.all([
        getPurchaseOrder(purchaseOrderNo),
        getPurchaseOrderDeliveryReceipts(purchaseOrderNo, numericDeliveryId)
      ]);
      const delivery = purchaseOrder.deliveries?.find((item) => item.id === numericDeliveryId);
      if (!delivery) {
        throw new Error('Purchase order delivery not found.');
      }
      const receiveContext: PurchaseOrderReceipt = {
        purchaseOrderNo: purchaseOrder.purchaseOrderNo,
        salesOrderNo: purchaseOrder.salesOrderNo,
        salesName: purchaseOrder.salesName,
        procurementName: purchaseOrder.procurementName,
        deliveryId: delivery.id,
        deliveryNo: delivery.deliveryNo,
        deliveryStatus: delivery.status,
        supplierName: purchaseOrder.supplierNameSnapshot || purchaseOrder.supplier?.supplierName,
        shippingMethod: delivery.shippingMethod || purchaseOrder.shippingMethodSnapshot,
        trackingNumber: delivery.trackingNumber,
        originLocationName: delivery.originLocationName,
        destinationLocationName: delivery.destinationLocationName,
        details: (delivery.details || []).map((detail) => ({
          deliveryDetailId: detail.id as number,
          purchaseOrderDetailId: detail.purchaseOrderDetailId,
          purchaseOrderDetailComponentId: detail.purchaseOrderDetailComponentId,
          productName: detail.productName,
          componentName: detail.componentName,
          shippedQuantity: detail.quantity,
          cartonCount: detail.cartonCount,
          piecesPerCarton: detail.piecesPerCarton,
          receivedCartonCount: detail.receivedCartonCount,
          receivedPiecesPerCarton: detail.receivedPiecesPerCarton,
          receivedQuantity: detail.receivedQuantity,
          receiveStatus: detail.receiveStatus,
          warehouseReceivedAt: detail.warehouseReceivedAt,
          warehouseReceivedBy: detail.warehouseReceivedBy,
          warehouseReceivedByName: detail.warehouseReceivedByName,
          receivedQuantityToDate: 0,
          remainingQuantity: Math.max(0, detail.quantity - (detail.receivedQuantity || 0))
        }))
      };
      setContext(receiveContext);
      setReceipts(Array.isArray(receiptHistory) ? receiptHistory : []);
      setRows(
        (receiveContext.details || []).map((detail) => ({
          ...detail,
          received: detail.receivedQuantity || 0
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

  const submit = async () => {
    if (!receivedDate) {
      toast.error('กรุณาระบุวันที่รับสินค้า');
      return;
    }
    if (!warehouseId || Number(warehouseId) <= 0) {
      toast.error('กรุณาระบุคลังสินค้า');
      return;
    }
    const details = rows.map((row) => ({
      deliveryDetailId: row.deliveryDetailId,
      receivedQuantity: row.received,
      lotNo: row.lotNo || null,
      expiryDate: row.expiryDate || null,
      warehouseLocationId: 1,
      remark: row.remark || null
    }));
    if (!details.length) {
      toast.error('กรุณาระบุจำนวนรับสินค้าอย่างน้อย 1 รายการ');
      return;
    }
    setSaving(true);
    try {
      const request: CreatePurchaseOrderReceiptRequest = {
        warehouseId: 1,
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
        current.map((row) => ({ ...row, received: 0 }))
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

  if (loading) return <LoadingDialog open />;

  if (loadError)
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {loadError}
      </Alert>
    );
  if (!context) return <Alert severity="error">ไม่พบข้อมูลเที่ยวขนส่ง</Alert>;

  const groupedRows = rows.reduce<Array<{ productName: string; rows: ReceiptRow[] }>>(
    (groups, row) => {
      const productName = row.productName || '-';
      const group = groups.find((item) => item.productName === productName);
      if (group) group.rows.push(row);
      else groups.push({ productName, rows: [row] });
      return groups;
    },
    []
  );
  const allDetailsReceived =
    rows.length > 0 && rows.every((row) => row.receiveStatus === 'RECEIVED_AT_WAREHOUSE');

  return (
    <Page>
      <LoadingDialog open={loading || saving} />
      <PageTitle title="สร้างใบรับสินค้า" />

      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          className="btn-cool-grey"
          onClick={() => history.goBack()}>
          กลับ
        </Button>
      </Stack>
      <Wrapper>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Typography fontWeight={600}>รายละเอียดใบสั่งซื้อ</Typography>
        </Stack>
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <GridTextField item xs={12} sm={6}>
            <TextField
              fullWidth
              type="text"
              label="เลขที่ PO"
              value={context.purchaseOrderNo || '-'}
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              fullWidth
              type="text"
              label="เลขที่ SO"
              value={context.salesOrderNo || '-'}
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={3}>
            <TextField
              fullWidth
              type="text"
              label="เซลล์"
              value={context.salesName || '-'}
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={3}>
            <TextField
              fullWidth
              type="text"
              label="จัดซื้อ"
              value={context.procurementName || '-'}
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              fullWidth
              type="text"
              label="ซัพพลายเออร์ "
              value={context.supplierName || '-'}
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              fullWidth
              type="text"
              label="เส้นทาง "
              value={`${context.originLocationName || '-'} → ${context.destinationLocationName || '-'
                }`}
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              fullWidth
              type="text"
              label="เลขใบส่งของ Cargo "
              value={context.trackingNumber || '-'}
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="วันที่รับสินค้า"
              required
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField sm={6} />
          <GridTextField item xs={12} sm={6}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="หมายเหตุ"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
        </Grid>
      </Wrapper>
      <Wrapper>
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={12}>
            <Typography fontWeight={600}>รูปภาพรับสินค้า</Typography>
            <ImageFileUploaderWrapper
              id="good-receipt-picture-uploader"
              inputId="good-receipt-pictures"
              isDisabled={attachments.length >= config.maxRfqPictures}
              readOnly={false}
              maxFiles={config.maxRfqPictures}
              isMultiple
              isError={false}
              files={pictureUrls}
              onError={() => undefined}
              onDeleted={(index) => {
                setAttachments((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
              }}
              onSuccess={(files) => {
                setAttachments((prev) => [...prev, ...files].slice(0, config.maxRfqPictures));
              }}
              fileUploader={FileUploader}
            />
          </Grid>
        </Grid>
      </Wrapper>

      <Wrapper>
        <Typography fontWeight={600} sx={{ mb: 1 }}>
          ข้อมูลสินค้าในเที่ยวส่ง
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>สินค้า</TableCell>
              <TableCell>อะไหล่/ชิ้นส่วน</TableCell>
              <TableCell align="right">จำนวนส่ง</TableCell>
              <TableCell align="right">กล่อง</TableCell>
              <TableCell align="right">ชิ้น/กล่อง</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groupedRows.map((group) =>
              group.rows.map((row, rowIndex) => {
                return (
                  <TableRow key={row.deliveryDetailId}>
                    {rowIndex === 0 ? (
                      <TableCell
                        align="center"
                        rowSpan={group.rows.length}
                        sx={{ verticalAlign: 'middle' }}>
                        {group.productName}
                      </TableCell>
                    ) : null}
                    <TableCell>{row.componentName || '-'}</TableCell>
                    <TableCell align="right">{row.shippedQuantity}</TableCell>
                    <TableCell align="right">{row.cartonCount ?? '-'}</TableCell>
                    <TableCell align="right">{row.piecesPerCarton ?? '-'}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Wrapper>
      <Wrapper>
        <Typography fontWeight={600} sx={{ mb: 1 }}>
          ข้อมูลรับสินค้า
        </Typography>
        {isMobile ? (
          <Stack spacing={1.5}>
            {groupedRows.flatMap((group) =>
              group.rows.map((row) => (
                <Box
                  key={`received-mobile-${row.deliveryDetailId}`}
                  sx={{
                    p: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Typography fontWeight={600}>{group.productName}</Typography>
                    <Chip
                      size="small"
                      label={deliveryDetailStatusLabel(row.receiveStatus)}
                      color={row.receiveStatus === 'RECEIVED_AT_WAREHOUSE' ? 'success' : 'info'}
                      sx={{ mb: 1.25 }}
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
                    {row.componentName || '-'}
                  </Typography>
                  {row.receiveStatus === 'PENDING' ? (
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      startIcon={<CameraAlt />}
                      onClick={openReceiveDialog}>
                      รับสินค้า
                    </Button>
                  ) : null}

                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        กล่องที่รับ
                      </Typography>
                      <Typography>{row.receivedCartonCount ?? 0}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        ชิ้น/กล่อง
                      </Typography>
                      <Typography>{row.receivedPiecesPerCarton ?? 0}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        รับทั้งหมด
                      </Typography>
                      <Typography>{row.receivedQuantity ?? 0}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        รับเมื่อ
                      </Typography>
                      <Typography>{formatReceivedAt(row.warehouseReceivedAt)}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        รับโดย
                      </Typography>
                      <Typography>
                        {row.warehouseReceivedByName || row.warehouseReceivedBy || '-'}
                      </Typography>
                    </Grid>
                    <GridTextField item xs={12}>
                      <TextField
                        fullWidth
                        label="Lot"
                        value={lotInputValue(row.lotNo)}
                        onChange={(e) =>
                          setRows((current) =>
                            current.map((item) =>
                              item.deliveryDetailId === row.deliveryDetailId
                                ? {
                                  ...item,
                                  lotNo: e.target.value.replace(/\D/g, '')
                                    ? `Lot${e.target.value.replace(/\D/g, '')}`
                                    : null
                                }
                                : item
                            )
                          )
                        }
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">Lot</InputAdornment>
                        }}
                      />
                    </GridTextField>
                    <GridTextField item xs={12}>
                      <TextField
                        fullWidth
                        type="text"
                        label="ตำแหน่งจัดเก็บ"
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
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ min: 1, inputMode: 'numeric' }}
                      />
                    </GridTextField>
                  </Grid>
                </Box>
              ))
            )}
          </Stack>
        ) : null}
        <Box sx={{ display: { xs: 'none', sm: 'block' }, overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>สินค้า</TableCell>
                <TableCell>อะไหล่/ชิ้นส่วน</TableCell>
                <TableCell align="right">จำนวนกล่องที่รับ</TableCell>
                <TableCell align="right">จำนวนชิ้นต่อกล่อง</TableCell>
                <TableCell align="right">จำนวนรับทั้งหมด</TableCell>
                <TableCell>รับเมื่อ</TableCell>
                <TableCell>รับโดย</TableCell>
                <TableCell>สถานะ</TableCell>
                <TableCell align="center">ดำเนินการ</TableCell>
                <TableCell>Lot</TableCell>
                <TableCell>ตำแหน่งจัดเก็บ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groupedRows.map((group) =>
                group.rows.map((row, rowIndex) => (
                  <TableRow key={`received-${row.deliveryDetailId}`}>
                    {rowIndex === 0 ? (
                      <TableCell
                        align="center"
                        rowSpan={group.rows.length}
                        sx={{ verticalAlign: 'middle' }}>
                        {group.productName}
                      </TableCell>
                    ) : null}
                    <TableCell>{row.componentName || '-'}</TableCell>
                    <TableCell align="right">{row.receivedCartonCount ?? 0}</TableCell>
                    <TableCell align="right">{row.receivedPiecesPerCarton ?? 0}</TableCell>
                    <TableCell align="right">{row.receivedQuantity ?? 0}</TableCell>
                    <TableCell>{formatReceivedAt(row.warehouseReceivedAt)}</TableCell>
                    <TableCell>
                      {row.warehouseReceivedByName || row.warehouseReceivedBy || '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={deliveryDetailStatusLabel(row.receiveStatus)}
                        color={row.receiveStatus === 'RECEIVED_AT_WAREHOUSE' ? 'success' : 'info'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {row.receiveStatus === 'PENDING' ? (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<CameraAlt />}
                          onClick={openReceiveDialog}>
                          รับสินค้า
                        </Button>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={lotInputValue(row.lotNo)}
                        onChange={(e) =>
                          setRows((current) =>
                            current.map((item) =>
                              item.deliveryDetailId === row.deliveryDetailId
                                ? {
                                  ...item,
                                  lotNo: e.target.value.replace(/\D/g, '')
                                    ? `Lot${e.target.value.replace(/\D/g, '')}`
                                    : null
                                }
                                : item
                            )
                          )
                        }
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">Lot</InputAdornment>
                        }}
                        sx={{ width: 110 }}
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
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Wrapper>
      <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2}>
        <Button
          startIcon={<ArrowBack />}
          className="btn-cool-grey"
          onClick={() => history.goBack()}>
          กลับ
        </Button>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={() => setConfirmSaveOpen(true)}
          disabled={saving || !allDetailsReceived}>
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </Stack>
      <ConfirmDialog
        open={confirmSaveOpen}
        title="ยืนยันบันทึกใบรับสินค้า"
        message="กรุณาตรวจสอบข้อมูลการรับสินค้าให้ถูกต้อง ต้องการบันทึกใบรับสินค้านี้หรือไม่?"
        confirmText="ยืนยันบันทึก"
        cancelText="ยกเลิก"
        isShowCancelButton
        isShowConfirmButton
        confirmDisabled={saving}
        onCancel={() => setConfirmSaveOpen(false)}
        onConfirm={() => {
          setConfirmSaveOpen(false);
          void submit();
        }}
      />
      <ReceiveMethodDialog
        open={receiveMethodDialogOpen}
        mode={dialogMode}
        manualLink={manualLink}
        manualLinkError={manualLinkError}
        onModeChange={(mode) => {
          setDialogMode(mode);
          setManualLinkError('');
        }}
        onManualLinkChange={(value) => {
          setManualLink(value);
          setManualLinkError('');
        }}
        onBack={() => {
          setDialogMode('choice');
          setManualLinkError('');
        }}
        onClose={closeReceiveDialog}
        onSubmitManual={() => openCartonLabelLink(manualLink)}
        onScan={(value) => openCartonLabelLink(value)}
      />
    </Page>
  );
}
