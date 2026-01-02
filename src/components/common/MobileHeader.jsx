/**
 * @fileoverview En-tête mobile avec menu hamburger et logo
 *
 * @module components/common/MobileHeader
 * @requires react
 * @requires prop-types
 */

import PropTypes from 'prop-types';
import BrandLogo from '@/components/common/BrandLogo';

/**
 * En-tête mobile avec bouton menu hamburger
 * @component
 * @param {Object} props
 * @param {boolean} props.menuOpen - État d'ouverture du menu
 * @param {Function} props.onToggle - Callback pour basculer le menu
 * @param {Object} props.colors - Palette de couleurs
 * @returns {JSX.Element}
 */
export default function MobileHeader({ menuOpen, onToggle, colors }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '56px',
      background: colors.background,
      color: colors.text,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1rem',
      zIndex: 1000,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <button
        onClick={onToggle}
        style={{
          background: 'transparent',
          border: 'none',
          color: colors.text,
          fontSize: '1.5rem',
          cursor: 'pointer',
          padding: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px'
        }}
        aria-label='Toggle menu'
      >
        {menuOpen ? '✕' : '☰'}
      </button>
      
      <BrandLogo size="mobile" showTitle={true} />

      <div style={{ width: '40px' }} />
    </div>
  );
}

MobileHeader.propTypes = {
  menuOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  colors: PropTypes.shape({
    background: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
  }).isRequired,
};
