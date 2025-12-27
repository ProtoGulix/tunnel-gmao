import { useMemo } from "react";

const normalizeText = (text) => {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export function useStockFilters(stockItems, searchTerm, categoryFilter) {
  return useMemo(() => {
    return stockItems.filter((item) => {
      const matchSearch =
        searchTerm === "" ||
        normalizeText((item.name || "").toLowerCase()).includes(
          normalizeText(searchTerm.toLowerCase())
        ) ||
        normalizeText((item.ref || "").toLowerCase()).includes(
          normalizeText(searchTerm.toLowerCase())
        );

      const matchCategory =
        categoryFilter === "all" || item.category === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [stockItems, searchTerm, categoryFilter]);
}

export function usePurchaseRequestFilters(
  requests,
  searchTerm,
  urgencyFilter,
  statusFilter
) {
  return useMemo(() => {
    return requests.filter((req) => {
      const matchSearch =
        searchTerm === "" ||
        req.item_label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.requested_by?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchUrgency =
        urgencyFilter === "all" || req.urgency === urgencyFilter;
      
      // status est une chaîne de caractères directe dans la base
      const statusId = typeof req.status === 'string' ? req.status : req.status?.id;
      const matchStatus = statusFilter === "all" || statusId === statusFilter;

      return matchSearch && matchUrgency && matchStatus;
    });
  }, [requests, searchTerm, urgencyFilter, statusFilter]);
}
