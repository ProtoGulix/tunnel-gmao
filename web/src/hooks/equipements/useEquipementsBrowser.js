/**
 * @fileoverview Hook de navigation dans le parc d'équipements (page master-detail)
 * @module hooks/equipements/useEquipementsBrowser
 *
 * Deux modes :
 * - 'tree' : racines (roots_only) toutes repliées ; les filles d'un nœud sont chargées
 *   à la demande (select_mere), mises en cache par nœud.
 * - 'flat' : liste paginée côté serveur (recherche, filtre de classe).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchEquipements } from '@/api/equipements';
import { useDebounce } from '@/hooks/useDebounce';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export const FLAT_PAGE_SIZE = 50;
const TREE_LIMIT = 500;
const LOAD_ERROR = 'Erreur lors du chargement des équipements';

const EMPTY_NODE = { items: [], loading: false, error: null };

export function useEquipementsBrowser({ mode, search, classFilter, sort }) {
  const debouncedSearch = useDebounce(search, 350);

  // Facettes de classe (jeu complet, indépendant des filtres)
  const [facets, setFacets] = useState([]);
  useEffect(() => {
    let cancelled = false;
    fetchEquipements({ limit: 1 })
      .then((r) => { if (!cancelled) setFacets(r.facets?.equipement_class ?? []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  /* ── Mode à plat ─────────────────────────────────────────────────────── */
  const [flat, setFlat] = useState({ items: [], total: 0, loading: true, error: null });
  const [page, setPage] = useState(1);
  const flatRequest = useRef(0);

  useEffect(() => { setPage(1); }, [debouncedSearch, classFilter, sort]);

  const loadFlat = useCallback(async () => {
    const requestId = ++flatRequest.current;
    setFlat((f) => ({ ...f, loading: true, error: null }));
    try {
      const r = await fetchEquipements({
        skip: (page - 1) * FLAT_PAGE_SIZE,
        limit: FLAT_PAGE_SIZE,
        search: debouncedSearch,
        selectClass: classFilter || undefined,
        sort,
      });
      if (requestId !== flatRequest.current) return;
      setFlat({ items: r.items ?? [], total: r.pagination?.total ?? 0, loading: false, error: null });
    } catch (err) {
      if (requestId !== flatRequest.current) return;
      setFlat({ items: [], total: 0, loading: false, error: extractApiErrorMessage(err, LOAD_ERROR) });
    }
  }, [page, debouncedSearch, classFilter, sort]);

  useEffect(() => {
    if (mode === 'flat') loadFlat();
  }, [mode, loadFlat]);

  /* ── Mode arbre ──────────────────────────────────────────────────────── */
  const [roots, setRoots] = useState({ ...EMPTY_NODE, loading: true });
  const [childrenMap, setChildrenMap] = useState({});
  const [expanded, setExpanded] = useState(() => new Set());
  const childrenRef = useRef(childrenMap);
  childrenRef.current = childrenMap;
  const sortRef = useRef(sort);
  sortRef.current = sort;
  const treeEpoch = useRef(0);
  const revealPath = useRef([]); // dernière chaîne d'ancêtres à révéler (sélection courante)
  const expandPathRef = useRef(null);

  const loadRoots = useCallback(async () => {
    const epoch = treeEpoch.current;
    setRoots((r) => ({ ...r, loading: true, error: null }));
    try {
      const res = await fetchEquipements({ rootsOnly: true, limit: TREE_LIMIT, sort: sortRef.current });
      if (epoch !== treeEpoch.current) return;
      setRoots({ items: res.items ?? [], loading: false, error: null });
    } catch (err) {
      if (epoch !== treeEpoch.current) return;
      setRoots({ items: [], loading: false, error: extractApiErrorMessage(err, LOAD_ERROR) });
    }
  }, []);

  const loadChildren = useCallback(async (id) => {
    const epoch = treeEpoch.current;
    setChildrenMap((m) => ({ ...m, [id]: { ...(m[id] ?? EMPTY_NODE), loading: true, error: null } }));
    try {
      const res = await fetchEquipements({ selectMere: id, limit: TREE_LIMIT, sort: sortRef.current });
      if (epoch !== treeEpoch.current) return;
      setChildrenMap((m) => ({ ...m, [id]: { items: res.items ?? [], loading: false, error: null } }));
    } catch (err) {
      if (epoch !== treeEpoch.current) return;
      setChildrenMap((m) => ({
        ...m,
        [id]: { items: [], loading: false, error: extractApiErrorMessage(err, LOAD_ERROR) },
      }));
    }
  }, []);

  // Le tri change l'ordre de tous les niveaux : on repart d'un arbre replié,
  // puis on ré-ouvre le chemin de l'équipement sélectionné
  useEffect(() => {
    treeEpoch.current += 1;
    const epoch = treeEpoch.current;
    setChildrenMap({});
    setExpanded(new Set());
    if (mode !== 'tree') return;
    loadRoots().then(() => {
      if (epoch === treeEpoch.current) expandPathRef.current?.(revealPath.current);
    });
  }, [sort, mode, loadRoots]);

  const toggle = useCallback((id) => {
    const isOpen = expanded.has(id);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (isOpen) next.delete(id);
      else next.add(id);
      return next;
    });
    const cached = childrenRef.current[id];
    if (!isOpen && (!cached || cached.error)) loadChildren(id);
  }, [expanded, loadChildren]);

  /** Déplie une chaîne d'ancêtres (ex. pour révéler l'équipement sélectionné) */
  const expandPath = useCallback((ids) => {
    revealPath.current = ids ?? [];
    if (!ids?.length) return;
    setExpanded((prev) => {
      if (ids.every((id) => prev.has(id))) return prev;
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    ids.forEach((id) => {
      const cached = childrenRef.current[id];
      if (!cached || cached.error) loadChildren(id);
    });
  }, [loadChildren]);

  expandPathRef.current = expandPath;

  /** Recharge les racines et les nœuds dépliés (après création) */
  const refresh = useCallback(async () => {
    if (mode === 'flat') {
      await loadFlat();
      return;
    }
    // Les nœuds repliés mais en cache seraient périmés : on les vide
    setChildrenMap((m) => Object.fromEntries(Object.entries(m).filter(([id]) => expanded.has(id))));
    await loadRoots();
    expanded.forEach((id) => loadChildren(id));
  }, [mode, loadFlat, loadRoots, loadChildren, expanded]);

  return {
    facets,
    flat, page, setPage,
    roots, childrenMap, expanded, toggle, expandPath,
    refresh,
  };
}
