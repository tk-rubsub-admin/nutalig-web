import { Alert } from '@mui/material';
import { useHistory, useParams } from 'react-router-dom';
import { useQueryClient } from 'react-query';
import PageTitle from 'components/PageTitle';
import { Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { ROUTE_PATHS } from 'routes';
import ShippingContainerEditor from './ShippingContainerEditor';

export default function ShippingContainerPage() {
  const { id } = useParams<{ id?: string }>();
  const history = useHistory();
  const client = useQueryClient();
  const containerId = id === undefined ? null : Number(id);
  const invalidId =
    containerId !== null && (!Number.isSafeInteger(containerId) || containerId <= 0);
  return (
    <Page>
      <PageTitle
        title={containerId === null ? 'สร้างตู้คอนเทนเนอร์' : 'รายละเอียดตู้คอนเทนเนอร์'}
      />
      <Wrapper>
        {invalidId ? (
          <Alert severity="error">หมายเลขงานตู้ไม่ถูกต้อง</Alert>
        ) : (
          <ShippingContainerEditor
            variant="page"
            open
            id={containerId}
            onClose={() => history.push(ROUTE_PATHS.CONTAINER_MANAGEMENT)}
            onUpdated={() => {
              void client.invalidateQueries(['shipping-containers']);
            }}
            onCreated={(createdId) =>
              history.replace(ROUTE_PATHS.CONTAINER_DETAIL.replace(':id', String(createdId)))
            }
          />
        )}
      </Wrapper>
    </Page>
  );
}
