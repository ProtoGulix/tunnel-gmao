/**
 * @fileoverview Detail d'un fournisseur avec ses liaisons pieces
 * @module components/suppliers/SupplierDetail
 */

import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Flex, IconButton, Table, Text } from '@radix-ui/themes';
import { Edit2, ExternalLink, Link2, Plus, Star, Trash2 } from 'lucide-react';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import SupplierInfo from '@/components/suppliers/SupplierInfo';
import SupplierItemForm from '@/components/suppliers/SupplierItemForm';
import { useSupplierDetail } from '@/hooks/suppliers/useSupplierDetail';

function LinkRow({ link, onEdit, onDelete, onSetPreferred }) {
  const displayPrice = link.unit_price != null ? `${link.unit_price} €` : '-';
  return (
    <Table.Row>
      <Table.Cell>
        <Flex direction="column" gap="1">
          <Flex align="center" gap="1">
            <Badge variant="soft" color="blue">{link.stock_item_ref || '-'}</Badge>
            <IconButton size="1" variant="ghost" color="gray" title="Voir la piece dans le stock" asChild>
              <RouterLink to={`/stock${link.stock_item_ref ? `?tab=items&q=${encodeURIComponent(link.stock_item_ref)}` : ''}`}><ExternalLink size={11} /></RouterLink>
            </IconButton>
          </Flex>
          {link.stock_item_name && <Text size="1" color="gray">{link.stock_item_name}</Text>}
        </Flex>
      </Table.Cell>
      <Table.Cell>
        <Flex direction="column" gap="1">
          <Flex align="center" gap="1">
            <Link2 size={12} style={{ color: 'var(--gray-10)', flexShrink: 0 }} />
            <Badge variant="soft" color="indigo">{link.supplier_ref}</Badge>
          </Flex>
          {link.manufacturer_item && (
            <Text size="1" color="gray">
              {link.manufacturer_item.manufacturer_name}
              {link.manufacturer_item.manufacturer_ref && ` — ${link.manufacturer_item.manufacturer_ref}`}
            </Text>
          )}
        </Flex>
      </Table.Cell>
      <Table.Cell><Text size="2">{displayPrice}</Text></Table.Cell>
      <Table.Cell><Text size="2">{link.delivery_time_days ?? '-'}</Text></Table.Cell>
      <Table.Cell>
        {link.is_preferred
          ? <Badge color="amber" variant="soft">Prefere</Badge>
          : <IconButton size="1" variant="ghost" color="gray" title="Definir comme prefere" onClick={() => onSetPreferred(link)}><Star size={13} /></IconButton>
        }
      </Table.Cell>
      <Table.Cell>
        <Flex gap="1" justify="end">
          <IconButton size="1" variant="ghost" color="gray" onClick={() => onEdit(link)}><Edit2 size={13} /></IconButton>
          <IconButton size="1" variant="ghost" color="red" onClick={() => onDelete(link)}><Trash2 size={13} /></IconButton>
        </Flex>
      </Table.Cell>
    </Table.Row>
  );
}

LinkRow.propTypes = {
  link: PropTypes.shape({
    id: PropTypes.string.isRequired,
    stock_item_ref: PropTypes.string,
    stock_item_name: PropTypes.string,
    supplier_ref: PropTypes.string.isRequired,
    unit_price: PropTypes.number,
    delivery_time_days: PropTypes.number,
    is_preferred: PropTypes.bool,
    manufacturer_item: PropTypes.shape({
      manufacturer_name: PropTypes.string.isRequired,
      manufacturer_ref: PropTypes.string,
    }),
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSetPreferred: PropTypes.func.isRequired,
};

function LinksTable({ links, onEdit, onDelete, onSetPreferred }) {
  if (links.length === 0) return <Text size="2" color="gray">Aucune piece liee a ce fournisseur.</Text>;
  return (
    <Table.Root variant="surface" size="1">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Piece</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Ref. fourn.</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Prix unit.</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Delai (j)</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Prefere</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell />
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {links.map((link) => (
          <LinkRow key={link.id} link={link} onEdit={onEdit} onDelete={onDelete} onSetPreferred={onSetPreferred} />
        ))}
      </Table.Body>
    </Table.Root>
  );
}

LinksTable.propTypes = {
  links: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSetPreferred: PropTypes.func.isRequired,
};

export default function SupplierDetail({ supplierId, onEdit }) {
  const { supplier, links, loading, error, refresh, addLink, editLink, removeLink, setPreferred } =
    useSupplierDetail(supplierId);
  const [linkMode, setLinkMode] = useState(null);
  const [selectedLink, setSelectedLink] = useState(null);
  const [saving, setSaving] = useState(false);

  if (loading) return <LoadingState message="Chargement du fournisseur..." />;
  if (error) return <ErrorState error={error} onRetry={refresh} />;
  if (!supplier) return null;

  const handleSaveLink = async (data) => {
    try {
      setSaving(true);
      if (linkMode === 'edit') await editLink(selectedLink.id, data);
      else await addLink(data);
      setLinkMode(null);
      setSelectedLink(null);
    } finally {
      setSaving(false);
    }
  };

  const handleEditLink = (link) => { setSelectedLink(link); setLinkMode('edit'); };
  const handleCancelLink = () => { setLinkMode(null); setSelectedLink(null); };

  return (
    <Flex direction="column" gap="4">
      <SupplierInfo supplier={supplier} onEdit={onEdit} />

      <Box>
        <Flex justify="between" align="center" mb="3">
          <Text size="3" weight="bold">Pieces liees ({links.length})</Text>
          {!linkMode && (
            <Button size="2" color="blue" onClick={() => { setSelectedLink(null); setLinkMode('create'); }}>
              <Plus size={14} /> Lier une piece
            </Button>
          )}
        </Flex>

        {linkMode && (
          <Box mb="4">
            <SupplierItemForm
              link={linkMode === 'edit' ? selectedLink : null}
              supplierId={supplierId}
              supplierName={supplier.name}
              onSubmit={handleSaveLink}
              onCancel={handleCancelLink}
              saving={saving}
            />
          </Box>
        )}

        {!linkMode && (
          <LinksTable
            links={links}
            onEdit={handleEditLink}
            onDelete={(link) => removeLink(link.id)}
            onSetPreferred={(link) => setPreferred(link.id)}
          />
        )}
      </Box>
    </Flex>
  );
}

SupplierDetail.propTypes = {
  supplierId: PropTypes.string.isRequired,
  onEdit: PropTypes.func,
};
