/**
 * @fileoverview Listes paginées (demandes ouvertes, interventions) de la section Activité d'un équipement
 * @module hooks/equipements/useEquipementActivity
 */

import { fetchInterventionRequests } from '@/api/intervention-requests';
import { fetchInterventionsPage } from '@/api/interventions';
import { usePagedList, PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/hooks/shared/usePagedList';

export const ACTIVITY_PAGE_SIZE = PAGE_SIZE;
export const ACTIVITY_PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS;

const REQUESTS_ERROR = 'Erreur lors du chargement des demandes';
const INTERVENTIONS_ERROR = "Erreur lors du chargement des interventions";

/**
 * @param {string} equipementId
 * @param {boolean} includeDescendants
 * @returns {{ requests: Object, interventions: Object }} chacune : { items, total, loading, error, page, pageSize, setPage, setPageSize }
 */
export function useEquipementActivity(equipementId, includeDescendants) {
  const key = `${equipementId}|${includeDescendants}`;

  const requests = usePagedList(
    key,
    (skip, limit) => fetchInterventionRequests({
      machineId: equipementId,
      includeDescendants,
      excludeStatuses: 'rejetee,cloturee',
      skip,
      limit,
    }),
    REQUESTS_ERROR,
  );

  const interventions = usePagedList(
    key,
    (skip, limit) => fetchInterventionsPage({
      equipementId,
      includeDescendants,
      sort: '-reported_date',
      skip,
      limit,
    }),
    INTERVENTIONS_ERROR,
  );

  return { requests, interventions };
}
