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
    datpaloof: { maxHp: 280, maxMp: 100, mpRegen: 18, defense: 0.35, physicalPower: 1.0, magicPower: 0.8 },
    baghaar:   { maxHp: 210, maxMp: 140, mpRegen: 22, defense: 0.15, physicalPower: 0.7, magicPower: 1.2 },
    zlatax:    { maxHp: 180, maxMp: 80,  mpRegen: 14, defense: 0.05, physicalPower: 1.4, magicPower: 0.6 },
  },

  // Coûts MP par compétence (mappés ci-dessous dans abilities.ts)
  mpCosts: {
    // Datpaloof
    jugement: 0,         // attaque de base — gratuite
    bouclierDivin: 18,
    soinsRapides: 24,
    consecration: 32,
    // Baghaar
    dechargeOcculte: 0,  // attaque de base
    totemDeSoin: 28,
    chaineDEclairs: 30,
    soinInterdit: 40,
    // Zlatax
    entailleInfernale: 0, // attaque de base
    pacteInstable: 18,
    rueeDemoniaque: 28,
    marqueDuTraque: 20,
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

// ============================================================
// Équilibrage V2 (refonte RPG) — vitesse, éléments, ennemis, XP, objets
// ============================================================

export const BALANCE2 = {
  // Multiplicateurs élémentaires
  weaknessMultiplier: 1.5,
  resistanceMultiplier: 0.6,
  defendReduction: 0.55,        // « Garde » générique : -55% dégâts subis 1 tour

  // Vitesse (initiative) des héros
  heroSpeeds: { datpaloof: 9, baghaar: 8, zlatax: 13 },

  // Croissance par niveau (multiplicateur appliqué par level-up)
  levelGrowth: { hp: 0.10, mp: 0.08, power: 0.06 },
  xpForLevel: (level: number) => Math.round(90 * Math.pow(level, 1.5)),

  // Ennemis normaux des Archives
  enemies: {
    grimoire: {
      maxHp: 150, defense: 0.10, power: 0.9, speed: 7, xp: 55,
      weaknesses: ['sacre', 'feu'], resistances: ['occulte'],
    },
    decret: {
      maxHp: 105, defense: 0.05, power: 0.8, speed: 14, xp: 40,
      weaknesses: ['foudre', 'feu'], resistances: ['physique'],
    },
    grimoire2: { // élite « Budget dévorant »
      maxHp: 300, defense: 0.18, power: 1.15, speed: 6, xp: 140,
      weaknesses: ['sacre'], resistances: ['occulte', 'physique'],
    },
    decret2: { // « Arrêté vengeur »
      maxHp: 140, defense: 0.08, power: 1.0, speed: 12, xp: 70,
      weaknesses: ['foudre'], resistances: ['physique'],
    },
  },

  // Boss V2
  boss2: {
    maxHp: 1500, defense: 0.12, power: 1.0, speed: 10, xp: 600,
    weaknesses: [] as string[], resistances: ['bureaucratie', 'occulte'],
    phase2Threshold: 0.70,      // ≤70% → invocation des Pages protectrices
    phase3Threshold: 0.40,      // ≤40% → enragé + Archivage définitif télégraphié
    summonShieldValue: 0.65,    // réduction des dégâts subis tant que les pages vivent
  },

  // Compétences ennemies
  enemySkills: {
    coupDeTranche:    { power: 55, cooldown: 0, variance: 0.15 },
    paragrapheSoporifique: { cooldown: 3, skipChance: 0.5 },
    coupureAdministrative: { power: 40, cooldown: 2, dotValue: 14, dotDuration: 2 },
    notificationRecommandee: { power: 60, cooldown: 0, variance: 0.1 },
    ponctionBudgetaire: { power: 70, cooldown: 2, mpDrain: 25 },
    jurisprudenceEcrasante: { power: 85, cooldown: 3 },
  },

  // Attaque télégraphiée du boss (phase 3)
  archivageDefinitifTelegraphed: { power: 150 },

  // === Factions de la Forêt de Lamber ===
  factionEnemies: {
    bandit:      { maxHp: 130, defense: 0.08, power: 0.95, speed: 11, xp: 50,
                   weaknesses: ['foudre'], resistances: [] },          // armures volées → conductrices
    banditChef:  { maxHp: 280, defense: 0.14, power: 1.15, speed: 12, xp: 170,
                   weaknesses: ['foudre'], resistances: ['physique'] },
    gobelin:     { maxHp: 95,  defense: 0.04, power: 0.85, speed: 9,  xp: 35,
                   weaknesses: ['feu', 'sacre'], resistances: ['occulte'] }, // trop bêtes pour être maudits
    roiGobelin:  { maxHp: 340, defense: 0.15, power: 1.20, speed: 8,  xp: 200,
                   weaknesses: ['feu'], resistances: ['occulte', 'physique'] },
    cultiste:    { maxHp: 120, defense: 0.06, power: 1.00, speed: 10, xp: 55,
                   weaknesses: ['sacre'], resistances: ['occulte'] },
    hierophante: { maxHp: 300, defense: 0.12, power: 1.15, speed: 11, xp: 190,
                   weaknesses: ['sacre'], resistances: ['occulte'] },
  },
  factionSkills: {
    // Bandits
    coupDeSurin:     { power: 50, cooldown: 0, variance: 0.15, dotValue: 12, dotDuration: 2 },
    jetDeCouteau:    { power: 45, cooldown: 0, variance: 0.25 },
    racketOrganise:  { power: 35, cooldown: 2, mpDrain: 18 },
    coupBas:         { power: 80, cooldown: 2, critChance: 0.4 },
    // Gobelins
    grosGourdin:     { power: 60, cooldown: 0, variance: 0.45 },
    jetDeCaillou:    { power: 30, cooldown: 1, skipChance: 0.3 },
    kriKriKri:       { cooldown: 3, damageDownValue: 0.2, duration: 2 },
    chargeDuRoi:     { power: 95, cooldown: 2, critChance: 0.25 },
    // Cultistes
    psaumeObscur:    { power: 55, cooldown: 0 },
    chantMonotone:   { cooldown: 3, skipChance: 0.5 },
    saigneeRituelle: { power: 75, cooldown: 2, selfCost: 15 },
    cercleDInvocation: { cooldown: 3, damageUpValue: 0.3, duration: 2 },
    appelDuGrandDormeur: { power: 60, cooldown: 3 },
  },

  // Objets
  items: {
    dossierDeSoin: { heal: 90 },
    cafeDuGreffier: { mp: 45 },
    formulaireA38: {},           // purge les altérations négatives
    encreBenite: { revivePct: 0.5 },
  },

  // Inventaire de départ
  startingInventory: { dossierDeSoin: 3, cafeDuGreffier: 2, formulaireA38: 1, encreBenite: 1 },
};
