import React from 'react';
import { SPELLS } from '../config/spells';
import { BookOpen } from 'lucide-react';

export const Spellbook: React.FC = () => {
  return (
    <div className="glass-card p-4 rounded-2xl border border-indigo-500/20 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span>Guía de Modificadores de Tipeo</span>
        </h4>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl">
          <div className="font-bold text-amber-300 flex items-center gap-1">⚡ MAYÚSCULAS</div>
          <div className="font-mono text-slate-300 mt-0.5">FIREBALL</div>
          <div className="text-[10px] text-slate-400 mt-1">+50% Daño (Gasta 1 Carga)</div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl">
          <div className="font-bold text-emerald-300 flex items-center gap-1">💨 minúsculas</div>
          <div className="font-mono text-slate-300 mt-0.5">fireball</div>
          <div className="text-[10px] text-slate-400 mt-1">Ligero (-20% Cooldown)</div>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/30 p-2.5 rounded-xl">
          <div className="font-bold text-purple-300 flex items-center gap-1">🎲 aLtErNaDo</div>
          <div className="font-mono text-slate-300 mt-0.5">fIrEbAlL</div>
          <div className="text-[10px] text-slate-400 mt-1">50% Crit x2 / 50% Recular</div>
        </div>

        <div className="bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-xl">
          <div className="font-bold text-rose-300 flex items-center gap-1">💥 Abreviado</div>
          <div className="font-mono text-slate-300 mt-0.5">frbl</div>
          <div className="text-[10px] text-slate-400 mt-1">80% Fallo / 20% Directo</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
        {Object.values(SPELLS).map((spell) => (
          <div
            key={spell.id}
            className={`move-button move-${spell.element} flex-col !items-start !justify-start !p-2.5 text-left`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-lg">{spell.icon}</span>
              <span className="font-bold text-xs">{spell.name}</span>
            </div>
            <p className="text-[10px] text-white/60 leading-tight mb-1.5">{spell.description}</p>
            <div className="flex items-center justify-between w-full text-[10px] font-mono pt-1 border-t border-white/10">
              <span className="text-white/80">⌨️ <code className="font-bold">{spell.incantation}</code></span>
              <span className="text-white/50">CD: {spell.cooldownMs / 1000}s</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
