# Musique — OST

Dépose ici tes pistes musicales en `.mp3` ou `.ogg`. Elles tournent en boucle
automatiquement. Tout fichier manquant est silencieusement ignoré.

## Fichiers attendus

| Nom            | Quand ça joue                                     |
|----------------|---------------------------------------------------|
| `battle.mp3`   | Thème principal — démarre au début du combat      |
| `enrage.mp3`   | Bascule vers ce thème quand le boss passe en phase enragée (optionnel) |
| `victory.mp3`  | (Réservé) Jingle de victoire                      |
| `defeat.mp3`   | (Réservé) Jingle de défaite                       |

## Conseils

- Format MP3 192 kbps recommandé (qualité/poids équilibré)
- Idéalement < 4 Mo par piste pour ne pas alourdir le chargement
- Pour que la boucle soit propre, exporte ton fichier avec un point de boucle
  sans coupure audible (Phaser fait un loop simple : la fin se reconnecte au début)

## Note légale

⚠️ Si tu utilises des musiques sous copyright, le repo étant public, tu
diffuses publiquement ces œuvres. Préfère des morceaux libres de droits :
- https://opengameart.org/art-search-advanced?keys=&field_art_type_tid%5B%5D=12
- https://incompetech.com/ (Kevin MacLeod, CC-BY)
- Tes propres compositions

## Démarrage de la musique

Les navigateurs bloquent l'autoplay sans interaction utilisateur. La musique
démarrera donc dès le premier clic dans le jeu (clic sur le bouton de
démarrage ou sur une compétence).
