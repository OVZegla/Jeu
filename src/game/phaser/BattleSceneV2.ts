// BattleScene V2 — arène 2.5D : multi-ennemis, animations d'attaque
// (approche / projectile / impact synchronisé), VFX par type de compétence,
// hit-stop, screenshake, zoom caméra, télégraphes, invocations.
//
// La scène est purement « présentation » : le séquenceur React lui envoie des
// ordres (playCastAnim, playImpact, …) en suivant les CombatEvents du moteur.

import Phaser from 'phaser';
import type { Combatant, EnemyCombatant, SkillPresentation } from '../combat/types';
import { playSfx } from '../core/sfx';

interface Visual {
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
  ring: Phaser.GameObjects.Ellipse;    // anneau « tour actif »
  baseX: number;
  baseY: number;
  alive: boolean;
  isHero: boolean;
  floats: boolean;
  breathTween?: Phaser.Tweens.Tween;
  telegraphFx?: Phaser.GameObjects.Particles.ParticleEmitter;
}

export interface BattleSceneV2Events {
  onReady?: (scene: BattleSceneV2) => void;
  onCombatantClicked?: (id: string) => void;
}

const HERO_POSITIONS: Record<number, Array<{ x: number; y: number }>> = {
  3: [
    { x: 0.32, y: 0.80 },
    { x: 0.50, y: 0.86 },
    { x: 0.68, y: 0.80 },
  ],
};

function enemyPositions(count: number, hasBoss: boolean): Array<{ x: number; y: number }> {
  if (hasBoss) {
    // Boss centré, adds de part et d'autre
    if (count === 1) return [{ x: 0.50, y: 0.52 }];
    if (count === 2) return [{ x: 0.44, y: 0.52 }, { x: 0.64, y: 0.56 }];
    return [
      { x: 0.50, y: 0.50 },
      { x: 0.30, y: 0.56 },
      { x: 0.70, y: 0.56 },
      { x: 0.20, y: 0.60 },
      { x: 0.80, y: 0.60 },
    ].slice(0, count);
  }
  if (count === 1) return [{ x: 0.50, y: 0.54 }];
  if (count === 2) return [{ x: 0.40, y: 0.52 }, { x: 0.62, y: 0.56 }];
  if (count === 3) return [{ x: 0.32, y: 0.52 }, { x: 0.52, y: 0.50 }, { x: 0.70, y: 0.56 }];
  return [
    { x: 0.28, y: 0.52 }, { x: 0.46, y: 0.50 }, { x: 0.64, y: 0.52 }, { x: 0.80, y: 0.56 },
    { x: 0.38, y: 0.60 }, { x: 0.58, y: 0.60 },
  ].slice(0, count);
}

export class BattleSceneV2 extends Phaser.Scene {
  private events_: BattleSceneV2Events;
  private visuals: Map<string, Visual> = new Map();
  private currentMusic: Phaser.Sound.BaseSound | null = null;
  private muted = false;
  private pendingHeroes: Combatant[] = [];
  private pendingEnemies: EnemyCombatant[] = [];
  private isBossBattle = false;
  private created = false;
  private backgroundKey = 'arena';

  constructor(events: BattleSceneV2Events) {
    super({ key: 'BattleSceneV2' });
    this.events_ = events;
  }

  setInitialCombatants(heroes: Combatant[], enemies: EnemyCombatant[], background: 'arena' | 'forest' | 'cave' = 'arena') {
    this.pendingHeroes = heroes;
    this.pendingEnemies = enemies;
    this.isBossBattle = enemies.some((e) => e.isBoss);
    this.backgroundKey = background === 'forest' ? 'battle-forest' : background === 'cave' ? 'battle-cave' : 'arena';
  }

  preload() {
    const base = import.meta.env.BASE_URL || '/';
    this.load.image('arena', `${base}assets/arena.jpg`);
    this.load.image('battle-forest', `${base}assets/battle-forest.jpg`);
    this.load.image('battle-cave', `${base}assets/battle-cave.jpg`);
    this.load.image('sprite-datpaloof', `${base}assets/sprites/datpaloof.png`);
    this.load.image('sprite-baghaar', `${base}assets/sprites/baghaar.png`);
    this.load.image('sprite-zlatax', `${base}assets/sprites/zlatax.png`);
    this.load.image('sprite-boss', `${base}assets/sprites/boss.png`);
    for (const e of ['grimoire', 'grimoire2', 'decret', 'decret2',
      'bandit', 'banditChef', 'gobelin', 'roiGobelin', 'cultiste', 'hierophante']) {
      this.load.image(`enemy-${e}`, `${base}assets/sprites/enemies/${e}.png`);
    }

    this.load.on('loaderror', (file: { url: string }) => {
      if (file.url?.includes('/assets/music/') || file.url?.includes('/assets/sfx/')) return;
      console.warn('[BattleV2] Asset manquant :', file.url);
    });
    // Seules les musiques réellement présentes dans public/assets/music/.
    // Pour en ajouter (boss, victory, defeat…), déposer le fichier et
    // compléter cette liste — voir docs/ASSETS.md.
    const MUSIC = ['battle'];
    for (const k of MUSIC) {
      this.load.audio(`music-${k}`, [`${base}assets/music/${k}.mp3`, `${base}assets/music/${k}.ogg`]);
    }
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Fond (arène des Archives, forêt ou caverne selon le groupe)
    const bg = this.add.image(w / 2, h / 2, this.textures.exists(this.backgroundKey) ? this.backgroundKey : 'arena');
    const s = Math.max(w / bg.width, h / bg.height);
    bg.setScale(s).setDepth(0);
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.22).setDepth(1);

    // Vignette (profondeur)
    this.makeVignette(w, h);

    this.makeParticleTextures();
    this.spawnAmbience(w, h);

    // Combattants
    this.spawnAll();

    this.playMusic(this.isBossBattle ? 'boss' : 'battle');
    this.created = true;
    this.events_.onReady?.(this);
  }

  private makeVignette(w: number, h: number) {
    const key = 'v2-vignette';
    if (!this.textures.exists(key)) {
      const c = document.createElement('canvas');
      c.width = 320; c.height = 180;
      const ctx = c.getContext('2d')!;
      const g = ctx.createRadialGradient(160, 90, 60, 160, 90, 190);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 320, 180);
      this.textures.addCanvas(key, c);
    }
    this.add.image(w / 2, h / 2, key).setDisplaySize(w, h).setDepth(900);
  }

  private makeParticleTextures() {
    const mk = (key: string, r: number, g: number, b: number) => {
      if (this.textures.exists(key)) return;
      const c = document.createElement('canvas');
      c.width = 8; c.height = 8;
      const ctx = c.getContext('2d')!;
      const grad = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
      grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 8, 8);
      this.textures.addCanvas(key, c);
    };
    mk('p2-white', 255, 255, 255);
    mk('p2-gold', 255, 224, 140);
    mk('p2-purple', 190, 110, 255);
    mk('p2-red', 255, 90, 90);
    mk('p2-green', 130, 255, 150);
    mk('p2-blue', 130, 200, 255);
    mk('p2-orange', 255, 160, 60);
    // Petit rectangle « papier »
    if (!this.textures.exists('p2-paper')) {
      const c = document.createElement('canvas');
      c.width = 10; c.height = 12;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = 'rgba(235,225,200,0.95)';
      ctx.fillRect(0, 0, 10, 12);
      ctx.fillStyle = 'rgba(120,100,80,0.8)';
      for (let y = 2; y < 11; y += 3) ctx.fillRect(2, y, 6, 1);
      this.textures.addCanvas('p2-paper', c);
    }
  }

  private spawnAmbience(w: number, h: number) {
    this.add.particles(0, 0, 'p2-gold', {
      x: { min: 0, max: w },
      y: { min: h * 0.1, max: h * 0.9 },
      lifespan: 7000,
      speedY: { min: -12, max: -4 },
      speedX: { min: -6, max: 6 },
      scale: { start: 0.5, end: 0.05 },
      alpha: { start: 0.35, end: 0 },
      frequency: 320,
      blendMode: 'ADD',
    }).setDepth(2);
    this.add.particles(0, 0, 'p2-purple', {
      x: { min: w * 0.2, max: w * 0.8 },
      y: { min: h * 0.05, max: h * 0.4 },
      lifespan: 4000,
      speedY: { min: -20, max: -6 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.5, end: 0 },
      frequency: 600,
      blendMode: 'ADD',
    }).setDepth(2);
  }

  // ============================================================
  // Spawn des combattants
  // ============================================================

  private spawnAll() {
    const w = this.scale.width;
    const h = this.scale.height;

    const heroPos = HERO_POSITIONS[3] ?? HERO_POSITIONS[3];
    this.pendingHeroes.forEach((c, i) => {
      const p = heroPos[Math.min(i, heroPos.length - 1)];
      this.spawnCombatant(c, w * p.x, h * p.y, true);
    });

    const ep = enemyPositions(this.pendingEnemies.length, this.isBossBattle);
    // Boss d'abord (position centrale)
    const ordered = [...this.pendingEnemies].sort((a, b) => (b.isBoss ? 1 : 0) - (a.isBoss ? 1 : 0));
    ordered.forEach((c, i) => {
      const p = ep[Math.min(i, ep.length - 1)];
      this.spawnCombatant(c, w * p.x, h * p.y, false);
    });

    // Entrée en scène : héros glissent depuis le bas, ennemis fade-in.
    for (const [, v] of this.visuals) {
      if (v.isHero) {
        const fromY = v.baseY + 160;
        v.container.y = fromY;
        v.container.setAlpha(0);
        this.tweens.add({
          targets: v.container,
          y: v.baseY,
          alpha: 1,
          duration: 550,
          ease: 'Back.easeOut',
          delay: 100,
        });
      } else {
        v.container.setAlpha(0);
        v.container.setScale(0.8);
        this.tweens.add({
          targets: v.container,
          alpha: 1,
          scale: 1,
          duration: 600,
          ease: 'Cubic.easeOut',
          delay: 350,
        });
      }
    }
  }

  private spawnCombatant(c: Combatant, x: number, y: number, isHero: boolean) {
    const h = this.scale.height;
    const sprite = this.add.image(0, 0, c.spriteKey);
    sprite.setOrigin(0.5, 1);
    let targetH: number;
    if (isHero) {
      targetH = Math.min(h * 0.30, 240);
    } else {
      const e = c as EnemyCombatant;
      targetH = Math.min(h * (e.isBoss ? 0.44 : 0.17) * (e.isBoss ? 1 : e.displayScale), e.isBoss ? 400 : 220);
    }
    sprite.setScale(targetH / sprite.height);

    const shadow = this.add.ellipse(0, 2, sprite.displayWidth * 0.62, Math.max(9, sprite.displayWidth * 0.09), 0x000000, 0.5);
    shadow.setOrigin(0.5, 0);

    const ring = this.add.ellipse(0, 6, sprite.displayWidth * 0.8, Math.max(14, sprite.displayWidth * 0.14), 0xffe080, 0);
    ring.setStrokeStyle(3, 0xffe080, 0);
    ring.setOrigin(0.5, 0.5);

    const container = this.add.container(x, y, [ring, shadow, sprite]);
    container.setDepth(10 + y);
    container.setSize(sprite.displayWidth, sprite.displayHeight);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-sprite.displayWidth / 2, -sprite.displayHeight, sprite.displayWidth, sprite.displayHeight),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerdown', () => this.events_.onCombatantClicked?.(c.id));

    // Respiration en idle (léger squash vertical)
    const breath = this.tweens.add({
      targets: sprite,
      scaleY: sprite.scaleY * 1.012,
      scaleX: sprite.scaleX * 0.996,
      duration: 1300 + Math.random() * 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Flottement réservé aux ennemis-documents (les humanoïdes restent au sol)
    if (!isHero && !(c as EnemyCombatant).isBoss && (c as EnemyCombatant).floats) {
      this.tweens.add({
        targets: sprite,
        y: -8,
        duration: 1500 + Math.random() * 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.visuals.set(c.id, {
      container, sprite, shadow, ring,
      baseX: x, baseY: y, alive: true, isHero,
      floats: !isHero && ((c as EnemyCombatant).floats ?? false),
      breathTween: breath,
    });
  }

  // Invocation en cours de combat (Pages protectrices)
  addSummons(enemies: EnemyCombatant[]) {
    const w = this.scale.width;
    const h = this.scale.height;
    const slots = [
      { x: 0.34, y: 0.60 }, { x: 0.66, y: 0.60 },
      { x: 0.26, y: 0.64 }, { x: 0.74, y: 0.64 },
    ];
    let i = 0;
    for (const e of enemies) {
      if (this.visuals.has(e.id)) continue;
      const p = slots[i % slots.length];
      i += 1;
      this.spawnCombatant(e, w * p.x, h * p.y, false);
      const v = this.visuals.get(e.id)!;
      v.container.setAlpha(0);
      v.container.setScale(0.4);
      // Pilier violet d'invocation
      this.spawnPillar(v.baseX, v.baseY, 0xb46bff);
      this.tweens.add({
        targets: v.container,
        alpha: 1,
        scale: 1,
        duration: 500,
        ease: 'Back.easeOut',
        delay: 150,
      });
    }
    playSfx('summon');
  }

  // ============================================================
  // Ordres du séquenceur
  // ============================================================

  setActiveTurn(id: string | null) {
    for (const [cid, v] of this.visuals) {
      const active = cid === id;
      this.tweens.add({
        targets: v.ring,
        alpha: active ? 0.9 : 0,
        duration: 200,
      });
      v.ring.setStrokeStyle(3, 0xffe080, active ? 0.9 : 0);
      v.ring.setFillStyle(0xffe080, active ? 0.10 : 0);
    }
  }

  setTargetHighlight(ids: string[]) {
    for (const [cid, v] of this.visuals) {
      if (!v.alive) continue;
      if (ids.includes(cid)) {
        v.sprite.setTint(0xffb0b0);
      } else {
        v.sprite.clearTint();
      }
    }
  }

  clearHighlights() {
    for (const [, v] of this.visuals) {
      if (v.alive) v.sprite.clearTint();
    }
  }

  getPosition(id: string): { x: number; y: number } | null {
    const v = this.visuals.get(id);
    return v ? { x: v.container.x, y: v.container.y } : null;
  }

  // Animation de cast : approche (melee), projectile (ranged) ou sur place.
  // Résout à l'instant de l'impact (hitDelayMs).
  playCastAnim(casterId: string, targetIds: string[], pres: SkillPresentation): number {
    const v = this.visuals.get(casterId);
    if (!v) return pres.hitDelayMs;
    const target = targetIds.length > 0 ? this.visuals.get(targetIds[0]) : null;
    const hitDelay = pres.hitDelayMs;

    playSfx('attack');

    if (pres.approach === 'melee' && target) {
      // Dash vers la cible puis retour.
      const dx = target.baseX - v.baseX;
      const dy = target.baseY - v.baseY;
      const dist = Math.hypot(dx, dy);
      const stop = Math.max(0, dist - target.sprite.displayWidth * 0.55);
      const nx = v.baseX + (dx / dist) * stop;
      const ny = v.baseY + (dy / dist) * stop;
      this.tweens.add({
        targets: v.container,
        x: nx, y: ny,
        duration: Math.max(120, hitDelay - 80),
        ease: 'Cubic.easeIn',
        onComplete: () => {
          // Petit recul de frappe (anticipation) puis retour à la base
          this.tweens.add({
            targets: v.container,
            x: v.baseX, y: v.baseY,
            duration: 320,
            delay: 220,
            ease: 'Cubic.easeOut',
          });
        },
      });
      // Squash & stretch pendant le dash
      this.tweens.add({
        targets: v.sprite,
        scaleX: v.sprite.scaleX * 1.06,
        scaleY: v.sprite.scaleY * 0.96,
        duration: 140,
        yoyo: true,
      });
    } else if (pres.approach === 'ranged' && target) {
      // Recul de préparation + projectile lumineux
      this.tweens.add({
        targets: v.container,
        x: v.baseX + (v.isHero ? -14 : 14),
        duration: 130,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
      const px = v.container.x;
      const py = v.container.y - v.sprite.displayHeight * 0.55;
      const proj = this.add.ellipse(px, py, 16, 16, pres.color, 1);
      proj.setBlendMode(Phaser.BlendModes.ADD);
      proj.setDepth(800);
      const trail = this.add.particles(0, 0, 'p2-white', {
        lifespan: 250,
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.8, end: 0 },
        tint: pres.color,
        frequency: 18,
        blendMode: 'ADD',
        follow: proj,
      });
      trail.setDepth(799);
      this.tweens.add({
        targets: proj,
        x: target.baseX,
        y: target.baseY - target.sprite.displayHeight * 0.5,
        duration: Math.max(150, hitDelay - 60),
        ease: 'Quad.easeIn',
        onComplete: () => {
          proj.destroy();
          this.time.delayedCall(260, () => trail.destroy());
        },
      });
    } else {
      // Sur place : lueur montante sur le caster
      const glow = this.add.ellipse(v.container.x, v.container.y, v.sprite.displayWidth * 1.1, 24, pres.color, 0.35);
      glow.setBlendMode(Phaser.BlendModes.ADD);
      glow.setDepth(v.container.depth - 1);
      this.tweens.add({
        targets: glow,
        scaleX: 1.4,
        alpha: 0,
        duration: 500,
        onComplete: () => glow.destroy(),
      });
      this.tweens.add({
        targets: v.sprite,
        scaleY: v.sprite.scaleY * 1.05,
        duration: 160,
        yoyo: true,
      });
    }
    return hitDelay;
  }

  // Impact d'une attaque (dégâts) — synchronisé par le séquenceur.
  playImpact(
    targetId: string,
    amount: number,
    opts: {
      crit?: boolean;
      effectiveness?: 'weak' | 'resist' | 'normal';
      pres: SkillPresentation;
    }
  ) {
    const v = this.visuals.get(targetId);
    if (!v) return;
    const { pres } = opts;
    const cx = v.container.x;
    const topY = v.container.y - v.sprite.displayHeight;
    const midY = v.container.y - v.sprite.displayHeight * 0.5;

    // SFX selon le vfx
    const sfxByVfx: Record<string, string> = {
      slash: 'hit', holy: 'holy', lightning: 'lightning', fire: 'fire',
      occult: 'occult', stamp: 'stamp', papers: 'papers', heal: 'heal',
      shield: 'defend', summon: 'summon',
    };
    playSfx(opts.crit ? 'crit' : (sfxByVfx[pres.vfx] ?? 'hit'));

    // VFX spécifique
    this.spawnVfx(pres.vfx, pres.color, cx, midY, v);

    // Réaction de la cible : tint + recul + tremblement
    v.sprite.setTint(0xff6666);
    const knock = v.isHero ? 10 : -10;
    this.tweens.add({
      targets: v.container,
      x: { from: v.baseX + knock, to: v.baseX - 6 },
      duration: 60,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        v.container.x = v.baseX;
        if (v.alive) v.sprite.clearTint();
      },
    });
    // Squash de la cible
    this.tweens.add({
      targets: v.sprite,
      scaleY: v.sprite.scaleY * 0.92,
      scaleX: v.sprite.scaleX * 1.05,
      duration: 90,
      yoyo: true,
    });

    // Chiffres flottants
    const color = opts.crit ? '#ffe080' : opts.effectiveness === 'weak' ? '#ffad66' : '#ff6666';
    this.floatText(cx, topY - 8, `-${amount}`, color, opts.crit);
    if (opts.effectiveness === 'weak') this.floatText(cx, topY - 44, 'FAIBLESSE !', '#ffad66', false, 16);
    if (opts.effectiveness === 'resist') this.floatText(cx, topY - 44, 'résiste…', '#99aabb', false, 14);

    // Caméra : shake + zoom punch + hit stop
    const shake = pres.shake ?? 0.2;
    this.cameras.main.shake(160 + shake * 140, 0.004 + shake * 0.011);
    if (opts.crit || (pres.shake ?? 0) >= 0.45) {
      this.punchZoom(1.045, 130);
    }
    if (pres.hitStopMs && pres.hitStopMs > 0) {
      this.hitStop(pres.hitStopMs);
    }
  }

  playTickDamage(targetId: string, amount: number) {
    const v = this.visuals.get(targetId);
    if (!v) return;
    v.sprite.setTint(0xff9955);
    this.time.delayedCall(220, () => { if (v.alive) v.sprite.clearTint(); });
    this.floatText(v.container.x, v.container.y - v.sprite.displayHeight - 8, `-${amount}`, '#ff9955');
    playSfx('hit');
  }

  playHeal(targetId: string, amount: number) {
    const v = this.visuals.get(targetId);
    if (!v) return;
    playSfx('heal');
    this.spawnVfx('heal', 0x9dffb0, v.container.x, v.container.y - v.sprite.displayHeight * 0.5, v);
    v.sprite.setTint(0x99ffaa);
    this.time.delayedCall(320, () => { if (v.alive) v.sprite.clearTint(); });
    this.floatText(v.container.x, v.container.y - v.sprite.displayHeight - 8, `+${amount}`, '#88ff99');
  }

  playMpChange(targetId: string, amount: number) {
    if (amount >= 0) return; // les régens silencieuses n'ont pas de feedback
    const v = this.visuals.get(targetId);
    if (!v) return;
    this.floatText(v.container.x + 24, v.container.y - v.sprite.displayHeight * 0.6, `${amount} MP`, '#66aaff', false, 16);
  }

  playStatus(targetId: string, icon: string, positive: boolean) {
    const v = this.visuals.get(targetId);
    if (!v) return;
    playSfx(positive ? 'defend' : 'papers');
    this.floatText(v.container.x, v.container.y - v.sprite.displayHeight - 4, icon, positive ? '#9ecbff' : '#dd88ff', false, 22);
    const ringColor = positive ? 0x9ecbff : 0xb46bff;
    const fx = this.add.ellipse(v.container.x, v.container.y, v.sprite.displayWidth, 20, ringColor, 0);
    fx.setStrokeStyle(2, ringColor, 0.9);
    fx.setDepth(v.container.depth + 1);
    this.tweens.add({
      targets: fx,
      scaleX: 1.6, scaleY: 1.6,
      alpha: 0,
      duration: 500,
      onComplete: () => fx.destroy(),
    });
  }

  playDeath(targetId: string) {
    const v = this.visuals.get(targetId);
    if (!v) return;
    v.alive = false;
    playSfx('death');
    v.sprite.setTint(0x555555);
    if (v.isHero) {
      this.tweens.add({
        targets: v.container,
        alpha: 0.35,
        angle: 14,
        y: v.baseY + 16,
        duration: 650,
        ease: 'Cubic.easeOut',
      });
    } else if (v.floats) {
      // Les documents se désintègrent en confettis de papier
      const burst = this.add.particles(v.container.x, v.container.y - v.sprite.displayHeight * 0.4, 'p2-paper', {
        lifespan: 900,
        speed: { min: 60, max: 220 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        alpha: { start: 1, end: 0 },
        gravityY: 260,
        rotate: { min: 0, max: 360 },
        emitting: false,
      });
      burst.setDepth(850);
      burst.explode(24);
      this.time.delayedCall(1000, () => burst.destroy());
      this.tweens.add({
        targets: v.container,
        alpha: 0,
        scale: 0.7,
        duration: 500,
        ease: 'Cubic.easeIn',
      });
    } else {
      // Les humanoïdes s'effondrent dans un nuage de poussière
      this.burst(v.container.x, v.container.y - 8, 'p2-red', 0xcc8866, 16, 180, 260);
      this.tweens.add({
        targets: v.container,
        alpha: 0,
        angle: -78,
        y: v.baseY + 14,
        duration: 600,
        ease: 'Cubic.easeIn',
      });
    }
  }

  playRevive(targetId: string) {
    const v = this.visuals.get(targetId);
    if (!v) return;
    v.alive = true;
    v.sprite.clearTint();
    this.spawnPillar(v.baseX, v.baseY, 0x9dffb0);
    playSfx('heal');
    this.tweens.add({
      targets: v.container,
      alpha: 1, angle: 0, y: v.baseY, scale: 1,
      duration: 400,
    });
  }

  playTelegraph(casterId: string, _text: string) {
    const v = this.visuals.get(casterId);
    if (!v) return;
    playSfx('telegraph');
    // Aura rouge pulsante sur le boss + flash d'écran
    this.cameras.main.flash(220, 255, 40, 60);
    v.sprite.setTint(0xff8888);
    this.tweens.add({
      targets: v.sprite,
      scaleX: v.sprite.scaleX * 1.04,
      scaleY: v.sprite.scaleY * 1.04,
      duration: 300,
      yoyo: true,
      repeat: 2,
    });
    if (!v.telegraphFx) {
      const fx = this.add.particles(0, 0, 'p2-red', {
        lifespan: 800,
        speedY: { min: -80, max: -30 },
        speedX: { min: -20, max: 20 },
        scale: { start: 1.0, end: 0 },
        alpha: { start: 0.8, end: 0 },
        frequency: 60,
        blendMode: 'ADD',
        follow: v.container,
        followOffset: { x: 0, y: -v.sprite.displayHeight * 0.5 },
      });
      fx.setDepth(v.container.depth + 2);
      v.telegraphFx = fx;
    }
  }

  clearTelegraph(casterId: string) {
    const v = this.visuals.get(casterId);
    if (!v) return;
    if (v.alive) v.sprite.clearTint();
    v.telegraphFx?.destroy();
    v.telegraphFx = undefined;
  }

  playBossPhase(phase: number) {
    playSfx('enrage');
    this.cameras.main.flash(420, 180, 80, 255);
    this.cameras.main.shake(650, 0.02);
    this.punchZoom(1.06, 320);
    // Le boss se teinte violet en phase 3
    for (const [, v] of this.visuals) {
      if (!v.isHero && v.alive && phase >= 3) v.sprite.setTint(0xddaaff);
    }
  }

  playVictory() {
    playSfx('victory');
    this.playMusic('victory', 0.35, false);
    for (const [, v] of this.visuals) {
      if (v.isHero && v.alive) {
        // Petit saut de victoire
        this.tweens.add({
          targets: v.container,
          y: v.baseY - 26,
          duration: 260,
          yoyo: true,
          repeat: 2,
          ease: 'Quad.easeOut',
          delay: Math.random() * 250,
        });
      }
    }
    // Confettis dorés
    const w = this.scale.width;
    const e = this.add.particles(0, 0, 'p2-gold', {
      x: { min: w * 0.2, max: w * 0.8 },
      y: -10,
      lifespan: 2400,
      speedY: { min: 120, max: 260 },
      speedX: { min: -40, max: 40 },
      scale: { start: 0.9, end: 0.2 },
      alpha: { start: 1, end: 0 },
      frequency: 40,
      blendMode: 'ADD',
    });
    e.setDepth(950);
    this.time.delayedCall(2600, () => e.stop());
  }

  playDefeat() {
    playSfx('defeat');
    this.playMusic('defeat', 0.3, false);
    this.cameras.main.fade(1400, 8, 2, 16, false);
  }

  // ============================================================
  // VFX par type
  // ============================================================

  private spawnVfx(kind: string, color: number, x: number, y: number, target: Visual) {
    switch (kind) {
      case 'slash': {
        // Trait de coupe : rectangle fin qui traverse la cible
        const slash = this.add.rectangle(x, y, target.sprite.displayWidth * 1.4, 5, 0xffffff, 1);
        slash.setBlendMode(Phaser.BlendModes.ADD);
        slash.setDepth(860);
        slash.setAngle(-35 + Math.random() * 20);
        this.tweens.add({
          targets: slash,
          scaleX: { from: 0.2, to: 1.3 },
          alpha: { from: 1, to: 0 },
          duration: 240,
          ease: 'Cubic.easeOut',
          onComplete: () => slash.destroy(),
        });
        this.burst(x, y, 'p2-white', color, 16, 200);
        break;
      }
      case 'holy': {
        // Colonne de lumière descendante
        const beam = this.add.rectangle(x, y - 140, 46, 300, color, 0.55);
        beam.setBlendMode(Phaser.BlendModes.ADD);
        beam.setDepth(855);
        beam.setScale(0.2, 0);
        beam.setOrigin(0.5, 0);
        beam.y = y - 280;
        this.tweens.add({
          targets: beam,
          scaleY: 1,
          scaleX: 1,
          duration: 160,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            this.tweens.add({ targets: beam, alpha: 0, scaleX: 0.3, duration: 320, onComplete: () => beam.destroy() });
          },
        });
        this.burst(x, y, 'p2-gold', color, 22, 240);
        break;
      }
      case 'lightning': {
        // Zigzag du haut de l'écran jusqu'à la cible
        const g = this.add.graphics();
        g.setDepth(870);
        g.lineStyle(3, 0xffffff, 1);
        const startY = y - 320;
        let px = x + (Math.random() * 60 - 30);
        let py = startY;
        g.beginPath();
        g.moveTo(px, py);
        const steps = 6;
        for (let i = 1; i <= steps; i++) {
          px = x + (Math.random() * 56 - 28) * (1 - i / steps);
          py = startY + ((y - startY) * i) / steps;
          g.lineTo(px, py);
        }
        g.strokePath();
        g.lineStyle(7, color, 0.5);
        g.strokePath();
        this.cameras.main.flash(90, 190, 230, 255);
        this.tweens.add({
          targets: g,
          alpha: 0,
          duration: 260,
          onComplete: () => g.destroy(),
        });
        this.burst(x, y, 'p2-blue', color, 20, 260);
        break;
      }
      case 'fire': {
        this.burst(x, y, 'p2-orange', color, 26, 300, 180);
        break;
      }
      case 'occult': {
        // Implosion : particules qui convergent puis burst
        const imp = this.add.particles(x, y, 'p2-purple', {
          lifespan: 300,
          speed: { min: -220, max: -120 }, // vitesse négative = converge
          angle: { min: 0, max: 360 },
          scale: { start: 0.2, end: 1 },
          alpha: { start: 0, end: 0.9 },
          frequency: 10,
          blendMode: 'ADD',
        });
        imp.setDepth(860);
        this.time.delayedCall(240, () => {
          imp.destroy();
          this.burst(x, y, 'p2-purple', color, 24, 260);
        });
        break;
      }
      case 'stamp': {
        // Tampon géant qui s'abat + onde de choc
        const stamp = this.add.rectangle(x, y - 220, 80, 36, color, 0.9);
        stamp.setStrokeStyle(3, 0xffffff, 0.9);
        stamp.setDepth(870);
        this.tweens.add({
          targets: stamp,
          y: y - 10,
          duration: 140,
          ease: 'Quad.easeIn',
          onComplete: () => {
            const ring = this.add.ellipse(x, y + 8, 30, 12, color, 0);
            ring.setStrokeStyle(4, color, 0.9);
            ring.setBlendMode(Phaser.BlendModes.ADD);
            ring.setDepth(869);
            this.tweens.add({
              targets: ring,
              scaleX: 5, scaleY: 5,
              alpha: 0,
              duration: 380,
              onComplete: () => ring.destroy(),
            });
            this.tweens.add({
              targets: stamp,
              alpha: 0,
              y: y - 40,
              duration: 300,
              delay: 90,
              onComplete: () => stamp.destroy(),
            });
            this.burst(x, y, 'p2-purple', color, 18, 240);
          },
        });
        break;
      }
      case 'papers': {
        // Tourbillon de documents
        const e = this.add.particles(x, y, 'p2-paper', {
          lifespan: 700,
          speed: { min: 120, max: 260 },
          angle: { min: 0, max: 360 },
          scale: { start: 1.1, end: 0.2 },
          alpha: { start: 1, end: 0 },
          rotate: { min: 0, max: 720 },
          frequency: 14,
          blendMode: 'NORMAL',
        });
        e.setDepth(860);
        this.time.delayedCall(320, () => {
          e.stop();
          this.time.delayedCall(800, () => e.destroy());
        });
        this.burst(x, y, 'p2-purple', color, 10, 200);
        break;
      }
      case 'heal': {
        const e = this.add.particles(x, y + 30, 'p2-green', {
          lifespan: 800,
          speedY: { min: -140, max: -60 },
          speedX: { min: -40, max: 40 },
          scale: { start: 0.9, end: 0 },
          alpha: { start: 0.9, end: 0 },
          frequency: 20,
          blendMode: 'ADD',
        });
        e.setDepth(860);
        this.time.delayedCall(360, () => {
          e.stop();
          this.time.delayedCall(900, () => e.destroy());
        });
        break;
      }
      case 'shield': {
        const dome = this.add.ellipse(x, y, target.sprite.displayWidth * 1.3, target.sprite.displayHeight * 1.15, color, 0.18);
        dome.setStrokeStyle(2, color, 0.8);
        dome.setBlendMode(Phaser.BlendModes.ADD);
        dome.setDepth(target.container.depth + 1);
        this.tweens.add({
          targets: dome,
          alpha: 0,
          scaleX: 1.15,
          scaleY: 1.15,
          duration: 700,
          ease: 'Cubic.easeOut',
          onComplete: () => dome.destroy(),
        });
        break;
      }
      case 'summon': {
        this.spawnPillar(x, y + target.sprite.displayHeight * 0.5, color);
        break;
      }
    }
  }

  private spawnPillar(x: number, y: number, color: number) {
    const beam = this.add.rectangle(x, y, 60, 260, color, 0.5);
    beam.setOrigin(0.5, 1);
    beam.setBlendMode(Phaser.BlendModes.ADD);
    beam.setDepth(850);
    beam.setScale(0.15, 0);
    this.tweens.add({
      targets: beam,
      scaleY: 1, scaleX: 1,
      duration: 220,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.tweens.add({ targets: beam, alpha: 0, duration: 400, onComplete: () => beam.destroy() });
      },
    });
    this.burst(x, y - 20, 'p2-purple', color, 20, 280);
  }

  private burst(x: number, y: number, texture: string, tint: number, count: number, speed: number, gravity = 220) {
    const e = this.add.particles(x, y, texture, {
      lifespan: 650,
      speed: { min: speed * 0.4, max: speed * 1.3 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.1, end: 0 },
      alpha: { start: 1, end: 0 },
      tint,
      gravityY: gravity,
      blendMode: 'ADD',
      emitting: false,
    });
    e.setDepth(865);
    e.explode(count);
    this.time.delayedCall(800, () => e.destroy());
  }

  private floatText(x: number, y: number, text: string, color: string, big = false, size?: number) {
    const t = this.add.text(x, y, text, {
      fontFamily: 'Georgia, serif',
      fontSize: `${size ?? (big ? 40 : 28)}px`,
      color,
      stroke: '#000',
      strokeThickness: 5,
      fontStyle: 'bold',
    });
    t.setOrigin(0.5);
    t.setDepth(980);
    this.tweens.add({
      targets: t,
      y: y - 80,
      alpha: { from: 1, to: 0 },
      scale: { from: big ? 1.35 : 1, to: big ? 1.7 : 1.25 },
      duration: 1100,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  private punchZoom(zoom: number, ms: number) {
    const cam = this.cameras.main;
    this.tweens.add({
      targets: cam,
      zoom,
      duration: ms,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  private hitStop(ms: number) {
    if (!this.created) return;
    this.tweens.timeScale = 0.08;
    this.time.timeScale = 0.08;
    window.setTimeout(() => {
      this.tweens.timeScale = 1;
      this.time.timeScale = 1;
    }, ms);
  }

  // ============================================================
  // Musique
  // ============================================================

  playMusic(key: string, volume = 0.3, loop = true) {
    const fullKey = `music-${key}`;
    if (!this.cache.audio.exists(fullKey)) return;
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
    }
    try {
      const m = this.sound.add(fullKey, { loop, volume: this.muted ? 0 : volume });
      m.play();
      this.currentMusic = m;
    } catch { /* noop */ }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.currentMusic) (this.currentMusic as any).setMute?.(m);
  }
}
