import type { ExplorationMapConfig } from '../game/types';

// === Le Bureau des Archives Infinies ===
export const BUREAU_MAP: ExplorationMapConfig = {
  id: 'bureau',
  name: 'Bureau des Archives Infinies',
  imageKey: 'ex-map-bureau',
  imagePath: 'assets/exploration/bureau/map.jpg',
  spawn: { x: 0.18, y: 0.80 },
  interactables: [
    {
      type: 'boss',
      id: 'champion',
      x: 0.50,
      y: 0.44,
      spriteKey: 'ex-boss-bureau',
      label: '⚔️ Engager le combat',
      engages: true,
    },
    {
      type: 'teleport',
      id: 'tp-to-ramees',
      x: 0.82,                  // coin droit
      y: 0.75,
      toMapId: 'ramees',
      label: '🪨 Voyager vers Ramees',
    },
  ],
};

// === La cité de Ramees ===
export const RAMEES_MAP: ExplorationMapConfig = {
  id: 'ramees',
  name: 'Ramees',
  imageKey: 'ex-map-ramees',
  imagePath: 'assets/exploration/ramees/map.jpg',
  spawn: { x: 0.50, y: 0.85 },
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
};

export const MAPS: Record<string, ExplorationMapConfig> = {
  bureau: BUREAU_MAP,
  ramees: RAMEES_MAP,
};

export function getMap(id: string): ExplorationMapConfig {
  return MAPS[id] || BUREAU_MAP;
}
