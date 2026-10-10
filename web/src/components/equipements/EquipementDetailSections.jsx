/**
 * @fileoverview Sections de la fiche équipement (en-tête, fiche, sous-équipements)
 * @module components/equipements/EquipementDetailSections
 */

import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Badge, Box, Flex, Text } from '@radix-ui/themes';
import { BanIcon } from 'lucide-react';
import EquipementHealthBadge from '@/components/ui/EquipementHealthBadge';
import EquipementHealthDot from '@/components/equipements/EquipementHealthDot';
import EquipementStatutBadge from '@/components/equipements/EquipementStatutBadge';
import Pagination from '@/components/ui/Pagination';
import { PAGE_SIZE_OPTIONS } from '@/hooks/shared/usePagedList';
import EditableProperty from '@/components/equipements/EditableProperty';

export const equipementUrl = (id) => `/equipements?id=${id}`;
export const linkStyle = { textDecoration: 'none' };

export function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function Section({ title, count, children }) {
  return (
    <Box mb="5">
      <Flex align="center" gap="2" mb="2" style={{ borderBottom: '1px solid var(--gray-5)', paddingBottom: 4 }}>
        <Text size="2" weight="bold">{title}</Text>
        {count != null && <Badge color="gray" variant="soft" size="1">{count}</Badge>}
      </Flex>
      {children}
    </Box>
  );
}
Section.propTypes = { title: PropTypes.string.isRequired, count: PropTypes.number, children: PropTypes.node };


function BlockedBadge({ statut }) {
  if (statut?.interventions !== false) return null;
  return <Badge color="red" variant="soft" size="1"><BanIcon size={11} /> Interventions bloquées</Badge>;
}
BlockedBadge.propTypes = { statut: PropTypes.object };

function HealthSource({ source }) {
  if (!source) return null;
  return (
    <Text size="1" color="gray">
      via{' '}
      <Link to={equipementUrl(source.id)} replace style={linkStyle}>
        <Text size="1" color="blue">{source.code || source.name}</Text>
      </Link>
    </Text>
  );
}
HealthSource.propTypes = { source: PropTypes.object };

/**
 * @param {Object} eq
 * @param {boolean} [editable] - droit de modifier (ADR 0012)
 * @param {Function} [onSave] - async (champ, valeur) ; rejette en cas d'erreur
 */
export function Header({ eq, editable = false, onSave }) {
  const health = eq.health;
  return (
    <Box mb="4">
      {/* Statut, classe et chemin vivent dans la fiche (lignes modifiables) : pas de doublon ici */}
      <Flex align="center" gap="2" wrap="wrap" mb="2">
        <Text size="4" weight="bold" style={{ fontFamily: 'monospace', color: 'var(--accent-11)' }}>
          {eq.code || '—'}
        </Text>
        <Text size="4" color="gray">–</Text>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <EditableProperty
            bare
            label="Nom"
            value={eq.name}
            editable={editable}
            required
            requiredMessage="Le nom est obligatoire"
            onSave={(v) => onSave('name', v)}
            textProps={{ size: '4', weight: 'bold' }}
          />
        </Box>
        <BlockedBadge statut={eq.statut} />
      </Flex>
      <Flex align="center" gap="2" wrap="wrap">
        <EquipementHealthBadge level={health?.level || 'ok'} showLabel />
        {health?.reason && <Text size="1" color="gray">{health.reason}</Text>}
        <HealthSource source={health?.source} />
      </Flex>
    </Box>
  );
}
Header.propTypes = { eq: PropTypes.object.isRequired, editable: PropTypes.bool, onSave: PropTypes.func };

export function ChildrenSection({ list }) {
  const { items, total, loading, error, page, pageSize, setPage, setPageSize } = list;
  if (error) {
    return (
      <Section title="Sous-équipements">
        <Text size="2" color="red">{error}</Text>
      </Section>
    );
  }
  if (total === 0) return null;
  return (
    <Section title="Sous-équipements" count={total}>
      <Flex direction="column" style={{ opacity: loading ? 0.6 : 1 }}>
        {items.map((c) => (
          <Link key={c.id} to={equipementUrl(c.id)} replace style={linkStyle}>
            <Flex align="center" gap="2" style={{ padding: '5px 0', borderBottom: '1px solid var(--gray-4)' }} title={c.health?.reason || undefined}>
              <EquipementHealthDot level={c.health?.level} />
              <Text size="2" weight="medium" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.code || '—'} – {c.name}
              </Text>
              {c.children_count > 0 && <Badge color="gray" variant="soft" size="1">{c.children_count}</Badge>}
              <EquipementStatutBadge statut={c.statut} />
            </Flex>
          </Link>
        ))}
      </Flex>
      {total > PAGE_SIZE_OPTIONS[0] && (
        <Box mt="2">
          <Pagination
            currentPage={page}
            totalItems={total}
            itemsPerPage={pageSize}
            onPageChange={setPage}
            onItemsPerPageChange={setPageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </Box>
      )}
    </Section>
  );
}
ChildrenSection.propTypes = { list: PropTypes.object.isRequired };
