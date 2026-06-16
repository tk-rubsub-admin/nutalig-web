export const actionButtonSx = {
  minHeight: 40,
  px: 2.25,
  borderRadius: 999,
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
  backgroundColor: '#1976d2',
  color: '#fff',
  '&:hover': {
    backgroundColor: '#1565c0',
    boxShadow: 'none'
  }
};
