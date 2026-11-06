import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AppProvider, useApp } from './app';
import { Shell } from './components/Shell';
import { ToastProvider } from './components/ui';
import Home from './pages/Home';
import Cycle from './pages/Cycle';
import Wellness from './pages/Wellness';
import Medical from './pages/Medical';
import Lifestyle from './pages/Lifestyle';
import Finance from './pages/Finance';
import Journal from './pages/Journal';
import SettingsPage from './pages/Settings';

const PAGES = { home: Home, cycle: Cycle, wellness: Wellness, medical: Medical, lifestyle: Lifestyle, finance: Finance, journal: Journal, settings: SettingsPage };
function Router() { const { route } = useApp(); const P = PAGES[route]; return <P />; }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AppProvider>
        <Shell><Router /></Shell>
      </AppProvider>
    </ToastProvider>
  </StrictMode>
);
