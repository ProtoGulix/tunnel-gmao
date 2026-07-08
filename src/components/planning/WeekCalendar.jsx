/**
 * Composants partagés du calendrier hebdomadaire :
 * ActionItem, DayColumn, DayTotal, WeekNav
 */

import { Badge, Box, Button, Flex, Select, Text } from '@radix-ui/themes';
import { Check, CheckCircle2, ChevronLeft, ChevronRight, Clock, MinusCircle, Package, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import PropTypes from 'prop-types';
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
import { STATUS_CONFIG } from '@/config/interventionTypes';
import { canDeleteAction } from '@/lib/utils/actionUtils';

/* ── ActionDeleteControl ──────────────────────────────────────────────────── */

/** Bouton de suppression d'action + confirmation inline, isolé pour garder ActionItem simple */
function ActionDeleteControl({ action, onDeleteAction }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!onDeleteAction) return null;

  const deleteDisabledReason = canDeleteAction(action)
    ? null
    : "Suppression impossible : une demande d'achat liée a déjà été dispatchée";

  const handleConfirm = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    try {
      await onDeleteAction(action);
    } catch {
      // Erreur déjà affichée par le parent (PlanningPane)
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <Flex align="center" gap="1" style={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
        <Button size="1" variant="solid" color="red" disabled={deleting} onClick={handleConfirm}>
          {deleting ? '...' : <Check size={12} />}
        </Button>
        <Button size="1" variant="soft" color="gray" disabled={deleting} onClick={() => setConfirming(false)}>
          <X size={12} />
        </Button>
      </Flex>
    );
  }

  return (
    <Button
      size="1" variant="soft" color="red" style={{ flexShrink: 0, opacity: deleteDisabledReason ? 0.4 : 1 }}
      title={deleteDisabledReason || 'Supprimer cette action'}
      disabled={!!deleteDisabledReason}
      onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
    >
      <Trash2 size={12} />
    </Button>
  );
}

ActionDeleteControl.propTypes = {
  action: PropTypes.object.isRequired,
  onDeleteAction: PropTypes.func,
};

/* ── ActionItem ───────────────────────────────────────────────────────────── */

export function ActionItem({ action, compact = false, inline = false, onAddPurchaseRequest, onDeleteAction, hideInterventionHeader = false }) {
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

  /* Version inline (home planning) */
  if (inline) {
    const statusCfg = STATUS_CONFIG[action.intervention?.status_actual] ?? null;

    return (
      <Box
        style={{
          background: `${subcatColor}0e`,
          borderLeft: `4px solid ${subcatColor}`,
          borderRadius: 6,
          marginBottom: 8,
          overflow: 'hidden',
        }}
      >
        {/* ── En-tête : code · titre · statut · bouton achat ── */}
        {!hideInterventionHeader && <Flex align="center" gap="2" style={{ padding: '8px 10px 6px', borderBottom: '1px solid var(--gray-4)' }}>
          {interventionId
            ? <Link to={`/intervention/${interventionId}`} onClick={(e) => e.stopPropagation()} style={{ textDecoration: 'none', flexShrink: 0 }}>
                <Badge variant="outline" color="gray" size="2" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>{interventionCode}</Badge>
              </Link>
            : <Badge variant="outline" color="gray" size="2" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{interventionCode}</Badge>
          }
          {interventionTitle && (
            <Text size="2" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--gray-11)', fontStyle: 'italic' }}>
              {interventionTitle}
            </Text>
          )}
          {statusCfg && (
            <Badge size="1" color={statusCfg.color} variant="soft" style={{ flexShrink: 0 }}>
              {statusCfg.label}
            </Badge>
          )}
          {onAddPurchaseRequest && (
            <Button size="1" variant="soft" color="orange" style={{ flexShrink: 0 }}
              onClick={(e) => { e.stopPropagation(); onAddPurchaseRequest(action); }}>
              <ShoppingCart size={12} />
            </Button>
          )}
          <ActionDeleteControl action={action} onDeleteAction={onDeleteAction} />
        </Flex>}

        {/* ── Corps : sous-catégorie · horaires · description ── */}
        <Box style={{ padding: '6px 10px 8px' }}>
          <Flex align="center" gap="2" mb={description ? '2' : '0'}>
            <Badge size="1" style={{ background: `${subcatColor}26`, color: subcatColor, border: 'none' }}>
              {subcatCode}
            </Badge>
            <Text size="2" color="gray" style={{ marginLeft: 'auto', flexShrink: 0 }}>
              {startFmt ? `${startFmt}–${endFmt ?? '?'} · ` : ''}<strong>{formatDuration(durationMin)}</strong>
            </Text>
          </Flex>

          {description && (
            <Text size="2" style={{ display: 'block', color: 'var(--gray-11)', lineHeight: '1.4', fontStyle: 'italic' }}>
              {description}
            </Text>
          )}

          {/* Tâches liées */}
          {action.tasks?.length > 0 && (
            <Flex direction="column" gap="1" mt="2" style={{ borderTop: `1px solid ${subcatColor}20`, paddingTop: 6 }}>
              {action.tasks.map((t) => (
                <Flex key={t.id} align="center" gap="2">
                  {t.status === 'skipped'
                    ? <MinusCircle size={12} color="var(--orange-9)" style={{ flexShrink: 0 }} />
                    : <CheckCircle2 size={12} color="var(--green-9)" style={{ flexShrink: 0 }} />
                  }
                  <Text size="2" color="gray" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.label}
                  </Text>
                </Flex>
              ))}
            </Flex>
          )}

          {/* Demandes d'achat liées */}
          {action.purchase_requests?.length > 0 && (
            <Flex direction="column" gap="1" mt="2" style={{ borderTop: '1px solid var(--orange-4)', paddingTop: 6 }}>
              {action.purchase_requests.map((pr) => (
                <Flex key={pr.id} align="center" gap="2">
                  <Package size={12} color="var(--orange-9)" style={{ flexShrink: 0 }} />
                  <Text size="2" color="gray" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pr.item_label}
                  </Text>
                  {pr.derived_status && (
                    <Badge size="1" variant="soft" style={{ background: `${pr.derived_status.color}22`, color: pr.derived_status.color, border: 'none', flexShrink: 0 }}>
                      {pr.derived_status.label}
                    </Badge>
                  )}
                </Flex>
              ))}
            </Flex>
          )}
        </Box>
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
      <Clock size={13} />
      <Text size="2" color={color} weight="bold">{formatDuration(total)}</Text>
      <Text size="2" color="gray">/ 7h30</Text>
    </Flex>
  );
}

/* ── DayColumn ────────────────────────────────────────────────────────────── */

export function DayColumn({ dateStr, actions, isToday, onAddAction, onAddPurchaseRequest, onDeleteAction, isWeekend = false, inlineActions = false }) {
  const sorted = sortActions(actions);

  return (
    <Box style={{ minWidth: 0 }}>
      {/* Date */}
      <Text
        size="3"
        weight="bold"
        style={{ display: 'block', textTransform: 'capitalize', color: isToday ? 'var(--blue-11)' : 'var(--gray-11)', marginBottom: 4 }}
      >
        {isWeekend ? formatDayHeaderShort(dateStr) : formatDayHeader(dateStr)}
      </Text>

      {/* Séparateur */}
      <Box mb="2" style={{ borderBottom: `2px solid ${isToday ? 'var(--blue-8)' : 'var(--gray-5)'}` }} />

      {/* Bouton ajout — masqué Sam/Dim */}
      {!isWeekend && (
        <Button size="2" variant="soft" color="blue" mb="3" style={{ width: '100%' }} onClick={() => onAddAction(dateStr)}>
          <Plus size={14} /> Ajouter
        </Button>
      )}

      {/* Actions ou empty state */}
      {sorted.length === 0 ? (
        <Flex align="center" justify="center" py="4" style={{ background: 'var(--gray-2)', borderRadius: 6 }}>
          <Text size="2" color="gray">Aucune action</Text>
        </Flex>
      ) : (
        sorted.map((a) => (
          <ActionItem
            key={a.id}
            action={a}
            compact={isWeekend}
            inline={inlineActions && !isWeekend}
            onAddPurchaseRequest={onAddPurchaseRequest}
            onDeleteAction={onDeleteAction}
          />
        ))
      )}

      {/* Total */}
      {sorted.length > 0 && <DayTotal actions={sorted} compact={isWeekend} />}
    </Box>
  );
}

/* ── WeekNav ──────────────────────────────────────────────────────────────── */

export function WeekNav({ monday, onPrev, onNext, onToday, techId, users, onTechChange }) {
  const userList = Array.isArray(users) ? users : [];

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

      {onTechChange && (
        <Select.Root value={techId ?? '__all__'} onValueChange={(v) => onTechChange(v === '__all__' ? null : v)}>
          <Select.Trigger placeholder="Technicien…" />
          <Select.Content>
            <Select.Item value="__all__">Tous les techniciens</Select.Item>
            {userList.map((u) => (
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
