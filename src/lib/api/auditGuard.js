/**
 * auditGuard — détection et relance automatique des erreurs d'audit manquantes.
 *
 * Depuis l'introduction de la table audit_rule (backend), le middleware
 * résout lui-même la règle routine/sensible à partir des champs présents
 * dans le payload et injecte default_reason_code silencieusement quand la
 * mutation est routine. Le front n'a donc plus besoin d'envoyer reason_code
 * "à l'aveugle" ni de dupliquer une logique de champs silencieux : il ne
 * réagit qu'aux 400 restants, qui signifient que la mutation touche un champ
 * marqué sensible côté audit_rule et nécessite un choix explicite.
 *
 * Le middleware backend renvoie HTTP 400 sur ces cas :
 *   { "detail": "reason_code obligatoire pour cette mutation", "error_type": "ValidationError",
 *     "audit": { required, silent, default_reason_code, reasons } }
 *
 * L'intercepteur response de client.js appelle handleAuditError() sur ces erreurs.
 * handleAuditError suspend la requête et émet un événement auquel useAuditGuard réagit.
 * Une fois la raison collectée, la requête est relancée automatiquement.
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

export function getAuditEntityType(error) {
  const url = error?.config?.url ?? '';
  const segment = url.replace(/^\//, '').split('/')[0];
  return _URL_ENTITY_MAP[segment] ?? null;
}

/**
 * Retourne true si l'erreur signifie que reason_code est manquant/invalide
 * pour un champ sensible (pas de retry auto possible, dialog nécessaire).
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

// ── Interception & relance ───────────────────────────────────────────────────

export function handleAuditError(error) {
  const entityType = getAuditEntityType(error);

  // Le backend inclut toujours le champ `audit` dans le corps du 400/422 :
  // à ce stade la mutation est nécessairement sensible (sinon le backend
  // aurait déjà auto-injecté default_reason_code et n'aurait pas renvoyé 400).
  const auditRules = error?.response?.data?.audit;
  const reasons = auditRules?.reasons?.length ? auditRules.reasons : undefined;

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
