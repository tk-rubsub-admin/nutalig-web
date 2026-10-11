import { BRAND_COLORS, BRAND_UI } from 'theme/brandTokens';
export const actionButtonSx = {
  minHeight: 40,
  px: 2.25,
  borderRadius: 6,
  textTransform: 'none',
  fontWeight: 700,
  boxShadow: 'none',
  '&:hover': {
    boxShadow: 'none'
  }
};

export const outlinedActionButtonSx = {
  ...actionButtonSx,
  borderWidth: 1.5,
  '&:hover': {
    borderWidth: 1.5,
    boxShadow: 'none'
  }
};

export const blueActionButtonSx = {
  ...actionButtonSx,
  backgroundColor: BRAND_COLORS.green,
  color: BRAND_COLORS.ivory,
  '&:hover': {
    backgroundColor: BRAND_UI.greenHover,
    boxShadow: 'none'
  }
};
