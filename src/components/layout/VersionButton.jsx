/**
 * @fileoverview Bouton "vX.Y.Z" du footer sidebar, avec badge discret si
 * des nouveautés du changelog n'ont pas encore été vues.
 *
 * @module components/layout/VersionButton
 */

import PropTypes from 'prop-types';
import { Star } from 'lucide-react';

const NEWS_YELLOW = '#f5a623';
const NEWS_YELLOW_BG = 'rgba(245, 166, 35, 0.15)';

/**
 * @component
 */
export default function VersionButton({ appVersion, colors, hasNews, onOpenChangelog }) {
  return (
    <button
      type='button'
      onClick={onOpenChangelog}
      title={hasNews ? 'Nouvelle version — voir ce qui change ?' : 'Voir le changelog'}
      aria-label={hasNews ? 'Nouvelle version — voir ce qui change ?' : 'Voir le changelog'}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        margin: 0,
        color: colors.textMuted,
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: 500,
        letterSpacing: '0.2px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        opacity: 0.8
      }}
      onMouseEnter={(e) => e.currentTarget.style.color = colors.accentSoft}
      onMouseLeave={(e) => e.currentTarget.style.color = colors.textMuted}
    >
      <span style={{ textDecoration: 'none' }}>v{appVersion}</span>
      {hasNews && (
        <span
          aria-hidden='true'
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.2rem',
            padding: '0.1rem 0.4rem',
            borderRadius: '999px',
            background: NEWS_YELLOW_BG,
            color: NEWS_YELLOW,
            fontSize: '0.7rem',
            fontWeight: 600,
          }}
        >
          <Star size={10} fill={NEWS_YELLOW} strokeWidth={0} />
          Nouveau
        </span>
      )}
    </button>
  );
}

VersionButton.propTypes = {
  appVersion: PropTypes.string.isRequired,
  colors: PropTypes.shape({
    textMuted: PropTypes.string.isRequired,
    accent: PropTypes.string.isRequired,
    accentSoft: PropTypes.string.isRequired,
  }).isRequired,
  hasNews: PropTypes.bool.isRequired,
  onOpenChangelog: PropTypes.func.isRequired,
};
