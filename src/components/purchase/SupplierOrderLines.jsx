/**
 * Tableau des lignes d'un panier fournisseur.
 * Bascule en mode éditable si isNegotiating (detail.edit_lines === true).
 * @module components/purchase/SupplierOrderLines
 */

import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Box, Button, Flex, Table, Text } from '@radix-ui/themes';
import { AlertCircle, ExternalLink, Package, Pencil, ShoppingCart } from 'lucide-react';
import StatusCallout from '@/components/ui/StatusCallout';
import OrderLineRowEditable from '@/components/purchase/OrderLineRowEditable';

/**
 * Consultation perdue par cette ligne : un panier concurrent a été sélectionné, pas elle.
 * `selected` doit refléter l'état réel (line.is_selected en lecture, draft.is_selected en édition).
 */
export function isConsultationLost(line, selected) {
  if (!line.is_consultation || selected) return false;
  return (line.competing_order_lines || []).some((sib) => sib.is_selected);
}

/** Références fournisseur / fabricant communes aux deux modes */
export function LineRefs({ line }) {
  const supplierRef = line.supplier?.ref;
  const mfrRef = line.manufacturer?.ref;
  const mfrName = line.manufacturer?.name;
  if (!supplierRef && !mfrRef) return null;
  return (
    <Flex direction="column" gap="1">
      {supplierRef && (
        <Badge color="indigo" variant="soft" size="1" style={{ width: 'fit-content' }}>
          Fourn. : {supplierRef}
        </Badge>
      )}
      {mfrRef && mfrRef !== supplierRef && (
        <Badge color="gray" variant="soft" size="1" style={{ width: 'fit-content' }} asChild>
          <Link to={`/stock?tab=items&q=${encodeURIComponent(line.stock_item_ref || mfrRef)}`} title="Voir la pièce dans le stock">
            {mfrName ? `${mfrName} : ${mfrRef}` : mfrRef} <ExternalLink size={10} />
          </Link>
        </Badge>
      )}
    </Flex>
  );
}

LineRefs.propTypes = { line: PropTypes.object.isRequired };

/** Ligne compacte "DA liée : 1, 2, 3" — un numéro d'ordre par DA d'origine, chacun cliquable. */
export function LinkedPurchaseRequests({ line }) {
  const prs = line.linked_purchase_requests || [];
  if (prs.length === 0) return null;
  return (
    <Flex align="baseline" gap="1" mt="1" wrap="wrap">
      <Text size="1" color="gray">{prs.length > 1 ? 'DA liées :' : 'DA liée :'}</Text>
      {prs.map((pr, i) => (
        <span key={pr.purchase_request_id}>
          <Link
            to={`/achats?tab=requests&requestId=${pr.purchase_request_id}`}
            title={pr.item_label || 'Voir la demande d’achat'}
            style={{ fontSize: 'var(--font-size-1)', color: 'var(--accent-9)' }}
          >
            {i + 1}
          </Link>
          {i < prs.length - 1 && <Text size="1" color="gray">, </Text>}
        </span>
      ))}
    </Flex>
  );
}

LinkedPurchaseRequests.propTypes = { line: PropTypes.object.isRequired };

/**
 * Liste des paniers fournisseur concurrents sur la même DA (consultation multi-fournisseurs).
 * Chaque panier concurrent est un bouton qui ouvre le comparateur (panier actuel vs ce concurrent).
 * Panier concurrent sélectionné : raillé + vert (a gagné, écarte le panier actuel).
 * Panier actuel sélectionné : tous les concurrents raillés + gris (écartés par ce panier).
 * Rien sélectionné : neutre (gris) — consultation encore ouverte.
 */
export function CompetingOrders({ line }) {
  const navigate = useNavigate();
  const siblings = line.competing_order_lines || [];
  if (siblings.length === 0) {
    return <Text size="1" color="gray">—</Text>;
  }

  const currentSelected = !!line.is_selected;

  const openComparator = (sib) => {
    const params = new URLSearchParams({ tab: 'comparateur' });
    if (line.supplier_order_id) params.set('a', line.supplier_order_id);
    if (sib.supplier_order_id) params.set('b', sib.supplier_order_id);
    navigate(`/achats?${params.toString()}`);
  };

  return (
    <Flex direction="column" gap="1">
      {siblings.map((sib) => {
        // Ce bouton représente le panier concurrent : il n'est barré que si LE PANIER ACTUEL
        // a gagné (donc ce concurrent est écarté). S'il a lui-même gagné (sib.is_selected),
        // il reste intact — c'est la ligne courante qui devrait apparaître éliminée, pas lui.
        const eliminated = currentSelected;
        return (
          <Button
            key={sib.supplier_order_line_id}
            size="1"
            variant="soft"
            color={sib.is_selected ? 'green' : 'gray'}
            onClick={() => openComparator(sib)}
            style={{ justifyContent: 'flex-start', height: 'auto', padding: '3px 6px' }}
          >
            <Text size="1" weight="bold" style={{ flexShrink: 0 }}>+</Text>
            <ShoppingCart size={13} strokeWidth={2.5} style={{ flexShrink: 0 }} />
            <Text
              size="1"
              weight="medium"
              style={eliminated ? { textDecoration: 'line-through', opacity: 0.7 } : undefined}
            >
              {sib.supplier_name || 'Fournisseur inconnu'}
            </Text>
          </Button>
        );
      })}
    </Flex>
  );
}

CompetingOrders.propTypes = { line: PropTypes.object.isRequired };

function OrderLineRow({ line }) {
  const lost = isConsultationLost(line, line.is_selected);
  const fade = lost ? { opacity: 0.45 } : undefined;
  return (
    <Table.Row>
      <Table.Cell style={fade}>
        <Text size="2" weight="medium">{line.stock_item_name || '—'}</Text>
        <LinkedPurchaseRequests line={line} />
      </Table.Cell>
      <Table.Cell style={fade}><LineRefs line={line} /></Table.Cell>
      <Table.Cell style={fade}><Text size="2">{line.quantity} {line.stock_item_unit || 'pcs'}</Text></Table.Cell>
      <Table.Cell style={fade}>
        {line.unit_price != null
          ? <Text size="2">{Number(line.unit_price).toFixed(2)} €</Text>
          : <Text size="1" color="gray">—</Text>}
      </Table.Cell>
      <Table.Cell style={fade}>
        {line.total_price != null
          ? <Text size="2" weight="medium">{Number(line.total_price).toFixed(2)} €</Text>
          : <Text size="1" color="gray">—</Text>}
      </Table.Cell>
      <Table.Cell><CompetingOrders line={line} /></Table.Cell>
    </Table.Row>
  );
}

OrderLineRow.propTypes = { line: PropTypes.object.isRequired };

export default function SupplierOrderLines({ lines, isNegotiating, lineDrafts, savingLines, lineErrors, onChangeDraft }) {
  const pendingConsultations = lines.filter((l) => l.is_consultation && !l.consultation_resolved).length;

  const table = (
    <Table.Root size="1" variant="surface">
      <Table.Header>
        <Table.Row style={isNegotiating ? { background: 'var(--orange-3)' } : undefined}>
          <Table.ColumnHeaderCell>Article</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Références</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Qté</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Prix u.</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Total</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Consultation</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {lines.map((line) =>
          isNegotiating && lineDrafts[line.id] ? (
            <OrderLineRowEditable
              key={line.id}
              line={line}
              draft={lineDrafts[line.id]}
              onChange={(changes) => onChangeDraft(line.id, changes)}
              saving={!!savingLines[line.id]}
            />
          ) : (
            <OrderLineRow key={line.id} line={line} />
          )
        )}
      </Table.Body>
    </Table.Root>
  );

  return (
    <>
      <Flex align="center" gap="2" mb="2">
        <Package size={14} color="var(--gray-9)" />
        <Text size="2" weight="bold" color="gray">Lignes ({lines.length})</Text>
        {isNegotiating && (
          <Badge color="orange" variant="soft" size="1">
            <Pencil size={10} /> Édition activée
          </Badge>
        )}
        {pendingConsultations > 0 && (
          <Badge color="red" variant="soft" size="1">
            <AlertCircle size={10} /> {pendingConsultations} consultation{pendingConsultations > 1 ? 's' : ''} à résoudre
          </Badge>
        )}
      </Flex>

      {Object.entries(lineErrors).map(([id, msg]) =>
        msg ? <StatusCallout key={id} type="error">{msg}</StatusCallout> : null
      )}

      {isNegotiating ? (
        <Box style={{ border: '1px solid var(--orange-6)', borderRadius: 'var(--radius-3)', overflow: 'hidden' }}>
          {table}
        </Box>
      ) : table}
    </>
  );
}

SupplierOrderLines.propTypes = {
  lines: PropTypes.array.isRequired,
  isNegotiating: PropTypes.bool,
  lineDrafts: PropTypes.object,
  savingLines: PropTypes.object,
  lineErrors: PropTypes.object,
  onChangeDraft: PropTypes.func,
};
