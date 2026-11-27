import PageTitle from 'components/PageTitle';
import { Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import PurchaseOrderDeliverySearch from 'pages/ContainerManagement/PurchaseOrderDeliverySearch';

export default function PurchaseOrderDeliveryManagement(): JSX.Element {
  return (
    <Page>
      <PageTitle title="เที่ยวส่ง" />
      <Wrapper>
        <PurchaseOrderDeliverySearch warehouseView />
      </Wrapper>
    </Page>
  );
}
