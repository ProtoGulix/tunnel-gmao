/**
 * @fileoverview Banner de dispatch des demandes d'achat avec confirmation et retour API
 *
 * @module components/purchase/DispatchBanner
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 */
import { useState } from "react";
import PropTypes from "prop-types";
import { Box, Button, Card, Flex, Text } from "@radix-ui/themes";
import { Zap, Package, XCircle, CheckCircle2 } from "lucide-react";
import StatusCallout from "@/components/common/StatusCallout";

const DEFAULT_DISPATCH_TEXT = "Dispatch en cours...";
const DEFAULT_DISPATCH_BUTTON = "Dispatcher maintenant";

const buildDispatchMessage = (count) =>
  `${count} demande${count > 1 ? "s" : ""} dispatchée${count > 1 ? "s" : ""}`;

const buildOrdersMessage = (count) =>
  `${count} panier${count > 1 ? "s" : ""} créé${count > 1 ? "s" : ""} ou mis à jour`;

const buildErrorsMessage = (count) =>
  `${count} erreur${count > 1 ? "s" : ""}`;

/**
 * Bannière de dispatch avec confirmation et résumé du résultat.
 * @component
 * @param {Object} props
 * @param {number} props.readyCount - Nombre de demandes prêtes à dispatcher
 * @param {boolean} props.dispatching - Indique si le dispatch est en cours
 * @param {Object|null} props.dispatchResult - Résultat du dispatch
 * @param {Function} props.onDispatch - Callback de dispatch
 * @param {Function} props.onNotDispatchable - Callback si aucune demande dispatchable
 * @returns {JSX.Element}
 */
export default function DispatchBanner({
  readyCount,
  dispatching,
  dispatchResult,
  onDispatch,
  onNotDispatchable,
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDispatchClick = () => {
    if (readyCount === 0) {
      onNotDispatchable?.();
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    await onDispatch?.();
  };

  return (
    <>
      {dispatchResult && (
        <StatusCallout type={dispatchResult.type} title={dispatchResult.message}>
          <Flex direction="column" gap="1">
            {dispatchResult.dispatched !== undefined && (
              <Flex direction="column" gap="1" mt="2">
                <Text size="2">
                  <CheckCircle2 size={14} /> {buildDispatchMessage(dispatchResult.dispatched)}
                </Text>
                {dispatchResult.createdOrders > 0 && (
                  <Text size="2">
                    <Package size={14} /> {buildOrdersMessage(dispatchResult.createdOrders)}
                  </Text>
                )}
                {dispatchResult.errors > 0 && (
                  <Text size="2" color="red">
                    <XCircle size={14} /> {buildErrorsMessage(dispatchResult.errors)}
                  </Text>
                )}
              </Flex>
            )}
            {dispatchResult.details && <Text size="2" mt="1">{dispatchResult.details}</Text>}
          </Flex>
        </StatusCallout>
      )}

      {showConfirm && (
        <StatusCallout type="info" dialog title="Confirmer le dispatch">
          <Flex direction="column" gap="3">
            <Text size="2" color="gray" style={{ display: "block", marginTop: "4px" }}>
              {readyCount} demande{readyCount > 1 ? "s" : ""} d&#39;achat {readyCount > 1 ? "vont être dispatchées" : "va être dispatchée"} vers les paniers fournisseurs.
            </Text>
            <Flex gap="2">
              <Button
                size="2"
                color="blue"
                onClick={handleConfirm}
                disabled={dispatching}
                aria-label="Confirmer le dispatch des demandes d'achat"
              >
                <Zap size={14} />
                Confirmer
              </Button>
              <Button
                size="2"
                variant="soft"
                color="gray"
                onClick={() => setShowConfirm(false)}
                disabled={dispatching}
                aria-label="Annuler le dispatch"
              >
                Annuler
              </Button>
            </Flex>
          </Flex>
        </StatusCallout>
      )}

      {readyCount > 0 && !showConfirm && (
        <Card mb="3" style={{ background: "var(--blue-2)" }}>
          <Flex align="center" justify="between" gap="3">
            <Flex align="center" gap="3">
              <Zap size={24} color="var(--blue-9)" />
              <Box>
                <Text weight="bold" size="3">
                  {readyCount} demande{readyCount > 1 ? "s" : ""} ouverte{readyCount > 1 ? "s" : ""} prête{readyCount > 1 ? "s" : ""} pour dispatch
                </Text>
                <Text size="2" color="gray" style={{ display: "block" }}>
                  Ces demandes ont une pièce liée et peuvent être dispatchées automatiquement
                </Text>
              </Box>
            </Flex>
            <Button
              size="3"
              color="blue"
              onClick={handleDispatchClick}
              disabled={dispatching}
              aria-label="Dispatcher les demandes d'achat prêtes vers les paniers fournisseurs"
            >
              <Zap size={16} />
              {dispatching ? DEFAULT_DISPATCH_TEXT : DEFAULT_DISPATCH_BUTTON}
            </Button>
          </Flex>
        </Card>
      )}
    </>
  );
}

DispatchBanner.propTypes = {
  readyCount: PropTypes.number.isRequired,
  dispatching: PropTypes.bool.isRequired,
  dispatchResult: PropTypes.shape({
    type: PropTypes.string,
    message: PropTypes.string,
    dispatched: PropTypes.number,
    createdOrders: PropTypes.number,
    errors: PropTypes.number,
    details: PropTypes.string,
  }),
  onDispatch: PropTypes.func,
  onNotDispatchable: PropTypes.func,
};