import * as React from 'react';
import styled from 'styled-components';
import { Link, useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from 'auth/AuthContext';
import { ROUTE_PATHS } from 'routes';
import { Avatar, Badge, Box, Grid, Typography, IconButton } from '@mui/material';
import { Logout, Person } from '@mui/icons-material';
import { useQuery } from 'react-query';
import ConfirmDialog from 'components/ConfirmDialog';
import { useState } from 'react';
import { getUserProfile } from 'services/general-api';

const MenuLink = styled(Link)`
  text-decoration: none;
  color: #333;
`;

const Footer = styled.div`
  padding: ${(props) => props.theme.spacing(2.75)} ${(props) => props.theme.spacing(4)};
`;

const FooterBadge = styled(Badge)`
  margin-right: ${(props) => props.theme.spacing(1)};
  span {
    background-color: ${(props) => props.theme.sidebar.footer.online.background};
    border: 1.5px solid ${(props) => props.theme.palette.common.white};
    height: 12px;
    width: 12px;
    border-radius: 50%;
  }
`;

const ProfileInfo = styled.div`
  min-width: 0;
`;

const DisplayNameText = styled(Typography)`
  color: #1f2937;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RoleNameText = styled(Typography)`
  display: inline-flex;
  align-items: center;
  margin-top: 4px;
  padding: 2px 10px;
  border-radius: 999px;
  background: #eef3ff;
  color: #376fd0;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

function NavbarMenu({ ...rest }): JSX.Element {
  const { t } = useTranslation();
  const history = useHistory();
  const { logOut, authReady, getToken } = useAuth();
  // const { unreadCount } = useNotifications(); // ✅ ดึง unreadCount
  const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);

  const { data: profile } = useQuery('user-profile', getUserProfile, {
    enabled: authReady && !!getToken(),
    refetchOnWindowFocus: false
  });

  const handleSignOut = async () => {
    await logOut();
    history.push(ROUTE_PATHS.LOGIN);
  };

  // const handleOpenNotiCenter = (e: React.MouseEvent) => {
  //   e.stopPropagation(); // ✅ กันไป trigger container click
  //   history.push('/notifications');
  // };

  const handleOpenLogoutConfirm = (e: React.MouseEvent) => {
    e.stopPropagation(); // ✅ กันไป trigger container click
    setVisibleConfirmationDialog(true);
  };

  const picture = profile?.pictureUrl;
  const hasPicture = !!picture && picture.trim() !== ''; // ✅ แก้ logic
  const displayName = profile?.displayName?.trim() || '-';
  const roleName = profile?.role?.roleNameTh?.trim() || 'ไม่ระบุบทบาท';

  return (
    <Footer {...rest}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Grid container spacing={1} alignItems="center">
          {/* Notification Button */}
          {/* <Grid item>
            <NotificationButton />
          </Grid> */}
          {/* Avatar + Info */}
          <Grid item>
            <FooterBadge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot">
              {hasPicture ? (
                <Avatar sx={{ bgcolor: '#376fd0' }} src={picture} />
              ) : (
                <Avatar sx={{ bgcolor: '#376fd0' }}>
                  <Person />
                </Avatar>
              )}
            </FooterBadge>
          </Grid>

          <Grid item xs style={{ textAlign: 'left' }}>
            <ProfileInfo>
              <DisplayNameText title={displayName}>{displayName}</DisplayNameText>
              <RoleNameText title={roleName}>{roleName}</RoleNameText>
            </ProfileInfo>
          </Grid>

          {/* Logout Button */}
          <Grid item>
            <IconButton onClick={handleOpenLogoutConfirm}>
              <Logout fontSize="medium" />
            </IconButton>
          </Grid>
        </Grid>
      </Box>

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
        isShowCancelButton
        isShowConfirmButton
      />
    </Footer>
  );
}

export default NavbarMenu;
