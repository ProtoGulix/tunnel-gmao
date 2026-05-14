/**
 * @fileoverview Onglet Audit — historique centralisé des mutations
 * @module components/admin/tabs/AdminAuditTab
 */

import { useState } from 'react';
import {
  Badge, Box, Button, Callout, Flex, Select, Spinner, Table, Text, TextField, Tooltip,
} from '@radix-ui/themes';
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react';
import { useAdminAudit } from '@/hooks/admin/useAdminAudit';

/* ── Config ─────────────────────────────────────────────────────────────────── */

const ENTITY_LABELS = {
  intervention:     'Intervention',
  request:          'Demande DI',
  purchase_request: 'Demande DA',
  task:             'Tâche',
  action:           'Action',
};

const ENTITY_COLORS = {
  intervention:     'blue',
  request:          'violet',
  purchase_request: 'orange',
  task:             'green',
  action:           'cyan',
};

// Libellés lisibles pour les decision_type renvoyés par l'API
const DECISION_LABELS = {
  status_actual_changed:  'Statut modifié',
  priority_changed:       'Priorité modifiée',
  assigned_to_changed:    'Affectation modifiée',
  due_date_changed:       'Échéance modifiée',
  sort_order_changed:     'Ordre modifié',
  created:                'Créé',
  deleted:                'Supprimé',
  status_changed:         'Statut modifié',
};

/* ── Sous-composants ─────────────────────────────────────────────────────────── */

const EMPTY_FILTERS = {
  entity_type: '', reason_code: '', decision_type: '',
  changed_by: '', from_dt: '', to_dt: '', exclude_system: true,
};

function FiltersBar({ filters, reasonCodes, onApply }) {
  const [local, setLocal] = useState(filters);
  const set = (k, v) => setLocal((p) => ({ ...p, [k]: v }));

  return (
    <Flex gap="2" wrap="wrap" align="end" mb="4">
      <Box>
        <Text as="div" size="1" color="gray" mb="1">Entité</Text>
        <Select.Root
          value={local.entity_type || '__all__'}
          onValueChange={(v) => set('entity_type', v === '__all__' ? '' : v)}
        >
          <Select.Trigger style={{ minWidth: 140 }} />
          <Select.Content>
            <Select.Item value="__all__">Toutes</Select.Item>
            {Object.entries(ENTITY_LABELS).map(([k, v]) => (
              <Select.Item key={k} value={k}>{v}</Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </Box>

      <Box>
        <Text as="div" size="1" color="gray" mb="1">Type de décision</Text>
        <Select.Root
          value={local.decision_type || '__all__'}
          onValueChange={(v) => set('decision_type', v === '__all__' ? '' : v)}
        >
          <Select.Trigger style={{ minWidth: 170 }} />
          <Select.Content>
            <Select.Item value="__all__">Tous</Select.Item>
            {Object.entries(DECISION_LABELS).map(([k, v]) => (
              <Select.Item key={k} value={k}>{v}</Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </Box>

      <Box>
        <Text as="div" size="1" color="gray" mb="1">Raison</Text>
        <Select.Root
          value={local.reason_code || '__all__'}
          onValueChange={(v) => set('reason_code', v === '__all__' ? '' : v)}
        >
          <Select.Trigger style={{ minWidth: 170 }} />
          <Select.Content>
            <Select.Item value="__all__">Toutes</Select.Item>
            {reasonCodes.map((r) => (
              <Select.Item key={r.code} value={r.code}>{r.label}</Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </Box>

      <Box>
        <Text as="div" size="1" color="gray" mb="1">Du</Text>
        <TextField.Root
          type="date"
          value={local.from_dt}
          onChange={(e) => set('from_dt', e.target.value)}
          style={{ width: 140 }}
        />
      </Box>

      <Box>
        <Text as="div" size="1" color="gray" mb="1">Au</Text>
        <TextField.Root
          type="date"
          value={local.to_dt}
          onChange={(e) => set('to_dt', e.target.value)}
          style={{ width: 140 }}
        />
      </Box>

      <Button size="2" onClick={() => onApply(local)}>
        <Search size={14} /> Filtrer
      </Button>
      <Button
        size="2"
        variant="soft"
        color="gray"
        onClick={() => { setLocal(EMPTY_FILTERS); onApply(EMPTY_FILTERS); }}
      >
        Réinitialiser
      </Button>
    </Flex>
  );
}

// Sérialise une valeur de diff en chaîne lisible.
// Les valeurs peuvent être des primitives ou des objets hydratés (ex: assigned_to = { initials, first_name, ... })
function _serializeDiffEntry(val) {
  if (val === null || val === undefined) return '—';
  if (typeof val !== 'object') return String(val);
  // Objet utilisateur hydraté
  if (val.initials || val.first_name) {
    return val.initials ?? [val.first_name, val.last_name].filter(Boolean).join(' ') ?? val.id ?? '?';
  }
  // Objet générique : join des valeurs primitives
  return Object.values(val)
    .filter((v) => v !== null && typeof v !== 'object')
    .join(' · ') || JSON.stringify(val);
}

function _serializeDiff(diffObj) {
  if (!diffObj) return null;
  return Object.values(diffObj).map(_serializeDiffEntry).join(', ') || null;
}

function ValueDiff({ oldValue, newValue }) {
  if (!oldValue && !newValue) return <Text size="1" color="gray">—</Text>;

  const oldStr = _serializeDiff(oldValue);
  const newStr = _serializeDiff(newValue);

  if (!oldStr) return <Text size="1" color="green">{newStr}</Text>;
  if (!newStr) return <Text size="1" color="red" style={{ textDecoration: 'line-through' }}>{oldStr}</Text>;

  return (
    <Flex align="center" gap="1" wrap="wrap">
      <Text size="1" color="gray" style={{ textDecoration: 'line-through', opacity: 0.6 }}>{oldStr}</Text>
      <Text size="1" color="gray">→</Text>
      <Text size="1" color="blue">{newStr}</Text>
    </Flex>
  );
}

function Pagination({ page, pageSize, total, onPage }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <Flex align="center" gap="3" justify="center" mt="4">
      <Button size="1" variant="ghost" disabled={page === 0} onClick={() => onPage(page - 1)}>
        <ChevronLeft size={14} />
      </Button>
      <Text size="1" color="gray">
        Page {page + 1} / {totalPages} — {total} entrée{total > 1 ? 's' : ''}
      </Text>
      <Button size="1" variant="ghost" disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)}>
        <ChevronRight size={14} />
      </Button>
    </Flex>
  );
}

/* ── Composant principal ─────────────────────────────────────────────────────── */

export default function AdminAuditTab() {
  const {
    logs, total, loading, error,
    filters, page, pageSize, reasonCodes,
    applyFilters, goToPage, reload,
  } = useAdminAudit();

  return (
    <Box pt="4">
      <Flex align="center" justify="between" mb="3">
        <Flex align="center" gap="2">
          <Text size="3" weight="bold">Journal d&apos;audit</Text>
          {!loading && <Text size="1" color="gray">({total} entrée{total > 1 ? 's' : ''})</Text>}
        </Flex>
        <Button size="1" variant="ghost" color="gray" onClick={reload} disabled={loading}>
          <RefreshCw size={13} /> Actualiser
        </Button>
      </Flex>

      <FiltersBar filters={filters} reasonCodes={reasonCodes} onApply={applyFilters} />

      {error && (
        <Callout.Root color="red" mb="3">
          <Callout.Icon><AlertCircle size={16} /></Callout.Icon>
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}

      {loading ? (
        <Flex justify="center" pt="6"><Spinner size="3" /></Flex>
      ) : (
        <>
          <Table.Root variant="surface" size="1">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell style={{ whiteSpace: 'nowrap' }}>Date &amp; heure</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Entité</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Décision</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Modification</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Raison</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Précision</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Par</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {logs.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={7}>
                    <Text size="2" color="gray">Aucun log correspondant aux critères.</Text>
                  </Table.Cell>
                </Table.Row>
              ) : logs.map((log) => {
                // logged_at : "2026-05-12T10:30:00Z"
                const dt = log.logged_at ? new Date(log.logged_at) : null;
                const dateStr = dt
                  ? dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
                  : '—';
                const timeStr = dt
                  ? dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                  : '';

                const entityLabel = ENTITY_LABELS[log.entity_type] ?? log.entity_type ?? '—';
                const entityColor = ENTITY_COLORS[log.entity_type] ?? 'gray';

                const decisionLabel = DECISION_LABELS[log.decision_type] ?? log.decision_type ?? '—';

                // reason est un objet imbriqué { code, label, color, ... }
                const { reason } = log;

                // changed_by : { id, first_name, last_name, initials }
                const cb = log.changed_by;
                const changedByLabel = cb
                  ? (cb.initials || [cb.first_name, cb.last_name].filter(Boolean).join(' ') || cb.id?.slice(0, 8) || '—')
                  : '—';
                const changedByFull = cb
                  ? [cb.first_name, cb.last_name].filter(Boolean).join(' ') || cb.id
                  : null;

                return (
                  <Table.Row key={log.id}>

                    {/* Date & heure */}
                    <Table.Cell style={{ whiteSpace: 'nowrap' }}>
                      <Flex direction="column" gap="0">
                        <Text size="1" weight="medium">{dateStr}</Text>
                        <Text size="1" color="gray">{timeStr}</Text>
                      </Flex>
                    </Table.Cell>

                    {/* Entité + ID court */}
                    <Table.Cell>
                      <Flex direction="column" gap="0">
                        <Badge size="1" color={entityColor} variant="soft">{entityLabel}</Badge>
                        <Text size="1" color="gray" style={{ fontFamily: 'monospace', fontSize: 10 }}>
                          {log.entity_id?.slice(0, 8) ?? '—'}
                        </Text>
                      </Flex>
                    </Table.Cell>

                    {/* Type de décision */}
                    <Table.Cell>
                      <Text size="1" color="gray">{decisionLabel}</Text>
                    </Table.Cell>

                    {/* old_value → new_value */}
                    <Table.Cell style={{ maxWidth: 180 }}>
                      <ValueDiff oldValue={log.old_value} newValue={log.new_value} />
                    </Table.Cell>

                    {/* Raison (objet imbriqué) */}
                    <Table.Cell>
                      {reason ? (
                        <Badge
                          size="1"
                          variant="soft"
                          style={{
                            backgroundColor: reason.color ? `${reason.color}22` : undefined,
                            color: reason.color ?? undefined,
                            fontFamily: 'monospace',
                            fontSize: 11,
                          }}
                        >
                          {reason.label ?? reason.code}
                        </Badge>
                      ) : (
                        <Text size="1" color="gray">—</Text>
                      )}
                    </Table.Cell>

                    {/* reason_text (texte libre) */}
                    <Table.Cell style={{ maxWidth: 200 }}>
                      {log.reason_text ? (
                        <Tooltip content={log.reason_text}>
                          <Text
                            size="1"
                            color="gray"
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block',
                              maxWidth: 200,
                              cursor: 'default',
                            }}
                          >
                            {log.reason_text}
                          </Text>
                        </Tooltip>
                      ) : (
                        <Text size="1" color="gray">—</Text>
                      )}
                    </Table.Cell>

                    {/* changed_by */}
                    <Table.Cell>
                      <Tooltip content={changedByFull ?? 'Système'}>
                        <Text size="1" color="gray" style={{ fontFamily: 'monospace', cursor: 'default' }}>
                          {log.is_system
                            ? <Badge size="1" color="gray" variant="outline">système</Badge>
                            : changedByLabel}
                        </Text>
                      </Tooltip>
                    </Table.Cell>

                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>

          <Pagination page={page} pageSize={pageSize} total={total} onPage={goToPage} />
        </>
      )}
    </Box>
  );
}
