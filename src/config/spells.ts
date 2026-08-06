import type { SpellDefinition, SpellId, CaseModifierType } from '../types/game';

export const SPELLS: Record<SpellId, SpellDefinition> = {
  FIREBALL: {
    id: 'FIREBALL',
    name: 'Bola de Fuego',
    shortCode: 'frbl',
    element: 'fire',
    baseDamage: 25,
    baseHeal: 0,
    cooldownMs: 3000,
    description: 'Aplica daño de fuego devastador.',
    icon: '🔥',
    incantation: 'FIREBALL'
  },
  LIGHTNING: {
    id: 'LIGHTNING',
    name: 'Rayo Arcano',
    shortCode: 'ryo',
    element: 'lightning',
    baseDamage: 20,
    baseHeal: 0,
    cooldownMs: 2500,
    description: 'Rayo veloz que puede distorsionar la consola rival.',
    icon: '⚡',
    incantation: 'LIGHTNING'
  },
  HEAL: {
    id: 'HEAL',
    name: 'Curación Sagrada',
    shortCode: 'cura',
    element: 'holy',
    baseDamage: 0,
    baseHeal: 25,
    cooldownMs: 4500,
    description: 'Restaura vida del invocador.',
    icon: '✨',
    incantation: 'HEAL'
  },
  FREEZE: {
    id: 'FREEZE',
    name: 'Congelación',
    shortCode: 'hielo',
    element: 'ice',
    baseDamage: 12,
    baseHeal: 0,
    cooldownMs: 6000,
    description: 'Daño moderado y congela la caja de texto rival por 1.5s.',
    icon: '❄️',
    incantation: 'FREEZE'
  },
  PROTEGO: {
    id: 'PROTEGO',
    name: 'Escudo Protego',
    shortCode: 'prtg',
    element: 'arcane',
    baseDamage: 0,
    baseHeal: 0,
    cooldownMs: 4000,
    description: 'Otorga +30 de Escudo protector.',
    icon: '🛡️',
    incantation: 'PROTEGO'
  },
  METEOR: {
    id: 'METEOR',
    name: 'Lluvia de Meteoros',
    shortCode: 'mtr',
    element: 'fire',
    baseDamage: 45,
    baseHeal: 0,
    cooldownMs: 9000,
    description: 'Hechizo supremo de gran daño pero cooldown extenso.',
    icon: '☄️',
    incantation: 'METEOR'
  },
  DISPEL: {
    id: 'DISPEL',
    name: 'Disipar Magia',
    shortCode: 'dsp',
    element: 'arcane',
    baseDamage: 10,
    baseHeal: 0,
    cooldownMs: 5000,
    description: 'Disipa efectos negativos y remueve el escudo rival.',
    icon: '🌀',
    incantation: 'DISPEL'
  }
};

/**
 * Analyzes the typed raw input text against the spell definition to determine the Case Modifier.
 */
export function analyzeTypingModifier(
  rawText: string,
  spell: SpellDefinition
): {
  caseType: CaseModifierType;
  modifierMultiplier: number;
  fizzleChance: number;
  critChance: number;
  recoilChance: number;
} {
  const trimmed = rawText.trim();
  const incantation = spell.incantation;
  const shortCode = spell.shortCode;

  // Check if user used shortened version
  if (trimmed.toLowerCase() === shortCode.toLowerCase()) {
    return {
      caseType: 'SHORTENED',
      modifierMultiplier: 1.2,
      fizzleChance: 0.8, // 80% chance of failing!
      critChance: 0.0,
      recoilChance: 0.0
    };
  }

  // Check if user typed full incantation
  if (trimmed.toLowerCase() === incantation.toLowerCase()) {
    // Check if ALL UPPERCASE
    if (trimmed === incantation.toUpperCase()) {
      return {
        caseType: 'UPPERCASE',
        modifierMultiplier: 1.5, // +50% extra damage / power!
        fizzleChance: 0.0,
        critChance: 0.0,
        recoilChance: 0.0
      };
    }

    // Check if ALL LOWERCASE
    if (trimmed === incantation.toLowerCase()) {
      return {
        caseType: 'LOWERCASE',
        modifierMultiplier: 0.85, // Weaker cast, but 20% faster cooldown
        fizzleChance: 0.0,
        critChance: 0.0,
        recoilChance: 0.0
      };
    }

    // Check if ALTERNATING CASE (e.g. fIrEbAlL or FiReBaLl)
    let isAlternating = true;
    for (let i = 1; i < trimmed.length; i++) {
      const isPrevUpper = trimmed[i - 1] === trimmed[i - 1].toUpperCase();
      const isCurrUpper = trimmed[i] === trimmed[i].toUpperCase();
      if (isPrevUpper === isCurrUpper) {
        isAlternating = false;
        break;
      }
    }

    if (isAlternating) {
      return {
        caseType: 'ALTERNATING',
        modifierMultiplier: 1.0,
        fizzleChance: 0.0,
        critChance: 0.5, // 50% chance of double damage
        recoilChance: 0.5 // 50% chance of recoil
      };
    }

    return {
      caseType: 'NORMAL',
      modifierMultiplier: 1.0,
      fizzleChance: 0.0,
      critChance: 0.0,
      recoilChance: 0.0
    };
  }

  // If case didn't match spell exact name or shortcode, minor fizzle/typo
  return {
    caseType: 'NORMAL',
    modifierMultiplier: 0.8,
    fizzleChance: 0.4,
    critChance: 0.0,
    recoilChance: 0.0
  };
}
