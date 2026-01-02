import PropTypes from "prop-types";
import { Box, Flex, Button, Card } from "@radix-ui/themes";
import { Plus, Package } from "lucide-react";
import LoadingState from "@/components/common/LoadingState";
import TableHeader from "@/components/common/TableHeader";
import PurchaseRequestsTable from "@/components/stock/PurchaseRequestsTable";
import PurchaseRequestFormBody from "@/components/stock/PurchaseRequestFormBody";
import { useSummaryTab } from "./useSummaryTab";

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
  const { showForm, submitting } = useSummaryTab(model.interv.id);
  const { toggleForm, submit, cancel } = useSummaryTab(model.interv.id).handlers;

  // Early return si chargement
  if (!model.interv || model.loading) {
    return <LoadingState message="Chargement des demandes d'achat..." />;
  }

  // Filtrer demandes liées à cette intervention
  const interventionRequests = model.purchaseRequests.filter(
    req => req.interventionId === model.interv.id
  );

  // Event adapter
  const handleFormSubmit = (formData) => {
    submit(formData, handlers.onCreatePurchaseRequest);
  };

  const handleToggle = () => {
    toggleForm();
  };

  const handleCancel = () => {
    cancel();
  };

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
          actions={
            <Button
              size="2"
              onClick={handleToggle}
              style={{ backgroundColor: 'var(--blue-9)', color: 'white' }}
            >
              <Plus size={16} />
              Nouvelle demande
            </Button>
          }
        />

        {/* Formulaire création */}
        {showForm && (
          <Card style={{ backgroundColor: 'var(--gray-2)' }}>
            <PurchaseRequestFormBody
              onSubmit={handleFormSubmit}
              loading={submitting}
              onCancel={handleCancel}
              submitLabel="Créer la demande"
              compact={true}
            />
          </Card>
        )}

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
