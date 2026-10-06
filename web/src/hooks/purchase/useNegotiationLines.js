/**
 * Hook gérant l'état local des drafts de lignes en mode négociation.
 * Après un PATCH, le backend renvoie la ligne mise à jour avec tous les champs
 * calculés (total_price, consultation_resolved, is_selected...).
 *
 * @module hooks/purchase/useNegotiationLines
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { updateSupplierOrderLine } from '@/api/supplierOrders';

const AUTOSAVE_DELAY_MS = 600;

export function useNegotiationLines() {
  const [lineDrafts, setLineDrafts] = useState({});
  const [savingLines, setSavingLines] = useState({});
  const [lineErrors, setLineErrors] = useState({});
  const debounceTimers = useRef({});

  // Annule les sauvegardes différées en attente si le composant est démonté (changement de sélection)
  useEffect(() => () => {
    Object.values(debounceTimers.current).forEach(clearTimeout);
  }, []);

  const initDrafts = useCallback((lines) => {
    const drafts = {};
    lines.forEach((l) => {
      drafts[l.id] = {
        is_selected: l.is_selected,
        quantity: l.quantity,
        unit_price: l.unit_price ?? '',
      };
    });
    setLineDrafts(drafts);
  }, []);

  /**
   * Envoie le PATCH et applique la ligne renvoyée par le backend (source de vérité pour total_price etc.).
   */
  const saveLine = useCallback(async (lineId, draft, onSuccess) => {
    setSavingLines((prev) => ({ ...prev, [lineId]: true }));
    setLineErrors((prev) => ({ ...prev, [lineId]: null }));
    try {
      const payload = {
        is_selected: draft.is_selected,
        quantity: Number(draft.quantity),
        unit_price: draft.unit_price !== '' ? Number(draft.unit_price) : null,
      };
      const updated = await updateSupplierOrderLine(lineId, payload);
      // Resync le draft avec les valeurs confirmées par le backend
      setLineDrafts((prev) => ({
        ...prev,
        [lineId]: {
          is_selected: updated.is_selected,
          quantity: updated.quantity,
          unit_price: updated.unit_price ?? '',
        },
      }));
      onSuccess?.(lineId, updated);
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Erreur lors de la sauvegarde';
      setLineErrors((prev) => ({ ...prev, [lineId]: msg }));
    } finally {
      setSavingLines((prev) => ({ ...prev, [lineId]: false }));
    }
  }, []);

  /**
   * Met à jour le draft localement puis sauvegarde automatiquement (débouncée pour les champs
   * texte/nombre, immédiate pour la sélection) — aucune validation manuelle requise.
   */
  const changeDraft = useCallback((lineId, changes, onSuccess) => {
    setLineDrafts((prev) => {
      const next = { ...prev, [lineId]: { ...prev[lineId], ...changes } };

      clearTimeout(debounceTimers.current[lineId]);
      if ('is_selected' in changes) {
        saveLine(lineId, next[lineId], onSuccess);
      } else {
        debounceTimers.current[lineId] = setTimeout(() => {
          saveLine(lineId, next[lineId], onSuccess);
        }, AUTOSAVE_DELAY_MS);
      }

      return next;
    });
  }, [saveLine]);

  return { lineDrafts, savingLines, lineErrors, initDrafts, changeDraft };
}

export function useDeliveryDate() {
  const [deliveryDate, setDeliveryDate] = useState('');
  const [saving, setSaving] = useState(false);

  const save = useCallback(async (orderId, onSuccess) => {
    setSaving(true);
    try {
      const { updateSupplierOrder } = await import('@/api/supplierOrders');
      const updated = await updateSupplierOrder(orderId, { expected_delivery_date: deliveryDate || null });
      onSuccess?.(updated);
    } catch {
      // non-bloquant
    } finally {
      setSaving(false);
    }
  }, [deliveryDate]);

  return { deliveryDate, setDeliveryDate, saving, save };
}
