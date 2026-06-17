import type { StatusEffect, StatusEffectTemplate } from './types';

let effectInstanceCounter = 0;

export function instantiateEffect(template: StatusEffectTemplate): StatusEffect {
  effectInstanceCounter += 1;
  return {
    id: `${template.type}-${effectInstanceCounter}`,
    type: template.type,
    name: template.name,
    description: template.description,
    duration: template.duration,
    value: template.value,
    icon: template.icon,
  };
}

// Réduit la durée des effets et retire ceux qui expirent.
// Renvoie aussi les effets expirés pour pouvoir logger.
export function tickStatusDurations(effects: StatusEffect[]): {
  remaining: StatusEffect[];
  expired: StatusEffect[];
} {
  const remaining: StatusEffect[] = [];
  const expired: StatusEffect[] = [];
  for (const e of effects) {
    const next = { ...e, duration: e.duration - 1 };
    if (next.duration <= 0) expired.push(e);
    else remaining.push(next);
  }
  return { remaining, expired };
}

// Somme un effet de réduction de dégâts subis (shield) : max 90%.
export function getIncomingDamageMultiplier(effects: StatusEffect[]): number {
  let mult = 1;
  for (const e of effects) {
    if (e.type === 'shield') mult *= 1 - e.value;
  }
  return Math.max(0.1, mult);
}

// Augmentation des dégâts reçus (marked, defenseDown).
export function getDamageTakenAmplifier(effects: StatusEffect[]): number {
  let mult = 1;
  for (const e of effects) {
    if (e.type === 'marked') mult *= 1 + e.value;
    if (e.type === 'defenseDown') mult *= 1 + e.value;
  }
  return mult;
}

// Multiplicateur des dégâts infligés (damageUp, damageDown).
export function getOutgoingDamageMultiplier(effects: StatusEffect[]): number {
  let mult = 1;
  for (const e of effects) {
    if (e.type === 'damageUp') mult *= 1 + e.value;
    if (e.type === 'damageDown') mult *= 1 - e.value;
  }
  return Math.max(0.1, mult);
}

export function hasSkipTurn(effects: StatusEffect[]): boolean {
  return effects.some((e) => e.type === 'skipTurn');
}

export function consumeSkipTurn(effects: StatusEffect[]): StatusEffect[] {
  // On retire UN effet skipTurn (le skip a été "consommé" par ce tour).
  const idx = effects.findIndex((e) => e.type === 'skipTurn');
  if (idx < 0) return effects;
  return [...effects.slice(0, idx), ...effects.slice(idx + 1)];
}
