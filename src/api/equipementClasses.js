/**
 * @fileoverview API des classes d'équipement
 * @module api/equipementClasses
 *
 * Appels HTTP bruts pour gérer les classes d'équipement (SCIE, EXTRUDEUSE, etc.)
 */

import { api } from '@/lib/api/client';

/**
 * Liste toutes les classes d'équipement
 * @returns {Promise<Array>} Liste des classes
 */
export async function fetchEquipementClasses() {
  const response = await api.get('/equipement-class');
  return response.data;
}

/**
 * Récupère le détail d'une classe
 * @param {string} id - ID de la classe
 * @returns {Promise<Object>} Détail de la classe
 */
export async function fetchEquipementClassById(id) {
  const response = await api.get(`/equipement-class/${id}`);
  return response.data;
}

/**
 * Crée une classe d'équipement
 * @param {Object} data - Données de la classe
 * @param {string} data.code - Code unique (ex: SCIE, PONT)
 * @param {string} data.label - Libellé
 * @param {string} [data.description] - Description optionnelle
 * @returns {Promise<Object>} Classe créée
 */
export async function createEquipementClass(data) {
  const response = await api.post('/equipement-class', data);
  return response.data;
}

/**
 * Met à jour une classe d'équipement
 * @param {string} id - ID de la classe
 * @param {Object} updates - Champs à mettre à jour
 * @returns {Promise<Object>} Classe mise à jour
 */
export async function updateEquipementClass(id, updates) {
  const response = await api.patch(`/equipement-class/${id}`, updates);
  return response.data;
}

/**
 * Supprime une classe d'équipement
 * @param {string} id - ID de la classe
 * @returns {Promise<void>}
 * @throws {Error} 409 si la classe est utilisée par des équipements
 */
export async function deleteEquipementClass(id) {
  await api.delete(`/equipement-class/${id}`);
}
