/**
 * useFormGuard — chien de garde pour les formulaires.
 *
 * Retourne un `guardedClose` à utiliser à la place du onClose original.
 * Si le formulaire est "dirty" (modifié), affiche une modale de confirmation.
 * Sinon, ferme directement.
 *
 * Usage :
 *   const { guardedClose, ConfirmDialog } = useFormGuard({ dirty, onClose })
 *   ...
 *   <button onClick={guardedClose}>Annuler</button>
 *   <ConfirmDialog />
 */

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { BottomBar, BottomBtn } from '../../components/ui/BottomBar'

export function useFormGuard({ dirty, onClose }) {
  const [showConfirm, setShowConfirm] = useState(false)

  function guardedClose() {
    if (dirty) {
      setShowConfirm(true)
    } else {
      onClose()
    }
  }

  function ConfirmDialog() {
    if (!showConfirm) return null
    return (
      <div
        className="fixed inset-0 z-[80] flex items-end justify-center"
        style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={() => setShowConfirm(false)}
      >
        <div
          className="w-full bg-white rounded-t-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-tunnel-text">Abandonner la saisie ?</p>
              <p className="text-xs text-tunnel-muted mt-0.5">Les informations saisies seront perdues.</p>
            </div>
          </div>
          <BottomBar safeBottom={false}>
            <BottomBtn variant="secondary" type="button" onClick={() => setShowConfirm(false)}>
              Continuer la saisie
            </BottomBtn>
            <BottomBtn variant="danger" type="button" onClick={() => { setShowConfirm(false); onClose() }}>
              Abandonner
            </BottomBtn>
          </BottomBar>
        </div>
      </div>
    )
  }

  return { guardedClose, ConfirmDialog }
}
