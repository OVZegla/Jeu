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
  floats?: boolean;       // documents animés qui lévitent
}

const EB = BALANCE2.enemies;
const FB = BALANCE2.factionEnemies;

// Fabrique compacte pour les ennemis de faction (stats dans balance.ts)
function factionDef(
  enemyId: keyof typeof FB,
  name: string,
  skillIds: string[],
  spriteKey: string,
  icon: string,
  color: string,
  displayScale: number,
  title?: string
): EnemyDef {
  const b = FB[enemyId];
  return {
    enemyId, name, title,
    maxHp: b.maxHp, defense: b.defense, power: b.power, speed: b.speed,
    xpReward: b.xp,
    weaknesses: b.weaknesses as Element[],
    resistances: b.resistances as Element[],
    skillIds, spriteKey, icon, color, displayScale,
  };
}

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
    floats: true,
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
    floats: true,
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
    floats: true,
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
    floats: true,
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
  // === Factions de la Forêt de Lamber (clichés assumés) ===
  bandit: factionDef('bandit', 'Bandit de grand chemin',
    ['coupDeSurin', 'jetDeCouteau', 'racketOrganise'],
    'enemy-bandit', '🗡', '#aa9988', 1.5),
  banditChef: factionDef('banditChef', 'Le Balafré',
    ['coupBas', 'coupDeSurin', 'racketOrganise'],
    'enemy-banditChef', '💀', '#cc5544', 1.9, 'Chef auto-proclamé des bandits de Lamber'),
  gobelin: factionDef('gobelin', 'Gobelin',
    ['grosGourdin', 'jetDeCaillou', 'kriKriKri'],
    'enemy-gobelin', '👺', '#77cc55', 1.0),
  roiGobelin: factionDef('roiGobelin', 'Roi Gobelin Grokk',
    ['chargeDuRoi', 'grosGourdin', 'kriKriKri'],
    'enemy-roiGobelin', '👑', '#aacc44', 2.1, 'Premier de sa dynastie (les autres sont morts bêtement)'),
  cultiste: factionDef('cultiste', 'Cultiste du Grand Dormeur',
    ['psaumeObscur', 'chantMonotone', 'saigneeRituelle'],
    'enemy-cultiste', '🌘', '#9966cc', 1.5),
  hierophante: factionDef('hierophante', 'Hiérophante Somnyx',
    ['appelDuGrandDormeur', 'cercleDInvocation', 'psaumeObscur'],
    'enemy-hierophante', '🔮', '#cc66ff', 1.9, 'Voix officielle du Grand Dormeur (qui dort)'),

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
    floats: true,
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
    floats: def.floats ?? false,
  };
}

// === Groupes de combat (référencés par les maps) ===
export type BattleBackground = 'arena' | 'forest' | 'cave';

export interface EnemyGroupDef {
  id: string;
  label: string;               // nom affiché en exploration
  enemyIds: string[];
  drops: Array<{ itemId: string; count: number; chance: number }>;
  isBossGroup?: boolean;
  background?: BattleBackground; // décor du combat (défaut : arena / Archives)
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
  // === Forêt de Lamber — bandits, gobelins, cultistes ===
  'lamber-bandits-entree': {
    id: 'lamber-bandits-entree',
    label: 'Bandits pas discrets',
    enemyIds: ['bandit', 'bandit'],
    drops: [{ itemId: 'dossierDeSoin', count: 1, chance: 0.7 }],
    background: 'forest',
  },
  'lamber-bandits-sentier': {
    id: 'lamber-bandits-sentier',
    label: 'Embuscade de bandits',
    enemyIds: ['bandit', 'bandit', 'bandit'],
    drops: [
      { itemId: 'dossierDeSoin', count: 1, chance: 0.8 },
      { itemId: 'cafeDuGreffier', count: 1, chance: 0.5 },
    ],
    background: 'forest',
  },
  'lamber-gobelins-garde': {
    id: 'lamber-gobelins-garde',
    label: 'Gardes gobelins (ils dorment debout)',
    enemyIds: ['gobelin', 'gobelin'],
    drops: [{ itemId: 'dossierDeSoin', count: 1, chance: 0.6 }],
    background: 'forest',
  },
  'lamber-gobelins-camp': {
    id: 'lamber-gobelins-camp',
    label: 'Camp gobelin',
    enemyIds: ['gobelin', 'gobelin', 'gobelin'],
    drops: [
      { itemId: 'dossierDeSoin', count: 1, chance: 0.8 },
      { itemId: 'formulaireA38', count: 1, chance: 0.4 },
    ],
    background: 'forest',
  },
  'lamber-cultistes-autel': {
    id: 'lamber-cultistes-autel',
    label: 'Cérémonie du Grand Dormeur',
    enemyIds: ['hierophante', 'cultiste', 'cultiste'],
    drops: [
      { itemId: 'encreBenite', count: 1, chance: 1.0 },
      { itemId: 'cafeDuGreffier', count: 2, chance: 1.0 },
    ],
    background: 'forest',
  },
  // Donjons
  'donjon-bandits-garde': {
    id: 'donjon-bandits-garde',
    label: 'Bandits de garde',
    enemyIds: ['bandit', 'bandit', 'bandit'],
    drops: [{ itemId: 'cafeDuGreffier', count: 1, chance: 0.8 }],
    background: 'cave',
  },
  'donjon-bandits-chef': {
    id: 'donjon-bandits-chef',
    label: 'Le Balafré et sa garde rapprochée',
    enemyIds: ['banditChef', 'bandit', 'bandit'],
    drops: [
      { itemId: 'encreBenite', count: 1, chance: 1.0 },
      { itemId: 'dossierDeSoin', count: 2, chance: 1.0 },
    ],
    background: 'cave',
  },
  'donjon-gobelins-garde': {
    id: 'donjon-gobelins-garde',
    label: 'Meute de gobelins',
    enemyIds: ['gobelin', 'gobelin', 'gobelin', 'gobelin'],
    drops: [{ itemId: 'dossierDeSoin', count: 1, chance: 0.8 }],
    background: 'cave',
  },
  'donjon-gobelins-roi': {
    id: 'donjon-gobelins-roi',
    label: 'Sa Majesté Grokk Ier',
    enemyIds: ['roiGobelin', 'gobelin', 'gobelin'],
    drops: [
      { itemId: 'encreBenite', count: 1, chance: 1.0 },
      { itemId: 'cafeDuGreffier', count: 2, chance: 1.0 },
    ],
    background: 'cave',
  },
  // Alias hérité (anciens camps « placeholder »)
  'lamber-camp': {
    id: 'lamber-camp',
    label: 'Embuscade',
    enemyIds: ['bandit', 'bandit', 'gobelin'],
    drops: [{ itemId: 'dossierDeSoin', count: 1, chance: 0.6 }],
    background: 'forest',
  },
};

export function getEnemyGroup(id: string): EnemyGroupDef {
  return ENEMY_GROUPS[id] ?? ENEMY_GROUPS['archives-decret-solo'];
}
