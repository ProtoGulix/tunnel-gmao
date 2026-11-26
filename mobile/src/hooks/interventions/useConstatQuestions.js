import { useState, useEffect } from 'react'
import { getConstatQuestions } from '../../api/constats'

/** Questions du constat, lues de l'API à chaque ouverture du formulaire. */
export function useConstatQuestions() {
  const [state, setState] = useState({ questions: [], loading: true, error: null })

  useEffect(() => {
    let alive = true
    getConstatQuestions()
      .then((questions) => { if (alive) setState({ questions, loading: false, error: null }) })
      .catch(() => { if (alive) setState({ questions: [], loading: false, error: 'Questions indisponibles' }) })
    return () => { alive = false }
  }, [])

  return state
}
