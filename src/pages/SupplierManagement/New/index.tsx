import { Button, Stack, Typography } from '@mui/material';
import PageTitle from 'components/PageTitle';
import { Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';

export default function SupplierManagementNew(): JSX.Element {
  const { t } = useTranslation();
  const history = useHistory();

  return (
    <Page>
      <PageTitle title={t('supplierManagement.action.create')} />
      <Wrapper>
        <Stack spacing={2}>
          <Typography variant="h6">{t('supplierManagement.action.create')}</Typography>
          <Typography>หน้าสร้างซัพพลายเออร์กำลังอยู่ระหว่างพัฒนา</Typography>
          <Button
            variant="contained"
            className="btn-indigo-blue"
            onClick={() => history.push(ROUTE_PATHS.SUPPLIER_MANAGEMENT)}
          >
            {t('button.back')}
          </Button>
        </Stack>
      </Wrapper>
    </Page>
  );
}
