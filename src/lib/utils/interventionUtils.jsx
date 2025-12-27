import {
  INTERVENTION_TYPES,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
} from "@/config/interventionTypes";

/**
 * Obtient le badge de statut avec fallback
 */
export function getStatusBadge(statusId) {
  if (!statusId) {
    return { label: "Inconnu", color: "gray" };
  }

  const statusConfig = STATUS_CONFIG[statusId];
  if (statusConfig) {
    return {
      label: statusConfig.value || statusConfig.label,
      color: statusConfig.color,
    };
  }

  return {
    label:
      statusId.replace(/_/g, " ").charAt(0).toUpperCase() +
      statusId.replace(/_/g, " ").slice(1),
    color: "gray",
  };
}

/**
 * Obtient le badge de priorité
 */
export function getPriorityBadge(priority) {
  if (!priority) {
    return { label: "Non défini", color: "gray" };
  }

  const priorityLower = priority.toLowerCase();
  const priorityConfig = PRIORITY_CONFIG[priorityLower];

  if (priorityConfig) {
    return {
      label: priority,
      color: priorityConfig.color,
      icon: priorityConfig.icon,
    };
  }

  return { label: priority, color: "gray" };
}

/**
 * Obtient le badge de type d'intervention
 */
export function getTypeBadge(type) {
  if (!type) {
    return { label: "N/A", color: "gray" };
  }

  const typeConfig = INTERVENTION_TYPES.find(
    (t) => t.id === type.toUpperCase()
  );
  if (typeConfig) {
    return { label: typeConfig.label, color: typeConfig.color };
  }

  return { label: type, color: "gray" };
}

/**
 * Formate la date d'intervention
 */
export function formatInterventionDate(dateString) {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Vérifie si une intervention est ouverte
 */
export function isInterventionOpen(intervention) {
  const statusId = intervention.status_actual?.id;
  return statusId !== "ferme";
}

/**
 * Calcule les statistiques des interventions
 */
export function calculateInterventionStats(interventions) {
  const active = interventions.filter(isInterventionOpen);
  const closed = interventions.filter((i) => !isInterventionOpen(i));

  // Par type
  const byType = INTERVENTION_TYPES.map((type) => {
    const count = active.filter(
      (i) => i.type_inter?.toUpperCase() === type.id
    ).length;
    return count > 0
      ? {
          id: type.id,
          label: type.label,
          count,
          color: type.color,
        }
      : null;
  }).filter(Boolean);

  // Urgentes
  const urgent = active.filter(
    (i) => i.priority?.toLowerCase() === "urgent"
  ).length;

  // Pourcentage fermées
  const closedPercent =
    interventions.length > 0
      ? Math.round((closed.length / interventions.length) * 100)
      : 0;

  return {
    total: interventions.length,
    active: active.length,
    closed: closed.length,
    closedPercent,
    urgent,
    byType,
  };
}

/**
 * Filtre les interventions
 */
export function filterInterventions(interventions, filters) {
  return interventions.filter((intervention) => {
    // Filtre machine
    if (filters.machine && intervention.machine_id?.id !== filters.machine) {
      return false;
    }

    // Filtre type
    if (
      filters.type &&
      intervention.type_inter?.toUpperCase() !== filters.type
    ) {
      return false;
    }

    // Filtre statut
    if (filters.status && intervention.status_actual?.id !== filters.status) {
      return false;
    }

    // Filtre priorité
    if (
      filters.priority &&
      intervention.priority?.toLowerCase() !== filters.priority.toLowerCase()
    ) {
      return false;
    }

    return true;
  });
}

/**
 * Calcule le style d'un bouton de sélection selon son état
 */
export const getSelectionButtonStyle = (config, isActive, isHovered) => {
  if (!config) return {};

  const baseStyle = { transition: "all 0.2s ease" };

  if (isActive) {
    return {
      ...baseStyle,
      backgroundColor: config.activeBg,
      color: config.textActive,
      border: `1px solid ${config.activeBg}`,
      opacity: 1,
    };
  }

  if (isHovered) {
    return {
      ...baseStyle,
      backgroundColor: config.hoverBg,
      color: config.textActive,
      border: `1px solid ${config.hoverBg}`,
      opacity: 0.9,
    };
  }

  return {
    ...baseStyle,
    backgroundColor: config.inactiveBg,
    color: config.textInactive,
    border: `1px solid ${config.inactiveBg}`,
    opacity: 0.65,
  };
};

/**
 * Obtenir la couleur de la catégorie d'action
 */
export const getCategoryColor = (subcategory, ACTION_CATEGORY_COLORS) => {
  if (!subcategory?.category_id?.code) return "gray";
  return ACTION_CATEGORY_COLORS[subcategory.category_id.code] || "gray";
};

/**
 * Nettoyer les balises HTML des descriptions et rendre les liens et emails cliquables
 */
export const sanitizeDescription = (text) => {
  if (!text) return "";

  const temp = document.createElement("div");
  temp.innerHTML = text;
  const decodedText = temp.textContent || temp.innerText || "";

  const urlPattern = "https?:\\/\\/[^\\s]+";
  const emailPattern = "[\\w.+-]+@[\\w.-]+\\.[A-Za-z]{2,}";
  const urlExact = new RegExp(`^${urlPattern}$`);
  const emailExact = new RegExp(`^${emailPattern}$`);

  const parts = decodedText.split(
    new RegExp(`(${urlPattern})|(${emailPattern})`, "g")
  );

  return parts.filter(Boolean).map((part, index) => {
    if (urlExact.test(part)) {
      return (
        <a
          key={`url-${index}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "var(--blue-9)",
            textDecoration: "underline",
            wordBreak: "break-all",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    if (emailExact.test(part)) {
      return (
        <a
          key={`mail-${index}`}
          href={`mailto:${part}`}
          style={{
            color: "var(--blue-9)",
            textDecoration: "underline",
            wordBreak: "break-all",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

/**
 * Calculer le temps total dépensé
 */
export const calculateTotalTime = (actions) => {
  if (!actions || actions.length === 0) return 0;
  return actions.reduce(
    (sum, action) => sum + (parseFloat(action.timeSpent) || 0),
    0
  );
};

/**
 * Récupérer les techniciens uniques
 */
export const getUniqueTechs = (actions) => {
  if (!actions) return [];
  const techMap = new Map();
  actions.forEach((action) => {
    if (action.technician) {
      const initials = `${action.technician.firstName[0]}${action.technician.lastName[0]}`;
      techMap.set(action.technician.id, initials);
    }
  });
  return Array.from(techMap.values());
};

/**
 * Obtenir la date de dernière mise à jour
 */
export const getLastUpdateDate = (actions) => {
  if (!actions || actions.length === 0) return null;
  const dates = actions.map((a) => new Date(a.createdAt));
  const latest = new Date(Math.max(...dates));
  return latest.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
};

/**
 * Grouper les items de timeline par jour
 */
export const groupTimelineByDay = (actions, statusLog, searchTerm = "") => {
  const items = [];

  if (actions) {
    const filtered = actions.filter((action) => {
      const searchLower = searchTerm.toLowerCase();
      const temp = document.createElement("div");
      temp.innerHTML = action.description || "";
      const description = (
        temp.textContent ||
        temp.innerText ||
        ""
      ).toLowerCase();
      const category = action.subcategory?.name?.toLowerCase() || "";
      return (
        description.includes(searchLower) || category.includes(searchLower)
      );
    });

    filtered.forEach((action) => {
      items.push({
        type: "action",
        date: action.createdAt,
        data: action,
      });
    });
  }

  if (statusLog) {
    statusLog.forEach((log) => {
      items.push({
        type: "status",
        date: log.date,
        data: {
          ...log,
          date: typeof log.date === 'string' ? log.date : new Date(log.date).toISOString()
        },
      });
    });
  }

  items.sort((a, b) => new Date(b.date) - new Date(a.date));

  const grouped = {};
  items.forEach((item) => {
    const dateKey = new Date(item.date).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(item);
  });

  return Object.entries(grouped)
    .sort((a, b) => {
      const dateA = new Date(a[0].split("/").reverse().join("-"));
      const dateB = new Date(b[0].split("/").reverse().join("-"));
      return dateB - dateA;
    })
    .map(([date, items]) => ({
      date,
      items: items.sort((a, b) => new Date(b.date) - new Date(a.date)),
    }));
};

/**
 * Calculer la différence de temps entre deux dates
 */
export const getTimeDiff = (prevDateStr, currDateStr) => {
  const prevDate = new Date(prevDateStr.split("/").reverse().join("-"));
  const currDate = new Date(currDateStr.split("/").reverse().join("-"));
  const diffMs = prevDate - currDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffDays > 0) {
    return diffDays === 1 ? "1 jour" : `${diffDays} jours`;
  } else if (diffHours > 0) {
    return diffHours === 1 ? "1 heure" : `${diffHours} heures`;
  }
  return null;
};

/**
 * Obtenir la couleur d'état à une date donnée
 */
export const getStatusColorAtDate = (date, statusLog, STATE_COLORS) => {
  if (!statusLog || statusLog.length === 0) {
    return "var(--blue-6)";
  }

  const sortedLog = [...statusLog].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  let activeStatus = null;
  for (let i = sortedLog.length - 1; i >= 0; i--) {
    if (new Date(sortedLog[i].date) <= date) {
      activeStatus = sortedLog[i];
      break;
    }
  }

  if (activeStatus?.to?.id) {
    const statusConfig = STATE_COLORS[activeStatus.to.id];
    return statusConfig?.activeBg || "var(--blue-6)";
  }

  return "var(--blue-6)";
};
