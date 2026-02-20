import PropTypes from 'prop-types';

/**
 * Composant logo réutilisable - Affiche l'hexagone avec logo et titre
 * @param {Object} props - Props du composant
 * @param {string} [props.size='desktop'] - 'mobile' ou 'desktop'
 * @param {string} [props.showTitle=true] - Afficher le titre
 * @param {string} [props.showSubtitle=false] - Afficher le sous-titre
 * @param {string} [props.logoSizeOverride] - Taille personnalisée du logo (ex: '60px')
 * @param {string} [props.titleSizeOverride] - Taille personnalisée du titre (ex: '1rem')
 * @returns {JSX.Element}
 */
export default function BrandLogo({ 
  size = 'desktop', 
  showTitle = true, 
  showSubtitle = false,
  logoSizeOverride,
  titleSizeOverride
}) {
  const LOGO_SRC = '/brand/tunnel-logo-light.svg';

  const config = {
    mobile: {
      hexagonSize: '80px',
      logoSize: '52px',
      titleSize: '0.75rem',
      subtitleSize: '0.65rem',
      gap: '0.5rem',
    },
    desktop: {
      hexagonSize: '80px',
      logoSize: '52px',
      titleSize: '0.85rem',
      subtitleSize: '0.7rem',
      gap: '0.75rem',
    },
  };

  const { hexagonSize, logoSize: defaultLogoSize, titleSize: defaultTitleSize, subtitleSize, gap } = config[size] || config.desktop;
  const logoSize = logoSizeOverride || defaultLogoSize;
  const titleSize = titleSizeOverride || defaultTitleSize;
  const title = size === 'mobile' ? 'TUNNEL' : 'TUNNEL GMAO';

  return (
    <div
      style={{
        fontWeight: '600',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: showSubtitle ? '0.5rem' : gap,
      }}
    >
      <div
        style={{
          width: hexagonSize,
          height: hexagonSize,
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        }}
      >
        <img
          src={LOGO_SRC}
          alt="Tunnel GMAO"
          style={{ width: logoSize, height: logoSize, objectFit: 'contain' }}
        />
      </div>
      {showTitle && (
        <span style={{ letterSpacing: '0.5px', fontSize: titleSize }}>
          {title}
        </span>
      )}
      {showSubtitle && (
        <span style={{ 
          letterSpacing: '0.3px', 
          fontSize: subtitleSize,
          color: '#8B95A5',
          fontWeight: '400',
          fontStyle: 'italic',
          textAlign: 'center',
          maxWidth: '280px',
          opacity: 0.7,
          marginTop: '-0.25rem'
        }}>
          Gestion de Maintenance Assistée par Ordinateur
        </span>
      )}
    </div>
  );
}

BrandLogo.propTypes = {
  size: PropTypes.oneOf(['mobile', 'desktop']),
  showTitle: PropTypes.bool,
  showSubtitle: PropTypes.bool,
  logoSizeOverride: PropTypes.string,
  titleSizeOverride: PropTypes.string,
};
