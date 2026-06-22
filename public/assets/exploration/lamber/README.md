# 🌲 Forêt de Lamber — grille d'écrans coordonnés

Chaque écran de la forêt a des **coordonnées (x, y)** sur une grille. Les
voisins sont **automatiquement connectés** par des sorties N/S/E/W : si
l'écran (1,1) existe et (2,1) existe, alors marcher vers l'est sur (1,1)
téléporte sur (2,1), et vice-versa.

## 📂 Convention de nommage des images

Dépose tes images dans `public/assets/exploration/lamber/` avec le format
**`X-Y.jpg`** (ou `.png`) où X est la colonne et Y la ligne :

```
exploration/lamber/
├── 1-1.jpg       ← écran d'entrée (où arrive le téléport depuis Ramees)
├── 2-1.jpg       ← écran à l'EST de (1,1)
├── 0-1.jpg       ← écran à l'OUEST de (1,1)
├── 1-2.jpg       ← écran au SUD de (1,1)
├── 1-0.jpg       ← écran au NORD de (1,1)
├── 2-2.jpg       ← écran au SUD-EST de (1,1)
└── ...
```

**Y croît vers le bas** (comme les pixels d'écran) :
- `(1, 1)` → entrée
- `(1, 0)` → au nord (Y plus petit)
- `(1, 2)` → au sud (Y plus grand)
- `(0, 1)` → à l'ouest
- `(2, 1)` → à l'est

## 📝 Comment ajouter un nouvel écran

1. **Uploade ton image** dans ce dossier avec le bon nom (ex: `2-1.jpg`)
2. **Dis-moi les coords** (ex: "j'ai mis 2-1") OU édite toi-même `src/data/maps.ts` :
   ```ts
   const LAMBER_SCREENS: LamberScreen[] = [
     { x: 1, y: 1, name: 'Entrée', interactables: [...] },
     { x: 2, y: 1, name: 'Clairière Est' }, // ← nouveau
   ];
   ```
3. C'est tout. Les exits N/S/E/W avec les voisins existants sont
   **calculés automatiquement**. Les images sont préchargées automatiquement.

## 🎮 Comportement

- Le joueur touche le **bord est** d'un écran avec voisin (x+1, y) → fade out
- Il apparaît au **bord ouest** de l'écran (x+1, y)
- Pareil pour N/S/W
- Si pas de voisin sur ce bord, le joueur est bloqué par les bornes du monde

## 🪨 Téléports longue distance

Les summon stones continuent de marcher pour les voyages entre zones :
- Ramees → Lamber (`lamber-1-1`)
- Lamber `(1,1)` → Ramees (sur l'écran d'entrée)

Tu peux ajouter d'autres interactables sur n'importe quel écran via le
champ `interactables` du `LamberScreen` correspondant.

## ⚙️ Personnaliser un écran

Optionnels par écran dans `LAMBER_SCREENS` :
- `name`: nom affiché dans la top-bar
- `interactables`: array d'interactables (téléports, NPCs, etc.)
- `walkable`: zones marchables (rectangles 0..1) si tu veux limiter le
  joueur à des chemins. Sans `walkable`, il peut marcher partout dans la
  map.

## ⚠️ Note

Le dossier `tilesets/` (ancienne génération procédurale) est LEGACY et
plus utilisé. Tu peux le supprimer si tu veux gagner ~6 MB.
