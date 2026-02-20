/**
 * @fileoverview Hook pour détecter et valider les lignes jumelles (même DA chez différents fournisseurs)
 *
 * Permet de forcer l'utilisateur à comparer les devis de plusieurs fournisseurs
 * avant de valider une commande.
 *
 * @module hooks/useTwinLinesValidation
 */

import { useMemo } from 'react';
import { STATUS_MAPPING } from '@/components/purchase/orders/supplierOrdersConfig';
import { extractTwinLinesForLine } from '@/components/purchase/orders/OrderLineTable/helpers';

/**
 * Hook pour détecter et valider les lignes jumelles
 *
 * @param {Object} line - Ligne de commande à analyser
 * @returns {Object} État de validation des jumelles
 */
export function useTwinLinesValidation(line) {
  /**
   * Détecte et récupère les lignes jumelles depuis la fonction partagée
   */
  const twinLines = useMemo(() => {
    const { twinLines: extracted } = extractTwinLinesForLine(line);
    return extracted;
  }, [line]);

  /**
   * Valide les règles métier pour les lignes jumelles
   */
  const { validationErrors, validationWarnings } = useMemo(() => {
    const errors = [];
    const warnings = [];

    const getStatus = (order) => {
      const raw = typeof order === 'object' ? order?.status : order;
      if (!raw) return null;
      const upper = String(raw).toUpperCase();
      if (Object.prototype.hasOwnProperty.call(STATUS_MAPPING, upper)) return upper;
      return upper;
    };

    // Ensemble complet : ligne courante + toutes jumelles
    const currentOrder = line.supplier_order_id || line.supplierOrderId;
    const fullLines = [{ ...line, supplier_order_id: currentOrder }, ...twinLines];

    // Règle unique demandée : si une ligne est déjà commandée/close, aucune autre ne doit être sélectionnée
    const CLOSED_STATUSES = ['CLOSED', 'RECEIVED', 'ACK', 'CANCELLED'];
    const closedLines = fullLines.filter((l) =>
      CLOSED_STATUSES.includes(getStatus(l.supplier_order_id))
    );
    if (closedLines.length > 0) {
      const selectedNonClosed = fullLines.filter(
        (l) => l.is_selected === true && !CLOSED_STATUSES.includes(getStatus(l.supplier_order_id))
      );
      if (selectedNonClosed.length > 0) {
        errors.push(
          `Une ligne jumelle est déjà commandée (statut "CLOSED/RECEIVED"). ` +
            `Désélectionnez les autres lignes pour éviter une double commande.`
        );
      }
    }

    // On stoppe ici : autres règles mises en pause comme demandé
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
