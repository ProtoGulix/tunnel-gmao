import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { getActions } from '../../api/planning'

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function usePlanningWeek() {
  const { user } = useAuth()
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    const dateStr = toDateStr(date)
    return {
      date,
      dateStr,
      actions: actions.filter(a => {
        const d = (a.action_date ?? a.created_at ?? '').slice(0, 10)
        return d === dateStr
      }),
    }
  })

  const load = useCallback(() => {
    if (!user) return
    setLoading(true)
    setError(null)
    const endDate = new Date(weekStart)
    endDate.setDate(weekStart.getDate() + 6)
    getActions({
      tech_id: user.id,
      start_date: toDateStr(weekStart),
      end_date: toDateStr(endDate),
    })
      .then(res => {
        // L'API retourne [{date, actions:[]}] groupé par jour
        const grouped = Array.isArray(res) ? res : (res.items ?? [])
        const flat = grouped.flatMap(g => g.actions ?? [])
        setActions(flat)
      })
      .catch(err => setError(err?.data?.detail ?? err.message))
      .finally(() => setLoading(false))
  }, [weekStart, user])

  useEffect(() => { load() }, [load])

  function prevWeek() {
    setWeekStart(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() - 7)
      return d
    })
  }

  function nextWeek() {
    setWeekStart(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() + 7)
      return d
    })
  }

  function goToToday() {
    setWeekStart(getMonday(new Date()))
  }

  return { weekStart, days, loading, error, prevWeek, nextWeek, goToToday, reload: load }
}
