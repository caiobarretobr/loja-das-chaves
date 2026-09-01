import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0caeb3',
      dark: '#0a8589',
      light: '#7ae0e3',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0f7c81',
      dark: '#0a5b5d',
      light: '#9fe7ea',
      contrastText: '#ffffff',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#111111',
      secondary: '#555555',
    },
    success: {
      main: '#16845f',
    },
    warning: {
      main: '#c26a13',
    },
    error: {
      main: '#a33935',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Manrope", "Trebuchet MS", sans-serif',
    h1: {
      fontFamily: '"Fraunces", "Georgia", serif',
      fontWeight: 700,
      lineHeight: 1,
    },
    h2: {
      fontFamily: '"Fraunces", "Georgia", serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: '"Fraunces", "Georgia", serif',
      fontWeight: 700,
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(29, 78, 216, 0.12)',
          boxShadow: '0 18px 48px rgba(29, 78, 216, 0.1)',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingInline: 18,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
        },
      },
    },
  },
});

export default theme;
