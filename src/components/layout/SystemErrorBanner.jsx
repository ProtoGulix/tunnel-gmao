/**
 * @fileoverview Banneau d'erreur système ancré en haut du contenu principal (Level 3)
 *
 * Affiché pour les erreurs 5xx et réseau. Reste visible jusqu'à fermeture manuelle
 * ou jusqu'à ce qu'une requête réussisse (clearSystemError via useApiStatus).
 *
 * @module components/layout/SystemErrorBanner
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, WifiOff, X } from 'lucide-react';
import { onSystemError } from '@/lib/api/systemErrors';
import styles from '@/styles/modules/SystemErrorBanner.module.css';

const STATUS_MESSAGES = {
  403: 'Accès refusé — permissions insuffisantes.',
  500: 'Erreur interne du serveur. L\'équipe technique a été notifiée.',
  502: 'Le serveur est temporairement indisponible.',
  503: 'Service inaccessible, réessayez dans quelques instants.',
  504: 'Le serveur met trop de temps à répondre.',
};

function getMessage(err) {
  if (!err?.response) return 'Connexion au serveur impossible. Vérifiez votre réseau.';
  const s = err.response.status;
  return STATUS_MESSAGES[s]
    ?? (err.response.data?.detail || err.response.data?.message || `Erreur serveur (${s}).`);
}

export function SystemErrorBanner() {
  const [error, setError] = useState(null);

  useEffect(() => onSystemError(setError), []);

  if (!error) return null;

  const isNetwork = !error.response;

  return (
    <div role="alert" className={styles.banner}>
      {isNetwork ? <WifiOff size={15} /> : <AlertTriangle size={15} />}
      <span className={styles.message}>{getMessage(error)}</span>
      <button
        className={styles.close}
        onClick={() => setError(null)}
        aria-label="Fermer"
      >
        <X size={14} />
      </button>
    </div>
  );
}
