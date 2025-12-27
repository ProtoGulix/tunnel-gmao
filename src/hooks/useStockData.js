import { useMemo } from "react";

export function useStockStats(stockItems) {
  return useMemo(() => {
    const lowStock = stockItems.filter(
      (item) => item.current_stock <= item.min_stock
    ).length;
    const totalValue = stockItems.reduce(
      (sum, item) => sum + (item.current_stock || 0),
      0
    );
    return {
      total: stockItems.length,
      lowStock,
      totalValue,
    };
  }, [stockItems]);
}

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

export function useCategories(items) {
  return useMemo(() => {
    const cats = new Set(items.map((item) => item.category).filter(Boolean));
    return ["all", ...Array.from(cats)];
  }, [items]);
}

export function useAvailableStatuses(requests) {
  return useMemo(() => {
    const statusMap = new Map();
    requests.forEach((req) => {
      if (req.status) {
        statusMap.set(req.status.id, req.status);
      }
    });
    return Array.from(statusMap.values());
  }, [requests]);
}
