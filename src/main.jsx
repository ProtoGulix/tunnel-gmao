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

// 5. PWA — mise à jour automatique des clients ouverts
import { registerSW } from 'virtual:pwa-register';

// ===== SET DYNAMIC TITLE =====
document.title = `TUNNEL v${packageJson.version}`;

// ===== SERVICE WORKER — mise à jour des onglets ouverts =====
// Stratégie : vérifier toutes les 60 secondes si un nouveau SW est disponible.
// Quand un nouveau SW prend le contrôle (controllerchange), la page se recharge
// silencieusement → le technicien obtient la nouvelle version sans intervention.
if ('serviceWorker' in navigator) {
  registerSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      // Forcer la vérification immédiate au démarrage, puis toutes les 60s.
      registration.update();
      setInterval(() => registration.update(), 60_000);
    },
  });

  // Quand le nouveau SW a activé skipWaiting et pris le contrôle,
  // recharger silencieusement pour servir les nouveaux assets.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

// ===== RENDER =====
ReactDOM.createRoot(document.getElementById('root')).render(
  <Theme accentColor="blue" grayColor="slate" radius="medium" scaling="95%">
    <App />
  </Theme>
);
