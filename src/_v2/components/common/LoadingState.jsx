/**
 * @fileoverview État de chargement réutilisable avec spinner Radix UI
 * 
 * Composant centralisé pour afficher un état de chargement avec spinner.
 * Supporte mode fullscreen (pages complètes) et inline (sections/tabs).
 * 
 * @module components/common/LoadingState
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 */

import PropTypes from "prop-types";
import { Container, Flex, Text, Spinner } from "@radix-ui/themes";

/** Message par défaut du loader */
const DEFAULT_MESSAGE = "Chargement...";

/** Taille par défaut du spinner */
const DEFAULT_SIZE = "3";

/** Hauteur minimale en mode fullscreen */
const FULLSCREEN_HEIGHT = "100vh";

/** Hauteur minimale en mode inline */
const INLINE_HEIGHT = "8rem";

/**
 * Détermine la hauteur minimale selon le mode
 * @param {boolean} fullscreen - Mode fullscreen ou inline
 * @returns {string} Valeur CSS de hauteur
 */
const getMinHeight = (fullscreen) => (fullscreen ? FULLSCREEN_HEIGHT : INLINE_HEIGHT);

/**
 * État de chargement avec spinner centré et message
 * 
 * Affiche un spinner Radix UI avec message optionnel.
 * Mode fullscreen pour pages complètes, inline pour sections/tabs.
 * 
 * @component
 * @param {Object} props
 * @param {string} [props.message="Chargement..."] - Message à afficher sous spinner
 * @param {boolean} [props.fullscreen=true] - Mode plein écran (100vh) ou inline (8rem)
 * @param {string} [props.size="3"] - Taille spinner Radix ('1', '2', '3')
 * @returns {JSX.Element} Container avec spinner centré et message
 * 
 * @example
 * // Mode fullscreen (page entière)
 * if (loading) return <LoadingState message="Chargement des données..." />;
 * 
 * @example
 * // Mode inline (section/tab)
 * <LoadingState 
 *   message="Chargement des actions..." 
 *   fullscreen={false}
 *   size="2"
 * />
 */
export default function LoadingState({ 
  message = DEFAULT_MESSAGE, 
  fullscreen = true, 
  size = DEFAULT_SIZE 
}) {
  return (
    <Container size="4">
      <Flex 
        direction="column" 
        align="center" 
        justify="center" 
        style={{ minHeight: getMinHeight(fullscreen) }} 
        gap="3"
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        <Spinner size={size} />
        <Text color="gray" size="2">
          {message}
        </Text>
      </Flex>
    </Container>
  );
}

LoadingState.propTypes = {
  message: PropTypes.string,
  fullscreen: PropTypes.bool,
  size: PropTypes.oneOf(["1", "2", "3"]),
};