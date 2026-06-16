import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Card, Flex, Text } from '@radix-ui/themes';
import { Zap, Package, XCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

export default function DispatchBanner({ dispatchResult, onClearResult }) {
  const [showErrors, setShowErrors] = useState(false);

  if (!dispatchResult) return null;

  return (
    <Card style={{
      background: dispatchResult.type === 'success' ? 'var(--green-2)' :
        dispatchResult.type === 'warning' ? 'var(--amber-2)' : 'var(--red-2)',
      border: `1px solid ${dispatchResult.type === 'success' ? 'var(--green-6)' :
        dispatchResult.type === 'warning' ? 'var(--amber-6)' : 'var(--red-6)'}`,
      marginBottom: 'var(--space-3)',
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
              {dispatchResult.errorCount > 0 && (
                <Flex direction="column" gap="1">
                  <Flex
                    align="center" gap="1"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setShowErrors(v => !v)}
                  >
                    <XCircle size={12} color="var(--red-9)" />
                    <Text size="1" color="red" weight="medium">
                      {dispatchResult.errorCount} erreur{dispatchResult.errorCount > 1 ? 's' : ''} — cliquer pour détails
                    </Text>
                    {showErrors ? <ChevronUp size={11} color="var(--red-9)" /> : <ChevronDown size={11} color="var(--red-9)" />}
                  </Flex>
                  {showErrors && (
                    <Flex direction="column" gap="1" style={{ marginLeft: 16, marginTop: 4 }}>
                      {dispatchResult.errorDetails.map((e, i) => (
                        <Box key={i} style={{
                          padding: '6px 8px',
                          background: 'var(--red-2)',
                          border: '1px solid var(--red-5)',
                          borderRadius: 'var(--radius-2)',
                        }}>
                          {e.item_label && (
                            <Text size="1" weight="medium" style={{ color: 'var(--gray-12)', display: 'block' }}>
                              {e.item_label}
                            </Text>
                          )}
                          <Text size="1" color="red">{e.error}</Text>
                        </Box>
                      ))}
                    </Flex>
                  )}
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
  );
}

DispatchBanner.propTypes = {
  dispatchResult: PropTypes.shape({
    type: PropTypes.string,
    message: PropTypes.string,
    dispatched: PropTypes.number,
    createdOrders: PropTypes.number,
    errorCount: PropTypes.number,
    errorDetails: PropTypes.arrayOf(PropTypes.shape({
      purchase_request_id: PropTypes.string,
      item_label: PropTypes.string,
      error: PropTypes.string,
    })),
  }),
  onClearResult: PropTypes.func,
};
