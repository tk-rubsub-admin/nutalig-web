import {
  ColorLens,
  FactCheck,
  NoteAdd,
  NotificationsActive,
  PlayArrow,
  PrecisionManufacturing,
  TaskAlt
} from '@mui/icons-material';
import {
  Box,
  IconButton,
  Chip,
  ChipProps,
  Stack,
  Step,
  StepConnector,
  StepIconProps,
  StepLabel,
  Stepper,
  Tooltip,
  Typography,
  alpha,
  stepConnectorClasses,
  styled,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { ReactElement, ReactNode, useState } from 'react';
import toast from 'react-hot-toast';
import { PERMISSIONS } from 'auth/permissions';
import { usePermissions } from 'auth/PermissionContext';
import { notifySalesProductionStarted } from 'services/PurchaseOrder/purchase-order-api';
import {
  PurchaseOrderTimeline,
  PurchaseOrderTimelineEvent
} from 'services/PurchaseOrder/purchase-order-type';

export interface PurchaseOrderProductionStepsProps {
  timeline: PurchaseOrderTimeline;
  purchaseOrderStatus?: string | null;
  title?: string;
  subtitle?: string | null;
  actions?: ReactNode;
}

interface ProductionStepDefinition {
  type: string;
  label: string;
  emptyDateLabel: string;
  icon: ReactNode;
}

const PRODUCTION_STEPS: ProductionStepDefinition[] = [
  {
    type: 'PO_CREATED',
    label: 'สร้างใบสั่งซื้อ',
    emptyDateLabel: 'ยังไม่มีวันที่',
    icon: <NoteAdd />
  },
  {
    type: 'JOB_STARTED',
    label: 'เริ่มรันงาน',
    emptyDateLabel: 'รอเริ่มรันงาน',
    icon: <PlayArrow />
  },
  {
    type: 'DIGITAL_PROOF',
    label: 'พรูฟดิจิตอลปริ้นท์',
    emptyDateLabel: '',
    icon: <FactCheck />
  },
  {
    type: 'ON_PRESS_COLOR_CHECK',
    label: 'พรูฟสีหน้าเครื่อง',
    emptyDateLabel: '',
    icon: <ColorLens />
  },
  {
    type: 'PRODUCTION_STARTED',
    label: 'เริ่มผลิต',
    emptyDateLabel: 'รอเริ่มผลิต',
    icon: <PrecisionManufacturing />
  },
  {
    type: 'PRODUCTION_IN_PROGRESS',
    label: 'กำลังผลิต',
    emptyDateLabel: 'รอเริ่มผลิต',
    icon: <PrecisionManufacturing />
  },
  {
    type: 'PRODUCTION_COMPLETED',
    label: 'ผลิตเสร็จ',
    emptyDateLabel: 'รอผลิตเสร็จ',
    icon: <TaskAlt />
  }
];

const ProductionConnector = styled(StepConnector)(({ theme }) => ({
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
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}, &.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]:
    { borderColor: theme.palette.success.main }
}));

interface ProductionStepIconProps extends StepIconProps {
  iconNode: ReactNode;
  event?: PurchaseOrderTimelineEvent;
}

function ProductionStepIcon({ active, iconNode, event }: ProductionStepIconProps): ReactElement {
  const theme = useTheme();
  const status = event?.status || 'PENDING';
  const completed = status === 'COMPLETED';
  const skipped = status === 'SKIPPED';
  const warning = status === 'CHANGES_REQUESTED' || Boolean(event?.overdue);
  const cancelled = status === 'CANCELLED';
  const highlighted = active || completed || skipped || warning;
  const color = warning
    ? 'error.main'
    : completed
    ? 'success.main'
    : skipped || cancelled
    ? 'text.disabled'
    : 'info.main';

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
        color: highlighted && !skipped ? 'common.white' : color,
        bgcolor: highlighted && !skipped ? color : 'background.paper',
        border: '2px solid',
        borderStyle: skipped ? 'dashed' : 'solid',
        borderColor: color,
        borderRadius: '50%',
        opacity: cancelled ? 0.65 : 1,
        boxShadow: active
          ? `0 0 0 5px ${alpha(
              warning ? theme.palette.error.main : theme.palette.primary.main,
              0.12
            )}`
          : 'none',
        '& svg': { fontSize: active ? 25 : 22 }
      }}>
      {iconNode}
    </Box>
  );
}

function formatProductionDate(date?: string | null): string | null {
  if (!date) return null;
  return new Intl.DateTimeFormat('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(`${date}T00:00:00`));
}

function formatProductionDateTime(dateTime?: string | null): string | null {
  if (!dateTime) return null;
  return new Intl.DateTimeFormat('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Bangkok'
  }).format(new Date(dateTime));
}

function statusCaption(event: PurchaseOrderTimelineEvent | undefined, emptyLabel: string): string {
  if (!event) return emptyLabel;
  const formattedDateTime = formatProductionDateTime(event.actualAt);
  if (event.status === 'SKIPPED')
    return formattedDateTime ? `${formattedDateTime} น.` : 'ข้ามขั้นตอน';
  if (event.status === 'CHANGES_REQUESTED')
    return formattedDateTime ? `ขอแก้ไขเมื่อ ${formattedDateTime} น.` : 'เซลล์ขอให้แก้ไขงานพรูฟ';
  if (event.status === 'CANCELLED')
    return formattedDateTime ? `ยกเลิกเมื่อ ${formattedDateTime} น.` : 'ยกเลิก';
  if (event.status === 'IN_PROGRESS')
    return formattedDateTime ? `เริ่มเมื่อ ${formattedDateTime} น.` : 'กำลังดำเนินการ';
  return formattedDateTime ? `${formattedDateTime} น.` : emptyLabel;
}

export default function PurchaseOrderProductionSteps({
  timeline,
  purchaseOrderStatus,
  title = 'Timeline',
  subtitle,
  actions
}: PurchaseOrderProductionStepsProps): ReactElement {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { has } = usePermissions();
  const canNotifySales = has(PERMISSIONS.PURCHASE_ORDER_START_RUN);
  const [isNotifyingSales, setIsNotifyingSales] = useState(false);
  const eventsByType = new Map(timeline.events.map((event) => [event.type, event]));
  const orderedEvents = PRODUCTION_STEPS.map((step) => eventsByType.get(step.type));
  const isCancelled = purchaseOrderStatus === 'CANCELLED';
  const firstPendingIndex = orderedEvents.findIndex(
    (event) => event && !['COMPLETED', 'SKIPPED'].includes(event.status)
  );
  const activeStep = isCancelled
    ? -1
    : firstPendingIndex >= 0
    ? firstPendingIndex
    : PRODUCTION_STEPS.length;
  const activeEvent = firstPendingIndex >= 0 ? orderedEvents[firstPendingIndex] : undefined;
  const currentStatus = isCancelled
    ? 'ยกเลิกใบสั่งซื้อแล้ว'
    : timeline.overdue
    ? 'การผลิตเลยกำหนด'
    : activeEvent?.status === 'CHANGES_REQUESTED'
    ? 'รอแก้ไขงานพรูฟ'
    : activeEvent?.status === 'CANCELLED'
    ? `รอดำเนินการใหม่: ${activeEvent.label}`
    : activeEvent?.status === 'IN_PROGRESS'
    ? `กำลังดำเนินการ: ${activeEvent.label}`
    : activeEvent
    ? `ขั้นถัดไป: ${activeEvent.label}`
    : 'ดำเนินการครบแล้ว';
  const currentColor: ChipProps['color'] =
    isCancelled || timeline.overdue || activeEvent?.status === 'CHANGES_REQUESTED'
      ? 'error'
      : 'info';

  const handleNotifySales = async () => {
    setIsNotifyingSales(true);
    try {
      await notifySalesProductionStarted(timeline.purchaseOrderNo);
      toast.success('ส่งการแจ้งเตือนให้เซลล์แล้ว');
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          'ไม่สามารถส่งการแจ้งเตือนให้เซลล์ได้'
      );
    } finally {
      setIsNotifyingSales(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={1}>
        <Stack spacing={0.25}>
          <Typography variant="h6">{title}</Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null}
        </Stack>
        <Chip size="small" color={currentColor} label={currentStatus} sx={{ fontWeight: 700 }} />
      </Stack>

      <Box
        sx={{
          overflowX: isMobile ? 'visible' : 'auto',
          px: { xs: 0.5, sm: 1 },
          py: 1,
          bgcolor: (muiTheme) => alpha(muiTheme.palette.success.main, 0.025),
          borderRadius: 2
        }}>
        <Stepper
          activeStep={activeStep}
          alternativeLabel={!isMobile}
          orientation={isMobile ? 'vertical' : 'horizontal'}
          connector={<ProductionConnector />}
          sx={{ minWidth: isMobile ? 0 : 1420 }}>
          {PRODUCTION_STEPS.map((step, index) => {
            const event = orderedEvents[index];
            const completed = event?.status === 'COMPLETED' || event?.status === 'SKIPPED';
            const active = index === activeStep;
            const warning = event?.status === 'CHANGES_REQUESTED' || Boolean(event?.overdue);

            return (
              <Step key={step.type} active={active} completed={completed}>
                <StepLabel
                  StepIconComponent={(props) => (
                    <ProductionStepIcon {...props} iconNode={step.icon} event={event} />
                  )}
                  sx={{
                    py: isMobile ? 0.5 : 0,
                    '& .MuiStepLabel-labelContainer': { ml: isMobile ? 1 : 0 }
                  }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMobile ? 'flex-start' : 'center'
                    }}>
                    <Stack direction="row" spacing={0.25} alignItems="center">
                      <Typography
                        variant="body2"
                        fontWeight={active || completed || warning ? 700 : 400}
                        color={
                          warning
                            ? 'error.main'
                            : event?.status === 'SKIPPED'
                            ? 'text.secondary'
                            : active
                            ? 'info.dark'
                            : completed
                            ? 'success.dark'
                            : 'text.secondary'
                        }>
                        {step.label}
                      </Typography>
                      {step.type === 'PRODUCTION_STARTED' &&
                      event?.status === 'COMPLETED' &&
                      timeline.productionStartedDate &&
                      canNotifySales ? (
                        <Tooltip title="ส่งการแจ้งเตือนเริ่มผลิตให้เซลล์">
                          <span>
                            <IconButton
                              size="small"
                              color="primary"
                              aria-label="ส่งการแจ้งเตือนเริ่มผลิตให้เซลล์"
                              onClick={() => void handleNotifySales()}
                              disabled={isNotifyingSales}
                              sx={{ p: 0.25 }}>
                              <NotificationsActive fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      ) : null}
                    </Stack>
                    <Typography variant="caption" color={warning ? 'error.main' : 'text.secondary'}>
                      {statusCaption(event, step.emptyDateLabel)}
                    </Typography>
                    {step.type === 'PRODUCTION_IN_PROGRESS' && event?.plannedDate ? (
                      <Typography
                        variant="caption"
                        color={event.overdue ? 'error.main' : 'text.secondary'}
                        sx={{ display: 'block' }}>
                        กำหนดเสร็จ {formatProductionDate(event.plannedDate)}
                      </Typography>
                    ) : null}
                    {event?.note && event.status !== 'SKIPPED' ? (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', maxWidth: 150, mx: isMobile ? 0 : 'auto' }}>
                        {event.note}
                      </Typography>
                    ) : null}
                  </Box>
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </Box>
      {actions ? <Box>{actions}</Box> : null}
    </Stack>
  );
}
