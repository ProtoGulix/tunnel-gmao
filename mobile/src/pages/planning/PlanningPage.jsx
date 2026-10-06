import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Loader2, Clock } from 'lucide-react'
import { usePlanningWeek } from '../../hooks/planning/usePlanningWeek'
import { ActionCard } from './ActionCard'
import { ActionForm } from '../../components/actions/ActionForm'
import { PurchaseRequestForm } from '../../components/purchases/PurchaseRequestForm'
import { formatWeekLabel, formatTime, isToday } from '../../utils/dateUtils'

const DAY_NAMES = ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.']
const MONTH_SHORT = ['jan.', 'fév.', 'mar.', 'avr.', 'mai', 'jun.', 'jul.', 'aoû.', 'sep.', 'oct.', 'nov.', 'déc.']

function formatDayHeader(date) {
  const dow = date.getDay()
  return `${DAY_NAMES[dow === 0 ? 6 : dow - 1]} ${date.getDate()} ${MONTH_SHORT[date.getMonth()]}`
}

const COL_WIDTH = 172

export default function PlanningPage() {
  const { weekStart, days, loading, error, prevWeek, nextWeek, goToToday, reload } = usePlanningWeek()
  const [addingDay, setAddingDay] = useState(null)
  const [purchaseActionId, setPurchaseActionId] = useState(null)

  return (
    <div className="flex flex-col h-full bg-tunnel-bg">
      {/* Header */}
      <header className="bg-white border-b border-tunnel-border shrink-0">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <h1 className="text-sm font-semibold text-tunnel-text tracking-tight">Planning</h1>
          <button
            onClick={goToToday}
            className="px-2.5 py-1 rounded-md border border-tunnel-accent/40 text-[11px] font-medium text-tunnel-accent bg-blue-50 active:bg-blue-100"
          >
            Aujourd'hui
          </button>
        </div>
        <div className="flex items-center gap-1.5 px-3 pb-3">
          <button
            onClick={prevWeek}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-tunnel-border text-tunnel-muted bg-white active:bg-tunnel-bg"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="flex-1 text-center text-xs font-semibold text-tunnel-text">
            {formatWeekLabel(weekStart)}
          </span>
          <button
            onClick={nextWeek}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-tunnel-border text-tunnel-muted bg-white active:bg-tunnel-bg"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={22} className="animate-spin text-tunnel-muted" />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex h-full" style={{ minWidth: days.length * COL_WIDTH }}>
            {days.map((day) => {
              const today = isToday(day.date)
              const totalHours = day.actions.reduce((s, a) => s + (a.time_spent ?? 0), 0)
              const totalFmt = formatTime(totalHours)

              return (
                <div
                  key={day.dateStr}
                  className={`flex flex-col border-r border-tunnel-border h-full ${today ? 'bg-blue-50/30' : ''}`}
                  style={{ width: COL_WIDTH, minWidth: COL_WIDTH }}
                >
                  {/* Header colonne */}
                  <div className={`px-2.5 py-2 border-b border-tunnel-border shrink-0 ${today ? 'bg-blue-50' : 'bg-white'}`}>
                    <p className={`text-[11px] font-bold uppercase tracking-wide ${today ? 'text-tunnel-accent' : 'text-tunnel-text'}`}>
                      {formatDayHeader(day.date)}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5 h-4">
                      {totalFmt ? (
                        <>
                          <Clock size={10} className="text-tunnel-muted" />
                          <span className="text-[10px] text-tunnel-muted">{totalFmt}</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {/* Bouton ajouter */}
                  <div className="px-2 pt-2 shrink-0">
                    <button
                      onClick={() => setAddingDay(day.dateStr)}
                      className="w-full flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px] font-medium text-tunnel-accent active:bg-blue-50"
                    >
                      <Plus size={11} />
                      Ajouter
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-1.5">
                    {day.actions.length === 0 ? (
                      <p className="text-center text-[10px] text-tunnel-muted/50 pt-4">Aucune action</p>
                    ) : (
                      day.actions.map((action, ai) => (
                        <ActionCard
                          key={action.id ?? ai}
                          action={action}
                          onAddPurchase={setPurchaseActionId}
                        />
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {addingDay && (
        <ActionForm
          actionDate={addingDay}
          onClose={() => setAddingDay(null)}
          onDone={() => { reload(); setAddingDay(null) }}
        />
      )}

      {purchaseActionId != null && (
        <PurchaseRequestForm
          actionId={purchaseActionId}
          onClose={() => setPurchaseActionId(null)}
          onDone={() => { setPurchaseActionId(null); reload() }}
        />
      )}
    </div>
  )
}
