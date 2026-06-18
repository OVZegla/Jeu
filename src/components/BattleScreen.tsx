import { useEffect, useState } from 'react';
import type { Ability, Character, GameState } from '../game/types';
import { BossStatusBar } from './BossStatusBar';
import { BattleArena } from './BattleArena';
import { BattleMenu } from './BattleMenu';
import { CombatLog } from './CombatLog';
import { CharacterStatusCard } from './CharacterStatusCard';
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
  const [muted, setMuted] = useState<boolean>(
    () => typeof window !== 'undefined' && localStorage.getItem('jeu-muted') === '1'
  );
  useEffect(() => {
    try { localStorage.setItem('jeu-muted', muted ? '1' : '0'); } catch { /* noop */ }
  }, [muted]);

  const isPickingTarget = state.pendingTarget !== null;
  const targetingAbility = state.pendingTarget?.ability;

  const bossTargetable =
    isPickingTarget && state.boss.alive && targetingAbility!.target === 'enemy';

  const charTargetable = (c: Character) =>
    isPickingTarget && c.alive && targetingAbility!.target === 'ally';

  return (
    <div className="battle-screen">
      {/* === Top bar : barre boss + tour + restart === */}
      <div className="top-bar">
        <div className="top-bar-meta">
          <div className="top-bar-turn">TOUR {state.turn}</div>
          <div className="top-bar-phase">
            {state.phase === 'playerTurn'
              ? `▶ ${activeCharacter?.name ?? '...'}`
              : '⌛ Champion'}
          </div>
        </div>
        <BossStatusBar
          boss={state.boss}
          isTargetable={bossTargetable}
          onSelect={() => onTargetSelect(state.boss.id)}
        />
        <div className="top-bar-actions">
          <button
            className="top-bar-restart"
            onClick={() => setMuted((m) => !m)}
            title={muted ? 'Activer le son' : 'Couper le son'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <button className="top-bar-restart" onClick={onRestart} title="Recommencer">↻</button>
        </div>
      </div>

      {/* === Arène plein cadre === */}
      <div className="arena-wrap">
        <BattleArena state={state} activeHeroId={activeCharacter?.id ?? null} muted={muted} />

        {bossTargetable && (
          <div className="overlay-hint">
            🎯 Clique sur la barre du boss en haut pour cibler avec {targetingAbility?.name}
            <button className="hint-cancel" onClick={onCancelTarget}>Annuler</button>
          </div>
        )}
        {isPickingTarget && targetingAbility?.target === 'ally' && (
          <div className="overlay-hint">
            🎯 Clique sur un allié en bas pour {targetingAbility.name}
            <button className="hint-cancel" onClick={onCancelTarget}>Annuler</button>
          </div>
        )}
      </div>

      {/* === Bottom bar : 3 cartes héros + menu + log === */}
      <div className="bottom-bar">
        <div className="bottom-heroes">
          {state.characters.map((c) => (
            <CharacterStatusCard
              key={c.id}
              character={c}
              isActive={activeCharacter?.id === c.id && !isPickingTarget}
              isTargetable={charTargetable(c)}
              onSelect={() => onTargetSelect(c.id)}
            />
          ))}
        </div>

        <div className="bottom-menu">
          <BattleMenu
            character={state.phase === 'playerTurn' && !isPickingTarget ? activeCharacter : null}
            disabled={state.phase !== 'playerTurn' || isPickingTarget}
            onAbilityClick={onAbilityClick}
          />
        </div>

        <div className="bottom-log">
          <CombatLog log={state.log} />
        </div>
      </div>
    </div>
  );
}
