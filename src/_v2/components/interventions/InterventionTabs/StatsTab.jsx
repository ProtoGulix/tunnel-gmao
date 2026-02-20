import PropTypes from "prop-types";
import { Box, Flex } from "@radix-ui/themes";
import { Activity, Clock, CheckCircle } from "lucide-react";
import LoadingState from "@/components/common/LoadingState";
import TableHeader from "@/components/common/TableHeader";
import { StatsGrid } from "@/components/common/GenericTabComponents";
import { STATE_COLORS } from "@/config/interventionTypes";

/**
 * Tab Stats : Statistiques intervention
 * 
 * Signature : { model, handlers }
 * - model : intervention, temps total
 * - handlers : callback refresh
 * 
 * Contraintes : 2 props, pas de logique complexe, <80 lignes
 */
export default function StatsTab({ model, handlers }) {
  const stats = [
    {
      label: 'Temps total passé',
      value: `${model.totalTime.toFixed(1)}h`,
      icon: Clock,
      bgColor: 'var(--blue-2)',
      textColor: 'var(--blue-11)',
      size: '8'
    },
    {
      label: "Nombre d'actions",
      value: model.interv.action?.length || 0,
      icon: Activity,
      bgColor: 'var(--gray-2)',
      textColor: 'var(--gray-11)',
      size: '6'
    },
    {
      label: 'Statut actuel',
      value: STATE_COLORS[model.interv.status_actual?.id]?.label || 'En cours',
      icon: CheckCircle,
      bgColor: 'var(--green-2)',
      textColor: 'var(--green-11)',
      size: '4'
    }
  ];

  return (
    <Box pt="4">
      <Flex direction="column" gap="3">
        <TableHeader
          icon={Activity}
          title="Statistiques"
          onRefresh={handlers.onRefresh}
          loading={model.loading}
          showRefreshButton={true}
        />
        
        {model.loading ? (
          <LoadingState message="Chargement des statistiques..." fullscreen={false} size="2" />
        ) : (
          <StatsGrid stats={stats} />
        )}
      </Flex>
    </Box>
  );
}

StatsTab.displayName = "StatsTab";

StatsTab.propTypes = {
  model: PropTypes.shape({
    totalTime: PropTypes.number.isRequired,
    interv: PropTypes.shape({
      action: PropTypes.array,
      status_actual: PropTypes.object
    }).isRequired,
    loading: PropTypes.bool
  }).isRequired,
  handlers: PropTypes.shape({
    onRefresh: PropTypes.func.isRequired
  }).isRequired
};
