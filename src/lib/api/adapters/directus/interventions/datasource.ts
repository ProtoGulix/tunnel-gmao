/**
 * Interventions Datasource (Directus)
 * 
 * Raw backend calls only. Returns unprocessed Directus responses.
 * No DTO mapping. No apiCall wrapper. No cache invalidation.
 * 
 * @module lib/api/adapters/directus/interventions/datasource
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// Datasource handles raw backend payloads - type safety enforced at adapter boundary

import { api } from '@/lib/api/client';

// ============================================================================
// Raw Backend Calls (Directus-specific)
// ============================================================================

/**
 * Fetch single intervention by ID (raw Directus response).
 */
export const fetchInterventionRaw = async (id: string) => {
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
        'action.purchase_request_ids.purchase_request_id.id',
        'action.purchase_request_ids.purchase_request_id.stock_item_id.id',
        'action.purchase_request_ids.purchase_request_id.stock_item_id.ref',
        'action.purchase_request_ids.purchase_request_id.stock_item_id.supplier_refs.id',
        'action.purchase_request_ids.purchase_request_id.item_label',
        'action.purchase_request_ids.purchase_request_id.quantity',
        'action.purchase_request_ids.purchase_request_id.unit',
        'action.purchase_request_ids.purchase_request_id.urgency',
        'action.purchase_request_ids.purchase_request_id.requested_by',
        'action.purchase_request_ids.purchase_request_id.reason',
        'action.purchase_request_ids.purchase_request_id.notes',
        'action.purchase_request_ids.purchase_request_id.status',
        'action.purchase_request_ids.purchase_request_id.created_at',
        'action.purchase_request_ids.purchase_request_id.intervention_id'
      ].join(','),
      _t: Date.now(),
    },
  });
  return data.data;
};

/**
 * Fetch interventions (raw Directus response).
 * @param {string} [machineId] - Optional machine ID to filter interventions. If not provided, returns all.
 */
export const fetchInterventionsRaw = async (machineId?: string) => {
  const params: any = {
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
      'tech_initials',
      'printed_fiche',
      'machine_id.id',
      'machine_id.code',
      'machine_id.name',
      'status_log.id',
      'status_log.date',
      'status_log.status_from.id',
      'status_log.status_from.value',
      'status_log.status_to.id',
      'status_log.status_to.value',
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
      'action.purchase_request_ids.purchase_request_id.id',
      'action.purchase_request_ids.purchase_request_id.stock_item_id.id',
      'action.purchase_request_ids.purchase_request_id.stock_item_id.ref',
      'action.purchase_request_ids.purchase_request_id.stock_item_id.supplier_refs_count',
      'action.purchase_request_ids.purchase_request_id.item_label',
      'action.purchase_request_ids.purchase_request_id.quantity',
      'action.purchase_request_ids.purchase_request_id.unit',
      'action.purchase_request_ids.purchase_request_id.urgency',
      'action.purchase_request_ids.purchase_request_id.requested_by',
      'action.purchase_request_ids.purchase_request_id.reason',
      'action.purchase_request_ids.purchase_request_id.notes',
      'action.purchase_request_ids.purchase_request_id.status',
      'action.purchase_request_ids.purchase_request_id.created_at',
      'action.purchase_request_ids.purchase_request_id.intervention_id',
    ].join(','),
    _t: Date.now(),
  };

  // Ajouter un filtre par machine_id si fourni
  if (machineId) {
    params.filter = JSON.stringify({
      machine_id: {
        id: {
          _eq: machineId
        }
      }
    });
  }

  const { data } = await api.get('/items/intervention', { params });
  return data.data;
};

/**
 * Create intervention (raw Directus response).
 */
export const createInterventionRaw = async (backendPayload: any) => {
  const response = await api.post('/items/intervention', backendPayload);
  return response.data.data;
};

/**
 * Update intervention (raw Directus response).
 */
export const updateInterventionRaw = async (interventionId: string, backendPayload: any) => {
  const response = await api.patch(`/items/intervention/${interventionId}`, backendPayload);
  return response.data.data;
};

/**
 * Create action (raw Directus response).
 */
export const createActionRaw = async (backendPayload: any) => {
  const response = await api.post('/items/intervention_action', backendPayload);
  return response.data.data;
};

/**
 * Create part (raw Directus response).
 */
export const createPartRaw = async (backendPayload: any) => {
  const response = await api.post('/items/intervention_parts', backendPayload);
  return response.data.data;
};

/**
 * Fetch status change history (raw Directus response).
 */
export const fetchInterventionStatusLogRaw = async (interventionId: string) => {
  const { data } = await api.get('/items/intervention_status_log', {
    params: {
      filter: {
        intervention_id: { _eq: interventionId },
      },
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
      sort: '-date',
      _t: Date.now(),
    },
  });
  return data.data;
};

/**
 * Fetch complexity factors (raw Directus response).
 */
export const fetchComplexityFactorsRaw = async () => {
  const { data } = await api.get('/items/complexity_factor', {
    params: {
      limit: -1,
      sort: 'label',
      fields: ['code', 'label', 'category'].join(','),
      _t: Date.now(),
    },
  });
  return data.data;
};

/**
 * Fetch action subcategories (raw Directus response).
 */
export const fetchActionSubcategoriesRaw = async () => {
  const { data } = await api.get('/items/ref_action_subcategory', {
    params: {
      limit: -1,
      sort: 'code',
      fields: ['id', 'code', 'name', 'category_id.code', 'category_id.name'].join(','),
      _t: Date.now(),
    },
  });
  return data.data;
};

/**
 * Fetch all actions (raw Directus response).
 */
export const fetchActionsRaw = async () => {
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
        'action_subcategory.code',
        'action_subcategory.name',
        'intervention_id.id',
        'intervention_id.code',
        'intervention_id.title',
      ].join(','),
      _t: Date.now(),
    },
  });
  return data.data;
};

/**
 * Fetch open and in-progress interventions (raw Directus response).
 */
export const fetchOpenInterventionsRaw = async () => {
  const { data } = await api.get('/items/intervention', {
    params: {
      filter: {
        status_actual: {
          value: { _in: ['ouvert', 'attente_pieces', 'attente_prod'] },
        },
      },
      sort: '-reported_date',
      _t: Date.now(),
    },
  });
  return data.data;
};
