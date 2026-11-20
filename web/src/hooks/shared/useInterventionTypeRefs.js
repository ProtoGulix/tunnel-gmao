import { useEffect, useSyncExternalStore } from 'react';
import { fetchInterventionTypeRefs } from '@/api/interventions';
import { createTypesStore, labelOf, colorOf } from '@/lib/interventionTypesStore';

const store = createTypesStore(fetchInterventionTypeRefs);

/** Pour le code hors composant (rendu déjà abonné via le hook) : repli sur le code brut */
export const getTypeLabel = (code) => labelOf(store.getSnapshot(), code);
export const getTypeColor = (code) => colorOf(store.getSnapshot(), code);

/** À appeler après une modification d'un type (administration) : les écrans lisent la nouvelle liste */
export const reloadInterventionTypeRefs = () => store.reload();

/**
 * Types d'intervention de la base, chargés une fois pour toute l'application.
 * `types` contient aussi les inactifs (historique) ; `activeTypes` sert aux sélecteurs de création.
 */
export function useInterventionTypeRefs() {
  const types = useSyncExternalStore(store.subscribe, store.getSnapshot);
  useEffect(() => { store.load(); }, []);
  return {
    types,
    activeTypes: types.filter((t) => t.is_active !== false),
    labelOf: (code) => labelOf(types, code),
    colorOf: (code) => colorOf(types, code),
  };
}
