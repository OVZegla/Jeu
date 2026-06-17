import type { Ability, Character } from '../game/types';
import './AbilityPanel.css';

interface Props {
  character: Character | null;
  onAbilityClick: (a: Ability) => void;
  disabled: boolean;
}

export function AbilityPanel({ character, onAbilityClick, disabled }: Props) {
  if (!character) {
    return (
      <div className="ability-panel ability-panel-waiting">
        <div className="ability-empty">
          {disabled ? '⌛ Le Champion prépare son prochain coup…' : '— Attente —'}
        </div>
      </div>
    );
  }

  return (
    <div className="ability-panel">
      <div className="ability-header">
        <span className="ability-header-icon">{character.icon}</span>
        <div>
          <div className="ability-header-name">{character.name}</div>
          <div className="ability-header-hint">Choisis une action</div>
        </div>
      </div>
      <div className="ability-grid">
        {character.abilities.map((a) => {
          const cd = character.cooldowns[a.id] || 0;
          const isDisabled = disabled || cd > 0 || !character.alive;
          return (
            <button
              key={a.id}
              type="button"
              className={`ability-button ability-${a.category}`}
              disabled={isDisabled}
              onClick={() => onAbilityClick(a)}
              title={a.description}
            >
              <div className="ability-top">
                <span className="ability-icon">{a.icon}</span>
                <span className="ability-name">{a.name}</span>
                {cd > 0 && <span className="ability-cd">CD {cd}</span>}
              </div>
              <div className="ability-desc">{a.description}</div>
              <div className="ability-meta">
                {a.basePower > 0 && (
                  <span className="meta-tag">
                    {a.category === 'heal' ? '+' : ''}{a.basePower}
                  </span>
                )}
                {a.cooldown > 0 && <span className="meta-tag">⏱ {a.cooldown}</span>}
                {a.critChance && (
                  <span className="meta-tag">⚡ {Math.round(a.critChance * 100)}%</span>
                )}
                {a.selfCost && (
                  <span className="meta-tag meta-cost">-{a.selfCost} PV</span>
                )}
                <span className="meta-tag meta-target">{labelForTarget(a.target)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function labelForTarget(t: Ability['target']): string {
  switch (t) {
    case 'self': return '➥ soi';
    case 'ally': return '➥ allié';
    case 'allAllies': return '➥ équipe';
    case 'enemy': return '➥ boss';
    case 'allEnemies': return '➥ ennemis';
  }
}
