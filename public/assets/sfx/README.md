# SFX — Effets sonores

Dépose ici tes fichiers `.mp3` (recommandé), `.ogg` ou `.wav`.
Le jeu les charge automatiquement. Tout fichier manquant est silencieusement
ignoré — pas besoin de tous les avoir.

## Fichiers attendus

| Nom            | Déclenché quand…                                  |
|----------------|---------------------------------------------------|
| `attack.mp3`   | Un personnage ou le boss attaque                  |
| `hit.mp3`      | Un coup touche sa cible                           |
| `crit.mp3`     | Coup critique (priorité sur `hit.mp3`)            |
| `heal.mp3`     | Soin appliqué                                     |
| `defend.mp3`   | Compétence défensive utilisée                     |
| `special.mp3`  | Compétence spéciale utilisée                      |
| `death.mp3`    | Un personnage ou le boss tombe à 0 PV             |
| `enrage.mp3`   | Le boss passe en phase enragée (sous 40% PV)      |
| `victory.mp3`  | Victoire                                          |
| `defeat.mp3`   | Défaite                                           |
| `menu_click.mp3` | (Réservé) Click dans le menu                    |

## Conseils

- Durée courte : 0.2 à 1.5 secondes max pour les SFX gameplay
- Volume normalisé (évite que `crit.mp3` soit 10x plus fort que `hit.mp3`)
- Format MP3 96–128 kbps suffit largement
- Tu peux trouver des SFX gratuits sur https://opengameart.org/ ou https://freesound.org/
