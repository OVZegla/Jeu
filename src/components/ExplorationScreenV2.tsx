// Écran d'exploration V2 — HUD, dialogues, menu pause (équipe / inventaire /
// options / sauvegarde), interactions (documents, coffres, save point, portes,
// combats). La scène Phaser (ExplorationSceneV2) gère le rendu et remonte les
// événements ici.

import { useCallback, useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { ExplorationSceneV2 } from '../game/phaser/ExplorationSceneV2';
import type { ExitSide, Interactable, MapId } from '../game/types';
import { getMap, getZoneName } from '../data/maps';
import { getDialogue, type DialogueDef } from '../data/dialogues';
import { ITEMS } from '../data/items';
import { computeHeroStats, HERO_DEFS, type HeroState } from '../data/party';
import { getSkill } from '../data/skills';
import type { GameFlags } from '../game/core/save';
import { BALANCE2 } from '../game/balance';
import { playSfx, setSfxVolume, getSfxVolume, setSfxMuted } from '../game/core/sfx';
import { DialogueBox } from './DialogueBox';
import './ExplorationScreen.css';
import './ExplorationScreenV2.css';

export interface BattleRequest {
  groupId: string;
  interactableId: string;
  label: string;
  isBoss: boolean;
  outroDialogueId?: string;
}

interface Props {
  mapId: MapId;
  party: HeroState[];
  inventory: Record<string, number>;
  flags: GameFlags;
  spawnOverride: { x: number; y: number } | null;
  pendingDialogueId: string | null;   // ex: outro du boss au retour du combat
  muted: boolean;
  onMapChange: (mapId: MapId) => void;
  onPartyChange: (party: HeroState[]) => void;
  onInventoryChange: (inv: Record<string, number>) => void;
  onFlagsChange: (flags: GameFlags) => void;
  onStartBattle: (req: BattleRequest, playerPos: { x: number; y: number }) => void;
  onSaveGame: () => boolean;
  onPendingDialogueDone: () => void;
  onToggleMute: () => void;
  onQuitToTitle: () => void;
}

type PauseTab = 'main' | 'team' | 'inventory' | 'options';

export function ExplorationScreenV2(props: Props) {
  const {
    mapId, party, inventory, flags, spawnOverride, muted,
    onPartyChange, onInventoryChange,
    onSaveGame, onToggleMute, onQuitToTitle,
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<ExplorationSceneV2 | null>(null);
  const [entrySide, setEntrySide] = useState<ExitSide | null>(null);
  const [promptLabel, setPromptLabel] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pauseTab, setPauseTab] = useState<PauseTab>('main');
  const [teleportMenu, setTeleportMenu] = useState<Array<{ toMapId: MapId; label: string }> | null>(null);
  const [zoneTitle, setZoneTitle] = useState<string | null>(null);
  const [dialogue, setDialogue] = useState<{ def: DialogueDef; onDone?: () => void } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [volume, setVolume] = useState(() => Math.round(getSfxVolume() * 100));
  const prevZoneRef = useRef<string>('');

  // Refs stables pour les callbacks utilisés par la scène
  const stateRef = useRef({ mapId, party, inventory, flags });
  stateRef.current = { mapId, party, inventory, flags };
  const cbRef = useRef(props);
  cbRef.current = props;

  const showToast = useCallback((text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const openDialogue = useCallback((id: string, onDone?: () => void) => {
    const def = getDialogue(id);
    if (!def) { onDone?.(); return; }
    sceneRef.current?.setFrozen(true);
    setDialogue({ def, onDone });
  }, []);

  const closeDialogue = useCallback(() => {
    const d = dialogue;
    setDialogue(null);
    sceneRef.current?.setFrozen(false);
    d?.onDone?.();
  }, [dialogue]);

  // === Gestion des interactions remontées par la scène ===
  const handleInteract = useCallback((it: Interactable) => {
    const { flags: fl, inventory: inv, party: pt, mapId: mid } = stateRef.current;
    const scene = sceneRef.current;
    switch (it.type) {
      case 'document': {
        openDialogue(it.dialogueId, () => {
          if (!fl.readDocuments.includes(it.id)) {
            cbRef.current.onFlagsChange({ ...fl, readDocuments: [...fl.readDocuments, it.id] });
          }
        });
        break;
      }
      case 'chest': {
        const give = () => {
          const nextInv = { ...inv };
          for (const { itemId, count } of it.items) {
            nextInv[itemId] = (nextInv[itemId] || 0) + count;
          }
          const nextFlags: GameFlags = {
            ...fl,
            collectedItems: [...fl.collectedItems, it.id],
            sealFragments: fl.sealFragments + (it.sealFragment ? 1 : 0),
          };
          cbRef.current.onInventoryChange(nextInv);
          cbRef.current.onFlagsChange(nextFlags);
          scene?.setWorldFlags({
            defeatedGroups: nextFlags.defeatedGroups,
            collectedItems: nextFlags.collectedItems,
            sealFragments: nextFlags.sealFragments,
            bossDefeated: nextFlags.bossDefeated,
          });
          scene?.removeInteractable(it.id);
          scene?.refreshInteractables();
          playSfx('item');
          if (it.sealFragment) {
            showToast(`🗝 Fragment du Sceau obtenu (${nextFlags.sealFragments}/2)`);
          } else if (it.items.length > 0) {
            showToast(it.items.map((x) => `${ITEMS[x.itemId]?.icon ?? ''} ${ITEMS[x.itemId]?.name} ×${x.count}`).join(' — '));
          }
        };
        if (it.dialogueId) openDialogue(it.dialogueId, give);
        else give();
        break;
      }
      case 'savepoint': {
        openDialogue('save-point', () => {
          // Repos : PV/MP au max
          const healed = pt.map((h) => {
            const stats = computeHeroStats(h.heroId, h.level);
            return { ...h, hp: stats.maxHp, mp: stats.maxMp };
          });
          cbRef.current.onPartyChange(healed);
          const ok = cbRef.current.onSaveGame();
          playSfx('save');
          showToast(ok ? '💾 Partie sauvegardée — équipe reposée' : '⚠️ Sauvegarde impossible');
        });
        break;
      }
      case 'door': {
        if (it.lockedBySeal && fl.sealFragments < 2) {
          openDialogue('boss-door-locked');
          return;
        }
        const go = () => {
          setEntrySide(null);
          cbRef.current.onMapChange(it.toMapId);
        };
        if (it.lockedBySeal && !fl.bossIntroSeen && fl.sealFragments >= 2) {
          openDialogue('boss-door-open', go);
        } else {
          go();
        }
        break;
      }
      case 'battle': {
        scene?.playBattleTransition(() => {
          triggerBattle(it.groupId, it.id, it.label, false);
        });
        break;
      }
      case 'boss': {
        // Les anciens camps de Lamber (type 'boss' sans groupId) tombent sur
        // le groupe générique 'lamber-camp'.
        const groupId = it.groupId ?? (it.id === 'champion' ? 'archives-boss' : 'lamber-camp');
        const isRealBoss = it.id === 'champion';
        const start = () => {
          scene?.playBattleTransition(() => {
            triggerBattle(groupId, it.id, it.label, isRealBoss, it.outroDialogueId);
          });
        };
        if (it.introDialogueId && !fl.bossIntroSeen) {
          openDialogue(it.introDialogueId, () => {
            cbRef.current.onFlagsChange({ ...fl, bossIntroSeen: true });
            start();
          });
        } else {
          start();
        }
        break;
      }
      case 'teleportMenu': {
        setTeleportMenu(it.destinations);
        break;
      }
      case 'teleport':
        break; // géré directement par la scène
    }

    function triggerBattle(groupId: string, interactableId: string, label: string, isBoss: boolean, outroDialogueId?: string) {
      const pos = { x: 0, y: 0 };
      // Position relative du joueur pour respawn au même endroit
      const m = getMap(mid);
      void m;
      cbRef.current.onStartBattle(
        { groupId, interactableId, label, isBoss, outroDialogueId },
        pos
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openDialogue, showToast]);

  // === Bootstrap Phaser ===
  const sceneBootedRef = useRef(false);
  const isFirstMapRender = useRef(true);
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    // StrictMode : chaque (re)montage repart de zéro.
    isFirstMapRender.current = true;
    sceneBootedRef.current = false;

    const scene = new ExplorationSceneV2({
      onNearInteractable: (label) => setPromptLabel(label),
      onInteract: (it) => handleInteractRef.current(it),
      onAggroBattle: (it) => {
        cbRef.current.onStartBattle(
          { groupId: it.groupId, interactableId: it.id, label: it.label, isBoss: false },
          { x: 0, y: 0 }
        );
      },
      onTeleport: (toMapId, fromSide) => {
        setEntrySide(fromSide ?? null);
        cbRef.current.onMapChange(toMapId);
      },
      onReady: () => {
        sceneBootedRef.current = true;
        // Dialogue en attente (ex: outro du boss après la victoire)
        if (cbRef.current.pendingDialogueId) {
          const id = cbRef.current.pendingDialogueId;
          setTimeout(() => {
            openDialogueRef.current(id, () => cbRef.current.onPendingDialogueDone());
          }, 600);
        }
      },
    }, mapId);
    scene.setWorldFlags({
      defeatedGroups: flags.defeatedGroups,
      collectedItems: flags.collectedItems,
      sealFragments: flags.sealFragments,
      bossDefeated: flags.bossDefeated,
    });
    sceneRef.current = scene;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container,
      width: container.clientWidth,
      height: container.clientHeight,
      transparent: true,
      pixelArt: true,
      scene: [scene],
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    });
    gameRef.current = game;

    return () => {
      sceneRef.current = null;
      game.destroy(true);
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInteractRef = useRef(handleInteract);
  handleInteractRef.current = handleInteract;
  const openDialogueRef = useRef(openDialogue);
  openDialogueRef.current = openDialogue;

  // Spawn override (retour de combat au même endroit) — appliqué au 1er render
  useEffect(() => {
    void spawnOverride;
    // (la position exacte est ré-appliquée via mapId ; simplification volontaire)
  }, [spawnOverride]);

  // Changement de map
  useEffect(() => {
    if (isFirstMapRender.current) {
      isFirstMapRender.current = false;
      prevZoneRef.current = getZoneName(mapId);
      setZoneTitle(getZoneName(mapId));
      const t = setTimeout(() => setZoneTitle(null), 2200);
      return () => clearTimeout(t);
    }
    // La scène charge sa map initiale dans create() ; ne bascule que si bootée.
    if (!sceneBootedRef.current) return;
    sceneRef.current?.setWorldFlags({
      defeatedGroups: flags.defeatedGroups,
      collectedItems: flags.collectedItems,
      sealFragments: flags.sealFragments,
      bossDefeated: flags.bossDefeated,
    });
    sceneRef.current?.applyMapSwitch(mapId, entrySide || undefined);
    setPromptLabel(null);
    setMenuOpen(false);
    setTeleportMenu(null);

    const newZone = getZoneName(mapId);
    if (newZone !== prevZoneRef.current) {
      prevZoneRef.current = newZone;
      setZoneTitle(newZone);
      const t = setTimeout(() => setZoneTitle(null), 2400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId]);

  // Échap → menu pause
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (dialogue) return;
        setMenuOpen((o) => {
          const next = !o;
          sceneRef.current?.setFrozen(next);
          if (next) setPauseTab('main');
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialogue]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    sceneRef.current?.setFrozen(false);
  }, []);

  // Utiliser un objet depuis le menu pause
  const useItemOnHero = useCallback((itemId: string, heroId: string) => {
    const item = ITEMS[itemId];
    if (!item || (inventory[itemId] || 0) <= 0) return;
    const hero = party.find((h) => h.heroId === heroId);
    if (!hero) return;
    const stats = computeHeroStats(hero.heroId, hero.level);
    let next: HeroState | null = null;
    if (item.effect === 'heal' && hero.hp > 0 && hero.hp < stats.maxHp) {
      next = { ...hero, hp: Math.min(stats.maxHp, hero.hp + item.value) };
    } else if (item.effect === 'mp' && hero.hp > 0 && hero.mp < stats.maxMp) {
      next = { ...hero, mp: Math.min(stats.maxMp, hero.mp + item.value) };
    } else if (item.effect === 'revive' && hero.hp <= 0) {
      next = { ...hero, hp: Math.max(1, Math.round(stats.maxHp * item.value)) };
    }
    if (!next) {
      showToast('Aucun effet…');
      return;
    }
    playSfx('item');
    onPartyChange(party.map((h) => (h.heroId === heroId ? next! : h)));
    onInventoryChange({ ...inventory, [itemId]: inventory[itemId] - 1 });
  }, [inventory, party, onPartyChange, onInventoryChange, showToast]);

  const map = getMap(mapId);
  const isEngagePrompt = !!promptLabel && promptLabel.includes('⚔');

  return (
    <div className="exploration-screen">
      <div ref={containerRef} className="exploration-canvas" />

      <div className="ex-hud-top">
        <div className="ex-title">{map.name}</div>
        <div className="ex-objective">
          {flags.bossDefeated
            ? '✅ Les Archives sont purifiées.'
            : flags.sealFragments >= 2
              ? '⚖️ Le Sceau est complet — la Salle du Jugement attend.'
              : `🗝 Fragments du Sceau : ${flags.sealFragments}/2`}
        </div>
      </div>

      <button className="ex-menu-btn" onClick={() => { setMenuOpen(true); setPauseTab('main'); sceneRef.current?.setFrozen(true); }} title="Menu (Échap)" aria-label="Menu">☰</button>

      <div className="ex-controls-hint">
        <span className="ex-key">↑↓←→</span> / <span className="ex-key">WASD</span>
        &nbsp;•&nbsp;<span className="ex-key">ESPACE</span> interagir
        &nbsp;•&nbsp;<span className="ex-key">ÉCHAP</span> menu
        &nbsp;•&nbsp;<span className="ex-key">B</span> debug
      </div>

      {promptLabel && !dialogue && !menuOpen && (
        <button
          className={`ex-engage-btn ${isEngagePrompt ? 'ex-engage-btn-combat' : 'ex-engage-btn-teleport'}`}
          onClick={() => sceneRef.current?.interact()}
        >
          {promptLabel}
        </button>
      )}

      {toast && <div className="exv2-toast">{toast}</div>}

      {/* === Menu pause === */}
      {menuOpen && (
        <div className="ex-menu-overlay" onClick={closeMenu}>
          <div className="exv2-pause-panel" onClick={(e) => e.stopPropagation()}>
            {pauseTab === 'main' && (
              <>
                <div className="ex-menu-title">▶ Menu</div>
                <ul className="ex-menu-list">
                  <li><button className="ex-menu-item" onClick={closeMenu}>↩ Reprendre</button></li>
                  <li><button className="ex-menu-item" onClick={() => setPauseTab('team')}>👥 Équipe</button></li>
                  <li><button className="ex-menu-item" onClick={() => setPauseTab('inventory')}>🎒 Inventaire</button></li>
                  <li><button className="ex-menu-item" onClick={() => setPauseTab('options')}>⚙️ Options</button></li>
                  <li>
                    <button
                      className="ex-menu-item"
                      onClick={() => {
                        const ok = onSaveGame();
                        playSfx('save');
                        showToast(ok ? '💾 Partie sauvegardée' : '⚠️ Sauvegarde impossible');
                      }}
                    >💾 Sauvegarder</button>
                  </li>
                  <li><button className="ex-menu-item exv2-danger" onClick={onQuitToTitle}>⏻ Menu titre</button></li>
                </ul>
              </>
            )}

            {pauseTab === 'team' && (
              <>
                <div className="ex-menu-title">👥 Équipe</div>
                <div className="exv2-team">
                  {party.map((h) => {
                    const def = HERO_DEFS[h.heroId];
                    const stats = computeHeroStats(h.heroId, h.level);
                    const xpNeed = BALANCE2.xpForLevel(h.level);
                    return (
                      <div key={h.heroId} className="exv2-team-card" style={{ borderColor: def.color }}>
                        <div className="exv2-team-head">
                          <b>{def.icon} {def.name}</b>
                          <span>Nv {h.level}</span>
                        </div>
                        <div className="exv2-team-class">{def.className}</div>
                        <div className="exv2-team-stat">PV {h.hp}/{stats.maxHp} — MP {h.mp}/{stats.maxMp}</div>
                        <div className="exv2-team-stat">XP {h.xp}/{xpNeed}</div>
                        <div className="exv2-xp-track"><div style={{ width: `${Math.min(100, (h.xp / xpNeed) * 100)}%` }} /></div>
                        <div className="exv2-team-skills">
                          {def.skillIds.filter((s) => s !== 'garde').map((sid) => {
                            const s = getSkill(sid);
                            return <span key={sid} title={`${s.name} — ${s.description}`}>{s.icon}</span>;
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button className="ex-menu-item back" onClick={() => setPauseTab('main')}>↩ Retour</button>
              </>
            )}

            {pauseTab === 'inventory' && (
              <>
                <div className="ex-menu-title">🎒 Inventaire</div>
                <div className="exv2-inventory">
                  {Object.entries(inventory).filter(([, n]) => n > 0).length === 0 && (
                    <div className="exv2-empty">Sacoche vide…</div>
                  )}
                  {Object.entries(inventory).filter(([, n]) => n > 0).map(([itemId, count]) => {
                    const item = ITEMS[itemId];
                    if (!item) return null;
                    return (
                      <div key={itemId} className="exv2-item-row">
                        <div className="exv2-item-info" title={item.description}>
                          {item.icon} <b>{item.name}</b> ×{count}
                          <div className="exv2-item-desc">{item.description}</div>
                        </div>
                        {item.usableInExploration && (
                          <div className="exv2-item-targets">
                            {party.map((h) => (
                              <button
                                key={h.heroId}
                                title={`Utiliser sur ${HERO_DEFS[h.heroId].name}`}
                                onClick={() => useItemOnHero(itemId, h.heroId)}
                              >
                                {HERO_DEFS[h.heroId].icon}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button className="ex-menu-item back" onClick={() => setPauseTab('main')}>↩ Retour</button>
              </>
            )}

            {pauseTab === 'options' && (
              <>
                <div className="ex-menu-title">⚙️ Options</div>
                <div className="exv2-options">
                  <label className="exv2-opt-row">
                    <span>🔊 Volume des effets</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={volume}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setVolume(v);
                        setSfxVolume(v / 100);
                      }}
                      onMouseUp={() => playSfx('menu_click')}
                    />
                  </label>
                  <label className="exv2-opt-row">
                    <span>{muted ? '🔇 Son coupé' : '🔊 Son actif'}</span>
                    <button className="ex-menu-item" onClick={() => { onToggleMute(); setSfxMuted(!muted); }}>
                      {muted ? 'Réactiver' : 'Couper'}
                    </button>
                  </label>
                  <div className="exv2-opt-note">
                    Rendu pixel art natif — les commandes clavier/souris/tactile sont actives.
                  </div>
                </div>
                <button className="ex-menu-item back" onClick={() => setPauseTab('main')}>↩ Retour</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* === Menu téléport === */}
      {teleportMenu && (
        <div className="ex-tp-menu-overlay" onClick={() => setTeleportMenu(null)}>
          <div className="ex-tp-menu-panel" onClick={(e) => e.stopPropagation()}>
            <div className="ex-tp-menu-title">🪨 Choisis ta destination</div>
            <ul className="ex-menu-list">
              {teleportMenu.map((d) => (
                <li key={d.toMapId}>
                  <button
                    className="ex-menu-item"
                    onClick={() => {
                      setTeleportMenu(null);
                      sceneRef.current?.triggerTeleport(d.toMapId);
                    }}
                  >{d.label}</button>
                </li>
              ))}
              <li>
                <button className="ex-menu-item ex-menu-cancel" onClick={() => setTeleportMenu(null)}>↩ Annuler</button>
              </li>
            </ul>
          </div>
        </div>
      )}

      {zoneTitle && (
        <div className="ex-zone-title" key={zoneTitle}>
          <div className="ex-zone-title-text">{zoneTitle}</div>
        </div>
      )}

      {dialogue && <DialogueBox dialogue={dialogue.def} onComplete={closeDialogue} />}
    </div>
  );
}
