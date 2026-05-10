/**
 * @fileoverview Panneau détail master-detail — vue terrain centrée sur fabricant et fournisseurs
 * @module components/stock/StockDetailPanel
 */

import PropTypes from 'prop-types';
import { useCallback, useEffect, useState } from 'react';
import { Badge, Box, Button, Card, Flex, Separator, Text } from '@radix-ui/themes';
import { Edit2, Factory, MousePointerClick, ShoppingCart, Trash2, X } from 'lucide-react';
import LoadingState from '@/components/ui/LoadingState';
import StockItemForm from '@/components/stock/StockItemForm';
import { SuppliersSection } from '@/components/stock/StockItemSuppliers';
import { fetchStockItemSupplierLinks } from '@/api/suppliers';

// Extrait la valeur affichable d'une caractéristique
function charValue(c) {
  return c.value_number != null ? String(c.value_number) : (c.value_enum ?? c.value_text ?? '—');
}

function ManufacturerHeader({ suppliers }) {
  // Déduplique les manufacturer_items uniques par id
  const manufacturers = [];
  const seen = new Set();
  for (const s of suppliers) {
    const m = s.manufacturer_item;
    if (m && !seen.has(m.id)) {
      seen.add(m.id);
      manufacturers.push(m);
    }
  }

  if (manufacturers.length === 0) {
    return (
      <Flex align="center" gap="2">
        <Factory size={16} color="var(--gray-8)" />
        <Text size="3" color="gray" weight="medium">Sans référence fabricant</Text>
      </Flex>
    );
  }

  // Affiche le premier fab en titre (le préféré via le supplier preferred)
  const preferred = suppliers.find((s) => s.is_preferred && s.manufacturer_item);
  const main = preferred?.manufacturer_item ?? manufacturers[0];

  return (
    <Flex direction="column" gap="1">
      <Flex align="center" gap="2">
        <Factory size={16} color="var(--violet-9)" />
        <Text size="4" weight="bold" style={{ letterSpacing: '-0.01em' }}>
          {main.manufacturer_ref}
        </Text>
        <Badge color="violet" variant="soft" size="1">{main.manufacturer_name}</Badge>
      </Flex>
      {main.designation && (
        <Text size="2" color="gray" style={{ marginLeft: 24 }}>{main.designation}</Text>
      )}
    </Flex>
  );
}

ManufacturerHeader.propTypes = {
  suppliers: PropTypes.array.isRequired,
};

function MetaRow({ label, children }) {
  return (
    <Flex align="baseline" gap="2" py="0">
      <Text size="1" color="gray" style={{ minWidth: 100 }}>{label}</Text>
      {children}
    </Flex>
  );
}

MetaRow.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

function ItemMeta({ item }) {
  const hasClassif = item.family_code || item.sub_family_code;
  const hasChars = item.spec || item.dimension || item.location || item.characteristics?.length;

  if (!hasClassif && !hasChars) return null;

  return (
    <Flex direction="column" gap="1">
      <Text size="1" weight="bold" color="gray" mb="1">Fiche pièce</Text>
      {item.ref && (
        <MetaRow label="Ref. interne">
          <Badge variant="outline" color="gray" size="1" style={{ fontFamily: 'monospace', fontSize: 10 }}>{item.ref}</Badge>
        </MetaRow>
      )}
      {item.family_code && (
        <MetaRow label="Famille">
          <Badge variant="outline" color="gray" size="1">{item.family_code}{item.sub_family_code ? `/${item.sub_family_code}` : ''}</Badge>
        </MetaRow>
      )}
      {item.spec && (
        <MetaRow label="Spécification"><Text size="2" weight="medium">{item.spec}</Text></MetaRow>
      )}
      {item.dimension && (
        <MetaRow label="Dimension"><Text size="2" weight="medium">{item.dimension}</Text></MetaRow>
      )}
      {item.location && (
        <MetaRow label="Emplacement"><Text size="2" weight="medium">{item.location}</Text></MetaRow>
      )}
      {item.characteristics?.map((c) => (
        <MetaRow key={c.key} label={c.label ?? c.key}>
          <Text size="2" weight="medium">{charValue(c)}</Text>
        </MetaRow>
      ))}
    </Flex>
  );
}

ItemMeta.propTypes = {
  item: PropTypes.object.isRequired,
};

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

function AlternativesSection({ suppliers }) {
  // Toutes les paires fabricant unique (dédupliquées par manufacturer_item.id)
  const manufacturers = [];
  const seen = new Set();
  for (const s of suppliers) {
    const m = s.manufacturer_item;
    if (m && !seen.has(m.id)) {
      seen.add(m.id);
      manufacturers.push(m);
    }
  }

  if (manufacturers.length <= 1) return null;

  return (
    <>
      <Separator size="4" />
      <Box>
        <Text size="2" weight="bold" color="gray" mb="2" style={{ display: 'block' }}>
          Références fabricants ({manufacturers.length})
        </Text>
        <Flex direction="column" gap="1">
          {manufacturers.map((m) => (
            <Flex key={m.id} align="center" gap="2" py="1"
              style={{ padding: '6px 10px', background: 'var(--gray-2)', borderRadius: 'var(--radius-2)' }}>
              <Factory size={12} color="var(--gray-9)" />
              <Badge variant="soft" color="violet" size="1">{m.manufacturer_ref}</Badge>
              <Text size="1" color="gray">{m.manufacturer_name}</Text>
              {m.designation && <Text size="1" color="gray">— {m.designation}</Text>}
            </Flex>
          ))}
        </Flex>
      </Box>
    </>
  );
}

AlternativesSection.propTypes = { suppliers: PropTypes.array.isRequired };

export default function StockDetailPanel({
  item, loading, mode,
  saving, onEdit, onEditSubmit, onEditCancel,
  onDelete, onRefresh, onClose,
}) {
  const [supplierLinks, setSupplierLinks] = useState([]);

  const loadLinks = useCallback(() => {
    if (!item?.id) return;
    fetchStockItemSupplierLinks(item.id)
      .then(setSupplierLinks)
      .catch(() => {});
  }, [item?.id]);

  useEffect(() => {
    setSupplierLinks([]);
    loadLinks();
  }, [loadLinks]);

  const handleRefresh = useCallback(() => {
    loadLinks();
    onRefresh?.();
  }, [loadLinks, onRefresh]);

  if (loading) {
    return (
      <Box style={{ border: '1px solid var(--gray-5)', borderRadius: 'var(--radius-3)', height: 730 }}>
        <LoadingState fullscreen={false} message="Chargement du détail…" />
      </Box>
    );
  }

  if (!item) {
    return (
      <Box style={{
        border: '1px dashed var(--gray-6)',
        borderRadius: 'var(--radius-3)',
        height: 730,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}>
        <MousePointerClick size={32} color="var(--gray-7)" />
        <Text size="2" color="gray">Sélectionnez une pièce pour voir son détail</Text>
      </Box>
    );
  }

  if (mode === 'edit') {
    return (
      <Card>
        <StockItemForm item={item} onSubmit={onEditSubmit} onCancel={onEditCancel} saving={saving} />
      </Card>
    );
  }

  return (
    <Box style={{
      border: '1px solid var(--gray-5)',
      borderRadius: 'var(--radius-3)',
      overflow: 'hidden',
    }}>
      {/* Header sticky */}
      <Box style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--gray-5)',
        background: 'var(--gray-2)',
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}>
        <Flex justify="between" align="start">
          <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
            <ManufacturerHeader suppliers={supplierLinks} />
            <Text size="3" weight="medium" style={{ marginTop: 4 }}>{item.name}</Text>
          </Flex>
          <Flex gap="1" ml="3" style={{ flexShrink: 0 }}>
            <Button size="1" variant="soft" color="gray" onClick={onEdit}>
              <Edit2 size={12} /> Modifier
            </Button>
            <Button size="1" variant="soft" color="red" onClick={onDelete}>
              <Trash2 size={12} />
            </Button>
            <Button size="1" variant="ghost" color="gray" onClick={onClose}>
              <X size={14} />
            </Button>
          </Flex>
        </Flex>
      </Box>

      {/* Corps scrollable */}
      <Box style={{ height: 630, overflowY: 'auto', padding: '14px 16px' }}>
        <Flex direction="column" gap="4">
          {/* Métrique stock */}
          <StockQtyCard quantity={item.quantity} unit={item.unit} />

          {/* Métadonnées classification + caractéristiques */}
          <ItemMeta item={item} />

          <Separator size="4" />

          {/* Section fournisseurs complète (avec ajout/modif/suppression) */}
          <SuppliersSection
            suppliers={supplierLinks}
            stockItemId={item.id}
            stockItemLabel={`${item.ref} — ${item.name}`}
            onRefresh={handleRefresh}
          />

          {/* Alternatives fabricants si > 1 */}
          <AlternativesSection suppliers={supplierLinks} />

          {/* Bouton demande d'achat */}
          <Separator size="4" />
          <Flex gap="2">
            <Button size="2" variant="soft" color="blue" disabled>
              <ShoppingCart size={14} /> Créer une demande d'achat
            </Button>
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
}

StockDetailPanel.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    ref: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    quantity: PropTypes.number,
    unit: PropTypes.string,
    family_code: PropTypes.string,
    sub_family_code: PropTypes.string,
    spec: PropTypes.string,
    dimension: PropTypes.string,
    location: PropTypes.string,
    characteristics: PropTypes.array,
  }),
  loading: PropTypes.bool,
  mode: PropTypes.string,
  saving: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onEditSubmit: PropTypes.func.isRequired,
  onEditCancel: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRefresh: PropTypes.func,
  onClose: PropTypes.func.isRequired,
};
