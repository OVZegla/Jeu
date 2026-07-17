// Équipe V2 — état persistant des héros (hors combat) + fabrique de
// combattants pour le moteur. Les stats de base viennent de balance.ts,
// la croissance par niveau de BALANCE2.levelGrowth.

import type { HeroCombatant } from '../game/combat/types';
import { BALANCE, BALANCE2 } from '../game/balance';

export interface HeroState {
  heroId: string;
  level: number;
  xp: number;
  hp: number;       // PV courants (persistés entre les combats)
  mp: number;
}

export interface HeroDef {
  heroId: string;
  name: string;
  className: string;
  description: string;
  skillIds: string[];
  spriteKey: string;
  icon: string;
  color: string;
}

export const HERO_DEFS: Record<string, HeroDef> = {
  datpaloof: {
    heroId: 'datpaloof',
    name: 'Datpaloof',
    className: 'Paladin elfe de sang',
    description: 'Paladin blond à l\'armure rouge. Lumière, protection et justice flamboyante.',
    skillIds: ['jugement', 'garde', 'bouclierDivin', 'soinsRapides', 'consecration'],
    spriteKey: 'sprite-datpaloof',
    icon: '🛡️',
    color: '#c0392b',
  },
  baghaar: {
    heroId: 'baghaar',
    name: 'Baghaar',
    className: 'Chaman occultiste Mag\'har',
    description: 'Orc à peau brune, totems et magie sombre. Spiritualité ancestrale et occultisme.',
    skillIds: ['dechargeOcculte', 'garde', 'totemDeSoin', 'chaineDEclairs', 'soinInterdit'],
    spriteKey: 'sprite-baghaar',
    icon: '🌀',
    color: '#27ae60',
  },
  zlatax: {
    heroId: 'zlatax',
    name: 'Zlatax',
    className: 'Chasseur de démons',
    description: 'Combattant agile à l\'énergie démoniaque instable. Armes doubles, pactes dangereux.',
    skillIds: ['entailleInfernale', 'garde', 'pacteInstable', 'rueeDemoniaque', 'marqueDuTraque'],
    spriteKey: 'sprite-zlatax',
    icon: '🗡️',
    color: '#8e44ad',
  },
};

export const PARTY_ORDER = ['datpaloof', 'baghaar', 'zlatax'];

// Multiplicateur de croissance cumulé pour un niveau donné
function growth(mult: number, level: number): number {
  return Math.pow(1 + mult, level - 1);
}

export interface HeroComputedStats {
  maxHp: number;
  maxMp: number;
  mpRegen: number;
  defense: number;
  physicalPower: number;
  magicPower: number;
  speed: number;
}

export function computeHeroStats(heroId: string, level: number): HeroComputedStats {
  const base = BALANCE.characters[heroId as keyof typeof BALANCE.characters];
  const g = BALANCE2.levelGrowth;
  return {
    maxHp: Math.round(base.maxHp * growth(g.hp, level)),
    maxMp: Math.round(base.maxMp * growth(g.mp, level)),
    mpRegen: base.mpRegen,
    defense: base.defense,
    physicalPower: base.physicalPower * growth(g.power, level),
    magicPower: base.magicPower * growth(g.power, level),
    speed: BALANCE2.heroSpeeds[heroId as keyof typeof BALANCE2.heroSpeeds],
  };
}

export function createInitialHeroStates(): HeroState[] {
  return PARTY_ORDER.map((heroId) => {
    const s = computeHeroStats(heroId, 1);
    return { heroId, level: 1, xp: 0, hp: s.maxHp, mp: s.maxMp };
  });
}

// Fabrique un combattant à partir de l'état persistant
export function heroCombatantFrom(state: HeroState): HeroCombatant {
  const def = HERO_DEFS[state.heroId];
  const stats = computeHeroStats(state.heroId, state.level);
  return {
    kind: 'hero',
    id: state.heroId,
    heroId: state.heroId,
    name: def.name,
    className: def.className,
    level: state.level,
    maxHp: stats.maxHp,
    hp: Math.min(state.hp, stats.maxHp),
    maxMp: stats.maxMp,
    mp: Math.min(state.mp, stats.maxMp),
    mpRegen: stats.mpRegen,
    defense: stats.defense,
    physicalPower: stats.physicalPower,
    magicPower: stats.magicPower,
    speed: stats.speed,
    affinities: { weaknesses: [], resistances: [] },
    skillIds: def.skillIds,
    cooldowns: {},
    status: [],
    alive: state.hp > 0,
    spriteKey: def.spriteKey,
    icon: def.icon,
    color: def.color,
  };
}

// L'élément « magique » de chaque héros (pour computeDamage)
export const HERO_USES_MAGIC: Record<string, boolean> = {
  datpaloof: true,
  baghaar: true,
  zlatax: false,
};
