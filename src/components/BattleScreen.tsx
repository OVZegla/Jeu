import type { Ability, Character, GameState } from '../game/types';
import { CharacterCard } from './CharacterCard';
import { BossCard } from './BossCard';
import { AbilityPanel } from './AbilityPanel';
import { CombatLog } from './CombatLog';
import './BattleScreen.css';

interface Props {
  state: GameState;
  activeCharacter: Character | null;
  onAbilityClick: (a: Ability) => void;
  onTargetSelect: (targetId: string) => void;
  onCancelTarget: () => void;
  onRestart: () => void;
}

export function BattleScreen({
  state,
  activeCharacter,
  onAbilityClick,
  onTargetSelect,
  onCancelTarget,
  onRestart,
}: Props) {
  const isPickingTarget = state.pendingTarget !== null;
  const targetingAbility = state.pendingTarget?.ability;

  // Selon l'ability, quelles entités sont sélectionnables ?
  const charTargetable = (c: Character) => {
    if (!isPickingTarget || !c.alive) return false;
    return targetingAbility!.target === 'ally';
  };
  const bossTargetable =
    isPickingTarget && state.boss.alive && targetingAbility!.target === 'enemy';

  return (
    <div className="battle-screen">
      <header className="battle-header">
        <div className="battle-header-left">
          <div className="battle-turn">Tour {state.turn}</div>
          <div className="battle-phase">
            {state.phase === 'playerTurn'
              ? `Action : ${activeCharacter ? activeCharacter.name : '...'}`
              : 'Tour du Champion'}
          </div>
        </div>
        <div className="battle-header-title">Le Bureau des Archives Infinies</div>
        <button className="battle-restart" onClick={onRestart}>
          ↻ Recommencer
        </button>
      </header>

      <div className="battle-main">
        <div className="battle-center">
          <BossCard
            boss={state.boss}
            damageTick={state.damageTicks[state.boss.id] || 0}
            attackTick={state.attackTicks[state.boss.id] || 0}
            lastDamage={state.lastDamage[state.boss.id] || 0}
            isTargetable={bossTargetable}
            onSelect={() => onTargetSelect(state.boss.id)}
          />

          {isPickingTarget && (
            <div className="targeting-banner">
              <span>
                🎯 Cible pour <strong>{targetingAbility!.name}</strong>&nbsp;:{' '}
                {targetingAbility!.target === 'enemy'
                  ? 'choisis le boss'
                  : 'choisis un allié'}
              </span>
              <button className="targeting-cancel" onClick={onCancelTarget}>
                Annuler
              </button>
            </div>
          )}

          <div className="battle-team">
            {state.characters.map((c, i) => (
              <CharacterCard
                key={c.id}
                character={c}
                isActive={
                  state.phase === 'playerTurn' &&
                  i === state.activeCharacterIndex &&
                  !isPickingTarget
                }
                isTargetable={charTargetable(c)}
                damageTick={state.damageTicks[c.id] || 0}
                healTick={state.healTicks[c.id] || 0}
                attackTick={state.attackTicks[c.id] || 0}
                lastDamage={state.lastDamage[c.id] || 0}
                lastHeal={state.lastHeal[c.id] || 0}
                onSelect={() => onTargetSelect(c.id)}
              />
            ))}
          </div>

          <AbilityPanel
            character={activeCharacter}
            onAbilityClick={onAbilityClick}
            disabled={state.phase !== 'playerTurn' || isPickingTarget}
          />
        </div>

        <aside className="battle-side">
          <CombatLog log={state.log} />
        </aside>
      </div>
    </div>
  );
}
