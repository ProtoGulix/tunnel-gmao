import { useState, useEffect } from 'react'
import { getInterventionTypes } from '../../api/planning'

// Liste chargée une seule fois et partagée entre les écrans (ADR 0026). En cas d'échec le
// cache est vidé pour retenter au prochain affichage ; l'affichage se replie sur le code.
let cache = null

function loadTypes() {
  if (!cache) {
    cache = getInterventionTypes({ includeInactive: true }).catch((err) => {
      cache = null
      throw err
    })
  }
  return cache
}

const FALLBACK_COLOR = '#616161'

// L'API donne un nom de couleur Radix (celui du web) ; le mobile a besoin d'un hex
// (fond translucide = hex + alpha). Teinte 11 de Radix, lisible en texte sur fond clair.
const RADIX_HEX = {
  red: '#ce2c31', orange: '#cc4e00', amber: '#ab6400', yellow: '#9e6c00',
  green: '#218358', teal: '#008573', cyan: '#107d98', blue: '#0d74ce',
  indigo: '#3a5bc7', violet: '#6550b9', purple: '#8145b5', pink: '#c2298a',
  gray: '#646464',
}

function toHex(color) {
  if (!color) return FALLBACK_COLOR
  if (color.startsWith('#')) return color
  return RADIX_HEX[color] ?? FALLBACK_COLOR
}

/** Types d'intervention (actifs et inactifs) pour l'affichage : libellé et couleur par code. */
export function useInterventionTypes() {
  const [types, setTypes] = useState([])

  useEffect(() => {
    let alive = true
    loadTypes().then((list) => { if (alive) setTypes(list) }).catch(() => {})
    return () => { alive = false }
  }, [])

  const byId = new Map(types.map((t) => [t.id, t]))
  return {
    typeLabel: (id) => byId.get(id)?.title ?? id,
    typeColor: (id) => toHex(byId.get(id)?.color),
  }
}

/**
 * Types proposés dans un sélecteur : les actifs, plus le type courant s'il a été désactivé
 * (type suggéré par une demande, accepté par l'API même désactivé : ADR 0026).
 */
export function listedTypes(types, current) {
  return types.filter(t => t.is_active !== false || t.id === current)
}

/**
 * Types permis pour un équipement (ADR 0031), rechargés quand l'équipement change.
 * `loaded` reste faux tant que la liste de l'équipement courant n'est pas arrivée : ne rien
 * vider avant. En cas d'échec la liste reste vide et le backend arbitre à l'envoi.
 */
export function usePermittedTypes(machineId) {
  const [state, setState] = useState({ machineId: null, types: [] })

  useEffect(() => {
    let alive = true
    getInterventionTypes({ machineId })
      .then((types) => { if (alive) setState({ machineId, types }) })
      .catch(() => { if (alive) setState({ machineId, types: [] }) })
    return () => { alive = false }
  }, [machineId])

  return { types: state.types, loaded: state.machineId === machineId }
}
