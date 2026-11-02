import { useQuery } from 'react-query';
import { searchPurchaseOrderDeliveries } from 'services/PurchaseOrder/purchase-order-delivery-api';
import {
  ContainerRoute,
  DraftContainerLoad
} from 'services/ShippingContainer/shipping-container-api';
import DeliveryContainerDragBoard from './DeliveryContainerDragBoard';

interface Props {
  route: ContainerRoute;
  loads: DraftContainerLoad[];
  busy: boolean;
  onChange: (loads: DraftContainerLoad[]) => void;
}

export default function DraftContainerLoads({ route, loads, busy, onChange }: Props) {
  void loads;
  void busy;
  void onChange;
  const deliveries = useQuery(
    ['container-source-deliveries', route.id, route.version, '', 1],
    () =>
      searchPurchaseOrderDeliveries(
        { containerStatuses: ['NOT_ASSIGNED', 'PARTIALLY_ASSIGNED'] },
        1,
        10
      ),
    { enabled: true, keepPreviousData: true, refetchOnWindowFocus: false }
  );

  return (
    <DeliveryContainerDragBoard
      records={deliveries.data?.data.records || []}
      containerSize={route.containerSize}
    />
  );
}
