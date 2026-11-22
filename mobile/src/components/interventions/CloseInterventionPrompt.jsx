import { useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { AuditReasonSheet } from '../ui/AuditReasonSheet'
import { closeIntervention } from '../../api/interventions'
import { getAuditReasons, getErrorMessage } from '../../lib/api/errors'

/**
 * CloseInterventionPrompt — confirme la clôture d'une intervention : proposée après la
 * clôture de sa dernière tâche (ADR 0025 point 5) ou demandée depuis la feuille de statut
 * (ADR 0027 : une seule porte de clôture). Refuser ne change rien.
 *
 * Accepter envoie la même requête que le web. Si le backend exige un motif
 * d'audit (400 avec `audit.reasons`), les motifs de l'API sont proposés dans
 * AuditReasonSheet puis la requête est rejouée : aucun motif en dur.
 *
 * @param {{ intervention: { id: string, code?: string }, onClosed: () => void, onDismiss: () => void, title?: string }} props
 */
export function CloseInterventionPrompt({ intervention, onClosed, onDismiss, title = 'Dernière tâche terminée' }) {
  const [saving, setSaving] = useState(false)
  const [reasons, setReasons] = useState(null)
  const [error, setError] = useState(null)

  async function submit(audit) {
    setSaving(true)
    setError(null)
    try {
      await closeIntervention(intervention.id, audit)
      setReasons(null)
      onClosed()
    } catch (err) {
      const asked = getAuditReasons(err)
      if (asked) {
        setReasons(asked)
      } else {
        setReasons(null)
        setError(getErrorMessage(err))
      }
      setSaving(false)
    }
  }

  if (reasons) {
    return (
      <AuditReasonSheet
        title="Pourquoi clore cette intervention ?"
        reasons={reasons}
        onConfirm={submit}
        onCancel={() => setReasons(null)}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="bg-white rounded-t-2xl safe-bottom px-4 pt-5 pb-3">
        <div className="flex flex-col items-center gap-2 text-center mb-4">
          <CheckCircle2 size={28} className="text-green-600" />
          <p className="text-sm font-semibold text-tunnel-text">{title}</p>
          <p className="text-sm text-tunnel-muted">
            Clore l'intervention{intervention.code ? ` ${intervention.code}` : ''} ?
          </p>
        </div>
        {error && (
          <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">{error}</div>
        )}
        <button
          type="button"
          disabled={saving}
          onClick={() => submit()}
          className="w-full py-3 rounded-lg bg-tunnel-accent text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          Oui, clore l'intervention
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onDismiss}
          className="w-full py-3 text-sm text-tunnel-muted font-medium mt-1 disabled:opacity-50"
        >
          Non, laisser ouverte
        </button>
      </div>
    </div>
  )
}
