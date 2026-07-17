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

export type MenuSlot = 'attaque' | 'defense' | 'special' | 'objet';

export interface Ability {
  id: string;
  name: string;
  description: string;
  category: AbilityCategory;
  target: TargetType;
  cooldown: number;        // tours de cooldown après usage
  basePower: number;       // dégâts ou soin de base
  mpCost: number;          // coût en MP (0 = gratuit)
  menuSlot: MenuSlot;      // dans quel slot du menu FF-style cette compétence apparaît
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
  maxMp: number;
  mp: number;
  mpRegen: number;          // MP regen par tour
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
  | 'exploration'
  | 'playerTurn'
  | 'bossTurn'
  | 'victory'
  | 'defeat';

// === Exploration (scènes pré-combat) ===

// Identifiant de map. Format libre. Conventions :
// - 'bureau', 'ramees' pour les maps uniques
// - 'lamber-1-1', 'lamber-2-1' pour les écrans d'une zone grille (x-y)
export type MapId = string;

export type Interactable =
  | {
      type: 'boss';
      id: string;
      x: number;
      y: number;
      spriteKey: string;
      label: string;
      engages: true;
      // V2 : groupe d'ennemis + dialogues de mise en scène (optionnels)
      groupId?: string;
      introDialogueId?: string;
      outroDialogueId?: string;
    }
  | {
      // V2 : combat contre un groupe d'ennemis visibles qui patrouillent
      type: 'battle';
      id: string;
      x: number;
      y: number;
      spriteKey: string;      // sprite de l'ennemi visible en exploration
      label: string;
      groupId: string;        // référence ENEMY_GROUPS
      patrol?: { dx: number; dy: number; ms: number }; // aller-retour (0..1 relatif map)
      aggroRadius?: number;   // déclenche le combat à l'approche (px monde)
    }
  | {
      // V2 : point de sauvegarde / repos
      type: 'savepoint';
      id: string;
      x: number;
      y: number;
      label: string;
    }
  | {
      // V2 : document à examiner (narration environnementale)
      type: 'document';
      id: string;
      x: number;
      y: number;
      label: string;
      dialogueId: string;
    }
  | {
      // V2 : coffre / objet à ramasser (une seule fois, persisté)
      type: 'chest';
      id: string;
      x: number;
      y: number;
      label: string;
      items: Array<{ itemId: string; count: number }>;
      dialogueId?: string;
      sealFragment?: boolean; // contient un fragment du Sceau de l'Archiviste
      hidden?: boolean;       // secret : indicateur très discret
    }
  | {
      // V2 : porte (éventuellement scellée) vers une autre map
      type: 'door';
      id: string;
      x: number;
      y: number;
      label: string;
      toMapId: MapId;
      lockedBySeal?: boolean; // nécessite les 2 fragments du sceau
    }
  | {
      // V2 : personnage non-joueur (dialogue, éventuel cadeau une seule fois)
      type: 'npc';
      id: string;
      x: number;
      y: number;
      spriteKey: string;
      name: string;           // affiché au-dessus de la tête
      label: string;          // prompt d'interaction
      dialogueId: string;
      gives?: Array<{ itemId: string; count: number }>; // remis à la 1ère discussion
      flip?: boolean;
    }
  | {
      type: 'teleport';
      id: string;
      x: number;
      y: number;
      toMapId: MapId;
      label: string;
    }
  | {
      type: 'teleportMenu';
      id: string;
      x: number;
      y: number;
      label: string;          // prompt à proximité, ex: "🪨 Pierre de téléport"
      destinations: Array<{ toMapId: MapId; label: string }>;
    };

// Zone marchable (rectangle normalisé 0..1 sur la map). Le joueur ne peut
// se trouver que dans l'union des walkable zones (si aucune, pas de
// contrainte). Permet de bloquer les bâtiments, les zones noires, etc.
export interface WalkableRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Sortie de map (côté nord/sud/est/ouest) qui mène à une autre map.
// Le joueur qui sort par le côté X arrive sur la map cible au côté opposé.
export type ExitSide = 'north' | 'south' | 'east' | 'west';

export interface MapExit {
  toMapId: MapId;
  // Position d'entrée sur la map de destination (0..1). Si omis, on calcule
  // automatiquement le côté opposé centré.
  entryX?: number;
  entryY?: number;
  // Position visuelle de l'indicateur (particules brillantes) sur la map source.
  // 0..1. Si omis, centré sur le côté correspondant.
  indicatorX?: number;
  indicatorY?: number;
}

export interface ExplorationMapConfig {
  id: MapId;
  name: string;
  imageKey: string;
  imagePath: string;
  spawn: { x: number; y: number }; // utilisé seulement à la 1ère arrivée (sans direction)
  interactables: Interactable[];
  ambianceColor?: number;
  walkable?: WalkableRect[];
  playerScale?: number;
  // Sorties de la map vers d'autres maps. Le joueur qui touche le bord
  // correspondant transite automatiquement.
  exits?: Partial<Record<ExitSide, MapExit>>;
  // === V2 : ambiance 2.5D ===
  mood?: 'archives' | 'forest' | 'city';
  // Halos lumineux additifs (positions 0..1) — complètent les lampes du décor
  lights?: Array<{ x: number; y: number; r: number; color: number }>;
  // Rais de lumière volumétriques (x = position 0..1 en haut de la map)
  lightShafts?: Array<{ x: number; width: number; tilt?: number }>;
  // Perspective simulée : scale du joueur interpolé entre haut et bas de map
  depthScale?: { top: number; bottom: number };
}

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
  attackTicks: Record<string, number>; // déclenche l'animation d'attaque
  lastDamage: Record<string, number>;  // montant du dernier coup reçu (pour chiffres flottants)
  lastHeal: Record<string, number>;    // montant du dernier soin reçu
}

export interface CombatAction {
  casterId: string;
  abilityId: string;
  targetId: string; // id du personnage ou du boss
}
