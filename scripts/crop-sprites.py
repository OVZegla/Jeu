#!/usr/bin/env python3
"""Crop chaque sprite tight sur les pixels non transparents.
Sans ça, le sprite peut avoir du vide en bas → impression qu'il flotte
au-dessus de l'ombre.
"""
from PIL import Image
import os

SPRITES_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'public', 'assets', 'sprites',
)

for fn in sorted(os.listdir(SPRITES_DIR)):
    if not fn.endswith('.png'):
        continue
    p = os.path.join(SPRITES_DIR, fn)
    img = Image.open(p).convert('RGBA')
    bbox = img.getbbox()  # (l, t, r, b) du contenu non transparent
    if bbox is None:
        continue
    # Ajoute 1px de marge pour éviter de couper du contenu opaque limite
    l, t, r, b = bbox
    l = max(0, l - 1)
    t = max(0, t - 1)
    r = min(img.width, r + 1)
    b = min(img.height, b + 1)
    cropped = img.crop((l, t, r, b))
    cropped.save(p, optimize=True)
    print(f'{fn}: {img.size} → {cropped.size}')
