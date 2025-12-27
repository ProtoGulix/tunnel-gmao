/**
 * HTTP Client Configuration & Infrastructure
 *
 * Provides a preconfigured axios instance with:
 * - Request/response interceptors for authentication and error handling
 * - Cache management for API responses
 * - Centralized token and error handling
 *
 * @module lib/api/client
 *
 * Usage:
 * ```javascript
 * import { api, BASE_URL, getCacheKey, getFromCache } from './client';
 * const response = await api.get('/items/machines');
 * ```
 */

// ==============================
// EXTERNAL DEPENDENCIES
// ==============================
import axios from 'axios';

// ==============================
// CONFIGURATION
// ==============================
const BASE_URL = import.meta.env.VITE_DATA_API_URL || 'http://localhost:8055';
const BLOCK_API = import.meta.env.VITE_BLOCK_API === 'true';
const BLOCK_API_ENDPOINTS = (import.meta.env.VITE_BLOCK_API_ENDPOINTS || '/items/machine')
  .split(',')
  .map((endpoint) => endpoint.trim())
  .filter(Boolean);

/**
 * Preconfigured axios instance for API calls.
 *
 * Features:
 * - Auto-adds Authorization header from localStorage
 * - Handles 401 (unauthorized) with automatic redirect to /login
 * - Handles 403 (forbidden) with logging
 * - Content-Type always application/json
 *
 * @type {import('axios').AxiosInstance}
 */
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==============================
// CACHE MANAGEMENT
// ==============================

/**
 * In-memory cache for API responses.
 * Currently configured with 0ms TTL (real-time mode: no caching).
 *
 * @private
 * @type {Map<string, any>}
 */
const cache = new Map();

/**
 * Timestamps for cache entries (used for TTL enforcement).
 *
 * @private
 * @type {Map<string, number>}
 */
const cacheTimestamps = new Map();

/**
 * Cache time-to-live in milliseconds.
 * 0 = disabled (real-time mode, always fetch fresh data)
 *
 * @private
 * @type {number}
 */
const CACHE_DURATION = 0;

// ==============================
// CACHE PUBLIC API
// ==============================

/**
 * Generate a cache key from endpoint and parameters.
 *
 * @param {string} endpoint - API endpoint (e.g., '/items/machines')
 * @param {Object} [params] - Query parameters object
 * @returns {string} Cache key for use with getFromCache/setCache
 *
 * @example
 * const key = getCacheKey('/items/machines', { zone_id: 5 });
 */
export const getCacheKey = (endpoint, params) => {
  return `${endpoint}:${JSON.stringify(params || {})}`;
};

/**
 * Retrieve cached data if available and not expired.
 *
 * @param {string} key - Cache key (generated via getCacheKey)
 * @returns {any|null} Cached data or null if not found/expired
 */
export const getFromCache = (key) => {
  if (!cache.has(key)) return null;

  const timestamp = cacheTimestamps.get(key);
  if (Date.now() - timestamp > CACHE_DURATION) {
    cache.delete(key);
    cacheTimestamps.delete(key);
    return null;
  }

  return cache.get(key);
};

/**
 * Store data in cache with current timestamp.
 *
 * @param {string} key - Cache key (generated via getCacheKey)
 * @param {any} data - Data to cache
 */
export const setCache = (key, data) => {
  cache.set(key, data);
  cacheTimestamps.set(key, Date.now());
};

/**
 * Invalidate all cache entries matching a pattern.
 *
 * @param {string} pattern - Pattern to match in cache keys (substring match)
 *
 * @example
 * invalidateCache('machines'); // clears all keys containing 'machines'
 */
export const invalidateCache = (pattern) => {
  const keys = Array.from(cache.keys());
  keys.forEach((key) => {
    if (key.includes(pattern)) {
      cache.delete(key);
      cacheTimestamps.delete(key);
    }
  });
};

/**
 * Clear all cached entries.
 */
export const clearAllCache = () => {
  cache.clear();
  cacheTimestamps.clear();
};

// ==============================
// REQUEST INTERCEPTOR
// ==============================

/**
 * Adds Authorization header from localStorage before each request.
 *
 * Token sources (in order of preference):
 * 1. auth_access_token (current standard)
 * 2. directus_token (legacy, for backwards compatibility)
 */
api.interceptors.request.use(
  (config) => {
    if (BLOCK_API) {
      const url = config.url || '';
      const blocked = BLOCK_API_ENDPOINTS.some((endpoint) => url.includes(endpoint));
      if (blocked) {
        return Promise.reject(new axios.Cancel(`API blocked (${url})`));
      }
    }

    // Prefer generic token; fallback to legacy directus token
    const token =
      localStorage.getItem('auth_access_token') || localStorage.getItem('directus_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==============================
// RESPONSE INTERCEPTOR
// ==============================

/**
 * Handles API errors globally:
 * - 401 (Unauthorized): clears tokens and redirects to /login
 * - 403 (Forbidden): logs the incident for debugging
 * - Others: passes error to caller for handling
 *
 * Token cleanup includes both current and legacy token names for migration support.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Save current location for redirect after login
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== '/login') {
        localStorage.setItem('redirect_after_login', currentPath);
      }

      // Clear all token variants (current + legacy)
      localStorage.removeItem('auth_access_token');
      localStorage.removeItem('auth_refresh_token');
      localStorage.removeItem('directus_token');
      localStorage.removeItem('directus_refresh_token');

      // Redirect to login
      window.location.href = '/login';
    }

    // Log 403 Forbidden for debugging
    if (error.response?.status === 403) {
      console.error('API Error: 403 Forbidden (Permission Denied)', {
        url: error.config?.url,
        method: error.config?.method,
        data: error.response?.data,
      });
    }

    return Promise.reject(error);
  }
);

// ==============================
// EXPORTS
// ==============================

export { BASE_URL };
