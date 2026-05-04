/**
 * Intervention Requests API Layer
 *
 * Appels HTTP bruts vers /intervention-requests.
 * Aucune logique métier — le backend retourne les données prêtes à l'emploi.
 */

import { api } from '@/lib/api/client';

/**
 * Récupère le référentiel des statuts de demande
 * @returns {Promise<Array<{code: string, label: string, color: string, sort_order: number}>>}
 */
export async function fetchInterventionRequestStatuses() {
  const response = await api.get('/intervention-requests/statuses');
  return response.data;
}

/**
 * Récupère la liste paginée des demandes d'intervention
 *
 * @param {Object} [params]
 * @param {number} [params.skip=0] - Offset de pagination
 * @param {number} [params.limit=50] - Nombre de résultats (max 500)
 * @param {string} [params.statut] - Filtrer par code statut
 * @param {string} [params.machineId] - Filtrer par UUID équipement
 * @param {string} [params.search] - Recherche libre (code, demandeur_nom, description)
 * @returns {Promise<{items: Array, pagination: Object, facets: Object}>}
 */
export async function fetchInterventionRequests(params = {}) {
  const queryParams = {
    skip: params.skip ?? 0,
    limit: params.limit ?? 50,
  };

  if (params.statut) queryParams.statut = params.statut;
  if (params.excludeStatuses) queryParams.exclude_statuses = params.excludeStatuses;
  if (params.machineId) queryParams.machine_id = params.machineId;
  if (params.isSystem !== undefined && params.isSystem !== null) queryParams.is_system = params.isSystem;
  if (params.search?.trim()) queryParams.search = params.search.trim();

  const response = await api.get('/intervention-requests', { params: queryParams });
  return response.data;
}

/**
 * Récupère le détail complet d'une demande avec historique des transitions
 *
 * @param {string} id - UUID de la demande
 * @returns {Promise<Object>} Demande avec status_log
 */
export async function fetchInterventionRequest(id) {
  const response = await api.get(`/intervention-requests/${id}`);
  return response.data;
}

/**
 * Crée une nouvelle demande d'intervention
 *
 * @param {Object} data
 * @param {string} data.machineId - UUID de l'équipement
 * @param {string} data.demandeurNom - Nom du demandeur (requis)
 * @param {string} data.description - Description de l'intervention souhaitée (requis)
 * @param {string} [data.serviceId] - UUID du service/département du demandeur
 * @returns {Promise<Object>} Demande créée avec code et statut initial
 */
export async function createInterventionRequest(data) {
  const payload = {
    machine_id: data.machineId,
    demandeur_nom: data.demandeurNom,
    description: data.description,
  };

  if (data.serviceId) {
    payload.service_id = data.serviceId;
  }

  const response = await api.post('/intervention-requests', payload);
  return response.data;
}

/**
 * Effectue une transition de statut sur une demande
 *
 * @param {string} id - UUID de la demande
 * @param {Object} data
 * @param {string} data.statusTo - Code du statut cible
 * @param {string} [data.notes] - Notes (obligatoire si statusTo === 'rejetee')
 * @param {string} [data.changedBy] - UUID utilisateur Directus
 * @param {string} [data.typeInter] - Type d'intervention (obligatoire si statusTo === 'acceptee')
 * @param {string} [data.techInitials] - Initiales du technicien (obligatoire si statusTo === 'acceptee')
 * @param {string} [data.priority] - Priorité : 'faible', 'normale', 'important', 'urgent'
 * @param {string} [data.reportedDate] - Date de signalement (YYYY-MM-DD)
 * @returns {Promise<Object>} Demande mise à jour avec status_log actualisé
 */
export async function transitionInterventionRequest(id, data) {
  const payload = { status_to: data.statusTo };

  if (data.notes?.trim()) payload.notes = data.notes.trim();
  if (data.changedBy) payload.changed_by = data.changedBy;
  if (data.typeInter) payload.type_inter = data.typeInter;
  if (data.techInitials?.trim()) payload.tech_initials = data.techInitials.trim();
  if (data.priority) payload.priority = data.priority;
  if (data.reportedDate) payload.reported_date = data.reportedDate;

  const response = await api.post(`/intervention-requests/${id}/transition`, payload);
  return response.data;
}

/**
 * Outil de maintenance : clôture toutes les DIs en statut `acceptee`
 * dont l'intervention liée est déjà fermée (correction de données historiques).
 *
 * Idempotent — peut être appelé plusieurs fois sans effet secondaire.
 *
 * @returns {Promise<{repaired_count: number, details: Array<{id: string, code: string, machine_code: string}>}>}
 */
export async function repairInterventionRequests() {
  const response = await api.post('/intervention-requests/repair');
  return response.data;
}
