import { adapter as directusAdapter } from './directus';

/**
 * API Adapter Provider
 * Selects the appropriate backend adapter based on env configuration.
 *
 * Configure with VITE_BACKEND_PROVIDER (e.g., "directus").
 * Default: "directus".
 */
const PROVIDER = (import.meta.env.VITE_BACKEND_PROVIDER || 'directus').toLowerCase();

export const getApiAdapter = () => {
  switch (PROVIDER) {
    case 'directus':
    default:
      return directusAdapter;
  }
};
