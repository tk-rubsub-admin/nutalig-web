import {
  Cancel,
  CheckCircle,
  Inventory,
  LocalShipping,
  Payment,
  RadioButtonUnchecked,
  ShoppingCart
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
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ReactElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export type OrderStatus =
  | 'AWAITING_PAYMENT'
  | 'ORDER_CONFIRMED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

interface OrderStepDefinition {
  key: OrderStatus;
  icon: ReactNode;
}

const ORDER_STEPS: OrderStepDefinition[] = [
  { key: 'AWAITING_PAYMENT', icon: <Payment /> },
  { key: 'ORDER_CONFIRMED', icon: <ShoppingCart /> },
  { key: 'PROCESSING', icon: <Inventory /> },
  { key: 'COMPLETED', icon: <CheckCircle /> },
  { key: 'SHIPPED', icon: <LocalShipping /> },
  { key: 'DELIVERED', icon: <CheckCircle /> }
];

const CANCELLED_STEP: OrderStepDefinition = {
  key: 'CANCELLED',
  icon: <Cancel />
};

const TrackingConnector = styled(StepConnector, {
  shouldForwardProp: (prop) => prop !== 'cancelled'
})<{ cancelled?: boolean }>(({ theme, cancelled }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 25,
    left: 'calc(-50% + 25px)',
    right: 'calc(50% + 25px)'
  },
  [`&.${stepConnectorClasses.vertical}`]: {
    marginLeft: 24
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.divider,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRadius: 2,
    minHeight: 34,
    transition: theme.transitions.create('border-color')
  },
  ...(!cancelled && {
    [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}, &.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]:
      {
        borderColor: theme.palette.success.main
      }
  })
}));

interface TrackingStepIconProps extends StepIconProps {
  iconNode: ReactNode;
  cancelled?: boolean;
  delivered?: boolean;
}

function TrackingStepIcon({
  active,
  completed,
  iconNode,
  cancelled,
  delivered
}: TrackingStepIconProps): ReactElement {
  const highlighted = active || completed;
  const color = cancelled ? 'error.main' : 'success.main';

  return (
    <Box
      sx={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 50,
        height: 50,
        color: highlighted ? 'common.white' : 'text.disabled',
        bgcolor: highlighted ? color : 'background.paper',
        border: '2px solid',
        borderColor: highlighted ? color : 'divider',
        borderRadius: '50%',
        boxShadow: active ? `0 0 0 5px ${cancelled ? '#ffebee' : '#e8f5e9'}` : 'none',
        transition: 'all 180ms ease',
        '& svg': { fontSize: delivered || active ? 27 : 24 }
      }}>
      {iconNode}
    </Box>
  );
}

export interface OrderProgressProps {
  status: OrderStatus | string;
  label?: string;
}

export default function OrderProgress({ status, label }: OrderProgressProps): ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isCancelled = status === 'CANCELLED';
  const statusIndex = ORDER_STEPS.findIndex((step) => step.key === status);
  const hasKnownStatus = isCancelled || statusIndex >= 0;
  const displayedSteps = isCancelled ? [...ORDER_STEPS, CANCELLED_STEP] : ORDER_STEPS;
  const activeStep = isCancelled ? displayedSteps.length - 1 : Math.max(statusIndex, 0);
  const currentStep = isCancelled
    ? CANCELLED_STEP
    : ORDER_STEPS[Math.max(statusIndex, 0)] || ORDER_STEPS[0];
  const statusLabel = label || t(`status.saleOrder.${hasKnownStatus ? currentStep.key : status}`);

  return (
    <Stack spacing={{ xs: 2, sm: 3 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{
          px: { xs: 1.5, sm: 2 },
          py: 1.5,
          bgcolor: (muiTheme) =>
            alpha(isCancelled ? muiTheme.palette.error.main : muiTheme.palette.success.main, 0.07),
          border: '1px solid',
          borderColor: isCancelled ? 'error.light' : 'success.light',
          borderRadius: 2
        }}>
        <Stack direction="row" alignItems="center" spacing={1.25} minWidth={0}>
          <Box sx={{ color: isCancelled ? 'error.main' : 'success.main', display: 'flex' }}>
            {isCancelled ? <Cancel /> : currentStep.icon}
          </Box>
          <Box minWidth={0}>
            <Typography variant="caption" color="text.secondary">
              {t('viewOrder.currentStatus')}
            </Typography>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              color={isCancelled ? 'error.main' : 'success.dark'}
              noWrap>
              {statusLabel}
            </Typography>
          </Box>
        </Stack>
        <Chip
          size="small"
          color={isCancelled ? 'error' : currentStep.key === 'DELIVERED' ? 'success' : 'primary'}
          label={isCancelled ? 'ยกเลิกแล้ว' : `ขั้นตอน ${activeStep + 1}/${ORDER_STEPS.length}`}
          sx={{ flexShrink: 0, fontWeight: 700 }}
        />
      </Stack>

      <Box sx={{ overflowX: isMobile ? 'visible' : 'auto', px: { xs: 0.5, sm: 1 }, pb: 1 }}>
        <Stepper
          activeStep={activeStep}
          alternativeLabel={!isMobile}
          orientation={isMobile ? 'vertical' : 'horizontal'}
          connector={<TrackingConnector cancelled={isCancelled} />}
          sx={{ minWidth: isMobile ? 0 : isCancelled ? 760 : 680 }}>
          {displayedSteps.map((step, index) => {
            const isCurrent = index === activeStep;
            const isCompleted = !isCancelled && statusIndex >= 0 && index < activeStep;
            const isFuture = !isCurrent && !isCompleted;
            const stepIsCancelled = step.key === 'CANCELLED';

            return (
              <Step key={step.key} active={isCurrent} completed={isCompleted}>
                <StepLabel
                  StepIconComponent={(props) => (
                    <TrackingStepIcon
                      {...props}
                      iconNode={isFuture && isMobile ? <RadioButtonUnchecked /> : step.icon}
                      cancelled={stepIsCancelled}
                      delivered={step.key === 'DELIVERED'}
                    />
                  )}
                  sx={{
                    py: isMobile ? 0.5 : 0,
                    '& .MuiStepLabel-labelContainer': {
                      ml: isMobile ? 1 : 0
                    }
                  }}>
                  <Typography
                    variant="body2"
                    fontWeight={isCurrent ? 700 : isCompleted ? 600 : 400}
                    color={
                      stepIsCancelled && isCurrent
                        ? 'error.main'
                        : isCurrent || isCompleted
                        ? 'success.dark'
                        : 'text.secondary'
                    }>
                    {t(`status.saleOrder.${step.key}`)}
                  </Typography>
                  {isMobile && isCurrent ? (
                    <Typography variant="caption" color="text.secondary">
                      สถานะปัจจุบันของคำสั่งซื้อ
                    </Typography>
                  ) : null}
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </Box>
    </Stack>
  );
}
