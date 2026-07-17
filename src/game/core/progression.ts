// Progression : XP, niveaux, montée de stats. Chaque héros vivant à la fin
// d'un combat gagne la totalité de l'XP du groupe vaincu (style JRPG-lite).

import { BALANCE2 } from '../balance';
import { computeHeroStats, type HeroState } from '../../data/party';

export interface LevelUpInfo {
  heroId: string;
  newLevel: number;
}

// Applique l'XP à l'équipe. Modifie les HeroState passés (copies) et renvoie
// la liste des level-ups. Un level-up restaure PV/MP au max (bienveillant).
export function applyXp(party: HeroState[], xp: number): { party: HeroState[]; levelUps: LevelUpInfo[] } {
  const levelUps: LevelUpInfo[] = [];
  const next = party.map((h) => {
    if (h.hp <= 0) return { ...h }; // les KO ne gagnent pas d'XP
    let hero = { ...h, xp: h.xp + xp };
    while (hero.xp >= BALANCE2.xpForLevel(hero.level)) {
      hero.xp -= BALANCE2.xpForLevel(hero.level);
      hero.level += 1;
      const stats = computeHeroStats(hero.heroId, hero.level);
      hero = { ...hero, hp: stats.maxHp, mp: stats.maxMp };
      levelUps.push({ heroId: hero.heroId, newLevel: hero.level });
    }
    return hero;
  });
  return { party: next, levelUps };
}

export function xpToNextLevel(hero: HeroState): number {
  return BALANCE2.xpForLevel(hero.level);
}
