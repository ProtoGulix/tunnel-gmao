/**
 * @fileoverview Vue Consultation des fournisseurs
 *
 * Onglet transversal de consultation pour saisir les devis fournisseurs
 * et sélectionner un fournisseur pour chaque référence.
 *
 * OBJECTIF:
 * - Vue transversale basée exclusivement sur purchase_order_line
 * - Regroupement par référence interne (stock_item_id)
 * - Affiche toutes les lignes issues de paniers OPEN
 * - Affiche les options fournisseurs disponibles pour chaque référence
 * - Permet la saisie des devis (prix, délai, fabricant)
 * - Permet la sélection d'UN fournisseur par référence
 *
 * RÈGLES:
 * - La vue ne déclenche aucune commande
 * - La vue ne verrouille rien
 * - La vue sert uniquement à la décision fournisseur
 *
 * @module pages/ConsultationTab
 * @requires react
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Flex,
  Text,
  Button,
  Card,
  Badge,
  Select,
  Spinner,
} from '@radix-ui/themes';
import {
  FileText,
  RefreshCw,
  CheckCircle2,
  Clock,
  Package,
} from 'lucide-react';
import { useError } from '@/contexts/ErrorContext';
import QuoteLineManager from '@/components/purchase/orders/QuoteLineManager';
import { suppliers as suppliersApi } from '@/lib/api/facade';

/**
 * Groupement par référence article
 * @param {Array} lines - Lignes de panier OPEN
 * @returns {Map} Map de { stock_item_id => { item, lines: [lignes pour ce fournisseur] } }
 */
const groupLinesByStockItem = (lines) => {
  const grouped = new Map();

  lines.forEach((line) => {
    const stockItem = line.stock_item_id ?? line.stockItem;
    const stockItemId = typeof stockItem === 'object' ? stockItem?.id : stockItem;

    if (!stockItemId) return;

    if (!grouped.has(stockItemId)) {
      grouped.set(stockItemId, {
        item: stockItem,
        lines: [],
      });
    }

    grouped.get(stockItemId).lines.push(line);
  });

  return grouped;
};

/**
 * Onglet Consultation: Vue transversale de consultation fournisseurs
 *
 * @param {Object} props
 * @param {boolean} props.disabled - Désactiver si données non chargées
 * @returns {JSX.Element}
 */
export default function ConsultationTab({ disabled = false }) {
  const { showError } = useError();
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState([]);
  const [filterStatus, setFilterStatus] = useState('open');
  const [updateInProgress, setUpdateInProgress] = useState(false);

  /**
   * Charger les données: paniers et lignes
   */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[ConsultationTab.loadData] Starting with filterStatus:', filterStatus);

      // Charger les paniers
      const orders = await suppliersApi.fetchSupplierOrders(
        filterStatus === 'open' ? 'OPEN' : null
      );
      console.log('[ConsultationTab.loadData] Loaded orders:', orders);

      // Charger les lignes de tous les paniers OPEN
      const allLines = [];
      const openOrders = orders.filter((o) => o.status === 'OPEN' || !o.status);
      console.log('[ConsultationTab.loadData] Filtered to OPEN orders:', openOrders.length);

      for (const order of openOrders) {
        try {
          console.log(`[ConsultationTab.loadData] Loading lines for order ${order.id}...`);
          const orderLines = await suppliersApi.fetchSupplierOrderLines(order.id);
          console.log(`[ConsultationTab.loadData] Got ${orderLines.length} lines for order ${order.id}:`, orderLines);
          
          const enriched = orderLines.map((line) => ({
            ...line,
            supplierId: order.supplier_id?.id ?? order.supplier_id,
            supplierName: order.supplier_id?.name ?? 'Inconnu',
            orderId: order.id,
          }));
          allLines.push(...enriched);
        } catch (err) {
          console.warn(`Erreur chargement lignes du panier ${order.id}:`, err);
        }
      }

      console.log('[ConsultationTab.loadData] Total lines loaded:', allLines.length);
      setLines(allLines);
    } catch (err) {
      console.error('Erreur chargement consultation:', err);
      showError('Impossible de charger la consultation');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Mettre à jour une ligne
   */
  const handleUpdateLine = useCallback(
    async (lineId, updates) => {
      try {
        setUpdateInProgress(true);

        // Mettre à jour via API
        const response = await suppliersApi.updateSupplierOrderLine(lineId, updates);
        console.log('[ConsultationTab] Update response:', response);

        // Synchroniser les champs: camelCase → snake_case pour la cohérence locale
        const snakeUpdates = {};
        const fieldMapping = {
          quoteReceived: 'quote_received',
          isSelected: 'is_selected',
          quotePrice: 'quote_price',
          leadTimeDays: 'lead_time_days',
          manufacturer: 'manufacturer',
          manufacturerRef: 'manufacturer_ref',
          quoteReceivedAt: 'quote_received_at',
          rejectedReason: 'rejected_reason',
        };

        for (const [camelKey, value] of Object.entries(updates)) {
          const snakeKey = fieldMapping[camelKey] || camelKey;
          snakeUpdates[snakeKey] = value;
        }

        console.log('[ConsultationTab] Snake updates:', snakeUpdates);

        // Mettre à jour localement avec les champs snake_case
        setLines((prev) => {
          const updated = prev.map((line) => {
            if (line.id === lineId) {
              const merged = { ...line, ...snakeUpdates };
              console.log('[ConsultationTab] Updated line:', merged);
              return merged;
            }
            return line;
          });
          console.log('[ConsultationTab] Lines after update:', updated);
          return updated;
        });

        // Recharger les données du panier pour synchroniser
        const orderId = lines.find((l) => l.id === lineId)?.orderId;
        if (orderId) {
          console.log(`[ConsultationTab] Reloading panier ${orderId} after update...`);
          const freshLines = await suppliersApi.fetchSupplierOrderLines(orderId);
          console.log(`[ConsultationTab] Reloaded ${freshLines.length} fresh lines from panier`);
          
          setLines((prev) => {
            // Remplacer les lignes du panier mis à jour
            const updated = prev.map((line) => {
              const fresh = freshLines.find((f) => f.id === line.id);
              return fresh || line;
            });
            return updated;
          });
        }
      } catch (err) {
        console.error('Erreur mise à jour ligne:', err);
        showError('Impossible de mettre à jour la ligne');
      } finally {
        setUpdateInProgress(false);
      }
    },
    [lines, showError]
  );

  /**
   * Rafraîchir les données
   */
  const handleRefresh = () => {
    loadData();
  };

  // Grouper les lignes par article
  const groupedByItem = groupLinesByStockItem(lines);

  // Statistiques
  const stats = {
    total: lines.length,
    received: lines.filter((l) => l.quoteReceived).length,
    selected: lines.filter((l) => l.isSelected).length,
    pending: lines.filter((l) => !l.quoteReceived).length,
  };

  if (disabled) {
    return (
      <Card style={{ padding: '2rem', textAlign: 'center' }}>
        <Text color="gray">Chargement des données...</Text>
      </Card>
    );
  }

  return (
    <Box p="4">
      {/* En-tête */}
      <Flex direction="column" gap="4">
        {/* Titre + Actions */}
        <Flex justify="between" align="center">
          <Flex align="center" gap="2">
            <FileText size={24} />
            <Text weight="bold" size="5">
              Consultation Fournisseurs
            </Text>
          </Flex>
          <Button
            size="2"
            variant="soft"
            onClick={handleRefresh}
            disabled={loading || updateInProgress}
          >
            {loading ? <Spinner /> : <RefreshCw size={16} />}
            Rafraîchir
          </Button>
        </Flex>

        {/* Statistiques */}
        <Flex gap="3" wrap="wrap">
          <Card variant="surface">
            <Flex direction="column" align="center">
              <Text size="1" color="gray">
                Total
              </Text>
              <Text weight="bold" size="3">
                {stats.total}
              </Text>
            </Flex>
          </Card>
          <Card variant="surface" style={{ backgroundColor: 'var(--green-2)' }}>
            <Flex direction="column" align="center">
              <Text size="1" color="green">
                <CheckCircle2 size={16} /> Devis reçus
              </Text>
              <Text weight="bold" size="3" color="green">
                {stats.received}
              </Text>
            </Flex>
          </Card>
          <Card variant="surface" style={{ backgroundColor: 'var(--blue-2)' }}>
            <Flex direction="column" align="center">
              <Text size="1" color="blue">
                ✓ Sélectionnés
              </Text>
              <Text weight="bold" size="3" color="blue">
                {stats.selected}
              </Text>
            </Flex>
          </Card>
          <Card variant="surface" style={{ backgroundColor: 'var(--gray-2)' }}>
            <Flex direction="column" align="center">
              <Text size="1" color="gray">
                <Clock size={16} /> En attente
              </Text>
              <Text weight="bold" size="3" color="gray">
                {stats.pending}
              </Text>
            </Flex>
          </Card>
        </Flex>

        {/* Filtre */}
        <Flex gap="2" align="center">
          <Text size="2">Statut panier:</Text>
          <Select.Root value={filterStatus} onValueChange={setFilterStatus}>
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="open">Ouverts</Select.Item>
              <Select.Item value="all">Tous les statuts</Select.Item>
            </Select.Content>
          </Select.Root>
        </Flex>
      </Flex>

      {/* Contenu principal */}
      <Box mt="4">
        {lines.length === 0 ? (
          <Card style={{ padding: '2rem', textAlign: 'center' }}>
            <Flex direction="column" align="center" gap="2">
              <Package size={32} color="var(--gray-7)" />
              <Text color="gray">Aucune ligne à consulter</Text>
              <Text size="1" color="gray">
                Dispatchez des demandes d&apos;achat pour voir les options fournisseurs
              </Text>
            </Flex>
          </Card>
        ) : (
          <Flex direction="column" gap="4">
            {/* Itérer sur chaque article */}
            {Array.from(groupedByItem.entries()).map(([itemId, group]) => {
              const { item, lines: itemLines } = group;
              const itemName = typeof item === 'object' ? item?.name : 'Inconnu';
              const itemRef = typeof item === 'object' ? item?.ref : itemId;

              // Vérifier la sélection pour cet article
              const selectedLine = itemLines.find((l) => l.isSelected);
              const quotedCount = itemLines.filter((l) => l.quoteReceived).length;

              return (
                <Card key={itemId} variant="classic">
                  <Flex direction="column" gap="3">
                    {/* En-tête article */}
                    <Flex justify="between" align="center">
                      <Flex direction="column" gap="1">
                        <Flex align="center" gap="2">
                          <Text weight="bold">{itemName}</Text>
                          <Badge variant="soft" color="gray">
                            {itemRef}
                          </Badge>
                        </Flex>
                        <Text size="1" color="gray">
                          Qté: {itemLines[0]?.quantity || 1}
                        </Text>
                      </Flex>
                      <Flex gap="2" align="center">
                        <Badge
                          color={selectedLine ? 'green' : 'gray'}
                          variant="soft"
                        >
                          {selectedLine
                            ? `✓ ${selectedLine.supplierName}`
                            : 'Non sélectionné'}
                        </Badge>
                        <Badge color="blue" variant="soft">
                          {quotedCount}/{itemLines.length} devis
                        </Badge>
                      </Flex>
                    </Flex>

                    {/* Tableau des options fournisseurs */}
                    <Flex direction="column" gap="2">
                      <Text size="2" weight="bold">
                        Options fournisseurs
                      </Text>
                      {itemLines.map((line) => (
                        <Card
                          key={line.id}
                          variant="surface"
                          style={{
                            backgroundColor: line.isSelected
                              ? 'var(--green-1)'
                              : undefined,
                            borderLeft: line.isSelected
                              ? '4px solid var(--green-9)'
                              : undefined,
                            paddingLeft: line.isSelected
                              ? 'calc(var(--space-3) - 1px)'
                              : undefined,
                          }}
                        >
                          <Flex direction="column" gap="2">
                            {/* Fournisseur + Statut */}
                            <Flex justify="between" align="center">
                              <Text weight="bold">{line.supplierName}</Text>
                              {line.quoteReceived ? (
                                <Badge color="green" variant="soft">
                                  <CheckCircle2 size={12} /> Devis reçu
                                </Badge>
                              ) : (
                                <Badge color="gray" variant="soft">
                                  <Clock size={12} /> En attente
                                </Badge>
                              )}
                            </Flex>

                            {/* Composant QuoteLineManager */}
                            <QuoteLineManager
                              line={line}
                              supplier={{ id: line.supplierId, name: line.supplierName }}
                              onUpdate={handleUpdateLine}
                              isLocked={false}
                              allLinesForItem={itemLines}
                            />
                          </Flex>
                        </Card>
                      ))}
                    </Flex>
                  </Flex>
                </Card>
              );
            })}
          </Flex>
        )}
      </Box>
    </Box>
  );
}

ConsultationTab.propTypes = {
  disabled: PropTypes.bool,
};
