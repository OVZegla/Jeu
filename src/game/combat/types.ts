// Types du moteur de combat V2 — tour par tour, multi-ennemis, initiative,
// éléments, objets, XP. Les événements (CombatEvent) permettent au rendu de
// synchroniser précisément animations, VFX et chiffres de dégâts.

import type { StatusEffect, StatusEffectTemplate, TargetType, MenuSlot } from '../types';

// === Éléments de l'univers (dark fantasy bureaucratique) ===
export type Element =
  | 'physique'
  | 'sacre'        // lumière (Datpaloof)
  | 'foudre'       // éclairs (Baghaar)
  | 'occulte'      // obscurité / démoniaque (Zlatax, ennemis)
  | 'feu'
  | 'soin'
  | 'bureaucratie'; // magie propre au boss et aux archives

export interface Affinities {
  weaknesses: Element[];   // x1.5 dégâts subis
  resistances: Element[];  // x0.6 dégâts subis
}

// === Compétences V2 (data-driven, incluant le rendu) ===
export type SkillIntensity = 'light' | 'skill' | 'heavy' | 'ultimate' | 'boss';

export type VfxKind =
  | 'slash'      // trainée physique
  | 'holy'       // lumière sacrée
  | 'lightning'  // chaîne d'éclairs
  | 'fire'
  | 'occult'     // volutes violettes
  | 'heal'
  | 'shield'
  | 'stamp'      // tampon administratif géant
  | 'papers'     // tourbillon de documents
  | 'summon';

export interface SkillPresentation {
  vfx: VfxKind;
  color: number;        // couleur dominante des particules / flash
  hitDelayMs: number;   // délai entre le début de l'anim d'attaque et l'impact
  approach: 'melee' | 'ranged' | 'none'; // le caster se projette-t-il vers la cible ?
  shake?: number;       // intensité du screenshake à l'impact (0..1)
  hitStopMs?: number;   // gel très court à l'impact
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'attack' | 'heal' | 'buff' | 'debuff' | 'defense';
  element: Element;
  target: TargetType;
  menuSlot: MenuSlot;
  mpCost: number;
  cooldown: number;
  basePower: number;
  selfCost?: number;
  critChance?: number;
  variance?: number;
  applies?: StatusEffectTemplate[];
  appliesToCaster?: StatusEffectTemplate[];
  applyChance?: number;   // proba (0..1) que `applies` prenne effet (défaut 1)
  mpDrain?: number;       // vole des MP à la cible
  intensity: SkillIntensity;
  presentation: SkillPresentation;
  // Conditions d'utilisation (IA + UI)
  conditions?: {
    minBossPhase?: number;      // réservée aux phases boss >= n
    requiresTelegraph?: boolean; // ne part qu'après un tour de télégraphe
  };
}

// === Combattants ===
export interface CombatantBase {
  id: string;             // unique DANS le combat (ex: 'grimoire-1')
  name: string;
  maxHp: number;
  hp: number;
  maxMp: number;
  mp: number;
  mpRegen: number;
  defense: number;        // 0..0.9 réduction
  physicalPower: number;
  magicPower: number;
  speed: number;          // initiative
  affinities: Affinities;
  skillIds: string[];
  cooldowns: Record<string, number>;
  status: StatusEffect[];
  alive: boolean;
  spriteKey: string;      // texture Phaser
  icon: string;
  color: string;
}

export interface HeroCombatant extends CombatantBase {
  kind: 'hero';
  heroId: string;         // 'datpaloof' | 'baghaar' | 'zlatax'
  className: string;
  level: number;
}

export type EnemyAiKind = 'basic' | 'boss-champion';

export interface EnemyCombatant extends CombatantBase {
  kind: 'enemy';
  enemyId: string;        // id de l'espèce ('grimoire', 'decret', 'champion'…)
  isBoss: boolean;
  ai: EnemyAiKind;
  xpReward: number;
  displayScale: number;   // taille relative dans l'arène
  title?: string;
}

export type Combatant = HeroCombatant | EnemyCombatant;

// === Ordre des tours ===
export interface TurnEntry {
  combatantId: string;
  isHero: boolean;
}

// === État du combat ===
export type BattlePhase =
  | 'intro'        // mise en scène d'entrée
  | 'playerAction' // attente d'une action du héros actif
  | 'resolving'    // événements en cours de lecture côté rendu
  | 'victory'
  | 'defeat';

export interface BossRuntime {
  phase: number;              // 1, 2, 3…
  telegraphSkillId: string | null; // attaque annoncée pour le prochain tour
  summonsDone: number;
}

export interface BattleState {
  phase: BattlePhase;
  round: number;
  heroes: HeroCombatant[];
  enemies: EnemyCombatant[];
  queue: TurnEntry[];         // tours restants dans le round courant
  activeId: string | null;    // combattant dont c'est le tour
  inventory: Record<string, number>;
  boss: BossRuntime | null;   // présent si un boss participe
  groupId: string;            // groupe d'ennemis combattu (pour les flags)
  rngSeedInfo?: string;
}

// === Événements (séquencés côté rendu) ===
export type Effectiveness = 'weak' | 'resist' | 'normal';

export type CombatEvent =
  | { t: 'log'; text: string; kind: 'damage' | 'heal' | 'status' | 'info' | 'death' | 'phase' | 'boss' }
  | { t: 'turnStart'; combatantId: string }
  | { t: 'cast'; casterId: string; skillId: string; targetIds: string[] }
  | { t: 'damage'; casterId: string; targetId: string; amount: number; crit: boolean; element: Element; effectiveness: Effectiveness; hpAfter: number; skillId: string }
  | { t: 'heal'; targetId: string; amount: number; hpAfter: number }
  | { t: 'mpChange'; targetId: string; amount: number; mpAfter: number }
  | { t: 'status'; targetId: string; effect: StatusEffect; positive: boolean }
  | { t: 'death'; targetId: string }
  | { t: 'revive'; targetId: string; hpAfter: number }
  | { t: 'item'; userId: string; itemId: string; targetId: string }
  | { t: 'summon'; enemies: EnemyCombatant[] }
  | { t: 'telegraph'; casterId: string; skillId: string; text: string }
  | { t: 'bossPhase'; phase: number; text: string }
  | { t: 'skipTurn'; combatantId: string; reason: string }
  | { t: 'tickDamage'; targetId: string; amount: number; hpAfter: number; name: string; icon: string }
  | { t: 'tickHeal'; targetId: string; amount: number; hpAfter: number; name: string; icon: string }
  | { t: 'victory'; xpGained: number; drops: Array<{ itemId: string; count: number }> }
  | { t: 'defeat' };

export interface StepResult {
  state: BattleState;
  events: CombatEvent[];
}

// === Action du joueur ===
export type PlayerAction =
  | { type: 'skill'; skillId: string; targetId: string | null }
  | { type: 'item'; itemId: string; targetId: string }
  | { type: 'flee' }; // réservé (non utilisé pour le boss)
