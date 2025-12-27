import { useCallback, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { downloadInterventionPDF, getQRCodeUrl } from "@/lib/api/export";
import { useError } from "@/contexts/ErrorContext";

/**
 * Hook pour utiliser l'API d'export (PDF et QR codes)
 * Gère automatiquement le token d'authentification
 */
export const useExportAPI = () => {
  const { user } = useAuth();
  const { showError } = useError();
  const [downloading, setDownloading] = useState(false);

  const downloadPDF = useCallback(async (interventionId) => {
    if (!user?.token) {
      showError(new Error("Vous devez être connecté pour télécharger un PDF"));
      return null;
    }

    setDownloading(true);
    try {
      const result = await downloadInterventionPDF(interventionId, user.token);
      return result;
    } catch (error) {
      showError(error);
      return null;
    } finally {
      setDownloading(false);
    }
  }, [user, showError]);

  const getQRCode = useCallback((interventionId) => {
    if (!user?.token) {
      return null;
    }
    return getQRCodeUrl(interventionId, user.token);
  }, [user]);

  return { downloadPDF, getQRCode, downloading };
};
