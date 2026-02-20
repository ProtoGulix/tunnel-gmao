// ===== IMPORTS =====
// 1. React core
import React from 'react';
import ReactDOM from 'react-dom/client';
import packageJson from '../package.json';

// 2. UI Libraries (Radix)
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';

// 3. Custom Components
import App from '@/App';

// 4. Global Styles
import '@/styles/globals.css';

// ===== SET DYNAMIC TITLE =====
document.title = `TUNNEL v${packageJson.version}`;

// ===== RENDER =====
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Theme accentColor="blue" grayColor="slate" radius="medium" scaling="95%">
      <App />
    </Theme>
  </React.StrictMode>
);
