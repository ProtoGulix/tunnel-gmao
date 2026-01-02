import { Flex, Box, Heading, Text, Badge, IconButton, Button, Select } from "@radix-ui/themes";
import { ClipboardList, CalendarDays, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import PropTypes from "prop-types";
import DateRangeFilter from "@/components/common/DateRangeFilter";

const DEFAULT_TIME_SELECTION_OPTIONS = [
  { value: "7days", label: "7 derniers jours" },
  { value: "30days", label: "30 derniers jours" },
  { value: "90days", label: "3 derniers mois" },
  { value: "6months", label: "6 derniers mois" },
  { value: "1year", label: "1 an" },
  { value: "all", label: "Toutes les données" },
];

/**
 * En-tête de page unifié et réutilisable
 * Style professionnel avec bande pleine largeur
 *
 * @component
 * @param {Object} props
 * @param {string} props.title - Titre de la page
 * @param {string} [props.subtitle] - Sous-titre optionnel
 * @param {React.ComponentType} [props.icon=ClipboardList] - Icône Lucide React (ex: ClipboardList)
 * @param {Array<{label: string, value: string|number}>} [props.stats] - Statistiques affichées
 * @param {{count: number, label: string}} [props.urgentBadge] - Badge d'urgence (mode standard)
 * @param {Array<{label: string|React.Node, onClick: Function, icon?: React.Node, variant?: string, color?: string}>} [props.actions] - Actions personnalisées
 * @param {Function} [props.onRefresh] - Callback de rafraîchissement
 * @param {Function} [props.onAdd] - Callback d'ajout
 * @param {string} [props.addLabel="+ Ajouter"] - Label du bouton d'ajout
 * @param {Object} [props.timeSelection] - Configuration temporelle { enabled, mode, component, value, onChange, options, onFilterChange }
 * @param {React.Node} [props.statusDropdown] - Dropdown de statut (mode hiérarchisé)
 * @param {React.Node} [props.priorityDropdown] - Dropdown de priorité (mode hiérarchisé)
 *
 * @description
 * **MODE STANDARD**: Layout horizontal classique - icon, title, subtitle, stats à droite, actions
 * **MODE HIÉRARCHISÉ**: Si statusDropdown/priorityDropdown fournis
 *   - Ligne 1: Identification (titre + sous-titre)
 *   - Ligne 2: État décisionnel (Statut + Priorité)
 *   - Ligne 3: Indicateurs factuels (KPIs)
 *
 * @example
 * // Mode standard
 * <PageHeader
 *   title="Interventions"
 *   subtitle="Liste des interventions"
 *   icon={ClipboardList}
 *   stats={[{ label: 'Total', value: 42 }]}
 *   onRefresh={handleRefresh}
 *   onAdd={handleAdd}
 * />
 *
 * @example
 * // Mode hiérarchisé (interventions)
 * <PageHeader
 *   title="Intervention #123"
 *   subtitle="Machine CNC-001"
 *   statusDropdown={<StatusDropdown />}
 *   priorityDropdown={<PriorityDropdown />}
 *   stats={[{ label: 'Actions', value: 5 }]}
 * />
 */
export default function PageHeader({
  title,
  subtitle,
  icon: Icon = ClipboardList,
  stats = null,
  urgentBadge = null,
  actions = [],
  onRefresh = null,
  onAdd = null,
  addLabel = "+ Ajouter",
  timeSelection = null,
  // Mode hiérarchisé (interventions)
  statusDropdown = null,
  priorityDropdown = null
}) {
  const isHierarchicalMode = !!(statusDropdown || priorityDropdown);
  const hasTimeSelection = !!timeSelection?.enabled;
  const selectionOptions = useMemo(() => {
    if (Array.isArray(timeSelection?.options) && timeSelection.options.length > 0) {
      return timeSelection.options;
    }
    return DEFAULT_TIME_SELECTION_OPTIONS;
  }, [timeSelection?.options]);

  const defaultSelectValue =
    timeSelection?.value ||
    timeSelection?.defaultValue ||
    selectionOptions[0]?.value ||
    "all";

  const [selectValue, setSelectValue] = useState(defaultSelectValue);

  useEffect(() => {
    setSelectValue(
      timeSelection?.value ||
        timeSelection?.defaultValue ||
        selectionOptions[0]?.value ||
        "all"
    );
  }, [timeSelection?.value, timeSelection?.defaultValue, selectionOptions]);

  const handleSelectChange = useCallback(
    (value) => {
      setSelectValue(value);
      timeSelection?.onChange?.(value);
    },
    [timeSelection]
  );

  const renderTimeSelectionControl = useMemo(() => {
    if (!hasTimeSelection) {
      return null;
    }

    if (timeSelection?.mode === "popover" && timeSelection?.component === "daterange") {
      return (
        <DateRangeFilter
          mode="compact"
          onFilterChange={timeSelection.onFilterChange}
        />
      );
    }

    return (
      <Flex align="center" gap="1" style={{ minWidth: "220px" }}>
        <CalendarDays size={18} aria-hidden="true" />
        <Select.Root value={selectValue} onValueChange={handleSelectChange} size="2">
          <Select.Trigger
            style={{
              minWidth: "150px",
              borderRadius: "999px",
            }}
            aria-label="Sélectionner une période"
          />
          <Select.Content>
            {selectionOptions.map((option) => (
              <Select.Item key={option.value} value={option.value}>
                {option.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </Flex>
    );
  }, [hasTimeSelection, timeSelection, selectValue, handleSelectChange, selectionOptions]);

  return (
    <Box 
      style={{
        background: 'linear-gradient(135deg, var(--gray-1) 0%, var(--gray-2) 100%)',
        borderBottom: '1px solid var(--gray-6)',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        padding: '24px 0',
        marginBottom: '24px'
      }}
    >
      <Box style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
        {isHierarchicalMode ? (
          /* MODE HIÉRARCHISÉ : 3 lignes pour interventions */
          <Flex direction="column" gap="3">
            {/* LIGNE 1 : IDENTIFICATION */}
            <Box>
              <Flex align="center" gap="3" mb="1">
                {Icon && <Icon size={28} aria-hidden="true" />}
                <Heading size="6" style={{ margin: 0, fontWeight: 600 }} as="h1">
                  {title}
                </Heading>
              </Flex>
              {subtitle && (
                <Text size="3" style={{ color: 'var(--gray-11)', fontWeight: 500, marginLeft: Icon ? '40px' : '0' }}>
                  {subtitle}
                </Text>
              )}
            </Box>

            {/* LIGNE 2 : ÉTAT DÉCISIONNEL (priorité visuelle maximale) */}
            <Flex 
              justify="between" 
              align="center" 
              wrap="wrap" 
              gap="3"
              style={{
                padding: '12px 0',
                borderTop: '1px solid var(--gray-5)',
                borderBottom: '1px solid var(--gray-5)'
              }}
            >
              <Flex gap="3" align="center" wrap="wrap">
                {statusDropdown}
                {priorityDropdown}
              </Flex>
              
              <Flex gap="2" align="center" wrap="wrap">
                {onAdd && (
                  <Button
                    size="2"
                    onClick={onAdd}
                    style={{ backgroundColor: "var(--blue-9)", color: "white" }}
                    aria-label={addLabel}
                  >
                    {addLabel}
                  </Button>
                )}
                {Array.isArray(actions) && actions.map((action, idx) => (
                  action.label && typeof action.label === 'object' ? (
                    <Box key={idx}>{action.label}</Box>
                  ) : (
                    <Button
                      key={idx}
                      size="2"
                      variant={action.variant || "soft"}
                      color={action.color || "gray"}
                      onClick={action.onClick}
                    >
                      {action.icon && <span style={{ marginRight: '4px' }}>{action.icon}</span>}
                      {action.label}
                    </Button>
                  )
                ))}
              </Flex>
            </Flex>

            {/* LIGNE 3 : INDICATEURS FACTUELS */}
            {stats && Array.isArray(stats) && stats.length > 0 && (
              <Flex gap="4" align="center" wrap="wrap" style={{ marginLeft: Icon ? '40px' : '0' }}>
                {stats.map((stat, idx) => (
                  <Flex key={idx} align="center" gap="2">
                    <Text size="2" color="gray" weight="medium">
                      {stat.label} :
                    </Text>
                    <Text size="2" weight="bold" style={{ color: 'var(--gray-12)' }}>
                      {stat.value}
                    </Text>
                    {idx < stats.length - 1 && (
                      <Text size="2" color="gray" style={{ margin: '0 4px' }}>
                        ·
                      </Text>
                    )}
                  </Flex>
                ))}
              </Flex>
            )}
          </Flex>
        ) : (
          /* MODE STANDARD : layout horizontal classique */
          <Flex justify="between" align="center" wrap="wrap" gap="4">
            {/* Titre et sous-titre */}
            <Box style={{ flex: 1, minWidth: '200px' }}>
              <Flex align="center" gap="3" mb="2">
                {Icon && <Icon size={32} aria-hidden="true" />}
                <Heading size="7" style={{ margin: 0 }} as="h1">
                  {title}
                </Heading>
                {urgentBadge && (
                  <Badge color="red" size="2" radius="full">
                    🚨 {urgentBadge.count} {urgentBadge.label}
                  </Badge>
                )}
              </Flex>
              {subtitle && (
                <Text color="gray" size="3">
                  {subtitle}
                </Text>
              )}
            </Box>

            {/* Stats, sélection temporelle et actions */}
            <Flex direction="column" gap="2" align="end">
              {/* Ligne 1: Stats et actions */}
              <Flex gap="2" align="center" wrap="wrap">
                {stats && Array.isArray(stats) && stats.length > 0 && (
                  <Flex gap="3" align="center">
                    {stats.map((stat, idx) => (
                      <Box key={idx} style={{ textAlign: 'center' }}>
                        <Text size="2" color="gray" style={{ display: 'block', marginBottom: '4px' }}>
                          {stat.label}
                        </Text>
                        <Heading size="5">
                          {stat.value}
                        </Heading>
                      </Box>
                    ))}
                  </Flex>
                )}

                {onRefresh && (
                  <IconButton
                    variant="soft"
                    onClick={() => onRefresh()}
                    size="2"
                    title="Actualiser"
                    aria-label="Actualiser les données"
                  >
                    <RefreshCw size={16} />
                  </IconButton>
                )}

                {Array.isArray(actions) && actions.map((action, idx) => (
                  action.label && typeof action.label === 'object' ? (
                    <Box key={idx}>{action.label}</Box>
                  ) : (
                    <Button
                      key={idx}
                      size="2"
                      variant={action.variant || "soft"}
                      color={action.color || "gray"}
                      onClick={action.onClick}
                    >
                      {action.icon && <span style={{ marginRight: '4px' }}>{action.icon}</span>}
                      {action.label}
                    </Button>
                  )
                ))}

                {onAdd && (
                  <Button size="2" onClick={onAdd} aria-label={addLabel}>
                    {addLabel}
                  </Button>
                )}
              </Flex>

              {/* Ligne 2: Sélection temporelle */}
              {renderTimeSelectionControl}
            </Flex>
          </Flex>
        )}
      </Box>
    </Box>
  );
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.elementType,
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ),
  urgentBadge: PropTypes.shape({
    count: PropTypes.number.isRequired,
    label: PropTypes.string.isRequired,
  }),
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
      onClick: PropTypes.func,
      icon: PropTypes.node,
      variant: PropTypes.string,
      color: PropTypes.string,
    })
  ),
  onRefresh: PropTypes.func,
  onAdd: PropTypes.func,
  addLabel: PropTypes.string,
  timeSelection: PropTypes.shape({
    enabled: PropTypes.bool,
    mode: PropTypes.oneOf(["select", "popover"]),
    component: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    onFilterChange: PropTypes.func,
    options: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
      })
    ),
    defaultValue: PropTypes.string,
  }),
  statusDropdown: PropTypes.node,
  priorityDropdown: PropTypes.node,
};
