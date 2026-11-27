import {
  CheckCircle,
  Inventory2,
  LocalShipping
} from '@mui/icons-material';
import {
  Box,
  Chip,
  Stack,
  Step,
  StepConnector,
  StepIconProps,
  StepLabel,
  Stepper,
  Typography,
  alpha,
  stepConnectorClasses,
  styled,
  useMediaQuery,
  useTheme
} from '@mui/material';
import dayjs from 'dayjs';
import { ReactNode } from 'react';
import { PurchaseOrderDeliveryTimeline } from 'services/PurchaseOrder/purchase-order-type';

const STATUS_LABEL: Record<PurchaseOrderDeliveryTimeline['status'], string> = {
  DRAFT: 'ฉบับร่าง',
  HANDED_OVER_TO_CARRIER: 'ส่งมอบให้ขนส่งแล้ว',
  IN_TRANSIT: 'อยู่ระหว่างขนส่ง',
  PARTIALLY_RECEIVED: 'รับเข้าบางส่วน',
  RECEIVED_AT_WAREHOUSE: 'รับเข้าคลังแล้ว',
  STORE_RECEIVE_CONFIRMED: 'ยืนยันรับเข้าคลังแล้ว',
  RECEIVED_WITH_ISSUE: 'รับแล้วมีปัญหา',
  CANCELLED: 'ยกเลิกแล้ว'
};

const STEPS = [
  { label: 'ส่งมอบให้ขนส่ง', icon: <Inventory2 /> },
  { label: 'อยู่ระหว่างขนส่ง', icon: <LocalShipping /> },
  { label: 'รับเข้าคลังสินค้า', icon: <CheckCircle /> }
];

const STEP_INDEX: Partial<Record<PurchaseOrderDeliveryTimeline['status'], number>> = {
  HANDED_OVER_TO_CARRIER: 0,
  IN_TRANSIT: 1,
  PARTIALLY_RECEIVED: 2,
  RECEIVED_AT_WAREHOUSE: 2,
  STORE_RECEIVE_CONFIRMED: 2,
  RECEIVED_WITH_ISSUE: 2
};

const DELIVERY_STATUS_COLORS = {
  IN_PROGRESS: '#2563EB',
  COMPLETED: '#16A34A',
  PARTIAL: '#F59E0B',
  PENDING: '#94A3B8',
  ACTION_REQUIRED: '#DC2626'
} as const;

const DeliveryConnector = styled(StepConnector)(() => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
    left: 'calc(-50% + 22px)',
    right: 'calc(50% + 22px)'
  },
  [`&.${stepConnectorClasses.vertical}`]: { marginLeft: 21 },
  [`& .${stepConnectorClasses.line}`]: {
    minHeight: 30,
    borderColor: DELIVERY_STATUS_COLORS.PENDING,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRadius: 2
  },
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
    borderColor: DELIVERY_STATUS_COLORS.COMPLETED
  }
}));

function formatDate(value?: string | null): string {
  return value && dayjs(value).isValid() ? dayjs(value).format('DD/MM/YYYY') : '-';
}

function statusColor(status: PurchaseOrderDeliveryTimeline['status']): string {
  if (status === 'CANCELLED' || status === 'RECEIVED_WITH_ISSUE') return DELIVERY_STATUS_COLORS.ACTION_REQUIRED;
  if (status === 'RECEIVED_AT_WAREHOUSE' || status === 'STORE_RECEIVE_CONFIRMED') return DELIVERY_STATUS_COLORS.COMPLETED;
  if (status === 'PARTIALLY_RECEIVED') return DELIVERY_STATUS_COLORS.PARTIAL;
  if (status === 'HANDED_OVER_TO_CARRIER' || status === 'IN_TRANSIT') return DELIVERY_STATUS_COLORS.IN_PROGRESS;
  return DELIVERY_STATUS_COLORS.PENDING;
}

function DeliveryStepIcon({ active, completed, className, icon, iconNode, deliveryStatus }: StepIconProps & {
  iconNode: ReactNode;
  deliveryStatus: PurchaseOrderDeliveryTimeline['status'];
}) {
  const stepIndex = typeof icon === 'number' ? icon - 1 : -1;
  const isIssue = (deliveryStatus === 'RECEIVED_WITH_ISSUE' && stepIndex === 2) || deliveryStatus === 'CANCELLED';
  const isPartial = deliveryStatus === 'PARTIALLY_RECEIVED';
  const color = isIssue
    ? DELIVERY_STATUS_COLORS.ACTION_REQUIRED
    : isPartial && active
      ? DELIVERY_STATUS_COLORS.PARTIAL
      : completed
        ? DELIVERY_STATUS_COLORS.COMPLETED
        : active
          ? DELIVERY_STATUS_COLORS.IN_PROGRESS
          : DELIVERY_STATUS_COLORS.PENDING;

  return (
    <Box
      className={className}
      sx={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        color: active || completed || isIssue ? 'common.white' : color,
        bgcolor: active || completed || isIssue ? color : 'background.paper',
        border: '2px solid',
        borderColor: color,
        borderRadius: '50%',
        boxShadow: active ? `0 0 0 5px ${alpha(color, 0.12)}` : 'none',
        '& svg': { fontSize: active ? 25 : 22 }
      }}>
      {iconNode}
    </Box>
  );
}

function stepLabelColor(
  status: PurchaseOrderDeliveryTimeline['status'],
  stepIndex: number,
  activeStep: number
): string {
  if (status === 'CANCELLED') return DELIVERY_STATUS_COLORS.ACTION_REQUIRED;
  if (status === 'RECEIVED_WITH_ISSUE' && stepIndex === 2) return DELIVERY_STATUS_COLORS.ACTION_REQUIRED;
  if (status === 'PARTIALLY_RECEIVED' && stepIndex === 2) return DELIVERY_STATUS_COLORS.PARTIAL;
  if (stepIndex < activeStep) return DELIVERY_STATUS_COLORS.COMPLETED;
  if (stepIndex === activeStep) return DELIVERY_STATUS_COLORS.IN_PROGRESS;
  return DELIVERY_STATUS_COLORS.PENDING;
}

function DeliveryTimeline({ delivery }: { delivery: PurchaseOrderDeliveryTimeline }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isCancelled = delivery.status === 'CANCELLED';
  const activeStep = isCancelled ? -1 : (STEP_INDEX[delivery.status] ?? -1);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 }, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          เที่ยวส่ง {delivery.deliveryNo || `#${delivery.id}`}
        </Typography>
        <Chip
          size="small"
          label={STATUS_LABEL[delivery.status] || delivery.status}
          variant="outlined"
          sx={{
            color: statusColor(delivery.status),
            borderColor: statusColor(delivery.status),
            backgroundColor: alpha(statusColor(delivery.status), 0.1)
          }}
        />
      </Stack>

      <Stepper
        activeStep={activeStep}
        orientation={isMobile ? 'vertical' : 'horizontal'}
        alternativeLabel={!isMobile}
        connector={<DeliveryConnector />}>
        {STEPS.map((step, stepIndex) => (
          <Step key={step.label}>
            <StepLabel
              StepIconComponent={(props) => (
                <DeliveryStepIcon
                  {...props}
                  iconNode={step.icon}
                  deliveryStatus={delivery.status}
                />
              )}
            >
              <Typography
                variant="body2"
                sx={{ color: stepLabelColor(delivery.status, stepIndex, activeStep), fontWeight: 600 }}>
                {step.label}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 2 }} sx={{ mt: 1.5 }}>
        <Typography>ส่งมอบเมื่อ {formatDate(delivery.shippedAt)}</Typography>
        <Typography>อยู่ระหว่างขนส่งวันที่ {formatDate(delivery.inTransitDate)}</Typography>
        <Typography>คาดว่าจะถึงคลังวันที่ {formatDate(delivery.expectedWarehouseDate)}</Typography>
        <Typography>รับเข้าคลังวันที่ {formatDate(delivery.receivedAt)}</Typography>
      </Stack>
    </Box>
  );
}

export default function SalesOrderDeliveryTimeline({ deliveries }: { deliveries?: PurchaseOrderDeliveryTimeline[] }) {
  if (!deliveries?.length) {
    return <Typography color="text.secondary">ยังไม่มีเที่ยวขนส่งสำหรับใบสั่งซื้อนี้</Typography>;
  }

  return (
    <Stack spacing={1.5}>
      {deliveries.map((delivery) => <DeliveryTimeline key={delivery.id} delivery={delivery} />)}
    </Stack>
  );
}
