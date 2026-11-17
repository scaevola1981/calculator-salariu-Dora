import React from 'react';
import { useWork } from '../context/WorkContext';
import { BarChart3, Calendar, Play, Square } from 'lucide-react';
import { formatElapsedMs } from '../utils/timeFormat';

interface NavBarProps {
  activeTab: 'dashboard' | 'calendar';
  setActiveTab: (tab: 'dashboard' | 'calendar') => void;
  onShiftStopped?: (info: { durationMinutes: number; date: string }) => void;
}

export const NavBar: React.FC<NavBarProps> = ({ activeTab, setActiveTab, onShiftStopped }) => {
  const { activeShift, elapsedMs, startShift, stopShift } = useWork();

  const isRunning = activeShift?.isRunning;
  const time = formatElapsedMs(elapsedMs);

  const handleDialClick = () => {
    if (isRunning) {
      const res = stopShift();
      if (res && onShiftStopped) {
        onShiftStopped(res);
      }
    } else {
      startShift();
    }
  };

  return (
    <>
      {/* If shift is running, show a sleek miniature time badge floating directly above the central dial */}
      {isRunning && (
        <div
          onClick={handleDialClick}
          style={{
            position: 'fixed',
            bottom: 'calc(max(16px, calc(var(--safe-bottom) + 12px)) + 74px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1001,
            cursor: 'pointer',
          }}
          className="glass-pill px-3 py-1 flex items-center gap-2 shadow-lg border border-rose-500/30 bg-rose-950/80 backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
          <span className="font-mono-num text-xs font-bold text-rose-200 tracking-wider">
            {time.hours}:{time.minutes}:{time.seconds}
          </span>
          <span className="text-[10px] uppercase font-bold text-rose-300/80">În tură</span>
        </div>
      )}

      <nav className="bottom-floating-nav">
        {/* Button Tab 1: Dashboard / Sumar */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          aria-label="Pagina 1: Sumar și Grafic"
        >
          <BarChart3 size={20} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
          <span>Sumar</span>
        </button>

        {/* Central Tactile Dial: Start / Stop Tură */}
        <div className="shift-dial-container" style={{ marginTop: '-24px' }}>
          <button
            type="button"
            onClick={handleDialClick}
            className="shift-dial-outer"
            aria-label={isRunning ? 'Oprește Tura' : 'Pornește Tura'}
          >
            {isRunning ? (
              <div className="shift-dial-inner-running">
                <Square size={22} fill="white" strokeWidth={0} />
                <span style={{ fontSize: '9px', fontWeight: 800, marginTop: '2px', letterSpacing: '0.5px' }}>
                  STOP
                </span>
              </div>
            ) : (
              <div className="shift-dial-inner-idle">
                <Play size={24} fill="white" strokeWidth={0} style={{ marginLeft: '3px' }} />
                <span style={{ fontSize: '9px', fontWeight: 800, marginTop: '1px', letterSpacing: '0.5px' }}>
                  START
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Button Tab 2: Calendar & Tarif */}
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
          aria-label="Pagina 2: Calendar și Tarif"
        >
          <Calendar size={20} strokeWidth={activeTab === 'calendar' ? 2.5 : 2} />
          <span>Calendar</span>
        </button>
      </nav>
    </>
  );
};

