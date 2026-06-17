// Types centraux du combat. Tout est sérialisable / immuable autant que possible
// pour que le moteur soit facile à tester et à étendre.

export type TargetType =
  | 'self'        // L'utilisateur de la compétence
  | 'ally'        // Un allié (peut être self)
  | 'allAllies'   // Tous les alliés vivants
  | 'enemy'       // Le boss
  | 'allEnemies'; // Tous les ennemis (boss unique en V1)

export type StatusEffectType =
  | 'shield'        // Réduction de dégâts subis (en %)
  | 'hot'           // Heal Over Time
  | 'dot'           // Damage Over Time
  | 'damageUp'      // Multiplicateur de dégâts infligés
  | 'damageDown'    // Réduction des dégâts infligés
  | 'defenseDown'   // Défense réduite (subit plus de dégâts)
  | 'skipTurn'      // Le prochain tour est sauté
  | 'marked'        // Reçoit plus de dégâts
  | 'enraged';      // Marqueur de phase boss < 40%

export interface StatusEffect {
  id: string;              // identifiant unique pour cette instance
  type: StatusEffectType;
  name: string;
  description: string;
  duration: number;        // tours restants (décrémenté en fin de tour)
  value: number;           // valeur générique (% ou montant)
  icon: string;            // emoji ou court symbole pour l'UI
}

export type AbilityCategory =
  | 'attack'
  | 'heal'
  | 'buff'
  | 'debuff'
  | 'defense';

export interface Ability {
  id: string;
  name: string;
  description: string;
  category: AbilityCategory;
  target: TargetType;
  cooldown: number;        // tours de cooldown après usage
  basePower: number;       // dégâts ou soin de base
  selfCost?: number;       // PV perdus par l'utilisateur (Soin interdit, Pacte)
  applies?: StatusEffectTemplate[]; // effets appliqués à la cible
  appliesToCaster?: StatusEffectTemplate[]; // effets appliqués à soi
  critChance?: number;     // 0..1
  variance?: number;       // +/- % aléatoire sur les dégâts (0..1)
  icon: string;
}

export interface StatusEffectTemplate {
  type: StatusEffectType;
  name: string;
  description: string;
  duration: number;
  value: number;
  icon: string;
}

export interface Character {
  id: string;
  name: string;
  className: string;
  description: string;
  maxHp: number;
  hp: number;
  defense: number;          // 0..0.9 réduction plate
  magicPower: number;       // multiplicateur dégâts magiques
  physicalPower: number;    // multiplicateur dégâts physiques
  abilities: Ability[];
  cooldowns: Record<string, number>; // abilityId → tours restants
  status: StatusEffect[];
  alive: boolean;
  icon: string;
  color: string;
}

export interface Boss {
  id: string;
  name: string;
  title: string;
  description: string;
  maxHp: number;
  hp: number;
  defense: number;
  power: number;
  abilities: Ability[];
  cooldowns: Record<string, number>;
  status: StatusEffect[];
  alive: boolean;
  icon: string;
  enraged: boolean; // phase sous 40%
}

export interface CombatLogEntry {
  id: number;
  turn: number;
  text: string;
  kind: 'damage' | 'heal' | 'status' | 'info' | 'death' | 'phase' | 'boss';
}

export type GamePhase =
  | 'start'
  | 'playerTurn'
  | 'bossTurn'
  | 'victory'
  | 'defeat';

export interface PendingTargetSelection {
  characterId: string;
  ability: Ability;
}

export interface GameState {
  phase: GamePhase;
  turn: number;
  characters: Character[];
  boss: Boss;
  log: CombatLogEntry[];
  activeCharacterIndex: number; // index du personnage qui doit choisir
  pendingTarget: PendingTargetSelection | null;
  logCounter: number;
  // Petits flashs visuels gérés via "ticks" qui changent à chaque hit.
  damageTicks: Record<string, number>;
  healTicks: Record<string, number>;
}

export interface CombatAction {
  casterId: string;
  abilityId: string;
  targetId: string; // id du personnage ou du boss
}
