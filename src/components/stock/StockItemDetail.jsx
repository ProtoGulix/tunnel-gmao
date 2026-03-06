/**
 * @fileoverview Panneau détail d'une pièce référencée
 * @module components/stock/StockItemDetail
 */

import PropTypes from 'prop-types';
import { Badge, Box, Button, Card, Flex, Grid, Separator, Text } from '@radix-ui/themes';
import { Edit2, Star, Trash2 } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';

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

const SUPPLIER_COLUMNS = [
  {
    key: 'name',
    header: 'Fournisseur',
    render: (row) => (
      <Flex align="center" gap="1">
        {row.is_preferred && <Star size={11} fill="var(--amber-9)" color="var(--amber-9)" />}
        <Text size="2" weight={row.is_preferred ? 'medium' : 'regular'}>{row.supplier_name}</Text>
      </Flex>
    ),
  },
  {
    key: 'ref',
    header: 'Réf. fourn.',
    render: (row) => <Badge variant="soft" color="indigo" size="1">{row.supplier_ref}</Badge>,
  },
  {
    key: 'manufacturer',
    header: 'Réf. fabricant',
    render: (row) => row.manufacturer_item ? (
      <Flex direction="column" gap="0">
        <Badge variant="soft" color="violet" size="1">{row.manufacturer_item.manufacturer_ref}</Badge>
        <Text size="1" color="gray">{row.manufacturer_item.manufacturer_name}</Text>
      </Flex>
    ) : <Text size="1" color="gray">—</Text>,
  },
  {
    key: 'price',
    header: 'Prix unit.',
    align: 'right',
    render: (row) => <Text size="2">{row.unit_price != null ? `${row.unit_price} €` : '—'}</Text>,
  },
  {
    key: 'moq',
    header: 'Qté min.',
    align: 'right',
    render: (row) => <Text size="2" color="gray">{row.min_order_quantity ?? '—'}</Text>,
  },
  {
    key: 'delay',
    header: 'Délai',
    align: 'right',
    render: (row) => <Text size="2" color="gray">{row.delivery_time_days != null ? `${row.delivery_time_days} j` : '—'}</Text>,
  },
];

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

function ItemCharacteristics({ familyCode, subFamilyCode, spec, dimension, location, template }) {
  const hasLeft = familyCode || subFamilyCode || template;
  const hasRight = spec || dimension || location;
  if (!hasLeft && !hasRight) return null;
  return (
    <>
      <Separator size="4" />
      <Grid columns="2" gap="4">
        <Box>
          <Text size="1" weight="bold" color="gray" style={{ display: 'block', marginBottom: 6 }}>Classification</Text>
          {familyCode && (
            <Flex align="center" gap="2" mb="1">
              <Text size="1" color="gray" style={{ minWidth: 80 }}>Famille</Text>
              <Badge variant="outline" color="gray" size="1">{familyCode}</Badge>
            </Flex>
          )}
          {subFamilyCode && (
            <Flex align="center" gap="2" mb="1">
              <Text size="1" color="gray" style={{ minWidth: 80 }}>Sous-famille</Text>
              <Badge variant="outline" color="gray" size="1">{subFamilyCode}</Badge>
            </Flex>
          )}
          {template && (
            <Flex align="center" gap="2">
              <Text size="1" color="gray" style={{ minWidth: 80 }}>Template</Text>
              <Flex gap="1" align="center">
                <Badge variant="soft" color="blue" size="1">{template.code}</Badge>
                <Text size="1" color="gray">v{template.version}</Text>
              </Flex>
            </Flex>
          )}
        </Box>
        <Box>
          <Text size="1" weight="bold" color="gray" style={{ display: 'block', marginBottom: 6 }}>Caractéristiques</Text>
          {spec && (
            <Flex align="baseline" gap="2" mb="1">
              <Text size="1" color="gray" style={{ minWidth: 70 }}>Spécification</Text>
              <Text size="2" weight="medium">{spec}</Text>
            </Flex>
          )}
          {dimension && (
            <Flex align="baseline" gap="2" mb="1">
              <Text size="1" color="gray" style={{ minWidth: 70 }}>Dimension</Text>
              <Text size="2" weight="medium">{dimension}</Text>
            </Flex>
          )}
          {location && (
            <Flex align="baseline" gap="2">
              <Text size="1" color="gray" style={{ minWidth: 70 }}>Emplacement</Text>
              <Text size="2" weight="medium">{location}</Text>
            </Flex>
          )}
        </Box>
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
};

function SuppliersSection({ suppliers }) {
  return (
    <>
      <Separator size="4" />
      <Box>
        <Text size="2" weight="bold" color="gray" style={{ display: 'block', marginBottom: 8 }}>
          Fournisseurs ({suppliers.length})
        </Text>
        {suppliers.length === 0
          ? <Text size="2" color="gray">Aucun fournisseur référencé.</Text>
          : <DataTable columns={SUPPLIER_COLUMNS} data={suppliers} size="1" variant="ghost" getRowKey={(r) => r.id} />}
      </Box>
    </>
  );
}

SuppliersSection.propTypes = { suppliers: PropTypes.array.isRequired };

export default function StockItemDetail({ item, onEdit, onDelete }) {
  const suppliers = item.suppliers ?? [];

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Flex justify="end" gap="2">
          <Button size="1" variant="soft" color="gray" onClick={onEdit}><Edit2 size={12} /> Modifier</Button>
          <Button size="1" variant="soft" color="red" onClick={onDelete}><Trash2 size={12} /> Supprimer</Button>
        </Flex>

        <MetricsGrid quantity={item.quantity} unit={item.unit} suppliers={suppliers} />
        <ItemCharacteristics
          familyCode={item.family_code}
          subFamilyCode={item.sub_family_code}
          spec={item.spec}
          dimension={item.dimension}
          location={item.location}
          template={item.sub_family_template}
        />
        <SuppliersSection suppliers={suppliers} />
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
    suppliers: PropTypes.array,
    sub_family_template: PropTypes.shape({
      code: PropTypes.string,
      version: PropTypes.number,
      pattern: PropTypes.string,
    }),
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
