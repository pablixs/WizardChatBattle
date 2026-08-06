import React, { useState, useEffect, useRef } from 'react';
import type { SpellId, SpellDefinition } from '../types/game';
import { SPELLS, analyzeTypingModifier } from '../config/spells';
import { Send } from 'lucide-react';

interface ChatConsoleProps {
  onCastSpell: (rawText: string, spellId: SpellId) => void;
  disabled: boolean;
}

export const ChatConsole: React.FC<ChatConsoleProps> = ({
  onCastSpell,
  disabled
}) => {
  const [typedText, setTypedText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const trimmed = typedText.trim();
  const matchedSpell: SpellDefinition | null = Object.values(SPELLS).find((spell) => {
    const textLower = trimmed.toLowerCase();
    return textLower === spell.incantation.toLowerCase() || textLower === spell.shortCode.toLowerCase();
  }) || null;

  const modifierInfo = matchedSpell ? analyzeTypingModifier(typedText, matchedSpell) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed || disabled) return;
    if (matchedSpell) {
      onCastSpell(typedText, matchedSpell.id);
    } else {
      onCastSpell(typedText, 'FIREBALL');
    }
    setTypedText('');
  };

  const modBadgeClass = modifierInfo
    ? modifierInfo.caseType === 'UPPERCASE'
      ? 'bg-amber-500/30 border-amber-400/60 text-amber-300'
      : modifierInfo.caseType === 'LOWERCASE'
      ? 'bg-emerald-500/30 border-emerald-400/60 text-emerald-300'
      : modifierInfo.caseType === 'ALTERNATING'
      ? 'bg-purple-500/30 border-purple-400/60 text-purple-300'
      : modifierInfo.caseType === 'SHORTENED'
      ? 'bg-rose-500/30 border-rose-400/60 text-rose-300'
      : 'bg-slate-700/30 border-slate-600/60 text-slate-400'
    : '';

  const modLabel = modifierInfo
    ? modifierInfo.caseType === 'UPPERCASE' ? '⚡ MAYÚSCULA +50%'
    : modifierInfo.caseType === 'LOWERCASE' ? '💨 Ligero -20% CD'
    : modifierInfo.caseType === 'ALTERNATING' ? '🎲 50/50 Crit/Recular'
    : modifierInfo.caseType === 'SHORTENED' ? '💥 80% Fallo'
    : '✨ Normal'
    : null;

  return (
    <div className="space-y-2">
      {/* Modifier badge + matched spell indicator */}
      <div className="flex items-center justify-between px-1 min-h-[24px]">
        <div className="flex items-center gap-2">
          {modifierInfo && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${modBadgeClass}`}>
              {modLabel}
            </span>
          )}
        </div>
        {matchedSpell && (
          <span className="text-xs font-bold text-indigo-300 flex items-center gap-1">
            {matchedSpell.icon} {matchedSpell.name}
          </span>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            disabled={disabled}
            placeholder="Escribe tu hechizo aquí..."
            autoComplete="off"
            className={`w-full bg-slate-950/90 border-2 text-white font-mono text-sm px-4 py-3 rounded-xl outline-none transition-all placeholder:text-slate-600 ${
              modifierInfo?.caseType === 'UPPERCASE'
                ? 'border-amber-400/60 shadow-md shadow-amber-500/10 tracking-wider font-extrabold text-amber-200'
                : modifierInfo?.caseType === 'ALTERNATING'
                ? 'border-purple-400/60 text-purple-200 font-bold'
                : 'border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
            }`}
          />
          {matchedSpell && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <span className="text-lg">{matchedSpell.icon}</span>
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={disabled || !trimmed}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 border border-indigo-400/30 shrink-0 active:scale-95"
        >
          <Send className="w-4 h-4" />
          <span className="text-sm">Lanzar</span>
        </button>
      </form>
    </div>
  );
};
