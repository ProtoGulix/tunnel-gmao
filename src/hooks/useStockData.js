import { useMemo } from "react";

/**
 * Hook pour calculer les statistiques des demandes d'achat
 * Utilisé dans la page Procurement pour afficher les compteurs
 */
export function useRequestStats(requests) {
  return useMemo(() => {
    const urgent = requests.filter(
      (r) => r.urgency === "high" && r.status?.id !== "received"
    ).length;
    const noRef = requests.filter((r) => !r.stock_item_id).length;
    const pending = requests.filter(
      (r) => r.status?.id === "open" || !r.status
    ).length;
    return {
      total: requests.length,
      urgent,
      noRef,
      pending,
    };
  }, [requests]);
}
