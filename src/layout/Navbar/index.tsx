/* eslint-disable import/no-relative-parent-imports */
/* eslint-disable no-restricted-imports */
import styled from 'styled-components';
import { withTheme } from '@emotion/react';
import {
  Box,
  Grid,
  MenuItem,
  AppBar as MuiAppBar,
  IconButton as MuiIconButton,
  TextField,
  Toolbar
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { version } from '../../../package.json';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import NavbarMenu from './NavbarMenu';
import { isMobileOnly } from 'react-device-detect';

const AppBar = styled(MuiAppBar)`
  background: #fff !important;
  color: #999 !important;
`;

const IconButton = styled(MuiIconButton)`
  svg {
    width: 22px;
    height: 22px;
  }
`;
const VersionText = styled.div`
  margin-right: 10px;
`;

const LogoImage = styled.img`
  margin-top: 6px;
`;

interface NavbarProps {
  onSidebarToggle: (state?: boolean) => void;
}

function Navbar({ onSidebarToggle }: NavbarProps) {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = async (event) => {
    const newLang = event.target.value;
    await i18n.changeLanguage(newLang);
    setLang(i18n.language);
  };
  const [lang, setLang] = useState<string>(i18n.language);

  return (
    // <AppBar position={isMobileOnly ? 'relative' : 'sticky'} elevation={0}>
    //   <Toolbar>
    //     <Grid container alignItems="center">
    //       <Grid item>
    //         <IconButton
    //           color="inherit"
    //           aria-label="Open drawer"
    //           size="large"
    //           onClick={() => onSidebarToggle(true)}>
    //           <MenuIcon />
    //         </IconButton>
    //       </Grid>
    //       <Grid item>
    //         <VersionText>
    //           {t('header.version')} {version}
    //         </VersionText>
    //       </Grid>
    //       <Grid item>
    //         <TextField select value={lang} fullWidth onChange={handleLanguageChange}>
    //           <MenuItem value={'th'}>
    //             <img
    //               src="https://www.worldometers.info//img/flags/small/tn_th-flag.gif"
    //               width={20}
    //               height={15}
    //               style={{ paddingRight: '10px' }}
    //             />
    //             ภาษาไทย
    //           </MenuItem>
    //           <MenuItem value={'mm'}>
    //             <img
    //               src="https://www.worldometers.info//img/flags/small/tn_bm-flag.gif"
    //               width={20}
    //               height={15}
    //               style={{ paddingRight: '10px' }}
    //             />
    //             ဗမာဘာသာစကား
    //           </MenuItem>
    //           <MenuItem value={'la'}>
    //             <img
    //               src="https://www.worldometers.info//img/flags/small/tn_la-flag.gif"
    //               width={20}
    //               height={15}
    //               style={{ paddingRight: '10px' }}
    //             />
    //             ພາສາລາວ
    //           </MenuItem>
    //           <MenuItem value={'en'}>
    //             <img
    //               src="https://www.worldometers.info//img/flags/small/tn_us-flag.gif"
    //               width={20}
    //               height={15}
    //               style={{ paddingRight: '10px' }}
    //             />
    //             English
    //           </MenuItem>
    //         </TextField>
    //       </Grid>
    //       <Grid item>
    //         <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
    //           <NavbarMenu />
    //         </Box>
    //       </Grid>
    //     </Grid>
    //   </Toolbar>
    // </AppBar>
    <AppBar position={isMobileOnly ? 'relative' : 'sticky'} elevation={0}>
      <Toolbar>
        <Grid container alignItems="center">
          {/* Left: Menu Icon */}
          <Grid item>
            <IconButton
              color="inherit"
              aria-label="Open drawer"
              size="large"
              onClick={() => onSidebarToggle(true)}>
              <MenuIcon />
            </IconButton>
          </Grid>
          <Grid item xs />
          <Grid item sx={{ display: { xs: 'none', sm: 'block' }, mr: 1 }}>
            <VersionText>
              {t('header.version')} {version}
            </VersionText>
          </Grid>
          <Grid item sx={{ display: { xs: 'none', sm: 'block' }, mr: 1 }}>
            <TextField select value={lang} fullWidth onChange={handleLanguageChange} size="small">
              <MenuItem value="th">
                <img
                  src="https://www.worldometers.info//img/flags/small/tn_th-flag.gif"
                  width={20}
                  height={15}
                  style={{ paddingRight: '10px' }}
                />
                ภาษาไทย
              </MenuItem>
              <MenuItem value="mm">
                <img
                  src="https://www.worldometers.info//img/flags/small/tn_bm-flag.gif"
                  width={20}
                  height={15}
                  style={{ paddingRight: '10px' }}
                />
                ဗမာဘာသာစကား
              </MenuItem>
              <MenuItem value="la">
                <img
                  src="https://www.worldometers.info//img/flags/small/tn_la-flag.gif"
                  width={20}
                  height={15}
                  style={{ paddingRight: '10px' }}
                />
                ພາສາລາວ
              </MenuItem>
              <MenuItem value="en">
                <img
                  src="https://www.worldometers.info//img/flags/small/tn_us-flag.gif"
                  width={20}
                  height={15}
                  style={{ paddingRight: '10px' }}
                />
                English
              </MenuItem>
            </TextField>
          </Grid>
          <Grid item>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <NavbarMenu />
            </Box>
          </Grid>
        </Grid>
      </Toolbar>
    </AppBar>
  );
}

export default withTheme(Navbar);
