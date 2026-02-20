import { useState, useCallback } from 'react';
import { stock } from '@/lib/api/facade';

/**
 * Hook personnalisé pour gérer la suppression d'une demande d'achat
 * avec pattern de sécurité double-clic/confirmation
 * 
 * @param {Function} onSuccess - Callback appelé après suppression réussie
 * @returns {Object} État et handlers pour la suppression
 */
export function useDeletePurchaseRequest(onSuccess) {
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteRequest = useCallback(async (requestId) => {
    try {
      setDeleteLoading(true);
      await stock.deletePurchaseRequest(requestId);
      setDeleteConfirmId(null);
      onSuccess?.(requestId);
    } catch (error) {
      console.error('Erreur suppression DA:', error);
      throw error;
    } finally {
      setDeleteLoading(false);
    }
  }, [onSuccess]);

  const handleDeleteButtonClick = useCallback((requestId) => {
    if (deleteConfirmId === requestId) {
      // Deuxième clic = confirmer la suppression
      handleDeleteRequest(requestId);
    } else {
      // Premier clic = passer en mode confirmation
      setDeleteConfirmId(requestId);
      // Réinitialiser après 3 secondes si pas confirmé
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  }, [deleteConfirmId, handleDeleteRequest]);

  return {
    deleteConfirmId,
    deleteLoading,
    handleDeleteButtonClick,
    handleDeleteRequest,
    resetDeleteState: () => setDeleteConfirmId(null)
  };
}
