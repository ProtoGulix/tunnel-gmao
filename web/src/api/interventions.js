import { api } from '@/lib/api/client';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';
import { mapInterventionResponse, mapInterventionDetailResponse } from './interventionMappers';

// Type (csv) et bornes de date de déclaration (AAAA-MM-JJ, incluses)
function buildTypeAndDateParams(filters) {
  const params = {};
  if (filters.typeInter) params.type_inter = filters.typeInter;
  if (filters.reportedFrom) params.reported_from = filters.reportedFrom;
  if (filters.reportedTo) params.reported_to = filters.reportedTo;
  return params;
}

function buildListParams(filters) {
  const params = {
    skip: filters.skip ?? 0,
    limit: filters.limit ?? 1000,
  };
  if (filters.equipementId) params.equipement_id = filters.equipementId;
  if (filters.includeDescendants !== undefined) params.include_descendants = filters.includeDescendants;
  if (filters.status) params.status = filters.status;
  if (filters.priority) params.priority = filters.priority;
  if (filters.sort) params.sort = filters.sort;
  if (filters.include) params.include = filters.include;
  // Historique : l'API cache par défaut les interventions archivées (fiche imprimée)
  if (filters.includePrinted) params.include_printed = true;
  if (filters.search) params.search = filters.search;
  return { ...params, ...buildTypeAndDateParams(filters) };
}

export async function fetchInterventions(filters = {}) {
  const response = await api.get('/interventions', { params: buildListParams(filters) });
  const items = response.data.items ?? [];
  return items.map(mapInterventionResponse);
}

/**
 * Liste paginée des interventions avec métadonnées de pagination.
 * @returns {Promise<{items: Array, pagination: Object|undefined}>}
 */
export async function fetchInterventionsPage(filters = {}) {
  const response = await api.get('/interventions', { params: buildListParams(filters) });
  return {
    items: (response.data.items ?? []).map(mapInterventionResponse),
    pagination: response.data.pagination,
  };
}

export async function searchOpenInterventions(search, { limit = 20 } = {}) {
  const response = await api.get('/interventions', {
    params: {
      search,
      status: 'ouvert,en_cours,attente_pieces,attente_prod',
      limit,
    },
  });
  return (response.data.items ?? []).map((raw) => ({
    id: raw.id?.toString() ?? '',
    code: raw.code ?? '',
    title: raw.title ?? '',
    status_actual: raw.status_actual ?? raw.status ?? '',
    type_inter: typeof raw.type_inter === 'string' ? raw.type_inter : (raw.type_inter?.code ?? 'CUR'),
    priority: raw.priority ?? 'normale',
    plan_id: raw.plan_id ?? null,
    equipement: raw.equipements
      ? { id: raw.equipements.id?.toString() ?? '', code: raw.equipements.code ?? '', name: raw.equipements.name ?? '' }
      : null,
    tasks: [],
  }));
}

export async function fetchIntervention(id) {
  const response = await api.get(`/interventions/${id}`);
  return mapInterventionDetailResponse(response.data);
}

export async function fetchInterventionFacets(id) {
  const response = await api.get(`/interventions/${id}`);
  const data = response.data ?? {};
  return {
    subcategories: data.facets?.action_categories ?? [],
    complexityFactors: data.facets?.complexity_factors ?? [],
  };
}

export async function createIntervention(data) {
  const payload = {
    machine_id: data.equipementId,
    type_inter: data.type,
    tech_id: data.techId,
    title: data.title,
    priority: data.priority,
    status_actual: 'ouvert',
    reported_date: data.reportedDate
      ? new Date(data.reportedDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  };
  if (data.reportedBy) payload.reported_by = data.reportedBy;
  // Création atomique (ADR 0025) : une demande existante OU une nouvelle demande dans le
  // même appel. En cas d'erreur, rien n'est créé.
  if (data.requestId) {
    payload.request_id = data.requestId;
  } else if (data.request) {
    payload.request = {
      demandeur_nom: data.request.demandeurNom,
      description: data.request.description,
      ...(data.request.serviceId && { service_id: data.request.serviceId }),
    };
  }
  const response = await api.post('/interventions', payload);
  return mapInterventionResponse(response.data);
}

export async function updateIntervention(id, updates) {
  const payload = {};
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.printedFiche !== undefined) payload.printed_fiche = updates.printedFiche;
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.status !== undefined) payload.status_actual = updates.status;
  if (updates.reason_code !== undefined) payload.reason_code = updates.reason_code;
  if (updates.reason_text !== undefined) payload.reason_text = updates.reason_text;

  const response = await api.put(`/interventions/${id}`, payload);
  return mapInterventionDetailResponse(response.data);
}

export async function updateInterventionStatus(id, newStatus, reasonCode, reasonText) {
  return updateIntervention(id, { status: newStatus, reason_code: reasonCode, reason_text: reasonText });
}

/**
 * Supprime une intervention (ADR 0019) : motif « deleted » obligatoire dans le corps,
 * issue de la demande liée (reopen | delete) en paramètre quand une demande est liée.
 */
export async function deleteIntervention(id, reason, requestOutcome) {
  const data = { reason_code: reason.reason_code };
  if (reason.reason_text) data.reason_text = reason.reason_text;
  await api.delete(`/interventions/${id}`, {
    data,
    params: requestOutcome ? { request_outcome: requestOutcome } : undefined,
  });
}

export async function fetchInterventionPdf(id) {
  const response = await api.get(`/exports/interventions/${id}/pdf`, {
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  return window.URL.createObjectURL(blob);
}

async function readBlobErrorMessage(error) {
  const data = error?.response?.data;
  if (data instanceof Blob) {
    try {
      const body = JSON.parse(await data.text());
      if (typeof body.detail === 'string') return body.detail;
    } catch {
      // corps non JSON : message générique ci-dessous
    }
  }
  return error?.response?.status === 429
    ? 'Trop de demandes : réessayez dans une minute'
    : "L'export a échoué";
}

/**
 * Marque comme imprimées les fiches fermées de la période (mêmes valeurs que l'export).
 * Retourne { marked, total } ; en cas d'erreur, lève une Error portant le message du backend.
 */
export async function markClosedInterventionsPrinted({ dateFrom, dateTo, equipementId, includePrinted }) {
  const body = { date_from: dateFrom, date_to: dateTo, include_printed: !!includePrinted };
  if (equipementId) body.equipement_id = equipementId;
  try {
    const response = await api.post('/exports/interventions/closed/mark-printed', body);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Le marquage a échoué'));
  }
}

/**
 * Export de masse des fiches fermées sur une période (ADMIN et RESP, plafond côté backend).
 * Retourne le Blob (zip ou pdf) ; en cas d'erreur, lève une Error portant le message du backend.
 */
export async function fetchClosedInterventionsExport({
  dateFrom, dateTo, equipementId, includePrinted, format,
}) {
  // Fiches déjà imprimées exclues par défaut (backend) ; ordre : équipement puis fermeture
  const params = { date_from: dateFrom, date_to: dateTo, format, include_printed: !!includePrinted };
  if (equipementId) params.equipement_id = equipementId;
  try {
    const response = await api.get('/exports/interventions/closed', {
      params,
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw new Error(await readBlobErrorMessage(error));
  }
}

/** Types d'intervention (référentiel en base, ADR 0026), inactifs inclus pour l'affichage de l'historique */
export async function fetchInterventionTypeRefs() {
  const r = await api.get('/interventions/types', { params: { include_inactive: true } });
  return Array.isArray(r.data) ? r.data : [];
}
