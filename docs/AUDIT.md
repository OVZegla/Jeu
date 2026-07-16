# Audit du projet — « Le Bureau des Archives Infinies »

*Établi avant la refonte RPG 2.5D pixel art (branche `claude/rpg-3d-pixel-art-refactor-11fzlz`).*

## 1. Technologie

| Élément | Valeur |
|---|---|
| Langage | TypeScript 5.5 (strict) |
| UI | React 18 (HUD, menus, écrans) |
| Moteur de rendu | **Phaser 4.1** (scènes exploration + combat) |
| Build | Vite 5 |
| Déploiement | GitHub Pages (`.github/workflows/deploy.yml`) |
| Audio | Loader Phaser (assets optionnels, tolérés manquants) |

Architecture hybride : la **logique de combat est pure TS** (`src/game/combatEngine.ts`, sans React ni Phaser),
React affiche le HUD et pilote l'état, Phaser rend les scènes (arène, exploration).
C'est une base saine à conserver.

## 2. Arborescence

```
src/
  main.tsx / App.tsx          état global + dispatch (useState, phases)
  game/
    types.ts                  types stricts (Character, Boss, Ability, GameState, maps…)
    balance.ts                équilibrage centralisé
    statusEffects.ts          helpers effets de statut
    combatEngine.ts           moteur de combat tour par tour (V1, boss unique)
    phaser/ExplorationScene.ts  exploration (maps images, collisions rect, exits)
    phaser/BattleScene.ts       arène (sprites, tweens, particules, sons)
  data/
    abilities.ts              12 compétences joueurs + 6 boss (data-driven)
    characters.ts             3 héros
    boss.ts                   le boss
    maps.ts                   configs des maps (bureau, ramees, grille lamber)
  components/                 11 composants React (Battle*, Exploration*, Start, End…)
public/assets/
  title.jpg                   écran titre (1600×900, pixel art)
  arena.jpg                   fond de combat (1024×576, vue frontale des Archives)
  sprites/                    4 sprites combat haute qualité (330-380px, RGBA)
  exploration/bureau/map.jpg  LES ARCHIVES (1600×900, isométrique pixel art) + boss.png
  exploration/datpaloof/      4 sprites directionnels chibi (front/back/left/right)
  exploration/ramees/map.jpg  la cité
  exploration/lamber/         8 écrans jpg + tilesets (trees/ground/camps + json)
  music/battle.mp3            musique de combat
  sfx/                        vide (README seulement)
scripts/                      5 scripts Python de traitement de sprites
```

## 3. Scènes / maps détectées

| Map | Fichier | État |
|---|---|---|
| **Bureau des Archives Infinies** | `bureau/map.jpg` | ★ Superbe hall isométrique : rayonnages, bannières, lampes violettes, dais du boss, escaliers d'entrée au sud. **Base parfaite pour la zone prioritaire.** |
| Ramees (cité) | `ramees/map.jpg` | fonctionnelle, walkables définis |
| Forêt de Lamber | 8 écrans `x-y.jpg` | grille type Dofus, camps ennemis **placeholder** (pas de vrai combat dédié : tous lancent le boss) |
| Arène de combat | `arena.jpg` | vue frontale des Archives — cohérente avec bureau/map.jpg |

## 4. Personnages détectés

| Personnage | Rôle | Design (sprite combat) | Sprites exploration |
|---|---|---|---|
| **Datpaloof** | Paladin elfe de sang (tank/soin) | Armure rouge & or, longue chevelure blonde, épée runique flamboyante | 4 directions chibi ✔ |
| **Baghaar** | Chaman occultiste Mag'har (magie/soin) | Orc brun, tresses, fourrures, masse-totem turquoise | ✘ aucun |
| **Zlatax** | Chasseur de démons (DPS) | Orc vert-de-gris, doubles lames démoniaques vertes, dreadlocks | ✘ aucun |
| **Le Champion des Collectivités Territoriales** (boss) | Archiviste démoniaque | Costume trois-pièces, redingote, **écharpe tricolore**, tampon-sceau, **livres et arrêtés flottants entourés de flammes violettes** | boss.png (variante bureau) ✔ |

Palette identitaire : rouge/or (Datpaloof), brun/turquoise (Baghaar), vert toxique (Zlatax),
violet arcanique + tricolore (boss). Univers : *dark fantasy bureaucratique* française
(délibérations, marchés publics, budget communal, tampon réglementaire…).

## 5. Systèmes existants

| Système | État | Verdict |
|---|---|---|
| Combat tour par tour V1 | ✔ fonctionnel : 3 héros vs 1 boss, MP + cooldowns, statuts (shield/dot/hot/buff/debuff/skip/marked), crits, variance, phase enragée <40 % | **À généraliser** (multi-ennemis, initiative, ordre des tours, éléments, objets, XP) |
| IA boss | pondération simple + ciblage du plus faible | à enrichir (phases, télégraphes, mécanique d'invocation) |
| Exploration | ✔ maps images, collisions rects normalisés, exits bord-à-bord, tp-stones, prompt d'interaction, caméra follow, debug `B` | à enrichir (profondeur, lumières, ennemis visibles, save point, objets) |
| Animations perso | ✘ sprites statiques + « bounce » vertical (le perso glisse) | **problème n°1 signalé** — besoin de vraies frames de marche |
| Animations combat | tweens basiques : lunge, shake, tint, particules, chiffres flottants | bonne base, à synchroniser via séquenceur d'événements |
| Dialogues | ✘ inexistants (uniquement log de combat) | à créer |
| Sauvegarde | ✘ seul le mute est persisté | à créer |
| Inventaire / objets | ✘ slot « objet » du menu FF non câblé | à créer |
| Ordre des tours | fixe (3 héros dans l'ordre, puis boss) | à remplacer (vitesse/initiative) |
| Faiblesses / résistances | ✘ | à créer |
| XP / récompenses | ✘ | à créer |
| SFX | loader prêt, **aucun fichier** | synthèse WebAudio temporaire + doc des assets manquants |

## 6. Éléments réutilisables (à conserver absolument)

- Les 4 sprites combat + 4 sprites exploration + boss bureau : qualité excellente.
- `bureau/map.jpg` : découpable en plusieurs « salles » des Archives (entrée sud,
  ailes de rayonnages est/ouest, grand hall, dais du boss) — style 100 % cohérent.
- `boss.png` : les **livres et documents flottants** sont détourables → sprites
  d'ennemis normaux (« Grimoire éveillé », « Décret errant ») fidèles à l'univers.
- Tout le contenu data-driven (`abilities`, `balance`, `statusEffects`) : la
  structure est bonne, on l'étend au lieu de la réécrire.
- Le pattern React⇄Phaser (scène qui émet des events, React qui pilote).
- Maps Ramees + Lamber : conservées telles quelles, reliées au nouveau moteur.
- `music/battle.mp3`, `title.jpg`, `arena.jpg`.

## 7. Éléments incomplets / problèmes techniques

1. **Personnages glissants** : aucune frame de marche, simple bounce → à corriger
   (génération de frames de marche + système d'animation).
2. Combat mono-cible câblé en dur (`state.boss`, `HERO_IDS` en constantes) →
   impossible d'ajouter des ennemis normaux sans refonte.
3. Camps de Lamber : `engages: true` lance… le boss des Archives (placeholder).
4. Dégâts affichés instantanément (le state React change avant l'impact visuel).
5. Aucune persistance : mort = tout recommencer.
6. `pixelArt: false` + `antialias: true` dans les configs Phaser → rendu flou
   des sprites pixel art (contraire à la direction artistique).
7. Boss : « phase enragée » = simple multiplicateur, pas de mécanique à contrer.
8. Pas d'ennemis visibles en exploration ; combats déclenchés par prompt uniquement.
9. `BattleScene.syncFromState` est un no-op ; couplage HUD/scène fragile.
10. Slot « objet » du menu affiché mais non fonctionnel.

## 8. Risques de régression

- La refonte du moteur de combat touche tous les composants React de combat →
  les anciens composants sont **conservés** tant que les nouveaux ne sont pas branchés.
- Les maps Ramees/Lamber dépendent des types `ExplorationMapConfig` → toute
  extension de type doit rester rétro-compatible (champs optionnels).
- Le déploiement GitHub Pages utilise `BASE_URL` : ne jamais coder de chemin absolu.
- `tsc` strict : chaque étape doit re-passer `npm run typecheck` et `npm run build`.
