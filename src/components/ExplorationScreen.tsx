import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { ExplorationScene } from '../game/phaser/ExplorationScene';
import type { MapId } from '../game/types';
import { getMap } from '../data/maps';
import './ExplorationScreen.css';

interface Props {
  onEngage: () => void;
}

export function ExplorationScreen({ onEngage }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<ExplorationScene | null>(null);
  const [mapId, setMapId] = useState<MapId>('bureau');
  const [promptLabel, setPromptLabel] = useState<string | null>(null);

  // Refs pour callbacks à jour
  const onEngageRef = useRef(onEngage);
  const setMapIdRef = useRef(setMapId);
  useEffect(() => { onEngageRef.current = onEngage; }, [onEngage]);
  useEffect(() => { setMapIdRef.current = setMapId; }, [setMapId]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new ExplorationScene({
      onNearInteractable: (label) => setPromptLabel(label),
      onEngage: () => onEngageRef.current(),
      onTeleport: (toMapId) => setMapIdRef.current(toMapId),
    });
    sceneRef.current = scene;

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
      sceneRef.current = null;
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // Quand le state mapId change, demande à la scène de switcher
  useEffect(() => {
    sceneRef.current?.applyMapSwitch(mapId);
    setPromptLabel(null);
  }, [mapId]);

  const map = getMap(mapId);
  const isEngagePrompt = !!promptLabel && promptLabel.includes('combat');

  return (
    <div className="exploration-screen">
      <div ref={containerRef} className="exploration-canvas" />

      <div className="ex-hud-top">
        <div className="ex-title">{map.name}</div>
        <div className="ex-objective">
          {promptLabel
            ? `Appuie sur ESPACE / tap pour : ${promptLabel}`
            : 'Déplace Datpaloof avec les flèches / WASD ou tap sur la map'}
        </div>
      </div>

      <div className="ex-controls-hint">
        <span className="ex-key">↑↓←→</span> / <span className="ex-key">WASD</span>
        &nbsp;•&nbsp;
        <span className="ex-key">ESPACE</span> interagir
        &nbsp;•&nbsp; tap pour aller
      </div>

      {promptLabel && (
        <button
          className={`ex-engage-btn ${isEngagePrompt ? 'ex-engage-btn-combat' : 'ex-engage-btn-teleport'}`}
          onClick={() => {
            // Déclenche l'interaction via une touche virtuelle :
            // on demande à la scène d'effectuer l'interaction.
            const scene = sceneRef.current as any;
            scene?.interact?.();
          }}
        >
          {promptLabel}
        </button>
      )}
    </div>
  );
}
