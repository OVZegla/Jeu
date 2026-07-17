// IA des ennemis V2. `basic` : pondération simple par type de compétence.
// `boss-champion` : machine à états par phases (invocation, télégraphe).

import type { BattleState, EnemyCombatant, HeroCombatant } from './types';
import { getSkill } from '../../data/skills';

export interface AiDecision {
  skillId: string;
  targetId: string | null; // null = résolu par le moteur (self/AoE)
}

function aliveHeroes(state: BattleState): HeroCombatant[] {
  return state.heroes.filter((h) => h.alive);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function usableSkills(state: BattleState, enemy: EnemyCombatant): string[] {
  return enemy.skillIds.filter((id) => {
    const s = getSkill(id);
    if ((enemy.cooldowns[id] || 0) > 0) return false;
    if (s.conditions?.minBossPhase && (state.boss?.phase ?? 1) < s.conditions.minBossPhase) return false;
    if (s.conditions?.requiresTelegraph) return false; // géré par la logique boss
    return true;
  });
}

function basicDecision(state: BattleState, enemy: EnemyCombatant): AiDecision {
  const usable = usableSkills(state, enemy);
  const heroes = aliveHeroes(state);
  if (usable.length === 0 || heroes.length === 0) {
    return { skillId: enemy.skillIds[0], targetId: heroes[0]?.id ?? null };
  }
  // Pondération : attaques x2, le reste x1
  const weighted = usable.map((id) => ({
    id,
    w: getSkill(id).category === 'attack' ? 2 : 1,
  }));
  const total = weighted.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * total;
  let chosen = weighted[0].id;
  for (const { id, w } of weighted) {
    r -= w;
    if (r <= 0) { chosen = id; break; }
  }
  const skill = getSkill(chosen);
  const target = skill.target === 'enemy' ? pickRandom(heroes).id : null;
  return { skillId: chosen, targetId: target };
}

function championDecision(state: BattleState, boss: EnemyCombatant): AiDecision {
  const rt = state.boss!;
  const heroes = aliveHeroes(state);

  // Télégraphe en attente → l'attaque annoncée part maintenant.
  if (rt.telegraphSkillId) {
    return { skillId: rt.telegraphSkillId, targetId: null };
  }

  // Phase 2 : invoque les Pages protectrices (une seule fois par vague).
  const pagesAlive = state.enemies.some((e) => e.alive && e.enemyId === 'page');
  if (rt.phase >= 2 && rt.summonsDone === 0 && !pagesAlive) {
    return { skillId: 'pagesProtectrices', targetId: null };
  }

  // Phase 3 : télégraphe Archivage définitif dès que le cooldown le permet.
  if (rt.phase >= 3 && (boss.cooldowns['archivageDefinitif'] || 0) <= 0 && Math.random() < 0.75) {
    return { skillId: '__telegraph_archivage__', targetId: null };
  }

  const usable = usableSkills(state, boss).filter((id) => id !== 'pagesProtectrices' && id !== 'archivageDefinitif');
  const weights: Record<string, number> = {
    tamponReglementaire: 3,
    appelDOffresMaudit: rt.phase >= 2 ? 3 : 2,
    decretIncomprehensible: 1.5,
    reunionInterminable: 1.5,
    subventionRefusee: 2.5,
  };
  const weighted = usable.map((id) => ({ id, w: weights[id] ?? 1 }));
  const total = weighted.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * total;
  let chosen = weighted[0]?.id ?? 'tamponReglementaire';
  for (const { id, w } of weighted) {
    r -= w;
    if (r <= 0) { chosen = id; break; }
  }

  const skill = getSkill(chosen);
  let targetId: string | null = null;
  if (skill.target === 'enemy') {
    if (chosen === 'subventionRefusee') {
      // Cible le héros le plus faible.
      targetId = [...heroes].sort((a, b) => a.hp - b.hp)[0].id;
    } else {
      targetId = pickRandom(heroes).id;
    }
  }
  return { skillId: chosen, targetId };
}

export function decideEnemyAction(state: BattleState, enemy: EnemyCombatant): AiDecision {
  if (enemy.ai === 'boss-champion') return championDecision(state, enemy);
  return basicDecision(state, enemy);
}
