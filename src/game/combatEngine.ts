import type {
  Ability,
  Boss,
  Character,
  CombatLogEntry,
  GameState,
  StatusEffect,
} from './types';
import { BALANCE } from './balance';
import { createInitialCharacters } from '../data/characters';
import { createInitialBoss } from '../data/boss';
import {
  consumeSkipTurn,
  getDamageTakenAmplifier,
  getIncomingDamageMultiplier,
  getOutgoingDamageMultiplier,
  hasSkipTurn,
  instantiateEffect,
  tickStatusDurations,
} from './statusEffects';

// ============================================================
// État initial
// ============================================================

export function createInitialState(): GameState {
  return {
    phase: 'start',
    turn: 0,
    characters: createInitialCharacters(),
    boss: createInitialBoss(),
    log: [],
    activeCharacterIndex: 0,
    pendingTarget: null,
    logCounter: 0,
    damageTicks: {},
    healTicks: {},
    attackTicks: {},
    lastDamage: {},
    lastHeal: {},
  };
}

export function startCombat(): GameState {
  const fresh = createInitialState();
  fresh.phase = 'playerTurn';
  fresh.turn = 1;
  fresh.activeCharacterIndex = 0;
  return pushLog(fresh, {
    turn: 1,
    text: '⚔️ Le combat commence. Le Champion des Collectivités Territoriales toise vos héros.',
    kind: 'info',
  });
}

export function resetCombat(): GameState {
  return startCombat();
}

// ============================================================
// Utilitaires log + flashs visuels
// ============================================================

let logIdCounter = 0;
function pushLog(state: GameState, entry: Omit<CombatLogEntry, 'id'>): GameState {
  logIdCounter += 1;
  const next: CombatLogEntry = { id: logIdCounter, ...entry };
  // Limite : 60 dernières entrées pour ne pas exploser le DOM.
  const log = [...state.log, next].slice(-60);
  return { ...state, log };
}

function bumpDamageTick(state: GameState, id: string, amount: number): GameState {
  return {
    ...state,
    damageTicks: { ...state.damageTicks, [id]: (state.damageTicks[id] || 0) + 1 },
    lastDamage: { ...state.lastDamage, [id]: amount },
  };
}
function bumpHealTick(state: GameState, id: string, amount: number): GameState {
  return {
    ...state,
    healTicks: { ...state.healTicks, [id]: (state.healTicks[id] || 0) + 1 },
    lastHeal: { ...state.lastHeal, [id]: amount },
  };
}
function bumpAttackTick(state: GameState, id: string): GameState {
  return {
    ...state,
    attackTicks: { ...state.attackTicks, [id]: (state.attackTicks[id] || 0) + 1 },
  };
}

// ============================================================
// Mutations PV
// ============================================================

export function applyDamage(
  state: GameState,
  targetId: string,
  rawDamage: number,
  meta: { source: string; crit?: boolean }
): GameState {
  if (rawDamage <= 0) return state;
  const target = findEntity(state, targetId);
  if (!target || !target.alive) return state;

  // Réduction par défense plate puis par effets.
  const defense = 'defense' in target ? target.defense : 0;
  const shieldMult = getIncomingDamageMultiplier(target.status);
  const ampMult = getDamageTakenAmplifier(target.status);

  let damage = rawDamage * (1 - defense);
  damage *= shieldMult;
  damage *= ampMult;
  damage = Math.max(1, Math.round(damage));

  let next = state;
  if (isCharacter(target)) {
    const newHp = Math.max(0, target.hp - damage);
    const alive = newHp > 0;
    next = updateCharacter(next, targetId, () => ({ hp: newHp, alive }));
    next = bumpDamageTick(next, targetId, damage);
    next = pushLog(next, {
      turn: state.turn,
      text: `${meta.crit ? '💥 CRITIQUE ! ' : ''}${meta.source} inflige ${damage} dégâts à ${target.name}.`,
      kind: 'damage',
    });
    if (!alive) {
      next = pushLog(next, {
        turn: state.turn,
        text: `☠️ ${target.name} est mis hors-jeu.`,
        kind: 'death',
      });
    }
  } else {
    const newHp = Math.max(0, target.hp - damage);
    const alive = newHp > 0;
    next = { ...next, boss: { ...next.boss, hp: newHp, alive } };
    next = bumpDamageTick(next, targetId, damage);
    next = pushLog(next, {
      turn: state.turn,
      text: `${meta.crit ? '💥 CRITIQUE ! ' : ''}${meta.source} inflige ${damage} dégâts au boss.`,
      kind: 'damage',
    });
    // Bascule en phase enragée à la traversée du seuil.
    const threshold = next.boss.maxHp * BALANCE.boss.enragePhaseThreshold;
    if (!next.boss.enraged && newHp > 0 && newHp <= threshold) {
      next = { ...next, boss: { ...next.boss, enraged: true } };
      next = pushLog(next, {
        turn: state.turn,
        text: `🟢 ${next.boss.name} entre en PHASE ENRAGÉE. Les archives s'ouvrent.`,
        kind: 'phase',
      });
    }
  }
  return next;
}

export function applyHeal(
  state: GameState,
  targetId: string,
  amount: number,
  source: string
): GameState {
  if (amount <= 0) return state;
  const target = findEntity(state, targetId);
  if (!target || !target.alive) return state;

  let next = state;
  if (isCharacter(target)) {
    const healed = Math.min(target.maxHp, target.hp + Math.round(amount));
    const gained = healed - target.hp;
    next = updateCharacter(next, targetId, () => ({ hp: healed }));
    next = bumpHealTick(next, targetId, gained);
    next = pushLog(next, {
      turn: state.turn,
      text: `💚 ${source} soigne ${target.name} de ${gained} PV.`,
      kind: 'heal',
    });
  }
  return next;
}

export function applyStatusEffect(
  state: GameState,
  targetId: string,
  effect: StatusEffect,
  source: string
): GameState {
  const target = findEntity(state, targetId);
  if (!target || !target.alive) return state;

  // Si un effet de même type existe déjà, on le remplace (refresh).
  const filtered = target.status.filter((e) => e.type !== effect.type);
  const nextStatus = [...filtered, effect];

  let next = state;
  if (isCharacter(target)) {
    next = updateCharacter(next, targetId, () => ({ status: nextStatus }));
  } else {
    next = { ...next, boss: { ...next.boss, status: nextStatus } };
  }
  return pushLog(next, {
    turn: state.turn,
    text: `${effect.icon} ${source} applique « ${effect.name} » sur ${target.name} (${effect.duration}t).`,
    kind: 'status',
  });
}

// ============================================================
// Helpers d'accès
// ============================================================

export function isCharacter(e: Character | Boss): e is Character {
  return (e as Character).className !== undefined;
}

export function findEntity(state: GameState, id: string): Character | Boss | null {
  if (id === state.boss.id) return state.boss;
  return state.characters.find((c) => c.id === id) || null;
}

function updateCharacter(
  state: GameState,
  id: string,
  patch: (c: Character) => Partial<Character>
): GameState {
  return {
    ...state,
    characters: state.characters.map((c) => (c.id === id ? { ...c, ...patch(c) } : c)),
  };
}

export function aliveCharacters(state: GameState): Character[] {
  return state.characters.filter((c) => c.alive);
}

// ============================================================
// Exécution d'une action
// ============================================================

interface ExecutionContext {
  casterId: string;
  casterName: string;
  caster: Character | Boss;
  isBoss: boolean;
}

function resolveTargets(
  state: GameState,
  ability: Ability,
  ctx: ExecutionContext,
  chosenTargetId: string | null
): string[] {
  switch (ability.target) {
    case 'self':
      return [ctx.casterId];
    case 'enemy':
      // Joueur cible → boss. Boss cible → personnage choisi (ou aléatoire si null).
      if (!ctx.isBoss) return [state.boss.id];
      if (chosenTargetId) return [chosenTargetId];
      return pickRandomAliveCharacterId(state);
    case 'ally':
      if (!ctx.isBoss) return chosenTargetId ? [chosenTargetId] : [ctx.casterId];
      // Boss "ally" = un personnage (les abilities ciblent un perso).
      return chosenTargetId ? [chosenTargetId] : pickRandomAliveCharacterId(state);
    case 'allAllies':
      if (!ctx.isBoss) return state.characters.filter((c) => c.alive).map((c) => c.id);
      return state.characters.filter((c) => c.alive).map((c) => c.id);
    case 'allEnemies':
      return [state.boss.id];
  }
}

function pickRandomAliveCharacterId(state: GameState): string[] {
  const alive = aliveCharacters(state);
  if (alive.length === 0) return [];
  return [alive[Math.floor(Math.random() * alive.length)].id];
}

function computeAbilityDamage(
  ability: Ability,
  caster: Character | Boss
): { value: number; crit: boolean } {
  let value = ability.basePower;
  if (value <= 0) return { value: 0, crit: false };

  // Multiplicateur de stat
  if (isCharacter(caster)) {
    const isMagic =
      caster.id === 'baghaar' || caster.id === 'datpaloof'; // proxy simple
    value *= isMagic ? caster.magicPower : caster.physicalPower;
  } else {
    value *= caster.power;
    if (caster.enraged) value *= BALANCE.enrageDamageMultiplier;
  }

  // Multiplicateur d'effets sortants
  value *= getOutgoingDamageMultiplier(caster.status);

  // Variance
  if (ability.variance && ability.variance > 0) {
    const factor = 1 + (Math.random() * 2 - 1) * ability.variance;
    value *= factor;
  }

  // Crit
  let crit = false;
  if (ability.critChance && Math.random() < ability.critChance) {
    crit = true;
    value *= BALANCE.critMultiplier;
  }

  return { value: Math.round(value), crit };
}

export function executeAbility(
  state: GameState,
  casterId: string,
  ability: Ability,
  chosenTargetId: string | null
): GameState {
  const caster = findEntity(state, casterId);
  if (!caster || !caster.alive) return state;

  const isBoss = !isCharacter(caster);
  const ctx: ExecutionContext = {
    casterId,
    casterName: caster.name,
    caster,
    isBoss,
  };

  let next = bumpAttackTick(state, casterId);
  next = pushLog(next, {
    turn: state.turn,
    text: `${ability.icon} ${caster.name} utilise « ${ability.name} ».`,
    kind: isBoss ? 'boss' : 'info',
  });

  // Coût en PV self (Soin interdit, etc.)
  if (ability.selfCost && ability.selfCost > 0 && isCharacter(caster)) {
    const newHp = Math.max(1, caster.hp - ability.selfCost); // ne se suicide pas
    next = updateCharacter(next, casterId, () => ({ hp: newHp }));
    next = pushLog(next, {
      turn: state.turn,
      text: `🩸 ${caster.name} sacrifie ${caster.hp - newHp} PV.`,
      kind: 'damage',
    });
  }

  const targets = resolveTargets(next, ability, ctx, chosenTargetId);

  // Effets sur le caster (buffs perso).
  if (ability.appliesToCaster) {
    for (const tpl of ability.appliesToCaster) {
      next = applyStatusEffect(next, casterId, instantiateEffect(tpl), caster.name);
    }
  }

  for (const tId of targets) {
    // Dégâts / soins selon catégorie.
    if (ability.basePower > 0) {
      const { value, crit } = computeAbilityDamage(ability, caster);
      if (ability.category === 'heal') {
        next = applyHeal(next, tId, value, ability.name);
      } else if (ability.category === 'attack') {
        next = applyDamage(next, tId, value, { source: ability.name, crit });
      }
    }
    // Effets de statut appliqués à la cible.
    if (ability.applies) {
      for (const tpl of ability.applies) {
        // Cas particulier "skipTurn" → traité comme une chance.
        if (tpl.type === 'skipTurn') {
          const chance = BALANCE.bossAbilities.reunionInterminable.skipChance;
          if (Math.random() > chance) {
            next = pushLog(next, {
              turn: next.turn,
              text: `…la réunion s'éternise mais ${nameOf(next, tId)} parvient à s'éclipser.`,
              kind: 'info',
            });
            continue;
          }
        }
        next = applyStatusEffect(next, tId, instantiateEffect(tpl), caster.name);
      }
    }
  }

  // Mise en cooldown.
  if (ability.cooldown > 0) {
    if (isCharacter(caster)) {
      next = updateCharacter(next, casterId, (c) => ({
        cooldowns: { ...c.cooldowns, [ability.id]: ability.cooldown },
      }));
    } else {
      next = {
        ...next,
        boss: {
          ...next.boss,
          cooldowns: { ...next.boss.cooldowns, [ability.id]: ability.cooldown },
        },
      };
    }
  }

  return next;
}

function nameOf(state: GameState, id: string): string {
  const e = findEntity(state, id);
  return e ? e.name : '?';
}

// ============================================================
// Tick fin de tour : DOT, HOT, cooldowns, durations
// ============================================================

function tickDotsAndHots(state: GameState): GameState {
  let next = state;

  // Personnages
  for (const c of next.characters) {
    if (!c.alive) continue;
    for (const e of c.status) {
      if (e.type === 'dot') {
        next = applyDamage(next, c.id, e.value, { source: e.name });
      }
      if (e.type === 'hot') {
        next = applyHeal(next, c.id, e.value, e.name);
      }
    }
  }
  // Boss
  if (next.boss.alive) {
    for (const e of next.boss.status) {
      if (e.type === 'dot') {
        next = applyDamage(next, next.boss.id, e.value, { source: e.name });
      }
      if (e.type === 'hot') {
        next = applyHeal(next, next.boss.id, e.value, e.name);
      }
    }
  }
  return next;
}

function reduceCooldowns(state: GameState): GameState {
  const characters = state.characters.map((c) => {
    const cd: Record<string, number> = {};
    for (const [k, v] of Object.entries(c.cooldowns)) {
      if (v - 1 > 0) cd[k] = v - 1;
    }
    return { ...c, cooldowns: cd };
  });
  const bossCd: Record<string, number> = {};
  for (const [k, v] of Object.entries(state.boss.cooldowns)) {
    if (v - 1 > 0) bossCd[k] = v - 1;
  }
  return {
    ...state,
    characters,
    boss: { ...state.boss, cooldowns: bossCd },
  };
}

function tickAllStatusDurations(state: GameState): GameState {
  let next = state;
  const characters = next.characters.map((c) => {
    const { remaining } = tickStatusDurations(c.status);
    return { ...c, status: remaining };
  });
  next = { ...next, characters };
  const { remaining: bossRemaining } = tickStatusDurations(next.boss.status);
  next = { ...next, boss: { ...next.boss, status: bossRemaining } };
  return next;
}

export function endOfRoundTick(state: GameState): GameState {
  let next = tickDotsAndHots(state);
  next = reduceCooldowns(next);
  next = tickAllStatusDurations(next);
  return next;
}

// ============================================================
// IA du boss
// ============================================================

export function selectBossAction(state: GameState): Ability {
  const usable = state.boss.abilities.filter((a) => {
    if ((state.boss.cooldowns[a.id] || 0) > 0) return false;
    if (a.id === 'archivageDefinitif' && !state.boss.enraged) return false;
    return true;
  });

  // Pondération simple.
  const weighted: { ability: Ability; weight: number }[] = usable.map((a) => {
    let w = 1;
    switch (a.id) {
      case 'tamponReglementaire': w = 3; break;
      case 'appelDOffresMaudit': w = 2; break;
      case 'decretIncomprehensible': w = 1.5; break;
      case 'reunionInterminable': w = 1.5; break;
      case 'subventionRefusee': w = 2; break;
      case 'archivageDefinitif': w = 3; break;
    }
    return { ability: a, weight: w };
  });

  const total = weighted.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const { ability, weight } of weighted) {
    r -= weight;
    if (r <= 0) return ability;
  }
  return weighted[0].ability;
}

// Renvoie l'ID du personnage cible pour les attaques mono-cible du boss.
export function pickBossTarget(state: GameState, ability: Ability): string | null {
  const alive = aliveCharacters(state);
  if (alive.length === 0) return null;
  if (ability.id === 'subventionRefusee') {
    // Cible le plus faible.
    return [...alive].sort((a, b) => a.hp - b.hp)[0].id;
  }
  if (ability.target === 'ally') {
    // Choix aléatoire pondéré : un peu plus de chance vers DPS fragile.
    return alive[Math.floor(Math.random() * alive.length)].id;
  }
  return null;
}

// ============================================================
// Tours
// ============================================================

export function executeBossTurn(state: GameState): GameState {
  if (state.phase !== 'bossTurn') return state;
  let next = state;
  if (next.boss.alive) {
    const ability = selectBossAction(next);
    const target = pickBossTarget(next, ability);
    next = executeAbility(next, next.boss.id, ability, target);
  }
  // Fin du round complet → ticks.
  next = endOfRoundTick(next);
  // Vérification fin de jeu après ticks.
  next = checkEndConditions(next);
  if (next.phase === 'victory' || next.phase === 'defeat') return next;

  // Préparer le prochain tour joueur.
  next = { ...next, turn: next.turn + 1, phase: 'playerTurn' };
  next = pushLog(next, {
    turn: next.turn,
    text: `— Tour ${next.turn} —`,
    kind: 'info',
  });
  next = advanceToFirstActiveCharacter(next, 0);
  return next;
}

// Avance l'index actif jusqu'à un personnage vivant qui peut agir.
// S'il a un skipTurn, on consomme et on passe.
export function advanceToFirstActiveCharacter(
  state: GameState,
  startIdx: number
): GameState {
  let next = state;
  let i = startIdx;
  while (i < next.characters.length) {
    const c = next.characters[i];
    if (!c.alive) {
      i += 1;
      continue;
    }
    if (hasSkipTurn(c.status)) {
      // Consomme le skip, log, on passe.
      const newStatus = consumeSkipTurn(c.status);
      next = {
        ...next,
        characters: next.characters.map((cc) =>
          cc.id === c.id ? { ...cc, status: newStatus } : cc
        ),
      };
      next = pushLog(next, {
        turn: next.turn,
        text: `💤 ${c.name} est coincé en réunion et passe son tour.`,
        kind: 'info',
      });
      i += 1;
      continue;
    }
    return { ...next, activeCharacterIndex: i };
  }
  // Plus aucun personnage à jouer → boss.
  return { ...next, activeCharacterIndex: -1, phase: 'bossTurn' };
}

// Appelé après qu'un personnage a validé son action.
export function advanceAfterPlayerAction(state: GameState): GameState {
  const next = checkEndConditions(state);
  if (next.phase === 'victory' || next.phase === 'defeat') return next;
  return advanceToFirstActiveCharacter(next, next.activeCharacterIndex + 1);
}

// ============================================================
// Conditions de fin
// ============================================================

export function checkVictory(state: GameState): boolean {
  return !state.boss.alive;
}

export function checkDefeat(state: GameState): boolean {
  return state.characters.every((c) => !c.alive);
}

export function checkEndConditions(state: GameState): GameState {
  if (checkVictory(state)) {
    return pushLog({ ...state, phase: 'victory' }, {
      turn: state.turn,
      text: '🏆 Le Champion s\'effondre. Les archives se referment.',
      kind: 'info',
    });
  }
  if (checkDefeat(state)) {
    return pushLog({ ...state, phase: 'defeat' }, {
      turn: state.turn,
      text: '💀 Vos héros sont archivés à jamais.',
      kind: 'info',
    });
  }
  return state;
}
