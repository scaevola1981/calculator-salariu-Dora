import React, { useState, useEffect } from 'react';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { APP_VERSION, AppUpdater, UpdateInfo } from '../utils/updater';
import { Download, X, CheckCircle2, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';

interface UpdateModalProps {
  updateInfo: UpdateInfo;
  onClose: () => void;
}

type UpdateStage = 'ready' | 'downloading' | 'needs_permission' | 'installing' | 'error';

export const UpdateModal: React.FC<UpdateModalProps> = ({ updateInfo, onClose }) => {
  const [stage, setStage] = useState<UpdateStage>('ready');
  const [progress, setProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    let listener: PluginListenerHandle | null = null;

    if (Capacitor.isNativePlatform()) {
      AppUpdater.addListener('downloadProgress', (data) => {
        setProgress(data.progress);
      }).then((handle) => {
        listener = handle;
      });
    }

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, []);

  const handleStartUpdate = async () => {
    if (!updateInfo.downloadUrl) return;

    if (!Capacitor.isNativePlatform()) {
      window.open(updateInfo.downloadUrl, '_blank');
      onClose();
      return;
    }

    try {
      setStage('downloading');
      setProgress(0);
      setErrorMsg('');

      if (updateInfo.otaUrl) {
        await AppUpdater.applyOtaUpdate({
          url: updateInfo.otaUrl,
          version: updateInfo.latestVersion,
        });
        setStage('installing');
        return;
      }

      const result = await AppUpdater.downloadAndInstall({ url: updateInfo.downloadUrl });
      if (result.needsPermission) {
        setStage('needs_permission');
      } else {
        setStage('installing');
      }
    } catch (err: any) {
      setStage('error');
      setErrorMsg(err?.message || 'Eroare la descărcarea actualizării.');
    }
  };

  const handleInstallCached = async () => {
    try {
      setErrorMsg('');
      const result = await AppUpdater.installCachedApk();
      if (result.needsPermission) {
        setStage('needs_permission');
      } else {
        setStage('installing');
      }
    } catch (err: any) {
      setStage('error');
      setErrorMsg(err?.message || 'Nu s-a putut porni instalarea.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={stage === 'downloading' ? undefined : onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#2686F3]/20 border border-[#2686F3]/40 flex items-center justify-center text-[#2686F3]">
              <Download size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Actualizare Aplicație
              </span>
              <h3 className="text-base font-extrabold text-white">
                Versiune nouă disponibilă
              </h3>
            </div>
          </div>

          {stage !== 'downloading' && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Version Comparison Card */}
        <div className="mt-4 glass-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Instalat acum
            </span>
            <span className="text-base font-extrabold font-mono-num text-slate-300">
              v{APP_VERSION}
            </span>
          </div>

          <ArrowRight size={20} className="text-[#2686F3]" />

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Versiune nouă
            </span>
            <span className="text-base font-extrabold font-mono-num text-[#2686F3]">
              v{updateInfo.latestVersion}
            </span>
          </div>
        </div>

        {/* Stage Content */}
        <div className="mt-4">
          {stage === 'ready' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Există o versiune nouă disponibilă. Actualizarea se face automat în aplicație, iar datele și orele tale rămân intacte.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="glass-pill py-3 text-xs font-bold text-slate-300 hover:text-white active:scale-95 transition-all border border-white/15"
                >
                  Mai târziu
                </button>
                <button
                  type="button"
                  onClick={handleStartUpdate}
                  className="neo-button py-3 text-xs font-extrabold text-white flex items-center justify-center gap-1.5"
                >
                  <Download size={16} />
                  <span>Actualizează</span>
                </button>
              </div>
            </div>
          )}

          {stage === 'downloading' && (
            <div className="flex flex-col gap-2.5 py-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-white">Se descarcă actualizarea...</span>
                <span className="font-mono-num text-[#79BEEE]">{progress}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-[#2686F3] to-[#79BEEE] transition-all duration-150 rounded-full"
                  style={{ width: `${Math.max(4, progress)}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400 text-center">
                Nu închide aplicația până la finalizare
              </span>
            </div>
          )}

          {stage === 'needs_permission' && (
            <div className="flex flex-col gap-3">
              <div className="glass-card p-3 border border-amber-500/40 flex items-start gap-2.5">
                <ShieldCheck size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-200 leading-relaxed">
                  Activează permisiunea <strong>„Permite din această sursă”</strong> în fereastra de setări Android, apoi apasă butonul de mai jos pentru a finaliza instalarea.
                </div>
              </div>
              <button
                type="button"
                onClick={handleInstallCached}
                className="neo-button w-full py-3.5 text-sm font-extrabold text-white flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} />
                <span>Continuă instalarea</span>
              </button>
            </div>
          )}

          {stage === 'installing' && (
            <div className="flex flex-col items-center gap-2 py-3 text-center">
              <CheckCircle2 size={32} className="text-emerald-400" />
              <div className="text-sm font-bold text-white">
                Instalator pornit!
              </div>
              <p className="text-xs text-slate-400">
                Confirmă instalarea în fereastra sistemului Android.
              </p>
            </div>
          )}

          {stage === 'error' && (
            <div className="flex flex-col gap-3">
              <div className="glass-card p-3 border border-rose-500/40 flex items-start gap-2.5">
                <AlertCircle size={18} className="text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-rose-300">{errorMsg}</div>
              </div>
              <button
                type="button"
                onClick={handleStartUpdate}
                className="neo-button w-full py-3 text-sm font-extrabold text-white"
              >
                Reîncearcă
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
