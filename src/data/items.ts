// Objets consommables — data-driven. Utilisables en combat (coûte le tour)
// et depuis le menu pause en exploration (pour les soins).

import { BALANCE2 } from '../game/balance';

export type ItemEffectKind = 'heal' | 'mp' | 'cleanse' | 'revive';

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  effect: ItemEffectKind;
  value: number;          // PV, MP ou % selon l'effet
  targetDead?: boolean;   // cible un allié KO (résurrection)
  usableInExploration: boolean;
}

const I = BALANCE2.items;

export const ITEMS: Record<string, ItemDef> = {
  dossierDeSoin: {
    id: 'dossierDeSoin',
    name: 'Dossier de soin tamponné',
    description: `Un dossier médical enfin validé. Rend ${I.dossierDeSoin.heal} PV à un allié.`,
    icon: '📋',
    effect: 'heal',
    value: I.dossierDeSoin.heal,
    usableInExploration: true,
  },
  cafeDuGreffier: {
    id: 'cafeDuGreffier',
    name: 'Café du greffier',
    description: `Serré, amer, réglementaire. Rend ${I.cafeDuGreffier.mp} MP à un allié.`,
    icon: '☕',
    effect: 'mp',
    value: I.cafeDuGreffier.mp,
    usableInExploration: true,
  },
  formulaireA38: {
    id: 'formulaireA38',
    name: 'Formulaire A-38 certifié',
    description: 'Le document introuvable. Purge toutes les altérations négatives d\'un allié.',
    icon: '📄',
    effect: 'cleanse',
    value: 0,
    usableInExploration: false,
  },
  encreBenite: {
    id: 'encreBenite',
    name: 'Encre bénite',
    description: `Ranime un allié KO avec ${Math.round(I.encreBenite.revivePct * 100)}% de ses PV.`,
    icon: '🖋️',
    effect: 'revive',
    value: I.encreBenite.revivePct,
    targetDead: true,
    usableInExploration: true,
  },
};

export function getItem(id: string): ItemDef {
  const it = ITEMS[id];
  if (!it) throw new Error(`Objet inconnu : ${id}`);
  return it;
}

// Types d'altérations considérées « négatives » (pour formulaireA38)
export const NEGATIVE_STATUS_TYPES = ['dot', 'damageDown', 'defenseDown', 'skipTurn', 'marked'] as const;
