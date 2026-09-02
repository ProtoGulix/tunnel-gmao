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
 * Référentiel des types de DI (standard, amelioration).
 * @returns {Promise<Array<{code: string, label: string, color: string, sort_order: number}>>}
 */
export async function fetchInterventionRequestTypes() {
  const response = await api.get('/intervention-requests/types');
  return response.data;
}

/**
 * Référentiel des catégories d'idées d'amélioration.
 * @returns {Promise<Array<{code: string, label: string, color: string, sort_order: number}>>}
 */
export async function fetchAmeliorationCategories() {
  const response = await api.get('/intervention-requests/amelioration-categories');
  return response.data;
}

/**
 * Référentiel des sous-statuts d'idées d'amélioration.
 * @returns {Promise<Array<{code: string, label: string, color: string, sort_order: number}>>}
 */
export async function fetchAmeliorationSousStatuts() {
  const response = await api.get('/intervention-requests/amelioration-sous-statuts');
  return response.data;
}

// Filtres optionnels de fetchInterventionRequests : clé JS → clé query API,
// avec un test de présence dédié (évite une longue chaîne de if en ligne).
const _LIST_OPTIONAL_FILTERS = [
  ['statut', 'statut', (v) => !!v],
  ['excludeStatuses', 'exclude_statuses', (v) => !!v],
  ['machineId', 'machine_id', (v) => !!v],
  ['isSystem', 'is_system', (v) => v !== undefined && v !== null],
  ['search', 'search', (v) => !!v?.trim()],
  ['type', 'type', (v) => !!v],
  ['sousStatut', 'sous_statut', (v) => !!v],
  ['site', 'site', (v) => !!v],
];

function buildListQueryParams(params) {
  const queryParams = {
    skip: params.skip ?? 0,
    limit: params.limit ?? 50,
  };
  for (const [srcKey, destKey, hasValue] of _LIST_OPTIONAL_FILTERS) {
    const value = params[srcKey];
    if (hasValue(value)) {
      queryParams[destKey] = srcKey === 'search' ? value.trim() : value;
    }
  }
  return queryParams;
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
 * @param {string} [params.type] - Filtrer par type(s) de DI, séparés par virgule (ex: 'amelioration')
 * @param {string} [params.sousStatut] - Filtrer par sous-statut(s), séparés par virgule
 * @param {string} [params.site] - Filtrer par code de site (machine racine), ex: 'VLT', 'SML'
 * @returns {Promise<{items: Array, pagination: Object, facets: Object}>}
 */
export async function fetchInterventionRequests(params = {}) {
  const queryParams = buildListQueryParams(params);
  const response = await api.get('/intervention-requests', { params: queryParams });
  const { items = [], pagination, facets } = response.data;
  return { items, pagination, facets };
}

/**
 * Met à jour partiellement les champs propres à une idée d'amélioration
 * (catégorie, priorité, sous_statut, porteur, deadline). Ne touche jamais
 * au statut générique du workflow DI — voir transitionInterventionRequest.
 *
 * @param {string} id - UUID de la demande
 * @param {Object} data
 * @param {string} [data.categorie] - Code catégorie
 * @param {string} [data.priorite] - 'basse' | 'moyenne' | 'haute'
 * @param {string} [data.sousStatut] - Code sous-statut
 * @param {string|null} [data.porteurId] - UUID du porteur (null pour retirer)
 * @param {string} [data.deadline] - Date YYYY-MM-DD
 * @returns {Promise<Object>} Demande mise à jour
 */
export async function patchAmelioration(id, data) {
  const payload = {};
  if ('categorie' in data) payload.categorie = data.categorie;
  if ('priorite' in data) payload.priorite = data.priorite;
  if ('sousStatut' in data) payload.sous_statut = data.sousStatut;
  if ('porteurId' in data) payload.porteur_id = data.porteurId;
  if ('deadline' in data) payload.deadline = data.deadline;

  const response = await api.patch(`/intervention-requests/${id}/amelioration`, payload);
  return response.data?.data ?? response.data;
}

/**
 * Récupère le détail complet d'une demande avec historique des transitions
 *
 * @param {string} id - UUID de la demande
 * @returns {Promise<Object>} Demande avec status_log
 */
export async function fetchInterventionRequest(id) {
  const response = await api.get(`/intervention-requests/${id}`);
  return response.data.data;
}

/**
 * Crée une nouvelle demande d'intervention
 *
 * @param {Object} data
 * @param {string} data.machineId - UUID de l'équipement
 * @param {string} data.demandeurNom - Nom du demandeur (requis)
 * @param {string} data.description - Description de l'intervention souhaitée (requis)
 * @param {string} [data.serviceId] - UUID du service/département du demandeur
 * @param {string} [data.type] - 'standard' (défaut) ou 'amelioration'
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
  if (data.type) {
    payload.type = data.type;
  }

  const response = await api.post('/intervention-requests', payload);
  return response.data?.data ?? response.data;
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
// Champs optionnels du payload de transition : clé JS → clé API, avec normalisation éventuelle
const _TRANSITION_OPTIONAL_FIELDS = [
  ['notes', 'notes', (v) => v?.trim() || null],
  ['changedBy', 'changed_by', (v) => v || null],
  ['typeInter', 'type_inter', (v) => v || null],
  ['techInitials', 'tech_initials', (v) => v?.trim() || null],
  ['priority', 'priority', (v) => v || null],
  ['reportedDate', 'reported_date', (v) => v || null],
  // reason_code/reason_text : fournis explicitement pour éviter de rouvrir le popup d'audit
  // quand on rejoue l'appel avec les notes après une 1ère découverte (voir doTransition).
  ['reasonCode', 'reason_code', (v) => v || null],
  ['reasonText', 'reason_text', (v) => v || null],
];

export async function transitionInterventionRequest(id, data) {
  const payload = { status_to: data.statusTo };

  for (const [srcKey, destKey, normalize] of _TRANSITION_OPTIONAL_FIELDS) {
    const value = normalize(data[srcKey]);
    if (value) payload[destKey] = value;
  }

  const response = await api.post(`/intervention-requests/${id}/transition`, payload);
  return response.data?.data ?? response.data;
}

/**
 * Supprime définitivement une demande d'intervention (erreur de saisie, doublon).
 * Refusé par le backend si une intervention est déjà liée à la demande.
 *
 * @param {string} id - UUID de la demande
 * @returns {Promise<void>}
 */
export async function deleteInterventionRequest(id) {
  await api.delete(`/intervention-requests/${id}`);
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
