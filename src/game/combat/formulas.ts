// Formules de combat V2 : dégâts, éléments, crits, initiative.

import type { Combatant, Effectiveness, Skill } from './types';
import { BALANCE, BALANCE2 } from '../balance';
import {
  getDamageTakenAmplifier,
  getIncomingDamageMultiplier,
  getOutgoingDamageMultiplier,
} from '../statusEffects';

export function effectivenessAgainst(target: Combatant, skill: Skill): Effectiveness {
  if (target.affinities.weaknesses.includes(skill.element)) return 'weak';
  if (target.affinities.resistances.includes(skill.element)) return 'resist';
  return 'normal';
}

export interface DamageRoll {
  amount: number;
  crit: boolean;
  effectiveness: Effectiveness;
}

export function rollDamage(caster: Combatant, target: Combatant, skill: Skill): DamageRoll {
  // Puissance de base × stat du lanceur
  const usesMagic = skill.element !== 'physique';
  let value = skill.basePower * (usesMagic ? caster.magicPower : caster.physicalPower);

  // Multiplicateur d'effets sortants (buffs/debuffs du lanceur)
  value *= getOutgoingDamageMultiplier(caster.status);

  // Variance
  if (skill.variance && skill.variance > 0) {
    value *= 1 + (Math.random() * 2 - 1) * skill.variance;
  }

  // Critique
  let crit = false;
  if (skill.critChance && Math.random() < skill.critChance) {
    crit = true;
    value *= BALANCE.critMultiplier;
  }

  // Défense plate de la cible + effets entrants
  value *= 1 - target.defense;
  value *= getIncomingDamageMultiplier(target.status);
  value *= getDamageTakenAmplifier(target.status);

  // Élément
  const effectiveness = effectivenessAgainst(target, skill);
  if (effectiveness === 'weak') value *= BALANCE2.weaknessMultiplier;
  if (effectiveness === 'resist') value *= BALANCE2.resistanceMultiplier;

  return { amount: Math.max(1, Math.round(value)), crit, effectiveness };
}

export function rollHeal(caster: Combatant, skill: Skill): number {
  const value = skill.basePower * caster.magicPower;
  return Math.max(1, Math.round(value));
}

// Initiative : vitesse décroissante ; à égalité, les héros jouent d'abord.
export function sortByInitiative<T extends { speed: number; kind: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    if (b.speed !== a.speed) return b.speed - a.speed;
    if (a.kind !== b.kind) return a.kind === 'hero' ? -1 : 1;
    return 0;
  });
}
