import { useCallback, useState } from 'react';
import { Box, Button, Card, Flex, Select, Spinner, Text, TextField } from '@radix-ui/themes';
import { CheckSquare, Plus } from 'lucide-react';
import TableHeader from '@/components/ui/TableHeader';
import DataTable from '@/components/ui/DataTable';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import TaskDetail from '@/components/tasks/TaskDetail';
import { useTasks } from '@/hooks/tasks/useTasks';
import { COLUMNS, TasksFilters } from '@/components/tasks/tabs/TasksTabParts';

export default function TasksTab() {
  const {
    users,
    openInterventions,
    loading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    origin,
    setOrigin,
    assignee,
    setAssignee,
    sortedItems,
    counters,
    assigneeOptions,
    refresh,
    expandedRowId,
    setExpandedRowId,
    saving,
    patchTask,
    mode,
    setMode,
    createTask,
  } = useTasks();

  const [newLabel, setNewLabel] = useState('');
  const [newInterventionId, setNewInterventionId] = useState('');
  const [newAssignedTo, setNewAssignedTo] = useState('');

  const handleCreateSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!newLabel.trim() || !newInterventionId) return;
    await createTask({ interventionId: newInterventionId, label: newLabel.trim(), assignedTo: newAssignedTo || undefined });
    setNewLabel('');
    setNewInterventionId('');
    setNewAssignedTo('');
  }, [createTask, newLabel, newInterventionId, newAssignedTo]);

  const handleSelect = useCallback((row) => {
    if (expandedRowId === row.id) {
      setExpandedRowId(null);
      return;
    }
    setExpandedRowId(row.id);
  }, [expandedRowId, setExpandedRowId]);

  if (loading) return <LoadingState fullscreen={false} message="Chargement des taches..." />;
  if (error) return <ErrorState error={error} onRetry={refresh} backLink="/" backLabel="Retour" />;

  return (
    <Box>
      <TableHeader
        icon={CheckSquare}
        title="Taches"
        count={counters.total}
        searchValue={search}
        onSearchChange={setSearch}
        loading={loading}
        showRefreshButton={false}
        actions={
          <TasksFilters
            status={status}
            setStatus={setStatus}
            origin={origin}
            setOrigin={setOrigin}
            assignee={assignee}
            setAssignee={setAssignee}
            assigneeOptions={assigneeOptions}
          />
        }
        rightActions={
          mode !== 'create' && (
            <Button size="2" color="blue" onClick={() => setMode('create')}>
              <Plus size={14} /> Nouvelle tache
            </Button>
          )
        }
      />

      {/* ── Formulaire inline ── */}
      {mode === 'create' && (
        <Card mb="3" style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}>
          <form onSubmit={handleCreateSubmit}>
            <Flex direction="column" gap="3">
              <Flex align="center" gap="2">
                <Plus size={18} color="var(--blue-9)" />
                <Text size="2" weight="bold">Nouvelle tache</Text>
              </Flex>

              <Box>
                <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>
                  Intervention <Text color="red">*</Text>
                </Text>
                <Select.Root value={newInterventionId} onValueChange={setNewInterventionId}>
                  <Select.Trigger placeholder="Sélectionner une intervention" style={{ width: '100%' }} />
                  <Select.Content>
                    {openInterventions.map((i) => (
                      <Select.Item key={i.id} value={String(i.id)}>
                        {i.code || i.id}{i.title ? ` — ${i.title}` : ''}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Box>

              <Box>
                <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>
                  Libellé <Text color="red">*</Text>
                </Text>
                <TextField.Root
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Ex : Contrôle alignement capteur"
                  autoFocus
                />
              </Box>

              <Box>
                <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>Assigné à</Text>
                <Select.Root value={newAssignedTo || '__none__'} onValueChange={(v) => setNewAssignedTo(v === '__none__' ? '' : v)}>
                  <Select.Trigger placeholder="Non assigné" style={{ width: '100%' }} />
                  <Select.Content>
                    <Select.Item value="__none__">Non assigné</Select.Item>
                    {users.map((u) => {
                      const initials = (u.initials || u.initial || '').toUpperCase();
                      const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
                      return (
                        <Select.Item key={u.id} value={String(u.id)}>
                          {initials ? `${initials} — ${fullName}` : fullName}
                        </Select.Item>
                      );
                    })}
                  </Select.Content>
                </Select.Root>
              </Box>

              <Flex justify="end" gap="2">
                <Button
                  type="button"
                  variant="soft"
                  color="gray"
                  size="2"
                  onClick={() => { setMode(null); setNewLabel(''); setNewInterventionId(''); setNewAssignedTo(''); }}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  color="blue"
                  size="2"
                  disabled={saving || !newLabel.trim() || !newInterventionId}
                >
                  {saving ? <Spinner size="1" /> : <Plus size={14} />}
                  Enregistrer
                </Button>
              </Flex>
            </Flex>
          </form>
        </Card>
      )}

      <DataTable
        columns={COLUMNS}
        data={sortedItems}
        loading={loading}
        getRowKey={(row) => row.id}
        onRowClick={handleSelect}
        rowHover
        rowStyles={(row) =>
          expandedRowId === row.id
            ? { background: 'var(--accent-3)', boxShadow: 'inset 3px 0 0 var(--accent-9)' }
            : {}
        }
        isRowExpanded={(row) => row.id === expandedRowId}
        renderExpandedRow={(row) => (
          <TaskDetail
            task={row}
            users={users}
            saving={saving}
            onPatchTask={patchTask}
            onRefresh={refresh}
          />
        )}
        emptyState={
          <Flex direction="column" align="center" gap="2" py="6">
            <CheckSquare size={32} color="var(--gray-8)" />
            <Text color="gray" size="2">Aucune tache</Text>
          </Flex>
        }
      />
    </Box>
  );
}
