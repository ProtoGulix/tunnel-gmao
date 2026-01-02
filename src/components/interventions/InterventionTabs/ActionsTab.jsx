import PropTypes from "prop-types";
import { Box, Flex, TextField, Button } from "@radix-ui/themes";
import { Activity, Search, Plus } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import TableHeader from "@/components/common/TableHeader";
import { Timeline } from "@/components/common/GenericTabComponents";
import TimelineItemRenderer from "./TimelineItemRenderer";
import { useActionsTab } from "./useActionsTab";
import { getStatusColorAtDate } from "@/lib/utils/interventionUtils";
import { STATE_COLORS } from "@/config/interventionTypes";
import { getTimeDiff } from "@/lib/utils/interventionUtils";

/**
 * Tab Actions : Timeline des actions avec recherche et regroupement par jour
 * 
 * Signature : { model, handlers, metadata }
 * - model : données intervention et timeline
 * - handlers : callbacks pour recherche et refresh
 * - metadata : config statut log
 * 
 * Contraintes : 3 props max, pas de callback inline, <150 lignes
 */
export default function ActionsTab({ model, handlers, metadata }) {
  const { filteredTimeline, actionCount } = useActionsTab(
    model.interv,
    model.searchActions,
    model.timelineByDay
  );

  // Event adapters
  const handleSearchChange = (e) => {
    handlers.onSearchChange(e.target.value);
  };

  const handleRefresh = () => {
    handlers.onRefresh();
  };

  return (
    <Box pt="4">
      <Flex direction="column" gap="3">
        {/* En-tête avec recherche */}
        <Flex direction="column" gap="2">
          <TableHeader
            icon={Activity}
            title="Actions"
            count={actionCount}
            loading={model.loading}
            showRefreshButton={true}
            onRefresh={handleRefresh}
            actions={
              handlers.onAddAction && (
                <Button
                  size="2"
                  onClick={handlers.onAddAction}
                  style={{ backgroundColor: 'var(--blue-9)', color: 'white' }}
                >
                  <Plus size={16} />
                  Action
                </Button>
              )
            }
          />
          
          <TextField.Root
            placeholder="Rechercher une action..."
            value={model.searchActions}
            onChange={handleSearchChange}
            size="2"
          >
            <TextField.Slot>
              <Search size={16} />
            </TextField.Slot>
          </TextField.Root>
        </Flex>

        {/* Timeline ou état vide */}
        {filteredTimeline.length > 0 ? (
          <Timeline
            items={filteredTimeline}
            renderItem={(item) => <TimelineItemRenderer item={item} />}
            getStatusColor={(dayGroup) => {
              const dayEnd = new Date(dayGroup.date.split('/').reverse().join('-'));
              dayEnd.setHours(23, 59, 59, 999);
              return getStatusColorAtDate(dayEnd, metadata.statusLog, STATE_COLORS);
            }}
            getTimeDiff={getTimeDiff}
            statusLog={metadata.statusLog}
          />
        ) : (
          <EmptyState
            icon={<Activity size={48} />}
            title={model.searchActions ? "Aucune action trouvée" : "Aucune action"}
            description={model.searchActions ? "Aucune action ne correspond à votre recherche." : "Décris ce que tu viens de faire ci-dessus."}
          />
        )}
      </Flex>
    </Box>
  );
}

ActionsTab.displayName = "ActionsTab";

ActionsTab.propTypes = {
  model: PropTypes.shape({
    interv: PropTypes.object.isRequired,
    searchActions: PropTypes.string.isRequired,
    timelineByDay: PropTypes.array.isRequired,
    loading: PropTypes.bool
  }).isRequired,
  handlers: PropTypes.shape({
    onSearchChange: PropTypes.func.isRequired,
    onRefresh: PropTypes.func.isRequired,
    onAddAction: PropTypes.func
  }).isRequired,
  metadata: PropTypes.shape({
    statusLog: PropTypes.array
  }).isRequired
};
