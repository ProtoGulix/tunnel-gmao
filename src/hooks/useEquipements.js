/**
 * @fileoverview Hook pour gérer le cache des équipements et la résolution des hiérarchies
 * @module useEquipements
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useApiCall } from '@/hooks/useApiCall';
import { getApiAdapter } from '@/lib/api/adapters/provider';

const adapter = getApiAdapter();

/**
 * Hook pour gérer le cache global des équipements
 * Cache chargé une seule fois au montage du module
 * Usages : résolution parent_id → code/name, résolution children_ids
 *
 * @returns {Object} { equipements, equipementMap, getParentInfo, getChildrenInfo, loading, error }
 */
export function useEquipements() {
  const initialLoadRef = useRef(false);

  const {
    data: rawEquipements,
    loading,
    error,
    execute,
  } = useApiCall(adapter.equipements.fetchEquipements, {
    autoExecute: false,
  });

  // S'assurer que equipements est toujours un array
  const equipements = Array.isArray(rawEquipements) ? rawEquipements : [];

  // Charger une seule fois au montage
  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    execute();
  }, [execute]);

  // Map id → équipement pour résolution rapide
  const equipementMap = useMemo(() => {
    const map = {};
    equipements.forEach((eq) => {
      map[eq.id] = eq;
    });
    return map;
  }, [equipements]);

  /**
   * Résout les infos de l'équipement mère
   * @param {string} parentId - UUID du parent
   * @returns {Object|null} { id, code, name } ou null
   */
  const getParentInfo = useCallback(
    (parentId) => {
      if (!parentId) return null;
      const parent = equipementMap[parentId];
      return parent
        ? {
            id: parent.id,
            code: parent.code,
            name: parent.name,
          }
        : null;
    },
    [equipementMap]
  );

  /**
   * Résout les infos des équipements enfants
   * @param {string[]} childrenIds - UUIDs des enfants
   * @returns {Object[]} Array de { id, code, name }
   */
  const getChildrenInfo = useCallback(
    (childrenIds) => {
      if (!Array.isArray(childrenIds) || childrenIds.length === 0) {
        return [];
      }
      return childrenIds
        .map((id) => equipementMap[id])
        .filter(Boolean)
        .map((eq) => ({
          id: eq.id,
          code: eq.code,
          name: eq.name,
        }));
    },
    [equipementMap]
  );

  return {
    equipements,
    equipementMap,
    getParentInfo,
    getChildrenInfo,
    loading,
    error,
  };
}

export default useEquipements;
