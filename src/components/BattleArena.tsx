import React, { useState, useEffect } from 'react';
import type { GameState, SpellId } from '../types/game';
import { WizardAvatar } from './WizardAvatar';
import { ChatConsole } from './ChatConsole';
import { BattleLog } from './BattleLog';
import { Spellbook } from './Spellbook';
import { ScreenEffects } from './ScreenEffects';
import { MatchIntroBanner } from './MatchIntroBanner';
import { sound } from '../services/sound';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, LogOut, Swords } from 'lucide-react';

interface BattleArenaProps {
  gameState: GameState;
  currentPlayerId: string;
  onCastSpell: (rawText: string, spellId: SpellId) => void;
  onRematch: () => void;
  onLeaveRoom: () => void;
}

export const BattleArena: React.FC<BattleArenaProps> = ({
  gameState,
  currentPlayerId,
  onCastSpell,
  onRematch,
  onLeaveRoom
}) => {
  const [showIntroBanner, setShowIntroBanner] = useState<boolean>(true);
  const players = Object.values(gameState.players);
  const selfPlayer = gameState.players[currentPlayerId];
  const opponentPlayer = players.find((p) => p.id !== currentPlayerId);
  const isFinished = gameState.status === 'FINISHED';
  const isWinner = gameState.winnerId === currentPlayerId;

  // Reset intro banner when a new match or rematch begins
  useEffect(() => {
    if (gameState.status === 'PLAYING') {
      setShowIntroBanner(true);
    }
  }, [gameState.startTime, gameState.status]);

  // Sound & Victory trigger on game over
  useEffect(() => {
    if (isFinished) {
      if (isWinner) {
        sound.playVictory();
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    }
  }, [isFinished, isWinner]);

  if (!selfPlayer) return null;

  const isSelfFrozen = selfPlayer.statusEffects.frozenUntil > Date.now();

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 animate-fadeIn relative">
      {/* Visual Screen Effects Overlay (Damage, Fire, Freeze, Lightning) */}
      <ScreenEffects
        logs={gameState.logs}
        selfPlayer={selfPlayer}
        isFrozen={isSelfFrozen}
      />

      {/* Match Presentation Intro Banner */}
      {showIntroBanner && gameState.status === 'PLAYING' && (
        <MatchIntroBanner
          players={players}
          currentPlayerId={currentPlayerId}
          onDismiss={() => setShowIntroBanner(false)}
        />
      )}

      {/* Top Arena Header Bar */}
      <div className="glass-card px-4 py-3 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-cyan-400" />
          <span className="font-mono text-sm font-bold text-slate-300">Sala:</span>
          <span className="font-mono text-base font-black text-cyan-300 tracking-wider bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg">
            {gameState.roomCode}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onLeaveRoom}
            className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>
      </div>

      {/* 1v1 Wizard Battle Avatars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WizardAvatar player={selfPlayer} isCurrentPlayer={true} />
        {opponentPlayer ? (
          <WizardAvatar player={opponentPlayer} isCurrentPlayer={false} />
        ) : (
          <div className="glass-card p-6 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-500 text-sm italic">
            Esperando oponente...
          </div>
        )}
      </div>

      {/* Main Interactive Controls & Logs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Typing Input Console + Spellbook */}
        <div className="lg:col-span-2 space-y-4">
          <ChatConsole
            onCastSpell={onCastSpell}
            disabled={isFinished}
            cooldowns={selfPlayer.cooldowns}
          />
          <Spellbook />
        </div>

        {/* Right Column: Real-time Action Log */}
        <div className="lg:col-span-1">
          <BattleLog logs={gameState.logs} currentPlayerId={currentPlayerId} />
        </div>
      </div>

      {/* Game Over Modal overlay */}
      {isFinished && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="glass-card p-8 rounded-3xl border border-slate-700 max-w-md w-full text-center space-y-5 shadow-2xl">
            <div className="inline-flex p-4 rounded-full bg-amber-500/10 border border-amber-400/40 text-amber-300">
              <Trophy className="w-16 h-16 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl font-extrabold text-white">
                {isWinner ? '🏆 ¡VICTORIA MAGISTRAL!' : '💀 DERROTA EN EL DUELO'}
              </h2>
              <p className="text-sm text-slate-400">
                {isWinner
                  ? '¡Tus dedos veloces desataron la magia suprema y derrotaron al rival!'
                  : 'Tu oponente fue más rápido o preciso. ¡Practica el tipeo y busca tu revancha!'}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button
                onClick={onRematch}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Pedir Revancha</span>
              </button>

              <button
                onClick={onLeaveRoom}
                className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold py-3 rounded-xl border border-slate-800 transition-all"
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
