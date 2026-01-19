/**
 * @fileoverview Layout hiérarchisé sur 3 lignes pour PageHeader
 *
 * @module components/layout/HierarchicalHeaderLayout
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import PropTypes from "prop-types";
import { Flex, Box, Heading, Text, Button, IconButton } from "@radix-ui/themes";
import { Plus } from "lucide-react";

/**
 * Layout hiérarchisé en 3 lignes pour interventions
 *
 * Structure :
 * - Ligne 1 : Identification (icône + titre + sous-titre)
 * - Ligne 2 : État décisionnel (dropdowns statut/priorité + actions)
 * - Ligne 3 : Indicateurs factuels (métriques statistiques)
 *
 * @component
 * @param {Object} props
 * @param {string} props.title - Titre principal
 * @param {string} [props.subtitle] - Sous-titre optionnel
 * @param {React.ComponentType} [props.Icon] - Composant d'icône
 * @param {JSX.Element} [props.statusDropdown] - Dropdown de statut
 * @param {JSX.Element} [props.priorityDropdown] - Dropdown de priorité
 * @param {Array<{label: string, value: string|number, color?: string}>} [props.stats] - Statistiques KPI
 * @param {Array<Object>} [props.actions] - Boutons d'actions
 * @param {Function} [props.onAdd] - Callback ajout
 * @param {string} [props.addLabel='Ajouter'] - Label bouton ajout
 * @returns {JSX.Element} Layout hiérarchisé
 *
 * @example
 * <HierarchicalHeaderLayout
 *   title="INT-2024-001"
 *   subtitle="Intervention curative"
 *   Icon={Wrench}
 *   statusDropdown={<StatusDropdown value="en_cours" />}
 *   stats={[{label: 'Durée', value: '3h', color: 'blue'}]}
 *   onAdd={handleAdd}
 * />
 */
export default function HierarchicalHeaderLayout(props) {
  const {
    title,
    subtitle,
    Icon,
    statusDropdown,
    priorityDropdown,
    stats,
    actions,
    onAdd,
    addLabel = "Ajouter",
  } = props;

  return (
    <Flex direction="column" gap="3">
      {/* Ligne 1 : Identification (Icône + Titre + Sous-titre) */}
      <Flex align="center" gap="3">
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
        <Box style={{ flex: "1 1 auto" }}>
          <Heading size="6" weight="bold">
            {title}
          </Heading>
          {subtitle && (
            <Text size="2" color="gray">
              {subtitle}
            </Text>
          )}
        </Box>
      </Flex>

      {/* Ligne 2 : État décisionnel (Statut + Priorité + Actions) */}
      <Flex
        align="center"
        wrap="wrap"
        gap="2"
        style={{
          paddingLeft: Icon ? "44px" : "0",
        }}
      >
        <Flex align="center" gap="2" wrap="nowrap" style={{ flex: "0 1 auto", minWidth: "0" }}>
          {statusDropdown}
          {priorityDropdown}

          {/* Actions personnalisées */}
          {actions &&
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
        </Flex>

        {/* Bouton d'ajout */}
        {onAdd && (
          <IconButton onClick={onAdd} size="2" aria-label={addLabel}>
            <Plus size={16} />
          </IconButton>
        )}
      </Flex>

      {/* Ligne 3 : Indicateurs factuels (Métriques) */}
      {stats && stats.length > 0 && (
        <Flex
          gap="4"
          align="center"
          wrap="wrap"
          style={{
            paddingLeft: Icon ? "44px" : "0",
          }}
        >
          {stats.map((stat, idx) => (
            <Flex
              key={idx}
              direction="column"
              gap="1"
              style={{
                minWidth: "100px",
              }}
            >
              <Text size="1" color="gray" weight="medium">
                {stat.label}
              </Text>
              <Text size="4" weight="bold" color={stat.color || undefined}>
                {stat.value}
              </Text>
            </Flex>
          ))}
        </Flex>
      )}
    </Flex>
  );
}

HierarchicalHeaderLayout.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  Icon: PropTypes.elementType,
  statusDropdown: PropTypes.element,
  priorityDropdown: PropTypes.element,
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      color: PropTypes.string,
    })
  ),
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
      onClick: PropTypes.func,
      icon: PropTypes.elementType,
      variant: PropTypes.string,
      color: PropTypes.string,
    })
  ),
  onAdd: PropTypes.func,
  addLabel: PropTypes.string,
};
