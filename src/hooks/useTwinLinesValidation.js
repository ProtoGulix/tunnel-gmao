/**
 * @fileoverview Hook pour détecter et valider les lignes jumelles (même DA chez différents fournisseurs)
 *
 * Permet de forcer l'utilisateur à comparer les devis de plusieurs fournisseurs
 * avant de valider une commande.
 *
 * @module hooks/useTwinLinesValidation
 */

import { useMemo } from 'react';

/**
 * Extrait les infos d'une purchase request depuis différentes structures possibles
 */
const getPurchaseRequest = (pr) => {
  if (!pr) return null;
  if (pr.purchase_request_id) return pr.purchase_request_id;
  if (pr.purchaseRequest) return pr.purchaseRequest;
  return pr;
};

/**
 * Extrait les lignes jumelles depuis les supplier_order_line_ids
 */
const extractTwinLines = (prObj, currentLineId) => {
  if (!prObj) return [];

  const supplierOrderLineIds = prObj.supplier_order_line_ids || [];
  const twinLines = [];

  // Parcourir tous les supplier_order_line_ids
  supplierOrderLineIds.forEach((item) => {
    // Structure: { id, supplier_order_line_id: { id, is_selected, ... } }
    const lineData = item.supplier_order_line_id;
    if (!lineData || lineData.id === currentLineId) return;

    twinLines.push(lineData);
  });

  return twinLines;
};

/**
 * Hook pour détecter et valider les lignes jumelles
 *
 * @param {Object} line - Ligne de commande à analyser
 * @returns {Object} État de validation des jumelles
 */
export function useTwinLinesValidation(line) {
  /**
   * Détecte et récupère les lignes jumelles depuis les données déjà chargées
   */
  const twinLines = useMemo(() => {
    if (!line) return [];

    const prs = line.purchaseRequests || line.purchase_requests || [];
    const allTwins = new Set();

    prs.forEach((pr) => {
      const prObj = getPurchaseRequest(pr);
      const twins = extractTwinLines(prObj, line.id);
      twins.forEach((twin) => allTwins.add(JSON.stringify(twin)));
    });

    return Array.from(allTwins).map((t) => JSON.parse(t));
  }, [line]);

  /**
   * Valide les règles métier pour les lignes jumelles
   */
  const { validationErrors, validationWarnings } = useMemo(() => {
    const errors = [];
    const warnings = [];

    if (twinLines.length === 0) {
      return { validationErrors: errors, validationWarnings: warnings };
    }

    // Récupérer le statut de l'ordre parent de la ligne actuelle
    const currentOrder = line.supplier_order_id || line.supplierOrderId;
    const currentOrderStatus = typeof currentOrder === 'object' ? currentOrder.status : null;

    // Filtrer les jumelles avec statut non ORDERED et non CLOSED
    const activeTwins = twinLines.filter((twin) => {
      const twinOrder = twin.supplier_order_id;
      const status = typeof twinOrder === 'object' ? twinOrder.status : null;
      return status && status !== 'ORDERED' && status !== 'CLOSED';
    });

    if (activeTwins.length === 0) {
      return { validationErrors: errors, validationWarnings: warnings };
    }

    // Vérifier que tous les ordres (ligne actuelle + jumelles) sont en statut SENT (ASK)
    const allLines = [{ ...line, supplier_order_id: currentOrder }, ...activeTwins];

    const nonSentLines = allLines.filter((l) => {
      const order = l.supplier_order_id;
      const status = typeof order === 'object' ? order.status : null;
      return status !== 'SENT';
    });

    if (nonSentLines.length > 0) {
      errors.push(
        `Toutes les lignes jumelles doivent être en statut "SENT" (demande de devis) pour comparaison. ` +
          `${nonSentLines.length} ligne(s) ont un statut différent.`
      );
    }

    // Vérifier qu'au maximum 1 ligne est sélectionnée
    const selectedLines = allLines.filter((l) => l.is_selected === true);

    if (selectedLines.length > 1) {
      errors.push(
        `Une seule ligne peut être sélectionnée parmi les jumelles. ` +
          `Actuellement ${selectedLines.length} lignes sont sélectionnées.`
      );
    }

    // Vérifier que les devis ont été reçus
    const linesWithoutQuote = allLines.filter((l) => !l.quote_received);

    if (linesWithoutQuote.length > 0) {
      warnings.push(
        `${linesWithoutQuote.length} ligne(s) n'ont pas encore reçu de devis. ` +
          `Il est recommandé d'attendre tous les devis avant de comparer.`
      );
    }

    // Si aucune ligne n'est sélectionnée, avertir
    if (selectedLines.length === 0 && activeTwins.length > 0) {
      warnings.push(
        `Aucune ligne n'est sélectionnée. Vous devez comparer les offres et sélectionner la meilleure.`
      );
    }

    return { validationErrors: errors, validationWarnings: warnings };
  }, [line, twinLines]);

  /**
   * Vérifie si la ligne peut être commandée
   */
  const canOrder = () => {
    return validationErrors.length === 0 && twinLines.length === 0;
  };

  /**
   * Vérifie si la ligne a des jumelles actives
   */
  const hasTwins = () => {
    return twinLines.length > 0;
  };

  /**
   * Récupère le nombre de lignes sélectionnées (incluant la ligne actuelle)
   */
  const getSelectedCount = () => {
    const allLines = [line, ...twinLines];
    return allLines.filter((l) => l.is_selected === true).length;
  };

  return {
    // État
    twinLines,
    loading: false, // Plus de chargement car données déjà présentes
    validationErrors,
    validationWarnings,

    // Méthodes
    revalidate: () => {}, // Plus besoin de revalider
    canOrder,
    hasTwins,
    getSelectedCount,

    // Infos utiles
    twinCount: twinLines.length,
    hasErrors: validationErrors.length > 0,
    hasWarnings: validationWarnings.length > 0,
    isValid: validationErrors.length === 0,
  };
}

export default useTwinLinesValidation;
