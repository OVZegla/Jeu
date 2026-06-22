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
      type: 'teleport',
      id: 'tp-to-ramees',
      x: 0.78,
      y: 0.72,
      toMapId: 'ramees',
      label: '🪨 Voyager vers Ramees',
    },
  ],
  walkable: [
    { x: 0.18, y: 0.55, w: 0.64, h: 0.40 },
    { x: 0.32, y: 0.45, w: 0.36, h: 0.12 },
  ],
  playerScale: 1.0,
};

// === La cité de Ramees ===
export const RAMEES_MAP: ExplorationMapConfig = {
  id: 'ramees',
  name: 'Ramees',
  imageKey: 'ex-map-ramees',
  imagePath: 'assets/exploration/ramees/map.jpg',
  spawn: { x: 0.50, y: 0.88 },
  interactables: [
    {
      type: 'teleport',
      id: 'tp-to-bureau',
      x: 0.50,
      y: 0.50,
      toMapId: 'bureau',
      label: '🪨 Retourner au Bureau',
    },
    {
      type: 'teleport',
      id: 'tp-to-lamber',
      x: 0.22,
      y: 0.93,
      toMapId: 'lamber-1-1',
      label: '🌲 Entrer dans la Forêt de Lamber',
    },
  ],
  ambianceColor: 0x000010,
  walkable: [
    { x: 0.10, y: 0.46, w: 0.80, h: 0.10 },
    { x: 0.45, y: 0.20, w: 0.10, h: 0.70 },
    { x: 0.30, y: 0.42, w: 0.40, h: 0.18 },
    { x: 0.20, y: 0.75, w: 0.60, h: 0.18 },
  ],
  playerScale: 0.55,
};

// === Forêt de Lamber — grille d'écrans coordonnés ===
//
// Chaque écran = coords (x, y). Les voisins (x±1, y) et (x, y±1) sont
// automatiquement connectés via les exits N/S/E/W. Donc pour ajouter un
// nouveau bout de forêt il suffit de :
//   1. Uploader l'image en `public/assets/exploration/lamber/X-Y.jpg`
//   2. Ajouter une entrée { x, y, name } dans LAMBER_SCREENS ci-dessous
// Les exits avec les voisins existants sont générés automatiquement.
interface LamberScreen {
  x: number;
  y: number;
  name: string;
  interactables?: Interactable[];
  walkable?: WalkableRect[];
}

const LAMBER_SCREENS: LamberScreen[] = [
  {
    x: 1, y: 1,
    name: 'Entrée',
    interactables: [
      {
        type: 'teleport',
        id: 'tp-to-ramees-from-lamber',
        x: 0.50,
        y: 0.92,
        toMapId: 'ramees',
        label: '↩️ Retourner à Ramees',
      },
    ],
  },
  // Exemples (à activer en uploadant les images correspondantes) :
  // { x: 2, y: 1, name: 'Clairière Est' },
  // { x: 1, y: 2, name: 'Sentier Sud' },
  // { x: 0, y: 1, name: 'Lisière Ouest' },
];

function generateLamberMaps(): Record<string, ExplorationMapConfig> {
  const maps: Record<string, ExplorationMapConfig> = {};
  const lookup = new Set(LAMBER_SCREENS.map((s) => `${s.x},${s.y}`));
  const has = (x: number, y: number) => lookup.has(`${x},${y}`);
  const id = (x: number, y: number): MapId => `lamber-${x}-${y}`;

  for (const s of LAMBER_SCREENS) {
    const exits: Partial<Record<ExitSide, MapExit>> = {};
    if (has(s.x + 1, s.y)) exits.east = { toMapId: id(s.x + 1, s.y) };
    if (has(s.x - 1, s.y)) exits.west = { toMapId: id(s.x - 1, s.y) };
    if (has(s.x, s.y - 1)) exits.north = { toMapId: id(s.x, s.y - 1) };
    if (has(s.x, s.y + 1)) exits.south = { toMapId: id(s.x, s.y + 1) };

    const mid = id(s.x, s.y);
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

// Map "entrée" de Lamber (utilisée par les menus & téléports)
export const LAMBER_ENTRY_ID: MapId = 'lamber-1-1';

export function getMap(id: string): ExplorationMapConfig {
  return MAPS[id] || BUREAU_MAP;
}

// Liste tous les couples (key, path) à précharger côté Phaser.
export function getAllMapImagesToPreload(): Array<{ key: string; path: string }> {
  return Object.values(MAPS).map((m) => ({ key: m.imageKey, path: m.imagePath }));
}
