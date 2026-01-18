/**
 * @fileoverview Tableau des lignes d'une commande fournisseur
 *
 * Affiche le détail des articles d'une commande avec informations
 * complètes (article, références, demandeurs, etc.).
 *
 * @module components/purchase/orders/OrderLineTable
 */

/* eslint-disable complexity */
import PropTypes from 'prop-types';
import { useMemo, useCallback } from 'react';
import { Box, Flex, Text, Badge, Table } from '@radix-ui/themes';
import { Lock, Users } from 'lucide-react';
import { TwinLinesValidationAlert } from '@/components/purchase/orders/TwinLinesValidationAlert';
import { normalizeBasketStatus } from '@/lib/purchasing/basketItemRules';
import { OrderLineRowWithValidation } from './OrderLineRow';

/**
 * Hook pour calculer et gérer les alertes globales
 */
function useGlobalValidationAlerts(uniqueLines, twinValidationsByLine) {
  return useMemo(() => {
    const linesWithErrors = [];
    const linesWithWarnings = [];

    uniqueLines.forEach((line) => {
      const validation = twinValidationsByLine[line.id];
      if (!validation) return;

      if (validation.validationErrors && validation.validationErrors.length > 0) {
        linesWithErrors.push({
          line,
          twinLines: validation.twinLines || [],
          validationErrors: validation.validationErrors,
          validationWarnings: validation.validationWarnings || [],
        });
      } else if (validation.validationWarnings && validation.validationWarnings.length > 0) {
        linesWithWarnings.push({
          line,
          twinLines: validation.twinLines || [],
          validationErrors: [],
          validationWarnings: validation.validationWarnings,
        });
      }
    });

    return { linesWithErrors, linesWithWarnings };
  }, [uniqueLines, twinValidationsByLine]);
}

/**
 * Tableau complet des lignes de commande
 *
 * @component
 */
export default function OrderLineTable({
  order,
  orderLines = [],
  onLineUpdate,
  onRefresh,
  basketStatus = 'UNKNOWN',
  isLocked = false,
  onToggleItemSelection = () => {},
  twinValidationsByLine = {},
  onTwinValidationUpdate = () => {},
}) {
  // Dedup lines by id to avoid double display when backend returns duplicates
  const uniqueLines = Array.from(
    new Map(orderLines.map((l) => [l.id, l])).values()
  );

  // Déterminer le statut normalisé
  const normalizedStatus = basketStatus || normalizeBasketStatus(order.status || '');
  const isPooling = normalizedStatus === 'POOLING';
  const isCommandeOrClosed = ['ORDERED', 'CLOSED'].includes(normalizedStatus);

  // Callback pour recevoir les mises à jour de validation de chaque ligne
  const handleValidationUpdate = useCallback(
    (lineId, validation) => {
      onTwinValidationUpdate(lineId, validation);
    },
    [onTwinValidationUpdate]
  );

  // Calculer les alertes globales pour toutes les lignes
  const globalValidationAlerts = useGlobalValidationAlerts(uniqueLines, twinValidationsByLine);

  const handleToggleSelected = useCallback(
    async (lineId, isSelected) => {
      if (isPooling || isLocked || isCommandeOrClosed) {
        return;
      }

      try {
        const updatedLines = orderLines.map((line) =>
          line.id === lineId ? { ...line, is_selected: isSelected } : line
        );

        onToggleItemSelection(order.id, lineId, isSelected, updatedLines);
        onLineUpdate?.(lineId, { is_selected: isSelected });

        if (onRefresh) {
          await onRefresh();
        }
      } catch {
        // Silently ignore errors
      }
    },
    [isPooling, isLocked, isCommandeOrClosed, order.id, orderLines, onToggleItemSelection, onLineUpdate, onRefresh]
  );

  return (
    <Box>
      <Flex justify="between" align="center" mb="2">
        <Text size="2" weight="bold">
          Lignes de commande ({orderLines.length})
        </Text>
        {isCommandeOrClosed && (
          <Badge color="red" variant="soft" size="1">
            <Flex align="center" gap="1">
              <Lock size={12} />
              Panier verrouillé - Modification interdite
            </Flex>
          </Badge>
        )}
        {isPooling && (
          <Badge color="blue" variant="soft" size="1">
            <Flex align="center" gap="1">
              <Users size={12} />
              Mutualisation - Tous les items sélectionnés
            </Flex>
          </Badge>
        )}
      </Flex>

      {globalValidationAlerts.linesWithErrors.length > 0 && (
        <TwinLinesValidationAlert
          currentLine={globalValidationAlerts.linesWithErrors[0]?.line}
          twinLines={globalValidationAlerts.linesWithErrors[0]?.twinLines || []}
          validationErrors={globalValidationAlerts.linesWithErrors[0]?.validationErrors || []}
          validationWarnings={[]}
          loading={false}
        />
      )}

      {globalValidationAlerts.linesWithWarnings.length > 0 &&
        globalValidationAlerts.linesWithErrors.length === 0 && (
          <TwinLinesValidationAlert
            currentLine={globalValidationAlerts.linesWithWarnings[0]?.line}
            twinLines={globalValidationAlerts.linesWithWarnings[0]?.twinLines || []}
            validationErrors={[]}
            validationWarnings={globalValidationAlerts.linesWithWarnings[0]?.validationWarnings || []}
            loading={false}
          />
        )}

      <Table.Root variant="surface" size="1">
        <Table.Header style={{ position: 'sticky', top: 0, background: 'var(--gray-1)', zIndex: 1 }}>
          <Table.Row>
            <Table.ColumnHeaderCell>Sélection</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Article</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Réf.</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Réf. fournisseur</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Qté</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>DA / Jumelles</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Urgence</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Intervention</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Demandeur</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {uniqueLines.map((line) => (
            <OrderLineRowWithValidation
              key={line.id}
              line={line}
              onToggleSelected={handleToggleSelected}
              disabled={isCommandeOrClosed}
              isPooling={isPooling}
              onValidationUpdate={handleValidationUpdate}
            />
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

OrderLineTable.propTypes = {
  order: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string.isRequired,
  }).isRequired,
  orderLines: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ),
  onLineUpdate: PropTypes.func,
  onRefresh: PropTypes.func,
  basketStatus: PropTypes.string,
  isLocked: PropTypes.bool,
  onToggleItemSelection: PropTypes.func,
  twinValidationsByLine: PropTypes.object,
  onTwinValidationUpdate: PropTypes.func,
};
