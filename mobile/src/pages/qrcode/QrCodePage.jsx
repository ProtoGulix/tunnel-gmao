import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { QrCode, Loader2, AlertCircle } from 'lucide-react'

const READER_ID = 'qr-reader'

export default function QrCodePage() {
  const navigate = useNavigate()
  const scannerRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | starting | scanning | error
  const [error, setError] = useState(null)
  const [lastResult, setLastResult] = useState(null)

  useEffect(() => {
    let scanner = null

    const startScanner = async () => {
      setStatus('starting')
      setError(null)
      try {
        scanner = new Html5Qrcode(READER_ID)
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => handleScan(decodedText),
          () => {}
        )
        setStatus('scanning')
      } catch (err) {
        console.error('QR scanner error:', err)
        setStatus('error')
        setError(typeof err === 'string' ? err : (err?.message ?? JSON.stringify(err)))
      }
    }

    startScanner()

    return () => {
      const s = scannerRef.current
      if (s && s.isScanning) {
        s.stop().catch(() => {})
      }
    }
  }, [])

  const handleScan = (text) => {
    setLastResult(text)
    const t = text.trim()

    // URL contenant un chemin d'équipement avec UUID
    const equipUuidMatch = t.match(/equipements?\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
    if (equipUuidMatch) {
      navigate(`/equipements/${equipUuidMatch[1]}`)
      return
    }

    // Article stock : /stock/<uuid> ou /stock/<uuid>?purchase=1
    const stockUuidMatch = t.match(/stock\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(\?purchase=1)?/i)
    if (stockUuidMatch) {
      const suffix = stockUuidMatch[2] ? '?purchase=1' : ''
      navigate(`/stock/items/${stockUuidMatch[1]}${suffix}`)
      return
    }

    // UUID seul → fiche équipement
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t)) {
      navigate(`/equipements/${t}`)
      return
    }

    // URL ou ID numérique d'intervention
    const idMatch = t.match(/interventions?\/(\d+)/)
    if (idMatch) {
      navigate(`/interventions/${idMatch[1]}`)
      return
    }
    if (/^\d+$/.test(t)) {
      navigate(`/interventions/${t}`)
      return
    }
    // Sinon on affiche juste le résultat
  }

  return (
    <div className="flex flex-col h-full bg-tunnel-bg">
      <header className="bg-white border-b border-tunnel-border px-4 pt-4 pb-3">
        <h1 className="text-base font-semibold text-tunnel-text">Scanner QR Code</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto px-4 pt-6 gap-4">

        {/* Zone caméra */}
        <div className="w-full max-w-sm">
          <div
            id={READER_ID}
            className="w-full rounded-xl overflow-hidden border border-tunnel-border bg-black"
            style={{ minHeight: 280 }}
          />
        </div>

        {/* État */}
        {status === 'starting' && (
          <div className="flex items-center gap-2 text-sm text-tunnel-muted">
            <Loader2 size={16} className="animate-spin" />
            Démarrage de la caméra…
          </div>
        )}

        {status === 'scanning' && !lastResult && (
          <p className="text-sm text-tunnel-muted text-center">
            Pointez la caméra vers un QR code
          </p>
        )}

        {status === 'error' && (
          <div className="w-full max-w-sm flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">Caméra inaccessible</p>
              <p className="text-xs text-red-500 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Résultat non-navigation */}
        {lastResult && (
          <div className="w-full max-w-sm p-4 rounded-xl bg-white border border-tunnel-border">
            <div className="flex items-center gap-2 mb-2">
              <QrCode size={16} className="text-tunnel-accent" />
              <p className="text-xs font-semibold text-tunnel-muted uppercase tracking-wide">Résultat</p>
            </div>
            <p className="text-sm text-tunnel-text break-all">{lastResult}</p>
          </div>
        )}
      </div>
    </div>
  )
}
