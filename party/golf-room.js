// @ts-nocheck
/**
 * Cloudflare Worker & Durable Object for ChatBattle (golf-js-party)
 */

import { SPELLS, analyzeTypingModifier } from '../src/config/spells.js';

export class GolfRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map(); // socket -> connection metadata

    // Active room state
    this.roomState = {
      roomCode: '',
      status: 'LOBBY',
      players: {},
      winnerId: null,
      logs: [],
      startTime: null
    };

    // For local mock compatibility
    if (state && state.id) {
      this.roomState.roomCode = state.id;
      this.room = state;
    }
  }

  // Cloudflare WebSocket upgrade handler
  async fetch(request) {
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const roomCode = (parts[parts.length - 1] || 'DEFAULT').toUpperCase();
    this.roomState.roomCode = roomCode;

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    server.accept();

    // Assign unique session ID to connection
    const connId = 'player_' + Math.random().toString(36).substring(2, 9);
    server.connId = connId;
    this.sessions.set(server, { id: connId });

    server.addEventListener('message', (event) => {
      this.onMessage(event.data, server);
    });

    server.addEventListener('close', () => {
      this.onClose(server);
      this.sessions.delete(server);
    });

    // Send initial room state to newly connected client
    server.send(JSON.stringify({
      type: 'ROOM_STATE',
      state: this.roomState,
      yourPlayerId: connId
    }));

    return new Response(null, { status: 101, webSocket: client });
  }

  // Getter for room state compatibility
  get stateData() {
    return this.roomState;
  }
  set stateData(val) {
    this.roomState = val;
  }

  // Backward compatibility alias
  get state() {
    return this.roomState;
  }
  set state(val) {
    this.roomState = val;
  }

  onMessage(messageString, sender) {
    try {
      const data = JSON.parse(messageString);
      const senderId = sender.connId || sender.id;

      switch (data.type) {
        case 'JOIN_ROOM':
          this.handleJoinRoom(sender, data);
          break;

        case 'START_MATCH':
          this.handleStartMatch(sender);
          break;

        case 'CAST_SPELL':
          this.handleCastSpell(sender, data);
          break;

        case 'REMATCH':
          this.handleRematch(sender);
          break;

        case 'LEAVE_ROOM':
          this.handleLeaveRoom(sender);
          break;
      }
    } catch (err) {
      if (sender && typeof sender.send === 'function') {
        sender.send(JSON.stringify({ type: 'ERROR', message: 'Formato de mensaje inválido' }));
      }
    }
  }

  onClose(sender) {
    const senderId = sender.connId || sender.id;
    if (senderId && this.roomState.players[senderId]) {
      this.handleLeaveRoom(sender);
    }
  }

  handleLeaveRoom(sender) {
    const senderId = sender.connId || sender.id;
    const leavingPlayer = this.roomState.players[senderId];
    if (!leavingPlayer) return;

    const name = leavingPlayer.name;
    delete this.roomState.players[senderId];

    this.roomState.status = 'LOBBY';
    this.roomState.winnerId = null;

    const remainingIds = Object.keys(this.roomState.players);
    if (remainingIds.length > 0) {
      this.roomState.players[remainingIds[0]].isHost = true;
      this.roomState.logs = [{
        id: Math.random().toString(),
        timestamp: Date.now(),
        casterId: 'SYSTEM',
        casterName: 'SISTEMA',
        spellName: 'ABANDONO',
        rawTyped: '',
        caseType: 'NORMAL',
        resultType: 'NORMAL',
        damage: 0,
        heal: 0,
        message: `⚠️ ${name} ha abandonado la sala. La partida ha finalizado.`
      }];
    } else {
      this.roomState.logs = [];
    }

    this.broadcastState();
  }

  handleJoinRoom(conn, { roomCode, playerName, avatar, playerId }) {
    const senderId = playerId || conn.connId || conn.id;
    conn.connId = senderId;
    this.roomState.roomCode = roomCode || this.roomState.roomCode || 'DEFAULT';

    if (this.roomState.status === 'FINISHED') {
      this.roomState.players = {};
      this.roomState.status = 'LOBBY';
      this.roomState.winnerId = null;
      this.roomState.logs = [];
    }

    const currentPlayers = Object.keys(this.roomState.players);

    if (currentPlayers.length >= 2 && !this.roomState.players[senderId]) {
      if (typeof conn.send === 'function') {
        conn.send(JSON.stringify({ type: 'ERROR', message: 'La sala ya está llena (2/2 jugadores)' }));
      }
      return;
    }

    const isHost = currentPlayers.length === 0;

    this.roomState.players[senderId] = {
      id: senderId,
      name: playerName || (isHost ? 'Mago Líder' : 'Desafiante'),
      avatar: avatar || (isHost ? '🧙‍♂️' : '🧙‍♀️'),
      isHost,
      hp: 100,
      maxHp: 100,
      shield: 0,
      capsCharges: 3,
      maxCapsCharges: 3,
      statusEffects: { frozenUntil: 0, poisonedUntil: 0, silencedUntil: 0 },
      cooldowns: { FIREBALL: 0, LIGHTNING: 0, HEAL: 0, FREEZE: 0, PROTEGO: 0, METEOR: 0, DISPEL: 0 }
    };

    if (Object.keys(this.roomState.players).length === 2 && this.roomState.status === 'LOBBY') {
      this.roomState.status = 'READY';
    }

    this.broadcastState();
  }

  handleStartMatch(sender) {
    const senderId = sender.connId || sender.id;
    const player = this.roomState.players[senderId];
    if (!player || !player.isHost) return;

    if (Object.keys(this.roomState.players).length < 2) {
      if (typeof sender.send === 'function') {
        sender.send(JSON.stringify({ type: 'ERROR', message: 'Se necesitan 2 jugadores para iniciar.' }));
      }
      return;
    }

    this.roomState.status = 'PLAYING';
    this.roomState.winnerId = null;
    this.roomState.startTime = Date.now();
    this.roomState.logs = [{
      id: Math.random().toString(),
      timestamp: Date.now(),
      casterId: 'SYSTEM',
      casterName: 'ÁRBITRO ARCANO',
      spellName: '¡DUELO INICIADO!',
      rawTyped: '¡Escribe tus hechizos rápido!',
      caseType: 'NORMAL',
      resultType: 'NORMAL',
      damage: 0,
      heal: 0,
      message: '¡La batalla de tipeo ha comenzado! Tipea tus hechizos en la consola.'
    }];

    this.broadcastState();
  }

  handleCastSpell(sender, { rawText, spellId }) {
    if (this.roomState.status !== 'PLAYING') return;

    const senderId = sender.connId || sender.id;
    const caster = this.roomState.players[senderId];
    if (!caster) return;

    const now = Date.now();
    const spell = SPELLS[spellId];
    if (!spell) return;

    if (caster.cooldowns[spellId] > now) {
      const waitSec = ((caster.cooldowns[spellId] - now) / 1000).toFixed(1);
      if (typeof sender.send === 'function') {
        sender.send(JSON.stringify({ type: 'ERROR', message: `Hechizo en recarga (${waitSec}s)` }));
      }
      return;
    }

    const opponentId = Object.keys(this.roomState.players).find(id => id !== senderId);
    const opponent = opponentId ? this.roomState.players[opponentId] : null;

    const analysis = analyzeTypingModifier(rawText, spell);
    let finalDamage = Math.round(spell.baseDamage * analysis.modifierMultiplier);
    let finalHeal = Math.round(spell.baseHeal * analysis.modifierMultiplier);
    let resultType = 'NORMAL';
    let logMsg = '';

    if (analysis.caseType === 'UPPERCASE') {
      if (caster.capsCharges > 0) {
        caster.capsCharges -= 1;
        resultType = 'SUPER_CAST';
        logMsg = `¡PODER MAYÚSCULA! ${caster.name} desata ${spell.name} con +50% de daño extra.`;
      } else {
        finalDamage = Math.round(finalDamage * 0.5);
        resultType = 'WEAK';
        logMsg = `${caster.name} intentó un hechizo MAYÚSCULA sin cargas acumuladas (efecto reducido).`;
      }
    } else if (analysis.caseType === 'LOWERCASE') {
      resultType = 'WEAK';
      logMsg = `${caster.name} lanza un ${spell.name} minúsculo y ligero.`;
    } else if (analysis.caseType === 'ALTERNATING') {
      const isCrit = Math.random() < analysis.critChance;
      if (isCrit) {
        finalDamage = finalDamage * 2;
        resultType = 'CRIT';
        logMsg = `🎲 ¡CAOS TOTAL! ${caster.name} tipea alternando y logra CRÍTICO x2.`;
      } else {
        const recoil = 12;
        caster.hp = Math.max(0, caster.hp - recoil);
        resultType = 'RECOIL';
        logMsg = `💥 ¡RECULAR ARCANO! El tipeo alternado de ${caster.name} falló y sufrió ${recoil} de daño propio.`;
        finalDamage = 0;
      }
    } else if (analysis.caseType === 'SHORTENED') {
      const isFizzle = Math.random() < analysis.fizzleChance;
      if (isFizzle) {
        resultType = 'FIZZLE';
        finalDamage = 0;
        finalHeal = 0;
        logMsg = `💨 ¡CHISPAZO FALLIDO! ${caster.name} intentó acortar el hechizo y le salió mal (80% chance).`;
      } else {
        resultType = 'SUPER_CAST';
        finalDamage = Math.round(finalDamage * 1.3);
        logMsg = `⚡ ¡TIRE RÁPIDO! ${caster.name} acortó la invocación con éxito.`;
      }
    }

    let cdDuration = spell.cooldownMs;
    if (analysis.caseType === 'LOWERCASE') cdDuration = Math.round(cdDuration * 0.8);
    caster.cooldowns[spellId] = now + cdDuration;

    if (opponent && finalDamage > 0) {
      if (opponent.shield > 0) {
        if (opponent.shield >= finalDamage) {
          opponent.shield -= finalDamage;
          logMsg += ` (Escudo absorbió ${finalDamage} de daño)`;
        } else {
          const remaining = finalDamage - opponent.shield;
          logMsg += ` (Escudo absorbió ${opponent.shield} de daño)`;
          opponent.shield = 0;
          opponent.hp = Math.max(0, opponent.hp - remaining);
        }
      } else {
        opponent.hp = Math.max(0, opponent.hp - finalDamage);
      }

      if (spell.id === 'FREEZE' && resultType !== 'FIZZLE') {
        opponent.statusEffects.frozenUntil = now + 2500;
        logMsg += ` ¡${opponent.name} ha recibido un congelamiento visual!`;
      }

      if (spell.id === 'DISPEL') {
        opponent.shield = 0;
      }
    }

    if (finalHeal > 0) {
      caster.hp = Math.min(caster.maxHp, caster.hp + finalHeal);
    }
    if (spell.id === 'PROTEGO' && resultType !== 'FIZZLE') {
      caster.shield += 30;
      logMsg = `${caster.name} levanta un Escudo Protego (+30 absorción).`;
    }

    const entry = {
      id: Math.random().toString(),
      timestamp: now,
      casterId: caster.id,
      casterName: caster.name,
      spellName: spell.name,
      rawTyped: rawText,
      caseType: analysis.caseType,
      resultType,
      damage: finalDamage,
      heal: finalHeal,
      message: logMsg
    };

    this.roomState.logs.unshift(entry);
    if (this.roomState.logs.length > 35) this.roomState.logs.pop();

    if (opponent && opponent.hp <= 0) {
      this.roomState.status = 'FINISHED';
      this.roomState.winnerId = caster.id;
      this.roomState.logs.unshift({
        id: Math.random().toString(),
        timestamp: now,
        casterId: 'SYSTEM',
        casterName: 'SISTEMA',
        spellName: 'VICTORIA',
        rawTyped: '',
        caseType: 'NORMAL',
        resultType: 'NORMAL',
        damage: 0,
        heal: 0,
        message: `🏆 ¡${caster.name} ha derrotado a ${opponent.name} y ganado el duelo!`
      });
    }

    this.broadcastState();
  }

  handleRematch(sender) {
    if (Object.keys(this.roomState.players).length < 2) {
      if (typeof sender.send === 'function') {
        sender.send(JSON.stringify({ type: 'ERROR', message: 'No se puede iniciar la revancha porque el oponente abandonó la sala.' }));
      }
      this.roomState.status = 'LOBBY';
      this.broadcastState();
      return;
    }

    Object.values(this.roomState.players).forEach(p => {
      p.hp = 100;
      p.shield = 0;
      p.capsCharges = 3;
      p.statusEffects = { frozenUntil: 0, poisonedUntil: 0, silencedUntil: 0 };
      p.cooldowns = { FIREBALL: 0, LIGHTNING: 0, HEAL: 0, FREEZE: 0, PROTEGO: 0, METEOR: 0, DISPEL: 0 };
    });
    this.roomState.status = 'PLAYING';
    this.roomState.winnerId = null;
    this.roomState.startTime = Date.now();
    this.roomState.logs = [{
      id: Math.random().toString(),
      timestamp: Date.now(),
      casterId: 'SYSTEM',
      casterName: 'ÁRBITRO ARCANO',
      spellName: '¡REVANCHA INICIADA!',
      rawTyped: '',
      caseType: 'NORMAL',
      resultType: 'NORMAL',
      damage: 0,
      heal: 0,
      message: '¡La revancha ha comenzado! Que los mejores dedos triunfen.'
    }];

    this.broadcastState();
  }

  broadcastState() {
    const payload = JSON.stringify({
      type: 'ROOM_STATE',
      state: this.roomState
    });

    // Broadcast across Cloudflare Durable Object WebSocket sessions
    for (const [session] of this.sessions) {
      try {
        session.send(payload);
      } catch (e) {}
    }

    // Broadcast across local mock room if present
    if (this.room && typeof this.room.broadcast === 'function') {
      this.room.broadcast(payload);
    }
  }
}

// Cloudflare Worker Default Entry Point (fetch handler)
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const roomCode = (parts[parts.length - 1] || 'DEFAULT').toUpperCase();

    if (!env.GOLF_ROOM) {
      return new Response("Configuración Durable Object GOLF_ROOM no encontrada", { status: 500 });
    }

    const id = env.GOLF_ROOM.idFromName(roomCode);
    const roomObject = env.GOLF_ROOM.get(id);

    return roomObject.fetch(request);
  }
};
