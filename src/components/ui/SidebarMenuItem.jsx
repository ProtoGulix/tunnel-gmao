/**
 * @fileoverview Item de menu de navigation avec état actif
 *
 * @module components/common/SidebarMenuItem
 * @requires react
 * @requires prop-types
 * @requires react-router-dom
 */

import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';

/**
 * Item de menu dans la sidebar avec état actif
 * @component
 * @param {Object} props
 * @param {Object} props.item - Données de l'item de menu
 * @param {string} props.item.id - ID unique
 * @param {string} props.item.path - Chemin de navigation
 * @param {string} props.item.label - Label affiché
 * @param {React.ComponentType} props.item.icon - Composant icône Lucide
 * @param {Object} props.colors - Palette de couleurs
 * @param {boolean} [props.isPublic=false] - Si l'item est dans la section publique
 * @returns {JSX.Element}
 */
export default function SidebarMenuItem({ item, colors, isPublic = false }) {
  const location = useLocation();
  const isActive = location.pathname === item.path;

  return (
    <Link
      to={item.path}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        color: isActive ? colors.activeText : colors.text,
        background: isActive ? colors.activeBg : (isPublic ? 'rgba(255,255,255,0.02)' : 'transparent'),
        textDecoration: 'none',
        transition: 'all 0.2s',
        borderLeft: isActive ? `4px solid ${colors.accent}` : '4px solid transparent',
        fontWeight: isActive ? 700 : 500,
        boxShadow: isActive ? `inset 0 0 0 1px ${colors.border}` : 'none',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = colors.hoverBg;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = isPublic ? 'rgba(255,255,255,0.02)' : 'transparent';
        }
      }}
    >
      <item.icon size={18} />
      <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
    </Link>
  );
}

SidebarMenuItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
  }).isRequired,
  colors: PropTypes.shape({
    text: PropTypes.string.isRequired,
    activeText: PropTypes.string.isRequired,
    activeBg: PropTypes.string.isRequired,
    accent: PropTypes.string.isRequired,
    border: PropTypes.string.isRequired,
    hoverBg: PropTypes.string.isRequired,
  }).isRequired,
  isPublic: PropTypes.bool,
};
