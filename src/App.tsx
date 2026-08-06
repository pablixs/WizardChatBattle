import { useState, useEffect } from 'react';
import type { GameState, SpellId, ServerPacket } from './types/game';
import { socketService } from './services/socket';
import { SPELLS } from './config/spells';
import { sound } from './services/sound';
import { Lobby } from './components/Lobby';
import { BattleArena } from './components/BattleArena';
import { Swords, Volume2, VolumeX } from 'lucide-react';

export function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const currentPlayerId = socketService.getPlayerId();

  // Listen to WebSocket / Local state updates
  useEffect(() => {
    const unsubscribe = socketService.subscribe((packet: ServerPacket) => {
      if (packet.type === 'ROOM_STATE') {
        setGameState(packet.state);
        setErrorMessage(null);
      } else if (packet.type === 'SPELL_CAST_RESULT') {
        setGameState(packet.state);
        setErrorMessage(null);
        // Play spell sound effect based on spell element or result
        const spell = Object.values(SPELLS).find((s) => s.name === packet.entry.spellName);
        if (packet.entry.resultType === 'FIZZLE') {
          sound.playCast('fizzle');
        } else if (spell) {
          sound.playCast(spell.element);
        }
      } else if (packet.type === 'ERROR') {
        console.warn('Server Error Packet:', packet.message);
        setErrorMessage(packet.message);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleJoinRoom = (
    roomCode: string,
    name: string,
    avatar: string,
    useLocalFallback: boolean,
    customHost?: string
  ) => {
    setErrorMessage(null);
    socketService.connect(roomCode, customHost, useLocalFallback);
    socketService.send({
      type: 'JOIN_ROOM',
      roomCode,
      playerName: name,
      avatar
    });
  };

  const handleStartMatch = () => {
    socketService.send({ type: 'START_MATCH' });
  };

  const handleCastSpell = (rawText: string, spellId: SpellId) => {
    socketService.send({
      type: 'CAST_SPELL',
      rawText,
      spellId
    });
  };

  const handleRematch = () => {
    socketService.send({ type: 'REMATCH' });
  };

  const handleLeaveRoom = () => {
    socketService.send({ type: 'LEAVE_ROOM' });
    socketService.disconnect();
    setGameState(null);
    setErrorMessage(null);
  };

  const toggleSound = () => {
    sound.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  const isInBattle = gameState && (gameState.status === 'PLAYING' || gameState.status === 'FINISHED');

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 md:p-8">
      {/* Top Navbar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-3 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white tracking-wide">ChatBattle</h1>
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">Typing Wizard Duel</span>
          </div>
        </div>

        {/* Audio Toggle Button */}
        <button
          onClick={toggleSound}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-300 flex items-center gap-2 transition-all"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          <span>{soundEnabled ? 'Sonido ON' : 'Sonido OFF'}</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center py-4">
        {!isInBattle ? (
          <Lobby
            onJoinRoom={handleJoinRoom}
            onStartMatch={handleStartMatch}
            gameState={gameState}
            currentPlayerId={currentPlayerId}
            errorMessage={errorMessage}
          />
        ) : (
          <BattleArena
            gameState={gameState}
            currentPlayerId={currentPlayerId}
            onCastSpell={handleCastSpell}
            onRematch={handleRematch}
            onLeaveRoom={handleLeaveRoom}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto text-center py-4 border-t border-slate-900 text-xs text-slate-600">
        ChatBattle PvP • Cloudflare Worker & PartySocket Stateful Rooms • Tipeo con Mayúsculas, Minúsculas y Alternado
      </footer>
    </div>
  );
}

export default App;
