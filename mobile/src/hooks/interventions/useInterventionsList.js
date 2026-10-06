import { useState, useEffect, useRef, useMemo } from 'react'
import { searchInterventions } from '../../api/interventions'

// ── Helpers ───────────────────────────────────────────────────────────────────

export function ageInDays(reported_date) {
  if (!reported_date) return 0
  return Math.floor((Date.now() - new Date(reported_date).getTime()) / 86_400_000)
}

// Ordre priorité pour tri client (le backend trie déjà par -priority mais on
// re-trie pour garantir l'ordre au sein de chaque segment)
const PRIORITY_ORDER = { urgent: 0, important: 1, normale: 2, faible: 3 }

function sortSegment(items) {
  return [...items].sort((a, b) => {
    // 1. Priorité urgente en premier
    const pa = PRIORITY_ORDER[a.priority] ?? 99
    const pb = PRIORITY_ORDER[b.priority] ?? 99
    if (pa !== pb) return pa - pb
    // 2. Non-imprimées avant imprimées
    if (a.printed_fiche !== b.printed_fiche) return a.printed_fiche ? 1 : -1
    // 3. Plus vieilles en premier (reported_date croissant = âge décroissant)
    return new Date(a.reported_date).getTime() - new Date(b.reported_date).getTime()
  })
}

// ── Segmentation (logique client, règles du prompt) ───────────────────────────
// Bloc 1 — À faire maintenant : ouvert, hors bloqué et projet
// Bloc 2 — Bloqué : status_actual IN (attente_pieces, attente_prod)
// Bloc 3 — Projets/Support : type_inter IN (PRO, PIL, MES) ET priority ≠ urgent
// Bloc 4 — À archiver : status_actual IN (ferme, cancelled) — collapsed par défaut

const PROJECT_TYPES  = new Set(['PRO', 'PIL', 'MES'])
const BLOCKED_STATUS = new Set(['attente_pieces', 'attente_prod'])
const ARCHIVE_STATUS = new Set(['ferme', 'cancelled'])

function segmentItems(items) {
  const todo = [], blocked = [], projects = [], archive = []

  for (const item of items) {
    if (ARCHIVE_STATUS.has(item.status_actual)) {
      archive.push(item)
    } else if (BLOCKED_STATUS.has(item.status_actual)) {
      blocked.push(item)
    } else if (PROJECT_TYPES.has(item.type_inter) && item.priority !== 'urgent') {
      projects.push(item)
    } else {
      todo.push(item)
    }
  }

  const segments = []
  if (todo.length)
    segments.push({ key: 'todo',     label: 'À faire maintenant', badgeColor: '#C62828', items: sortSegment(todo) })
  if (blocked.length)
    segments.push({ key: 'blocked',  label: 'Bloqué',             badgeColor: '#ED6C02', items: sortSegment(blocked) })
  if (projects.length)
    segments.push({ key: 'projects', label: 'Projets / Support',  badgeColor: '#1F3A5F', items: sortSegment(projects) })
  if (archive.length)
    segments.push({ key: 'archive',  label: 'À archiver',         badgeColor: '#616161', items: sortSegment(archive), collapsedByDefault: true })

  return segments
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useInterventionsList() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [query, setQuery]     = useState('')
  const intervalRef   = useRef(null)
  const abortRef      = useRef(null)

  function load(silent = false) {
    // Annuler la requête précédente si elle est encore en vol
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal

    if (!silent) setLoading(true)
    setError(null)

    searchInterventions({
      status: 'ouvert,attente_pieces,attente_prod,ferme,cancelled',
      sort: '-priority,-reported_date',
      limit: 500,
    }, { signal })
      .then(res => {
        if (signal.aborted) return
        setData(Array.isArray(res) ? res : (res.items ?? []))
      })
      .catch(err => {
        if (signal.aborted || err?.name === 'AbortError') return
        setError(err?.data?.detail ?? err?.message ?? 'Erreur inconnue')
      })
      .finally(() => {
        if (!signal.aborted && !silent) setLoading(false)
      })
  }

  // Chargement initial + auto-refresh silencieux toutes les 30s
  useEffect(() => {
    load()
    intervalRef.current = setInterval(() => load(true), 30_000)
    return () => {
      clearInterval(intervalRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  // Filtre texte côté client (search sur code, equipements.code, title)
  // Le backend propose aussi ?search= mais on filtre localement pour éviter
  // un re-fetch à chaque frappe
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return data
    return data.filter(i =>
      i.code?.toLowerCase().includes(q) ||
      i.equipements?.code?.toLowerCase().includes(q) ||
      i.title?.toLowerCase().includes(q)
    )
  }, [data, query])

  const segments = useMemo(() => segmentItems(filtered), [filtered])

  return { segments, query, setQuery, loading, error }
}
