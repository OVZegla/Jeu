import Phaser from 'phaser';
import type { Interactable, MapId, WalkableRect } from '../types';
import { getMap } from '../../data/maps';

type Dir = 'front' | 'back' | 'left' | 'right';

export interface ExplorationSceneEvents {
  onReady?: (scene: ExplorationScene) => void;
  onNearInteractable?: (label: string | null) => void;
  onEngage?: () => void;
  onTeleport?: (toMapId: MapId) => void;
}

const PLAYER_SPEED = 180;
const ENGAGE_DISTANCE = 110;
const TARGET_STOP_DIST = 5;
const PLAYER_TARGET_HEIGHT = 78;
const BOSS_TARGET_HEIGHT = 118;
const STONE_TARGET_HEIGHT = 70;
const WALK_BOUNCE_AMPLITUDE = 4;
const WALK_BOUNCE_SPEED = 11;

interface InteractableVisual {
  data: Interactable;
  worldX: number;
  worldY: number;
  group: Phaser.GameObjects.GameObject[]; // tout ce qui appartient à cet interactable
}

interface NearInfo {
  interactable: Interactable;
  worldX: number;
  worldY: number;
  spriteH: number;
}

export class ExplorationScene extends Phaser.Scene {
  private events_: ExplorationSceneEvents;
  private mapId: MapId;

  // Joueur
  private player!: Phaser.GameObjects.Image;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private logicalX = 0;
  private logicalY = 0;
  private walkPhase = 0;
  private dir: Dir = 'front';

  // Map
  private bg!: Phaser.GameObjects.Image;
  private veil?: Phaser.GameObjects.Rectangle;
  private worldOffsetX = 0;
  private worldOffsetY = 0;
  private worldW = 0;
  private worldH = 0;

  // Interactables
  private interactables: InteractableVisual[] = [];
  private nearest: NearInfo | null = null;
  private prompt!: Phaser.GameObjects.Text;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D' | 'SPACE' | 'ENTER' | 'DBG', Phaser.Input.Keyboard.Key>;
  private moveTarget: { x: number; y: number } | null = null;
  private engaged = false;
  private switching = false;

  // Collision : walkable rects en COORDONNÉES MONDE (déjà multipliés par worldW/H + offset)
  private walkableWorld: { x: number; y: number; w: number; h: number }[] = [];
  private playerScale = 1;
  private debugGfx: Phaser.GameObjects.Graphics | null = null;
  private debugMode = false;

  // Objets procéduraux (à nettoyer entre les maps)
  private proceduralGroup: Phaser.GameObjects.GameObject[] = [];
  // Interactables créés par la génération procédurale (camps), à injecter
  // dans le tableau interactables avec ceux du config
  private pendingProceduralInteractables: Interactable[] = [];

  constructor(events: ExplorationSceneEvents, initialMapId: MapId = 'bureau') {
    super({ key: 'ExplorationScene' });
    this.events_ = events;
    this.mapId = initialMapId;
  }

  preload() {
    const base = import.meta.env.BASE_URL || '/';
    // Maps
    this.load.image('ex-map-bureau', `${base}assets/exploration/bureau/map.jpg`);
    this.load.image('ex-map-ramees', `${base}assets/exploration/ramees/map.jpg`);

    // Sprites entités
    this.load.image('ex-boss-bureau', `${base}assets/exploration/bureau/boss.png`);
    this.load.image('ex-summon-stone', `${base}assets/exploration/summon_stone.png`);
    this.load.image('ex-datpaloof-front', `${base}assets/exploration/datpaloof/front.png`);
    this.load.image('ex-datpaloof-back', `${base}assets/exploration/datpaloof/back.png`);
    this.load.image('ex-datpaloof-left', `${base}assets/exploration/datpaloof/left.png`);
    this.load.image('ex-datpaloof-right', `${base}assets/exploration/datpaloof/right.png`);

    // Tile sheets pour la génération procédurale (Lamber)
    // Si pas uploadés, on tombe sur des placeholders procéduraux.
    this.load.image('ex-lamber-ground', `${base}assets/exploration/lamber/tilesets/ground.png`);
    this.load.image('ex-lamber-trees', `${base}assets/exploration/lamber/tilesets/trees.png`);
    this.load.image('ex-lamber-camps', `${base}assets/exploration/lamber/tilesets/camps.png`);

    // Tolère silencieusement les assets manquants
    this.load.on('loaderror', (file: { key: string; url: string }) => {
      console.warn('[Exploration] Asset manquant :', file.url);
    });
  }

  create() {
    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      SPACE: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      ENTER: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
      DBG: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B), // 'B' = toggle debug walkable
    };
    this.wasd.DBG.on('down', () => this.toggleDebug());

    // Debug si présent dans l'URL
    if (typeof window !== 'undefined' && window.location.search.includes('debug')) {
      this.debugMode = true;
    }

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.switching || this.engaged) return;
      // Si on tape sur un interactable proche → interagir
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

    this.wasd.SPACE.on('down', () => this.interact());
    this.wasd.ENTER.on('down', () => this.interact());

    // Prompt visuel
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

    // Joueur (créé une seule fois, persiste entre les maps)
    this.player = this.add.image(0, 0, 'ex-datpaloof-front');
    this.player.setOrigin(0.5, 1);
    this.player.setScale(PLAYER_TARGET_HEIGHT / this.player.height);
    this.playerShadow = this.add.ellipse(0, 0, 38, 8, 0x000000, 0.45);

    // Charge la map initiale
    this.loadMap(this.mapId);

    this.events_.onReady?.(this);
  }

  // === Chargement / changement de map ===
  loadMap(mapId: MapId) {
    this.mapId = mapId;
    this.switching = false;
    this.engaged = false;
    this.moveTarget = null;
    this.nearest = null;
    if (this.prompt) this.prompt.setVisible(false);

    // Nettoie les interactables précédents
    for (const v of this.interactables) {
      for (const obj of v.group) obj.destroy();
    }
    this.interactables = [];

    // Nettoie l'ancien fond
    if (this.bg) this.bg.destroy();
    if (this.veil) this.veil.destroy();

    // Nettoie les objets procéduraux précédents
    for (const o of this.proceduralGroup) o.destroy();
    this.proceduralGroup = [];

    const config = getMap(mapId);
    const w = this.scale.width;
    const h = this.scale.height;

    // === Cas 1 : map procédurale (forêt) ===
    if (config.procedural) {
      this.generateProceduralMap(config, w, h);
    }
    // === Cas 2 : map avec image background ===
    else if (this.textures.exists(config.imageKey)) {
      this.bg = this.add.image(w / 2, h / 2, config.imageKey);
      const s = Math.min(w / this.bg.width, h / this.bg.height);
      this.bg.setScale(s);
      this.bg.setDepth(0);
      this.worldW = this.bg.displayWidth;
      this.worldH = this.bg.displayHeight;
    } else {
      // Placeholder : rectangle plein avec gradient
      this.worldW = Math.min(w, 1200);
      this.worldH = Math.min(h, 700);
      this.bg = this.add.image(w / 2, h / 2, '__MISSING__'); // sera invisible
      const rect = this.add.rectangle(w / 2, h / 2, this.worldW, this.worldH, 0x1a1428, 1);
      rect.setStrokeStyle(2, 0xaa66ff);
      rect.setDepth(0);
      // Note "Map manquante" centré
      const note = this.add.text(w / 2, h / 2, `${config.name}\n(map à uploader dans\npublic/assets/exploration/${config.id}/map.png)`, {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#aab8c8',
        align: 'center',
        stroke: '#000',
        strokeThickness: 3,
      });
      note.setOrigin(0.5);
      note.setDepth(1);
    }
    this.worldOffsetX = (w - this.worldW) / 2;
    this.worldOffsetY = (h - this.worldH) / 2;

    // Voile sombre d'ambiance (skip pour procédural — la forêt a déjà ses tons)
    if (!config.procedural) {
      if (config.ambianceColor) {
        this.veil = this.add.rectangle(w / 2, h / 2, w, h, config.ambianceColor, 0.25);
        this.veil.setDepth(1);
      } else {
        this.veil = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.1);
        this.veil.setDepth(1);
      }
    }

    // Walkable zones → coords monde
    this.walkableWorld = (config.walkable || []).map((z: WalkableRect) => ({
      x: this.worldOffsetX + this.worldW * z.x,
      y: this.worldOffsetY + this.worldH * z.y,
      w: this.worldW * z.w,
      h: this.worldH * z.h,
    }));

    // Scale joueur spécifique à la map
    this.playerScale = config.playerScale ?? 1;
    this.player.setScale((PLAYER_TARGET_HEIGHT * this.playerScale) / this.player.height);
    this.playerShadow.scaleX = this.playerScale;
    this.playerShadow.scaleY = this.playerScale;

    // Spawn du joueur (au plus près d'une walkable zone si défini)
    this.logicalX = this.worldOffsetX + this.worldW * config.spawn.x;
    this.logicalY = this.worldOffsetY + this.worldH * config.spawn.y;
    this.snapToWalkable();

    // Interactables : ceux du config + ceux générés par le procédural (camps)
    const allInteractables: Interactable[] = [
      ...config.interactables,
      ...this.pendingProceduralInteractables,
    ];
    this.pendingProceduralInteractables = [];
    for (const it of allInteractables) {
      const worldX = this.worldOffsetX + this.worldW * it.x;
      const worldY = this.worldOffsetY + this.worldH * it.y;
      const group = this.spawnInteractable(it, worldX, worldY);
      this.interactables.push({ data: it, worldX, worldY, group });
    }

    // (Re)dessine le debug si actif
    this.renderDebug();
  }

  private isWalkable(x: number, y: number): boolean {
    if (this.walkableWorld.length === 0) return true; // pas de contrainte
    for (const z of this.walkableWorld) {
      if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) return true;
    }
    return false;
  }

  // Si le spawn est hors zone, on déplace le joueur sur la zone la plus proche.
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
    this.debugGfx = g;
  }

  private spawnInteractable(it: Interactable, x: number, y: number): Phaser.GameObjects.GameObject[] {
    const group: Phaser.GameObjects.GameObject[] = [];

    if (it.type === 'boss') {
      // Spécial : si spriteKey commence par '__' (ex: '__placeholder__'),
      // le visuel est déjà géré ailleurs (camp procédural) → on ne dessine rien.
      if (it.spriteKey.startsWith('__')) {
        return group;
      }
      // Sprite boss (si dispo)
      if (this.textures.exists(it.spriteKey)) {
        const shadow = this.add.ellipse(x, y + 3, 56, 11, 0x000000, 0.5);
        shadow.setDepth(y - 1);
        group.push(shadow);
        const sprite = this.add.image(x, y, it.spriteKey);
        sprite.setOrigin(0.5, 1);
        sprite.setScale(BOSS_TARGET_HEIGHT / sprite.height);
        sprite.setDepth(y);
        group.push(sprite);
      } else {
        // Fallback : silhouette
        const placeholder = this.add.rectangle(x, y - 50, 70, 100, 0x4a1a4a, 0.7);
        placeholder.setStrokeStyle(2, 0xaa66ff);
        placeholder.setOrigin(0.5, 0.5);
        placeholder.setDepth(y);
        group.push(placeholder);
      }
    } else if (it.type === 'teleport') {
      const stone = this.spawnSummonStone(x, y);
      for (const g of stone) group.push(g);
    }

    return group;
  }

  // === Summon stone : utilise le PNG si dispo, sinon procédural pixel-art-ish ===
  private spawnSummonStone(x: number, y: number): Phaser.GameObjects.GameObject[] {
    const group: Phaser.GameObjects.GameObject[] = [];

    if (this.textures.exists('ex-summon-stone')) {
      const shadow = this.add.ellipse(x, y + 3, 50, 10, 0x000000, 0.5);
      shadow.setDepth(y - 1);
      group.push(shadow);
      const sprite = this.add.image(x, y, 'ex-summon-stone');
      sprite.setOrigin(0.5, 1);
      sprite.setScale(STONE_TARGET_HEIGHT / sprite.height);
      sprite.setDepth(y);
      group.push(sprite);
      // Halo qui pulse autour
      const halo = this.add.ellipse(x, y - STONE_TARGET_HEIGHT / 2, 70, 70, 0xaa66ff, 0.18);
      halo.setDepth(y - 0.5);
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
      // Procédural : cercle runique au sol + cristal flottant
      // Cercle runique
      const ring = this.add.ellipse(x, y, 70, 28, 0xaa66ff, 0);
      ring.setStrokeStyle(2, 0xaa66ff, 0.85);
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
      const ring2 = this.add.ellipse(x, y, 50, 20, 0xc890ff, 0);
      ring2.setStrokeStyle(2, 0xc890ff, 0.6);
      ring2.setDepth(y - 0.6);
      this.tweens.add({
        targets: ring2,
        scale: { from: 1.1, to: 0.85 },
        alpha: { from: 0.4, to: 0.8 },
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      group.push(ring2);

      // Cristal qui flotte au-dessus
      const crystal = this.add.polygon(
        x, y - 30,
        [0, -20, 12, -5, 8, 18, -8, 18, -12, -5],
        0x6644aa,
        0.85
      );
      crystal.setStrokeStyle(2, 0xc890ff);
      crystal.setDepth(y + 1);
      this.tweens.add({
        targets: crystal,
        y: y - 40,
        duration: 1600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.tweens.add({
        targets: crystal,
        angle: 360,
        duration: 8000,
        repeat: -1,
        ease: 'Linear',
      });
      group.push(crystal);
    }

    return group;
  }

  // === Boucle principale ===
  update(_t: number, delta: number) {
    if (this.engaged || this.switching) return;
    const dt = delta / 1000;

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

      // Mouvement par axe (sliding contre les murs)
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
        this.walkPhase += dt * WALK_BOUNCE_SPEED;
        const newDir: Dir =
          Math.abs(vx) > Math.abs(vy)
            ? (vx > 0 ? 'right' : 'left')
            : (vy > 0 ? 'front' : 'back');
        if (newDir !== this.dir) {
          this.dir = newDir;
          this.player.setTexture(`ex-datpaloof-${this.dir}`);
          this.player.setScale((PLAYER_TARGET_HEIGHT * this.playerScale) / this.player.height);
        }
      } else {
        // Bloqué → annule la cible pour ne pas spammer
        this.moveTarget = null;
        this.walkPhase = 0;
      }
    } else {
      this.walkPhase = 0;
    }

    // Clamp bornes monde de sécurité (toujours en complément des walkable)
    const halfW = this.player.displayWidth / 2;
    const minX = this.worldOffsetX + halfW;
    const maxX = this.worldOffsetX + this.worldW - halfW;
    const minY = this.worldOffsetY + this.player.displayHeight;
    const maxY = this.worldOffsetY + this.worldH;
    this.logicalX = Phaser.Math.Clamp(this.logicalX, minX, maxX);
    this.logicalY = Phaser.Math.Clamp(this.logicalY, minY, maxY);

    // moving est "intention de mouvement" — pour le bounce visuel on prend
    // l'état "a effectivement bougé" pour ne pas sautiller contre un mur.
    moving = actuallyMoved;

    // Rendu sprite + ombre (bounce visuel seulement sur le sprite)
    const bounce = moving ? -Math.abs(Math.sin(this.walkPhase)) * WALK_BOUNCE_AMPLITUDE : 0;
    this.player.x = this.logicalX;
    this.player.y = this.logicalY + bounce;
    this.playerShadow.x = this.logicalX;
    this.playerShadow.y = this.logicalY + 2;
    if (moving) {
      const shrink = 1 - Math.abs(bounce) / (WALK_BOUNCE_AMPLITUDE * 3);
      this.playerShadow.scaleX = this.playerScale * shrink;
      this.playerShadow.scaleY = this.playerScale;
      this.playerShadow.setAlpha(0.45 * shrink);
    } else {
      this.playerShadow.scaleX = this.playerScale;
      this.playerShadow.scaleY = this.playerScale;
      this.playerShadow.setAlpha(0.45);
    }
    this.player.setDepth(this.logicalY);
    this.playerShadow.setDepth(this.logicalY - 1);

    // Détection de l'interactable le plus proche
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
          spriteH: v.data.type === 'boss' ? BOSS_TARGET_HEIGHT : STONE_TARGET_HEIGHT,
        };
      }
    }
    if (nearest !== this.nearest) {
      this.nearest = nearest;
      this.events_.onNearInteractable?.(nearest ? nearest.interactable.label : null);
      if (nearest) {
        this.prompt.setText(nearest.interactable.label);
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

  // === Interaction (Space / Entrée / tap) ===
  interact() {
    if (this.engaged || this.switching || !this.nearest) return;
    const it = this.nearest.interactable;
    if (it.type === 'boss' && it.engages) {
      this.engaged = true;
      this.cameras.main.flash(300, 180, 100, 255);
      this.cameras.main.shake(220, 0.01);
      this.time.delayedCall(300, () => this.events_.onEngage?.());
    } else if (it.type === 'teleport') {
      this.switching = true;
      // Fondu noir, puis change de map
      this.cameras.main.fadeOut(280, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.events_.onTeleport?.(it.toMapId);
      });
    }
  }

  // Appelée depuis React après bascule de map (côté state)
  applyMapSwitch(mapId: MapId) {
    this.loadMap(mapId);
    this.cameras.main.fadeIn(280, 0, 0, 0);
  }

  // === Génération procédurale (Forêt de Lamber) ===
  private generateProceduralMap(config: import('../types').ExplorationMapConfig, viewW: number, viewH: number) {
    const proc = config.procedural!;
    this.worldW = proc.worldW;
    this.worldH = proc.worldH;
    // Si le viewport est plus grand que la map, on centre la map. Si plus petit,
    // la map peut dépasser (camera fixe, pas de scroll en V1).
    this.worldOffsetX = (viewW - this.worldW) / 2;
    this.worldOffsetY = (viewH - this.worldH) / 2;

    // Seed (déterministe si fourni, sinon random)
    let seed = proc.seed ?? Math.floor(Math.random() * 1e9);
    const rng = mulberry32(seed);

    // === Sol ===
    // Si tilesheet ground dispo → on tile avec random tiles. Sinon → gradient
    // procédural en formes Phaser.
    const ts = proc.tileSize;
    const cols = Math.ceil(this.worldW / ts);
    const rows = Math.ceil(this.worldH / ts);
    const hasGroundTiles = this.textures.exists('ex-lamber-ground');

    // Couleurs de fallback pour le sol (variations de vert/marron)
    const fallbackGround = [0x3a5a2a, 0x426a30, 0x4a6b2e, 0x5a7a36, 0x3e5826];

    if (hasGroundTiles) {
      // Découpe ground en tiles si pas déjà fait. On suppose 32x32 par tile.
      const TILE_SRC = 32;
      this.ensureSpritesheet('ex-lamber-ground', TILE_SRC, TILE_SRC);
      const tex = this.textures.get('ex-lamber-ground');
      const totalTiles = tex.frameTotal - 1; // -1 car __BASE
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const wx = this.worldOffsetX + cx * ts + ts / 2;
          const wy = this.worldOffsetY + cy * ts + ts / 2;
          const frame = Math.floor(rng() * totalTiles);
          const sprite = this.add.sprite(wx, wy, 'ex-lamber-ground', frame);
          sprite.setDisplaySize(ts, ts);
          sprite.setDepth(0);
          this.proceduralGroup.push(sprite);
        }
      }
    } else {
      // Fallback : rectangles colorés
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const wx = this.worldOffsetX + cx * ts + ts / 2;
          const wy = this.worldOffsetY + cy * ts + ts / 2;
          const c = fallbackGround[Math.floor(rng() * fallbackGround.length)];
          const r = this.add.rectangle(wx, wy, ts, ts, c, 1);
          r.setDepth(0);
          this.proceduralGroup.push(r);
        }
      }
    }

    // === Bordure de la forêt (arbres denses tout autour) ===
    // pour éviter que le joueur se sente "hors-monde"
    const borderCells = 2;
    const isBorder = (cx: number, cy: number) =>
      cx < borderCells || cy < borderCells || cx >= cols - borderCells || cy >= rows - borderCells;

    // === Arbres dispersés (densité config) ===
    const hasTreeTiles = this.textures.exists('ex-lamber-trees');
    if (hasTreeTiles) {
      this.ensureSpritesheet('ex-lamber-trees', 64, 96);
    }
    const treeFallbackPalette = [
      { trunk: 0x3a2410, canopy: 0x2e5828 },
      { trunk: 0x4a3018, canopy: 0x3a6a32 },
      { trunk: 0x2a1810, canopy: 0x255424 },
    ];

    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const inBorder = isBorder(cx, cy);
        const dens = inBorder ? 0.7 : proc.treeDensity;
        if (rng() > dens) continue;
        const wx = this.worldOffsetX + cx * ts + ts / 2 + (rng() - 0.5) * ts * 0.6;
        const wy = this.worldOffsetY + cy * ts + ts / 2 + (rng() - 0.5) * ts * 0.6;
        if (hasTreeTiles) {
          const tex = this.textures.get('ex-lamber-trees');
          const totalFrames = Math.max(1, tex.frameTotal - 1);
          const frame = Math.floor(rng() * totalFrames);
          const tr = this.add.sprite(wx, wy, 'ex-lamber-trees', frame);
          tr.setOrigin(0.5, 0.85);
          const scale = 0.9 + rng() * 0.3;
          tr.setScale(scale);
          tr.setDepth(wy);
          this.proceduralGroup.push(tr);
        } else {
          const pal = treeFallbackPalette[Math.floor(rng() * treeFallbackPalette.length)];
          const size = 22 + rng() * 16;
          const canopy = this.add.circle(wx, wy - size * 0.4, size, pal.canopy);
          canopy.setStrokeStyle(2, 0x0a1a08, 0.6);
          canopy.setDepth(wy);
          const trunk = this.add.rectangle(wx, wy + 4, 6, 14, pal.trunk);
          trunk.setDepth(wy - 0.1);
          this.proceduralGroup.push(canopy);
          this.proceduralGroup.push(trunk);
        }
      }
    }

    // === Camps de bandits / gobelins / cultistes ===
    const campTypes: Array<{ kind: 'bandits' | 'gobelins' | 'cultistes'; color: number; label: string; icon: string }> = [
      { kind: 'bandits',   color: 0xb05828, label: '⚔️ Camp de bandits',   icon: '🏕️' },
      { kind: 'gobelins',  color: 0x6aa040, label: '⚔️ Camp de gobelins',  icon: '🛖' },
      { kind: 'cultistes', color: 0xa040b0, label: '⚔️ Cultistes',          icon: '🕯️' },
    ];
    const hasCampTiles = this.textures.exists('ex-lamber-camps');
    if (hasCampTiles) {
      this.ensureSpritesheet('ex-lamber-camps', 96, 96);
    }

    // Placement sur grille en respectant un espacement minimum
    const placedCamps: { x: number; y: number }[] = [];
    const minCampDist = 350;
    let tries = 0;
    while (placedCamps.length < proc.campCount && tries < 200) {
      tries++;
      // Évite la bordure (zone des arbres) et la zone de spawn (haut)
      const x = this.worldOffsetX + this.worldW * (0.15 + rng() * 0.70);
      const y = this.worldOffsetY + this.worldH * (0.20 + rng() * 0.70);
      let ok = true;
      for (const c of placedCamps) {
        if (Phaser.Math.Distance.Between(x, y, c.x, c.y) < minCampDist) { ok = false; break; }
      }
      if (!ok) continue;
      placedCamps.push({ x, y });

      const campType = campTypes[placedCamps.length % campTypes.length];

      // Clairière : un cercle plus clair sous le camp
      const clearing = this.add.ellipse(x, y, 130, 80, 0x6a8042, 0.55);
      clearing.setDepth(0.5);
      this.proceduralGroup.push(clearing);

      // Visuel du camp
      if (hasCampTiles) {
        const tex = this.textures.get('ex-lamber-camps');
        const totalFrames = Math.max(1, tex.frameTotal - 1);
        const frame = Math.floor(rng() * totalFrames);
        const camp = this.add.sprite(x, y, 'ex-lamber-camps', frame);
        camp.setOrigin(0.5, 0.85);
        camp.setDepth(y);
        this.proceduralGroup.push(camp);
      } else {
        // Fallback : tente triangulaire + feu
        const tent = this.add.triangle(x, y, -30, 20, 30, 20, 0, -28, campType.color, 0.95);
        tent.setStrokeStyle(2, 0x1a0e08);
        tent.setDepth(y);
        this.proceduralGroup.push(tent);
        // Petit feu de camp
        const fireBase = this.add.ellipse(x + 30, y + 12, 18, 6, 0x2a1408);
        fireBase.setDepth(y);
        const flame = this.add.ellipse(x + 30, y + 4, 10, 14, 0xffa040);
        flame.setDepth(y + 0.1);
        this.tweens.add({
          targets: flame,
          scaleY: { from: 0.9, to: 1.15 },
          duration: 350,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        this.proceduralGroup.push(fireBase);
        this.proceduralGroup.push(flame);
      }

      // Étiquette texte au-dessus du camp
      const tag = this.add.text(x, y - 60, `${campType.icon} ${campType.kind}`, {
        fontFamily: 'Georgia, serif',
        fontSize: '11px',
        color: '#ffe080',
        stroke: '#000',
        strokeThickness: 3,
      });
      tag.setOrigin(0.5);
      tag.setDepth(y + 1);
      this.proceduralGroup.push(tag);

      // Injecte un interactable "combat" au centre du camp
      this.pendingProceduralInteractables.push({
        type: 'boss',
        id: `camp-${placedCamps.length}-${campType.kind}`,
        x: (x - this.worldOffsetX) / this.worldW,
        y: (y - this.worldOffsetY) / this.worldH,
        spriteKey: '__placeholder__',
        label: campType.label,
        engages: true,
      });
    }

    // Walkable : si pas défini explicitement, tout le monde de la map est marchable
    // (les arbres et camps sont visuels seulement en V1)
  }

  // Si la texture est chargée comme image plate, on la re-déclare comme spritesheet
  // avec la taille de tile donnée. Idempotent.
  private ensureSpritesheet(key: string, frameWidth: number, frameHeight: number) {
    const tex = this.textures.get(key);
    // Si déjà spritesheet (frameTotal > 1), on ne refait pas
    if (tex.frameTotal > 1) return;
    const src = tex.getSourceImage() as HTMLImageElement;
    const w = src.width;
    const h = src.height;
    // On enlève la texture image et on la recharge en spritesheet à partir du même src
    this.textures.remove(key);
    this.textures.addSpriteSheet(key, src as any, {
      frameWidth, frameHeight,
      margin: 0, spacing: 0,
      endFrame: -1,
      // dimensions calculées auto par Phaser à partir de src + frameW/H
    } as any);
    // (w*h utilisés implicitement par Phaser pour calculer les frames)
    void w; void h;
  }
}

// PRNG seedable simple (Mulberry32)
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
