import Phaser from 'phaser';
import type { Interactable, MapId } from '../types';
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
  private wasd!: Record<'W' | 'A' | 'S' | 'D' | 'SPACE' | 'ENTER', Phaser.Input.Keyboard.Key>;
  private moveTarget: { x: number; y: number } | null = null;
  private engaged = false;
  private switching = false;

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
    };

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
    this.prompt.setVisible(false);

    // Nettoie les interactables précédents
    for (const v of this.interactables) {
      for (const obj of v.group) obj.destroy();
    }
    this.interactables = [];

    // Nettoie l'ancien fond
    if (this.bg) this.bg.destroy();
    if (this.veil) this.veil.destroy();

    const config = getMap(mapId);
    const w = this.scale.width;
    const h = this.scale.height;

    // Si la map n'a pas été chargée (asset manquant) → background dégradé placeholder
    if (this.textures.exists(config.imageKey)) {
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

    // Voile sombre d'ambiance
    if (config.ambianceColor) {
      this.veil = this.add.rectangle(w / 2, h / 2, w, h, config.ambianceColor, 0.25);
      this.veil.setDepth(1);
    } else {
      this.veil = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.1);
      this.veil.setDepth(1);
    }

    // Spawn du joueur
    this.logicalX = this.worldOffsetX + this.worldW * config.spawn.x;
    this.logicalY = this.worldOffsetY + this.worldH * config.spawn.y;

    // Interactables
    for (const it of config.interactables) {
      const worldX = this.worldOffsetX + this.worldW * it.x;
      const worldY = this.worldOffsetY + this.worldH * it.y;
      const group = this.spawnInteractable(it, worldX, worldY);
      this.interactables.push({ data: it, worldX, worldY, group });
    }
  }

  private spawnInteractable(it: Interactable, x: number, y: number): Phaser.GameObjects.GameObject[] {
    const group: Phaser.GameObjects.GameObject[] = [];

    if (it.type === 'boss') {
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

    const moving = vx !== 0 || vy !== 0;

    if (moving) {
      const norm = Math.hypot(vx, vy);
      vx /= norm; vy /= norm;
      this.logicalX += vx * PLAYER_SPEED * dt;
      this.logicalY += vy * PLAYER_SPEED * dt;
      this.walkPhase += dt * WALK_BOUNCE_SPEED;

      const newDir: Dir =
        Math.abs(vx) > Math.abs(vy)
          ? (vx > 0 ? 'right' : 'left')
          : (vy > 0 ? 'front' : 'back');
      if (newDir !== this.dir) {
        this.dir = newDir;
        this.player.setTexture(`ex-datpaloof-${this.dir}`);
        this.player.setScale(PLAYER_TARGET_HEIGHT / this.player.height);
      }
    } else {
      this.walkPhase = 0;
    }

    // Clamp
    const halfW = this.player.displayWidth / 2;
    const minX = this.worldOffsetX + halfW;
    const maxX = this.worldOffsetX + this.worldW - halfW;
    const minY = this.worldOffsetY + this.player.displayHeight;
    const maxY = this.worldOffsetY + this.worldH;
    this.logicalX = Phaser.Math.Clamp(this.logicalX, minX, maxX);
    this.logicalY = Phaser.Math.Clamp(this.logicalY, minY, maxY);

    // Rendu sprite + ombre (bounce visuel seulement sur le sprite)
    const bounce = moving ? -Math.abs(Math.sin(this.walkPhase)) * WALK_BOUNCE_AMPLITUDE : 0;
    this.player.x = this.logicalX;
    this.player.y = this.logicalY + bounce;
    this.playerShadow.x = this.logicalX;
    this.playerShadow.y = this.logicalY + 2;
    if (moving) {
      const shrink = 1 - Math.abs(bounce) / (WALK_BOUNCE_AMPLITUDE * 3);
      this.playerShadow.scaleX = shrink;
      this.playerShadow.setAlpha(0.45 * shrink);
    } else {
      this.playerShadow.scaleX = 1;
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
}
