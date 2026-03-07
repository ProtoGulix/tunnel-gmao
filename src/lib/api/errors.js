/**
 * Unified API Error Handling
 *
 * Provides:
 * - Typed error classes for different HTTP/network scenarios
 * - Error normalization from axios responses to DTOs
 * - User-friendly error messages for the UI
 * - Centralized error handling wrapper for API calls
 *
 * @module lib/api/errors
 *
 * Usage:
 * ```javascript
 * import { handleAPIError, getUserFriendlyMessage, apiCall } from './errors';
 *
 * // Option 1: Manual handling
 * try {
 *   await api.get('/items/machines');
 * } catch (error) {
 *   const typedError = handleAPIError(error, 'fetchMachines');
 *   console.error(typedError.message);
 * }
 *
 * // Option 2: Wrapped call
 * const data = await apiCall(() => api.get('/items/machines'), 'fetchMachines');
 * ```
 */

// ==============================
// ERROR CLASSES
// ==============================

/**
 * Base API Error class.
 * Parent for all API-related errors with standard structure.
 *
 * @class APIError
 * @extends {Error}
 * @property {string} name - Error type name
 * @property {number} statusCode - HTTP status code (0 for network errors)
 * @property {Object|null} details - Backend error details or context
 * @property {Date} timestamp - When the error occurred
 */
export class APIError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();
  }

  /**
   * Serialize error to DTO for logging or UI display.
   *
   * @returns {Object} Serializable error object
   */
  toDTO() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

/**
 * 401 Unauthorized: Authentication required or session expired.
 *
 * @class AuthenticationError
 * @extends {APIError}
 */
export class AuthenticationError extends APIError {
  constructor(message = 'Authentication required', details = null) {
    super(message, 401, details);
    this.name = 'AuthenticationError';
  }
}

/**
 * 403 Forbidden: User lacks permission for the requested resource.
 *
 * @class PermissionError
 * @extends {APIError}
 */
export class PermissionError extends APIError {
  constructor(message = 'Insufficient permissions', details = null) {
    super(message, 403, details);
    this.name = 'PermissionError';
  }
}

/**
 * 404 Not Found: Resource does not exist.
 *
 * @class NotFoundError
 * @extends {APIError}
 */
export class NotFoundError extends APIError {
  constructor(message = 'Resource not found', details = null) {
    super(message, 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * 400/422 Validation Error: Request data is invalid.
 *
 * @class ValidationError
 * @extends {APIError}
 */
export class ValidationError extends APIError {
  constructor(message = 'Invalid data', details = null) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * 409 Conflict: Resource already exists or violates a uniqueness constraint.
 *
 * @class ConflictError
 * @extends {APIError}
 */
export class ConflictError extends APIError {
  constructor(message = 'Resource already exists', details = null) {
    super(message, 409, details);
    this.name = 'ConflictError';
  }
}

/**
 * Network Error: Cannot reach the server.
 *
 * @class NetworkError
 * @extends {APIError}
 */
export class NetworkError extends APIError {
  constructor(message = 'Network connection failed', details = null) {
    super(message, 0, details);
    this.name = 'NetworkError';
  }
}

// ==============================
// ERROR DETECTION
// ==============================

/**
 * Check if an error is one of our typed API errors.
 *
 * @param {*} error - Error object to check
 * @returns {boolean} True if error is a typed API error
 */
export const isTypedError = (error) => {
  return (
    error instanceof APIError ||
    error instanceof AuthenticationError ||
    error instanceof PermissionError ||
    error instanceof NotFoundError ||
    error instanceof ValidationError ||
    error instanceof ConflictError ||
    error instanceof NetworkError
  );
};

// ==============================
// ERROR CONVERSION
// ==============================

const extractErrorMessage = (data, fallback) =>
  data?.detail || data?.errors?.[0]?.message || data?.message || fallback;

/** Map error_type envoyé par le backend → classe d'erreur locale */
const ERROR_TYPE_MAP = {
  ValidationError: (msg, det) => new ValidationError(msg, det),
  ConflictError: (msg, det) => new ConflictError(msg, det),
  NotFoundError: (msg, det) => new NotFoundError(msg, det),
  UnauthorizedError: (msg, det) => new AuthenticationError(msg, det),
  ForbiddenError: (msg, det) => new PermissionError(msg, det),
};

const STATUS_MAP = {
  401: (msg, det) => new AuthenticationError(msg, det),
  403: (msg, det) => new PermissionError(msg, det),
  404: (msg, det) => new NotFoundError(msg, det),
  400: (msg, det) => new ValidationError(msg, det),
  422: (msg, det) => new ValidationError(msg, det),
  409: (msg, det) => new ConflictError(msg, det),
};

/**
 * Convert HTTP status code (+ optional backend error_type) to typed error.
 *
 * Prioritise `data.error_type` quand le backend le fournit,
 * sinon fallback sur le HTTP status.
 *
 * @private
 */
const createTypedError = (status, message, details, context) => {
  const enrichedDetails = context ? { ...details, context } : details;
  const factory = ERROR_TYPE_MAP[details?.error_type] || STATUS_MAP[status];
  if (factory) return factory(message, enrichedDetails);
  return new APIError(message || 'An error occurred', status ?? 0, enrichedDetails);
};

/**
 * Convert axios error to typed API error.
 *
 * Handles:
 * - Network errors (no response from server)
 * - HTTP errors (4xx, 5xx responses)
 * - Request cancellation
 *
 * @param {Object} error - axios error object
 * @param {string} [context=''] - Context for debugging (function name, etc.)
 * @returns {APIError} Typed error instance
 *
 * @example
 * try {
 *   await api.get('/items/machines');
 * } catch (error) {
 *   throw handleAPIError(error, 'fetchMachines');
 * }
 */
export const handleAPIError = (error, context = '') => {
  // Request was canceled - ne pas logger (comportement normal lors de la navigation)
  if (error?.code === 'ERR_CANCELED') {
    return new NetworkError('Request was cancelled', {
      canceled: true,
      context,
    });
  }

  // Network error (no server response)
  if (!error.response) {
    console.error(`[${context}] Network error:`, error);
    return new NetworkError('Unable to reach the server. Check your internet connection.', {
      originalError: error.message,
      context,
    });
  }

  const { status, data } = error.response;

  // 4xx : erreurs métier attendues → warn seulement
  // 5xx : erreurs serveur inattendues → error
  const log = status >= 500 ? console.error : console.warn;
  log(`[${context}] API error:`, {
    status,
    url: error.config?.url,
    method: error.config?.method,
    data,
  });

  return createTypedError(status, extractErrorMessage(data, error.message), data, context);
};

function buildErrorDTO(error) {
  const e = error || {};
  const res = e.response || {};
  return {
    name: e.name || 'Error',
    message: e.message || 'An unexpected error occurred.',
    statusCode: e.statusCode || res.status || 0,
    details: e.details || res.data || null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Serialize any error to a DTO suitable for logging or UI display.
 *
 * @param {*} error - Error object (typed or untyped)
 * @returns {Object} Serializable error DTO
 */
export const toErrorDTO = (error) => {
  if (error?.toDTO) return error.toDTO();
  return buildErrorDTO(error);
};

// ==============================
// USER-FRIENDLY MESSAGING
// ==============================

/**
 * Get localized, user-friendly error message for the UI.
 *
 * Converts technical errors to non-technical messages appropriate for display.
 *
 * @param {*} error - Error object (typed or untyped)
 * @returns {string} User-friendly message
 */
export const getUserFriendlyMessage = (error) => {
  if (error instanceof AuthenticationError) {
    return 'Your session has expired. Please log in again.';
  }

  if (error instanceof PermissionError) {
    return 'You do not have permission to perform this action.';
  }

  if (error instanceof NotFoundError) {
    return 'The requested item does not exist or has been deleted.';
  }

  if (error instanceof ValidationError) {
    return error.message || 'The provided data is invalid.';
  }

  if (error instanceof ConflictError) {
    return error.message || 'Cette ressource existe déjà.';
  }

  if (error instanceof NetworkError) {
    return 'Unable to connect to the server. Check your internet connection.';
  }

  return error.message || 'An unexpected error occurred.';
};

// ==============================
// API CALL WRAPPER
// ==============================

/**
 * Wrapper for API calls with unified error handling.
 *
 * Automatically catches errors and converts them to typed errors.
 *
 * @param {Function} fn - Async function to execute (typically an API call)
 * @param {string} [context='API Call'] - Context for error logging
 * @returns {Promise<*>} Result of fn()
 * @throws {APIError} Typed error if fn() throws
 *
 * @example
 * const machines = await apiCall(
 *   () => api.get('/items/machines'),
 *   'fetchMachines'
 * );
 */
export const apiCall = async (fn, context = 'API Call') => {
  try {
    return await fn();
  } catch (error) {
    const typedError = handleAPIError(error, context);

    // Ne pas throw les erreurs d'annulation (comportement normal)
    if (typedError instanceof NetworkError && typedError.details?.canceled) {
      return null;
    }

    throw typedError;
  }
};
