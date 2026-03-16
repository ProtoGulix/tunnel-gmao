/**
 * Composants partagés du calendrier hebdomadaire :
 * ActionItem, DayColumn, DayTotal, WeekNav
 */

import { Badge, Box, Button, Flex, Select, Text } from '@radix-ui/themes';
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  actionDurationMinutes,
  formatDayHeader,
  formatDayHeaderShort,
  formatDuration,
  formatTime,
  formatWeekLabel,
  sortActions,
} from './planningUtils';

/* ── ActionItem ───────────────────────────────────────────────────────────── */

export function ActionItem({ action, compact = false }) {
  const durationMin = actionDurationMinutes(action);
  const subcatColor = action.subcategory?.category?.color ?? '#6b7280';
  const subcatCode = action.subcategory?.code ?? action.subcategory?.name ?? '—';
  const interventionCode = action.intervention?.code ?? '—';
  const interventionId = action.intervention?.id;
  const interventionTitle = action.intervention?.title ?? null;
  const description = action.description ?? '';
  const startFmt = formatTime(action.action_start);
  const endFmt = formatTime(action.action_end);

  /* Version compacte Sam/Dim : badge + durée uniquement */
  if (compact) {
    return (
      <Box
        style={{
          background: `${subcatColor}1a`,
          borderLeft: `3px solid ${subcatColor}`,
          borderRadius: 4,
          padding: '4px 6px',
          marginBottom: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Badge size="1" style={{ background: `${subcatColor}26`, color: subcatColor, border: 'none', width: 'fit-content', fontSize: 10 }}>
          {subcatCode}
        </Badge>
        <Text size="1" weight="medium" style={{ color: subcatColor }}>{formatDuration(durationMin)}</Text>
      </Box>
    );
  }

  /* Version pleine Lun–Ven */
  return (
    <Box
      style={{
        background: `${subcatColor}1a`,
        border: '1px solid var(--gray-4)',
        borderLeft: `3px solid ${subcatColor}`,
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 6,
      }}
    >
      {/* En-tête : code intervention + titre */}
      <Box px="2" pt="2" pb="1">
        {interventionId
          ? <Link to={`/intervention/${interventionId}`}><Badge variant="soft" color="gray" size="1">{interventionCode}</Badge></Link>
          : <Badge variant="soft" color="gray" size="1">{interventionCode}</Badge>
        }
        {interventionTitle && (
          <Text size="1" style={{ display: 'block', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1a1a1a' }}>
            {interventionTitle}
          </Text>
        )}
      </Box>

      {/* Corps : badge sous-catégorie + description */}
      <Box px="2" pb="2" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Badge size="1" style={{ background: `${subcatColor}26`, color: subcatColor, border: 'none', width: 'fit-content' }}>
          {subcatCode}
        </Badge>
        {description && (
          <Text size="1" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1a1a1a' }}>
            {description.length > 60 ? description.slice(0, 60) + '…' : description}
          </Text>
        )}
      </Box>

      {/* Pied : bornes horaires + durée */}
      <Flex
        align="center"
        justify="between"
        px="2"
        py="1"
        style={{ background: `${subcatColor}0d`, borderTop: `1px solid ${subcatColor}30` }}
      >
        <Flex align="center" gap="1">
          <Clock size={11} color="var(--gray-9)" />
          {startFmt
            ? <Text size="1" color="gray">{startFmt}{endFmt ? ` – ${endFmt}` : ''}</Text>
            : <Text size="1" color="gray">—</Text>
          }
        </Flex>
        <Text size="1" weight="medium" style={{ color: subcatColor }}>{formatDuration(durationMin)}</Text>
      </Flex>
    </Box>
  );
}

/* ── DayTotal ─────────────────────────────────────────────────────────────── */

const TARGET_MINUTES = 7.5 * 60;

export function DayTotal({ actions, compact = false }) {
  const total = actions.reduce((sum, a) => sum + actionDurationMinutes(a), 0);

  if (compact) {
    if (total === 0) return null;
    return (
      <Flex align="center" pt="1">
        <Text size="1" weight="bold" color="gray">{formatDuration(total)}</Text>
      </Flex>
    );
  }

  const color = total >= TARGET_MINUTES ? 'green' : total >= 5 * 60 ? 'orange' : 'red';
  return (
    <Flex align="center" gap="1" pt="2">
      <Clock size={12} />
      <Text size="1" color={color} weight="bold">{formatDuration(total)}</Text>
      <Text size="1" color="gray">/ 7h30</Text>
    </Flex>
  );
}

/* ── DayColumn ────────────────────────────────────────────────────────────── */

export function DayColumn({ dateStr, actions, isToday, onAddAction, isWeekend = false }) {
  const sorted = sortActions(actions);

  return (
    <Box style={{ minWidth: 0 }}>
      {/* Date */}
      <Text
        size="1"
        weight="bold"
        px="1"
        style={{ display: 'block', textTransform: 'capitalize', color: isToday ? 'var(--blue-11)' : 'var(--gray-11)' }}
      >
        {isWeekend ? formatDayHeaderShort(dateStr) : formatDayHeader(dateStr)}
      </Text>

      {/* Séparateur */}
      <Box mb="1" style={{ borderBottom: `2px solid ${isToday ? 'var(--blue-8)' : 'var(--gray-5)'}` }} />

      {/* Bouton ajout — masqué Sam/Dim */}
      {!isWeekend && (
        <Button size="1" variant="soft" color="blue" mb="2" style={{ width: '100%' }} onClick={() => onAddAction(dateStr)}>
          <Plus size={12} /> Ajouter
        </Button>
      )}

      {/* Actions ou empty state */}
      {sorted.length === 0 ? (
        <Flex align="center" justify="center" py="3" style={{ background: '#f8f9fa', borderRadius: 4 }}>
          <Text size="1" style={{ color: '#c0c0c0' }}>Aucune action</Text>
        </Flex>
      ) : (
        sorted.map((a) => <ActionItem key={a.id} action={a} compact={isWeekend} />)
      )}

      {/* Total */}
      {sorted.length > 0 && <DayTotal actions={sorted} compact={isWeekend} />}
    </Box>
  );
}

/* ── WeekNav ──────────────────────────────────────────────────────────────── */

export function WeekNav({ monday, onPrev, onNext, onToday, techId, users, onTechChange }) {
  return (
    <Flex align="center" gap="3" wrap="wrap">
      <Flex align="center" gap="1">
        <Button size="1" variant="soft" color="gray" onClick={onPrev}>
          <ChevronLeft size={14} />
        </Button>
        <Text size="2" weight="medium" style={{ minWidth: 200, textAlign: 'center' }}>
          {formatWeekLabel(monday)}
        </Text>
        <Button size="1" variant="soft" color="gray" onClick={onNext}>
          <ChevronRight size={14} />
        </Button>
        <Button size="1" variant="ghost" color="blue" onClick={onToday}>
          Aujourd&apos;hui
        </Button>
      </Flex>

      {users && onTechChange && (
        <Select.Root value={techId ?? '__all__'} onValueChange={(v) => onTechChange(v === '__all__' ? null : v)}>
          <Select.Trigger placeholder="Technicien…" />
          <Select.Content>
            <Select.Item value="__all__">Tous les techniciens</Select.Item>
            {users.map((u) => (
              <Select.Item key={u.id} value={u.id}>
                {u.first_name} {u.last_name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      )}
    </Flex>
  );
}
