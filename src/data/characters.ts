import type { Character } from '../game/types';
import { BALANCE } from '../game/balance';
import {
  jugement,
  bouclierDivin,
  soinsRapides,
  consecration,
  totemDeSoin,
  dechargeOcculte,
  chaineDEclairs,
  soinInterdit,
  entailleInfernale,
  rueeDemoniaque,
  marqueDuTraque,
  pacteInstable,
} from './abilities';

const C = BALANCE.characters;

// Note : l'ordre des abilities suit les slots du menu :
// [0]=attaque, [1]=defense, [2]=special, [3]=special.

export function createInitialCharacters(): Character[] {
  return [
    {
      id: 'datpaloof',
      name: 'Datpaloof',
      className: 'Paladin elfe de sang',
      description:
        "Paladin blond à l'armure rouge. Lumière, protection et justice flamboyante.",
      maxHp: C.datpaloof.maxHp,
      hp: C.datpaloof.maxHp,
      maxMp: C.datpaloof.maxMp,
      mp: C.datpaloof.maxMp,
      mpRegen: C.datpaloof.mpRegen,
      defense: C.datpaloof.defense,
      physicalPower: C.datpaloof.physicalPower,
      magicPower: C.datpaloof.magicPower,
      abilities: [jugement, bouclierDivin, soinsRapides, consecration],
      cooldowns: {},
      status: [],
      alive: true,
      icon: '🛡️',
      color: '#c0392b',
    },
    {
      id: 'baghaar',
      name: 'Baghaar',
      className: "Chaman occultiste Mag'har",
      description:
        "Orc à peau brune, totems et magie sombre. Mélange spiritualité ancestrale et occultisme.",
      maxHp: C.baghaar.maxHp,
      hp: C.baghaar.maxHp,
      maxMp: C.baghaar.maxMp,
      mp: C.baghaar.maxMp,
      mpRegen: C.baghaar.mpRegen,
      defense: C.baghaar.defense,
      physicalPower: C.baghaar.physicalPower,
      magicPower: C.baghaar.magicPower,
      abilities: [dechargeOcculte, totemDeSoin, chaineDEclairs, soinInterdit],
      cooldowns: {},
      status: [],
      alive: true,
      icon: '🌀',
      color: '#27ae60',
    },
    {
      id: 'zlatax',
      name: 'Zlatax',
      className: 'Chasseur de démon',
      description:
        "Combattant agile maniant une énergie démoniaque instable. Armes doubles, pactes dangereux.",
      maxHp: C.zlatax.maxHp,
      hp: C.zlatax.maxHp,
      maxMp: C.zlatax.maxMp,
      mp: C.zlatax.maxMp,
      mpRegen: C.zlatax.mpRegen,
      defense: C.zlatax.defense,
      physicalPower: C.zlatax.physicalPower,
      magicPower: C.zlatax.magicPower,
      abilities: [entailleInfernale, pacteInstable, rueeDemoniaque, marqueDuTraque],
      cooldowns: {},
      status: [],
      alive: true,
      icon: '🗡️',
      color: '#8e44ad',
    },
  ];
}
