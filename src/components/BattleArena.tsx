import React, { useState, useEffect } from 'react';
import type { GameState, SpellId } from '../types/game';
import { SPELLS } from '../config/spells';
import { ChatConsole } from './ChatConsole';
import { ScreenEffects } from './ScreenEffects';
import { MatchIntroBanner } from './MatchIntroBanner';
import { sound } from '../services/sound';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, LogOut, Swords, Shield, Zap, Snowflake } from 'lucide-react';

interface BattleArenaProps {
  gameState: GameState;
  currentPlayerId: string;
  onCastSpell: (rawText: string, spellId: SpellId) => void;
  onRematch: () => void;
  onLeaveRoom: () => void;
}

/* ──── Pokémon‑style HP Nameplate ──── */
const HPNameplate: React.FC<{
  name: string;
  avatar: string;
  hp: number;
  maxHp: number;
  shield: number;
  capsCharges: number;
  maxCapsCharges: number;
  isFrozen: boolean;
  isRight?: boolean;
  isCurrentPlayer?: boolean;
}> = ({ name, avatar, hp, maxHp, shield, capsCharges, maxCapsCharges, isFrozen, isRight, isCurrentPlayer }) => {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const barColor = pct > 50 ? 'bg-emerald-400' : pct > 25 ? 'bg-amber-400' : 'bg-red-500';

  return (
    <div className={`pokemon-nameplate ${isRight ? 'animate-slideRight' : 'animate-slideLeft'}`}>
      {/* Top row: name + level-like tag */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{avatar}</span>
          <span className="font-extrabold text-white text-base tracking-wide">{name}</span>
          {isCurrentPlayer && (
            <span className="text-[10px] font-bold bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 px-1.5 py-0.5 rounded">TÚ</span>
          )}
        </div>
        {isFrozen && (
          <span className="text-[10px] font-bold bg-cyan-600/40 text-cyan-200 border border-cyan-400/50 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Snowflake className="w-3 h-3" /> FRZ
          </span>
        )}
      </div>

      {/* HP Bar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-amber-300 tracking-widest">HP</span>
        <div className="flex-1 h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700 relative">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* HP Numbers */}
      <div className="flex items-center justify-end gap-3 mt-0.5">
        <span className="text-xs font-mono font-bold text-white">
          {hp} <span className="text-slate-500">/</span> {maxHp}
        </span>
      </div>

      {/* Bottom row: Shield + Caps */}
      <div className="flex items-center justify-between mt-1.5 gap-2">
        {shield > 0 ? (
          <div className="flex items-center gap-1 text-[10px] text-blue-300 font-bold bg-blue-950/60 border border-blue-500/40 px-2 py-0.5 rounded-full">
            <Shield className="w-3 h-3" /> +{shield}
          </div>
        ) : <div />}
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          {Array.from({ length: maxCapsCharges }).map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i < capsCharges ? 'bg-amber-400 shadow-sm shadow-amber-400/60' : 'bg-slate-700'}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ──── Pokémon‑style Battle Avatar on the scene ──── */
const BattleSprite: React.FC<{
  avatar: string;
  isOpponent?: boolean;
  isFrozen?: boolean;
  hp: number;
  maxHp: number;
}> = ({ avatar, isOpponent, isFrozen, hp, maxHp }) => {
  const lowHp = hp / maxHp < 0.25;
  return (
    <div className={`relative flex flex-col items-center ${isOpponent ? 'animate-slideRight' : 'animate-slideLeft'}`}>
      {/* Shadow under sprite */}
      <div className={`absolute -bottom-2 w-20 h-4 rounded-full bg-black/30 blur-sm ${isOpponent ? '' : ''}`} />
      <span className={`text-7xl md:text-8xl select-none transition-all duration-300 ${
        isFrozen ? 'filter brightness-150 hue-rotate-180 scale-95' : ''
      } ${lowHp ? 'animate-shake' : 'hover:scale-105'} ${
        isOpponent ? 'transform scale-x-[-1]' : ''
      }`}>
        {avatar}
      </span>
    </div>
  );
};

/* ──── Pokémon‑style Move Button (2×2 grid cell) ──── */
const MoveButton: React.FC<{
  spell: typeof SPELLS[keyof typeof SPELLS];
  isOnCd: boolean;
  remainingSec: string | null;
  onClick: () => void;
}> = ({ spell, isOnCd, remainingSec, onClick }) => {
  const elementClass = `move-${spell.element}`;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isOnCd}
      className={`move-button ${elementClass} ${isOnCd ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{spell.icon}</span>
        <div className="text-left">
          <div className="font-bold text-sm leading-none text-white">{spell.name}</div>
          <div className="text-[10px] text-white/70 font-mono mt-0.5">
            Tipear: <code className="font-bold text-white/90">{spell.incantation}</code>
          </div>
        </div>
      </div>
      <div className="text-right">
        {isOnCd ? (
          <span className="text-xs font-mono font-bold text-white/80">⏳{remainingSec}s</span>
        ) : (
          <span className="text-[10px] font-bold text-white/90 bg-white/20 px-2 py-0.5 rounded-full">LISTO</span>
        )}
      </div>
    </button>
  );
};

/* ──── Main Battle Arena ──── */
export const BattleArena: React.FC<BattleArenaProps> = ({
  gameState,
  currentPlayerId,
  onCastSpell,
  onRematch,
  onLeaveRoom
}) => {
  const [showIntroBanner, setShowIntroBanner] = useState<boolean>(true);
  const [, forceUpdate] = useState(0);
  const players = Object.values(gameState.players);
  const selfPlayer = gameState.players[currentPlayerId];
  const opponentPlayer = players.find((p) => p.id !== currentPlayerId);
  const isFinished = gameState.status === 'FINISHED';
  const isWinner = gameState.winnerId === currentPlayerId;
  const now = Date.now();

  // Force re-render every second to update cooldown timers
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (gameState.status === 'PLAYING') {
      setShowIntroBanner(true);
    }
  }, [gameState.startTime, gameState.status]);

  useEffect(() => {
    if (isFinished) {
      if (isWinner) {
        sound.playVictory();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
    }
  }, [isFinished, isWinner]);

  if (!selfPlayer) return null;

  const isSelfFrozen = selfPlayer.statusEffects.frozenUntil > now;
  const isOpponentFrozen = opponentPlayer ? opponentPlayer.statusEffects.frozenUntil > now : false;

  // Get the most recent log entry for the dialogue box
  const latestLog = gameState.logs.length > 0 ? gameState.logs[0] : null;

  // Split spells into two rows for the 2x2-ish grid
  const spellList = Object.values(SPELLS);

  return (
    <div className="w-full max-w-4xl mx-auto animate-fadeIn relative flex flex-col" style={{ minHeight: 'calc(100vh - 2rem)' }}>
      <ScreenEffects logs={gameState.logs} selfPlayer={selfPlayer} isFrozen={isSelfFrozen} />

      {showIntroBanner && gameState.status === 'PLAYING' && (
        <MatchIntroBanner
          players={players}
          currentPlayerId={currentPlayerId}
          onDismiss={() => setShowIntroBanner(false)}
        />
      )}

      {/* ═══ TOP BAR ═══ */}
      <div className="flex items-center justify-between px-3 py-2 mb-2">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-slate-400 font-mono">Sala: <span className="text-indigo-300">{gameState.roomCode}</span></span>
        </div>
        <button
          onClick={onLeaveRoom}
          className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1 font-semibold"
        >
          <LogOut className="w-3.5 h-3.5" /> Huir
        </button>
      </div>

      {/* ═══ TOP ROW: ZONA A + ZONA B ═══ */}
      <div className="flex gap-3 mb-3" style={{ minHeight: '340px' }}>

        {/* ── ZONA A: Battle Scene (left, ~60%) ── */}
        <div className="flex-[3] battle-scene relative rounded-2xl overflow-hidden border border-slate-800/50">
          {/* Opponent nameplate — top-right */}
          {opponentPlayer && (
            <div className="absolute top-4 right-4 left-[40%] z-10">
              <HPNameplate
                name={opponentPlayer.name}
                avatar={opponentPlayer.avatar}
                hp={opponentPlayer.hp}
                maxHp={opponentPlayer.maxHp}
                shield={opponentPlayer.shield}
                capsCharges={opponentPlayer.capsCharges}
                maxCapsCharges={opponentPlayer.maxCapsCharges}
                isFrozen={isOpponentFrozen}
                isRight
              />
            </div>
          )}

          {/* Self nameplate — bottom-left */}
          <div className="absolute bottom-4 left-4 right-[40%] z-10">
            <HPNameplate
              name={selfPlayer.name}
              avatar={selfPlayer.avatar}
              hp={selfPlayer.hp}
              maxHp={selfPlayer.maxHp}
              shield={selfPlayer.shield}
              capsCharges={selfPlayer.capsCharges}
              maxCapsCharges={selfPlayer.maxCapsCharges}
              isFrozen={isSelfFrozen}
              isCurrentPlayer
            />
          </div>

          {/* Battle sprites */}
          <div className="absolute inset-0 flex items-center justify-between px-8 md:px-16">
            <div className="self-end mb-20 md:mb-24">
              <BattleSprite
                avatar={selfPlayer.avatar}
                hp={selfPlayer.hp}
                maxHp={selfPlayer.maxHp}
                isFrozen={isSelfFrozen}
              />
            </div>
            {opponentPlayer ? (
              <div className="self-start mt-16 md:mt-20">
                <BattleSprite
                  avatar={opponentPlayer.avatar}
                  isOpponent
                  hp={opponentPlayer.hp}
                  maxHp={opponentPlayer.maxHp}
                  isFrozen={isOpponentFrozen}
                />
              </div>
            ) : (
              <div className="self-start mt-16 md:mt-20 text-4xl opacity-30 animate-pulse">❓</div>
            )}
          </div>

          {/* Dialogue overlay at bottom of battle scene */}
          <div className="absolute bottom-0 left-0 right-0 z-20">
            <div className="pokemon-dialog-box !rounded-none !rounded-b-2xl !border-t-2 !border-indigo-500/30 !py-2 !px-4">
              {latestLog ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm">{latestLog.casterId === currentPlayerId ? selfPlayer.avatar : opponentPlayer?.avatar || '🧙'}</span>
                  <span className="font-bold text-xs text-slate-200">{latestLog.casterName}</span>
                  <span className="text-indigo-300 text-xs font-semibold">{latestLog.spellName}</span>
                  {latestLog.resultType === 'CRIT' && <span className="text-[9px] font-bold text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded-full">⚡ CRIT</span>}
                  {latestLog.resultType === 'SUPER_CAST' && <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded-full">🔥 SUPER</span>}
                  {latestLog.resultType === 'FIZZLE' && <span className="text-[9px] font-bold text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded-full">💨 FALLÓ</span>}
                  {latestLog.resultType === 'RECOIL' && <span className="text-[9px] font-bold text-orange-300 bg-orange-500/20 px-1.5 py-0.5 rounded-full">💥 RECULAR</span>}
                  <span className="text-[10px] text-slate-500 ml-auto truncate max-w-[200px]">{latestLog.message}</span>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic text-center">¿Qué hará el mago?</p>
              )}
            </div>
          </div>
        </div>

        {/* ── ZONA B: Spell Moves (right, ~40%) ── */}
        <div className="flex-[2] glass-card rounded-2xl border border-indigo-500/20 p-3 flex flex-col">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800/60">
            <span className="text-sm">📖</span>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Hechizos</span>
            <span className="text-[10px] text-slate-500 ml-auto font-mono">Tipear para lanzar</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 flex-1 auto-rows-fr">
            {spellList.map((spell) => {
              const cdTime = selfPlayer.cooldowns[spell.id] || 0;
              const isOnCd = cdTime > now;
              const remainingSec = isOnCd ? ((cdTime - now) / 1000).toFixed(1) : null;
              return (
                <MoveButton
                  key={spell.id}
                  spell={spell}
                  isOnCd={isOnCd}
                  remainingSec={remainingSec}
                  onClick={() => {}}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ ZONA C: Full-width Typing Input ═══ */}
      <div className="glass-card rounded-2xl border border-indigo-500/20 p-4">
        <ChatConsole
          onCastSpell={onCastSpell}
          disabled={isFinished}
        />
      </div>

      {/* ═══ GAME OVER OVERLAY ═══ */}
      {isFinished && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900/95 border-2 border-amber-500/50 p-8 rounded-3xl max-w-md w-full text-center space-y-5 shadow-2xl shadow-amber-500/10">
            <div className="inline-flex p-4 rounded-full bg-amber-500/10 border border-amber-400/40 text-amber-300">
              <Trophy className="w-16 h-16 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-extrabold text-white">
                {isWinner ? '🏆 ¡VICTORIA!' : '💀 DERROTA'}
              </h2>
              <p className="text-sm text-slate-400">
                {isWinner
                  ? '¡Tu magia fue superior! El rival ha caído.'
                  : 'Tu oponente fue más rápido. ¡Intenta de nuevo!'}
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-3">
              <button
                onClick={onRematch}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <RefreshCw className="w-5 h-5" /> Revancha
              </button>
              <button
                onClick={onLeaveRoom}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl border border-slate-700 transition-all"
              >
                Volver al Lobby
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
