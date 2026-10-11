/**
 * Sous-composants de l'en-tête compact du panneau intervention (ADR 0013).
 */

import PropTypes from 'prop-types';
import { AlertDialog, Button, DropdownMenu, Flex, IconButton, Text } from '@radix-ui/themes';
import { CalendarCheck, ChevronDown, ClipboardList, Copy, MoreHorizontal, Trash2 } from 'lucide-react';

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
export function MoreActionsMenu({ code, onRequestPointage, onCopyCode, canDelete, isDeletable, onAskDelete }) {
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
            <DropdownMenu.Item color="red" disabled={!isDeletable} onSelect={onAskDelete}>
              <Trash2 size={14} />
              Supprimer
            </DropdownMenu.Item>
            {!isDeletable && (
              <Text as="div" size="1" color="gray" style={{ padding: '0 12px 4px' }}>
                Impossible : l&apos;intervention a des actions ou des achats
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
  isDeletable: PropTypes.bool,
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

/** Confirmation de suppression, ouverte depuis le menu « ⋯ ». */
export function DeleteInterventionDialog({ open, onOpenChange, code, onConfirm }) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Content maxWidth="420px">
        <AlertDialog.Title>Supprimer l&apos;intervention</AlertDialog.Title>
        <AlertDialog.Description>
          Confirmer la suppression de <strong>{code}</strong> ? Cette action est irréversible.
        </AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel><Button variant="soft" color="gray">Annuler</Button></AlertDialog.Cancel>
          <AlertDialog.Action><Button color="red" onClick={onConfirm}>Supprimer</Button></AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}

DeleteInterventionDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  code: PropTypes.string,
  onConfirm: PropTypes.func,
};
