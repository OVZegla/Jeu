import type { CombatLogEntry, GamePhase } from '../game/types';
import './EndScreen.css';

interface Props {
  phase: GamePhase;
  onRestart: () => void;
  log: CombatLogEntry[];
}

export function EndScreen({ phase, onRestart, log }: Props) {
  const victory = phase === 'victory';
  return (
    <div className={`end-screen ${victory ? 'end-victory' : 'end-defeat'}`}>
      <div className="end-card">
        <div className="end-sigil">{victory ? '🏆' : '☠️'}</div>
        <h1>{victory ? 'Victoire' : 'Défaite'}</h1>
        <p className="end-text">
          {victory
            ? "Les archives s'effondrent dans un dernier grincement. Le Champion des Collectivités Territoriales est démis de ses fonctions éternelles."
            : "Vos héros sont entraînés dans les piles de dossiers. Leurs noms rejoindront un formulaire jamais classé."}
        </p>
        <div className="end-log">
          {log.slice(-8).map((e) => (
            <div key={e.id} className={`end-log-entry log-${e.kind}`}>
              <span className="log-turn">T{e.turn}</span> {e.text}
            </div>
          ))}
        </div>
        <button className="end-button" onClick={onRestart}>
          Recommencer le combat
        </button>
      </div>
    </div>
  );
}
