import Phaser from 'phaser';
import { generateAllSprites, generateArenaBg, generateParticle, SPRITE_DIMS } from './pixelArt';

const SPRITE_SCALE = 4;
const BOSS_SCALE = 4;

interface EntityVisuals {
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
  spriteSet: ReturnType<typeof generateAllSprites>['datpaloof'];
  baseX: number;
  baseY: number;
  alive: boolean;
}

export interface BattleSceneEvents {
  onReady?: (scene: BattleScene) => void;
}

export class BattleScene extends Phaser.Scene {
  private entities: Map<string, EntityVisuals> = new Map();
  private bossEnraged = false;
  private events_: BattleSceneEvents;
  private particleColors!: {
    red: string;
    green: string;
    yellow: string;
    purple: string;
  };

  constructor(events: BattleSceneEvents) {
    super({ key: 'BattleScene' });
    this.events_ = events;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // === Décor de l'arène ===
    const bgCanvas = generateArenaBg(w, h);
    this.textures.addCanvas('arena-bg', bgCanvas);
    this.add.image(w / 2, h / 2, 'arena-bg');

    // === Particules réutilisables ===
    this.particleColors = {
      red: 'rgba(255,80,80,1)',
      green: 'rgba(120,255,140,1)',
      yellow: 'rgba(255,224,128,1)',
      purple: 'rgba(180,100,255,1)',
    };
    for (const [name, color] of Object.entries(this.particleColors)) {
      const c = generateParticle(color);
      this.textures.addCanvas(`particle-${name}`, c);
    }

    // === Génère toutes les frames de sprite ===
    const sprites = generateAllSprites();
    for (const [id, set] of Object.entries(sprites)) {
      for (const [frame, canvas] of Object.entries(set)) {
        const key = `sprite-${id}-${frame}`;
        this.textures.addCanvas(key, canvas as HTMLCanvasElement);
      }
    }

    // === Place les héros dans l'arène (en demi-cercle face au boss) ===
    const groundY = h * 0.84;
    const heroPositions: Array<{ id: string; x: number; sprites: any }> = [
      { id: 'datpaloof', x: w * 0.28, sprites: sprites.datpaloof },
      { id: 'baghaar', x: w * 0.42, sprites: sprites.baghaar },
      { id: 'zlatax', x: w * 0.56, sprites: sprites.zlatax },
    ];
    for (const p of heroPositions) {
      this.spawnEntity(p.id, p.x, groundY, p.sprites, SPRITE_SCALE, SPRITE_DIMS.CHAR_H);
    }

    // === Place le boss en hauteur derrière le bureau ===
    this.spawnEntity('champion', w * 0.72, h * 0.62, sprites.bossNormal, BOSS_SCALE, SPRITE_DIMS.BOSS_H);

    // Idle bobbing (tween infini)
    for (const [id, e] of this.entities) {
      const offset = id === 'champion' ? -8 : -4;
      this.tweens.add({
        targets: e.container,
        y: e.baseY + offset,
        duration: 1200 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.events_.onReady?.(this);
  }

  private spawnEntity(
    id: string,
    x: number,
    y: number,
    spriteSet: any,
    scale: number,
    _height: number
  ) {
    // L'origine est en bas (les pieds posés au sol)
    const sprite = this.add.image(0, 0, `sprite-${id === 'champion' ? 'bossNormal' : id}-idle`);
    sprite.setOrigin(0.5, 1);
    sprite.setScale(scale);
    (sprite.texture.source[0] as any).scaleMode = 1; // NEAREST

    // Ombre au sol
    const shadow = this.add.ellipse(0, 4, (sprite.width * scale) * 0.6, 8, 0x000000, 0.55);

    const container = this.add.container(x, y, [shadow, sprite]);
    container.setDepth(y);

    this.entities.set(id, {
      container,
      sprite,
      spriteSet,
      baseX: x,
      baseY: y,
      alive: true,
    });

    // Anime idle1 ↔ idle2
    this.time.addEvent({
      delay: 600,
      loop: true,
      callback: () => {
        if (!this.entities.get(id)?.alive) return;
        const cur = sprite.texture.key;
        const next = cur.endsWith('-idle') ? cur.replace('-idle', '-idle2') : cur.replace(/-\w+$/, '-idle');
        if (this.textures.exists(next)) sprite.setTexture(next);
      },
    });
  }

  // === API appelée par React ===

  playAttack(id: string, targetId: string) {
    const e = this.entities.get(id);
    const t = this.entities.get(targetId);
    if (!e || !t || !e.alive) return;
    const baseKey = id === 'champion' ? `sprite-${this.bossEnraged ? 'bossEnraged' : 'bossNormal'}` : `sprite-${id}`;
    e.sprite.setTexture(`${baseKey}-attack`);

    const dx = t.baseX - e.baseX;
    const lungeX = dx * 0.18;

    this.tweens.add({
      targets: e.container,
      x: e.baseX + lungeX,
      duration: 220,
      ease: 'Cubic.easeOut',
      yoyo: true,
      onComplete: () => {
        if (e.alive) e.sprite.setTexture(`${baseKey}-idle`);
      },
    });

    // Petit zoom + dégagement
    this.tweens.add({
      targets: e.container,
      scale: 1.08,
      duration: 220,
      ease: 'Cubic.easeOut',
      yoyo: true,
    });

    // Flash de l'arme
    this.cameras.main.flash(80, 240, 220, 180);
  }

  playHit(id: string, amount: number, isCrit = false) {
    const e = this.entities.get(id);
    if (!e || !e.alive) return;
    const baseKey = id === 'champion' ? `sprite-${this.bossEnraged ? 'bossEnraged' : 'bossNormal'}` : `sprite-${id}`;

    e.sprite.setTexture(`${baseKey}-hit`);
    e.sprite.setTint(0xff5555);

    // Shake du sprite
    this.tweens.add({
      targets: e.container,
      x: { from: e.baseX - 6, to: e.baseX },
      duration: 60,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        e.container.x = e.baseX;
        e.sprite.clearTint();
        if (e.alive) e.sprite.setTexture(`${baseKey}-idle`);
      },
    });

    // Particules d'impact
    this.spawnHitParticles(e.container.x, e.container.y - 30, isCrit ? 'yellow' : 'red', isCrit ? 24 : 14);

    // Chiffre flottant
    this.spawnFloatingNumber(e.container.x, e.container.y - 60, `-${amount}`, isCrit ? '#ffe080' : '#ff6666', isCrit);

    // Camera shake proportionnel
    const intensity = Math.min(0.015, amount / 8000);
    this.cameras.main.shake(180, intensity);
  }

  playHeal(id: string, amount: number) {
    const e = this.entities.get(id);
    if (!e || !e.alive) return;

    e.sprite.setTint(0x88ff99);
    this.tweens.add({
      targets: e.sprite,
      alpha: 0.6,
      duration: 200,
      yoyo: true,
      onComplete: () => {
        e.sprite.setAlpha(1);
        e.sprite.clearTint();
      },
    });

    this.spawnHealParticles(e.container.x, e.container.y - 30);
    this.spawnFloatingNumber(e.container.x, e.container.y - 60, `+${amount}`, '#88ff99');
  }

  playDeath(id: string) {
    const e = this.entities.get(id);
    if (!e) return;
    e.alive = false;
    e.sprite.setTint(0x444444);
    this.tweens.add({
      targets: e.container,
      alpha: 0.35,
      angle: 12,
      y: e.baseY + 10,
      duration: 500,
      ease: 'Cubic.easeOut',
    });
  }

  playRevive(id: string) {
    const e = this.entities.get(id);
    if (!e) return;
    e.alive = true;
    e.sprite.clearTint();
    this.tweens.add({
      targets: e.container,
      alpha: 1,
      angle: 0,
      y: e.baseY,
      duration: 300,
    });
  }

  setBossEnraged(enraged: boolean) {
    if (enraged === this.bossEnraged) return;
    this.bossEnraged = enraged;
    const e = this.entities.get('champion');
    if (!e) return;
    e.sprite.setTexture(`sprite-bossEnraged-idle`);
    // Gros flash + shake
    this.cameras.main.flash(300, 180, 100, 255);
    this.cameras.main.shake(600, 0.02);
    // Burst de particules violettes
    this.spawnHitParticles(e.container.x, e.container.y - 60, 'purple', 40);
  }

  private spawnHitParticles(x: number, y: number, kind: 'red' | 'green' | 'yellow' | 'purple', count: number) {
    const emitter = this.add.particles(x, y, `particle-${kind}`, {
      lifespan: 600,
      speed: { min: 100, max: 280 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      gravityY: 200,
      quantity: count,
      blendMode: 'ADD',
      emitting: false,
    });
    emitter.explode(count);
    this.time.delayedCall(800, () => emitter.destroy());
  }

  private spawnHealParticles(x: number, y: number) {
    const emitter = this.add.particles(x, y, 'particle-green', {
      lifespan: 1100,
      speedY: { min: -120, max: -60 },
      speedX: { min: -30, max: 30 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      quantity: 18,
      blendMode: 'ADD',
      emitting: false,
    });
    emitter.explode(18);
    this.time.delayedCall(1300, () => emitter.destroy());
  }

  private spawnFloatingNumber(x: number, y: number, text: string, color: string, big = false) {
    const t = this.add.text(x, y, text, {
      fontFamily: 'Georgia, serif',
      fontSize: big ? '36px' : '28px',
      color,
      stroke: '#000',
      strokeThickness: 4,
      fontStyle: 'bold',
    });
    t.setOrigin(0.5);
    t.setDepth(10000);

    this.tweens.add({
      targets: t,
      y: y - 70,
      alpha: { from: 1, to: 0 },
      scale: { from: big ? 1.3 : 1.0, to: big ? 1.6 : 1.2 },
      duration: 1100,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }
}
