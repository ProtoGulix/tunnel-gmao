/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ⏳ LoadingState.jsx - Composant loading state réutilisable
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Composant centralisé pour afficher état chargement avec spinner Radix UI
 * - Mode fullscreen : 100vh pour pages complètes
 * - Mode inline : 8rem pour sections/tabs
 * - Container wrapper pour padding correct
 * - Spinner Radix UI tailles configurables (1, 2, 3)
 * - Message customisable
 * 
 * Utilisé dans :
 * - InterventionTabs (ActionsTab, PurchasesTab, StatsTab)
 * - Futures pages migrées depuis LoadingSpinner
 * 
 * ✅ Implémenté :
 * - Prop fullscreen boolean (100vh vs 8rem)
 * - Container Radix UI pour layout
 * - Flex centered vertical + horizontal
 * - Spinner avec size configurable
 * - Message gray optionnel
 * - Defaults sensibles (message "Chargement...", fullscreen true, size "3")
 * 
 * 📋 TODO : Améliorations futures
 * - [ ] Variants visuels : default, inline, overlay, modal
 * - [ ] Animation custom : rotation speed, pulse effect
 * - [ ] Skeleton loading : alternative au spinner pour meilleure UX
 * - [ ] Progress bar : afficher progression % si disponible
 * - [ ] Cancel button : annuler opération longue
 * - [ ] Timeout warning : message si >5s de chargement
 * - [ ] Accessibilité : role="status", aria-live="polite"
 * - [ ] Dark mode : adapter couleurs spinner/texte
 * - [ ] Multiple spinners : stack plusieurs loaders
 * - [ ] Icon custom : remplacer spinner par icon perso
 * 
 * @module components/common/LoadingState
 * @requires react
 * @requires @radix-ui/themes
 */

import PropTypes from 'prop-types';
import { Container, Flex, Text, Spinner } from "@radix-ui/themes";

/**
 * État de chargement avec spinner centré
 * 
 * @component
 * @param {Object} props - Props du composant
 * @param {string} [props.message="Chargement..."] - Message à afficher sous spinner
 * @param {boolean} [props.fullscreen=true] - Mode plein écran (100vh) ou inline (8rem)
 * @param {string} [props.size="3"] - Taille spinner Radix ('1', '2', '3')
 * @returns {JSX.Element} Container avec spinner et message
 * 
 * @example
 * // Loading fullscreen (page entière)
 * if (loading) return <LoadingState message="Chargement des données..." />;
 * 
 * @example
 * // Loading inline (section)
 * <LoadingState 
 *   message="Chargement des actions..." 
 *   fullscreen={false}
 *   size="2"
 * />
 */
export default function LoadingState({ message = "Chargement...", fullscreen = true, size = "3" }) {
  return (
    <Container size="4">
      <Flex 
        direction="column" 
        align="center" 
        justify="center" 
        style={{ minHeight: fullscreen ? '100vh' : '8rem' }} 
        gap="3"
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        <Spinner size={size} />
        
        {/* Message */}
        <Text color="gray" size="2">{message}</Text>
      </Flex>
    </Container>
  );
}

LoadingState.propTypes = {
  message: PropTypes.string,
  fullscreen: PropTypes.bool,
  size: PropTypes.oneOf(['1', '2', '3'])
};