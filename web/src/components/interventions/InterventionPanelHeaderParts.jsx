/**
 * Sous-composants de l'en-tête compact du panneau intervention (ADR 0013).
 */

import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';
import { Badge, Button, DropdownMenu, Flex, IconButton, Link, Text } from '@radix-ui/themes';
import { useInterventionTypeRefs } from '@/hooks/shared/useInterventionTypeRefs';
import { CalendarCheck, ChevronDown, ClipboardList, Copy, ExternalLink, MoreHorizontal, Trash2 } from 'lucide-react';

function formatShortDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function ColorDot({ color }) {
  return <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />;
}

ColorDot.propTypes = { color: PropTypes.string };

/** Propriété discrète (pastille + libellé) qui ouvre un menu de choix. */
export function PropertySelect({ ariaLabel, value, options, colors, disabled, onChange }) {
  const current = colors[value];
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger disabled={disabled}>
        <Button variant="ghost" color="gray" size="2" aria-label={ariaLabel} style={{ color: 'var(--gray-12)', fontWeight: 500 }}>
          <ColorDot color={current?.activeBg} />
          {current?.label}
          {!disabled && <ChevronDown size={14} color="var(--gray-9)" />}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content size="2">
        {options.map((key) => (
          <DropdownMenu.Item key={key} onSelect={() => onChange(key)}>
            <ColorDot color={colors[key].activeBg} />
            {colors[key].label}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

PropertySelect.propTypes = {
  ariaLabel: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  colors: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
};

/** Menu « ⋯ » : actions rares de l'intervention. */
export function MoreActionsMenu({ code, onRequestPointage, onCopyCode, canDelete, deleteBlockReason, onAskDelete }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <IconButton variant="ghost" color="gray" size="1" aria-label="Plus d'actions">
          <MoreHorizontal size={16} />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content size="1" align="end">
        {onRequestPointage && (
          <DropdownMenu.Item onSelect={onRequestPointage}>
            <CalendarCheck size={14} />
            Demander le pointage
          </DropdownMenu.Item>
        )}
        {code && (
          <DropdownMenu.Item onSelect={onCopyCode}>
            <Copy size={14} />
            Copier le code
          </DropdownMenu.Item>
        )}
        {canDelete && (
          <>
            <DropdownMenu.Separator />
            <DropdownMenu.Item color="red" disabled={!!deleteBlockReason} onSelect={onAskDelete}>
              <Trash2 size={14} />
              Supprimer
            </DropdownMenu.Item>
            {deleteBlockReason && (
              <Text as="div" size="1" color="gray" style={{ padding: '0 12px 4px' }}>
                {deleteBlockReason}
              </Text>
            )}
          </>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

MoreActionsMenu.propTypes = {
  code: PropTypes.string,
  onRequestPointage: PropTypes.func,
  onCopyCode: PropTypes.func.isRequired,
  canDelete: PropTypes.bool,
  deleteBlockReason: PropTypes.string,
  onAskDelete: PropTypes.func.isRequired,
};

/** Lien d'une ligne vers la demande d'intervention liée. */
export function RequestLink({ request, onOpen }) {
  return (
    <>
      <span style={{ width: 1, height: 16, background: 'var(--gray-6)' }} />
      <Button variant="ghost" color="gray" size="2" onClick={onOpen} title="Voir la demande">
        <ClipboardList size={14} />
        <Text style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-11)' }}>{request.code}</Text>
        <Text color="gray">
          {[request.demandeurNom, formatShortDate(request.createdAt)].filter(Boolean).join(', ')}
        </Text>
      </Button>
    </>
  );
}

RequestLink.propTypes = {
  request: PropTypes.object.isRequired,
  onOpen: PropTypes.func,
};

/** Temps total et nombre d'actions, en lecture seule. */
export function WorkSummary({ stats }) {
  const hours = Number(stats?.totalTime) || 0;
  const count = stats?.actionCount || 0;
  return (
    <Text size="2" color="gray" style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
      {hours} h, {count} action{count > 1 ? 's' : ''}
    </Text>
  );
}

WorkSummary.propTypes = { stats: PropTypes.object };

/** Équipement mis en valeur, comme dans la liste : code en badge contrasté, nom lisible. */
function MachineLabel({ machine }) {
  return (
    <>
      {machine?.code && (
        <Badge variant="surface" color="gray" highContrast size="2" style={{ fontFamily: 'monospace', fontWeight: 700, flexShrink: 0 }}>
          {machine.code}
        </Badge>
      )}
      <Text size="3" weight="medium" truncate style={{ minWidth: 0, color: 'var(--gray-12)' }}>{machine?.name ?? ''}</Text>
    </>
  );
}

MachineLabel.propTypes = { machine: PropTypes.object };

/** Équipement de l'intervention ; avec un id, lien vers sa fiche (même adresse que depuis une DI). */
export function MachineHeading({ machine }) {
  if (!machine?.id) return <MachineLabel machine={machine} />;
  return (
    <Link asChild underline="hover" color="gray" highContrast style={{ minWidth: 0 }}>
      <RouterLink to={`/equipements?id=${encodeURIComponent(machine.id)}`} title="Ouvrir la fiche équipement" aria-label={`Ouvrir la fiche équipement ${machine.code ?? ''} ${machine.name ?? ''}`.trim()}>
        <Flex align="center" gap="2" style={{ minWidth: 0 }}>
          <MachineLabel machine={machine} />
          <ExternalLink size={13} style={{ flexShrink: 0, color: 'var(--gray-10)' }} aria-hidden="true" />
        </Flex>
      </RouterLink>
    </Link>
  );
}

MachineHeading.propTypes = { machine: PropTypes.object };

/** Type d'intervention en clair (Projet, Curatif...), absent si le code est inconnu. */
export function TypeBadge({ typeCode }) {
  const { types } = useInterventionTypeRefs();
  const type = types.find((t) => t.id === typeCode?.toUpperCase());
  if (!type) return null;
  return <Badge color={type.color} variant="soft" size="2">{type.title}</Badge>;
}

TypeBadge.propTypes = { typeCode: PropTypes.string };
