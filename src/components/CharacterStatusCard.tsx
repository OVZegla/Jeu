import type { Character } from '../game/types';
import { StatusBadge } from './StatusBadge';
import './CharacterStatusCard.css';

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

export function CharacterStatusCard({
  character,
  isActive,
  isTargetable,
  onSelect,
}: Props) {
  const hpPct = Math.max(0, (character.hp / character.maxHp) * 100);
  const mpPct = Math.max(0, (character.mp / character.maxMp) * 100);
  const lowHp = hpPct < 30;

  const classes = [
    'status-card',
    !character.alive ? 'status-dead' : '',
    isActive ? 'status-active' : '',
    isTargetable ? 'status-targetable' : '',
    lowHp && character.alive ? 'status-low-hp' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classes}
      onClick={isTargetable ? onSelect : undefined}
      disabled={!isTargetable && !isActive}
      style={{ '--accent': character.color } as React.CSSProperties}
    >
      <div className="status-portrait">{PORTRAIT_BY_ID[character.id]}</div>

      <div className="status-body">
        <div className="status-name-row">
          <span className="status-name">{character.name}</span>
          {!character.alive && <span className="status-ko">KO</span>}
        </div>

        <div className="status-bar status-bar-hp">
          <div className="status-bar-fill status-bar-fill-hp" style={{ width: `${hpPct}%` }} />
          <span className="status-bar-text">HP {character.hp}/{character.maxHp}</span>
        </div>

        <div className="status-bar status-bar-mp">
          <div className="status-bar-fill status-bar-fill-mp" style={{ width: `${mpPct}%` }} />
          <span className="status-bar-text">MP {character.mp}/{character.maxMp}</span>
        </div>

        {character.status.length > 0 && (
          <div className="status-effects">
            {character.status.map((e) => <StatusBadge key={e.id} effect={e} />)}
          </div>
        )}
      </div>
    </button>
  );
}
