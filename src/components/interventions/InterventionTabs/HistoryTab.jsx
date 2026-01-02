import PropTypes from "prop-types";
import { Box, Flex } from "@radix-ui/themes";
import { History } from "lucide-react";
import TableHeader from "@/components/common/TableHeader";
import { History as HistoryComponent } from "@/components/common/GenericTabComponents";
import HistoryItem from "./HistoryItem";

/**
 * Tab History : Historique chronologique actions + changements statut
 * 
 * Signature : { model, handlers }
 * - model : timeline fusionnée
 * - handlers : callbacks refresh
 * 
 * Contraintes : 2 props, pas de logique complexe, <80 lignes
 */
export default function HistoryTab({ model, handlers }) {
  return (
    <Box pt="4">
      <Flex direction="column" gap="3">
        <TableHeader
          icon={History}
          title="Historique chronologique"
          count={model.timeline.length}
          onRefresh={handlers.onRefresh}
          loading={model.loading}
          showRefreshButton={true}
        />

        <HistoryComponent
          items={model.timeline}
          renderItem={(item) => <HistoryItem item={item} />}
          loading={model.loading}
          onRefresh={handlers.onRefresh}
        />
      </Flex>
    </Box>
  );
}

HistoryTab.displayName = "HistoryTab";

HistoryTab.propTypes = {
  model: PropTypes.shape({
    timeline: PropTypes.array.isRequired,
    loading: PropTypes.bool
  }).isRequired,
  handlers: PropTypes.shape({
    onRefresh: PropTypes.func.isRequired
  }).isRequired
};
