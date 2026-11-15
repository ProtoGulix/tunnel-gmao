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
 * @param {string} [params.subtreeOf] - UUID : retourne tout le sous-arbre de cet équipement
 * @param {boolean} [params.rootsOnly] - Uniquement les équipements sans parent
 * @param {'health'|'code'} [params.sort] - Tri (défaut serveur : health)
 * @returns {Promise<{ items: Array, pagination: Object, facets: Object }>}
 */
export async function fetchEquipements(params = {}) {
  const queryParams = { skip: params.skip ?? 0, limit: params.limit ?? 50 };
  const optional = {
    search: params.search?.trim(),
    select_class: params.selectClass,
    exclude_class: params.excludeClass,
    select_mere: params.selectMere,
    subtree_of: params.subtreeOf,
    roots_only: params.rootsOnly || undefined,
    sort: params.sort,
  };
  Object.entries(optional).forEach(([key, value]) => {
    if (value) queryParams[key] = value;
  });

  const response = await api.get('/equipements', { params: queryParams });
  return response.data;
}

/**
 * Récupère le détail d'un équipement
 * @param {string} id - ID de l'équipement
 * @param {Object} [params] - Paramètres optionnels
 * @param {number} [params.interventions_page] - Page des interventions
 * @param {number} [params.interventions_limit] - Limite par page
 * @param {boolean} [params.include_descendants] - Inclure l'activité des sous-équipements (défaut serveur : vrai si l'équipement a des filles)
 * @returns {Promise<Object>} Détail de l'équipement
 */
export async function fetchEquipementById(id, params = {}) {
  const response = await api.get(`/equipements/${id}`, { params });
  return response.data;
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
  return response.data;
}

/**
 * Met à jour partiellement un équipement (PATCH)
 * @param {string} id - ID de l'équipement
 * @param {Object} updates - Champs à mettre à jour (seuls les champs envoyés sont modifiés)
 * @returns {Promise<Object>} Équipement mis à jour
 */
export async function patchEquipement(id, updates) {
  const response = await api.patch(`/equipements/${id}`, updates);
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
