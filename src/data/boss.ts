import type { Boss } from '../game/types';
import { BALANCE } from '../game/balance';
import {
  tamponReglementaire,
  appelDOffresMaudit,
  decretIncomprehensible,
  reunionInterminable,
  subventionRefusee,
  archivageDefinitif,
} from './abilities';

export function createInitialBoss(): Boss {
  return {
    id: 'champion',
    name: 'Le Champion des Collectivités Territoriales',
    title: 'Archiviste suprême, élu des dimensions oubliées',
    description:
      "Mi-élu local, mi-archiviste démoniaque. Costume sombre, écharpe tricolore corrompue, livres flottants. Trône derrière un bureau immense de dossiers maudits.",
    maxHp: BALANCE.boss.maxHp,
    hp: BALANCE.boss.maxHp,
    defense: BALANCE.boss.defense,
    power: BALANCE.boss.power,
    abilities: [
      tamponReglementaire,
      appelDOffresMaudit,
      decretIncomprehensible,
      reunionInterminable,
      subventionRefusee,
      archivageDefinitif,
    ],
    cooldowns: {},
    status: [],
    alive: true,
    icon: '👁️‍🗨️',
    enraged: false,
  };
}
