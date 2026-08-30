/**
 * Onglet comparateur de paniers fournisseurs — tableau (lignes = références,
 * colonnes = paniers). Cas nominal : 2 paniers comparés ; jusqu'à
 * MAX_COMPARED_ORDERS techniquement possible via la colonne fantôme d'ajout,
 * sans logique de tri/agrégation additionnelle au-delà de l'affichage des cellules.
 *
 * Le tableau (avec son en-tête ComparatorTableHeader : synthèse par panier,
 * colonne fantôme d'ajout) est toujours monté, dès 0 panier sélectionné — pas
 * seulement à partir de 2 — pour éviter un changement d'apparence brutal à chaque
 * panier ajouté. Seul le corps change : message d'invite tant qu'il manque un
 * panier ou que le chargement est en cours, lignes de comparaison sinon.
 *
 * Chaque cellule référence x panier est une card avec 3 états visuels distincts
 * (absent / en attente de prix / chiffré), édition prix-délai révélée au clic sur
 * le crayon, sélection (is_selected) au clic sur la card. Le badge "Meilleur" ne
 * compare que les paniers réellement chiffrés (quote_received / prix saisi).
 *
 * @module components/purchase/tabs/SupplierOrderComparatorTab
 */
import { Box, Flex, Table, Text } from '@radix-ui/themes';
import { Package, Scale } from 'lucide-react';
import PropTypes from 'prop-types';
import { useSupplierOrderComparator } from '@/hooks/purchase/useSupplierOrderComparator';
import ComparatorTableHeader from './comparator/ComparatorTableHeader';
import { ArticleCell, QtyCell } from './comparator/ComparatorArticleCell';
import ComparatorCell from './comparator/ComparatorCell';
import { ORDER_COLUMN_WIDTH, rowDelayWinner, rowPriceWinner } from './comparator/comparatorHelpers';

const ORDER_COLUMN_STYLE = { width: ORDER_COLUMN_WIDTH, minWidth: ORDER_COLUMN_WIDTH, maxWidth: ORDER_COLUMN_WIDTH };

function ComparatorBodyMessage({ icon: Icon, children }) {
  return (
    <Flex direction="column" align="center" justify="center" gap="3" py="8" style={{ opacity: 0.6 }}>
      <Icon size={36} color="var(--gray-7)" />
      <Text size="2" color="gray" align="center">{children}</Text>
    </Flex>
  );
}
ComparatorBodyMessage.propTypes = { icon: PropTypes.elementType.isRequired, children: PropTypes.node.isRequired };

export default function SupplierOrderComparatorTab() {
  const {
    selectedIds, selectedOrders, candidates,
    rows, drafts, selecting, savingLines, lineErrors,
    loadingDetail,
    addOrder, removeOrder, changeDraft, selectLine,
    totalsByOrderId, selectedCountByOrderId, maxDelayByOrderId,
  } = useSupplierOrderComparator();

  const orderIds = selectedOrders.map((o) => o.id);
  const needsMore = selectedIds.length < 2;
  const colSpan = orderIds.length + 3; // Article + Qté + une colonne par panier + marge

  let bodyContent = null;
  if (selectedIds.length > 0 && loadingDetail) {
    bodyContent = <ComparatorBodyMessage icon={Scale}>Chargement des paniers…</ComparatorBodyMessage>;
  } else if (needsMore) {
    bodyContent = (
      <ComparatorBodyMessage icon={Scale}>
        Sélectionnez au moins {selectedIds.length === 0 ? 'deux' : 'un second'} panier fournisseur comparable pour comparer leurs lignes côte à côte
      </ComparatorBodyMessage>
    );
  } else if (rows.length === 0) {
    bodyContent = <ComparatorBodyMessage icon={Package}>Ces paniers ne contiennent aucun article en commun</ComparatorBodyMessage>;
  }

  return (
    <Box pt="3">
      <Flex align="center" gap="2" mb="3">
        <Scale size={16} color="var(--blue-9)" />
        <Text size="3" weight="bold">Comparateur de paniers</Text>
      </Flex>

      <Box style={{ overflow: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
        <Table.Root size="1" variant="surface">
          <ComparatorTableHeader
            orders={selectedOrders}
            totalsByOrderId={totalsByOrderId}
            selectedCountByOrderId={selectedCountByOrderId}
            maxDelayByOrderId={maxDelayByOrderId}
            onRemove={removeOrder}
            candidates={candidates}
            onAddOrder={addOrder}
          />
          <Table.Body>
            {bodyContent ? (
              <Table.Row>
                <Table.Cell colSpan={colSpan}>{bodyContent}</Table.Cell>
              </Table.Row>
            ) : (
              rows.map((row) => {
                const priceWinner = rowPriceWinner(row, orderIds, drafts);
                const delayWinner = rowDelayWinner(row, orderIds, drafts);
                return (
                  <Table.Row key={row.key}>
                    <ArticleCell row={row} />
                    <QtyCell row={row} />
                    {orderIds.map((oid) => {
                      const line = row.linesByOrderId[oid];
                      return (
                        <Table.Cell key={oid} style={{ verticalAlign: 'top', ...ORDER_COLUMN_STYLE }}>
                          <ComparatorCell
                            line={line}
                            draft={line ? drafts[line.id] : null}
                            onChangeDraft={changeDraft}
                            isPriceWinner={priceWinner === oid}
                            isDelayWinner={delayWinner === oid}
                            isSelected={!!line?.is_selected}
                            onSelect={() => line && selectLine(line.id)}
                            selecting={selecting}
                            saving={!!(line && savingLines[line.id])}
                            error={line && lineErrors[line.id]}
                          />
                        </Table.Cell>
                      );
                    })}
                  </Table.Row>
                );
              })
            )}
          </Table.Body>
        </Table.Root>
      </Box>

      {!bodyContent && (
        <Flex gap="3" mt="3" wrap="wrap">
          <Flex align="center" gap="1">
            <Box style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--green-3)', border: '1px solid var(--green-6)' }} />
            <Text size="1" color="gray">Meilleur prix ou délai (paniers chiffrés uniquement)</Text>
          </Flex>
          <Text size="1" color="gray">Cliquez sur une card pour retenir cette offre. Crayon = modifier prix/délai.</Text>
        </Flex>
      )}
    </Box>
  );
}
