// ===== IMPORTS =====
import PropTypes from 'prop-types';
import { Card, Flex, Text, Badge } from '@radix-ui/themes';

/**
 * Carte d'action pour le pupitre atelier
 *
 * @param {Object} props
 * @param {string} props.title - Titre de la carte
 * @param {React.ComponentType} props.Icon - Composant icône (Lucide)
 * @param {Function} props.onClick - Handler de clic
 * @param {number} [props.badgeCount] - Compteur à afficher dans le badge
 * @param {string} [props.badgeLabel] - Libellé du badge
 * @param {string} [props.badgeColor] - Couleur du badge (Radix color)
 * @param {string} [props.borderColor] - Couleur de bordure (CSS var)
 * @param {string} [props.backgroundColor] - Couleur de fond (CSS var)
 * @param {string} [props.iconColor] - Couleur de l'icône (CSS var)
 */
export default function ActionCard({
  title,
  Icon,
  onClick,
  badgeCount = 0,
  badgeLabel,
  badgeColor = 'gray',
  borderColor = 'var(--gray-6)',
  backgroundColor = 'var(--gray-1)',
  iconColor = 'var(--gray-9)',
}) {
  return (
    <Card
      style={{
        padding: '1.5rem',
        cursor: 'pointer',
        border: `1px solid ${borderColor}`,
        backgroundColor,
        minHeight: '140px',
      }}
      onClick={onClick}
    >
      <Flex direction="column" align="center" justify="center" gap="2" style={{ height: '100%' }}>
        {Icon && <Icon size={40} color={iconColor} />}
        <Text size="4" weight="bold" align="center">
          {title}
        </Text>
        {badgeCount > 0 && (
          <Badge size="1" color={badgeColor} variant="soft">
            {badgeLabel ? `${badgeCount} ${badgeLabel}` : badgeCount}
          </Badge>
        )}
      </Flex>
    </Card>
  );
}

ActionCard.propTypes = {
  title: PropTypes.string.isRequired,
  Icon: PropTypes.elementType,
  onClick: PropTypes.func.isRequired,
  badgeCount: PropTypes.number,
  badgeLabel: PropTypes.string,
  badgeColor: PropTypes.string,
  borderColor: PropTypes.string,
  backgroundColor: PropTypes.string,
  iconColor: PropTypes.string,
};
