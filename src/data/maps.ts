import type { ExplorationMapConfig } from '../game/types';

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
      toMapId: 'lamber',
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

// === La Forêt de Lamber — système d'écrans à la Dofus ===
// Chaque écran = une map statique (image fournie). Les écrans sont
// connectés par des sorties N/S/E/W. Le joueur qui touche un bord
// transite vers l'écran voisin et apparaît au côté opposé.
//
// Pour ajouter un nouvel écran :
// 1. Crée son entrée ici (ex: LAMBER_NORTH_MAP) avec son imagePath
// 2. Ajoute 'lamber-north' au type MapId dans types.ts
// 3. Ajoute son entrée dans MAPS
// 4. Lie-le avec exits sur les maps voisines
export const LAMBER_MAP: ExplorationMapConfig = {
  id: 'lamber',
  name: 'Forêt de Lamber — Entrée',
  imageKey: 'ex-map-lamber',
  imagePath: 'assets/exploration/lamber/map.jpg',
  spawn: { x: 0.50, y: 0.80 },
  interactables: [
    {
      type: 'teleport',
      id: 'tp-to-ramees-from-lamber',
      x: 0.50,
      y: 0.95,
      toMapId: 'ramees',
      label: '↩️ Retourner à Ramees',
    },
  ],
  ambianceColor: 0x081a0c,
  playerScale: 0.85,
  // Exemple : sortie nord (vide pour l'instant — on activera quand tu
  // uploadras une 2e map de Lamber).
  // exits: { north: { toMapId: 'lamber-north' } },
};

export const MAPS: Record<string, ExplorationMapConfig> = {
  bureau: BUREAU_MAP,
  ramees: RAMEES_MAP,
  lamber: LAMBER_MAP,
};

export function getMap(id: string): ExplorationMapConfig {
  return MAPS[id] || BUREAU_MAP;
}
