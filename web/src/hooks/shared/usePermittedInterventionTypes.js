import { useEffect, useState } from 'react';
import { fetchPermittedInterventionTypes } from '@/api/interventions';

/**
 * Types actifs permis pour l'équipement choisi (ADR 0031), rechargés quand il change.
 * Renvoie null sans équipement ou tant que la liste n'est pas arrivée (ou en cas d'échec :
 * le serveur refusera de toute façon un type non permis).
 */
export function usePermittedInterventionTypes(equipementId) {
  const [state, setState] = useState({ id: null, types: null });
  useEffect(() => {
    if (!equipementId) return undefined;
    let cancelled = false;
    fetchPermittedInterventionTypes(equipementId)
      .then((types) => { if (!cancelled) setState({ id: equipementId, types }); })
      .catch(() => { if (!cancelled) setState({ id: equipementId, types: null }); });
    return () => { cancelled = true; };
  }, [equipementId]);
  // Une réponse d'un autre équipement ne doit pas servir pendant le rechargement
  return equipementId && state.id === equipementId ? state.types : null;
}
