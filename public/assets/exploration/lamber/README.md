# 🌲 Forêt de Lamber — système d'écrans à la Dofus

Plus de génération procédurale : chaque écran de la forêt est une map
statique. Tu uploads une image par écran, on les connecte avec des
sorties Nord/Sud/Est/Ouest, et le joueur transite automatiquement quand
il touche un bord.

## 📂 Structure

```
exploration/lamber/
├── map.jpg           ← écran principal (entrée de la forêt)
├── tilesets/         ← LEGACY (ancienne génération procédurale, non utilisé)
```

## 📝 Pour ajouter de nouveaux écrans

1. Uploade ton image dans `public/assets/exploration/lamber/` (ex: `north.jpg`)
2. Ajoute le MapId dans `src/game/types.ts` :
   ```ts
   export type MapId = 'bureau' | 'ramees' | 'lamber' | 'lamber-north';
   ```
3. Ajoute la map dans `src/data/maps.ts` :
   ```ts
   export const LAMBER_NORTH_MAP: ExplorationMapConfig = {
     id: 'lamber-north',
     name: 'Forêt de Lamber — Nord',
     imageKey: 'ex-map-lamber-north',
     imagePath: 'assets/exploration/lamber/north.jpg',
     spawn: { x: 0.50, y: 0.80 },
     interactables: [],
     exits: {
       south: { toMapId: 'lamber' },     // retour à l'entrée
       // north: { toMapId: 'lamber-north-2' },  // pour aller encore plus loin
     },
   };
   ```
4. Ajoute aussi la sortie depuis l'écran courant dans son entrée MAPS :
   ```ts
   LAMBER_MAP.exits = {
     north: { toMapId: 'lamber-north' },
   };
   ```
5. Charge le PNG dans `ExplorationScene.preload()` :
   ```ts
   this.load.image('ex-map-lamber-north', `${base}assets/exploration/lamber/north.jpg`);
   ```

## 🎮 Comportement

- Joueur touche le **bord nord** d'une map qui a `exits.north` défini →
  fade out + transition vers la map cible
- Sur la nouvelle map, le joueur **apparaît au côté opposé** (entré par
  le nord → apparaît en bas / sud de la nouvelle map)
- Si pas de sortie sur ce bord, le joueur est bloqué par le bord visible

## 🪨 Téléports (existants)

Les summon stones continuent de marcher en plus du système N/S/E/W,
pour les voyages longue distance entre zones :
- Stone de Lamber → retour à Ramees (en bas de la map)
- Stone de Ramees → vers le Bureau et vers Lamber

## ⚠️ Note

Le dossier `tilesets/` (ground.png, trees.png, camps.png + JSON) reste
dans le repo mais n'est plus utilisé. Tu peux le supprimer si tu veux
gagner de la place (~6 MB) ou le garder au cas où.
