/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🚨 ErrorDisplay.jsx - Composant d'affichage erreur réutilisable
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Composant centralisé pour affichage erreurs user-friendly avec :
 * - Design rouge doux (background var(--red-2), border var(--red-6))
 * - Icon AlertCircle (Lucide React)
 * - Message erreur clair
 * - Bouton retry optionnel avec RefreshCw
 * - Détails techniques affichables (showDetails)
 * 
 * Utilisé dans 6 pages : StockManagement, MachineList, InterventionsList,
 * InterventionDetail, InterventionCreate, ActionsPage
 * 
 * ✅ Implémenté :
 * - Return early si !error
 * - Gestion error flexible (objet Error ou string)
 * - Extraction error.message avec fallback
 * - Affichage details techniques (JSON pretty-print)
 * - Callback onRetry optionnel
 * - Title customisable
 * 
 * 📋 TODO : Améliorations futures
 * - [ ] Variants sévérité : error (rouge), warning (orange), info (bleu)
 * - [ ] Support icon custom (passer composant icon en prop)
 * - [ ] Mode compact : afficher seulement message sans Card
 * - [ ] Animation entrée : fade-in + slide-down
 * - [ ] Copy to clipboard : bouton copier détails techniques
 * - [ ] Support actions multiples : array de buttons [{label, onClick}]
 * - [ ] Toast notification : convertir en toast temporaire
 * - [ ] Stack trace formatté : afficher error.stack en mode dev avec <details>
 * - [ ] Support error.code : afficher error code spécifique (ex: ECONNREFUSED)
 * - [ ] i18n : traduction messages erreur
 * - [ ] Analytics : logger erreurs dans monitoring
 * 
 * @module components/ErrorDisplay
 * @requires react
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import PropTypes from 'prop-types';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Card, Flex, Text, Button, Box, Badge } from '@radix-ui/themes';

/**
 * Composant d'affichage erreur avec design user-friendly
 * Affiche erreur dans Card rouge avec icon, message et bouton retry optionnel
 * 
 * @component
 * @param {Object} props - Props du composant
 * @param {Error|string|Object} [props.error] - Erreur à afficher (objet Error, string, ou object avec message/details)
 * @param {string} [props.error.message] - Message erreur si objet
 * @param {number} [props.error.status] - Code HTTP status (ex: 404, 500)
 * @param {any} [props.error.details] - Détails techniques optionnels
 * @param {Function} [props.onRetry] - Callback bouton retry
 * @param {string} [props.title="Une erreur est survenue"] - Titre Card erreur
 * @param {boolean} [props.showDetails=false] - Afficher détails techniques
 * @returns {JSX.Element|null} Card erreur ou null si !error
 * 
 * @example
 * <ErrorDisplay
 *   error={error}
 *   onRetry={refetchData}
 *   title="Erreur de chargement"
 *   showDetails={isDev}
 * />
 */
const ErrorDisplay = ({ 
  error, 
  onRetry, 
  title = "Une erreur est survenue",
  showDetails = false 
}) => {
  if (!error) return null;

  const errorMessage = error.message || 
    (typeof error === 'string' ? error : 'Erreur inconnue');

  return (
    <Card role="alert" aria-live="polite" style={{ background: 'var(--red-2)', border: '1px solid var(--red-6)' }}>
      <Flex gap="3" align="start">
        <AlertCircle color="var(--red-9)" size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
        <Box style={{ flex: 1 }}>
          <Flex align="center" gap="2" style={{ marginBottom: '4px' }}>
            <Text weight="bold" style={{ color: 'var(--red-9)' }}>
              {title}
            </Text>
            {error.status && (
              <Badge color="red" size="1">
                {error.status}
              </Badge>
            )}
          </Flex>
          <Text size="2" style={{ color: 'var(--red-11)', display: 'block' }}>
            {errorMessage}
          </Text>
          
          {showDetails && error.details && (
            <Box style={{ 
              marginTop: '12px', 
              padding: '8px', 
              background: 'var(--gray-1)', 
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace',
              color: 'var(--gray-11)'
            }}>
              <Text size="1">Détails techniques:</Text>
              <pre style={{ margin: '4px 0 0 0', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </Box>
          )}
          
          {onRetry && (
            <Button 
              size="2" 
              variant="soft" 
              style={{ marginTop: '12px' }}
              onClick={onRetry}
            >
              <RefreshCw size={16} />
              Réessayer
            </Button>
          )}
        </Box>
      </Flex>
    </Card>
  );
};

ErrorDisplay.propTypes = {
  error: PropTypes.oneOfType([
    PropTypes.instanceOf(Error),
    PropTypes.string,
    PropTypes.shape({
      message: PropTypes.string,
      status: PropTypes.number,
      details: PropTypes.any
    })
  ]),
  onRetry: PropTypes.func,
  title: PropTypes.string,
  showDetails: PropTypes.bool
};

export default ErrorDisplay;
