import '@mui/lab/themeAugmentation';
import { createTheme as createMuiTheme } from '@mui/material/styles';
import variants from './variants';
import typography from './typography';
import breakpoints from './breakpoints';
import components from './components';
import shadows from './shadows';

const createTheme = (name: string) => {
  let themeConfig = variants.find((variant) => variant.name === name);

  console.log(themeConfig.name);

  if (!themeConfig) {
    themeConfig = variants[0];  // <-- fallback เป็น DEFAULT
  }
  console.log(themeConfig.palette)
  return createMuiTheme(
    {
      spacing: 4,
      breakpoints,
      // @ts-expect-error
      components,
      typography,
      shadows,
      palette: themeConfig.palette
    },
    {
      name: themeConfig.name,
      header: themeConfig.header,
      footer: themeConfig.footer,
      sidebar: themeConfig.sidebar,
      size: {
        sidebar: '258px'
      }
    }
  );
};

export default createTheme;
