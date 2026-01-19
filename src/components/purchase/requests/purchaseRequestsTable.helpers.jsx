import { Package } from "lucide-react";
import { Button } from "@radix-ui/themes";
import { COLOR_USAGE } from "@/config/colorPalette";

// Couleurs d'âge basées sur la palette achats/urgence
export const AGE_COLORS = {
  recent: "transparent",
  warning: COLOR_USAGE?.urgency?.normal || "var(--amber-2)",
  danger: COLOR_USAGE?.urgency?.high || "var(--red-2)",
};

export const getAgeColor = (days) => {
  if (days < 2) return AGE_COLORS.recent;
  if (days <= 5) return AGE_COLORS.warning;
  return AGE_COLORS.danger;
};

const getCompletenessScore = (request) => {
  let score = 0;
  const hasLink = !!request.stockItemId;
  const hasRef = !!request.stockItemRef;
  const hasSupplier = (request.stockItemSupplierRefsCount ?? 0) > 0;
  if (hasLink) score += 100;
  if (hasRef) score += 100;
  if (hasSupplier) score += 100;
  return score;
};

const getStatusPriority = (status) => {
  const statusId = typeof status === "string" ? status : status?.id;
  if (statusId === "received" || statusId === "ordered") return 3;
  if (statusId === "in_progress") return 2;
  return 0;
};

export const sortRequests = (requests, getAgeDays) => {
  return [...requests].sort((a, b) => {
    const statusPrioA = getStatusPriority(a.status);
    const statusPrioB = getStatusPriority(b.status);
    if (statusPrioA !== statusPrioB) return statusPrioA - statusPrioB;

    const scoreA = getCompletenessScore(a);
    const scoreB = getCompletenessScore(b);
    if (scoreA !== scoreB) return scoreA - scoreB;

    const ageA = getAgeDays(a.createdAt);
    const ageB = getAgeDays(b.createdAt);
    return ageB - ageA;
  });
};

export const COLUMNS = [
  { key: "item", header: "Article" },
  { key: "state", header: "État" },
  { key: "urgency", header: "Urgence" },
  { key: "ref", header: "Référence" },
  { key: "qty", header: "Qté" },
  { key: "age", header: "Âge (j)" },
  { key: "action", header: "Action" },
];
