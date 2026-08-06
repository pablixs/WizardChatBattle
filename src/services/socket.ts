import PartySocket from 'partysocket';
import type { ClientPacket, ServerPacket, GameState } from '../types/game';
// @ts-ignore
import GolfRoom from '../../party/golf-room';

export type MessageHandler = (packet: ServerPacket) => void;

class SocketService {
  private socket: PartySocket | null = null;
  private localChannel: BroadcastChannel | null = null;
  private messageListeners: Set<MessageHandler> = new Set();
  private isLocalMode: boolean = false;
  private playerId: string = '';
  private currentRoomCode: string = '';
  private pendingPackets: ClientPacket[] = [];

  constructor() {
    // Generate 100% unique client ID per tab instance (never copy from sessionStorage)
    this.playerId = 'player_' + Math.random().toString(36).substring(2, 9) + '_' + Math.floor(Math.random() * 1000);
  }

  getPlayerId(): string {
    return this.playerId;
  }

  connect(roomCode: string, serverUrl?: string, useLocalFallback: boolean = false) {
    this.disconnect();
    this.currentRoomCode = roomCode.toUpperCase();
    this.isLocalMode = useLocalFallback;
    this.pendingPackets = [];

    if (useLocalFallback) {
      this.initLocalMode(this.currentRoomCode);
      return;
    }

    // PartySocket Cloudflare Durable Object endpoint
    const host = serverUrl || import.meta.env.VITE_PARTY_HOST || 'golf-js-party.golfjstp.workers.dev';

    try {
      this.socket = new PartySocket({
        host: host,
        room: this.currentRoomCode.toLowerCase(),
        party: 'main'
      });

      this.socket.addEventListener('message', (event) => {
        try {
          const packet: ServerPacket = JSON.parse(event.data);
          this.notifyListeners(packet);
        } catch (err) {
          console.error('Error parseando paquete PartySocket', err);
        }
      });

      this.socket.addEventListener('open', () => {
        console.log(`⚡ Conectado a Cloudflare Durable Object: ${this.currentRoomCode}`);
        while (this.pendingPackets.length > 0) {
          const packet = this.pendingPackets.shift();
          if (packet && this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(packet));
          }
        }
      });

      this.socket.addEventListener('error', (err) => {
        console.warn('Error de conexión WebSocket PartySocket:', err);
        this.notifyListeners({
          type: 'ERROR',
          message: `No se pudo conectar al servidor de Cloudflare (${host}). Verifica el host o activa el Modo Local.`
        });
      });
    } catch (e) {
      console.warn('Fallo al inicializar PartySocket:', e);
      this.notifyListeners({
        type: 'ERROR',
        message: 'Fallo al inicializar la conexión WebSocket.'
      });
    }
  }

  /**
   * Authoritative local tab-to-tab room synchronization across browser tabs
   */
  private initLocalMode(roomCode: string) {
    this.isLocalMode = true;
    const channelName = `chatbattle_channel_${roomCode}`;
    this.localChannel = new BroadcastChannel(channelName);

    // Listen to broadcasts from other tabs
    this.localChannel.onmessage = (event) => {
      try {
        const packet: ServerPacket = JSON.parse(event.data);
        this.notifyListeners(packet);
      } catch (e) {}
    };

    // Inspect existing localStorage state
    const storageKey = `chatbattle_state_${roomCode}`;
    const rawState = localStorage.getItem(storageKey);
    if (rawState) {
      try {
        const state: GameState = JSON.parse(rawState);
        // If room is stale (older than 60s or finished), clear it on new join
        const now = Date.now();
        const lastLogTime = state.logs[0]?.timestamp || 0;
        if (state.status === 'FINISHED' || (lastLogTime > 0 && now - lastLogTime > 60000)) {
          localStorage.removeItem(storageKey);
        } else {
          // Send current state immediately
          setTimeout(() => {
            this.notifyListeners({ type: 'ROOM_STATE', state, yourPlayerId: this.playerId });
          }, 10);
        }
      } catch (e) {
        localStorage.removeItem(storageKey);
      }
    }

    console.log(`🏠 Modo Local Tab-to-Tab activo en el canal: ${channelName} [ID: ${this.playerId}]`);
  }

  send(packet: ClientPacket) {
    if (this.isLocalMode) {
      this.processLocalPacket(packet);
    } else {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(packet));
      } else {
        this.pendingPackets.push(packet);
      }
    }
  }

  /**
   * Executes packet on local GolfRoom authoritative state & syncs across tabs
   */
  private processLocalPacket(packet: ClientPacket) {
    const roomCode = this.currentRoomCode;
    const storageKey = `chatbattle_state_${roomCode}`;

    let currentSavedState: GameState | null = null;
    const rawSaved = localStorage.getItem(storageKey);
    if (rawSaved) {
      try {
        currentSavedState = JSON.parse(rawSaved);
      } catch (e) {}
    }

    const mockRoom = {
      id: roomCode,
      broadcast: (msg: string) => {
        try {
          const p: ServerPacket = JSON.parse(msg);
          if (p.type === 'ROOM_STATE' || p.type === 'SPELL_CAST_RESULT') {
            localStorage.setItem(storageKey, JSON.stringify(p.state));
          }
          // Broadcast to all other tabs via BroadcastChannel
          if (this.localChannel) {
            this.localChannel.postMessage(msg);
          }
          // Notify local tab listeners immediately
          this.notifyListeners(p);
        } catch (e) {}
      }
    };

    const golfRoom = new GolfRoom(mockRoom);
    if (currentSavedState) {
      golfRoom.state = currentSavedState;
    }

    // Mock sender connection with unique player ID
    const senderConn = {
      id: this.playerId,
      send: (msg: string) => {
        try {
          const p: ServerPacket = JSON.parse(msg);
          this.notifyListeners(p);
        } catch (e) {}
      }
    };

    golfRoom.onMessage(JSON.stringify(packet), senderConn as unknown as WebSocket);
  }

  subscribe(handler: MessageHandler) {
    this.messageListeners.add(handler);
    return () => {
      this.messageListeners.delete(handler);
    };
  }

  private notifyListeners(packet: ServerPacket) {
    this.messageListeners.forEach((listener) => listener(packet));
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.localChannel) {
      this.localChannel.close();
      this.localChannel = null;
    }
  }
}

export const socketService = new SocketService();
