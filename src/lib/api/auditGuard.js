/**
 * auditGuard — détection et relance automatique des erreurs d'audit manquantes.
 *
 * Le middleware backend renvoie HTTP 400 :
 *   { "detail": "reason_code obligatoire pour cette mutation", "error_type": "ValidationError" }
 *
 * L'intercepteur response de client.js appelle handleAuditError() sur ces erreurs.
 * handleAuditError suspend la requête et émet un événement auquel useAuditGuard réagit.
 * Une fois la raison collectée, la requête est relancée automatiquement.
 *
 * Tout le comportement vient du champ `audit` retourné par l'API dans les réponses GET :
 *   - "entity:list"   → GET /interventions      → contexte création  (POST)
 *   - "entity:detail" → GET /interventions/{id} → contexte update    (PATCH/PUT/DELETE)
 *
 * Format attendu du champ `audit` :
 *   {
 *     required:            boolean,
 *     silent:              boolean,          // true = retry auto sans dialog
 *     default_reason_code: string,           // raison utilisée pour le retry silencieux
 *     silent_fields?:      string[],         // si défini, seuls ces champs passent silencieusement
 *     reasons:             AuditReason[],    // choix proposés dans le dialog
 *   }
 *
 * Logique de décision pour silent=true :
 *   - Si silent_fields absent  → tout passe silencieusement (comportement original)
 *   - Si silent_fields présent → vérifier les champs du payload :
 *       · Tous dans silent_fields  → retry silencieux avec default_reason_code
 *       · Au moins un hors liste   → afficher le dialog (ex: status_actual, priority)
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

function _urlKind(url) {
  const parts = (url ?? '').replace(/^\//, '').split('/');
  return parts.length > 1 && parts[1] ? 'detail' : 'list';
}

/**
 * Enregistre la config audit issue d'une réponse GET réussie.
 * Appelé par l'intercepteur success de client.js.
 */
export function cacheAuditFromResponse(response) {
  if (response.config?.method?.toLowerCase() !== 'get') return;
  const auditRules = response.data?.audit;
  if (!auditRules || typeof auditRules.silent !== 'boolean') return;
  const url = response.config.url ?? '';
  const segment = url.replace(/^\//, '').split('/')[0];
  const entityType = _URL_ENTITY_MAP[segment];
  if (!entityType) return;
  _auditConfigCache.set(`${entityType}:${_urlKind(url)}`, {
    silent:              auditRules.silent,
    default_reason_code: auditRules.default_reason_code,
    reasons:             auditRules.reasons,
    silent_fields:       Array.isArray(auditRules.silent_fields) ? auditRules.silent_fields : undefined,
  });
}

// ── Observable interne ───────────────────────────────────────────────────────

const _subscribers = new Set();

/**
 * S'abonner aux demandes d'audit.
 * Le callback reçoit { entityType, reasons, resolve, reject }.
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
 * Deux formats :
 *   1. HTTP 400 (middleware AuditMiddleware) :
 *      { detail: "reason_code obligatoire pour cette mutation", error_type: "ValidationError" }
 *   2. HTTP 422 (Pydantic) :
 *      { detail: "...", errors: [{ loc: ["body","reason_code"], type: "missing" }] }
 */
export function isAuditRequiredError(error) {
  const status = error?.response?.status;
  const { data } = error?.response ?? {};
  if (!data) return false;

  if (status === 400 && data.error_type === 'ValidationError' && typeof data.detail === 'string') {
    return data.detail.toLowerCase().includes('reason_code');
  }

  if (status === 422 && Array.isArray(data.errors)) {
    return data.errors.some((e) => (Array.isArray(e.loc) ? e.loc : []).includes('reason_code'));
  }

  return false;
}

export function getAuditEntityType(error) {
  const url = error?.config?.url ?? '';
  const segment = url.replace(/^\//, '').split('/')[0];
  return _URL_ENTITY_MAP[segment] ?? null;
}

// ── Interception & relance ───────────────────────────────────────────────────

export function handleAuditError(error) {
  const entityType = getAuditEntityType(error);
  const method = error?.config?.method?.toLowerCase() ?? '';

  const cached =
    method === 'post'
      ? (_auditConfigCache.get(`${entityType}:list`) ?? null)
      : (_auditConfigCache.get(`${entityType}:detail`) ?? _auditConfigCache.get(`${entityType}:list`) ?? null);

  if (cached?.silent) {
    const silentFields = cached.silent_fields;
    if (Array.isArray(silentFields)) {
      let payload = {};
      try { payload = error.config?.data ? JSON.parse(error.config.data) : {}; } catch { payload = {}; }
      const mutatedFields = Object.keys(payload).filter((k) => k !== 'reason_code' && k !== 'reason_text');
      if (mutatedFields.every((f) => silentFields.includes(f))) {
        return _retryWithReason(error, { reason_code: cached.default_reason_code });
      }
      // Au moins un champ hors silent_fields → dialog obligatoire
    } else {
      // Pas de silent_fields → tout passe silencieusement (rétrocompat)
      return _retryWithReason(error, { reason_code: cached.default_reason_code });
    }
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
            resolve(await _retryWithReason(error, reason));
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
  try { body = config.data ? JSON.parse(config.data) : {}; } catch { body = {}; }
  body.reason_code = reason.reason_code;
  if (reason.reason_text) body.reason_text = reason.reason_text;
  else delete body.reason_text;
  return api({ ...config, data: JSON.stringify(body), _auditRetry: true });
}
