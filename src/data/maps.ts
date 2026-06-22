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
        { toMapId: 'bureau', label: '📚 Bureau des Archives' },
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

export const MAPS: Record<string, ExplorationMapConfig> = {
  bureau: BUREAU_MAP,
  ramees: RAMEES_MAP,
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
  if (id === 'bureau') return 'Bureau des Archives Infinies';
  if (id === 'ramees') return 'Ramees';
  return getMap(id).name;
}
