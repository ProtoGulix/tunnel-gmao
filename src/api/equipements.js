/**
 * @fileoverview API des équipements
 * @module api/equipements
 *
 * Appels HTTP bruts pour gérer les équipements (parc, santé, hiérarchie)
 */

import { api } from '@/lib/api/client';

/**
 * Liste les équipements avec pagination serveur, recherche et filtres
 * @param {Object} [params]
 * @param {string} [params.search] - Recherche sur code, name, affectation
 * @param {number} [params.skip] - Offset
 * @param {number} [params.limit] - Taille de page (max 500)
 * @param {string} [params.selectClass] - Codes de classes à inclure (filtre exclusif, csv)
 * @param {string} [params.excludeClass] - Codes de classes à exclure (csv)
 * @param {string} [params.selectMere] - UUID du parent : retourne uniquement ses enfants directs
 * @returns {Promise<{ items: Array, pagination: Object, facets: Object }>}
 */
export async function fetchEquipements(params = {}) {
  const queryParams = {
    skip: params.skip ?? 0,
    limit: params.limit ?? 50,
  };
  if (params.search?.trim()) queryParams.search = params.search.trim();
  if (params.selectClass) queryParams.select_class = params.selectClass;
  if (params.excludeClass) queryParams.exclude_class = params.excludeClass;
  if (params.selectMere) queryParams.select_mere = params.selectMere;

  const response = await api.get('/equipements', { params: queryParams });
  return response.data;
}

/**
 * Récupère le détail d'un équipement
 * @param {string} id - ID de l'équipement
 * @param {Object} [params] - Paramètres optionnels
 * @param {number} [params.interventions_page] - Page des interventions
 * @param {number} [params.interventions_limit] - Limite par page
 * @returns {Promise<Object>} Détail de l'équipement
 */
export async function fetchEquipementById(id, params = {}) {
  const response = await api.get(`/equipements/${id}`, { params });
  return response.data.data;
}

/**
 * Crée un équipement
 * @param {Object} data - Données de l'équipement
 * @param {string} data.name - Nom de l'équipement
 * @param {string} [data.code] - Code unique
 * @param {string} [data.parent_id] - ID de l'équipement parent
 * @param {string} [data.equipement_class_id] - ID de la classe
 * @returns {Promise<Object>} Équipement créé
 */
export async function createEquipement(data) {
  const response = await api.post('/equipements', data);
  return response.data.data;
}

/**
 * Met à jour partiellement un équipement (PATCH)
 * @param {string} id - ID de l'équipement
 * @param {Object} updates - Champs à mettre à jour (seuls les champs envoyés sont modifiés)
 * @returns {Promise<Object>} Équipement mis à jour
 */
export async function patchEquipement(id, updates) {
  const response = await api.patch(`/equipements/${id}`, updates);
  return response.data.data;
}

/**
 * Remplace complètement un équipement (PUT — name obligatoire)
 * @param {string} id - ID de l'équipement
 * @param {Object} updates - Corps complet
 * @returns {Promise<Object>} Équipement mis à jour
 */
export async function updateEquipement(id, updates) {
  const response = await api.put(`/equipements/${id}`, updates);
  return response.data.data;
}

/**
 * Supprime un équipement
 * @param {string} id - ID de l'équipement
 * @returns {Promise<void>}
 */
export async function deleteEquipement(id) {
  await api.delete(`/equipements/${id}`);
}

/**
 * Récupère les statistiques d'un équipement
 * @param {string} id - ID de l'équipement
 * @param {Object} [params] - Paramètres optionnels
 * @param {string} [params.start_date] - Date de début
 * @param {string} [params.end_date] - Date de fin
 * @returns {Promise<Object>} Statistiques de l'équipement
 */
export async function fetchEquipementStats(id, params = {}) {
  const response = await api.get(`/equipements/${id}/stats`, { params });
  return response.data.data;
}

/**
 * Récupère l'état de santé d'un équipement (ultra-léger)
 * @param {string} id - ID de l'équipement
 * @returns {Promise<Object>} État de santé { level, reason }
 */
export async function fetchEquipementHealth(id) {
  const response = await api.get(`/equipements/${id}/health`);
  return response.data.data;
}

/**
 * Récupère la liste paginée des enfants d'un équipement
 * @param {string} id - ID de l'équipement parent
 * @param {Object} [params] - Paramètres optionnels
 * @param {number} [params.page] - Numéro de page
 * @param {number} [params.limit] - Limite par page (max 100)
 * @param {string} [params.search] - Filtre sur code ou name
 * @returns {Promise<Object>} Liste paginée { total, page, page_size, total_pages, items }
 */
export async function fetchEquipementChildren(id, params = {}) {
  const response = await api.get(`/equipements/${id}/children`, { params });
  return response.data;
}

/**
 * Récupère les statuts du cycle de vie des équipements
 * @returns {Promise<Array>} Liste des statuts actifs triés par ordre_affichage
 */
export async function fetchEquipementStatuts() {
  const response = await api.get('/equipement-statuts');
  return response.data || [];
}
