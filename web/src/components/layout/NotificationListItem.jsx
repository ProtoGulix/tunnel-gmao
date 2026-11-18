/**
 * @fileoverview Item de notification (dropdown de la cloche) — icône par type,
 * indicateur lu/non lu, date relative, résolution de la route de destination.
 * @module components/layout/NotificationListItem
 */

import PropTypes from 'prop-types';
import { Badge, Flex, Text, Box } from '@radix-ui/themes';
import { CalendarClock, ClipboardList, Wrench, Info } from 'lucide-react';
import { getTimeAgo } from '@/lib/utils/actionUtils';
import { entityCodeUrl } from '@/components/shared/entityCodeUrl';

// Icône par type de notification. Tout type inconnu retombe sur l'icône
// générique plutôt que de casser le rendu.
const TYPE_ICONS = {
  di_a_traiter: ClipboardList,
  pointage_demande: Wrench,
  intervention_a_cloturer: Wrench,
  preventif_echeance: CalendarClock,
};

// Rendu structuré par type — met en valeur demandeur/machine plutôt que
// d'afficher `message` (texte plat, non stylisable) tel quel. `data` peut
// être absent (notification créée avant migration 027, ou type sans
// composeur dédié) : on retombe alors sur `message`.
function DiATraiterContent({ notification, isUnread }) {
  const d = notification.data;
  const baseWeight = isUnread ? 'bold' : 'regular';
  if (!d) return <Text size="2" weight={baseWeight} style={{ wordBreak: 'break-word' }}>{notification.message}</Text>;
  return (
    <Text size="2" weight={baseWeight} style={{ wordBreak: 'break-word' }}>
      <Text weight="bold">{d.demandeur_nom ?? 'Une demande'}</Text>
      {' demande une intervention'}
      {d.machine_code && (
        <>
          {' sur '}
          <Badge size="1" variant="soft" color="gray" style={{ fontFamily: 'monospace' }}>{d.machine_code}</Badge>
          {d.machine_name ? ` ${d.machine_name}` : ''}
        </>
      )}
      {d.description && (
        <Text color="gray"> — « {d.description} »</Text>
      )}
    </Text>
  );
}
DiATraiterContent.propTypes = { notification: PropTypes.object.isRequired, isUnread: PropTypes.bool };

// Libellé court du type, en tête de ligne ; le texte détaillé reste `message`
// (aucune clé de `data` n'est exigée pour les types préventif).
const TYPE_LABELS = {
  preventif_echeance: 'Préventif',
  intervention_a_cloturer: 'À clôturer',
};

const TYPE_CONTENT = {
  di_a_traiter: DiATraiterContent,
};

/**
 * Route de destination selon l'entité liée à la notification.
 * @param {Object} notification
 * @returns {string|null}
 */
export function resolveEntityPath(notification) {
  const { entity_type: entityType, entity_id: entityId } = notification;
  if (!entityId) return null;
  if (entityType === 'intervention_request') {
    return `/interventions?tab=demandes&id=${entityId}`;
  }
  if (entityType === 'intervention') {
    return entityCodeUrl('intervention', entityId);
  }
  if (entityType === 'preventive_occurrence') {
    // L'occurrence n'a pas de page propre : on suit la demande ou l'intervention liée si
    // la notification les porte, sinon on ouvre l'échéancier.
    const d = notification.data ?? {};
    if (d.intervention_id) return entityCodeUrl('intervention', d.intervention_id);
    if (d.di_id) return `/interventions?tab=demandes&id=${d.di_id}`;
    return '/preventive?view=echeancier';
  }
  return null;
}

export default function NotificationListItem({ notification, onOpen }) {
  const Icon = TYPE_ICONS[notification.type] ?? Info;
  const Content = TYPE_CONTENT[notification.type];
  const isUnread = !notification.read_at;

  return (
    <Flex
      align="start"
      gap="2"
      p="2"
      onClick={() => onOpen(notification)}
      style={{
        cursor: 'pointer',
        borderRadius: 6,
        background: isUnread ? 'var(--orange-2)' : 'transparent',
      }}
    >
      <Box
        style={{
          width: 8,
          height: 8,
          borderRadius: '999px',
          background: isUnread ? 'var(--orange-9)' : 'transparent',
          marginTop: 6,
          flexShrink: 0,
        }}
      />
      <Icon size={16} style={{ marginTop: 2, flexShrink: 0, color: 'var(--gray-10)' }} />
      <Flex direction="column" gap="1" style={{ minWidth: 0, flex: 1 }}>
        {TYPE_LABELS[notification.type] && (
          <Badge size="1" variant="soft" color={notification.type === 'preventif_echeance' ? 'orange' : 'gray'} style={{ alignSelf: 'flex-start' }}>
            {TYPE_LABELS[notification.type]}
          </Badge>
        )}
        {Content
          ? <Content notification={notification} isUnread={isUnread} />
          : (
            <Text size="2" weight={isUnread ? 'bold' : 'regular'} style={{ wordBreak: 'break-word' }}>
              {notification.message}
            </Text>
          )}
        <Text size="1" color="gray">{getTimeAgo(notification.created_at)}</Text>
      </Flex>
    </Flex>
  );
}

NotificationListItem.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string,
    entity_type: PropTypes.string,
    entity_id: PropTypes.string,
    message: PropTypes.string,
    data: PropTypes.object,
    read_at: PropTypes.string,
    created_at: PropTypes.string,
  }).isRequired,
  onOpen: PropTypes.func.isRequired,
};
