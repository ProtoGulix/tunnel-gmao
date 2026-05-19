/**
 * Header du détail d'un panier fournisseur : numéro, statut, actions.
 * @module components/purchase/SupplierOrderHeader
 */

import PropTypes from 'prop-types';
import { Badge, Button, DropdownMenu, Flex, Text } from '@radix-ui/themes';
import { ChevronDown, Clock, Download, Mail, ShoppingCart, Trash2 } from 'lucide-react';
import { hexBadgeStyle } from '@/config/purchaseConfig';

const AGE_COLOR = { gray: 'gray', orange: 'orange', red: 'red' };

export default function SupplierOrderHeader({ detail, statusInfo, transitions, statuses, statusUpdating, onStatusChange, onExportCsv, onExportEmail, onDelete }) {
  const badgeStyle = hexBadgeStyle(statusInfo.color);

  return (
    <Flex align="center" justify="between" gap="2">
      <Flex direction="column" gap="1">
        <Flex align="center" gap="2">
          <ShoppingCart size={16} color="var(--blue-9)" />
          <Text size="3" weight="bold">{detail.order_number}</Text>
          <Badge size="1" {...(badgeStyle ? { style: badgeStyle } : { color: statusInfo.color, variant: 'soft' })}>
            {statusInfo.label}
          </Badge>
          {detail.edit_lines && (
            <Badge color="orange" variant="soft" size="1">Négociation</Badge>
          )}
          {detail.is_blocking && (
            <Badge color={AGE_COLOR[detail.age_color] || 'gray'} variant="soft" size="1">
              <Clock size={10} /> {detail.age_days}j
            </Badge>
          )}
        </Flex>
        {statusInfo.description && (
          <Text size="1" color="gray" style={{ paddingLeft: 24 }}>{statusInfo.description}</Text>
        )}
      </Flex>

      <Flex gap="2" align="center">
        {transitions.length > 0 && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Button size="1" variant="soft" color={statusInfo.radixColor || 'gray'} loading={statusUpdating}>
                Passer à <ChevronDown size={12} />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content size="1">
              {transitions.map((t) => {
                const info = statuses[t.to] ?? { label: t.to, color: 'gray' };
                return (
                  <DropdownMenu.Item key={t.to} color={info.radixColor || 'gray'} onSelect={() => onStatusChange(t.to)}>
                    {info.label}
                    {t.description && (
                      <Text size="1" color="gray" style={{ display: 'block' }}>{t.description}</Text>
                    )}
                  </DropdownMenu.Item>
                );
              })}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        )}
        {onExportEmail && (
          <Button size="1" variant="soft" color="indigo" onClick={() => onExportEmail(detail.id)}>
            <Mail size={12} /> Demande de prix
          </Button>
        )}
        {onExportCsv && (
          <Button size="1" variant="soft" onClick={() => onExportCsv(detail.id)}>
            <Download size={12} /> CSV
          </Button>
        )}
        {onDelete && (
          <Button size="1" variant="soft" color="red" onClick={onDelete}>
            <Trash2 size={12} /> Supprimer
          </Button>
        )}
      </Flex>
    </Flex>
  );
}

SupplierOrderHeader.propTypes = {
  detail: PropTypes.object.isRequired,
  statusInfo: PropTypes.object.isRequired,
  transitions: PropTypes.array.isRequired,
  statuses: PropTypes.object.isRequired,
  statusUpdating: PropTypes.bool,
  onStatusChange: PropTypes.func.isRequired,
  onExportCsv: PropTypes.func,
  onExportEmail: PropTypes.func,
  onDelete: PropTypes.func,
};
