# Plan de refonte — RPG tour par tour 2.5D pixel art

## Direction visuelle

Le moteur reste **Phaser 4** (aucune raison technique de le remplacer : les assets
sont du pixel art 2D isométrique, le rendu « 3D pixel art » recherché est en réalité
du **2.5D** : profondeur simulée, ancrage au sol, ombres, lumière volumétrique,
particules, caméra dynamique). Concrètement :

- `pixelArt: true`, upscale nearest-neighbor (pixels nets) ;
- tri de profondeur par Y + ombres elliptiques sous chaque entité ;
- perspective simulée : léger scale du joueur selon Y (plus proche = plus grand) ;
- rais de lumière additifs + poussière en suspension + vignette + halos des lampes ;
- caméra : follow avec lerp en exploration, zoom/shake/flash/hit-stop en combat ;
- transition exploration→combat : zoom + flash + pixelisation (WebGL) + fondu.

## Systèmes

| Système | Décision |
|---|---|
| Moteur combat V1 (`combatEngine.ts`) | **Remplacé** par `src/game/combat/` (V2) — V1 conservé dans le repo jusqu'à la fin du slice, puis retiré des imports (le fichier reste dans git). |
| Types V1 | Étendus (rétro-compatibles pour les maps) |
| Data abilities/balance | **Conservés & étendus** : éléments, vitesse, VFX/SFX/timing par compétence |
| Exploration Scene | **Refondue** : animation de marche par frames, ennemis visibles, save point, objets interactifs, lumières, poussière, zone Archives multi-écrans |
| HUD combat React | **Refondu** : ordre des tours, multi-ennemis, ciblage, objets, descriptions |
| Sauvegarde | **Créé** : localStorage (`save.ts`), snapshot party + progression + map |
| Dialogues | **Créé** : `DialogueBox` React + data `dialogues.ts` |
| Objets/inventaire | **Créé** : `items.ts` + intégration combat & menu pause |
| XP/niveaux | **Créé** : `progression.ts` (XP, level-up, stats) |
| SFX | **Créé** : synthèse WebAudio (`sfx.ts`) temporaire, clairement documentée |

## Nouvelle architecture

```
src/game/
  types.ts                 types V2 (Combatant, Element, Skill, TurnQueue, Save…)
  balance.ts               équilibrage étendu (vitesse, éléments, XP, ennemis)
  statusEffects.ts         inchangé + extensions
  combat/
    engine.ts              moteur V2 : état + actions → nouvel état + CombatEvent[]
    events.ts              types d'événements (pour synchroniser visuel & dégâts)
    ai.ts                  IA ennemis + boss (phases, télégraphes, invocations)
    formulas.ts            dégâts, éléments, crits, initiative
  core/
    save.ts                sauvegarde/chargement localStorage
    sfx.ts                 synthèse audio temporaire + wrapper assets réels
  phaser/
    ExplorationScene.ts    refonte 2.5D
    BattleScene.ts         refonte : séquenceur d'événements, multi-ennemis
src/data/
  skills.ts                compétences V2 (élément, vfx, sfx, timing) — reprend abilities
  enemies.ts               ennemis normaux + boss (data-driven)
  items.ts                 objets consommables
  party.ts                 héros V2 (vitesse, éléments, croissance)
  dialogues.ts             dialogues (boss intro/outro, lore des Archives)
  maps.ts                  étendu : zone archives-* (multi-écrans), ennemis placés
```

## Production (ordre)

1. **Assets dérivés** (scripts Python, committés avec leurs sorties) :
   frames de marche Datpaloof (jambes animées), sprites ennemis extraits de
   `boss.png` (grimoire, décret), crops des salles des Archives depuis `map.jpg`.
2. **Moteur combat V2** + data (skills/enemies/items/party) + save + typecheck.
3. **BattleScene V2** + HUD combat V2 (séquenceur, ordre des tours, objets, cibles).
4. **ExplorationScene V2** + zone Archives (5 écrans, ennemis, save point, secrets).
5. **Boss** : dialogues, mécaniques (Pages protectrices, Archivage définitif
   télégraphié, invocations), mise en scène.
6. **Menus** : titre (Continuer), pause (équipe/inventaire/options/sauvegarde).
7. **Validation** : `typecheck`, `build`, test navigateur (Playwright), commit/push.

## Critères de validation du slice

Voir la commande d'origine : jeu lançable, exploration animée + ancrée, combats
tour par tour complets (initiative, éléments, objets, statuts, XP), boss avec intro
et mécaniques, victoire/défaite, sauvegarde, identité visuelle préservée.

## Anciens systèmes remplacés (documentation de migration)

- `src/game/combatEngine.ts` (V1) → `src/game/combat/engine.ts` (V2).
  Différences : multi-ennemis, file d'initiative par vitesse, éléments
  (faiblesses/résistances), objets, XP, événements séquencés pour le rendu.
- `src/components/BattleScreen.tsx` V1 + cartes → remplacés par les composants V2
  (`Battle*V2`). Les fichiers V1 restent en place tant que la migration des autres
  zones (Lamber, Ramees) n'est pas terminée.
