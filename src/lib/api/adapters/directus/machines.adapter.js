import { api } from '@/lib/api/client';
import { apiCall } from '@/lib/api/errors';

/**
 * Maps a Directus machine item to domain Machine DTO.
 * @param {Object} m - Backend machine object
 * @returns {Object} Domain Machine DTO
 */
const toDomainMachine = (m) => ({
  id: m.id,
  code: m.code ?? undefined,
  name: m.name,
  zone: m.zone_id ? { id: m.zone_id.id, name: m.zone_id.name } : undefined,
  workshop: m.atelier_id ? { id: m.atelier_id.id, name: m.atelier_id.name } : undefined,
  parent: m.equipement_mere
    ? { id: m.equipement_mere.id, code: m.equipement_mere.code, name: m.equipement_mere.name }
    : undefined,
  tree: m.equipement_tree
    ? { id: m.equipement_tree.id, code: m.equipement_tree.code, name: m.equipement_tree.name }
    : undefined,
});

/**
 * Maps a Directus intervention item to domain Intervention DTO (minimal fields).
 * @param {Object} i - Backend intervention object
 * @returns {Object} Domain Intervention DTO with minimal fields
 */
// Map Directus intervention item to domain Intervention (minimal fields used here)
const toDomainIntervention = (i) => ({
  id: i.id,
  code: i.code,
  title: i.title,
  status: mapStatus(i.status_actual),
  type: (i.type_inter || 'UNKNOWN').toUpperCase(),
  priority: mapPriority(i.priority),
  reportedDate: i.reported_date ?? undefined,
  machine: i.machine_id
    ? { id: i.machine_id.id, code: i.machine_id.code, name: i.machine_id.name }
    : undefined,
});

/**
 * Maps raw status value to domain status enum.
 * Handles both string and object formats from backend.
 * @param {string|Object|any} raw - Raw status value from backend
 * @returns {string} Normalized status ('open' | 'in_progress' | 'closed' | 'cancelled')
 */
const mapStatus = (raw) => {
  if (!raw) return 'open';

  // Extract value: try value field first, then id field, then toString
  let status = '';
  if (typeof raw === 'string') {
    status = raw;
  } else if (typeof raw === 'object') {
    status = raw.value || raw.id || '';
  }

  status = (status || '').toLowerCase().trim();

  // Map Directus French values to domain enum
  if (status === 'ouvert') return 'open';
  if (status === 'attente_pieces' || status === 'attente_prod') return 'in_progress';
  if (status === 'ferme') return 'closed';
  if (status === 'cancelled') return 'cancelled';

  return 'open';
};

/**
 * Maps raw priority value to domain priority enum.
 * @param {string|any} raw - Raw priority value from backend
 * @returns {string} Normalized priority ('low' | 'normal' | 'high')
 */
const mapPriority = (raw) => {
  const v = (raw || '').toString().toLowerCase();
  if (v === 'urgent' || v === 'high') return 'high';
  if (v === 'low') return 'low';
  return 'normal';
};

export const machinesAdapter = {
  async fetchMachines() {
    return apiCall(async () => {
      const { data } = await api.get('/items/machine', {
        params: {
          limit: -1,
          fields: [
            'id',
            'code',
            'name',
            'zone_id.id',
            'zone_id.name',
            'atelier_id.id',
            'atelier_id.name',
            'equipement_mere.id',
            'equipement_mere.code',
            'equipement_mere.name',
            'equipement_tree.id',
            'equipement_tree.code',
            'equipement_tree.name',
          ].join(','),
          _t: Date.now(),
        },
      });
      const items = data.data || [];
      return items.map(toDomainMachine);
    }, 'Machines.fetchMachines');
  },

  async fetchMachine(id) {
    return apiCall(async () => {
      const { data } = await api.get(`/items/machine/${id}`, {
        params: {
          fields: [
            'id',
            'code',
            'name',
            'equipement_mere.id',
            'equipement_mere.code',
            'equipement_mere.name',
            'equipement_tree.id',
            'equipement_tree.code',
            'equipement_tree.name',
          ].join(','),
          _t: Date.now(),
        },
      });
      return toDomainMachine(data.data);
    }, 'Machines.fetchMachine');
  },

  async fetchMachinesWithInterventions() {
    return apiCall(async () => {
      // Load machines
      const machines = await this.fetchMachines();

      // Load interventions (minimal fields)
      const { data } = await api.get('/items/intervention', {
        params: {
          limit: -1,
          sort: '-reported_date',
          fields: [
            'id',
            'code',
            'title',
            'status_actual.id',
            'status_actual.value',
            'priority',
            'type_inter',
            'reported_date',
            'machine_id.id',
            'machine_id.code',
            'machine_id.name',
          ].join(','),
          _t: Date.now(),
        },
      });
      const interventionsRaw = data.data || [];
      const interventions = interventionsRaw.map(toDomainIntervention);

      const openInterventions = interventions.filter(
        (i) => i.status !== 'closed' && i.status !== 'cancelled'
      );

      return machines.map((machine) => {
        const machineInterventions = openInterventions.filter((i) => i.machine?.id === machine.id);

        const interventionsByType = machineInterventions.reduce((acc, interv) => {
          const type = interv.type || 'UNKNOWN';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        let status = 'ok';
        let statusColor = 'green';

        if (machineInterventions.length > 0) {
          const hasUrgent = machineInterventions.some((i) => i.priority === 'high');
          const hasCurative = (interventionsByType['CUR'] || 0) > 0;

          if (hasUrgent) {
            status = 'critical';
            statusColor = 'red';
          } else if (hasCurative) {
            status = 'warning';
            statusColor = 'orange';
          } else {
            status = 'maintenance';
            statusColor = 'blue';
          }
        }

        return {
          ...machine,
          openInterventionsCount: machineInterventions.length,
          interventionsByType,
          status,
          statusColor,
          interventions: machineInterventions,
        };
      });
    }, 'Machines.fetchMachinesWithInterventions');
  },
};
