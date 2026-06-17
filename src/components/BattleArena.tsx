import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import type { GameState } from '../game/types';
import { BattleScene } from '../game/phaser/BattleScene';
import './BattleArena.css';

interface Props {
  state: GameState;
}

// Compare deux snapshots des ticks et émet les diffs vers la scène Phaser.
function diffTicks(
  prev: Record<string, number>,
  next: Record<string, number>
): string[] {
  const out: string[] = [];
  for (const k of Object.keys(next)) {
    if ((prev[k] || 0) !== (next[k] || 0)) out.push(k);
  }
  return out;
}

export function BattleArena({ state }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<BattleScene | null>(null);
  const prevStateRef = useRef<GameState | null>(null);
  const lastAttackerRef = useRef<string | null>(null);

  // Init Phaser game une fois.
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new BattleScene({
      onReady: (s) => {
        sceneRef.current = s;
        // Application immédiate de l'état initial : phase enragée, KOs, etc.
        if (state.boss.enraged) s.setBossEnraged(true);
        for (const c of state.characters) {
          if (!c.alive) s.playDeath(c.id);
        }
      },
    });

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container,
      width: container.clientWidth,
      height: container.clientHeight,
      transparent: true,
      pixelArt: true,
      antialias: false,
      scene: [scene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    });

    gameRef.current = game;

    return () => {
      sceneRef.current = null;
      game.destroy(true);
      gameRef.current = null;
    };
    // Une seule init — l'état initial ci-dessus est utilisé au onReady.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Réagit aux changements de state pour piloter la scène.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) {
      prevStateRef.current = state;
      return;
    }
    const prev = prevStateRef.current;

    // Première frame avec scène prête : juste enregistrer.
    if (!prev) {
      prevStateRef.current = state;
      return;
    }

    // === Phase enragée ===
    if (state.boss.enraged && !prev.boss.enraged) {
      scene.setBossEnraged(true);
    }

    // === Attaques (tick attaquant) ===
    const attackers = diffTicks(prev.attackTicks, state.attackTicks);
    for (const id of attackers) {
      // On déduira la cible à l'étape suivante via les dégâts/heals reçus.
      lastAttackerRef.current = id;
      // Tente un play d'attaque vers une cible plausible (boss si héros, héros aléatoire si boss).
      const target = id === state.boss.id
        ? (state.characters.find((c) => c.alive)?.id || 'datpaloof')
        : state.boss.id;
      scene.playAttack(id, target);
    }

    // === Dégâts ===
    const hits = diffTicks(prev.damageTicks, state.damageTicks);
    for (const id of hits) {
      const amount = state.lastDamage[id] || 0;
      // Heuristique : un dégât est "crit" si > 60% du basePower courant.
      // On reste simple : pas de crit visuel sauf si > 100.
      const isCrit = amount > 100;
      scene.playHit(id, amount, isCrit);
    }

    // === Soins ===
    const heals = diffTicks(prev.healTicks, state.healTicks);
    for (const id of heals) {
      const amount = state.lastHeal[id] || 0;
      scene.playHeal(id, amount);
    }

    // === Morts / résurrections ===
    for (const c of state.characters) {
      const prevC = prev.characters.find((x) => x.id === c.id);
      if (prevC && prevC.alive && !c.alive) scene.playDeath(c.id);
      if (prevC && !prevC.alive && c.alive) scene.playRevive(c.id);
    }
    if (prev.boss.alive && !state.boss.alive) scene.playDeath(state.boss.id);

    prevStateRef.current = state;
  }, [state]);

  return <div ref={containerRef} className="battle-arena" />;
}
