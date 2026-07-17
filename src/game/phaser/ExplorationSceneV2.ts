// ExplorationScene V2 — refonte 2.5D pixel art.
// - vraie animation de marche (frames jambes alternées) + respiration en idle
// - ancrage au sol : ombre dynamique, perspective (scale selon Y), tri par Y
// - ambiance : poussière en suspension, rais de lumière, halos, vignette
// - ennemis visibles en patrouille (aggro), save point, coffres, documents,
//   portes scellées, transition de combat mise en scène
// Remplace ExplorationScene (V1) — voir docs/PLAN_REFONTE.md.

import Phaser from 'phaser';
import type { ExitSide, Interactable, MapId, WalkableRect } from '../types';
import { getAllMapImagesToPreload, getMap } from '../../data/maps';
import { playSfx } from '../core/sfx';

type Dir = 'front' | 'back' | 'left' | 'right';

export interface WorldFlagsView {
  defeatedGroups: string[];
  collectedItems: string[];
  sealFragments: number;
  bossDefeated: boolean;
}

export interface ExplorationSceneV2Events {
  onReady?: (scene: ExplorationSceneV2) => void;
  onNearInteractable?: (label: string | null) => void;
  // Interactions gérées côté React (dialogues, save, combats…)
  onInteract?: (it: Interactable) => void;
  onAggroBattle?: (it: Extract<Interactable, { type: 'battle' }>) => void;
  // entry : position d'arrivée précise (0..1) — ex: devant la porte d'un bâtiment
  onTeleport?: (toMapId: MapId, fromSide?: ExitSide, entry?: { x: number; y: number }) => void;
}

const PLAYER_SPEED = 185;
const ENGAGE_DISTANCE = 100;
const TARGET_STOP_DIST = 5;
const PLAYER_TARGET_HEIGHT = 78;
const BOSS_TARGET_HEIGHT = 118;
const STONE_TARGET_HEIGHT = 70;
const WALK_FRAME_MS = 130;

interface InteractableVisual {
  data: Interactable;
  worldX: number;
  worldY: number;
  group: Phaser.GameObjects.GameObject[];
  patrolBase?: { x: number; y: number };
}

interface NearInfo {
  interactable: Interactable;
  worldX: number;
  worldY: number;
  spriteH: number;
}

export class ExplorationSceneV2 extends Phaser.Scene {
  private events_: ExplorationSceneV2Events;
  private mapId: MapId;
  private flags: WorldFlagsView = { defeatedGroups: [], collectedItems: [], sealFragments: 0, bossDefeated: false };

  // Joueur
  private player!: Phaser.GameObjects.Image;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private logicalX = 0;
  private logicalY = 0;
  private dir: Dir = 'front';
  private walkFrame = 0;
  private walkTimer = 0;
  private idleTime = 0;
  private wasMoving = false;
  private stepEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private lastStepSfx = 0;

  // Map
  private bg!: Phaser.GameObjects.Image;
  private veil?: Phaser.GameObjects.Rectangle;
  private moodLayer: Phaser.GameObjects.GameObject[] = [];
  private worldOffsetX = 0;
  private worldOffsetY = 0;
  private worldW = 0;
  private worldH = 0;
  private depthScale: { top: number; bottom: number } | null = null;

  // Interactables
  private interactables: InteractableVisual[] = [];
  private nearest: NearInfo | null = null;
  private prompt!: Phaser.GameObjects.Text;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D' | 'SPACE' | 'ENTER' | 'DBG', Phaser.Input.Keyboard.Key>;
  private moveTarget: { x: number; y: number } | null = null;
  private frozen = false;      // dialogues / transitions : bloque les inputs
  private switching = false;

  private walkableWorld: { x: number; y: number; w: number; h: number }[] = [];
  private playerScale = 1;
  private debugGfx: Phaser.GameObjects.Graphics | null = null;
  private debugMode = false;

  private currentExits: Partial<Record<ExitSide, import('../types').MapExit>> = {};
  private nextEntrySide: ExitSide | null = null;
  private nextEntryPoint: { x: number; y: number } | null = null;
  private exitParticles: Phaser.GameObjects.GameObject[] = [];
  private exitsLockedUntil = 0;
  private aggroLockedUntil = 0;

  constructor(events: ExplorationSceneV2Events, initialMapId: MapId) {
    super({ key: 'ExplorationSceneV2' });
    this.events_ = events;
    this.mapId = initialMapId;
  }

  setWorldFlags(flags: WorldFlagsView) {
    this.flags = flags;
  }

  preload() {
    const base = import.meta.env.BASE_URL || '/';
    for (const img of getAllMapImagesToPreload()) {
      this.load.image(img.key, `${base}${img.path}`);
    }

    // Sprites entités
    this.load.image('ex-boss-bureau', `${base}assets/exploration/bureau/boss.png`);
    this.load.image('ex-summon-stone', `${base}assets/exploration/summon_stone.png`);
    // Frames de marche du joueur (générées par scripts/gen-derived-assets.py)
    for (const d of ['front', 'back', 'left', 'right'] as Dir[]) {
      this.load.image(`ex-datpaloof-${d}`, `${base}assets/exploration/datpaloof/${d}.png`);
      for (let i = 0; i < 4; i++) {
        this.load.image(`ex-datpaloof-${d}-${i}`, `${base}assets/exploration/datpaloof/walk/${d}_${i}.png`);
      }
    }
    // PNJ (recolorations du sprite chibi — voir scripts/gen-ramees-assets.py)
    for (const n of ['quenticast', 'juiffy', 'clemodin', 'cubique', 'steven', 'pretre', 'greffiere', 'forgeron']) {
      this.load.image(`npc-${n}`, `${base}assets/sprites/npcs/${n}.png`);
    }
    // Ennemis visibles en exploration
    this.load.image('enemy-grimoire', `${base}assets/sprites/enemies/grimoire.png`);
    this.load.image('enemy-grimoire2', `${base}assets/sprites/enemies/grimoire2.png`);
    this.load.image('enemy-decret', `${base}assets/sprites/enemies/decret.png`);
    this.load.image('enemy-decret2', `${base}assets/sprites/enemies/decret2.png`);

    this.load.on('loaderror', (file: { key: string; url: string }) => {
      console.warn('[ExplorationV2] Asset manquant :', file.url);
    });
  }

  create() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      SPACE: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      ENTER: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
      DBG: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B),
    };
    this.wasd.DBG.on('down', () => this.toggleDebug());
    if (typeof window !== 'undefined' && window.location.search.includes('debug')) {
      this.debugMode = true;
    }

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.switching || this.frozen) return;
      if (this.nearest) {
        const t = this.nearest;
        const tapDist = Phaser.Math.Distance.Between(p.worldX, p.worldY, t.worldX, t.worldY);
        if (tapDist < 60) {
          this.interact();
          return;
        }
      }
      this.moveTarget = { x: p.worldX, y: p.worldY };
    });
    // NB : l'interaction clavier est pollée dans update() via JustDown
    // (les événements 'down' des Key ne sont pas fiables selon le focus).

    // Prompt
    this.prompt = this.add.text(0, 0, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: '#ffe080',
      stroke: '#000',
      strokeThickness: 5,
      fontStyle: 'bold',
    });
    this.prompt.setOrigin(0.5, 1);
    this.prompt.setDepth(99999);
    this.prompt.setVisible(false);
    this.tweens.add({
      targets: this.prompt,
      alpha: { from: 0.65, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Textures particules
    this.makeGlowTexture('p-exit-glow', 255, 220, 120);
    this.makeGlowTexture('p-dust-mote', 230, 215, 190);
    this.makeGlowTexture('p-step-dust', 180, 160, 140);
    this.makeGlowTexture('p-purple-glow', 190, 110, 255);

    // Joueur
    this.player = this.add.image(0, 0, 'ex-datpaloof-front-0');
    if (!this.player.texture || this.player.texture.key === '__MISSING') {
      this.player.setTexture('ex-datpaloof-front');
    }
    this.player.setOrigin(0.5, 1);
    this.player.setScale(PLAYER_TARGET_HEIGHT / this.player.height);
    this.playerShadow = this.add.ellipse(0, 0, 38, 8, 0x000000, 0.45);

    // Poussière de pas (suivra le joueur)
    this.stepEmitter = this.add.particles(0, 0, 'p-step-dust', {
      lifespan: 420,
      speedY: { min: -18, max: -4 },
      speedX: { min: -14, max: 14 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.35, end: 0 },
      frequency: -1, // burst manuel
    });
    this.stepEmitter.setDepth(1);

    this.loadMap(this.mapId);
    // Accès debug depuis la console (mode ?debug uniquement)
    if (this.debugMode && typeof window !== 'undefined') {
      (window as any).__exScene = this;
    }
    this.events_.onReady?.(this);
  }

  private makeGlowTexture(key: string, r: number, g: number, b: number) {
    if (this.textures.exists(key)) return;
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    const ctx = c.getContext('2d')!;
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
    grad.addColorStop(0.5, `rgba(${r},${g},${b},0.55)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    this.textures.addCanvas(key, c);
  }

  // ============================================================
  // Chargement de map
  // ============================================================

  loadMap(mapId: MapId) {
    this.mapId = mapId;
    this.switching = false;
    this.frozen = false;
    this.moveTarget = null;
    this.nearest = null;
    if (this.prompt) this.prompt.setVisible(false);

    for (const v of this.interactables) {
      for (const obj of v.group) obj.destroy();
    }
    this.interactables = [];
    if (this.bg) this.bg.destroy();
    if (this.veil) this.veil.destroy();
    for (const p of this.exitParticles) p.destroy();
    this.exitParticles = [];
    for (const m of this.moodLayer) m.destroy();
    this.moodLayer = [];

    const config = getMap(mapId);
    this.currentExits = config.exits || {};
    const w = this.scale.width;
    const h = this.scale.height;

    if (this.textures.exists(config.imageKey)) {
      this.bg = this.add.image(w / 2, h / 2, config.imageKey);
      const s = Math.min(w / this.bg.width, h / this.bg.height);
      this.bg.setScale(s);
      this.bg.setDepth(0);
      this.worldW = this.bg.displayWidth;
      this.worldH = this.bg.displayHeight;
    } else {
      this.worldW = Math.min(w, 1200);
      this.worldH = Math.min(h, 700);
      this.bg = this.add.image(w / 2, h / 2, '__MISSING__');
      const rect = this.add.rectangle(w / 2, h / 2, this.worldW, this.worldH, 0x1a1428, 1);
      rect.setStrokeStyle(2, 0xaa66ff);
      rect.setDepth(0);
      this.moodLayer.push(rect);
      const note = this.add.text(w / 2, h / 2, `${config.name}\n(map à uploader dans\npublic/${config.imagePath})`, {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#aab8c8',
        align: 'center',
        stroke: '#000',
        strokeThickness: 3,
      });
      note.setOrigin(0.5);
      note.setDepth(1);
      this.moodLayer.push(note);
    }
    this.worldOffsetX = (w - this.worldW) / 2;
    this.worldOffsetY = (h - this.worldH) / 2;
    this.depthScale = config.depthScale ?? null;

    // Voile d'ambiance
    if (config.ambianceColor) {
      this.veil = this.add.rectangle(w / 2, h / 2, w, h, config.ambianceColor, 0.25);
      this.veil.setDepth(2);
    } else {
      this.veil = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.1);
      this.veil.setDepth(2);
    }

    this.walkableWorld = (config.walkable || []).map((z: WalkableRect) => ({
      x: this.worldOffsetX + this.worldW * z.x,
      y: this.worldOffsetY + this.worldH * z.y,
      w: this.worldW * z.w,
      h: this.worldH * z.h,
    }));

    this.playerScale = config.playerScale ?? 1;
    this.applyPlayerTexture();

    // Spawn
    if (this.nextEntryPoint) {
      this.logicalX = this.worldOffsetX + this.worldW * this.nextEntryPoint.x;
      this.logicalY = this.worldOffsetY + this.worldH * this.nextEntryPoint.y;
      this.nextEntryPoint = null;
      this.nextEntrySide = null;
    } else if (this.nextEntrySide) {
      const margin = 60;
      switch (this.nextEntrySide) {
        case 'north':
          this.logicalX = this.worldOffsetX + this.worldW * 0.5;
          this.logicalY = this.worldOffsetY + margin;
          break;
        case 'south':
          this.logicalX = this.worldOffsetX + this.worldW * 0.5;
          this.logicalY = this.worldOffsetY + this.worldH - margin;
          break;
        case 'west':
          this.logicalX = this.worldOffsetX + margin;
          this.logicalY = this.worldOffsetY + this.worldH * 0.5;
          break;
        case 'east':
          this.logicalX = this.worldOffsetX + this.worldW - margin;
          this.logicalY = this.worldOffsetY + this.worldH * 0.5;
          break;
      }
      this.nextEntrySide = null;
    } else {
      this.logicalX = this.worldOffsetX + this.worldW * config.spawn.x;
      this.logicalY = this.worldOffsetY + this.worldH * config.spawn.y;
    }
    this.snapToWalkable();

    // Interactables (filtrés par la progression)
    for (const it of config.interactables) {
      if (!this.shouldSpawn(it)) continue;
      const worldX = this.worldOffsetX + this.worldW * it.x;
      const worldY = this.worldOffsetY + this.worldH * it.y;
      const group = this.spawnInteractable(it, worldX, worldY);
      this.interactables.push({ data: it, worldX, worldY, group, patrolBase: { x: worldX, y: worldY } });
    }

    // Caméra
    this.cameras.main.setBounds(
      this.worldOffsetX - 80,
      this.worldOffsetY - 80,
      this.worldW + 160,
      this.worldH + 160,
    );
    const xFollows = this.worldW > w;
    const yFollows = this.worldH > h;
    if (xFollows || yFollows) {
      this.cameras.main.startFollow(this.player, true, xFollows ? 0.1 : 0, yFollows ? 0.1 : 0);
      if (!xFollows) this.cameras.main.scrollX = (this.worldOffsetX + this.worldW / 2) - w / 2;
      if (!yFollows) this.cameras.main.scrollY = (this.worldOffsetY + this.worldH / 2) - h / 2;
    } else {
      this.cameras.main.stopFollow();
      this.cameras.main.centerOn(this.worldOffsetX + this.worldW / 2, this.worldOffsetY + this.worldH / 2);
    }
    this.cameras.main.setZoom(1);

    // Ambiance 2.5D
    this.spawnMood(config);
    this.spawnExitIndicators();
    this.renderDebug();
  }

  // Un interactable déjà « consommé » ne réapparaît pas.
  private shouldSpawn(it: Interactable): boolean {
    if (it.type === 'battle' && this.flags.defeatedGroups.includes(it.id)) return false;
    if (it.type === 'boss' && this.flags.bossDefeated && it.id === 'champion') return false;
    if (it.type === 'chest' && this.flags.collectedItems.includes(it.id)) return false;
    return true;
  }

  // ============================================================
  // Ambiance : poussière, rais de lumière, halos, vignette
  // ============================================================

  private spawnMood(config: ReturnType<typeof getMap>) {
    const w = this.scale.width;
    const h = this.scale.height;

    // Vignette écran (profondeur)
    if (!this.textures.exists('ex-vignette')) {
      const c = document.createElement('canvas');
      c.width = 320; c.height = 180;
      const ctx = c.getContext('2d')!;
      const g = ctx.createRadialGradient(160, 90, 70, 160, 90, 200);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 320, 180);
      this.textures.addCanvas('ex-vignette', c);
    }
    const vig = this.add.image(w / 2, h / 2, 'ex-vignette');
    vig.setDisplaySize(w, h);
    vig.setDepth(90000);
    vig.setScrollFactor(0);
    this.moodLayer.push(vig);

    // Halos de lampes (positions déclarées dans la map)
    for (const l of config.lights ?? []) {
      const wx = this.worldOffsetX + this.worldW * l.x;
      const wy = this.worldOffsetY + this.worldH * l.y;
      const halo = this.add.ellipse(wx, wy, l.r * 2, l.r * 1.5, l.color, 0.13);
      halo.setBlendMode(Phaser.BlendModes.ADD);
      halo.setDepth(3);
      this.tweens.add({
        targets: halo,
        alpha: { from: 0.75, to: 1 },
        scale: { from: 0.92, to: 1.08 },
        duration: 1200 + Math.random() * 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.moodLayer.push(halo);
      // Petites particules magiques qui montent des lampes
      const e = this.add.particles(wx, wy, 'p-purple-glow', {
        lifespan: 2200,
        speedY: { min: -22, max: -8 },
        speedX: { min: -6, max: 6 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.5, end: 0 },
        frequency: 500,
        blendMode: 'ADD',
        tint: l.color,
      });
      e.setDepth(4);
      this.moodLayer.push(e);
    }

    // Rais de lumière volumétriques
    for (const shaft of config.lightShafts ?? []) {
      const sx = this.worldOffsetX + this.worldW * shaft.x;
      const sw = this.worldW * shaft.width;
      if (!this.textures.exists('ex-shaft')) {
        const c = document.createElement('canvas');
        c.width = 64; c.height = 256;
        const ctx = c.getContext('2d')!;
        const g = ctx.createLinearGradient(0, 0, 0, 256);
        g.addColorStop(0, 'rgba(255,240,200,0.30)');
        g.addColorStop(0.7, 'rgba(255,240,200,0.10)');
        g.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.fillStyle = g;
        // Trapèze : plus étroit en haut
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(42, 0);
        ctx.lineTo(64, 256);
        ctx.lineTo(0, 256);
        ctx.closePath();
        ctx.fill();
        this.textures.addCanvas('ex-shaft', c);
      }
      const img = this.add.image(sx, this.worldOffsetY, 'ex-shaft');
      img.setOrigin(0.5, 0);
      img.setDisplaySize(sw, this.worldH * 0.85);
      img.setBlendMode(Phaser.BlendModes.ADD);
      img.setAngle(shaft.tilt ?? 6);
      img.setDepth(5);
      img.setAlpha(0.8);
      this.tweens.add({
        targets: img,
        alpha: { from: 0.55, to: 0.95 },
        duration: 2600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.moodLayer.push(img);
      // Poussière dans le rai
      const e = this.add.particles(0, 0, 'p-dust-mote', {
        x: { min: sx - sw / 2, max: sx + sw / 2 },
        y: { min: this.worldOffsetY + 30, max: this.worldOffsetY + this.worldH * 0.8 },
        lifespan: 5000,
        speedY: { min: 4, max: 14 },
        speedX: { min: -4, max: 4 },
        scale: { start: 0.35, end: 0.05 },
        alpha: { start: 0.55, end: 0 },
        frequency: 220,
        blendMode: 'ADD',
      });
      e.setDepth(6);
      this.moodLayer.push(e);
    }

    // Poussière ambiante générale (mood archives / forest)
    if (config.mood === 'archives' || config.mood === 'forest') {
      const e = this.add.particles(0, 0, 'p-dust-mote', {
        x: { min: this.worldOffsetX, max: this.worldOffsetX + this.worldW },
        y: { min: this.worldOffsetY, max: this.worldOffsetY + this.worldH },
        lifespan: 6000,
        speedY: { min: -8, max: 8 },
        speedX: { min: -6, max: 6 },
        scale: { start: 0.28, end: 0.04 },
        alpha: { start: 0.30, end: 0 },
        frequency: 260,
        blendMode: 'ADD',
      });
      e.setDepth(6);
      this.moodLayer.push(e);
    }
  }

  // ============================================================
  // Interactables
  // ============================================================

  private spawnInteractable(it: Interactable, x: number, y: number): Phaser.GameObjects.GameObject[] {
    const group: Phaser.GameObjects.GameObject[] = [];

    switch (it.type) {
      case 'boss': {
        if (it.spriteKey.startsWith('__')) return group;
        if (this.textures.exists(it.spriteKey)) {
          const shadow = this.add.ellipse(x, y + 3, 56, 11, 0x000000, 0.5);
          shadow.setDepth(y - 1);
          group.push(shadow);
          const sprite = this.add.image(x, y, it.spriteKey);
          sprite.setOrigin(0.5, 1);
          sprite.setScale(BOSS_TARGET_HEIGHT / sprite.height);
          sprite.setDepth(y);
          group.push(sprite);
          // Respiration menaçante + aura violette
          this.tweens.add({
            targets: sprite,
            scaleY: sprite.scaleY * 1.015,
            duration: 1400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
          const aura = this.add.particles(x, y - BOSS_TARGET_HEIGHT * 0.6, 'p-purple-glow', {
            lifespan: 1600,
            speedY: { min: -30, max: -10 },
            speedX: { min: -18, max: 18 },
            scale: { start: 0.7, end: 0 },
            alpha: { start: 0.55, end: 0 },
            frequency: 140,
            blendMode: 'ADD',
          });
          aura.setDepth(y + 1);
          group.push(aura);
        } else {
          const placeholder = this.add.rectangle(x, y - 50, 70, 100, 0x4a1a4a, 0.7);
          placeholder.setStrokeStyle(2, 0xaa66ff);
          placeholder.setDepth(y);
          group.push(placeholder);
        }
        break;
      }
      case 'battle': {
        // Ennemi visible flottant + patrouille
        const shadow = this.add.ellipse(x, y + 2, 42, 9, 0x000000, 0.45);
        shadow.setDepth(y - 1);
        group.push(shadow);
        let sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
        if (this.textures.exists(it.spriteKey)) {
          const img = this.add.image(x, y - 8, it.spriteKey);
          img.setOrigin(0.5, 1);
          img.setScale((64 * Math.max(0.5, this.playerScale)) / img.height);
          sprite = img;
        } else {
          sprite = this.add.rectangle(x, y - 40, 40, 56, 0x4a1a4a, 0.8);
          (sprite as Phaser.GameObjects.Rectangle).setStrokeStyle(2, 0xaa66ff);
        }
        sprite.setDepth(y);
        group.push(sprite);
        // Lévitation + flammes violettes
        this.tweens.add({
          targets: sprite,
          y: y - 18,
          duration: 1400 + Math.random() * 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        const flames = this.add.particles(x, y - 30, 'p-purple-glow', {
          lifespan: 900,
          speedY: { min: -26, max: -10 },
          speedX: { min: -8, max: 8 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 0.6, end: 0 },
          frequency: 180,
          blendMode: 'ADD',
        });
        flames.setDepth(y + 1);
        group.push(flames);
        // Patrouille : tout le groupe se déplace en aller-retour
        if (it.patrol) {
          const dx = this.worldW * it.patrol.dx;
          const dy = this.worldH * it.patrol.dy;
          for (const obj of [shadow, sprite, flames]) {
            this.tweens.add({
              targets: obj,
              x: `+=${dx}`,
              duration: it.patrol.ms,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            });
            this.tweens.add({
              targets: obj,
              y: `+=${dy * 0.5}`,
              duration: it.patrol.ms * 0.7,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            });
          }
        }
        break;
      }
      case 'npc': {
        // PNJ : même échelle que le joueur sur cette map.
        const npcH = PLAYER_TARGET_HEIGHT * this.playerScale * 0.96;
        const shadow = this.add.ellipse(x, y + 2, 34 * this.playerScale, 7 * this.playerScale, 0x000000, 0.45);
        shadow.setDepth(y - 1);
        group.push(shadow);
        if (this.textures.exists(it.spriteKey)) {
          const sprite = this.add.image(x, y, it.spriteKey);
          sprite.setOrigin(0.5, 1);
          sprite.setScale(npcH / sprite.height);
          if (it.flip) sprite.setFlipX(true);
          sprite.setDepth(y);
          group.push(sprite);
          // Respiration
          this.tweens.add({
            targets: sprite,
            scaleY: sprite.scaleY * 1.012,
            duration: 1200 + Math.random() * 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        } else {
          const ph = this.add.rectangle(x, y - npcH / 2, npcH * 0.5, npcH, 0x335577, 0.8);
          ph.setStrokeStyle(2, 0x88aacc);
          ph.setDepth(y);
          group.push(ph);
        }
        // Nom au-dessus de la tête (discret)
        const nameTag = this.add.text(x, y - npcH - 6, it.name, {
          fontFamily: 'Georgia, serif',
          fontSize: `${Math.max(11, Math.round(13 * this.playerScale + 4))}px`,
          color: '#cfe0ff',
          stroke: '#000',
          strokeThickness: 3,
        });
        nameTag.setOrigin(0.5, 1);
        nameTag.setDepth(y + 2);
        nameTag.setAlpha(0.9);
        group.push(nameTag);
        break;
      }
      case 'savepoint': {
        const stone = this.spawnSummonStone(x, y, 0x66ffcc);
        group.push(...stone);
        break;
      }
      case 'document': {
        // Page lumineuse discrète sur un support
        const page = this.add.rectangle(x, y - 14, 18, 22, 0xf0e6c8, 0.95);
        page.setStrokeStyle(1, 0x998866);
        page.setDepth(y);
        page.setAngle(-6);
        group.push(page);
        const lines = this.add.graphics();
        lines.setDepth(y + 0.1);
        lines.lineStyle(1, 0x776655, 0.8);
        for (let i = 0; i < 4; i++) {
          lines.lineBetween(x - 6, y - 22 + i * 4, x + 6, y - 22 + i * 4);
        }
        group.push(lines);
        const glow = this.add.ellipse(x, y - 12, 40, 40, 0xffe6a0, 0.12);
        glow.setBlendMode(Phaser.BlendModes.ADD);
        glow.setDepth(y - 0.5);
        this.tweens.add({
          targets: glow,
          alpha: { from: 0.6, to: 1 },
          scale: { from: 0.9, to: 1.1 },
          duration: 1100,
          yoyo: true,
          repeat: -1,
        });
        group.push(glow);
        break;
      }
      case 'chest': {
        if (it.hidden) {
          // Secret : simple étincelle discrète
          const spark = this.add.particles(x, y - 8, 'p-exit-glow', {
            lifespan: 1200,
            speedY: { min: -14, max: -4 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 0.5, end: 0 },
            frequency: 700,
            blendMode: 'ADD',
          });
          spark.setDepth(y);
          group.push(spark);
        } else {
          // Coffret : boîte dessinée
          const box = this.add.rectangle(x, y - 10, 30, 20, 0x6a4a2a, 1);
          box.setStrokeStyle(2, 0xc8a050);
          box.setDepth(y);
          group.push(box);
          const lid = this.add.rectangle(x, y - 22, 32, 8, 0x8a6a3a, 1);
          lid.setStrokeStyle(2, 0xc8a050);
          lid.setDepth(y + 0.1);
          group.push(lid);
          const glow = this.add.ellipse(x, y - 14, 46, 40, 0xffd080, 0.13);
          glow.setBlendMode(Phaser.BlendModes.ADD);
          glow.setDepth(y - 0.5);
          this.tweens.add({
            targets: glow,
            alpha: { from: 0.6, to: 1 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
          });
          group.push(glow);
        }
        break;
      }
      case 'door': {
        const locked = it.lockedBySeal && this.flags.sealFragments < 2;
        const color = locked ? 0xaa4455 : 0x66ffcc;
        // Emblème de porte (balance)
        const ring = this.add.ellipse(x, y, 56, 24, color, 0);
        ring.setStrokeStyle(2, color, 0.85);
        ring.setDepth(y);
        this.tweens.add({
          targets: ring,
          scale: { from: 0.92, to: 1.1 },
          alpha: { from: 0.6, to: 1 },
          duration: 1200,
          yoyo: true,
          repeat: -1,
        });
        group.push(ring);
        const rune = this.add.text(x, y - 26, locked ? '🔒' : '⚖️', { fontSize: '22px' });
        rune.setOrigin(0.5);
        rune.setDepth(y + 1);
        this.tweens.add({
          targets: rune,
          y: y - 34,
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        group.push(rune);
        break;
      }
      case 'teleport':
      case 'teleportMenu': {
        const stone = this.spawnSummonStone(x, y, 0xaa66ff);
        group.push(...stone);
        break;
      }
    }
    return group;
  }

  private spawnSummonStone(x: number, y: number, color: number): Phaser.GameObjects.GameObject[] {
    const group: Phaser.GameObjects.GameObject[] = [];
    // La pierre suit l'échelle de la map (petite sur les maps « zoom arrière »)
    const stoneH = Math.max(34, STONE_TARGET_HEIGHT * this.playerScale * 1.1);
    if (this.textures.exists('ex-summon-stone')) {
      const shadow = this.add.ellipse(x, y + 3, stoneH * 0.7, stoneH * 0.14, 0x000000, 0.5);
      shadow.setDepth(y - 1);
      group.push(shadow);
      const sprite = this.add.image(x, y, 'ex-summon-stone');
      sprite.setOrigin(0.5, 1);
      sprite.setScale(stoneH / sprite.height);
      sprite.setDepth(y);
      if (color !== 0xaa66ff) sprite.setTint(0xbbffdd);
      group.push(sprite);
      const halo = this.add.ellipse(x, y - stoneH / 2, stoneH, stoneH, color, 0.18);
      halo.setDepth(y - 0.5);
      halo.setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: halo,
        scale: { from: 0.85, to: 1.15 },
        alpha: { from: 0.15, to: 0.35 },
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      group.push(halo);
    } else {
      const ring = this.add.ellipse(x, y, 70, 28, color, 0);
      ring.setStrokeStyle(2, color, 0.85);
      ring.setDepth(y - 0.5);
      this.tweens.add({
        targets: ring,
        scale: { from: 0.9, to: 1.15 },
        alpha: { from: 0.6, to: 1 },
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      group.push(ring);
      const crystal = this.add.polygon(x, y - 30, [0, -20, 12, -5, 8, 18, -8, 18, -12, -5], 0x6644aa, 0.85);
      crystal.setStrokeStyle(2, color);
      crystal.setDepth(y + 1);
      this.tweens.add({ targets: crystal, y: y - 40, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: crystal, angle: 360, duration: 8000, repeat: -1, ease: 'Linear' });
      group.push(crystal);
    }
    return group;
  }

  // ============================================================
  // Update loop
  // ============================================================

  private applyPlayerTexture() {
    const frameKey = `ex-datpaloof-${this.dir}-${this.walkFrame}`;
    const fallback = `ex-datpaloof-${this.dir}`;
    const key = this.textures.exists(frameKey) ? frameKey : fallback;
    if (this.player.texture.key !== key) {
      this.player.setTexture(key);
    }
    this.player.setScale((PLAYER_TARGET_HEIGHT * this.currentDepthScale()) / this.player.height);
  }

  private currentDepthScale(): number {
    let s = this.playerScale;
    if (this.depthScale && this.worldH > 0) {
      const t = Phaser.Math.Clamp((this.logicalY - this.worldOffsetY) / this.worldH, 0, 1);
      s *= Phaser.Math.Linear(this.depthScale.top, this.depthScale.bottom, t);
    }
    return s;
  }

  update(_t: number, delta: number) {
    if (this.frozen || this.switching) return;
    const dt = delta / 1000;

    // Interaction clavier (ESPACE / ENTRÉE) — pollée pour rester fiable.
    if (Phaser.Input.Keyboard.JustDown(this.wasd.SPACE) || Phaser.Input.Keyboard.JustDown(this.wasd.ENTER)) {
      this.interact();
    }

    let vx = 0, vy = 0;
    const left = this.cursors.left?.isDown || this.wasd.A.isDown;
    const right = this.cursors.right?.isDown || this.wasd.D.isDown;
    const up = this.cursors.up?.isDown || this.wasd.W.isDown;
    const down = this.cursors.down?.isDown || this.wasd.S.isDown;
    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    const keyboardActive = vx !== 0 || vy !== 0;
    if (keyboardActive) {
      this.moveTarget = null;
    } else if (this.moveTarget) {
      const dx = this.moveTarget.x - this.logicalX;
      const dy = this.moveTarget.y - this.logicalY;
      const d = Math.hypot(dx, dy);
      if (d < TARGET_STOP_DIST) {
        this.moveTarget = null;
      } else {
        vx = dx / d;
        vy = dy / d;
      }
    }

    let moving = vx !== 0 || vy !== 0;
    let actuallyMoved = false;
    if (moving) {
      const norm = Math.hypot(vx, vy);
      vx /= norm; vy /= norm;
      const dx = vx * PLAYER_SPEED * dt;
      const dy = vy * PLAYER_SPEED * dt;
      const tryX = this.logicalX + dx;
      if (this.isWalkable(tryX, this.logicalY)) {
        this.logicalX = tryX;
        actuallyMoved = true;
      }
      const tryY = this.logicalY + dy;
      if (this.isWalkable(this.logicalX, tryY)) {
        this.logicalY = tryY;
        actuallyMoved = true;
      }
      if (actuallyMoved) {
        const newDir: Dir =
          Math.abs(vx) > Math.abs(vy)
            ? (vx > 0 ? 'right' : 'left')
            : (vy > 0 ? 'front' : 'back');
        if (newDir !== this.dir) this.dir = newDir;
      } else {
        this.moveTarget = null;
      }
    }
    moving = actuallyMoved;

    // Clamp
    const halfW = this.player.displayWidth / 2;
    const minX = this.worldOffsetX + halfW;
    const maxX = this.worldOffsetX + this.worldW - halfW;
    const minY = this.worldOffsetY + this.player.displayHeight;
    const maxY = this.worldOffsetY + this.worldH;
    this.logicalX = Phaser.Math.Clamp(this.logicalX, minX, maxX);
    this.logicalY = Phaser.Math.Clamp(this.logicalY, minY, maxY);

    // === Animation de marche par frames ===
    if (moving) {
      this.idleTime = 0;
      this.walkTimer += delta;
      if (this.walkTimer >= WALK_FRAME_MS) {
        this.walkTimer = 0;
        this.walkFrame = (this.walkFrame + 1) % 4;
        // Pas : poussière + son sur les frames de contact (0 et 2)
        if (this.walkFrame === 1 || this.walkFrame === 3) {
          this.stepEmitter?.explode(3, this.logicalX, this.logicalY - 2);
          const now = this.time.now;
          if (now - this.lastStepSfx > 240) {
            this.lastStepSfx = now;
            playSfx('step');
          }
        }
      }
      if (!this.wasMoving) {
        // Départ : léger lean avant
        this.walkFrame = 1;
        this.walkTimer = 0;
        this.tweens.add({
          targets: this.player,
          angle: this.dir === 'left' ? -3 : this.dir === 'right' ? 3 : 0,
          duration: 110,
          yoyo: true,
        });
      }
    } else {
      if (this.wasMoving) {
        // Arrêt : frame neutre + petit settle
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.tweens.add({
          targets: this.player,
          scaleY: this.player.scaleY * 0.97,
          duration: 80,
          yoyo: true,
        });
      }
      this.idleTime += dt;
      this.walkFrame = 0;
    }
    this.wasMoving = moving;
    this.applyPlayerTexture();

    // Respiration en idle (léger scale Y sinusoïdal)
    if (!moving) {
      const breath = 1 + Math.sin(this.idleTime * 2.4) * 0.008;
      this.player.scaleY = this.player.scaleY * breath;
    }

    // Rendu + ombre ancrée aux pieds
    this.player.x = this.logicalX;
    this.player.y = this.logicalY;
    const ds = this.currentDepthScale();
    this.playerShadow.x = this.logicalX;
    this.playerShadow.y = this.logicalY + 2;
    // L'ombre pulse avec le cycle de marche (pied levé = ombre réduite)
    const stepShrink = moving && (this.walkFrame === 1 || this.walkFrame === 3) ? 0.86 : 1;
    this.playerShadow.scaleX = ds * stepShrink;
    this.playerShadow.scaleY = ds;
    this.playerShadow.setAlpha(0.45 * stepShrink);
    this.player.setDepth(this.logicalY + 0.6);
    this.playerShadow.setDepth(this.logicalY - 1);

    this.checkEdgeExits();
    this.checkAggro();

    // Interactable le plus proche
    let nearest: NearInfo | null = null;
    let nearestDist = Infinity;
    for (const v of this.interactables) {
      const d = Phaser.Math.Distance.Between(this.logicalX, this.logicalY, v.worldX, v.worldY);
      if (d < ENGAGE_DISTANCE && d < nearestDist) {
        nearestDist = d;
        nearest = {
          interactable: v.data,
          worldX: v.worldX,
          worldY: v.worldY,
          spriteH: v.data.type === 'boss'
            ? BOSS_TARGET_HEIGHT
            : Math.max(40, STONE_TARGET_HEIGHT * this.playerScale),
        };
      }
    }
    if (nearest?.interactable !== this.nearest?.interactable) {
      this.nearest = nearest;
      this.events_.onNearInteractable?.(nearest ? this.labelFor(nearest.interactable) : null);
      if (nearest) {
        this.prompt.setText(this.labelFor(nearest.interactable));
        this.prompt.setVisible(true);
      } else {
        this.prompt.setVisible(false);
      }
    }
    if (nearest) {
      this.prompt.x = nearest.worldX;
      this.prompt.y = nearest.worldY - nearest.spriteH - 16;
    }
  }

  private labelFor(it: Interactable): string {
    if (it.type === 'door' && it.lockedBySeal && this.flags.sealFragments < 2) {
      return `🔒 ${it.label.replace(/^🚪 /, '')} (${this.flags.sealFragments}/2 fragments)`;
    }
    return it.label;
  }

  // Auto-aggro des ennemis en patrouille
  private checkAggro() {
    if (this.time.now < this.aggroLockedUntil) return;
    for (const v of this.interactables) {
      if (v.data.type !== 'battle') continue;
      const radius = v.data.aggroRadius ?? 0;
      if (radius <= 0) continue;
      const d = Phaser.Math.Distance.Between(this.logicalX, this.logicalY, v.worldX, v.worldY);
      if (d < radius) {
        this.frozen = true;
        this.playBattleTransition(() => {
          this.events_.onAggroBattle?.(v.data as Extract<Interactable, { type: 'battle' }>);
        });
        return;
      }
    }
  }

  // ============================================================
  // Interaction
  // ============================================================

  interact() {
    if (this.frozen || this.switching || !this.nearest) return;
    const it = this.nearest.interactable;
    if (it.type === 'teleport') {
      this.switching = true;
      this.cameras.main.fadeOut(280, 0, 0, 0);
      this.time.delayedCall(300, () => this.events_.onTeleport?.(it.toMapId));
      return;
    }
    playSfx('interact');
    // Tout le reste part côté React (dialogues, combats, save, coffres, portes…)
    this.events_.onInteract?.(it);
  }

  // Gèle / dégèle les inputs (pendant un dialogue React)
  setFrozen(f: boolean) {
    this.frozen = f;
    if (f) this.moveTarget = null;
  }

  // Retire visuellement un interactable consommé (coffre ouvert, groupe vaincu)
  removeInteractable(id: string) {
    const idx = this.interactables.findIndex((v) => v.data.id === id);
    if (idx < 0) return;
    for (const obj of this.interactables[idx].group) obj.destroy();
    this.interactables.splice(idx, 1);
    if (this.nearest?.interactable.id === id) {
      this.nearest = null;
      this.prompt.setVisible(false);
      this.events_.onNearInteractable?.(null);
    }
  }

  // Rafraîchit l'état d'une porte (déverrouillée)
  refreshInteractables() {
    const config = getMap(this.mapId);
    for (const it of config.interactables) {
      if (it.type !== 'door') continue;
      const v = this.interactables.find((x) => x.data.id === it.id);
      if (!v) continue;
      for (const obj of v.group) obj.destroy();
      v.group = this.spawnInteractable(it, v.worldX, v.worldY);
    }
  }

  // Mise en scène de transition vers le combat : zoom + flash + shake + fondu.
  playBattleTransition(cb: () => void) {
    this.frozen = true;
    playSfx('special');
    const cam = this.cameras.main;
    cam.pan(this.logicalX, this.logicalY - 30, 420, 'Cubic.easeIn', true);
    this.tweens.add({
      targets: cam,
      zoom: 1.7,
      duration: 460,
      ease: 'Cubic.easeIn',
    });
    cam.flash(240, 200, 140, 255);
    cam.shake(380, 0.008);
    this.time.delayedCall(430, () => {
      cam.flash(120, 255, 255, 255);
      cam.fadeOut(220, 10, 4, 20);
    });
    this.time.delayedCall(660, cb);
  }

  triggerTeleport(toMapId: MapId) {
    if (this.switching) return;
    this.switching = true;
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.time.delayedCall(300, () => this.events_.onTeleport?.(toMapId));
  }

  applyMapSwitch(mapId: MapId, fromSide?: ExitSide, entry?: { x: number; y: number }) {
    this.nextEntrySide = fromSide || null;
    this.nextEntryPoint = entry || null;
    this.loadMap(mapId);
    this.exitsLockedUntil = this.time.now + 600;
    this.aggroLockedUntil = this.time.now + 900;
    this.cameras.main.fadeIn(280, 0, 0, 0);
  }

  // Au retour d'un combat : réactive la scène sans recharger la map complète.
  resumeFromBattle() {
    this.frozen = false;
    this.switching = false;
    this.aggroLockedUntil = this.time.now + 1200;
    this.cameras.main.setZoom(1);
    this.cameras.main.fadeIn(320, 10, 4, 20);
  }

  // ============================================================
  // Collision / debug / exits (repris de V1)
  // ============================================================

  private isWalkable(x: number, y: number): boolean {
    if (this.walkableWorld.length === 0) return true;
    for (const z of this.walkableWorld) {
      if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) return true;
    }
    return false;
  }

  private snapToWalkable() {
    if (this.walkableWorld.length === 0) return;
    if (this.isWalkable(this.logicalX, this.logicalY)) return;
    let best: { x: number; y: number; d: number } | null = null;
    for (const z of this.walkableWorld) {
      const cx = Phaser.Math.Clamp(this.logicalX, z.x, z.x + z.w);
      const cy = Phaser.Math.Clamp(this.logicalY, z.y, z.y + z.h);
      const d = Phaser.Math.Distance.Between(this.logicalX, this.logicalY, cx, cy);
      if (!best || d < best.d) best = { x: cx, y: cy, d };
    }
    if (best) { this.logicalX = best.x; this.logicalY = best.y; }
  }

  private toggleDebug() {
    this.debugMode = !this.debugMode;
    this.renderDebug();
  }

  private renderDebug() {
    if (this.debugGfx) { this.debugGfx.destroy(); this.debugGfx = null; }
    if (!this.debugMode) return;
    const g = this.add.graphics();
    g.setDepth(99998);
    g.lineStyle(2, 0x00ff66, 0.9);
    g.fillStyle(0x00ff66, 0.15);
    for (const z of this.walkableWorld) {
      g.fillRect(z.x, z.y, z.w, z.h);
      g.strokeRect(z.x, z.y, z.w, z.h);
    }
    // Rayons d'aggro
    g.lineStyle(1, 0xff5566, 0.8);
    for (const v of this.interactables) {
      if (v.data.type === 'battle' && v.data.aggroRadius) {
        g.strokeCircle(v.worldX, v.worldY, v.data.aggroRadius);
      }
    }
    this.debugGfx = g;
  }

  private checkEdgeExits() {
    if (this.switching || this.frozen) return;
    if (this.time.now < this.exitsLockedUntil) return;
    const e = this.currentExits;
    if (!e) return;
    const halfW = this.player.displayWidth / 2;
    const halfH = this.player.displayHeight / 2;
    const marginX = halfW + 10;
    const marginY = halfH + 10;
    // Nord : le clamp vertical empêche logicalY de descendre sous
    // offsetY + displayHeight (la tête reste visible) → le seuil nord doit
    // être calé sur cette limite, pas sur halfH.
    const northLimit = this.worldOffsetY + this.player.displayHeight + 12;
    let side: ExitSide | null = null;
    if (e.west && this.logicalX <= this.worldOffsetX + marginX) side = 'west';
    else if (e.east && this.logicalX >= this.worldOffsetX + this.worldW - marginX) side = 'east';
    else if (e.north && this.logicalY <= northLimit) side = 'north';
    else if (e.south && this.logicalY >= this.worldOffsetY + this.worldH - marginY) side = 'south';
    if (!side) return;
    const exit = e[side]!;
    this.triggerExit(side, exit.toMapId, exit.entryX !== undefined && exit.entryY !== undefined
      ? { x: exit.entryX, y: exit.entryY }
      : undefined);
  }

  private triggerExit(fromSide: ExitSide, toMapId: MapId, entry?: { x: number; y: number }) {
    this.switching = true;
    this.cameras.main.fadeOut(260, 0, 0, 0);
    const opposite: Record<ExitSide, ExitSide> = {
      north: 'south', south: 'north', east: 'west', west: 'east',
    };
    this.time.delayedCall(280, () => {
      this.events_.onTeleport?.(toMapId, opposite[fromSide], entry);
    });
  }

  private spawnExitIndicators() {
    const sides: ExitSide[] = ['north', 'south', 'east', 'west'];
    for (const side of sides) {
      const exit = this.currentExits[side];
      if (!exit) continue;
      const px = exit.indicatorX !== undefined ? exit.indicatorX : (side === 'east' ? 0.97 : side === 'west' ? 0.03 : 0.50);
      const py = exit.indicatorY !== undefined ? exit.indicatorY : (side === 'south' ? 0.97 : side === 'north' ? 0.03 : 0.50);
      const wx = this.worldOffsetX + this.worldW * px;
      const wy = this.worldOffsetY + this.worldH * py;

      const halo = this.add.ellipse(wx, wy, 70, 28, 0xffe080, 0.35);
      halo.setDepth(wy);
      halo.setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: halo,
        scale: { from: 0.85, to: 1.25 },
        alpha: { from: 0.25, to: 0.55 },
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.exitParticles.push(halo);

      const emitter = this.add.particles(wx, wy, 'p-exit-glow', {
        lifespan: 1400,
        speedY: { min: -50, max: -20 },
        speedX: { min: -15, max: 15 },
        scale: { start: 1.0, end: 0 },
        alpha: { start: 0.9, end: 0 },
        frequency: 110,
        blendMode: 'ADD',
        emitZone: {
          type: 'random',
          source: new Phaser.Geom.Ellipse(0, 0, 40, 14),
        } as any,
      });
      emitter.setDepth(wy + 1);
      this.exitParticles.push(emitter);

      const arrowChar = side === 'south' ? '▼' : side === 'north' ? '▲' : side === 'east' ? '▶' : '◀';
      const arrow = this.add.text(wx, wy - 22, arrowChar, {
        fontFamily: 'Georgia, serif',
        fontSize: '22px',
        color: '#ffe080',
        stroke: '#000',
        strokeThickness: 4,
      });
      arrow.setOrigin(0.5);
      arrow.setDepth(wy + 2);
      this.tweens.add({
        targets: arrow,
        alpha: { from: 0.55, to: 1 },
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.exitParticles.push(arrow);
    }
  }
}
