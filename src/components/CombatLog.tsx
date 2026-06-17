import { useEffect, useRef } from 'react';
import type { CombatLogEntry } from '../game/types';
import './CombatLog.css';

interface Props {
  log: CombatLogEntry[];
}

export function CombatLog({ log }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.scrollTop = ref.current.scrollHeight;
  }, [log.length]);

  return (
    <div className="combat-log">
      <div className="combat-log-header">📜 Journal de combat</div>
      <div className="combat-log-body" ref={ref}>
        {log.length === 0 && (
          <div className="combat-log-empty">— Les premières lignes du registre… —</div>
        )}
        {log.map((e) => (
          <div key={e.id} className={`combat-log-entry log-${e.kind}`}>
            <span className="log-turn">T{e.turn}</span>
            <span className="log-text">{e.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
