import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { ExplorationScene } from '../game/phaser/ExplorationScene';
import './ExplorationScreen.css';

interface Props {
  onEngage: () => void;
}

export function ExplorationScreen({ onEngage }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [nearBoss, setNearBoss] = useState(false);
  // Ref pour avoir la dernière version du callback dans la scène (qui ne se réinitialise pas)
  const onEngageRef = useRef(onEngage);
  useEffect(() => { onEngageRef.current = onEngage; }, [onEngage]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new ExplorationScene({
      onNearBoss: (near) => setNearBoss(near),
      onEngage: () => onEngageRef.current(),
    });

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container,
      width: container.clientWidth,
      height: container.clientHeight,
      transparent: true,
      pixelArt: false,
      antialias: true,
      scene: [scene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    });
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div className="exploration-screen">
      <div ref={containerRef} className="exploration-canvas" />

      <div className="ex-hud-top">
        <div className="ex-title">Bureau des Archives Infinies</div>
        <div className="ex-objective">
          {nearBoss
            ? "Engage le Champion pour commencer le combat"
            : "Approche-toi du Champion au centre de la salle"}
        </div>
      </div>

      <div className="ex-controls-hint">
        <span className="ex-key">↑↓←→</span> ou <span className="ex-key">WASD</span> pour bouger
        &nbsp;•&nbsp;
        <span className="ex-key">ESPACE</span> pour engager
        &nbsp;•&nbsp; (tap sur la map pour s'y rendre)
      </div>

      {nearBoss && (
        <button className="ex-engage-btn" onClick={() => onEngage()}>
          ⚔️ ENGAGER LE COMBAT
        </button>
      )}
    </div>
  );
}
