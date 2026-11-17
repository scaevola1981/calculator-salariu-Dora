import React, { useState, useMemo } from 'react';
import { useWork } from '../context/WorkContext';
import {
  formatMinutesToHM,
  formatMoney,
  formatTimeOnly,
} from '../utils/timeFormat';
import {
  X,
  Trash2,
  Check,
  Calendar,
  Palmtree,
  Clock,
} from 'lucide-react';

interface DayEditModalProps {
  dateKey: string | null;
  onClose: () => void;
}

export const DayEditModal: React.FC<DayEditModalProps> = ({ dateKey, onClose }) => {
  const { workLogs, addManualSession, setDayLeave, deleteSession, clearDayLog, hourlyRate } =
    useWork();

  const [entryTime, setEntryTime] = useState<string>('08:00');
  const [exitTime, setExitTime] = useState<string>('16:00');

  const dayLog = dateKey ? workLogs[dateKey] : null;
  const currentTotalMinutes = dayLog ? dayLog.totalMinutes : 0;

  // Calculate minutes automatically from entryTime & exitTime
  const { calculatedMinutes, startTs, endTs } = useMemo(() => {
    if (!dateKey || !entryTime || !exitTime) {
      return { calculatedMinutes: 0, startTs: 0, endTs: 0 };
    }
    const [y, m, d] = dateKey.split('-').map(Number);
    const [inH, inM] = entryTime.split(':').map(Number);
    const [outH, outM] = exitTime.split(':').map(Number);

    const startDate = new Date(y, m - 1, d, inH || 0, inM || 0, 0, 0);
    const endDate = new Date(y, m - 1, d, outH || 0, outM || 0, 0, 0);

    // Handle overnight shifts (e.g. 22:00 -> 06:00)
    if (endDate.getTime() <= startDate.getTime()) {
      endDate.setDate(endDate.getDate() + 1);
    }

    const diffMins = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
    return {
      calculatedMinutes: Math.max(0, diffMins),
      startTs: startDate.getTime(),
      endTs: endDate.getTime(),
    };
  }, [dateKey, entryTime, exitTime]);

  if (!dateKey) return null;

  // Format date readable in Romanian
  const [y, m, d] = dateKey.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayNames = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
  const monthNames = [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
  ];
  const dateFormatted = `${dayNames[dateObj.getDay()]}, ${d} ${monthNames[m - 1]} ${y}`;

  const handleSaveEntryExit = () => {
    if (calculatedMinutes <= 0) return;
    addManualSession(dateKey, calculatedMinutes, 'Pontaj manual', startTs, endTs);
    onClose();
  };

  const handleClear = () => {
    if (confirm(`Sigur vrei să ștergi toate orele înregistrate pentru ${dateFormatted}?`)) {
      clearDayLog(dateKey);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-sky-500/15 border border-sky-400/25 flex items-center justify-center text-sky-400">
              <Calendar size={17} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Editare Pontaj Zi
              </span>
              <h3 className="text-base font-bold text-white capitalize">{dateFormatted}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Day Stats Banner */}
        <div className="mt-4 glass-card p-3.5 flex items-center justify-between border border-sky-400/20 bg-sky-950/30">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Total Pontat în această zi
            </span>
            <span className="text-xl font-extrabold text-sky-300 font-mono-num">
              {formatMinutesToHM(currentTotalMinutes)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Valoare în bani
            </span>
            <span className="text-sm font-bold text-emerald-400 font-mono-num">
              {formatMoney((currentTotalMinutes / 60) * hourlyRate)}
            </span>
          </div>
        </div>

        {/* Ora de intrare & Ora de iesire */}
        <div className="mt-4 flex flex-col gap-3">
          <label className="text-xs font-bold text-slate-300 block">
            Introdu intervalul lucrat (intrare - ieșire):
          </label>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-400">Ora de intrare</span>
              <input
                type="time"
                value={entryTime}
                onChange={(e) => setEntryTime(e.target.value)}
                className="neo-input-inset text-center py-2.5 w-full"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-400">Ora de ieșire</span>
              <input
                type="time"
                value={exitTime}
                onChange={(e) => setExitTime(e.target.value)}
                className="neo-input-inset text-center py-2.5 w-full"
              />
            </div>
          </div>

          {/* Live Calculated Duration Preview */}
          <div className="glass-pill px-3.5 py-2 flex items-center justify-between text-xs border border-[#2686F3]/30">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Clock size={14} className="text-[#2686F3]" />
              Calcul automat:
            </span>
            <div className="flex items-center gap-2.5 font-mono-num font-extrabold">
              <span className="text-[#2686F3]">{formatMinutesToHM(calculatedMinutes)}</span>
              <span className="text-emerald-400">
                (+{formatMoney((calculatedMinutes / 60) * hourlyRate)})
              </span>
            </div>
          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSaveEntryExit}
            disabled={calculatedMinutes <= 0}
            className="neo-button w-full py-3.5 font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Check size={18} />
            Salvează Orele Zilei
          </button>

          {/* Leave / Concediu Section (Blue font) */}
          <div className="pt-2.5 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#2686F3] flex items-center gap-1.5">
                <Palmtree size={14} />
                Zile de Concediu (CO)
              </span>
              {dayLog?.isLeave && (
                <span className="text-[10px] font-bold bg-[#2686F3]/15 text-[#2686F3] border border-[#2686F3]/35 px-2 py-0.5 rounded-full">
                  Marcat ca Concediu
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!dayLog?.isLeave ? (
                <button
                  type="button"
                  onClick={() => {
                    setDayLeave(dateKey, true, 0);
                    onClose();
                  }}
                  className="w-full glass-pill px-3 py-2.5 text-xs font-bold text-[#2686F3] hover:bg-[#2686F3]/15 transition-all border border-[#2686F3]/35"
                >
                  Marchează ca Zi de Concediu (CO)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDayLeave(dateKey, false);
                    onClose();
                  }}
                  className="w-full glass-pill px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/15 transition-all border border-rose-400/30"
                >
                  Anulează statutul de Concediu
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Existing sessions list */}
        {dayLog && dayLog.sessions && dayLog.sessions.length > 0 && (
          <div className="mt-5 border-t border-white/10 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Înregistrări individuale ({dayLog.sessions.length})
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <Trash2 size={13} />
                Șterge ziua
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
              {dayLog.sessions.map((session, idx) => (
                <div
                  key={session.id || idx}
                  className="glass-pill px-3 py-2 flex items-center justify-between text-xs border border-white/10"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-200">
                      {session.note || (session.manual ? 'Pontaj manual' : 'Tură cronometrată')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono-num">
                      {formatTimeOnly(session.start)} - {formatTimeOnly(session.end)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono-num font-bold text-sky-300">
                      {formatMinutesToHM(session.durationMinutes)}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteSession(dateKey, session.id)}
                      aria-label="Șterge înregistrarea"
                      className="w-9 h-9 rounded-xl bg-rose-500 !text-white shadow-[0_3px_10px_rgba(244,63,94,0.4)] flex items-center justify-center active:scale-90 transition-all flex-shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
