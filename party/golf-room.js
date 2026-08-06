// @ts-nocheck
/**
 * Cloudflare Worker / PartyKit Durable Object for ChatBattle
 * Located at party/golf-room.js in golfjstp.workers.dev
 */

import { SPELLS, analyzeTypingModifier } from '../src/config/spells.js';

export default class GolfRoom {
  constructor(room) {
    this.room = room;
    this.state = {
      roomCode: '',
      status: 'LOBBY',
      players: {},
      winnerId: null,
      logs: [],
      startTime: null
    };
  }

  onConnect(conn, ctx) {
    // Send current initial room state to newly connected client
    conn.send(JSON.stringify({
      type: 'ROOM_STATE',
      state: this.state,
      yourPlayerId: conn.id
    }));
  }

  onRequest(req) {
    return new Response("ChatBattle GolfRoom Durable Object active");
  }

  onMessage(messageString, sender) {
    try {
      const data = JSON.parse(messageString);

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
      sender.send(JSON.stringify({ type: 'ERROR', message: 'Formato de mensaje inválido' }));
    }
  }

  onClose(conn) {
    if (this.state.players[conn.id]) {
      this.handleLeaveRoom(conn);
    }
  }

  handleLeaveRoom(sender) {
    const leavingPlayer = this.state.players[sender.id];
    if (!leavingPlayer) return;

    const name = leavingPlayer.name;
    delete this.state.players[sender.id];

    // Reset room state to LOBBY if someone leaves
    this.state.status = 'LOBBY';
    this.state.winnerId = null;

    // Promote remaining player to host if necessary
    const remainingIds = Object.keys(this.state.players);
    if (remainingIds.length > 0) {
      this.state.players[remainingIds[0]].isHost = true;
      this.state.logs = [{
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
      this.state.logs = [];
    }

    this.broadcastState();
  }

  handleJoinRoom(conn, { roomCode, playerName, avatar }) {
    this.state.roomCode = roomCode || this.room.id;
    const playerIds = Object.keys(this.state.players);

    // Maximum 2 players in PvP room
    if (playerIds.length >= 2 && !this.state.players[conn.id]) {
      conn.send(JSON.stringify({ type: 'ERROR', message: 'La sala ya está llena (2/2 jugadores)' }));
      return;
    }

    const isHost = playerIds.length === 0;

    this.state.players[conn.id] = {
      id: conn.id,
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

    if (Object.keys(this.state.players).length === 2 && this.state.status === 'LOBBY') {
      this.state.status = 'READY';
    }

    this.broadcastState();
  }

  handleStartMatch(sender) {
    const player = this.state.players[sender.id];
    if (!player || !player.isHost) return;

    if (Object.keys(this.state.players).length < 2) {
      sender.send(JSON.stringify({ type: 'ERROR', message: 'Se necesitan 2 jugadores para iniciar.' }));
      return;
    }

    this.state.status = 'PLAYING';
    this.state.winnerId = null;
    this.state.startTime = Date.now();
    this.state.logs = [{
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
    if (this.state.status !== 'PLAYING') return;

    const caster = this.state.players[sender.id];
    if (!caster) return;

    const now = Date.now();

    // Check freeze status effect
    if (caster.statusEffects.frozenUntil > now) {
      sender.send(JSON.stringify({ type: 'ERROR', message: '¡Estás congelado! Espera a descongelarte.' }));
      return;
    }

    const spell = SPELLS[spellId];
    if (!spell) return;

    // Check Cooldown
    if (caster.cooldowns[spellId] > now) {
      const waitSec = ((caster.cooldowns[spellId] - now) / 1000).toFixed(1);
      sender.send(JSON.stringify({ type: 'ERROR', message: `Hechizo en recarga (${waitSec}s)` }));
      return;
    }

    // Identify Opponent
    const opponentId = Object.keys(this.state.players).find(id => id !== sender.id);
    const opponent = opponentId ? this.state.players[opponentId] : null;

    // Analyze typing modifier (UPPERCASE, LOWERCASE, ALTERNATING, SHORTENED)
    const analysis = analyzeTypingModifier(rawText, spell);
    let finalDamage = Math.round(spell.baseDamage * analysis.modifierMultiplier);
    let finalHeal = Math.round(spell.baseHeal * analysis.modifierMultiplier);
    let resultType = 'NORMAL';
    let logMsg = '';

    // Handle CAPS OVERLOAD check
    if (analysis.caseType === 'UPPERCASE') {
      if (caster.capsCharges > 0) {
        caster.capsCharges -= 1;
        resultType = 'SUPER_CAST';
        logMsg = `¡PODER MAYÚSCULA! ${caster.name} desata ${spell.name} con +50% de daño extra.`;
      } else {
        // No charges left -> penalty
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
        // Recoil self-damage
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

    // Set cooldown duration
    let cdDuration = spell.cooldownMs;
    if (analysis.caseType === 'LOWERCASE') cdDuration = Math.round(cdDuration * 0.8);
    caster.cooldowns[spellId] = now + cdDuration;

    // Apply Damage / Effects to Opponent
    if (opponent && finalDamage > 0) {
      // Check opponent shield
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

      // Freeze status
      if (spell.id === 'FREEZE' && resultType !== 'FIZZLE') {
        opponent.statusEffects.frozenUntil = now + 1500;
        logMsg += ` ¡${opponent.name} ha sido congelado por 1.5s!`;
      }

      // Dispel
      if (spell.id === 'DISPEL') {
        opponent.shield = 0;
      }
    }

    // Apply Healing & Shields to Self
    if (finalHeal > 0) {
      caster.hp = Math.min(caster.maxHp, caster.hp + finalHeal);
    }
    if (spell.id === 'PROTEGO' && resultType !== 'FIZZLE') {
      caster.shield += 30;
      logMsg = `${caster.name} levanta un Escudo Protego (+30 absorción).`;
    }

    // Log entry
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

    this.state.logs.unshift(entry);
    if (this.state.logs.length > 35) this.state.logs.pop();

    // Check Win Condition
    if (opponent && opponent.hp <= 0) {
      this.state.status = 'FINISHED';
      this.state.winnerId = caster.id;
      this.state.logs.unshift({
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
    if (Object.keys(this.state.players).length < 2) {
      sender.send(JSON.stringify({ type: 'ERROR', message: 'No se puede iniciar la revancha porque el oponente abandonó la sala.' }));
      this.state.status = 'LOBBY';
      this.broadcastState();
      return;
    }

    // Reset HP & status for new game
    Object.values(this.state.players).forEach(p => {
      p.hp = 100;
      p.shield = 0;
      p.capsCharges = 3;
      p.statusEffects = { frozenUntil: 0, poisonedUntil: 0, silencedUntil: 0 };
      p.cooldowns = { FIREBALL: 0, LIGHTNING: 0, HEAL: 0, FREEZE: 0, PROTEGO: 0, METEOR: 0, DISPEL: 0 };
    });
    this.state.status = 'PLAYING';
    this.state.winnerId = null;
    this.state.startTime = Date.now();
    this.state.logs = [{
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
    this.room.broadcast(JSON.stringify({
      type: 'ROOM_STATE',
      state: this.state
    }));
  }
}
