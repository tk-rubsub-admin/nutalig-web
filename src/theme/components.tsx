const components = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        color: '#30302F'
      }
    }
  },
  MuiTypography: {
    styleOverrides: {
      root: {
        color: 'inherit'
      }
    }
  },
  MuiInputBase: {
    styleOverrides: {
      root: {
        color: '#30302F'
      },
      input: {
        color: '#30302F'
      }
    }
  },
  MuiFormLabel: {
    styleOverrides: {
      root: {
        color: '#30302F'
      }
    }
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        color: '#30302F'
      }
    }
  },
  MuiButton: {
    defaultProps: {
      variant: 'contained',
      disableElevation: true
    },
    styleOverrides: {
      root: {
        minHeight: 40,
        paddingLeft: 18,
        paddingRight: 18,
        borderRadius: 6,
        textTransform: 'none',
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
        backgroundColor: 'rgba(25, 118, 210, 0.12)',
        '&:hover': {
          boxShadow: 'none'
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
      underline: 'hover'
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
        boxShadow: 'rgba(50, 50, 93, 0.025) 0px 2px 5px -1px, rgba(0, 0, 0, 0.05) 0px 1px 3px -1px',
        backgroundImage: 'none',
        backgroundColor: '#D4C5BA'
      }
    }
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        backgroundColor: '#D4C5BA'
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
      }
    }
  }
};

export default components;
