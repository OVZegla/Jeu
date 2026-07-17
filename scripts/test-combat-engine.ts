// Test du moteur de combat V2 en node (sans navigateur).
// Simule des combats complets et vérifie les mécaniques du boss.
import { createBattle, beginBattle, submitPlayerAction, canUseSkill } from '../src/game/combat/engine';
import { getSkill } from '../src/data/skills';
import type { BattleState, CombatEvent } from '../src/game/combat/types';
import type { HeroState } from '../src/data/party';

function mkParty(level: number): HeroState[] {
  return [
    { heroId: 'datpaloof', level, xp: 0, hp: 9999, mp: 9999 },
    { heroId: 'baghaar', level, xp: 0, hp: 9999, mp: 9999 },
    { heroId: 'zlatax', level, xp: 0, hp: 9999, mp: 9999 },
  ];
}

// Joue un combat en spammant l'attaque de base (cible aléatoire moteur)
function simulate(groupId: string, level: number, maxTurns = 400) {
  let state: BattleState = createBattle(mkParty(level), groupId, { dossierDeSoin: 3, encreBenite: 1 });
  const seen = new Set<string>();
  const allEvents: CombatEvent[] = [];
  let res = beginBattle(state);
  state = res.state;
  allEvents.push(...res.events);
  let guard = 0;
  while (state.phase === 'playerAction' && guard++ < maxTurns) {
    const hero = state.heroes.find((h) => h.id === state.activeId)!;
    const attack = hero.skillIds.map(getSkill).find((s) => s.category === 'attack' && canUseSkill(hero, s))
      ?? getSkill('garde');
    res = submitPlayerAction(state, { type: 'skill', skillId: attack.id, targetId: null });
    state = res.state;
    allEvents.push(...res.events);
  }
  for (const e of allEvents) seen.add(e.t);
  return { state, events: allEvents, seen };
}

// === Test 1 : boss complet, équipe forte → victoire + mécaniques ===
{
  const { state, events, seen } = simulate('archives-boss', 8);
  const phases = events.filter((e) => e.t === 'bossPhase').map((e: any) => e.phase);
  const summons = events.filter((e) => e.t === 'summon');
  const telegraphs = events.filter((e) => e.t === 'telegraph');
  const archivage = events.filter((e: any) => e.t === 'cast' && e.skillId === 'archivageDefinitif');
  console.log('T1 boss — phase finale:', state.phase, '| phases:', phases, '| invocations:', summons.length,
    '| télégraphes:', telegraphs.length, '| archivages lancés:', archivage.length);
  console.assert(state.phase === 'victory', 'T1: devrait être victory');
  console.assert(phases.includes(2) && phases.includes(3), 'T1: phases 2 et 3 attendues');
  console.assert(summons.length >= 1, 'T1: invocation attendue');
  console.assert(events.some((e) => e.t === 'victory'), 'T1: event victory attendu');
}

// === Test 2 : boss, équipe niveau 1 sans soins → défaite probable ===
{
  let defeats = 0, victories = 0, telegraphsTotal = 0;
  for (let i = 0; i < 5; i++) {
    const { state, events } = simulate('archives-boss', 1);
    if (state.phase === 'defeat') defeats++;
    if (state.phase === 'victory') victories++;
    telegraphsTotal += events.filter((e) => e.t === 'telegraph').length;
  }
  console.log('T2 boss lvl1 x5 — défaites:', defeats, '| victoires:', victories, '| télégraphes cumulés:', telegraphsTotal);
  console.assert(defeats >= 1, 'T2: au moins une défaite attendue au niveau 1');
}

// === Test 3 : groupe normal → victoire + drops/xp ===
{
  const { state, events } = simulate('archives-ouest-patrouille', 3);
  const victory = events.find((e) => e.t === 'victory') as any;
  console.log('T3 patrouille — phase:', state.phase, '| xp:', victory?.xpGained, '| drops:', JSON.stringify(victory?.drops));
  console.assert(state.phase === 'victory' && victory.xpGained > 0, 'T3: victoire + xp');
}

// === Test 4 : objet en combat (soin) ===
{
  let state = createBattle(mkParty(3), 'archives-decret-solo', { dossierDeSoin: 2 });
  let res = beginBattle(state);
  state = res.state;
  // Blesse artificiellement le héros actif puis utilise un dossier de soin
  const hero = state.heroes.find((h) => h.id === state.activeId)!;
  hero.hp = 10;
  res = submitPlayerAction(state, { type: 'item', itemId: 'dossierDeSoin', targetId: hero.id });
  const healEv = res.events.find((e) => e.t === 'heal') as any;
  console.log('T4 objet — heal event:', healEv?.amount, '| inventaire restant:', res.state.inventory.dossierDeSoin);
  console.assert(healEv && healEv.amount > 0, 'T4: soin attendu');
  console.assert(res.state.inventory.dossierDeSoin === 1, 'T4: objet consommé');
}

// === Test 5 : garde réduit les dégâts de l'archivage télégraphié ===
{
  // Vérifie juste que la compétence garde applique bien un shield
  let state = createBattle(mkParty(5), 'archives-boss', {});
  let res = beginBattle(state);
  state = res.state;
  res = submitPlayerAction(state, { type: 'skill', skillId: 'garde', targetId: null });
  const heroAfter = res.state.heroes[0].id === 'datpaloof' ? res.state.heroes[0] : res.state.heroes.find(h => h.heroId === 'datpaloof')!;
  const hadShieldEvent = res.events.some((e: any) => e.t === 'status' && e.effect.type === 'shield');
  console.log('T5 garde — event shield:', hadShieldEvent, '| statuts datpaloof:', heroAfter.status.map((s) => s.type).join(','));
  console.assert(hadShieldEvent, 'T5: shield appliqué');
}

console.log('\\n✅ Tests moteur terminés');
