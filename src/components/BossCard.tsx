import { useEffect, useState } from 'react';
import type { Boss } from '../game/types';
import { StatusBadge } from './StatusBadge';
import './BossCard.css';

interface Props {
  boss: Boss;
  damageTick: number;
  isTargetable: boolean;
  onSelect?: () => void;
}

export function BossCard({ boss, damageTick, isTargetable, onSelect }: Props) {
  const pct = Math.max(0, (boss.hp / boss.maxHp) * 100);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (damageTick === 0) return;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 350);
    return () => clearTimeout(t);
  }, [damageTick]);

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
      <div className="boss-scene" aria-hidden>
        <div className="boss-bookshelf bookshelf-left" />
        <div className="boss-bookshelf bookshelf-right" />
        <div className="boss-desk" />
        <div className="boss-floating-books">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className={`floating-book book-${i}`}>📕</span>
          ))}
        </div>
        <div className="boss-figure">
          <div className="boss-aura" />
          <div className="boss-icon">{boss.icon}</div>
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
