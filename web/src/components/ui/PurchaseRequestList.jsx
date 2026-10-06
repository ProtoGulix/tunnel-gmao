/**
 * Liste de demandes d'achat liées à une action/intervention.
 * @module components/ui/PurchaseRequestList
 */
import { Flex, Text } from "@radix-ui/themes";
import PropTypes from "prop-types";
import PurchaseRequestItem from "@/components/ui/PurchaseRequestItem";

export default function PurchaseRequestList({ purchaseRequests, onDelete }) {
  if (!purchaseRequests || purchaseRequests.length === 0) return null;

  return (
    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--gray-5)' }}>
      <Flex direction="column" gap="2">
        <Text size="2" weight="bold" color="gray">
          Demandes d&apos;achat liées ({purchaseRequests.length})
        </Text>
        {purchaseRequests.map(pr => (
          <PurchaseRequestItem key={pr.id} pr={pr} onDelete={onDelete} />
        ))}
      </Flex>
    </div>
  );
}

PurchaseRequestList.displayName = "PurchaseRequestList";

PurchaseRequestList.propTypes = {
  purchaseRequests: PropTypes.arrayOf(PropTypes.object),
  onDelete: PropTypes.func,
};
