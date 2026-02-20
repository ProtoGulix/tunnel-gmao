/**
 * @fileoverview Cellules de rendu pour OrderLineRow
 * @module components/purchase/orders/OrderLineTable/CellComponents
 */

import PropTypes from 'prop-types';
import { Table, Flex, Badge, Text } from '@radix-ui/themes';
import { Package, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PurchaseRequestBadge, TwinLinesBadge } from './BadgeRenderers';

/**
 * Affiche l'article et ses informations
 */
export function ArticleCell({ stock, line }) {
  return (
    <>
      <Table.Cell>
        <Text weight="medium">{stock?.name || '—'}</Text>
      </Table.Cell>
      <Table.Cell>
        <Text family="mono" size="1">{stock?.ref || '—'}</Text>
      </Table.Cell>
      <Table.Cell>
        <Badge variant="soft" color="blue">
          {line.supplierRefSnapshot ?? line.supplier_ref_snapshot ?? '—'}
        </Badge>
      </Table.Cell>
    </>
  );
}

ArticleCell.propTypes = {
  stock: PropTypes.shape({
    name: PropTypes.string,
    ref: PropTypes.string,
  }),
  line: PropTypes.shape({
    supplierRefSnapshot: PropTypes.string,
    supplier_ref_snapshot: PropTypes.string,
  }).isRequired,
};

/**
 * Affiche la quantité
 */
export function QuantityCell({ quantity }) {
  return (
    <Table.Cell>
      <Flex align="center" gap="1">
        <Package size={12} />
        <Text weight="medium">{quantity}</Text>
      </Flex>
    </Table.Cell>
  );
}

QuantityCell.propTypes = {
  quantity: PropTypes.number.isRequired,
};

/**
 * Affiche les DA et lignes jumelles
 */
export function PurchaseRequestsCell({ prCount, twinInfo }) {
  return (
    <Table.Cell>
      <Flex direction="column" gap="1">
        <PurchaseRequestBadge prCount={prCount} />
        {twinInfo.hasTwin && (
          <TwinLinesBadge twinCount={twinInfo.twinCount} totalLines={twinInfo.totalLines} />
        )}
      </Flex>
    </Table.Cell>
  );
}

PurchaseRequestsCell.propTypes = {
  prCount: PropTypes.number.isRequired,
  twinInfo: PropTypes.shape({
    hasTwin: PropTypes.bool,
    twinCount: PropTypes.number,
    totalLines: PropTypes.number,
  }).isRequired,
};

/**
 * Affiche l'intervention
 */
export function InterventionCell({ interventionInfo }) {
  if (!interventionInfo) {
    return (
      <Table.Cell>
        <Text color="gray" size="1">—</Text>
      </Table.Cell>
    );
  }

  return (
    <Table.Cell>
      <Link
        to={`/intervention/${interventionInfo.id}`}
        style={{ textDecoration: 'none' }}
        title={`Ouvrir l'intervention ${interventionInfo.code || interventionInfo.id}`}
      >
        <Badge color="blue" variant="soft" size="1" style={{ cursor: 'pointer' }}>
          <Flex align="center" gap="1">
            {interventionInfo.code || interventionInfo.id}
            <ExternalLink size={10} />
          </Flex>
        </Badge>
      </Link>
    </Table.Cell>
  );
}

InterventionCell.propTypes = {
  interventionInfo: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    code: PropTypes.string,
  }),
};
