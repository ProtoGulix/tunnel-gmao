import { useCallback, useState } from 'react';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { CheckSquare, Plus } from 'lucide-react';
import TableHeader from '@/components/ui/TableHeader';
import DataTable from '@/components/ui/DataTable';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import TaskDetail from '@/components/tasks/TaskDetail';
import TaskCreateDialog from '@/components/tasks/TaskCreateDialog';
import { useTasks } from '@/hooks/tasks/useTasks';
import { COLUMNS, TasksFilters } from '@/components/tasks/tabs/TasksTabParts';

export default function TasksTab() {
  const {
    users,
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
  } = useTasks();

  const [dialogOpen, setDialogOpen] = useState(false);

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
          <Button size="2" color="blue" onClick={() => setDialogOpen(true)}>
            <Plus size={14} /> Nouvelle tache
          </Button>
        }
      />

      <TaskCreateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => { refresh(); }}
      />

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
