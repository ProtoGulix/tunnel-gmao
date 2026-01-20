import PropTypes from "prop-types";
import { Box, Flex } from "@radix-ui/themes";
import { Package } from "lucide-react";
import LoadingState from "@/components/common/LoadingState";
import TableHeader from "@/components/common/TableHeader";
import PurchaseRequestsTable from "@/components/purchase/requests/PurchaseRequestsTable";

/**
 * Tab Summary : Demandes d'achat liées à l'intervention
 * 
 * Signature : { model, handlers, metadata }
 * - model : intervention, demandes d'achat
 * - handlers : callbacks création, refresh
 * - metadata : config stock items, suppliers
 * 
 * Contraintes : 3 props max, pas de callback inline, <120 lignes
 */
export default function SummaryTab({ model, handlers, metadata }) {
  // Early return si chargement
  if (!model.interv || model.loading) {
    return <LoadingState message="Chargement des demandes d'achat..." />;
  }

  // Filtrer demandes liées à cette intervention
  const interventionRequests = model.purchaseRequests.filter(
    req => req.interventionId === model.interv.id
  );

  return (
    <Box pt="4">
      <Flex direction="column" gap="3">
        <TableHeader
          icon={Package}
          title="Demandes d'achat"
          count={interventionRequests.length}
          onRefresh={handlers.onRefresh}
          loading={false}
          showRefreshButton={true}
        />

        {/* Table demandes */}
        <Box mt="2">
          <PurchaseRequestsTable
            requests={interventionRequests}
            stockItems={metadata.stockItems}
            supplierRefs={metadata.supplierRefs}
            standardSpecs={metadata.standardSpecs}
            onRefresh={handlers.onRefresh}
            onAddSupplierRef={handlers.onAddSupplierRef}
            onAddStandardSpec={handlers.onAddStandardSpec}
            suppliers={metadata.suppliers}
            loading={model.loading}
            compact={true}
          />
        </Box>
      </Flex>
    </Box>
  );
}

SummaryTab.displayName = "SummaryTab";

SummaryTab.propTypes = {
  model: PropTypes.shape({
    interv: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
    }).isRequired,
    loading: PropTypes.bool,
    purchaseRequests: PropTypes.array.isRequired
  }).isRequired,
  handlers: PropTypes.shape({
    onCreatePurchaseRequest: PropTypes.func.isRequired,
    onRefresh: PropTypes.func.isRequired,
    onAddSupplierRef: PropTypes.func,
    onAddStandardSpec: PropTypes.func
  }).isRequired,
  metadata: PropTypes.shape({
    stockItems: PropTypes.array,
    supplierRefs: PropTypes.object,
    standardSpecs: PropTypes.object,
    suppliers: PropTypes.array
  }).isRequired
};
