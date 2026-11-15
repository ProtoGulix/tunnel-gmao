/**
 * @fileoverview API des classes d'équipement
 * @module api/equipementClasses
 *
 * Lecture des classes d'équipement (SCIE, EXTRUDEUSE, etc.). L'écriture est dans api/adminReferentiel.js.
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
