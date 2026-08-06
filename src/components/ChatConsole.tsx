import React, { useState, useEffect, useRef } from 'react';
import type { SpellId, SpellDefinition } from '../types/game';
import { SPELLS, analyzeTypingModifier } from '../config/spells';
import { Send } from 'lucide-react';

interface ChatConsoleProps {
  onCastSpell: (rawText: string, spellId: SpellId) => void;
  disabled: boolean;
  cooldowns: Record<SpellId, number>;
  isFrozen: boolean;
}

export const ChatConsole: React.FC<ChatConsoleProps> = ({
  onCastSpell,
  disabled,
  cooldowns,
  isFrozen
}) => {
  const [typedText, setTypedText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically
  useEffect(() => {
    if (!disabled && !isFrozen) {
      inputRef.current?.focus();
    }
  }, [disabled, isFrozen]);

  // Find matching spell based on input text
  const trimmed = typedText.trim();
  const matchedSpell: SpellDefinition | null = Object.values(SPELLS).find((spell) => {
    const textLower = trimmed.toLowerCase();
    return textLower === spell.incantation.toLowerCase() || textLower === spell.shortCode.toLowerCase();
  }) || null;

  // Analyze Case Modifier live
  const modifierInfo = matchedSpell ? analyzeTypingModifier(typedText, matchedSpell) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed || disabled || isFrozen) return;

    if (matchedSpell) {
      onCastSpell(typedText, matchedSpell.id);
      setTypedText('');
    } else {
      // Default to FIREBALL or notify error
      onCastSpell(typedText, 'FIREBALL');
      setTypedText('');
    }
  };

  const handleQuickInsert = (text: string) => {
    setTypedText(text);
    inputRef.current?.focus();
  };

  return (
    <div className="w-full glass-card p-4 rounded-2xl border border-slate-800 space-y-3">
      {/* Live Typing Analysis Badge Indicator */}
      <div className="flex items-center justify-between min-h-[32px] px-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Modificador Detectado:</span>
          {modifierInfo ? (
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border shadow-sm transition-all duration-300 ${
                modifierInfo.caseType === 'UPPERCASE'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-amber-500/30 font-black'
                  : modifierInfo.caseType === 'LOWERCASE'
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : modifierInfo.caseType === 'ALTERNATING'
                  ? 'bg-purple-500/20 border-purple-400 text-purple-300 animate-pulse'
                  : modifierInfo.caseType === 'SHORTENED'
                  ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              {modifierInfo.caseType === 'UPPERCASE' && '⚡ MAYÚSCULA (+50% Daño Extra)'}
              {modifierInfo.caseType === 'LOWERCASE' && '💨 MINÚSCULA (Ligero / Recarga Rápida)'}
              {modifierInfo.caseType === 'ALTERNATING' && '🎲 ALTERNADO (50% Crítico / 50% Recular)'}
              {modifierInfo.caseType === 'SHORTENED' && '💥 ABREVIADO (80% Probabilidad de Fallo)'}
              {modifierInfo.caseType === 'NORMAL' && '✨ Normal'}
            </span>
          ) : (
            <span className="text-xs text-slate-500 italic">Escribe el nombre de un hechizo...</span>
          )}
        </div>

        {/* Short suggestion hints */}
        {matchedSpell && (
          <span className="text-xs font-mono text-cyan-400 font-semibold bg-cyan-950/60 border border-cyan-800 px-2.5 py-0.5 rounded-lg">
            {matchedSpell.icon} {matchedSpell.name}
          </span>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            disabled={disabled || isFrozen}
            placeholder={
              isFrozen
                ? '❄️ ¡CONGELADO! No puedes tipear...'
                : 'Tipea tu hechizo (ej: FIREBALL, fireball, fIrEbAlL, frbl)...'
            }
            className={`w-full bg-slate-950/90 border-2 text-white font-mono text-base px-4 py-3.5 rounded-xl outline-none transition-all placeholder:text-slate-600 ${
              isFrozen
                ? 'border-cyan-500/80 bg-cyan-950/30 cursor-not-allowed text-cyan-200'
                : modifierInfo?.caseType === 'UPPERCASE'
                ? 'border-amber-400 shadow-md shadow-amber-500/20 tracking-wider font-extrabold text-amber-200'
                : modifierInfo?.caseType === 'ALTERNATING'
                ? 'border-purple-400 text-purple-200 font-bold'
                : 'border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'
            }`}
          />

          {/* Icon indicator inside input */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
            {matchedSpell && <span className="text-xl">{matchedSpell.icon}</span>}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={disabled || isFrozen || !trimmed}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-cyan-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 border border-cyan-400/30 shrink-0 active:scale-95"
        >
          <Send className="w-5 h-5" />
          <span>Lanzar</span>
        </button>
      </form>

      {/* Quick Spell Buttons Bar */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800/80">
        <span className="text-xs text-slate-400 font-semibold self-center mr-1">Tipear Rápido:</span>
        {Object.values(SPELLS).map((spell) => {
          const now = Date.now();
          const cdTime = cooldowns[spell.id] || 0;
          const isOnCd = cdTime > now;
          const remainingSec = isOnCd ? ((cdTime - now) / 1000).toFixed(1) : null;

          return (
            <div key={spell.id} className="relative group">
              <button
                type="button"
                onClick={() => handleQuickInsert(spell.incantation)}
                disabled={disabled || isFrozen || isOnCd}
                className="bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-slate-200 transition-all disabled:opacity-40"
              >
                <span>{spell.icon}</span>
                <span className="font-mono font-semibold">{spell.incantation}</span>
                {isOnCd && <span className="text-amber-400 font-bold ml-1">{remainingSec}s</span>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
