import { createTheme as createLegacyTheme } from '@material-ui/core/styles';
import { createTheme as createMuiThemeV5 } from '@mui/material/styles';
import { THEMES } from 'theme-constants';
import createStyledTheme from './index';
import components from './components';

const styledTheme = createStyledTheme(THEMES.DEFAULT);
const typography = {
  fontFamily: styledTheme.typography.fontFamily,
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500
};

// Preserve MUI's existing spacing (8px), breakpoints and typography sizes.
// styled-components retains its existing 4px spacing and typography hierarchy.
const muiTheme = createMuiThemeV5({
  palette: styledTheme.palette,
  typography,
  // @ts-expect-error Includes existing overrides for older picker components.
  components
});

const { mode, ...palette } = muiTheme.palette;
const legacyMuiTheme = createLegacyTheme({
  palette: { ...palette, type: mode },
  typography,
  props: {
    MuiButton: components.MuiButton.defaultProps,
    MuiButtonBase: components.MuiButtonBase.defaultProps,
    MuiLink: components.MuiLink.defaultProps,
    MuiCheckbox: components.MuiCheckbox.defaultProps,
    MuiRadio: components.MuiRadio.defaultProps,
    MuiSwitch: components.MuiSwitch.defaultProps,
    MuiTabs: components.MuiTabs.defaultProps
  },
  // MUI v4 uses overrides/props; MUI v5 uses components/styleOverrides/defaultProps.
  overrides: {
    MuiCssBaseline: { '@global': components.MuiCssBaseline.styleOverrides },
    MuiInputBase: components.MuiInputBase.styleOverrides,
    MuiFormLabel: components.MuiFormLabel.styleOverrides,
    MuiTableCell: components.MuiTableCell.styleOverrides,
    MuiButton: components.MuiButton.styleOverrides,
    MuiCardHeader: components.MuiCardHeader.styleOverrides,
    MuiCard: components.MuiCard.styleOverrides,
    MuiPaper: components.MuiPaper.styleOverrides,
    MuiChip: components.MuiChip.styleOverrides,
    MuiOutlinedInput: components.MuiOutlinedInput.styleOverrides,
    MuiTooltip: components.MuiTooltip.styleOverrides
  }
});

export { styledTheme, muiTheme, legacyMuiTheme };
