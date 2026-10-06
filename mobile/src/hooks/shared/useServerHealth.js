import { useState, useEffect, useCallback } from 'react'
import { getHealth } from '../../api/health'

const POLL_INTERVAL = 30_000

export function useServerHealth() {
  const [status, setStatus] = useState('checking') // checking | ok | error

  const check = useCallback(async () => {
    try {
      await getHealth()
      setStatus('ok')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    check()
    const id = setInterval(check, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [check])

  return status
}
