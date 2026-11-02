import { Box, Tab, Tabs } from '@mui/material';
import { useState } from 'react';
import PageTitle from 'components/PageTitle';
import { Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import ShippingContainerList from './ShippingContainerList';
import PurchaseOrderDeliverySearch from './PurchaseOrderDeliverySearch';
export default function ContainerManagement() {
  const [tab, setTab] = useState(0);
  return (
    <Page>
      <PageTitle title="จัดการตู้คอนเทนเนอร์" />
      <Wrapper>
        <Tabs value={tab} onChange={(_, next) => setTab(next)} sx={{ mb: 2 }}>
          <Tab label="ตู้คอนเทนเนอร์" />
          <Tab label="เที่ยวส่ง" />
        </Tabs>
        <Box>{tab === 0 ? <ShippingContainerList /> : <PurchaseOrderDeliverySearch />}</Box>
      </Wrapper>
    </Page>
  );
}
