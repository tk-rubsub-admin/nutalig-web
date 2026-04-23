/* eslint-disable prettier/prettier */
import { Button, Typography, Stack } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

const Page = styled.div`
  width: 100%;
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
`;

const BackButton = styled(Button)`
  margin-top: 24px !important;
`;

export default function Forbidden(): JSX.Element {
  const { t } = useTranslation();
  const history = useHistory();

  return (
    <Page>
      <Stack spacing={2} alignItems="center">
        <LockOutlined sx={{ fontSize: 80, color: 'error.main' }} />
        <Typography variant="h6">{t('forbidden.title')}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t('forbidden.msg')}
        </Typography>
        <BackButton
          variant="contained"
          color="primary"
          onClick={() => history.push('/')}
        >
          {t('button.back')}
        </BackButton>
      </Stack>
    </Page>
  );
}