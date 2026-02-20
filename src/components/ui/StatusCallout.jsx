/**
 * @fileoverview Composant de notification d'état avec icônes et accessibilité
 *
 * Affiche des messages de statut (succès, erreur, avertissement, info)
 * avec gestion automatique du rôle ARIA et des annonces live.
 *
 * @module components/common/StatusCallout
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import PropTypes from 'prop-types';
import { Callout, Text } from '@radix-ui/themes';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

/** Configuration des types de notification */
const TYPE_CONFIG = {
  success: {
    color: 'green',
    Icon: CheckCircle,
    ariaLive: 'polite',
    role: 'status',
  },
  warning: {
    color: 'amber',
    Icon: AlertCircle,
    ariaLive: 'polite',
    role: 'status',
  },
  error: {
    color: 'red',
    Icon: AlertCircle,
    ariaLive: 'assertive',
    role: 'status',
  },
  info: {
    color: 'blue',
    Icon: Info,
    ariaLive: 'polite',
    role: 'status',
  },
};

/** Types de notification supportés */
const NOTIFICATION_TYPES = Object.keys(TYPE_CONFIG);

/**
 * Composant de callout avec état et accessibilité
 *
 * Affiche un message d'état avec icône appropriée, couleur selon le type,
 * et support complet de l'accessibilité (ARIA live regions, rôles).
 *
 * @component
 * @param {Object} props
 * @param {string} [props.type='info'] - Type de notification ('success', 'warning', 'error', 'info')
 * @param {string} [props.title] - Titre optionnel du callout
 * @param {React.ReactNode} [props.children] - Contenu du message (texte ou JSX)
 * @param {boolean} [props.dialog=false] - Mode dialogue (rôle='dialog', aria-live='assertive')
 * @returns {JSX.Element} Callout Radix UI avec icône et accessibilité intégrées
 *
 * @example
 * // Notification simple
 * <StatusCallout type="success">
 *   Opération réussie!
 * </StatusCallout>
 *
 * @example
 * // Avec titre
 * <StatusCallout type="error" title="Erreur">
 *   Une erreur est survenue lors de la sauvegarde.
 * </StatusCallout>
 *
 * @example
 * // Mode dialogue (pour modales/confirmations)
 * <StatusCallout type="warning" dialog title="Confirmation">
 *   Êtes-vous sûr de vouloir continuer?
 * </StatusCallout>
 */
function StatusCallout({ type = 'info', title, children, dialog = false }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  const { color, Icon, ariaLive, role } = config;
  const finalRole = dialog ? 'dialog' : role;
  const finalAriaLive = dialog ? 'assertive' : ariaLive;

  return (
    <Callout.Root color={color} mb="3" role={finalRole} aria-live={finalAriaLive} aria-atomic="true">
      <Callout.Icon>
        <Icon size={20} />
      </Callout.Icon>
      {/* Render the text container as a div to allow block-level children inside */}
      <Callout.Text as="div">
        {title && (
          <Text as="div" weight="bold" size="3">{title}</Text>
        )}
        {children}
      </Callout.Text>
    </Callout.Root>
  );
}

/**
 * Validation des props du composant StatusCallout
 * @type {Object}
 */
StatusCallout.propTypes = {
  /** Type de notification déterminant l'icône, couleur et ARIA live */
  type: PropTypes.oneOf(NOTIFICATION_TYPES),
  /** Titre optionnel du callout (affiché en gras) */
  title: PropTypes.string,
  /** Contenu du message (texte, JSX, ou composants) */
  children: PropTypes.node,
  /** Active le mode dialogue (rôle='dialog', aria-live='assertive') */
  dialog: PropTypes.bool,
};

/**
 * Valeurs par défaut des props
 * @type {Object}
 */
StatusCallout.defaultProps = {
  type: 'info',
  title: undefined,
  children: undefined,
  dialog: false,
};

export default StatusCallout;
