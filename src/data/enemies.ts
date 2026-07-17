// Ennemis V2 — data-driven. Ajouter un ennemi = une entrée EnemyDef ici
// (stats dans balance.ts → BALANCE2.enemies) + un groupe dans ENEMY_GROUPS.

import type { Element, EnemyAiKind, EnemyCombatant } from '../game/combat/types';
import { BALANCE2 } from '../game/balance';

export interface EnemyDef {
  enemyId: string;
  name: string;
  title?: string;
  maxHp: number;
  defense: number;
  power: number;
  speed: number;
  xpReward: number;
  weaknesses: Element[];
  resistances: Element[];
  skillIds: string[];
  spriteKey: string;
  icon: string;
  color: string;
  displayScale: number;
  isBoss?: boolean;
  ai?: EnemyAiKind;
}

const EB = BALANCE2.enemies;

export const ENEMY_DEFS: Record<string, EnemyDef> = {
  grimoire: {
    enemyId: 'grimoire',
    name: 'Grimoire éveillé',
    maxHp: EB.grimoire.maxHp,
    defense: EB.grimoire.defense,
    power: EB.grimoire.power,
    speed: EB.grimoire.speed,
    xpReward: EB.grimoire.xp,
    weaknesses: EB.grimoire.weaknesses as Element[],
    resistances: EB.grimoire.resistances as Element[],
    skillIds: ['coupDeTranche', 'paragrapheSoporifique'],
    spriteKey: 'enemy-grimoire',
    icon: '📖',
    color: '#a66bff',
    displayScale: 1.0,
  },
  decret: {
    enemyId: 'decret',
    name: 'Décret errant',
    maxHp: EB.decret.maxHp,
    defense: EB.decret.defense,
    power: EB.decret.power,
    speed: EB.decret.speed,
    xpReward: EB.decret.xp,
    weaknesses: EB.decret.weaknesses as Element[],
    resistances: EB.decret.resistances as Element[],
    skillIds: ['notificationRecommandee', 'coupureAdministrative'],
    spriteKey: 'enemy-decret',
    icon: '📜',
    color: '#ddccff',
    displayScale: 0.9,
  },
  grimoire2: {
    enemyId: 'grimoire2',
    name: 'Budget dévorant',
    title: 'Gardien de l\'aile est',
    maxHp: EB.grimoire2.maxHp,
    defense: EB.grimoire2.defense,
    power: EB.grimoire2.power,
    speed: EB.grimoire2.speed,
    xpReward: EB.grimoire2.xp,
    weaknesses: EB.grimoire2.weaknesses as Element[],
    resistances: EB.grimoire2.resistances as Element[],
    skillIds: ['ponctionBudgetaire', 'coupDeTranche', 'jurisprudenceEcrasante'],
    spriteKey: 'enemy-grimoire2',
    icon: '💰',
    color: '#ffb84d',
    displayScale: 1.35,
  },
  decret2: {
    enemyId: 'decret2',
    name: 'Arrêté vengeur',
    maxHp: EB.decret2.maxHp,
    defense: EB.decret2.defense,
    power: EB.decret2.power,
    speed: EB.decret2.speed,
    xpReward: EB.decret2.xp,
    weaknesses: EB.decret2.weaknesses as Element[],
    resistances: EB.decret2.resistances as Element[],
    skillIds: ['notificationRecommandee', 'jurisprudenceEcrasante'],
    spriteKey: 'enemy-decret2',
    icon: '📮',
    color: '#ff8899',
    displayScale: 1.0,
  },
  champion: {
    enemyId: 'champion',
    name: 'Le Champion des Collectivités Territoriales',
    title: 'Archiviste suprême, élu des dimensions oubliées',
    maxHp: BALANCE2.boss2.maxHp,
    defense: BALANCE2.boss2.defense,
    power: BALANCE2.boss2.power,
    speed: BALANCE2.boss2.speed,
    xpReward: BALANCE2.boss2.xp,
    weaknesses: BALANCE2.boss2.weaknesses as Element[],
    resistances: BALANCE2.boss2.resistances as Element[],
    skillIds: [
      'tamponReglementaire', 'appelDOffresMaudit', 'decretIncomprehensible',
      'reunionInterminable', 'subventionRefusee', 'pagesProtectrices', 'archivageDefinitif',
    ],
    spriteKey: 'sprite-boss',
    icon: '👁️‍🗨️',
    color: '#c44dff',
    displayScale: 1.8,
    isBoss: true,
    ai: 'boss-champion',
  },
  // Page protectrice : invoquée par le boss en phase 2 (grimoire affaibli)
  page: {
    enemyId: 'page',
    name: 'Page protectrice',
    maxHp: 90,
    defense: 0.05,
    power: 0.7,
    speed: 11,
    xpReward: 25,
    weaknesses: ['feu', 'sacre'],
    resistances: [],
    skillIds: ['coupureAdministrative'],
    spriteKey: 'enemy-decret',
    icon: '📄',
    color: '#eeddff',
    displayScale: 0.75,
  },
};

let uniqueCounter = 0;

export function instantiateEnemy(enemyId: string, suffix?: string): EnemyCombatant {
  const def = ENEMY_DEFS[enemyId];
  if (!def) throw new Error(`Ennemi inconnu : ${enemyId}`);
  uniqueCounter += 1;
  return {
    kind: 'enemy',
    id: `${enemyId}-${suffix ?? uniqueCounter}`,
    enemyId: def.enemyId,
    name: def.name,
    title: def.title,
    maxHp: def.maxHp,
    hp: def.maxHp,
    maxMp: 0,
    mp: 0,
    mpRegen: 0,
    defense: def.defense,
    physicalPower: def.power,
    magicPower: def.power,
    speed: def.speed,
    affinities: { weaknesses: def.weaknesses, resistances: def.resistances },
    skillIds: def.skillIds,
    cooldowns: {},
    status: [],
    alive: true,
    spriteKey: def.spriteKey,
    icon: def.icon,
    color: def.color,
    isBoss: def.isBoss ?? false,
    ai: def.ai ?? 'basic',
    xpReward: def.xpReward,
    displayScale: def.displayScale,
  };
}

// === Groupes de combat (référencés par les maps) ===
export interface EnemyGroupDef {
  id: string;
  label: string;               // nom affiché en exploration
  enemyIds: string[];
  drops: Array<{ itemId: string; count: number; chance: number }>;
  isBossGroup?: boolean;
}

export const ENEMY_GROUPS: Record<string, EnemyGroupDef> = {
  'archives-decret-solo': {
    id: 'archives-decret-solo',
    label: 'Décret errant',
    enemyIds: ['decret'],
    drops: [{ itemId: 'dossierDeSoin', count: 1, chance: 0.8 }],
  },
  'archives-hall-grimoire': {
    id: 'archives-hall-grimoire',
    label: 'Grimoire éveillé',
    enemyIds: ['grimoire', 'decret'],
    drops: [{ itemId: 'cafeDuGreffier', count: 1, chance: 0.7 }],
  },
  'archives-ouest-patrouille': {
    id: 'archives-ouest-patrouille',
    label: 'Patrouille des rayonnages',
    enemyIds: ['grimoire', 'decret', 'decret'],
    drops: [
      { itemId: 'dossierDeSoin', count: 1, chance: 1.0 },
      { itemId: 'formulaireA38', count: 1, chance: 0.4 },
    ],
  },
  'archives-est-elite': {
    id: 'archives-est-elite',
    label: 'Budget dévorant',
    enemyIds: ['grimoire2', 'decret2'],
    drops: [
      { itemId: 'encreBenite', count: 1, chance: 1.0 },
      { itemId: 'cafeDuGreffier', count: 2, chance: 1.0 },
    ],
  },
  'archives-boss': {
    id: 'archives-boss',
    label: 'Le Champion des Collectivités Territoriales',
    enemyIds: ['champion'],
    drops: [{ itemId: 'dossierDeSoin', count: 3, chance: 1.0 }],
    isBossGroup: true,
  },
  // Groupes génériques pour les camps de la Forêt de Lamber (ex-placeholders)
  'lamber-camp': {
    id: 'lamber-camp',
    label: 'Embuscade',
    enemyIds: ['decret', 'decret', 'grimoire'],
    drops: [{ itemId: 'dossierDeSoin', count: 1, chance: 0.6 }],
  },
};

export function getEnemyGroup(id: string): EnemyGroupDef {
  return ENEMY_GROUPS[id] ?? ENEMY_GROUPS['archives-decret-solo'];
}
