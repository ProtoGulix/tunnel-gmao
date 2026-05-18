import PropTypes from 'prop-types';
import { Flex, Text, Badge } from '@radix-ui/themes';
import { getInterventionUrgency } from '@/hooks/useInterventionUrgency';
import { normalizeTileData, SECTION_BAR_COLOR } from './briefingTileNormalize';
import { ProgressBar } from './components/ProgressBar';

// ── Sous-composants ───────────────────────────────────────────────────────

const AVATAR_COLORS = {
  IB: 'var(--blue-9)', LP: 'var(--green-9)', CC: 'var(--amber-9)', QC: 'var(--pink-9)',
};

function Avatar({ initials }) {
  const bg = AVATAR_COLORS[(initials || '').toUpperCase()] || 'var(--gray-8)';
  return (
    <div style={{ width: 22, height: 22, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Text size="1" weight="bold" style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>
        {(initials || '?').toUpperCase()}
      </Text>
    </div>
  );
}
Avatar.propTypes = { initials: PropTypes.string };

function UrgencyChip({ urgency }) {
  if (!urgency || urgency.level === 'pending') return null;
  const { level, label, color } = urgency;
  return (
    <Text size="1" weight={level === 'overdue' || level === 'urgent' ? 'bold' : 'regular'}
      style={{ color, lineHeight: 1, whiteSpace: 'nowrap' }}>
      {label}
    </Text>
  );
}
UrgencyChip.propTypes = { urgency: PropTypes.object };

const SITUATION_BADGE = {
  no_intervention: { color: 'gray',   label: 'sans intervention' },
  no_action:       { color: 'orange', label: 'sans action'       },
  no_task:         { color: 'orange', label: 'sans tâche'        },
  blocked_piece:   { color: 'orange', label: 'pièces en attente' },
  decision:        { color: 'red',    label: 'décision requise'  },
};

function SituationBadge({ situationType }) {
  const cfg = SITUATION_BADGE[situationType];
  if (!cfg) return null;
  return <Badge color={cfg.color} variant="soft" size="1">{cfg.label}</Badge>;
}
SituationBadge.propTypes = { situationType: PropTypes.string };

function DueDateChip({ nextDueDate, reportedDate }) {
  const { label, color, level } = getInterventionUrgency(nextDueDate, reportedDate);
  return (
    <Text size="1" weight={level === 'overdue' || level === 'urgent' ? 'bold' : 'regular'}
      style={{ color, lineHeight: 1, whiteSpace: 'nowrap' }}>
      {label}
    </Text>
  );
}
DueDateChip.propTypes = { nextDueDate: PropTypes.string, reportedDate: PropTypes.string };

// ── Composant principal ───────────────────────────────────────────────────

export function BriefingTile({ item, sectionId }) {
  const barColor = SECTION_BAR_COLOR[sectionId] ?? 'var(--gray-9)';
  const d = normalizeTileData(item, sectionId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--color-panel-solid)', border: '1px solid var(--gray-4)', borderLeft: `3px solid ${barColor}`, borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* Ligne 1 : gauche=code+urgence+DI  droite=type+état */}
        <Flex justify="between" align="center" gap="2">
          <Flex align="center" gap="2" style={{ minWidth: 0, flexShrink: 1, overflow: 'hidden' }}>
            {d.machineCode && (
              <Text size="1" weight="bold" style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--gray-12)', whiteSpace: 'nowrap' }}>
                {d.machineCode}
              </Text>
            )}
            <UrgencyChip urgency={d.urgency} />
            {d.diStatutLabel && (
              <Flex align="center" gap="1" style={{ minWidth: 0, overflow: 'hidden' }}>
                <Badge size="1" variant="soft" style={{ backgroundColor: (d.diStatutColor || '#888') + '22', color: d.diStatutColor || '#888', flexShrink: 0 }}>
                  {d.diStatutLabel}
                </Badge>
                <Text size="1" style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--gray-10)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {d.diCode}
                </Text>
              </Flex>
            )}
          </Flex>
          <Flex align="center" gap="1" style={{ flexShrink: 0 }}>
            {d.typeLabel && <Badge size="1" variant="soft" color={d.typeColor}>{d.typeLabel}</Badge>}
            <SituationBadge situationType={d.situationType} />
          </Flex>
        </Flex>

        {/* Ligne 2 : titre */}
        <Text size="2" weight="medium" style={{ color: 'var(--gray-12)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {d.title ?? '—'}
        </Text>

        {/* Ligne 3 : tech · due date */}
        <Flex justify="between" align="center">
          {d.techInitials ? <Avatar initials={d.techInitials} /> : <div style={{ width: 22, height: 22 }} />}
          <DueDateChip nextDueDate={d.nextDueDate} reportedDate={d.reportedDate} />
        </Flex>
      </div>

      {d.completionPct !== null && <ProgressBar percentage={d.completionPct} height={22} />}
    </div>
  );
}

BriefingTile.propTypes = {
  item: PropTypes.object.isRequired,
  sectionId: PropTypes.string.isRequired,
};
