/**
 * @fileoverview Panel des références fabricant d'une pièce — une section par référence, toujours visible
 * @module components/stock/PartManufacturerRefsPanel
 */

import PropTypes from 'prop-types';
import { useState } from 'react';
import { Box, Flex, Text } from '@radix-ui/themes';
import { Plus } from 'lucide-react';
import MfrRefFormRow from '@/components/stock/MfrRefFormRow';
import MfrRefRow from '@/components/stock/MfrRefRow';

function GhostAddSection({ onClick }) {
  return (
    <Box
      onClick={onClick}
      style={{ cursor: 'pointer', border: '1px dashed var(--gray-6)', borderRadius: 'var(--radius-3)', padding: 10 }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gray-2)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
    >
      <Flex align="center" gap="2">
        <Plus size={12} color="var(--gray-9)" />
        <Text size="1" color="gray">Ajouter une référence fabricant…</Text>
      </Flex>
    </Box>
  );
}

GhostAddSection.propTypes = { onClick: PropTypes.func.isRequired };

export default function PartManufacturerRefsPanel({ part, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const refs = part.manufacturer_refs || [];

  return (
    <Flex direction="column" gap="3">
      <Text size="2" weight="bold" color="gray">
        Références fabricant ({refs.length})
      </Text>

      {refs.map((ref) => (
        <MfrRefRow key={ref.id} mfrRef={ref} partId={part.id} onRefresh={onRefresh} />
      ))}

      {showForm ? (
        <MfrRefFormRow
          partId={part.id}
          onSaved={() => { setShowForm(false); onRefresh(); }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <GhostAddSection onClick={() => setShowForm(true)} />
      )}
    </Flex>
  );
}

PartManufacturerRefsPanel.propTypes = {
  part: PropTypes.object.isRequired,
  onRefresh: PropTypes.func.isRequired,
};
