import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#111111',
      dark: '#000000',
      light: '#3a3a3a',
      contrastText: '#fff7cf',
    },
    secondary: {
      main: '#f2d36b',
      dark: '#c5a33d',
      light: '#fff0a6',
      contrastText: '#111111',
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
      main: '#2f6d4f',
    },
    warning: {
      main: '#b8741a',
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
          border: '1px solid rgba(17, 17, 17, 0.1)',
          boxShadow: '0 18px 48px rgba(17, 17, 17, 0.08)',
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
