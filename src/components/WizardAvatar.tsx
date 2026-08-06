import React from 'react';
import type { PlayerState } from '../types/game';
import { Shield, Zap, Snowflake } from 'lucide-react';

interface WizardAvatarProps {
  player: PlayerState;
  isCurrentPlayer: boolean;
}

export const WizardAvatar: React.FC<WizardAvatarProps> = ({ player, isCurrentPlayer }) => {
  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const isFrozen = player.statusEffects.frozenUntil > Date.now();

  return (
    <div className={`relative flex flex-col items-center p-4 rounded-2xl glass-card transition-all duration-300 ${
      isCurrentPlayer ? 'border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20' : 'border-2 border-red-500/50 shadow-lg shadow-red-500/20'
    }`}>
      {/* Role / Name Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{player.avatar}</span>
        <h3 className="font-bold text-lg text-white tracking-wide">{player.name}</h3>
        {player.isHost && (
          <span className="bg-amber-500/20 border border-amber-400 text-amber-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
            👑 Líder
          </span>
        )}
        {isCurrentPlayer && (
          <span className="bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs px-2 py-0.5 rounded-full font-semibold">
            Tú
          </span>
        )}
      </div>

      {/* Avatar Visual Arena Display */}
      <div className="relative my-3 w-28 h-28 flex items-center justify-center rounded-full bg-slate-900/80 border-2 border-slate-700 shadow-inner overflow-hidden">
        {/* Glow Background effect */}
        <div className={`absolute inset-0 opacity-30 blur-md ${
          player.hp > 50 ? 'bg-cyan-500' : player.hp > 25 ? 'bg-amber-500' : 'bg-red-600 animate-pulse'
        }`} />

        {/* Wizard Emoji Icon Large */}
        <span className={`text-6xl transform transition-all duration-300 select-none ${
          isFrozen ? 'filter hue-rotate-180 scale-95 opacity-75' : 'hover:scale-110'
        }`}>
          {player.avatar}
        </span>

        {/* Frozen Ice Visual Overlay */}
        {isFrozen && (
          <div className="absolute inset-0 bg-cyan-400/40 backdrop-blur-xs flex items-center justify-center animate-pulse">
            <Snowflake className="w-10 h-10 text-cyan-200 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
        )}
      </div>

      {/* Health Bar */}
      <div className="w-full max-w-xs space-y-1">
        <div className="flex justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1">❤️ Vida</span>
          <span className="font-mono text-cyan-300">{player.hp} / {player.maxHp} HP</span>
        </div>

        <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5 relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              hpPercent > 50
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                : hpPercent > 25
                ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                : 'bg-gradient-to-r from-red-600 to-rose-400 animate-pulse'
            }`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* Shield Bar / Indicator */}
      {player.shield > 0 && (
        <div className="w-full max-w-xs mt-2 flex items-center justify-between bg-blue-950/60 border border-blue-500/40 px-3 py-1 rounded-lg">
          <div className="flex items-center gap-1.5 text-xs text-blue-300 font-semibold">
            <Shield className="w-4 h-4 text-blue-400 animate-bounce" />
            <span>Escudo Absorbente</span>
          </div>
          <span className="font-mono text-xs text-blue-200 font-bold">+{player.shield}</span>
        </div>
      )}

      {/* CAPS Charges HUD */}
      <div className="w-full max-w-xs mt-3 flex items-center justify-between bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl">
        <div className="flex items-center gap-1 text-xs text-amber-300 font-semibold">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Cargas Mayúscula</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: player.maxCapsCharges }).map((_, idx) => (
            <div
              key={idx}
              className={`w-3 h-3 rounded-full transition-all ${
                idx < player.capsCharges
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-300 shadow-md shadow-amber-400/50 scale-110'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
