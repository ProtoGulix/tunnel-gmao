/**
 * ServerStatus — Monitoring de l'état du serveur backend
 * 
 * Composant simplifié V3 qui vérifie la disponibilité du backend.
 * Affiche un badge online/offline avec refresh automatique.
 * 
 * @component
 */

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Callout, Flex, IconButton, Text } from '@radix-ui/themes';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { checkServerStatus } from '@/lib/serverStatus';

const POLL_INTERVAL = 30000; // 30 secondes

export default function ServerStatus({ showDetails = false }) {
  const [status, setStatus] = useState(null);
  const [checking, setChecking] = useState(true);

  const checkStatus = useCallback(async () => {
    setChecking(true);
    const result = await checkServerStatus();
    setStatus(result);
    setChecking(false);
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [checkStatus]);

  // Masquer si online et showDetails=false
  if (!showDetails && status?.online) {
    return null;
  }

  // Déterminer couleur et icône
  const color = checking ? 'yellow' : status?.online ? 'green' : 'red';
  const Icon = status?.online ? Wifi : WifiOff;

  return (
    <Callout.Root color={color} role="status" aria-live="polite">
      <Flex align="center" justify="between" gap="3">
        <Flex align="center" gap="2">
          <Icon size={18} />
          <Text weight="medium" size="2">
            {checking ? 'Vérification...' : status?.message}
          </Text>
        </Flex>

        <IconButton
          variant="ghost"
          color="gray"
          onClick={checkStatus}
          disabled={checking}
          title="Revérifier la connexion"
          aria-label="Revérifier la connexion"
          size="1"
        >
          <RefreshCw 
            size={16} 
            style={{ 
              animation: checking ? 'spin 1s linear infinite' : 'none' 
            }} 
          />
        </IconButton>
      </Flex>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Callout.Root>
  );
}

ServerStatus.propTypes = {
  showDetails: PropTypes.bool,
};
