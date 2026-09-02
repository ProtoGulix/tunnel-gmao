/**
 * @fileoverview Résumé compact des demandes d'intervention classiques —
 * remplace le kanban (volume trop important pour ce format, cf. 31 "Nouvelle"
 * + 24 "Acceptée" observés). Compteurs par statut (pattern BriefingCounters),
 * mise en avant des DI non traitées depuis longtemps (signal fiable :
 * created_at — le porteur n'est jamais renseigné sur les DI standard, donc
 * pas utilisé ici), et lien vers la liste complète existante.
 * @module pages/home/StandardRequestsSummary
 */

import PropTypes from 'prop-types';
import { Badge, Card, Flex, Text } from '@radix-ui/themes';
import { ArrowRight, AlertTriangle } from 'lucide-react';

// Statuts considérés "non traités" : au-delà de ce seuil sans avancer,
// une DI mérite l'attention de la direction technique.
const STALE_STATUSES = new Set(['nouvelle', 'en_attente']);
const STALE_THRESHOLD_DAYS = 30;

function daysSince(iso) {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function countByStatus(items) {
  const counts = new Map();
  for (const r of items) {
    counts.set(r.statut, (counts.get(r.statut) || 0) + 1);
  }
  return counts;
}

export default function StandardRequestsSummary({ items, statuses }) {
  const counts = countByStatus(items);
  const staleItems = items
    .filter((r) => STALE_STATUSES.has(r.statut) && daysSince(r.created_at) >= STALE_THRESHOLD_DAYS)
    .sort((a, b) => daysSince(b.created_at) - daysSince(a.created_at));

  return (
    <Card size="2">
      <Flex direction="column" gap="3">
        <Flex gap="2" wrap="wrap">
          {statuses.map((s) => {
            const count = counts.get(s.code) || 0;
            if (count === 0) return null;
            return (
              <Badge
                key={s.code}
                variant="soft"
                size="2"
                radius="full"
                style={{ backgroundColor: (s.color || '#888') + '22', color: s.color || '#888' }}
              >
                {count} {s.label.toLowerCase()}
              </Badge>
            );
          })}
          {items.length === 0 && (
            <Text size="2" color="gray">Aucune demande d&rsquo;intervention pour ce site.</Text>
          )}
        </Flex>

        {staleItems.length > 0 && (
          <Flex direction="column" gap="1">
            <Flex align="center" gap="1">
              <AlertTriangle size={14} color="var(--amber-9)" />
              <Text size="2" weight="medium">
                {staleItems.length} demande{staleItems.length > 1 ? 's' : ''} sans suite depuis plus de {STALE_THRESHOLD_DAYS} jours
              </Text>
            </Flex>
            <Text size="1" color="gray">
              {staleItems.slice(0, 3).map((r) => `${r.code} (${daysSince(r.created_at)} j)`).join(', ')}
              {staleItems.length > 3 ? ` et ${staleItems.length - 3} autre(s)` : ''}
            </Text>
          </Flex>
        )}

        <Flex justify="end">
          <a href="/interventions?tab=demandes" style={{ textDecoration: 'none' }}>
            <Flex align="center" gap="1">
              <Text size="2" color="blue" weight="medium">Voir toutes les demandes</Text>
              <ArrowRight size={14} color="var(--blue-9)" />
            </Flex>
          </a>
        </Flex>
      </Flex>
    </Card>
  );
}

StandardRequestsSummary.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    code: PropTypes.string,
    statut: PropTypes.string,
    created_at: PropTypes.string,
  })).isRequired,
  statuses: PropTypes.arrayOf(PropTypes.shape({
    code: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    color: PropTypes.string,
  })).isRequired,
};
