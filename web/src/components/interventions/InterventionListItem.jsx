/**
 * @fileoverview Ligne de la liste maître des interventions : titre d'abord,
 * puis équipement, type, technicien et code sur une ligne discrète.
 * @module components/interventions/InterventionListItem
 */

import PropTypes from 'prop-types';
import { Badge, Box, Flex, Text } from '@radix-ui/themes';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/config/interventionTypes';
import { getInterventionUrgency, formatDueDate } from '@/hooks/useInterventionUrgency';
import { ROW_PADDING_X, ROW_MIN_HEIGHT } from '@/styles/tokens/density';

/* Un peu plus aéré que la densité partagée : deux lignes de lecture par intervention */
const ROW_PADDING_Y = '10px';

/* Statuts déjà portés par le titre du groupe : inutile de les répéter sur chaque ligne */
const IMPLICIT_STATUSES = new Set(['ouvert', 'ferme']);

/* Même format de date que la liste des demandes d'intervention */
const formatReportedDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

const ELLIPSIS = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

/* ── Couleur et libellé du liseré gauche selon bloc ────────────────────── */
function getBlockMarker(interv) {
  const status = interv.status?.toLowerCase();
  if (interv.isLocked !== false) return { color: 'var(--gray-6)', label: STATUS_CONFIG[status]?.label };
  if (status === 'attente_pieces' || status === 'attente_prod') {
    return { color: 'var(--amber-9)', label: STATUS_CONFIG[status]?.label };
  }
  const cfg = PRIORITY_CONFIG[interv.priority?.toLowerCase()] ?? PRIORITY_CONFIG.normal;
  return { color: `var(--${cfg.color}-9)`, label: `Priorité : ${cfg.label}` };
}

/* Badges de droite de la ligne 1 : statut s'il apporte une information, échéance si encore ouverte */
function getTitleBadges(interv) {
  const status = interv.status?.toLowerCase();
  const badges = [];
  if (status && !IMPLICIT_STATUSES.has(status)) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.ouvert;
    badges.push({ key: 'status', label: cfg.label, color: cfg.color, variant: 'soft' });
  }
  if (interv.next_due_date && interv.isLocked === false) {
    const { level } = getInterventionUrgency(interv.next_due_date, interv.reportedDate);
    const color = level === 'overdue' ? 'red' : level === 'urgent' ? 'orange' : 'gray';
    const variant = level === 'overdue' ? 'solid' : 'soft';
    badges.push({ key: 'due', label: formatDueDate(interv.next_due_date), color, variant });
  }
  return badges;
}

/* ── Ligne 1 : titre, puis statut utile et échéance à droite ───────────── */
function InterventionTitleRow({ interv }) {
  return (
    <Flex align="center" gap="2">
      <Text size="2" weight="bold" style={{ ...ELLIPSIS, flex: 1, minWidth: 0 }}>
        {interv.title || 'Sans titre'}
      </Text>
      {getTitleBadges(interv).map((b) => (
        <Badge key={b.key} size="1" color={b.color} variant={b.variant} style={{ flexShrink: 0 }}>
          {b.label}
        </Badge>
      ))}
    </Flex>
  );
}
InterventionTitleRow.propTypes = { interv: PropTypes.object.isRequired };

/* ── Ligne 2 : équipement mis en valeur à gauche, date de signalement à droite ── */
function InterventionMetaRow({ interv }) {
  const { code: machineCode, name: machineName } = interv.machine ?? {};

  return (
    <Flex align="center" gap="2" style={{ marginTop: 6 }}>
      <Flex align="center" gap="2" style={{ flex: 1, minWidth: 0 }}>
        {machineCode && (
          <Badge size="1" color="gray" variant="surface" highContrast style={{ fontFamily: 'monospace', fontWeight: 700, flexShrink: 0 }}>
            {machineCode}
          </Badge>
        )}
        <Text size="2" weight="medium" style={{ ...ELLIPSIS, color: 'var(--gray-12)' }}>{machineName}</Text>
      </Flex>
      <Text size="1" color="gray" style={{ flexShrink: 0 }}>
        {formatReportedDate(interv.reportedDate)}
      </Text>
    </Flex>
  );
}
InterventionMetaRow.propTypes = { interv: PropTypes.object.isRequired };

/* ── Item de la liste maître ────────────────────────────────────────────── */
export default function InterventionListItem({ interv, isSelected, onClick }) {
  const marker = getBlockMarker(interv);

  return (
    <Box
      onClick={onClick}
      title={marker.label}
      style={{
        cursor: 'pointer',
        padding: `${ROW_PADDING_Y} ${ROW_PADDING_X}`,
        minHeight: ROW_MIN_HEIGHT,
        boxSizing: 'border-box',
        borderBottom: '1px solid var(--gray-4)',
        background: isSelected ? 'var(--blue-2)' : 'transparent',
        borderLeft: isSelected ? '3px solid var(--blue-9)' : `3px solid ${marker.color}`,
      }}
    >
      <InterventionTitleRow interv={interv} />
      <InterventionMetaRow interv={interv} />
    </Box>
  );
}
InterventionListItem.propTypes = {
  interv: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  onClick: PropTypes.func,
};
