import * as refApi from '@/api/adminReferentiel';
import { useFetchList } from '@/hooks/shared/useFetchList';

const make = (fetchFn, errMsg) => () => {
  const { items, setItems, loading, error, refresh } = useFetchList(fetchFn, errMsg);
  return { items, setItems, loading, error, refresh };
};

export const useActionCategories = make(
  refApi.fetchActionCategories,
  'Erreur chargement catégories'
);

export const useActionSubcategories = make(
  refApi.fetchActionSubcategories,
  'Erreur chargement sous-catégories'
);

export const useComplexityFactors = make(
  refApi.fetchComplexityFactors,
  'Erreur chargement facteurs de complexité'
);

export const useInterventionTypes = make(
  refApi.fetchInterventionTypes,
  "Erreur chargement types d'intervention"
);

export const useInterventionStatuses = make(
  refApi.fetchInterventionStatuses,
  'Erreur chargement statuts'
);

export const useEquipementClasses = make(
  refApi.fetchEquipementClasses,
  "Erreur chargement classes d'équipement"
);
