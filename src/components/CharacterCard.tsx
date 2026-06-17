import { useEffect, useState } from 'react';
import type { Character } from '../game/types';
import { StatusBadge } from './StatusBadge';
import { DatpaloofSprite } from './sprites/DatpaloofSprite';
import { BaghaarSprite } from './sprites/BaghaarSprite';
import { ZlataxSprite } from './sprites/ZlataxSprite';
import './CharacterCard.css';

interface Props {
  character: Character;
  isActive: boolean;
  isTargetable: boolean;
  damageTick: number;
  healTick: number;
  attackTick: number;
  lastDamage: number;
  lastHeal: number;
  onSelect?: () => void;
}

interface Floater {
  id: number;
  value: number;
  kind: 'dmg' | 'heal';
}

let floaterCounter = 0;

function SpriteFor({ id }: { id: string }) {
  switch (id) {
    case 'datpaloof': return <DatpaloofSprite />;
    case 'baghaar': return <BaghaarSprite />;
    case 'zlatax': return <ZlataxSprite />;
    default: return null;
  }
}

export function CharacterCard({
  character,
  isActive,
  isTargetable,
  damageTick,
  healTick,
  attackTick,
  lastDamage,
  lastHeal,
  onSelect,
}: Props) {
  const pct = Math.max(0, (character.hp / character.maxHp) * 100);
  const lowHp = pct < 30;

  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [flashDmg, setFlashDmg] = useState(false);
  const [flashHeal, setFlashHeal] = useState(false);
  const [attacking, setAttacking] = useState(false);

  // Dégâts
  useEffect(() => {
    if (damageTick === 0) return;
    setFlashDmg(true);
    const id = ++floaterCounter;
    setFloaters((fs) => [...fs, { id, value: lastDamage, kind: 'dmg' }]);
    const t1 = setTimeout(() => setFlashDmg(false), 380);
    const t2 = setTimeout(
      () => setFloaters((fs) => fs.filter((f) => f.id !== id)),
      1200
    );
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [damageTick, lastDamage]);

  // Soins
  useEffect(() => {
    if (healTick === 0) return;
    setFlashHeal(true);
    const id = ++floaterCounter;
    setFloaters((fs) => [...fs, { id, value: lastHeal, kind: 'heal' }]);
    const t1 = setTimeout(() => setFlashHeal(false), 380);
    const t2 = setTimeout(
      () => setFloaters((fs) => fs.filter((f) => f.id !== id)),
      1200
    );
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [healTick, lastHeal]);

  // Attaque (lunge)
  useEffect(() => {
    if (attackTick === 0) return;
    setAttacking(true);
    const t = setTimeout(() => setAttacking(false), 520);
    return () => clearTimeout(t);
  }, [attackTick]);

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
      <div className={`char-sprite-wrap ${attacking ? 'char-attacking' : ''} ${flashDmg ? 'char-shake' : ''}`}>
        <div className="char-sprite-shadow" />
        <SpriteFor id={character.id} />

        {floaters.map((f) => (
          <span
            key={f.id}
            className={`float-num float-${f.kind}`}
          >
            {f.kind === 'dmg' ? `-${f.value}` : `+${f.value}`}
          </span>
        ))}

        {!character.alive && <div className="char-ko-overlay">HORS-JEU</div>}
      </div>

      <div className="char-header">
        <div className="char-id">
          <div className="char-name">{character.name}</div>
          <div className="char-class">{character.className}</div>
        </div>
        {isActive && <div className="char-active-indicator">▶ À TOI</div>}
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
    </button>
  );
}
