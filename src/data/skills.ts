// Compétences V2 — data-driven : gameplay + présentation (VFX/SFX/timing).
// Les valeurs numériques restent dans balance.ts (BALANCE / BALANCE2).
// Ajouter une compétence = ajouter un objet ici + la référencer dans
// party.ts / enemies.ts. Le moteur et le rendu s'occupent du reste.

import type { Skill } from '../game/combat/types';
import { BALANCE, BALANCE2 } from '../game/balance';

const A = BALANCE.abilities;
const B = BALANCE.bossAbilities;
const E = BALANCE2.enemySkills;
const MP = BALANCE.mpCosts;

// ============================================================
// Compétence universelle : Garde
// ============================================================
export const garde: Skill = {
  id: 'garde',
  name: 'Garde',
  description: `Posture défensive : -${Math.round(BALANCE2.defendReduction * 100)}% de dégâts subis jusqu'au prochain tour. Essentielle contre les attaques annoncées.`,
  icon: '🛡',
  category: 'defense',
  element: 'physique',
  target: 'self',
  menuSlot: 'defense',
  mpCost: 0,
  cooldown: 0,
  basePower: 0,
  intensity: 'light',
  presentation: { vfx: 'shield', color: 0x9ecbff, hitDelayMs: 150, approach: 'none' },
  appliesToCaster: [
    {
      type: 'shield',
      name: 'Garde',
      description: `-${Math.round(BALANCE2.defendReduction * 100)}% dégâts subis`,
      duration: 1,
      value: BALANCE2.defendReduction,
      icon: '🛡',
    },
  ],
};

// ============================================================
// Datpaloof — paladin sacré
// ============================================================
export const jugement: Skill = {
  id: 'jugement',
  name: 'Jugement',
  description: 'Frappe sacrée de l\'épée runique. Réduit la défense de la cible 1 tour.',
  icon: '⚖️',
  category: 'attack',
  element: 'sacre',
  target: 'enemy',
  menuSlot: 'attaque',
  mpCost: MP.jugement,
  cooldown: A.jugement.cooldown,
  basePower: A.jugement.power,
  intensity: 'light',
  presentation: { vfx: 'holy', color: 0xffd27a, hitDelayMs: 330, approach: 'melee', shake: 0.25, hitStopMs: 60 },
  applies: [
    {
      type: 'defenseDown',
      name: 'Défense ébranlée',
      description: `+${Math.round(A.jugement.defenseDownValue * 100)}% dégâts subis`,
      duration: A.jugement.defenseDownDuration,
      value: A.jugement.defenseDownValue,
      icon: '🛡️↓',
    },
  ],
};

export const bouclierDivin: Skill = {
  id: 'bouclierDivin',
  name: 'Bouclier divin',
  description: 'Réduit fortement les dégâts subis pendant 1 tour.',
  icon: '✨🛡',
  category: 'defense',
  element: 'sacre',
  target: 'self',
  menuSlot: 'special',
  mpCost: MP.bouclierDivin,
  cooldown: A.bouclierDivin.cooldown,
  basePower: 0,
  intensity: 'skill',
  presentation: { vfx: 'shield', color: 0xffe9a8, hitDelayMs: 200, approach: 'none' },
  appliesToCaster: [
    {
      type: 'shield',
      name: 'Bouclier divin',
      description: `-${Math.round(A.bouclierDivin.shieldValue * 100)}% dégâts subis`,
      duration: A.bouclierDivin.shieldDuration,
      value: A.bouclierDivin.shieldValue,
      icon: '🛡️',
    },
  ],
};

export const soinsRapides: Skill = {
  id: 'soinsRapides',
  name: 'Soins rapides',
  description: 'Lumière réparatrice : soin instantané modéré sur un allié.',
  icon: '✨',
  category: 'heal',
  element: 'soin',
  target: 'ally',
  menuSlot: 'special',
  mpCost: MP.soinsRapides,
  cooldown: A.soinsRapides.cooldown,
  basePower: A.soinsRapides.power,
  intensity: 'skill',
  presentation: { vfx: 'heal', color: 0x9dffb0, hitDelayMs: 380, approach: 'none' },
};

export const consecration: Skill = {
  id: 'consecration',
  name: 'Consécration',
  description: 'Zone sacrée : brûle la cible 3 tours et réduit ses dégâts.',
  icon: '🔆',
  category: 'debuff',
  element: 'sacre',
  target: 'enemy',
  menuSlot: 'special',
  mpCost: MP.consecration,
  cooldown: A.consecration.cooldown,
  basePower: 0,
  intensity: 'heavy',
  presentation: { vfx: 'holy', color: 0xfff3b0, hitDelayMs: 420, approach: 'ranged', shake: 0.2 },
  applies: [
    {
      type: 'dot',
      name: 'Consécration',
      description: `${A.consecration.power} dégâts sacrés/tour`,
      duration: A.consecration.dotDuration,
      value: A.consecration.power,
      icon: '🔆',
    },
    {
      type: 'damageDown',
      name: 'Foi écrasante',
      description: `-${Math.round(A.consecration.damageDownValue * 100)}% dégâts infligés`,
      duration: A.consecration.damageDownDuration,
      value: A.consecration.damageDownValue,
      icon: '✦↓',
    },
  ],
};

// ============================================================
// Baghaar — chaman occultiste
// ============================================================
export const dechargeOcculte: Skill = {
  id: 'dechargeOcculte',
  name: 'Décharge occulte',
  description: 'Trait d\'énergie sombre. Marque la cible (+dégâts subis).',
  icon: '🌑',
  category: 'attack',
  element: 'occulte',
  target: 'enemy',
  menuSlot: 'attaque',
  mpCost: MP.dechargeOcculte,
  cooldown: A.dechargeOcculte.cooldown,
  basePower: A.dechargeOcculte.power,
  intensity: 'light',
  presentation: { vfx: 'occult', color: 0xb46bff, hitDelayMs: 400, approach: 'ranged', shake: 0.2 },
  applies: [
    {
      type: 'marked',
      name: 'Faiblesse occulte',
      description: `+${Math.round(A.dechargeOcculte.weaknessValue * 100)}% dégâts subis`,
      duration: A.dechargeOcculte.weaknessDuration,
      value: A.dechargeOcculte.weaknessValue,
      icon: '✦',
    },
  ],
};

export const totemDeSoin: Skill = {
  id: 'totemDeSoin',
  name: 'Totem de soin',
  description: 'Totem ancestral : soigne toute l\'équipe pendant 3 tours.',
  icon: '🪵',
  category: 'heal',
  element: 'soin',
  target: 'allAllies',
  menuSlot: 'special',
  mpCost: MP.totemDeSoin,
  cooldown: A.totemDeSoin.cooldown,
  basePower: 0,
  intensity: 'skill',
  presentation: { vfx: 'heal', color: 0x7fe8c0, hitDelayMs: 380, approach: 'none' },
  applies: [
    {
      type: 'hot',
      name: 'Totem de soin',
      description: `+${A.totemDeSoin.power} PV/tour`,
      duration: A.totemDeSoin.duration,
      value: A.totemDeSoin.power,
      icon: '🌿',
    },
  ],
};

export const chaineDEclairs: Skill = {
  id: 'chaineDEclairs',
  name: 'Chaîne d\'éclairs',
  description: 'Foudre chaotique : forte chance de critique, dégâts variables.',
  icon: '⚡',
  category: 'attack',
  element: 'foudre',
  target: 'enemy',
  menuSlot: 'special',
  mpCost: MP.chaineDEclairs,
  cooldown: A.chaineDEclairs.cooldown,
  basePower: A.chaineDEclairs.power,
  critChance: A.chaineDEclairs.critChance,
  variance: A.chaineDEclairs.variance,
  intensity: 'heavy',
  presentation: { vfx: 'lightning', color: 0x9be1ff, hitDelayMs: 320, approach: 'ranged', shake: 0.45, hitStopMs: 70 },
};

export const soinInterdit: Skill = {
  id: 'soinInterdit',
  name: 'Soin interdit',
  description: 'Soin massif sur un allié. Baghaar sacrifie une partie de ses PV.',
  icon: '🩸',
  category: 'heal',
  element: 'soin',
  target: 'ally',
  menuSlot: 'special',
  mpCost: MP.soinInterdit,
  cooldown: A.soinInterdit.cooldown,
  basePower: A.soinInterdit.power,
  selfCost: A.soinInterdit.selfCost,
  intensity: 'heavy',
  presentation: { vfx: 'heal', color: 0xff9d9d, hitDelayMs: 450, approach: 'none' },
};

// ============================================================
// Zlatax — chasseur de démons
// ============================================================
export const entailleInfernale: Skill = {
  id: 'entailleInfernale',
  name: 'Entaille infernale',
  description: 'Double lame rapide, dégâts directs.',
  icon: '🗡️',
  category: 'attack',
  element: 'physique',
  target: 'enemy',
  menuSlot: 'attaque',
  mpCost: MP.entailleInfernale,
  cooldown: A.entailleInfernale.cooldown,
  basePower: A.entailleInfernale.power,
  variance: A.entailleInfernale.variance,
  intensity: 'light',
  presentation: { vfx: 'slash', color: 0xa8ff8a, hitDelayMs: 280, approach: 'melee', shake: 0.25, hitStopMs: 50 },
};

export const pacteInstable: Skill = {
  id: 'pacteInstable',
  name: 'Pacte instable',
  description: '+60% de dégâts pendant 2 tours, mais Zlatax devient vulnérable.',
  icon: '😈',
  category: 'buff',
  element: 'occulte',
  target: 'self',
  menuSlot: 'special',
  mpCost: MP.pacteInstable,
  cooldown: A.pacteInstable.cooldown,
  basePower: 0,
  intensity: 'skill',
  presentation: { vfx: 'occult', color: 0xd06bff, hitDelayMs: 250, approach: 'none' },
  appliesToCaster: [
    {
      type: 'damageUp',
      name: 'Pacte instable',
      description: `+${Math.round(A.pacteInstable.damageUpValue * 100)}% dégâts infligés`,
      duration: A.pacteInstable.duration,
      value: A.pacteInstable.damageUpValue,
      icon: '🔥',
    },
    {
      type: 'defenseDown',
      name: 'Énergie corrompue',
      description: `+${Math.round(A.pacteInstable.vulnerabilityValue * 100)}% dégâts subis`,
      duration: A.pacteInstable.duration,
      value: A.pacteInstable.vulnerabilityValue,
      icon: '⚠️',
    },
  ],
};

export const rueeDemoniaque: Skill = {
  id: 'rueeDemoniaque',
  name: 'Ruée démoniaque',
  description: 'Charge brutale imprégnée d\'énergie démoniaque. Critique fréquent.',
  icon: '💢',
  category: 'attack',
  element: 'occulte',
  target: 'enemy',
  menuSlot: 'special',
  mpCost: MP.rueeDemoniaque,
  cooldown: A.rueeDemoniaque.cooldown,
  basePower: A.rueeDemoniaque.power,
  critChance: A.rueeDemoniaque.critChance,
  intensity: 'heavy',
  presentation: { vfx: 'slash', color: 0x8aff5a, hitDelayMs: 360, approach: 'melee', shake: 0.5, hitStopMs: 90 },
};

export const marqueDuTraque: Skill = {
  id: 'marqueDuTraque',
  name: 'Marque du traqué',
  description: 'La cible reçoit +25% de dégâts pendant 2 tours.',
  icon: '🎯',
  category: 'debuff',
  element: 'occulte',
  target: 'enemy',
  menuSlot: 'special',
  mpCost: MP.marqueDuTraque,
  cooldown: A.marqueDuTraque.cooldown,
  basePower: 0,
  intensity: 'skill',
  presentation: { vfx: 'occult', color: 0xff6bd4, hitDelayMs: 300, approach: 'ranged' },
  applies: [
    {
      type: 'marked',
      name: 'Marque du traqué',
      description: `+${Math.round(A.marqueDuTraque.markedValue * 100)}% dégâts subis`,
      duration: A.marqueDuTraque.markedDuration,
      value: A.marqueDuTraque.markedValue,
      icon: '🎯',
    },
  ],
};

// ============================================================
// Boss — le Champion des Collectivités Territoriales
// ============================================================
export const tamponReglementaire: Skill = {
  id: 'tamponReglementaire',
  name: 'Tampon réglementaire',
  description: 'Coup de tampon administratif écrasant sur un héros.',
  icon: '📜',
  category: 'attack',
  element: 'bureaucratie',
  target: 'enemy',
  menuSlot: 'attaque',
  mpCost: 0,
  cooldown: B.tamponReglementaire.cooldown,
  basePower: B.tamponReglementaire.power,
  variance: B.tamponReglementaire.variance,
  intensity: 'boss',
  presentation: { vfx: 'stamp', color: 0xc44dff, hitDelayMs: 520, approach: 'ranged', shake: 0.45, hitStopMs: 70 },
};

export const appelDOffresMaudit: Skill = {
  id: 'appelDOffresMaudit',
  name: 'Appel d\'offres maudit',
  description: 'Tourbillon de documents maudits : dégâts à toute l\'équipe.',
  icon: '📑',
  category: 'attack',
  element: 'occulte',
  target: 'allEnemies',
  menuSlot: 'attaque',
  mpCost: 0,
  cooldown: B.appelDOffresMaudit.cooldown,
  basePower: B.appelDOffresMaudit.power,
  intensity: 'boss',
  presentation: { vfx: 'papers', color: 0xb46bff, hitDelayMs: 550, approach: 'none', shake: 0.35 },
};

export const decretIncomprehensible: Skill = {
  id: 'decretIncomprehensible',
  name: 'Décret incompréhensible',
  description: 'Réduit les dégâts infligés par toute l\'équipe.',
  icon: '📕',
  category: 'debuff',
  element: 'bureaucratie',
  target: 'allEnemies',
  menuSlot: 'special',
  mpCost: 0,
  cooldown: B.decretIncomprehensible.cooldown,
  basePower: 0,
  intensity: 'boss',
  presentation: { vfx: 'papers', color: 0x8866ff, hitDelayMs: 480, approach: 'none' },
  applies: [
    {
      type: 'damageDown',
      name: 'Décret incompréhensible',
      description: `-${Math.round(B.decretIncomprehensible.damageDownValue * 100)}% dégâts infligés`,
      duration: B.decretIncomprehensible.duration,
      value: B.decretIncomprehensible.damageDownValue,
      icon: '📕',
    },
  ],
};

export const reunionInterminable: Skill = {
  id: 'reunionInterminable',
  name: 'Réunion interminable',
  description: 'Convoque un héros en réunion : chance de lui faire sauter son tour.',
  icon: '💤',
  category: 'debuff',
  element: 'bureaucratie',
  target: 'enemy',
  menuSlot: 'special',
  mpCost: 0,
  cooldown: B.reunionInterminable.cooldown,
  basePower: 0,
  applyChance: B.reunionInterminable.skipChance,
  intensity: 'boss',
  presentation: { vfx: 'papers', color: 0x6688cc, hitDelayMs: 420, approach: 'none' },
  applies: [
    {
      type: 'skipTurn',
      name: 'Réunion interminable',
      description: 'Tour sauté',
      duration: 1,
      value: 1,
      icon: '💤',
    },
  ],
};

export const subventionRefusee: Skill = {
  id: 'subventionRefusee',
  name: 'Subvention refusée',
  description: 'Refus sec et brutal, ciblé sur le héros le plus faible.',
  icon: '💸',
  category: 'attack',
  element: 'bureaucratie',
  target: 'enemy',
  menuSlot: 'attaque',
  mpCost: 0,
  cooldown: B.subventionRefusee.cooldown,
  basePower: B.subventionRefusee.power,
  intensity: 'boss',
  presentation: { vfx: 'stamp', color: 0xff5566, hitDelayMs: 540, approach: 'ranged', shake: 0.55, hitStopMs: 90 },
};

export const pagesProtectrices: Skill = {
  id: 'pagesProtectrices',
  name: 'Classement vertical',
  description: 'Invoque des Pages protectrices qui absorbent les dégâts du Champion.',
  icon: '📚',
  category: 'buff',
  element: 'bureaucratie',
  target: 'self',
  menuSlot: 'special',
  mpCost: 0,
  cooldown: 99,
  basePower: 0,
  intensity: 'boss',
  presentation: { vfx: 'summon', color: 0xc44dff, hitDelayMs: 600, approach: 'none', shake: 0.4 },
  conditions: { minBossPhase: 2 },
};

export const archivageDefinitif: Skill = {
  id: 'archivageDefinitif',
  name: 'Archivage définitif',
  description: '[Annoncée un tour à l\'avance] Dégâts massifs à toute l\'équipe. GARDE obligatoire.',
  icon: '⚖️📚',
  category: 'attack',
  element: 'bureaucratie',
  target: 'allEnemies',
  menuSlot: 'special',
  mpCost: 0,
  cooldown: B.archivageDefinitif.cooldown,
  basePower: BALANCE2.archivageDefinitifTelegraphed.power,
  intensity: 'ultimate',
  presentation: { vfx: 'stamp', color: 0xff3366, hitDelayMs: 900, approach: 'none', shake: 1.0, hitStopMs: 140 },
  conditions: { minBossPhase: 3, requiresTelegraph: true },
};

// ============================================================
// Compétences des ennemis normaux
// ============================================================
export const coupDeTranche: Skill = {
  id: 'coupDeTranche',
  name: 'Coup de tranche',
  description: 'Le grimoire se referme violemment sur sa cible.',
  icon: '📖',
  category: 'attack',
  element: 'physique',
  target: 'enemy',
  menuSlot: 'attaque',
  mpCost: 0,
  cooldown: E.coupDeTranche.cooldown,
  basePower: E.coupDeTranche.power,
  variance: E.coupDeTranche.variance,
  intensity: 'light',
  presentation: { vfx: 'slash', color: 0xcc99ff, hitDelayMs: 350, approach: 'melee', shake: 0.2 },
};

export const paragrapheSoporifique: Skill = {
  id: 'paragrapheSoporifique',
  name: 'Paragraphe soporifique',
  description: 'Lecture assommante : chance de faire sauter un tour.',
  icon: '💤',
  category: 'debuff',
  element: 'bureaucratie',
  target: 'enemy',
  menuSlot: 'special',
  mpCost: 0,
  cooldown: E.paragrapheSoporifique.cooldown,
  basePower: 0,
  applyChance: E.paragrapheSoporifique.skipChance,
  intensity: 'skill',
  presentation: { vfx: 'papers', color: 0x99aadd, hitDelayMs: 420, approach: 'none' },
  applies: [
    { type: 'skipTurn', name: 'Sommeil réglementaire', description: 'Tour sauté', duration: 1, value: 1, icon: '💤' },
  ],
};

export const coupureAdministrative: Skill = {
  id: 'coupureAdministrative',
  name: 'Coupure administrative',
  description: 'Coupure de papier maudite : saignement 2 tours.',
  icon: '🩸',
  category: 'attack',
  element: 'physique',
  target: 'enemy',
  menuSlot: 'attaque',
  mpCost: 0,
  cooldown: E.coupureAdministrative.cooldown,
  basePower: E.coupureAdministrative.power,
  intensity: 'skill',
  presentation: { vfx: 'slash', color: 0xffe0e0, hitDelayMs: 300, approach: 'melee', shake: 0.2 },
  applies: [
    {
      type: 'dot',
      name: 'Coupure de papier',
      description: `${E.coupureAdministrative.dotValue} dégâts/tour`,
      duration: E.coupureAdministrative.dotDuration,
      value: E.coupureAdministrative.dotValue,
      icon: '🩸',
    },
  ],
};

export const notificationRecommandee: Skill = {
  id: 'notificationRecommandee',
  name: 'Notification recommandée',
  description: 'Le décret fond sur sa cible avec accusé de réception.',
  icon: '📨',
  category: 'attack',
  element: 'bureaucratie',
  target: 'enemy',
  menuSlot: 'attaque',
  mpCost: 0,
  cooldown: E.notificationRecommandee.cooldown,
  basePower: E.notificationRecommandee.power,
  variance: E.notificationRecommandee.variance,
  intensity: 'light',
  presentation: { vfx: 'papers', color: 0xddccff, hitDelayMs: 320, approach: 'melee', shake: 0.2 },
};

export const ponctionBudgetaire: Skill = {
  id: 'ponctionBudgetaire',
  name: 'Ponction budgétaire',
  description: 'Dévore les crédits : dégâts + vol de MP.',
  icon: '💰',
  category: 'attack',
  element: 'occulte',
  target: 'enemy',
  menuSlot: 'attaque',
  mpCost: 0,
  cooldown: E.ponctionBudgetaire.cooldown,
  basePower: E.ponctionBudgetaire.power,
  mpDrain: E.ponctionBudgetaire.mpDrain,
  intensity: 'heavy',
  presentation: { vfx: 'occult', color: 0xaa66ff, hitDelayMs: 420, approach: 'ranged', shake: 0.3 },
};

export const jurisprudenceEcrasante: Skill = {
  id: 'jurisprudenceEcrasante',
  name: 'Jurisprudence écrasante',
  description: 'Le poids des précédents s\'abat sur la cible.',
  icon: '⚖️',
  category: 'attack',
  element: 'bureaucratie',
  target: 'enemy',
  menuSlot: 'attaque',
  mpCost: 0,
  cooldown: E.jurisprudenceEcrasante.cooldown,
  basePower: E.jurisprudenceEcrasante.power,
  intensity: 'heavy',
  presentation: { vfx: 'stamp', color: 0xbb88ff, hitDelayMs: 480, approach: 'ranged', shake: 0.4, hitStopMs: 60 },
};

// ============================================================
// Registre
// ============================================================
const ALL_SKILLS: Skill[] = [
  garde,
  jugement, bouclierDivin, soinsRapides, consecration,
  dechargeOcculte, totemDeSoin, chaineDEclairs, soinInterdit,
  entailleInfernale, pacteInstable, rueeDemoniaque, marqueDuTraque,
  tamponReglementaire, appelDOffresMaudit, decretIncomprehensible,
  reunionInterminable, subventionRefusee, pagesProtectrices, archivageDefinitif,
  coupDeTranche, paragrapheSoporifique, coupureAdministrative,
  notificationRecommandee, ponctionBudgetaire, jurisprudenceEcrasante,
];

export const SKILLS: Record<string, Skill> = Object.fromEntries(
  ALL_SKILLS.map((s) => [s.id, s])
);

export function getSkill(id: string): Skill {
  const s = SKILLS[id];
  if (!s) throw new Error(`Compétence inconnue : ${id}`);
  return s;
}
