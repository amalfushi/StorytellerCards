import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/theme';
import { SessionProvider } from '@/context/SessionContext.tsx';
import { GameProvider } from '@/context/GameContext.tsx';
import { applyM41StorageMigration } from '@/utils/storageMigration.ts';
import { App } from './App.tsx';

applyM41StorageMigration();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SessionProvider>
        <GameProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </GameProvider>
      </SessionProvider>
    </ThemeProvider>
  </StrictMode>,
);
