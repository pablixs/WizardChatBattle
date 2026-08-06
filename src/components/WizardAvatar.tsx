import React from 'react';
import type { PlayerState } from '../types/game';
import { Shield, Zap, Snowflake } from 'lucide-react';

interface WizardAvatarProps {
  player: PlayerState;
  isCurrentPlayer: boolean;
}

// Simple standalone avatar card used only in non-battle contexts (e.g., legacy)
export const WizardAvatar: React.FC<WizardAvatarProps> = ({ player, isCurrentPlayer }) => {
  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const isFrozen = player.statusEffects.frozenUntil > Date.now();

  return (
    <div className={`pokemon-nameplate ${isCurrentPlayer ? 'border-indigo-500/50' : 'border-rose-500/50'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{player.avatar}</span>
        <h3 className="font-bold text-lg text-white tracking-wide">{player.name}</h3>
        {player.isHost && (
          <span className="bg-amber-500/20 border border-amber-400 text-amber-300 text-xs px-2 py-0.5 rounded-full font-semibold">
            👑
          </span>
        )}
        {isCurrentPlayer && (
          <span className="bg-indigo-500/20 border border-indigo-400 text-indigo-300 text-xs px-2 py-0.5 rounded-full font-semibold">
            Tú
          </span>
        )}
        {isFrozen && (
          <Snowflake className="w-4 h-4 text-cyan-300 animate-spin" style={{ animationDuration: '3s' }} />
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-amber-300 tracking-widest">HP</span>
        <div className="flex-1 h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              hpPercent > 50 ? 'bg-emerald-400' : hpPercent > 25 ? 'bg-amber-400' : 'bg-red-500 animate-pulse'
            }`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
        <span className="text-xs font-mono font-bold text-white">{player.hp}/{player.maxHp}</span>
      </div>

      <div className="flex items-center justify-between mt-1.5">
        {player.shield > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-blue-300 font-bold">
            <Shield className="w-3 h-3" /> +{player.shield}
          </div>
        )}
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          {Array.from({ length: player.maxCapsCharges }).map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i < player.capsCharges ? 'bg-amber-400' : 'bg-slate-700'}`} />
          ))}
        </div>
      </div>
    </div>
  );
};
