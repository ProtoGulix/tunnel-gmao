// ═══════════════════════════════════════════════════════════════════════════════
// ServerStatus.jsx
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Composant de monitoring de l'état du serveur backend.
 * 
 * @description
 * Affiche un badge indiquant si le serveur backend est accessible (online/offline).
 * Vérifie automatiquement toutes les 30 secondes. Permet de forcer un refresh 
 * ou vider le cache.
 * 
 * @usage
 * Utilisé dans :
 * - Login.jsx : Monitoring serveur sur page de connexion
 * 
 * @features_implemented
 * ✅ Vérification état serveur (checkServerStatus)
 * ✅ Polling automatique toutes les 30 secondes
 * ✅ Loading state pendant vérification
 * ✅ Bouton refresh manuel
 * ✅ Bouton clear cache + reload
 * ✅ Conditional render (masqué si online et !showDetails)
 * ✅ Animation spin (CSS module)
 * ✅ Toast notification si serveur offline
 * ✅ Radix Callout avec colors dynamiques
 * ✅ Lucide icons (Wifi, WifiOff, RefreshCw, Trash2)
 * ✅ Accessibilité complète (role, aria-live, aria-label)
 * 
 * @todo
 * [✅] Migrer vers Radix Callout (success/error variants) - Implémenté
 * [✅] Remplacer emojis 🗑️🔄 par Lucide (RefreshCw, Trash2) - Implémenté
 * [✅] Créer ServerStatus.module.css pour styles et animation pulse - Implémenté
 * [✅] Utiliser COLOR_PALETTE.md (var(--green-9), var(--red-9), var(--yellow-9)) - Radix colors
 * [✅] Ajouter accessibilité (role="status", aria-live="polite") - Implémenté
 * [✅] Toast notification si serveur devient offline - Implémenté
 * [ ] Historique uptime/downtime (localStorage)
 * [ ] Support mode maintenance (message custom backend)
 * [ ] Analytics ping failures (tracking)
 * [ ] Ajouter tests unitaires (mock checkServerStatus)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Callout, Flex, IconButton, Text } from '@radix-ui/themes';
import { RefreshCw, Trash2, Wifi, WifiOff } from 'lucide-react';
import { checkServerStatus } from '@/lib/serverStatus';
import { client } from '@/lib/api/facade';
import { useError } from '@/contexts/ErrorContext';
import styles from '@/styles/modules/ServerStatus.module.css';

/**
 * Composant de monitoring de l'état du serveur.
 * 
 * @component
 * @param {Object} props - Props du composant
 * @param {boolean} [props.showDetails=true] - Afficher détails (URL, latence)
 * @returns {JSX.Element|null}
 * 
 * @example
 * // Utilisation complète (Login)
 * <ServerStatus showDetails={true} />
 * 
 * @example
 * // Version minimale (masqué si online)
 * <ServerStatus showDetails={false} />
 */
export default function ServerStatus({ showDetails = true }) {
  const [status, setStatus] = useState(null);
  const [checking, setChecking] = useState(true);
  const previousOnlineStatus = useRef(null);
  const { showError } = useError();

  const checkStatus = useCallback(async () => {
    setChecking(true);
    const result = await checkServerStatus();
    
    // Toast notification si le serveur passe offline
    if (previousOnlineStatus.current === true && result.online === false) {
      showError({ 
        message: "Le serveur est devenu inaccessible. Vérification en cours..." 
      });
    }
    
    previousOnlineStatus.current = result.online;
    setStatus(result);
    setChecking(false);
  }, [showError]);

  useEffect(() => {
    checkStatus();
    
    // Vérifier toutes les 30 secondes
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleClearCache = () => {
    client.clearAllCache();
    window.location.reload();
  };

  // Masquer si online et showDetails=false
  if (!showDetails && status?.online) {
    return null;
  }

  // Déterminer couleur et icône selon état
  const color = checking ? 'yellow' : status?.online ? 'green' : 'red';
  const Icon = status?.online ? Wifi : WifiOff;

  return (
    <Callout.Root 
      color={color} 
      role="status" 
      aria-live="polite"
      mb="4"
    >
      <Flex align="center" justify="end" gap="3">
        <Flex align="center" gap="3" style={{ flex: 1 }}>
          <Icon size={20} />
          <Text weight="bold" size="2">
            {checking ? 'Vérification...' : status?.message}
          </Text>
        </Flex>

        <Flex gap="2">
          <IconButton
            variant="ghost"
            color="gray"
            onClick={handleClearCache}
            title="Vider le cache et recharger"
            aria-label="Vider le cache et recharger"
          >
            <Trash2 size={18} />
          </IconButton>
          <IconButton
            variant="ghost"
            color="gray"
            onClick={checkStatus}
            disabled={checking}
            title="Revérifier la connexion"
            aria-label="Revérifier la connexion"
          >
            <RefreshCw size={18} className={checking ? styles.spin : ''} />
          </IconButton>
        </Flex>
      </Flex>
    </Callout.Root>
  );
}

// PropTypes validation
ServerStatus.propTypes = {
  /** Afficher détails (URL serveur, latence) */
  showDetails: PropTypes.bool,
};