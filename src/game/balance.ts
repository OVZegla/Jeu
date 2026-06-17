// Centralise toutes les valeurs d'équilibrage. Modifier ce fichier suffit
// pour rendre le combat plus dur, plus facile, plus long, plus rapide.

export const BALANCE = {
  // PV bruts
  boss: {
    maxHp: 1400,
    defense: 0.1,
    power: 1.0,
    enragePhaseThreshold: 0.4, // sous 40% → enraged
  },
  characters: {
    datpaloof: { maxHp: 280, defense: 0.35, physicalPower: 1.0, magicPower: 0.8 },
    baghaar:   { maxHp: 210, defense: 0.15, physicalPower: 0.7, magicPower: 1.2 },
    zlatax:    { maxHp: 180, defense: 0.05, physicalPower: 1.4, magicPower: 0.6 },
  },

  // Compétences joueurs
  abilities: {
    // Datpaloof
    jugement:        { power: 70,  cooldown: 0, defenseDownValue: 0.15, defenseDownDuration: 1 },
    bouclierDivin:   { power: 0,   cooldown: 3, shieldValue: 0.7, shieldDuration: 1 },
    soinsRapides:    { power: 80,  cooldown: 1 },
    consecration:    { power: 35,  cooldown: 3, dotDuration: 3, damageDownValue: 0.15, damageDownDuration: 3 },

    // Baghaar
    totemDeSoin:     { power: 30,  cooldown: 3, duration: 3 },
    dechargeOcculte: { power: 75,  cooldown: 0, weaknessValue: 0.12, weaknessDuration: 2 },
    chaineDEclairs:  { power: 95,  cooldown: 2, critChance: 0.3, variance: 0.2 },
    soinInterdit:    { power: 180, cooldown: 3, selfCost: 60 },

    // Zlatax
    entailleInfernale: { power: 65,  cooldown: 0, variance: 0.1 },
    rueeDemoniaque:    { power: 120, cooldown: 2, critChance: 0.4 },
    marqueDuTraque:    { power: 0,   cooldown: 3, markedValue: 0.25, markedDuration: 2 },
    pacteInstable:     { power: 0,   cooldown: 4, damageUpValue: 0.6, vulnerabilityValue: 0.4, duration: 2 },
  },

  // Compétences du boss
  bossAbilities: {
    tamponReglementaire: { power: 90,  cooldown: 0, variance: 0.15 },
    appelDOffresMaudit:  { power: 50,  cooldown: 2 },
    decretIncomprehensible: { cooldown: 3, damageDownValue: 0.25, duration: 2 },
    reunionInterminable: { cooldown: 3, skipChance: 0.55 },
    subventionRefusee:   { power: 130, cooldown: 2 },
    archivageDefinitif:  { power: 110, cooldown: 3 }, // débloquée en phase enragée
  },

  // Multiplicateurs globaux
  critMultiplier: 1.75,
  enrageDamageMultiplier: 1.15, // le boss tape un peu plus fort en phase enragée
};
