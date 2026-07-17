import type { ExitSide, ExplorationMapConfig, Interactable, MapExit, MapId, WalkableRect } from '../game/types';

// === Le Bureau des Archives Infinies ===
export const BUREAU_MAP: ExplorationMapConfig = {
  id: 'bureau',
  name: 'Bureau des Archives Infinies',
  imageKey: 'ex-map-bureau',
  imagePath: 'assets/exploration/bureau/map.jpg',
  spawn: { x: 0.22, y: 0.80 },
  interactables: [
    {
      type: 'boss',
      id: 'champion',
      x: 0.50,
      y: 0.42,
      spriteKey: 'ex-boss-bureau',
      label: '⚔️ Engager le combat',
      engages: true,
    },
    {
      type: 'teleportMenu',
      id: 'tp-stone-bureau',
      x: 0.78,
      y: 0.72,
      label: '🪨 Pierre de téléport',
      destinations: [
        { toMapId: 'ramees', label: '🏘 Ramees' },
      ],
    },
  ],
  walkable: [
    { x: 0.18, y: 0.55, w: 0.64, h: 0.40 },
    { x: 0.32, y: 0.45, w: 0.36, h: 0.12 },
  ],
  playerScale: 1.0,
};

// === La cité de Ramees ===
// - La pierre de tp ne mène plus à Lamber, elle ouvre un menu (juste Bureau pour l'instant)
// - L'accès à la Forêt de Lamber se fait par le SUD (bord) avec particules indicatives
export const RAMEES_MAP: ExplorationMapConfig = {
  id: 'ramees',
  name: 'Ramees',
  imageKey: 'ex-map-ramees',
  imagePath: 'assets/exploration/ramees/map.jpg',
  spawn: { x: 0.50, y: 0.88 },
  interactables: [
    {
      type: 'teleportMenu',
      id: 'tp-stone-ramees',
      x: 0.50,
      y: 0.50,
      label: '🪨 Pierre de téléport',
      destinations: [
        { toMapId: 'archives-entree', label: '📚 Les Archives Infinies' },
      ],
    },
  ],
  ambianceColor: 0x000010,
  walkable: [
    { x: 0.10, y: 0.46, w: 0.80, h: 0.10 },
    { x: 0.45, y: 0.20, w: 0.10, h: 0.70 },
    { x: 0.30, y: 0.42, w: 0.40, h: 0.18 },
    { x: 0.20, y: 0.75, w: 0.60, h: 0.18 },
    // Sortie sud-ouest (pont vers Lamber) → permet d'atteindre le bord
    { x: 0.10, y: 0.85, w: 0.30, h: 0.15 },
  ],
  playerScale: 0.55,
  exits: {
    // Sortir par le sud → entrée de la Forêt de Lamber
    south: {
      toMapId: 'lamber-1-1',
      indicatorX: 0.22,
      indicatorY: 0.97,
    },
  },
};

// === Forêt de Lamber — grille d'écrans coordonnés ===
interface LamberScreen {
  x: number;
  y: number;
  name: string;
  interactables?: Interactable[];
  walkable?: WalkableRect[];
  // Indicateurs personnalisés par côté (sinon centre du bord par défaut)
  exitIndicators?: Partial<Record<ExitSide, { x: number; y: number }>>;
}

// Camps : interactables réutilisables
const BANDIT_CAMP = (id: string, x = 0.5, y = 0.5): Interactable => ({
  type: 'boss',
  id,
  x, y,
  spriteKey: '__placeholder__',
  label: '⚔️ Camp de bandits',
  engages: true,
});
const CULTIST_CAMP = (id: string, x = 0.5, y = 0.5): Interactable => ({
  type: 'boss',
  id,
  x, y,
  spriteKey: '__placeholder__',
  label: '⚔️ Camp de cultistes',
  engages: true,
});
const GOBLIN_GUARDS = (id: string, x = 0.5, y = 0.5): Interactable => ({
  type: 'boss',
  id,
  x, y,
  spriteKey: '__placeholder__',
  label: '⚔️ Gardes gobelins',
  engages: true,
});
const GOBLIN_CAMP = (id: string, x = 0.5, y = 0.5): Interactable => ({
  type: 'boss',
  id,
  x, y,
  spriteKey: '__placeholder__',
  label: '⚔️ Camp de gobelins',
  engages: true,
});
const DUNGEON_ENTRANCE = (id: string, label: string, x = 0.5, y = 0.4): Interactable => ({
  type: 'boss',
  id,
  x, y,
  spriteKey: '__placeholder__',
  label,
  engages: true,  // pour l'instant ça lance aussi un combat — donjon à venir
});

const LAMBER_SCREENS: LamberScreen[] = [
  {
    x: 1, y: 1,
    name: 'Entrée',
    interactables: [
      BANDIT_CAMP('lamber-1-1-bandits', 0.55, 0.55),
    ],
  },
  {
    x: 1, y: 2,
    name: 'Sentier des bandits',
    interactables: [
      BANDIT_CAMP('lamber-1-2-bandits', 0.50, 0.50),
    ],
  },
  {
    x: 1, y: 3,
    name: 'Sentier sud',
  },
  {
    x: 1, y: 4,
    name: 'Autel des cultistes',
    interactables: [
      CULTIST_CAMP('lamber-1-4-cultistes', 0.50, 0.50),
    ],
  },
  {
    x: 2, y: 2,
    name: 'Sentier est',
  },
  {
    x: 3, y: 2,
    name: 'Antre des bandits',
    interactables: [
      DUNGEON_ENTRANCE('lamber-3-2-dungeon-bandits', '🚪 Entrée du donjon des bandits', 0.50, 0.40),
    ],
  },
  {
    x: 0, y: 2,
    name: 'Garde gobelin',
    interactables: [
      GOBLIN_GUARDS('lamber-0-2-goblins', 0.55, 0.55),
    ],
  },
  {
    x: -1, y: 2,
    name: 'Repaire gobelin',
    interactables: [
      GOBLIN_CAMP('lamber-m1-2-goblins-camp', 0.40, 0.55),
      DUNGEON_ENTRANCE('lamber-m1-2-dungeon-goblins', '🚪 Entrée du donjon gobelin', 0.65, 0.40),
    ],
  },
];

function generateLamberMaps(): Record<string, ExplorationMapConfig> {
  const maps: Record<string, ExplorationMapConfig> = {};
  const lookup = new Set(LAMBER_SCREENS.map((s) => `${s.x},${s.y}`));
  const has = (x: number, y: number) => lookup.has(`${x},${y}`);
  const idOf = (x: number, y: number): MapId => `lamber-${x}-${y}`;

  for (const s of LAMBER_SCREENS) {
    const exits: Partial<Record<ExitSide, MapExit>> = {};
    const ei = s.exitIndicators || {};
    if (has(s.x + 1, s.y)) {
      exits.east = {
        toMapId: idOf(s.x + 1, s.y),
        indicatorX: ei.east?.x ?? 0.97,
        indicatorY: ei.east?.y ?? 0.50,
      };
    }
    if (has(s.x - 1, s.y)) {
      exits.west = {
        toMapId: idOf(s.x - 1, s.y),
        indicatorX: ei.west?.x ?? 0.03,
        indicatorY: ei.west?.y ?? 0.50,
      };
    }
    if (has(s.x, s.y - 1)) {
      exits.north = {
        toMapId: idOf(s.x, s.y - 1),
        indicatorX: ei.north?.x ?? 0.50,
        indicatorY: ei.north?.y ?? 0.03,
      };
    }
    if (has(s.x, s.y + 1)) {
      exits.south = {
        toMapId: idOf(s.x, s.y + 1),
        indicatorX: ei.south?.x ?? 0.50,
        indicatorY: ei.south?.y ?? 0.97,
      };
    }

    // Cas particulier : Lamber (1,1) doit aussi pouvoir retourner à Ramees
    // par le NORD (puisque c'est par là qu'on arrive). Pas besoin de pierre
    // — juste edge exit + particules.
    const mid = idOf(s.x, s.y);
    if (s.x === 1 && s.y === 1) {
      exits.north = {
        toMapId: 'ramees',
        indicatorX: 0.50,
        indicatorY: 0.03,
      };
    }

    maps[mid] = {
      id: mid,
      name: `Forêt de Lamber — ${s.name} (${s.x},${s.y})`,
      imageKey: `ex-map-${mid}`,
      imagePath: `assets/exploration/lamber/${s.x}-${s.y}.jpg`,
      spawn: { x: 0.50, y: 0.85 },
      interactables: s.interactables || [],
      walkable: s.walkable,
      ambianceColor: 0x081a0c,
      playerScale: 0.85,
      exits,
    };
  }
  return maps;
}

const LAMBER_MAPS = generateLamberMaps();

// ============================================================
// LES ARCHIVES INFINIES — zone prioritaire de la refonte (vertical slice).
// 5 salles découpées dans bureau/map.jpg (voir scripts/gen-derived-assets.py).
// Progression : entrée → hall (save) → ailes est/ouest (2 fragments du sceau)
// → porte scellée → salle du boss.
// ============================================================

const ARCHIVES_ENTREE: ExplorationMapConfig = {
  id: 'archives-entree',
  name: 'Archives — Grande Entrée',
  imageKey: 'ex-map-archives-entree',
  imagePath: 'assets/exploration/archives/entree.jpg',
  spawn: { x: 0.50, y: 0.82 },
  mood: 'archives',
  ambianceColor: 0x140a20,
  depthScale: { top: 0.78, bottom: 1.06 },
  lightShafts: [{ x: 0.30, width: 0.10 }, { x: 0.62, width: 0.14 }],
  lights: [
    { x: 0.325, y: 0.66, r: 60, color: 0xaa66ff },
    { x: 0.445, y: 0.70, r: 55, color: 0x66ffcc },
    { x: 0.635, y: 0.70, r: 55, color: 0x66ffcc },
    { x: 0.775, y: 0.66, r: 60, color: 0xaa66ff },
  ],
  interactables: [
    {
      type: 'document',
      id: 'arch-doc-registre',
      x: 0.145, y: 0.575,
      label: '📖 Examiner le registre',
      dialogueId: 'lore-registre',
    },
    {
      type: 'battle',
      id: 'arch-entree-decret',
      x: 0.68, y: 0.42,
      spriteKey: 'enemy-decret',
      label: '⚔️ Décret errant',
      groupId: 'archives-decret-solo',
      patrol: { dx: 0.10, dy: 0.03, ms: 2600 },
      aggroRadius: 70,
    },
    {
      type: 'teleportMenu',
      id: 'arch-tp-entree',
      x: 0.875, y: 0.62,
      label: '🪨 Pierre de téléport',
      destinations: [{ toMapId: 'ramees', label: '🏘 Ramees' }],
    },
  ],
  walkable: [
    { x: 0.10, y: 0.30, w: 0.80, h: 0.58 },
    { x: 0.38, y: 0.82, w: 0.28, h: 0.16 },
  ],
  playerScale: 0.95,
  exits: {
    north: { toMapId: 'archives-hall', indicatorX: 0.50, indicatorY: 0.06 },
  },
};

const ARCHIVES_HALL: ExplorationMapConfig = {
  id: 'archives-hall',
  name: 'Archives — Hall du Classement',
  imageKey: 'ex-map-archives-hall',
  imagePath: 'assets/exploration/archives/hall.jpg',
  spawn: { x: 0.50, y: 0.80 },
  mood: 'archives',
  ambianceColor: 0x150b22,
  depthScale: { top: 0.75, bottom: 1.05 },
  lightShafts: [{ x: 0.48, width: 0.18 }],
  lights: [
    { x: 0.245, y: 0.42, r: 55, color: 0xaa66ff },
    { x: 0.75, y: 0.42, r: 55, color: 0xaa66ff },
    { x: 0.44, y: 0.20, r: 65, color: 0xcc88ff },
  ],
  interactables: [
    {
      type: 'savepoint',
      id: 'arch-save-hall',
      x: 0.50, y: 0.60,
      label: '🪨 Pierre de mémoire — se reposer',
    },
    {
      type: 'battle',
      id: 'arch-hall-grimoire',
      x: 0.26, y: 0.38,
      spriteKey: 'enemy-grimoire',
      label: '⚔️ Grimoire éveillé',
      groupId: 'archives-hall-grimoire',
      patrol: { dx: 0.06, dy: 0.05, ms: 3200 },
      aggroRadius: 80,
    },
    {
      type: 'document',
      id: 'arch-doc-circulaire',
      x: 0.79, y: 0.34,
      label: '📜 Lire la circulaire',
      dialogueId: 'lore-circulaire',
    },
    {
      type: 'door',
      id: 'arch-door-boss',
      x: 0.50, y: 0.155,
      label: '🚪 Porte de la Salle du Jugement',
      toMapId: 'archives-boss',
      lockedBySeal: true,
    },
  ],
  walkable: [
    { x: 0.12, y: 0.26, w: 0.76, h: 0.60 },
    { x: 0.40, y: 0.12, w: 0.20, h: 0.20 },
    { x: 0.40, y: 0.84, w: 0.20, h: 0.14 },
  ],
  playerScale: 0.90,
  exits: {
    south: { toMapId: 'archives-entree', indicatorX: 0.50, indicatorY: 0.95 },
    west: { toMapId: 'archives-ouest', indicatorX: 0.045, indicatorY: 0.55 },
    east: { toMapId: 'archives-est', indicatorX: 0.955, indicatorY: 0.55 },
  },
};

const ARCHIVES_OUEST: ExplorationMapConfig = {
  id: 'archives-ouest',
  name: 'Archives — Aile Ouest, rayonnages interdits',
  imageKey: 'ex-map-archives-ouest',
  imagePath: 'assets/exploration/archives/ouest.jpg',
  spawn: { x: 0.85, y: 0.60 },
  mood: 'archives',
  ambianceColor: 0x0d0618,
  depthScale: { top: 0.78, bottom: 1.04 },
  lights: [
    { x: 0.28, y: 0.52, r: 50, color: 0xaa66ff },
    { x: 0.62, y: 0.34, r: 45, color: 0xaa66ff },
    { x: 0.16, y: 0.72, r: 40, color: 0x66ffcc },
  ],
  interactables: [
    {
      type: 'battle',
      id: 'arch-ouest-patrouille',
      x: 0.42, y: 0.46,
      spriteKey: 'enemy-grimoire',
      label: '⚔️ Patrouille des rayonnages',
      groupId: 'archives-ouest-patrouille',
      patrol: { dx: 0.12, dy: 0.04, ms: 3000 },
      aggroRadius: 85,
    },
    {
      type: 'chest',
      id: 'arch-chest-fragment-ouest',
      x: 0.185, y: 0.42,
      label: '🗝 Tiroir verrouillé',
      items: [],
      sealFragment: true,
      dialogueId: 'lore-fragment-ouest',
    },
    {
      type: 'document',
      id: 'arch-doc-plainte',
      x: 0.66, y: 0.66,
      label: '📄 Une plainte poussiéreuse',
      dialogueId: 'lore-plainte',
    },
    {
      type: 'chest',
      id: 'arch-secret-cafe',
      x: 0.88, y: 0.86,
      label: '❔ Quelque chose brille…',
      items: [{ itemId: 'cafeDuGreffier', count: 2 }],
      dialogueId: 'secret-cafe',
      hidden: true,
    },
  ],
  walkable: [
    { x: 0.14, y: 0.34, w: 0.78, h: 0.48 },
    { x: 0.60, y: 0.78, w: 0.34, h: 0.16 },
  ],
  playerScale: 0.90,
  exits: {
    east: { toMapId: 'archives-hall', indicatorX: 0.955, indicatorY: 0.55 },
  },
};

const ARCHIVES_EST: ExplorationMapConfig = {
  id: 'archives-est',
  name: 'Archives — Aile Est, salle des budgets',
  imageKey: 'ex-map-archives-est',
  imagePath: 'assets/exploration/archives/est.jpg',
  spawn: { x: 0.12, y: 0.60 },
  mood: 'archives',
  ambianceColor: 0x120a1e,
  depthScale: { top: 0.78, bottom: 1.04 },
  lights: [
    { x: 0.66, y: 0.48, r: 55, color: 0xffaa44 },
    { x: 0.36, y: 0.36, r: 45, color: 0xaa66ff },
    { x: 0.82, y: 0.70, r: 40, color: 0xaa66ff },
  ],
  interactables: [
    {
      type: 'battle',
      id: 'arch-est-elite',
      x: 0.58, y: 0.46,
      spriteKey: 'enemy-grimoire2',
      label: '⚔️ Budget dévorant (élite)',
      groupId: 'archives-est-elite',
      patrol: { dx: 0.05, dy: 0.05, ms: 3800 },
      aggroRadius: 90,
    },
    {
      type: 'chest',
      id: 'arch-chest-fragment-est',
      x: 0.80, y: 0.38,
      label: '🗝 Coffret scellé',
      items: [],
      sealFragment: true,
      dialogueId: 'lore-fragment-est',
    },
    {
      type: 'chest',
      id: 'arch-chest-soins-est',
      x: 0.24, y: 0.74,
      label: '📦 Carton d\'archives',
      items: [{ itemId: 'dossierDeSoin', count: 2 }],
    },
  ],
  walkable: [
    { x: 0.08, y: 0.34, w: 0.80, h: 0.48 },
    { x: 0.10, y: 0.70, w: 0.44, h: 0.20 },
  ],
  playerScale: 0.90,
  exits: {
    west: { toMapId: 'archives-hall', indicatorX: 0.045, indicatorY: 0.55 },
  },
};

const ARCHIVES_BOSS: ExplorationMapConfig = {
  id: 'archives-boss',
  name: 'Archives — Salle du Jugement',
  imageKey: 'ex-map-archives-boss',
  imagePath: 'assets/exploration/archives/boss.jpg',
  spawn: { x: 0.50, y: 0.86 },
  mood: 'archives',
  ambianceColor: 0x1a0b28,
  depthScale: { top: 0.72, bottom: 1.02 },
  lightShafts: [{ x: 0.50, width: 0.16 }],
  lights: [
    { x: 0.355, y: 0.38, r: 60, color: 0xcc55ff },
    { x: 0.645, y: 0.38, r: 60, color: 0xcc55ff },
    { x: 0.50, y: 0.30, r: 80, color: 0xaa44ff },
  ],
  interactables: [
    {
      type: 'boss',
      id: 'champion',
      x: 0.50, y: 0.44,
      spriteKey: 'ex-boss-bureau',
      label: '⚔️ Affronter le Champion',
      engages: true,
      groupId: 'archives-boss',
      introDialogueId: 'boss-intro',
      outroDialogueId: 'boss-outro',
    },
  ],
  walkable: [
    { x: 0.16, y: 0.52, w: 0.68, h: 0.42 },
    { x: 0.36, y: 0.36, w: 0.28, h: 0.24 },
  ],
  playerScale: 0.90,
  exits: {
    south: { toMapId: 'archives-hall', indicatorX: 0.50, indicatorY: 0.95 },
  },
};

export const ARCHIVES_MAPS: Record<string, ExplorationMapConfig> = {
  'archives-entree': ARCHIVES_ENTREE,
  'archives-hall': ARCHIVES_HALL,
  'archives-ouest': ARCHIVES_OUEST,
  'archives-est': ARCHIVES_EST,
  'archives-boss': ARCHIVES_BOSS,
};

export const START_MAP_ID: MapId = 'archives-entree';

export const MAPS: Record<string, ExplorationMapConfig> = {
  bureau: BUREAU_MAP,
  ramees: RAMEES_MAP,
  ...ARCHIVES_MAPS,
  ...LAMBER_MAPS,
};

export const LAMBER_ENTRY_ID: MapId = 'lamber-1-1';

export function getMap(id: string): ExplorationMapConfig {
  return MAPS[id] || BUREAU_MAP;
}

export function getAllMapImagesToPreload(): Array<{ key: string; path: string }> {
  return Object.values(MAPS).map((m) => ({ key: m.imageKey, path: m.imagePath }));
}

// Zone d'une map (pour le grand titre overlay JRPG).
// Toutes les maps lamber-*-* sont dans la zone "Forêt de Lamber".
export function getZoneName(id: string): string {
  if (id.startsWith('lamber-')) return 'Forêt de Lamber';
  if (id.startsWith('archives-')) return 'Les Archives Infinies';
  if (id === 'bureau') return 'Bureau des Archives Infinies';
  if (id === 'ramees') return 'Ramees';
  return getMap(id).name;
}
