import React from 'react';
import type { PlayerState } from '../types/game';
import { SPELLS } from '../config/spells';
import { Shield, Zap, Snowflake, BookOpen } from 'lucide-react';

interface WizardAvatarProps {
  player: PlayerState;
  isCurrentPlayer: boolean;
}

export const WizardAvatar: React.FC<WizardAvatarProps> = ({ player, isCurrentPlayer }) => {
  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const isFrozen = player.statusEffects.frozenUntil > Date.now();
  const now = Date.now();

  return (
    <div className={`relative flex flex-col md:flex-row items-stretch gap-4 p-4 rounded-2xl glass-card transition-all duration-300 ${
      isCurrentPlayer ? 'border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20' : 'border-2 border-red-500/50 shadow-lg shadow-red-500/20'
    }`}>
      {/* Left / Character Main Info Column */}
      <div className="flex-1 flex flex-col items-center justify-between space-y-3">
        {/* Role / Name Header */}
        <div className="flex items-center gap-2">
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
        <div className="relative my-1 w-24 h-24 flex items-center justify-center rounded-full bg-slate-900/80 border-2 border-slate-700 shadow-inner overflow-hidden">
          <div className={`absolute inset-0 opacity-30 blur-md ${
            player.hp > 50 ? 'bg-cyan-500' : player.hp > 25 ? 'bg-amber-500' : 'bg-red-600 animate-pulse'
          }`} />

          <span className={`text-5xl transform transition-all duration-300 select-none ${
            isFrozen ? 'filter hue-rotate-180 scale-95 opacity-75' : 'hover:scale-110'
          }`}>
            {player.avatar}
          </span>

          {isFrozen && (
            <div className="absolute inset-0 bg-cyan-400/40 backdrop-blur-xs flex items-center justify-center animate-pulse">
              <Snowflake className="w-8 h-8 text-cyan-200 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
          )}
        </div>

        {/* Health Bar */}
        <div className="w-full space-y-1">
          <div className="flex justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1">❤️ Vida</span>
            <span className="font-mono text-cyan-300">{player.hp} / {player.maxHp} HP</span>
          </div>

          <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5 relative">
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
          <div className="w-full flex items-center justify-between bg-blue-950/60 border border-blue-500/40 px-3 py-1 rounded-lg">
            <div className="flex items-center gap-1.5 text-xs text-blue-300 font-semibold">
              <Shield className="w-4 h-4 text-blue-400 animate-bounce" />
              <span>Escudo</span>
            </div>
            <span className="font-mono text-xs text-blue-200 font-bold">+{player.shield}</span>
          </div>
        )}

        {/* CAPS Charges HUD */}
        <div className="w-full flex items-center justify-between bg-slate-900/60 border border-slate-800 px-3 py-1 rounded-xl">
          <div className="flex items-center gap-1 text-xs text-amber-300 font-semibold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Cargas Mayúscula</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: player.maxCapsCharges }).map((_, idx) => (
              <div
                key={idx}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx < player.capsCharges
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-300 shadow-md shadow-amber-400/50 scale-110'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Powers / Spells List right beside the Character! */}
      <div className="flex-1 bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Hechizos ({isCurrentPlayer ? 'Tus Poderes' : 'Rival'})</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Tipear exacto</span>
        </div>

        <div className="space-y-1.5 overflow-y-auto max-h-48 pr-1 custom-scrollbar">
          {Object.values(SPELLS).map((spell) => {
            const cdTime = player.cooldowns[spell.id] || 0;
            const isOnCd = cdTime > now;
            const remainingSec = isOnCd ? ((cdTime - now) / 1000).toFixed(1) : null;

            return (
              <div
                key={spell.id}
                className={`p-2 rounded-lg border flex items-center justify-between text-xs transition-all ${
                  isOnCd
                    ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                    : 'bg-slate-900/90 border-slate-700/80 hover:border-cyan-500/50 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{spell.icon}</span>
                  <div>
                    <div className="font-bold text-white leading-none">{spell.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Fórmula: <code className="text-amber-300 font-bold font-mono">{spell.incantation}</code>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {isOnCd ? (
                    <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40 animate-pulse">
                      ⏳ {remainingSec}s
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                      ✨ LISTO
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
