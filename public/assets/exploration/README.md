# 🗺️ Scène d'exploration — multi-maps

Datpaloof se déplace librement sur des maps. Sur chaque map il y a des
**interactables** : un boss (déclenche le combat) ou une **summon stone**
(téléporte vers une autre map).

## 📂 Structure des dossiers

```
exploration/
├── datpaloof/              ← sprites du perso (partagés entre toutes les maps)
│   ├── front.png
│   ├── back.png
│   ├── left.png
│   └── right.png
├── summon_stone.png        ← sprite de la pierre de téléport (partagé)
├── bureau/                 ← map "Bureau des Archives Infinies"
│   ├── map.jpg (ou map.png)
│   └── boss.png
└── ramees/                 ← map "Ramees"
    └── map.jpg (ou map.png)
```

## 🎨 Conventions

- **Sprites perso/boss/stone** : fond blanc → retiré automatiquement par le script `scripts/process-exploration.py`
- **Maps** : si tu uploads en `.png` (taille libre, fond peut être blanc), le
  script convertit en `.jpg` optimisé (1600px max sur le grand côté)
- **Si la summon stone n'est pas uploadée** → un placeholder procédural
  (cercle runique + cristal violet flottant) est généré automatiquement.
- **Si la map de Ramees n'est pas uploadée** → un rectangle violet avec
  un message s'affiche à la place. La téléportation marche quand même.

## 🎮 Comportement

- **Bureau** : Datpaloof spawn en bas à gauche
  - Au centre : le Champion → engage le combat
  - À droite : summon stone → téléporte à Ramees
- **Ramees** : Datpaloof spawn en bas au centre
  - Au centre : summon stone → retourne au Bureau

## 🔄 Quand tu uploads

Une fois tes fichiers en place :
```bash
python3 scripts/process-exploration.py
```
(facultatif si tu uploads déjà au bon format, mais retire le fond blanc
et redimensionne).

## 🛠️ Étendre

Pour ajouter une nouvelle map (ex: `temple/`) :
1. Crée le dossier `exploration/temple/` avec `map.jpg`
2. Ajoute son entrée dans `src/data/maps.ts` :
   ```ts
   export const TEMPLE_MAP: ExplorationMapConfig = {
     id: 'temple',
     name: 'Temple Oublié',
     imageKey: 'ex-map-temple',
     imagePath: 'assets/exploration/temple/map.jpg',
     spawn: { x: 0.5, y: 0.85 },
     interactables: [...]
   };
   ```
3. Ajoute `'temple'` dans le type `MapId` de `src/game/types.ts`
4. Ajoute des téléports croisés depuis les autres maps vers `temple`
