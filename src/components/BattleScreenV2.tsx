// Écran de combat V2 — HUD React + arène Phaser (BattleSceneV2).
// Le moteur (engine.ts) renvoie des événements ; le séquenceur ci-dessous les
// joue dans l'ordre avec les bons timings : les dégâts ne s'affichent qu'au
// moment où l'attaque touche visuellement la cible.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Phaser from 'phaser';
import type {
  BattleState,
  CombatEvent,
  Combatant,
  HeroCombatant,
  PlayerAction,
  Skill,
} from '../game/combat/types';
import {
  beginBattle,
  canUseSkill,
  createBattle,
  findCombatant,
  forecastTurnOrder,
  submitPlayerAction,
} from '../game/combat/engine';
import { getSkill } from '../data/skills';
import { BattleSceneV2 } from '../game/phaser/BattleSceneV2';
import { getItem, ITEMS } from '../data/items';
import type { HeroState } from '../data/party';
import { playSfx } from '../game/core/sfx';
import { CombatLog } from './CombatLog';
import type { CombatLogEntry } from '../game/types';
import './BattleScreenV2.css';

export interface BattleResult {
  victory: boolean;
  heroes: HeroCombatant[];
  inventory: Record<string, number>;
  xpGained: number;
  drops: Array<{ itemId: string; count: number }>;
}

interface Props {
  party: HeroState[];
  inventory: Record<string, number>;
  groupId: string;
  battleLabel: string;
  muted: boolean;
  onEnd: (result: BattleResult) => void;
}

type MenuMode =
  | { kind: 'root' }
  | { kind: 'skills' }
  | { kind: 'items' }
  | { kind: 'target'; skill?: Skill; itemId?: string; targets: Combatant[] };

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function BattleScreenV2({ party, inventory, groupId, battleLabel, muted, onEnd }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<BattleSceneV2 | null>(null);
  const aliveRef = useRef(true);

  // État moteur (autoritatif) + état affiché (patché par les events)
  const engineRef = useRef<BattleState>(null!);
  if (engineRef.current === null) {
    engineRef.current = createBattle(party, groupId, inventory);
  }
  const [display, setDisplay] = useState<BattleState>(engineRef.current);
  const displayRef = useRef(display);
  displayRef.current = display;

  const [log, setLog] = useState<CombatLogEntry[]>([]);
  const logCounter = useRef(0);
  const [menu, setMenu] = useState<MenuMode>({ kind: 'root' });
  const [inputEnabled, setInputEnabled] = useState(false);
  const [banner, setBanner] = useState<string | null>(battleLabel);
  const [warning, setWarning] = useState<string | null>(null);
  const [rewards, setRewards] = useState<{ xp: number; drops: Array<{ itemId: string; count: number }> } | null>(null);
  const [defeated, setDefeated] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);

  const pushLog = useCallback((text: string, kind: CombatLogEntry['kind']) => {
    logCounter.current += 1;
    const id = logCounter.current;
    setLog((l) => [...l, { id, turn: displayRef.current.round, text, kind }].slice(-60));
  }, []);

  // === Phaser bootstrap ===
  useEffect(() => {
    aliveRef.current = true;
    if (!containerRef.current) return;
    const scene = new BattleSceneV2({
      onReady: (s) => {
        sceneRef.current = s;
        s.setMuted(muted);
        setSceneReady(true);
      },
      onCombatantClicked: (id) => {
        clickTargetRef.current?.(id);
      },
    });
    scene.setInitialCombatants(engineRef.current.heroes, engineRef.current.enemies);
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      transparent: true,
      pixelArt: true,
      scene: [scene],
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    });
    gameRef.current = game;
    return () => {
      aliveRef.current = false;
      sceneRef.current = null;
      game.destroy(true);
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sceneRef.current?.setMuted(muted);
  }, [muted]);

  // === Séquenceur d'événements ===
  const playEvents = useCallback(async (events: CombatEvent[], finalState: BattleState) => {
    const scene = sceneRef.current;
    for (const ev of events) {
      if (!aliveRef.current) return;
      switch (ev.t) {
        case 'log':
          pushLog(ev.text, ev.kind);
          break;
        case 'turnStart': {
          scene?.setActiveTurn(ev.combatantId);
          const c = findCombatant(displayRef.current, ev.combatantId);
          if (c && c.kind === 'enemy') await sleep(420);
          else await sleep(180);
          break;
        }
        case 'cast': {
          const skill = getSkill(ev.skillId);
          const delay = scene?.playCastAnim(ev.casterId, ev.targetIds, skill.presentation) ?? skill.presentation.hitDelayMs;
          await sleep(delay);
          break;
        }
        case 'damage': {
          const skill = getSkill(ev.skillId);
          scene?.playImpact(ev.targetId, ev.amount, {
            crit: ev.crit,
            effectiveness: ev.effectiveness,
            pres: skill.presentation,
          });
          patchHp(ev.targetId, ev.hpAfter);
          await sleep(280);
          break;
        }
        case 'tickDamage':
          scene?.playTickDamage(ev.targetId, ev.amount);
          patchHp(ev.targetId, ev.hpAfter);
          await sleep(300);
          break;
        case 'heal':
        case 'tickHeal':
          scene?.playHeal(ev.targetId, ev.amount);
          patchHp(ev.targetId, ev.hpAfter);
          await sleep(300);
          break;
        case 'mpChange':
          scene?.playMpChange(ev.targetId, ev.amount);
          patchMp(ev.targetId, ev.mpAfter);
          break;
        case 'status':
          scene?.playStatus(ev.targetId, ev.effect.icon, ev.positive);
          patchStatus(ev.targetId, ev.effect);
          await sleep(240);
          break;
        case 'death':
          scene?.playDeath(ev.targetId);
          patchDeath(ev.targetId);
          await sleep(500);
          break;
        case 'revive':
          scene?.playRevive(ev.targetId);
          patchRevive(ev.targetId, ev.hpAfter);
          await sleep(400);
          break;
        case 'item': {
          const item = getItem(ev.itemId);
          playSfx('item');
          setWarning(`${item.icon} ${item.name}`);
          setTimeout(() => setWarning(null), 1200);
          await sleep(350);
          break;
        }
        case 'summon':
          scene?.addSummons(ev.enemies);
          setDisplay((d) => ({ ...d, enemies: [...d.enemies, ...ev.enemies] }));
          await sleep(700);
          break;
        case 'telegraph':
          scene?.playTelegraph(ev.casterId, ev.text);
          setWarning(ev.text);
          await sleep(1100);
          break;
        case 'bossPhase':
          scene?.playBossPhase(ev.phase);
          setBanner(ev.text);
          await sleep(1500);
          setBanner(null);
          break;
        case 'skipTurn':
          await sleep(350);
          break;
        case 'victory': {
          // Nettoie les télégraphes restants
          for (const e of displayRef.current.enemies) scene?.clearTelegraph(e.id);
          scene?.playVictory();
          await sleep(1400);
          setRewards({ xp: ev.xpGained, drops: ev.drops });
          break;
        }
        case 'defeat':
          scene?.playDefeat();
          await sleep(1600);
          setDefeated(true);
          break;
      }
    }
    if (!aliveRef.current) return;
    // Synchronise l'affichage sur l'état final du moteur.
    setDisplay(finalState);
    if (finalState.phase === 'playerAction' && finalState.activeId) {
      // Efface le télégraphe visuel quand l'attaque est partie
      const boss = finalState.enemies.find((e) => e.isBoss);
      if (boss && finalState.boss && !finalState.boss.telegraphSkillId) {
        scene?.clearTelegraph(boss.id);
        setWarning(null);
      }
      scene?.setActiveTurn(finalState.activeId);
      setMenu({ kind: 'root' });
      setInputEnabled(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Patches locaux du displayState (HUD synchronisé avec les impacts)
  const patchCombatant = (id: string, patch: (c: Combatant) => Partial<Combatant>) => {
    setDisplay((d) => ({
      ...d,
      heroes: d.heroes.map((h) => (h.id === id ? { ...h, ...patch(h) } as HeroCombatant : h)),
      enemies: d.enemies.map((e) => (e.id === id ? { ...e, ...patch(e) } as typeof e : e)),
    }));
  };
  const patchHp = (id: string, hp: number) => patchCombatant(id, () => ({ hp }));
  const patchMp = (id: string, mp: number) => patchCombatant(id, () => ({ mp }));
  const patchDeath = (id: string) => patchCombatant(id, () => ({ alive: false, hp: 0, status: [] }));
  const patchRevive = (id: string, hp: number) => patchCombatant(id, () => ({ alive: true, hp }));
  const patchStatus = (id: string, effect: Combatant['status'][number]) =>
    patchCombatant(id, (c) => ({ status: [...c.status.filter((s) => s.type !== effect.type), effect] }));

  // === Démarrage du combat (après que la scène est prête) ===
  const started = useRef(false);
  useEffect(() => {
    if (!sceneReady || started.current) return;
    started.current = true;
    (async () => {
      await sleep(900); // laisse jouer l'animation d'entrée
      if (!aliveRef.current) return;
      setBanner(null);
      const result = beginBattle(engineRef.current);
      engineRef.current = result.state;
      await playEvents(result.events, result.state);
    })();
  }, [sceneReady, playEvents]);

  // === Actions du joueur ===
  const activeHero = useMemo(() => {
    if (display.phase !== 'playerAction' || !display.activeId) return null;
    const c = findCombatant(display, display.activeId);
    return c && c.kind === 'hero' ? c : null;
  }, [display]);

  const dispatchAction = useCallback(async (action: PlayerAction) => {
    if (!inputEnabled) return;
    setInputEnabled(false);
    setMenu({ kind: 'root' });
    sceneRef.current?.clearHighlights();
    const result = submitPlayerAction(engineRef.current, action);
    engineRef.current = result.state;
    await playEvents(result.events, result.state);
  }, [inputEnabled, playEvents]);

  // Sélection de cible (clic sur sprite Phaser ou sur la liste HTML)
  const clickTargetRef = useRef<((id: string) => void) | null>(null);
  useEffect(() => {
    clickTargetRef.current = (id: string) => {
      if (menu.kind !== 'target' || !inputEnabled) return;
      const valid = menu.targets.some((t) => t.id === id);
      if (!valid) return;
      playSfx('menu_click');
      if (menu.skill) {
        dispatchAction({ type: 'skill', skillId: menu.skill.id, targetId: id });
      } else if (menu.itemId) {
        dispatchAction({ type: 'item', itemId: menu.itemId, targetId: id });
      }
    };
  }, [menu, inputEnabled, dispatchAction]);

  const startSkill = useCallback((skill: Skill) => {
    if (!activeHero) return;
    playSfx('menu_click');
    if (skill.target === 'enemy') {
      const targets = display.enemies.filter((e) => e.alive);
      if (targets.length === 1) {
        dispatchAction({ type: 'skill', skillId: skill.id, targetId: targets[0].id });
        return;
      }
      setMenu({ kind: 'target', skill, targets });
      sceneRef.current?.setTargetHighlight(targets.map((t) => t.id));
      return;
    }
    if (skill.target === 'ally') {
      const targets = display.heroes.filter((h) => h.alive);
      setMenu({ kind: 'target', skill, targets });
      return;
    }
    dispatchAction({ type: 'skill', skillId: skill.id, targetId: null });
  }, [activeHero, display, dispatchAction]);

  const startItem = useCallback((itemId: string) => {
    const item = getItem(itemId);
    playSfx('menu_click');
    const targets = item.targetDead
      ? display.heroes.filter((h) => !h.alive)
      : display.heroes.filter((h) => h.alive);
    if (targets.length === 0) {
      setWarning(item.targetDead ? 'Aucun allié KO.' : 'Aucune cible valide.');
      setTimeout(() => setWarning(null), 1200);
      return;
    }
    setMenu({ kind: 'target', itemId, targets });
  }, [display]);

  const cancelTarget = useCallback(() => {
    playSfx('menu_move');
    sceneRef.current?.clearHighlights();
    setMenu({ kind: 'root' });
  }, []);

  // Échap pour annuler la visée / revenir
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menu.kind !== 'root') {
        cancelTarget();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu, cancelTarget]);

  // === Fin de combat ===
  const finish = useCallback((victory: boolean) => {
    onEnd({
      victory,
      heroes: engineRef.current.heroes,
      inventory: engineRef.current.inventory,
      xpGained: rewards?.xp ?? 0,
      drops: rewards?.drops ?? [],
    });
  }, [onEnd, rewards]);

  // === Rendu ===
  const turnOrder = useMemo(() => forecastTurnOrder(display, 8), [display]);
  const bossEnemy = display.enemies.find((e) => e.isBoss);

  return (
    <div className="bv2">
      {/* Ordre des tours */}
      <div className="bv2-turn-order">
        <span className="bv2-to-label">Tours</span>
        {turnOrder.map((t, i) => {
          const c = findCombatant(display, t.combatantId);
          if (!c) return null;
          return (
            <span
              key={`${t.combatantId}-${i}`}
              className={`bv2-to-chip ${t.isHero ? 'hero' : 'enemy'} ${i === 0 ? 'current' : ''}`}
              title={c.name}
              style={{ borderColor: c.color }}
            >
              {c.icon}
            </span>
          );
        })}
        <span className="bv2-to-round">Round {display.round}</span>
      </div>

      {/* Barre boss */}
      {bossEnemy && (
        <div className={`bv2-boss-bar ${!bossEnemy.alive ? 'dead' : ''}`}>
          <div className="bv2-boss-name">
            {bossEnemy.icon} {bossEnemy.name}
            {display.boss && display.boss.phase >= 3 && <span className="bv2-boss-enrage"> — ENRAGÉ</span>}
          </div>
          <div className="bv2-hp-track">
            <div
              className={`bv2-hp-fill boss ${display.boss && display.boss.phase >= 3 ? 'enraged' : ''}`}
              style={{ width: `${(bossEnemy.hp / bossEnemy.maxHp) * 100}%` }}
            />
          </div>
          <div className="bv2-boss-status">
            {bossEnemy.status.map((s) => (
              <span key={s.id} title={`${s.name} — ${s.description}`}>{s.icon}</span>
            ))}
            {display.enemies.some((e) => e.alive && e.enemyId === 'page') && (
              <span className="bv2-shielded" title="Protégé par les Pages : détruisez-les !">📚 PROTÉGÉ</span>
            )}
          </div>
        </div>
      )}

      {/* Ennemis normaux (plaques compactes) */}
      <div className="bv2-enemy-plates">
        {display.enemies.filter((e) => !e.isBoss).map((e) => (
          <button
            key={e.id}
            className={`bv2-enemy-plate ${!e.alive ? 'dead' : ''} ${menu.kind === 'target' && menu.targets.some((t) => t.id === e.id) ? 'targetable' : ''}`}
            onClick={() => clickTargetRef.current?.(e.id)}
            disabled={menu.kind !== 'target' || !menu.targets.some((t) => t.id === e.id)}
          >
            <span className="bv2-ep-name">{e.icon} {e.name}</span>
            <span className="bv2-hp-track small">
              <span className="bv2-hp-fill enemy" style={{ width: `${(e.hp / e.maxHp) * 100}%` }} />
            </span>
            <span className="bv2-ep-status">{e.status.map((s) => s.icon).join(' ')}</span>
          </button>
        ))}
      </div>

      {/* Arène Phaser */}
      <div ref={containerRef} className="bv2-canvas" />

      {/* Bannière (nom du combat / phase boss) */}
      {banner && <div className="bv2-banner"><span>{banner}</span></div>}
      {warning && <div className="bv2-warning">{warning}</div>}

      {/* Ciblage : hint + annulation */}
      {menu.kind === 'target' && (
        <div className="bv2-target-hint">
          🎯 Choisis une cible {menu.skill ? `pour « ${menu.skill.name} »` : ''}
          <button onClick={cancelTarget}>Annuler (Échap)</button>
        </div>
      )}

      {/* Bas d'écran : cartes héros + menu d'action + log */}
      <div className="bv2-bottom">
        <div className="bv2-heroes">
          {display.heroes.map((h) => {
            const isActive = activeHero?.id === h.id && inputEnabled;
            const targetable = menu.kind === 'target' && menu.targets.some((t) => t.id === h.id);
            return (
              <button
                key={h.id}
                className={`bv2-hero-card ${!h.alive ? 'dead' : ''} ${isActive ? 'active' : ''} ${targetable ? 'targetable' : ''}`}
                style={{ borderColor: h.color }}
                onClick={() => targetable && clickTargetRef.current?.(h.id)}
                disabled={!targetable}
              >
                <div className="bv2-hc-head">
                  <span className="bv2-hc-name">{h.icon} {h.name}</span>
                  <span className="bv2-hc-level">Nv {h.level}</span>
                </div>
                <div className="bv2-hp-track">
                  <div className="bv2-hp-fill" style={{ width: `${(h.hp / h.maxHp) * 100}%` }} />
                  <span className="bv2-hp-text">{h.hp}/{h.maxHp}</span>
                </div>
                <div className="bv2-mp-track">
                  <div className="bv2-mp-fill" style={{ width: `${(h.mp / h.maxMp) * 100}%` }} />
                  <span className="bv2-hp-text">{h.mp} MP</span>
                </div>
                <div className="bv2-hc-status">
                  {h.status.map((s) => (
                    <span key={s.id} title={`${s.name} — ${s.description}`}>{s.icon}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="bv2-menu">
          {activeHero && inputEnabled && menu.kind === 'root' && (
            <RootMenu
              hero={activeHero}
              inventory={display.inventory}
              onSkill={startSkill}
              onOpenSkills={() => { playSfx('menu_move'); setMenu({ kind: 'skills' }); }}
              onOpenItems={() => { playSfx('menu_move'); setMenu({ kind: 'items' }); }}
            />
          )}
          {activeHero && inputEnabled && menu.kind === 'skills' && (
            <SkillsMenu hero={activeHero} onSkill={startSkill} onBack={cancelTarget} />
          )}
          {activeHero && inputEnabled && menu.kind === 'items' && (
            <ItemsMenu inventory={display.inventory} onItem={startItem} onBack={cancelTarget} />
          )}
          {(!activeHero || !inputEnabled) && menu.kind !== 'target' && (
            <div className="bv2-waiting">
              {display.phase === 'victory' || display.phase === 'defeat' ? '' : '⌛ …'}
            </div>
          )}
        </div>

        <div className="bv2-log">
          <CombatLog log={log} />
        </div>
      </div>

      {/* Panneau de récompenses */}
      {rewards && (
        <div className="bv2-overlay">
          <div className="bv2-panel">
            <h2>🏆 Victoire !</h2>
            <p className="bv2-xp">+{rewards.xp} XP pour chaque héros</p>
            {rewards.drops.length > 0 && (
              <ul className="bv2-drops">
                {rewards.drops.map((d, i) => {
                  const item = ITEMS[d.itemId];
                  return <li key={i}>{item?.icon} {item?.name} ×{d.count}</li>;
                })}
              </ul>
            )}
            <button className="bv2-btn" onClick={() => finish(true)}>Continuer ▶</button>
          </div>
        </div>
      )}

      {/* Défaite */}
      {defeated && (
        <div className="bv2-overlay dark">
          <div className="bv2-panel">
            <h2>💀 Archivés…</h2>
            <p>L'équipe a été classée sans suite.</p>
            <button className="bv2-btn" onClick={() => finish(false)}>Continuer</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Sous-menus
// ============================================================

function RootMenu({ hero, inventory, onSkill, onOpenSkills, onOpenItems }: {
  hero: HeroCombatant;
  inventory: Record<string, number>;
  onSkill: (s: Skill) => void;
  onOpenSkills: () => void;
  onOpenItems: () => void;
}) {
  const attack = hero.skillIds.map(getSkill).find((s) => s.menuSlot === 'attaque');
  const guard = hero.skillIds.map(getSkill).find((s) => s.id === 'garde');
  const itemCount = Object.values(inventory).reduce((s, n) => s + n, 0);
  return (
    <div className="bv2-root-menu">
      <div className="bv2-menu-title">▶ {hero.name}</div>
      {attack && (
        <button className="bv2-menu-item" onClick={() => onSkill(attack)}>
          {attack.icon} Attaque <small>{attack.name}</small>
        </button>
      )}
      {guard && (
        <button className="bv2-menu-item" onClick={() => onSkill(guard)}>
          🛡 Garde <small>-{Math.round(55)}% dégâts</small>
        </button>
      )}
      <button className="bv2-menu-item" onClick={onOpenSkills}>✦ Compétences</button>
      <button className="bv2-menu-item" onClick={onOpenItems} disabled={itemCount === 0}>
        🎒 Objets <small>{itemCount}</small>
      </button>
    </div>
  );
}

function SkillsMenu({ hero, onSkill, onBack }: {
  hero: HeroCombatant;
  onSkill: (s: Skill) => void;
  onBack: () => void;
}) {
  const skills = hero.skillIds.map(getSkill).filter((s) => s.menuSlot === 'special');
  return (
    <div className="bv2-sub-menu">
      <div className="bv2-menu-title">✦ Compétences</div>
      {skills.map((s) => {
        const usable = canUseSkill(hero, s);
        const cd = hero.cooldowns[s.id] || 0;
        return (
          <button
            key={s.id}
            className="bv2-menu-item"
            disabled={!usable}
            onClick={() => onSkill(s)}
            title={s.description}
          >
            {s.icon} {s.name}
            <small>
              {s.mpCost > 0 ? `${s.mpCost} MP` : ''}
              {cd > 0 ? ` ⏳${cd}t` : ''}
            </small>
            <span className="bv2-skill-desc">{s.description}</span>
          </button>
        );
      })}
      <button className="bv2-menu-item back" onClick={onBack}>↩ Retour</button>
    </div>
  );
}

function ItemsMenu({ inventory, onItem, onBack }: {
  inventory: Record<string, number>;
  onItem: (itemId: string) => void;
  onBack: () => void;
}) {
  const entries = Object.entries(inventory).filter(([, n]) => n > 0);
  return (
    <div className="bv2-sub-menu">
      <div className="bv2-menu-title">🎒 Objets</div>
      {entries.length === 0 && <div className="bv2-empty">Sacoche vide…</div>}
      {entries.map(([itemId, count]) => {
        const item = ITEMS[itemId];
        if (!item) return null;
        return (
          <button key={itemId} className="bv2-menu-item" onClick={() => onItem(itemId)} title={item.description}>
            {item.icon} {item.name} <small>×{count}</small>
            <span className="bv2-skill-desc">{item.description}</span>
          </button>
        );
      })}
      <button className="bv2-menu-item back" onClick={onBack}>↩ Retour</button>
    </div>
  );
}
