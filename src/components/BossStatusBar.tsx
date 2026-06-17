import type { Boss } from '../game/types';
import { StatusBadge } from './StatusBadge';
import './BossStatusBar.css';

interface Props {
  boss: Boss;
  isTargetable: boolean;
  onSelect?: () => void;
}

export function BossStatusBar({ boss, isTargetable, onSelect }: Props) {
  const pct = Math.max(0, (boss.hp / boss.maxHp) * 100);
  return (
    <div
      className={[
        'boss-status-bar',
        boss.enraged ? 'boss-enraged' : '',
        isTargetable ? 'boss-targetable' : '',
      ].filter(Boolean).join(' ')}
      onClick={isTargetable ? onSelect : undefined}
      role={isTargetable ? 'button' : undefined}
    >
      <div className="boss-bar-top">
        <div>
          <div className="boss-bar-name">👁 {boss.name}</div>
          <div className="boss-bar-title">{boss.title}</div>
        </div>
        {boss.enraged && (
          <div className="boss-phase-tag">⚠ PHASE ENRAGÉE</div>
        )}
      </div>

      <div className="boss-hp-bar">
        <div className="boss-hp-fill" style={{ width: `${pct}%` }} />
        <div className="boss-hp-text">{boss.hp} / {boss.maxHp}</div>
      </div>

      <div className="boss-bar-status">
        {boss.status.length === 0 ? (
          <span className="boss-status-empty">— aucun effet —</span>
        ) : (
          boss.status.map((e) => <StatusBadge key={e.id} effect={e} />)
        )}
      </div>
    </div>
  );
}
