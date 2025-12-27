import {
  apiCall,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  APIError,
} from '@/lib/api/errors';

const EXPORT_API_URL = import.meta.env.VITE_EXPORT_API_URL || 'http://localhost:8001';
const DOWNLOAD_TIMEOUT_MS = Number(import.meta.env.VITE_EXPORT_TIMEOUT_MS ?? 15000);

// ============================================================================
// Response Mappers (Backend → Domain DTOs)
// ============================================================================

/**
 * Convertit une réponse de téléchargement en DTO domaine
 * @param {Object} result - Résultat du téléchargement
 * @returns {Object} DTO domaine { success, filename }
 */
const mapDownloadResultToDomain = (result) => {
  if (!result) return null;
  return {
    success: result.success === true,
    filename: result.filename ?? undefined,
  };
};

/**
 * Convertit une URL de QR code en DTO domaine
 * @param {string} url - URL du QR code
 * @returns {Object} DTO domaine { url }
 */
const mapQRCodeUrlToDomain = (url) => {
  return {
    url: url ?? undefined,
  };
};

// ============================================================================
// Utility Functions (Helpers)
// ============================================================================

/**
 * Extrait le nom de fichier du header Content-Disposition
 * @param {Response} response - Réponse HTTP
 * @returns {string|null} Nom de fichier ou null
 */
const extractFilename = (response) => {
  const contentDisposition = response.headers.get('Content-Disposition');
  if (!contentDisposition) return null;
  const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
  if (matches && matches[1]) return matches[1].replace(/['"]/g, '');
  return null;
};

/**
 * Essaie de parser la réponse comme JSON de manière sûre
 * @param {Response} response - Réponse HTTP
 * @returns {Promise<Object|null>} JSON parsé ou null en cas d'erreur
 */
const safeJson = async (response) => {
  try {
    return await response.clone().json();
  } catch {
    return null;
  }
};

// Note: normalizeFetchError removed - error handling now delegated to apiCall wrapper

// ============================================================================
// API Methods (Domain Interface)
// ============================================================================

/**
 * Télécharge le PDF d'une intervention
 * @param {string} interventionId - ID de l'intervention
 * @param {string} token - Token d'authentification
 * @returns {Promise<Object>} DTO { success, filename }
 */
const downloadInterventionPDF = async (interventionId, token) => {
  return apiCall(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

    try {
      const response = await fetch(`${EXPORT_API_URL}/api/items/${interventionId}`, {
        method: 'GET',
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new AuthenticationError('Token expiré ou invalide. Veuillez vous reconnecter.');
        }
        if (response.status === 404) {
          throw new NotFoundError('Intervention non trouvée.');
        }
        if (response.status === 400 || response.status === 422) {
          throw new ValidationError(`Erreur ${response.status}: ${response.statusText}`);
        }
        throw new APIError(
          `Erreur ${response.status}: ${response.statusText}`,
          response.status,
          await safeJson(response)
        );
      }

      const filename = extractFilename(response) || 'intervention.pdf';
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return mapDownloadResultToDomain({ success: true, filename });
    } finally {
      clearTimeout(timeoutId);
    }
  }, 'DownloadInterventionPDF');
};

/**
 * Génère l'URL du QR code d'une intervention
 * @param {string} interventionId - ID de l'intervention
 * @param {string} token - Token d'authentification
 * @returns {Object} DTO { url }
 */
const getQRCodeUrl = (interventionId, token) => {
  const url = `${EXPORT_API_URL}/api/qrcode/${interventionId}${
    token ? `?token=${encodeURIComponent(token)}` : ''
  }`;
  return mapQRCodeUrlToDomain(url);
};

// ============================================================================
// Export adapter
// ============================================================================

export const exportAdapter = {
  downloadInterventionPDF,
  getQRCodeUrl,
};
