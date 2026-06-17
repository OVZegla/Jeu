import { useEffect, useState } from 'react';
import type { Boss } from '../game/types';
import { StatusBadge } from './StatusBadge';
import { BossSprite } from './sprites/BossSprite';
import { ArenaBackground } from './sprites/ArenaBackground';
import './BossCard.css';

interface Props {
  boss: Boss;
  damageTick: number;
  attackTick: number;
  lastDamage: number;
  isTargetable: boolean;
  onSelect?: () => void;
}

interface Floater {
  id: number;
  value: number;
}

let bossFloaterCounter = 0;

export function BossCard({
  boss,
  damageTick,
  attackTick,
  lastDamage,
  isTargetable,
  onSelect,
}: Props) {
  const pct = Math.max(0, (boss.hp / boss.maxHp) * 100);
  const [flash, setFlash] = useState(false);
  const [attacking, setAttacking] = useState(false);
  const [floaters, setFloaters] = useState<Floater[]>([]);

  useEffect(() => {
    if (damageTick === 0) return;
    setFlash(true);
    const id = ++bossFloaterCounter;
    setFloaters((fs) => [...fs, { id, value: lastDamage }]);
    const t1 = setTimeout(() => setFlash(false), 400);
    const t2 = setTimeout(() => setFloaters((fs) => fs.filter((f) => f.id !== id)), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [damageTick, lastDamage]);

  useEffect(() => {
    if (attackTick === 0) return;
    setAttacking(true);
    const t = setTimeout(() => setAttacking(false), 600);
    return () => clearTimeout(t);
  }, [attackTick]);

  const classes = [
    'boss-card',
    boss.enraged ? 'boss-enraged' : '',
    flash ? 'boss-flash' : '',
    isTargetable ? 'boss-targetable' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      onClick={isTargetable ? onSelect : undefined}
      role={isTargetable ? 'button' : undefined}
    >
      <div className="boss-scene">
        <ArenaBackground />

        <div className={`boss-sprite-wrap ${attacking ? 'boss-attacking' : ''} ${flash ? 'boss-shake' : ''}`}>
          <BossSprite enraged={boss.enraged} />

          {floaters.map((f) => (
            <span key={f.id} className="float-num float-dmg float-boss">
              -{f.value}
            </span>
          ))}
        </div>
      </div>

      <div className="boss-info">
        <div className="boss-name-row">
          <div>
            <div className="boss-name">{boss.name}</div>
            <div className="boss-title">{boss.title}</div>
          </div>
          {boss.enraged && (
            <div className="boss-phase-tag">⚠ PHASE ENRAGÉE</div>
          )}
        </div>

        <div className="boss-hp-bar">
          <div className="boss-hp-fill" style={{ width: `${pct}%` }} />
          <div className="boss-hp-text">
            {boss.hp} / {boss.maxHp}
          </div>
        </div>

        <div className="boss-status">
          {boss.status.length === 0 ? (
            <span className="boss-status-empty">— aucun effet —</span>
          ) : (
            boss.status.map((e) => <StatusBadge key={e.id} effect={e} />)
          )}
        </div>
      </div>
    </div>
  );
}
