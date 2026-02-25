/**
 * @fileoverview Onglet interventions d'un équipement
 * @module components/equipements/tabs/EquipementInterventionsTab
 *
 * Affiche les interventions liées à l'équipement
 */

import { useNavigate } from 'react-router-dom';
import { Box, Text, Button, Badge } from '@radix-ui/themes';
import { Eye, Wrench } from 'lucide-react';
import PropTypes from 'prop-types';
import DataTable from '@/components/ui/DataTable';

const PRIORITY_COLORS = {
  urgent: 'red',
  important: 'orange',
  normal: 'blue',
  faible: 'gray',
};

const STATUS_COLORS = {
  ouvert: 'orange',
  'en cours': 'blue',
  ferme: 'green',
  annule: 'gray',
};

function getPriorityColor(priority) {
  return PRIORITY_COLORS[priority] || 'gray';
}

function getStatusColor(status) {
  return STATUS_COLORS[status] || 'gray';
}

function buildColumns(navigate) {
  return [
    {
      key: 'code',
      header: 'Code',
      render: (inter) => (
        <Text weight="medium" size="2">
          {inter.code}
        </Text>
      ),
    },
    {
      key: 'title',
      header: 'Titre',
      render: (inter) => <Text size="2">{inter.title}</Text>,
    },
    {
      key: 'type',
      header: 'Type',
      width: 100,
      render: (inter) => (
        <Badge variant="soft" size="1">
          {inter.type_inter?.label || inter.type_inter?.code || inter.type_inter || '—'}
        </Badge>
      ),
    },
    {
      key: 'priority',
      header: 'Priorité',
      width: 100,
      render: (inter) => (
        <Badge variant="soft" size="1" color={getPriorityColor(inter.priority)}>
          {inter.priority}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      width: 100,
      render: (inter) => (
        <Badge variant="soft" size="1" color={getStatusColor(inter.status_actual)}>
          {inter.status_actual}
        </Badge>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (inter) => (
        <Text size="2" color="gray">
          {inter.reported_date || '—'}
        </Text>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      align: 'end',
      render: (inter) => (
        <Button size="1" variant="ghost" onClick={() => navigate(`/intervention/${inter.id}`)}>
          <Eye size={16} /> Voir
        </Button>
      ),
    },
  ];
}

function buildPaginationProps(interventions) {
  const totalPages = interventions?.total_pages || 0;
  if (totalPages <= 1) return undefined;

  return {
    currentPage: interventions.page,
    total: interventions.total,
    pageSize: interventions.page_size,
    totalPages,
    onPageChange: () => {
      // TODO: Implémenter le changement de page
    },
  };
}

/**
 * Onglet liste des interventions d'un équipement
 */
export default function EquipementInterventionsTab({ interventions }) {
  const navigate = useNavigate();
  const columns = buildColumns(navigate);

  const items = interventions?.items || [];
  const total = interventions?.total || 0;

  if (total === 0) {
    return (
      <Box py="4">
        <Text color="gray">Aucune intervention liée à cet équipement.</Text>
      </Box>
    );
  }

  return (
    <Box pt="4">
      <DataTable
        headerProps={{
          icon: Wrench,
          title: 'Interventions',
          count: total,
          showSearchInput: false,
          showRefreshButton: false,
        }}
        columns={columns}
        data={items}
        emptyState={{
          icon: Wrench,
          title: 'Aucune intervention',
          description: 'Aucune intervention liée à cet équipement.',
        }}
        pagination={buildPaginationProps(interventions)}
      />
    </Box>
  );
}

EquipementInterventionsTab.propTypes = {
  interventions: PropTypes.shape({
    total: PropTypes.number,
    page: PropTypes.number,
    page_size: PropTypes.number,
    total_pages: PropTypes.number,
    items: PropTypes.array,
  }),
};
