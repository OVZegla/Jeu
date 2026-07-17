// Sauvegarde / chargement — localStorage. Une seule sauvegarde (slot unique),
// versionnée pour pouvoir migrer plus tard.

import type { HeroState } from '../../data/party';

export interface GameFlags {
  defeatedGroups: string[];   // ids d'interactables de combat déjà vaincus
  collectedItems: string[];   // ids d'objets ramassés (coffres, secrets)
  readDocuments: string[];    // lore déjà lu (pour l'affichage « nouveau »)
  sealFragments: number;      // fragments du Sceau de l'Archiviste (0..2)
  bossDefeated: boolean;
  bossIntroSeen: boolean;
}

export interface SaveData {
  version: 2;
  savedAt: number;
  mapId: string;
  party: HeroState[];
  inventory: Record<string, number>;
  flags: GameFlags;
}

const KEY = 'jeu-save-v2';

export function createInitialFlags(): GameFlags {
  return {
    defeatedGroups: [],
    collectedItems: [],
    readDocuments: [],
    sealFragments: 0,
    bossDefeated: false,
    bossIntroSeen: false,
  };
}

export function saveGame(data: Omit<SaveData, 'version' | 'savedAt'>): boolean {
  try {
    const payload: SaveData = { version: 2, savedAt: Date.now(), ...data };
    localStorage.setItem(KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveData;
    if (parsed.version !== 2) return null;
    if (!Array.isArray(parsed.party) || !parsed.flags) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasSave(): boolean {
  return loadGame() !== null;
}

export function deleteSave(): void {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}
