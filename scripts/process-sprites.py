#!/usr/bin/env python3
"""
Traite les sprites uploadés :
- renomme depuis les UUID iPhone vers des noms exploitables
- retire le fond blanc par flood-fill depuis les bords (préserve le blanc interne)
- adoucit le bord alpha sur 1 pixel pour éviter l'aliasing dur
- redimensionne (sprites <= 512px, arène <= 1280px)
- sauve dans public/assets/sprites/*.png et public/assets/arena.png
"""

from PIL import Image
from collections import deque
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'public', 'assets')
DST_SPRITES = os.path.join(SRC, 'sprites')

MAPPING = {
    '2BE87E16-28E4-40C1-85D7-F92C39FDD9A7.png': ('baghaar', 'sprite'),
    '40632538-9D52-4019-BF00-94E745B443AC.png': ('zlatax', 'sprite'),
    'AED7107D-6507-4305-8C1F-DC8D0AB38048.png': ('boss', 'sprite'),
    'D2BBF220-95E1-4200-9536-E9F535CCDFDE.png': ('datpaloof', 'sprite'),
    'F476E36B-D862-4F6A-B7D4-91F74D2BA157.png': ('arena', 'arena'),
}

# Seuil "blanc" : un pixel est considéré comme du fond si chaque canal > THRESHOLD
THRESHOLD = 235
# Tolérance de différence entre les canaux (pour exclure les blancs teintés du sprite)
COLOR_TOLERANCE = 18


def is_bg(r, g, b):
    """Pixel considéré comme fond : très clair ET quasi-neutre (pas teinté)."""
    if r < THRESHOLD or g < THRESHOLD or b < THRESHOLD:
        return False
    mx = max(r, g, b)
    mn = min(r, g, b)
    return (mx - mn) <= COLOR_TOLERANCE


def remove_white_bg(img: Image.Image) -> Image.Image:
    """Flood-fill depuis les 4 bords ; pixels blancs connectés au bord → alpha 0."""
    img = img.convert('RGBA')
    w, h = img.size
    px = img.load()
    bg_mask = [[False] * w for _ in range(h)]

    queue = deque()
    # Seed avec tous les pixels-bord qui sont blancs
    for x in range(w):
        for y in (0, h - 1):
            r, g, b, _ = px[x, y]
            if is_bg(r, g, b) and not bg_mask[y][x]:
                bg_mask[y][x] = True
                queue.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            r, g, b, _ = px[x, y]
            if is_bg(r, g, b) and not bg_mask[y][x]:
                bg_mask[y][x] = True
                queue.append((x, y))

    # BFS 4-connexe
    while queue:
        x, y = queue.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not bg_mask[ny][nx]:
                r, g, b, _ = px[nx, ny]
                if is_bg(r, g, b):
                    bg_mask[ny][nx] = True
                    queue.append((nx, ny))

    # Applique alpha 0 sur les pixels de fond
    for y in range(h):
        for x in range(w):
            if bg_mask[y][x]:
                r, g, b, _ = px[x, y]
                px[x, y] = (r, g, b, 0)

    # Feather : adoucit le bord (pixel opaque adjacent à un pixel transparent → alpha 180)
    edges = []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] == 255:
                touches_alpha0 = False
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] == 0:
                        touches_alpha0 = True
                        break
                if touches_alpha0:
                    edges.append((x, y))
    for x, y in edges:
        r, g, b, _ = px[x, y]
        px[x, y] = (r, g, b, 220)

    return img


def fit_size(img: Image.Image, max_size: int) -> Image.Image:
    """Redimensionne en conservant le ratio, max_size pour le plus grand côté."""
    w, h = img.size
    if max(w, h) <= max_size:
        return img
    if w >= h:
        nw = max_size
        nh = round(h * max_size / w)
    else:
        nh = max_size
        nw = round(w * max_size / h)
    return img.resize((nw, nh), Image.LANCZOS)


def process(filename: str, target_name: str, kind: str):
    src_path = os.path.join(SRC, filename)
    if not os.path.exists(src_path):
        print(f'!! skip {filename} (not found)')
        return
    img = Image.open(src_path)
    print(f'[{target_name}] in: {img.size} mode={img.mode}')

    if kind == 'sprite':
        img = remove_white_bg(img)
        img = fit_size(img, 512)
        dst = os.path.join(DST_SPRITES, f'{target_name}.png')
    else:
        img = img.convert('RGB')
        img = fit_size(img, 1280)
        dst = os.path.join(SRC, f'{target_name}.png')

    img.save(dst, optimize=True)
    sz = os.path.getsize(dst)
    print(f'  → {dst} ({img.size}, {sz // 1024} KB)')


def main():
    os.makedirs(DST_SPRITES, exist_ok=True)
    for fn, (target, kind) in MAPPING.items():
        process(fn, target, kind)
    # Nettoie : supprime les UUIDs et le README.txt
    for fn in list(MAPPING.keys()) + ['README.txt']:
        p = os.path.join(SRC, fn)
        if os.path.exists(p):
            os.remove(p)
            print(f'  rm {fn}')


if __name__ == '__main__':
    sys.exit(main())
