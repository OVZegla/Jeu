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

export const MAPS: Record<string, ExplorationMapConfig> = {
  bureau: BUREAU_MAP,
  ramees: RAMEES_MAP,
};

export function getMap(id: string): ExplorationMapConfig {
  return MAPS[id] || BUREAU_MAP;
}
