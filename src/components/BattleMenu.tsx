import { useMemo, useState } from 'react';
import type { Ability, Character, MenuSlot } from '../game/types';
import './BattleMenu.css';

interface Props {
  character: Character | null;
  disabled: boolean;
  onAbilityClick: (a: Ability) => void;
  position: 'left' | 'right';
}

const SLOT_LABELS: Record<MenuSlot, { label: string; icon: string }> = {
  attaque: { label: 'Attaque', icon: '⚔' },
  defense: { label: 'Défense', icon: '◈' },
  special: { label: 'Spécial', icon: '✦' },
  objet:   { label: 'Objets',  icon: '◊' },
};

export function BattleMenu({ character, disabled, onAbilityClick, position }: Props) {
  const [subMenu, setSubMenu] = useState<'special' | null>(null);

  const slotAbility = useMemo(() => {
    if (!character) return null;
    const map: Partial<Record<MenuSlot, Ability>> = {};
    for (const a of character.abilities) {
      if (a.menuSlot === 'attaque' && !map.attaque) map.attaque = a;
      if (a.menuSlot === 'defense' && !map.defense) map.defense = a;
    }
    return map;
  }, [character]);

  const specialAbilities = useMemo(() => {
    if (!character) return [];
    return character.abilities.filter((a) => a.menuSlot === 'special');
  }, [character]);

  if (!character) {
    return (
      <div className={`battle-menu battle-menu-${position} battle-menu-empty`}>
        <div className="menu-title">⌛ Attente…</div>
      </div>
    );
  }

  const handleSlotClick = (slot: MenuSlot) => {
    if (disabled) return;
    if (slot === 'special') {
      setSubMenu('special');
      return;
    }
    if (slot === 'objet') return;
    const ab = slotAbility?.[slot];
    if (ab) tryFire(ab);
  };

  const tryFire = (a: Ability) => {
    const cd = character.cooldowns[a.id] || 0;
    if (cd > 0) return;
    if (a.mpCost > 0 && character.mp < a.mpCost) return;
    setSubMenu(null);
    onAbilityClick(a);
  };

  const slotDisabled = (slot: MenuSlot): boolean => {
    if (disabled) return true;
    if (slot === 'objet') return true;
    if (slot === 'special') return specialAbilities.length === 0;
    const a = slotAbility?.[slot];
    if (!a) return true;
    if ((character.cooldowns[a.id] || 0) > 0) return true;
    if (a.mpCost > 0 && character.mp < a.mpCost) return true;
    return false;
  };

  return (
    <div className={`battle-menu battle-menu-${position}`}>
      <div className="menu-title">▶ {character.name.toUpperCase()}</div>

      {!subMenu && (
        <ul className="menu-slots">
          {(['attaque', 'defense', 'special', 'objet'] as MenuSlot[]).map((slot) => {
            const info = SLOT_LABELS[slot];
            const ab = slot === 'special' || slot === 'objet' ? null : slotAbility?.[slot];
            return (
              <li key={slot}>
                <button
                  className="menu-item"
                  onClick={() => handleSlotClick(slot)}
                  disabled={slotDisabled(slot)}
                  title={ab?.description}
                >
                  <span className="menu-icon">{info.icon}</span>
                  <span className="menu-label">{info.label}</span>
                  {ab && ab.mpCost > 0 && (
                    <span className="menu-cost">{ab.mpCost} MP</span>
                  )}
                  {slot === 'special' && (
                    <span className="menu-arrow">▶</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {subMenu === 'special' && (
        <>
          <div className="menu-subtitle">SPÉCIAL</div>
          <ul className="menu-slots">
            {specialAbilities.map((a) => {
              const cd = character.cooldowns[a.id] || 0;
              const noMp = a.mpCost > 0 && character.mp < a.mpCost;
              const d = cd > 0 || noMp || disabled;
              return (
                <li key={a.id}>
                  <button
                    className="menu-item menu-item-sub"
                    onClick={() => tryFire(a)}
                    disabled={d}
                    title={a.description}
                  >
                    <span className="menu-icon">{a.icon}</span>
                    <span className="menu-label">{a.name}</span>
                    {a.mpCost > 0 && (
                      <span className={`menu-cost ${noMp ? 'menu-cost-low' : ''}`}>{a.mpCost} MP</span>
                    )}
                    {cd > 0 && <span className="menu-cd">CD {cd}</span>}
                  </button>
                </li>
              );
            })}
            <li>
              <button
                className="menu-item menu-back"
                onClick={() => setSubMenu(null)}
              >
                <span className="menu-icon">↩</span>
                <span className="menu-label">Retour</span>
              </button>
            </li>
          </ul>
        </>
      )}
    </div>
  );
}
