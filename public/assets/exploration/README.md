# 🗺️ Scène d'exploration — pré-combat

Cette scène se joue avant le combat : Datpaloof se déplace librement sur
une map isométrique, doit s'approcher du boss et interagir pour déclencher
la bataille.

## 📂 Fichiers attendus

Dépose dans ce dossier :

| Fichier                       | Description                                                     |
|-------------------------------|-----------------------------------------------------------------|
| `map.png`                     | La map isométrique en background (PNG ou JPG)                   |
| `boss.png`                    | Sprite du boss debout sur la map (optionnel, sinon reuse celui du combat) |
| `datpaloof/front.png`         | Datpaloof vu de face (regarde vers le bas / le joueur)          |
| `datpaloof/back.png`          | Datpaloof vu de dos (regarde vers le haut)                      |
| `datpaloof/left.png`          | Datpaloof tourné vers la gauche                                 |
| `datpaloof/right.png`         | Datpaloof tourné vers la droite                                 |

## 🎨 Conseils techniques

- **Map** : 1280×720 ou 1920×1080 recommandé. Format JPG si pas de transparence (plus léger).
- **Sprites perso** : fond transparent (PNG), entre 100×140 et 200×280 px. Origin = pieds au centre.
- **Sprite boss** : même règles que les persos. Idéalement un peu plus grand (le boss est imposant).
- Pour avoir un perso net : `image-rendering: pixelated` est appliqué via Phaser.

## 🎮 Comportement prévu

- Au démarrage du jeu, après l'écran d'intro → on entre dans cette scène
- Datpaloof apparaît à un coin de la map
- Le joueur le déplace avec :
  - **PC** : flèches ↑↓←→ ou WASD
  - **Mobile** : tap sur la map pour s'y rendre (ou joystick virtuel — à voir)
- Le sprite change selon la direction du dernier mouvement (front/back/left/right)
- Quand Datpaloof s'approche du boss et appuie sur **Espace / Entrée** (ou tap sur le boss sur mobile), le combat démarre
- Tu peux aussi marquer un perimètre autour du boss qui déclenche un prompt "Engager le combat"

## 🔄 Quand c'est uploadé

Une fois les fichiers en place, le pipeline `scripts/process-sprites.py`
n'a PAS à être relancé (les sprites d'exploration ont déjà un fond
transparent normalement). Je code ensuite la scène Phaser
(`src/game/phaser/ExplorationScene.ts`) et la phase `'exploration'` dans
l'état du jeu.
