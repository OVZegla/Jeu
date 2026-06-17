import type { Character } from '../game/types';
import { StatusBadge } from './StatusBadge';
import './CharacterCard.css';

interface Props {
  character: Character;
  isActive: boolean;
  isTargetable: boolean;
  onSelect?: () => void;
}

const PORTRAIT_BY_ID: Record<string, string> = {
  datpaloof: '🛡',
  baghaar: '🌀',
  zlatax: '🗡',
};

export function CharacterCard({
  character,
  isActive,
  isTargetable,
  onSelect,
}: Props) {
  const pct = Math.max(0, (character.hp / character.maxHp) * 100);
  const lowHp = pct < 30;

  const classes = [
    'char-card',
    !character.alive ? 'char-dead' : '',
    isActive ? 'char-active' : '',
    isTargetable ? 'char-targetable' : '',
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
      <div className="char-head-row">
        <div className="char-portrait">{PORTRAIT_BY_ID[character.id]}</div>
        <div className="char-id">
          <div className="char-name">{character.name}</div>
          <div className="char-class">{character.className}</div>
        </div>
        {isActive && <div className="char-active-indicator">▶</div>}
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

      {!character.alive && <div className="char-ko-badge">KO</div>}
    </button>
  );
}
