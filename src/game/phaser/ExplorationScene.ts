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
    // Chaque tilesheet a un atlas JSON généré par scripts/build-lamber-atlas.py
    // qui définit la bounding box exacte de chaque tile (taille irrégulière).
    this.load.atlas('ex-lamber-ground',
      `${base}assets/exploration/lamber/tilesets/ground.png`,
      `${base}assets/exploration/lamber/tilesets/ground.json`);
    this.load.atlas('ex-lamber-trees',
      `${base}assets/exploration/lamber/tilesets/trees.png`,
      `${base}assets/exploration/lamber/tilesets/trees.json`);
    this.load.atlas('ex-lamber-camps',
      `${base}assets/exploration/lamber/tilesets/camps.png`,
      `${base}assets/exploration/lamber/tilesets/camps.json`);

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

    // Caméra : bornes = monde, suit le joueur avec lerp doux
    this.cameras.main.setBounds(
      this.worldOffsetX - 80,
      this.worldOffsetY - 80,
      this.worldW + 160,
      this.worldH + 160,
    );
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

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
    // +0.6 → le joueur dessine juste au-dessus des ground tiles à la même Y
    this.player.setDepth(this.logicalY + 0.6);
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

  // === Génération procédurale (Forêt de Lamber, vraie projection isométrique) ===
  private generateProceduralMap(config: import('../types').ExplorationMapConfig, viewW: number, viewH: number) {
    const proc = config.procedural!;

    // === Setup de la projection isométrique ===
    // Cellule logique (gx, gy) → écran via :
    //   sx = (gx - gy) * isoTileW/2
    //   sy = (gx + gy) * isoTileH/2
    const isoW = proc.isoTileW;
    const isoH = proc.isoTileH;
    const cols = proc.gridCols;
    const rows = proc.gridRows;

    // Bounding box de la grille en coords écran (avant offset)
    // x min = -rows * isoW/2 (coin haut, gx=0, gy=rows-1)
    // x max = cols * isoW/2 (coin bas-droite)
    // y min = 0 (coin haut, gx=0, gy=0)
    // y max = (cols + rows) * isoH/2
    // Le diamond iso s'étend de (0, rows-1) à gauche jusqu'à (cols-1, 0) à droite
    const bboxW = (cols + rows - 2) * isoW / 2 + isoW;  // + isoW pour compter la 1/2 diamond aux deux bouts
    const bboxH = (cols + rows - 2) * isoH / 2 + isoH;
    this.worldW = bboxW;
    this.worldH = bboxH;
    // offsetX positionne le point iso(0,0) — il faut que la cellule la plus à
    // gauche (gx=0, gy=rows-1) soit au bord gauche du viewport visible.
    this.worldOffsetX = (viewW - bboxW) / 2 + (rows - 1) * isoW / 2 + isoW / 2;
    this.worldOffsetY = (viewH - bboxH) / 2 + isoH / 2;

    // Fonction de conversion grille → coords écran
    const iso = (gx: number, gy: number) => ({
      x: this.worldOffsetX + (gx - gy) * isoW / 2,
      y: this.worldOffsetY + (gx + gy) * isoH / 2,
    });

    // Seed (déterministe si fourni, sinon random)
    const seed = proc.seed ?? Math.floor(Math.random() * 1e9);
    const rng = mulberry32(seed);

    // === Atlas prep ===
    const hasGround = this.textures.exists('ex-lamber-ground')
      && this.textures.get('ex-lamber-ground').frameTotal > 1;
    const hasTrees = this.textures.exists('ex-lamber-trees')
      && this.textures.get('ex-lamber-trees').frameTotal > 1;
    const hasCamps = this.textures.exists('ex-lamber-camps')
      && this.textures.get('ex-lamber-camps').frameTotal > 1;
    const groundFrames = hasGround ? this.textures.get('ex-lamber-ground').getFrameNames() : [];
    const treeFrames = hasTrees ? this.textures.get('ex-lamber-trees').getFrameNames() : [];
    const campFrames = hasCamps ? this.textures.get('ex-lamber-camps').getFrameNames() : [];

    // Catégorisation des frames de sol par row (8 rows × 8 cols, ordonnées top→bot par l'atlas)
    const G = {
      grass:    groundFrames.slice(0, 8),       // row 1 : herbe jaune claire
      grass2:   groundFrames.slice(8, 16),      // row 2 : terre sèche
      dirtMix:  groundFrames.slice(16, 24),     // row 3 : terre+herbe mêlées
      dirtDark: groundFrames.slice(24, 32),     // row 4 : terre sombre (chemins forestiers)
      cobble:   groundFrames.slice(32, 40),     // row 5 : pavés
      cobbleM:  groundFrames.slice(40, 48),     // row 6 : pavés-herbe
    };

    // Catégorisation des frames de camp
    const C = {
      tents:     campFrames.slice(0, 4),
      fires:     campFrames.slice(4, 8),
      palissade: campFrames.slice(8, 14),
      banners:   campFrames.slice(14, 18),
      crates:    campFrames.slice(18, 24),
      carts:     campFrames.slice(24, 28),
      weapons:   campFrames.slice(28, 33),
      altars:    campFrames.slice(33, 39),
      candles:   campFrames.slice(39, 43),
      skulls:    campFrames.slice(43, 51),
    };
    const pickFrame = (arr: string[]) => arr.length ? arr[Math.floor(rng() * arr.length)] : null;

    // === Plan de la map : type de cellule ===
    type CellKind = 'grass' | 'path' | 'camp' | 'spawn';
    const plan: CellKind[][] = [];
    for (let gy = 0; gy < rows; gy++) {
      const row: CellKind[] = [];
      for (let gx = 0; gx < cols; gx++) row.push('grass');
      plan.push(row);
    }

    // Zone de spawn (haut centre)
    const spawnGx = Math.floor(cols * 0.5);
    const spawnGy = Math.floor(rows * 0.08);
    for (let dy = -1; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const gx = spawnGx + dx, gy = spawnGy + dy;
      if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) plan[gy][gx] = 'spawn';
    }

    // === Camps (placement) ===
    const campTypes: Array<{ kind: 'bandits' | 'gobelins' | 'cultistes'; label: string; icon: string }> = [
      { kind: 'bandits',   label: '⚔️ Camp de bandits',   icon: '🏕️' },
      { kind: 'gobelins',  label: '⚔️ Camp de gobelins',  icon: '🛖' },
      { kind: 'cultistes', label: '⚔️ Cultistes',          icon: '🕯️' },
    ];
    type Recipe = Array<{ dx: number; dy: number; cat: keyof typeof C }>;
    const CAMP_RECIPES: Record<'bandits'|'gobelins'|'cultistes', Recipe> = {
      bandits: [
        { dx: 0, dy: 0, cat: 'tents' },
        { dx: 1, dy: 0, cat: 'fires' },
        { dx: -1, dy: 0, cat: 'palissade' },
        { dx: 0, dy: -1, cat: 'palissade' },
        { dx: -1, dy: 1, cat: 'crates' },
        { dx: 1, dy: 1, cat: 'carts' },
        { dx: 1, dy: -1, cat: 'banners' },
        { dx: -2, dy: 0, cat: 'palissade' },
      ],
      gobelins: [
        { dx: 0, dy: 0, cat: 'tents' },
        { dx: 1, dy: 0, cat: 'fires' },
        { dx: -1, dy: 0, cat: 'tents' },
        { dx: 0, dy: 1, cat: 'skulls' },
        { dx: 1, dy: -1, cat: 'banners' },
        { dx: -1, dy: 1, cat: 'palissade' },
        { dx: 0, dy: -1, cat: 'weapons' },
      ],
      cultistes: [
        { dx: 0, dy: 0, cat: 'altars' },
        { dx: 1, dy: 0, cat: 'candles' },
        { dx: -1, dy: 0, cat: 'candles' },
        { dx: 0, dy: -1, cat: 'banners' },
        { dx: 0, dy: 1, cat: 'skulls' },
        { dx: 1, dy: 1, cat: 'altars' },
        { dx: -1, dy: -1, cat: 'banners' },
        { dx: 1, dy: -1, cat: 'skulls' },
      ],
    };

    const placedCamps: Array<{ gx: number; gy: number; type: typeof campTypes[number] }> = [];
    const minCampCellDist = 8;
    let tries = 0;
    while (placedCamps.length < proc.campCount && tries < 600) {
      tries++;
      const gx = 4 + Math.floor(rng() * (cols - 8));
      const gy = 6 + Math.floor(rng() * (rows - 10));
      if (plan[gy][gx] !== 'grass') continue;
      let ok = true;
      for (const c of placedCamps) {
        if (Math.max(Math.abs(c.gx - gx), Math.abs(c.gy - gy)) < minCampCellDist) { ok = false; break; }
      }
      if (!ok) continue;
      placedCamps.push({ gx, gy, type: campTypes[placedCamps.length % campTypes.length] });
      // Marque la zone du camp (3x3 autour)
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const cx = gx + dx, cy = gy + dy;
        if (cx >= 0 && cx < cols && cy >= 0 && cy < rows) plan[cy][cx] = 'camp';
      }
    }

    // === Routes connectées : chaque camp est relié au spawn via L-shape Manhattan ===
    for (const camp of placedCamps) {
      const verticalFirst = rng() < 0.5;
      if (verticalFirst) {
        for (let y = Math.min(spawnGy, camp.gy); y <= Math.max(spawnGy, camp.gy); y++) {
          if (plan[y][spawnGx] === 'grass') plan[y][spawnGx] = 'path';
        }
        for (let x = Math.min(spawnGx, camp.gx); x <= Math.max(spawnGx, camp.gx); x++) {
          if (plan[camp.gy][x] === 'grass') plan[camp.gy][x] = 'path';
        }
      } else {
        for (let x = Math.min(spawnGx, camp.gx); x <= Math.max(spawnGx, camp.gx); x++) {
          if (plan[spawnGy][x] === 'grass') plan[spawnGy][x] = 'path';
        }
        for (let y = Math.min(spawnGy, camp.gy); y <= Math.max(spawnGy, camp.gy); y++) {
          if (plan[y][camp.gx] === 'grass') plan[y][camp.gx] = 'path';
        }
      }
    }

    // === Rendu du sol ===
    const fallbackGrass = [0x3a5a2a, 0x426a30, 0x4a6b2e, 0x5a7a36];
    const fallbackPath = [0x8a6a3a, 0x9a7a48, 0xa88858];

    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        const kind = plan[gy][gx];
        const { x, y } = iso(gx, gy);

        if (hasGround && groundFrames.length > 0) {
          let pool: string[];
          if (kind === 'path' || kind === 'camp' || kind === 'spawn') {
            pool = [...G.dirtMix, ...G.dirtDark].filter(Boolean);
            if (pool.length === 0) pool = groundFrames;
          } else {
            pool = [...G.grass, ...G.grass2].filter(Boolean);
            if (pool.length === 0) pool = groundFrames;
          }
          const frameName = pool[Math.floor(rng() * pool.length)];
          const sprite = this.add.sprite(x, y, 'ex-lamber-ground', frameName);
          sprite.setOrigin(0.5, 0.5);
          sprite.setScale(isoW / proc.groundTileW);
          sprite.setDepth(y);
          this.proceduralGroup.push(sprite);
        } else {
          const palette = (kind === 'path' || kind === 'camp') ? fallbackPath : fallbackGrass;
          const c = palette[Math.floor(rng() * palette.length)];
          const diamond = this.add.polygon(x, y, [0, -isoH/2, isoW/2, 0, 0, isoH/2, -isoW/2, 0], c, 1);
          diamond.setStrokeStyle(1, 0x1a2a14, 0.3);
          diamond.setDepth(y);
          this.proceduralGroup.push(diamond);
        }
      }
    }

    // === Arbres dispersés (uniquement sur grass) ===
    const treeFallbackPalette = [
      { trunk: 0x3a2410, canopy: 0x2e5828 },
      { trunk: 0x4a3018, canopy: 0x3a6a32 },
      { trunk: 0x2a1810, canopy: 0x255424 },
    ];
    const isBorder = (gx: number, gy: number) =>
      gx < 2 || gy < 2 || gx >= cols - 2 || gy >= rows - 2;

    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        if (plan[gy][gx] !== 'grass') continue;
        const inBorder = isBorder(gx, gy);
        const dens = inBorder ? 0.9 : proc.treeDensity;
        if (rng() > dens) continue;
        const { x, y } = iso(gx, gy);
        const jx = (rng() - 0.5) * isoW * 0.35;
        const jy = (rng() - 0.5) * isoH * 0.35;
        if (hasTrees && treeFrames.length > 0) {
          const frameName = treeFrames[Math.floor(rng() * treeFrames.length)];
          const tr = this.add.sprite(x + jx, y + jy, 'ex-lamber-trees', frameName);
          tr.setOrigin(0.5, 0.88);
          const frameW = tr.width || proc.treeTileW;
          const baseScale = (isoW * 1.0) / Math.max(80, frameW);
          const variation = 0.85 + rng() * 0.3;
          tr.setScale(baseScale * variation);
          tr.setDepth(y + jy + 0.5);
          this.proceduralGroup.push(tr);
        } else {
          const pal = treeFallbackPalette[Math.floor(rng() * treeFallbackPalette.length)];
          const size = 14 + rng() * 8;
          const canopy = this.add.circle(x + jx, y + jy - size * 0.4, size, pal.canopy);
          canopy.setStrokeStyle(2, 0x0a1a08, 0.6);
          canopy.setDepth(y + jy + 0.5);
          const trunk = this.add.rectangle(x + jx, y + jy + 4, 5, 10, pal.trunk);
          trunk.setDepth(y + jy + 0.4);
          this.proceduralGroup.push(canopy);
          this.proceduralGroup.push(trunk);
        }
      }
    }

    // === Camps composites : chaque camp = plusieurs tiles selon la recette ===
    for (let i = 0; i < placedCamps.length; i++) {
      const camp = placedCamps[i];
      const center = iso(camp.gx, camp.gy);
      const recipe = CAMP_RECIPES[camp.type.kind];

      for (const piece of recipe) {
        const pos = iso(camp.gx + piece.dx, camp.gy + piece.dy);
        const catFrames = C[piece.cat];
        if (hasCamps && catFrames && catFrames.length > 0) {
          const frameName = pickFrame(catFrames)!;
          const sprite = this.add.sprite(pos.x, pos.y, 'ex-lamber-camps', frameName);
          sprite.setOrigin(0.5, 0.85);
          const frameW = sprite.width || proc.campTileW;
          sprite.setScale((isoW * 1.1) / Math.max(80, frameW));
          sprite.setDepth(pos.y + 0.7);
          this.proceduralGroup.push(sprite);
        } else {
          // Fallback : tente colorée par catégorie
          const palette: Record<string, number> = {
            tents: 0xa04020, fires: 0xff8030, palissade: 0x6a4a2a, banners: 0x802020,
            crates: 0x8a6a3a, carts: 0x4a3018, weapons: 0x404040,
            altars: 0x5a2020, candles: 0xffd060, skulls: 0xe0e0c8,
          };
          const c = palette[piece.cat] || 0x804040;
          const tent = this.add.triangle(pos.x, pos.y, -22, 14, 22, 14, 0, -22, c, 0.95);
          tent.setStrokeStyle(2, 0x1a0e08);
          tent.setDepth(pos.y + 0.7);
          this.proceduralGroup.push(tent);
        }
      }

      // Étiquette flottante au-dessus du camp
      const tag = this.add.text(center.x, center.y - isoH * 2.2, `${camp.type.icon} ${camp.type.kind}`, {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: '#ffe080',
        stroke: '#000',
        strokeThickness: 4,
        fontStyle: 'bold',
      });
      tag.setOrigin(0.5);
      tag.setDepth(99998);
      this.proceduralGroup.push(tag);

      // Interactable de combat au centre du camp
      this.pendingProceduralInteractables.push({
        type: 'boss',
        id: `camp-${i}-${camp.type.kind}`,
        x: (center.x - this.worldOffsetX) / this.worldW,
        y: (center.y - this.worldOffsetY) / this.worldH,
        spriteKey: '__placeholder__',
        label: camp.type.label,
        engages: true,
      });
    }
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
