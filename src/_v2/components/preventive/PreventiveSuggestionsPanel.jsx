/**
 * @fileoverview Affichage et gestion des préconisations préventives
 * @module src/components/preventive/PreventiveSuggestionsPanel
 * @requires react
 * @requires prop-types
 * @requires radix-ui/themes
 * @requires src/hooks/usePreventiveSuggestions
 * @requires src/auth/AuthContext
 * @requires src/lib/api/facade
 *
 * Composant common: affiche liste de préconisations avec actions
 * (Accepter, Rejeter) + feedback utilisateur
 *
 * Standards:
 * ✓ PropTypes complets avec .isRequired
 * ✓ JSDoc @fileoverview + @component + @param + @returns + @example
 * ✓ Constantes extraites
 * ✓ Complexité ≤ 10 par fonction
 */

import PropTypes from 'prop-types';
import { useState } from 'react';
import { Box, Flex, Card, Text, Button, Heading, Spinner } from '@radix-ui/themes';
import { usePreventiveSuggestions } from '@/hooks/usePreventiveSuggestions';
import { useAuth } from '@/auth/AuthContext';
import { preventive } from '@/lib/api/facade';
import PreventiveSuggestionCard from './PreventiveSuggestionCard';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const MESSAGES = {
  LOADING: 'Chargement des préconisations...',
  EMPTY: 'Aucune préconisation pour cette machine',
  ERROR: 'Erreur lors du chargement',
  ACCEPT_SUCCESS: 'Préconisation acceptée',
  REJECT_SUCCESS: 'Préconisation rejetée',
};

// ─────────────────────────────────────────────────────────────────────────────
// Composant Principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Panneau des préconisations préventives détectées automatiquement
 *
 * Affiche la liste des préconisations pour une machine donnée
 * Permet de les accepter ou rejeter (validation humaine requise)
 *
 * @component
 * @param {Object} props - Props
 * @param {string} props.machineId - UUID de la machine (requis)
 * @param {string} [props.status='NEW'] - Statut à afficher (optionnel)
 * @returns {JSX.Element} Panneau préconisations
 *
 * @example
 * <PreventiveSuggestionsPanel machineId="550e8400-e29b-41d4-a716-446655440000" />
 *
 * @example
 * // Afficher aussi les acceptées
 * <PreventiveSuggestionsPanel
 *   machineId={machineId}
 *   status="ACCEPTED"
 * />
 */
export default function PreventiveSuggestionsPanel({ machineId, status = 'NEW' }) {
  const { user } = useAuth();
  const { suggestions, loading, error, refresh } = usePreventiveSuggestions(machineId, status);
  const [processing, setProcessing] = useState(null);
  const [message, setMessage] = useState(null);

  // ───────────────────────────────────────────────────────────────────────────
  // Handlers
  // ───────────────────────────────────────────────────────────────────────────

  const handleAccept = async (suggestionId) => {
    if (!user?.id) return;
    setProcessing(suggestionId);
    try {
      await preventive.acceptPreventiveSuggestion(suggestionId, user.id);
      setMessage(MESSAGES.ACCEPT_SUCCESS);
      await refresh();
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      console.error('Erreur acceptation:', err);
      setMessage(`Erreur: ${err.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (suggestionId) => {
    if (!user?.id) return;
    setProcessing(suggestionId);
    try {
      await preventive.rejectPreventiveSuggestion(suggestionId, user.id);
      setMessage(MESSAGES.REJECT_SUCCESS);
      await refresh();
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      console.error('Erreur rejet:', err);
      setMessage(`Erreur: ${err.message}`);
    } finally {
      setProcessing(null);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Render Helpers
  // ───────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box p="4">
        <Flex justify="center" align="center" gap="2" py="6">
          <Spinner />
          <Text color="gray">{MESSAGES.LOADING}</Text>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p="4">
        <Card color="red">
          <Text color="red">
            {MESSAGES.ERROR}: {error.message}
          </Text>
        </Card>
      </Box>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Box p="4">
        <Card color="gray">
          <Text color="gray">{MESSAGES.EMPTY}</Text>
        </Card>
      </Box>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Main Render
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <Box p="4">
      <Flex justify="between" align="center" mb="4">
        <Heading size="lg">Préconisations Préventives</Heading>
        <Button onClick={refresh} size="sm" variant="soft">
          Rafraîchir
        </Button>
      </Flex>

      {/* Message feedback */}
      {message && (
        <Box
          mb="3"
          p="3"
          style={{
            backgroundColor: 'var(--color-blue-2)',
            borderRadius: 'var(--radius-2)',
            borderLeft: '4px solid var(--color-blue-9)',
          }}
        >
          <Text size="sm" color="blue">
            {message}
          </Text>
        </Box>
      )}

      {/* List */}
      <Box>
        {suggestions.map((suggestion) => (
          <PreventiveSuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onAccept={handleAccept}
            onReject={handleReject}
            processing={processing === suggestion.id}
          />
        ))}
      </Box>
    </Box>
  );
}

PreventiveSuggestionsPanel.propTypes = {
  /** UUID de la machine pour filtrer les préconisations */
  machineId: PropTypes.string.isRequired,
  /** Statut des préconisations à afficher */
  status: PropTypes.oneOf(['NEW', 'REVIEWED', 'ACCEPTED', 'REJECTED']),
};

PreventiveSuggestionsPanel.defaultProps = {
  status: 'NEW',
};
