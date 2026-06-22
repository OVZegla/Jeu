import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { ExplorationScene } from '../game/phaser/ExplorationScene';
import type { ExitSide, MapId } from '../game/types';
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
  const [entrySide, setEntrySide] = useState<ExitSide | null>(null);
  const [promptLabel, setPromptLabel] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const onEngageRef = useRef(onEngage);
  useEffect(() => { onEngageRef.current = onEngage; }, [onEngage]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new ExplorationScene({
      onNearInteractable: (label) => setPromptLabel(label),
      onEngage: () => onEngageRef.current(),
      onTeleport: (toMapId, fromSide) => {
        setEntrySide(fromSide ?? null);
        setMapId(toMapId);
      },
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

  // Skip le premier render (la scène charge 'bureau' dans son create())
  const isFirstMapRender = useRef(true);
  useEffect(() => {
    if (isFirstMapRender.current) {
      isFirstMapRender.current = false;
      return;
    }
    sceneRef.current?.applyMapSwitch(mapId, entrySide || undefined);
    setPromptLabel(null);
    setMenuOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId]);

  // Ouvre/ferme le menu pause avec ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const map = getMap(mapId);
  const isEngagePrompt = !!promptLabel && (promptLabel.includes('combat') || promptLabel.includes('⚔'));

  const handleTeleport = (targetMapId: MapId) => {
    setMenuOpen(false);
    if (targetMapId !== mapId) {
      setEntrySide(null); // spawn par défaut, pas par un bord
      setMapId(targetMapId);
    }
  };

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

      <button
        className="ex-menu-btn"
        onClick={() => setMenuOpen((o) => !o)}
        title="Menu (Échap)"
        aria-label="Menu"
      >☰</button>

      <div className="ex-controls-hint">
        <span className="ex-key">↑↓←→</span> / <span className="ex-key">WASD</span>
        &nbsp;•&nbsp;
        <span className="ex-key">ESPACE</span> interagir
        &nbsp;•&nbsp;
        <span className="ex-key">ÉCHAP</span> menu
        &nbsp;•&nbsp; tap pour aller
      </div>

      {promptLabel && (
        <button
          className={`ex-engage-btn ${isEngagePrompt ? 'ex-engage-btn-combat' : 'ex-engage-btn-teleport'}`}
          onClick={() => {
            const scene = sceneRef.current as any;
            scene?.interact?.();
          }}
        >
          {promptLabel}
        </button>
      )}

      {menuOpen && (
        <div className="ex-menu-overlay" onClick={() => setMenuOpen(false)}>
          <div className="ex-menu-panel" onClick={(e) => e.stopPropagation()}>
            <div className="ex-menu-title">▶ Menu</div>
            <ul className="ex-menu-list">
              <li>
                <button
                  className="ex-menu-item"
                  onClick={() => setMenuOpen(false)}
                >↩ Reprendre</button>
              </li>
              {mapId !== 'ramees' && (
                <li>
                  <button
                    className="ex-menu-item"
                    onClick={() => handleTeleport('ramees')}
                  >🏘 Retour à Ramees</button>
                </li>
              )}
              {mapId !== 'bureau' && (
                <li>
                  <button
                    className="ex-menu-item"
                    onClick={() => handleTeleport('bureau')}
                  >📚 Retour au Bureau</button>
                </li>
              )}
              {mapId !== 'lamber' && (
                <li>
                  <button
                    className="ex-menu-item"
                    onClick={() => handleTeleport('lamber')}
                    title="(debug : accès direct)"
                  >🌲 Forêt de Lamber</button>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
