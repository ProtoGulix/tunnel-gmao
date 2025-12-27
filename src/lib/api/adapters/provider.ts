/**
 * API Adapter Provider
 * Selects the appropriate backend adapter based on env configuration.
 * 
 * FAIL FAST: Invalid provider causes immediate crash with clear error message.
 * This prevents runtime errors deep in the app when backend is misconfigured.
 *
 * Configure with VITE_BACKEND_PROVIDER (e.g., "directus", "mock").
 * Default: "directus".
 * 
 * @see src/lib/api/adapters/ApiAdapter.ts - Contract that all adapters implement
 */

import type { ApiAdapter } from './ApiAdapter';
import { adapter as directusAdapter } from './directus';
import { adapter as mockAdapter } from './mock';

/**
 * Supported backend provider keys
 */
type ProviderKey = 'directus' | 'mock';

/**
 * Typed adapter registry
 * Each adapter MUST implement the ApiAdapter interface
 */
const ADAPTER_REGISTRY: Record<ProviderKey, ApiAdapter> = {
  directus: directusAdapter as unknown as ApiAdapter,
  mock: mockAdapter,
} as const;

/**
 * Current provider from environment variable
 */
const PROVIDER_KEY = (import.meta.env.VITE_BACKEND_PROVIDER || 'directus').toLowerCase() as ProviderKey;

/**
 * Get the configured API adapter
 * 
 * @throws {Error} If VITE_BACKEND_PROVIDER is invalid
 * @returns {ApiAdapter} The configured adapter
 */
export const getApiAdapter = (): ApiAdapter => {
  const adapter = ADAPTER_REGISTRY[PROVIDER_KEY];
  
  if (!adapter) {
    const validProviders = Object.keys(ADAPTER_REGISTRY).join(', ');
    throw new Error(
      `Invalid VITE_BACKEND_PROVIDER: "${PROVIDER_KEY}". ` +
      `Valid providers: ${validProviders}`
    );
  }
  
  return adapter;
};
