/**
 * @fileoverview Bouton d'action standardisé pour la sidebar
 *
 * Bouton réutilisable pour les actions de sidebar (connexion/déconnexion)
 * avec support de variantes (neutre, primaire) et gestion d'état hover.
 *
 * @module components/common/SidebarActionButton
 * @requires react
 * @requires prop-types
 */

import { useState } from 'react';
import PropTypes from 'prop-types';

/** Styles de base du bouton */
const BASE_BUTTON_STYLE = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  borderRadius: '6px',
  fontWeight: 600,
  transition: 'background 0.2s, transform 0.1s',
  marginBottom: '0.75rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
};

/** Styles des variantes de bouton */
const VARIANT_STYLES = {
  neutral: {
    default: { background: '#3A3A3A' },
    hover: { background: '#B71C1C' },
  },
  primary: {
    default: { background: undefined }, // Utilise colors.accent
    hover: { background: '#152B47' },
  },
};

/** Taille de l'icône */
const ICON_SIZE = 16;

/**
 * Détermine les styles appliqués selon la variante et l'état hover
 * @param {string} variant - Variante ('neutral' | 'primary')
 * @param {boolean} hovered - État hover du bouton
 * @param {Object} colors - Palette de couleurs (text, border, accent)
 * @returns {Object} Objet style combiné
 */
function getVariantStyle(variant, hovered, colors) {
  const variantConfig = VARIANT_STYLES[variant] || VARIANT_STYLES.neutral;
  const stateStyle = hovered ? variantConfig.hover : variantConfig.default;
  
  return {
    background: stateStyle.background || colors.accent,
    color: variant === 'primary' ? '#FFFFFF' : colors.text,
    border: `1px solid ${colors.border}`,
  };
}

/**
 * Bouton d'action pour la sidebar
 *
 * Composant versatile pour afficher des boutons d'action (connexion/déconnexion)
 * dans la sidebar. Supporte deux variantes visuelles avec transitions fluides.
 *
 * @component
 * @param {Object} props
 * @param {string} props.label - Texte du bouton
 * @param {React.ElementType} [props.icon] - Composant icône Lucide
 * @param {Function} props.onClick - Callback au clic
 * @param {string} [props.variant='neutral'] - Variante ('neutral' | 'primary')
 * @param {Object} props.colors - Palette de couleurs
 * @param {string} props.colors.text - Couleur du texte
 * @param {string} props.colors.border - Couleur de la bordure
 * @param {string} props.colors.accent - Couleur d'accent (primaire)
 * @param {boolean} [props.disabled=false] - Si le bouton est désactivé
 * @returns {JSX.Element} Bouton stylisé avec support de hover et focus
 *
 * @example
 * <SidebarActionButton
 *   label="Déconnexion"
 *   icon={LogOut}
 *   variant="primary"
 *   onClick={handleLogout}
 *   colors={{ text: '#FFF', border: '#555', accent: '#0066FF' }}
 * />
 */
function SidebarActionButton({
  label,
  icon: Icon,
  onClick,
  variant = 'neutral',
  colors,
  disabled = false,
}) {
  const [hovered, setHovered] = useState(false);
  const variantStyle = getVariantStyle(variant, hovered, colors);
  const buttonStyle = { ...BASE_BUTTON_STYLE, ...variantStyle, opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={buttonStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      aria-disabled={disabled}
    >
      {Icon && <Icon size={ICON_SIZE} />}
      {label}
    </button>
  );
}

SidebarActionButton.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  onClick: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['neutral', 'primary']),
  colors: PropTypes.shape({
    text: PropTypes.string.isRequired,
    border: PropTypes.string.isRequired,
    accent: PropTypes.string.isRequired,
  }).isRequired,
  disabled: PropTypes.bool,
};

export default SidebarActionButton;
