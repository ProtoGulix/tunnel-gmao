/**
 * @fileoverview Layout standard horizontal pour PageHeader
 *
 * @module components/layout/StandardHeaderLayout
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import PropTypes from "prop-types";
import { Flex, Heading, Text, Button, Badge, IconButton, Box } from "@radix-ui/themes";
import { RefreshCw, Plus, ArrowLeft } from "lucide-react";

/**
 * Layout standard horizontal pour en-tête de page
 *
 * Affiche l'en-tête en mode horizontal avec icône, titre, statistiques,
 * badge urgent optionnel, actions et contrôles.
 *
 * @component
 * @param {Object} props
 * @param {string} props.title - Titre principal
 * @param {string} [props.subtitle] - Sous-titre optionnel
 * @param {React.ComponentType} [props.Icon] - Composant d'icône
 * @param {Array<{label: string, value: string|number, info?: string}>} [props.stats] - Statistiques
 * @param {Object} [props.urgentBadge] - Badge urgent
 * @param {string} [props.urgentBadge.label] - Texte du badge
 * @param {number} [props.urgentBadge.count] - Nombre urgent
 * @param {Array<Object>} [props.actions] - Boutons d'actions
 * @param {Function} [props.onRefresh] - Callback refresh
 * @param {Function} [props.onAdd] - Callback ajout
 * @param {string} [props.addLabel='Ajouter'] - Label bouton ajout
 * @param {JSX.Element|null} [props.timeSelectionControl] - Contrôle temporel
 * @returns {JSX.Element} Layout standard
 *
 * @example
 * <StandardHeaderLayout
 *   title="Interventions"
 *   Icon={ClipboardList}
 *   stats={[{label: 'Total', value: 42}]}
 *   onRefresh={handleRefresh}
 *   timeSelectionControl={<TimeSelectionControl {...props} />}
 * />
 */
export default function StandardHeaderLayout(props) {
  const {
    title,
    subtitle,
    description,
    Icon,
    stats,
    urgentBadge,
    actions,
    onRefresh,
    onAdd,
    onBack,
    backLabel,
    addLabel = "Ajouter",
    timeSelectionControl,
    children,
  } = props;

  return (
    <Flex direction="column" gap="3">
      <Flex
        justify="between"
        align="center"
        wrap="wrap"
        gap="3"
        style={{
          minHeight: "60px",
        }}
      >
        {/* Section gauche : Back + Icône + Titre */}
        <Flex align="center" gap="3" style={{ flex: "1 1 auto" }}>
          {onBack && (
            <Button variant="ghost" size="2" onClick={onBack} style={{ flexShrink: 0 }}>
              <ArrowLeft size={16} />
              {backLabel || "Retour"}
            </Button>
          )}
          {Icon && (
            <Icon
              size={32}
              strokeWidth={1.5}
              style={{
                flexShrink: 0,
              }}
              aria-hidden="true"
            />
          )}
          <Flex direction="column" gap="1">
            <Heading size="6" weight="bold">
              {title}
            </Heading>
            {subtitle && (
              <Text size="2" color="gray">
                {subtitle}
              </Text>
            )}
            {description && (
              <Text size="2" color="gray">
                {description}
              </Text>
            )}
          </Flex>
        </Flex>

      {/* Stats */}
      {stats && stats.length > 0 && (
        <Flex gap="4" align="center" wrap="wrap">
          {stats.map((stat, idx) => (
            <Flex
              key={idx}
              direction="column"
              gap="1"
              align="end"
              style={{ textAlign: "right" }}
            >
              <Text size="1" color="gray" weight="medium">
                {stat.label}
              </Text>
              {stat.render ? (
                stat.render
              ) : stat.color ? (
                <Badge color={stat.color} size="2">
                  {stat.value}
                </Badge>
              ) : (
                <Text size="5" weight="bold">
                  {stat.value}
                </Text>
              )}
              {stat.info && (
                <Text size="1" color="gray">
                  {stat.info}
                </Text>
              )}
            </Flex>
          ))}
        </Flex>
      )}

      {/* Badge urgent */}
      {urgentBadge && (
        <Badge color="red" size="2" style={{ padding: "8px 16px" }}>
          {urgentBadge.label}: {urgentBadge.count}
        </Badge>
      )}

      {/* Section droite : Actions + Contrôles */}
      <Flex align="center" gap="2" style={{ flexShrink: 0 }}>
        {/* Actions personnalisées */}
        {actions && Array.isArray(actions) &&
          actions.map((action, idx) => {
            if (action.label && typeof action.label !== "string") {
              return <div key={idx}>{action.label}</div>;
            }
            return (
              <Button
                key={idx}
                onClick={action.onClick}
                variant={action.variant || "soft"}
                color={action.color || "gray"}
                size="2"
              >
                {action.icon && <action.icon size={16} />}
                {action.label}
              </Button>
            );
          })}

        {/* Refresh */}
        {onRefresh && (
          <IconButton
            onClick={onRefresh}
            variant="soft"
            size="2"
            aria-label="Rafraîchir les données"
          >
            <RefreshCw size={16} />
          </IconButton>
        )}

        {/* Bouton d'ajout */}
        {onAdd && (
          <Button onClick={onAdd} size="2">
            <Plus size={16} />
            {addLabel}
          </Button>
        )}

        {/* Sélection temporelle */}
        {timeSelectionControl}
      </Flex>
      </Flex>

      {/* Contenu additionnel (health details, etc.) */}
      {children}
    </Flex>
  );
}

StandardHeaderLayout.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  Icon: PropTypes.elementType,
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      info: PropTypes.string,
      color: PropTypes.string,
    })
  ),
  urgentBadge: PropTypes.shape({
    label: PropTypes.string.isRequired,
    count: PropTypes.number.isRequired,
  }),
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
      onClick: PropTypes.func,
      icon: PropTypes.elementType,
      variant: PropTypes.string,
      color: PropTypes.string,
    })
  ),
  onRefresh: PropTypes.func,
  onAdd: PropTypes.func,
  onBack: PropTypes.func,
  backLabel: PropTypes.string,
  addLabel: PropTypes.string,
  description: PropTypes.string,
  timeSelectionControl: PropTypes.element,
  children: PropTypes.node,
};
