import styled from 'styled-components';
import { Logout } from '@mui/icons-material';
import { useHistory } from 'react-router-dom';
import { useAuth } from 'auth/AuthContext';
import { Tooltip, IconButton as MuiIconButton } from '@mui/material';
import { ROUTE_PATHS } from 'routes';

const IconButton = styled(MuiIconButton)`
  svg {
    width: 22px;
    height: 22px;
  }
`;

function NavbarUserDropdown(): JSX.Element {
  const history = useHistory();
  const { logOut } = useAuth();

  const handleSignOut = async () => {
    await logOut();
    history.push(ROUTE_PATHS.LOGIN);
  };

  return (
    <Tooltip title="Logout">
      <IconButton onClick={handleSignOut} color="inherit" size="large">
        <Logout fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}

export default NavbarUserDropdown;
