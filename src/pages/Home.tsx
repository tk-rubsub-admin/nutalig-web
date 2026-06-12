import { Box, Stack, Typography } from '@mui/material';
import PageTitle from 'components/PageTitle';
import { Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { useTranslation } from 'react-i18next';
import HomeWidgets from 'pages/Home/HomeWidgets';

export default function Home(): JSX.Element {
  const { t } = useTranslation();

  return (
    <Page>
      <PageTitle title={t('home.title')} />
      <Wrapper sx={{ mt: 2 }}>
        <HomeWidgets />
      </Wrapper>
    </Page>
  );
}
