// App V2 — machine à états du jeu :
// title → exploration ⇄ battle → ending.
// L'état de la partie (équipe, inventaire, progression, map) vit ici et
// se persiste via core/save.ts. Le combat vit dans BattleScreenV2 (moteur V2).

import { useCallback, useEffect, useRef, useState } from 'react';
import { StartScreenV2 } from './components/StartScreenV2';
import { ExplorationScreenV2, type BattleRequest } from './components/ExplorationScreenV2';
import { BattleScreenV2, type BattleResult } from './components/BattleScreenV2';
import { createInitialHeroStates, type HeroState, HERO_DEFS } from './data/party';
import { START_MAP_ID } from './data/maps';
import { BALANCE2 } from './game/balance';
import { applyXp } from './game/core/progression';
import {
  createInitialFlags,
  loadGame,
  saveGame,
  type GameFlags,
} from './game/core/save';
import { playSfx, setSfxMuted } from './game/core/sfx';

type Screen = 'title' | 'exploration' | 'battle' | 'ending';

interface RunState {
  party: HeroState[];
  inventory: Record<string, number>;
  flags: GameFlags;
  mapId: string;
}

function freshRun(): RunState {
  return {
    party: createInitialHeroStates(),
    inventory: { ...BALANCE2.startingInventory },
    flags: createInitialFlags(),
    mapId: START_MAP_ID,
  };
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [run, setRun] = useState<RunState>(freshRun);
  const [battle, setBattle] = useState<BattleRequest | null>(null);
  const [pendingDialogueId, setPendingDialogueId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [muted, setMuted] = useState<boolean>(
    () => typeof window !== 'undefined' && localStorage.getItem('jeu-muted') === '1'
  );

  // Ref toujours à jour pour la sauvegarde (évite les states périmés)
  const runRef = useRef(run);
  runRef.current = run;

  useEffect(() => {
    setSfxMuted(muted);
    try { localStorage.setItem('jeu-muted', muted ? '1' : '0'); } catch { /* noop */ }
  }, [muted]);

  const showNotice = useCallback((text: string) => {
    setNotice(text);
    setTimeout(() => setNotice(null), 3200);
  }, []);

  // === Titre ===
  const handleNewGame = useCallback(() => {
    setRun(freshRun());
    setPendingDialogueId(null);
    setScreen('exploration');
  }, []);

  const handleContinue = useCallback(() => {
    const save = loadGame();
    if (!save) { handleNewGame(); return; }
    setRun({
      party: save.party,
      inventory: save.inventory,
      flags: save.flags,
      mapId: save.mapId,
    });
    setPendingDialogueId(null);
    setScreen('exploration');
  }, [handleNewGame]);

  // === Sauvegarde ===
  const handleSave = useCallback((): boolean => {
    const r = runRef.current;
    return saveGame({
      mapId: r.mapId,
      party: r.party,
      inventory: r.inventory,
      flags: r.flags,
    });
  }, []);

  // === Combat ===
  const handleStartBattle = useCallback((req: BattleRequest) => {
    setBattle(req);
    setScreen('battle');
  }, []);

  const handleBattleEnd = useCallback((result: BattleResult) => {
    const req = battle;
    setBattle(null);
    if (!req) { setScreen('exploration'); return; }

    if (!result.victory) {
      // Défaite : retour au titre — la sauvegarde permet de retenter.
      setScreen('title');
      return;
    }

    setRun((r) => {
      // PV/MP des héros après combat (les KO reviennent à 1 PV, JRPG-style)
      let party: HeroState[] = r.party.map((h) => {
        const fighter = result.heroes.find((f) => f.heroId === h.heroId);
        if (!fighter) return h;
        return { ...h, hp: Math.max(1, fighter.hp), mp: fighter.mp };
      });

      // XP + niveaux
      const { party: leveled, levelUps } = applyXp(party, result.xpGained);
      party = leveled;
      if (levelUps.length > 0) {
        playSfx('levelup');
        showNotice(
          '⬆ ' + levelUps.map((l) => `${HERO_DEFS[l.heroId].name} passe Nv ${l.newLevel} !`).join(' — ')
        );
      }

      // Inventaire : état post-combat + butin
      const inventory = { ...result.inventory };
      for (const d of result.drops) {
        inventory[d.itemId] = (inventory[d.itemId] || 0) + d.count;
      }

      // Progression
      const flags: GameFlags = {
        ...r.flags,
        defeatedGroups: [...r.flags.defeatedGroups, req.interactableId],
        bossDefeated: r.flags.bossDefeated || req.isBoss,
      };

      const next: RunState = { ...r, party, inventory, flags };
      // Sauvegarde automatique après chaque victoire.
      saveGame({ mapId: next.mapId, party, inventory, flags });
      return next;
    });

    if (req.isBoss && req.outroDialogueId) {
      setPendingDialogueId(req.outroDialogueId);
    }
    setScreen('exploration');
  }, [battle, showNotice]);

  // Fin du dialogue d'après-boss → écran de fin
  const handlePendingDialogueDone = useCallback(() => {
    const wasOutro = pendingDialogueId === 'boss-outro';
    setPendingDialogueId(null);
    if (wasOutro) setScreen('ending');
  }, [pendingDialogueId]);

  // === Rendu ===
  if (screen === 'title') {
    return (
      <StartScreenV2
        muted={muted}
        onNewGame={handleNewGame}
        onContinue={handleContinue}
        onToggleMute={() => setMuted((m) => !m)}
      />
    );
  }

  if (screen === 'battle' && battle) {
    return (
      <BattleScreenV2
        key={battle.interactableId + battle.groupId}
        party={run.party}
        inventory={run.inventory}
        groupId={battle.groupId}
        battleLabel={battle.label}
        muted={muted}
        onEnd={handleBattleEnd}
      />
    );
  }

  if (screen === 'ending') {
    return (
      <div className="ending-screen">
        <div className="ending-panel">
          <h1>🏆 Les Archives sont libres</h1>
          <p>
            Le Champion des Collectivités Territoriales a été définitivement archivé.
            Les grimoires retrouvent leur sommeil, la poussière retombe, et quelque part,
            un tampon encreur sèche pour l'éternité.
          </p>
          <p className="ending-sub">— Fin du vertical slice. L'aventure continue à Ramees et dans la Forêt de Lamber. —</p>
          <div className="ending-actions">
            <button onClick={() => { playSfx('menu_click'); setScreen('exploration'); }}>
              🧭 Continuer à explorer
            </button>
            <button onClick={() => { playSfx('menu_click'); setScreen('title'); }}>
              ⏻ Menu titre
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ExplorationScreenV2
        key="exploration"
        mapId={run.mapId}
        party={run.party}
        inventory={run.inventory}
        flags={run.flags}
        spawnOverride={null}
        pendingDialogueId={pendingDialogueId}
        muted={muted}
        onMapChange={(mapId) => setRun((r) => ({ ...r, mapId }))}
        onPartyChange={(party) => setRun((r) => ({ ...r, party }))}
        onInventoryChange={(inventory) => setRun((r) => ({ ...r, inventory }))}
        onFlagsChange={(flags) => setRun((r) => ({ ...r, flags }))}
        onStartBattle={(req) => handleStartBattle(req)}
        onSaveGame={handleSave}
        onPendingDialogueDone={handlePendingDialogueDone}
        onToggleMute={() => setMuted((m) => !m)}
        onQuitToTitle={() => {
          handleSave();
          setScreen('title');
        }}
      />
      {notice && <div className="app-notice">{notice}</div>}
    </>
  );
}
