import { Outlet } from 'react-router-dom'
import { BottomNav } from '../ui/BottomNav'
import { useServerHealth } from '../../hooks/shared/useServerHealth'

const STATUS_CONFIG = {
  checking: { color: 'bg-yellow-400', label: 'Connexion…' },
  ok:       { color: 'bg-green-500',  label: 'Serveur connecté' },
  error:    { color: 'bg-red-500',    label: 'Serveur inaccessible' },
}

function ServerStatusBar() {
  const status = useServerHealth()
  if (status === 'ok') return null

  const { color, label } = STATUS_CONFIG[status]
  return (
    <div className={`flex items-center justify-center gap-2 py-1 text-xs text-white ${status === 'checking' ? 'bg-yellow-500' : 'bg-red-600'}`}>
      <span className={`inline-block w-2 h-2 rounded-full ${color} ${status === 'checking' ? 'animate-pulse' : ''}`} />
      {label}
    </div>
  )
}

export default function AppShell() {
  return (
    <div className="flex flex-col h-full bg-tunnel-bg safe-top">
      <ServerStatusBar />
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 'var(--bottom-nav-height)' }}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
