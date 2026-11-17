import React, { useState } from 'react';
import { useWork } from '../context/WorkContext';
import {
  formatMinutesToHM,
  formatMinutesToDecimal,
  formatMoney,
  formatElapsedMs,
  getMonthDisplayName,
  MONTH_NAMES_SHORT_RO,
} from '../utils/timeFormat';
import {
  Clock,
  Coins,
  TrendingUp,
  CalendarCheck,
  Sun,
  Moon,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    hourlyRate,
    activeShift,
    elapsedMs,
    selectedMonth,
    setSelectedMonth,
    selectedMonthDate,
    totalMinutesMonth,
    totalMoneyMonth,
    daysWorkedMonth,
    dailyBarsData,
    theme,
    toggleTheme,
  } = useWork();

  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);

  const isRunning = activeShift?.isRunning;
  const liveTimer = formatElapsedMs(elapsedMs);
  const liveShiftHours = elapsedMs / (1000 * 3600);
  const liveShiftEarnings = liveShiftHours * hourlyRate;

  const currentYear = selectedMonthDate.getFullYear();
  const currentMonthIdx = selectedMonthDate.getMonth();
  const monthName = getMonthDisplayName(currentYear, currentMonthIdx);

  // Highest daily hours for chart scaling
  const maxDailyMinutes = Math.max(480, ...dailyBarsData.map((b) => b.minutes)); // at least 8h scale
  const dailyAverageHours =
    daysWorkedMonth > 0 ? (totalMinutesMonth / 60 / daysWorkedMonth).toFixed(1) : '0';

  const selectedBar = selectedBarIndex !== null ? dailyBarsData[selectedBarIndex] : null;

  return (
    <div className="flex flex-col gap-4 pb-28">
      {/* Top Header & Month Selector */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center">
          <img
            src="/logo.png"
            alt="Logo Contor Ore Dora"
            className="w-10 h-10 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] object-contain flex-shrink-0"
          />
        </div>

        {/* Header Right Controls: Month Selector + Theme Toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Discreet Selector: Luna Curentă / Luna Precedentă */}
          <div className="glass-pill p-1 flex items-center gap-1 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setSelectedMonth('previous');
                setSelectedBarIndex(null);
              }}
              className={`px-2 py-1 text-[11px] font-bold rounded-full transition-all ${
                selectedMonth === 'previous'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Precedentă
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedMonth('current');
                setSelectedBarIndex(null);
              }}
              className={`px-2 py-1 text-[11px] font-bold rounded-full transition-all ${
                selectedMonth === 'current'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Curentă
            </button>
          </div>

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

      {/* Live Shift Glowing Card (if currently running) */}
      {isRunning && (
        <div className="glass-card p-4 border border-rose-500/30 bg-gradient-to-br from-rose-950/40 via-slate-900/60 to-slate-950/80 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                Tură activă în derulare
              </span>
            </div>
            <span className="text-[11px] font-mono-num text-slate-400">
              Pornit la {activeShift?.startFormatted}
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div className="font-mono-num text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
              {liveTimer.hours}:{liveTimer.minutes}:{liveTimer.seconds}
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Acumulat în tură
              </span>
              <span className="font-mono-num text-sm font-bold text-emerald-400">
                +{formatMoney(liveShiftEarnings)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Top Two Side-by-Side Cards (50% / 50%) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left Card: Ore Lucrate */}
        <div className="glass-card p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Ore Lucrate
            </span>
            <div className="w-7 h-7 rounded-full bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400">
              <Clock size={15} />
            </div>
          </div>

          <div className="mt-1">
            <div className="text-2xl font-extrabold tracking-tight text-white font-mono-num leading-tight">
              {formatMinutesToHM(totalMinutesMonth)}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] font-semibold text-sky-400 font-mono-num">
                {formatMinutesToDecimal(totalMinutesMonth)}
              </span>
              <span className="text-[10px] text-slate-400">total zecimal</span>
            </div>
          </div>
        </div>

        {/* Right Card: Bani Acumulați */}
        <div className="glass-card p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Bani Acumulați
            </span>
            <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
              <Coins size={15} />
            </div>
          </div>

          <div className="mt-1">
            <div className="text-2xl font-extrabold tracking-tight text-emerald-400 font-mono-num leading-tight truncate">
              {formatMoney(totalMoneyMonth)}
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              <span className="text-[10px] text-slate-400">Tarif:</span>
              <span className="text-[11px] font-bold text-slate-200 font-mono-num">
                {hourlyRate} €/h
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section: Bar Chart with Days */}
      <div className="glass-card p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            <TrendingUp size={16} className="text-sky-400" />
            Ore Lucrate pe Zile
          </h2>

          <div className="text-right">
            <span className="text-xs font-bold text-sky-300 font-mono-num">
              {dailyAverageHours}h / zi
            </span>
          </div>
        </div>

        {/* Selected Bar Details Pill */}
        {selectedBar && (
          <div className="glass-pill px-3 py-2 flex items-center justify-between border border-sky-400/30 bg-sky-950/40 text-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">
                Ziua {selectedBar.day} ({selectedBar.dayOfWeek})
              </span>
              {selectedBar.isToday && (
                <span className="text-[9px] font-extrabold bg-sky-500 text-slate-950 px-1.5 py-0.5 rounded-full uppercase">
                  Azi
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono-num font-bold text-sky-300">
                {formatMinutesToHM(selectedBar.minutes)}
              </span>
              <span className="font-mono-num font-bold text-emerald-400">
                {formatMoney((selectedBar.minutes / 60) * hourlyRate)}
              </span>
            </div>
          </div>
        )}

        {/* Bar Chart Container */}
        <div className="mt-2 pt-4 pb-1 w-full">
          <div className="flex items-end gap-[2px] h-36 w-full">
            {dailyBarsData.map((bar, index) => {
              const heightPercent =
                bar.minutes > 0
                  ? Math.max(12, Math.round((bar.minutes / maxDailyMinutes) * 100))
                  : 4;
              const isSelected = selectedBarIndex === index;
              const hasWork = bar.minutes > 0;
              const showLabel =
                bar.day === 1 ||
                bar.day % 5 === 0 ||
                bar.day === dailyBarsData.length ||
                bar.isToday ||
                isSelected;

              return (
                <div
                  key={bar.dateKey}
                  onClick={() => setSelectedBarIndex(isSelected ? null : index)}
                  className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group min-w-0"
                >
                  {/* The bar element */}
                  <div
                    style={{
                      height: `${heightPercent}%`,
                      minHeight: '4px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    className={`w-full rounded-t-sm transition-all ${
                      isSelected
                        ? 'bg-gradient-to-t from-[#2686F3] to-[#79BEEE] shadow-[0_0_12px_rgba(38,134,243,0.75)]'
                        : hasWork
                        ? 'bg-gradient-to-t from-[#2686F3] to-[#84AFE6] shadow-[0_2px_8px_rgba(38,134,243,0.35)]'
                        : bar.isToday
                        ? 'bg-slate-700/60 border border-sky-400/40'
                        : 'bg-slate-800/40 hover:bg-slate-700/50'
                    }`}
                  />

                  {/* Day number */}
                  <span
                    className={`text-[8px] font-mono-num mt-1.5 block h-3 leading-none ${
                      isSelected
                        ? 'font-bold text-sky-300 scale-110'
                        : bar.isToday
                        ? 'font-bold text-white'
                        : showLabel
                        ? 'text-slate-400 font-medium'
                        : 'text-transparent'
                    }`}
                  >
                    {bar.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-sky-400 inline-block" />
              <span>Zi lucrată</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-slate-800 inline-block border border-white/10" />
              <span>Liber</span>
            </div>
          </div>
          <span>Maxim: {(maxDailyMinutes / 60).toFixed(0)}h / zi</span>
        </div>
      </div>

      {/* Daily Breakdown (Desfășurător Zilnic + Total) */}
      <div className="glass-card p-4 flex flex-col gap-3 text-xs text-slate-300">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <CalendarCheck size={16} />
            </div>
            <h2 className="text-sm font-bold text-white">
              Desfășurător {monthName}
            </h2>
          </div>
          <span className="text-[11px] font-mono-num text-slate-400">
            {daysWorkedMonth} {daysWorkedMonth === 1 ? 'zi' : 'zile'}
          </span>
        </div>

        {/* Worked Days List */}
        {dailyBarsData.some((b) => b.minutes > 0 || b.isLeave) ? (
          <div className="flex flex-col gap-1.5">
            {dailyBarsData
              .filter((b) => b.minutes > 0 || b.isLeave)
              .map((bar) => {
                const dayMoney = Math.round(((bar.minutes / 60) * hourlyRate) * 100) / 100;
                return (
                  <div
                    key={bar.dateKey}
                    className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]"
                  >
                    <div className="flex items-center gap-1.5 min-w-[115px]">
                      <span className="font-mono-num font-bold text-slate-200">
                        {String(bar.day).padStart(2, '0')} {MONTH_NAMES_SHORT_RO[currentMonthIdx]}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {bar.dayOfWeek}
                      </span>
                      {bar.isLeave && (
                        <span className="text-[9px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-md">
                          CO
                        </span>
                      )}
                    </div>

                    <span className="font-mono-num font-semibold text-sky-300">
                      {bar.isLeave && bar.minutes === 0 ? 'Concediu' : formatMinutesToHM(bar.minutes)}
                    </span>

                    <span className="font-mono-num font-bold text-emerald-400 min-w-[68px] text-right">
                      {formatMoney(dayMoney)}
                    </span>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-3 text-slate-400 text-[11px]">
            Nicio zi lucrată în această lună
          </div>
        )}

        {/* Total Row at the end of calculation */}
        <div className="pt-2.5 mt-1 border-t border-white/15 flex items-center justify-between px-1">
          <span className="text-xs font-extrabold uppercase tracking-wider text-white">
            Total
          </span>
          <span className="font-mono-num text-sm font-extrabold text-sky-300">
            {formatMinutesToHM(totalMinutesMonth)}
          </span>
          <span className="font-mono-num text-base font-extrabold text-emerald-400 min-w-[68px] text-right">
            {formatMoney(totalMoneyMonth)}
          </span>
        </div>
      </div>

      {/* Moved Worked Days Badge */}
      <div className="flex justify-center">
        <span className="text-[11px] font-mono-num text-slate-400 bg-white/5 px-3 py-1 rounded-md border border-white/5">
          {daysWorkedMonth} {daysWorkedMonth === 1 ? 'zi lucrată' : 'zile lucrate'}
        </span>
      </div>
    </div>
  );
};

