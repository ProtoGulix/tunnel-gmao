import PropTypes from 'prop-types';
import { Badge, Flex, Text } from '@radix-ui/themes';
import { Link } from 'lucide-react';

export default function PurchaseRequestActionBanner({ action }) {
  const subcatColor = action?.subcategory?.category?.color ?? '#6b7280';

  return (
    <Flex align="stretch" gap="4">
      {/* Icône link dans la timeline */}
      <Flex direction="column" align="center" style={{ flexShrink: 0, width: 18 }}>
        <div style={{ flex: 1, borderLeft: '2.5px dashed var(--gray-6)' }} />
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Link size={18} strokeWidth={2.5} style={{ color: subcatColor, display: 'block' }} />
        </div>
        <div style={{ flex: 1, borderLeft: '2.5px dashed var(--gray-6)', marginTop: 5 }} />
      </Flex>

      {/* Contenu du bandeau */}
      <Flex
        align="center" gap="2"
        style={{
          flex: 1, minWidth: 0,
          margin: '8px 0',
          padding: '6px 10px',
          background: `${subcatColor}12`,
          borderLeft: `3px solid ${subcatColor}`,
          borderRadius: 'var(--radius-2)',
        }}
      >
        <Text size="2" weight="bold" style={{ fontFamily: 'monospace', color: subcatColor, flexShrink: 0 }}>
          {action.intervention?.code ?? '—'}
        </Text>
        <Badge size="1" style={{ background: `${subcatColor}26`, color: subcatColor, border: 'none', flexShrink: 0 }}>
          {action.subcategory?.code ?? action.subcategory?.name ?? '—'}
        </Badge>
        {action.description && (
          <Text size="1" color="gray" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {action.description}
          </Text>
        )}
      </Flex>
    </Flex>
  );
}

PurchaseRequestActionBanner.propTypes = {
  action: PropTypes.object.isRequired,
};
