# 🌲 Forêt de Lamber — tile sheets

La forêt est **générée à la volée** à partir de tes 3 tile sheets. Tant
qu'ils ne sont pas uploadés, des placeholders procéduraux (rectangles
colorés pour le sol, formes simples pour les arbres et les camps) sont
utilisés — le jeu est jouable immédiatement.

## 📂 Fichiers attendus

Dépose dans `public/assets/exploration/lamber/tilesets/` :

| Fichier      | Description                                                   | Taille de tile par défaut |
|--------------|---------------------------------------------------------------|---------------------------|
| `ground.png` | Tiles de sol (herbe, terre, chemins, etc.)                    | **32×32 px**              |
| `trees.png`  | Tiles d'arbres / arbustes / rochers (objets décoratifs)       | **64×96 px** (plus haut que large) |
| `camps.png`  | Tiles de camps (bandits, gobelins, cultistes — 1 tile = 1 camp) | **96×96 px**            |

⚠️ **Convention importante** : chaque PNG est une grille de tiles régulière
de la taille indiquée. Le code lit **toutes les tiles** disponibles et en
sélectionne aléatoirement.

## 🎨 Si tes tailles diffèrent

Modifie les constantes dans `src/game/phaser/ExplorationScene.ts` :
- `ensureSpritesheet('ex-lamber-ground', 32, 32)` ← change les deux
  derniers nombres pour ton ground
- `ensureSpritesheet('ex-lamber-trees', 64, 96)` ← idem pour les arbres
- `ensureSpritesheet('ex-lamber-camps', 96, 96)` ← idem pour les camps

## 🎮 Comportement gameplay

- À chaque entrée dans la forêt, la map est régénérée (sol, arbres, camps
  placés aléatoirement)
- Le perso Datpaloof spawn en haut de la map (par où on arrive depuis Ramees)
- **3 camps** placés aléatoirement (configurable dans `data/maps.ts` →
  `LAMBER_MAP.procedural.campCount`)
- Chaque camp est un **interactable de combat** : s'approcher + appuyer
  sur ESPACE lance un combat
- En haut de la map, une summon stone permet de **retourner à Ramees**
- Le **menu ÉCHAP** propose aussi des accès directs à toutes les zones

## ⚙️ Paramètres ajustables

Dans `src/data/maps.ts` → `LAMBER_MAP.procedural` :
- `worldW`, `worldH` : taille de la map (px)
- `tileSize` : taille d'une tile de sol (doit matcher ton ground)
- `treeDensity` : 0..1, probabilité d'arbre par cellule (0.18 = ~18%)
- `campCount` : nombre de camps à placer
- `seed` : si fourni, génération reproductible ; sinon random à chaque entrée
