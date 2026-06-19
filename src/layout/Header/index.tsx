import styled from 'styled-components';
import {
  AppBar as MuiAppBar,
  IconButton,
  Button,
  ButtonGroup,
  Hidden,
  Toolbar,
  Box
} from '@material-ui/core';
import { Menu as MenuIcon } from '@material-ui/icons';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useState } from 'react';
import LoggedInUser from './LoggedInUser';

const AppBar = styled(MuiAppBar)`
  z-index: ${({ theme }) => theme.zIndex.drawer + 1};
  background: #333c4d;

  img {
    height: 30px;
  }
`;

const LanguageButtonGroup = styled(ButtonGroup)`
  box-shadow: none;
`;

const normalizeLanguage = (language?: string) => {
  if (language === 'th' || language === 'th-TH') return 'th';
  return 'en';
};

export interface HeaderProps {
  onSidebarToggle: () => void;
}

function Header({ onSidebarToggle }: HeaderProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState<string>(normalizeLanguage(i18n.language));

  useEffect(() => {
    setLang(normalizeLanguage(i18n.language));
  }, [i18n.language]);

  const handleLanguageChange = async (newLang: string) => {
    if (newLang === lang) return;
    await i18n.changeLanguage(newLang);
    setLang(newLang);
  };

  const languageButtons = useMemo(
    () => [
      { code: 'th', label: 'TH' },
      { code: 'en', label: 'EN' }
    ],
    []
  );

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

        <LanguageButtonGroup color="inherit" aria-label={t('header.aria.changeLanguage')}>
          {languageButtons.map((item) => {
            const selected = lang === item.code;
            return (
              <Button
                key={item.code}
                color="inherit"
                variant={selected ? 'contained' : 'outlined'}
                disabled={selected}
                onClick={() => handleLanguageChange(item.code)}>
                {item.label}
              </Button>
            );
          })}
        </LanguageButtonGroup>

        <LoggedInUser />
      </Toolbar>
    </AppBar>
  );
}

export default Header;
