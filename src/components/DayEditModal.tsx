import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

interface DayEditModalProps {
  dateKey: string | null;
  onClose: () => void;
}

export const DayEditModal: React.FC<DayEditModalProps> = ({ dateKey, onClose }) => {
  const { workLogs, updateDayMinutes, addManualSession, setDayLeave, deleteSession, clearDayLog, hourlyRate } =
    useWork();

  const [hoursInput, setHoursInput] = useState<string>('8');
  const [minutesInput, setMinutesInput] = useState<string>('0');
  const [noteInput, setNoteInput] = useState<string>('');

  const dayLog = dateKey ? workLogs[dateKey] : null;
  const currentTotalMinutes = dayLog ? dayLog.totalMinutes : 0;

  useEffect(() => {
    if (dayLog && dayLog.totalMinutes > 0) {
      setHoursInput(String(Math.floor(dayLog.totalMinutes / 60)));
      setMinutesInput(String(Math.round(dayLog.totalMinutes % 60)));
    } else {
      setHoursInput('8');
      setMinutesInput('0');
    }
  }, [dayLog, dateKey]);

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

  const handleSaveDirect = () => {
    const h = parseInt(hoursInput, 10) || 0;
    const min = parseInt(minutesInput, 10) || 0;
    const total = Math.max(0, h * 60 + min);
    updateDayMinutes(dateKey, total);
    onClose();
  };

  const handleQuickAdd = (additionalMinutes: number) => {
    addManualSession(
      dateKey,
      additionalMinutes,
      noteInput.trim() ? noteInput.trim() : `Adăugare manuală (+${additionalMinutes}m)`
    );
    setNoteInput('');
  };

  const handleSetExact = (minutes: number) => {
    updateDayMinutes(dateKey, minutes);
    setHoursInput(String(Math.floor(minutes / 60)));
    setMinutesInput(String(minutes % 60));
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

        {/* Manual adjustment section */}
        <div className="mt-4 flex flex-col gap-3">
          <label className="text-xs font-bold text-slate-300 block">
            Setează totalul de ore pentru această zi:
          </label>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-400">Ore</span>
              <input
                type="number"
                min="0"
                max="24"
                value={hoursInput}
                onChange={(e) => setHoursInput(e.target.value)}
                className="neo-input-inset text-center py-2"
                placeholder="Ore"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-400">Minute</span>
              <input
                type="number"
                min="0"
                max="59"
                step="5"
                value={minutesInput}
                onChange={(e) => setMinutesInput(e.target.value)}
                className="neo-input-inset text-center py-2"
                placeholder="Minute"
              />
            </div>
          </div>

          {/* Quick presets buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleSetExact(480)}
              className="glass-pill px-3 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/20 transition-all border border-sky-400/30"
            >
              8h (Normă întreagă)
            </button>
            <button
              type="button"
              onClick={() => handleSetExact(240)}
              className="glass-pill px-3 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/20 transition-all border border-sky-400/30"
            >
              4h (Jumătate de normă)
            </button>
            <button
              type="button"
              onClick={() => handleSetExact(600)}
              className="glass-pill px-3 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/20 transition-all border border-sky-400/30"
            >
              10h (Tură lungă)
            </button>
            <button
              type="button"
              onClick={() => handleSetExact(720)}
              className="glass-pill px-3 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/20 transition-all border border-sky-400/30"
            >
              12h (Tură 12h)
            </button>
          </div>

          {/* Leave / Concediu Section */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Palmtree size={14} />
                Zile de Concediu (CO)
              </span>
              {dayLog?.isLeave && (
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Marcat ca Concediu
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setDayLeave(dateKey, true, 480);
                  onClose();
                }}
                className="flex-1 glass-pill px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all border border-amber-400/30"
              >
                Concediu Plătit (8h)
              </button>
              <button
                type="button"
                onClick={() => {
                  setDayLeave(dateKey, true, 0);
                  onClose();
                }}
                className="flex-1 glass-pill px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all border border-amber-400/30"
              >
                Concediu (0h)
              </button>
              {dayLog?.isLeave && (
                <button
                  type="button"
                  onClick={() => {
                    setDayLeave(dateKey, false);
                    onClose();
                  }}
                  className="w-full glass-pill px-3 py-1.5 text-[11px] font-bold text-rose-400 hover:bg-rose-500/15 transition-all border border-rose-400/30"
                >
                  Anulează statutul de Concediu
                </button>
              )}
            </div>
          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSaveDirect}
            className="neo-button w-full py-3.5 mt-2 bg-gradient-to-r from-sky-500 to-blue-600 font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2"
          >
            <Check size={18} />
            Salvează Orele Zilei
          </button>
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
                      {session.note || (session.manual ? 'Adăugare manuală' : 'Tură cronometrată')}
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

