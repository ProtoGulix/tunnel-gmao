/**
 * auditGuard — détection et relance automatique des erreurs d'audit manquantes
 *
 * Le middleware backend renvoie HTTP 400 avec :
 *   { "detail": "reason_code obligatoire pour cette mutation", "error_type": "ValidationError" }
 *
 * L'entity_type est déduit de l'URL de la requête (pas du body d'erreur).
 *
 * L'intercepteur response de client.js appelle handleAuditError() sur ces erreurs.
 * handleAuditError suspend la requête et émet un événement auquel useAuditGuard réagit.
 * Une fois la raison collectée, la requête est relancée automatiquement.
 *
 * Aucune règle d'audit n'est codée en dur ici.
 * Tout le comportement (silent, default_reason_code, reasons) vient de l'objet
 * `audit` retourné par l'API dans les réponses GET, mis en cache par contexte :
 *   - "entity:list"   → GET /interventions       → contexte création  (POST)
 *   - "entity:detail" → GET /interventions/{id}  → contexte update   (PATCH/PUT/DELETE)
 */

import { api } from '@/lib/api/client';

// Map URL prefix → entity_type (miroir du _ENTITY_MAP backend)
const _URL_ENTITY_MAP = {
  'intervention-actions':  'action',
  'intervention-requests': 'request',
  'intervention-tasks':    'task',
  'interventions':         'intervention',
  'purchase-requests':     'purchase_request',
};

// ── Cache dynamique ──────────────────────────────────────────────────────────

// Clés : "intervention:list", "intervention:detail", "task:list", etc.
const _auditConfigCache = new Map();

/** Détermine si l'URL pointe vers une collection (list) ou une ressource (detail). */
function _urlKind(url) {
  const parts = (url ?? '').replace(/^\//, '').split('/');
  return parts.length > 1 && parts[1] ? 'detail' : 'list';
}

/**
 * Enregistre la config audit issue d'une réponse GET réussie.
 * Appelé par l'intercepteur success de client.js.
 * @param {import('axios').AxiosResponse} response
 */
export function cacheAuditFromResponse(response) {
  if (response.config?.method?.toLowerCase() !== 'get') return;
  const auditRules = response.data?.audit;
  if (!auditRules || typeof auditRules.silent !== 'boolean') return;
  const url = response.config.url ?? '';
  const segment = url.replace(/^\//, '').split('/')[0];
  const entityType = _URL_ENTITY_MAP[segment];
  if (!entityType) return;
  _auditConfigCache.set(`${entityType}:${_urlKind(url)}`, auditRules);
}

// ── Observable interne ───────────────────────────────────────────────────────

const _subscribers = new Set();

/**
 * S'abonner aux demandes d'audit.
 * Le callback reçoit { entityType, reasons, resolve, reject }.
 * @param {Function} callback
 * @returns {Function} unsubscribe
 */
export function onAuditRequired(callback) {
  _subscribers.add(callback);
  return () => _subscribers.delete(callback);
}

// ── Détection ────────────────────────────────────────────────────────────────

/**
 * Retourne true si l'erreur signifie que reason_code est manquant.
 *
 * Deux formats possibles :
 *   1. HTTP 400 (middleware AuditMiddleware) :
 *      { detail: "reason_code obligatoire pour cette mutation", error_type: "ValidationError" }
 *
 *   2. HTTP 422 (validation Pydantic, ex: PATCH /intervention-tasks) :
 *      { detail: "Erreur de validation des données", errors: [{ loc: ["body","reason_code"], type: "missing" }] }
 *
 * @param {import('axios').AxiosError} error
 */
export function isAuditRequiredError(error) {
  const status = error?.response?.status;
  const { data } = error?.response ?? {};
  if (!data) return false;

  // Format 1 — middleware 400
  if (status === 400 && data.error_type === 'ValidationError' && typeof data.detail === 'string') {
    return data.detail.toLowerCase().includes('reason_code');
  }

  // Format 2 — Pydantic 422 : au moins une erreur porte sur "reason_code"
  if (status === 422 && Array.isArray(data.errors)) {
    return data.errors.some((e) => {
      const loc = Array.isArray(e.loc) ? e.loc : [];
      return loc.includes('reason_code');
    });
  }

  return false;
}

/**
 * Extrait l'entity_type depuis l'URL de la requête originale.
 * @param {import('axios').AxiosError} error
 * @returns {string|null}
 */
export function getAuditEntityType(error) {
  const url = error?.config?.url ?? '';
  const segment = url.replace(/^\//, '').split('/')[0];
  return _URL_ENTITY_MAP[segment] ?? null;
}

// ── Interception & relance ───────────────────────────────────────────────────

/**
 * Appelé par l'intercepteur response de client.js sur les erreurs d'audit.
 *
 * Résolution depuis le cache GET uniquement (aucune règle en dur) :
 *   - POST       → cherche "entity:list"   (config vue lors du chargement de la liste)
 *   - PATCH/PUT/DELETE → cherche "entity:detail", avec fallback sur "entity:list"
 *
 * Si silent=true  → retry immédiat avec default_reason_code, aucun dialog.
 * Si silent=false → notifie les abonnés avec les reasons du cache.
 * Si pas de cache → notifie sans reasons (AuditReasonPicker fera le fetch).
 *
 * @param {import('axios').AxiosError} error
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export function handleAuditError(error) {
  const entityType = getAuditEntityType(error);
  const method = error?.config?.method?.toLowerCase() ?? '';

  // POST = création → audit du contexte list ; sinon → contexte detail, fallback list
  const cached =
    method === 'post'
      ? (_auditConfigCache.get(`${entityType}:list`) ?? null)
      : (_auditConfigCache.get(`${entityType}:detail`) ?? _auditConfigCache.get(`${entityType}:list`) ?? null);

  if (cached?.silent) {
    return _retryWithReason(error, { reason_code: cached.default_reason_code });
  }

  const reasons = cached?.reasons?.length ? cached.reasons : undefined;

  return new Promise((resolve, reject) => {
    if (_subscribers.size === 0) {
      reject(error);
      return;
    }

    _subscribers.forEach((cb) =>
      cb({
        entityType,
        reasons,
        resolve: async (reason) => {
          try {
            const result = await _retryWithReason(error, reason);
            resolve(result);
          } catch (retryError) {
            reject(retryError);
          }
        },
        reject: () => {
          const cancelled = new Error('AUDIT_CANCELLED');
          cancelled.isAuditCancelled = true;
          reject(cancelled);
        },
      })
    );
  });
}

async function _retryWithReason(originalError, reason) {
  const { config } = originalError;

  let body = {};
  try {
    body = config.data ? JSON.parse(config.data) : {};
  } catch {
    body = {};
  }

  body.reason_code = reason.reason_code;
  if (reason.reason_text) {
    body.reason_text = reason.reason_text;
  } else {
    delete body.reason_text;
  }

  return api({ ...config, data: JSON.stringify(body), _auditRetry: true });
}
