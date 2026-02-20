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
    error instanceof NetworkError
  );
};

// ==============================
// ERROR CONVERSION
// ==============================

/**
 * Convert HTTP status code to appropriate typed error class.
 *
 * @private
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @param {Object} details - Error details from response
 * @param {string} context - Call context for debugging
 * @returns {APIError} Typed error instance
 */
const createTypedError = (status, message, details, context) => {
  const enrichedDetails = context ? { ...details, context } : details;

  switch (status) {
    case 401:
      return new AuthenticationError(message, enrichedDetails);
    case 403:
      return new PermissionError(message, enrichedDetails);
    case 404:
      return new NotFoundError(message, enrichedDetails);
    case 400:
    case 422:
      return new ValidationError(message, enrichedDetails);
    default:
      return new APIError(message || 'An error occurred', status ?? 0, enrichedDetails);
  }
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
  const errorMessage = data?.errors?.[0]?.message || data?.message || error.message;

  // Log detailed error for debugging
  console.error(`[${context}] API error:`, {
    status,
    url: error.config?.url,
    method: error.config?.method,
    data,
  });

  return createTypedError(status, errorMessage, data, context);
};

/**
 * Serialize any error to a DTO suitable for logging or UI display.
 *
 * @param {*} error - Error object (typed or untyped)
 * @returns {Object} Serializable error DTO
 */
export const toErrorDTO = (error) => {
  if (error?.toDTO) return error.toDTO();

  return {
    name: error?.name || 'Error',
    message: error?.message || 'An unexpected error occurred.',
    statusCode: error?.statusCode || error?.response?.status || 0,
    details: error?.details || error?.response?.data || null,
    timestamp: new Date().toISOString(),
  };
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
