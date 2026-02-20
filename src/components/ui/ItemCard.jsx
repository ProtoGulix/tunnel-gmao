/**
 * @fileoverview Carte d'item unifié pour toute l'application
 * @module components/common/ItemCard
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * 
 * Composant wrapper pour afficher des cartes standardisées
 * Utilisé pour: Interventions, Preventive, Actions, etc.
 * 
 * @example
 * <ItemCard
 *   title="Réparation moteur"
 *   icon={Wrench}
 *   status={{ label: 'Ouvert', color: 'orange' }}
 *   onClick={() => navigate(`/intervention/${id}`)}
 *   actions={[
 *     { icon: Edit, onClick: handleEdit },
 *     { icon: Trash2, onClick: handleDelete }
 *   ]}
 * >
 *   <Text color="gray">Machine: Presse hydraulique</Text>
 * </ItemCard>
 */

import PropTypes from 'prop-types';
import { Card, Flex, Text, Box, Badge, IconButton } from '@radix-ui/themes';
import { useState } from 'react';

/**
 * Carte d'item unifié avec titre, status, icônes, contenu et actions
 * @component
 * @param {Object} props
 * @param {string} props.title - Titre principal
 * @param {React.ElementType} [props.icon] - Composant icône (Lucide)
 * @param {React.ReactNode} props.children - Contenu de la carte
 * @param {Object} [props.status] - Badge de statut
 * @param {string} props.status.label - Texte du badge
 * @param {string} [props.status.color] - Couleur badge (blue, orange, red, etc.)
 * @param {Array<Object>} [props.actions] - Boutons d'action
 * @param {React.ElementType} props.actions[].icon - Icône action (Lucide)
 * @param {Function} props.actions[].onClick - Callback au clic
 * @param {string} [props.actions[].color] - Couleur icône
 * @param {string} [props.actions[].title] - Tooltip
 * @param {Function} [props.onClick] - Callback au clic sur la carte
 * @param {string} [props.href] - Si fourni, rendre comme Link
 * @param {boolean} [props.clickable=true] - Si la carte est cliquable
 * @param {boolean} [props.selected=false] - État sélectionné
 * @param {boolean} [props.compact=false] - Layout compact
 * @param {string} [props.bgColor] - Couleur de fond
 * @returns {JSX.Element}
 */
export default function ItemCard({
  title,
  icon: Icon,
  children,
  status,
  actions = [],
  onClick,
  href,
  clickable = true,
  selected = false,
  compact = false,
  bgColor,
}) {
  const [hovering, setHovering] = useState(false);

  const isClickable = clickable && (onClick || href);
  const padding = compact ? '2' : '3';

  const cardStyle = {
    backgroundColor: bgColor,
    cursor: isClickable ? 'pointer' : 'default',
    transition: 'all 0.2s ease-in-out',
    transform: hovering && isClickable ? 'translateY(-2px)' : 'translateY(0)',
    boxShadow: hovering && isClickable ? '0 4px 12px rgba(0, 0, 0, 0.1)' : '0 2px 4px rgba(0, 0, 0, 0.05)',
    border: selected ? '2px solid var(--blue-9)' : '1px solid var(--gray-6)',
  };

  const handleCardClick = () => {
    if (isClickable && onClick) {
      onClick();
    }
  };

  const cardContent = (
    <Card
      style={cardStyle}
      onClick={handleCardClick}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <Flex direction="column" gap={padding}>
        {/* Header: Icône + Titre + Status + Actions */}
        <Flex align="center" justify="between" gap="2" wrap="wrap">
          <Flex align="center" gap="2" style={{ flex: 1, minWidth: 0 }}>
            {Icon && <Box style={{ flexShrink: 0 }}><Icon size={20} color="var(--gray-11)" /></Box>}
            <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
              <Text weight="bold" size="2" style={{ wordBreak: 'break-word' }}>
                {title}
              </Text>
              {status && (
                <Badge color={status.color || 'gray'} size="1" variant="soft">
                  {status.label}
                </Badge>
              )}
            </Flex>
          </Flex>

          {/* Actions icônes */}
          {actions.length > 0 && (
            <Flex gap="1" style={{ flexShrink: 0 }}>
              {actions.map((action, idx) => (
                <IconButton
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick?.();
                  }}
                  color={action.color || 'gray'}
                  variant="ghost"
                  size="1"
                  title={action.title}
                >
                  <action.icon size={16} />
                </IconButton>
              ))}
            </Flex>
          )}
        </Flex>

        {/* Contenu */}
        <Box>{children}</Box>
      </Flex>
    </Card>
  );

  if (href) {
    return (
      <a href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
        {cardContent}
      </a>
    );
  }

  return cardContent;
}

ItemCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  children: PropTypes.node.isRequired,
  status: PropTypes.shape({
    label: PropTypes.string.isRequired,
    color: PropTypes.string,
  }),
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.elementType.isRequired,
      onClick: PropTypes.func.isRequired,
      color: PropTypes.string,
      title: PropTypes.string,
    })
  ),
  onClick: PropTypes.func,
  href: PropTypes.string,
  clickable: PropTypes.bool,
  selected: PropTypes.bool,
  compact: PropTypes.bool,
  bgColor: PropTypes.string,
};

ItemCard.defaultProps = {
  actions: [],
  clickable: true,
  selected: false,
  compact: false,
};
