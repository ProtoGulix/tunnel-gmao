import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getErrorMessage } from '../lib/api/errors'
import { useServerHealth } from '../hooks/shared/useServerHealth'
import { Loader2, WifiOff, Wifi } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const serverStatus = useServerHealth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full border border-tunnel-border rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-tunnel-accent/30 focus:border-tunnel-accent'

  return (
    <div className="min-h-screen bg-tunnel-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 bg-white shadow-md" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}>
            <img src="/Tunnel_Logo.png" alt="Tunnel" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-lg font-bold tracking-widest text-tunnel-text uppercase">Tunnel GMAO</h1>
          <p className="text-sm text-tunnel-muted mt-1">GMAO Technicien</p>
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full">
            {serverStatus === 'checking' && <><span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse inline-block" /><span className="text-yellow-600">Vérification du serveur…</span></>}
            {serverStatus === 'ok'       && <><Wifi size={12} className="text-green-500" /><span className="text-green-600">Serveur connecté</span></>}
            {serverStatus === 'error'    && <><WifiOff size={12} className="text-red-500" /><span className="text-red-600">Serveur inaccessible</span></>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">{error}</div>
          )}
          <div>
            <input
              type="email"
              required
              autoComplete="email"
              className={inputClass}
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <input
              type="password"
              required
              autoComplete="current-password"
              className={inputClass}
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading || serverStatus === 'error'}
            className="w-full py-3 rounded-lg bg-tunnel-accent text-white font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Se connecter
          </button>
        </form>
      </div>
    </div>
  )
}
