import React, { useState, useRef } from 'react';
import { useWork } from '../context/WorkContext';
import {
  formatMinutesToHM,
  formatMoney,
  getMonthDisplayName,
  formatDateKey,
  MONTH_NAMES_SHORT_RO,
} from '../utils/timeFormat';
import { DayEditModal } from './DayEditModal';
import { UpdateModal } from './UpdateModal';
import {
  Coins,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Sun,
  Moon,
  RefreshCw,
  Download,
  User,
  Share2,
  Upload,
  FileDown,
} from 'lucide-react';
import { APP_VERSION } from '../utils/updater';

export const CalendarPage: React.FC = () => {
  const {
    hourlyRate,
    setHourlyRate,
    workLogs,
    selectedMonth,
    setSelectedMonth,
    selectedMonthDate,
    totalMinutesMonth,
    totalMoneyMonth,
    daysWorkedMonth,
    dailyBarsData,
    theme,
    toggleTheme,
    updateInfo,
    checkingUpdate,
    recheckUpdate,
    userName,
    setUserName,
    importBackup,
  } = useWork();

  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [rateInputValue, setRateInputValue] = useState<string>(String(hourlyRate));
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpdateButtonClick = async () => {
    if (updateInfo?.hasUpdate && updateInfo.downloadUrl) {
      setShowUpdateModal(true);
      return;
    }
    const info = await recheckUpdate();
    if (info?.hasUpdate && info.downloadUrl) {
      setShowUpdateModal(true);
    }
  };

  // Sync rate input if external change
  React.useEffect(() => {
    setRateInputValue(String(hourlyRate));
  }, [hourlyRate]);

  const handleRateChange = (valStr: string) => {
    setRateInputValue(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed >= 0) {
      setHourlyRate(parsed);
    }
  };

  const handleRateStep = (delta: number) => {
    const next = Math.max(0, Math.round((hourlyRate + delta) * 10) / 10);
    setRateInputValue(String(next));
    setHourlyRate(next);
  };

  const showTempNotice = (msg: string) => {
    setBackupNotice(msg);
    setTimeout(() => setBackupNotice(null), 3500);
  };

  const handleShareWhatsApp = () => {
    const monthShort = MONTH_NAMES_SHORT_RO[selectedMonthDate.getMonth()];
    const displayMonth = getMonthDisplayName(
      selectedMonthDate.getFullYear(),
      selectedMonthDate.getMonth()
    );
    const activeDays = dailyBarsData.filter((b) => b.minutes > 0 || b.isLeave);

    const lines: string[] = [
      `📊 Raport Pontaj — ${displayMonth}${userName ? ` (${userName})` : ''}`,
      '────────────────────',
    ];

    if (activeDays.length === 0) {
      lines.push('Nicio zi lucrată în această lună.');
    } else {
      for (const bar of activeDays) {
        const dayStr = `${String(bar.day).padStart(2, '0')} ${monthShort} (${bar.dayOfWeek})`;
        if (bar.isLeave && bar.minutes === 0) {
          lines.push(`• ${dayStr}: Concediu (CO)`);
        } else {
          const money = Math.round(((bar.minutes / 60) * hourlyRate) * 100) / 100;
          const leaveTag = bar.isLeave ? ' [CO]' : '';
          lines.push(`• ${dayStr}${leaveTag}: ${formatMinutesToHM(bar.minutes)} — ${formatMoney(money)}`);
        }
      }
    }

    lines.push('────────────────────');
    lines.push(`⏱️ Total Ore: ${formatMinutesToHM(totalMinutesMonth)} (${daysWorkedMonth} zile)`);
    lines.push(`💰 Tarif: ${hourlyRate} €/h`);
    lines.push(`✅ TOTAL: ${formatMoney(totalMoneyMonth)}`);

    const reportText = lines.join('\n');
    const waUrl = `https://wa.me/?text=${encodeURIComponent(reportText)}`;
    window.open(waUrl, '_system');
  };

  const handleExportBackup = () => {
    try {
      const payload = {
        app: 'Contor Ore Dora',
        version: APP_VERSION,
        exportedAt: new Date().toISOString(),
        userName,
        hourlyRate,
        workLogs,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-contor-ore-${formatDateKey(new Date())}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showTempNotice('Backup JSON salvat!');
    } catch {
      showTempNotice('Eroare la exportul backup-ului.');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        if (!parsed || typeof parsed !== 'object') {
          showTempNotice('Fișier backup invalid.');
          return;
        }
        importBackup({
          userName: typeof parsed.userName === 'string' ? parsed.userName : undefined,
          hourlyRate: typeof parsed.hourlyRate === 'number' ? parsed.hourlyRate : undefined,
          workLogs: parsed.workLogs && typeof parsed.workLogs === 'object' ? parsed.workLogs : undefined,
        });
        showTempNotice('Backup restaurat cu succes!');
      } catch {
        showTempNotice('Nu s-a putut citi fișierul JSON.');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  // Build calendar matrix for selected month
  const year = selectedMonthDate.getFullYear();
  const month = selectedMonthDate.getMonth();
  const monthName = getMonthDisplayName(year, month);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
  // Convert to European Monday-first (0 = Monday, 6 = Sunday)
  const startingDayIndex = (firstDayOfWeek + 6) % 7;

  const todayKey = formatDateKey(new Date());

  const weekDayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // Days slots
  const calendarSlots: Array<{
    dayNumber: number | null;
    dateKey: string | null;
    minutes: number;
    isToday: boolean;
    hasWork: boolean;
    isLeave: boolean;
  }> = [];

  // Empty leading slots
  for (let i = 0; i < startingDayIndex; i++) {
    calendarSlots.push({
      dayNumber: null,
      dateKey: null,
      minutes: 0,
      isToday: false,
      hasWork: false,
      isLeave: false,
    });
  }

  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const log = workLogs[dateKey];
    const mins = log ? log.totalMinutes : 0;

    calendarSlots.push({
      dayNumber: d,
      dateKey,
      minutes: mins,
      isToday: dateKey === todayKey,
      hasWork: mins > 0,
      isLeave: Boolean(log?.isLeave),
    });
  }

  return (
    <div className="flex flex-col gap-4 pb-28">
      {/* Page Title & Header Controls */}
      <div className="pt-1 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Calendar
        </h1>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={handleUpdateButtonClick}
            disabled={checkingUpdate}
            aria-label={
              updateInfo?.hasUpdate
                ? `Update nou v${updateInfo.latestVersion} disponibil`
                : `Verifică update (v${APP_VERSION})`
            }
            title={
              updateInfo?.hasUpdate
                ? `Update nou v${updateInfo.latestVersion}! Apasă pentru actualizare`
                : `Verifică update (v${APP_VERSION})`
            }
            className={`relative w-[42px] h-9 rounded-full flex items-center justify-center transition-all active:scale-95 !text-white ${
              updateInfo?.hasUpdate
                ? 'bg-rose-500 border border-rose-400/70 shadow-[0_0_14px_rgba(244,63,94,0.75)] hover:scale-105'
                : 'bg-[#2686F3] border border-[#79BEEE]/70 shadow-[0_0_12px_rgba(38,134,243,0.45)] hover:scale-105'
            }`}
          >
            {updateInfo?.hasUpdate ? (
              <>
                <Download size={16} />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-white" />
              </>
            ) : (
              <RefreshCw size={15} className={checkingUpdate ? 'animate-spin' : ''} />
            )}
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Schimbă la tema albă' : 'Schimbă la tema întunecată'}
            title={theme === 'dark' ? 'Temă Albă' : 'Temă Întunecată'}
            className="glass-pill w-9 h-9 flex items-center justify-center border border-white/10 text-amber-300 hover:scale-105 active:scale-95 transition-all"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} className="text-sky-600" />}
          </button>
        </div>
      </div>

      {/* SECTION 1: Tarif Orar Input Card */}
      <div className="glass-card p-4 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center text-emerald-400">
              <Coins size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Tarif pe Oră</h2>
            </div>
          </div>

          <span className="text-xs font-mono-num font-extrabold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            {hourlyRate} € / oră
          </span>
        </div>

        {/* Tactile input row with step buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleRateStep(-1)}
            className="w-11 h-11 neo-button text-white rounded-xl flex-shrink-0"
            title="Scade cu 1 €"
          >
            <Minus size={18} strokeWidth={2.5} />
          </button>

          <div className="relative flex-1">
            <input
              type="number"
              min="0"
              step="0.5"
              value={rateInputValue}
              onChange={(e) => handleRateChange(e.target.value)}
              className="neo-input-inset w-full text-center pr-12 text-xl"
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
              €/h
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleRateStep(1)}
            className="w-11 h-11 neo-button text-white rounded-xl flex-shrink-0"
            title="Crește cu 1 €"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Compact Name Editor */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#2686F3]/15 border border-[#2686F3]/30 flex items-center justify-center text-[#2686F3] flex-shrink-0">
            <User size={14} />
          </div>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Numele tău (ex. Dora)"
            className="neo-input-inset flex-1 text-sm font-semibold py-1.5 px-3"
          />
        </div>
      </div>

      {/* SECTION 2: Monthly Calendar Card */}
      <div className="glass-card p-3.5 flex flex-col gap-2">
        {/* Month Navigation (Only Current vs Previous Month) */}
        <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
          <button
            type="button"
            onClick={() => setSelectedMonth('previous')}
            disabled={selectedMonth === 'previous'}
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all ${
              selectedMonth === 'previous'
                ? 'opacity-30 cursor-not-allowed text-slate-500'
                : 'text-sky-300 hover:bg-white/5 active:scale-95'
            }`}
          >
            <ChevronLeft size={16} />
            <span>Luna trecută</span>
          </button>

          <div className="text-center">
            <h3 className="text-base font-extrabold text-white capitalize tracking-tight">
              {monthName}
            </h3>
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
              {selectedMonth === 'current' ? 'Luna curentă' : 'Luna precedentă'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedMonth('current')}
            disabled={selectedMonth === 'current'}
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all ${
              selectedMonth === 'current'
                ? 'opacity-30 cursor-not-allowed text-slate-500'
                : 'text-sky-300 hover:bg-white/5 active:scale-95'
            }`}
          >
            <span>Luna curentă</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center py-0.5">
          {weekDayLabels.map((lbl, idx) => (
            <span
              key={idx}
              className={`text-[10px] font-extrabold uppercase ${
                idx >= 5 ? 'text-amber-400/70' : 'text-slate-400'
              }`}
            >
              {lbl}
            </span>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarSlots.map((slot, idx) => {
            if (slot.dayNumber === null) {
              return <div key={`empty_${idx}`} className="aspect-square rounded-xl" />;
            }

            const formattedHours = Number((slot.minutes / 60).toFixed(1));

            return (
              <button
                key={slot.dateKey}
                type="button"
                onClick={() => setSelectedDayKey(slot.dateKey)}
                className={`aspect-square rounded-xl p-1 flex flex-col justify-between items-center transition-all cursor-pointer relative group ${
                  slot.isLeave
                    ? 'calendar-day-leave bg-gradient-to-br from-amber-500 to-orange-500 border border-amber-400 shadow-[0_3px_10px_rgba(245,158,11,0.35)]'
                    : slot.hasWork
                    ? 'calendar-day-worked bg-gradient-to-br from-[#2686F3] to-[#1a6dd1] border border-[#79BEEE]/60 shadow-[0_3px_10px_rgba(38,134,243,0.4)]'
                    : 'bg-slate-900/40 border border-white/5 hover:bg-slate-800/40'
                } ${
                  slot.isToday ? 'ring-2 ring-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]' : ''
                }`}
              >
                {/* Day number */}
                <div className="w-full flex justify-between items-center px-0.5 leading-none">
                  <span
                    className={`text-[11px] font-mono-num font-bold leading-none ${
                      slot.isLeave || slot.hasWork
                        ? 'text-white'
                        : slot.isToday
                        ? 'text-sky-300 font-extrabold'
                        : 'text-slate-400'
                    }`}
                  >
                    {slot.dayNumber}
                  </span>

                  {slot.isToday && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        slot.isLeave || slot.hasWork ? 'bg-white' : 'bg-sky-400'
                      }`}
                    />
                  )}
                </div>

                {/* Hours Worked / Leave badge */}
                {slot.isLeave ? (
                  <div className="w-full bg-black/20 rounded-md py-[1px] px-0.5 text-center border border-white/25">
                    <span className="text-[8.5px] font-mono-num font-extrabold text-white block leading-tight">
                      {slot.minutes > 0 ? `CO ${formattedHours}h` : 'CO'}
                    </span>
                  </div>
                ) : slot.hasWork ? (
                  <div className="w-full bg-white/20 rounded-md py-[1px] px-0.5 text-center border border-white/30">
                    <span className="text-[9px] font-mono-num font-extrabold text-white block leading-tight">
                      {formattedHours}h
                    </span>
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Calendar Footer Info */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-md bg-gradient-to-br from-sky-500 to-blue-600 inline-block" />
              <span>Lucrat</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-md bg-gradient-to-br from-amber-500 to-orange-500 inline-block" />
              <span>Concediu</span>
            </div>
          </div>
          <span className="font-mono-num font-semibold text-slate-300">
            {daysWorkedMonth} {daysWorkedMonth === 1 ? 'zi' : 'zile'}
          </span>
        </div>
      </div>

      {/* Selected Month Recap Strip */}
      <div className="glass-card p-3.5 flex items-center justify-between text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Total {monthName}
          </span>
          <span className="text-base font-extrabold text-white font-mono-num">
            {formatMinutesToHM(totalMinutesMonth)}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Venit estimat
          </span>
          <span className="text-base font-extrabold text-emerald-400 font-mono-num">
            {formatMoney(totalMoneyMonth)}
          </span>
        </div>
      </div>

      {/* SECTION 3: Raport WhatsApp & Backup Date */}
      <div className="glass-card p-3.5 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all !text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(16,185,129,0.35)]"
        >
          <Share2 size={15} />
          <span>Trimite Raportul ({monthName}) pe WhatsApp</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="glass-pill py-2 px-3 text-[11px] font-bold text-sky-300 flex items-center justify-center gap-1.5 border border-[#2686F3]/30 active:scale-95 transition-all"
          >
            <FileDown size={14} />
            <span>Export Backup</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="glass-pill py-2 px-3 text-[11px] font-bold text-sky-300 flex items-center justify-center gap-1.5 border border-[#2686F3]/30 active:scale-95 transition-all"
          >
            <Upload size={14} />
            <span>Import Backup</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>

        {backupNotice && (
          <div className="text-center text-[11px] font-bold text-emerald-400">
            {backupNotice}
          </div>
        )}
      </div>

      {/* Day Edit Modal when a day is tapped */}
      {selectedDayKey && (
        <DayEditModal
          dateKey={selectedDayKey}
          onClose={() => setSelectedDayKey(null)}
        />
      )}

      {/* In-App Update Modal */}
      {showUpdateModal && updateInfo?.hasUpdate && (
        <UpdateModal
          updateInfo={updateInfo}
          onClose={() => setShowUpdateModal(false)}
        />
      )}
    </div>
  );
};

