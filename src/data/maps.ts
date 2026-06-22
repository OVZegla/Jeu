import type { ExplorationMapConfig } from '../game/types';

// === Le Bureau des Archives Infinies ===
// La salle est sombre, le joueur ne doit pouvoir marcher que sur la zone
// du sol éclairée (pas dans les noirs autour).
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
  // Zone marchable : sol central éclairé, on évite les piles de livres
  // sur les côtés et la zone du trône (le joueur passe sous mais pas dans).
  walkable: [
    { x: 0.18, y: 0.55, w: 0.64, h: 0.40 }, // sol principal
    { x: 0.32, y: 0.45, w: 0.36, h: 0.12 }, // allée vers le trône
  ],
  playerScale: 1.0,
};

// === La cité de Ramees ===
// Map zoomée → personnage rétréci. Zones marchables = routes uniquement.
// Note : à affiner avec le mode debug (appuyer sur D en jeu).
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
    // Pont en bas à gauche → Forêt de Lamber
    {
      type: 'teleport',
      id: 'tp-to-lamber',
      x: 0.22,
      y: 0.93,
      toMapId: 'lamber',
      label: '🌲 Entrer dans la Forêt de Lamber',
    },
  ],
  ambianceColor: 0x000010,
  // Routes : grille permissive de départ — à itérer avec le mode debug.
  // Une croix de routes principales + une plaza centrale.
  walkable: [
    { x: 0.10, y: 0.46, w: 0.80, h: 0.10 }, // route horizontale centrale
    { x: 0.45, y: 0.20, w: 0.10, h: 0.70 }, // route verticale centrale
    { x: 0.30, y: 0.42, w: 0.40, h: 0.18 }, // plaza centrale (devant la stone)
    { x: 0.20, y: 0.75, w: 0.60, h: 0.18 }, // route basse (zone de spawn)
  ],
  playerScale: 0.55,
};

// === La Forêt de Lamber (génération procédurale) ===
// Map générée à la volée à partir de tile sheets. Le sol, les arbres et
// les camps sont placés aléatoirement à chaque entrée.
export const LAMBER_MAP: ExplorationMapConfig = {
  id: 'lamber',
  name: 'Forêt de Lamber',
  imageKey: '__procedural-lamber__',
  imagePath: '', // pas d'image, généré à la volée
  spawn: { x: 0.50, y: 0.06 }, // arrive en haut de la forêt
  interactables: [
    // Retour vers Ramees en haut de la map (par où on est arrivé)
    {
      type: 'teleport',
      id: 'tp-to-ramees-from-lamber',
      x: 0.50,
      y: 0.04,
      toMapId: 'ramees',
      label: '↩️ Retourner à Ramees',
    },
    // Les camps sont injectés dynamiquement par la scène lors de la génération
  ],
  ambianceColor: 0x081a0c,
  playerScale: 0.75,
  procedural: {
    type: 'forest',
    gridCols: 32,
    gridRows: 32,
    groundTileW: 165,
    groundTileH: 120,
    treeTileW: 145,
    treeTileH: 160,
    campTileW: 181,
    campTileH: 181,
    // Projection iso : diamond 96×70 (matche le ratio source 165:120 ≈ 1.37:1)
    isoTileW: 96,
    isoTileH: 70,
    treeDensity: 0.42,
    campCount: 4,
  },
};

export const MAPS: Record<string, ExplorationMapConfig> = {
  bureau: BUREAU_MAP,
  ramees: RAMEES_MAP,
  lamber: LAMBER_MAP,
};

export function getMap(id: string): ExplorationMapConfig {
  return MAPS[id] || BUREAU_MAP;
}
