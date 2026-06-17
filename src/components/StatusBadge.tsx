import type { StatusEffect } from '../game/types';
import './StatusBadge.css';

interface Props {
  effect: StatusEffect;
}

const COLOR_BY_TYPE: Record<string, string> = {
  shield: '#6fb3ff',
  hot: '#79e09a',
  dot: '#e07579',
  damageUp: '#ffb86c',
  damageDown: '#9ea4b0',
  defenseDown: '#c08fff',
  skipTurn: '#7a7d85',
  marked: '#ff5577',
  enraged: '#88ff88',
};

export function StatusBadge({ effect }: Props) {
  const color = COLOR_BY_TYPE[effect.type] || '#cccccc';
  return (
    <span
      className="status-badge"
      style={{ borderColor: color, color }}
      title={`${effect.name} — ${effect.description}`}
    >
      <span className="status-icon">{effect.icon}</span>
      <span className="status-duration">{effect.duration}</span>
    </span>
  );
}
