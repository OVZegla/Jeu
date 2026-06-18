import type { Ability } from '../game/types';
import { BALANCE } from '../game/balance';

const A = BALANCE.abilities;
const MP = BALANCE.mpCosts;

// === Datpaloof ===
export const jugement: Ability = {
  id: 'jugement',
  name: 'Jugement',
  description: "Frappe sacrée. Réduit légèrement la défense du boss pendant 1 tour.",
  category: 'attack',
  target: 'enemy',
  cooldown: A.jugement.cooldown,
  basePower: A.jugement.power,
  mpCost: MP.jugement,
  menuSlot: 'attaque',
  icon: '⚖️',
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

export const bouclierDivin: Ability = {
  id: 'bouclierDivin',
  name: 'Bouclier divin',
  description: "Réduit fortement les dégâts subis pendant 1 tour.",
  category: 'defense',
  target: 'self',
  cooldown: A.bouclierDivin.cooldown,
  basePower: 0,
  mpCost: MP.bouclierDivin,
  menuSlot: 'defense',
  icon: '🛡️',
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

export const soinsRapides: Ability = {
  id: 'soinsRapides',
  name: 'Soins rapides',
  description: "Soin instantané modéré sur un allié.",
  category: 'heal',
  target: 'ally',
  cooldown: A.soinsRapides.cooldown,
  basePower: A.soinsRapides.power,
  mpCost: MP.soinsRapides,
  menuSlot: 'special',
  icon: '✨',
};

export const consecration: Ability = {
  id: 'consecration',
  name: 'Consécration',
  description: "Zone sacrée qui brûle le boss sur 3 tours et réduit ses dégâts.",
  category: 'debuff',
  target: 'enemy',
  cooldown: A.consecration.cooldown,
  basePower: 0,
  mpCost: MP.consecration,
  menuSlot: 'special',
  icon: '🔆',
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

// === Baghaar ===
export const dechargeOcculte: Ability = {
  id: 'dechargeOcculte',
  name: 'Décharge occulte',
  description: "Trait d'énergie sombre. Applique une faiblesse occulte.",
  category: 'attack',
  target: 'enemy',
  cooldown: A.dechargeOcculte.cooldown,
  basePower: A.dechargeOcculte.power,
  mpCost: MP.dechargeOcculte,
  menuSlot: 'attaque',
  icon: '🌑',
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

export const totemDeSoin: Ability = {
  id: 'totemDeSoin',
  name: 'Totem de soin',
  description: "Pose un totem qui soigne légèrement toute l'équipe pendant 3 tours.",
  category: 'heal',
  target: 'allAllies',
  cooldown: A.totemDeSoin.cooldown,
  basePower: 0,
  mpCost: MP.totemDeSoin,
  menuSlot: 'defense',
  icon: '🪵',
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

export const chaineDEclairs: Ability = {
  id: 'chaineDEclairs',
  name: "Chaîne d'éclairs",
  description: "Foudre chaotique. Forte chance de coup critique, dégâts variables.",
  category: 'attack',
  target: 'enemy',
  cooldown: A.chaineDEclairs.cooldown,
  basePower: A.chaineDEclairs.power,
  mpCost: MP.chaineDEclairs,
  menuSlot: 'special',
  critChance: A.chaineDEclairs.critChance,
  variance: A.chaineDEclairs.variance,
  icon: '⚡',
};

export const soinInterdit: Ability = {
  id: 'soinInterdit',
  name: 'Soin interdit',
  description: "Soin massif sur un allié. Baghaar perd une partie de ses PV.",
  category: 'heal',
  target: 'ally',
  cooldown: A.soinInterdit.cooldown,
  basePower: A.soinInterdit.power,
  mpCost: MP.soinInterdit,
  menuSlot: 'special',
  selfCost: A.soinInterdit.selfCost,
  icon: '🩸',
};

// === Zlatax ===
export const entailleInfernale: Ability = {
  id: 'entailleInfernale',
  name: 'Entaille infernale',
  description: "Attaque rapide à dégâts directs.",
  category: 'attack',
  target: 'enemy',
  cooldown: A.entailleInfernale.cooldown,
  basePower: A.entailleInfernale.power,
  mpCost: MP.entailleInfernale,
  menuSlot: 'attaque',
  variance: A.entailleInfernale.variance,
  icon: '🗡️',
};

export const pacteInstable: Ability = {
  id: 'pacteInstable',
  name: 'Pacte instable',
  description: "Augmente fortement les dégâts de Zlatax 2 tours, mais il subit plus de dégâts.",
  category: 'buff',
  target: 'self',
  cooldown: A.pacteInstable.cooldown,
  basePower: 0,
  mpCost: MP.pacteInstable,
  menuSlot: 'defense',
  icon: '😈',
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

export const rueeDemoniaque: Ability = {
  id: 'rueeDemoniaque',
  name: 'Ruée démoniaque',
  description: "Frappe lourde avec haute chance de critique.",
  category: 'attack',
  target: 'enemy',
  cooldown: A.rueeDemoniaque.cooldown,
  basePower: A.rueeDemoniaque.power,
  mpCost: MP.rueeDemoniaque,
  menuSlot: 'special',
  critChance: A.rueeDemoniaque.critChance,
  icon: '💢',
};

export const marqueDuTraque: Ability = {
  id: 'marqueDuTraque',
  name: 'Marque du traqué',
  description: "Le boss reçoit plus de dégâts pendant 2 tours.",
  category: 'debuff',
  target: 'enemy',
  cooldown: A.marqueDuTraque.cooldown,
  basePower: 0,
  mpCost: MP.marqueDuTraque,
  menuSlot: 'special',
  icon: '🎯',
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

// === Boss (le boss n'utilise pas le menu, donc menuSlot et mpCost sont "neutres") ===
const B = BALANCE.bossAbilities;

export const tamponReglementaire: Ability = {
  id: 'tamponReglementaire',
  name: 'Tampon réglementaire',
  description: "Coup de tampon administratif sur un personnage.",
  category: 'attack',
  target: 'ally',
  cooldown: B.tamponReglementaire.cooldown,
  basePower: B.tamponReglementaire.power,
  mpCost: 0,
  menuSlot: 'attaque',
  variance: B.tamponReglementaire.variance,
  icon: '📜',
};

export const appelDOffresMaudit: Ability = {
  id: 'appelDOffresMaudit',
  name: "Appel d'offres maudit",
  description: "Dégâts à toute l'équipe.",
  category: 'attack',
  target: 'allAllies',
  cooldown: B.appelDOffresMaudit.cooldown,
  basePower: B.appelDOffresMaudit.power,
  mpCost: 0,
  menuSlot: 'attaque',
  icon: '📑',
};

export const decretIncomprehensible: Ability = {
  id: 'decretIncomprehensible',
  name: 'Décret incompréhensible',
  description: "Réduit temporairement les dégâts infligés par l'équipe.",
  category: 'debuff',
  target: 'allAllies',
  cooldown: B.decretIncomprehensible.cooldown,
  basePower: 0,
  mpCost: 0,
  menuSlot: 'special',
  icon: '📕',
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

export const reunionInterminable: Ability = {
  id: 'reunionInterminable',
  name: 'Réunion interminable',
  description: "Chance de faire sauter le prochain tour d'un personnage.",
  category: 'debuff',
  target: 'ally',
  cooldown: B.reunionInterminable.cooldown,
  basePower: 0,
  mpCost: 0,
  menuSlot: 'special',
  icon: '💤',
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

export const subventionRefusee: Ability = {
  id: 'subventionRefusee',
  name: 'Subvention refusée',
  description: "Gros dégât ciblé sur le plus faible.",
  category: 'attack',
  target: 'ally',
  cooldown: B.subventionRefusee.cooldown,
  basePower: B.subventionRefusee.power,
  mpCost: 0,
  menuSlot: 'attaque',
  icon: '💸',
};

export const archivageDefinitif: Ability = {
  id: 'archivageDefinitif',
  name: 'Archivage définitif',
  description: "[Phase enragée] Lourds dégâts à toute l'équipe.",
  category: 'attack',
  target: 'allAllies',
  cooldown: B.archivageDefinitif.cooldown,
  basePower: B.archivageDefinitif.power,
  mpCost: 0,
  menuSlot: 'special',
  icon: '📚',
};
