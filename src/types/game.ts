export type SpellId = 'FIREBALL' | 'LIGHTNING' | 'HEAL' | 'FREEZE' | 'PROTEGO' | 'METEOR' | 'DISPEL';

export type CaseModifierType = 'UPPERCASE' | 'LOWERCASE' | 'ALTERNATING' | 'SHORTENED' | 'NORMAL';

export interface SpellDefinition {
  id: SpellId;
  name: string;
  shortCode: string;
  element: 'fire' | 'lightning' | 'holy' | 'ice' | 'arcane';
  baseDamage: number;
  baseHeal: number;
  cooldownMs: number;
  description: string;
  icon: string;
  incantation: string;
}

export interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  hp: number;
  maxHp: number;
  shield: number;
  capsCharges: number;
  maxCapsCharges: number;
  statusEffects: {
    frozenUntil: number;
    poisonedUntil: number;
    silencedUntil: number;
  };
  cooldowns: Record<SpellId, number>; // SpellId -> timestamp when available
}

export type GameStatus = 'LOBBY' | 'READY' | 'PLAYING' | 'FINISHED';

export interface GameState {
  roomCode: string;
  status: GameStatus;
  players: Record<string, PlayerState>; // playerId -> PlayerState
  winnerId: string | null;
  logs: BattleLogEntry[];
  startTime: number | null;
}

export interface BattleLogEntry {
  id: string;
  timestamp: number;
  casterId: string;
  casterName: string;
  spellName: string;
  rawTyped: string;
  caseType: CaseModifierType;
  resultType: 'CRIT' | 'SUPER_CAST' | 'NORMAL' | 'WEAK' | 'FIZZLE' | 'RECOIL' | 'SHIELD_BLOCK';
  damage: number;
  heal: number;
  message: string;
}

// WebSocket Message Packets (PartySocket format)
export type ClientPacket =
  | { type: 'JOIN_ROOM'; roomCode: string; playerName: string; avatar: string; playerId?: string }
  | { type: 'START_MATCH' }
  | { type: 'CAST_SPELL'; rawText: string; spellId: SpellId }
  | { type: 'REMATCH' }
  | { type: 'LEAVE_ROOM' };

export type ServerPacket =
  | { type: 'ROOM_STATE'; state: GameState; yourPlayerId: string }
  | { type: 'PLAYER_JOINED'; player: PlayerState }
  | { type: 'SPELL_CAST_RESULT'; entry: BattleLogEntry; state: GameState }
  | { type: 'GAME_OVER'; winnerId: string; winnerName: string }
  | { type: 'ERROR'; message: string };
