import React, { useRef, useEffect } from 'react';
import type { BattleLogEntry } from '../types/game';

interface BattleLogProps {
  logs: BattleLogEntry[];
  currentPlayerId: string;
}

export const BattleLog: React.FC<BattleLogProps> = ({ logs, currentPlayerId }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto scroll on new log
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [logs]);

  return (
    <div className="w-full glass-card p-4 rounded-2xl border border-slate-800 flex flex-col h-64 md:h-72">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <span>📜 Registro de la Batalla</span>
        </h4>
        <span className="text-xs text-slate-400 font-mono">{logs.length} eventos</span>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar"
      >
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm italic">
            Esperando el inicio del duelo...
          </div>
        ) : (
          logs.map((entry) => {
            const isSelf = entry.casterId === currentPlayerId;
            const isSystem = entry.casterId === 'SYSTEM';

            return (
              <div
                key={entry.id}
                className={`p-3 rounded-xl border text-sm transition-all animate-fadeIn ${
                  isSystem
                    ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                    : isSelf
                    ? 'bg-cyan-950/30 border-cyan-500/30 text-slate-200'
                    : 'bg-rose-950/30 border-rose-500/30 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700">
                      {entry.casterName}
                    </span>
                    <span className="font-semibold text-cyan-300">{entry.spellName}</span>
                  </div>

                  {/* Badges for Result Types */}
                  <div className="flex items-center gap-1">
                    {entry.resultType === 'CRIT' && (
                      <span className="bg-purple-500/20 border border-purple-400 text-purple-300 font-bold text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        ⚡ CRÍTICO
                      </span>
                    )}
                    {entry.resultType === 'SUPER_CAST' && (
                      <span className="bg-amber-500/20 border border-amber-400 text-amber-300 font-bold text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        🔥 MAYÚSCULA +50%
                      </span>
                    )}
                    {entry.resultType === 'FIZZLE' && (
                      <span className="bg-rose-500/20 border border-rose-400 text-rose-300 font-bold text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        💨 FALLIDO
                      </span>
                    )}
                    {entry.resultType === 'RECOIL' && (
                      <span className="bg-orange-500/20 border border-orange-400 text-orange-300 font-bold text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        💥 RECULAR
                      </span>
                    )}
                  </div>
                </div>

                {/* Raw Typed String Display */}
                {entry.rawTyped && (
                  <div className="my-1 text-xs font-mono bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400">Texto tipeado:</span>
                    <span
                      className={`font-bold ${
                        entry.caseType === 'UPPERCASE'
                          ? 'text-amber-300 tracking-wider font-black'
                          : entry.caseType === 'ALTERNATING'
                          ? 'text-purple-300 italic'
                          : entry.caseType === 'SHORTENED'
                          ? 'text-rose-300'
                          : 'text-slate-300'
                      }`}
                    >
                      "{entry.rawTyped}"
                    </span>
                  </div>
                )}

                {/* Main Action Message */}
                <p className="text-xs leading-relaxed text-slate-300">{entry.message}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
