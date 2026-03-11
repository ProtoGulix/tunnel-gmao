/**
 * @fileoverview Panneau détail d'une pièce référencée
 * @module components/stock/StockItemDetail
 */

import PropTypes from 'prop-types';
import { useCallback, useEffect, useState } from 'react';
import { Badge, Box, Button, Card, Flex, Grid, Separator, Text } from '@radix-ui/themes';
import { Edit2, Trash2 } from 'lucide-react';
import { fetchStockItemSupplierLinks } from '@/api/suppliers';
import { SuppliersSection } from '@/components/stock/StockItemSuppliers';

// Ligne label/valeur générique utilisée pour les champs simples
function InfoRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <Flex justify="between" align="baseline" py="1">
      <Text size="2" color="gray" style={{ minWidth: 140 }}>{label}</Text>
      <Text size="2" weight="medium" style={{ textAlign: 'right' }}>{value}</Text>
    </Flex>
  );
}

InfoRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

const CARD_STYLE = { padding: '10px 14px', background: 'var(--gray-2)', borderRadius: 'var(--radius-3)' };

// Deux vignettes : quantité en stock + fournisseur préféré (ou le premier si aucun marqué)
function MetricsGrid({ quantity, unit, suppliers }) {
  const preferred = suppliers.find((s) => s.is_preferred) ?? suppliers[0];
  return (
    <Grid columns="2" gap="3">
      <Box style={CARD_STYLE}>
        <Text size="1" color="gray" style={{ display: 'block', marginBottom: 2 }}>Quantité en stock</Text>
        <Flex align="baseline" gap="1">
          <Text size="5" weight="bold">{quantity ?? '—'}</Text>
          {unit && <Text size="2" color="gray">{unit}</Text>}
        </Flex>
      </Box>
      <Box style={CARD_STYLE}>
        <Text size="1" color="gray" style={{ display: 'block', marginBottom: 2 }}>Fournisseur préféré</Text>
        <Text size="2" weight="medium">{preferred?.supplier_name || '—'}</Text>
        {preferred?.supplier_ref && (
          <Text size="1" color="gray" style={{ display: 'block' }}>{preferred.supplier_ref}</Text>
        )}
      </Box>
    </Grid>
  );
}

MetricsGrid.propTypes = {
  quantity: PropTypes.number,
  unit: PropTypes.string,
  suppliers: PropTypes.array.isRequired,
};

// Extrait la valeur affichable d'une caractéristique typée (number > enum > text)
function charValue(c) {
  return c.value_number != null ? String(c.value_number) : (c.value_enum ?? c.value_text ?? '—');
}

// Colonne gauche : famille, sous-famille et template associé
function ClassificationBox({ familyCode, subFamilyCode, template }) {
  return (
    <Box>
      <Text size="1" weight="bold" color="gray" style={{ display: 'block', marginBottom: 6 }}>Classification</Text>
      {familyCode && <Flex align="center" gap="2" mb="1"><Text size="1" color="gray" style={{ minWidth: 80 }}>Famille</Text><Badge variant="outline" color="gray" size="1">{familyCode}</Badge></Flex>}
      {subFamilyCode && <Flex align="center" gap="2" mb="1"><Text size="1" color="gray" style={{ minWidth: 80 }}>Sous-famille</Text><Badge variant="outline" color="gray" size="1">{subFamilyCode}</Badge></Flex>}
      {template && <Flex align="center" gap="2"><Text size="1" color="gray" style={{ minWidth: 80 }}>Template</Text><Flex gap="1" align="center"><Badge variant="soft" color="blue" size="1">{template.code}</Badge><Text size="1" color="gray">v{template.version}</Text></Flex></Flex>}
    </Box>
  );
}

ClassificationBox.propTypes = {
  familyCode: PropTypes.string,
  subFamilyCode: PropTypes.string,
  template: PropTypes.shape({ code: PropTypes.string, version: PropTypes.number }),
};

// Colonne droite : spec, dimension, emplacement + caractéristiques template avec leur label lisible
function DetailsBox({ spec, dimension, location, characteristics }) {
  return (
    <Box>
      <Text size="1" weight="bold" color="gray" style={{ display: 'block', marginBottom: 6 }}>Caractéristiques</Text>
      {spec && <Flex align="baseline" gap="2" mb="1"><Text size="1" color="gray" style={{ minWidth: 70 }}>Spécification</Text><Text size="2" weight="medium">{spec}</Text></Flex>}
      {dimension && <Flex align="baseline" gap="2" mb="1"><Text size="1" color="gray" style={{ minWidth: 70 }}>Dimension</Text><Text size="2" weight="medium">{dimension}</Text></Flex>}
      {location && <Flex align="baseline" gap="2" mb="1"><Text size="1" color="gray" style={{ minWidth: 70 }}>Emplacement</Text><Text size="2" weight="medium">{location}</Text></Flex>}
      {characteristics?.map((c) => <Flex key={c.key} align="baseline" gap="2" mb="1"><Text size="1" color="gray" style={{ minWidth: 70 }}>{c.label ?? c.key}</Text><Text size="2" weight="medium">{charValue(c)}</Text></Flex>)}
    </Box>
  );
}

DetailsBox.propTypes = {
  spec: PropTypes.string,
  dimension: PropTypes.string,
  location: PropTypes.string,
  characteristics: PropTypes.arrayOf(PropTypes.shape({ key: PropTypes.string, label: PropTypes.string })),
};

// Section complète classification + caractéristiques — masquée si aucun champ à afficher
function ItemCharacteristics({ familyCode, subFamilyCode, spec, dimension, location, template, characteristics }) {
  const hasLeft = familyCode || subFamilyCode || template;
  const hasRight = spec || dimension || location || characteristics?.length;
  if (!hasLeft && !hasRight) return null;
  return (
    <>
      <Separator size="4" />
      <Grid columns="2" gap="4">
        <ClassificationBox familyCode={familyCode} subFamilyCode={subFamilyCode} template={template} />
        <DetailsBox spec={spec} dimension={dimension} location={location} characteristics={characteristics} />
      </Grid>
    </>
  );
}

ItemCharacteristics.propTypes = {
  familyCode: PropTypes.string,
  subFamilyCode: PropTypes.string,
  spec: PropTypes.string,
  dimension: PropTypes.string,
  location: PropTypes.string,
  template: PropTypes.shape({ code: PropTypes.string, version: PropTypes.number }),
  characteristics: PropTypes.arrayOf(PropTypes.shape({ key: PropTypes.string, label: PropTypes.string })),
};

// Panneau principal : métriques clés, classification, caractéristiques, tableau fournisseurs
export default function StockItemDetail({ item, onEdit, onDelete, onRefresh }) {
  const [supplierRefs, setSupplierRefs] = useState(item.suppliers ?? []);

  const loadSupplierRefs = useCallback(() => {
    fetchStockItemSupplierLinks(item.id)
      .then(setSupplierRefs)
      .catch(() => {});
  }, [item.id]);

  useEffect(() => { loadSupplierRefs(); }, [loadSupplierRefs]);

  const handleRefresh = useCallback(() => {
    loadSupplierRefs();
    onRefresh?.();
  }, [loadSupplierRefs, onRefresh]);

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Flex justify="end" gap="2">
          <Button size="1" variant="soft" color="gray" onClick={onEdit}><Edit2 size={12} /> Modifier</Button>
          <Button size="1" variant="soft" color="red" onClick={onDelete}><Trash2 size={12} /> Supprimer</Button>
        </Flex>

        <MetricsGrid quantity={item.quantity} unit={item.unit} suppliers={supplierRefs} />
        <ItemCharacteristics
          familyCode={item.family_code}
          subFamilyCode={item.sub_family_code}
          spec={item.spec}
          dimension={item.dimension}
          location={item.location}
          template={item.sub_family_template}
          characteristics={item.characteristics}
        />
        <SuppliersSection suppliers={supplierRefs} stockItemId={item.id} stockItemLabel={`${item.ref} — ${item.name}`} onRefresh={handleRefresh} />
      </Flex>
    </Card>
  );
}

StockItemDetail.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    ref: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    family_code: PropTypes.string,
    sub_family_code: PropTypes.string,
    spec: PropTypes.string,
    dimension: PropTypes.string,
    quantity: PropTypes.number,
    unit: PropTypes.string,
    location: PropTypes.string,
    characteristics: PropTypes.array,
    suppliers: PropTypes.array,
    sub_family_template: PropTypes.shape({
      code: PropTypes.string,
      version: PropTypes.number,
      pattern: PropTypes.string,
    }),
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
};
