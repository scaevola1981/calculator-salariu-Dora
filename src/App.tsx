import React, { useState, useEffect } from 'react';
import { WorkProvider, useWork } from './context/WorkContext';
import { Dashboard } from './components/Dashboard';
import { CalendarPage } from './components/CalendarPage';
import { NavBar } from './components/NavBar';
import { OnboardingModal } from './components/OnboardingModal';
import { UpdateModal } from './components/UpdateModal';
import { StatusBar, Style } from '@capacitor/status-bar';
import { formatMinutesToHM, formatMoney } from './utils/timeFormat';
import { CheckCircle2, PlayCircle, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar'>('dashboard');
  const [shiftStartedToast, setShiftStartedToast] = useState<boolean>(false);
  const [shiftFinishedToast, setShiftFinishedToast] = useState<{
    durationMinutes: number;
    date: string;
  } | null>(null);

  const {
    hourlyRate,
    theme,
    isOnboarded,
    userName,
    updateInfo,
    updatePromptOpen,
    dismissUpdatePrompt,
  } = useWork();

  // Configure native Android status bar based on theme
  useEffect(() => {
    const setupStatusBar = async () => {
      try {
        if (theme === 'light') {
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
        } else {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#000000' });
        }
      } catch (e) {
        // Ignored on web
      }
    };
    setupStatusBar();
  }, [theme]);

  // Auto-dismiss toasts
  useEffect(() => {
    if (!shiftFinishedToast) return;
    const timer = setTimeout(() => {
      setShiftFinishedToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [shiftFinishedToast]);

  useEffect(() => {
    if (!shiftStartedToast) return;
    const timer = setTimeout(() => {
      setShiftStartedToast(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [shiftStartedToast]);

  return (
    <div className="min-h-screen flex flex-col justify-between max-w-md mx-auto px-4 relative">
      {/* First-install animated Onboarding */}
      {!isOnboarded && <OnboardingModal />}

      {/* Automatic Update Prompt Modal (Actualizează / Mai târziu) */}
      {isOnboarded && updatePromptOpen && updateInfo?.hasUpdate && (
        <UpdateModal
          updateInfo={updateInfo}
          onClose={dismissUpdatePrompt}
        />
      )}

      {/* Top Safe Area Spacing */}
      <div style={{ height: 'max(14px, env(safe-area-inset-top, 0px))' }} />

      {/* Main Content View */}
      <main className="flex-1 w-full">
        {activeTab === 'dashboard' ? <Dashboard /> : <CalendarPage />}
      </main>

      {/* Shift Started Animated Notification */}
      {shiftStartedToast && (
        <div
          style={{
            position: 'fixed',
            top: 'calc(max(16px, env(safe-area-inset-top, 0px)) + 12px)',
            left: '16px',
            right: '16px',
            maxWidth: '480px',
            margin: '0 auto',
            zIndex: 3000,
          }}
          className="glass-card p-3.5 border border-[#2686F3]/60 bg-[#2686F3]/90 shadow-2xl flex items-center justify-between animate-pop-spring"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
              <PlayCircle size={20} />
            </div>
            <div>
              <div className="text-xs font-extrabold text-white">
                {userName ? `Spor la lucru, ${userName}!` : 'Tură pornită!'}
              </div>
              <div className="text-[11px] text-white/85">
                Cronometrul a început să măsoare timpul.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShiftStartedToast(false)}
            className="text-white/80 hover:text-white p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Shift Finished Animated Notification */}
      {shiftFinishedToast && (
        <div
          style={{
            position: 'fixed',
            top: 'calc(max(16px, env(safe-area-inset-top, 0px)) + 12px)',
            left: '16px',
            right: '16px',
            maxWidth: '480px',
            margin: '0 auto',
            zIndex: 3000,
          }}
          className="glass-card p-3.5 border border-emerald-500/40 bg-emerald-950/90 shadow-2xl flex items-center justify-between animate-pop-spring"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                {userName ? `Tură încheiată, ${userName}!` : 'Tură încheiată cu succes!'}
              </div>
              <div className="text-[11px] text-emerald-300 font-mono-num">
                +{formatMinutesToHM(shiftFinishedToast.durationMinutes)} (
                +{formatMoney((shiftFinishedToast.durationMinutes / 60) * hourlyRate)})
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShiftFinishedToast(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar */}
      <NavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onShiftStarted={() => {
          setShiftFinishedToast(null);
          setShiftStartedToast(true);
        }}
        onShiftStopped={(info) => {
          setShiftStartedToast(false);
          setShiftFinishedToast(info);
        }}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <WorkProvider>
      <AppContent />
    </WorkProvider>
  );
};

export default App;

