import PropTypes from 'prop-types';
import { Flex, Text, Badge } from '@radix-ui/themes';
import { Inbox, Wrench, Clock, Zap, ShoppingCart } from 'lucide-react';
import { TYPE_INTER_LABELS } from '@/config/interventionTypes';

const today = new Date();
today.setHours(0, 0, 0, 0);

function getDaysWaiting(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((today - new Date(dateStr)) / 86400000);
}

const BAR_COLOR = {
  request:          'var(--gray-9)',
  request_accepted: 'var(--blue-9)',
};

function agingColor(days) {
  if (days > 7) return 'var(--red-11)';
  if (days > 3) return 'var(--orange-11)';
  return 'var(--gray-11)';
}

const PRIORITY_COLOR = {
  urgent:    'var(--red-11)',
  important: 'var(--orange-11)',
  normale:   'var(--gray-11)',
  faible:    'var(--gray-9)',
};

const PRIORITY_LABEL = {
  urgent: 'urgent', important: 'important', normale: 'normal', faible: 'faible',
};

/* ── Bloc intervention liée (DI acceptée) ─────────────────────────────────── */

function InterventionRef({ iv }) {
  if (!iv) return null;

  const typeLabel = TYPE_INTER_LABELS[iv.type_inter] ?? iv.type_inter ?? '?';
  const priorityColor = PRIORITY_COLOR[iv.priority] ?? 'var(--gray-11)';
  const priorityLabel = PRIORITY_LABEL[iv.priority] ?? iv.priority;

  return (
    <div style={{
      marginTop: 6,
      padding: '6px 8px',
      borderRadius: 4,
      backgroundColor: 'var(--blue-2)',
      border: '1px solid var(--blue-4)',
    }}>
      {/* Code + type + statut */}
      <Flex align="center" gap="2" wrap="wrap" style={{ marginBottom: 4 }}>
        <Wrench size={11} color="var(--blue-9)" />
        <Text size="1" weight="bold" style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--blue-11)' }}>
          {iv.code}
        </Text>
        <Badge size="1" variant="soft" color="blue">{typeLabel}</Badge>
        {iv.status_label && (
          <Badge size="1" variant="soft"
            style={{ backgroundColor: (iv.status_color || '#888') + '22', color: iv.status_color || '#888' }}>
            {iv.status_label}
          </Badge>
        )}
        {iv.priority && iv.priority !== 'normale' && (
          <Text size="1" weight="medium" style={{ color: priorityColor }}>{priorityLabel}</Text>
        )}
      </Flex>

      {/* Stats : actions · temps · achats */}
      {iv.stats && (
        <Flex gap="3" align="center">
          {(iv.stats.action_count ?? 0) > 0 && (
            <Flex align="center" gap="1">
              <Zap size={10} color="var(--gray-9)" />
              <Text size="1" color="gray">{iv.stats.action_count} action{iv.stats.action_count > 1 ? 's' : ''}</Text>
            </Flex>
          )}
          {(iv.stats.total_time ?? 0) > 0 && (
            <Flex align="center" gap="1">
              <Clock size={10} color="var(--gray-9)" />
              <Text size="1" color="gray">{iv.stats.total_time}h</Text>
            </Flex>
          )}
          {(iv.stats.purchase_count ?? 0) > 0 && (
            <Flex align="center" gap="1">
              <ShoppingCart size={10} color="var(--gray-9)" />
              <Text size="1" color="gray">{iv.stats.purchase_count} cde{iv.stats.purchase_count > 1 ? 's' : ''}</Text>
            </Flex>
          )}
          {iv.stats.action_count === 0 && iv.stats.total_time === 0 && (
            <Text size="1" color="gray" style={{ fontStyle: 'italic' }}>aucune action enregistrée</Text>
          )}
        </Flex>
      )}

      {/* Technicien */}
      {iv.tech_initials && (
        <Text size="1" color="gray" style={{ display: 'block', marginTop: 2 }}>
          Tech : {iv.tech_initials}
        </Text>
      )}
    </div>
  );
}

InterventionRef.propTypes = {
  iv: PropTypes.shape({
    code: PropTypes.string,
    type_inter: PropTypes.string,
    priority: PropTypes.string,
    status_label: PropTypes.string,
    status_color: PropTypes.string,
    tech_initials: PropTypes.string,
    stats: PropTypes.shape({
      action_count: PropTypes.number,
      total_time: PropTypes.number,
      purchase_count: PropTypes.number,
    }),
  }),
};

/* ── Composant principal ──────────────────────────────────────────────────── */

export function DIBriefingItem({ request, sectionType }) {
  const barColor = BAR_COLOR[sectionType] ?? 'var(--gray-9)';
  const daysWaiting = getDaysWaiting(request.created_at);
  const hasLinkedIv = sectionType === 'request_accepted' && request.intervention;

  return (
    <div style={{
      display: 'flex',
      background: 'var(--color-panel-solid)',
      border: '1px solid var(--gray-4)',
      borderLeft: `3px solid ${barColor}`,
      borderRadius: 6,
      overflow: 'hidden',
    }}>
      <Flex direction="column" style={{ flex: 1, padding: '10px 12px' }} gap="1">

        {/* Ligne 1 : code DI + statut + équipement */}
        <Flex align="center" gap="2" wrap="wrap">
          <Text size="1" weight="medium" style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--gray-12)' }}>
            {request.code}
          </Text>
          {request.statut_label && (
            <Badge size="1" variant="soft"
              style={{ backgroundColor: (request.statut_color || '#888') + '22', color: request.statut_color || '#888' }}>
              {request.statut_label}
            </Badge>
          )}
          {request.equipement?.code && (
            <Badge size="1" variant="outline" color="gray">{request.equipement.code}</Badge>
          )}
        </Flex>

        {/* Ligne 2 : description */}
        <Text size="2" weight="medium"
          style={{ color: 'var(--gray-12)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {request.description}
        </Text>

        {/* Ligne 3 : demandeur · service · machine */}
        <Text size="1" color="gray">
          {request.demandeur_nom}
          {request.service?.label ? ` · ${request.service.label}` : ''}
          {request.equipement?.name ? ` · ${request.equipement.name}` : ''}
        </Text>

        {/* Bloc intervention liée — uniquement pour DI acceptées */}
        {hasLinkedIv && <InterventionRef iv={request.intervention} />}
      </Flex>

      {/* Ancienneté DI */}
      <Flex direction="column" align="center" justify="center" gap="1"
        style={{ marginLeft: 8, paddingRight: 12, flexShrink: 0 }}>
        <Inbox size={13} color="var(--gray-8)" />
        <Text size="1" weight="medium"
          style={{ color: agingColor(daysWaiting), lineHeight: 1 }}>
          {daysWaiting === 0 ? 'auj.' : `${daysWaiting}j`}
        </Text>
      </Flex>
    </div>
  );
}

DIBriefingItem.propTypes = {
  request: PropTypes.shape({
    id: PropTypes.string.isRequired,
    code: PropTypes.string,
    statut: PropTypes.string,
    statut_label: PropTypes.string,
    statut_color: PropTypes.string,
    description: PropTypes.string,
    demandeur_nom: PropTypes.string,
    created_at: PropTypes.string,
    intervention_id: PropTypes.string,
    intervention: PropTypes.object,
    equipement: PropTypes.shape({
      code: PropTypes.string,
      name: PropTypes.string,
    }),
    service: PropTypes.shape({ label: PropTypes.string }),
  }).isRequired,
  sectionType: PropTypes.oneOf(['request', 'request_accepted']).isRequired,
};
