// ===== IMPORTS =====
// 1. React core
import React from 'react';
import ReactDOM from 'react-dom/client';

// 2. UI Libraries (Radix)
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';

// 3. Custom Components
import App from '@/App';
import ErrorNotification from '@/components/ErrorNotification';

// 4. Context / Auth
import { AuthProvider } from '@/auth/AuthContext';
import { ErrorProvider } from '@/contexts/ErrorContext';

// 5. Configuration (async preload)
import { loadAnomalyConfig } from '@/config/anomalyConfig';

// 6. Global Styles
// import '@/styles/globals.css';

// ===== PRELOAD CONFIGURATION =====
// Load anomaly config at startup (non-blocking)
loadAnomalyConfig().catch(console.error);

// ===== RENDER =====
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorProvider>
      <AuthProvider>
        <Theme accentColor="blue" grayColor="slate" radius="medium" scaling="95%">
          <App />
          <ErrorNotification />
        </Theme>
      </AuthProvider>
    </ErrorProvider>
  </React.StrictMode>
);
