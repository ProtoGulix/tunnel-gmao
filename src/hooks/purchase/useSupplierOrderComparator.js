/**
 * État et logique du comparateur de paniers fournisseurs (2 paniers dans le cas
 * nominal, jusqu'à MAX_COMPARED_ORDERS techniquement possible).
 * @module hooks/purchase/useSupplierOrderComparator
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  fetchSupplierOrders,
  fetchSupplierOrderLines,
  fetchSupplierOrderDetail,
  fetchSupplierOrderStatuses,
  updateSupplierOrderLine,
} from '@/api/supplierOrders';
import { mapWithConcurrency } from '@/lib/utils/concurrency';
import {
  MAX_COMPARED_ORDERS,
  articleKeysOf,
  computeSelectedMaxDelay,
  computeSelectedTotal,
  countSelectedLines,
  isOrderComparable,
  mergeLinesAcrossOrders,
} from '@/components/purchase/tabs/comparator/comparatorHelpers';

const AUTOSAVE_DELAY_MS = 600;

function initDraftsFor(lines, setDrafts) {
  setDrafts((prev) => {
    const next = { ...prev };
    (lines || []).forEach((l) => {
      if (!next[l.id]) next[l.id] = { unit_price: l.unit_price ?? '', lead_time_days: l.lead_time_days ?? '' };
    });
    return next;
  });
}

export function useSupplierOrderComparator() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allOrders, setAllOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [statusMap, setStatusMap] = useState({});

  const [selectedIds, setSelectedIds] = useState(() => {
    const fromUrl = searchParams.get('orders');
    return fromUrl ? fromUrl.split(',').filter(Boolean).slice(0, MAX_COMPARED_ORDERS) : [];
  });
  const [ordersData, setOrdersData] = useState({});
  const [candidateKeysById, setCandidateKeysById] = useState({});
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [savingLines, setSavingLines] = useState({});
  const [lineErrors, setLineErrors] = useState({});
  const [selecting, setSelecting] = useState(null);
  const debounceTimers = useRef({});

  useEffect(() => () => {
    Object.values(debounceTimers.current).forEach(clearTimeout);
  }, []);

  useEffect(() => {
    setLoadingOrders(true);
    fetchSupplierOrders({ limit: 500 }).then(({ items }) => setAllOrders(items)).finally(() => setLoadingOrders(false));
    fetchSupplierOrderStatuses().then((list) => {
      const map = {};
      list.forEach((s) => { map[s.code] = s; });
      setStatusMap(map);
    }).catch(() => {});
  }, []);

  // Persiste la sélection dans l'URL (partage de lien, retour navigateur)
  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (selectedIds.length > 0) next.set('orders', selectedIds.join(',')); else next.delete('orders');
      return next;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds]);

  // Charge le détail (lignes) de chaque panier sélectionné
  useEffect(() => {
    if (selectedIds.length === 0) { setOrdersData({}); return; }
    let cancelled = false;
    setLoadingDetail(true);
    Promise.all(selectedIds.map((id) => fetchSupplierOrderDetail(id)))
      .then((details) => {
        if (cancelled) return;
        const map = {};
        details.forEach((d) => { map[d.id] = d; initDraftsFor(d.lines, setDrafts); });
        setOrdersData(map);
      })
      .finally(() => { if (!cancelled) setLoadingDetail(false); });
    return () => { cancelled = true; };
  }, [selectedIds]);

  // Précalcule les clés d'articles de tous les paniers non sélectionnés, pour le filtre de compatibilité
  useEffect(() => {
    const candidates = allOrders.filter((o) => !selectedIds.includes(o.id));
    const toFetch = candidates.filter((o) => !(o.id in candidateKeysById));
    if (toFetch.length === 0) return undefined;
    let cancelled = false;
    // Concurrence plafonnée : toFetch peut contenir des dizaines de commandes candidates,
    // et un Promise.all sans limite sature le pool de connexions DB backend (DB_POOL_MAX),
    // faisant échouer une partie des requêtes en DatabaseError alors que rien n'est en panne.
    const CONCURRENCY_LIMIT = 5;
    mapWithConcurrency(
      toFetch,
      CONCURRENCY_LIMIT,
      (o) => fetchSupplierOrderLines(o.id).then((lines) => [o.id, articleKeysOf(lines)]).catch(() => [o.id, new Set()])
    )
      .then((pairs) => {
        if (cancelled) return;
        setCandidateKeysById((prev) => {
          const next = { ...prev };
          pairs.forEach(([id, keys]) => { next[id] = keys; });
          return next;
        });
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allOrders, selectedIds]);

  const selectedOrders = selectedIds.map((id) => ordersData[id]).filter(Boolean);

  const rows = useMemo(() => {
    if (selectedOrders.length === 0) return [];
    return mergeLinesAcrossOrders(selectedOrders.map((o) => ({ id: o.id, lines: o.lines || [] })));
  }, [selectedOrders]);

  const selectedKeysList = useMemo(() => selectedOrders.map((o) => articleKeysOf(o.lines)), [selectedOrders]);

  const candidates = useMemo(() => allOrders.filter((o) => {
    if (selectedIds.includes(o.id)) return false;
    const keys = candidateKeysById[o.id];
    if (!keys) return false; // pas encore chargé
    return isOrderComparable(keys, selectedKeysList);
  }), [allOrders, selectedIds, candidateKeysById, selectedKeysList]);

  const addOrder = (id) => setSelectedIds((prev) => (prev.length >= MAX_COMPARED_ORDERS ? prev : [...prev, id]));
  const removeOrder = (id) => setSelectedIds((prev) => prev.filter((x) => x !== id));

  const refreshSelectedOrders = async () => {
    const details = await Promise.all(selectedIds.map((id) => fetchSupplierOrderDetail(id)));
    const map = {};
    details.forEach((d) => { map[d.id] = d; });
    setOrdersData(map);
  };

  /** Envoie le PATCH pour une ligne et resync les paniers avec la réponse serveur. */
  const saveLine = async (lineId, draft) => {
    setSavingLines((prev) => ({ ...prev, [lineId]: true }));
    setLineErrors((prev) => ({ ...prev, [lineId]: null }));
    try {
      await updateSupplierOrderLine(lineId, {
        unit_price: draft.unit_price !== '' ? Number(draft.unit_price) : null,
        lead_time_days: draft.lead_time_days !== '' ? Number(draft.lead_time_days) : null,
      });
      await refreshSelectedOrders();
    } catch (err) {
      setLineErrors((prev) => ({ ...prev, [lineId]: err?.response?.data?.detail || 'Erreur lors de la sauvegarde' }));
    } finally {
      setSavingLines((prev) => ({ ...prev, [lineId]: false }));
    }
  };

  /** Met à jour le draft localement puis sauvegarde automatiquement (débouncée). */
  const changeDraft = (lineId, field, value) => {
    setDrafts((prev) => {
      const next = { ...prev, [lineId]: { ...prev[lineId], [field]: value } };
      clearTimeout(debounceTimers.current[lineId]);
      debounceTimers.current[lineId] = setTimeout(() => {
        saveLine(lineId, next[lineId]);
      }, AUTOSAVE_DELAY_MS);
      return next;
    });
  };

  const selectLine = async (lineId) => {
    setSelecting(lineId);
    try {
      await updateSupplierOrderLine(lineId, { is_selected: true });
      await refreshSelectedOrders();
    } finally {
      setSelecting(null);
    }
  };

  const totalsByOrderId = {};
  const selectedCountByOrderId = {};
  const maxDelayByOrderId = {};
  selectedOrders.forEach((o) => {
    totalsByOrderId[o.id] = computeSelectedTotal(o.lines, drafts);
    selectedCountByOrderId[o.id] = countSelectedLines(o.lines);
    maxDelayByOrderId[o.id] = computeSelectedMaxDelay(o.lines, drafts);
  });

  return {
    allOrders, loadingOrders, statusMap,
    selectedIds, selectedOrders, candidates,
    rows, drafts, savingLines, lineErrors, selecting,
    loadingDetail,
    addOrder, removeOrder, changeDraft, selectLine,
    totalsByOrderId, selectedCountByOrderId, maxDelayByOrderId,
  };
}
