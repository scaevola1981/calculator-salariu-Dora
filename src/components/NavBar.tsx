import React, { useState } from 'react';
import { useWork } from '../context/WorkContext';
import { BarChart3, Calendar, Play, Square } from 'lucide-react';
import { formatElapsedMs } from '../utils/timeFormat';

interface NavBarProps {
  activeTab: 'dashboard' | 'calendar';
  setActiveTab: (tab: 'dashboard' | 'calendar') => void;
  onShiftStarted?: () => void;
  onShiftStopped?: (info: { durationMinutes: number; date: string }) => void;
}

const BURST_PARTICLES = [
  { tx: '-38px', ty: '-42px', color: '#79BEEE' },
  { tx: '38px', ty: '-42px', color: '#2686F3' },
  { tx: '-50px', ty: '0px', color: '#84AFE6' },
  { tx: '50px', ty: '0px', color: '#6C6CF0' },
  { tx: '-30px', ty: '36px', color: '#10b981' },
  { tx: '30px', ty: '36px', color: '#f43f5e' },
  { tx: '0px', ty: '-54px', color: '#ffffff' },
];

export const NavBar: React.FC<NavBarProps> = ({
  activeTab,
  setActiveTab,
  onShiftStarted,
  onShiftStopped,
}) => {
  const { activeShift, elapsedMs, startShift, stopShift } = useWork();
  const [rippleKey, setRippleKey] = useState<number>(0);
  const [lastAction, setLastAction] = useState<'start' | 'stop' | null>(null);

  const isRunning = activeShift?.isRunning;
  const time = formatElapsedMs(elapsedMs);

  const handleDialClick = () => {
    setRippleKey((k) => k + 1);
    if (isRunning) {
      setLastAction('stop');
      const res = stopShift();
      if (res && onShiftStopped) {
        onShiftStopped(res);
      }
    } else {
      setLastAction('start');
      startShift();
      if (onShiftStarted) {
        onShiftStarted();
      }
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
        <div className="shift-dial-container">
          {rippleKey > 0 && (
            <React.Fragment key={rippleKey}>
              <span
                className={lastAction === 'start' ? 'dial-ripple-start' : 'dial-ripple-stop'}
              />
              {BURST_PARTICLES.map((p, idx) => (
                <span
                  key={idx}
                  className="burst-particle"
                  style={
                    {
                      backgroundColor: p.color,
                      '--tx': p.tx,
                      '--ty': p.ty,
                    } as React.CSSProperties
                  }
                />
              ))}
            </React.Fragment>
          )}

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

