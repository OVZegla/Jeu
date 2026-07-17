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
// Ville vivante : 7 bâtiments avec intérieurs (portes), PNJ, une seule pierre
// de téléport (place centrale). Accès Forêt de Lamber par le pont au SUD-OUEST.
export const RAMEES_MAP: ExplorationMapConfig = {
  id: 'ramees',
  name: 'Ramees',
  imageKey: 'ex-map-ramees',
  imagePath: 'assets/exploration/ramees/map.jpg',
  spawn: { x: 0.50, y: 0.60 },
  mood: 'city',
  depthScale: { top: 0.85, bottom: 1.10 },
  lights: [
    { x: 0.485, y: 0.470, r: 30, color: 0xffcc77 }, // fontaine
    { x: 0.560, y: 0.520, r: 26, color: 0xffcc77 },
    { x: 0.420, y: 0.545, r: 26, color: 0xffcc77 },
  ],
  interactables: [
    {
      type: 'teleportMenu',
      id: 'tp-stone-ramees',
      x: 0.525, y: 0.475,
      label: '🪨 Pierre de téléport',
      destinations: [
        { toMapId: 'archives-entree', label: '📚 Les Archives Infinies' },
      ],
    },
    { type: 'door', id: 'door-eglise', x: 0.472, y: 0.305, label: '⛪ Entrer dans l\'église', toMapId: 'ramees-eglise' },
    { type: 'door', id: 'door-mairie', x: 0.656, y: 0.390, label: '🏛 Entrer dans la mairie', toMapId: 'ramees-mairie' },
    { type: 'door', id: 'door-forge', x: 0.215, y: 0.385, label: '⚒ Entrer dans la forge', toMapId: 'ramees-forge' },
    { type: 'door', id: 'door-auberge', x: 0.790, y: 0.490, label: '🍺 Entrer dans l\'auberge', toMapId: 'ramees-auberge' },
    { type: 'door', id: 'door-herbo', x: 0.887, y: 0.570, label: '🌿 Entrer dans l\'herboristerie', toMapId: 'ramees-herboristerie' },
    { type: 'door', id: 'door-echoppe', x: 0.215, y: 0.570, label: '🧺 Entrer dans l\'échoppe', toMapId: 'ramees-echoppe' },
    { type: 'door', id: 'door-quenticast', x: 0.797, y: 0.695, label: '🚪 Entrer chez Quenticast', toMapId: 'ramees-quenticast' },
    {
      type: 'document',
      id: 'ramees-fontaine',
      x: 0.485, y: 0.465,
      label: '⛲ La fontaine de Ramees',
      dialogueId: 'ramees-fontaine',
    },
  ],
  ambianceColor: 0x000010,
  walkable: [
    // Grande route horizontale + place centrale
    { x: 0.06, y: 0.42, w: 0.88, h: 0.16 },
    { x: 0.30, y: 0.38, w: 0.44, h: 0.26 },
    // Colonne centrale (église ↔ sud)
    { x: 0.42, y: 0.28, w: 0.16, h: 0.52 },
    // Accès forge (ouest) et mairie (est)
    { x: 0.14, y: 0.35, w: 0.30, h: 0.10 },
    { x: 0.56, y: 0.36, w: 0.16, h: 0.10 },
    // Accès auberge / herboristerie / maison de Quenticast (est)
    { x: 0.70, y: 0.44, w: 0.16, h: 0.10 },
    { x: 0.78, y: 0.50, w: 0.17, h: 0.10 },
    { x: 0.70, y: 0.56, w: 0.14, h: 0.16 },
    // Accès échoppe (ouest)
    { x: 0.13, y: 0.50, w: 0.20, h: 0.10 },
    // Bande sud + pont vers Lamber (sud-ouest)
    { x: 0.20, y: 0.68, w: 0.56, h: 0.12 },
    { x: 0.10, y: 0.78, w: 0.32, h: 0.20 },
  ],
  playerScale: 0.40,
  exits: {
    // Sortir par le sud → entrée de la Forêt de Lamber
    south: {
      toMapId: 'lamber-1-1',
      indicatorX: 0.22,
      indicatorY: 0.97,
    },
  },
};

// === Intérieurs de Ramees ===
// Salles générées par scripts/gen-ramees-assets.py (1200x760).
// Sortie : bord SUD → retour devant la porte du bâtiment.

interface InteriorSpec {
  key: string;               // 'auberge' → id 'ramees-auberge'
  name: string;
  doorX: number;             // position de la porte sur la map de Ramees
  doorY: number;
  lights: ExplorationMapConfig['lights'];
  lightShafts?: ExplorationMapConfig['lightShafts'];
  walkable: WalkableRect[];
  interactables: Interactable[];
}

const INTERIORS: InteriorSpec[] = [
  {
    key: 'auberge',
    name: 'Ramees — Auberge « Le Tampon Doré »',
    doorX: 0.790, doorY: 0.510,
    lights: [
      { x: 0.83, y: 0.18, r: 60, color: 0xff9944 },   // cheminée
      { x: 0.14, y: 0.12, r: 40, color: 0xffcc77 },   // fenêtres
      { x: 0.40, y: 0.12, r: 40, color: 0xffcc77 },
      { x: 0.23, y: 0.47, r: 28, color: 0xffe6a0 },   // bougies
      { x: 0.50, y: 0.45, r: 28, color: 0xffe6a0 },
    ],
    walkable: [
      { x: 0.04, y: 0.33, w: 0.62, h: 0.60 },
      { x: 0.66, y: 0.60, w: 0.30, h: 0.33 },
      { x: 0.66, y: 0.30, w: 0.30, h: 0.10 },
    ],
    interactables: [
      {
        type: 'npc', id: 'npc-juiffy', x: 0.87, y: 0.38,
        spriteKey: 'npc-juiffy', name: 'Juiffy', label: '💬 Parler à Juiffy',
        dialogueId: 'npc-juiffy',
        gives: [{ itemId: 'cafeDuGreffier', count: 1 }],
      },
      {
        type: 'npc', id: 'npc-cubique', x: 0.47, y: 0.66,
        spriteKey: 'npc-cubique', name: 'Cubique', label: '💬 Parler à Cubique',
        dialogueId: 'npc-cubique', flip: true,
      },
    ],
  },
  {
    key: 'eglise',
    name: 'Ramees — Église de la Sainte Réglementation',
    doorX: 0.472, doorY: 0.325,
    lights: [
      { x: 0.50, y: 0.12, r: 75, color: 0xccaaff },   // vitrail
      { x: 0.17, y: 0.12, r: 30, color: 0xaabbff },
      { x: 0.83, y: 0.12, r: 30, color: 0xaabbff },
      { x: 0.50, y: 0.30, r: 34, color: 0xffe6a0 },   // cierges
    ],
    lightShafts: [{ x: 0.50, width: 0.14 }],
    walkable: [
      { x: 0.06, y: 0.42, w: 0.88, h: 0.50 },
      { x: 0.42, y: 0.30, w: 0.16, h: 0.20 },
    ],
    interactables: [
      {
        type: 'npc', id: 'npc-pretre', x: 0.41, y: 0.40,
        spriteKey: 'npc-pretre', name: 'Père Célestin', label: '💬 Parler au Père Célestin',
        dialogueId: 'npc-pretre',
      },
    ],
  },
  {
    key: 'mairie',
    name: 'Ramees — Mairie',
    doorX: 0.656, doorY: 0.410,
    lights: [
      { x: 0.20, y: 0.12, r: 40, color: 0xffcc77 },
      { x: 0.80, y: 0.12, r: 40, color: 0xffcc77 },
      { x: 0.50, y: 0.10, r: 34, color: 0xcc99ff },   // bannière
    ],
    walkable: [
      { x: 0.05, y: 0.55, w: 0.90, h: 0.38 },
      { x: 0.05, y: 0.30, w: 0.20, h: 0.30 },
      { x: 0.75, y: 0.30, w: 0.20, h: 0.30 },
    ],
    interactables: [
      {
        type: 'npc', id: 'npc-greffiere', x: 0.50, y: 0.38,
        spriteKey: 'npc-greffiere', name: 'Greffière Ordonna', label: '💬 Parler à la greffière',
        dialogueId: 'npc-greffiere',
      },
    ],
  },
  {
    key: 'forge',
    name: 'Ramees — Forge de Bragnar',
    doorX: 0.215, doorY: 0.405,
    lights: [
      { x: 0.74, y: 0.18, r: 65, color: 0xff8833 },   // fourneau
      { x: 0.53, y: 0.48, r: 30, color: 0xff9944 },
    ],
    walkable: [
      { x: 0.05, y: 0.36, w: 0.90, h: 0.56 },
    ],
    interactables: [
      {
        type: 'npc', id: 'npc-forgeron', x: 0.62, y: 0.50,
        spriteKey: 'npc-forgeron', name: 'Bragnar', label: '💬 Parler à Bragnar',
        dialogueId: 'npc-forgeron', flip: true,
      },
    ],
  },
  {
    key: 'herboristerie',
    name: 'Ramees — Herboristerie de Steven',
    doorX: 0.887, doorY: 0.590,
    lights: [
      { x: 0.77, y: 0.12, r: 40, color: 0xccffaa },
      { x: 0.50, y: 0.48, r: 30, color: 0xaaffcc },
    ],
    walkable: [
      { x: 0.05, y: 0.36, w: 0.90, h: 0.56 },
    ],
    interactables: [
      {
        type: 'npc', id: 'npc-steven', x: 0.42, y: 0.58,
        spriteKey: 'npc-steven', name: 'Steven', label: '💬 Parler à Steven',
        dialogueId: 'npc-steven',
        gives: [{ itemId: 'dossierDeSoin', count: 2 }],
      },
    ],
  },
  {
    key: 'echoppe',
    name: 'Ramees — Échoppe de Clemodin',
    doorX: 0.215, doorY: 0.590,
    lights: [
      { x: 0.13, y: 0.12, r: 38, color: 0xffcc77 },
      { x: 0.42, y: 0.42, r: 30, color: 0xffe6a0 },
    ],
    walkable: [
      { x: 0.05, y: 0.52, w: 0.90, h: 0.40 },
      { x: 0.05, y: 0.32, w: 0.14, h: 0.30 },
    ],
    interactables: [
      {
        type: 'npc', id: 'npc-clemodin', x: 0.40, y: 0.40,
        spriteKey: 'npc-clemodin', name: 'Clemodin', label: '💬 Parler à Clemodin',
        dialogueId: 'npc-clemodin',
        gives: [{ itemId: 'formulaireA38', count: 1 }],
      },
    ],
  },
  {
    key: 'quenticast',
    name: 'Ramees — Chez Quenticast',
    doorX: 0.797, doorY: 0.715,
    lights: [
      { x: 0.55, y: 0.32, r: 45, color: 0x66bbff },   // écrans arcaniques
      { x: 0.78, y: 0.38, r: 26, color: 0x66ffaa },
    ],
    walkable: [
      { x: 0.05, y: 0.52, w: 0.90, h: 0.40 },
      { x: 0.30, y: 0.34, w: 0.30, h: 0.30 },
    ],
    interactables: [
      {
        type: 'npc', id: 'npc-quenticast', x: 0.55, y: 0.58,
        spriteKey: 'npc-quenticast', name: 'Quenticast', label: '💬 Parler à Quenticast',
        dialogueId: 'npc-quenticast', flip: true,
      },
    ],
  },
];

function buildInteriors(): Record<string, ExplorationMapConfig> {
  const out: Record<string, ExplorationMapConfig> = {};
  for (const spec of INTERIORS) {
    const id = `ramees-${spec.key}`;
    out[id] = {
      id,
      name: spec.name,
      imageKey: `ex-map-${id}`,
      imagePath: `assets/exploration/ramees/interiors/${spec.key}.jpg`,
      spawn: { x: 0.50, y: 0.86 },
      mood: 'city',
      ambianceColor: 0x100a14,
      depthScale: { top: 0.85, bottom: 1.05 },
      lights: spec.lights,
      lightShafts: spec.lightShafts,
      interactables: spec.interactables,
      // Couloir de porte ajouté d'office : la sortie sud doit toucher le bord.
      walkable: [...spec.walkable, { x: 0.42, y: 0.80, w: 0.16, h: 0.20 }],
      playerScale: 0.85,
      exits: {
        // Bord sud → on ressort devant la porte du bâtiment.
        south: {
          toMapId: 'ramees',
          entryX: spec.doorX,
          entryY: spec.doorY + 0.025,
          indicatorX: 0.50,
          indicatorY: 0.965,
        },
      },
    };
  }
  return out;
}

export const RAMEES_INTERIORS = buildInteriors();

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

// Groupe d'ennemis visible en patrouille (humanoïdes de la forêt)
const CAMP = (
  id: string, groupId: string, label: string, spriteKey: string,
  x: number, y: number, aggro = 80
): Interactable => ({
  type: 'battle',
  id, x, y,
  spriteKey,
  label: `⚔️ ${label}`,
  groupId,
  patrol: { dx: 0.05, dy: 0.02, ms: 2600 },
  aggroRadius: aggro,
  grounded: true,
});

const LAMBER_SCREENS: LamberScreen[] = [
  {
    x: 1, y: 1,
    name: 'Entrée',
    // Camp de bandits au NORD-OUEST, routes en Y au centre
    interactables: [
      CAMP('lamber-1-1-bandits', 'lamber-bandits-entree', 'Bandits pas discrets', 'enemy-bandit', 0.24, 0.26),
    ],
    walkable: [
      { x: 0.28, y: 0.30, w: 0.30, h: 0.65 },   // route sud → centre
      { x: 0.08, y: 0.40, w: 0.86, h: 0.22 },   // traverse est-ouest
      { x: 0.06, y: 0.08, w: 0.36, h: 0.36 },   // clairière du camp
    ],
  },
  {
    x: 1, y: 2,
    name: 'Sentier des bandits',
    // Lac à l'OUEST (infranchissable), camp à l'EST du carrefour
    interactables: [
      CAMP('lamber-1-2-bandits', 'lamber-bandits-sentier', 'Embuscade de bandits', 'enemy-bandit', 0.64, 0.24),
    ],
    walkable: [
      { x: 0.42, y: 0.04, w: 0.20, h: 0.92 },   // route nord-sud
      { x: 0.30, y: 0.40, w: 0.68, h: 0.20 },   // route est
      { x: 0.02, y: 0.58, w: 0.44, h: 0.18 },   // route ouest (sous le lac)
      { x: 0.52, y: 0.08, w: 0.28, h: 0.36 },   // clairière du camp
    ],
  },
  {
    x: 1, y: 3,
    name: 'Sentier sud',
    // Rivière à l'OUEST, route nord-sud à l'est
    walkable: [
      { x: 0.48, y: 0.04, w: 0.20, h: 0.92 },
      { x: 0.30, y: 0.42, w: 0.60, h: 0.20 },
    ],
  },
  {
    x: 1, y: 4,
    name: 'Autel des cultistes',
    // Enclos rituel à l'EST — le combat se déclenche à la cérémonie
    interactables: [
      CAMP('lamber-1-4-cultistes', 'lamber-cultistes-autel', 'Cérémonie du Grand Dormeur', 'enemy-hierophante', 0.72, 0.32, 90),
      {
        type: 'document',
        id: 'lamber-autel-pancarte',
        x: 0.60, y: 0.58,
        label: '🪧 Pancarte des cultistes',
        dialogueId: 'lamber-pancarte-cultistes',
      },
    ],
    walkable: [
      { x: 0.44, y: 0.04, w: 0.20, h: 0.60 },   // route depuis le nord
      { x: 0.20, y: 0.52, w: 0.60, h: 0.20 },   // traverse
      { x: 0.56, y: 0.14, w: 0.34, h: 0.52 },   // intérieur de l'enclos
    ],
  },
  {
    x: 2, y: 2,
    name: 'Sentier est',
    walkable: [
      { x: 0.02, y: 0.42, w: 0.96, h: 0.22 },
      { x: 0.36, y: 0.10, w: 0.22, h: 0.50 },
    ],
  },
  {
    x: 3, y: 2,
    name: 'Antre des bandits',
    // Entrée de grotte au centre, gardée
    interactables: [
      CAMP('lamber-3-2-gardes', 'donjon-bandits-garde', 'Bandits de garde', 'enemy-bandit', 0.42, 0.56, 75),
      {
        type: 'door',
        id: 'lamber-3-2-donjon',
        x: 0.615, y: 0.475,
        label: '🕳 Entrer dans le repaire des bandits',
        toMapId: 'donjon-bandits',
      },
    ],
    walkable: [
      { x: 0.02, y: 0.44, w: 0.70, h: 0.22 },
      { x: 0.36, y: 0.36, w: 0.34, h: 0.30 },
    ],
  },
  {
    x: 0, y: 2,
    name: 'Garde gobelin',
    interactables: [
      CAMP('lamber-0-2-gardes', 'lamber-gobelins-garde', 'Gardes gobelins (ils dorment debout)', 'enemy-gobelin', 0.52, 0.48, 75),
    ],
    walkable: [
      { x: 0.02, y: 0.42, w: 0.96, h: 0.22 },
      { x: 0.44, y: 0.14, w: 0.22, h: 0.44 },
    ],
  },
  {
    x: -1, y: 2,
    name: 'Repaire gobelin',
    // Forteresse d'os à l'EST, bouche de grotte en haut de l'enceinte
    interactables: [
      CAMP('lamber-m1-2-camp', 'lamber-gobelins-camp', 'Camp gobelin', 'enemy-gobelin', 0.46, 0.52, 85),
      {
        type: 'door',
        id: 'lamber-m1-2-donjon',
        x: 0.525, y: 0.295,
        label: '🕳 Entrer dans l\'antre des gobelins',
        toMapId: 'donjon-gobelins',
      },
    ],
    walkable: [
      { x: 0.30, y: 0.40, w: 0.68, h: 0.24 },
      { x: 0.38, y: 0.24, w: 0.30, h: 0.30 },
      { x: 0.60, y: 0.10, w: 0.30, h: 0.30 },
    ],
    exitIndicators: { east: { x: 0.97, y: 0.52 } },
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
// DONJONS de la Forêt de Lamber
// ============================================================

const DONJON_BANDITS: ExplorationMapConfig = {
  id: 'donjon-bandits',
  name: 'Repaire des bandits',
  imageKey: 'ex-map-donjon-bandits',
  imagePath: 'assets/exploration/donjons/repaire-bandits.jpg',
  spawn: { x: 0.50, y: 0.86 },
  ambianceColor: 0x140c08,
  depthScale: { top: 0.85, bottom: 1.05 },
  lights: [
    { x: 0.135, y: 0.24, r: 45, color: 0xff9944 },  // torches
    { x: 0.50, y: 0.24, r: 45, color: 0xff9944 },
    { x: 0.87, y: 0.24, r: 45, color: 0xff9944 },
    { x: 0.53, y: 0.72, r: 55, color: 0xffaa55 },   // feu de camp
  ],
  interactables: [
    {
      type: 'battle',
      id: 'donjon-bandits-fight-1',
      x: 0.33, y: 0.52,
      spriteKey: 'enemy-bandit',
      label: '⚔️ Bandits de garde',
      groupId: 'donjon-bandits-garde',
      patrol: { dx: 0.06, dy: 0.02, ms: 2400 },
      aggroRadius: 85,
      grounded: true,
    },
    {
      type: 'battle',
      id: 'donjon-bandits-chef',
      x: 0.72, y: 0.46,
      spriteKey: 'enemy-banditChef',
      label: '⚔️ Le Balafré, chef des bandits',
      groupId: 'donjon-bandits-chef',
      patrol: { dx: 0.03, dy: 0.02, ms: 3200 },
      aggroRadius: 70,
      grounded: true,
    },
    {
      type: 'document',
      id: 'donjon-bandits-panneau',
      x: 0.575, y: 0.38,
      label: '🪧 Panneau du repaire',
      dialogueId: 'donjon-bandits-panneau',
    },
    {
      type: 'chest',
      id: 'donjon-bandits-butin',
      x: 0.84, y: 0.50,
      label: '💰 Butin des bandits',
      items: [
        { itemId: 'encreBenite', count: 1 },
        { itemId: 'cafeDuGreffier', count: 2 },
      ],
    },
  ],
  walkable: [
    { x: 0.06, y: 0.34, w: 0.88, h: 0.56 },
    { x: 0.42, y: 0.80, w: 0.16, h: 0.20 },
  ],
  playerScale: 0.85,
  exits: {
    south: {
      toMapId: 'lamber-3-2',
      entryX: 0.615,
      entryY: 0.52,
      indicatorX: 0.50,
      indicatorY: 0.965,
    },
  },
};

const DONJON_GOBELINS: ExplorationMapConfig = {
  id: 'donjon-gobelins',
  name: 'Antre des gobelins',
  imageKey: 'ex-map-donjon-gobelins',
  imagePath: 'assets/exploration/donjons/antre-gobelins.jpg',
  spawn: { x: 0.50, y: 0.86 },
  ambianceColor: 0x0c1408,
  depthScale: { top: 0.85, bottom: 1.05 },
  lights: [
    { x: 0.10, y: 0.24, r: 45, color: 0xff9944 },
    { x: 0.90, y: 0.24, r: 45, color: 0xff9944 },
    { x: 0.52, y: 0.52, r: 55, color: 0xffaa55 },   // feu sous la marmite
  ],
  interactables: [
    {
      type: 'battle',
      id: 'donjon-gobelins-fight-1',
      x: 0.30, y: 0.58,
      spriteKey: 'enemy-gobelin',
      label: '⚔️ Meute de gobelins',
      groupId: 'donjon-gobelins-garde',
      patrol: { dx: 0.07, dy: 0.03, ms: 2000 },
      aggroRadius: 90,
      grounded: true,
    },
    {
      type: 'battle',
      id: 'donjon-gobelins-roi',
      x: 0.72, y: 0.44,
      spriteKey: 'enemy-roiGobelin',
      label: '⚔️ Sa Majesté Grokk Ier',
      groupId: 'donjon-gobelins-roi',
      patrol: { dx: 0.02, dy: 0.02, ms: 3600 },
      aggroRadius: 70,
      grounded: true,
    },
    {
      type: 'document',
      id: 'donjon-gobelins-marmite',
      x: 0.52, y: 0.50,
      label: '🍲 La marmite douteuse',
      dialogueId: 'donjon-gobelins-marmite',
    },
    {
      type: 'chest',
      id: 'donjon-gobelins-tresor',
      x: 0.72, y: 0.56,
      label: '👑 Trésor royal (des bricoles)',
      items: [
        { itemId: 'dossierDeSoin', count: 3 },
        { itemId: 'formulaireA38', count: 1 },
      ],
    },
  ],
  walkable: [
    { x: 0.06, y: 0.34, w: 0.88, h: 0.56 },
    { x: 0.42, y: 0.80, w: 0.16, h: 0.20 },
  ],
  playerScale: 0.85,
  exits: {
    south: {
      toMapId: 'lamber--1-2',
      entryX: 0.525,
      entryY: 0.33,
      indicatorX: 0.50,
      indicatorY: 0.965,
    },
  },
};

export const DONJON_MAPS: Record<string, ExplorationMapConfig> = {
  'donjon-bandits': DONJON_BANDITS,
  'donjon-gobelins': DONJON_GOBELINS,
};

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
    // Grand sol (jusqu'au bord nord pour atteindre la sortie)
    { x: 0.08, y: 0.04, w: 0.84, h: 0.58 },
    // Couloir entre les deux lanternes centrales, vers l'escalier
    { x: 0.46, y: 0.60, w: 0.12, h: 0.26 },
    // Escalier sud
    { x: 0.42, y: 0.82, w: 0.20, h: 0.16 },
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
    // Couloirs vers les sorties ouest / est (jusqu'aux bords)
    { x: 0.005, y: 0.42, w: 0.15, h: 0.20 },
    { x: 0.845, y: 0.42, w: 0.15, h: 0.20 },
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
    // Couloir vers la sortie est (jusqu'au bord)
    { x: 0.86, y: 0.44, w: 0.135, h: 0.22 },
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
    // Couloir vers la sortie ouest (jusqu'au bord)
    { x: 0.005, y: 0.44, w: 0.135, h: 0.22 },
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
  ...RAMEES_INTERIORS,
  ...ARCHIVES_MAPS,
  ...LAMBER_MAPS,
  ...DONJON_MAPS,
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
  if (id === 'donjon-bandits') return 'Repaire des bandits';
  if (id === 'donjon-gobelins') return 'Antre des gobelins';
  if (id === 'bureau') return 'Bureau des Archives Infinies';
  if (id === 'ramees' || id.startsWith('ramees-')) return 'Ramees';
  return getMap(id).name;
}
