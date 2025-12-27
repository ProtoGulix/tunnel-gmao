/**
 * Interventions Adapter (Directus)
 *
 * Maps Directus-specific responses to domain DTOs defined in API_CONTRACTS.md:
 * - Intervention
 * - InterventionAction
 * - InterventionPart
 * - InterventionStatusLog
 *
 * Handles:
 * - Directus field name mappings (e.g., machine_id → machine, status_actual → status)
 * - Directus-specific filters and query parameters (e.g., _eq, _in filters)
 * - Response normalization to domain shapes
 * - Cache invalidation
 */

import { api, invalidateCache } from '@/lib/api/client';
import { apiCall } from '@/lib/api/errors';

// ============================================================================
// Utility Functions
// ============================================================================

// Normalizes backend status to domain enum string
/**
 * Normalizes raw status value to domain status enum string.
 * Maps Directus French values → domain enum.
 *
 * Handles both string and object formats:
 * - string: 'ouvert' | 'attente_pieces' | 'attente_prod' | 'ferme' | 'cancelled'
 * - object: { id: 'ouvert', value: 'ouvert' } or similar
 *
 * Mapping:
 * - 'ouvert' → 'open'
 * - 'attente_pieces' / 'attente_prod' → 'in_progress'
 * - 'ferme' → 'closed'
 * - 'cancelled' → 'cancelled'
 *
 * @param {string|Object|any} raw - Raw status value from backend
 * @returns {string} Normalized status ('open' | 'in_progress' | 'closed' | 'cancelled')
 */
const normalizeStatus = (raw) => {
  if (!raw) return 'open';

  // Extract value: try id field first, then value field, then toString
  let status = '';
  if (typeof raw === 'string') {
    status = raw;
  } else if (typeof raw === 'object') {
    status = raw.id || raw.value || '';
  }

  status = (status || '').toLowerCase().trim();

  // Map Directus backend values to domain DTO enum
  if (status === 'ouvert') return 'open';
  if (status === 'attente_pieces' || status === 'attente_prod') return 'in_progress';
  if (status === 'ferme') return 'closed';
  if (status === 'cancelled') return 'cancelled';

  // Default fallback
  return 'open';
};

/**
 * Maps domain Intervention payload to Directus format.
 * Centralized to prevent divergence between create/update.
 * @param {Object} payload - Domain Intervention payload (camelCase)
 * @returns {Object} Backend payload (snake_case)
 */
const mapInterventionDomainToBackend = (payload) => {
  const backend = {};
  if (payload.code !== undefined) backend.code = payload.code;
  if (payload.title !== undefined) backend.title = payload.title;
  if (payload.status !== undefined) backend.status_actual = payload.status;
  if (payload.type !== undefined) backend.type_inter = payload.type;
  if (payload.priority !== undefined) backend.priority = payload.priority;
  if (payload.reportedDate !== undefined) backend.reported_date = payload.reportedDate;
  if (payload.machine?.id !== undefined) backend.machine_id = payload.machine.id;
  return backend;
};

// ============================================================================
// Response Mappers (Directus → Domain)
// ============================================================================

/**
 * Maps a Directus intervention response to domain Intervention DTO.
 * @param {Object} item - Backend intervention object
 * @returns {Object|null} Domain Intervention DTO or null
 */
const mapInterventionToDomain = (item) => {
  if (!item) return null;

  return {
    id: item.id,
    code: item.code,
    title: item.title,
    status: normalizeStatus(item.status_actual),
    type: item.type_inter || 'CUR',
    priority: item.priority || 'normal',
    reportedDate: item.reported_date,
    machine: item.machine_id
      ? {
          id: item.machine_id.id,
          code: item.machine_id.code,
          name: item.machine_id.name,
        }
      : undefined,
    // Optional nested data (present in fetchIntervention, absent in list)
    action: item.action ? item.action.map(mapActionToDomain) : undefined,
    parts: item.parts ? item.parts.map(mapPartToDomain) : undefined,
    assignedTo: item.assigned_to
      ? {
          id: item.assigned_to.id,
          firstName: item.assigned_to.first_name,
          lastName: item.assigned_to.last_name,
        }
      : undefined,
  };
};

/**
 * Maps a Directus intervention action response to domain InterventionAction DTO.
 * @param {Object} item - Backend intervention_action object
 * @returns {Object|null} Domain InterventionAction DTO or null
 */
const mapActionToDomain = (item) => {
  if (!item) return null;

  return {
    id: item.id,
    description: item.description,
    timeSpent: item.time_spent,
    complexityScore: item.complexity_score,
    createdAt: item.created_at,
    technician: item.tech
      ? {
          id: item.tech.id,
          firstName: item.tech.first_name,
          lastName: item.tech.last_name,
        }
      : undefined,
    subcategory: item.action_subcategory
      ? {
          id: item.action_subcategory.id,
          code: item.action_subcategory.code,
          name: item.action_subcategory.name,
          category_id: item.action_subcategory.category_id
            ? {
                code: item.action_subcategory.category_id.code,
                name: item.action_subcategory.category_id.name,
              }
            : undefined,
        }
      : undefined,
    intervention: item.intervention_id
      ? {
          id: item.intervention_id.id,
          code: item.intervention_id.code,
          title: item.intervention_id.title,
        }
      : undefined,
  };
};

/**
 * Maps a Directus part response to domain InterventionPart DTO.
 * @param {Object} item - Backend intervention_parts object
 * @returns {Object|null} Domain InterventionPart DTO or null
 */
const mapPartToDomain = (item) => {
  if (!item) return null;

  return {
    id: item.id,
    quantity: item.quantity,
    note: item.note,
    stockItem: item.stock_item_id
      ? {
          id: item.stock_item_id.id,
          ref: item.stock_item_id.ref,
          name: item.stock_item_id.name,
        }
      : undefined,
  };
};

/**
 * Maps a Directus status log response to domain InterventionStatusLog DTO.
 * @param {Object} item - Backend intervention_status_log object
 * @returns {Object|null} Domain InterventionStatusLog DTO or null
 */
const mapStatusLogToDomain = (item) => {
  if (!item) return null;

  return {
    id: item.id,
    date: item.date,
    from: item.status_from
      ? {
          id: item.status_from.id,
          value: normalizeStatus(item.status_from), // Normalize to DTO enum
        }
      : undefined,
    to: item.status_to
      ? {
          id: item.status_to.id,
          value: normalizeStatus(item.status_to), // Normalize to DTO enum
        }
      : undefined,
    technician: item.technician_id
      ? {
          id: item.technician_id.id,
          firstName: item.technician_id.first_name,
          lastName: item.technician_id.last_name,
        }
      : undefined,
  };
};

// ============================================================================
// Payload Mappers (Domain → Directus)
// ============================================================================

/**
 * Maps domain InterventionAction payload to Directus format.
 * @param {Object} payload - Domain InterventionAction payload (camelCase)
 * @returns {Object} Backend payload (snake_case)
 */
const mapActionPayloadToBackend = (payload) => {
  const backend = {};
  if (payload.description !== undefined) backend.description = payload.description;
  if (payload.timeSpent !== undefined) backend.time_spent = payload.timeSpent;
  if (payload.complexityScore !== undefined) backend.complexity_score = payload.complexityScore;
  if (payload.subcategory?.id !== undefined) backend.action_subcategory = payload.subcategory.id;
  if (payload.technician?.id !== undefined) backend.tech = payload.technician.id;
  if (payload.intervention?.id !== undefined) backend.intervention_id = payload.intervention.id;
  return backend;
};

/**
 * Maps domain InterventionPart payload to Directus format.
 * @param {Object} payload - Domain InterventionPart payload (camelCase)
 * @returns {Object} Backend payload (snake_case)
 */
const mapPartPayloadToBackend = (payload) => {
  const backend = {};
  if (payload.quantity !== undefined) backend.quantity = payload.quantity;
  if (payload.note !== undefined) backend.note = payload.note;
  if (payload.stockItem?.id !== undefined) backend.stock_item_id = payload.stockItem.id;
  if (payload.intervention?.id !== undefined) backend.intervention_id = payload.intervention.id;
  return backend;
};

// ============================================================================
// API Methods (Domain interface)
// ============================================================================

export const interventionsAdapter = {
  /**
   * Fetch a single intervention by ID.
   * @returns {Promise<Intervention>}
   */
  fetchIntervention: async (id) => {
    return apiCall(async () => {
      const { data } = await api.get(`/items/intervention/${id}`, {
        params: {
          fields: [
            '*',
            'status_actual.id',
            'status_actual.value',
            'machine_id.id',
            'machine_id.code',
            'machine_id.name',
            'assigned_to.id',
            'assigned_to.first_name',
            'assigned_to.last_name',
            'action.id',
            'action.action_subcategory.id',
            'action.action_subcategory.code',
            'action.action_subcategory.name',
            'action.action_subcategory.category_id.code',
            'action.action_subcategory.category_id.name',
            'action.description',
            'action.time_spent',
            'action.complexity_score',
            'action.complexity_anotation',
            'action.created_at',
            'action.updated_at',
            'action.tech.id',
            'action.tech.first_name',
            'action.tech.last_name',
            'parts.id',
            'parts.quantity',
            'parts.note',
          ].join(','),
          _t: Date.now(),
        },
      });
      return mapInterventionToDomain(data.data);
    }, 'FetchIntervention');
  },

  /**
   * Fetch all interventions.
   * @returns {Promise<Intervention[]>}
   */
  fetchInterventions: async () => {
    return apiCall(async () => {
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
      return data.data.map(mapInterventionToDomain);
    }, 'FetchInterventions');
  },

  /**
   * Create a new intervention.
   * @param {Object} payload - Domain Intervention payload
   * @returns {Promise<Intervention>}
   */
  createIntervention: async (payload) => {
    return apiCall(async () => {
      const backendPayload = mapInterventionDomainToBackend(payload);
      const response = await api.post('/items/intervention', backendPayload);
      invalidateCache('interventions');
      return mapInterventionToDomain(response.data.data);
    }, 'CreateIntervention');
  },

  /**
   * Create an action for an intervention.
   * @param {Object} payload - Domain InterventionAction payload
   * @returns {Promise<InterventionAction>}
   */
  createAction: async (payload) => {
    return apiCall(async () => {
      const backendPayload = mapActionPayloadToBackend(payload);

      const response = await api.post('/items/intervention_action', backendPayload);
      invalidateCache(`interventions:${payload.intervention?.id}`);
      invalidateCache('actions');

      return mapActionToDomain(response.data.data);
    }, 'CreateAction');
  },

  /**
   * Create a part for an intervention.
   * @param {Object} payload - Domain InterventionPart payload
   * @returns {Promise<InterventionPart>}
   */
  createPart: async (payload) => {
    return apiCall(async () => {
      const backendPayload = mapPartPayloadToBackend(payload);
      const response = await api.post('/items/intervention_parts', backendPayload);
      invalidateCache(`interventions:${payload.intervention?.id}`);
      invalidateCache('parts');
      return mapPartToDomain(response.data.data);
    }, 'CreatePart');
  },

  /**
   * Update intervention status.
   * @param {string} interventionId
   * @param {string} status - Backend French status ('ouvert' | 'attente_pieces' | 'attente_prod' | 'ferme')
   * @returns {Promise<Intervention>}
   */
  updateStatus: async (interventionId, status) => {
    return apiCall(async () => {
      const response = await api.patch(`/items/intervention/${interventionId}`, {
        status_actual: status, // Backend expects French values
      });
      invalidateCache(`interventions:${interventionId}`);
      return mapInterventionToDomain(response.data.data);
    }, 'UpdateStatus');
  },

  /**
   * Update intervention details.
   * @param {string} interventionId
   * @param {Object} updates - Partial domain Intervention payload
   * @returns {Promise<Intervention>}
   */
  updateIntervention: async (interventionId, updates) => {
    return apiCall(async () => {
      const backendUpdates = mapInterventionDomainToBackend(updates);
      const response = await api.patch(`/items/intervention/${interventionId}`, backendUpdates);
      invalidateCache(`interventions:${interventionId}`);
      return mapInterventionToDomain(response.data.data);
    }, 'UpdateIntervention');
  },

  /**
   * Fetch status change history for an intervention.
   * @param {string} interventionId
   * @returns {Promise<InterventionStatusLog[]>}
   */
  fetchInterventionStatusLog: async (interventionId) => {
    return apiCall(async () => {
      const { data } = await api.get('/items/intervention_status_log', {
        params: {
          filter: { intervention_id: { _eq: interventionId } },
          sort: '-date',
          limit: -1,
          fields: [
            'id',
            'date',
            'status_from.id',
            'status_from.value',
            'status_to.id',
            'status_to.value',
            'technician_id.id',
            'technician_id.first_name',
            'technician_id.last_name',
          ].join(','),
          _t: Date.now(),
        },
      });
      return data.data.map(mapStatusLogToDomain);
    }, 'FetchInterventionStatusLog');
  },

  /**
   * Fetch complexity factors.
   * ⚠️ TODO: Define ComplexityFactor DTO in API_CONTRACTS.md or move out of domain.
   * Currently returns backend raw data (temporary).
   * @returns {Promise<Array>}
   */
  fetchComplexityFactors: async () => {
    return apiCall(async () => {
      const { data } = await api.get('/items/complexity_factor', {
        params: {
          limit: -1,
          sort: 'label',
          _t: Date.now(),
        },
      });
      return data.data;
    }, 'FetchComplexityFactors');
  },

  /**
   * Fetch action subcategories.
   * @returns {Promise<Array>}
   */
  fetchActionSubcategories: async () => {
    return apiCall(async () => {
      const { data } = await api.get('/items/action_subcategory', {
        params: {
          limit: -1,
          sort: 'category_id,code',
          fields: ['id', 'category_id.id', 'category_id.code', 'code', 'name'].join(','),
          _t: Date.now(),
        },
      });
      return data.data;
    }, 'FetchActionSubcategories');
  },

  /**
   * Fetch all actions across interventions.
   * @returns {Promise<InterventionAction[]>}
   */
  fetchActions: async () => {
    return apiCall(async () => {
      const { data } = await api.get('/items/intervention_action', {
        params: {
          limit: -1,
          sort: '-created_at',
          fields: [
            'id',
            'description',
            'time_spent',
            'complexity_score',
            'created_at',
            'tech.id',
            'tech.first_name',
            'tech.last_name',
            'action_subcategory.id',
            'action_subcategory.name',
            'action_subcategory.code',
            'intervention_id.id',
            'intervention_id.code',
            'intervention_id.title',
          ].join(','),
          _t: Date.now(),
        },
      });
      return data.data.map(mapActionToDomain);
    }, 'FetchActions');
  },

  /**
   * Fetch open and in-progress interventions.
   * @returns {Promise<Intervention[]>}
   */
  fetchOpenInterventions: async () => {
    return apiCall(async () => {
      const { data } = await api.get('/items/intervention', {
        params: {
          filter: {
            status_actual: {
              _in: ['open', 'in_progress'],
            },
          },
          limit: -1,
          sort: '-created_at',
          fields: 'id,code,title,status_actual,priority',
          _t: Date.now(),
        },
      });
      return data.data.map(mapInterventionToDomain);
    }, 'FetchOpenInterventions');
  },
};
