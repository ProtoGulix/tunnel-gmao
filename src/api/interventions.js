/**
 * Interventions API Layer
 *
 * Appels HTTP bruts vers le backend Python.
 * Aucune logique métier, juste fetch + mapping snake_case → camelCase.
 */

import { api } from '@/lib/api/client';

/**
 * Récupère la liste des interventions avec filtres optionnels
 *
 * @param {Object} filters - Filtres optionnels
 * @param {number} [filters.skip=0] - Offset de pagination
 * @param {number} [filters.limit=1000] - Nombre max d'interventions
 * @param {string} [filters.equipementId] - Filtrer par équipement UUID
 * @param {string} [filters.status] - Filtrer par statut (csv: "ouvert,ferme")
 * @param {string} [filters.priority] - Filtrer par priorité (csv: "urgent,important")
 * @param {string} [filters.sort] - Tri (ex: "-priority,-reported_date")
 * @returns {Promise<Array>} Liste d'interventions
 */
// eslint-disable-next-line complexity
export async function fetchInterventions(filters = {}) {
  const params = {
    skip: filters.skip ?? 0,
    limit: filters.limit ?? 1000,
  };

  // Ajouter les filtres optionnels
  if (filters.equipementId) params.equipement_id = filters.equipementId;
  if (filters.status) params.status = filters.status;
  if (filters.priority) params.priority = filters.priority;
  if (filters.sort) params.sort = filters.sort;

  const response = await api.get('/interventions', { params });
  const list = Array.isArray(response.data) ? response.data : response.data?.data || [];

  return list.map(mapInterventionResponse);
}

/**
 * Récupère une intervention par ID avec actions et statusLogs complets
 *
 * @param {string} id - ID de l'intervention
 * @returns {Promise<Object>} Intervention complète
 */
export async function fetchIntervention(id) {
  const response = await api.get(`/interventions/${id}`);
  return mapInterventionDetailResponse(response.data);
}

/**
 * Crée une nouvelle intervention
 *
 * @param {Object} data - Données de la nouvelle intervention
 * @param {string} data.title - Titre de l'intervention
 * @param {string} data.type - Code type (CUR, PRE, REA, ...)
 * @param {string} data.priority - Priorité (urgent, important, normal, faible)
 * @param {string} data.equipementId - ID de l'équipement
 * @param {string} [data.reportedDate] - Date de signalement (ISO)
 * @returns {Promise<Object>} Intervention créée
 */
export async function createIntervention(data) {
  const payload = {
    machine_id: data.equipementId,
    type_inter: data.type,
    tech_initials: data.techInitials,
    title: data.title,
    priority: data.priority,
    status_actual: 'ouvert',
    reported_date: data.reportedDate
      ? new Date(data.reportedDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  };
  if (data.reportedBy) payload.reported_by = data.reportedBy;
  if (data.requestId) payload.request_id = data.requestId;
  const response = await api.post('/interventions', payload);
  return mapInterventionResponse(response.data);
}

/**
 * Met à jour une intervention
 *
 * @param {string} id - ID de l'intervention
 * @param {Object} updates - Champs à mettre à jour
 * @returns {Promise<Object>} Intervention mise à jour
 */
export async function updateIntervention(id, updates) {
  const payload = {};

  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.printedFiche !== undefined) payload.printed_fiche = updates.printedFiche;
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.status !== undefined) payload.status_actual = updates.status;

  const response = await api.put(`/interventions/${id}`, payload);
  return mapInterventionDetailResponse(response.data);
}

/**
 * Met à jour le statut d'une intervention
 *
 * @param {string} id - ID de l'intervention
 * @param {string} newStatus - Nouveau statut (ouvert, attente_pieces, attente_prod, ferme, cancelled)
 * @returns {Promise<Object>} Intervention mise à jour
 */
export async function updateInterventionStatus(id, newStatus) {
  return updateIntervention(id, { status: newStatus });
}

/**
 * Supprime une intervention.
 * Le backend rejette (400) si elle possède des actions ou des demandes d'achat.
 *
 * @param {string} id - ID de l'intervention
 * @returns {Promise<void>}
 */
export async function deleteIntervention(id) {
  await api.delete(`/interventions/${id}`);
}

/**
 * Récupère le PDF d'une intervention pour preview (blob URL)
 *
 * @param {string} id - ID de l'intervention
 * @returns {Promise<string>} Blob URL pour affichage dans iframe/object
 */
export async function fetchInterventionPdf(id) {
  const response = await api.get(`/exports/interventions/${id}/pdf`, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'application/pdf' });
  return window.URL.createObjectURL(blob);
}

/**
 * Mappe une intervention du backend (snake_case) vers le front (camelCase)
 */
// eslint-disable-next-line complexity
function mapInterventionResponse(raw = {}) {
  // Gère à la fois les anciennes strings et les nouveaux objets
  const typeCode =
    typeof raw.type_inter === 'string' ? raw.type_inter : raw.type_inter?.code || raw.type || 'CUR';

  return {
    id: raw.id?.toString() || '',
    code: raw.code || '',
    title: raw.title || '',
    status: raw.status_actual || raw.status || '',
    type: typeCode,
    priority: raw.priority || 'normal',
    reportedDate: raw.reported_date,
    printedFiche: raw.printed_fiche ?? false,
    techInitials: raw.tech_initials || '',
    reportedBy: raw.reported_by || '',
    machine: raw.equipements
      ? {
          id: raw.equipements.id?.toString() || '',
          code: raw.equipements.code || '',
          name: raw.equipements.name || raw.equipements.code || 'Équipement',
          health: {
            level: raw.equipements.health?.level || 'ok',
            reason: raw.equipements.health?.reason || '',
          },
        }
      : null,
    stats: raw.stats
      ? {
          actionCount: raw.stats.action_count ?? 0,
          totalTime: raw.stats.total_time ?? 0,
          avgComplexity: raw.stats.avg_complexity ?? 0,
          purchaseCount: raw.stats.purchase_count ?? 0,
        }
      : null,
  };
}

/**
 * Mappe une intervention détaillée avec actions et statusLogs
 */
/* eslint-disable complexity */
function mapInterventionDetailResponse(raw = {}) {
  const base = mapInterventionResponse(raw);

  return {
    ...base,
    action: Array.isArray(raw.actions)
      ? raw.actions.map((a) => ({
          id: a.id?.toString() || '',
          description: a.description || '',
          timeSpent: a.time_spent ?? 0,
          complexityScore: a.complexity_score ?? null,
          createdAt: a.created_at,
          date: a.date,
          subcategory: a.subcategory
            ? {
                id: a.subcategory.id?.toString() || '',
                label: a.subcategory.label || '',
                code: a.subcategory.code || '',
                category: a.subcategory.category
                  ? {
                      id: a.subcategory.category.id?.toString() || '',
                      label: a.subcategory.category.label || '',
                      code: a.subcategory.category.code || '',
                    }
                  : null,
              }
            : null,
          technician: a.technician
            ? {
                id: a.technician.id?.toString() || '',
                firstName: a.technician.first_name || '',
                lastName: a.technician.last_name || '',
              }
            : null,
        }))
      : [],
    statusLogs: Array.isArray(raw.status_logs)
      ? raw.status_logs.map((log) => ({
          id: log.id?.toString() || '',
          date: log.date,
          status_from_detail: log.status_from_detail
            ? {
                id: log.status_from_detail.id || '',
                label: log.status_from_detail.label || '',
              }
            : null,
          status_to_detail: log.status_to_detail
            ? {
                id: log.status_to_detail.id || '',
                label: log.status_to_detail.label || '',
              }
            : null,
          technician: log.technician
            ? {
                id: log.technician.id?.toString() || '',
                firstName: log.technician.first_name || '',
                lastName: log.technician.last_name || '',
              }
            : null,
        }))
      : [],
    request: raw.request
      ? {
          id: raw.request.id,
          code: raw.request.code,
          demandeurNom: raw.request.demandeur_nom,
          demandeurService: raw.request.demandeur_service || null,
          description: raw.request.description,
          statut: raw.request.statut,
          statutLabel: raw.request.statut_label,
          statutColor: raw.request.statut_color,
          createdAt: raw.request.created_at,
        }
      : null,
  };
}
