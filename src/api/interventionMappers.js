// eslint-disable-next-line complexity
export function mapInterventionResponse(raw = {}) {
  const typeCode =
    typeof raw.type_inter === 'string' ? raw.type_inter : raw.type_inter?.code || raw.type || 'CUR';

  return {
    id: raw.id?.toString() || '',
    code: raw.code || '',
    title: raw.title || '',
    status: raw.status_actual || raw.status || '',
    type: typeCode,
    priority: raw.priority || 'normal',
    reportedDate: raw.reported_date,
    printedFiche: raw.printed_fiche ?? false,
    plan_id: raw.plan_id || null,
    techInitials: raw.tech_initials || '',
    reportedBy: raw.reported_by || '',
    machine: raw.equipements
      ? {
          id: raw.equipements.id?.toString() || '',
          code: raw.equipements.code || '',
          name: raw.equipements.name || raw.equipements.code || 'Équipement',
          health: {
            level: raw.equipements.health?.level || 'ok',
            reason: raw.equipements.health?.reason || '',
          },
        }
      : null,
    next_due_date: raw.next_due_date ?? null,
    overdue: raw.overdue ?? false,
    stats: raw.stats
      ? {
          actionCount: raw.stats.action_count ?? 0,
          totalTime: raw.stats.total_time ?? 0,
          avgComplexity: raw.stats.avg_complexity ?? 0,
          purchaseCount: raw.stats.purchase_count ?? 0,
          purchasePending: (() => {
            const pr = raw.stats.purchase_requests;
            if (!pr) return null;
            return (pr.total ?? 0) - (pr.received ?? 0) - (pr.rejected ?? 0);
          })(),
          tasks: raw.stats.tasks ?? null,
          taskProgress: raw.stats.task_progress ?? null,
        }
      : null,
  };
}

function mapAction(a) {
  return {
    id: a.id?.toString() || '',
    description: a.description || '',
    timeSpent: a.time_spent ?? 0,
    complexityScore: a.complexity_score ?? null,
    createdAt: a.created_at,
    date: a.date ?? a.created_at?.slice(0, 10) ?? null,
    actionStart: a.action_start ? a.action_start.slice(0, 5) : null,
    actionEnd: a.action_end ? a.action_end.slice(0, 5) : null,
    complexityFactors: a.complexity_factor
      ? [typeof a.complexity_factor === 'string' ? a.complexity_factor : a.complexity_factor?.code]
      : [],
    subcategory: a.subcategory
      ? {
          id: a.subcategory.id?.toString() || '',
          label: a.subcategory.name || '',
          code: a.subcategory.code || '',
          category: a.subcategory.category
            ? {
                id: a.subcategory.category.id?.toString() || '',
                label: a.subcategory.category.name || '',
                code: a.subcategory.category.code || '',
              }
            : null,
        }
      : null,
    technician: a.tech
      ? { id: a.tech.id?.toString() || '', firstName: a.tech.first_name || '', lastName: a.tech.last_name || '', initial: a.tech.initial || '' }
      : null,
    purchaseRequests: a.purchase_requests || [],
    tasks: Array.isArray(a.tasks) ? a.tasks : a.task ? [a.task] : [],
    task: Array.isArray(a.tasks) ? (a.tasks[0] ?? null) : (a.task ?? null),
  };
}

function mapStatusLog(log) {
  return {
    id: log.id?.toString() || '',
    date: log.date,
    status_from_detail: log.status_from_detail ? { id: log.status_from_detail.id || '', label: log.status_from_detail.label || '' } : null,
    status_to_detail: log.status_to_detail ? { id: log.status_to_detail.id || '', label: log.status_to_detail.label || '' } : null,
    technician: log.technician
      ? { id: log.technician.id?.toString() || '', firstName: log.technician.first_name || '', lastName: log.technician.last_name || '' }
      : null,
  };
}

/* eslint-disable complexity */
export function mapInterventionDetailResponse(raw = {}) {
  const base = mapInterventionResponse(raw);
  return {
    ...base,
    action: Array.isArray(raw.actions) ? raw.actions.map(mapAction) : [],
    statusLogs: Array.isArray(raw.status_logs) ? raw.status_logs.map(mapStatusLog) : [],
    tasks: Array.isArray(raw.tasks) ? raw.tasks : [],
    taskProgress: raw.task_progress ?? null,
    request: raw.request
      ? {
          id: raw.request.id,
          code: raw.request.code,
          demandeurNom: raw.request.demandeur_nom,
          demandeurService: raw.request.service?.label || raw.request.demandeur_service || null,
          description: raw.request.description,
          statut: raw.request.statut,
          statutLabel: raw.request.statut_label,
          statutColor: raw.request.statut_color,
          createdAt: raw.request.created_at,
        }
      : null,
  };
}
