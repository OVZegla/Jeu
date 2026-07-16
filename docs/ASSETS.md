# Assets — sources, licences, dérivés

## Assets originaux du projet (100 % créés pour ce jeu)

| Chemin | Description |
|---|---|
| `public/assets/title.jpg` | écran titre |
| `public/assets/arena.jpg` | fond de combat (vue frontale des Archives) |
| `public/assets/sprites/*.png` | sprites combat : Datpaloof, Baghaar, Zlatax, boss |
| `public/assets/exploration/datpaloof/*.png` | sprites exploration 4 directions |
| `public/assets/exploration/bureau/map.jpg`, `boss.png` | map des Archives + boss |
| `public/assets/exploration/ramees/map.jpg` | cité de Ramees |
| `public/assets/exploration/lamber/*` | écrans + tilesets de la Forêt de Lamber |
| `public/assets/music/battle.mp3` | musique de combat |

Aucun asset externe sous licence n'est utilisé.

## Assets dérivés (générés par `scripts/gen-derived-assets.py`)

Tous dérivés des assets originaux ci-dessus — même licence, même style.

| Chemin | Source | Usage |
|---|---|---|
| `exploration/datpaloof/walk/{front,back,left,right}_{0..3}.png` | sprites directionnels | cycle de marche 4 frames (jambes alternées + bob) |
| `sprites/enemies/grimoire.png`, `grimoire2.png` | livres flottants de `sprites/boss.png` | ennemi « Grimoire éveillé » / élite « Budget dévorant » |
| `sprites/enemies/decret.png`, `decret2.png` | documents flottants de `sprites/boss.png` | ennemi « Décret errant » / « Arrêté vengeur » |
| `exploration/archives/{entree,ouest,est,hall,boss}.jpg` | crops gradés de `bureau/map.jpg` | les 5 salles de la zone Archives |

Régénération : `pip install pillow && python3 scripts/gen-derived-assets.py`.

## Assets manquants (solutions temporaires en place)

| Besoin | Solution temporaire | Asset idéal à produire |
|---|---|---|
| SFX (impact, crit, soin, menu, pas…) | synthèse WebAudio (`src/game/core/sfx.ts`) | fichiers .ogg dans `public/assets/sfx/` (les clés sont listées dans `sfx.ts`) |
| Musique d'exploration des Archives | silence + nappe discrète WebAudio | `public/assets/music/archives.mp3` |
| Musique du boss | réutilise `battle.mp3` | `public/assets/music/boss.mp3` |
| Sprites exploration Baghaar / Zlatax | non affichés hors combat (party « dans » Datpaloof, convention JRPG) | 4 directions chibi par héros |
| Frames d'attaque dédiées par personnage | animation procédurale (lunge, squash & stretch, flashes, VFX) sur les sprites combat | spritesheets d'attaque |
