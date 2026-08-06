import React, { useState, useEffect } from 'react';
import type { PlayerState } from '../types/game';
import { Swords, Play } from 'lucide-react';

interface MatchIntroBannerProps {
  players: PlayerState[];
  currentPlayerId: string;
  onDismiss: () => void;
}

export const MatchIntroBanner: React.FC<MatchIntroBannerProps> = ({
  players,
  currentPlayerId,
  onDismiss
}) => {
  const [countdown, setCountdown] = useState<number>(4);
  const selfPlayer = players.find((p) => p.id === currentPlayerId);
  const opponentPlayer = players.find((p) => p.id !== currentPlayerId);

  useEffect(() => {
    if (countdown <= 0) {
      onDismiss();
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, onDismiss]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4 md:p-8 animate-fadeIn">
      <div className="w-full max-w-3xl glass-card p-6 md:p-8 rounded-3xl border-2 border-cyan-500/40 shadow-2xl space-y-6 text-center relative overflow-hidden">
        {/* Glowing Background Radial Accents */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Title Header Banner */}
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-extrabold text-xs tracking-widest uppercase mb-1">
            <Swords className="w-4 h-4 animate-bounce" />
            <span>¡DUELO ARCANO INICIADO!</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-cyan-300 via-blue-200 to-indigo-300 bg-clip-text text-transparent">
            ¡BIENVENIDO A LA BATALLA!
          </h2>
          <p className="text-slate-300 text-sm max-w-lg mx-auto">
            Demuestra la velocidad de tus dedos. La forma en que tipeas tus hechizos altera su poder y recarga.
          </p>
        </div>

        {/* 1v1 Face-off Avatars */}
        <div className="grid grid-cols-2 gap-4 items-center bg-slate-900/80 border border-slate-800 p-4 rounded-2xl relative z-10">
          <div className="flex flex-col items-center space-y-1">
            <span className="text-5xl">{selfPlayer?.avatar || '🧙‍♂️'}</span>
            <span className="font-extrabold text-white text-base">{selfPlayer?.name} (Tú)</span>
            <span className="text-xs text-cyan-400 font-mono font-bold">100 HP</span>
          </div>

          <div className="flex flex-col items-center space-y-1 border-l border-slate-800">
            <span className="text-5xl">{opponentPlayer?.avatar || '🧙‍♀️'}</span>
            <span className="font-extrabold text-white text-base">{opponentPlayer?.name || 'Rival'}</span>
            <span className="text-xs text-rose-400 font-mono font-bold">100 HP</span>
          </div>
        </div>

        {/* Typing Rules & Available Kit Summary */}
        <div className="space-y-3 text-left relative z-10">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider text-center">
            ⚡ Resumen de Modificadores de Tipeo en Batalla:
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-950/80 border border-amber-500/40 p-2.5 rounded-xl">
              <div className="font-extrabold text-amber-300 flex items-center gap-1">⚡ MAYÚSCULA</div>
              <div className="font-mono text-slate-200 mt-1">`FIREBALL`</div>
              <div className="text-[10px] text-slate-400 mt-1">+50% Daño Extra (Gasta Cargas)</div>
            </div>

            <div className="bg-slate-950/80 border border-emerald-500/40 p-2.5 rounded-xl">
              <div className="font-extrabold text-emerald-300 flex items-center gap-1">💨 minúscula</div>
              <div className="font-mono text-slate-200 mt-1">`fireball`</div>
              <div className="text-[10px] text-slate-400 mt-1">Recarga Rápida (-20% Cooldown)</div>
            </div>

            <div className="bg-slate-950/80 border border-purple-500/40 p-2.5 rounded-xl">
              <div className="font-extrabold text-purple-300 flex items-center gap-1">🎲 aLtErNaDo</div>
              <div className="font-mono text-slate-200 mt-1">`fIrEbAlL`</div>
              <div className="text-[10px] text-slate-400 mt-1">50% Crítico x2 / 50% Recular</div>
            </div>

            <div className="bg-slate-950/80 border border-rose-500/40 p-2.5 rounded-xl">
              <div className="font-extrabold text-rose-300 flex items-center gap-1">💥 Shortcode</div>
              <div className="font-mono text-slate-200 mt-1">`frbl`</div>
              <div className="text-[10px] text-slate-400 mt-1">80% Probabilidad de Fallo</div>
            </div>
          </div>
        </div>

        {/* Action Button & Countdown */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10 border-t border-slate-800">
          <span className="text-xs text-slate-400 font-mono">
            El combate comienza automáticamente en <strong className="text-cyan-300">{countdown}s</strong>...
          </span>

          <button
            onClick={onDismiss}
            className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold px-8 py-3 rounded-xl shadow-lg shadow-cyan-500/30 transition-all flex items-center justify-center gap-2 active:scale-95 border border-cyan-400/30"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>¡IR AL COMBATE AHORA!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
