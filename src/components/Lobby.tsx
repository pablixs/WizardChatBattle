import React, { useState } from 'react';
import type { GameState, PlayerState } from '../types/game';
import { Spellbook } from './Spellbook';
import { Swords, Users, Copy, Check, Play, Radio, AlertCircle } from 'lucide-react';

interface LobbyProps {
  onJoinRoom: (roomCode: string, name: string, avatar: string, useLocalFallback: boolean, customHost?: string) => void;
  onStartMatch: () => void;
  gameState: GameState | null;
  currentPlayerId: string;
  errorMessage: string | null;
}

const AVATARS = ['🧙‍♂️', '🧙‍♀️', '🧝‍♂️', '🧝‍♀️', '🦸‍♂️', '🧛‍♂️', '🥷', '🧌'];

export const Lobby: React.FC<LobbyProps> = ({
  onJoinRoom,
  onStartMatch,
  gameState,
  currentPlayerId,
  errorMessage
}) => {
  const [roomCodeInput, setRoomCodeInput] = useState('AB12');
  const [nameInput, setNameInput] = useState('Archimago');
  const [selectedAvatar, setSelectedAvatar] = useState('🧙‍♂️');
  const [useLocalFallback, setUseLocalFallback] = useState(true);
  const [customHost, setCustomHost] = useState(import.meta.env.VITE_PARTY_HOST || 'golf-js-party.golfjstp.workers.dev');
  const [copiedCode, setCopiedCode] = useState(false);

  const isJoined = gameState !== null && gameState.players[currentPlayerId];
  const playersList: PlayerState[] = gameState ? Object.values(gameState.players) : [];
  const isHost = isJoined && gameState.players[currentPlayerId]?.isHost;
  const canStart = isHost && playersList.length >= 2;

  const handleGenerateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRoomCodeInput(code);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    onJoinRoom(
      roomCodeInput.trim().toUpperCase(),
      nameInput.trim() || 'Mago',
      selectedAvatar,
      useLocalFallback,
      customHost.trim()
    );
  };

  const handleCopy = () => {
    if (gameState?.roomCode) {
      navigator.clipboard.writeText(gameState.roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6 animate-fadeIn">
      {/* Title Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mb-2">
          <Swords className="w-12 h-12" />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-300 via-purple-400 to-pink-300 bg-clip-text text-transparent">
          ⚔️ Wizard Chat Battle
        </h1>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          Duelo PvP de magos en tiempo real. Tipea tus hechizos con diferentes estilos para modificar su poder.
        </p>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-rose-950/80 border border-rose-500/50 p-4 rounded-2xl flex items-start gap-3 text-rose-200 text-xs shadow-lg animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block text-rose-100 text-sm">Error de Conexión</span>
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {!isJoined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Join Form */}
          <form onSubmit={handleJoin} className="glass-card p-6 rounded-2xl border border-indigo-500/20 space-y-5">
            {/* Avatar Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Tu Mago:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`p-3 text-2xl rounded-xl border-2 transition-all ${
                      selectedAvatar === av
                        ? 'bg-indigo-500/20 border-indigo-400 scale-105 shadow-md shadow-indigo-500/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Nombre:</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Tu nombre mágico..."
                className="w-full bg-slate-950 border-2 border-slate-800 text-white font-semibold px-4 py-3 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                required
              />
            </div>

            {/* Room Code */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Código de Sala:</label>
                <button type="button" onClick={handleGenerateCode} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                  🎲 Generar
                </button>
              </div>
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="AB12"
                className="w-full bg-slate-950 border-2 border-slate-800 text-indigo-300 font-mono text-center text-2xl font-bold tracking-widest px-4 py-3 rounded-xl outline-none focus:border-indigo-500 uppercase"
                required
              />
            </div>

            {/* Mode Toggle */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-200">Modo de Red:</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={useLocalFallback} onChange={(e) => setUseLocalFallback(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
              </div>
              <p className="text-[11px] text-slate-400">
                {useLocalFallback ? '🏠 Modo Local (2 pestañas mismo navegador)' : '🌐 Cloudflare Workers Online'}
              </p>
              {!useLocalFallback && (
                <div className="pt-1.5">
                  <input
                    type="text"
                    value={customHost}
                    onChange={(e) => setCustomHost(e.target.value)}
                    placeholder="golf-js-party.golfjstp.workers.dev"
                    className="w-full bg-slate-900 border border-slate-700 text-indigo-200 font-mono text-xs px-3 py-2 rounded-lg outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Join Button */}
            <button
              type="submit"
              className="w-full move-button move-arcane !justify-center !py-4 text-base font-extrabold"
            >
              <Users className="w-5 h-5" />
              <span className="ml-2">Unirse a la Sala {roomCodeInput}</span>
            </button>
          </form>

          {/* Right: Spellbook preview */}
          <div className="space-y-4">
            <Spellbook />
          </div>
        </div>
      ) : (
        /* Joined Lobby */
        <div className="glass-card p-6 rounded-2xl border border-indigo-500/20 space-y-6 max-w-xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Sala</span>
              <span className="text-3xl font-mono font-black text-indigo-300 tracking-widest">{gameState.roomCode}</span>
            </div>
            <button
              onClick={handleCopy}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs px-3 py-2 rounded-xl text-slate-200 flex items-center gap-1.5 transition-all"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
              <span>{copiedCode ? '¡Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          {/* Players */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Jugadores ({playersList.length}/2)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {playersList.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{p.avatar}</span>
                    <div>
                      <h4 className="font-bold text-white text-sm">{p.name}</h4>
                      <span className="text-xs text-slate-400">
                        {p.isHost ? '👑 Líder' : '⚔️ Desafiante'}
                      </span>
                    </div>
                  </div>
                  {p.id === currentPlayerId && (
                    <span className="bg-indigo-500/20 border border-indigo-400 text-indigo-300 text-xs px-2 py-0.5 rounded-full font-bold">Tú</span>
                  )}
                </div>
              ))}
              {playersList.length < 2 && (
                <div className="bg-slate-950/40 border-2 border-dashed border-slate-800 p-4 rounded-2xl flex items-center justify-center text-slate-500 text-xs font-semibold gap-2 animate-pulse">
                  <Users className="w-4 h-4" />
                  <span>Esperando Jugador 2...</span>
                </div>
              )}
            </div>
          </div>

          {/* Start */}
          {isHost ? (
            <button
              onClick={onStartMatch}
              disabled={!canStart}
              className="w-full move-button move-fire !justify-center !py-4 text-lg font-extrabold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="w-6 h-6 fill-current" />
              <span className="ml-2">{canStart ? '¡EMPEZAR PARTIDA!' : 'Esperando Jugador 2...'}</span>
            </button>
          ) : (
            <div className="bg-indigo-950/40 border border-indigo-500/30 p-4 rounded-xl text-center text-xs text-indigo-200 font-semibold animate-pulse">
              Esperando a que el Líder inicie la partida...
            </div>
          )}
        </div>
      )}
    </div>
  );
};
