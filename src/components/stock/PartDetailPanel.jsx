/**
 * @fileoverview Panneau détail d'une pièce V4 — centré sur internal_ref P000001
 * @module components/stock/PartDetailPanel
 */

import PropTypes from 'prop-types';
import { Badge, Box, Button, Flex, Separator, Text } from '@radix-ui/themes';
import { Edit2, Factory, ShoppingCart, Star, Trash2, X } from 'lucide-react';
import PartManufacturerRefsPanel from '@/components/stock/PartManufacturerRefsPanel';

// ─── Sous-composants ──────────────────────────────────────────────────────────

function StockQtyCard({ quantity, unit }) {
  const color = quantity == null ? 'gray' : quantity === 0 ? 'red' : quantity <= 3 ? 'orange' : 'green';
  return (
    <Box style={{ padding: '10px 14px', background: 'var(--gray-2)', borderRadius: 'var(--radius-3)' }}>
      <Text size="1" color="gray" style={{ display: 'block', marginBottom: 2 }}>Quantité en stock</Text>
      <Flex align="baseline" gap="1">
        <Text size="5" weight="bold" color={color}>{quantity ?? '—'}</Text>
        {unit && <Text size="2" color="gray">{unit}</Text>}
      </Flex>
    </Box>
  );
}
StockQtyCard.propTypes = { quantity: PropTypes.number, unit: PropTypes.string };

function MetaRow({ label, children }) {
  return (
    <Flex align="baseline" gap="2">
      <Text size="1" color="gray" style={{ minWidth: 100 }}>{label}</Text>
      {children}
    </Flex>
  );
}
MetaRow.propTypes = { label: PropTypes.string.isRequired, children: PropTypes.node.isRequired };

function PreferredMfrHeader({ part }) {
  const preferred = (part.manufacturer_refs || []).find((r) => r.is_preferred) || part.manufacturer_refs?.[0];

  if (!preferred) {
    return (
      <Flex align="center" gap="2">
        <Factory size={16} color="var(--gray-8)" />
        <Text size="3" color="gray" weight="medium">Sans référence fabricant</Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="1">
      <Flex align="center" gap="2">
        <Factory size={16} color="var(--violet-9)" />
        <Text size="4" weight="bold" style={{ letterSpacing: '-0.01em' }}>
          {preferred.manufacturer_ref}
        </Text>
        <Badge color="violet" variant="soft" size="1">{preferred.manufacturer_name}</Badge>
        {preferred.is_preferred && <Star size={11} fill="var(--amber-9)" color="var(--amber-9)" />}
      </Flex>
      {preferred.label && (
        <Text size="2" color="gray" style={{ marginLeft: 24 }}>{preferred.label}</Text>
      )}
    </Flex>
  );
}
PreferredMfrHeader.propTypes = { part: PropTypes.object.isRequired };

function PartMeta({ part }) {
  return (
    <Flex direction="column" gap="1">
      <Text size="1" weight="bold" color="gray" mb="1">Fiche pièce</Text>
      <MetaRow label="Réf. interne">
        <Badge variant="outline" color="blue" size="1" style={{ fontFamily: 'monospace' }}>
          {part.internal_ref}
        </Badge>
      </MetaRow>
      {part.family_code && (
        <MetaRow label="Famille">
          <Badge variant="outline" color="gray" size="1">
            {part.family_code}{part.sub_family_code ? `/${part.sub_family_code}` : ''}
          </Badge>
        </MetaRow>
      )}
      {part.location && (
        <MetaRow label="Emplacement"><Text size="2" weight="medium">{part.location}</Text></MetaRow>
      )}
      {part.unit && (
        <MetaRow label="Unité"><Text size="2" color="gray">{part.unit}</Text></MetaRow>
      )}
    </Flex>
  );
}
PartMeta.propTypes = { part: PropTypes.object.isRequired };

// ─── Panel principal ──────────────────────────────────────────────────────────

export default function PartDetailPanel({ part, onEdit, onDelete, onRefresh, onClose }) {
  if (!part) return null;

  return (
    <Flex direction="column" gap="4">

      {/* En-tête : ref fabricant préférée + actions */}
      <Flex justify="between" align="start">
        <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
          <PreferredMfrHeader part={part} />
          <Text size="3" weight="medium" style={{ marginTop: 4 }}>{part.display_name}</Text>
        </Flex>
        <Flex gap="1" ml="3" style={{ flexShrink: 0 }}>
          <Button size="1" variant="soft" color="gray" onClick={onEdit}><Edit2 size={12} /> Modifier</Button>
          <Button size="1" variant="soft" color="red" onClick={onDelete}><Trash2 size={12} /></Button>
          <Button size="1" variant="ghost" color="gray" onClick={onClose}><X size={14} /></Button>
        </Flex>
      </Flex>

      <StockQtyCard quantity={part.qty_in_stock} unit={part.unit} />
      <PartMeta part={part} />

      {/* Toutes les refs fabricant + leurs fournisseurs */}
      <PartManufacturerRefsPanel part={part} onRefresh={onRefresh} />

      <Separator size="4" />
      <Button size="2" variant="soft" color="blue" disabled>
        <ShoppingCart size={14} /> Créer une demande d'achat
      </Button>
    </Flex>
  );
}

PartDetailPanel.propTypes = {
  part: PropTypes.shape({
    id: PropTypes.string.isRequired,
    internal_ref: PropTypes.string.isRequired,
    display_name: PropTypes.string,
    qty_in_stock: PropTypes.number,
    unit: PropTypes.string,
    family_code: PropTypes.string,
    sub_family_code: PropTypes.string,
    location: PropTypes.string,
    manufacturer_refs: PropTypes.array,
  }),
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRefresh: PropTypes.func,
  onClose: PropTypes.func.isRequired,
};
