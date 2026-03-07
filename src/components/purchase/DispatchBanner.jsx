/**
 * @fileoverview Banner de dispatch des demandes d'achat
 * @module components/purchase/DispatchBanner
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Card, Flex, Text } from '@radix-ui/themes';
import { Zap, Package, XCircle, CheckCircle2 } from 'lucide-react';

/**
 * Bannière de dispatch avec confirmation et résumé du résultat.
 */
export default function DispatchBanner({ readyCount, dispatching, dispatchResult, onDispatch, onClearResult }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDispatchClick = () => {
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    await onDispatch?.();
  };

  return (
    <Flex direction="column" gap="2" mb="3">
      {/* Résultat du dernier dispatch */}
      {dispatchResult && (
        <Card style={{
          background: dispatchResult.type === 'success' ? 'var(--green-2)' :
            dispatchResult.type === 'warning' ? 'var(--amber-2)' : 'var(--red-2)',
          border: `1px solid ${dispatchResult.type === 'success' ? 'var(--green-6)' :
            dispatchResult.type === 'warning' ? 'var(--amber-6)' : 'var(--red-6)'}`,
        }}>
          <Flex align="start" justify="between" gap="3">
            <Flex direction="column" gap="1">
              <Text size="2" weight="bold">{dispatchResult.message}</Text>
              {dispatchResult.dispatched !== undefined && (
                <Flex direction="column" gap="1">
                  <Flex align="center" gap="1">
                    <CheckCircle2 size={12} color="var(--green-9)" />
                    <Text size="1" color="gray">
                      {dispatchResult.dispatched} demande{dispatchResult.dispatched > 1 ? 's' : ''} dispatchée{dispatchResult.dispatched > 1 ? 's' : ''}
                    </Text>
                  </Flex>
                  {dispatchResult.createdOrders > 0 && (
                    <Flex align="center" gap="1">
                      <Package size={12} color="var(--blue-9)" />
                      <Text size="1" color="gray">
                        {dispatchResult.createdOrders} panier{dispatchResult.createdOrders > 1 ? 's' : ''} créé{dispatchResult.createdOrders > 1 ? 's' : ''} ou mis à jour
                      </Text>
                    </Flex>
                  )}
                  {dispatchResult.errors > 0 && (
                    <Flex align="center" gap="1">
                      <XCircle size={12} color="var(--red-9)" />
                      <Text size="1" color="red">
                        {dispatchResult.errors} erreur{dispatchResult.errors > 1 ? 's' : ''}
                      </Text>
                    </Flex>
                  )}
                </Flex>
              )}
            </Flex>
            {onClearResult && (
              <Button size="1" variant="ghost" color="gray" onClick={onClearResult}>
                ✕
              </Button>
            )}
          </Flex>
        </Card>
      )}

      {/* Confirmation dialog */}
      {showConfirm && (
        <Card style={{ background: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}>
          <Flex direction="column" gap="3">
            <Text size="2" weight="bold">Confirmer le dispatch</Text>
            <Text size="2" color="gray">
              {readyCount} demande{readyCount > 1 ? 's' : ''} d&apos;achat {readyCount > 1 ? 'vont être dispatchées' : 'va être dispatchée'} vers les paniers fournisseurs.
            </Text>
            <Flex gap="2">
              <Button size="2" color="blue" onClick={handleConfirm} disabled={dispatching}>
                <Zap size={14} /> Confirmer
              </Button>
              <Button size="2" variant="soft" color="gray" onClick={() => setShowConfirm(false)} disabled={dispatching}>
                Annuler
              </Button>
            </Flex>
          </Flex>
        </Card>
      )}

      {/* Bannière principale — visible quand il y a des demandes à dispatcher */}
      {readyCount > 0 && !showConfirm && (
        <Card style={{ background: 'var(--blue-2)', border: '1px solid var(--blue-5)' }}>
          <Flex align="center" justify="between" gap="3">
            <Flex align="center" gap="3">
              <Zap size={20} color="var(--blue-9)" />
              <Box>
                <Text weight="bold" size="2">
                  {readyCount} demande{readyCount > 1 ? 's' : ''} prête{readyCount > 1 ? 's' : ''} pour dispatch
                </Text>
                <Text size="1" color="gray" style={{ display: 'block' }}>
                  Ces demandes ont une pièce liée et seront envoyées aux paniers fournisseurs
                </Text>
              </Box>
            </Flex>
            <Button size="2" color="blue" onClick={handleDispatchClick} disabled={dispatching}>
              <Zap size={14} />
              {dispatching ? 'Dispatch en cours...' : 'Dispatcher maintenant'}
            </Button>
          </Flex>
        </Card>
      )}
    </Flex>
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
  }),
  onDispatch: PropTypes.func,
  onClearResult: PropTypes.func,
};
