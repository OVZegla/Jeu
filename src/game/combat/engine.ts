// Moteur de combat V2 — tour par tour, multi-ennemis, initiative, éléments,
// objets, invocations, télégraphes. Pur TypeScript (ni React ni Phaser).
//
// Contrat : chaque fonction publique renvoie { state, events }. Le rendu joue
// les événements dans l'ordre (avec ses timings) puis affiche l'état final.

import type {
  BattleState,
  CombatEvent,
  Combatant,
  EnemyCombatant,
  HeroCombatant,
  PlayerAction,
  Skill,
  StepResult,
  TurnEntry,
} from './types';
import { rollDamage, rollHeal, sortByInitiative } from './formulas';
import { decideEnemyAction } from './ai';
import { getSkill } from '../../data/skills';
import { getEnemyGroup, instantiateEnemy } from '../../data/enemies';
import { getItem, NEGATIVE_STATUS_TYPES } from '../../data/items';
import { heroCombatantFrom, type HeroState } from '../../data/party';
import { BALANCE2 } from '../balance';
import {
  consumeSkipTurn,
  hasSkipTurn,
  instantiateEffect,
  tickStatusDurations,
} from '../statusEffects';

// ============================================================
// Création
// ============================================================

export function createBattle(
  heroStates: HeroState[],
  groupId: string,
  inventory: Record<string, number>
): BattleState {
  const group = getEnemyGroup(groupId);
  const heroes = heroStates.map(heroCombatantFrom);
  const enemies = group.enemyIds.map((eid, i) => instantiateEnemy(eid, `${i + 1}`));
  const hasBoss = enemies.some((e) => e.isBoss);
  return {
    phase: 'intro',
    round: 0,
    heroes,
    enemies,
    queue: [],
    activeId: null,
    inventory: { ...inventory },
    boss: hasBoss ? { phase: 1, telegraphSkillId: null, summonsDone: 0 } : null,
    groupId,
  };
}

// ============================================================
// Accès / helpers
// ============================================================

export function allCombatants(state: BattleState): Combatant[] {
  return [...state.heroes, ...state.enemies];
}

export function findCombatant(state: BattleState, id: string): Combatant | null {
  return allCombatants(state).find((c) => c.id === id) ?? null;
}

export function aliveHeroes(state: BattleState): HeroCombatant[] {
  return state.heroes.filter((h) => h.alive);
}

export function aliveEnemies(state: BattleState): EnemyCombatant[] {
  return state.enemies.filter((e) => e.alive);
}

export function canUseSkill(c: Combatant, skill: Skill): boolean {
  if (!c.alive) return false;
  if ((c.cooldowns[skill.id] || 0) > 0) return false;
  if (skill.mpCost > 0 && c.mp < skill.mpCost) return false;
  return true;
}

function clone(state: BattleState): BattleState {
  return structuredClone(state);
}

function buildQueue(state: BattleState): TurnEntry[] {
  const alive = allCombatants(state).filter((c) => c.alive);
  return sortByInitiative(alive).map((c) => ({
    combatantId: c.id,
    isHero: c.kind === 'hero',
  }));
}

// Prévision de l'ordre des tours pour l'UI (reste du round + round suivant).
export function forecastTurnOrder(state: BattleState, count = 8): TurnEntry[] {
  const current = state.queue.filter((e) => {
    const c = findCombatant(state, e.combatantId);
    return c && c.alive;
  });
  const next = buildQueue(state);
  const out: TurnEntry[] = [...current];
  while (out.length < count && next.length > 0) {
    out.push(...next.slice(0, count - out.length));
  }
  return out.slice(0, count);
}

// ============================================================
// Dégâts / soins / statuts (mutent le state cloné, poussent les events)
// ============================================================

function bossShieldActive(state: BattleState, target: Combatant): boolean {
  if (target.kind !== 'enemy' || !target.isBoss) return false;
  return state.enemies.some((e) => e.alive && e.enemyId === 'page');
}

function dealDamage(
  state: BattleState,
  events: CombatEvent[],
  caster: Combatant,
  target: Combatant,
  skill: Skill
): void {
  if (!target.alive) return;
  const roll = rollDamage(caster, target, skill);
  let amount = roll.amount;

  // Boss enragé (phase 3) : +15% de dégâts.
  if (caster.kind === 'enemy' && caster.isBoss && (state.boss?.phase ?? 1) >= 3) {
    amount = Math.round(amount * 1.15);
  }
  // Pages protectrices : le boss absorbe une grosse partie des dégâts.
  if (bossShieldActive(state, target)) {
    amount = Math.max(1, Math.round(amount * (1 - BALANCE2.boss2.summonShieldValue)));
  }

  target.hp = Math.max(0, target.hp - amount);
  const effText =
    roll.effectiveness === 'weak' ? ' C\'est super efficace !' :
    roll.effectiveness === 'resist' ? ' La cible résiste…' : '';
  events.push({
    t: 'damage',
    casterId: caster.id,
    targetId: target.id,
    amount,
    crit: roll.crit,
    element: skill.element,
    effectiveness: roll.effectiveness,
    hpAfter: target.hp,
    skillId: skill.id,
  });
  events.push({
    t: 'log',
    text: `${roll.crit ? '💥 CRITIQUE ! ' : ''}${skill.name} inflige ${amount} dégâts à ${target.name}.${effText}`,
    kind: 'damage',
  });

  // Vol de MP
  if (skill.mpDrain && target.kind === 'hero' && target.mp > 0) {
    const drained = Math.min(target.mp, skill.mpDrain);
    target.mp -= drained;
    events.push({ t: 'mpChange', targetId: target.id, amount: -drained, mpAfter: target.mp });
    events.push({ t: 'log', text: `💰 ${target.name} perd ${drained} MP !`, kind: 'status' });
  }

  if (target.hp <= 0) {
    target.alive = false;
    target.status = [];
    events.push({ t: 'death', targetId: target.id });
    events.push({
      t: 'log',
      text: `☠️ ${target.name} est ${target.kind === 'hero' ? 'mis hors-jeu' : 'archivé'}.`,
      kind: 'death',
    });
  }

  // Changement de phase du boss après dégâts.
  if (target.kind === 'enemy' && target.isBoss && target.alive && state.boss) {
    const pct = target.hp / target.maxHp;
    if (state.boss.phase < 2 && pct <= BALANCE2.boss2.phase2Threshold) {
      state.boss.phase = 2;
      events.push({
        t: 'bossPhase',
        phase: 2,
        text: 'Les rayonnages tremblent. « Vous troublez le classement. PROCÉDONS. »',
      });
    }
    if (state.boss.phase < 3 && pct <= BALANCE2.boss2.phase3Threshold) {
      state.boss.phase = 3;
      // Nouvelle vague de pages possible en phase 3.
      state.boss.summonsDone = 0;
      events.push({
        t: 'bossPhase',
        phase: 3,
        text: 'L\'écharpe tricolore s\'embrase de flammes violettes. « DOSSIER… CLASSÉ. »',
      });
    }
  }
}

function healTarget(
  _state: BattleState,
  events: CombatEvent[],
  target: Combatant,
  amount: number,
  sourceName: string
): void {
  if (!target.alive) return;
  const healed = Math.min(target.maxHp, target.hp + Math.round(amount));
  const gained = healed - target.hp;
  target.hp = healed;
  events.push({ t: 'heal', targetId: target.id, amount: gained, hpAfter: target.hp });
  events.push({ t: 'log', text: `💚 ${sourceName} rend ${gained} PV à ${target.name}.`, kind: 'heal' });
}

function applyStatus(
  _state: BattleState,
  events: CombatEvent[],
  target: Combatant,
  template: Parameters<typeof instantiateEffect>[0],
  sourceName: string
): void {
  if (!target.alive) return;
  const effect = instantiateEffect(template);
  target.status = [...target.status.filter((e) => e.type !== effect.type), effect];
  const positive = effect.type === 'shield' || effect.type === 'hot' || effect.type === 'damageUp';
  events.push({ t: 'status', targetId: target.id, effect, positive });
  events.push({
    t: 'log',
    text: `${effect.icon} ${sourceName} applique « ${effect.name} » sur ${target.name} (${effect.duration}t).`,
    kind: 'status',
  });
}

// ============================================================
// Résolution d'une compétence
// ============================================================

function resolveTargets(
  state: BattleState,
  caster: Combatant,
  skill: Skill,
  chosenId: string | null
): Combatant[] {
  const allies: Combatant[] = caster.kind === 'hero' ? state.heroes : state.enemies;
  const foes: Combatant[] = caster.kind === 'hero' ? state.enemies : state.heroes;
  const aliveOf = (l: Combatant[]) => l.filter((c) => c.alive);
  switch (skill.target) {
    case 'self':
      return [caster];
    case 'ally': {
      if (chosenId) {
        const t = findCombatant(state, chosenId);
        return t && t.alive ? [t] : [];
      }
      return [caster];
    }
    case 'allAllies':
      return aliveOf(allies);
    case 'enemy': {
      if (chosenId) {
        const t = findCombatant(state, chosenId);
        if (t && t.alive) return [t];
      }
      const list = aliveOf(foes);
      return list.length > 0 ? [list[Math.floor(Math.random() * list.length)]] : [];
    }
    case 'allEnemies':
      return aliveOf(foes);
  }
}

function resolveSkill(
  state: BattleState,
  events: CombatEvent[],
  casterId: string,
  skillId: string,
  chosenTargetId: string | null
): void {
  const caster = findCombatant(state, casterId);
  if (!caster || !caster.alive) return;
  const skill = getSkill(skillId);
  if (!canUseSkill(caster, skill)) return;

  // Coût MP
  if (skill.mpCost > 0) {
    caster.mp = Math.max(0, caster.mp - skill.mpCost);
    events.push({ t: 'mpChange', targetId: caster.id, amount: -skill.mpCost, mpAfter: caster.mp });
  }
  // Coût PV (Soin interdit…)
  if (skill.selfCost && skill.selfCost > 0) {
    const cost = Math.min(caster.hp - 1, skill.selfCost); // ne se suicide pas
    caster.hp -= cost;
    events.push({ t: 'log', text: `🩸 ${caster.name} sacrifie ${cost} PV.`, kind: 'damage' });
  }

  const targets = resolveTargets(state, caster, skill, chosenTargetId);
  events.push({ t: 'cast', casterId: caster.id, skillId: skill.id, targetIds: targets.map((t) => t.id) });
  events.push({
    t: 'log',
    text: `${skill.icon} ${caster.name} utilise « ${skill.name} ».`,
    kind: caster.kind === 'enemy' ? 'boss' : 'info',
  });

  // Cas spécial : invocation des Pages protectrices
  if (skill.id === 'pagesProtectrices' && state.boss) {
    const pages = [instantiateEnemy('page'), instantiateEnemy('page')];
    state.enemies.push(...pages);
    state.boss.summonsDone += 1;
    // Les pages rejoignent la file du round en cours.
    state.queue.push(...pages.map((p) => ({ combatantId: p.id, isHero: false })));
    events.push({ t: 'summon', enemies: structuredClone(pages) });
    events.push({
      t: 'log',
      text: '📚 Des Pages protectrices s\'arrachent des étagères et font écran devant le Champion !',
      kind: 'phase',
    });
  }

  // Buffs sur le lanceur
  if (skill.appliesToCaster) {
    for (const tpl of skill.appliesToCaster) {
      applyStatus(state, events, caster, tpl, caster.name);
    }
  }

  for (const target of targets) {
    if (skill.basePower > 0) {
      if (skill.category === 'heal') {
        healTarget(state, events, target, rollHeal(caster, skill), skill.name);
      } else if (skill.category === 'attack') {
        dealDamage(state, events, caster, target, skill);
      }
    }
    if (skill.applies && target.alive) {
      const chance = skill.applyChance ?? 1;
      if (Math.random() <= chance) {
        for (const tpl of skill.applies) {
          applyStatus(state, events, target, tpl, caster.name);
        }
      } else {
        events.push({
          t: 'log',
          text: `…${target.name} esquive l'effet de « ${skill.name} ».`,
          kind: 'info',
        });
      }
    }
  }

  // Cooldown
  if (skill.cooldown > 0) {
    caster.cooldowns[skill.id] = skill.cooldown;
  }
}

// ============================================================
// Objets
// ============================================================

function resolveItem(
  state: BattleState,
  events: CombatEvent[],
  userId: string,
  itemId: string,
  targetId: string
): void {
  const user = findCombatant(state, userId);
  const target = findCombatant(state, targetId);
  const item = getItem(itemId);
  if (!user || !target) return;
  if ((state.inventory[itemId] || 0) <= 0) return;
  if (item.targetDead ? target.alive : !target.alive) return;

  state.inventory[itemId] -= 1;
  events.push({ t: 'item', userId, itemId, targetId });
  events.push({
    t: 'log',
    text: `${item.icon} ${user.name} utilise « ${item.name} » sur ${target.name}.`,
    kind: 'info',
  });

  switch (item.effect) {
    case 'heal':
      healTarget(state, events, target, item.value, item.name);
      break;
    case 'mp': {
      const gained = Math.min(target.maxMp - target.mp, item.value);
      target.mp += gained;
      events.push({ t: 'mpChange', targetId: target.id, amount: gained, mpAfter: target.mp });
      events.push({ t: 'log', text: `☕ ${target.name} récupère ${gained} MP.`, kind: 'heal' });
      break;
    }
    case 'cleanse': {
      const before = target.status.length;
      target.status = target.status.filter(
        (e) => !(NEGATIVE_STATUS_TYPES as readonly string[]).includes(e.type)
      );
      events.push({
        t: 'log',
        text: before !== target.status.length
          ? `📄 Les altérations de ${target.name} sont annulées (cachet officiel).`
          : `📄 ${target.name} n'avait aucune altération à purger…`,
        kind: 'status',
      });
      break;
    }
    case 'revive': {
      if (!target.alive) {
        target.alive = true;
        target.hp = Math.max(1, Math.round(target.maxHp * item.value));
        events.push({ t: 'revive', targetId: target.id, hpAfter: target.hp });
        events.push({ t: 'log', text: `🖋️ ${target.name} est désarchivé ! (${target.hp} PV)`, kind: 'heal' });
        // Le ressuscité rejoue au prochain round (pas dans la file courante).
      }
      break;
    }
  }
}

// ============================================================
// Fin de round : DOT/HOT, cooldowns, durées, MP regen
// ============================================================

function endOfRound(state: BattleState, events: CombatEvent[]): void {
  for (const c of allCombatants(state)) {
    if (!c.alive) continue;
    for (const e of c.status) {
      if (e.type === 'dot') {
        const dmg = Math.max(1, Math.round(e.value));
        c.hp = Math.max(0, c.hp - dmg);
        events.push({ t: 'tickDamage', targetId: c.id, amount: dmg, hpAfter: c.hp, name: e.name, icon: e.icon });
        events.push({ t: 'log', text: `${e.icon} ${c.name} subit ${dmg} dégâts (${e.name}).`, kind: 'damage' });
        if (c.hp <= 0) {
          c.alive = false;
          c.status = [];
          events.push({ t: 'death', targetId: c.id });
          events.push({ t: 'log', text: `☠️ ${c.name} succombe à ${e.name}.`, kind: 'death' });
          break;
        }
      }
      if (e.type === 'hot') {
        const heal = Math.min(c.maxHp - c.hp, Math.max(1, Math.round(e.value)));
        if (heal > 0) {
          c.hp += heal;
          events.push({ t: 'tickHeal', targetId: c.id, amount: heal, hpAfter: c.hp, name: e.name, icon: e.icon });
          events.push({ t: 'log', text: `${e.icon} ${c.name} récupère ${heal} PV (${e.name}).`, kind: 'heal' });
        }
      }
    }
    if (!c.alive) continue;
    // Cooldowns
    const cd: Record<string, number> = {};
    for (const [k, v] of Object.entries(c.cooldowns)) {
      if (v - 1 > 0) cd[k] = v - 1;
    }
    c.cooldowns = cd;
    // Durées de statuts
    c.status = tickStatusDurations(c.status).remaining;
    // Regen MP (héros)
    if (c.kind === 'hero' && c.mpRegen > 0) {
      const gained = Math.min(c.maxMp - c.mp, c.mpRegen);
      if (gained > 0) {
        c.mp += gained;
        events.push({ t: 'mpChange', targetId: c.id, amount: gained, mpAfter: c.mp });
      }
    }
  }
}

// ============================================================
// Conditions de fin
// ============================================================

function checkEnd(state: BattleState, events: CombatEvent[]): boolean {
  if (state.phase === 'victory' || state.phase === 'defeat') return true;
  if (aliveEnemies(state).length === 0) {
    state.phase = 'victory';
    const group = getEnemyGroup(state.groupId);
    const xpGained = state.enemies.reduce((s, e) => s + e.xpReward, 0);
    const drops: Array<{ itemId: string; count: number }> = [];
    for (const d of group.drops) {
      if (Math.random() <= d.chance) drops.push({ itemId: d.itemId, count: d.count });
    }
    events.push({
      t: 'log',
      text: group.isBossGroup
        ? '🏆 Le Champion s\'effondre dans un tourbillon de circulaires. Les Archives retiennent leur souffle.'
        : '🏆 Victoire ! Les documents hostiles retombent en poussière.',
      kind: 'phase',
    });
    events.push({ t: 'victory', xpGained, drops });
    return true;
  }
  if (aliveHeroes(state).length === 0) {
    state.phase = 'defeat';
    events.push({ t: 'log', text: '💀 Vos héros sont archivés à jamais…', kind: 'death' });
    events.push({ t: 'defeat' });
    return true;
  }
  return false;
}

// ============================================================
// Boucle de tours
// ============================================================

const MAX_AUTO_STEPS = 60; // garde-fou anti-boucle infinie

function stepUntilPlayerInput(state: BattleState, events: CombatEvent[]): void {
  let guard = 0;
  while (guard++ < MAX_AUTO_STEPS) {
    if (checkEnd(state, events)) return;

    // Nouveau round si la file est vide.
    if (state.queue.length === 0) {
      if (state.round > 0) {
        endOfRound(state, events);
        if (checkEnd(state, events)) return;
      }
      state.round += 1;
      state.queue = buildQueue(state);
      events.push({ t: 'log', text: `— Round ${state.round} —`, kind: 'info' });
    }

    const entry = state.queue[0];
    const c = findCombatant(state, entry.combatantId);
    if (!c || !c.alive) {
      state.queue.shift();
      continue;
    }

    // Tour sauté (réunion interminable…)
    if (hasSkipTurn(c.status)) {
      c.status = consumeSkipTurn(c.status);
      events.push({ t: 'skipTurn', combatantId: c.id, reason: 'réunion' });
      events.push({ t: 'log', text: `💤 ${c.name} est coincé en réunion et passe son tour.`, kind: 'info' });
      state.queue.shift();
      continue;
    }

    if (c.kind === 'hero') {
      state.activeId = c.id;
      state.phase = 'playerAction';
      events.push({ t: 'turnStart', combatantId: c.id });
      return;
    }

    // Tour d'un ennemi
    state.queue.shift();
    state.activeId = c.id;
    events.push({ t: 'turnStart', combatantId: c.id });
    const decision = decideEnemyAction(state, c);

    // Télégraphe du boss (tour de préparation)
    if (decision.skillId === '__telegraph_archivage__' && state.boss) {
      state.boss.telegraphSkillId = 'archivageDefinitif';
      events.push({
        t: 'telegraph',
        casterId: c.id,
        skillId: 'archivageDefinitif',
        text: '⚠️ Le Champion lève son Tampon du Jugement Dernier… GARDE recommandée !',
      });
      events.push({
        t: 'log',
        text: '⚠️ ARCHIVAGE DÉFINITIF se prépare ! Utilisez Garde ou un bouclier !',
        kind: 'boss',
      });
      continue;
    }

    if (state.boss && state.boss.telegraphSkillId === decision.skillId) {
      state.boss.telegraphSkillId = null;
    }
    resolveSkill(state, events, c.id, decision.skillId, decision.targetId);
    if (checkEnd(state, events)) return;
  }
}

// ============================================================
// API publique
// ============================================================

// Lance le combat (après l'intro côté rendu).
export function beginBattle(state: BattleState): StepResult {
  const st = clone(state);
  const events: CombatEvent[] = [];
  st.phase = 'resolving';
  stepUntilPlayerInput(st, events);
  return { state: st, events };
}

// Action du héros actif, puis avance jusqu'au prochain tour de héros.
export function submitPlayerAction(state: BattleState, action: PlayerAction): StepResult {
  if (state.phase !== 'playerAction' || !state.activeId) {
    return { state, events: [] };
  }
  const st = clone(state);
  const events: CombatEvent[] = [];
  const heroId = st.activeId!;
  st.phase = 'resolving';

  if (action.type === 'skill') {
    resolveSkill(st, events, heroId, action.skillId, action.targetId);
  } else if (action.type === 'item') {
    resolveItem(st, events, heroId, action.itemId, action.targetId);
  }

  // Fin du tour du héros.
  st.queue.shift();
  st.activeId = null;
  stepUntilPlayerInput(st, events);
  return { state: st, events };
}
