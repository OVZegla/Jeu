import { useCallback, useEffect, useState } from 'react';
import type { Ability, Character, GameState } from './game/types';
import {
  advanceAfterPlayerAction,
  createInitialState,
  engageBoss,
  executeAbility,
  executeBossTurn,
  resetCombat,
  startAdventure,
} from './game/combatEngine';
import { StartScreen } from './components/StartScreen';
import { EndScreen } from './components/EndScreen';
import { BattleScreen } from './components/BattleScreen';
import { ExplorationScreen } from './components/ExplorationScreen';

export default function App() {
  const [state, setState] = useState<GameState>(() => createInitialState());

  // Délai entre fin du tour joueur et action du boss (lisibilité).
  useEffect(() => {
    if (state.phase !== 'bossTurn') return;
    const timer = setTimeout(() => {
      setState((s) => (s.phase === 'bossTurn' ? executeBossTurn(s) : s));
    }, 900);
    return () => clearTimeout(timer);
  }, [state.phase, state.turn]);

  const handleStart = useCallback(() => {
    setState(startAdventure());
  }, []);

  const handleEngage = useCallback(() => {
    setState((s) => engageBoss(s));
  }, []);

  const handleReset = useCallback(() => {
    setState(resetCombat());
  }, []);

  const activeCharacter: Character | null =
    state.phase === 'playerTurn' &&
    state.activeCharacterIndex >= 0 &&
    state.activeCharacterIndex < state.characters.length
      ? state.characters[state.activeCharacterIndex]
      : null;

  const handleAbilityClick = useCallback(
    (ability: Ability) => {
      if (!activeCharacter) return;
      // Si on doit choisir une cible (ally unique), on entre en mode sélection.
      if (ability.target === 'ally') {
        setState((s) => ({
          ...s,
          pendingTarget: { characterId: activeCharacter.id, ability },
        }));
        return;
      }
      // Sinon, exécution immédiate.
      const next = executeAbility(state, activeCharacter.id, ability, null);
      setState(advanceAfterPlayerAction(next));
    },
    [activeCharacter, state]
  );

  const handleTargetSelect = useCallback(
    (targetId: string) => {
      if (!state.pendingTarget) return;
      const { ability, characterId } = state.pendingTarget;
      const target = state.characters.find((c) => c.id === targetId);
      if (!target || !target.alive) return;
      const next = executeAbility(
        { ...state, pendingTarget: null },
        characterId,
        ability,
        targetId
      );
      setState(advanceAfterPlayerAction(next));
    },
    [state]
  );

  const handleCancelTarget = useCallback(() => {
    setState((s) => ({ ...s, pendingTarget: null }));
  }, []);

  if (state.phase === 'start') return <StartScreen onStart={handleStart} />;
  if (state.phase === 'exploration') return <ExplorationScreen onEngage={handleEngage} />;
  if (state.phase === 'victory' || state.phase === 'defeat') {
    return <EndScreen phase={state.phase} onRestart={handleReset} log={state.log} />;
  }

  return (
    <BattleScreen
      state={state}
      activeCharacter={activeCharacter}
      onAbilityClick={handleAbilityClick}
      onTargetSelect={handleTargetSelect}
      onCancelTarget={handleCancelTarget}
      onRestart={handleReset}
    />
  );
}
