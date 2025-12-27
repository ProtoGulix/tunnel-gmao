import { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Bouton d'action standardisé pour la sidebar (connexion/déconnexion).
 * Variante primaire et neutre, avec état hover interne.
 */
export default function SidebarActionButton({ label, icon: Icon, onClick, variant = 'neutral', colors, disabled = false }) {
  const [hovered, setHovered] = useState(false);

  const variants = {
    neutral: {
      background: hovered ? '#B71C1C' : '#3A3A3A',
      color: colors.text,
      border: `1px solid ${colors.border}`,
    },
    primary: {
      background: hovered ? '#152B47' : colors.accent,
      color: '#FFFFFF',
      border: `1px solid ${colors.border}`,
    },
  };

  const { background, color, border } = variants[variant] || variants.neutral;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        background,
        color,
        border,
        padding: '0.6rem 0.75rem',
        borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 600,
        transition: 'background 0.2s, transform 0.1s',
        marginBottom: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        opacity: disabled ? 0.6 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      aria-disabled={disabled}
    >
      {Icon && <Icon size={16} />}
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
