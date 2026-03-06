/**
 * @fileoverview Panneau détail d'une pièce référencée
 * @module components/stock/StockItemDetail
 */

import PropTypes from 'prop-types';
import { Badge, Box, Button, Card, Flex, Grid, Separator, Text } from '@radix-ui/themes';
import { Edit2, Trash2 } from 'lucide-react';

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

function MetricsGrid({ item, supplierName }) {
  return (
    <Grid columns="2" gap="3">
      <Box style={CARD_STYLE}>
        <Text size="1" color="gray" style={{ display: 'block', marginBottom: 2 }}>Quantité en stock</Text>
        <Flex align="baseline" gap="1">
          <Text size="5" weight="bold">{item.quantity ?? '—'}</Text>
          {item.unit && <Text size="2" color="gray">{item.unit}</Text>}
        </Flex>
      </Box>
      <Box style={CARD_STYLE}>
        <Text size="1" color="gray" style={{ display: 'block', marginBottom: 2 }}>Fournisseur préféré</Text>
        <Text size="2" weight="medium">{supplierName || '—'}</Text>
        {item.preferred_supplier?.supplier_code && (
          <Text size="1" color="gray" style={{ display: 'block' }}>({item.preferred_supplier.supplier_code})</Text>
        )}
      </Box>
    </Grid>
  );
}

MetricsGrid.propTypes = {
  item: PropTypes.shape({
    quantity: PropTypes.number,
    unit: PropTypes.string,
    preferred_supplier: PropTypes.shape({ supplier_code: PropTypes.string }),
  }).isRequired,
  supplierName: PropTypes.string,
};

function ItemCharacteristics({ spec, dimension, location }) {
  if (!spec && !dimension && !location) return null;
  return (
    <>
      <Separator size="4" />
      <Box>
        <Text size="2" weight="bold" color="gray" style={{ display: 'block', marginBottom: 8 }}>Caractéristiques</Text>
        <InfoRow label="Spécification" value={spec} />
        <InfoRow label="Dimension" value={dimension} />
        <InfoRow label="Emplacement" value={location} />
      </Box>
    </>
  );
}

ItemCharacteristics.propTypes = {
  spec: PropTypes.string,
  dimension: PropTypes.string,
  location: PropTypes.string,
};

export default function StockItemDetail({ item, onEdit, onDelete }) {
  const supplierName = item.preferred_supplier?.supplier_name;

  return (
    <Card>
      <Flex direction="column" gap="3">
        {/* En-tête */}
        <Flex justify="between" align="start" gap="2">
          <Box>
            <Flex align="center" gap="2" mb="1">
              <Badge variant="soft" color="blue" size="2">{item.ref}</Badge>
              {item.family_code && <Badge variant="outline" color="gray" size="1">{item.family_code}</Badge>}
              {item.sub_family_code && <Badge variant="outline" color="gray" size="1">{item.sub_family_code}</Badge>}
            </Flex>
            <Text size="4" weight="bold">{item.name}</Text>
          </Box>
          <Flex gap="2" shrink="0">
            <Button size="2" variant="soft" color="gray" onClick={onEdit}><Edit2 size={14} /> Modifier</Button>
            <Button size="2" variant="soft" color="red" onClick={onDelete}><Trash2 size={14} /> Supprimer</Button>
          </Flex>
        </Flex>

        <Separator size="4" />

        <MetricsGrid item={item} supplierName={supplierName} />
        <ItemCharacteristics spec={item.spec} dimension={item.dimension} location={item.location} />
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
    preferred_supplier: PropTypes.shape({
      supplier_name: PropTypes.string,
      supplier_code: PropTypes.string,
    }),
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
