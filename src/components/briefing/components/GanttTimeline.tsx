import { useMemo, type CSSProperties } from 'react';
import { Text } from '@radix-ui/themes';
import type { InterventionTask, InterventionAction } from '@/types/briefing';

export interface GanttTimelineProps {
  task: InterventionTask;
  actions: InterventionAction[];
  auditLogs?: any[];
  reportedDate: string | null;
  blockedFrom?: Date | null;
  blockedTo?: Date | null;
  // hover contrôlé depuis le parent
  hoveredActionId?: string | null;
  hoveredLogId?: string | null;
  onHoverAction?: (id: string | null) => void;
  onHoverLog?: (id: string | null) => void;
}

interface EnrichedAction extends InterventionAction {
  day: number;
  num: number;
}

interface EnrichedLog {
  id: string;
  day: number;
  decision_type: string;
  reason?: { color: string; label: string } | null;
  logged_at?: string;
  changed_by?: { initials?: string; first_name?: string };
}

function toDay(dateStr: string | Date | null | undefined, refDate: Date): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - refDate.getTime()) / 86400000);
}

function pct(day: number, axisEnd: number): string {
  if (axisEnd === 0) return '0%';
  return `${Math.max(0, Math.min(100, Math.round((day / axisEnd) * 100)))}%`;
}

function buildTicks(axisEnd: number, refDate: Date, extraDays: number[] = []): { day: number; label: string }[] {
  if (axisEnd <= 0) return [];
  const step = axisEnd <= 14 ? 2 : axisEnd <= 30 ? 7 : axisEnd <= 90 ? 14 : 30;
  const daySet = new Set<number>([0]);
  for (let d = step; d < axisEnd; d += step) daySet.add(d);
  for (const d of extraDays) if (d >= 0 && d <= axisEnd) daySet.add(d);
  return [...daySet].sort((a, b) => a - b).map((d) => {
    const dt = new Date(refDate);
    dt.setDate(dt.getDate() + d);
    return { day: d, label: dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) };
  });
}

const DECISION_LABELS: Record<string, string> = {
  status_actual_changed: 'Statut modifié',
  priority_changed:      'Priorité modifiée',
  assigned_to_changed:   'Technicien modifié',
  due_date_changed:      'Échéance modifiée',
  status_changed:        'Statut modifié',
  created:               'Créé',
  deleted:               'Supprimé',
  sort_order_changed:    'Ordre modifié',
};

// Hauteurs des deux rails
const ACTIONS_RAIL_H = 36; // au-dessus de l'axe
const LOGS_RAIL_H    = 28; // en-dessous de l'axe
const LABEL_HEIGHT   = 18;
const AXIS_H         = 1.5;
const TIMELINE_HEIGHT = ACTIONS_RAIL_H + AXIS_H + LOGS_RAIL_H;

export function GanttTimeline({
  task, actions, auditLogs = [], reportedDate,
  blockedFrom, blockedTo,
  hoveredActionId, hoveredLogId,
  onHoverAction, onHoverLog,
}: GanttTimelineProps) {

  const ref = useMemo(() => {
    if (!reportedDate) return null;
    const d = new Date(reportedDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [reportedDate]);

  const taskActions = useMemo<EnrichedAction[]>(() => {
    if (!ref) return [];
    return actions
      .filter((a) => {
        const linkedId = a.task?.id ?? null;
        return linkedId !== null && String(linkedId) === String(task.id);
      })
      .map((a) => ({ ...a, day: toDay(a.date, ref) ?? 0 }))
      .filter((a) => a.day >= 0)
      .sort((a, b) => a.day - b.day)
      .map((a, i) => ({ ...a, num: i + 1 }));
  }, [actions, task.id, ref]);

  const taskLogs = useMemo<EnrichedLog[]>(() => {
    if (!ref) return [];
    return (auditLogs ?? [])
      .filter((l: any) => String(l.entity_id) === String(task.id))
      .filter((l: any) => !l.is_system || l.decision_type !== 'sort_order_changed')
      .map((l: any) => ({ ...l, day: toDay(l.logged_at, ref) ?? 0 }))
      .filter((l: any) => l.day >= 0)
      .sort((a: any, b: any) => a.day - b.day);
  }, [auditLogs, task.id, ref]);

  if (!ref) return null;

  /* ── Calculs de positionnement ── */
  const dueDay   = task.due_date ? toDay(task.due_date, ref) : null;
  const blkStart = blockedFrom ? toDay(blockedFrom, ref) : null;
  const blkEnd   = blockedTo   ? toDay(blockedTo, ref)   : null;
  const todayDay = toDay(new Date(), ref) ?? 0;

  const maxActionDay = Math.max(...taskActions.map((a) => a.day), ...taskLogs.map((l) => l.day), 1);
  const dueDayOverdue = dueDay !== null && dueDay < todayDay ? todayDay : null;
  const axisEnd = Math.max(maxActionDay, dueDay ?? 0, dueDayOverdue ?? 0, todayDay)
    + Math.max(Math.ceil(maxActionDay * 0.15), 3);

  const first = taskActions[0];
  const last  = taskActions[taskActions.length - 1];
  const hasMultiple = taskActions.length > 1;
  const firstPctNum = first ? Math.round((first.day / axisEnd) * 100) : 0;
  const lastPctNum  = hasMultiple ? Math.round((last.day / axisEnd) * 100) : firstPctNum;

  const isDueOverdue  = dueDay !== null && dueDay < todayDay;
  const isDueFuture   = dueDay !== null && dueDay > todayDay;
  const daysUntilDue  = isDueFuture ? dueDay! - todayDay : null;
  const daysOverdue   = isDueOverdue ? todayDay - dueDay! : null;

  // today est toujours dans les ticks (si dans l'axe)
  const extraTickDays: number[] = [
    ...(todayDay >= 0 && todayDay <= axisEnd ? [todayDay] : []),
    ...(isDueOverdue && dueDay !== null ? [dueDay] : []),
  ];
  const ticks = buildTicks(axisEnd, ref, extraTickDays);

  // Y de l'axe dans le wrapper (depuis le top)
  const axisY = LABEL_HEIGHT + ACTIONS_RAIL_H;
  const totalHeight = LABEL_HEIGHT + TIMELINE_HEIGHT;

  const wrapStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    height: totalHeight,
    minWidth: 200,
  };

  return (
    <div
      style={{ padding: '2px 0 6px', overflowX: 'auto' }}
      aria-label={`Frise Gantt de la tâche ${task.label}`}
    >
      <div style={wrapStyle}>

        {/* ── Labels de dates ── */}
        {ticks.map(({ day, label }) => {
          const isToday    = day === todayDay;
          const isDueDay   = day === dueDay;
          return (
            <div key={day} style={{
              position: 'absolute', left: pct(day, axisEnd), top: 0,
              height: LABEL_HEIGHT, transform: 'translateX(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              pointerEvents: 'none',
            }}>
              <Text size="1" style={{
                fontSize: 9,
                color: isDueOverdue && isDueDay
                  ? 'var(--red-10)'
                  : isToday
                    ? 'var(--blue-10)'
                    : isDueFuture && isDueDay
                      ? 'var(--orange-10)'
                      : 'var(--gray-8)',
                fontFamily: 'monospace', whiteSpace: 'nowrap',
                fontWeight: (isToday || isDueDay) ? 700 : 400,
              }}>
                {isToday ? `auj.` : label}
              </Text>
            </div>
          );
        })}

        {/* ── Tick marks ── */}
        {ticks.map(({ day }) => (
          <div key={`tick-${day}`} style={{
            position: 'absolute', left: pct(day, axisEnd),
            top: LABEL_HEIGHT, width: 1, height: TIMELINE_HEIGHT,
            background: day === todayDay
              ? 'var(--blue-4)'
              : isDueOverdue && day === dueDay
                ? 'var(--red-4)'
                : isDueFuture && day === dueDay
                  ? 'var(--orange-4)'
                  : 'var(--gray-3)',
            transform: 'translateX(-50%)', pointerEvents: 'none',
          }} />
        ))}

        {/* ── Zone inaction (J0 → 1ère action) ── */}
        {first && first.day > 0 && (
          <div title={`Inaction : J0 → J+${first.day}`} style={{
            position: 'absolute', left: '0%', width: pct(first.day, axisEnd),
            top: LABEL_HEIGHT, height: TIMELINE_HEIGHT,
            background: 'rgba(120,120,120,0.07)',
            borderRight: '1px dashed var(--gray-5)',
          }} />
        )}

        {/* ── Zone blocage ── */}
        {blkStart !== null && blkEnd !== null && blkStart >= 0 && (
          <div title={`Blocage : J+${blkStart} → J+${blkEnd}`} style={{
            position: 'absolute',
            left: pct(blkStart, axisEnd),
            width: `${Math.max(0, Math.min(100, Math.round(((blkEnd - blkStart) / axisEnd) * 100)))}%`,
            top: LABEL_HEIGHT, height: TIMELINE_HEIGHT,
            background: 'rgba(220,38,38,0.10)',
            borderLeft: '1.5px solid var(--red-7)', borderRight: '1.5px solid var(--red-7)',
          }}>
            <Text size="1" style={{
              position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
              fontSize: 8, color: 'var(--red-10)', fontFamily: 'monospace',
              whiteSpace: 'nowrap', fontWeight: 700,
            }}>ATTENTE</Text>
          </div>
        )}

        {/* ── Zone jours restants (aujourd'hui → due_date) ── */}
        {isDueFuture && dueDay !== null && todayDay >= 0 && (
          <div
            title={`${daysUntilDue} jour${daysUntilDue! > 1 ? 's' : ''} avant l'échéance`}
            style={{
              position: 'absolute',
              left: pct(todayDay, axisEnd),
              width: `${Math.max(0, Math.round(((dueDay - todayDay) / axisEnd) * 100))}%`,
              top: LABEL_HEIGHT, height: TIMELINE_HEIGHT,
              background: 'rgba(234,179,8,0.08)',
              borderLeft: '1.5px solid var(--orange-6)',
              borderRight: '1.5px solid var(--orange-6)',
              zIndex: 1,
            }}
          >
            <Text size="1" style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 8, color: 'var(--orange-10)', fontFamily: 'monospace',
              fontWeight: 700, whiteSpace: 'nowrap', pointerEvents: 'none',
            }}>
              {daysUntilDue}j
            </Text>
          </div>
        )}

        {/* ── Zone retard ── */}
        {isDueOverdue && dueDay !== null && dueDay >= 0 && (
          <div
            title={`En retard depuis le ${new Date(task.due_date!).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`}
            style={{
              position: 'absolute',
              left: pct(dueDay, axisEnd),
              width: `${Math.max(0, Math.round(((todayDay - dueDay) / axisEnd) * 100))}%`,
              top: LABEL_HEIGHT, height: TIMELINE_HEIGHT,
              background: 'rgba(220,38,38,0.11)',
              borderLeft: '2px solid var(--red-8)', zIndex: 1,
            }}
          >
            <Text size="1" style={{
              position: 'absolute', bottom: 4, left: 6,
              fontSize: 8, color: 'var(--red-10)', fontFamily: 'monospace',
              fontWeight: 700, whiteSpace: 'nowrap',
            }}>EN RETARD</Text>
          </div>
        )}

        {/* ── Axe horizontal ── */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: axisY,
          height: AXIS_H, background: 'var(--gray-5)', pointerEvents: 'none',
        }} />

        {/* ── Bandes diagonales ── */}
        {hasMultiple && (
          <div aria-hidden="true" style={{
            position: 'absolute',
            left: `${firstPctNum}%`,
            width: `${lastPctNum - firstPctNum}%`,
            top: axisY - 10, height: 20,
            background: 'repeating-linear-gradient(45deg, var(--blue-6) 0px, var(--blue-6) 2px, transparent 2px, transparent 8px)',
            opacity: 0.55, borderRadius: 2, pointerEvents: 'none',
          }} />
        )}

        {/* ── Trait échéance ── */}
        {dueDay !== null && dueDay >= 0 && dueDay <= axisEnd && (
          <div
            title={`Échéance : ${new Date(task.due_date!).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}${isDueOverdue ? ' — EN RETARD' : ''}`}
            style={{
              position: 'absolute',
              left: pct(dueDay, axisEnd),
              top: LABEL_HEIGHT + 4, height: TIMELINE_HEIGHT - 8, width: 2,
              background: isDueOverdue ? 'var(--red-9)' : 'var(--orange-9)',
              transform: 'translateX(-50%)', zIndex: 4, borderRadius: 1,
              boxShadow: isDueOverdue ? '0 0 0 2px var(--red-4)' : 'none',
            }}
          />
        )}

        {/* ── Trait "aujourd'hui" — toujours visible si dans l'axe ── */}
        {todayDay >= 0 && todayDay <= axisEnd && (
          <div title="Aujourd'hui" style={{
            position: 'absolute', left: pct(todayDay, axisEnd),
            top: LABEL_HEIGHT + 2, height: TIMELINE_HEIGHT - 4, width: 2,
            background: 'var(--blue-8)', transform: 'translateX(-50%)',
            zIndex: 5, borderRadius: 1, opacity: 0.7,
          }} />
        )}

        {/* ══ ACTIONS — rail au-dessus de l'axe ══ */}
        {taskActions.map((a, idx) => {
          const isFirstA  = idx === 0;
          const isLastA   = idx === taskActions.length - 1 && hasMultiple;
          const isFlag    = isFirstA || isLastA;
          const hasDa     = a.purchaseRequests?.length > 0;
          const isHovered = hoveredActionId === a.id;

          const baseColor = isLastA
            ? (task.status === 'done' ? 'var(--green-9)' : 'var(--blue-8)')
            : hasDa ? 'var(--orange-9)' : (a.subcategory?.category?.color ?? 'var(--blue-9)');

          const size   = isFlag ? 20 : 12;
          const top    = axisY - size / 2;
          const scale  = isHovered ? (isFlag ? 1.3 : 1.5) : 1;

          const tooltip = [
            `#${a.num}`,
            `J+${a.day}`,
            a.subcategory?.code ?? null,
            a.timeSpent ? `${a.timeSpent}h` : null,
            hasDa ? 'DA' : null,
          ].filter(Boolean).join(' · ');

          return (
            <div
              key={a.id}
              onMouseEnter={() => onHoverAction?.(a.id)}
              onMouseLeave={() => onHoverAction?.(null)}
              title={tooltip}
              aria-label={`Action ${a.num} J+${a.day}`}
              style={{
                position: 'absolute',
                left: pct(a.day, axisEnd),
                top,
                transform: `translateX(-50%) scale(${scale})`,
                transformOrigin: 'center center',
                width: size, height: size,
                borderRadius: '50%',
                background: baseColor,
                border: `${isFlag ? 2.5 : 2}px solid var(--color-panel-solid)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: isHovered ? 10 : (isFlag ? 5 : 4),
                fontSize: 10,
                cursor: 'default',
                boxShadow: isHovered
                  ? `0 0 0 3px ${baseColor}66, 0 2px 8px rgba(0,0,0,0.15)`
                  : isFlag ? `0 0 0 1.5px ${baseColor}` : 'none',
                transition: 'transform 0.12s ease, box-shadow 0.12s ease',
              }}
            >
              {isFlag && (isFirstA ? '⌚' : '✓')}
            </div>
          );
        })}

        {/* ══ LOGS AUDIT — rail en-dessous de l'axe ══ */}
        {taskLogs.map((l) => {
          const color     = l.reason?.color ?? 'var(--gray-7)';
          const isHovered = hoveredLogId === l.id;
          const label     = DECISION_LABELS[l.decision_type] ?? l.decision_type;
          const who       = l.changed_by?.initials ?? l.changed_by?.first_name ?? '?';
          const size      = 10;
          // losange centré sous l'axe
          const top       = axisY + AXIS_H + LOGS_RAIL_H / 2 - size / 2;

          return (
            <div
              key={l.id}
              onMouseEnter={() => onHoverLog?.(l.id)}
              onMouseLeave={() => onHoverLog?.(null)}
              title={`J+${l.day} · ${label}${l.reason ? ' · ' + l.reason.label : ''} · ${who}`}
              aria-label={`Log ${label} J+${l.day}`}
              style={{
                position: 'absolute',
                left: pct(l.day, axisEnd),
                top,
                transform: `translateX(-50%) rotate(45deg) scale(${isHovered ? 1.5 : 1})`,
                transformOrigin: 'center center',
                width: size, height: size,
                background: color,
                border: `1.5px solid var(--color-panel-solid)`,
                zIndex: isHovered ? 10 : 3,
                cursor: 'default',
                boxShadow: isHovered ? `0 0 0 3px ${color}55, 0 2px 6px rgba(0,0,0,0.12)` : 'none',
                transition: 'transform 0.12s ease, box-shadow 0.12s ease',
              }}
            />
          );
        })}

      </div>
    </div>
  );
}
