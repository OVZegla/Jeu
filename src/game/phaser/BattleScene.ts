import Phaser from 'phaser';
import type { GameState } from '../types';

interface HeroVisual {
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
  nameText: Phaser.GameObjects.Text;
  hpBarBg: Phaser.GameObjects.Rectangle;
  hpBarFill: Phaser.GameObjects.Rectangle;
  hpText: Phaser.GameObjects.Text;
  mpBarBg: Phaser.GameObjects.Rectangle;
  mpBarFill: Phaser.GameObjects.Rectangle;
  mpText: Phaser.GameObjects.Text;
  baseX: number;
  baseY: number;
  alive: boolean;
  flip: boolean;
  bobTween?: Phaser.Tweens.Tween;
}

interface BossVisual {
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
  baseX: number;
  baseY: number;
  alive: boolean;
  bobTween?: Phaser.Tweens.Tween;
}

export interface BattleSceneEvents {
  onReady?: (scene: BattleScene) => void;
}

const HERO_IDS = ['datpaloof', 'baghaar', 'zlatax'] as const;
type HeroId = typeof HERO_IDS[number];

export class BattleScene extends Phaser.Scene {
  private heroes: Map<string, HeroVisual> = new Map();
  private boss!: BossVisual;
  private bossEnraged = false;
  private events_: BattleSceneEvents;
  private initialState: GameState | null = null;

  constructor(events: BattleSceneEvents) {
    super({ key: 'BattleScene' });
    this.events_ = events;
  }

  setInitialState(s: GameState) {
    this.initialState = s;
  }

  preload() {
    const base = import.meta.env.BASE_URL || '/';
    this.load.image('arena', `${base}assets/arena.jpg`);
    this.load.image('sprite-datpaloof', `${base}assets/sprites/datpaloof.png`);
    this.load.image('sprite-baghaar', `${base}assets/sprites/baghaar.png`);
    this.load.image('sprite-zlatax', `${base}assets/sprites/zlatax.png`);
    this.load.image('sprite-boss', `${base}assets/sprites/boss.png`);
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // === Background arène ===
    const bg = this.add.image(w / 2, h / 2, 'arena');
    // Couvre tout le canvas en gardant le ratio
    const sx = w / bg.width;
    const sy = h / bg.height;
    const s = Math.max(sx, sy);
    bg.setScale(s);
    bg.setDepth(0);

    // Léger voile sombre pour faire ressortir les sprites
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.15).setDepth(1);

    // Particules d'ambiance (poussière + étincelles violettes)
    this.spawnAmbience(w, h);

    // === Boss en arrière-plan, centré, sur le trône ===
    const bossY = h * 0.50;
    this.boss = this.spawnBoss(w * 0.50, bossY);

    // === 3 héros en formation au premier plan ===
    const heroY = h * 0.88;
    const positions: Array<{ id: HeroId; x: number; flip: boolean }> = [
      { id: 'datpaloof', x: w * 0.22, flip: true },  // gauche, face au boss
      { id: 'baghaar',   x: w * 0.50, flip: true },  // centre
      { id: 'zlatax',    x: w * 0.78, flip: true },  // droite
    ];
    for (const p of positions) {
      const v = this.spawnHero(p.id, p.x, heroY, p.flip);
      this.heroes.set(p.id, v);
    }

    // État initial
    if (this.initialState) {
      this.syncFromState(this.initialState, true);
      if (this.initialState.boss.enraged) this.setBossEnraged(true);
    }

    this.events_.onReady?.(this);
  }

  private spawnAmbience(w: number, h: number) {
    // Poussière dorée qui flotte
    this.add.particles(0, 0, 'sprite-boss', {
      // hack: utilise une zone, on désactive l'image via emitterFrame
      // En réalité on a besoin d'une texture de particule. Création runtime :
    });
    // Pas d'asset particule custom → générée par Canvas
    const c = document.createElement('canvas');
    c.width = 8; c.height = 8;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
    g.addColorStop(0, 'rgba(255,224,140,1)');
    g.addColorStop(1, 'rgba(255,224,140,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 8);
    this.textures.addCanvas('p-dust', c);

    const c2 = document.createElement('canvas');
    c2.width = 8; c2.height = 8;
    const ctx2 = c2.getContext('2d')!;
    const g2 = ctx2.createRadialGradient(4, 4, 0, 4, 4, 4);
    g2.addColorStop(0, 'rgba(180,100,255,1)');
    g2.addColorStop(1, 'rgba(180,100,255,0)');
    ctx2.fillStyle = g2;
    ctx2.fillRect(0, 0, 8, 8);
    this.textures.addCanvas('p-magic', c2);

    const c3 = document.createElement('canvas');
    c3.width = 8; c3.height = 8;
    const ctx3 = c3.getContext('2d')!;
    const g3 = ctx3.createRadialGradient(4, 4, 0, 4, 4, 4);
    g3.addColorStop(0, 'rgba(255,80,80,1)');
    g3.addColorStop(1, 'rgba(255,80,80,0)');
    ctx3.fillStyle = g3;
    ctx3.fillRect(0, 0, 8, 8);
    this.textures.addCanvas('p-red', c3);

    const c4 = document.createElement('canvas');
    c4.width = 8; c4.height = 8;
    const ctx4 = c4.getContext('2d')!;
    const g4 = ctx4.createRadialGradient(4, 4, 0, 4, 4, 4);
    g4.addColorStop(0, 'rgba(120,255,140,1)');
    g4.addColorStop(1, 'rgba(120,255,140,0)');
    ctx4.fillStyle = g4;
    ctx4.fillRect(0, 0, 8, 8);
    this.textures.addCanvas('p-green', c4);

    const c5 = document.createElement('canvas');
    c5.width = 8; c5.height = 8;
    const ctx5 = c5.getContext('2d')!;
    const g5 = ctx5.createRadialGradient(4, 4, 0, 4, 4, 4);
    g5.addColorStop(0, 'rgba(255,224,128,1)');
    g5.addColorStop(1, 'rgba(255,224,128,0)');
    ctx5.fillStyle = g5;
    ctx5.fillRect(0, 0, 8, 8);
    this.textures.addCanvas('p-yellow', c5);

    // Émetteur ambiance
    this.add.particles(0, 0, 'p-dust', {
      x: { min: 0, max: w },
      y: h * 0.95,
      lifespan: 6000,
      speedY: { min: -25, max: -8 },
      speedX: { min: -8, max: 8 },
      scale: { start: 0.6, end: 0.1 },
      alpha: { start: 0.6, end: 0 },
      frequency: 400,
      blendMode: 'ADD',
    }).setDepth(2);

    this.add.particles(0, 0, 'p-magic', {
      x: { min: w * 0.3, max: w * 0.7 },
      y: { min: h * 0.1, max: h * 0.5 },
      lifespan: 3000,
      speedY: { min: -30, max: -10 },
      speedX: { min: -10, max: 10 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.7, end: 0 },
      frequency: 700,
      blendMode: 'ADD',
    }).setDepth(2);
  }

  private spawnBoss(x: number, y: number): BossVisual {
    const sprite = this.add.image(0, 0, 'sprite-boss');
    sprite.setOrigin(0.5, 1);
    // Adapte la taille selon la hauteur du canvas
    const targetH = this.scale.height * 0.55;
    sprite.setScale(targetH / sprite.height);
    const shadow = this.add.ellipse(0, 0, sprite.displayWidth * 0.55, 16, 0x000000, 0.55);
    const container = this.add.container(x, y, [shadow, sprite]);
    container.setDepth(50); // sous les héros
    const v: BossVisual = { container, sprite, shadow, baseX: x, baseY: y, alive: true };
    v.bobTween = this.tweens.add({
      targets: container,
      y: y - 6,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    return v;
  }

  private spawnHero(id: HeroId, x: number, y: number, flip: boolean): HeroVisual {
    const sprite = this.add.image(0, 0, `sprite-${id}`);
    sprite.setOrigin(0.5, 1);
    const targetH = this.scale.height * 0.40;
    sprite.setScale(targetH / sprite.height);
    if (flip) sprite.setFlipX(true);

    const shadow = this.add.ellipse(0, 0, sprite.displayWidth * 0.55, 14, 0x000000, 0.55);

    // Labels & barres en dessous du sprite
    const barW = 130;
    const barY = 18;
    const nameText = this.add.text(0, barY - 18, '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: '#f0e3a8',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    const hpBarBg = this.add.rectangle(0, barY + 4, barW, 9, 0x000000, 0.85).setStrokeStyle(2, 0xf0e3a8, 1);
    const hpBarFill = this.add.rectangle(-barW / 2 + 1, barY + 4, barW - 2, 7, 0x4caf50).setOrigin(0, 0.5);
    const hpText = this.add.text(0, barY + 4, '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    const mpBarBg = this.add.rectangle(0, barY + 18, barW, 7, 0x000000, 0.85).setStrokeStyle(2, 0x88aaff, 1);
    const mpBarFill = this.add.rectangle(-barW / 2 + 1, barY + 18, barW - 2, 5, 0x4488ff).setOrigin(0, 0.5);
    const mpText = this.add.text(0, barY + 18, '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    const container = this.add.container(x, y, [
      shadow, sprite, nameText, hpBarBg, hpBarFill, hpText, mpBarBg, mpBarFill, mpText,
    ]);
    container.setDepth(100 + y); // au-dessus du boss

    const v: HeroVisual = {
      container, sprite, shadow, nameText, hpBarBg, hpBarFill, hpText,
      mpBarBg, mpBarFill, mpText,
      baseX: x, baseY: y, alive: true, flip,
    };
    v.bobTween = this.tweens.add({
      targets: container,
      y: y - 3,
      duration: 1200 + Math.random() * 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    return v;
  }

  // === Sync état React → visuels Phaser ===

  syncFromState(state: GameState, _initial = false) {
    // HP/MP des héros
    for (const c of state.characters) {
      const v = this.heroes.get(c.id);
      if (!v) continue;
      v.nameText.setText(c.name.toUpperCase());
      const barW = 130;
      const hpPct = Math.max(0, c.hp / c.maxHp);
      v.hpBarFill.width = Math.max(1, (barW - 2) * hpPct);
      v.hpBarFill.fillColor = hpPct < 0.3 ? 0xc0392b : 0x4caf50;
      v.hpText.setText(`${c.hp}/${c.maxHp}`);
      const mpPct = Math.max(0, c.mp / c.maxMp);
      v.mpBarFill.width = Math.max(1, (barW - 2) * mpPct);
      v.mpText.setText(`${c.mp}/${c.maxMp} MP`);
    }
  }

  setActiveHero(id: string | null) {
    for (const [hid, v] of this.heroes) {
      if (hid === id) {
        // Ajoute un curseur / glow
        v.sprite.setTint(0xfff4a0);
        this.tweens.add({
          targets: v.sprite,
          alpha: { from: 0.85, to: 1 },
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      } else {
        this.tweens.killTweensOf(v.sprite);
        v.sprite.setAlpha(1);
        if (v.alive) v.sprite.clearTint();
      }
    }
  }

  getHeroScreenPosition(id: string): { x: number; y: number } | null {
    const v = this.heroes.get(id);
    if (!v) return null;
    return { x: v.container.x, y: v.container.y };
  }

  // === Animations de combat ===

  playAttack(id: string, targetId: string) {
    const e = id === 'champion' ? this.boss : this.heroes.get(id);
    const t = targetId === 'champion' ? this.boss : this.heroes.get(targetId);
    if (!e || !t || !e.alive) return;

    const dx = t.baseX - e.baseX;
    const lungeX = Math.sign(dx) * Math.min(80, Math.abs(dx) * 0.3);

    this.tweens.add({
      targets: e.container,
      x: e.baseX + lungeX,
      duration: 220,
      ease: 'Cubic.easeOut',
      yoyo: true,
    });
    this.tweens.add({
      targets: e.sprite,
      scaleX: e.sprite.scaleX * 1.08,
      scaleY: e.sprite.scaleY * 1.08,
      duration: 220,
      yoyo: true,
      ease: 'Cubic.easeOut',
    });
    this.cameras.main.flash(70, 240, 220, 180);
  }

  playHit(id: string, amount: number, isCrit = false) {
    const e = id === 'champion' ? this.boss : this.heroes.get(id);
    if (!e || !e.alive) return;
    e.sprite.setTint(0xff5555);
    this.tweens.add({
      targets: e.container,
      x: { from: e.baseX - 8, to: e.baseX + 8 },
      duration: 50,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        e.container.x = e.baseX;
        if (e.alive) e.sprite.clearTint();
      },
    });
    this.spawnParticles(e.container.x, e.container.y - e.sprite.displayHeight * 0.5, isCrit ? 'p-yellow' : 'p-red', isCrit ? 30 : 18);
    this.spawnFloatingNumber(e.container.x, e.container.y - e.sprite.displayHeight * 0.7, `-${amount}`, isCrit ? '#ffe080' : '#ff6666', isCrit);
    const intensity = Math.min(0.018, amount / 7000);
    this.cameras.main.shake(180, intensity);
  }

  playHeal(id: string, amount: number) {
    const e = id === 'champion' ? this.boss : this.heroes.get(id);
    if (!e || !e.alive) return;
    e.sprite.setTint(0x88ff99);
    this.tweens.add({
      targets: e.sprite,
      alpha: 0.6,
      duration: 220,
      yoyo: true,
      onComplete: () => {
        e.sprite.setAlpha(1);
        if (e.alive) e.sprite.clearTint();
      },
    });
    this.spawnParticles(e.container.x, e.container.y - e.sprite.displayHeight * 0.5, 'p-green', 22);
    this.spawnFloatingNumber(e.container.x, e.container.y - e.sprite.displayHeight * 0.7, `+${amount}`, '#88ff99');
  }

  playDeath(id: string) {
    const e = id === 'champion' ? this.boss : this.heroes.get(id);
    if (!e) return;
    e.alive = false;
    e.sprite.setTint(0x444444);
    this.tweens.add({
      targets: e.container,
      alpha: 0.4,
      angle: 12,
      y: e.baseY + 14,
      duration: 600,
      ease: 'Cubic.easeOut',
    });
  }

  playRevive(id: string) {
    const e = id === 'champion' ? this.boss : this.heroes.get(id);
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
    this.cameras.main.flash(400, 180, 100, 255);
    this.cameras.main.shake(700, 0.025);
    this.spawnParticles(this.boss.container.x, this.boss.container.y - this.boss.sprite.displayHeight * 0.5, 'p-magic', 60);
    // Tint violet en continu sur le sprite boss
    this.boss.sprite.setTint(0xddaaff);
  }

  private spawnParticles(x: number, y: number, key: string, count: number) {
    const e = this.add.particles(x, y, key, {
      lifespan: 700,
      speed: { min: 100, max: 280 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      gravityY: 200,
      blendMode: 'ADD',
      emitting: false,
    });
    e.explode(count);
    this.time.delayedCall(900, () => e.destroy());
  }

  private spawnFloatingNumber(x: number, y: number, text: string, color: string, big = false) {
    const t = this.add.text(x, y, text, {
      fontFamily: 'Georgia, serif',
      fontSize: big ? '42px' : '32px',
      color,
      stroke: '#000',
      strokeThickness: 5,
      fontStyle: 'bold',
    });
    t.setOrigin(0.5);
    t.setDepth(10000);
    this.tweens.add({
      targets: t,
      y: y - 90,
      alpha: { from: 1, to: 0 },
      scale: { from: big ? 1.4 : 1.0, to: big ? 1.8 : 1.3 },
      duration: 1200,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }
}
