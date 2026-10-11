import { ReactNode } from 'react';
import { StylesProvider } from '@material-ui/core';
import { ThemeProvider as LegacyThemeProvider } from '@material-ui/core/styles';
import { CssBaseline } from '@mui/material';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { legacyMuiTheme, muiTheme, styledTheme } from './applicationThemes';

export default function AppThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  return (
    <StylesProvider injectFirst>
      <LegacyThemeProvider theme={legacyMuiTheme}>
        <MuiThemeProvider theme={muiTheme}>
          <CssBaseline />
          <StyledThemeProvider theme={styledTheme}>{children}</StyledThemeProvider>
        </MuiThemeProvider>
      </LegacyThemeProvider>
    </StylesProvider>
  );
}
