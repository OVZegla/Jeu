// Écran titre V2 : Nouvelle partie / Continuer (si sauvegarde) / Options.

import { useEffect, useState } from 'react';
import { hasSave, loadGame } from '../game/core/save';
import { playSfx, setSfxVolume, getSfxVolume, setSfxMuted } from '../game/core/sfx';
import './StartScreen.css';
import './StartScreenV2.css';

interface Props {
  muted: boolean;
  onNewGame: () => void;
  onContinue: () => void;
  onToggleMute: () => void;
}

const TITLE_BG_URL = `${import.meta.env.BASE_URL}assets/title.jpg`;

export function StartScreenV2({ muted, onNewGame, onContinue, onToggleMute }: Props) {
  const [showOptions, setShowOptions] = useState(false);
  const [volume, setVolume] = useState(() => Math.round(getSfxVolume() * 100));
  const canContinue = hasSave();
  const save = canContinue ? loadGame() : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !showOptions) {
        playSfx('menu_click');
        if (canContinue) onContinue();
        else onNewGame();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canContinue, onContinue, onNewGame, showOptions]);

  return (
    <div className="start-screen sv2" style={{ backgroundImage: `url('${TITLE_BG_URL}')` }}>
      <div className="sv2-menu">
        <button
          className="sv2-btn"
          onClick={() => { playSfx('menu_click'); onNewGame(); }}
        >
          ✦ Nouvelle partie
        </button>
        {canContinue && (
          <button
            className="sv2-btn sv2-primary"
            onClick={() => { playSfx('menu_click'); onContinue(); }}
          >
            ▶ Continuer
            {save && (
              <small>
                {new Date(save.savedAt).toLocaleDateString('fr-FR')} — Nv {Math.max(...save.party.map((h) => h.level))}
              </small>
            )}
          </button>
        )}
        <button className="sv2-btn" onClick={() => { playSfx('menu_move'); setShowOptions((o) => !o); }}>
          ⚙️ Options
        </button>
      </div>

      {showOptions && (
        <div className="sv2-options" onClick={(e) => e.stopPropagation()}>
          <label>
            🔊 Effets sonores
            <input
              type="range" min={0} max={100} value={volume}
              onChange={(e) => {
                const v = Number(e.target.value);
                setVolume(v);
                setSfxVolume(v / 100);
              }}
              onMouseUp={() => playSfx('menu_click')}
            />
          </label>
          <button className="sv2-btn" onClick={() => { onToggleMute(); setSfxMuted(!muted); }}>
            {muted ? '🔇 Réactiver le son' : '🔊 Couper le son'}
          </button>
          <button className="sv2-btn" onClick={() => setShowOptions(false)}>↩ Fermer</button>
        </div>
      )}

      <div className="sv2-footer">Le Bureau des Archives Infinies — refonte RPG 2.5D</div>
    </div>
  );
}
