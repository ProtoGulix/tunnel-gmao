import { useState, useCallback } from 'react'
import { getErrorMessage } from '../../lib/api/errors'

export function useApiStatus() {
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [error, setError] = useState(null)

  const run = useCallback(async (promise) => {
    setStatus('loading')
    setError(null)
    try {
      const result = await promise
      setStatus('success')
      return result
    } catch (err) {
      setStatus('error')
      setError(getErrorMessage(err))
      throw err
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setError(null)
  }, [])

  return { status, error, run, reset, isLoading: status === 'loading' }
}
