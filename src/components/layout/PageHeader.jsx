import PropTypes from "prop-types";
import { Box } from "@radix-ui/themes";
import { ClipboardList } from "lucide-react";
import StandardHeaderLayout from "./StandardHeaderLayout";
import HierarchicalHeaderLayout from "./HierarchicalHeaderLayout";
import useTimeSelection from "@/hooks/shared/useTimeSelection";

export default function PageHeader(props) {
  const { icon = ClipboardList, timeSelection, statusDropdown, priorityDropdown, noMargin = false } = props;

  const { timeSelectionControl } = useTimeSelection(timeSelection);

  const isHierarchicalMode = !!(statusDropdown || priorityDropdown);

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

  const standardProps = {
    title: props.title,
    subtitle: props.subtitle,
    description: props.description,
    Icon: icon,
    stats: props.stats,
    actions: props.actions,
    onAdd: props.onAdd,
    addLabel: props.addLabel || "+ Ajouter",
    urgentBadge: props.urgentBadge,
    onRefresh: props.onRefresh,
    onBack: props.onBack,
    backLabel: props.backLabel,
    timeSelectionControl,
    children: props.children,
  };

  return (
    <Box
      style={{
        background: "linear-gradient(135deg, var(--gray-1) 0%, var(--gray-2) 100%)",
        borderBottom: "1px solid var(--gray-6)",
        padding: "14px 24px",
        flexShrink: 0,
        marginBottom: noMargin ? 0 : "var(--space-5)",
      }}
    >
      {isHierarchicalMode ? (
        <HierarchicalHeaderLayout {...hierarchicalProps} />
      ) : (
        <StandardHeaderLayout {...standardProps} />
      )}
    </Box>
  );
}

PageHeader.propTypes = {
  noMargin: PropTypes.bool,
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
  onBack: PropTypes.func,
  backLabel: PropTypes.string,
  addLabel: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.node,
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
