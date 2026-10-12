import { alpha } from '@mui/material/styles';
import { BRAND_COLORS, BRAND_CSS_VARIABLES, BRAND_UI } from './brandTokens';

const components = {
  MuiCssBaseline: {
    styleOverrides: {
      ':root': BRAND_CSS_VARIABLES,
      body: {
        color: BRAND_COLORS.charcoal,
        backgroundColor: BRAND_UI.surface
      }
    }
  },
  MuiInputBase: {
    styleOverrides: {
      root: {
        color: BRAND_COLORS.charcoal
      },
      input: {
        color: BRAND_COLORS.charcoal
      }
    }
  },
  MuiFormLabel: {
    styleOverrides: {
      root: {
        color: BRAND_COLORS.charcoal
      }
    }
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        color: BRAND_COLORS.charcoal,
        borderBottomColor: BRAND_COLORS.sand
      },
      head: {
        color: BRAND_COLORS.green,
        backgroundColor: BRAND_UI.sandTint
      }
    }
  },
  MuiButton: {
    defaultProps: {
      variant: 'contained' as const,
      disableElevation: true
    },
    styleOverrides: {
      root: {
        minHeight: 40,
        paddingLeft: 18,
        paddingRight: 18,
        borderRadius: 6,
        textTransform: 'none' as const,
        fontWeight: 700,
        boxShadow: 'none',
        '&:hover': {
          boxShadow: 'none'
        }
      },
      contained: {
        boxShadow: 'none',
        '&:hover': {
          boxShadow: 'none'
        }
      },
      outlined: {
        borderWidth: 1.5,
        '&:hover': {
          borderWidth: 1.5,
          boxShadow: 'none'
        }
      },
      text: {
        backgroundColor: 'transparent',
        '&:hover': {
          boxShadow: 'none',
          backgroundColor: BRAND_UI.greenTint
        }
      }
    }
  },
  MuiButtonBase: {
    defaultProps: {
      disableRipple: true
    }
  },
  MuiLink: {
    defaultProps: {
      underline: 'hover' as const
    }
  },
  MuiCardHeader: {
    defaultProps: {
      titleTypographyProps: {
        variant: 'h6'
      }
    },
    styleOverrides: {
      action: {
        marginTop: '-4px',
        marginRight: '-4px'
      }
    }
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: '6px',
        boxShadow: `0px 2px 5px -1px ${alpha(BRAND_COLORS.charcoal, 0.04)}, 0px 1px 3px -1px ${alpha(BRAND_COLORS.charcoal, 0.06)}`,
        backgroundImage: 'none',
        backgroundColor: BRAND_UI.surface,
        border: `1px solid ${BRAND_COLORS.sand}`
      }
    }
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        backgroundColor: BRAND_UI.surface
      }
    }
  },
  MuiPickersDay: {
    styleOverrides: {
      day: {
        fontWeight: '300'
      }
    }
  },
  MuiPickersYear: {
    styleOverrides: {
      root: {
        height: '64px'
      }
    }
  },
  MuiPickersCalendar: {
    styleOverrides: {
      transitionContainer: {
        marginTop: '6px'
      }
    }
  },
  MuiPickersCalendarHeader: {
    styleOverrides: {
      iconButton: {
        backgroundColor: 'transparent',
        '& > *': {
          backgroundColor: 'transparent'
        }
      },
      switchHeader: {
        marginTop: '2px',
        marginBottom: '4px'
      }
    }
  },
  MuiPickersClock: {
    styleOverrides: {
      container: {
        margin: `32px 0 4px`
      }
    }
  },
  MuiPickersClockNumber: {
    styleOverrides: {
      clockNumber: {
        left: `calc(50% - 16px)`,
        width: '32px',
        height: '32px'
      }
    }
  },
  MuiPickerDTHeader: {
    styleOverrides: {
      dateHeader: {
        '& h4': {
          fontSize: '2.125rem',
          fontWeight: 400
        }
      },
      timeHeader: {
        '& h3': {
          fontSize: '3rem',
          fontWeight: 400
        }
      }
    }
  },
  MuiPickersTimePicker: {
    styleOverrides: {
      hourMinuteLabel: {
        '& h2': {
          fontSize: '3.75rem',
          fontWeight: 300
        }
      }
    }
  },
  MuiPickersToolbar: {
    styleOverrides: {
      toolbar: {
        '& h4': {
          fontSize: '2.125rem',
          fontWeight: 400
        }
      }
    }
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: '6px'
      },
      outlined: {
        borderColor: BRAND_COLORS.sand
      }
    }
  },
  MuiOutlinedInput: {
    styleOverrides: {
      notchedOutline: {
        borderColor: BRAND_COLORS.sand
      }
    }
  },
  MuiCheckbox: {
    defaultProps: { color: 'primary' as const }
  },
  MuiRadio: {
    defaultProps: { color: 'primary' as const }
  },
  MuiSwitch: {
    defaultProps: { color: 'primary' as const }
  },
  MuiTabs: {
    defaultProps: { textColor: 'primary' as const, indicatorColor: 'primary' as const }
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        backgroundColor: BRAND_COLORS.charcoal,
        color: BRAND_COLORS.ivory
      },
      arrow: {
        color: BRAND_COLORS.charcoal
      }
    }
  }
};

export default components;
