import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { version } from '../../../package.json';
import { Button, Grid, IconButton, Stack } from '@mui/material';
import { Logout } from '@mui/icons-material';
import ConfirmDialog from 'components/ConfirmDialog';
import { ROUTE_PATHS } from 'routes';
import { useAuth } from 'auth/AuthContext';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';

const Footer = styled.div`
  background-color: ${(props) => props.theme.sidebar.footer.background} !important;
  padding: ${(props) => props.theme.spacing(2.75)} ${(props) => props.theme.spacing(4)};
  border-right: 1px solid rgba(0, 0, 0, 0.12);
`;

function SidebarFooter({ ...rest }): JSX.Element {
  const { t } = useTranslation();
  const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
  const history = useHistory();
  const { logOut } = useAuth();

  const handleSignOut = async () => {
    await logOut();
    history.push(ROUTE_PATHS.LOGIN);
  };
  return (
    <Footer {...rest}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ width: '100%', color: 'white' }}>
        {/* Left: Version */}
        <span>
          {t('header.version')} {version}
        </span>

        {/* Right: Logout */}
        <IconButton onClick={() => setVisibleConfirmationDialog(true)}>
          <Logout fontSize="medium" />
        </IconButton>
      </Stack>

      <ConfirmDialog
        open={visibleConfirmationDialog}
        title={'ออกจากระบบ'}
        message={'คุณต้องการออกจากระบบใช่หรือไม่'}
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        onConfirm={() => {
          handleSignOut();
          setVisibleConfirmationDialog(false);
        }}
        onCancel={() => setVisibleConfirmationDialog(false)}
        isShowCancelButton={true}
        isShowConfirmButton={true}
      />
    </Footer>
  );
}

export default SidebarFooter;
