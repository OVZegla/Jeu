#!/usr/bin/env python3
"""Génère les assets dérivés de la refonte 2.5D à partir des assets existants.

1. Frames de marche de Datpaloof (4 directions x 4 frames) à partir des sprites
   statiques : les jambes (bande centrale basse du sprite) sont découpées en
   deux moitiés qui se soulèvent alternativement + léger bob du corps.
2. Sprites d'ennemis extraits de boss.png (les livres/documents flottants) :
   - grimoire.png  (livre relié, flammes violettes)  → « Grimoire éveillé »
   - decret.png    (arrêté volant)                   → « Décret errant »
3. Salles des Archives : crops de exploration/bureau/map.jpg, avec un léger
   grading par salle pour différencier les ambiances.

Usage : python3 scripts/gen-derived-assets.py
Sorties committées dans public/assets/ (voir docs/ASSETS.md).
"""
from PIL import Image, ImageEnhance
import os

ROOT = os.path.join(os.path.dirname(__file__), '..')
PUB = os.path.join(ROOT, 'public', 'assets')


# ---------------------------------------------------------------- walk frames
def alpha_bbox(img):
    return img.getbbox()


def gen_walk_frames(src_path, out_dir, prefix, side_view=False):
    """4 frames : 0 neutre, 1 jambe A levée, 2 neutre, 3 jambe B levée."""
    img = Image.open(src_path).convert('RGBA')
    bbox = alpha_bbox(img)
    x0, y0, x1, y1 = bbox
    h = y1 - y0
    w = x1 - x0

    # Région des jambes : bande basse (28% du perso), colonnes centrales
    # pour ne pas embarquer l'épée / accessoires qui dépassent sur les côtés.
    leg_top = y1 - int(h * 0.30)
    band_x0 = x0 + int(w * 0.22)
    band_x1 = x0 + int(w * 0.78)
    mid_x = (band_x0 + band_x1) // 2

    lift = max(2, h // 34)          # amplitude verticale du pas
    bob = max(1, h // 70)           # bob du corps
    shift = max(2, h // 45) if side_view else 0  # avance/recul (vue de profil)

    os.makedirs(out_dir, exist_ok=True)

    def make_frame(phase):
        """phase: 0 neutre, +1 jambe gauche levée, -1 jambe droite levée."""
        canvas = Image.new('RGBA', img.size, (0, 0, 0, 0))
        # jambes découpées en 2 moitiés
        legL = img.crop((band_x0, leg_top, mid_x, y1))
        legR = img.crop((mid_x, leg_top, band_x1, y1))
        dyL = -lift if phase > 0 else 0
        dyR = -lift if phase < 0 else 0
        dxL = shift if phase > 0 else (-shift // 2 if phase < 0 else 0)
        dxR = shift if phase < 0 else (-shift // 2 if phase > 0 else 0)
        canvas.alpha_composite(legL, (band_x0 + dxL, leg_top + dyL))
        canvas.alpha_composite(legR, (mid_x + dxR, leg_top + dyR))
        # reste du sprite (corps + accessoires + zones hors bande) par-dessus,
        # avec un léger bob quand une jambe est levée
        body = img.copy()
        # efface la bande jambes dans le corps pour ne pas la doubler
        empty = Image.new('RGBA', (band_x1 - band_x0, y1 - leg_top), (0, 0, 0, 0))
        body.paste(empty, (band_x0, leg_top))
        dy_body = -bob if phase != 0 else 0
        canvas.alpha_composite(body, (0, dy_body))
        return canvas

    frames = [make_frame(0), make_frame(1), make_frame(0), make_frame(-1)]
    for i, f in enumerate(frames):
        f.save(os.path.join(out_dir, f'{prefix}_{i}.png'))
    print(f'  {prefix}: 4 frames ({os.path.relpath(out_dir, ROOT)})')


def build_walks():
    print('== Frames de marche Datpaloof ==')
    src = os.path.join(PUB, 'exploration', 'datpaloof')
    out = os.path.join(src, 'walk')
    for d in ['front', 'back']:
        gen_walk_frames(os.path.join(src, f'{d}.png'), out, d, side_view=False)
    for d in ['left', 'right']:
        gen_walk_frames(os.path.join(src, f'{d}.png'), out, d, side_view=True)


# ------------------------------------------------------------- enemy sprites
def crop_trim(img, box, wipe=None):
    """Crop + trim alpha. wipe = liste de rects (en coords du crop) à effacer
    (morceaux du boss qui débordent dans la zone)."""
    c = img.crop(box)
    if wipe:
        for (wx0, wy0, wx1, wy1) in wipe:
            empty = Image.new('RGBA', (wx1 - wx0, wy1 - wy0), (0, 0, 0, 0))
            c.paste(empty, (wx0, wy0))
    b = c.getbbox()
    return c.crop(b) if b else c


def build_enemies():
    print('== Sprites ennemis extraits de boss.png ==')
    boss = Image.open(os.path.join(PUB, 'sprites', 'boss.png')).convert('RGBA')
    out_dir = os.path.join(PUB, 'sprites', 'enemies')
    os.makedirs(out_dir, exist_ok=True)
    # Livre "CODE GENERAL DES COLLECTIVITES TERRITORIALES" (haut-gauche)
    grim = crop_trim(boss, (0, 25, 135, 150), wipe=[(88, 88, 135, 125), (25, 98, 88, 125)])
    grim.save(os.path.join(out_dir, 'grimoire.png'))
    # Livre "BUDGET COMMUNAL" (bas-droite) → variante élite
    grim2 = crop_trim(boss, (285, 290, 372, 400), wipe=[(0, 0, 22, 110)])
    grim2.save(os.path.join(out_dir, 'grimoire2.png'))
    # Document "DELIBERATION" (gauche-milieu)
    doc = crop_trim(boss, (0, 195, 105, 300), wipe=[(78, 60, 105, 105)])
    doc.save(os.path.join(out_dir, 'decret.png'))
    # Document "ARRETE MUNICIPAL" (bas-gauche)
    doc2 = crop_trim(boss, (0, 300, 100, 430), wipe=[(62, 0, 100, 130)])
    doc2.save(os.path.join(out_dir, 'decret2.png'))
    for n in ['grimoire', 'grimoire2', 'decret', 'decret2']:
        p = os.path.join(out_dir, n + '.png')
        print(f'  {n}.png: {Image.open(p).size}')


# ------------------------------------------------------------- archive rooms
def grade(img, brightness=1.0, saturation=1.0, contrast=1.0):
    img = ImageEnhance.Brightness(img).enhance(brightness)
    img = ImageEnhance.Color(img).enhance(saturation)
    img = ImageEnhance.Contrast(img).enhance(contrast)
    return img


def build_rooms():
    print('== Salles des Archives (crops de bureau/map.jpg) ==')
    src = Image.open(os.path.join(PUB, 'exploration', 'bureau', 'map.jpg')).convert('RGB')
    out_dir = os.path.join(PUB, 'exploration', 'archives')
    os.makedirs(out_dir, exist_ok=True)
    rooms = {
        # nom: (box, grading) — la géométrie de chaque salle vient d'une
        # portion différente du hall pour rester 100% cohérent visuellement.
        'entree':    ((330, 380, 1270, 900), dict(brightness=0.92, saturation=0.95)),
        'ouest':     ((0, 40, 780, 640), dict(brightness=0.78, saturation=0.85, contrast=1.05)),
        'est':       ((820, 40, 1600, 640), dict(brightness=0.85, saturation=1.0)),
        'hall':      ((250, 130, 1350, 800), dict(brightness=1.0, saturation=1.05)),
        'boss':      ((420, 0, 1180, 460), dict(brightness=0.9, saturation=1.1, contrast=1.08)),
    }
    for name, (box, g) in rooms.items():
        img = grade(src.crop(box), **g)
        img.save(os.path.join(out_dir, f'{name}.jpg'), quality=88)
        print(f'  {name}.jpg: {img.size}')


if __name__ == '__main__':
    build_walks()
    build_enemies()
    build_rooms()
    print('OK.')
