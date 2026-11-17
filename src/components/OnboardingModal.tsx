import React, { useState } from 'react';
import { useWork } from '../context/WorkContext';
import { User, Coins, ArrowRight, Sparkles } from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { hourlyRate, completeOnboarding } = useWork();
  const [name, setName] = useState<string>('');
  const [rate, setRate] = useState<string>(String(hourlyRate || 15));
  const [isExiting, setIsExiting] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || 'Dora';
    const parsedRate = parseFloat(rate);
    const finalRate = isNaN(parsedRate) || parsedRate < 0 ? 0 : parsedRate;

    setIsExiting(true);
    setTimeout(() => {
      completeOnboarding(finalName, finalRate);
    }, 320);
  };

  return (
    <div
      className={`fixed inset-0 z-[5000] flex flex-col items-center justify-center px-5 transition-all duration-300 ${
        isExiting ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundColor: 'inherit',
        paddingTop: 'max(24px, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Animated Ambient Orbs */}
      <div
        className="animate-orb absolute top-12 left-6 w-56 h-56 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(38, 134, 243, 0.28)' }}
      />
      <div
        className="animate-orb absolute bottom-16 right-6 w-64 h-64 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(108, 108, 240, 0.28)', animationDelay: '1.8s' }}
      />

      <div className="w-full max-w-sm flex flex-col items-center relative z-10 animate-pop-spring">
        {/* Floating Squircle Logo */}
        <div className="mb-5 relative">
          <div className="absolute inset-0 rounded-3xl bg-[#2686F3]/30 blur-xl animate-pulse" />
          <img
            src="/logo.png"
            alt="Logo Contor Ore"
            className="w-24 h-24 object-contain relative z-10 animate-float-logo drop-shadow-[0_12px_24px_rgba(38,134,243,0.4)]"
          />
        </div>

        {/* Welcome Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 glass-pill px-3 py-1 mb-2 text-[11px] font-bold text-[#79BEEE]">
            <Sparkles size={13} />
            <span>Configurare Inițială</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Bine ai venit!
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Introdu numele și tariful tău pe oră pentru a începe pontajul.
          </p>
        </div>

        {/* Setup Form Card */}
        <form onSubmit={handleSubmit} className="glass-card w-full p-5 flex flex-col gap-4">
          {/* Name Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <User size={14} className="text-[#79BEEE]" />
              Numele tău
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex. Dora"
              className="neo-input-inset w-full text-base font-semibold py-3 px-4"
              autoComplete="name"
            />
          </div>

          {/* Hourly Rate Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Coins size={14} className="text-[#79BEEE]" />
              Tarif pe Oră (€/h)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.5"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="15"
                className="neo-input-inset w-full text-center pr-12 text-xl py-3"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                €/h
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="neo-button w-full py-3.5 mt-1 text-sm font-extrabold text-white flex items-center justify-center gap-2 shadow-lg"
          >
            <span>Începe Pontajul</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
