import React, { useEffect, useState } from 'react';
import type { BattleLogEntry, PlayerState } from '../types/game';
import { Snowflake, Flame, Zap } from 'lucide-react';

interface ScreenEffectsProps {
  logs: BattleLogEntry[];
  selfPlayer: PlayerState;
  isFrozen: boolean;
}

export const ScreenEffects: React.FC<ScreenEffectsProps> = ({
  logs,
  selfPlayer,
  isFrozen
}) => {
  const [activeEffect, setActiveEffect] = useState<'FIRE' | 'LIGHTNING' | 'DAMAGE' | null>(null);
  const [lastHp, setLastHp] = useState<number>(selfPlayer.hp);

  // Detect HP drop -> trigger red damage flash
  useEffect(() => {
    if (selfPlayer.hp < lastHp) {
      if (!isFrozen) {
        setActiveEffect('DAMAGE');
        const timer = setTimeout(() => setActiveEffect(null), 500);
        setLastHp(selfPlayer.hp);
        return () => clearTimeout(timer);
      }
    }
    setLastHp(selfPlayer.hp);
  }, [selfPlayer.hp, lastHp, isFrozen]);

  // Detect incoming spell element in the latest log entry
  useEffect(() => {
    if (logs.length === 0) return;
    const latest = logs[0];
    if (latest.casterId !== selfPlayer.id && latest.damage > 0) {
      if (latest.spellName.includes('Fuego') || latest.spellName.includes('Meteoro') || latest.spellName.includes('FIREBALL') || latest.spellName.includes('METEOR')) {
        setActiveEffect('FIRE');
        const t = setTimeout(() => setActiveEffect(null), 900);
        return () => clearTimeout(t);
      } else if (latest.spellName.includes('Rayo') || latest.spellName.includes('LIGHTNING')) {
        setActiveEffect('LIGHTNING');
        const t = setTimeout(() => setActiveEffect(null), 600);
        return () => clearTimeout(t);
      }
    }
  }, [logs, selfPlayer.id]);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {/* 1. Ice / Frozen Overlay (Cyan Frost Glass - 0% input blocking) */}
      {isFrozen && (
        <div className="absolute inset-0 bg-cyan-400/15 backdrop-blur-[1px] border-[18px] border-cyan-400/50 shadow-[inset_0_0_120px_rgba(6,182,212,0.7)] flex items-center justify-center animate-pulse">
          <div className="flex flex-col items-center gap-2 bg-slate-950/80 p-4 rounded-2xl border border-cyan-400/60 text-cyan-200 shadow-2xl">
            <Snowflake className="w-10 h-10 text-cyan-300 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="font-extrabold text-xs uppercase tracking-widest">❄️ ¡EFECTO DE HIELO ACTIVO! (Tipeo Habilitado)</span>
          </div>
        </div>
      )}

      {/* 2. Fire Damage Overlay */}
      {!isFrozen && activeEffect === 'FIRE' && (
        <div className="absolute inset-0 bg-gradient-to-t from-orange-600/40 via-red-600/30 to-amber-500/20 border-[16px] border-orange-500/60 shadow-[inset_0_0_120px_rgba(234,88,12,0.9)] animate-pulse">
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-orange-950/90 border border-orange-500 px-4 py-2 rounded-xl text-orange-200 font-extrabold text-sm shadow-xl">
            <Flame className="w-6 h-6 text-amber-400 animate-bounce" />
            <span>¡DAÑO DE FUEGO SUFRIDO!</span>
          </div>
        </div>
      )}

      {/* 3. Lightning Shock Overlay */}
      {!isFrozen && activeEffect === 'LIGHTNING' && (
        <div className="absolute inset-0 bg-yellow-400/25 border-[12px] border-cyan-400/80 shadow-[inset_0_0_90px_rgba(250,204,21,0.8)] animate-ping" style={{ animationDuration: '0.3s' }}>
          <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-yellow-950/90 border border-yellow-400 px-4 py-2 rounded-xl text-yellow-200 font-extrabold text-sm shadow-xl">
            <Zap className="w-6 h-6 text-yellow-300 animate-pulse" />
            <span>¡DESCARGA ELÉCTRICA ARCANA!</span>
          </div>
        </div>
      )}

      {/* 4. Red Hit Damage Flash */}
      {!isFrozen && activeEffect === 'DAMAGE' && (
        <div className="absolute inset-0 bg-red-600/30 border-[12px] border-red-500/70 shadow-[inset_0_0_100px_rgba(225,29,72,0.9)] transition-opacity duration-300" />
      )}
    </div>
  );
};
