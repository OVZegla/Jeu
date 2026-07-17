# Le Bureau des Archives Infinies

RPG tour par tour **2.5D pixel art** en **React + TypeScript + Vite + Phaser 4**,
dans une ambiance dark fantasy bureaucratique. Trois héros explorent **les
Archives Infinies** et affrontent **le Champion des Collectivités Territoriales**
au cœur d'une bibliothèque administrative maudite.

> 100 % code original. Aucune ressource issue de licences existantes.

## Refonte V2 (vertical slice des Archives)

- **Exploration 2.5D** : marche animée par frames, ombres ancrées au sol,
  perspective, rais de lumière volumétriques, poussière, ennemis visibles en
  patrouille (aggro), documents de lore, coffres, secrets, porte scellée,
  point de sauvegarde.
- **Combat tour par tour V2** : initiative par vitesse, multi-ennemis,
  faiblesses/résistances élémentaires, objets, statuts, critiques, XP/niveaux.
  Les dégâts s'affichent au moment de l'impact visuel (séquenceur d'événements).
- **Boss mis en scène** : dialogue d'intro, 3 phases, invocation de Pages
  protectrices (bouclier), attaque ultime télégraphiée à contrer avec Garde,
  dialogue de fin et écran de conclusion.
- **Sauvegarde** localStorage (auto après victoire + save points + menu).
- Docs : `docs/AUDIT.md`, `docs/PLAN_REFONTE.md`, `docs/ASSETS.md`.
- Test moteur : `npx tsx scripts/test-combat-engine.ts`.

L'ancien moteur V1 (`src/game/combatEngine.ts` et les composants `Battle*` V1)
reste dans le repo à titre de référence tant que Ramees / Lamber ne sont pas
migrées — voir « Étape 5 » du plan.

## Installation et lancement

```bash
npm install
npm run dev
```

L'application est servie sur [http://localhost:5173](http://localhost:5173).

Autres commandes :

```bash
npm run build       # build de production
npm run preview     # prévisualiser le build
npm run typecheck   # vérification TypeScript stricte
```

## Architecture

```
src/
  main.tsx                  point d'entrée React
  App.tsx                   conteneur d'état du jeu, dispatch des actions
  styles/global.css         reset + polices + couleurs globales
  data/
    abilities.ts            toutes les compétences (joueurs + boss)
    characters.ts           création des 3 personnages initiaux
    boss.ts                 création du boss
  game/
    types.ts                types TypeScript stricts (Character, Boss, Ability...)
    balance.ts              CONFIG centrale d'équilibrage
    statusEffects.ts        helpers pour les effets de statut
    combatEngine.ts         logique pure du combat (pas de React)
  components/
    BattleScreen.tsx        écran principal du combat
    BossCard.tsx            carte boss + décor animé
    CharacterCard.tsx       carte personnage (PV, statuts, flashs)
    AbilityPanel.tsx        liste des compétences disponibles
    CombatLog.tsx           journal de combat
    StatusBadge.tsx         petite pastille pour un effet
    StartScreen.tsx         écran d'intro
    EndScreen.tsx           écran victoire / défaite
```

La **logique de combat** vit entièrement dans `src/game/` et n'utilise pas
React. Les composants se contentent d'afficher l'état et de propager les
actions vers `combatEngine`. C'est ce qui rend le moteur facile à tester et
à étendre.

## Comment ça marche

1. Le joueur clique sur "Pénétrer dans les archives" sur `StartScreen`.
2. À chaque tour, chaque personnage vivant choisit une compétence.
   - Si la compétence cible "un allié" ou "le boss", on entre en mode
     sélection de cible (banner vert).
   - Sinon, l'action s'exécute immédiatement.
3. Après que tous les héros ont joué, le boss agit (IA pondérée respectant
   les cooldowns). En fin de tour : DOT / HOT, cooldowns -1, durations -1.
4. Sous **40 % de PV**, le boss passe en *phase enragée* et débloque
   `Archivage définitif`.
5. **Victoire** : boss à 0 PV. **Défaite** : les 3 personnages KO. L'écran
   final propose un bouton "Recommencer".

## Modifier le contenu

### Équilibrage rapide

Tout passe par `src/game/balance.ts` : PV, défense, puissance, valeurs des
compétences, durées d'effets, cooldowns, multiplicateur de crit, seuil de
phase enragée, etc.

### Personnages

- Stats : `src/game/balance.ts` → `BALANCE.characters`
- Données (nom, icône, classe, compétences) : `src/data/characters.ts`

### Compétences

`src/data/abilities.ts` — chaque compétence est un objet `Ability` typé.
Les valeurs numériques (dégâts, durées, etc.) sont lues depuis `balance.ts`,
donc on touche **un seul fichier** pour rééquilibrer.

### Boss

- Stats : `BALANCE.boss` et `BALANCE.bossAbilities`
- Données : `src/data/boss.ts`
- Comportement (pondération de l'IA) : `selectBossAction` dans
  `src/game/combatEngine.ts`

## Étendre le jeu

### Ajouter un nouveau personnage

1. Ajouter ses stats dans `BALANCE.characters` (`balance.ts`).
2. Créer ses compétences dans `abilities.ts` (ou réutiliser des existantes).
3. L'ajouter à la liste renvoyée par `createInitialCharacters()` dans
   `data/characters.ts`.
4. (UI) La grille de l'équipe (`BattleScreen.css → .battle-team`) se base
   sur 3 colonnes ; ajuster `grid-template-columns` si on dépasse 3 persos.

### Ajouter une nouvelle compétence

1. Ajouter ses valeurs dans `BALANCE.abilities`.
2. Créer son objet `Ability` dans `abilities.ts` (penser à `category`,
   `target`, `applies` / `appliesToCaster`).
3. L'ajouter au tableau `abilities` du personnage concerné.

Le moteur s'occupe automatiquement des dégâts, soins, cooldowns, effets,
crit et variance — pas besoin de toucher au composant React.

### Ajouter un nouveau boss

1. Dupliquer `data/boss.ts` en `data/bossXxx.ts`.
2. Créer ses compétences dans `abilities.ts`.
3. Ajouter ses paramètres dans `balance.ts` (PV, defense, etc.).
4. Importer le nouveau `createInitialBossXxx()` dans `combatEngine.ts`
   (`createInitialState`) ou paramétrer la fabrique pour choisir lequel
   instancier.
5. Ajuster la pondération de `selectBossAction` ou la généraliser pour
   piocher les poids dans les `Ability`.

## Types principaux

- `Character`, `Boss` — entités combattantes
- `Ability` — compétence (cooldown, target, applies, etc.)
- `StatusEffect` / `StatusEffectType` — effets actifs (shield, hot, dot,
  damageUp, damageDown, defenseDown, skipTurn, marked, enraged)
- `CombatAction` — `(casterId, abilityId, targetId)`
- `CombatLogEntry` — entrée typée du journal (`damage`, `heal`, `status`,
  `info`, `death`, `phase`, `boss`)
- `GameState` — état complet du combat
- `TargetType` — `self | ally | allAllies | enemy | allEnemies`

## Fonctions clés du moteur

`combatEngine.ts` expose :

- `createInitialState`, `startCombat`, `resetCombat`
- `applyDamage`, `applyHeal`, `applyStatusEffect`
- `executeAbility`
- `selectBossAction`, `pickBossTarget`, `executeBossTurn`
- `advanceToFirstActiveCharacter`, `advanceAfterPlayerAction`
- `endOfRoundTick` (DOT / HOT, cooldowns, durations)
- `checkVictory`, `checkDefeat`, `checkEndConditions`

## Pistes pour une V2

- Animations de projectiles entre attaquant et cible.
- Texte flottant `-42` / `+30` au-dessus des cartes.
- Sons (impact, crit, soin, phase enragée).
- Plusieurs vagues / multi-boss / mini-rencontres.
- Système de mana / ressources par classe (plutôt que simples cooldowns).
- Système d'inventaire / objets consommables.
- Sauvegarde locale du run en cours.
- Tests unitaires du moteur (Vitest), notamment pour les status effects
  et la résolution des cibles.
- Accessibilité : navigation clavier complète, ARIA pour les statuts.
