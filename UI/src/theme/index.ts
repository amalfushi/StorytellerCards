import { createTheme } from '@mui/material/styles';

// Character type color palette from architecture plan
export const characterColors = {
  townsfolk: '#1976d2',
  outsider: '#42a5f5',
  minion: '#d32f2f',
  demon: '#b71c1c',
  travellerGood: '#1976d2',
  travellerEvil: '#d32f2f',
  fabledStart: '#ff9800',
  fabledEnd: '#ffd54f',
  loric: '#558b2f',
} as const;

const theme = createTheme({
  palette: {
    primary: {
      main: characterColors.townsfolk,
    },
    secondary: {
      main: characterColors.minion,
    },
    error: {
      main: characterColors.demon,
    },
    warning: {
      main: characterColors.fabledStart,
    },
    success: {
      main: characterColors.loric,
    },
    info: {
      main: characterColors.outsider,
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          '--color-townsfolk': characterColors.townsfolk,
          '--color-outsider': characterColors.outsider,
          '--color-minion': characterColors.minion,
          '--color-demon': characterColors.demon,
          '--color-traveller-good': characterColors.travellerGood,
          '--color-traveller-evil': characterColors.travellerEvil,
          '--color-fabled-start': characterColors.fabledStart,
          '--color-fabled-end': characterColors.fabledEnd,
          '--color-loric': characterColors.loric,
        },
      },
    },
  },
});

export default theme;
