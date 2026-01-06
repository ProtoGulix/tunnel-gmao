/**
 * @fileoverview Hook pour consommer l'adapter de préconisations préventives
 * @module src/hooks/usePreventiveSuggestions
 * @requires react
 * @requires src/hooks/useApiCall
 * @requires src/lib/api/facade
 *
 * Hook réutilisable pour récupérer les préconisations d'une machine
 * Pattern : utilise useApiCall pour gestion cohérente données/erreurs
 */

import { useApiCall } from '@/hooks/useApiCall';
import { preventive } from '@/lib/api/facade';

/**
 * Hook pour récupérer les préconisations préventives d'une machine
 *
 * @param {string} [machineId] - UUID de la machine (optionnel)
 * @param {string} [status='NEW'] - Statut à filtrer
 * @returns {Object} État des données
 * @returns {Array} suggestions - Liste des préconisations
 * @returns {boolean} loading - En cours de chargement
 * @returns {Error} error - Erreur API si présente
 * @returns {Function} refresh - Fonction pour relancer la requête
 *
 * @example
 * const { suggestions, loading, error, refresh } = usePreventiveSuggestions(machineId);
 *
 * if (loading) return <div>Chargement...</div>;
 * if (error) return <div>Erreur: {error.message}</div>;
 *
 * return (
 *   <div>
 *     {suggestions.map(s => (
 *       <div key={s.id}>{s.preventive_label}</div>
 *     ))}
 *     <button onClick={refresh}>Rafraîchir</button>
 *   </div>
 * );
 */
export function usePreventiveSuggestions(machineId, status = 'NEW') {
  const { data, loading, error, execute } = useApiCall(
    () => preventive.fetchPreventiveSuggestions(machineId, status),
    {
      autoExecute: !!machineId, // Ne lancer que si machineId fourni
    }
  );

  return {
    suggestions: data || [],
    loading,
    error,
    refresh: execute,
  };
}
