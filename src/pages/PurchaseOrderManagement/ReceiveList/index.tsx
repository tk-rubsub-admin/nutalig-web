import {
  ArrowBack,
  CameraAlt,
  Inbox,
  Link as LinkIcon,
  OpenInNew,
  Refresh
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useQuery } from 'react-query';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { ListEmptyState, ListErrorState, ListLoadingState } from 'components/ManagementList';
import Paginate from 'components/Paginate';
import { useUrlListState } from 'hooks/useUrlListState';
import { ROUTE_PATHS } from 'routes';
import { searchPurchaseOrderDeliveries } from 'services/PurchaseOrder/purchase-order-delivery-api';
import { getShippingMethodLabel } from 'utils/shipping';

const formatDate = (value?: string | null) => (value ? dayjs(value).format('DD/MM/YYYY') : '-');

export function getCartonLabelLink(value: string): string | null {
  try {
    const parsed = new URL(value.trim(), window.location.origin);
    if (
      parsed.pathname !== ROUTE_PATHS.PURCHASE_ORDER_CARTON_LABEL_SCAN ||
      !parsed.searchParams.get('token')
    ) {
      return null;
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

export function PurchaseOrderReceiveList({ receivedOnly = false }: { receivedOnly?: boolean }) {
  const history = useHistory();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [receiveMethodDialogOpen, setReceiveMethodDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'choice' | 'camera' | 'manual'>('choice');
  const [manualLink, setManualLink] = useState('');
  const [manualLinkError, setManualLinkError] = useState('');
  const { page, pageSize, setPage, setPageSize } = useUrlListState({
    defaultFilter: {},
    parseFilter: (_search, defaultFilter) => defaultFilter,
    serializeFilter: () => undefined,
    defaultPageSize: 10
  });
  const { data, isLoading, isFetching, isError, refetch } = useQuery(
    ['purchase-order-receive-list', receivedOnly, page, pageSize],
    () =>
      searchPurchaseOrderDeliveries(
        {
          statuses: receivedOnly
            ? ['RECEIVED_AT_WAREHOUSE']
            : ['IN_TRANSIT', 'PARTIALLY_RECEIVED', 'RECEIVED_AT_WAREHOUSE']
        },
        page,
        pageSize,
        'expectedWarehouseDate',
        'ASC'
      ),
    { keepPreviousData: true, refetchOnWindowFocus: false }
  );

  const records = data?.data.records || [];

  const deliveryStatusLabel = (status?: string | null) => {
    switch (status) {
      case 'PARTIALLY_RECEIVED':
        return 'รับเข้าบางส่วน';
      case 'RECEIVED_AT_WAREHOUSE':
        return 'รับเข้าคลังแล้ว';
      case 'STORE_RECEIVE_CONFIRMED':
        return 'ยืนยันรับเข้าคลังแล้ว';
      case 'IN_TRANSIT':
      default:
        return 'อยู่ระหว่างขนส่ง';
    }
  };

  const receiveActionLabel = (status?: string | null) =>
    status === 'RECEIVED_AT_WAREHOUSE' ? 'ออก Good Receipt' : 'รับสินค้า';

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
    history.push(link);
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Inbox color="primary" />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {receivedOnly ? 'รอออกเอกสารรับสินค้า' : 'รายการรับสินค้า'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {receivedOnly
                ? 'รายการเที่ยวส่งที่รับเข้าคลังแล้วและรอออก Good Receive'
                : 'เที่ยวขนส่งที่รอรับสินค้าและรายการที่รับเข้าคลังแล้วเพื่อออก Good Receive'}
            </Typography>
          </Box>
        </Stack>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          width={{ xs: '100%', sm: 'auto' }}>
          <Button
            fullWidth={isMobile}
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => void refetch()}>
            รีเฟรช
          </Button>
        </Stack>
      </Stack>

      {isError ? (
        <ListErrorState message="ไม่สามารถโหลดรายการรับสินค้าได้" onRetry={() => void refetch()} />
      ) : null}

      {isMobile ? (
        <Stack spacing={1.5} aria-busy={isFetching}>
          {isLoading ? (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography color="text.secondary">กำลังโหลดรายการรับสินค้า...</Typography>
            </Paper>
          ) : null}
          {!isLoading && !records.length ? (
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {receivedOnly
                  ? 'ไม่พบเที่ยวส่งที่รับเข้าคลังแล้วและรอออก Good Receive'
                  : 'ไม่พบเที่ยวขนส่งที่รอรับหรือออก Good Receive'}
              </Typography>
            </Paper>
          ) : null}
          {!isLoading &&
            records.map((record) => (
              <Paper key={record.id} variant="outlined" sx={{ p: 1.5 }}>
                <Stack spacing={1.25}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={1}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={700} noWrap>
                        {record.deliveryNo || '-'}
                      </Typography>
                      {record.trackingNumber ? (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {record.trackingNumber}
                        </Typography>
                      ) : null}
                    </Box>
                    <Chip
                      size="small"
                      color={record.status === 'RECEIVED_AT_WAREHOUSE' ? 'success' : 'info'}
                      label={deliveryStatusLabel(record.status)}
                    />
                  </Stack>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        วันที่คาดว่าจะถึงคลัง
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(record.expectedWarehouseDate)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        ใบสั่งซื้อ
                      </Typography>
                      <Typography variant="body2" noWrap>
                        {record.purchaseOrderNo || '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ gridColumn: '1 / -1' }}>
                      <Typography variant="caption" color="text.secondary">
                        วิธีขนส่ง
                      </Typography>
                      <Typography variant="body2">
                        {getShippingMethodLabel(record.shippingMethod)}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    component={Link}
                    to={`${ROUTE_PATHS.GOOD_RECEIPT_CREATE}?poNo=${encodeURIComponent(
                      record.purchaseOrderNo || ''
                    )}&deliveryId=${record.id}`}>
                    <OpenInNew />
                  </IconButton>
                </Stack>
              </Paper>
            ))}
        </Stack>
      ) : (
        <TableContainer component={Paper} variant="outlined" aria-busy={isFetching}>
          <Table sx={{ minWidth: 950 }} aria-label="รายการรับสินค้า">
            <TableHead>
              <TableRow>
                <TableCell>วันที่คาดว่าจะถึงคลัง</TableCell>
                <TableCell>เลขเที่ยวส่ง</TableCell>
                <TableCell>ใบสั่งซื้อ</TableCell>
                <TableCell>วิธีขนส่ง</TableCell>
                <TableCell>สถานะ</TableCell>
                <TableCell align="center">ดำเนินการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? <ListLoadingState colSpan={6} /> : null}
              {!isLoading &&
                records.map((record) => (
                  <TableRow hover key={record.id}>
                    <TableCell>{formatDate(record.expectedWarehouseDate)}</TableCell>
                    <TableCell>
                      <Typography fontWeight={600}>{record.deliveryNo || '-'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {record.trackingNumber || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>{record.purchaseOrderNo || '-'}</TableCell>
                    <TableCell>{getShippingMethodLabel(record.shippingMethod)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={record.status === 'RECEIVED_AT_WAREHOUSE' ? 'success' : 'info'}
                        label={deliveryStatusLabel(record.status)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="สร้างใบรับสินค้า">
                        <IconButton
                          size="small"
                          component={Link}
                          to={`${ROUTE_PATHS.GOOD_RECEIPT_CREATE
                            }?poNo=${encodeURIComponent(record.purchaseOrderNo || '')}&deliveryId=${record.id
                            }`}>
                          <OpenInNew />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && !records.length ? (
                <ListEmptyState
                  colSpan={6}
                  message={
                    receivedOnly
                      ? 'ไม่พบเที่ยวส่งที่รับเข้าคลังแล้วและรอออก Good Receive'
                      : 'ไม่พบเที่ยวขนส่งที่รอรับหรือออก Good Receive'
                  }
                />
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Paginate
        pagination={data?.data.pagination}
        page={page}
        pageSize={pageSize}
        setPage={setPage}
        setPageSize={(next) => {
          setPage(1);
          setPageSize(next);
        }}
        refetch={() => void refetch()}
        totalRecords={data?.data.pagination.totalRecords}
        isShow
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
    </Stack>
  );
}

export default PurchaseOrderReceiveList;

interface ReceiveMethodDialogProps {
  open: boolean;
  mode: 'choice' | 'camera' | 'manual';
  manualLink: string;
  manualLinkError: string;
  onModeChange: (mode: 'camera' | 'manual') => void;
  onManualLinkChange: (value: string) => void;
  onBack: () => void;
  onClose: () => void;
  onSubmitManual: () => void;
  onScan: (value: string) => void;
}

export function ReceiveMethodDialog({
  open,
  mode,
  manualLink,
  manualLinkError,
  onModeChange,
  onManualLinkChange,
  onBack,
  onClose,
  onSubmitManual,
  onScan
}: ReceiveMethodDialogProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [cameraAttempt, setCameraAttempt] = useState(0);

  useEffect(() => {
    if (!open || mode !== 'camera') return undefined;

    let cancelled = false;
    const reader = new BrowserQRCodeReader();

    const startCamera = async () => {
      if (!videoRef.current) return;
      try {
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result, _error, scannerControls) => {
            if (cancelled || !result) return;
            scannerControls.stop();
            onScan(result.getText());
          }
        );
        if (cancelled) {
          controls.stop();
        } else {
          scannerControlsRef.current = controls;
        }
      } catch {
        setCameraError(
          'ไม่สามารถเปิดกล้องหรืออ่าน QR ได้ กรุณาอนุญาตการใช้กล้อง หรือใช้การกรอกลิงก์ QR เอง'
        );
      }
    };

    setCameraError('');
    void startCamera();
    return () => {
      cancelled = true;
      scannerControlsRef.current?.stop();
      scannerControlsRef.current = null;
    };
  }, [cameraAttempt, mode, onScan, open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>เลือกวิธีรับสินค้า</DialogTitle>
      <DialogContent dividers>
        {mode === 'choice' ? (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography color="text.secondary">
                เลือกวิธีสแกน QR ใบแปะข้างกล่องเพื่อเปิดข้อมูลสำหรับรับสินค้า
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<CameraAlt />}
                onClick={() => onModeChange('camera')}>
                สแกนด้วยกล้อง
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<LinkIcon />}
                onClick={() => onModeChange('manual')}>
                กรอกหรือวางลิงก์ QR เอง
              </Button>
            </Grid>
          </Grid>
        ) : null}

        {mode === 'camera' ? (
          <Stack spacing={2}>
            <Typography color="text.secondary">
              หันกล้องไปที่ QR ใบแปะข้างกล่อง หาก Safari แสดงคำขออนุญาต ให้กด “อนุญาต”
            </Typography>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                overflow: 'hidden',
                bgcolor: 'black',
                borderRadius: 1
              }}>
              <Box
                component="video"
                ref={videoRef}
                muted
                playsInline
                sx={{ display: 'block', width: '100%', minHeight: 260, objectFit: 'cover' }}
              />
              <Box
                aria-hidden="true"
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: { xs: 'min(68vw, 280px)', sm: 280 },
                  height: { xs: 'min(68vw, 280px)', sm: 280 },
                  transform: 'translate(-50%, -50%)',
                  border: '3px solid',
                  borderColor: 'success.light',
                  borderRadius: 2,
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.28)',
                  pointerEvents: 'none'
                }}
              />
            </Box>
            {cameraError ? (
              <Stack spacing={1}>
                <Typography color="error">{cameraError}</Typography>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setCameraError('');
                    setCameraAttempt((attempt) => attempt + 1);
                  }}>
                  ขออนุญาตใช้กล้องอีกครั้ง
                </Button>
                <Typography variant="caption" color="text.secondary">
                  หากเคยเลือก “ไม่อนุญาต” ให้เปิดสิทธิ์กล้องของเว็บไซต์ใน Settings &gt; Safari ก่อน
                </Typography>
              </Stack>
            ) : null}
          </Stack>
        ) : null}

        {mode === 'manual' ? (
          <Stack spacing={2}>
            <Typography color="text.secondary">
              วางลิงก์จาก QR เช่น https://app.nutalig.com/purchase-order-receive/scan?token=...
            </Typography>
            <TextField
              fullWidth
              autoFocus
              label="ลิงก์ QR"
              value={manualLink}
              onChange={(event) => onManualLinkChange(event.target.value)}
              error={Boolean(manualLinkError)}
              helperText={manualLinkError || 'ระบบจะตรวจสอบว่าเป็นลิงก์ QR ใบแปะข้างกล่อง'}
              multiline
              minRows={2}
            />
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        {mode !== 'choice' ? (
          <Button startIcon={<ArrowBack />} onClick={onBack}>
            ย้อนกลับ
          </Button>
        ) : null}
        <Button onClick={onClose}>ปิด</Button>
        {mode === 'manual' ? (
          <Button variant="contained" onClick={onSubmitManual}>
            เปิดลิงก์
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
