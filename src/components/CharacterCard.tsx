import { useEffect, useState } from 'react';
import type { Character } from '../game/types';
import { StatusBadge } from './StatusBadge';
import './CharacterCard.css';

interface Props {
  character: Character;
  isActive: boolean;
  isTargetable: boolean;
  damageTick: number;
  healTick: number;
  onSelect?: () => void;
}

export function CharacterCard({
  character,
  isActive,
  isTargetable,
  damageTick,
  healTick,
  onSelect,
}: Props) {
  const pct = Math.max(0, (character.hp / character.maxHp) * 100);
  const lowHp = pct < 30;

  // Flash dégâts / soins via incrément des "ticks".
  const [flashDmg, setFlashDmg] = useState(false);
  const [flashHeal, setFlashHeal] = useState(false);

  useEffect(() => {
    if (damageTick === 0) return;
    setFlashDmg(true);
    const t = setTimeout(() => setFlashDmg(false), 350);
    return () => clearTimeout(t);
  }, [damageTick]);

  useEffect(() => {
    if (healTick === 0) return;
    setFlashHeal(true);
    const t = setTimeout(() => setFlashHeal(false), 350);
    return () => clearTimeout(t);
  }, [healTick]);

  const classes = [
    'char-card',
    !character.alive ? 'char-dead' : '',
    isActive ? 'char-active' : '',
    isTargetable ? 'char-targetable' : '',
    flashDmg ? 'char-flash-dmg' : '',
    flashHeal ? 'char-flash-heal' : '',
    lowHp && character.alive ? 'char-low-hp' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classes}
      onClick={isTargetable ? onSelect : undefined}
      disabled={!isTargetable}
      style={{ '--accent': character.color } as React.CSSProperties}
    >
      <div className="char-header">
        <span className="char-icon">{character.icon}</span>
        <div className="char-id">
          <div className="char-name">{character.name}</div>
          <div className="char-class">{character.className}</div>
        </div>
      </div>

      <div className="char-hp-bar">
        <div className="char-hp-fill" style={{ width: `${pct}%` }} />
        <div className="char-hp-text">
          {character.hp} / {character.maxHp}
        </div>
      </div>

      <div className="char-status">
        {character.status.length === 0 ? (
          <span className="char-status-empty">—</span>
        ) : (
          character.status.map((e) => <StatusBadge key={e.id} effect={e} />)
        )}
      </div>

      {!character.alive && <div className="char-ko-overlay">HORS-JEU</div>}
      {isActive && <div className="char-active-indicator">▶ À TOI</div>}
    </button>
  );
}
