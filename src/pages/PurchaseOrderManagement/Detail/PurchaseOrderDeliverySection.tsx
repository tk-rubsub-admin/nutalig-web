import { BRAND_COLORS } from 'theme/brandTokens';
import { CheckCircle, DirectionsBoat, ExpandMore, Inventory2, LocalShipping } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  CircularProgress,
  Stack,
  Step,
  StepConnector,
  StepIconProps,
  StepLabel,
  Stepper,
  alpha,
  stepConnectorClasses,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { ReactElement, ReactNode, useState } from 'react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { usePermissions } from 'auth/PermissionContext';
import { PERMISSIONS } from 'auth/permissions';
import { markPurchaseOrderDeliveryInTransit } from 'services/PurchaseOrder/purchase-order-api';
import { PurchaseOrderDeliveryRecord } from 'services/PurchaseOrder/purchase-order-type';
import { getShippingMethodLabel, isSeaShippingMethod } from 'utils/shipping';

interface Props {
  deliveries?: PurchaseOrderDeliveryRecord[];
  onDeliveryUpdated?: () => Promise<unknown>;
}

const DELIVERY_STATUS: Record<PurchaseOrderDeliveryRecord['status'], string> = {
  DRAFT: 'ฉบับร่าง',
  HANDED_OVER_TO_CARRIER: 'ส่งมอบให้ขนส่งแล้ว',
  IN_TRANSIT: 'อยู่ระหว่างขนส่ง',
  RECEIVED_AT_WAREHOUSE: 'รับเข้าคลังแล้ว',
  CANCELLED: 'ยกเลิกแล้ว'
};

const DELIVERY_STEPS: Array<{
  status: 'HANDED_OVER_TO_CARRIER' | 'IN_TRANSIT' | 'RECEIVED_AT_WAREHOUSE';
  label: string;
  icon: ReactNode;
}> = [
    { status: 'HANDED_OVER_TO_CARRIER', label: 'ส่งมอบให้ขนส่ง', icon: <Inventory2 /> },
    { status: 'IN_TRANSIT', label: 'อยู่ระหว่างขนส่ง', icon: <LocalShipping /> },
    { status: 'RECEIVED_AT_WAREHOUSE', label: 'รับเข้าคลังสินค้า', icon: <CheckCircle /> }
  ];

const DeliveryConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
    left: 'calc(-50% + 22px)',
    right: 'calc(50% + 22px)'
  },
  [`&.${stepConnectorClasses.vertical}`]: { marginLeft: 21 },
  [`& .${stepConnectorClasses.line}`]: {
    minHeight: 30,
    borderColor: theme.palette.divider,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRadius: 2
  },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}, &.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.success.main
  }
}));

interface DeliveryStepIconProps extends StepIconProps {
  iconNode: ReactNode;
}

function DeliveryStepIcon({ active, completed, iconNode }: DeliveryStepIconProps): ReactElement {
  const theme = useTheme();
  const highlighted = Boolean(active || completed);
  return (
    <Box
      sx={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        color: highlighted ? 'common.white' : 'text.disabled',
        bgcolor: highlighted ? 'success.main' : 'background.paper',
        border: '2px solid',
        borderColor: highlighted ? 'success.main' : 'divider',
        borderRadius: '50%',
        boxShadow: active ? `0 0 0 5px ${alpha(theme.palette.success.main, 0.12)}` : 'none',
        transition: 'all 180ms ease',
        '& svg': { fontSize: active ? 25 : 22 }
      }}>
      {iconNode}
    </Box>
  );
}

const DELIVERY_STEP_INDEX: Partial<Record<PurchaseOrderDeliveryRecord['status'], number>> = {
  HANDED_OVER_TO_CARRIER: 0,
  IN_TRANSIT: 1,
  RECEIVED_AT_WAREHOUSE: 2
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

export default function PurchaseOrderDeliverySection({ deliveries = [], onDeliveryUpdated }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { has } = usePermissions();
  const canUpdateDelivery = has(PERMISSIONS.PURCHASE_ORDER_START_RUN);
  const [selectedDelivery, setSelectedDelivery] = useState<PurchaseOrderDeliveryRecord | null>(null);
  const [trackingNumberDraft, setTrackingNumberDraft] = useState('');
  const [inTransitDateDraft, setInTransitDateDraft] = useState('');
  const [isUpdatingDelivery, setIsUpdatingDelivery] = useState(false);
  const [collapsedDeliveryIds, setCollapsedDeliveryIds] = useState<Set<number>>(() => new Set());
  if (!deliveries.length) {
    return (
      <Box sx={{ py: 3 }}>
        <Typography color="text.secondary" align="center">
          ยังไม่มีข้อมูลการขนส่งสินค้า
        </Typography>
      </Box>
    );
  }

  const handleOpenTransitDialog = (delivery: PurchaseOrderDeliveryRecord) => {
    setSelectedDelivery(delivery);
    setTrackingNumberDraft(delivery.trackingNumber || '');
    setInTransitDateDraft(dayjs().format('YYYY-MM-DD'));
  };

  const handleCloseTransitDialog = () => {
    if (isUpdatingDelivery) return;
    setSelectedDelivery(null);
    setTrackingNumberDraft('');
    setInTransitDateDraft('');
  };

  const handleConfirmInTransit = async () => {
    if (!selectedDelivery?.purchaseOrderNo || !selectedDelivery.id || !trackingNumberDraft.trim() || !inTransitDateDraft) return;
    setIsUpdatingDelivery(true);
    try {
      await markPurchaseOrderDeliveryInTransit(
        selectedDelivery.purchaseOrderNo,
        selectedDelivery.id,
        trackingNumberDraft.trim(),
        inTransitDateDraft
      );
      toast.success('อัปเดตสถานะเป็นอยู่ระหว่างขนส่งแล้ว');
      setSelectedDelivery(null);
      setTrackingNumberDraft('');
      setInTransitDateDraft('');
      await onDeliveryUpdated?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'ไม่สามารถอัปเดตสถานะขนส่งได้');
    } finally {
      setIsUpdatingDelivery(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h6">รายการเที่ยวขนส่ง ({deliveries.length})</Typography>
      {deliveries.map((delivery) => (
        <Accordion
          key={delivery.id}
          defaultExpanded
          disableGutters
          onChange={(_event, expanded) => {
            setCollapsedDeliveryIds((previous) => {
              const next = new Set(previous);
              if (expanded) next.delete(delivery.id);
              else next.add(delivery.id);
              return next;
            });
          }}
          sx={{
            border: `1px solid ${BRAND_COLORS.sand}`,
            borderRadius: '8px !important',
            boxShadow: 'none',
            '&:before': { display: 'none' }
          }}>
          <AccordionSummary
            expandIcon={<ExpandMore />}
            sx={{
              px: { xs: 1.5, sm: 2 },
              '& .MuiAccordionSummary-content': { my: 1.5, mr: 1, flexGrow: 1 }
            }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1.5}
              sx={{ width: '100%', minWidth: 0 }}>
              <Stack alignItems="flex-start" spacing={0.5} sx={{ minWidth: 0 }}>
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
              {canUpdateDelivery &&
                delivery.status === 'HANDED_OVER_TO_CARRIER' &&
                !collapsedDeliveryIds.has(delivery.id) ? (
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<LocalShipping />}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpenTransitDialog(delivery);
                  }}
                  sx={{ flexShrink: 0 }}>
                  อยู่ระหว่างขนส่ง
                </Button>
              ) : null}
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ px: { xs: 1.5, sm: 2 }, pt: 0, pb: { xs: 1.5, sm: 2 } }}>
            <Stack spacing={2}>
              <Stepper
                activeStep={DELIVERY_STEP_INDEX[delivery.status] ?? -1}
                alternativeLabel={!isMobile}
                orientation={isMobile ? 'vertical' : 'horizontal'}
                connector={<DeliveryConnector />}
                sx={{
                  px: { xs: 0, sm: 2 },
                  minWidth: isMobile ? 0 : 440,
                  '& .MuiStepLabel-label': { mt: 0.5, fontSize: { xs: 12, sm: 13 } }
                }}>
                {DELIVERY_STEPS.map((step, index) => (
                  <Step
                    key={step.status}
                    active={DELIVERY_STEP_INDEX[delivery.status] === index}
                    completed={(DELIVERY_STEP_INDEX[delivery.status] ?? -1) > index}>
                    <StepLabel
                      StepIconComponent={(props) => (
                        <DeliveryStepIcon
                          {...props}
                          iconNode={
                            step.status === 'IN_TRANSIT' && isSeaShippingMethod(delivery.shippingMethod)
                              ? <DirectionsBoat />
                              : step.icon
                          }
                        />
                      )}
                      sx={{
                        py: isMobile ? 0.5 : 0,
                        '& .MuiStepLabel-labelContainer': { ml: isMobile ? 1 : 0 },
                        '& .MuiStepLabel-label': { mt: { xs: 1.25, sm: 1.5 } }
                      }}>
                      <Typography
                        variant="body2"
                        fontWeight={DELIVERY_STEP_INDEX[delivery.status] === index ? 700 : 500}
                        color={
                          (DELIVERY_STEP_INDEX[delivery.status] ?? -1) >= index
                            ? 'success.dark'
                            : 'text.secondary'
                        }>
                        {step.label}
                      </Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>

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
                {delivery.trackingNumber ? (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      เลข Tracking
                    </Typography>
                    <Typography variant="body2">{delivery.trackingNumber}</Typography>
                  </Grid>
                ) : null}
                {delivery.inTransitDate ? (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      วันที่เริ่มอยู่ระหว่างขนส่ง
                    </Typography>
                    <Typography variant="body2">{formatDate(delivery.inTransitDate)}</Typography>
                  </Grid>
                ) : null}
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
          </AccordionDetails>
        </Accordion>
      ))}
      <Dialog open={Boolean(selectedDelivery)} onClose={handleCloseTransitDialog} fullWidth maxWidth="xs">
        <DialogTitle>ยืนยันสถานะอยู่ระหว่างขนส่ง</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="เที่ยวส่งสินค้า"
              value={selectedDelivery?.deliveryNo}
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
            />
            <TextField
              autoFocus
              required
              fullWidth
              label="เลข Tracking"
              value={trackingNumberDraft}
              onChange={(event) => setTrackingNumberDraft(event.target.value)}
              inputProps={{ maxLength: 255 }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              required
              fullWidth
              type="date"
              label="วันที่เริ่มอยู่ระหว่างขนส่ง"
              value={inTransitDateDraft}
              onChange={(event) => setInTransitDateDraft(event.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: selectedDelivery?.shippedAt
                  ? dayjs(selectedDelivery.shippedAt).format('YYYY-MM-DD')
                  : undefined
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTransitDialog} disabled={isUpdatingDelivery}>
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => void handleConfirmInTransit()}
            disabled={!trackingNumberDraft.trim() || !inTransitDateDraft || isUpdatingDelivery}
            startIcon={isUpdatingDelivery ? <CircularProgress size={16} color="inherit" /> : undefined}>
            ยืนยัน
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
