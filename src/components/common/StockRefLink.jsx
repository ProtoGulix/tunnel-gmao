import { Link } from 'react-router-dom';
import { Badge, Flex } from '@radix-ui/themes';
import { ExternalLink } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Composant Badge cliquable avec icône qui redirige vers la page Pièces (Parts) avec recherche pré-remplie
 * 
 * @param {Object} props
 * @param {string} props.reference - Référence de l'article à rechercher
 * @param {string} [props.tab='items'] - Onglet de destination ('items', 'suppliers', 'manufacturers')
 * @param {string} [props.color='gray'] - Couleur du badge
 * @param {string} [props.variant='outline'] - Variante du badge
 * @param {string} [props.size='2'] - Taille du badge
 * 
 * @example
 * // Badge simple avec référence
 * <StockRefLink reference="FA-123" />
 * 
 * @example
 * // Badge personnalisé vers l'onglet demandes
 * <StockRefLink 
 *   reference="FA-123" 
 *   tab="requests"
 *   color="blue" 
 *   variant="soft"
 * />
 */
export default function StockRefLink({ 
  reference, 
  tab = 'items',
  color = 'gray',
  variant = 'outline',
  size = '2'
}) {
  if (!reference) return null;

  // Construire l'URL avec les query params
  const normalizedTab = (() => {
    if (tab === 'stock') return 'items';
    if (tab === 'supplier-refs') return 'suppliers';
    return tab;
  })();

  const url = `/parts?tab=${normalizedTab}&search=${encodeURIComponent(reference)}`;

  return (
    <Link 
      to={url}
      style={{ 
        textDecoration: 'none',
        display: 'inline-flex'
      }}
      title={`Rechercher "${reference}" dans Pièces`}
    >
      <Badge 
        color={color} 
        variant={variant}
        size={size}
        style={{ cursor: 'pointer' }}
      >
        <Flex align="center" gap="1">
          {reference}
          <ExternalLink size={10} />
        </Flex>
      </Badge>
    </Link>
  );
}

StockRefLink.propTypes = {
  reference: PropTypes.string.isRequired,
  tab: PropTypes.oneOf(['items', 'suppliers', 'manufacturers', 'stock', 'supplier-refs']),
  color: PropTypes.string,
  variant: PropTypes.string,
  size: PropTypes.string,
};
