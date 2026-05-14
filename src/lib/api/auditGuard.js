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

// ── Observable interne ───────────────────────────────────────────────────────

const _subscribers = new Set();

/**
 * S'abonner aux demandes d'audit.
 * Le callback reçoit { entityType, resolve, reject }.
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
 * Détecte HTTP 400 avec error_type "ValidationError" et "reason_code" dans le message.
 * @param {import('axios').AxiosError} error
 */
export function isAuditRequiredError(error) {
  if (error?.response?.status !== 400) return false;

  const { data } = error.response;
  if (!data) return false;

  // Format middleware : { detail: "reason_code obligatoire...", error_type: "ValidationError" }
  if (data.error_type === 'ValidationError' && typeof data.detail === 'string') {
    return data.detail.toLowerCase().includes('reason_code');
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
  // url peut être "/intervention-tasks/uuid" ou "intervention-tasks/uuid"
  const segment = url.replace(/^\//, '').split('/')[0];
  return _URL_ENTITY_MAP[segment] ?? null;
}

// ── Interception & relance ───────────────────────────────────────────────────

/**
 * Appelé par l'intercepteur response de client.js sur les erreurs d'audit.
 * Suspend la requête en créant une promesse et notifie les abonnés.
 * @param {import('axios').AxiosError} error
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export function handleAuditError(error) {
  const entityType = getAuditEntityType(error);

  return new Promise((resolve, reject) => {
    if (_subscribers.size === 0) {
      reject(error);
      return;
    }

    _subscribers.forEach((cb) =>
      cb({
        entityType,
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
