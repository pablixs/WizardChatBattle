import React from 'react';
import { SPELLS } from '../config/spells';
import { BookOpen } from 'lucide-react';

export const Spellbook: React.FC = () => {
  return (
    <div className="w-full glass-card p-4 rounded-2xl border border-slate-800 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>Libro de Hechizos y Guía de Tipeo</span>
        </h4>
      </div>

      {/* Typing Modifier Cheat Sheet */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-slate-900/90 border border-amber-500/30 p-2 rounded-xl">
          <div className="font-bold text-amber-300 flex items-center gap-1">⚡ MAYÚSCULAS</div>
          <div className="font-mono text-slate-300 mt-0.5">`FIREBALL`</div>
          <div className="text-[10px] text-slate-400 mt-1">+50% Daño Extra (Gasta 1 Carga Mayúscula)</div>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/30 p-2 rounded-xl">
          <div className="font-bold text-emerald-300 flex items-center gap-1">💨 minúsculas</div>
          <div className="font-mono text-slate-300 mt-0.5">`fireball`</div>
          <div className="text-[10px] text-slate-400 mt-1">Lanzamiento Ligero (-20% Tiempo de Recarga)</div>
        </div>

        <div className="bg-slate-900/90 border border-purple-500/30 p-2 rounded-xl">
          <div className="font-bold text-purple-300 flex items-center gap-1">🎲 aLtErNaDo</div>
          <div className="font-mono text-slate-300 mt-0.5">`fIrEbAlL`</div>
          <div className="text-[10px] text-slate-400 mt-1">50% Crítico x2 / 50% Recular Daño Propio</div>
        </div>

        <div className="bg-slate-900/90 border border-rose-500/30 p-2 rounded-xl">
          <div className="font-bold text-rose-300 flex items-center gap-1">💥 Abraviado</div>
          <div className="font-mono text-slate-300 mt-0.5">`frbl`</div>
          <div className="text-[10px] text-slate-400 mt-1">80% Probabilidad de Fallar / 20% Golpe Directo</div>
        </div>
      </div>

      {/* Spell Catalog List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
        {Object.values(SPELLS).map((spell) => (
          <div
            key={spell.id}
            className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                <span className="text-base">{spell.icon}</span>
                <span>{spell.name}</span>
              </div>
              <span className="text-[10px] font-mono bg-cyan-950 border border-cyan-800/60 text-cyan-300 px-1.5 py-0.5 rounded">
                CD: {spell.cooldownMs / 1000}s
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-tight mb-2">{spell.description}</p>

            <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-slate-900">
              <span className="text-slate-300 font-semibold">Tipeo: <code className="text-amber-300">{spell.incantation}</code></span>
              <span className="text-slate-400">Corto: <code className="text-rose-300">{spell.shortCode}</code></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
