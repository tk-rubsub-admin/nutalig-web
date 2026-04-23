import styled from 'styled-components';
import { AppBar as MuiAppBar, IconButton, Button, Hidden, Toolbar, Box } from '@material-ui/core';
import { Menu as MenuIcon } from '@material-ui/icons';
import { useTranslation } from 'react-i18next';
import LoggedInUser from './LoggedInUser';

const AppBar = styled(MuiAppBar)`
  z-index: ${({ theme }) => theme.zIndex.drawer + 1};
  background: #333c4d;

  img {
    height: 30px;
  }
`;

export interface HeaderProps {
  onSidebarToggle: () => void;
}

function Header({ onSidebarToggle }: HeaderProps): JSX.Element {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = async () => {
    const newLang = ['en-US', 'en'].includes(i18n.language) ? 'th' : 'en';
    await i18n.changeLanguage(newLang);
  };

  return (
    <AppBar position="sticky">
      <Toolbar>
        <Button
          color="inherit"
          aria-label={t('header.aria.sidebarToggle')}
          onClick={onSidebarToggle}>
          <MenuIcon />
        </Button>

        <Box marginRight="auto" pl={1}>
          <img src={process.env.PUBLIC_URL + '/logo.png'} alt={t('header.aria.logo')} />
        </Box>

        <Box pl={1}>เวอร์ชั่น 1.0.0</Box>

        <IconButton
          color="inherit"
          onClick={handleLanguageChange}
          aria-label={t('header.aria.changeLanguage')}>
          {i18n.language === 'th' ? '🇹🇭' : '🇺🇸'}
        </IconButton>

        <LoggedInUser />
      </Toolbar>
    </AppBar>
  );
}

export default Header;
