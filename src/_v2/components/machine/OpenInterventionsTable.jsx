/**
 * Table interventions ouvertes machine
 * @module components/machine/OpenInterventionsTable
 */

import { useMemo, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Box, Flex, Button, Card, Text, Badge } from "@radix-ui/themes";
import { ExternalLink, Eye, Clock, AlertCircle, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Wrench, AlertTriangle } from "lucide-react";
import { INTERVENTION_TYPES, STATUS_CONFIG, PRIORITY_CONFIG } from "@/config/interventionTypes";
import DataTable from "@/components/common/DataTable";
import { calculateInterventionDuration } from "@/hooks/useInterventionDuration";

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };
const DELAY_THRESHOLDS = { CRITICAL: 14, WARNING: 7 };
const ITEMS_PER_PAGE = 10;

const getDelayColor = (days) => {
  if (days == null) return null;
  return days > DELAY_THRESHOLDS.CRITICAL ? 'red' : days > DELAY_THRESHOLDS.WARNING ? 'amber' : null;
};

const calculateTotalTime = (intervention) => {
  if (!intervention?.action?.length) return 0;
  return intervention.action.reduce((total, action) => total + (parseFloat(action.timeSpent) || 0), 0);
};

const getSortValue = (int, column) => {
  if (column === 'code') return int.code || '';
  if (column === 'date') return int.reportedDate ? new Date(int.reportedDate).getTime() : 0;
  return PRIORITY_ORDER[int.priority?.toLowerCase()] ?? 999;
};

function SortableHeader({ column, label, sortColumn, sortDirection, onSort }) {
  return (
    <Flex align="center" gap="1" onClick={() => onSort(column)} style={{ cursor: 'pointer', userSelect: 'none' }}>
      {label}
      {sortColumn === column && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
    </Flex>
  );
}

SortableHeader.propTypes = {
  column: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  sortColumn: PropTypes.string,
  sortDirection: PropTypes.oneOf(['asc', 'desc']),
  onSort: PropTypes.func.isRequired,
};

function DurationCell({ intervention }) {
  const { durationDays, isOpen, closingDate } = calculateInterventionDuration(intervention);
  const delayColor = getDelayColor(durationDays);
  return (
    <Flex align="center" gap="1">
      {isOpen && <AlertTriangle size={12} color="var(--orange-9)" />}
      <Clock size={12} color="var(--gray-9)" />
      <Text size="1" color="gray">{durationDays !== null ? `${durationDays}j` : 'N/A'}</Text>
      {delayColor && isOpen && <Badge color={delayColor} size="1">Retard</Badge>}
      {closingDate && <Text size="1" color="green">✓</Text>}
    </Flex>
  );
}

DurationCell.propTypes = { intervention: PropTypes.object.isRequired };

const buildColumns = (sortConfig, handleSort) => [
  {
    key: 'code',
    header: <SortableHeader column="code" label="Code" sortColumn={sortConfig.column} sortDirection={sortConfig.direction} onSort={handleSort} />,
    render: (int) => <Link to={`/intervention/${int.id}`} style={{ textDecoration: 'none' }}><Text weight="bold" color="blue">{int.code || "N/A"}</Text></Link>
  },
  { key: 'title', header: 'Titre', render: (int) => <Text size="1">{int.title || "Sans titre"}</Text> },
  { key: 'type', header: 'Type', render: (int) => { const t = INTERVENTION_TYPES.find(x => x.id === int.type); return <Badge color={t?.color || 'gray'} size="1">{t?.title || int.type || "N/A"}</Badge>; } },
  {
    key: 'priority',
    header: <SortableHeader column="priority" label="Priorité" sortColumn={sortConfig.column} sortDirection={sortConfig.direction} onSort={handleSort} />,
    render: (int) => <Badge color={PRIORITY_CONFIG[int.priority?.toLowerCase()]?.color || 'gray'} size="1">{int.priority || "N/A"}</Badge>
  },
  { key: 'status', header: 'Statut', render: (int) => <Badge color={STATUS_CONFIG[int.status?.toLowerCase()]?.color || 'gray'} size="1">{STATUS_CONFIG[int.status?.toLowerCase()]?.label || int.status || "N/A"}</Badge> },
  {
    key: 'date',
    header: <SortableHeader column="date" label="Date" sortColumn={sortConfig.column} sortDirection={sortConfig.direction} onSort={handleSort} />,
    render: (int) => <Text size="1">{int.reportedDate ? new Date(int.reportedDate).toLocaleDateString('fr-FR') : "N/A"}</Text>
  },
  { key: 'duration', header: 'Ouverture', render: (int) => <DurationCell intervention={int} /> },
  { key: 'consumed', header: 'Consommé', render: (int) => { const t = calculateTotalTime(int); return <Text size="1" weight="bold" color="blue">{t > 0 ? `${t.toFixed(1)}h` : '0h'}</Text>; } },
  { key: 'actions', header: 'Actions', render: (int) => <Button size="1" variant="soft" asChild><Link to={`/intervention/${int.id}`} style={{ textDecoration: 'none' }}><Eye size={12} style={{ marginRight: '4px' }} />Voir</Link></Button> }
];

export default function OpenInterventionsTable({ interventions, machineId }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ column: 'priority', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = useCallback((column) => {
    setSortConfig(prev => ({ column, direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc' }));
  }, []);

  const filteredInterventions = useMemo(() => {
    if (!interventions?.length || !searchTerm) return interventions || [];
    const search = searchTerm.toLowerCase();
    return interventions.filter(int => int.code?.toLowerCase().includes(search) || int.title?.toLowerCase().includes(search));
  }, [interventions, searchTerm]);

  const sortedInterventions = useMemo(() => {
    if (!filteredInterventions.length) return [];
    return [...filteredInterventions].sort((a, b) => {
      const aVal = getSortValue(a, sortConfig.column);
      const bVal = getSortValue(b, sortConfig.column);
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredInterventions, sortConfig]);

  const totalPages = Math.ceil(sortedInterventions.length / ITEMS_PER_PAGE);
  const paginatedInterventions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedInterventions.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedInterventions, currentPage]);

  const columns = useMemo(() => buildColumns(sortConfig, handleSort), [sortConfig, handleSort]);
  const rowStyles = useCallback((int) => int.priority?.toLowerCase() === 'urgent' ? { background: 'var(--red-2)' } : {}, []);

  if (!interventions?.length) {
    return (
      <DataTable
        headerProps={{ icon: Wrench, title: "Interventions", count: 0, searchValue: searchTerm, onSearchChange: setSearchTerm, searchPlaceholder: "Rechercher..." }}
        columns={columns}
        data={[]}
        emptyState={{ icon: AlertCircle, title: "Aucune intervention" }}
      />
    );
  }

  return (
    <Box>
      <DataTable
        headerProps={{
          icon: Wrench,
          title: "Interventions",
          count: interventions.length,
          searchValue: searchTerm,
          onSearchChange: (v) => { setSearchTerm(v); setCurrentPage(1); },
          searchPlaceholder: "Rechercher par code ou titre...",
          actions: <Button size="2" variant="soft" asChild><Link to={`/interventions?machine=${machineId}`}><ExternalLink size={14} style={{ marginRight: '6px' }} />Voir toutes</Link></Button>,
        }}
        columns={columns}
        data={paginatedInterventions}
        size="1"
        variant="surface"
        rowStyles={rowStyles}
        emptyState={{ icon: AlertCircle, title: "Aucun résultat" }}
      />
      {totalPages > 1 && (
        <Card mt="2">
          <Flex justify="between" align="center" p="3">
            <Text size="2" color="gray">Page {currentPage}/{totalPages} ({sortedInterventions.length} résultat{sortedInterventions.length > 1 ? 's' : ''})</Text>
            <Flex gap="2">
              <Button size="1" variant="soft" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={14} />Précédent</Button>
              <Button size="1" variant="soft" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Suivant<ChevronRight size={14} /></Button>
            </Flex>
          </Flex>
        </Card>
      )}
    </Box>
  );
}

OpenInterventionsTable.propTypes = {
  interventions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    code: PropTypes.string,
    title: PropTypes.string,
    type: PropTypes.string,
    priority: PropTypes.string,
    status: PropTypes.string,
    reportedDate: PropTypes.string,
    statusLog: PropTypes.array,
    action: PropTypes.array
  })).isRequired,
  machineId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};
