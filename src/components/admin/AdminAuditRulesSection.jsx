/**
 * @fileoverview Section admin — règles d'audit (routine vs sensible par entité et champ)
 * @module components/admin/AdminAuditRulesSection
 */

import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Text } from '@radix-ui/themes';
import { Pencil, Plus } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import { createAuditRule, updateAuditRule } from '@/api/adminAuditRules';
import { CreateRuleModal, EditRuleModal } from '@/components/admin/AdminAuditRuleModals';
import { ENTITY_LABELS } from '@/config/auditRuleEntities';

export default function AdminAuditRulesSection({ rules, reasons, loading, onRefresh }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const openCreate = useCallback(() => setCreateOpen(true), []);
  const openEdit = useCallback((rule) => { setSelected(rule); setEditOpen(true); }, []);

  const handleSubmit = useCallback(async (id, payload) => {
    setSubmitting(true);
    try {
      if (id) await updateAuditRule(id, payload);
      else await createAuditRule(payload);
      setCreateOpen(false);
      setEditOpen(false);
      await onRefresh();
    } finally {
      setSubmitting(false);
    }
  }, [onRefresh]);

  const columns = useMemo(() => [
    {
      key: 'entity_type', header: 'Entité', width: 140,
      render: (r) => <Badge variant="soft" color="blue">{ENTITY_LABELS[r.entity_type] ?? r.entity_type}</Badge>,
    },
    {
      key: 'field', header: 'Champ',
      render: (r) => r.field
        ? <Text size="2" style={{ fontFamily: 'monospace' }}>{r.field}</Text>
        : <Text size="2" color="gray">— (par défaut)</Text>,
    },
    {
      key: 'is_routine', header: 'Nature', width: 140,
      render: (r) => r.is_routine
        ? <Badge color="green" variant="soft">Routine</Badge>
        : <Badge color="orange" variant="soft">Sensible</Badge>,
    },
    {
      key: 'default_reason_code', header: 'Raison par défaut', width: 180,
      render: (r) => r.default_reason_code
        ? <Text size="2" style={{ fontFamily: 'monospace' }}>{r.default_reason_code}</Text>
        : <Text size="2" color="gray">—</Text>,
    },
    {
      key: 'actions', header: '', align: 'end', width: 80,
      render: (r) => (
        <Button size="1" variant="soft" onClick={() => openEdit(r)}><Pencil size={12} /></Button>
      ),
    },
  ], [openEdit]);

  return (
    <Box mt="6">
      <CreateRuleModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        reasons={reasons}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
      <EditRuleModal
        open={editOpen}
        onOpenChange={setEditOpen}
        rule={selected}
        reasons={reasons}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
      <DataTable
        headerProps={{
          title: "Règles d'audit — routine vs sensible",
          count: rules.length,
          showSearchInput: false,
          actions: (
            <Button size="2" onClick={openCreate}><Plus size={14} /> Nouvelle règle</Button>
          ),
        }}
        columns={columns}
        data={rules}
        loading={loading}
        emptyState={{ title: 'Aucune règle', description: '' }}
      />
    </Box>
  );
}

AdminAuditRulesSection.propTypes = {
  rules: PropTypes.array.isRequired,
  reasons: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onRefresh: PropTypes.func.isRequired,
};
