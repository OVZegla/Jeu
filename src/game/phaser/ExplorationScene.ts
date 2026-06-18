import Phaser from 'phaser';

type Dir = 'front' | 'back' | 'left' | 'right';

export interface ExplorationSceneEvents {
  onReady?: (scene: ExplorationScene) => void;
  onNearBoss?: (near: boolean) => void;
  onEngage?: () => void;
}

const PLAYER_SPEED = 180;        // px / s
const ENGAGE_DISTANCE = 150;     // distance min joueur ↔ boss pour engager
const TARGET_STOP_DIST = 5;      // distance d'arrêt sur tap-to-move
const PLAYER_TARGET_HEIGHT = 78;  // hauteur d'affichage du sprite joueur
const BOSS_TARGET_HEIGHT = 118;   // hauteur d'affichage du sprite boss
const WALK_BOUNCE_AMPLITUDE = 4;  // px max de saut vertical pendant la marche
const WALK_BOUNCE_SPEED = 11;     // cycles par seconde du sautillement

export class ExplorationScene extends Phaser.Scene {
  private events_: ExplorationSceneEvents;
  private player!: Phaser.GameObjects.Image;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private boss!: Phaser.GameObjects.Image;
  private bossShadow!: Phaser.GameObjects.Ellipse;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D' | 'SPACE' | 'ENTER', Phaser.Input.Keyboard.Key>;
  private dir: Dir = 'front';
  private mapW = 0;
  private mapH = 0;
  private worldW = 0;
  private worldH = 0;
  private nearBoss = false;
  private moveTarget: { x: number; y: number } | null = null;
  private engaged = false;
  private prompt!: Phaser.GameObjects.Text;
  // Position logique du joueur (sans bounce visuel)
  private logicalX = 0;
  private logicalY = 0;
  private walkPhase = 0;

  constructor(events: ExplorationSceneEvents) {
    super({ key: 'ExplorationScene' });
    this.events_ = events;
  }

  preload() {
    const base = import.meta.env.BASE_URL || '/';
    this.load.image('ex-map', `${base}assets/exploration/map.jpg`);
    this.load.image('ex-boss', `${base}assets/exploration/boss.png`);
    this.load.image('ex-datpaloof-front', `${base}assets/exploration/datpaloof/front.png`);
    this.load.image('ex-datpaloof-back', `${base}assets/exploration/datpaloof/back.png`);
    this.load.image('ex-datpaloof-left', `${base}assets/exploration/datpaloof/left.png`);
    this.load.image('ex-datpaloof-right', `${base}assets/exploration/datpaloof/right.png`);
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // === Map en background ===
    // On l'affiche en "contain" pour garder le ratio.
    const bg = this.add.image(w / 2, h / 2, 'ex-map');
    const sx = w / bg.width;
    const sy = h / bg.height;
    const s = Math.min(sx, sy);  // contain (toute la map visible)
    bg.setScale(s);
    bg.setDepth(0);

    this.mapW = bg.displayWidth;
    this.mapH = bg.displayHeight;
    // Le "monde" de déplacement = la zone visible de la map
    this.worldW = this.mapW;
    this.worldH = this.mapH;
    const offsetX = (w - this.mapW) / 2;
    const offsetY = (h - this.mapH) / 2;

    // Léger voile pour faire ressortir les sprites
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.1).setDepth(1);

    // === Boss au centre de la map ===
    const bossX = offsetX + this.mapW * 0.50;
    const bossY = offsetY + this.mapH * 0.44;
    this.bossShadow = this.add.ellipse(bossX, bossY + 3, 56, 11, 0x000000, 0.5);
    this.bossShadow.setDepth(bossY - 1);
    this.boss = this.add.image(bossX, bossY, 'ex-boss');
    this.boss.setOrigin(0.5, 1);
    this.boss.setScale(BOSS_TARGET_HEIGHT / this.boss.height);
    this.boss.setDepth(bossY);

    // === Datpaloof à un coin de la map ===
    const startX = offsetX + this.mapW * 0.18;
    const startY = offsetY + this.mapH * 0.80;
    this.logicalX = startX;
    this.logicalY = startY;
    this.playerShadow = this.add.ellipse(startX, startY + 2, 38, 8, 0x000000, 0.45);
    this.playerShadow.setDepth(startY - 1);
    this.player = this.add.image(startX, startY, 'ex-datpaloof-front');
    this.player.setOrigin(0.5, 1);
    this.player.setScale(PLAYER_TARGET_HEIGHT / this.player.height);
    this.player.setDepth(startY);

    // === Input clavier ===
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      SPACE: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      ENTER: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
    };

    // === Input tap-to-move ===
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      // Si on tape sur le boss et qu'on est assez près → engage
      const distToBoss = Phaser.Math.Distance.Between(this.logicalX, this.logicalY, this.boss.x, this.boss.y);
      const tapDistToBoss = Phaser.Math.Distance.Between(p.worldX, p.worldY, this.boss.x, this.boss.y);
      if (tapDistToBoss < 70 && distToBoss < ENGAGE_DISTANCE) {
        this.tryEngage();
        return;
      }
      this.moveTarget = { x: p.worldX, y: p.worldY };
    });

    // Espace / Entrée → engage
    this.wasd.SPACE.on('down', () => this.tryEngage());
    this.wasd.ENTER.on('down', () => this.tryEngage());

    // === Prompt visuel "Engager" (Phaser texte) ===
    this.prompt = this.add.text(0, 0, '▼ ESPACE pour engager', {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
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
      alpha: { from: 0.6, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.events_.onReady?.(this);
  }

  update(_t: number, delta: number) {
    if (this.engaged) return;

    const dt = delta / 1000;
    let vx = 0, vy = 0;

    // Lecture clavier (prioritaire sur le tap-target)
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
      // Normalise et applique la vitesse à la position LOGIQUE
      const norm = Math.hypot(vx, vy);
      vx /= norm; vy /= norm;
      this.logicalX += vx * PLAYER_SPEED * dt;
      this.logicalY += vy * PLAYER_SPEED * dt;

      // Phase de marche pour le sautillement
      this.walkPhase += dt * WALK_BOUNCE_SPEED;

      // Direction du sprite selon le mouvement dominant
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
      // Arrêt : reset progressivement la phase pour que le sprite retombe
      this.walkPhase = 0;
    }

    // Clamp logique dans les bornes du monde
    const halfW = this.player.displayWidth / 2;
    const minX = (this.scale.width - this.worldW) / 2 + halfW;
    const maxX = (this.scale.width + this.worldW) / 2 - halfW;
    const minY = (this.scale.height - this.worldH) / 2 + this.player.displayHeight;
    const maxY = (this.scale.height + this.worldH) / 2;
    this.logicalX = Phaser.Math.Clamp(this.logicalX, minX, maxX);
    this.logicalY = Phaser.Math.Clamp(this.logicalY, minY, maxY);

    // === Rendu : sprite avec bounce, ombre fixée au sol ===
    // sin² (toujours positif, fréquence double = 2 pas par cycle, sensation "vrai pas")
    const bounce = moving
      ? -Math.abs(Math.sin(this.walkPhase)) * WALK_BOUNCE_AMPLITUDE
      : 0;
    this.player.x = this.logicalX;
    this.player.y = this.logicalY + bounce;
    this.playerShadow.x = this.logicalX;
    this.playerShadow.y = this.logicalY + 2;
    // L'ombre rétrécit un peu quand le perso saute
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

    // Détection proximité boss (basée sur position logique)
    const distToBoss = Phaser.Math.Distance.Between(this.logicalX, this.logicalY, this.boss.x, this.boss.y);
    const isNear = distToBoss < ENGAGE_DISTANCE;
    if (isNear !== this.nearBoss) {
      this.nearBoss = isNear;
      this.events_.onNearBoss?.(isNear);
      this.prompt.setVisible(isNear);
    }
    if (isNear) {
      this.prompt.x = this.boss.x;
      this.prompt.y = this.boss.y - this.boss.displayHeight - 14;
    }
  }

  tryEngage() {
    if (this.engaged) return;
    if (!this.nearBoss) return;
    this.engaged = true;
    // Petit zoom sur le boss avant d'engager
    this.cameras.main.flash(300, 180, 100, 255);
    this.cameras.main.shake(220, 0.01);
    this.time.delayedCall(300, () => this.events_.onEngage?.());
  }
}
