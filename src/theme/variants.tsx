import merge from 'deepmerge';
import { green, grey, indigo, red } from '@mui/material/colors';
import { THEMES } from 'theme-constants';
import { BRAND_COLORS, BRAND_UI, SEMANTIC_COLORS } from './brandTokens';

const charcoal = BRAND_COLORS.charcoal;

const customBlue = {
  50: '#e9f0fb',
  100: '#c8daf4',
  200: '#a3c1ed',
  300: '#7ea8e5',
  400: '#6395e0',
  500: '#4782da',
  600: '#407ad6',
  700: '#376fd0',
  800: '#2f65cb',
  900: '#2052c2 '
};

const defaultVariant = {
  name: THEMES.DEFAULT,
  palette: {
    mode: 'light',
    primary: {
      main: BRAND_COLORS.green,
      contrastText: BRAND_COLORS.ivory
    },
    secondary: {
      main: BRAND_COLORS.terracotta,
      contrastText: BRAND_COLORS.ivory
    },
    error: {
      main: SEMANTIC_COLORS.error,
      contrastText: BRAND_COLORS.ivory
    },
    warning: {
      main: SEMANTIC_COLORS.warning,
      contrastText: BRAND_COLORS.ivory
    },
    info: {
      main: SEMANTIC_COLORS.info,
      contrastText: BRAND_COLORS.ivory
    },
    success: {
      main: SEMANTIC_COLORS.success,
      contrastText: BRAND_COLORS.ivory
    },
    text: {
      primary: charcoal,
      secondary: BRAND_UI.mutedText,
      disabled: BRAND_UI.disabledText
    },
    background: {
      default: BRAND_COLORS.ivory,
      paper: BRAND_COLORS.ivory
    },
    divider: BRAND_COLORS.sand,
    action: {
      active: BRAND_COLORS.green,
      hover: BRAND_UI.greenTint,
      selected: BRAND_UI.greenSelected,
      disabled: BRAND_UI.disabledText,
      disabledBackground: BRAND_UI.sandTint,
      focus: BRAND_UI.greenSelected
    }
  },
  header: {
    color: BRAND_COLORS.ivory,
    background: BRAND_COLORS.green,
    search: {
      color: BRAND_COLORS.ivory
    },
    indicator: {
      background: BRAND_COLORS.terracotta
    }
  },
  footer: {
    color: BRAND_UI.mutedText,
    background: BRAND_COLORS.ivory
  },
  sidebar: {
    color: BRAND_COLORS.ivory,
    background: BRAND_COLORS.green,
    header: {
      color: BRAND_COLORS.ivory,
      background: BRAND_COLORS.green,
      brand: {
        color: BRAND_COLORS.ivory
      }
    },
    footer: {
      color: BRAND_COLORS.ivory,
      background: BRAND_COLORS.green,
      online: {
        background: BRAND_COLORS.sand
      }
    },
    badge: {
      color: BRAND_COLORS.ivory,
      background: BRAND_COLORS.terracotta
    }
  }
};

const darkVariant = merge(defaultVariant, {
  name: THEMES.DARK,
  palette: {
    mode: 'dark',
    primary: {
      main: customBlue[600],
      contrastText: '#FFF'
    },
    background: {
      default: '#1B2635',
      paper: '#444243'
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.95)',
      secondary: 'rgba(255, 255, 255, 0.5)'
    }
  },
  header: {
    color: grey[300],
    background: '#1B2635',
    search: {
      color: grey[200]
    }
  },
  footer: {
    color: grey[300],
    background: '#444243'
  }
});

const lightVariant = merge(defaultVariant, {
  name: THEMES.LIGHT,
  palette: {
    mode: 'light'
  },
  header: {
    color: grey[200],
    background: customBlue[800],
    search: {
      color: grey[100]
    },
    indicator: {
      background: red[700]
    }
  },
  sidebar: {
    color: grey[900],
    background: '#FFF',
    header: {
      color: '#FFF',
      background: customBlue[800],
      brand: {
        color: '#FFFFFF'
      }
    },
    footer: {
      color: grey[800],
      background: '#F7F7F7',
      online: {
        background: green[500]
      }
    }
  }
});

const blueVariant = merge(defaultVariant, {
  name: THEMES.BLUE,
  palette: {
    mode: 'light'
  },
  sidebar: {
    color: '#FFF',
    background: customBlue[700],
    header: {
      color: '#FFF',
      background: customBlue[800],
      brand: {
        color: '#FFFFFF'
      }
    },
    footer: {
      color: '#FFF',
      background: customBlue[800],
      online: {
        background: '#FFF'
      }
    },
    badge: {
      color: '#000',
      background: '#FFF'
    }
  }
});

const greenVariant = merge(defaultVariant, {
  name: THEMES.GREEN,
  palette: {
    primary: {
      main: green[800],
      contrastText: '#FFF'
    },
    secondary: {
      main: green[500],
      contrastText: '#FFF'
    }
  },
  header: {
    indicator: {
      background: green[600]
    }
  },
  sidebar: {
    color: '#FFF',
    background: green[700],
    header: {
      color: '#FFF',
      background: green[800],
      brand: {
        color: '#FFFFFF'
      }
    },
    footer: {
      color: '#FFF',
      background: green[800],
      online: {
        background: '#FFF'
      }
    },
    badge: {
      color: '#000',
      background: '#FFF'
    }
  }
});

const indigoVariant = merge(defaultVariant, {
  name: THEMES.INDIGO,
  palette: {
    primary: {
      main: indigo[600],
      contrastText: '#FFF'
    },
    secondary: {
      main: indigo[400],
      contrastText: '#FFF'
    }
  },
  header: {
    indicator: {
      background: indigo[600]
    }
  },
  sidebar: {
    color: '#FFF',
    background: indigo[700],
    header: {
      color: '#FFF',
      background: indigo[800],
      brand: {
        color: '#FFFFFF'
      }
    },
    footer: {
      color: '#FFF',
      background: indigo[800],
      online: {
        background: '#FFF'
      }
    },
    badge: {
      color: '#000',
      background: '#FFF'
    }
  }
});

const variants: VariantType[] = [
  defaultVariant,
  darkVariant,
  lightVariant,
  blueVariant,
  greenVariant,
  indigoVariant
];

export default variants;

export interface VariantType {
  name: string;
  palette: {
    primary: MainContrastTextType;
    secondary: MainContrastTextType;
  };
  header: ColorBgType & {
    search: {
      color: string;
    };
    indicator: {
      background: string;
    };
  };
  footer: ColorBgType;
  sidebar: ColorBgType & {
    header: ColorBgType & {
      brand: {
        color: string;
      };
    };
    footer: ColorBgType & {
      online: {
        background: string;
      };
    };
    badge: ColorBgType;
  };
}

interface MainContrastTextType {
  main: string;
  contrastText: string;
}
interface ColorBgType {
  color: string;
  background: string;
}
