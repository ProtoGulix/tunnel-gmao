/**
 * @fileoverview API des équipements
 * @module api/equipements
 *
 * Appels HTTP bruts pour gérer les équipements (parc, santé, hiérarchie)
 */

import { api } from '@/lib/api/client';

/**
 * Liste tous les équipements avec état de santé
 * @returns {Promise<Array>} Liste des équipements
 */
export async function fetchEquipements() {
  const response = await api.get('/equipements');
  return response.data;
}

/**
 * Récupère le détail d'un équipement
 * @param {string} id - ID de l'équipement
 * @returns {Promise<Object>} Détail de l'équipement
 */
export async function fetchEquipementById(id) {
  const response = await api.get(`/equipements/${id}`);
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
 * Met à jour un équipement
 * @param {string} id - ID de l'équipement
 * @param {Object} updates - Champs à mettre à jour
 * @returns {Promise<Object>} Équipement mis à jour
 */
export async function updateEquipement(id, updates) {
  const response = await api.put(`/equipements/${id}`, updates);
  return response.data;
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
  return response.data;
}

/**
 * Récupère l'état de santé d'un équipement (ultra-léger)
 * @param {string} id - ID de l'équipement
 * @returns {Promise<Object>} État de santé { level, reason }
 */
export async function fetchEquipementHealth(id) {
  const response = await api.get(`/equipements/${id}/health`);
  return response.data;
}
