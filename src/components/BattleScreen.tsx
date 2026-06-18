import type { Ability, Character, GameState } from '../game/types';
import { BossStatusBar } from './BossStatusBar';
import { BattleArena } from './BattleArena';
import { BattleMenu } from './BattleMenu';
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

  const bossTargetable =
    isPickingTarget && state.boss.alive && targetingAbility!.target === 'enemy';

  // Position du menu : à gauche si le perso actif est à droite, sinon à droite.
  const menuPosition: 'left' | 'right' =
    activeCharacter?.id === 'zlatax' ? 'left' : 'right';

  return (
    <div className="battle-screen">
      <header className="battle-header">
        <div className="battle-header-left">
          <div className="battle-turn">Tour {state.turn}</div>
          <div className="battle-phase">
            {state.phase === 'playerTurn'
              ? `À ${activeCharacter ? activeCharacter.name : '...'}`
              : '⌛ Tour du Champion'}
          </div>
        </div>
        <div className="battle-header-title">Le Bureau des Archives Infinies</div>
        <button className="battle-restart" onClick={onRestart}>
          ↻ Recommencer
        </button>
      </header>

      <div className="battle-main">
        <div className="battle-left">
          {/* Barre du boss en haut, cliquable comme cible */}
          <BossStatusBar
            boss={state.boss}
            isTargetable={bossTargetable}
            onSelect={() => onTargetSelect(state.boss.id)}
          />

          <div className="arena-wrap">
            <BattleArena state={state} activeHeroId={activeCharacter?.id ?? null} />

            {/* Menu pixel-art FF-style superposé sur l'arène */}
            {state.phase === 'playerTurn' && !isPickingTarget && (
              <BattleMenu
                character={activeCharacter}
                disabled={false}
                onAbilityClick={onAbilityClick}
                position={menuPosition}
              />
            )}

            {/* Sélection de cible alliée — boutons flottants */}
            {isPickingTarget && targetingAbility?.target === 'ally' && (
              <div className="ally-target-overlay">
                <div className="ally-target-title">
                  🎯 {targetingAbility.name} — choisis un allié
                </div>
                <div className="ally-target-row">
                  {state.characters.map((c) => (
                    <button
                      key={c.id}
                      className="ally-target-btn"
                      disabled={!c.alive}
                      onClick={() => onTargetSelect(c.id)}
                    >
                      <span className="ally-target-name">{c.name}</span>
                      <span className="ally-target-hp">{c.hp}/{c.maxHp} PV</span>
                    </button>
                  ))}
                </div>
                <button className="targeting-cancel" onClick={onCancelTarget}>
                  Annuler
                </button>
              </div>
            )}

            {/* Indicateur cible boss */}
            {bossTargetable && (
              <div className="boss-target-hint">
                🎯 Clique sur le boss en haut pour {targetingAbility?.name}
                <button className="targeting-cancel" onClick={onCancelTarget}>
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>

        <aside className="battle-side">
          <CombatLog log={state.log} />
        </aside>
      </div>
    </div>
  );
}
