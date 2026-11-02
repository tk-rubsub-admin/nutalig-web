import { MouseEvent } from 'react';
import { Chip, Link, Stack, Typography } from '@mui/material';
import { PurchaseOrderDeliveryRecord } from 'services/PurchaseOrder/purchase-order-type';

const LABELS = {
  NOT_ASSIGNED: 'ยังไม่จัดตู้',
  PARTIALLY_ASSIGNED: 'จัดตู้บางส่วน',
  ASSIGNED: 'จัดตู้ครบแล้ว'
};

export default function DeliveryContainerAssignment({
  delivery
}: {
  delivery: PurchaseOrderDeliveryRecord;
}) {
  if (!delivery.containerStatus) return null;
  return (
    <Stack spacing={0.5} alignItems="flex-start">
      <Chip
        size="small"
        label={LABELS[delivery.containerStatus]}
        color={
          delivery.containerStatus === 'ASSIGNED'
            ? 'success'
            : delivery.containerStatus === 'PARTIALLY_ASSIGNED'
            ? 'warning'
            : 'default'
        }
      />
      {delivery.containers?.map((container) => (
        <Typography key={container.id} variant="caption">
          <Link
            href={`/container-management?containerId=${container.id}`}
            onClick={(event: MouseEvent<HTMLAnchorElement>) => event.stopPropagation()}>
            {container.containerJobNo}
            {container.containerNo ? ` (${container.containerNo})` : ''}
          </Link>
        </Typography>
      ))}
    </Stack>
  );
}
