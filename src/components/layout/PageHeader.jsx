/**
 * @fileoverview En-tête de page unifié avec modes standard et hiérarchisé
 *
 * @module components/layout/PageHeader
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 * @requires ./TimeSelectionControl
 * @requires ./StandardHeaderLayout
 * @requires ./HierarchicalHeaderLayout
 * @requires @/hooks/useTimeSelection
 */

import PropTypes from "prop-types";
import { Box } from "@radix-ui/themes";
import { ClipboardList } from "lucide-react";
import StandardHeaderLayout from "./StandardHeaderLayout";
import HierarchicalHeaderLayout from "./HierarchicalHeaderLayout";
import useTimeSelection from "@/hooks/useTimeSelection";

/**
 * En-tête de page unifié et réutilisable
 *
 * Composant orchestrant l'affichage d'en-têtes de pages selon deux modes :
 * - **MODE STANDARD** : Layout horizontal classique (icon, titre, stats, actions)
 * - **MODE HIÉRARCHISÉ** : Layout 3 lignes pour interventions (identification, état, indicateurs)
 *
 * @component
 * @param {Object} props
 * @param {string} props.title - Titre de la page
 * @param {string} [props.subtitle] - Sous-titre optionnel
 * @param {React.ComponentType} [props.icon=ClipboardList] - Icône Lucide React
 * @param {Array<{label: string, value: string|number, info?: string, color?: string}>} [props.stats] - Statistiques affichées
 * @param {{count: number, label: string}} [props.urgentBadge] - Badge d'urgence (mode standard uniquement)
 * @param {Array<{label: string|React.Node, onClick: Function, icon?: React.Node, variant?: string, color?: string}>} [props.actions] - Actions personnalisées
 * @param {Function} [props.onRefresh] - Callback de rafraîchissement (mode standard uniquement)
 * @param {Function} [props.onAdd] - Callback d'ajout
 * @param {string} [props.addLabel="+ Ajouter"] - Label du bouton d'ajout
 * @param {Object} [props.timeSelection] - Configuration temporelle
 * @param {boolean} [props.timeSelection.enabled] - Activer la sélection temporelle
 * @param {string} [props.timeSelection.mode='select'] - Mode d'affichage ('select' ou 'popover')
 * @param {string} [props.timeSelection.component] - Composant à utiliser ('daterange' pour DateRangeFilter)
 * @param {string} [props.timeSelection.value] - Valeur sélectionnée
 * @param {Function} [props.timeSelection.onChange] - Callback changement de sélection
 * @param {Function} [props.timeSelection.onFilterChange] - Callback filtre date range
 * @param {Array<{value: string, label: string}>} [props.timeSelection.options] - Options personnalisées
 * @param {string} [props.timeSelection.defaultValue] - Valeur par défaut
 * @param {React.Node} [props.statusDropdown] - Dropdown de statut (mode hiérarchisé)
 * @param {React.Node} [props.priorityDropdown] - Dropdown de priorité (mode hiérarchisé)
 * @returns {JSX.Element} En-tête de page
 *
 * @example
 * // Mode standard avec stats et refresh
 * <PageHeader
 *   title="Interventions"
 *   subtitle="Liste des interventions"
 *   icon={ClipboardList}
 *   stats={[{ label: 'Total', value: 42 }]}
 *   onRefresh={handleRefresh}
 *   onAdd={handleAdd}
 *   timeSelection={{
 *     enabled: true,
 *     onChange: handleTimeChange
 *   }}
 * />
 *
 * @example
 * // Mode hiérarchisé pour interventions
 * <PageHeader
 *   title="Intervention #123"
 *   subtitle="Machine CNC-001"
 *   icon={Wrench}
 *   statusDropdown={<StatusDropdown />}
 *   priorityDropdown={<PriorityDropdown />}
 *   stats={[
 *     { label: 'Durée', value: '3h', color: 'blue' },
 *     { label: 'Actions', value: 5 }
 *   ]}
 *   onAdd={handleAddAction}
 * />
 *
 * @example
 * // Mode popover avec DateRangeFilter
 * <PageHeader
 *   title="Dashboard"
 *   timeSelection={{
 *     enabled: true,
 *     mode: 'popover',
 *     component: 'daterange',
 *     onFilterChange: handleDateRangeChange
 *   }}
 * />
 */
export default function PageHeader(props) {
  const { icon = ClipboardList, timeSelection, statusDropdown, priorityDropdown } = props;

  // Time selection control
  const { timeSelectionControl } = useTimeSelection(timeSelection);

  // Mode detection
  const isHierarchicalMode = !!(statusDropdown || priorityDropdown);

  // Props pour layout hiérarchisé
  const hierarchicalProps = {
    title: props.title,
    subtitle: props.subtitle,
    Icon: icon,
    stats: props.stats,
    actions: props.actions,
    onAdd: props.onAdd,
    addLabel: props.addLabel || "+ Ajouter",
    statusDropdown,
    priorityDropdown,
  };

  // Props pour layout standard
  const standardProps = {
    title: props.title,
    subtitle: props.subtitle,
    Icon: icon,
    stats: props.stats,
    actions: props.actions,
    onAdd: props.onAdd,
    addLabel: props.addLabel || "+ Ajouter",
    urgentBadge: props.urgentBadge,
    onRefresh: props.onRefresh,
    timeSelectionControl,
  };

  return (
    <Box
      style={{
        background: "linear-gradient(135deg, var(--gray-1) 0%, var(--gray-2) 100%)",
        borderBottom: "1px solid var(--gray-6)",
        width: "100vw",
        marginLeft: "calc(-50vw + 50%)",
        padding: "24px 0",
        marginBottom: "24px",
      }}
    >
      <Box style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 24px" }}>
        {isHierarchicalMode ? (
          <HierarchicalHeaderLayout {...hierarchicalProps} />
        ) : (
          <StandardHeaderLayout {...standardProps} />
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
